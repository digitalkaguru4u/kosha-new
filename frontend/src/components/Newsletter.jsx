import { api } from '../lib/api.js';
import { useApiForm, FormMessage } from './Form.jsx';

export default function Newsletter() {
  const f = useApiForm(async (d, form) => {
    const r = await api('/newsletter', { method: 'POST', body: d });
    form.reset();
    return r.already ? 'You are already subscribed. Thank you.' : 'You are subscribed. Use WELCOME10 for 10% off your first order above ₹5,000.';
  });
  return (
    <section className="news"><div className="wrap"><h2>Letters from the workshop</h2>
      <p className="lede" style={{ margin: '14px auto 0' }}>New pieces, the artisans who make them, and early access to limited editions. Once a month.</p>
      <form onSubmit={f.onSubmit} noValidate><label className="sr" htmlFor="nl">Email address</label><input id="nl" name="email" type="email" required placeholder="Your email address" autoComplete="email" aria-invalid={f.errors.email ? 'true' : undefined} /><button type="submit" disabled={f.busy}>{f.busy ? 'Subscribing…' : 'Subscribe'}</button></form>
      <div style={{ maxWidth: 520, margin: '16px auto 0' }}>{f.errors.email && <p className="err">{f.errors.email}</p>}<FormMessage message={f.message} /></div>
    </div></section>
  );
}
