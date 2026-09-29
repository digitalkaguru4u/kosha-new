// End-to-end API test. Needs a MongoDB (or wire-compatible) server at TEST_MONGODB_URI.
// It uses a separate database, starts the API twice (test-payment mode and live-Razorpay mode
// against a local mock gateway), and exercises every public and admin flow.
import { spawn } from 'node:child_process';
import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MONGO = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/kosha_test';
let passed = 0; let failed = 0;
const ok = (cond, name, extra) => { if (cond) { passed++; console.log('  ✓', name); } else { failed++; console.log('  ✗', name, extra ?? ''); } };

function startServer(port, extraEnv) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, ['src/server.js'], { cwd: root, env: { ...process.env, PORT: String(port), MONGODB_URI: MONGO, JWT_SECRET: 'test-secret-0123456789abcdef', ADMIN_NOTIFY_EMAIL: 'studio@kosha.example', SMTP_HOST: '', RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', RAZORPAY_WEBHOOK_SECRET: '', ...extraEnv } });
    let out = '';
    p.stdout.on('data', (d) => { out += d; if (out.includes('API listening')) resolve(p); });
    p.stderr.on('data', (d) => { out += d; });
    p.on('exit', (c) => reject(new Error('server exited ' + c + '\n' + out)));
    setTimeout(() => reject(new Error('server start timeout\n' + out)), 15000);
  });
}

function client(base) {
  let cookie = '';
  const call = async (method, url, body, { raw, headers = {}, ajax = true } = {}) => {
    const h = { ...headers };
    if (ajax) h['X-Requested-With'] = 'fetch';
    if (cookie) h.Cookie = cookie;
    if (body !== undefined && !raw) h['Content-Type'] = 'application/json';
    const r = await fetch(base + url, { method, headers: h, body: raw ? body : body === undefined ? undefined : JSON.stringify(body) });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    const ct = r.headers.get('content-type') || '';
    return { status: r.status, body: ct.includes('json') ? await r.json() : await r.text(), headers: r.headers };
  };
  return { get: (u, o) => call('GET', u, undefined, o), post: (u, b, o) => call('POST', u, b ?? {}, o), put: (u, b) => call('PUT', u, b), patch: (u, b) => call('PATCH', u, b), del: (u) => call('DELETE', u), raw: call, reset: () => { cookie = ''; } };
}

// Mock Razorpay REST API
const mockOrders = [];
const mockRefunds = [];
const gateway = http.createServer((req, res) => {
  let b = ''; req.on('data', (d) => { b += d; }); req.on('end', () => {
    const auth = Buffer.from((req.headers.authorization || '').split(' ')[1] || '', 'base64').toString();
    if (auth !== 'rzp_test_key:rzp_test_secret') { res.writeHead(401); return res.end('{}'); }
    if (req.url === '/v1/orders') { const body = JSON.parse(b); const o = { id: 'order_' + crypto.randomBytes(6).toString('hex'), ...body }; mockOrders.push(o); res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(o)); }
    const m = req.url.match(/^\/v1\/payments\/(.+)\/refund$/);
    if (m) { mockRefunds.push(m[1]); res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ id: 'rfnd_1', payment_id: m[1] })); }
    res.writeHead(404); res.end('{}');
  });
});

const addr = { name: 'Asha Rao', line1: '12 Marine Drive', city: 'Mumbai', state: 'Maharashtra', zip: '400020', country: 'IN' };
const contact = { email: 'asha@example.com', phone: '+91 98200 00000' };

