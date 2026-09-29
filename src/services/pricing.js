import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { ZONES, FREE_SHIP_IN, GST_RATE, COD_MAX, countryOf } from '../config/commerce.js';
import { bad } from '../middleware/util.js';

export function addWorkingDays(from, n) {
  const d = new Date(from); let added = 0;
  while (added < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) added++; }
  return d;
}

export async function findCoupon(code) {
  if (!code) return null;
  const c = await Coupon.findOne({ code: String(code).trim().toUpperCase(), active: true });
  if (!c) return null;
  if (c.expiresAt && c.expiresAt < new Date()) return null;
  if (c.usageLimit && c.used >= c.usageLimit) return null;
  return c;
}

/**
 * Server-side quote. items: [{slug, qty}]. Never trusts client prices.
 * Returns lines with live product data plus totals in INR.
 */
export async function quote({ items = [], country = 'IN', method = 'std', coupon } = {}) {
  const c = countryOf(country);
  if (!c) throw bad('We do not ship to that country yet.');
  if (!Array.isArray(items) || !items.length) throw bad('Your cart is empty.');
  if (items.length > 50) throw bad('Too many items in one order.');
  const slugs = items.map((i) => String(i.slug));
  const products = await Product.find({ slug: { $in: slugs }, active: true });
  const lines = [];
  const problems = [];
  for (const i of items) {
    const p = products.find((x) => x.slug === i.slug);
    const qty = Math.floor(Number(i.qty));
    if (!p) { problems.push({ slug: i.slug, error: 'No longer available' }); continue; }
    if (!(qty >= 1 && qty <= 20)) { problems.push({ slug: i.slug, error: 'Quantity must be 1 to 20' }); continue; }
    const available = p.leadDays > 0 ? Infinity : p.stock;
    if (qty > available) problems.push({ slug: p.slug, error: available ? `Only ${available} left` : 'Sold out', available });
    lines.push({ product: p._id, slug: p.slug, name: p.name, price: p.price, qty, leadDays: p.leadDays, lineTotal: p.price * qty });
  }
  const zone = ZONES[c.zone];
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const pieces = lines.reduce((s, l) => s + l.qty, 0);
  const exp = method === 'exp';
  let shipping;
  if (c.zone === 'IN') shipping = (subtotal >= FREE_SHIP_IN ? 0 : zone.base) + (exp ? zone.expressFee : 0);
  else { shipping = zone.base + zone.extra * Math.max(0, pieces - 1); if (exp) shipping = Math.round(shipping * 1.6); }

  let discount = 0; let couponInfo = null;
  if (coupon) {
    const cp = await findCoupon(coupon);
    if (!cp) couponInfo = { code: String(coupon).toUpperCase(), valid: false, message: 'That code is not valid or has expired.' };
    else if (subtotal < cp.min) couponInfo = { code: cp.code, valid: false, message: `Needs a subtotal of ₹${cp.min.toLocaleString('en-IN')}.` };
    else {
      discount = cp.type === 'pct' ? Math.round(subtotal * cp.value / 100) : Math.min(cp.value, subtotal);
      couponInfo = { code: cp.code, valid: true, label: cp.label };
    }
  }
  const goods = subtotal - discount;
  const gst = c.zone === 'IN' ? Math.round(goods - goods / (1 + GST_RATE)) : 0; // prices are GST-inclusive; export is zero-rated
  const total = goods + shipping;
  const lead = Math.max(2, ...lines.map((l) => l.leadDays || 0));
  const r = exp ? zone.expressDays : zone.days;
  return {
    country: c.code, zone: c.zone, currency: c.currency, method: exp ? 'exp' : 'std',
    lines, problems, subtotal, discount, shipping, gst, total, coupon: couponInfo,
    codAllowed: c.zone === 'IN' && total <= COD_MAX,
    eta: { from: addWorkingDays(new Date(), lead + r[0]), to: addWorkingDays(new Date(), lead + r[1]) },
    options: {
      std: shippingFor(c, zone, subtotal, pieces, false), exp: shippingFor(c, zone, subtotal, pieces, true)
    }
  };
}
function shippingFor(c, zone, subtotal, pieces, exp) {
  if (c.zone === 'IN') return (subtotal >= FREE_SHIP_IN ? 0 : zone.base) + (exp ? zone.expressFee : 0);
  const s = zone.base + zone.extra * Math.max(0, pieces - 1);
  return exp ? Math.round(s * 1.6) : s;
}
