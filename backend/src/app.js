import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import env from './config/env.js';
import { UPLOAD_DIR, FRONTEND_DIST } from './config/paths.js';
import { loadUser, requireAjaxHeader } from './middleware/auth.js';
import { errorHandler } from './middleware/util.js';
import catalog from './routes/catalog.js';
import auth from './routes/auth.js';
import orders, { webhook } from './routes/orders.js';
import admin from './routes/admin.js';
import Product from './models/Product.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(cors({ origin: env.clientUrl, credentials: true }));

  app.use('/api', webhook);                 // raw body, before JSON parsing
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  app.use('/api', loadUser, requireAjaxHeader);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', catalog, auth, orders, admin);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true, setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff') }));

  // SEO files generated from the live catalogue
  app.get('/sitemap.xml', async (_req, res, next) => {
    try {
      const products = await Product.find({ active: true }).select('slug updatedAt');
      const urls = ['/', '/shop', '/collections', '/new', '/our-story', '/b2b', '/export', '/track', '/contact', '/catalogue', '/shipping', '/returns']
        .map((u) => `<url><loc>${env.clientUrl}${u}</loc></url>`)
        .concat(products.map((p) => `<url><loc>${env.clientUrl}/product/${p.slug}</loc><lastmod>${p.updatedAt.toISOString().slice(0, 10)}</lastmod></url>`));
      res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
    } catch (e) { next(e); }
  });
  app.get('/robots.txt', (_req, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /checkout\nDisallow: /account\nSitemap: ${env.clientUrl}/sitemap.xml\n`));

  // Optional single-host deploy: serve the built React app
  if (env.serveFrontend && fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => res.sendFile(path.join(FRONTEND_DIST, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
