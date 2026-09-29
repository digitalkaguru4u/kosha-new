import crypto from 'node:crypto';
import env, { paymentsLive } from '../config/env.js';
import { HttpError } from '../middleware/util.js';

const API = process.env.RAZORPAY_API_BASE || 'https://api.razorpay.com/v1'; // override only for automated tests
const auth = () => 'Basic ' + Buffer.from(`${env.rzp.keyId}:${env.rzp.keySecret}`).toString('base64');

/** Creates a Razorpay order (amount in INR rupees). */
export async function createRzpOrder({ amountInr, receipt, notes }) {
  if (!paymentsLive()) throw new HttpError(503, 'Payments are not configured.');
  const r = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Math.round(amountInr * 100), currency: 'INR', receipt, notes })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error('Razorpay order error', data);
    throw new HttpError(502, 'The payment gateway did not respond. Please try again.');
  }
  return data;
}

export function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac('sha256', env.rzp.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature);
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!env.rzp.webhookSecret || !signature) return false;
  const expected = crypto.createHmac('sha256', env.rzp.webhookSecret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

export async function refundPayment(paymentId, amountInr) {
  if (!paymentsLive() || !paymentId) return null;
  const r = await fetch(`${API}/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(amountInr ? { amount: Math.round(amountInr * 100) } : {})
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { console.error('Razorpay refund error', data); throw new HttpError(502, 'Refund failed at the gateway.'); }
  return data;
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a)); const B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}
