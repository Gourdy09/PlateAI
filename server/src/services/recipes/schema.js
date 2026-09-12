import { z } from 'zod';

import { DIFFICULTIES } from '../../models/UserPreferences.js';

/**
 * Gemini's `responseSchema` (OpenAPI subset). Kept in lockstep with `recipeZod`
 * below so the model is guided toward output that also passes validation.
 */
export const recipeResponseSchema = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    description: { type: 'STRING' },
    cuisine: { type: 'STRING' },
    difficulty: { type: 'STRING', enum: DIFFICULTIES },
    servings: { type: 'INTEGER' },
    prepTime: { type: 'INTEGER' },
    cookTime: { type: 'INTEGER' },
    totalTime: { type: 'INTEGER' },
    dietaryTags: { type: 'ARRAY', items: { type: 'STRING' } },
    allergens: { type: 'ARRAY', items: { type: 'STRING' } },
    ingredients: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          quantity: { type: 'STRING' },
          unit: { type: 'STRING' },
          optional: { type: 'BOOLEAN' },
        },
        required: ['name', 'quantity'],
        propertyOrdering: ['name', 'quantity', 'unit', 'optional'],
      },
    },
    instructions: { type: 'ARRAY', items: { type: 'STRING' } },
    nutrition: {
      type: 'OBJECT',
      properties: {
        calories: { type: 'INTEGER' },
        protein: { type: 'INTEGER' },
        carbs: { type: 'INTEGER' },
        fat: { type: 'INTEGER' },
        fiber: { type: 'INTEGER' },
        sodium: { type: 'INTEGER' },
      },
      propertyOrdering: ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sodium'],
    },
  },
  required: ['title', 'description', 'ingredients', 'instructions', 'servings', 'difficulty'],
  propertyOrdering: [
    'title',
    'description',
    'cuisine',
    'difficulty',
    'servings',
    'prepTime',
    'cookTime',
    'totalTime',
    'dietaryTags',
    'allergens',
    'ingredients',
    'instructions',
    'nutrition',
  ],
};

const nonEmpty = (max) => z.string().trim().min(1).max(max);

const clampedInt = (min, max) =>
  z.coerce
    .number()
    .finite()
    .transform((value) => Math.round(value))
    .pipe(z.number().int().min(min).max(max));

const optionalMetric = (min, max) =>
  z
    .union([clampedInt(min, max), z.null()])
    .optional()
    .transform((value) => (value === undefined ? null : value));

export const recipeZod = z
  .object({
    title: nonEmpty(140),
    description: z.string().trim().max(600).default(''),
    cuisine: z.string().trim().max(60).default(''),
    difficulty: z
      .string()
      .trim()
      .toLowerCase()
      .transform((value) => (DIFFICULTIES.includes(value) ? value : 'easy')),
    servings: clampedInt(1, 24).default(2),
    prepTime: clampedInt(0, 1440).default(0),
    cookTime: clampedInt(0, 1440).default(0),
    totalTime: clampedInt(0, 2880).optional(),
    dietaryTags: z.array(z.string().trim().max(40)).max(12).default([]),
    allergens: z.array(z.string().trim().max(40)).max(20).default([]),
    ingredients: z
      .array(
        z.object({
          name: nonEmpty(120),
          quantity: z.string().trim().max(32).default(''),
          unit: z.string().trim().max(32).default(''),
          optional: z.boolean().default(false),
        })
      )
      .min(1)
      .max(40),
    instructions: z.array(nonEmpty(1200)).min(1).max(40),
    nutrition: z
      .object({
        calories: optionalMetric(0, 5000),
        protein: optionalMetric(0, 400),
        carbs: optionalMetric(0, 800),
        fat: optionalMetric(0, 400),
        fiber: optionalMetric(0, 200),
        sodium: optionalMetric(0, 20000),
      })
      .partial()
      .default({}),
  })
  .transform((recipe) => ({
    ...recipe,
    totalTime: recipe.totalTime || recipe.prepTime + recipe.cookTime,
    dietaryTags: [...new Set(recipe.dietaryTags.filter(Boolean))],
    allergens: [...new Set(recipe.allergens.filter(Boolean))],
    nutrition: {
      calories: recipe.nutrition.calories ?? null,
      protein: recipe.nutrition.protein ?? null,
      carbs: recipe.nutrition.carbs ?? null,
      fat: recipe.nutrition.fat ?? null,
      fiber: recipe.nutrition.fiber ?? null,
      sodium: recipe.nutrition.sodium ?? null,
    },
  }));

export const recipeBatchResponseSchema = {
  type: 'OBJECT',
  properties: {
    recipes: { type: 'ARRAY', items: recipeResponseSchema },
  },
  required: ['recipes'],
};

export const recipeBatchZod = z.object({
  recipes: z.array(recipeZod).min(1).max(12),
});
