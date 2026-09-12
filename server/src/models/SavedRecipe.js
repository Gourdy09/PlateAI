import mongoose from 'mongoose';

const savedRecipeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

savedRecipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true });
savedRecipeSchema.index({ userId: 1, createdAt: -1 });

export const SavedRecipe = mongoose.model('SavedRecipe', savedRecipeSchema);
