# Kosha Atelier — MERN e-commerce (placeholder brand)

Luxury handicraft store: B2C checkout (India + international), B2B / export enquiries, order tracking, and an admin panel.

```
kosha-mern/
├── backend/    Node.js + Express + MongoDB (Mongoose) REST API  → /api/*
└── frontend/   React 18 + Vite storefront + admin panel (/admin)
```

The two folders are independent apps with their own `package.json`, `.env` and `node_modules`.

---

## 1. Requirements

- Node.js 18.18 or newer (20 LTS recommended)
- MongoDB 6+ — MongoDB Atlas (free M0 cluster is enough to start) or a local `mongod`

## 2. Run locally

```bash
# API
# oYTqrJ8Ud7oMhIXm pass
# digitalkaguru4u_db_user user

cd backend
cp .env.example .env          # set MONGODB_URI and JWT_SECRET at minimum
npm install
npm run seed                  # 6 collections, 16 products, 2 coupons, admin user
npm run dev                   # http://localhost:5000

# Storefront (second terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173  (proxies /api and /uploads to :5000)
```

Admin: open `/account`, sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env`
(defaults `admin@kosha.example` / `ChangeMe!2026` — **change both before going live**), then go to `/admin`.

`npm run seed -- --reset` wipes and re-seeds products, collections and coupons (orders, users and enquiries are kept).

## 3. Environment variables

### backend/.env

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `NODE_ENV` | `production` on the server (enables secure cookies) |
| `CLIENT_URL` | Public storefront URL — used for CORS, email links, sitemap |
| `SERVE_FRONTEND` | `true` = API also serves `../frontend/dist` (single-host deploy) |
| `MONGODB_URI` | e.g. `mongodb+srv://user:pass@cluster.mongodb.net/kosha` |
| `JWT_SECRET` | Long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin account created by `npm run seed` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | From Razorpay dashboard. **Blank = TEST MODE** (see §5) |
| `RAZORPAY_WEBHOOK_SECRET` | Secret you set when creating the webhook |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Mailbox for order emails. Blank = emails printed to the server log |
| `MAIL_FROM`, `ADMIN_NOTIFY_EMAIL` | Sender, and where new-order / enquiry alerts go |

### frontend/.env (read at build time)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Leave empty if the API is on the same domain. Otherwise e.g. `https://api.yourbrand.com` |
| `VITE_WHATSAPP` | Number with country code, e.g. `9198XXXXXXXX` — the WhatsApp option appears only when set |
| `VITE_INSTAGRAM` | Handle without @ — adds a follow link on the home page (no live feed is embedded) |
| `VITE_CONTACT_EMAIL`, `VITE_CONTACT_PHONE`, `VITE_STUDIO_ADDRESS` | Shown in footer / contact page |

## 4. Deploy

**Option A — single host (simplest).** One Node server (Hostinger VPS, Render, Railway, DigitalOcean) + MongoDB Atlas.

```bash
cd frontend && npm install && npm run build      # creates frontend/dist
cd ../backend && npm install --omit=dev
# backend/.env: NODE_ENV=production, SERVE_FRONTEND=true, CLIENT_URL=https://yourbrand.com
npm run seed      # first time only
node src/server.js   # keep alive with pm2: pm2 start src/server.js --name kosha
```

