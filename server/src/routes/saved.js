import express from 'express';
import { z } from 'zod';

import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { objectId, validate } from '../middleware/validate.js';
import { notFound } from '../lib/errors.js';
import { FridgeItem } from '../models/FridgeItem.js';
import { Recipe, publicRecipe } from '../models/Recipe.js';
import { SavedRecipe } from '../models/SavedRecipe.js';
import { Swipe } from '../models/Swipe.js';
import { compareIngredients, fridgeCoverage } from '../services/ingredients/match.js';

export const savedRouter = express.Router();

savedRouter.use(requireAuth);

savedRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const entries = await SavedRecipe.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    const [recipes, fridgeItems] = await Promise.all([
      Recipe.find({ _id: { $in: entries.map((entry) => entry.recipeId) } }),
      FridgeItem.find({ userId: req.user._id }).lean(),
    ]);

    const byId = new Map(recipes.map((recipe) => [recipe._id.toString(), recipe]));

    res.json({
      recipes: entries
        .map((entry) => {
          const recipe = byId.get(entry.recipeId.toString());
          if (!recipe) return null;
          return {
            ...publicRecipe(recipe),
            savedAt: entry.createdAt,
            fridgeCoverage: fridgeCoverage(compareIngredients(recipe.ingredients, fridgeItems)),
          };
        })
        .filter(Boolean),
    });
  })
);

savedRouter.post(
  '/',
  validate({ body: z.object({ recipeId: objectId }) }),
  asyncHandler(async (req, res) => {
    const { recipeId } = req.valid.body;
    const recipe = await Recipe.findOne({
      _id: recipeId,
      $or: [{ userId: null }, { userId: req.user._id }],
    });
    if (!recipe) throw notFound('That recipe is no longer available.');

    await SavedRecipe.updateOne(
      { userId: req.user._id, recipeId },
      { $setOnInsert: { userId: req.user._id, recipeId } },
      { upsert: true }
    );
    res.status(201).json({ recipe: publicRecipe(recipe), saved: true });
  })
);

savedRouter.delete(
  '/:recipeId',
  validate({ params: z.object({ recipeId: objectId }) }),
  asyncHandler(async (req, res) => {
    const { recipeId } = req.valid.params;
    const result = await SavedRecipe.deleteOne({ userId: req.user._id, recipeId });
    if (!result.deletedCount) throw notFound('That recipe was not in your saved list.');

    // Clearing the save also clears the swipe so the recipe can resurface.
    await Swipe.deleteOne({ userId: req.user._id, recipeId, direction: 'right' });
    res.json({ ok: true, saved: false });
  })
);
