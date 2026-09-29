import 'dotenv/config';

const env = {
  port: Number(process.env.PORT || 5000),
  prod: process.env.NODE_ENV === 'production',
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
  serveFrontend: process.env.SERVE_FRONTEND === 'true',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kosha',
  jwtSecret: process.env.JWT_SECRET || '',
  adminEmail: (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  rzp: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ''
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  mailFrom: process.env.MAIL_FROM || 'Kosha Atelier <hello@kosha.example>',
  adminNotify: process.env.ADMIN_NOTIFY_EMAIL || ''
};

if (!env.jwtSecret || env.jwtSecret.length < 16 || env.jwtSecret.startsWith('change-me')) {
  if (env.prod) throw new Error('Set JWT_SECRET (a long random string) before running in production');
  env.jwtSecret = 'dev-only-secret-not-for-production';
}

export const paymentsLive = () => Boolean(env.rzp.keyId && env.rzp.keySecret);
export default env;
