import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]+$/ },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  collectionSlug: { type: String, required: true, index: true },
  price: { type: Number, required: true, min: 0 },            // INR, GST inclusive
  stock: { type: Number, default: 0, min: 0 },                // ignored when leadDays > 0 (made to order)
  leadDays: { type: Number, default: 0, min: 0 },             // >0 = made to order
  tags: { type: [String], default: [] },                      // new | best | heirloom
  images: { type: [String], default: [] },                    // uploaded photo URLs; artwork is used when empty
  art: {                                                      // placeholder artwork parameters
    mat: String, shape: String, pat: String, bg: String
  },
  region: String, craft: String, material: String, dims: String, weight: Number,
  finish: String, care: String, desc: String, craftText: String,
  moq: { type: Number, default: 10 },
  exportReady: { type: Boolean, default: true },
  active: { type: Boolean, default: true, index: true },
  sort: { type: Number, default: 0 }
}, { timestamps: true });

productSchema.virtual('madeToOrder').get(function () { return this.leadDays > 0; });
productSchema.set('toJSON', { virtuals: true, versionKey: false });
export default mongoose.model('Product', productSchema);
