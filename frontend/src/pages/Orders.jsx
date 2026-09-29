import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store.jsx';
import { api } from '../lib/api.js';
import { useSeo } from '../lib/seo.js';
import { fdate, fdatetime } from '../lib/format.js';
import { PageHead } from '../components/Layout.jsx';
import { Field, useApiForm, FormMessage } from '../components/Form.jsx';
import { Loading, ErrorState } from '../components/States.jsx';

const PAY = { razorpay: 'Online payment', cod: 'Cash on delivery', transfer: 'Bank transfer' };

export function OrderConfirmation() {
  const { number } = useParams();
  const { money, config } = useStore();
  const [o, setO] = useState(null); const [err, setErr] = useState(null);
  const email = sessionStorage.getItem('order-email:' + number) || '';
  useSeo({ title: 'Order confirmed' });
  useEffect(() => { api(`/orders/${number}?email=${encodeURIComponent(email)}`).then((r) => setO(r.order)).catch(setErr); }, [number]); // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return <><PageHead title="Order not found" /><section style={{ paddingTop: 0 }}><div className="wrap"><p className="muted">Open the link in your confirmation email, or <Link className="link" to="/track">track your order</Link> with your order number and email.</p></div></section></>;
  if (!o) return <Loading />;
  const cur = o.displayCurrency || 'INR';
  const cname = config?.countries.find((c) => c.code === o.address.country)?.name || o.address.country;
  return (
    <section><div className="wrap" style={{ maxWidth: 820 }}><p className="muted">Order {o.number}</p><h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.6rem)' }}>Thank you, {o.address.name.split(' ')[0]}.</h1>
      <p className="lede" style={{ margin: '18px 0 28px' }}>Your order is confirmed{o.payment.method === 'transfer' ? '. We will email a proforma invoice with our bank details; your order ships once funds clear' : o.payment.method === 'cod' ? '. Please keep the amount ready at delivery' : ''}. A confirmation has been sent to {o.email}.</p>
      {o.payment.test && <div className="okmsg small" style={{ marginBottom: 28 }}>Test-mode order: no real payment was taken.</div>}
      <div className="card"><div className="kv"><div><span>Order number</span>{o.number}</div><div><span>Estimated delivery</span>{fdate(o.eta.from)} to {fdate(o.eta.to)}</div><div><span>Payment</span>{PAY[o.payment.method]}</div><div><span>Total</span>{money(o.total, 'INR')}</div></div>
        <hr className="rule" style={{ margin: '22px 0' }} />
        {o.items.map((i) => <div key={i.slug} className="tot"><span>{i.name} × {i.qty}</span><span>{money(i.price * i.qty, 'INR')}</span></div>)}
        {o.discount > 0 && <div className="tot"><span>Discount</span><span>−{money(o.discount, 'INR')}</span></div>}
        <div className="tot"><span>Shipping</span><span>{o.shipping ? money(o.shipping, 'INR') : 'Free'}</span></div>
        {cur !== 'INR' && <p className="small muted">About {money(o.total, cur)} at indicative rates.</p>}
        <p className="small muted" style={{ marginTop: 14 }}>Delivering to {o.address.name}, {o.address.line1}, {o.address.city} {o.address.zip}, {cname}</p></div>
      <div className="row" style={{ marginTop: 28 }}><Link className="btn" to={`/track?number=${o.number}&email=${encodeURIComponent(o.email)}`}>Track this order</Link><Link className="btn ghost" to="/shop">Continue shopping</Link></div>
    </div></section>
  );
}

