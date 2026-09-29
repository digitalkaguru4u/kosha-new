import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../context/Store.jsx';
import { useApi } from '../lib/useApi.js';
import { useSeo } from '../lib/seo.js';
import { availability, addWorkingDays, fdate } from '../lib/format.js';
import { assetUrl } from '../lib/api.js';
import Art from '../components/Art.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { Loading } from '../components/States.jsx';
import { IconHeart, IconShare } from '../components/Icons.jsx';
import NotFound from './NotFound.jsx';

export default function Product() {
  const { slug } = useParams();
  const { data, error } = useApi('/products/' + slug);
  const { money, config, countryInfo, wish, toggleWish, addToCart, markViewed, recent, products, cacheProducts, setModal, setPanel, toast, cart, setCart } = useStore();
  const [v, setV] = useState(0);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(null);
  const [pin, setPin] = useState(''); const [pinOut, setPinOut] = useState(null);
  const [sticky, setSticky] = useState(false);
  const nav = useNavigate();
  const zref = useRef();
  const p = data?.product;

  useEffect(() => { setV(0); setQty(1); setPinOut(null); window.scrollTo({ top: 0, behavior: 'instant' }); }, [slug]);
  useEffect(() => { if (p) { markViewed(p.slug); cacheProducts([p, ...(data.related || [])]); } }, [p?.slug]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const f = () => setSticky(window.scrollY > 560); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);

  useSeo(p ? {
    title: p.name, description: p.desc,
    jsonLd: { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.desc, sku: p.slug, material: p.material, image: p.images?.map((u) => new URL(assetUrl(u), location.origin).href),
      brand: { '@type': 'Brand', name: 'Kosha Atelier' }, offers: { '@type': 'Offer', priceCurrency: 'INR', price: p.price, availability: p.leadDays > 0 || p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: location.href } }
  } : { title: 'Product' });

  if (error?.status === 404) return <NotFound />;
  if (!p) return <Loading />;
  const a = availability(p);
  const ci = countryInfo();
  const z = config?.zones?.[ci.zone];
  const lead = p.leadDays || 2;
  const e1 = z && addWorkingDays(lead + z.days[0]), e2 = z && addWorkingDays(lead + z.days[1]);
  const w = wish.includes(p.slug);
  const recentList = recent.filter((s) => s !== p.slug).map((s) => products[s]).filter(Boolean).slice(0, 4);
  const views = p.images?.length ? p.images.map((_, i) => i) : [0, 1, 2];

  const buyNow = () => {
    const line = cart.find((l) => l.slug === p.slug);
    if (!line || line.qty < qty) setCart((c) => (line ? c.map((l) => (l.slug === p.slug ? { ...l, qty } : l)) : [...c, { slug: p.slug, qty }]));
    cacheProducts([p]);
    nav('/checkout');
  };
  const share = async () => {
    const url = location.href;
    try { if (navigator.share) { await navigator.share({ title: p.name, text: p.desc, url }); return; } } catch (e) { if (e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); toast('Link copied'); }
    catch { setModal({ title: 'Share this piece', body: <label className="fl">Copy this link<input className="in" readOnly value={url} onFocus={(e) => e.target.select()} /></label> }); }
  };
  const checkPin = (e) => {
    e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pin.trim())) { setPinOut({ err: 'Enter a valid 6-digit PIN code.' }); return; }
    const metro = /^(11|40|56|60|70|50|41|38)/.test(pin);
    setPinOut({ from: addWorkingDays(lead + (metro ? 2 : 4)), to: addWorkingDays(lead + (metro ? 4 : 7)), cod: p.price <= (config?.codMax || 25000) });
  };
  const lightbox = () => setModal({ title: p.name, flush: true, body: <Lightbox p={p} views={views} start={v} /> });
  const move = (e) => {
    if (!window.matchMedia('(hover:hover)').matches) return;
    const r = zref.current.getBoundingClientRect();
    setZoom(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (<>
    <div className="wrap" style={{ paddingTop: 28 }}><div className="crumbs"><Link to="/">Home</Link> / <Link to={`/shop?c=${p.collectionSlug}`}>Shop</Link> / {p.name}</div></div>
    <section style={{ paddingTop: 12 }}><div className="wrap pd">
      <div className="gal">
        <div className="thumbs" role="tablist" aria-label="Product images">{views.map((i) => <button key={i} onClick={() => setV(i)} aria-current={v === i} aria-label={`Image ${i + 1}`}><Art product={p} v={i} decorative /></button>)}</div>
        <div ref={zref} className={'zoom' + (zoom ? ' on' : '')} style={zoom ? { '--zo': zoom } : undefined} onMouseMove={move} onMouseLeave={() => setZoom(null)} onClick={lightbox} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), lightbox())} tabIndex={0} role="button" aria-label="Open larger image">
          <Art product={p} v={v} /><span className="hint">Hover to zoom, tap to enlarge</span></div>
      </div>
      <div className="pinfo"><span className="muted small">{p.craft}, {p.region}</span><h1>{p.name}</h1>
        <div className="pprice">{money(p.price)}</div>
        <div className="small muted">{ci.zone !== 'IN' ? 'Import duties and taxes are payable on delivery.' : `Inclusive of GST.${p.price >= (config?.freeShipIN || 5000) ? ' Free delivery in India.' : ''}`}</div>
        <div className="avail"><i className={a.cls} />{a.txt}</div>
        <p>{p.desc}</p>
        {a.canBuy ? <>
          <div className="buy"><div className="qty"><button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button><input type="number" value={qty} min="1" max={a.max} aria-label="Quantity" onChange={(e) => setQty(Math.max(1, Math.min(a.max, Number(e.target.value) || 1)))} /><button onClick={() => setQty((q) => Math.min(a.max, q + 1))} aria-label="Increase quantity">+</button></div>
            <button className="btn" onClick={() => addToCart(p, qty)}>Add to cart</button></div>
          <div className="buy2"><button className="btn ghost" onClick={buyNow}>Buy now</button><button className="sq" onClick={() => toggleWish(p.slug)} aria-pressed={w} aria-label="Save to wishlist"><IconHeart /></button><button className="sq" onClick={share} aria-label="Share"><IconShare /></button></div>
        </> : <div className="buy2"><Link className="btn" to={`/contact?about=${p.slug}`}>Ask about this piece</Link><button className="sq" onClick={() => toggleWish(p.slug)} aria-pressed={w} aria-label="Save to wishlist"><IconHeart /></button><button className="sq" onClick={share} aria-label="Share"><IconShare /></button></div>}
        {z && <div className="est"><strong>Delivery to {ci.name}:</strong> {fdate(e1)} to {fdate(e2)}
          {ci.zone === 'IN' ? <><form onSubmit={checkPin} noValidate><label className="sr" htmlFor="pin">PIN code</label><input className="in" id="pin" inputMode="numeric" maxLength={6} placeholder="Check your PIN code" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} /><button type="submit">Check</button></form>
            {pinOut && <div className="small" style={{ marginTop: 8 }}>{pinOut.err ? <span className="err">{pinOut.err}</span> : <>Delivers to {pin} by {fdate(pinOut.from)} to {fdate(pinOut.to)}. {pinOut.cod && 'Cash on delivery available. '}<span className="muted">Estimate; confirmed with the courier at dispatch.</span></>}</div>}</>
            : <div className="small muted" style={{ marginTop: 6 }}>Insured express shipping. <button className="link" onClick={() => setPanel('locale')}>Change country</button></div>}</div>}
        <dl className="facts"><dt>Material</dt><dd>{p.material}</dd><dt>Dimensions</dt><dd>{p.dims}</dd>{p.weight ? <><dt>Weight</dt><dd>{p.weight} kg</dd></> : null}<dt>Finish</dt><dd>{p.finish}</dd><dt>Origin</dt><dd>{p.region}, India</dd></dl>
        <div style={{ marginTop: 28 }}>
          <details open><summary>The craft</summary><div className="body"><p>{p.craftText}</p></div></details>
          <details><summary>Care</summary><div className="body"><p>{p.care}</p><p>Because each piece is made by hand, small variations in colour, texture and size are part of its character.</p></div></details>
          <details><summary>Shipping</summary><div className="body"><p>India: 3–6 working days after dispatch, free above ₹5,000. Express available.</p><p>International: insured express to 20 countries in 5–12 working days. Import duties and taxes are payable by the recipient on delivery.</p><Link className="link" to="/shipping">Shipping and duties</Link></div></details>
          <details><summary>Returns and refunds</summary><div className="body"><p>Return unused pieces within 14 days of delivery in their original packaging. Made-to-order pieces are final sale unless they arrive damaged. Report damage within 48 hours with photographs and we will replace or refund in full.</p><Link className="link" to="/returns">Returns policy</Link></div></details>
          <details><summary>Buying for a business?</summary><div className="body"><p>Trade pricing from {p.moq} units, with custom finishes on request.</p><Link className="link" to={`/b2b?about=${p.slug}#enquire`}>Request bulk pricing</Link></div></details>
        </div>
      </div>
    </div></section>
    {a.canBuy && <div className={'stickybuy' + (sticky ? ' show' : '')}><div><div className="small">{p.name}</div><strong>{money(p.price)}</strong></div><button className="btn" onClick={() => addToCart(p, qty)}>Add to cart</button></div>}
    {data.related?.length > 0 && <section style={{ paddingTop: 0 }}><div className="wrap"><div className="sec-h"><h2>You may also like</h2></div><div className="grid">{data.related.map((x) => <ProductCard key={x.slug} p={x} />)}</div></div></section>}
    {recentList.length > 0 && <section style={{ paddingTop: 0 }}><div className="wrap"><div className="sec-h"><h2>Recently viewed</h2></div><div className="grid">{recentList.map((x) => <ProductCard key={x.slug} p={x} />)}</div></div></section>}
  </>);
}

function Lightbox({ p, views, start }) {
  const [v, setV] = useState(start);
  const labels = p.images?.length ? views.map((i) => `Photo ${i + 1}`) : ['Front', 'Detail', 'Studio'];
  return (<>
    <div className="frame" style={{ aspectRatio: '4/5' }}><Art product={p} v={v} /></div>
    <div className="row" style={{ justifyContent: 'center', padding: 14 }}>{views.map((i) => <button key={i} className="link" aria-pressed={v === i} onClick={() => setV(i)}>{labels[i]}</button>)}</div>
  </>);
}
