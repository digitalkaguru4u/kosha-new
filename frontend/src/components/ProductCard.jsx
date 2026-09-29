import { Link } from 'react-router-dom';
import Art from './Art.jsx';
import { IconHeart } from './Icons.jsx';
import { useStore } from '../context/Store.jsx';
import { availability } from '../lib/format.js';

export default function ProductCard({ p }) {
  const { wish, toggleWish, addToCart, money } = useStore();
  const w = wish.includes(p.slug);
  const a = availability(p);
  const tag = p.tags.includes('heirloom') ? <span className="tag h">Heirloom</span> : p.tags.includes('new') ? <span className="tag">New</span> : p.leadDays > 0 ? <span className="tag">Made to order</span> : null;
  return (
    <article className="pcard">
      {tag}
      <button className="wish" aria-pressed={w} aria-label={`${w ? 'Remove from' : 'Save to'} wishlist: ${p.name}`} onClick={() => toggleWish(p.slug)}><IconHeart /></button>
      <Link className="frame" to={`/product/${p.slug}`}>
        <Art product={p} v={0} />
        <span className="alt"><Art product={p} v={2} decorative /></span>
      </Link>
      {a.canBuy && <button className="quick" onClick={() => addToCart(p, 1)}>Add to cart</button>}
      <h3><Link to={`/product/${p.slug}`}>{p.name}</Link></h3>
      <div className="meta">{p.region}</div>
      <div className="price">{money(p.price)}</div>
    </article>
  );
}
