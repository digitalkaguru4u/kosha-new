import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { ah, check, HttpError } from '../middleware/util.js';
import { setSession, clearSession, requireUser } from '../middleware/auth.js';
import { publicOrder } from '../services/orders.js';
import { countryOf } from '../config/commerce.js';

const r = Router();
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Please wait 15 minutes and try again.' } });

r.post('/auth/register', authLimit, ah(async (req, res) => {
  const v = check(req.body, { name: 'req|max:80', email: 'req|email', password: 'req|max:200' });
  if (v.password.length < 8) throw new HttpError(400, 'Please check the highlighted fields.', { password: 'Use at least 8 characters.' });
  if (await User.exists({ email: v.email })) throw new HttpError(409, 'An account with this email exists. Sign in instead.');
  const user = await User.create({ name: v.name, email: v.email, passwordHash: await bcrypt.hash(v.password, 12) });
  setSession(res, user);
  res.status(201).json({ user });
}));

r.post('/auth/login', authLimit, ah(async (req, res) => {
  const v = check(req.body, { email: 'req|email', password: 'req' });
  const user = await User.findOne({ email: v.email });
  if (!user || !(await bcrypt.compare(v.password, user.passwordHash))) throw new HttpError(401, 'That email and password do not match.');
  setSession(res, user);
  res.json({ user });
}));

r.post('/auth/logout', (_req, res) => { clearSession(res); res.json({ ok: true }); });
r.get('/auth/me', (req, res) => res.json({ user: req.user || null }));

r.get('/me/orders', requireUser, ah(async (req, res) => {
  const orders = await Order.find({ $or: [{ user: req.user._id }, { email: req.user.email }], status: { $ne: 'awaiting_payment' } }).sort({ createdAt: -1 }).limit(50);
  res.json(orders.map(publicOrder));
}));

const ADDR = { name: 'req|max:100', line1: 'req|max:200', line2: 'max:200', city: 'req|max:80', state: 'req|max:80', zip: 'req|max:12', country: 'req|max:2', phone: 'phone' };
export function validateAddress(body) {
  const a = check(body, ADDR);
  if (!countryOf(a.country)) throw new HttpError(400, 'We do not ship to that country yet.', { country: 'Choose a country from the list.' });
  if (a.country === 'IN' && !/^[1-9]\d{5}$/.test(a.zip)) throw new HttpError(400, 'Please check the highlighted fields.', { zip: 'Indian PIN codes have 6 digits.' });
  return a;
}
r.post('/me/addresses', requireUser, ah(async (req, res) => {
  const a = validateAddress(req.body);
  if (req.user.addresses.length >= 10) throw new HttpError(400, 'You can save up to 10 addresses.');
  req.user.addresses.unshift(a);
  await req.user.save();
  res.status(201).json({ user: req.user });
}));
r.delete('/me/addresses/:id', requireUser, ah(async (req, res) => {
  req.user.addresses = req.user.addresses.filter((a) => String(a._id) !== req.params.id);
  await req.user.save();
  res.json({ user: req.user });
}));

export default r;
