import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/Store.jsx';
import { api } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { useSeo } from '../lib/seo.js';
import Art from '../components/Art.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ShipCalc from '../components/ShipCalc.jsx';
import { PageHead } from '../components/Layout.jsx';
import { Field, useApiForm, FormMessage } from '../components/Form.jsx';
import { Loading } from '../components/States.jsx';
import { BigHand, BigBox, BigSeal, BigGlobe, BigShield, BigChat } from '../components/Icons.jsx';

const useCatalogue = () => { const { data } = useApi('/products'); const by = (s) => data?.find((p) => p.slug === s); return { products: data, by }; };
const Honeypot = () => <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />;

function useLeadForm(kind) {
  return useApiForm(async (d, form) => {
    const r = await api('/leads', { method: 'POST', body: { ...d, kind } });
    form.reset();
    return `Thank you${d.name ? ', ' + d.name.split(' ')[0] : ''}. Your enquiry reference is ${r.ref}. We reply within one working day.`;
  });
}

export function Story() {
  useSeo({ title: 'Our story', description: 'The artisans and crafts behind Kosha Atelier.' });
  const { by, products } = useCatalogue();
  if (!products) return <Loading />;
  return (<>
    <PageHead title="A house built on other people’s hands" lede="Kosha means treasury. We started it to give India’s master artisans the international stage their work has always deserved." crumbs={[['/', 'Home'], [null, 'Our story']]} />
    <section style={{ paddingTop: 0 }}><div className="wrap edit-hero"><div className="a frame arch" style={{ aspectRatio: '4/4.4' }}>{by('pietra-dura-platter') && <Art product={by('pietra-dura-platter')} v={1} decorative />}</div><div className="b"><blockquote>“A single platter holds several hundred pieces of stone, each cut to fit its place and no other.”</blockquote><p className="muted small" style={{ marginTop: 14 }}>Inlay master, Agra</p></div></div></section>
    <section style={{ paddingTop: 0 }}><div className="wrap split"><div><h2>Craftsmanship</h2><p className="lede" style={{ marginTop: 16 }}>We work with sixteen crafts from ten regions. Each is practised by families who have passed the skill down for generations, often in the same street their grandparents worked in.</p><p>We do not design around what machines can do. We ask artisans what their material is best at, and design from there.</p></div><div className="frame" style={{ aspectRatio: '5/4' }}>{by('pashmina-throw') && <Art product={by('pashmina-throw')} v={1} decorative />}</div></div></section>
    <section className="dark"><div className="wrap"><div className="sec-h"><h2>What we hold to</h2></div><div className="why">
      <div><h3>Authenticity</h3><p>Every piece is traceable to the workshop that made it. Heirloom pieces carry a signed certificate.</p></div>
      <div><h3>Heritage</h3><p>We document each craft's history and methods, and credit the artisans by cluster on every product page.</p></div>
      <div><h3>Design philosophy</h3><p>Fewer, better objects. Forms that let the material and the hand speak first.</p></div>
      <div><h3>Quality</h3><p>Two inspections for every piece, one at the workshop and one at our studio, before it is packed.</p></div>
      <div><h3>Attention to detail</h3><p>From the lining of a box to the fit of the carton insert, nothing is left to default.</p></div>
      <div><h3>Global vision</h3><p>We want these crafts in homes, hotels and galleries worldwide, on terms that pay the maker fairly.</p></div>
    </div></div></section>
    <section><div className="wrap"><div className="sec-h"><h2>How a piece reaches you</h2></div><div className="seq">
      {[['Commissioned', 'We place orders directly with the workshop and pay an advance.'], ['Made', 'Days to weeks by hand, depending on the craft.'], ['Inspected', 'Checked at the workshop and again at our studio.'], ['Delivered', 'Packed to travel and tracked to your door.']].map(([h, t], i) => <div key={h}><span className="num">{i + 1}</span><h3 style={{ margin: '12px 0 8px' }}>{h}</h3><p className="muted">{t}</p></div>)}</div></div></section>
    <section style={{ paddingTop: 0 }}><div className="wrap split rev"><div className="frame arch" style={{ maxWidth: 480 }}>{by('nilavilakku') && <Art product={by('nilavilakku')} v={2} decorative />}</div><div><h2>Visit the collection</h2><p className="lede" style={{ margin: '16px 0 26px' }}>Begin with a single material, or with the pieces our clients return for.</p><div className="row"><Link className="btn" to="/collections">Explore collections</Link><Link className="btn ghost" to="/shop?t=best">Best sellers</Link></div></div></div></section>
  </>);
}

