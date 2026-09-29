import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

const LS = {
  get(k, d) { try { const v = localStorage.getItem('kosha:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('kosha:' + k, JSON.stringify(v)); } catch { /* storage full or blocked */ } }
};
function usePersisted(key, initial) {
  const [v, setV] = useState(() => LS.get(key, initial));
  useEffect(() => { LS.set(key, v); }, [key, v]);
  return [v, setV];
}

export function StoreProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState('');
  const [user, setUser] = useState(undefined); // undefined = loading
  const [cart, setCart] = usePersisted('cart', []);
  const [wish, setWish] = usePersisted('wish', []);
  const [recent, setRecent] = usePersisted('recent', []);
  const [country, setCountry] = usePersisted('country', 'IN');
  const [currency, setCurrency] = usePersisted('currency', 'INR');
  const [panel, setPanel] = useState(null);
  const [modal, setModal] = useState(null); // {title, body}
  const [toastMsg, setToastMsg] = useState('');
  const [products, setProducts] = useState({}); // slug -> product cache
  const toastTimer = useRef();

  useEffect(() => {
    api('/config').then(setConfig).catch((e) => setConfigError(e.message));
    api('/auth/me').then((r) => setUser(r.user)).catch(() => setUser(null));
  }, []);

  const toast = useCallback((m) => {
    setToastMsg(m); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  }, []);

  const cacheProducts = useCallback((list) => {
    if (!list?.length) return;
    setProducts((prev) => { const n = { ...prev }; list.forEach((p) => { n[p.slug] = p; }); return n; });
  }, []);

  // Keep cart/wishlist product data fresh
  const needed = useMemo(() => [...new Set([...cart.map((l) => l.slug), ...wish])].filter((s) => !products[s]), [cart, wish, products]);
  useEffect(() => {
    if (!needed.length) return;
    api('/products?slugs=' + encodeURIComponent(needed.join(','))).then((list) => {
      cacheProducts(list);
      const found = new Set(list.map((p) => p.slug));
      // drop items that no longer exist
      setCart((c) => c.filter((l) => found.has(l.slug) || !needed.includes(l.slug)));
      setWish((w) => w.filter((s) => found.has(s) || !needed.includes(s)));
    }).catch(() => {});
  }, [needed.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const money = useCallback((n, cur = currency) => {
    const c = config?.currencies?.[cur] || { rate: 1, locale: 'en-IN' };
    const code = config?.currencies?.[cur] ? cur : 'INR';
    return new Intl.NumberFormat(c.locale, { style: 'currency', currency: code, maximumFractionDigits: 0 }).format((n || 0) * c.rate);
  }, [config, currency]);

  const countryInfo = useCallback((code = country) => config?.countries?.find((c) => c.code === code) || { code: 'IN', name: 'India', zone: 'IN', currency: 'INR' }, [config, country]);

  const maxFor = (p) => (p.leadDays > 0 ? 20 : Math.min(p.stock, 20));
  const addToCart = useCallback((p, qty = 1) => {
    cacheProducts([p]);
    const line = cart.find((l) => l.slug === p.slug);
    const cur = line ? line.qty : 0;
    const n = Math.min(maxFor(p), cur + qty);
    if (n <= cur) { toast('That is all we have in stock.'); return false; }
    setCart((c) => (c.some((l) => l.slug === p.slug) ? c.map((l) => (l.slug === p.slug ? { ...l, qty: n } : l)) : [...c, { slug: p.slug, qty: n }]));
    setPanel('cart');
    return true;
  }, [cart, cacheProducts, toast, setCart]);
  const setQty = useCallback((slug, qty) => setCart((c) => (qty < 1 ? c.filter((l) => l.slug !== slug) : c.map((l) => (l.slug === slug ? { ...l, qty: Math.min(qty, products[slug] ? maxFor(products[slug]) : 20) } : l)))), [products]);
  const toggleWish = useCallback((slug) => {
    const on = !wish.includes(slug);
    setWish((w) => (on ? [...w.filter((s) => s !== slug), slug] : w.filter((s) => s !== slug)));
    toast(on ? 'Saved to your wishlist' : 'Removed from your wishlist');
  }, [wish, setWish, toast]);
  const markViewed = useCallback((slug) => setRecent((r) => [slug, ...r.filter((s) => s !== slug)].slice(0, 8)), [setRecent]);

  const cartLines = cart.map((l) => ({ ...l, product: products[l.slug] })).filter((l) => l.product);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const cartSubtotal = cartLines.reduce((s, l) => s + l.product.price * l.qty, 0);

  const value = {
    config, configError, user, setUser, cart, setCart, cartLines, cartCount, cartSubtotal, addToCart, setQty,
    wish, toggleWish, recent, markViewed, country, setCountry, currency, setCurrency, countryInfo, money,
    panel, setPanel, modal, setModal, toast, toastMsg, products, cacheProducts
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
