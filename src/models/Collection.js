import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  desc: String,
  heroSlug: String,
  sort: { type: Number, default: 0 }
}, { timestamps: true, toJSON: { versionKey: false } });

export default mongoose.model('Collection', collectionSchema);
