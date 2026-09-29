import { useState } from 'react';
import { ApiError } from '../lib/api.js';

/** Labelled input that shows the server/client error for its name. */
export function Field({ name, label, type = 'text', req = true, errors = {}, options, value, defaultValue, onChange, ...rest }) {
  const err = errors[name];
  const common = { name, required: req, 'aria-invalid': err ? 'true' : undefined, className: 'in', ...(value !== undefined ? { value, onChange } : { defaultValue }), ...rest };
  let input;
  if (type === 'textarea') input = <textarea {...common} />;
  else if (type === 'select') input = <select {...common}>{options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option>; })}</select>;
  else input = <input type={type} {...common} />;
  return <label className="fl">{label}{req ? '' : ' (optional)'}{input}<span className="err">{err}</span></label>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Client-side check mirroring the API rules; the API validates again. */
export function validateForm(form) {
  const errors = {};
  for (const el of form.elements) {
    if (!el.name || el.closest('[hidden]')) continue;
    const v = el.type === 'checkbox' ? el.checked : String(el.value).trim();
    if (el.required && (el.type === 'checkbox' ? !v : !v)) errors[el.name] = el.type === 'checkbox' ? 'Please tick to continue.' : 'This field is required.';
    else if (el.type === 'email' && v && !EMAIL.test(v)) errors[el.name] = 'Enter a valid email address, like name@example.com.';
    else if (el.type === 'tel' && v && v.replace(/\D/g, '').length < 8) errors[el.name] = 'Enter a phone number with country code.';
  }
  return errors;
}

export function formData(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name || el.closest('[hidden]')) continue;
    if (el.type === 'checkbox') out[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
    else out[el.name] = el.value.trim();
  }
  return out;
}

/** Handles validate -> submit -> map API errors. */
export function useApiForm(submit) {
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null); // {ok, text}
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const errs = validateForm(form);
    setErrors(errs); setMessage(null);
    if (Object.keys(errs).length) { form.querySelector('[aria-invalid="true"], :invalid')?.focus(); return; }
    setBusy(true);
    try {
      const text = await submit(formData(form), form);
      if (text) setMessage({ ok: true, text });
    } catch (err) {
      if (err instanceof ApiError || err.details) { setErrors(err.details || {}); setMessage({ ok: false, text: err.message }); }
      else setMessage({ ok: false, text: 'Something went wrong. Please try again.' });
    } finally { setBusy(false); }
  };
  return { errors, message, busy, onSubmit, setMessage, setErrors };
}

export function FormMessage({ message }) {
  if (!message) return null;
  return <div className={message.ok ? 'okmsg' : 'errbox'} role="status">{message.text}</div>;
}
