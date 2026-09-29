import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/Store.jsx';
import { api } from '../lib/api.js';
import { useSeo } from '../lib/seo.js';
import { fdate } from '../lib/format.js';
import { PageHead } from '../components/Layout.jsx';
import { Field, useApiForm, FormMessage } from '../components/Form.jsx';
import { Loading } from '../components/States.jsx';

export function AuthForms({ next }) {
  const { setUser, toast } = useStore(); const nav = useNavigate();
  const done = (u) => { setUser(u); toast(`Signed in as ${u.name}`); if (next) nav(next); };
  const login = useApiForm(async (d) => { const r = await api('/auth/login', { method: 'POST', body: d }); done(r.user); });
  const signup = useApiForm(async (d) => {
    if (d.password.length < 8) { const e = new Error('Please check the highlighted fields.'); throw Object.assign(e, { details: { password: 'Use at least 8 characters.' } }); }
    const r = await api('/auth/register', { method: 'POST', body: d }); done(r.user);
  });
  return (
    <div className="wrap split" style={{ alignItems: 'start' }}>
      <form className="f" onSubmit={login.onSubmit} noValidate><h2 style={{ fontSize: '1.6rem' }}>Sign in</h2>
        <Field name="email" label="Email" type="email" autoComplete="email" errors={login.errors} /><Field name="password" label="Password" type="password" autoComplete="current-password" errors={login.errors} />
        <button className="btn" type="submit" disabled={login.busy}>{login.busy ? 'Signing in…' : 'Sign in'}</button><FormMessage message={login.message} /></form>
      <form className="f" onSubmit={signup.onSubmit} noValidate><h2 style={{ fontSize: '1.6rem' }}>Create an account</h2>
        <Field name="name" label="Full name" autoComplete="name" errors={signup.errors} /><Field name="email" label="Email" type="email" autoComplete="email" errors={signup.errors} />
        <Field name="password" label="Password (8 characters or more)" type="password" autoComplete="new-password" errors={signup.errors} />
        <button className="btn ghost" type="submit" disabled={signup.busy}>Create account</button><FormMessage message={signup.message} /></form>
    </div>
  );
}

export default function Account() {
  useSeo({ title: 'Account' });
  const { user, setUser, config, money, toast } = useStore();
  const [params] = useSearchParams();
  const [orders, setOrders] = useState(null);
  const [adding, setAdding] = useState(false);
  useEffect(() => { if (user) api('/me/orders').then(setOrders).catch(() => setOrders([])); }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps
  const addr = useApiForm(async (d, form) => { const r = await api('/me/addresses', { method: 'POST', body: d }); setUser(r.user); form.reset(); setAdding(false); toast('Address saved'); });
  if (user === undefined) return <Loading />;
  if (!user) return (<><PageHead title="Your account" lede="Sign in to see your orders and saved addresses, or create an account." crumbs={[['/', 'Home'], [null, 'Account']]} /><section style={{ paddingTop: 0 }}><AuthForms next={params.get('next') || null} /></section></>);
  const logout = async () => { await api('/auth/logout', { method: 'POST' }); setUser(null); toast('Signed out'); };
  const del = async (id) => { const r = await api('/me/addresses/' + id, { method: 'DELETE' }); setUser(r.user); };
  const cname = (c) => config?.countries.find((x) => x.code === c)?.name || c;
  return (<>
    <PageHead title={`Welcome, ${user.name.split(' ')[0]}`} crumbs={[['/', 'Home'], [null, 'Account']]} />
    <section style={{ paddingTop: 0 }}><div className="wrap split" style={{ alignItems: 'start' }}>
      <div><h2 style={{ fontSize: '1.6rem', marginBottom: 14 }}>Orders</h2>
        {!orders ? <Loading /> : orders.length ? orders.map((o) => <div key={o.number} className="line" style={{ gridTemplateColumns: '1fr auto' }}><div><strong>{o.number}</strong><div className="small muted">{fdate(o.createdAt)}, {o.status === 'cancelled' ? 'Cancelled' : o.stages[o.stage]}, {money(o.total, 'INR')}</div></div><Link className="link" to={`/track?number=${o.number}&email=${encodeURIComponent(o.email)}`}>Track</Link></div>) : <p className="muted">No orders yet. <Link className="link" to="/shop">Start shopping</Link></p>}
        {user.role === 'admin' && <p style={{ marginTop: 24 }}><Link className="btn ghost" to="/admin">Open the admin panel</Link></p>}</div>
      <div><h2 style={{ fontSize: '1.6rem', marginBottom: 14 }}>Saved addresses</h2>
        {user.addresses.length ? user.addresses.map((a) => <div key={a._id} className="line" style={{ gridTemplateColumns: '1fr auto' }}><div>{a.name}<div className="small muted">{a.line1}, {a.city} {a.zip}, {cname(a.country)}</div></div><button className="link small" onClick={() => del(a._id)}>Delete</button></div>) : <p className="muted">No saved addresses.</p>}
        {adding ? <form className="f" onSubmit={addr.onSubmit} noValidate style={{ marginTop: 20 }}>
          <Field name="country" label="Country" type="select" options={config?.countries.map((c) => [c.code, c.name]) || []} defaultValue="IN" errors={addr.errors} />
          <Field name="name" label="Full name" errors={addr.errors} defaultValue={user.name} /><Field name="line1" label="Address" errors={addr.errors} /><Field name="line2" label="Apartment, landmark" req={false} errors={addr.errors} />
          <div className="f2"><Field name="city" label="City" errors={addr.errors} /><Field name="state" label="State or region" errors={addr.errors} /></div>
          <div className="f2"><Field name="zip" label="PIN or postal code" errors={addr.errors} /><Field name="phone" label="Phone" type="tel" req={false} errors={addr.errors} /></div>
          <div className="row"><button className="btn" type="submit" disabled={addr.busy}>Save address</button><button type="button" className="link" onClick={() => setAdding(false)}>Cancel</button></div><FormMessage message={addr.message} /></form>
          : <button className="btn ghost" style={{ marginTop: 18 }} onClick={() => setAdding(true)}>Add an address</button>}
        <p style={{ marginTop: 28 }}><button className="link" onClick={logout}>Sign out</button></p></div>
    </div></section>
  </>);
}
