import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useStore } from './context/Store.jsx';
import { Header, Footer, TabBar, Overlays } from './components/Layout.jsx';
import { Loading } from './components/States.jsx';
import Home from './pages/Home.jsx';
import Shop, { Collections } from './pages/Shop.jsx';
import Product from './pages/Product.jsx';
import Checkout, { Cart } from './pages/Checkout.jsx';
import { OrderConfirmation, Track } from './pages/Orders.jsx';
import Account from './pages/Account.jsx';
import { Story, B2B, Export, Catalogue, Contact, Wishlist, Shipping, Returns, Privacy, Terms } from './pages/Content.jsx';
import NotFound from './pages/NotFound.jsx';

const Admin = lazy(() => import('./admin/Admin.jsx'));

/** Scroll to top on navigation, or to #anchor once the page has rendered it. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); return; }
    let tries = 0;
    const t = setInterval(() => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el || ++tries > 30) { clearInterval(t); el?.scrollIntoView(); }
    }, 60);
    return () => clearInterval(t);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { configError } = useStore();
  return (<>
    <a className="sr" href="#main">Skip to content</a>
    <ScrollManager />
    <Header />
    <main id="main" tabIndex={-1}>
      {configError ? <div className="wrap"><div className="empty"><h3>We could not reach the store</h3><p className="muted">{configError}</p><button className="btn ghost" onClick={() => location.reload()}>Try again</button></div></div> :
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/new" element={<Shop preset="new" />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:number" element={<OrderConfirmation />} />
          <Route path="/track" element={<Track />} />
          <Route path="/account" element={<Account />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/our-story" element={<Story />} />
          <Route path="/b2b" element={<B2B />} />
          <Route path="/export" element={<Export />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>}
    </main>
    <Footer />
    <TabBar />
    <Overlays />
  </>);
}
