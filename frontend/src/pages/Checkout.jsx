import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store.jsx';
import { api, ApiError } from '../lib/api.js';
import { useSeo } from '../lib/seo.js';
import { fdate } from '../lib/format.js';
import { Field, validateForm, formData } from '../components/Form.jsx';
import { CartLine, PageHead } from '../components/Layout.jsx';
import Art from '../components/Art.jsx';
import { IconLock } from '../components/Icons.jsx';

export function Cart() {
  useSeo({ title: 'Cart' });
  const { cartLines, cartCount, cartSubtotal, setQty, money } = useStore();
  return (<>
    <PageHead title="Your cart" crumbs={[['/', 'Home'], [null, 'Cart']]} />
    <section style={{ paddingTop: 0 }}><div className="wrap co">{cartCount ? <>
      <div>{cartLines.map((l) => <CartLine key={l.slug} l={l} setQty={setQty} money={money} />)}<p style={{ marginTop: 22 }}><Link className="link" to="/shop">Continue shopping</Link></p></div>
      <div className="summary"><h2 style={{ fontSize: '1.5rem', marginBottom: 14 }}>Summary</h2><div className="tot"><span>Subtotal</span><span>{money(cartSubtotal)}</span></div>
        <p className="small muted">Shipping, taxes and discounts are calculated at checkout.</p>
        <Link className="btn block" to="/checkout" style={{ marginTop: 18 }}>Checkout</Link>
        <div className="secure"><IconLock /><span>Encrypted checkout. We never see or store your card details.</span></div></div>
    </> : <div className="empty" style={{ gridColumn: '1/-1' }}><h3>Your cart is empty</h3><p className="muted">Start with a collection.</p><Link className="btn" to="/collections">Explore collections</Link></div>}</div></section>
  </>);
}

let rzpScript;
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  rzpScript ||= new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = res; s.onerror = () => { rzpScript = null; rej(new Error('Could not load the payment window. Check your connection and try again.')); };
    document.body.appendChild(s);
  });
  return rzpScript;
}