async function main() {
  await mongoose.connect(MONGO);
  await mongoose.connection.dropDatabase();
  // seed via the real seed script
  await new Promise((res, rej) => spawn(process.execPath, ['src/seed/seed.js'], { cwd: root, env: { ...process.env, MONGODB_URI: MONGO, ADMIN_EMAIL: 'admin@kosha.example', ADMIN_PASSWORD: 'AdminPass!2026' }, stdio: 'ignore' }).on('exit', (c) => (c === 0 ? res() : rej(new Error('seed failed')))));
  const Product = mongoose.connection.collection('products');
  const Orders = mongoose.connection.collection('orders');
  const stockOf = async (slug) => (await Product.findOne({ slug })).stock;

  /* ---------- Run 1: test-payment mode ---------- */
  console.log('\nRun 1: test-payment mode');
  const s1 = await startServer(5391, {});
  const A = client('http://127.0.0.1:5391');
  try {
    let r = await A.get('/api/health'); ok(r.body.ok === true, 'health');
    r = await A.get('/api/config'); ok(r.body.paymentsLive === false && r.body.countries.length === 21 && r.body.stages.length === 7, 'config (test mode, 21 countries, 7 stages)');
    r = await A.get('/api/collections'); ok(r.body.length === 6 && r.body.find((c) => c.slug === 'metal').count === 4, 'collections with counts');
    r = await A.get('/api/products'); ok(r.body.length === 16, 'all products', r.body.length);
    r = await A.get('/api/products?collection=metal&max=10000'); ok(r.body.length === 2 && r.body.every((p) => p.collectionSlug === 'metal' && p.price < 10000), 'filter by collection + price');
    r = await A.get('/api/products?tag=heirloom'); ok(r.body.length === 4, 'filter by tag');
    r = await A.get('/api/products?stock=1'); ok(r.body.every((p) => p.leadDays === 0 && p.stock > 0) && r.body.length === 14, 'ready-to-ship filter');
    r = await A.get('/api/products?q=kashmir'); ok(r.body.length === 2, 'search by region');
    r = await A.get('/api/products?sort=low'); ok(r.body[0].price <= r.body[1].price && r.body[0].price <= r.body.at(-1).price, 'sort by price');
    r = await A.get('/api/products/bidri-vase'); ok(r.body.product.name === 'Bidri vase, tall' && r.body.related.length === 4, 'product detail + related');
    r = await A.get('/api/products/nope'); ok(r.status === 404, 'unknown product 404');

    r = await A.post('/api/cart/quote', { items: [{ slug: 'copper-kalash', qty: 1 }], country: 'IN' });
    ok(r.body.subtotal === 5200 && r.body.shipping === 0 && r.body.total === 5200 && r.body.gst === 248, 'India quote: free shipping, GST-inclusive', JSON.stringify(r.body).slice(0, 200));
    r = await A.post('/api/cart/quote', { items: [{ slug: 'longpi-bowl', qty: 1 }], country: 'IN' }); ok(r.body.shipping === 250, 'India below ₹5,000 pays ₹250');
    r = await A.post('/api/cart/quote', { items: [{ slug: 'copper-kalash', qty: 2 }], country: 'GB', method: 'exp' }); ok(r.body.shipping === Math.round((3800 + 900) * 1.6) && r.body.gst === 0, 'UK express quote, zero-rated');
    r = await A.post('/api/cart/quote', { items: [{ slug: 'copper-kalash', qty: 1 }], country: 'IN', coupon: 'welcome10' }); ok(r.body.discount === 520 && r.body.coupon.valid, 'coupon WELCOME10 applied');
    r = await A.post('/api/cart/quote', { items: [{ slug: 'longpi-bowl', qty: 1 }], country: 'IN', coupon: 'WELCOME10' }); ok(r.body.discount === 0 && r.body.coupon.valid === false, 'coupon minimum enforced');
    r = await A.post('/api/cart/quote', { items: [{ slug: 'pietra-dura-platter', qty: 5 }], country: 'IN' }); ok(r.body.problems[0]?.available === 2, 'stock problem reported');
    r = await A.post('/api/cart/quote', { items: [{ slug: 'x', qty: 1 }], country: 'XX' }); ok(r.status === 400, 'unsupported country rejected');

    r = await A.post('/api/leads', { kind: 'b2b', name: 'Ana' }, { ajax: false }); ok(r.status === 403, 'CSRF header required');
    r = await A.post('/api/leads', { kind: 'b2b', name: 'Ana' }); ok(r.status === 400 && r.body.details.email, 'lead validation errors');
    r = await A.post('/api/leads', { kind: 'b2b', name: 'Ana Lee', company: 'Lee Hotels', email: 'ana@lee.com', phone: '+971 50 000 0000', country: 'AE', need: 'Bulk pricing', qty: 120, message: '120 lanterns for a resort', consent: true });
    ok(r.status === 201 && /^EQ-\d{6}$/.test(r.body.ref), 'B2B lead created');
    r = await A.post('/api/leads', { kind: 'export', name: 'Tom', company: 'Imports Ltd', email: 'tom@imp.co.uk', phone: '+44 7700 900000', country: 'GB', incoterm: 'FOB', message: 'Quote for 2 pallets', consent: true }); ok(r.status === 201, 'export lead created');
    r = await A.post('/api/leads', { kind: 'contact', name: 'Rhea', email: 'rhea@x.com', message: 'Hello' }); ok(r.status === 201, 'contact lead created');
    r = await A.post('/api/newsletter', { email: 'news@x.com' }); ok(r.status === 201 && !r.body.already, 'newsletter subscribe');
    r = await A.post('/api/newsletter', { email: 'NEWS@x.com' }); ok(r.body.already === true, 'newsletter dedup');

    // Guest COD order
    const before = await stockOf('copper-kalash');
    r = await A.post('/api/orders', { items: [{ slug: 'copper-kalash', qty: 2 }], contact, address: addr, payment: 'cod', coupon: 'WELCOME10' });
    ok(r.status === 201 && r.body.order.status === 'active' && r.body.order.payment.status === 'cod' && r.body.order.discount === 1040, 'guest COD order confirmed with coupon', JSON.stringify(r.body).slice(0, 200));
    const cod = r.body.order.number;
    ok(await stockOf('copper-kalash') === before - 2, 'stock reserved on order');
    r = await A.get(`/api/track?number=${cod}&email=ASHA@example.com`); ok(r.status === 200 && r.body.order.stage === 0 && r.body.order.history.length === 1, 'track by number + email');
    r = await A.get(`/api/track?number=${cod}&email=wrong@x.com`); ok(r.status === 404, 'track rejects wrong email');
    r = await A.post('/api/orders', { items: [{ slug: 'pashmina-throw', qty: 1 }], contact, address: addr, payment: 'cod' }); ok(r.status === 400, 'COD limit ₹25,000 enforced');
    r = await A.post('/api/orders', { items: [{ slug: 'copper-kalash', qty: 1 }], contact, address: { ...addr, zip: '12' }, payment: 'cod' }); ok(r.status === 400 && r.body.details.zip, 'PIN code validated');
    r = await A.post('/api/orders', { items: [{ slug: 'copper-kalash', qty: 1 }], contact, address: addr, payment: 'cod', expectedTotal: 1 }); ok(r.status === 409, 'price-change guard (expectedTotal)');
    r = await A.post('/api/orders', { items: [{ slug: 'pietra-dura-platter', qty: 3 }], contact, address: addr, payment: 'razorpay' }); ok(r.status === 409, 'oversell blocked');

    // Account + test-mode online payment
    r = await A.post('/api/auth/register', { name: 'Asha Rao', email: 'asha@example.com', password: 'short' }); ok(r.status === 400, 'weak password rejected');
    r = await A.post('/api/auth/register', { name: 'Asha Rao', email: 'asha@example.com', password: 'longpassword1' }); ok(r.status === 201 && !r.body.user.passwordHash, 'register (no hash leaked)');
    r = await A.get('/api/auth/me'); ok(r.body.user?.email === 'asha@example.com', 'session cookie works');
    r = await A.post('/api/me/addresses', addr); ok(r.body.user.addresses.length === 1, 'save address');
    const addrId = r.body.user.addresses[0]._id;
    const b2 = await stockOf('bidri-vase');
    r = await A.post('/api/orders', { items: [{ slug: 'bidri-vase', qty: 1 }], contact, addressId: addrId, payment: 'razorpay', currency: 'INR' });
    ok(r.status === 201 && r.body.testPayment === true && r.body.order.status === 'awaiting_payment', 'online order awaits payment (test mode)');
    const onl = r.body.order.number;
    ok(await stockOf('bidri-vase') === b2 - 1, 'stock held while awaiting payment');
    r = await A.post(`/api/orders/${onl}/test-payment`, { success: false }); ok(r.body.order.payment.status === 'failed', 'test payment failure recorded');
    r = await A.post(`/api/orders/${onl}/retry`, {}); ok(r.body.testPayment === true, 'retry payment');
    r = await A.post(`/api/orders/${onl}/test-payment`, { success: true }); ok(r.body.order.status === 'active' && r.body.order.payment.status === 'paid' && r.body.order.payment.test === true, 'test payment success confirms order');
    r = await A.get('/api/me/orders'); ok(r.body.length === 2, 'account order history (incl. guest order by email)');
    r = await A.get('/api/admin/stats'); ok(r.status === 403, 'customer blocked from admin');

    // Expiry sweep releases stock
    r = await A.post('/api/orders', { items: [{ slug: 'jaali-lantern', qty: 2 }], contact, address: addr, payment: 'razorpay' });
    const stale = r.body.order.number; const j0 = await stockOf('jaali-lantern');
    await Orders.updateOne({ number: stale }, { $set: { createdAt: new Date(Date.now() - 60 * 60 * 1000) } });
    const { expireStalePayments } = await import('../src/services/orders.js');
    const n = await expireStalePayments();
    ok(n >= 1 && await stockOf('jaali-lantern') === j0 + 2 && (await Orders.findOne({ number: stale })).status === 'cancelled', 'unpaid order expires and stock returns');

    // Admin
    const AD = client('http://127.0.0.1:5391');
    r = await AD.post('/api/auth/login', { email: 'admin@kosha.example', password: 'wrong' }); ok(r.status === 401, 'admin wrong password');
    r = await AD.post('/api/auth/login', { email: 'admin@kosha.example', password: 'AdminPass!2026' }); ok(r.body.user.role === 'admin', 'admin login');
    r = await AD.get('/api/admin/stats'); ok(r.body.orders30 === 2 && r.body.newLeads === 3 && r.body.subscribers === 1, 'admin stats', JSON.stringify(r.body).slice(0, 160));
    r = await AD.get('/api/admin/orders?status=toship'); ok(r.body.length === 2, 'orders to ship');
    r = await AD.post(`/api/admin/orders/${cod}/stage`, { stage: 3 }); ok(r.status === 400, 'shipping requires courier');
    r = await AD.post(`/api/admin/orders/${cod}/stage`, { stage: 3, courier: 'Blue Dart', awb: 'BD123456789', note: 'Picked up', location: 'Jaipur' });
    ok(r.body.stage === 3 && r.body.history.length === 4, 'advance to Shipped records skipped stages');
    r = await A.get(`/api/track?number=${cod}&email=asha@example.com`); ok(r.body.order.courier === 'Blue Dart' && r.body.order.history[0].title === 'Shipped', 'customer sees courier + latest event');
    r = await AD.post(`/api/admin/orders/${cod}/cancel`, {}); ok(r.status === 409, 'cannot cancel shipped order');
    r = await AD.post(`/api/admin/orders/${cod}/stage`, { stage: 6 }); ok(r.body.stage === 6 && r.body.payment.status === 'paid', 'delivered COD marked paid');
    const b3 = await stockOf('bidri-vase');
    r = await AD.post(`/api/admin/orders/${onl}/cancel`, { reason: 'Customer request' }); ok(r.body.status === 'cancelled' && await stockOf('bidri-vase') === b3 + 1, 'cancel releases stock');
    r = await AD.get('/api/admin/leads?kind=b2b'); ok(r.body.length === 1, 'list leads by kind');
    r = await AD.patch(`/api/admin/leads/${r.body[0]._id}`, { status: 'quoted' }); ok(r.body.status === 'quoted', 'update lead status');
    r = await AD.post('/api/admin/products', { slug: 'test-bowl', name: 'Test bowl', collectionSlug: 'clay', price: 3000, stock: 5, art: { mat: 'terra', shape: 'bowlDeep', bg: '#DDD4C4' } });
    ok(r.status === 201, 'create product'); const pid = r.body._id;
    r = await AD.put(`/api/admin/products/${pid}`, { price: 3200, tags: ['new'] }); ok(r.body.price === 3200, 'update product');
    r = await AD.post('/api/admin/products', { slug: 'x-bad', name: 'Bad', collectionSlug: 'nope', price: 1 }); ok(r.status === 400, 'product needs a real collection');
    const png = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex');
    const fd = new FormData(); fd.append('images', new Blob([png], { type: 'image/png' }), 'a.png');
    r = await AD.raw('POST', '/api/admin/uploads', fd, { raw: true }); ok(r.status === 201 && r.body.urls[0].startsWith('/uploads/'), 'image upload');
    const img = await fetch('http://127.0.0.1:5391' + r.body.urls[0]); ok(img.status === 200 && img.headers.get('content-type') === 'image/png', 'uploaded image served');
    const fd2 = new FormData(); fd2.append('images', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'x.png');
    r = await AD.raw('POST', '/api/admin/uploads', fd2, { raw: true }); ok(r.status === 400, 'fake image rejected');
    r = await AD.del(`/api/admin/products/${pid}`); ok(r.body.active === false, 'soft-delete product');
    r = await A.get('/api/products/test-bowl'); ok(r.status === 404, 'inactive product hidden');
    r = await AD.post('/api/admin/coupons', { code: 'diwali', type: 'pct', value: 15, min: 10000, label: 'Diwali 15%' }); ok(r.body.code === 'DIWALI', 'create coupon');
    r = await AD.get('/api/admin/coupons'); ok(r.body.find((c) => c.code === 'WELCOME10').used === 1, 'coupon usage counted');
    r = await AD.get('/api/admin/subscribers.csv'); ok(String(r.body).includes('news@x.com'), 'subscribers CSV');
    r = await A.get('/sitemap.xml'); ok(String(r.body).includes('/product/bidri-vase'), 'sitemap lists products');
    r = await A.post('/api/payments/webhook', '{}', { raw: true, headers: { 'Content-Type': 'application/json' } }); ok(r.status === 400, 'webhook rejects unsigned');
  } finally { s1.kill(); }

  /* ---------- Run 2: live Razorpay against mock gateway ---------- */
  console.log('\nRun 2: live Razorpay (mock gateway)');
  await new Promise((r) => gateway.listen(5399, r));
  const s2 = await startServer(5392, { RAZORPAY_KEY_ID: 'rzp_test_key', RAZORPAY_KEY_SECRET: 'rzp_test_secret', RAZORPAY_WEBHOOK_SECRET: 'whsec', RAZORPAY_API_BASE: 'http://127.0.0.1:5399/v1' });
  const B = client('http://127.0.0.1:5392');
  try {
    let r = await B.get('/api/config'); ok(r.body.paymentsLive === true, 'config reports live payments');
    r = await B.post('/api/orders', { items: [{ slug: 'blue-pottery-vase', qty: 1 }], contact: { email: 'jo@example.com', phone: '+44 7700 900111' }, address: { name: 'Jo Hart', line1: '1 Rose St', city: 'London', state: 'London', zip: 'SW1A 1AA', country: 'GB' }, payment: 'razorpay', currency: 'GBP' });
    ok(r.status === 201 && r.body.razorpay?.orderId?.startsWith('order_') && r.body.razorpay.amount === (6900 + 3800) * 100, 'Razorpay order created in paise', JSON.stringify(r.body).slice(0, 200));
    const num = r.body.order.number; const rzId = r.body.razorpay.orderId;
    r = await B.post(`/api/orders/${num}/test-payment`, { success: true, email: 'jo@example.com' }); ok(r.status === 403, 'test payments disabled when live');
    r = await B.post(`/api/orders/${num}/verify`, { razorpay_order_id: rzId, razorpay_payment_id: 'pay_1', razorpay_signature: 'bad' }); ok(r.status === 400, 'bad signature rejected');
    const sig = crypto.createHmac('sha256', 'rzp_test_secret').update(`${rzId}|pay_1`).digest('hex');
    r = await B.post(`/api/orders/${num}/verify`, { razorpay_order_id: rzId, razorpay_payment_id: 'pay_1', razorpay_signature: sig }); ok(r.body.order.status === 'active' && r.body.order.payment.status === 'paid', 'valid signature confirms order');

    // Webhook path: payment captured without the browser returning
    r = await B.post('/api/orders', { items: [{ slug: 'longpi-bowl', qty: 1 }], contact: { email: 'jo@example.com', phone: '+44 7700 900111' }, address: { name: 'Jo Hart', line1: '1 Rose St', city: 'London', state: 'London', zip: 'SW1A 1AA', country: 'GB' }, payment: 'razorpay' });
    const n2 = r.body.order.number; const rz2 = r.body.razorpay.orderId;
    const evt = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_2', order_id: rz2 } } } });
    const wsig = crypto.createHmac('sha256', 'whsec').update(evt).digest('hex');
    r = await B.raw('POST', '/api/payments/webhook', evt, { raw: true, ajax: false, headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': wsig } });
    ok(r.status === 200, 'signed webhook accepted');
    r = await B.get(`/api/track?number=${n2}&email=jo@example.com`); ok(r.body.order.payment.status === 'paid', 'webhook confirmed order');

    // Admin cancel of paid order triggers gateway refund
    const AD = client('http://127.0.0.1:5392');
    await AD.post('/api/auth/login', { email: 'admin@kosha.example', password: 'AdminPass!2026' });
    r = await AD.post(`/api/admin/orders/${num}/cancel`, { reason: 'Out of stock' }); ok(r.body.payment.status === 'refunded' && mockRefunds.includes('pay_1'), 'cancel refunds via gateway');
  } finally { s2.kill(); gateway.close(); }

  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
