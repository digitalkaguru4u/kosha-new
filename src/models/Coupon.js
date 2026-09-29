import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['pct', 'flat'], required: true },
  value: { type: Number, required: true, min: 0 },
  min: { type: Number, default: 0 },
  label: String,
  active: { type: Boolean, default: true },
  usageLimit: { type: Number, default: 0 },   // 0 = unlimited
  used: { type: Number, default: 0 },
  expiresAt: Date
}, { timestamps: true, toJSON: { versionKey: false } });

export default mongoose.model('Coupon', couponSchema);
