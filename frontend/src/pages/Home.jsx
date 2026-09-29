import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/Store.jsx';
import { useApi } from '../lib/useApi.js';
import { useSeo } from '../lib/seo.js';
import { jaaliSVG } from '../lib/art.js';
import Art from '../components/Art.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Newsletter from '../components/Newsletter.jsx';
import ShipCalc from '../components/ShipCalc.jsx';
import { Loading } from '../components/States.jsx';
import { IconLeft, IconRight, BigHand, BigShield, BigBox, BigGlobe, BigSeal, BigPin, BigChat } from '../components/Icons.jsx';

export function CollectionCard({ c, hero }) {
  return (
    <Link className="col-card" to={`/shop?c=${c.slug}`}>
      <div className="frame arch">{hero && <Art product={hero} decorative />}</div>
      <h3>{c.name}</h3><span>{c.count} {c.count === 1 ? 'piece' : 'pieces'}</span>
    </Link>
  );
}

export function WhyGrid() {
  return (
    <div className="why">
      <div><BigHand /><h3>Direct from the maker</h3><p>We buy directly from artisan workshops and pay on order, not on sale.</p></div>
      <div><BigSeal /><h3>Checked twice</h3><p>Every piece is inspected at the workshop and again at our studio before it is packed.</p></div>
      <div><BigBox /><h3>Packed to travel</h3><p>Fitted inserts, archival tissue and double-walled cartons, tested for international transit.</p></div>
      <div><BigShield /><h3>Secure payment</h3><p>UPI, cards and net banking through a PCI DSS compliant gateway.</p></div>
      <div><BigPin /><h3>Tracked door to door</h3><p>Follow every stage from our studio to your door with your order number.</p></div>
      <div><BigChat /><h3>A person, not a queue</h3><p>Write to us and a member of the studio will reply within one working day.</p></div>
    </div>
  );
}

