import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/Store.jsx';
import { api, assetUrl } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { useSeo } from '../lib/seo.js';
import { inr, fdate, fdatetime } from '../lib/format.js';
import { Field, useApiForm, FormMessage } from '../components/Form.jsx';
import { AuthForms } from '../pages/Account.jsx';
import { Loading, ErrorState } from '../components/States.jsx';
import Art from '../components/Art.jsx';

const STAGES = ['Order confirmed', 'Processing', 'Packed', 'Shipped', 'In transit', 'Out for delivery', 'Delivered'];
const PAY_LABEL = { pending: 'Awaiting payment', paid: 'Paid', failed: 'Payment failed', expired: 'Expired', cod: 'Cash on delivery', awaiting_transfer: 'Awaiting transfer', refunded: 'Refunded' };
const statusText = (o) => (o.status === 'cancelled' ? 'Cancelled' : o.status === 'awaiting_payment' ? 'Awaiting payment' : STAGES[o.stage]);

export default function Admin() {
  useSeo({ title: 'Admin' });
  const { user } = useStore();
  if (user === undefined) return <Loading />;
  if (user?.role !== 'admin') return (
    <section><div className="wrap"><h1 style={{ fontSize: '2.4rem', marginBottom: 12 }}>Studio admin</h1>
      <p className="muted" style={{ marginBottom: 28 }}>{user ? 'This account does not have admin access. Sign in with the admin account.' : 'Sign in with the admin account created by the seed script.'}</p></div>
      {!user && <AuthForms />}</section>
  );
  return (
    <div className="wrap admin">
      <nav className="anav" aria-label="Admin">
        <NavLink to="/admin" end>Dashboard</NavLink><NavLink to="/admin/orders">Orders</NavLink><NavLink to="/admin/products">Products</NavLink>
        <NavLink to="/admin/enquiries">Enquiries</NavLink><NavLink to="/admin/coupons">Coupons</NavLink><NavLink to="/admin/subscribers">Subscribers</NavLink>
        <Link to="/">View store</Link>
      </nav>
      <div className="amain">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:number" element={<OrderDetail />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductEdit />} />
          <Route path="enquiries" element={<Leads />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="subscribers" element={<Subscribers />} />
        </Routes>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data, error, reload } = useApi('/admin/stats');
  const { config } = useStore();
  if (error) return <ErrorState error={error} retry={reload} />;
  if (!data) return <Loading />;
  return (<>
    <h1 className="ah">Dashboard</h1>
    {config && (!config.paymentsLive || !config.mailLive) && <div className="errbox small" style={{ marginBottom: 20 }}>
      {!config.paymentsLive && <div>Payments are in test mode: add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env.</div>}
      {!config.mailLive && <div>Emails are only logged to the server console: add SMTP settings to backend/.env.</div>}</div>}
    <div className="stats">
      <Link to="/admin/orders?status=toship"><b>{data.toShip}</b><span>Orders to ship</span></Link>
      <div><b>{data.orders30}</b><span>Orders, last 30 days</span></div>
      <div><b>{inr(data.revenue30)}</b><span>Revenue, last 30 days</span></div>
      <Link to="/admin/enquiries?status=new"><b>{data.newLeads}</b><span>New enquiries</span></Link>
      <Link to="/admin/subscribers"><b>{data.subscribers}</b><span>Subscribers</span></Link>
    </div>
    <div className="split" style={{ alignItems: 'start', marginTop: 36 }}>
      <div><h2 className="ah2">Recent orders</h2><OrderTable orders={data.recent} /></div>
      <div><h2 className="ah2">Low stock</h2>{data.lowStock.length ? <table className="tbl"><tbody>{data.lowStock.map((p) => <tr key={p._id}><td><Link className="link" to={`/admin/products/${p._id}`}>{p.name}</Link></td><td>{p.stock} left</td></tr>)}</tbody></table> : <p className="muted">All ready-to-ship pieces have more than 3 in stock.</p>}</div>
    </div>
  </>);
}

function OrderTable({ orders }) {
  if (!orders.length) return <p className="muted">No orders.</p>;
  return <div className="tscroll"><table className="tbl"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>
    {orders.map((o) => <tr key={o.number}><td><Link className="link" to={`/admin/orders/${o.number}`}>{o.number}</Link></td><td>{fdate(o.createdAt)}</td><td>{o.address?.name}<div className="small muted">{o.address?.country}</div></td><td>{inr(o.total)}</td><td>{PAY_LABEL[o.payment.status]}{o.payment.test ? ' (test)' : ''}</td><td>{statusText(o)}</td></tr>)}
  </tbody></table></div>;
}

function Orders() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || ''; const q = params.get('q') || '';
  const { data, error, reload } = useApi(`/admin/orders?status=${status}&q=${encodeURIComponent(q)}`);
  return (<>
    <h1 className="ah">Orders</h1>
    <div className="row" style={{ marginBottom: 20 }}>
      <select className="in" style={{ maxWidth: 220 }} value={status} onChange={(e) => setParams({ status: e.target.value, q })}>
        {[['', 'All orders'], ['toship', 'To ship'], ['intransit', 'In transit'], ['delivered', 'Delivered'], ['awaiting_payment', 'Awaiting payment'], ['cancelled', 'Cancelled']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      <form onSubmit={(e) => { e.preventDefault(); setParams({ status, q: new FormData(e.currentTarget).get('q') }); }} className="row"><input className="in" name="q" defaultValue={q} placeholder="Order number, email or name" style={{ maxWidth: 280 }} /><button className="btn ghost">Search</button></form>
    </div>
    {error ? <ErrorState error={error} retry={reload} /> : !data ? <Loading /> : <OrderTable orders={data} />}
  </>);
}

function OrderDetail() {
  const { number } = useParams();
  const { data: o, error, reload } = useApi('/admin/orders/' + number);
  const { toast } = useStore();
  const [stage, setStage] = useState('');
  useEffect(() => { if (o) setStage(String(Math.min(6, o.stage + 1))); }, [o?.stage]); // eslint-disable-line react-hooks/exhaustive-deps
  const upd = useApiForm(async (d) => { await api(`/admin/orders/${number}/stage`, { method: 'POST', body: d }); toast('Order updated and customer emailed'); reload(); });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const act = async (path, body, msg) => { setBusy(true); setErr(''); try { await api(`/admin/orders/${number}/${path}`, { method: 'POST', body }); toast(msg); reload(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  if (error) return <ErrorState error={error} retry={reload} />;
  if (!o) return <Loading />;
  const a = o.address;
  return (<>
    <p className="small"><Link className="link" to="/admin/orders">All orders</Link></p>
    <h1 className="ah">Order {o.number}</h1>
    <div className="kv card" style={{ marginBottom: 28 }}><div><span>Status</span>{statusText(o)}</div><div><span>Payment</span>{o.payment.method} · {PAY_LABEL[o.payment.status]}{o.payment.test ? ' (test)' : ''}</div><div><span>Total</span>{inr(o.total)}</div><div><span>Placed</span>{fdatetime(o.createdAt)}</div>{o.courier && <div><span>Courier</span>{o.courier}{o.awb ? ` · ${o.awb}` : ''}</div>}</div>
    <div className="split" style={{ alignItems: 'start' }}>
      <div>
        <h2 className="ah2">Items</h2>{o.items.map((i) => <div key={i.slug} className="tot"><span>{i.name} × {i.qty}{i.leadDays ? ' (made to order)' : ''}</span><span>{inr(i.price * i.qty)}</span></div>)}
        <div className="tot"><span>Shipping ({o.shippingMethod === 'exp' ? 'express' : 'standard'})</span><span>{inr(o.shipping)}</span></div>
        {o.discount > 0 && <div className="tot"><span>Discount {o.coupon}</span><span>−{inr(o.discount)}</span></div>}
        {o.gst > 0 && <div className="tot small muted"><span>Includes GST</span><span>{inr(o.gst)}</span></div>}
        <div className="tot big"><span>Total</span><span>{inr(o.total)}</span></div>
        <h2 className="ah2" style={{ marginTop: 28 }}>Ship to</h2>
        <p>{a.name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} {a.zip}<br />{a.country}<br />{a.phone || o.phone}<br /><a className="link" href={`mailto:${o.email}`}>{o.email}</a></p>
        <h2 className="ah2" style={{ marginTop: 28 }}>History</h2><div className="events">{[...o.history].reverse().map((e, i) => <div key={i}><b>{e.title}</b><span className="small muted">{fdatetime(e.at)}{e.location ? `, ${e.location}` : ''}</span>{e.note && <div className="small">{e.note}</div>}</div>)}</div>
      </div>
      <div>
        {o.status === 'active' && <>
          <h2 className="ah2">Update fulfilment</h2>
          <form className="f card" onSubmit={upd.onSubmit} noValidate>
            <Field name="stage" label="Move to stage" type="select" options={STAGES.map((s, i) => [String(i), s])} value={stage} onChange={(e) => setStage(e.target.value)} errors={upd.errors} />
            <div className="f2"><Field name="courier" label="Courier" req={Number(stage) >= 3 && !o.courier} defaultValue={o.courier || ''} placeholder="e.g. Blue Dart, DHL Express" errors={upd.errors} /><Field name="awb" label="Tracking number (AWB)" req={false} defaultValue={o.awb || ''} errors={upd.errors} /></div>
            <Field name="trackingUrl" label="Courier tracking link" req={false} type="url" defaultValue={o.trackingUrl || ''} placeholder="https://" errors={upd.errors} />
            <div className="f2"><Field name="location" label="Location" req={false} placeholder="e.g. Jaipur hub" errors={upd.errors} /><Field name="note" label="Note to customer" req={false} errors={upd.errors} /></div>
            <button className="btn" type="submit" disabled={upd.busy}>{upd.busy ? 'Saving…' : 'Save and email customer'}</button><FormMessage message={upd.message} />
          </form>
          {o.payment.method === 'transfer' && o.payment.status !== 'paid' && <button className="btn ghost block" style={{ marginTop: 16 }} disabled={busy} onClick={() => act('transfer-received', {}, 'Payment recorded')}>Mark bank transfer received</button>}
        </>}
        {o.status !== 'cancelled' && o.stage < 3 && <div style={{ marginTop: 20 }}><button className="link" disabled={busy} onClick={() => { const reason = window.prompt('Reason for cancelling (sent to the customer):', 'Cancelled at your request'); if (reason !== null) act('cancel', { reason }, o.payment.status === 'paid' && !o.payment.test ? 'Cancelled and refunded' : 'Order cancelled'); }}>Cancel this order{o.payment.status === 'paid' && !o.payment.test ? ' and refund' : ''}</button></div>}
        {err && <div className="errbox" style={{ marginTop: 14 }}>{err}</div>}
      </div>
    </div>
  </>);
}

function Products() {
  const { data, error, reload } = useApi('/admin/products');
  if (error) return <ErrorState error={error} retry={reload} />;
  if (!data) return <Loading />;
  return (<>
    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}><h1 className="ah" style={{ margin: 0 }}>Products</h1><Link className="btn" to="/admin/products/new">Add product</Link></div>
    <div className="tscroll"><table className="tbl"><thead><tr><th></th><th>Name</th><th>Collection</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead><tbody>
      {data.map((p) => <tr key={p._id}><td style={{ width: 56 }}><div className="frame" style={{ width: 44 }}><Art product={p} decorative /></div></td><td><Link className="link" to={`/admin/products/${p._id}`}>{p.name}</Link><div className="small muted">{p.slug}</div></td><td>{p.collectionSlug}</td><td>{inr(p.price)}</td><td>{p.leadDays ? `Made to order (${p.leadDays} days)` : p.stock}</td><td>{p.active ? 'Live' : 'Hidden'}</td></tr>)}
    </tbody></table></div>
  </>);
}

const SHAPES = ['vaseTall', 'vaseBlue', 'kalash', 'urli', 'bowlDeep', 'lamp', 'lantern', 'pillars', 'platter', 'tray', 'box', 'throw', 'quilt', 'cushion', 'horse', 'rider'];
const MATS = ['brass', 'bronze', 'bidri', 'marble', 'soap', 'sheesham', 'walnut', 'copper', 'terra', 'blackclay', 'bluepot', 'pashmina', 'ajrakh', 'kantha'];

function ProductEdit() {
  const { id } = useParams(); const isNew = id === 'new'; const nav = useNavigate(); const { toast } = useStore();
  const { data: p, error } = useApi(isNew ? null : '/admin/products/' + id);
  const { data: cols } = useApi('/admin/collections');
  const [images, setImages] = useState([]); const [upErr, setUpErr] = useState(''); const [uploading, setUploading] = useState(false);
  useEffect(() => { if (p) setImages(p.images || []); }, [p?._id]); // eslint-disable-line react-hooks/exhaustive-deps
  const f = useApiForm(async (d) => {
    const body = {
      slug: d.slug.toLowerCase(), name: d.name, collectionSlug: d.collectionSlug, price: Number(d.price), stock: Number(d.stock || 0), leadDays: Number(d.leadDays || 0),
      tags: ['new', 'best', 'heirloom'].filter((t) => d['tag_' + t]), images, region: d.region, craft: d.craft, material: d.material, dims: d.dims,
      weight: d.weight ? Number(d.weight) : undefined, finish: d.finish, care: d.care, desc: d.desc, craftText: d.craftText, moq: Number(d.moq || 10),
      exportReady: d.exportReady, active: d.active, art: { mat: d.art_mat, shape: d.art_shape, pat: p?.art?.pat || '', bg: p?.art?.bg || '#DDD5C6' }
    };
    const r = isNew ? await api('/admin/products', { method: 'POST', body }) : await api('/admin/products/' + id, { method: 'PUT', body });
    toast('Product saved');
    if (isNew) nav('/admin/products/' + r._id);
    return 'Saved.';
  });
  const upload = async (e) => {
    const files = [...e.target.files]; if (!files.length) return;
    const fd = new FormData(); files.forEach((x) => fd.append('images', x));
    setUploading(true); setUpErr('');
    try { const r = await api('/admin/uploads', { method: 'POST', form: fd }); setImages((im) => [...im, ...r.urls].slice(0, 8)); }
    catch (err) { setUpErr(err.message); } finally { setUploading(false); e.target.value = ''; }
  };
  if (error) return <ErrorState error={error} />;
  if ((!isNew && !p) || !cols) return <Loading />;
  const v = p || { active: true, exportReady: true, tags: [], moq: 10, stock: 0, leadDays: 0, art: {} };
  return (<>
    <p className="small"><Link className="link" to="/admin/products">All products</Link></p>
    <h1 className="ah">{isNew ? 'Add product' : v.name}</h1>
    <form className="f" onSubmit={f.onSubmit} noValidate style={{ maxWidth: 860 }}>
      <div className="f2"><Field name="name" label="Name" defaultValue={v.name} errors={f.errors} /><Field name="slug" label="URL slug (a-z, 0-9, hyphens)" defaultValue={v.slug} pattern="[a-z0-9-]+" errors={f.errors} /></div>
      <div className="f2"><Field name="collectionSlug" label="Collection" type="select" options={[['', 'Choose…'], ...cols.map((c) => [c.slug, c.name])]} defaultValue={v.collectionSlug || ''} errors={f.errors} /><Field name="price" label="Price (₹, GST inclusive)" type="number" min="0" defaultValue={v.price} errors={f.errors} /></div>
      <div className="f2"><Field name="stock" label="Stock (ready to ship)" type="number" min="0" req={false} defaultValue={v.stock} errors={f.errors} /><Field name="leadDays" label="Made-to-order lead time (days, 0 = ready stock)" type="number" min="0" req={false} defaultValue={v.leadDays} errors={f.errors} /></div>
      <div className="row">{['new', 'best', 'heirloom'].map((t) => <label key={t} className="check"><input type="checkbox" name={'tag_' + t} defaultChecked={v.tags.includes(t)} /> {t === 'best' ? 'Best seller' : t === 'new' ? 'New arrival' : 'Heirloom Edit'}</label>)}
        <label className="check"><input type="checkbox" name="exportReady" defaultChecked={v.exportReady} /> Export-ready</label><label className="check"><input type="checkbox" name="active" defaultChecked={v.active} /> Live on site</label></div>
      <fieldset className="card" style={{ border: '1px solid var(--line)' }}><h3 style={{ marginBottom: 10 }}>Photos</h3>
        <p className="small muted">JPG, PNG or WebP up to 5 MB. The first photo is the main image. Without photos, the placeholder artwork below is used.</p>
        <div className="row" style={{ margin: '12px 0' }}>{images.map((u, i) => <div key={u} style={{ width: 96 }}><div className="frame"><img className="art" src={assetUrl(u)} alt="" style={{ objectFit: 'cover', width: '100%', height: '100%' }} /></div>
          <div className="row small" style={{ gap: 8, marginTop: 4 }}>{i > 0 && <button type="button" className="link" onClick={() => setImages((im) => [im[i], ...im.filter((_, j) => j !== i)])}>Main</button>}<button type="button" className="link" onClick={() => setImages((im) => im.filter((_, j) => j !== i))}>Remove</button></div></div>)}</div>
        <label className="btn ghost" style={{ cursor: 'pointer' }}>{uploading ? 'Uploading…' : 'Upload photos'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={upload} /></label>{upErr && <div className="err">{upErr}</div>}
        <div className="f2" style={{ marginTop: 16 }}><Field name="art_mat" label="Placeholder art material" type="select" options={MATS} defaultValue={v.art?.mat || 'marble'} req={false} /><Field name="art_shape" label="Placeholder art shape" type="select" options={SHAPES} defaultValue={v.art?.shape || 'bowlDeep'} req={false} /></div>
      </fieldset>
      <div className="f2"><Field name="region" label="Region" defaultValue={v.region} errors={f.errors} /><Field name="craft" label="Craft" defaultValue={v.craft} errors={f.errors} /></div>
      <div className="f2"><Field name="material" label="Material" defaultValue={v.material} errors={f.errors} /><Field name="dims" label="Dimensions" defaultValue={v.dims} errors={f.errors} /></div>
      <div className="f2"><Field name="weight" label="Weight (kg)" type="number" step="0.01" min="0" req={false} defaultValue={v.weight} errors={f.errors} /><Field name="moq" label="Trade minimum order (units)" type="number" min="1" req={false} defaultValue={v.moq} errors={f.errors} /></div>
      <Field name="finish" label="Finish" req={false} defaultValue={v.finish} errors={f.errors} />
      <Field name="desc" label="Short description" type="textarea" defaultValue={v.desc} errors={f.errors} />
      <Field name="craftText" label="The craft (story)" type="textarea" req={false} defaultValue={v.craftText} errors={f.errors} />
      <Field name="care" label="Care" type="textarea" req={false} defaultValue={v.care} errors={f.errors} />
      <div className="row"><button className="btn" type="submit" disabled={f.busy}>{f.busy ? 'Saving…' : 'Save product'}</button>{!isNew && <Link className="link" to={`/product/${v.slug}`}>View on site</Link>}</div><FormMessage message={f.message} />
    </form>
  </>);
}

function Leads() {
  const [params, setParams] = useSearchParams();
  const kind = params.get('kind') || ''; const status = params.get('status') || '';
  const { data, error, reload } = useApi(`/admin/leads?kind=${kind}&status=${status}`);
  const [open, setOpen] = useState(null);
  const setStatus = async (id, s) => { await api('/admin/leads/' + id, { method: 'PATCH', body: { status: s } }); reload(); };
  return (<>
    <h1 className="ah">Enquiries</h1>
    <div className="row" style={{ marginBottom: 20 }}>
      <select className="in" style={{ maxWidth: 200 }} value={kind} onChange={(e) => setParams({ kind: e.target.value, status })}>{[['', 'All types'], ['b2b', 'B2B'], ['export', 'Export'], ['contact', 'Contact']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      <select className="in" style={{ maxWidth: 200 }} value={status} onChange={(e) => setParams({ kind, status: e.target.value })}>{[['', 'Any status'], ['new', 'New'], ['contacted', 'Contacted'], ['quoted', 'Quoted'], ['won', 'Won'], ['closed', 'Closed']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    </div>
    {error ? <ErrorState error={error} retry={reload} /> : !data ? <Loading /> : !data.length ? <p className="muted">No enquiries.</p> :
      <div className="tscroll"><table className="tbl"><thead><tr><th>Ref</th><th>Date</th><th>Type</th><th>From</th><th>Status</th></tr></thead><tbody>
        {data.map((l) => [<tr key={l._id}><td><button className="link" onClick={() => setOpen(open === l._id ? null : l._id)}>{l.ref}</button></td><td>{fdate(l.createdAt)}</td><td>{l.kind === 'b2b' ? 'B2B' : l.kind}</td><td>{l.name}{l.company ? `, ${l.company}` : ''}<div className="small muted">{l.email} {l.phone}</div></td>
          <td><select className="in" style={{ minHeight: 38 }} value={l.status} onChange={(e) => setStatus(l._id, e.target.value)} aria-label={`Status for ${l.ref}`}>{['new', 'contacted', 'quoted', 'won', 'closed'].map((s) => <option key={s}>{s}</option>)}</select></td></tr>,
          open === l._id && <tr key={l._id + 'd'}><td colSpan={5} style={{ background: 'var(--paper)' }}><p style={{ whiteSpace: 'pre-wrap' }}>{l.message}</p>
            <p className="small muted">{[l.country && `Country: ${l.country}`, ...Object.entries(l.details || {}).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => `${k}: ${v}`)].filter(Boolean).join(' · ')}</p>
            <a className="link" href={`mailto:${l.email}?subject=${encodeURIComponent('Your enquiry ' + l.ref)}`}>Reply by email</a></td></tr>])}
      </tbody></table></div>}
  </>);
}

function Coupons() {
  const { data, error, reload } = useApi('/admin/coupons');
  const f = useApiForm(async (d, form) => { await api('/admin/coupons', { method: 'POST', body: d }); form.reset(); reload(); return 'Coupon created.'; });
  const toggle = async (c) => { await api('/admin/coupons/' + c._id, { method: 'PATCH', body: { active: !c.active } }); reload(); };
  return (<>
    <h1 className="ah">Coupons</h1>
    {error ? <ErrorState error={error} retry={reload} /> : !data ? <Loading /> : <div className="tscroll"><table className="tbl"><thead><tr><th>Code</th><th>Discount</th><th>Minimum</th><th>Used</th><th>Status</th></tr></thead><tbody>
      {data.map((c) => <tr key={c._id}><td><strong>{c.code}</strong><div className="small muted">{c.label}</div></td><td>{c.type === 'pct' ? `${c.value}%` : inr(c.value)}</td><td>{inr(c.min)}</td><td>{c.used}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td><td><button className="link" onClick={() => toggle(c)}>{c.active ? 'Active: disable' : 'Disabled: enable'}</button></td></tr>)}
    </tbody></table></div>}
    <h2 className="ah2" style={{ marginTop: 36 }}>New coupon</h2>
    <form className="f" onSubmit={f.onSubmit} noValidate style={{ maxWidth: 640 }}>
      <div className="f2"><Field name="code" label="Code" errors={f.errors} /><Field name="type" label="Type" type="select" options={[['pct', 'Percent off'], ['flat', 'Fixed ₹ off']]} errors={f.errors} /></div>
      <div className="f2"><Field name="value" label="Value" type="number" min="0" errors={f.errors} /><Field name="min" label="Minimum subtotal (₹)" type="number" min="0" req={false} errors={f.errors} /></div>
      <div className="f2"><Field name="label" label="Label shown at checkout" req={false} errors={f.errors} /><Field name="usageLimit" label="Usage limit (0 = unlimited)" type="number" min="0" req={false} errors={f.errors} /></div>
      <button className="btn" type="submit" disabled={f.busy}>Create coupon</button><FormMessage message={f.message} /></form>
  </>);
}

function Subscribers() {
  const { data, error, reload } = useApi('/admin/subscribers');
  const csv = async () => {
    const r = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/subscribers.csv', { credentials: 'include' });
    const blob = await r.blob(); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'subscribers.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return (<>
    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}><h1 className="ah" style={{ margin: 0 }}>Subscribers</h1><button className="btn ghost" onClick={csv}>Download CSV</button></div>
    {error ? <ErrorState error={error} retry={reload} /> : !data ? <Loading /> : !data.length ? <p className="muted">No subscribers yet.</p> : <table className="tbl"><tbody>{data.map((s) => <tr key={s._id}><td>{s.email}</td><td>{fdate(s.createdAt)}</td></tr>)}</tbody></table>}
  </>);
}
