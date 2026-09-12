import mongoose from 'mongoose';

import { FRIDGE_CATEGORIES } from './FridgeItem.js';

const cartItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    quantity: { type: String, trim: true, maxlength: 24, default: '' },
    unit: { type: String, trim: true, maxlength: 24, default: '' },
    category: { type: String, enum: FRIDGE_CATEGORIES, default: 'other' },
    /** Recipes this item was added for, so the cart can explain itself. */
    recipeIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }], default: [] },
    note: { type: String, trim: true, maxlength: 200, default: '' },
    checked: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

export const Cart = mongoose.model('Cart', cartSchema);

export function publicCart(cart) {
  return {
    id: cart._id.toString(),
    items: (cart.items || []).map((item) => ({
      id: item._id.toString(),
      name: item.name,
      quantity: item.quantity || '',
      unit: item.unit || '',
      category: item.category,
      recipeIds: (item.recipeIds || []).map((id) => id.toString()),
      note: item.note || '',
      checked: Boolean(item.checked),
    })),
    updatedAt: cart.updatedAt,
  };
}