Put Nginx (or the platform's HTTPS) in front, proxying everything to port 5000.
Clean URLs, `/sitemap.xml` and `/robots.txt` are served by the API.

**Option B — separate hosts.** Frontend `dist/` on Vercel / Netlify / any static host (add an SPA rewrite of all paths to `/index.html`), API on a Node host.
Build the frontend with `VITE_API_URL=https://api.yourbrand.com`, set `CLIENT_URL=https://yourbrand.com` on the API.
Keep both on the **same registrable domain** (`yourbrand.com` + `api.yourbrand.com`): the login cookie is `SameSite=Lax` and will not work across unrelated domains.

**Uploads.** Product photos are saved to `backend/uploads/`. On platforms with ephemeral disks (Render free tier, Heroku) mount a persistent disk there, or they will be lost on redeploy. Hostinger VPS / DigitalOcean disks are persistent.

Shared hosting that runs only PHP (e.g. Hostinger Premium/Business web hosting) **cannot run this build** — it needs a VPS or a Node platform.

## 5. Payments (Razorpay)

- With no keys the site runs in **TEST MODE**: checkout shows a clearly labelled test window with "Simulate successful payment" / "Simulate failed payment". No money moves. Orders are flagged `(test)` in admin.
- Go live: add `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (use `rzp_test_…` keys first), restart.
- Webhook: Razorpay Dashboard → Webhooks → URL `https://yourbrand.com/api/payments/webhook`, events `payment.captured`, `payment.failed`, `refund.processed`, and put the same secret in `RAZORPAY_WEBHOOK_SECRET`.
- The server creates the Razorpay order, verifies the signature, and the webhook confirms payments the browser missed. Stock is held for 30 minutes on unpaid orders, then released. Late payments on an expired/cancelled order are refunded automatically. Cancelling a paid order from admin triggers a refund.
- All charges are in **INR**. USD / EUR / GBP / AED are display-only conversions (indicative rates in `backend/src/config/commerce.js` — update them or wire a rates API). International cards must be enabled on your Razorpay account.
- Other methods: Cash on delivery (India, up to ₹25,000) and bank transfer (India ≥ ₹50,000, all international orders) — admin marks transfers received.

## 6. Business rules — where to change them

`backend/src/config/commerce.js`: GST rate (5%, prices are GST-inclusive), free-shipping threshold (₹5,000), India shipping (₹250 / express +₹450), international zones A/B/C with rates and transit days, supported countries, COD limit, payment hold time, currency rates, tracking stages.

Coupons are managed in admin (`WELCOME10` and `HEIRLOOM` are seeded).

## 7. What the admin panel does

Dashboard (last-30-day orders and revenue, orders to ship, new enquiries, low stock, subscribers, recent orders) · Orders (search/filter, detail, move through the 7 tracking stages with courier + AWB + tracking link — the customer is emailed each update, cancel + refund, mark bank transfer received) · Products (create, edit, hide, stock, lead time, MOQ, specs, photo upload JPEG/PNG/WebP) · Enquiries (B2B / export / contact, status) · Coupons · Newsletter subscribers with CSV export.

## 8. Tests

```bash
cd backend && npm test
```
Starts the API against the database in `MONGODB_URI` (use a throwaway DB) and runs 78 end-to-end checks: catalogue, pricing, auth, COD + test-mode + live-mode Razorpay (against a mock gateway), signature and webhook verification, stock reservation and release, refunds, admin permissions, uploads, enquiries, rate limits.

## 9. Not integrated — clearly out of scope for this build

| Area | Current state |
|---|---|
| Courier / Shiprocket API | Tracking stages, courier name and AWB are entered by admin. No automatic label creation or live courier scans |
| SMS / WhatsApp Business API | Not built. WhatsApp is a click-to-chat link only |
| CRM | Enquiries live in admin; no push to an external CRM |
| Instagram feed | Home "In the studio" tiles link to products; no Instagram API feed |
| Google Analytics 4, Meta Pixel, Search Console | Not installed — add tags in `frontend/index.html` (with a consent banner if you target EU/UK) |
| PayPal / Stripe | Not built; Razorpay only |
| Live FX rates, duty calculation per HS code | Indicative rates; duties shown as "payable by recipient (DDU)" guidance |

## 10. Before launch — checklist

- [ ] Real brand name, logo, domain (search "Kosha" across `frontend/src` and `backend/src/services/mailer.js`)
- [ ] Real product photos uploaded for every product (placeholder illustrations are shown until then)
- [ ] Replace the placeholder testimonials on the home page; set `VITE_INSTAGRAM`
- [ ] Real prices, stock, dimensions, weights
- [ ] Shipping, returns, privacy and terms pages reviewed by your lawyer; GSTIN, registered address and contact details added (Razorpay KYC checks these)
- [ ] Change `ADMIN_PASSWORD`, set a strong `JWT_SECRET`, `NODE_ENV=production`
- [ ] SMTP mailbox configured and a test email received
- [ ] Razorpay test keys → place a real test order → webhook shows "delivered" in the dashboard → switch to live keys
- [ ] MongoDB Atlas: IP access list set to your server, automated backups on
