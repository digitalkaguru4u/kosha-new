import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store.jsx';
import { api } from '../lib/api.js';
import Art from './Art.jsx';
import { IconSearch, IconHeart, IconUser, IconBag, IconMenu, IconClose, IconHome, IconGrid, IconChat } from './Icons.jsx';

export const NAV = [['/', 'Home'], ['/shop', 'Shop'], ['/collections', 'Collections'], ['/new', 'New arrivals'], ['/our-story', 'Our story'], ['/b2b', 'B2B'], ['/export', 'Export'], ['/track', 'Track order'], ['/contact', 'Contact']];
const Close = ({ label = 'Close' }) => { const { setPanel } = useStore(); return <button className="x" onClick={() => setPanel(null)} aria-label={label}><IconClose /></button>; };

export function Header() {
  const { setPanel, cartCount, wish, countryInfo, currency } = useStore();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const f = () => setScrolled(window.scrollY > 8); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  return (<>
    <div className="notice"><div className="wrap">
      <span>Free shipping in India above ₹5,000<span className="hide-s">. Insured delivery worldwide.</span></span>
      <button onClick={() => setPanel('locale')} aria-label="Change country and currency">{countryInfo().name} / {currency}</button>
    </div></div>
    <header className={'hdr' + (scrolled ? ' scrolled' : '')}><div className="wrap">
      <button className="ic burger" onClick={() => setPanel('menu')} aria-label="Open menu"><IconMenu /></button>
      <Link className="logo" to="/" aria-label="Kosha Atelier home">Kosha<i /><small>ATELIER</small></Link>
      <nav className="nav" aria-label="Main">{NAV.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'}>{l}</NavLink>)}</nav>
      <div className="icons">
        <button className="ic" onClick={() => setPanel('search')} aria-label="Search"><IconSearch /></button>
        <Link className="ic hide-m" to="/wishlist" aria-label="Wishlist"><IconHeart /><span className="badge">{wish.length || ''}</span></Link>
        <Link className="ic hide-m" to="/account" aria-label="Account"><IconUser /></Link>
        <button className="ic" onClick={() => setPanel('cart')} aria-label="Cart"><IconBag /><span className="badge">{cartCount || ''}</span></button>
      </div>
    </div></header>
  </>);
}

export function TabBar() {
  const { setPanel, cartCount, wish } = useStore();
  return (
    <nav className="tabbar" aria-label="Quick">
      <NavLink to="/" end><IconHome />Home</NavLink>
      <NavLink to="/shop"><IconGrid />Shop</NavLink>
      <button onClick={() => setPanel('search')}><IconSearch />Search</button>
      <NavLink to="/wishlist"><IconHeart />Saved<span className="badge">{wish.length || ''}</span></NavLink>
      <button onClick={() => setPanel('cart')}><IconBag />Cart<span className="badge">{cartCount || ''}</span></button>
    </nav>
  );
}

export function Footer() {
  const { setPanel, countryInfo, currency } = useStore();
  const [cols, setCols] = useState([]);
  useEffect(() => { api('/collections').then(setCols).catch(() => {}); }, []);
  return (
    <footer><div className="wrap"><div className="fgrid">
      <div><Link className="logo" to="/">Kosha<i /><small>ATELIER</small></Link>
        <p style={{ marginTop: 18, maxWidth: '34ch' }}>Heirloom décor from India's master artisan clusters, made by hand and shipped with care across India and worldwide.</p>
        <div className="chips"><span>Secure payments</span><span>Quality checked</span><span>Insured shipping</span></div></div>
      <div><h4>Shop</h4><ul>{cols.map((c) => <li key={c.slug}><Link to={`/shop?c=${c.slug}`}>{c.name}</Link></li>)}<li><Link to="/shop?t=heirloom">The Heirloom Edit</Link></li></ul></div>
      <div><h4>Help</h4><ul><li><Link to="/track">Track your order</Link></li><li><Link to="/shipping">Shipping and duties</Link></li><li><Link to="/returns">Returns and refunds</Link></li><li><Link to="/contact">Contact us</Link></li><li><Link to="/account">Your account</Link></li></ul></div>
      <div><h4>Trade</h4><ul><li><Link to="/b2b">For businesses</Link></li><li><Link to="/export">Export</Link></li><li><Link to="/catalogue">Trade catalogue</Link></li><li><Link to="/b2b#enquire">Bulk enquiry</Link></li></ul></div>
      <div><h4>Atelier</h4><ul><li><Link to="/our-story">Our story</Link></li><li><Link to="/collections">Collections</Link></li><li><Link to="/new">New arrivals</Link></li><li><button style={{ color: 'inherit' }} onClick={() => setPanel('locale')}>{countryInfo().name} / {currency}</button></li></ul></div>
    </div>
    <div className="fbot"><span>© {new Date().getFullYear()} Kosha Atelier</span><span>UPI, cards, net banking, cash on delivery and bank transfer</span><span><Link to="/privacy">Privacy</Link> &nbsp; <Link to="/terms">Terms</Link></span></div></div></footer>
  );
}

function CartDrawer() {
  const { cartLines, cartCount, cartSubtotal, setQty, money, countryInfo, config } = useStore();
  const inIN = countryInfo().zone === 'IN';
  const free = config?.freeShipIN || 5000;
  return (<>
    <div className="phd"><h2>Your cart</h2><Close label="Close cart" /></div>
    {!cartCount ? <div className="pbd"><div className="empty"><h3>Your cart is empty</h3><p className="muted">Pieces you add will appear here.</p><Link className="btn ghost" to="/shop">Browse the shop</Link></div></div> : <>
      <div className="pbd">
        {inIN && <><div className="small">{cartSubtotal < free ? `Add ${money(free - cartSubtotal)} more for free delivery in India.` : 'Your order ships free within India.'}</div><div className="prog"><i style={{ width: `${Math.min(100, cartSubtotal / free * 100)}%` }} /></div></>}
        {cartLines.map((l) => <CartLine key={l.slug} l={l} setQty={setQty} money={money} />)}
      </div>
      <div className="pft"><div className="tot"><span>Subtotal</span><span>{money(cartSubtotal)}</span></div>
        <p className="small muted" style={{ margin: '4px 0 14px' }}>Shipping{inIN ? '' : ', duties'} and discounts are calculated at checkout.</p>
        <Link className="btn block" to="/checkout">Checkout</Link><Link className="link small" to="/cart" style={{ display: 'inline-block', marginTop: 14 }}>View cart</Link></div>
    </>}
  </>);
}
export function CartLine({ l, setQty, money }) {
  const p = l.product; const max = p.leadDays > 0 ? 20 : Math.min(p.stock, 20);
  return (
    <div className="line">
      <Link className="frame" to={`/product/${p.slug}`}><Art product={p} decorative /></Link>
      <div><h4><Link to={`/product/${p.slug}`}>{p.name}</Link></h4><div className="small muted">{p.region}</div>
        <div><span className="q"><button onClick={() => setQty(p.slug, l.qty - 1)} aria-label={`Decrease ${p.name}`}>−</button><span>{l.qty}</span><button onClick={() => setQty(p.slug, l.qty + 1)} disabled={l.qty >= max} aria-label={`Increase ${p.name}`}>+</button></span>
          <button className="rm" onClick={() => setQty(p.slug, 0)}>Remove</button></div>
        {l.qty > max && <div className="err">Only {max} available</div>}</div>
      <div>{money(p.price * l.qty)}</div>
    </div>
  );
}

function SearchPanel() {
  const { money, setPanel, panel } = useStore();
  const [q, setQ] = useState(''); const [res, setRes] = useState([]); const nav = useNavigate(); const ref = useRef();
  useEffect(() => { if (panel === 'search') setTimeout(() => ref.current?.focus(), 60); }, [panel]);
  useEffect(() => {
    if (!q.trim()) { setRes([]); return; }
    const t = setTimeout(() => api('/products?q=' + encodeURIComponent(q.trim())).then(setRes).catch(() => setRes([])), 180);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 36 }}>
      <form className="searchbox" onSubmit={(e) => { e.preventDefault(); if (q.trim()) { setPanel(null); nav('/shop?q=' + encodeURIComponent(q.trim())); } }}>
        <label className="sr" htmlFor="q">Search products</label><input ref={ref} id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brass, marble, Kashmir…" autoComplete="off" />
        <Close label="Close search" />
      </form>
      <div className="sres">
        {!q.trim() ? <><p className="small muted">Popular searches</p><div className="row">{['Brass', 'Marble', 'Kashmir', 'Pashmina', 'Lantern', 'Blue pottery'].map((s) => <button key={s} className="link" onClick={() => setQ(s)}>{s}</button>)}</div></>
          : res.length ? <>{res.slice(0, 6).map((p) => <Link key={p.slug} to={`/product/${p.slug}`} onClick={() => setPanel(null)}><div className="frame"><Art product={p} decorative /></div><span>{p.name}<br /><span className="small muted">{p.region}</span></span><span>{money(p.price)}</span></Link>)}
            {res.length > 6 && <Link className="link" to={'/shop?q=' + encodeURIComponent(q)} onClick={() => setPanel(null)}>See all {res.length} results</Link>}</>
          : <p className="muted">No pieces match “{q}”. Try a material such as brass or marble, or a region such as Kashmir.</p>}
      </div>
    </div>
  );
}

