import express from 'express';
import { z } from 'zod';

import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { idParam, validate } from '../middleware/validate.js';
import { notFound } from '../lib/errors.js';
import { DIFFICULTIES, MEAL_TYPES } from '../models/UserPreferences.js';
import { FridgeItem } from '../models/FridgeItem.js';
import { Recipe, publicRecipe, recipeFingerprint } from '../models/Recipe.js';
import { SavedRecipe } from '../models/SavedRecipe.js';
import { buildDiscoveryFeed } from '../services/recipes/discovery.js';
import {
  generateFridgeRecipes,
  generateRequestedRecipe,
  persistRecipes,
} from '../services/recipes/generate.js';
import {
  assertRecipeIsSafe,
  checkRecipeAgainstUser,
  detectAllergens,
} from '../services/recipes/safety.js';
import { compareIngredients, fridgeCoverage } from '../services/ingredients/match.js';
import { generateStructured } from '../services/gemini/client.js';
import { RECIPE_SYSTEM_INSTRUCTION, constraintBlock } from '../services/recipes/prompt.js';
import { recipeResponseSchema, recipeZod } from '../services/recipes/schema.js';

export const recipesRouter = express.Router();

recipesRouter.use(requireAuth);

const generationOptions = z.object({
  mealType: z.enum(MEAL_TYPES).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  cuisine: z.string().trim().max(60).optional(),
  maxTime: z.coerce.number().int().min(5).max(240).optional(),
  servings: z.coerce.number().int().min(1).max(12).optional(),
});

/** Recipes visible to this user: shared recipes plus their own. */
function visibilityFilter(userId) {
  return { $or: [{ userId: null }, { userId }] };
}

async function loadRecipeForUser(recipeId, userId) {
  const recipe = await Recipe.findOne({ _id: recipeId, ...visibilityFilter(userId) });
  if (!recipe) throw notFound('That recipe is no longer available.');
  return recipe;
}

recipesRouter.get(
  '/recommendations',
  validate({
    query: generationOptions.extend({
      limit: z.coerce.number().int().min(1).max(20).default(8),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { limit, ...filters } = req.valid.query;
    const { recipes, generated, poolSize } = await buildDiscoveryFeed({
      user: req.user,
      preferences: req.preferences,
      limit,
      filters,
    });

    const fridgeItems = await FridgeItem.find({ userId: req.user._id }).lean();

    res.json({
      recipes: recipes.map((recipe) => ({
        ...publicRecipe(recipe),
        fridgeCoverage: fridgeCoverage(compareIngredients(recipe.ingredients, fridgeItems)),
      })),
      meta: { generated, poolSize },
    });
  })
);

/** AI-generated recipes this user has accumulated. */
recipesRouter.get(
  '/history',
  validate({ query: z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) }) }),
  asyncHandler(async (req, res) => {
    const recipes = await Recipe.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(req.valid.query.limit);
    res.json({ recipes: recipes.map(publicRecipe) });
  })
);