export function B2B() {
  useSeo({ title: 'For businesses', description: 'Wholesale and trade pricing for hotels, interior designers, retailers and corporate gifting.' });
  const { by, products } = useCatalogue();
  const { data: cols } = useApi('/collections');
  const { config } = useStore();
  const [params] = useSearchParams();
  const f = useLeadForm('b2b');
  if (!products || !cols) return <Loading />;
  const about = params.get('about') && by(params.get('about'));
  return (<>
    <section className="dark" style={{ padding: 'clamp(72px,10vw,140px) 0' }}><div className="wrap split"><div><p className="muted">For businesses</p><h1>Trade with the makers, not a middleman</h1><p className="lede" style={{ margin: '22px 0 30px' }}>Wholesale pricing, custom finishes, private label packaging and consolidated shipping, for buyers in India and abroad.</p><div className="row"><a className="btn" href="#enquire">Request bulk pricing</a><Link className="btn ghost" to="/catalogue">View trade catalogue</Link></div></div><div className="frame arch" style={{ maxWidth: 460, justifySelf: 'end' }}>{by('nilavilakku') && <Art product={by('nilavilakku')} v={2} decorative />}</div></div></section>
    <section><div className="wrap"><div className="sec-h"><h2>Who we work with</h2></div><div className="buyers">
      <div><h3>Hotels and resorts</h3><p>Suite, lobby and F&amp;B décor, delivered to project schedules.</p></div><div><h3>Interior designers</h3><p>Trade pricing, samples and custom sizes for your projects.</p></div>
      <div><h3>Retailers and galleries</h3><p>Wholesale with sensible minimums and reorder support.</p></div><div><h3>Corporate gifting</h3><p>Branded boxes, messages and multi-address delivery.</p></div></div></div></section>
    <section className="band"><div className="wrap"><div className="sec-h"><div><h2>Minimums and lead times</h2><p className="muted">Per design. Mixed orders across a collection are welcome.</p></div></div>
      <div className="tscroll"><table className="tbl"><thead><tr><th>Collection</th><th>Minimum order</th><th>Lead time</th><th>Customisable</th></tr></thead><tbody>
        {cols.map((c) => { const it = products.filter((p) => p.collectionSlug === c.slug); if (!it.length) return null; const m = it.map((p) => p.moq); return <tr key={c.slug}><td>{c.name}</td><td>{Math.min(...m)}{Math.min(...m) !== Math.max(...m) ? ` to ${Math.max(...m)}` : ''} units</td><td>{it.some((p) => p.leadDays) ? '3 to 6 weeks' : '2 to 4 weeks'}</td><td>Finish, size, packaging</td></tr>; })}
      </tbody></table></div><p className="small muted" style={{ marginTop: 16 }}>Bulk pricing is tiered by volume and quoted per enquiry, usually within two working days.</p></div></section>
    <section><div className="wrap"><div className="sec-h"><h2>How trade orders work</h2></div><div className="seq">
      {[['Enquire', 'Tell us the pieces, quantities and deadline.'], ['Quote and sample', 'Tiered pricing within two working days; samples on request.'], ['Produce', 'Advance paid, production tracked with photo updates.'], ['Deliver', 'Inspected, packed and shipped to one or many addresses.']].map(([h, t], i) => <div key={h}><span className="num">{i + 1}</span><h3 style={{ margin: '12px 0 8px' }}>{h}</h3><p className="muted">{t}</p></div>)}</div></div></section>
    <section className="band" id="enquire"><div className="wrap split" style={{ alignItems: 'start' }}><div><h2>Business enquiry</h2><p className="lede" style={{ margin: '16px 0 22px' }}>A member of our trade team will reply within one working day.</p><p className="muted">Prefer a catalogue first? <Link className="link" to="/catalogue">View the trade catalogue</Link>.</p></div>
      <form className="f" onSubmit={f.onSubmit} noValidate style={{ position: 'relative' }}><Honeypot />
        <div className="f2"><Field name="name" label="Your name" autoComplete="name" errors={f.errors} /><Field name="company" label="Company" autoComplete="organization" errors={f.errors} /></div>
        <div className="f2"><Field name="email" label="Work email" type="email" autoComplete="email" errors={f.errors} /><Field name="phone" label="Phone or WhatsApp" type="tel" autoComplete="tel" errors={f.errors} /></div>
        <div className="f2"><Field name="btype" label="Business type" type="select" options={['Hotel or hospitality', 'Interior design studio', 'Retailer or gallery', 'Corporate gifting', 'Distributor or importer', 'Other']} errors={f.errors} /><Field name="country" label="Country" type="select" options={config?.countries.map((c) => [c.code, c.name]) || []} defaultValue="IN" errors={f.errors} /></div>
        <div className="f2"><Field name="need" label="I would like" type="select" options={['Bulk pricing', 'Trade catalogue', 'Custom product', 'Samples']} errors={f.errors} /><Field name="qty" label="Approximate quantity" type="number" min="1" req={false} errors={f.errors} /></div>
        <Field name="products" label="Products of interest" req={false} defaultValue={about ? about.name : ''} errors={f.errors} />
        <Field name="message" label="Requirements, customisation, timeline" type="textarea" errors={f.errors} />
        <label className="check"><input type="checkbox" name="consent" required /> I agree to be contacted about this enquiry.</label>{f.errors.consent && <span className="err">{f.errors.consent}</span>}
        <button className="btn" type="submit" disabled={f.busy}>{f.busy ? 'Sending…' : 'Send enquiry'}</button><FormMessage message={f.message} /></form></div></section>
  </>);
}

