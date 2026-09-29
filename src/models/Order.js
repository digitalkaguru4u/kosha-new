import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  slug: String, name: String, price: Number, qty: Number, leadDays: Number
}, { _id: false });

const eventSchema = new mongoose.Schema({
  stage: Number, title: String, note: String, location: String, at: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true, lowercase: true, index: true },
  phone: String,
  items: [itemSchema],
  address: { name: String, line1: String, line2: String, city: String, state: String, zip: String, country: String, phone: String },
  zone: String,
  displayCurrency: { type: String, default: 'INR' },
  shippingMethod: { type: String, enum: ['std', 'exp'], default: 'std' },
  subtotal: Number, discount: { type: Number, default: 0 }, shipping: Number, gst: { type: Number, default: 0 }, total: Number,
  coupon: String,
  couponCounted: { type: Boolean, default: false },
  payment: {
    method: { type: String, enum: ['razorpay', 'cod', 'transfer'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'expired', 'cod', 'awaiting_transfer', 'refunded'], default: 'pending' },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: String,
    test: { type: Boolean, default: false }
  },
  status: { type: String, enum: ['awaiting_payment', 'active', 'cancelled'], default: 'awaiting_payment', index: true },
  stage: { type: Number, default: -1 },       // -1 before confirmation, then 0..6 (see STAGES)
  history: [eventSchema],
  courier: String, awb: String, trackingUrl: String,
  eta: { from: Date, to: Date },
  stockReleased: { type: Boolean, default: false },
  notes: String
}, { timestamps: true, toJSON: { versionKey: false } });

export default mongoose.model('Order', orderSchema);
