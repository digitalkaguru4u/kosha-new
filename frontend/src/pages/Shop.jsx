import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/Store.jsx';
import { useApi } from '../lib/useApi.js';
import { useSeo } from '../lib/seo.js';
import ProductCard from '../components/ProductCard.jsx';
import Art from '../components/Art.jsx';
import { PageHead } from '../components/Layout.jsx';
import { Loading, ErrorState } from '../components/States.jsx';
import { IconClose } from '../components/Icons.jsx';

const PRICES = [['', 'Any price'], ['0-10000', 'Under ₹10,000'], ['10000-25000', '₹10,000 to ₹25,000'], ['25000-', 'Above ₹25,000']];

function Filters({ params, set, cols, idp }) {
  const list = (k) => (params.get(k) || '').split(',').filter(Boolean);
  const toggle = (k, v) => { const s = new Set(list(k)); s.has(v) ? s.delete(v) : s.add(v); set(k, [...s].join(',')); };
  return (<>
    <div className="fgroup"><h4>Collection</h4>{cols.map((c) => <label key={c.slug}><input type="checkbox" checked={list('c').includes(c.slug)} onChange={() => toggle('c', c.slug)} /> {c.name}</label>)}</div>
    <div className="fgroup"><h4>Edit</h4>{[['heirloom', 'The Heirloom Edit'], ['new', 'New arrivals'], ['best', 'Best sellers']].map(([v, l]) => <label key={v}><input type="checkbox" checked={list('t').includes(v)} onChange={() => toggle('t', v)} /> {l}</label>)}</div>
    <div className="fgroup"><h4>Price</h4>{PRICES.map(([v, l]) => <label key={v}><input type="radio" name={'price' + idp} checked={(params.get('p') || '') === v} onChange={() => set('p', v)} /> {l}</label>)}</div>
    <div className="fgroup"><h4>Availability</h4><label><input type="checkbox" checked={params.get('a') === 'stock'} onChange={(e) => set('a', e.target.checked ? 'stock' : '')} /> Ready to ship</label></div>
    <div className="fgroup"><button className="link" onClick={() => set(null)}>Clear all filters</button></div>
  </>);
}

export default function Shop({ preset }) {
  const [params, setParams] = useSearchParams();
  const { panel, setPanel } = useStore();
  const { data: cols } = useApi('/collections');
  const set = (k, v) => {
    if (k === null) return setParams(new URLSearchParams(), { replace: true });
    const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); setParams(n, { replace: true });
  };
  const c = params.get('c'), t = preset === 'new' ? ['new', params.get('t')].filter(Boolean).join(',') : params.get('t'), p = params.get('p'), q = params.get('q');
  const sort = params.get('s') || (preset === 'new' ? 'new' : 'feat');
  const api = new URLSearchParams();
  if (c) api.set('collection', c); if (t) api.set('tag', t); if (q) api.set('q', q); if (params.get('a') === 'stock') api.set('stock', '1'); api.set('sort', sort);
  if (p) { const [a, b] = p.split('-'); if (a) api.set('min', a); if (b) api.set('max', b); }
  const { data: list, error, reload } = useApi('/products?' + api.toString());

  const oneCol = cols && c && !c.includes(',') ? cols.find((x) => x.slug === c) : null;
  const title = preset === 'new' ? 'New arrivals' : oneCol ? oneCol.name : t === 'heirloom' ? 'The Heirloom Edit' : q ? `Results for “${q}”` : 'Shop all';
  useSeo({ title, description: oneCol?.desc || 'Shop handmade brass, marble, wood, textiles and clay from India.' });

  return (<>
    <PageHead title={title} lede={oneCol?.desc} crumbs={[['/', 'Home'], [null, 'Shop']]} />
    <section style={{ paddingTop: 0 }}><div className="wrap shop">
      <aside className="filters" aria-label="Filters">{cols && <Filters params={params} set={set} cols={cols} idp="d" />}</aside>
      <div>
        <div className="toolbar"><button className="fbtn" onClick={() => setPanel('filters')}>Filter</button><span className="muted">{list ? `${list.length} ${list.length === 1 ? 'piece' : 'pieces'}` : ''}</span>
          <label><span className="sr">Sort by</span><select value={sort} onChange={(e) => set('s', e.target.value)}>{[['feat', 'Featured'], ['new', 'Newest'], ['low', 'Price, low to high'], ['high', 'Price, high to low']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label></div>
        {error ? <ErrorState error={error} retry={reload} /> : !list ? <Loading /> : list.length
          ? <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))' }}>{list.map((x) => <ProductCard key={x.slug} p={x} />)}</div>
          : <div className="empty"><h3>No pieces match these filters</h3><p className="muted">Remove a filter or browse the full collection.</p><button className="btn ghost" onClick={() => set(null)}>Clear filters</button></div>}
      </div>
    </div></section>
    <aside className={'panel bottom' + (panel === 'filters' ? ' open' : '')} aria-label="Filters" aria-hidden={panel !== 'filters'}>
      <div className="phd"><h2>Filter</h2><button className="x" onClick={() => setPanel(null)} aria-label="Close filters"><IconClose /></button></div>
      <div className="pbd">{cols && <Filters params={params} set={set} cols={cols} idp="m" />}</div>
      <div className="pft"><button className="btn block" onClick={() => setPanel(null)}>Show {list ? list.length : ''} results</button></div>
    </aside>
  </>);
}

export function Collections() {
  useSeo({ title: 'Collections', description: 'Six collections, each built around one material and the region that has mastered it.' });
  const { data: cols } = useApi('/collections');
  const { data: products } = useApi('/products');
  if (!cols || !products) return <Loading />;
  const by = (s) => products.find((p) => p.slug === s);
  return (<>
    <PageHead title="Collections" lede="Each collection follows one material from the region that has mastered it." crumbs={[['/', 'Home'], [null, 'Collections']]} />
    <section style={{ paddingTop: 0 }}><div className="wrap">
      {cols.map((c, i) => { const items = products.filter((p) => p.collectionSlug === c.slug); const hero = by(c.heroSlug) || items[0]; return (
        <div key={c.slug} className={'split' + (i % 2 ? ' rev' : '')} style={{ padding: 'clamp(28px,4vw,56px) 0', borderTop: '1px solid var(--line)' }}>
          <Link className="frame arch" style={{ maxWidth: 460 }} to={`/shop?c=${c.slug}`}>{hero && <Art product={hero} v={i % 3} decorative />}</Link>
          <div><h2>{c.name}</h2><p className="lede" style={{ margin: '14px 0 22px' }}>{c.desc}</p><p className="muted">{items.map((p) => p.name).join(', ')}</p><Link className="btn ghost" to={`/shop?c=${c.slug}`}>Shop {c.name.toLowerCase()}</Link></div>
        </div>); })}
      <div className="split" style={{ padding: 'clamp(28px,4vw,56px) 0', borderTop: '1px solid var(--line)' }}>
        <div className="frame arch" style={{ maxWidth: 460 }}>{by('pashmina-throw') && <Art product={by('pashmina-throw')} v={2} decorative />}</div>
        <div><h2>The Heirloom Edit</h2><p className="lede" style={{ margin: '14px 0 22px' }}>Our rarest pieces, each with a signed certificate of origin.</p><Link className="btn" to="/shop?t=heirloom">View the edit</Link></div></div>
    </div></section>
  </>);
}