export function Track() {
  useSeo({ title: 'Track your order', description: 'Track your Kosha Atelier order.' });
  const [params] = useSearchParams(); const nav = useNavigate();
  const { money, config } = useStore();
  const number = params.get('number') || ''; const email = params.get('email') || '';
  const [state, setState] = useState({ o: null, err: null, loading: false });
  const load = () => {
    if (!number) { setState({ o: null, err: null, loading: false }); return; }
    setState((s) => ({ ...s, loading: true }));
    api(`/track?number=${encodeURIComponent(number)}&email=${encodeURIComponent(email)}`).then((r) => setState({ o: r.order, err: null, loading: false })).catch((err) => setState({ o: null, err, loading: false }));
  };
  useEffect(load, [number, email]); // eslint-disable-line react-hooks/exhaustive-deps
  const f = useApiForm(async (d) => { nav(`/track?number=${encodeURIComponent(d.number.toUpperCase())}&email=${encodeURIComponent(d.email)}`); });
  const { o, err } = state;
  if (!o) return (<>
    <PageHead title="Track your order" lede="Enter your order number and the email you used at checkout." crumbs={[['/', 'Home'], [null, 'Track order']]} />
    <section style={{ paddingTop: 0 }}><div className="wrap">
      {err && <div className="errbox" style={{ maxWidth: 640, marginBottom: 22 }}>{err.message}</div>}
      {state.loading ? <Loading /> : <form className="f" style={{ maxWidth: 640 }} onSubmit={f.onSubmit} noValidate key={number + email}>
        <div className="f2"><Field name="number" label="Order number" placeholder="e.g. KA123456" defaultValue={number} errors={f.errors} /><Field name="email" label="Email used for the order" type="email" defaultValue={email} errors={f.errors} /></div>
        <div className="row"><button className="btn" type="submit">Track order</button></div></form>}
    </div></section></>);
  const s = o.stage; const cancelled = o.status === 'cancelled';
  const cname = config?.countries.find((c) => c.code === o.address.country)?.name || o.address.country;
  return (<>
    <PageHead title={`Order ${o.number}`} lede={cancelled ? 'This order was cancelled.' : s === 6 ? 'Your order has been delivered.' : `${o.stages[s]}. Estimated delivery ${fdate(o.eta.from)} to ${fdate(o.eta.to)}.`} crumbs={[['/', 'Home'], ['/track', 'Track order'], [null, o.number]]} />
    <section style={{ paddingTop: 0 }}><div className="wrap">
      <div className="card"><div className="kv"><div><span>Status</span>{cancelled ? 'Cancelled' : o.stages[s]}</div><div><span>Estimated delivery</span>{fdate(o.eta.from)} to {fdate(o.eta.to)}</div><div><span>Courier</span>{o.courier || 'Assigned at dispatch'}</div><div><span>Tracking number</span>{o.awb ? (o.trackingUrl && /^https?:\/\//.test(o.trackingUrl) ? <a className="link" href={o.trackingUrl} target="_blank" rel="noopener noreferrer">{o.awb}</a> : o.awb) : 'Assigned at dispatch'}</div></div>
        {!cancelled && <ol className="steps">{o.stages.map((n, i) => <li key={n} className={(i <= s ? 'done' : '') + (i === s ? ' now' : '')}>{n}</li>)}</ol>}</div>
      <div className="split" style={{ alignItems: 'start', marginTop: 40 }}>
        <div><h3 style={{ marginBottom: 20 }}>Shipment history</h3><div className="events">{o.history.map((e, i) => <div key={i}><b>{e.title}</b><span className="small muted">{fdatetime(e.at)}{e.location ? `, ${e.location}` : ''}</span>{e.note && <div className="small">{e.note}</div>}</div>)}</div></div>
        <div><h3 style={{ marginBottom: 14 }}>In this order</h3>{o.items.map((i) => <div key={i.slug} className="tot"><span>{i.name} × {i.qty}</span><span>{money(i.price * i.qty, 'INR')}</span></div>)}
          <p className="small muted" style={{ marginTop: 14 }}>Delivering to {o.address.name}, {o.address.city}, {cname}</p>
          <div className="row"><button className="btn ghost" onClick={load}>Refresh status</button><Link className="link" to={`/contact?order=${o.number}`}>Get help with this order</Link></div></div>
      </div></div></section>
  </>);
}
