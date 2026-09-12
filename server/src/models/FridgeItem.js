import mongoose from 'mongoose';

export const FRIDGE_CATEGORIES = [
  'produce',
  'protein',
  'dairy',
  'grain',
  'pantry',
  'spice',
  'sauce',
  'frozen',
  'bakery',
  'beverage',
  'other',
];

const fridgeItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    /** Free-form so "1/2" and "a handful" both survive a round trip. */
    quantity: { type: String, trim: true, maxlength: 24, default: '' },
    unit: { type: String, trim: true, maxlength: 24, default: '' },
    category: { type: String, enum: FRIDGE_CATEGORIES, default: 'other' },
    expirationDate: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

fridgeItemSchema.index({ userId: 1, createdAt: -1 });
fridgeItemSchema.index({ userId: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const FridgeItem = mongoose.model('FridgeItem', fridgeItemSchema);

export function publicFridgeItem(item) {
  return {
    id: item._id.toString(),
    name: item.name,
    quantity: item.quantity || '',
    unit: item.unit || '',
    category: item.category,
    expirationDate: item.expirationDate ? item.expirationDate.toISOString() : null,
    notes: item.notes || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