function LocaleForm() {
  const { config, country, currency, setCountry, setCurrency, setPanel, toast } = useStore();
  const [c, setC] = useState(country); const [cur, setCur] = useState(currency);
  return (<>
    <div className="phd"><h2>Country and currency</h2><Close /></div>
    <div className="pbd"><form className="f" onSubmit={(e) => { e.preventDefault(); setCountry(c); setCurrency(cur); setPanel(null); toast(`Shipping to ${config.countries.find((x) => x.code === c).name}, prices in ${cur}`); }}>
      <label className="fl">Shipping to<select className="in" value={c} onChange={(e) => { setC(e.target.value); setCur(config.countries.find((x) => x.code === e.target.value).currency); }}>{config?.countries.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}</select></label>
      <label className="fl">Show prices in<select className="in" value={cur} onChange={(e) => setCur(e.target.value)}>{Object.keys(config?.currencies || { INR: 1 }).map((k) => <option key={k}>{k}</option>)}</select></label>
      <p className="small muted">All payments are charged in Indian rupees. Other currencies are shown at indicative rates.</p>
      <button className="btn" type="submit">Save</button></form></div>
  </>);
}

function Talk() {
  return (<>
    <div className="phd"><h2>Talk to us</h2><Close /></div>
    <div className="pbd"><div className="f">
      {import.meta.env.VITE_WHATSAPP && <a className="btn" href={`https://wa.me/${import.meta.env.VITE_WHATSAPP}`} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>}
      <Link className={'btn' + (import.meta.env.VITE_WHATSAPP ? ' ghost' : '')} to="/contact">Send us a message</Link>
      <Link className="btn ghost" to="/track">Track an order</Link>
      <Link className="btn ghost" to="/b2b#enquire">Business enquiry</Link>
    </div></div>
  </>);
}