export default function Checkout() {
  useSeo({ title: 'Checkout' });
  const { cart, setCart, cartCount, user, config, country: prefCountry, currency, money, setModal } = useStore();
  const nav = useNavigate();
  const formRef = useRef();
  const saved = user?.addresses || [];
  const [addrChoice, setAddrChoice] = useState(saved.length ? String(saved[0]._id) : 'new');
  const [country, setCountry] = useState(prefCountry);
  const [method, setMethod] = useState('std');
  const [payment, setPayment] = useState('razorpay');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');
  const [q, setQ] = useState(null);
  const [quoteErr, setQuoteErr] = useState('');
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null); // {number, email} after a failed payment

  useEffect(() => { if (saved.length && addrChoice === 'new' && !pendingOrder) setAddrChoice(String(saved[0]._id)); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  const shipCountry = addrChoice !== 'new' ? saved.find((a) => String(a._id) === addrChoice)?.country || country : country;

  useEffect(() => {
    if (!cart.length) return;
    let live = true;
    api('/cart/quote', { method: 'POST', body: { items: cart, country: shipCountry, method, coupon: coupon || undefined } })
      .then((r) => { if (live) { setQ(r); setQuoteErr(''); } })
      .catch((e) => live && setQuoteErr(e.message));
    return () => { live = false; };
  }, [JSON.stringify(cart), shipCountry, method, coupon]); // eslint-disable-line react-hooks/exhaustive-deps

  const isIN = q?.zone === 'IN';
  const payOptions = !q ? [] : isIN
    ? [['razorpay', 'Pay online', 'UPI, cards, net banking and wallets'], ...(q.codAllowed ? [['cod', 'Cash on delivery', `Orders up to ${money(config?.codMax || 25000, 'INR')}`]] : []), ...(q.total >= 50000 ? [['transfer', 'Bank transfer', 'We email a proforma invoice; your order ships once funds clear']] : [])]
    : [['razorpay', 'Card payment', 'Visa, Mastercard and Amex, charged in INR'], ['transfer', 'Bank transfer (wire)', 'We email a proforma invoice; your order ships once funds clear']];
  useEffect(() => { if (payOptions.length && !payOptions.some((o) => o[0] === payment)) setPayment(payOptions[0][0]); }, [payOptions.map((o) => o[0]).join()]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cartCount && !pendingOrder) return <Cart />;
  const disp = isIN ? 'INR' : currency;

  const finish = (order, email) => {
    sessionStorage.setItem('order-email:' + order.number, email);
    setCart([]); setModal(null);
    nav('/order/' + order.number);
  };

  const pay = async (res, email) => {
    const { order } = res;
    if (res.razorpay) {
      await loadRazorpay();
      const rz = new window.Razorpay({
        key: res.razorpay.key, order_id: res.razorpay.orderId, amount: res.razorpay.amount, currency: 'INR', name: res.razorpay.name,
        description: `Order ${order.number}`, prefill: res.razorpay.prefill, theme: { color: '#4D0E13' },
        handler: async (r) => {
          try { const v = await api(`/orders/${order.number}/verify`, { method: 'POST', body: r }); finish(v.order, email); }
          catch (e) { setMsg({ ok: false, text: e.message }); }
        },
        modal: { ondismiss: () => { setPendingOrder({ number: order.number, email }); setMsg({ ok: false, text: 'Payment was not completed and you have not been charged. Your items are held for 30 minutes.' }); } }
      });
      rz.on('payment.failed', () => { api(`/orders/${order.number}/payment-failed`, { method: 'POST', body: { email } }).catch(() => {}); });
      rz.open();
    } else if (res.testPayment) {
      const sim = async (success) => {
        try {
          const r = await api(`/orders/${order.number}/test-payment`, { method: 'POST', body: { success, email } });
          if (success) finish(r.order, email);
          else { setModal(null); setPendingOrder({ number: order.number, email }); setMsg({ ok: false, text: 'Payment failed and you have not been charged. Try again or choose another method.' }); }
        } catch (e) { setModal(null); setMsg({ ok: false, text: e.message }); }
      };
      setModal({ title: 'Secure payment', locked: true, body: <>
        <p>Amount: <strong>{money(order.total, 'INR')}</strong></p>
        <div className="okmsg small" style={{ margin: '14px 0 20px' }}>Test mode: Razorpay keys are not configured on the server, so no real payment is taken. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to go live.</div>
        <div className="f"><button className="btn" onClick={() => sim(true)}>Simulate successful payment</button><button className="btn ghost" onClick={() => sim(false)}>Simulate failed payment</button></div></> });
    } else finish(order, email);
  };

  const retry = async () => {
    setBusy(true); setMsg(null);
    try { const r = await api(`/orders/${pendingOrder.number}/retry`, { method: 'POST', body: { email: pendingOrder.email } }); await pay(r, pendingOrder.email); }
    catch (e) { setMsg({ ok: false, text: e.message }); if (e.status === 404) setPendingOrder(null); }
    finally { setBusy(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    const form = formRef.current;
    const errs = validateForm(form);
    setErrors(errs); setMsg(null);
    if (Object.keys(errs).length) { setMsg({ ok: false, text: 'Some details are missing or incorrect. They are highlighted above.' }); form.querySelector('[aria-invalid="true"]')?.focus(); return; }
    if (!q || q.problems.length) { setMsg({ ok: false, text: 'Some items in your cart need attention. Please review your cart.' }); return; }
    const d = formData(form);
    const body = {
      items: cart, contact: { email: d.email, phone: d.phone }, payment, shippingMethod: method, coupon: coupon || undefined,
      currency: disp, expectedTotal: q.total, saveAddress: Boolean(d.saveAddress)
    };
    if (addrChoice !== 'new') body.addressId = addrChoice;
    else body.address = { name: d.name, line1: d.line1, line2: d.line2, city: d.city, state: d.state, zip: d.zip, country, phone: d.phone };
    setBusy(true);
    try {
      const res = await api('/orders', { method: 'POST', body });
      await pay(res, d.email);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.details || {});
        setMsg({ ok: false, text: err.message });
        if (err.status === 409) api('/cart/quote', { method: 'POST', body: { items: cart, country: shipCountry, method, coupon: coupon || undefined } }).then(setQ).catch(() => {});
      } else setMsg({ ok: false, text: err.message || 'Something went wrong.' });
    } finally { setBusy(false); }
  };

  const countryOpts = config?.countries.map((c) => [c.code, c.name]) || [['IN', 'India']];
  const payLabel = payment === 'cod' || payment === 'transfer' ? `Place order, ${q ? money(q.total, disp) : ''}` : `Pay ${q ? money(q.total, disp) : ''}`;

  return (<>
    <div className="wrap" style={{ paddingTop: 36 }}><div className="crumbs"><Link to="/cart">Cart</Link> / Checkout</div><h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', marginBottom: 28 }}>Checkout</h1></div>
    <section style={{ paddingTop: 0 }}><div className="wrap co">
      <form ref={formRef} onSubmit={submit} noValidate>
        <fieldset><h2>Contact</h2>
          {!user && <p className="small muted">Checking out as a guest. <Link className="link" to="/account?next=/checkout">Sign in</Link> for saved addresses and order history.</p>}
          <div className="f2"><Field name="email" label="Email" type="email" autoComplete="email" errors={errors} defaultValue={user?.email || ''} /><Field name="phone" label="Phone" type="tel" autoComplete="tel" errors={errors} /></div></fieldset>
        <fieldset><h2>Delivery address</h2>
          {saved.length > 0 && <div className="f" style={{ marginBottom: 16 }}>{saved.map((a) => <label key={a._id} className="opt"><input type="radio" name="addrChoice" checked={addrChoice === String(a._id)} onChange={() => setAddrChoice(String(a._id))} /><span className="grow">{a.name}, {a.line1}, {a.city} {a.zip}, {config?.countries.find((c) => c.code === a.country)?.name}</span></label>)}
            <label className="opt"><input type="radio" name="addrChoice" checked={addrChoice === 'new'} onChange={() => setAddrChoice('new')} /><span className="grow">Use a new address</span></label></div>}
          <div className="f" hidden={addrChoice !== 'new'}>
            <Field name="country" label="Country" type="select" options={countryOpts} value={country} onChange={(e) => setCountry(e.target.value)} errors={errors} />
            <Field name="name" label="Full name" autoComplete="name" errors={errors} defaultValue={user?.name || ''} />
            <Field name="line1" label="Address" autoComplete="address-line1" errors={errors} />
            <Field name="line2" label="Apartment, suite, landmark" req={false} autoComplete="address-line2" errors={errors} />
            <div className="f2"><Field name="city" label="City" autoComplete="address-level2" errors={errors} /><Field name="state" label="State or region" autoComplete="address-level1" errors={errors} /></div>
            <div className="f2"><Field name="zip" label={country === 'IN' ? 'PIN code' : 'Postal code'} autoComplete="postal-code" inputMode={country === 'IN' ? 'numeric' : undefined} errors={errors} /><div /></div>
            {user && <label className="check"><input type="checkbox" name="saveAddress" defaultChecked /> Save this address to my account</label>}
          </div></fieldset>
        <fieldset><h2>Delivery</h2>{q && <div className="f">
          {[['std', isIN ? 'Standard' : 'Insured express'], ['exp', isIN ? 'Express' : 'Priority express']].map(([k, l]) => <label key={k} className="opt"><input type="radio" name="ship" checked={method === k} onChange={() => setMethod(k)} /><span className="grow">{l}<br /><span className="small muted">{method === k ? `Estimated ${fdate(q.eta.from)} to ${fdate(q.eta.to)}` : k === 'exp' ? 'Faster delivery' : 'Reliable, tracked delivery'}</span></span><span>{q.options[k] ? money(q.options[k], disp) : 'Free'}</span></label>)}
        </div>}</fieldset>
        <fieldset style={{ border: 0, margin: 0 }}><h2>Payment</h2>
          <div className="f">{payOptions.map(([v, l, d]) => <label key={v} className="opt"><input type="radio" name="pay" checked={payment === v} onChange={() => setPayment(v)} /><span className="grow">{l}<br /><span className="small muted">{d}</span></span></label>)}</div>
          <div className="secure"><IconLock /><span>Online payments are processed by Razorpay, a PCI DSS compliant gateway. Card details never touch our servers.</span></div>
          <div style={{ marginTop: 16 }} aria-live="polite">{msg && <div className={msg.ok ? 'okmsg' : 'errbox'}>{msg.text}</div>}</div>
          {pendingOrder ? <div className="f" style={{ marginTop: 20 }}><button type="button" className="btn block" onClick={retry} disabled={busy}>{busy ? 'Opening payment…' : `Try payment again for order ${pendingOrder.number}`}</button>
            <button type="button" className="link small" onClick={() => { setPendingOrder(null); setMsg(null); }}>Change details and place a new order instead</button></div>
            : <button className="btn block" type="submit" style={{ marginTop: 20 }} disabled={busy || !q}>{busy ? 'Processing…' : payLabel}</button>}
          <p className="small muted" style={{ marginTop: 12 }}>By placing your order you agree to our <Link className="link" to="/terms">terms</Link> and <Link className="link" to="/returns">returns policy</Link>.</p></fieldset>
      </form>

      <aside className="summary"><h2 style={{ fontSize: '1.5rem', marginBottom: 10 }}>Order summary</h2>
        {quoteErr && <div className="errbox small">{quoteErr}</div>}
        {q && <>
          {q.lines.map((l) => { const p = { slug: l.slug, name: l.name }; const full = cart.find((c) => c.slug === l.slug); return (
            <div key={l.slug} className="line" style={{ gridTemplateColumns: '60px 1fr auto' }}><div className="frame"><SummaryArt slug={l.slug} fallback={p} /></div><div><h4>{l.name}</h4><span className="small muted">Qty {full?.qty ?? l.qty}</span>{q.problems.find((x) => x.slug === l.slug) && <div className="err">{q.problems.find((x) => x.slug === l.slug).error}. <Link className="link" to="/cart">Update cart</Link></div>}</div><div>{money(l.lineTotal, disp)}</div></div>); })}
          <form className="row" style={{ margin: '18px 0', flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); setCoupon(couponInput.trim().toUpperCase()); }} noValidate>
            <label className="sr" htmlFor="cp">Promo code</label><input className="in" id="cp" placeholder="Promo code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} style={{ minHeight: 46 }} /><button className="btn ghost" type="submit" style={{ minHeight: 46 }}>Apply</button></form>
          {q.coupon && <div className="small" style={{ marginBottom: 10 }}>{q.coupon.valid ? <span style={{ color: 'var(--ok)' }}>{q.coupon.code} applied{q.coupon.label ? `: ${q.coupon.label}` : ''}.</span> : <span className="err">{q.coupon.code}: {q.coupon.message}</span>} <button className="link" onClick={() => { setCoupon(''); setCouponInput(''); }}>Remove</button></div>}
          <div className="tot"><span>Subtotal</span><span>{money(q.subtotal, disp)}</span></div>
          {q.discount > 0 && <div className="tot"><span>Discount</span><span>−{money(q.discount, disp)}</span></div>}
          <div className="tot"><span>Shipping to {config?.countries.find((c) => c.code === q.country)?.name}</span><span>{q.shipping ? money(q.shipping, disp) : 'Free'}</span></div>
          {isIN ? <div className="tot small muted"><span>Includes GST ({(config?.gstRate || 0.05) * 100}%)</span><span>{money(q.gst, 'INR')}</span></div> : <div className="tot small muted"><span>Import duties and taxes</span><span>Paid on delivery</span></div>}
          <div className="tot big"><span>Total</span><span>{money(q.total, disp)}</span></div>
          {disp !== 'INR' && <p className="small muted" style={{ marginTop: 10 }}>You will be charged {money(q.total, 'INR')}. The {disp} amount is approximate; your bank sets the final exchange rate.</p>}
          {!isIN && <p className="small muted" style={{ marginTop: 6 }}>Export orders are zero-rated for Indian GST. Your country may charge import duty and tax, collected by the courier on delivery.</p>}
        </>}
        {!q && !quoteErr && <p className="muted">Calculating…</p>}
      </aside>
    </div></section>
  </>);
}

function SummaryArt({ slug, fallback }) {
  const { products } = useStore();
  return <Art product={products[slug] || fallback} decorative />;
}
