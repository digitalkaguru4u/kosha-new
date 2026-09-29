import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Collection from '../models/Collection.js';
import Lead from '../models/Lead.js';
import Subscriber from '../models/Subscriber.js';
import Coupon from '../models/Coupon.js';
import { ah, HttpError, check } from '../middleware/util.js';
import { requireAdmin } from '../middleware/auth.js';
import { setStage, cancelOrder, confirmOrder } from '../services/orders.js';
import { UPLOAD_DIR } from '../config/paths.js';

const r = Router();
r.use('/admin', requireAdmin);

r.get('/admin/stats', ah(async (_req, res) => {
  const since = new Date(Date.now() - 30 * 864e5);
  const [active, toShip, revenueAgg, newLeads, lowStock, subs] = await Promise.all([
    Order.countDocuments({ status: 'active', createdAt: { $gte: since } }),
    Order.countDocuments({ status: 'active', stage: { $lt: 3 } }),
    Order.aggregate([{ $match: { status: 'active', createdAt: { $gte: since } } }, { $group: { _id: null, t: { $sum: '$total' } } }]),
    Lead.countDocuments({ status: 'new' }),
    Product.find({ active: true, leadDays: 0, stock: { $lte: 3 } }).select('slug name stock').limit(20),
    Subscriber.countDocuments()
  ]);
  const recent = await Order.find({ status: { $ne: 'awaiting_payment' } }).sort({ createdAt: -1 }).limit(8);
  res.json({ orders30: active, revenue30: revenueAgg[0]?.t || 0, toShip, newLeads, lowStock, subscribers: subs, recent });
}));

/* Orders */
r.get('/admin/orders', ah(async (req, res) => {
  const q = {};
  if (req.query.status === 'toship') { q.status = 'active'; q.stage = { $lt: 3 }; }
  else if (req.query.status === 'intransit') { q.status = 'active'; q.stage = { $gte: 3, $lt: 6 }; }
  else if (req.query.status === 'delivered') { q.status = 'active'; q.stage = 6; }
  else if (['active', 'cancelled', 'awaiting_payment'].includes(req.query.status)) q.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 60), 'i');
    q.$or = [{ number: rx }, { email: rx }, { 'address.name': rx }];
  }
  res.json(await Order.find(q).sort({ createdAt: -1 }).limit(200));
}));
r.get('/admin/orders/:number', ah(async (req, res) => {
  const o = await Order.findOne({ number: req.params.number });
  if (!o) throw new HttpError(404, 'Order not found.');
  res.json(o);
}));
r.post('/admin/orders/:number/stage', ah(async (req, res) => {
  const o = await Order.findOne({ number: req.params.number });
  if (!o) throw new HttpError(404, 'Order not found.');
  const b = req.body || {};
  res.json(await setStage(o, b.stage, { note: b.note?.slice(0, 300), location: b.location?.slice(0, 120), courier: b.courier?.slice(0, 80), awb: b.awb?.slice(0, 60), trackingUrl: b.trackingUrl?.slice(0, 300) }));
}));
r.post('/admin/orders/:number/transfer-received', ah(async (req, res) => {
  const o = await Order.findOne({ number: req.params.number });
  if (!o || o.payment.method !== 'transfer') throw new HttpError(404, 'Bank-transfer order not found.');
  o.payment.status = 'paid';
  o.history.push({ stage: o.stage, title: 'Payment received', note: 'Bank transfer cleared' });
  await o.save();
  res.json(o);
}));
r.post('/admin/orders/:number/cancel', ah(async (req, res) => {
  const o = await Order.findOne({ number: req.params.number });
  if (!o) throw new HttpError(404, 'Order not found.');
  res.json(await cancelOrder(o, (req.body?.reason || 'Cancelled by the studio').slice(0, 200)));
}));