export function Overlays() {
  const { panel, setPanel, modal, setModal, toastMsg, config } = useStore();
  const loc = useLocation();
  useEffect(() => { setPanel(null); setModal(null); }, [loc.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const open = panel || modal;
    document.body.style.overflow = open ? 'hidden' : '';
    const k = (e) => { if (e.key === 'Escape') { setPanel(null); setModal(null); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [panel, modal, setPanel, setModal]);
  const P = (id, cls, children, label) => <aside className={`panel ${cls}${panel === id ? ' open' : ''}`} aria-label={label} aria-hidden={panel !== id}>{panel === id || id === 'cart' ? children : null}</aside>;
  return (<>
    <div className={'scrim' + (panel || modal ? ' on' : '')} onClick={() => { if (!modal?.locked) { setPanel(null); setModal(null); } }} />
    {P('menu', 'left', <><div className="phd"><Link className="logo" to="/">Kosha<i /></Link><Close label="Close menu" /></div><div className="pbd"><nav className="mnav">{NAV.map(([to, l]) => <Link key={to} to={to}>{l}</Link>)}</nav><div className="row" style={{ marginTop: 22 }}><Link className="link" to="/account">Account</Link><Link className="link" to="/wishlist">Wishlist</Link><button className="link" onClick={() => setPanel('locale')}>Country and currency</button></div></div></>, 'Menu')}
    {P('cart', 'right', <CartDrawer />, 'Cart')}
    {P('search', 'top', <SearchPanel />, 'Search')}
    {P('talk', 'bottom', <Talk />, 'Talk to us')}
    <div className={'panel center' + (panel === 'locale' ? ' open' : '')} role="dialog" aria-modal="true" aria-hidden={panel !== 'locale'}>{panel === 'locale' && config && <LocaleForm />}</div>
    <div className={'panel center' + (modal ? ' open' : '')} role="dialog" aria-modal="true" aria-hidden={!modal}>{modal && <><div className="phd"><h2>{modal.title}</h2>{!modal.locked && <button className="x" onClick={() => setModal(null)} aria-label="Close"><IconClose /></button>}</div><div className="pbd" style={modal.flush ? { padding: 0 } : undefined}>{modal.body}</div></>}</div>
    <button className="fab" onClick={() => setPanel('talk')} aria-label="Talk to us"><IconChat /></button>
    <div className={'toast' + (toastMsg ? ' on' : '')} role="status" aria-live="polite">{toastMsg}</div>
  </>);
}

export function PageHead({ title, lede, crumbs }) {
  return <div className="phead"><div className="wrap">{crumbs && <div className="crumbs">{crumbs.map(([to, l], i) => <span key={i}>{i > 0 && ' / '}{to ? <Link to={to}>{l}</Link> : l}</span>)}</div>}<h1>{title}</h1>{lede && <p className="lede" style={{ marginTop: 18 }}>{lede}</p>}</div></div>;
}