recipesRouter.post(
  '/generate',
  validate({
    body: generationOptions.extend({
      prompt: z.string().trim().min(2).max(400),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { prompt, ...options } = req.valid.body;
    const fridgeItems = await FridgeItem.find({ userId: req.user._id }).lean();

    const generated = await generateRequestedRecipe({
      preferences: req.preferences,
      fridgeItems,
      request: prompt,
      options,
    });

    const [saved] = await persistRecipes([generated], {
      userId: req.user._id,
      generationPrompt: prompt,
    });

    res.status(201).json({
      recipe: {
        ...publicRecipe(saved),
        fridgeCoverage: fridgeCoverage(compareIngredients(saved.ingredients, fridgeItems)),
      },
    });
  })
);

recipesRouter.post(
  '/from-fridge',
  validate({
    body: generationOptions.extend({
      count: z.coerce.number().int().min(1).max(5).default(3),
      notes: z.string().trim().max(300).optional(),
      strict: z.boolean().default(false),
    }),
  }),
  asyncHandler(async (req, res) => {
    const fridgeItems = await FridgeItem.find({ userId: req.user._id }).lean();

    const generated = await generateFridgeRecipes({
      preferences: req.preferences,
      fridgeItems,
      options: req.valid.body,
    });

    const stored = await persistRecipes(generated, {
      userId: req.user._id,
      generationPrompt: req.valid.body.notes || 'from fridge',
    });

    res.status(201).json({
      recipes: stored.map((recipe) => {
        const comparison = compareIngredients(recipe.ingredients, fridgeItems);
        return {
          ...publicRecipe(recipe),
          fridgeCoverage: fridgeCoverage(comparison),
          missingIngredients: comparison.missing.map((item) => item.name),
        };
      }),
    });
  })
);

recipesRouter.get(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const recipe = await loadRecipeForUser(req.valid.params.id, req.user._id);
    const [fridgeItems, saved] = await Promise.all([
      FridgeItem.find({ userId: req.user._id }).lean(),
      SavedRecipe.exists({ userId: req.user._id, recipeId: recipe._id }),
    ]);

    const comparison = compareIngredients(recipe.ingredients, fridgeItems);
    const check = checkRecipeAgainstUser(recipe, {
      allergies: req.preferences.allergies,
      dietaryRestrictions: req.preferences.dietaryRestrictions,
      dislikes: req.preferences.dislikes,
    });

    res.json({
      recipe: publicRecipe(recipe),
      saved: Boolean(saved),
      ingredients: comparison,
      fridgeCoverage: fridgeCoverage(comparison),
      /** Set when preferences changed after the recipe was created. */
      warnings: {
        allergyViolations: check.allergyViolations,
        dietViolations: check.dietViolations,
        dislikeMatches: check.dislikeMatches,
      },
    });
  })
);

recipesRouter.get(
  '/:id/ingredients',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const recipe = await loadRecipeForUser(req.valid.params.id, req.user._id);
    const fridgeItems = await FridgeItem.find({ userId: req.user._id }).lean();
    const comparison = compareIngredients(recipe.ingredients, fridgeItems);
    res.json({ ...comparison, fridgeCoverage: fridgeCoverage(comparison) });
  })
);

/**
 * Rescale or adapt an existing recipe. The result is a new Recipe document owned
 * by the user, re-validated against their constraints before it is stored.
 */
recipesRouter.post(
  '/:id/adapt',
  validate({
    params: idParam,
    body: z
      .object({
        servings: z.coerce.number().int().min(1).max(12).optional(),
        instruction: z.string().trim().min(2).max(300).optional(),
      })
      .refine((value) => value.servings || value.instruction, {
        message: 'Tell Plate what to change.',
      }),
  }),
  asyncHandler(async (req, res) => {
    const source = await loadRecipeForUser(req.valid.params.id, req.user._id);
    const { servings, instruction } = req.valid.body;

    const prompt = [
      'Rewrite this recipe with the change requested below. Keep everything else as close to the original as possible.',
      constraintBlock({ preferences: req.preferences }),
      '',
      'ORIGINAL RECIPE (JSON):',
      JSON.stringify(publicRecipe(source)),
      '',
      servings ? `CHANGE: scale the recipe to ${servings} servings and adjust every quantity accordingly.` : '',
      instruction ? `CHANGE: ${instruction}` : '',
      'Recalculate the per-serving nutrition for the new version.',
    ]
      .filter(Boolean)
      .join('\n');

    const adapted = await generateStructured({
      prompt,
      systemInstruction: RECIPE_SYSTEM_INSTRUCTION,
      responseSchema: recipeResponseSchema,
      validate: recipeZod,
      temperature: 0.4,
      context: 'recipe adaptation',
    });

    assertRecipeIsSafe(adapted, {
      allergies: req.preferences.allergies,
      dietaryRestrictions: req.preferences.dietaryRestrictions,
    });

    const [saved] = await persistRecipes([{ ...adapted, allergens: detectAllergens(adapted) }], {
      userId: req.user._id,
      generationPrompt: instruction || `scale to ${servings} servings`,
    });

    res.status(201).json({ recipe: publicRecipe(saved), adaptedFrom: source._id.toString() });
  })
);