export default function Home() {
  useSeo({ description: 'Heirloom décor and handcrafted luxury objects from India, shipped across India and worldwide.' });
  const { money, config } = useStore();
  const { data: products } = useApi('/products');
  const { data: cols } = useApi('/collections');
  const heroRef = useRef(); const jaaliRef = useRef(); const rowRef = useRef();
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (reduced) return;
    let t = false;
    const f = () => {
      if (t) return; t = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 800);
        heroRef.current?.style.setProperty('--py', y * 0.08 + 'px');
        jaaliRef.current?.style.setProperty('--jy', y * -0.12 + 'px');
        t = false;
      });
    };
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, [reduced]);

  if (!products || !cols) return <Loading />;
  const by = (s) => products.find((p) => p.slug === s);
  const hero = by('bidri-vase') || products[0];
  const newA = products.filter((p) => p.tags.includes('new'));
  const best = products.filter((p) => p.tags.includes('best')).slice(0, 4);
  const heir = products.filter((p) => p.tags.includes('heirloom'));
  const heirBig = heir[3] || heir[0];
  const story = by('dhokra-rider') || products[1];
  const zones = config ? Object.entries(config.zones) : [];

  return (<>
    <section className="hero"><div className="wrap">
      <div className="hero-copy"><h1><span>Made slowly,</span><span>by hand,</span><span className="it">to be kept.</span></h1>
        <p className="lede fade">Heirloom décor from sixteen artisan clusters across India, each piece finished by the hands that began it. Shipped across India and worldwide.</p>
        <div className="row fade"><Link className="btn" to="/collections">Explore the collection</Link><Link className="btn ghost" to="/shop">Shop now</Link></div></div>
      {hero && <div className="hero-art"><div className="jaali" ref={jaaliRef} dangerouslySetInnerHTML={{ __html: jaaliSVG() }} />
        <Link className="frame arch" to={`/product/${hero.slug}`} ref={heroRef}><Art product={hero} /></Link>
        <div className="caption"><span>{hero.name}, {hero.region}</span><span>{money(hero.price)}</span></div></div>}
    </div></section>

    <section className="trust"><div className="wrap"><ul>
      <li><BigHand /><span>Handmade by named artisan clusters</span></li><li><BigShield /><span>Secure payments, India and abroad</span></li>
      <li><BigBox /><span>Gift-ready, insured packaging</span></li><li><BigGlobe /><span>Delivered across India and worldwide</span></li></ul></div></section>

    <section><div className="wrap"><div className="sec-h"><div><h2>Six crafts, one house</h2><p className="muted">Every collection is built around a single material and the region that has mastered it.</p></div><Link className="link" to="/collections">All collections</Link></div>
      <div className="cols">{cols.map((c) => <CollectionCard key={c.slug} c={c} hero={by(c.heroSlug)} />)}</div></div></section>

    {newA.length > 0 && <section style={{ paddingTop: 0 }}><div className="wrap"><div className="sec-h"><div><h2>New arrivals</h2><p className="muted">Recently arrived from the workshops.</p></div>
      <div className="arrows"><button onClick={() => rowRef.current.scrollBy({ left: -rowRef.current.clientWidth * 0.8, behavior: 'smooth' })} aria-label="Scroll back"><IconLeft /></button><button onClick={() => rowRef.current.scrollBy({ left: rowRef.current.clientWidth * 0.8, behavior: 'smooth' })} aria-label="Scroll forward"><IconRight /></button></div></div>
      <div className="scroller" ref={rowRef}>{newA.map((p) => <ProductCard key={p.slug} p={p} />)}</div></div></section>}

    <section style={{ paddingTop: 0 }}><div className="wrap"><div className="sec-h"><div><h2>Most loved</h2><p className="muted">The pieces our clients return for.</p></div><Link className="link" to="/shop?t=best">Shop best sellers</Link></div>
      <div className="grid">{best.map((p) => <ProductCard key={p.slug} p={p} />)}</div></div></section>

    {heirBig && <section className="dark"><div className="wrap heir">
      <Link className="frame" to={`/product/${heirBig.slug}`} style={{ aspectRatio: '1/1' }}><Art product={heirBig} v={2} /></Link>
      <div><h2>The Heirloom Edit</h2><p className="lede" style={{ marginTop: 16 }}>Our rarest work, made in small numbers by master artisans. Each piece arrives with a signed certificate naming the workshop that made it.</p>
        <div className="heir-list">{heir.filter((p) => p !== heirBig).slice(0, 2).map((p) => <ProductCard key={p.slug} p={p} />)}</div>
        <div className="row" style={{ marginTop: 32 }}><Link className="btn" to="/shop?t=heirloom">View the edit</Link></div></div>
    </div></section>}

    {story && <section><div className="wrap split">
      <div className="frame arch" style={{ maxWidth: 520 }}><Art product={story} v={1} /></div>
      <div><h2>Four thousand years, one pair of hands at a time</h2><p className="lede" style={{ margin: '18px 0 26px' }}>The lost-wax casting behind our Dhokra rider is traced to the Indus Valley. We work directly with the families who still practise it, and with fifteen other crafts like it.</p>
        <blockquote>“The mould is broken to free each piece. There is no second one.”</blockquote><p className="muted small" style={{ marginTop: 12 }}>Dhokra caster, Bastar</p><Link className="link" to="/our-story">Read our story</Link></div>
    </div></section>}

    <section style={{ paddingTop: 0 }}><div className="wrap"><div className="sec-h"><h2>Why clients choose us</h2></div><WhyGrid /></div></section>

    <section className="band"><div className="wrap split">
      <div><h2>Shipped to your door, wherever it is</h2><p className="lede" style={{ margin: '16px 0 26px' }}>Insured express delivery to the Gulf, Europe, North America, Australia and Japan. Duties and taxes are explained before you pay.</p>
        <div className="zones">{zones.map(([k, z]) => <div key={k}><span>{z.name}</span><span>{z.days[0]}–{z.days[1]} working days</span><span>{k === 'IN' ? `Free above ${money(config.freeShipIN)}` : `from ${money(z.base)}`}</span></div>)}</div>
        <p style={{ marginTop: 22 }}><Link className="link" to="/shipping">Shipping and duties</Link></p></div>
      <ShipCalc />
    </div></section>

    <section><div className="wrap split rev">
      <div className="frame" style={{ aspectRatio: '5/4' }}>{by('moradabad-urli') && <Art product={by('moradabad-urli')} v={2} />}</div>
      <div><h2>For hotels, designers and retailers</h2><p className="lede" style={{ margin: '16px 0 22px' }}>Wholesale pricing, custom finishes and consolidated export shipping for businesses in India and abroad.</p>
        <div className="buyers" style={{ gridTemplateColumns: '1fr 1fr' }}><div><h3>Hospitality</h3><p>Lobbies, suites and restaurants.</p></div><div><h3>Interior studios</h3><p>Trade pricing and samples.</p></div><div><h3>Retail and concept stores</h3><p>Wholesale with low minimums.</p></div><div><h3>Corporate gifting</h3><p>Branded, packed and delivered.</p></div></div>
        <div className="row" style={{ marginTop: 28 }}><Link className="btn" to="/b2b">For businesses</Link><Link className="btn ghost" to="/export">Export enquiries</Link></div></div>
    </div></section>

    <section className="band"><div className="wrap"><div className="sec-h"><div><h2>From our clients</h2><p className="muted small">Placeholder testimonials: replace with real client reviews before launch.</p></div></div><div className="tri">
      <div className="quote"><p>“The platter arrived in London without a mark on it. The packing alone told me this was a serious house.”</p><span className="small muted">Client name, London</span></div>
      <div className="quote"><p>“We furnished forty suites with their brass and stone. Samples, timelines and paperwork were all handled properly.”</p><span className="small muted">Client name, hotel group, Dubai</span></div>
      <div className="quote"><p>“The pashmina is the softest thing I own. The certificate named the weaver, which meant a great deal.”</p><span className="small muted">Client name, Mumbai</span></div>
    </div></div></section>

    <section><div className="wrap"><div className="sec-h"><div><h2>In the studio</h2><p className="muted">Pieces as they arrive from the workshops. Tap one to see it in the shop.</p></div>{import.meta.env.VITE_INSTAGRAM && <a className="link" href={`https://www.instagram.com/${import.meta.env.VITE_INSTAGRAM.replace(/^@/, '')}/`} target="_blank" rel="noopener noreferrer">Follow @{import.meta.env.VITE_INSTAGRAM.replace(/^@/, '')} on Instagram</a>}</div>
      <div className="tiles">{['pietra-dura-platter', 'ajrakh-cushions', 'jaali-lantern', 'copper-kalash', 'kantha-quilt', 'bankura-horse'].map(by).filter(Boolean).map((p, i) => <Link key={p.slug} to={`/product/${p.slug}`} aria-label={p.name}><div className="frame"><Art product={p} v={i % 2 ? 1 : 2} decorative /></div></Link>)}</div></div></section>

    <Newsletter />
  </>);
}
