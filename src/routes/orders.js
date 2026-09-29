import { Router } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import Order from '../models/Order.js';
import env, { paymentsLive } from '../config/env.js';
import { ah, check, HttpError } from '../middleware/util.js';
import { quote } from '../services/pricing.js';
import { newOrderNumber, reserveStock, confirmOrder, markPaymentFailed, publicOrder, releaseStock } from '../services/orders.js';
import { createRzpOrder, verifyCheckoutSignature, verifyWebhookSignature, refundPayment } from '../services/razorpay.js';
import { validateAddress } from './auth.js';

const r = Router();
const orderLimit = rateLimit({ windowMs: 10 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Please wait a few minutes.' } });

/** Finds an order the requester may see: owner, or matching email. */
async function findOwned(number, email, user) {
  const o = await Order.findOne({ number: String(number || '').trim().toUpperCase() });
  if (!o) return null;
  const okEmail = email && o.email === String(email).trim().toLowerCase();
  const okUser = user && (String(o.user) === String(user._id) || o.email === user.email || user.role === 'admin');
  return okEmail || okUser ? o : null;
}

r.post('/orders', orderLimit, ah(async (req, res) => {
  const b = req.body || {};
  const contact = check(b.contact || {}, { email: 'req|email', phone: 'req|phone' });
  let address;
  if (b.addressId && req.user) {
    const a = req.user.addresses.id(b.addressId);
    if (!a) throw new HttpError(400, 'That saved address was not found.');
    address = a.toObject(); delete address._id;
  } else address = validateAddress(b.address || {});
  const method = ['razorpay', 'cod', 'transfer'].includes(b.payment) ? b.payment : null;
  if (!method) throw new HttpError(400, 'Choose a payment method.');

  const q = await quote({ items: b.items, country: address.country, method: b.shippingMethod, coupon: b.coupon });
  if (q.problems.length) throw new HttpError(409, 'Some items in your cart changed. Please review your cart.', { problems: q.problems });
  if (b.coupon && !q.coupon?.valid) throw new HttpError(400, q.coupon?.message || 'That code is not valid.');
  if (method === 'cod' && !q.codAllowed) throw new HttpError(400, 'Cash on delivery is only available in India for orders up to ₹25,000.');
  if (method === 'transfer' && q.zone === 'IN' && q.total < 50000) throw new HttpError(400, 'Bank transfer is available for international orders and Indian orders above ₹50,000.');
  if (b.expectedTotal !== undefined && Number(b.expectedTotal) !== q.total) throw new HttpError(409, 'Prices or shipping changed. Please review the updated total.', { total: q.total });

  await reserveStock(q.lines);
  const order = new Order({
    number: await newOrderNumber(), user: req.user?._id, email: contact.email, phone: contact.phone,
    items: q.lines.map(({ product, slug, name, price, qty, leadDays }) => ({ product, slug, name, price, qty, leadDays })),
    address: { ...address, phone: address.phone || contact.phone }, zone: q.zone,
    displayCurrency: ['INR', 'USD', 'EUR', 'GBP', 'AED'].includes(b.currency) ? b.currency : 'INR',
    shippingMethod: q.method, subtotal: q.subtotal, discount: q.discount, shipping: q.shipping, gst: q.gst, total: q.total,
    coupon: q.coupon?.valid ? q.coupon.code : undefined,
    payment: { method, test: method === 'razorpay' && !paymentsLive() }, eta: q.eta
  });

  if (b.saveAddress && req.user && !b.addressId && req.user.addresses.length < 10) {
    req.user.addresses.unshift(address); await req.user.save();
  }

  try {
    if (method === 'razorpay') {
      if (paymentsLive()) {
        const rz = await createRzpOrder({ amountInr: q.total, receipt: order.number, notes: { order: order.number } });
        order.payment.razorpayOrderId = rz.id;
        await order.save();
        return res.status(201).json({
          order: publicOrder(order),
          razorpay: { key: env.rzp.keyId, orderId: rz.id, amount: rz.amount, currency: 'INR', name: 'Kosha Atelier', prefill: { name: address.name, email: contact.email, contact: contact.phone } }
        });
      }
      await order.save();
      return res.status(201).json({ order: publicOrder(order), testPayment: true });
    }
    await order.save();
    await confirmOrder(order, method === 'cod' ? 'cod' : 'awaiting_transfer');
    res.status(201).json({ order: publicOrder(order) });
  } catch (e) {
    await releaseStock(order).catch(() => {});
    throw e;
  }
}));

/** Razorpay Checkout success handler: verify signature, then confirm. */
r.post('/orders/:number/verify', ah(async (req, res) => {
  const o = await Order.findOne({ number: req.params.number });
  if (!o || !o.payment.razorpayOrderId) throw new HttpError(404, 'Order not found.');
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  if (orderId !== o.payment.razorpayOrderId || !verifyCheckoutSignature({ orderId, paymentId, signature })) {
    throw new HttpError(400, 'Payment could not be verified. If money left your account, contact us with your order number.');
  }
  o.payment.razorpayPaymentId = paymentId;
  await confirmOrder(o, 'paid');
  res.json({ order: publicOrder(o) });
}));

r.post('/orders/:number/payment-failed', ah(async (req, res) => {
  const o = await findOwned(req.params.number, req.body?.email, req.user);
  if (!o) throw new HttpError(404, 'Order not found.');
  await markPaymentFailed(o);
  res.json({ ok: true });
}));

/** Test-mode payment (only when Razorpay keys are not configured). */
r.post('/orders/:number/test-payment', ah(async (req, res) => {
  if (paymentsLive()) throw new HttpError(403, 'Test payments are disabled when live payments are configured.');
  const o = await findOwned(req.params.number, req.body?.email, req.user);
  if (!o || !o.payment.test) throw new HttpError(404, 'Order not found.');
  if (req.body?.success) { o.payment.razorpayPaymentId = 'test_' + Date.now(); await confirmOrder(o, 'paid'); }
  else await markPaymentFailed(o);
  res.json({ order: publicOrder(o) });
}));

/** Retry payment for an order whose payment failed (still within the window). */
r.post('/orders/:number/retry', ah(async (req, res) => {
  const o = await findOwned(req.params.number, req.body?.email, req.user);
  if (!o || o.status !== 'awaiting_payment') throw new HttpError(404, 'This order can no longer be paid. Please place it again.');
  o.payment.status = 'pending';
  if (paymentsLive()) {
    const rz = await createRzpOrder({ amountInr: o.total, receipt: o.number, notes: { order: o.number } });
    o.payment.razorpayOrderId = rz.id; await o.save();
    return res.json({ order: publicOrder(o), razorpay: { key: env.rzp.keyId, orderId: rz.id, amount: rz.amount, currency: 'INR', name: 'Kosha Atelier', prefill: { name: o.address.name, email: o.email, contact: o.phone } } });
  }
  await o.save();
  res.json({ order: publicOrder(o), testPayment: true });
}));

r.get('/orders/:number', ah(async (req, res) => {
  const o = await findOwned(req.params.number, req.query.email, req.user);
  if (!o) throw new HttpError(404, 'We could not find that order with this email.');
  res.json({ order: publicOrder(o) });
}));

r.get('/track', ah(async (req, res) => {
  const o = await findOwned(req.query.number, req.query.email, req.user);
  if (!o || o.status === 'awaiting_payment') throw new HttpError(404, 'We could not find that order with this email. Check the order number in your confirmation email.');
  res.json({ order: publicOrder(o) });
}));

export default r;

/** Webhook router: mounted before express.json so the raw body is available for the signature. */
export const webhook = Router();
webhook.post('/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }), ah(async (req, res) => {
  if (!verifyWebhookSignature(req.body, req.get('X-Razorpay-Signature'))) return res.status(400).json({ error: 'Invalid signature' });
  const evt = JSON.parse(req.body.toString('utf8'));
  const pay = evt?.payload?.payment?.entity;
  if (pay?.order_id) {
    const o = await Order.findOne({ 'payment.razorpayOrderId': pay.order_id });
    if (o) {
      if (evt.event === 'payment.captured' && o.status === 'awaiting_payment') { o.payment.razorpayPaymentId = pay.id; await confirmOrder(o, 'paid'); }
      else if (evt.event === 'payment.captured' && o.status === 'cancelled' && o.payment.status !== 'refunded') {
        // Paid after the payment window closed and stock was released: refund automatically.
        await refundPayment(pay.id).catch((e) => console.error('Late-payment refund failed', o.number, e.message));
        o.payment.razorpayPaymentId = pay.id; o.payment.status = 'refunded';
        o.history.push({ stage: o.stage, title: 'Refunded', note: 'Payment arrived after the order expired and was refunded' });
        await o.save();
      }
      if (evt.event === 'payment.failed') await markPaymentFailed(o);
    }
  }
  res.json({ ok: true });
}));
