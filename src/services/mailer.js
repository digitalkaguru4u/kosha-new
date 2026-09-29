import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transport = null;
if (env.smtp.host) {
  transport = nodemailer.createTransport({
    host: env.smtp.host, port: env.smtp.port, secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined
  });
}
export const mailLive = () => Boolean(transport);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const wrap = (title, body) => `<!doctype html><html><body style="margin:0;background:#EEE4DA;font-family:Helvetica,Arial,sans-serif;color:#2A1416">
<div style="max-width:560px;margin:0 auto;padding:32px 24px"><div style="font-family:Georgia,serif;font-size:26px;margin-bottom:24px">Kosha <span style="font-size:11px;letter-spacing:3px;color:#6E5553">ATELIER</span></div>
<div style="background:#F7F1EA;padding:28px;border:1px solid #DACBB9"><h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;margin:0 0 16px">${esc(title)}</h1>${body}</div>
<p style="font-size:12px;color:#6E5553;margin-top:20px">Kosha Atelier · ${esc(env.clientUrl)}</p></div></body></html>`;

/** Sends mail, or logs it when SMTP is not configured. Never throws into request handlers. */
export async function send({ to, subject, html, replyTo }) {
  if (!to) return { skipped: true };
  if (!transport) {
    console.log(`[mail:not-configured] to=${to} subject="${subject}"`);
    return { logged: true };
  }
  try { await transport.sendMail({ from: env.mailFrom, to, subject, html, replyTo }); return { sent: true }; }
  catch (e) { console.error('[mail] failed', e.message); return { error: e.message }; }
}

export function orderConfirmation(o) {
  const rows = o.items.map((i) => `<tr><td style="padding:6px 0">${esc(i.name)} × ${i.qty}</td><td style="text-align:right">${inr(i.price * i.qty)}</td></tr>`).join('');
  const pay = o.payment.method === 'cod' ? 'Please keep the amount ready at delivery.'
    : o.payment.method === 'transfer' ? 'We will email a proforma invoice with bank details. Your order ships once funds clear.' : 'Payment received.';
  return send({ to: o.email, subject: `Order ${o.number} confirmed`, html: wrap(`Thank you, ${o.address.name.split(' ')[0]}`, `
    <p>Your order <strong>${o.number}</strong> is confirmed. ${pay}</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse">${rows}
    <tr><td style="padding-top:10px">Shipping</td><td style="text-align:right;padding-top:10px">${o.shipping ? inr(o.shipping) : 'Free'}</td></tr>
    ${o.discount ? `<tr><td>Discount</td><td style="text-align:right">−${inr(o.discount)}</td></tr>` : ''}
    <tr><td style="padding-top:10px"><strong>Total</strong></td><td style="text-align:right;padding-top:10px"><strong>${inr(o.total)}</strong></td></tr></table>
    <p><a href="${env.clientUrl}/track?number=${o.number}&email=${encodeURIComponent(o.email)}" style="color:#4D0E13">Track your order</a></p>`) });
}

export function orderStatus(o, title, note) {
  return send({ to: o.email, subject: `Order ${o.number}: ${title}`, html: wrap(title, `
    <p>${esc(note || `Your order ${o.number} has an update.`)}</p>
    ${o.courier ? `<p>Courier: ${esc(o.courier)}${o.awb ? `, tracking number ${esc(o.awb)}` : ''}</p>` : ''}
    <p><a href="${env.clientUrl}/track?number=${o.number}&email=${encodeURIComponent(o.email)}" style="color:#4D0E13">See full tracking</a></p>`) });
}

export function adminNotice(subject, fields) {
  const rows = Object.entries(fields).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6E5553">${esc(k)}</td><td>${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</td></tr>`).join('');
  return send({ to: env.adminNotify, subject, html: wrap(subject, `<table style="font-size:14px">${rows}</table>`), replyTo: fields.Email });
}

export function welcome(email) {
  return send({ to: email, subject: 'Welcome to Kosha Atelier', html: wrap('Letters from the workshop', '<p>Thank you for subscribing. Use <strong>WELCOME10</strong> for 10% off your first order above ₹5,000.</p>') });
}