const substitutionSchema = {
  type: 'OBJECT',
  properties: {
    ingredient: { type: 'STRING' },
    options: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          amount: { type: 'STRING' },
          impact: { type: 'STRING' },
        },
        required: ['name', 'amount', 'impact'],
        propertyOrdering: ['name', 'amount', 'impact'],
      },
    },
    notes: { type: 'STRING' },
  },
  required: ['ingredient', 'options'],
};

const substitutionZod = z.object({
  ingredient: z.string().trim().max(120),
  options: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        amount: z.string().trim().max(80),
        impact: z.string().trim().max(300),
      })
    )
    .max(6),
  notes: z.string().trim().max(400).default(''),
});

recipesRouter.post(
  '/:id/substitutions',
  validate({
    params: idParam,
    body: z.object({ ingredient: z.string().trim().min(1).max(120) }),
  }),
  asyncHandler(async (req, res) => {
    const recipe = await loadRecipeForUser(req.valid.params.id, req.user._id);
    const fridgeItems = await FridgeItem.find({ userId: req.user._id }).lean();

    const result = await generateStructured({
      prompt: [
        `The cook wants to replace "${req.valid.body.ingredient}" in this recipe.`,
        constraintBlock({ preferences: req.preferences, fridgeItems, includeFridge: true }),
        '',
        'RECIPE (JSON):',
        JSON.stringify(publicRecipe(recipe)),
        '',
        'Give up to three substitutions that respect every hard constraint. Prefer things the cook already has. For each, give the amount to use and what it changes about the dish. If nothing works, return an empty options list and explain why in notes.',
      ].join('\n'),
      systemInstruction: RECIPE_SYSTEM_INSTRUCTION,
      responseSchema: substitutionSchema,
      validate: substitutionZod,
      temperature: 0.4,
      context: 'substitutions',
    });

    // A substitution that reintroduces an allergen is dropped, not shown.
    const safeOptions = result.options.filter((option) => {
      const probe = { title: option.name, ingredients: [{ name: option.name }], instructions: ['n/a'] };
      return checkRecipeAgainstUser(probe, {
        allergies: req.preferences.allergies,
        dietaryRestrictions: req.preferences.dietaryRestrictions,
      }).safe;
    });

    res.json({
      ingredient: result.ingredient,
      options: safeOptions,
      notes: safeOptions.length
        ? result.notes
        : result.notes || 'Plate could not find a swap that fits your allergies and dietary settings.',
    });
  })
);

/** Cook-authored recipe. Validated against their own constraints before saving. */
recipesRouter.post(
  '/',
  validate({
    body: z.object({
      title: z.string().trim().min(2).max(140),
      description: z.string().trim().max(600).default(''),
      cuisine: z.string().trim().max(60).default(''),
      difficulty: z.enum(DIFFICULTIES).default('easy'),
      servings: z.coerce.number().int().min(1).max(24).default(2),
      prepTime: z.coerce.number().int().min(0).max(1440).default(0),
      cookTime: z.coerce.number().int().min(0).max(1440).default(0),
      dietaryTags: z.array(z.string().trim().max(40)).max(12).default([]),
      ingredients: z
        .array(
          z.object({
            name: z.string().trim().min(1).max(120),
            quantity: z.string().trim().max(32).default(''),
            unit: z.string().trim().max(32).default(''),
            optional: z.boolean().default(false),
          })
        )
        .min(1)
        .max(40),
      instructions: z.array(z.string().trim().min(1).max(1200)).min(1).max(40),
    }),
  }),
  asyncHandler(async (req, res) => {
    const body = req.valid.body;
    const payload = {
      ...body,
      totalTime: body.prepTime + body.cookTime,
      allergens: detectAllergens(body),
      nutrition: {},
    };

    const recipe = await Recipe.findOneAndUpdate(
      { userId: req.user._id, fingerprint: recipeFingerprint(payload) },
      {
        $setOnInsert: {
          ...payload,
          userId: req.user._id,
          fingerprint: recipeFingerprint(payload),
          source: 'user',
          generatedByAI: false,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ recipe: publicRecipe(recipe) });
  })
);
