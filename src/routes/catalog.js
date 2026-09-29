import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Product from '../models/Product.js';
import Collection from '../models/Collection.js';
import Lead from '../models/Lead.js';
import Subscriber from '../models/Subscriber.js';
import { ah, check, HttpError } from '../middleware/util.js';
import { quote } from '../services/pricing.js';
import { CURRENCIES, ZONES, COUNTRIES, GST_RATE, FREE_SHIP_IN, COD_MAX, STAGES } from '../config/commerce.js';
import { paymentsLive } from '../config/env.js';
import { mailLive, adminNotice, welcome } from '../services/mailer.js';
import crypto from 'node:crypto';

const r = Router();
const formLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many submissions. Please try again later.' } });

r.get('/config', (_req, res) => res.json({
  currencies: CURRENCIES, zones: ZONES, countries: COUNTRIES, gstRate: GST_RATE, freeShipIN: FREE_SHIP_IN, codMax: COD_MAX, stages: STAGES,
  paymentsLive: paymentsLive(), mailLive: mailLive()
}));

r.get('/collections', ah(async (_req, res) => {
  const cols = await Collection.find().sort({ sort: 1 }).lean();
  const counts = await Product.aggregate([{ $match: { active: true } }, { $group: { _id: '$collectionSlug', n: { $sum: 1 } } }]);
  res.json(cols.map((c) => ({ ...c, count: counts.find((x) => x._id === c.slug)?.n || 0 })));
}));

const SORTS = { feat: { sort: 1, createdAt: 1 }, new: { createdAt: -1 }, low: { price: 1 }, high: { price: -1 } };
r.get('/products', ah(async (req, res) => {
  const q = { active: true };
  const { collection, tag, q: term, stock, sort, limit } = req.query;
  if (collection) q.collectionSlug = { $in: String(collection).split(',') };
  if (tag) q.tags = { $in: String(tag).split(',') };
  if (req.query.min || req.query.max) {
    q.price = {};
    if (req.query.min) q.price.$gte = Number(req.query.min);
    if (req.query.max) q.price.$lt = Number(req.query.max);
  }
  if (stock === '1') { q.leadDays = 0; q.stock = { $gt: 0 }; }
  if (req.query.slugs) q.slug = { $in: String(req.query.slugs).split(',').slice(0, 50) };
  if (term) {
    const rx = new RegExp(String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 60), 'i');
    q.$or = [{ name: rx }, { region: rx }, { craft: rx }, { material: rx }];
  }
  let docs = await Product.find(q).sort(SORTS[sort] || SORTS.feat).limit(Math.min(Number(limit) || 100, 100));
  if (sort === 'new') docs = [...docs].sort((a, b) => b.tags.includes('new') - a.tags.includes('new'));
  res.json(docs);
}));

r.get('/products/:slug', ah(async (req, res) => {
  const p = await Product.findOne({ slug: req.params.slug, active: true });
  if (!p) throw new HttpError(404, 'Product not found.');
  const related = await Product.find({ active: true, slug: { $ne: p.slug }, $or: [{ collectionSlug: p.collectionSlug }, { tags: { $in: p.tags } }] }).limit(8);
  related.sort((a, b) => (b.collectionSlug === p.collectionSlug) - (a.collectionSlug === p.collectionSlug));
  res.json({ product: p, related: related.slice(0, 4) });
}));

r.post('/cart/quote', ah(async (req, res) => {
  res.json(await quote(req.body || {}));
}));

const LEAD_RULES = {
  b2b: { name: 'req|max:100', company: 'req|max:120', email: 'req|email', phone: 'req|phone', btype: 'max:60', country: 'req|max:2', need: 'max:40', qty: 'num|min:1', products: 'max:300', message: 'req|max:4000', consent: 'req|bool' },
  export: { name: 'req|max:100', company: 'req|max:120', email: 'req|email', phone: 'req|phone', country: 'req|max:2', incoterm: 'max:20', mode: 'max:30', value: 'num|min:0', message: 'req|max:4000', catalogue: 'bool', consent: 'req|bool' },
  contact: { name: 'req|max:100', email: 'req|email', topic: 'max:60', order: 'max:20', message: 'req|max:4000' }
};
r.post('/leads', formLimit, ah(async (req, res) => {
  const kind = req.body?.kind;
  if (!LEAD_RULES[kind]) throw new HttpError(400, 'Unknown enquiry type.');
  if (req.body.website) return res.status(201).json({ ref: 'EQ-000000' }); // honeypot
  const v = check(req.body, LEAD_RULES[kind]);
  if (v.consent === false) throw new HttpError(400, 'Please tick to agree to be contacted.', { consent: 'Please tick to continue.' });
  const { name, company, email, phone, country, message, consent, ...details } = v;
  const ref = 'EQ-' + crypto.randomInt(100000, 999999);
  const lead = await Lead.create({ ref, kind, name, company, email, phone, country, message, details });
  adminNotice(`New ${kind === 'b2b' ? 'B2B' : kind} enquiry ${ref}`, { Ref: ref, Name: name, Company: company, Email: email, Phone: phone, Country: country, ...details, Message: message });
  res.status(201).json({ ref: lead.ref });
}));

r.post('/newsletter', formLimit, ah(async (req, res) => {
  const { email } = check(req.body, { email: 'req|email' });
  const existing = await Subscriber.findOne({ email });
  if (!existing) { await Subscriber.create({ email }); welcome(email); }
  res.status(201).json({ ok: true, already: Boolean(existing) });
}));

export default r;
