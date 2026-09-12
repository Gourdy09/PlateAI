import mongoose from 'mongoose';

import { MEAL_TYPES } from './UserPreferences.js';

const plannedMealSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    mealType: { type: String, enum: MEAL_TYPES, required: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    servings: { type: Number, min: 1, max: 24, default: 2 },
  },
  { _id: true }
);

const mealPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    meals: { type: [plannedMealSchema], default: [] },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

mealPlanSchema.index({ userId: 1, startDate: -1 });

export const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

export function publicMealPlan(plan, recipesById = new Map()) {
  return {
    id: plan._id.toString(),
    title: plan.title || '',
    startDate: plan.startDate,
    endDate: plan.endDate,
    meals: (plan.meals || []).map((meal) => ({
      id: meal._id.toString(),
      date: meal.date,
      mealType: meal.mealType,
      recipeId: meal.recipeId.toString(),
      recipeTitle: recipesById.get(meal.recipeId.toString())?.title ?? null,
      recipeImage: recipesById.get(meal.recipeId.toString())?.image ?? null,
      servings: meal.servings,
    })),
    updatedAt: plan.updatedAt,
  };
}
