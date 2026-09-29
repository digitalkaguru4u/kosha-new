
import env from './config/env.js';
import { connectDB } from './db.js';
import { createApp } from './app.js';
import { expireStalePayments } from './services/orders.js';
import { paymentsLive } from './config/env.js';
import { mailLive } from './services/mailer.js';

await connectDB();

const app = createApp();

// Root health-check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Kosha Backend is running',
    status: 'OK',
    port: env.port,
    payments: paymentsLive() ? 'LIVE' : 'TEST MODE',
    email: mailLive() ? 'SMTP configured' : 'Console mode'
  });
});

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
  console.log(
    `Payments: ${
      paymentsLive()
        ? 'Razorpay LIVE keys configured'
        : 'TEST MODE (no Razorpay keys)'
    } | Email: ${
      mailLive()
        ? 'SMTP configured'
        : 'logged to console (no SMTP)'
    }`
  );
});

// Release stock held by unpaid online orders every 5 minutes.
const sweep = () =>
  expireStalePayments()
    .then(
      (n) =>
        n &&
        console.log(`Expired ${n} unpaid order(s)`)
    )
    .catch((e) =>
      console.error('Expiry sweep failed', e.message)
    );

setInterval(sweep, 5 * 60 * 1000).unref();

sweep();

