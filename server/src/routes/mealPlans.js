import express from 'express';
import { z } from 'zod';

import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { idParam, objectId, validate } from '../middleware/validate.js';
import { badRequest, notFound } from '../lib/errors.js';
import { MealPlan, publicMealPlan } from '../models/MealPlan.js';
import { MEAL_TYPES } from '../models/UserPreferences.js';
import { Recipe } from '../models/Recipe.js';

export const mealPlansRouter = express.Router();

mealPlansRouter.use(requireAuth);

const mealBody = z.object({
  date: z.coerce.date(),
  mealType: z.enum(MEAL_TYPES),
  recipeId: objectId,
  servings: z.coerce.number().int().min(1).max(24).default(2),
});

async function recipeLookup(plans, userId) {
  const ids = plans.flatMap((plan) => plan.meals.map((meal) => meal.recipeId));
  if (!ids.length) return new Map();
  const recipes = await Recipe.find({
    _id: { $in: ids },
    $or: [{ userId: null }, { userId }],
  }).select('title image');
  return new Map(recipes.map((recipe) => [recipe._id.toString(), recipe]));
}

async function assertRecipesVisible(meals, userId) {
  const ids = [...new Set(meals.map((meal) => meal.recipeId))];
  if (!ids.length) return;
  const count = await Recipe.countDocuments({
    _id: { $in: ids },
    $or: [{ userId: null }, { userId }],
  });
  if (count !== ids.length) throw badRequest('One of those recipes is no longer available.');
}

mealPlansRouter.get(
  '/',
  validate({ query: z.object({ limit: z.coerce.number().int().min(1).max(20).default(8) }) }),
  asyncHandler(async (req, res) => {
    const plans = await MealPlan.find({ userId: req.user._id })
      .sort({ startDate: -1 })
      .limit(req.valid.query.limit);
    const recipes = await recipeLookup(plans, req.user._id);
    res.json({ mealPlans: plans.map((plan) => publicMealPlan(plan, recipes)) });
  })
);

mealPlansRouter.post(
  '/',
  validate({
    body: z
      .object({
        title: z.string().trim().max(120).default(''),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        meals: z.array(mealBody).max(60).default([]),
      })
      .refine((value) => value.endDate >= value.startDate, {
        message: 'The end date must be on or after the start date.',
      }),
  }),
  asyncHandler(async (req, res) => {
    await assertRecipesVisible(req.valid.body.meals, req.user._id);
    const plan = await MealPlan.create({ userId: req.user._id, ...req.valid.body });
    const recipes = await recipeLookup([plan], req.user._id);
    res.status(201).json({ mealPlan: publicMealPlan(plan, recipes) });
  })
);

mealPlansRouter.patch(
  '/:id',
  validate({
    params: idParam,
    body: z
      .object({
        title: z.string().trim().max(120),
        meals: z.array(mealBody).max(60),
      })
      .partial()
      .refine((value) => Object.keys(value).length > 0, { message: 'Nothing to update.' }),
  }),
  asyncHandler(async (req, res) => {
    const plan = await MealPlan.findOne({ _id: req.valid.params.id, userId: req.user._id });
    if (!plan) throw notFound('That meal plan is no longer available.');

    if (req.valid.body.meals) {
      await assertRecipesVisible(req.valid.body.meals, req.user._id);
      plan.meals = req.valid.body.meals;
    }
    if (req.valid.body.title !== undefined) plan.title = req.valid.body.title;

    await plan.save();
    const recipes = await recipeLookup([plan], req.user._id);
    res.json({ mealPlan: publicMealPlan(plan, recipes) });
  })
);

mealPlansRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const result = await MealPlan.deleteOne({ _id: req.valid.params.id, userId: req.user._id });
    if (!result.deletedCount) throw notFound('That meal plan is no longer available.');
    res.json({ ok: true });
  })
);
