// Usage: npm run seed            -> inserts sample catalogue, coupons and the admin user (skips existing)
//        npm run seed -- --reset -> wipes products, collections and coupons first (orders/users untouched)
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import env from '../config/env.js';
import { connectDB } from '../db.js';
import Product from '../models/Product.js';
import Collection from '../models/Collection.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { products, collections, coupons } from './data.js';

await connectDB();
if (process.argv.includes('--reset')) {
  await Promise.all([Product.deleteMany({}), Collection.deleteMany({}), Coupon.deleteMany({})]);
  console.log('Cleared catalogue and coupons');
}
await Promise.all([Product.init(), Collection.init(), Coupon.init(), User.init()]);
let n = 0;
for (const c of collections) if (!(await Collection.exists({ slug: c.slug }))) { await Collection.create(c); n++; }
for (const p of products) if (!(await Product.exists({ slug: p.slug }))) { await Product.create(p); n++; }
for (const c of coupons) if (!(await Coupon.exists({ code: c.code }))) { await Coupon.create(c); n++; }
console.log(`Inserted ${n} catalogue records`);

if (env.adminEmail && env.adminPassword) {
  const existing = await User.findOne({ email: env.adminEmail });
  if (!existing) {
    await User.create({ name: 'Studio admin', email: env.adminEmail, role: 'admin', passwordHash: await bcrypt.hash(env.adminPassword, 12) });
    console.log(`Created admin ${env.adminEmail}`);
  } else if (existing.role !== 'admin') {
    existing.role = 'admin'; await existing.save(); console.log(`Promoted ${env.adminEmail} to admin`);
  } else console.log(`Admin ${env.adminEmail} already exists`);
} else console.log('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create the admin user');
await mongoose.disconnect();