export function Export() {
  useSeo({ title: 'Export', description: 'Export-ready Indian handicrafts for importers, distributors and retailers abroad.' });
  const { by, products } = useCatalogue();
  const { config, country } = useStore();
  const f = useLeadForm('export');
  if (!products) return <Loading />;
  return (<>
    <section style={{ padding: 'clamp(56px,8vw,112px) 0 0' }}><div className="wrap edit-hero"><div className="b" style={{ gridColumn: '1/6', paddingBottom: 0 }}><p className="muted">Export</p><h1>Ready for the world’s shelves</h1><p className="lede" style={{ margin: '22px 0 30px' }}>Export-grade packing, documentation and quality control for importers, distributors and retailers abroad.</p><div className="row"><a className="btn" href="#quote">Request a quotation</a><Link className="btn ghost" to="/catalogue">View catalogue</Link></div></div><div className="a frame" style={{ gridColumn: '6/13', aspectRatio: '16/11' }}>{by('pietra-dura-platter') && <Art product={by('pietra-dura-platter')} v={2} decorative />}</div></div></section>
    <section><div className="wrap"><div className="sec-h"><h2>Export capability</h2></div><div className="why">
      <div><BigHand /><h3>International sourcing</h3><p>One point of contact for sixteen crafts across ten regions, consolidated into a single shipment.</p></div>
      <div><BigBox /><h3>Packaging standards</h3><p>Drop-tested double-wall cartons, fitted inserts, and ISPM-15 heat-treated wooden crates for heavy stone and metal.</p></div>
      <div><BigSeal /><h3>Quality assurance</h3><p>Pre-shipment inspection against an agreed sample, with photo reports. Third-party inspection welcome.</p></div>
      <div><BigGlobe /><h3>Shipping and Incoterms</h3><p>EXW, FOB, CIF and DAP quoted by air or sea freight, LCL or FCL.</p></div>
      <div><BigShield /><h3>Documentation</h3><p>Commercial invoice, packing list, certificate of origin and fumigation certificate where required.</p></div>
      <div><BigChat /><h3>Dedicated export desk</h3><p>A named account manager who works in your time zone for the length of the order.</p></div>
    </div></div></section>
    <section className="band"><div className="wrap"><div className="sec-h"><div><h2>Export-ready pieces</h2><p className="muted">Tested for transit and available in volume.</p></div><Link className="link" to="/catalogue">Full catalogue</Link></div><div className="grid">{products.filter((p) => p.exportReady && !p.tags.includes('heirloom')).slice(0, 8).map((p) => <ProductCard key={p.slug} p={p} />)}</div></div></section>
    <section id="quote"><div className="wrap split" style={{ alignItems: 'start' }}><div><h2>International enquiry</h2><p className="lede" style={{ margin: '16px 0 22px' }}>Tell us what you need and where it is going. We reply with a quotation, including freight, within two working days.</p><p className="muted small">Quotations are indicative until confirmed with a proforma invoice.</p></div>
      <form className="f" onSubmit={f.onSubmit} noValidate style={{ position: 'relative' }}><Honeypot />
        <div className="f2"><Field name="name" label="Your name" autoComplete="name" errors={f.errors} /><Field name="company" label="Company" autoComplete="organization" errors={f.errors} /></div>
        <div className="f2"><Field name="email" label="Email" type="email" autoComplete="email" errors={f.errors} /><Field name="phone" label="Phone or WhatsApp" type="tel" autoComplete="tel" errors={f.errors} /></div>
        <div className="f2"><Field name="country" label="Destination country" type="select" options={config?.countries.map((c) => [c.code, c.name]) || []} defaultValue={country === 'IN' ? 'US' : country} errors={f.errors} /><Field name="incoterm" label="Preferred terms" type="select" options={['Not sure yet', 'EXW', 'FOB', 'CIF', 'DAP']} errors={f.errors} /></div>
        <div className="f2"><Field name="mode" label="Freight" type="select" options={['Not sure yet', 'Air freight', 'Sea freight, LCL', 'Sea freight, FCL']} errors={f.errors} /><Field name="value" label="Approximate order value (USD)" type="number" min="0" req={false} errors={f.errors} /></div>
        <Field name="message" label="Products, quantities and timeline" type="textarea" errors={f.errors} />
        <label className="check"><input type="checkbox" name="catalogue" /> Also send me the trade catalogue</label>
        <label className="check"><input type="checkbox" name="consent" required /> I agree to be contacted about this enquiry.</label>{f.errors.consent && <span className="err">{f.errors.consent}</span>}
        <button className="btn" type="submit" disabled={f.busy}>{f.busy ? 'Sending…' : 'Request quotation'}</button><FormMessage message={f.message} /></form></div></section>
  </>);
}

