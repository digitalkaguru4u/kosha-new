import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  name: String, line1: String, line2: String, city: String, state: String, zip: String, country: String, phone: String
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  addresses: { type: [addressSchema], default: [] }
}, { timestamps: true });

userSchema.set('toJSON', {
  versionKey: false,
  transform: (_d, r) => { delete r.passwordHash; return r; }
});
export default mongoose.model('User', userSchema);
