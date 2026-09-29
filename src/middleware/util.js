export class HttpError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const bad = (msg, details) => new HttpError(400, msg, details);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Minimal validator: rules = { field: 'req|email|phone|max:120|num|min:1' } */
export function check(body, rules) {
  const errors = {};
  const out = {};
  for (const [field, spec] of Object.entries(rules)) {
    const parts = spec.split('|');
    let v = body?.[field];
    if (typeof v === 'string') v = v.trim();
    const required = parts.includes('req');
    if (v === undefined || v === null || v === '') {
      if (required) errors[field] = 'This field is required.';
      continue;
    }
    for (const p of parts) {
      const [name, arg] = p.split(':');
      if (name === 'email' && !EMAIL.test(String(v))) errors[field] = 'Enter a valid email address.';
      if (name === 'phone' && String(v).replace(/\D/g, '').length < 8) errors[field] = 'Enter a phone number with country code.';
      if (name === 'max' && String(v).length > Number(arg)) errors[field] = `Keep this under ${arg} characters.`;
      if (name === 'num') { v = Number(v); if (!Number.isFinite(v)) errors[field] = 'Enter a number.'; }
      if (name === 'min' && Number(v) < Number(arg)) errors[field] = `Must be at least ${arg}.`;
      if (name === 'bool') v = v === true || v === 'true' || v === 'on';
    }
    if (parts.includes('email')) v = String(v).toLowerCase();
    out[field] = v;
  }
  if (Object.keys(errors).length) throw bad('Please check the highlighted fields.', errors);
  return out;
}

export function errorHandler(err, req, res, _next) {
  if (err?.name === 'ValidationError') {
    const details = Object.fromEntries(Object.entries(err.errors).map(([k, e]) => [k, e.message]));
    return res.status(400).json({ error: 'Please check the highlighted fields.', details });
  }
  if (err?.name === 'MulterError') return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Images must be 5 MB or smaller.' : 'Upload failed: ' + err.message });
  if (err?.name === 'CastError') return res.status(404).json({ error: 'Not found.' });
  if (err?.code === 11000) return res.status(409).json({ error: 'That record already exists.' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large.' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message, details: err.details });
}