export function Catalogue() {
  useSeo({ title: 'Trade catalogue', description: 'Specifications and minimum order quantities for every Kosha Atelier piece.' });
  const { products } = useCatalogue(); const { data: cols } = useApi('/collections'); const { money } = useStore();
  if (!products || !cols) return <Loading />;
  return (<>
    <PageHead title="Trade catalogue" lede="Every piece with specifications and minimum order quantities. Trade prices are quoted on enquiry." crumbs={[['/', 'Home'], ['/b2b', 'B2B'], [null, 'Catalogue']]} />
    <section style={{ paddingTop: 0 }}><div className="wrap"><p className="small muted noprint">To keep a copy, use your browser’s print option and choose Save as PDF.</p>
      {cols.map((c) => { const items = products.filter((p) => p.collectionSlug === c.slug); if (!items.length) return null; return <div key={c.slug}><h2 style={{ margin: '40px 0 10px' }}>{c.name}</h2>{items.map((p) => <div key={p.slug} className="cat-item"><Link className="frame" to={`/product/${p.slug}`}><Art product={p} decorative /></Link><div><h3>{p.name}</h3><p className="small muted" style={{ margin: '4px 0 10px' }}>{p.craft}, {p.region}</p><dl className="facts small"><dt>Material</dt><dd>{p.material}</dd><dt>Dimensions</dt><dd>{p.dims}</dd><dt>Weight</dt><dd>{p.weight} kg</dd><dt>Minimum order</dt><dd>{p.moq} units</dd><dt>Retail price</dt><dd>{money(p.price)}</dd></dl></div></div>)}</div>; })}
      <div className="row noprint" style={{ marginTop: 36 }}><Link className="btn" to="/b2b#enquire">Request trade pricing</Link><Link className="btn ghost" to="/export#quote">Export quotation</Link></div></div></section>
  </>);
}

