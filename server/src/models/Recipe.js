import crypto from 'node:crypto';
import mongoose from 'mongoose';

import { DIFFICULTIES } from './UserPreferences.js';

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    quantity: { type: String, trim: true, maxlength: 32, default: '' },
    unit: { type: String, trim: true, maxlength: 32, default: '' },
    optional: { type: Boolean, default: false },
    note: { type: String, trim: true, maxlength: 160, default: '' },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    /** Null for shared/global recipes; set for recipes generated or created for one user. */
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 600, default: '' },
    image: { type: String, trim: true, default: '' },

    ingredients: {
      type: [ingredientSchema],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: 'A recipe needs at least one ingredient.',
      },
    },
    instructions: {
      type: [{ type: String, trim: true, maxlength: 1200 }],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: 'A recipe needs at least one instruction.',
      },
    },

    prepTime: { type: Number, min: 0, max: 1440, default: 0 },
    cookTime: { type: Number, min: 0, max: 1440, default: 0 },
    totalTime: { type: Number, min: 0, max: 2880, default: 0 },
    servings: { type: Number, min: 1, max: 24, default: 2 },
    difficulty: { type: String, enum: DIFFICULTIES, default: 'easy' },
    cuisine: { type: String, trim: true, maxlength: 60, default: '' },
    dietaryTags: { type: [{ type: String, trim: true, maxlength: 40 }], default: [] },

    nutrition: {
      calories: { type: Number, min: 0, max: 5000, default: null },
      protein: { type: Number, min: 0, max: 400, default: null },
      carbs: { type: Number, min: 0, max: 800, default: null },
      fat: { type: Number, min: 0, max: 400, default: null },
      fiber: { type: Number, min: 0, max: 200, default: null },
      sodium: { type: Number, min: 0, max: 20000, default: null },
    },

    /** Allergens Plate detected in the ingredient list, not a marketing claim. */
    allergens: { type: [{ type: String, trim: true, maxlength: 40 }], default: [] },

    source: { type: String, enum: ['gemini', 'user', 'import'], default: 'gemini' },
    generatedByAI: { type: Boolean, default: false },
    generationPrompt: { type: String, trim: true, maxlength: 600, default: '' },

    /** Stable hash of title + ingredients so regeneration reuses one document. */
    fingerprint: { type: String, required: true },
  },
  { timestamps: true }
);

recipeSchema.index({ userId: 1, fingerprint: 1 }, { unique: true });
recipeSchema.index({ userId: 1, createdAt: -1 });
recipeSchema.index({ cuisine: 1, difficulty: 1 });

export function recipeFingerprint({ title, ingredients = [] }) {
  const normalized = [
    String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
    ...ingredients
      .map((item) => String(item?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim())
      .filter(Boolean)
      .sort(),
  ].join('|');
  return crypto.createHash('sha1').update(normalized).digest('hex');
}

export const Recipe = mongoose.model('Recipe', recipeSchema);

export function publicRecipe(recipe) {
  return {
    id: recipe._id.toString(),
    title: recipe.title,
    description: recipe.description || '',
    image: recipe.image || '',
    ingredients: (recipe.ingredients || []).map((item) => ({
      name: item.name,
      quantity: item.quantity || '',
      unit: item.unit || '',
      optional: Boolean(item.optional),
      note: item.note || '',
    })),
    instructions: recipe.instructions || [],
    prepTime: recipe.prepTime ?? 0,
    cookTime: recipe.cookTime ?? 0,
    totalTime: recipe.totalTime || (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0),
    servings: recipe.servings ?? 2,
    difficulty: recipe.difficulty || 'easy',
    cuisine: recipe.cuisine || '',
    dietaryTags: recipe.dietaryTags || [],
    nutrition: {
      calories: recipe.nutrition?.calories ?? null,
      protein: recipe.nutrition?.protein ?? null,
      carbs: recipe.nutrition?.carbs ?? null,
      fat: recipe.nutrition?.fat ?? null,
      fiber: recipe.nutrition?.fiber ?? null,
      sodium: recipe.nutrition?.sodium ?? null,
    },
    allergens: recipe.allergens || [],
    source: recipe.source,
    generatedByAI: Boolean(recipe.generatedByAI),
    createdAt: recipe.createdAt,
  };
}
