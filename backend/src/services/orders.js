import crypto from 'node:crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { STAGES, PENDING_PAYMENT_MINUTES } from '../config/commerce.js';
import { HttpError } from '../middleware/util.js';
import * as mail from './mailer.js';
import { refundPayment } from './razorpay.js';

export async function newOrderNumber() {
  for (let i = 0; i < 8; i++) {
    const n = 'KA' + crypto.randomInt(100000, 999999);
    if (!(await Order.exists({ number: n }))) return n;
  }
  throw new Error('Could not allocate an order number');
}

/** Reserves stock atomically per line; rolls back on failure. Made-to-order lines are not stock-limited. */
export async function reserveStock(lines) {
  const done = [];
  for (const l of lines) {
    if (l.leadDays > 0) continue;
    const r = await Product.updateOne({ _id: l.product, stock: { $gte: l.qty } }, { $inc: { stock: -l.qty } });
    if (r.modifiedCount !== 1) {
      for (const d of done) await Product.updateOne({ _id: d.product }, { $inc: { stock: d.qty } });
      throw new HttpError(409, `Sorry, ${l.name} sold out while you were checking out. Please update your cart.`);
    }
    done.push(l);
  }
}

export async function releaseStock(order) {
  if (order.stockReleased) return;
  for (const l of order.items) {
    if (l.leadDays > 0) continue;
    await Product.updateOne({ _id: l.product }, { $inc: { stock: l.qty } });
  }
  order.stockReleased = true;
}

async function countCoupon(order) {
  if (!order.coupon || order.couponCounted) return;
  await Coupon.updateOne({ code: order.coupon }, { $inc: { used: 1 } });
  order.couponCounted = true;
}

/** Moves an order into the fulfilment pipeline (stage 0) and sends emails. Idempotent. */
export async function confirmOrder(order, paymentStatus) {
  if (order.status === 'active') return order;
  if (order.status === 'cancelled') throw new HttpError(409, 'This order was cancelled.');
  order.payment.status = paymentStatus;
  order.status = 'active';
  order.stage = 0;
  order.history.push({ stage: 0, title: STAGES[0], note: paymentStatus === 'paid' ? 'Payment received' : paymentStatus === 'cod' ? 'Cash on delivery order placed' : 'Awaiting bank transfer', location: 'Kosha studio' });
  await countCoupon(order);
  await order.save();
  mail.orderConfirmation(order);
  mail.adminNotice(`New order ${order.number}`, { Order: order.number, Email: order.email, Total: `₹${order.total}`, Payment: `${order.payment.method} (${order.payment.status})`, Country: order.address.country });
  return order;
}

export async function markPaymentFailed(order) {
  if (order.status !== 'awaiting_payment') return order;
  order.payment.status = 'failed';
  await order.save();
  return order;
}

export async function cancelOrder(order, reason = 'Cancelled') {
  if (order.status === 'cancelled') return order;
  if (order.stage >= 3) throw new HttpError(409, 'This order has already shipped and cannot be cancelled.');
  let refund = null;
  if (order.payment.method === 'razorpay' && order.payment.status === 'paid' && !order.payment.test) {
    refund = await refundPayment(order.payment.razorpayPaymentId, order.total);
    order.payment.status = 'refunded';
  } else if (order.payment.status === 'pending') order.payment.status = 'expired';
  await releaseStock(order);
  order.status = 'cancelled';
  order.history.push({ stage: order.stage, title: 'Cancelled', note: reason });
  await order.save();
  if (order.stage >= 0) mail.orderStatus(order, 'Order cancelled', `${reason}.${refund ? ' A full refund has been issued to your original payment method.' : ''}`);
  return order;
}

/** Admin: advance to a stage, recording each skipped stage so the timeline stays complete. */
export async function setStage(order, stage, { note, location, courier, awb, trackingUrl } = {}) {
  if (order.status !== 'active') throw new HttpError(409, 'Only confirmed orders can be updated.');
  stage = Number(stage);
  if (!(stage >= 0 && stage < STAGES.length)) throw new HttpError(400, 'Unknown stage.');
  if (courier !== undefined) order.courier = courier;
  if (awb !== undefined) order.awb = awb;
  if (trackingUrl !== undefined) order.trackingUrl = trackingUrl;
  if (stage >= 3 && !order.courier) throw new HttpError(400, 'Add the courier before marking the order as shipped.');
  if (stage > order.stage) {
    for (let s = order.stage + 1; s <= stage; s++) {
      order.history.push({ stage: s, title: STAGES[s], note: s === stage ? note : undefined, location: s === stage ? location : undefined });
    }
    order.stage = stage;
    if (stage === 6 && order.payment.method === 'cod') order.payment.status = 'paid';
  } else if (note || location) {
    order.history.push({ stage: order.stage, title: 'Update', note, location });
  }
  await order.save();
  mail.orderStatus(order, STAGES[order.stage], note);
  return order;
}

/** Cancels unpaid online orders after the payment window and returns their stock. */
export async function expireStalePayments() {
  const cutoff = new Date(Date.now() - PENDING_PAYMENT_MINUTES * 60 * 1000);
  const stale = await Order.find({ status: 'awaiting_payment', 'payment.method': 'razorpay', createdAt: { $lt: cutoff } }).limit(100);
  for (const o of stale) {
    await releaseStock(o);
    o.status = 'cancelled';
    o.payment.status = o.payment.status === 'failed' ? 'failed' : 'expired';
    o.history.push({ stage: -1, title: 'Cancelled', note: 'Payment not completed in time' });
    await o.save();
  }
  return stale.length;
}

/** Public view of an order: no internal ids. */
export function publicOrder(o) {
  return {
    number: o.number, email: o.email, createdAt: o.createdAt, status: o.status, stage: o.stage, stages: STAGES,
    items: o.items.map(({ slug, name, price, qty }) => ({ slug, name, price, qty })),
    address: { name: o.address.name, line1: o.address.line1, city: o.address.city, zip: o.address.zip, country: o.address.country },
    subtotal: o.subtotal, discount: o.discount, shipping: o.shipping, gst: o.gst, total: o.total, displayCurrency: o.displayCurrency,
    payment: { method: o.payment.method, status: o.payment.status, test: o.payment.test },
    courier: o.courier, awb: o.awb, trackingUrl: o.trackingUrl, eta: o.eta,
    history: [...o.history].reverse()
  };
}