export function Contact() {
  useSeo({ title: 'Contact', description: 'Contact the Kosha Atelier studio.' });
  const [params] = useSearchParams(); const { products } = useStore();
  const about = params.get('about'), order = params.get('order');
  const f = useLeadForm('contact');
  return (<>
    <PageHead title="Contact the studio" lede="Questions about a piece, an order or a commission. A member of the studio replies within one working day." crumbs={[['/', 'Home'], [null, 'Contact']]} />
    <section style={{ paddingTop: 0 }}><div className="wrap split" style={{ alignItems: 'start' }}>
      <form className="f" onSubmit={f.onSubmit} noValidate style={{ position: 'relative' }}><Honeypot />
        <div className="f2"><Field name="name" label="Name" autoComplete="name" errors={f.errors} /><Field name="email" label="Email" type="email" autoComplete="email" errors={f.errors} /></div>
        <div className="f2"><Field name="topic" label="Topic" type="select" options={['A product', 'An order', 'Shipping and duties', 'Returns', 'Commissions', 'Press', 'Something else']} defaultValue={order ? 'An order' : about ? 'A product' : 'A product'} errors={f.errors} /><Field name="order" label="Order number" req={false} defaultValue={order || ''} errors={f.errors} /></div>
        <Field name="message" label="Message" type="textarea" defaultValue={about ? `I would like to know more about the ${products[about]?.name || about}.` : ''} errors={f.errors} />
        <button className="btn" type="submit" disabled={f.busy}>{f.busy ? 'Sending…' : 'Send message'}</button><FormMessage message={f.message} /></form>
      <div><h3>Studio</h3><p className="muted" style={{ marginTop: 8 }}>{import.meta.env.VITE_STUDIO_ADDRESS || 'Studio address to be added'}<br />Mon to Sat, 10:00 to 19:00 IST</p>
        {(import.meta.env.VITE_CONTACT_EMAIL || import.meta.env.VITE_CONTACT_PHONE) && <><h3 style={{ marginTop: 28 }}>Email and phone</h3><p className="muted" style={{ marginTop: 8 }}>{import.meta.env.VITE_CONTACT_EMAIL && <a className="link" href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`}>{import.meta.env.VITE_CONTACT_EMAIL}</a>}<br />{import.meta.env.VITE_CONTACT_PHONE}</p></>}
        <h3 style={{ marginTop: 28 }}>Common questions</h3><div style={{ marginTop: 10 }}>
          <details><summary>Do you ship internationally?</summary><div className="body">Yes, insured express to 20 countries. See <Link className="link" to="/shipping">shipping and duties</Link>.</div></details>
          <details><summary>Can I see a piece before buying?</summary><div className="body">We can arrange a video call from the studio. Mention the piece in your message.</div></details>
          <details><summary>Do you take commissions?</summary><div className="body">Yes, for sizes, finishes and quantities beyond the catalogue. Use the <Link className="link" to="/b2b#enquire">business enquiry form</Link>.</div></details></div></div>
    </div></section>
  </>);
}

export function Wishlist() {
  useSeo({ title: 'Wishlist' });
  const { wish, products } = useStore();
  const list = wish.map((s) => products[s]).filter(Boolean);
  return (<>
    <PageHead title="Wishlist" crumbs={[['/', 'Home'], [null, 'Wishlist']]} />
    <section style={{ paddingTop: 0 }}><div className="wrap">{wish.length ? (list.length ? <div className="grid">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div> : <Loading />) : <div className="empty"><h3>Nothing saved yet</h3><p className="muted">Tap the heart on any piece to keep it here.</p><Link className="btn ghost" to="/shop">Browse the shop</Link></div>}</div></section>
  </>);
}

export function Shipping() {
  useSeo({ title: 'Shipping and duties' });
  const { config, money } = useStore();
  if (!config) return <Loading />;
  return (<>
    <PageHead title="Shipping and duties" crumbs={[['/', 'Home'], [null, 'Shipping']]} />
    <section style={{ paddingTop: 0 }}><div className="wrap split" style={{ alignItems: 'start' }}><div>
      <h3>India</h3><p className="muted" style={{ marginTop: 8 }}>Free standard delivery above {money(config.freeShipIN, 'INR')}; {money(config.zones.IN.base, 'INR')} below. Express {money(config.zones.IN.expressFee, 'INR')} extra. Prices include GST.</p>
      <h3 style={{ marginTop: 28 }}>International</h3><div className="zones" style={{ marginTop: 12 }}>{['A', 'B', 'C'].map((k) => { const z = config.zones[k]; return <div key={k}><span>{z.name}</span><span>{z.days[0]}–{z.days[1]} days</span><span>{money(z.base)} + {money(z.extra)} per extra piece</span></div>; })}</div>
      <h3 style={{ marginTop: 28 }}>Duties and taxes</h3><p className="muted" style={{ marginTop: 8 }}>Export orders are zero-rated for Indian GST. Your country may charge import duty and sales tax or VAT, which the courier collects on delivery. We declare the full value on the commercial invoice as required by law.</p></div>
      <ShipCalc /></div></section>
  </>);
}

const Policy = ({ title, children }) => { useSeo({ title }); return <><PageHead title={title} crumbs={[['/', 'Home'], [null, title]]} /><section style={{ paddingTop: 0 }}><div className="wrap" style={{ maxWidth: 760 }}>{children}</div></section></>; };
export const Returns = () => <Policy title="Returns and refunds">
  <p>Return unused pieces within 14 days of delivery, in their original packaging. Write to us with your order number and we will arrange collection in India, or send return instructions for international orders.</p>
  <p>Refunds go back to the original payment method within 7 working days of the piece reaching our studio. Original shipping and any import duties are not refundable.</p>
  <p>Made-to-order and personalised pieces are final sale unless they arrive damaged. If a piece arrives damaged, report it within 48 hours with photographs of the piece and packaging and we will replace or refund it in full.</p>
  <p className="small muted">Draft policy text: have it reviewed before launch.</p><Link className="btn ghost" to="/contact">Start a return</Link></Policy>;
export const Privacy = () => <Policy title="Privacy policy"><p>Draft: add your privacy policy here before launch. It should cover the data collected at checkout, in enquiry forms and the newsletter, how payment data is handled by Razorpay, cookies, and how customers can request deletion.</p></Policy>;
export const Terms = () => <Policy title="Terms of sale"><p>Draft: add your terms of sale here before launch, including pricing, taxes, delivery, risk of loss, returns, made-to-order items and governing law.</p></Policy>;
