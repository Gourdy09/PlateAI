import mongoose from 'mongoose';

export const COOKING_STATUSES = ['active', 'completed', 'abandoned'];

const cookingSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    /** Zero-based index into the recipe's instructions. */
    currentStep: { type: Number, min: 0, default: 0 },
    completedSteps: { type: [Number], default: [] },
    servings: { type: Number, min: 1, max: 24, default: null },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    status: { type: String, enum: COOKING_STATUSES, default: 'active' },
  },
  { timestamps: true }
);

cookingSessionSchema.index({ userId: 1, status: 1, updatedAt: -1 });
cookingSessionSchema.index({ userId: 1, recipeId: 1, status: 1 });

export const CookingSession = mongoose.model('CookingSession', cookingSessionSchema);

export function publicCookingSession(session, { recipe } = {}) {
  return {
    id: session._id.toString(),
    recipeId: session.recipeId?.toString?.() ?? String(session.recipeId),
    recipeTitle: recipe?.title ?? null,
    recipeImage: recipe?.image ?? null,
    totalSteps: recipe?.instructions?.length ?? null,
    currentStep: session.currentStep,
    completedSteps: session.completedSteps,
    servings: session.servings ?? recipe?.servings ?? null,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    updatedAt: session.updatedAt,
  };
}
