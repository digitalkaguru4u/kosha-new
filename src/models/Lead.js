import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  ref: { type: String, unique: true },
  kind: { type: String, enum: ['b2b', 'export', 'contact'], required: true, index: true },
  name: { type: String, required: true, maxlength: 100 },
  company: String, email: { type: String, required: true, lowercase: true }, phone: String, country: String,
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  message: { type: String, maxlength: 4000 },
  status: { type: String, enum: ['new', 'contacted', 'quoted', 'won', 'closed'], default: 'new', index: true }
}, { timestamps: true, toJSON: { versionKey: false } });

export default mongoose.model('Lead', leadSchema);
