import mongoose from 'mongoose';

export const SWIPE_DIRECTIONS = ['right', 'left'];

const swipeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    direction: { type: String, enum: SWIPE_DIRECTIONS, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

swipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true });
swipeSchema.index({ userId: 1, createdAt: -1 });

export const Swipe = mongoose.model('Swipe', swipeSchema);
