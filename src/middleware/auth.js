import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import { HttpError } from './util.js';

export const COOKIE = 'kosha_session';
const cookieOpts = () => ({ httpOnly: true, sameSite: 'lax', secure: env.prod, maxAge: 1000 * 60 * 60 * 24 * 14, path: '/' });

export function setSession(res, user) {
  const token = jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, { expiresIn: '14d' });
  res.cookie(COOKIE, token, cookieOpts());
}
export const clearSession = (res) => res.clearCookie(COOKIE, { ...cookieOpts(), maxAge: undefined });

/** Loads req.user if a valid session cookie exists; never fails. */
export async function loadUser(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) return next();
  try {
    const { sub } = jwt.verify(token, env.jwtSecret);
    req.user = await User.findById(sub);
  } catch { /* expired or invalid: treat as guest */ }
  next();
}
export const requireUser = (req, _res, next) => (req.user ? next() : next(new HttpError(401, 'Please sign in.')));
export const requireAdmin = (req, _res, next) =>
  (req.user?.role === 'admin' ? next() : next(new HttpError(req.user ? 403 : 401, 'Admin access only.')));

/** CSRF defence for cookie auth: state-changing requests must carry a custom header (not settable cross-site without CORS). */
export function requireAjaxHeader(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.path === '/payments/webhook') return next();
  if (req.get('X-Requested-With') !== 'fetch') return next(new HttpError(403, 'Missing request header.'));
  next();
}
