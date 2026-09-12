import express from 'express';
import { z } from 'zod';

import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { tagList, validate } from '../middleware/validate.js';
import {
  BUDGETS,
  COOKING_SKILLS,
  DIFFICULTIES,
  MEAL_TYPES,
  UNIT_SYSTEMS,
  publicPreferences,
} from '../models/UserPreferences.js';

export const preferencesRouter = express.Router();

preferencesRouter.use(requireAuth);

const nutritionGoal = (max) =>
  z.union([z.coerce.number().int().min(0).max(max), z.null()]).optional();

const preferencesPatch = z
  .object({
    dietaryRestrictions: tagList(),
    allergies: tagList(),
    dislikes: tagList(60),
    favoriteIngredients: tagList(60),
    favoriteCuisines: tagList(),
    cookingSkill: z.enum(COOKING_SKILLS),
    preferredCookingTime: z.coerce.number().int().min(5).max(240),
    preferredMealTypes: z.array(z.enum(MEAL_TYPES)).max(MEAL_TYPES.length),
    preferredDifficulty: z.enum(DIFFICULTIES),
    preferredServings: z.coerce.number().int().min(1).max(12),
    nutritionGoals: z
      .object({
        focus: z.enum([
          'balanced',
          'high-protein',
          'low-carb',
          'low-calorie',
          'plant-forward',
          'performance',
        ]),
        calories: nutritionGoal(5000),
        protein: nutritionGoal(400),
        carbs: nutritionGoal(800),
        fat: nutritionGoal(400),
        notes: z.string().trim().max(400),
      })
      .partial(),
    budget: z.enum(BUDGETS),
    preferredUnits: z.enum(UNIT_SYSTEMS),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'Nothing to update.' });

preferencesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ preferences: publicPreferences(req.preferences) });
  })
);

/** Partial update so a screen can save one section without clobbering others. */
preferencesRouter.patch(
  '/',
  validate({ body: preferencesPatch }),
  asyncHandler(async (req, res) => {
    const patch = req.valid.body;

    for (const [key, value] of Object.entries(patch)) {
      if (key === 'nutritionGoals') {
        req.preferences.nutritionGoals = { ...req.preferences.nutritionGoals?.toObject?.() ?? req.preferences.nutritionGoals, ...value };
      } else {
        req.preferences[key] = value;
      }
    }

    await req.preferences.save();
    res.json({ preferences: publicPreferences(req.preferences) });
  })
);

/**
 * Allergies get their own endpoint because they are a hard safety constraint and
 * the app confirms the write before showing the change.
 */
preferencesRouter.put(
  '/allergies',
  validate({ body: z.object({ allergies: tagList() }) }),
  asyncHandler(async (req, res) => {
    req.preferences.allergies = req.valid.body.allergies;
    await req.preferences.save();
    res.json({ preferences: publicPreferences(req.preferences) });
  })
);