/* Products */
const PRODUCT_FIELDS = ['slug', 'name', 'collectionSlug', 'price', 'stock', 'leadDays', 'tags', 'images', 'art', 'region', 'craft', 'material', 'dims', 'weight', 'finish', 'care', 'desc', 'craftText', 'moq', 'exportReady', 'active', 'sort'];
const pick = (b) => Object.fromEntries(PRODUCT_FIELDS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));
r.get('/admin/products', ah(async (_req, res) => res.json(await Product.find().sort({ collectionSlug: 1, sort: 1 }))));
r.get('/admin/products/:id', ah(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new HttpError(404, 'Product not found.');
  res.json(p);
}));
r.post('/admin/products', ah(async (req, res) => {
  const data = pick(req.body || {});
  if (!(await Collection.exists({ slug: data.collectionSlug }))) throw new HttpError(400, 'Choose a collection.', { collectionSlug: 'Choose a collection.' });
  res.status(201).json(await Product.create(data));
}));
r.put('/admin/products/:id', ah(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new HttpError(404, 'Product not found.');
  const data = pick(req.body || {});
  if (data.collectionSlug && !(await Collection.exists({ slug: data.collectionSlug }))) throw new HttpError(400, 'Choose a collection.', { collectionSlug: 'Choose a collection.' });
  Object.assign(p, data);
  res.json(await p.save());
}));
r.delete('/admin/products/:id', ah(async (req, res) => {
  // Soft delete keeps order history intact.
  const p = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!p) throw new HttpError(404, 'Product not found.');
  res.json(p);
}));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _f, cb) => { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); cb(null, UPLOAD_DIR); },
    filename: (_req, f, cb) => cb(null, crypto.randomBytes(12).toString('hex') + ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[f.mimetype]))
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, f, cb) => cb(['image/jpeg', 'image/png', 'image/webp'].includes(f.mimetype) ? null : new HttpError(400, 'Upload JPG, PNG or WebP images only.'), true)
});
r.post('/admin/uploads', upload.array('images', 6), ah(async (req, res) => {
  // Verify magic bytes so a renamed file cannot pose as an image.
  const ok = [];
  for (const f of req.files || []) {
    const b = fs.readFileSync(f.path).subarray(0, 12);
    const isImg = (b[0] === 0xff && b[1] === 0xd8) || b.subarray(0, 4).toString('hex') === '89504e47' || (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP');
    if (!isImg) { fs.unlinkSync(f.path); continue; }
    ok.push('/uploads/' + path.basename(f.path));
  }
  if (!ok.length) throw new HttpError(400, 'No valid images were uploaded.');
  res.status(201).json({ urls: ok });
}));

r.get('/admin/collections', ah(async (_req, res) => res.json(await Collection.find().sort({ sort: 1 }))));

/* Leads */
r.get('/admin/leads', ah(async (req, res) => {
  const q = {};
  if (req.query.kind) q.kind = req.query.kind;
  if (req.query.status) q.status = req.query.status;
  res.json(await Lead.find(q).sort({ createdAt: -1 }).limit(300));
}));
r.patch('/admin/leads/:id', ah(async (req, res) => {
  const { status } = check(req.body, { status: 'req' });
  if (!['new', 'contacted', 'quoted', 'won', 'closed'].includes(status)) throw new HttpError(400, 'Unknown status.');
  const l = await Lead.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!l) throw new HttpError(404, 'Enquiry not found.');
  res.json(l);
}));

/* Coupons */
r.get('/admin/coupons', ah(async (_req, res) => res.json(await Coupon.find().sort({ createdAt: -1 }))));
r.post('/admin/coupons', ah(async (req, res) => {
  const v = check(req.body, { code: 'req|max:30', type: 'req', value: 'req|num|min:0', min: 'num|min:0', label: 'max:120', usageLimit: 'num|min:0' });
  if (!['pct', 'flat'].includes(v.type)) throw new HttpError(400, 'Type must be percent or flat.');
  if (v.type === 'pct' && v.value > 90) throw new HttpError(400, 'Percentage discounts are capped at 90%.');
  res.status(201).json(await Coupon.create(v));
}));
r.patch('/admin/coupons/:id', ah(async (req, res) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, { active: Boolean(req.body?.active) }, { new: true });
  if (!c) throw new HttpError(404, 'Coupon not found.');
  res.json(c);
}));

/* Subscribers */
r.get('/admin/subscribers', ah(async (_req, res) => res.json(await Subscriber.find().sort({ createdAt: -1 }).limit(5000))));
r.get('/admin/subscribers.csv', ah(async (_req, res) => {
  const subs = await Subscriber.find().sort({ createdAt: -1 });
  res.type('text/csv').attachment('subscribers.csv').send('email,subscribed_at\n' + subs.map((s) => `${s.email},${s.createdAt.toISOString()}`).join('\n'));
}));

export default r;
export { confirmOrder };
