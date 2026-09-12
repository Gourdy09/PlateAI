import express from 'express';
import { z } from 'zod';

import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { objectId, validate } from '../middleware/validate.js';
import { notFound } from '../lib/errors.js';
import { Recipe, publicRecipe } from '../models/Recipe.js';
import { SavedRecipe } from '../models/SavedRecipe.js';
import { SWIPE_DIRECTIONS, Swipe } from '../models/Swipe.js';

export const swipesRouter = express.Router();

swipesRouter.use(requireAuth);

/**
 * Records a swipe. A right swipe also saves the recipe, so the two writes are
 * kept together and the client never has to make a second call.
 */
swipesRouter.post(
  '/',
  validate({
    body: z.object({
      recipeId: objectId,
      direction: z.enum(SWIPE_DIRECTIONS),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { recipeId, direction } = req.valid.body;

    const recipe = await Recipe.findOne({
      _id: recipeId,
      $or: [{ userId: null }, { userId: req.user._id }],
    });
    if (!recipe) throw notFound('That recipe is no longer available.');

    await Swipe.findOneAndUpdate(
      { userId: req.user._id, recipeId },
      { direction },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    let saved = false;
    if (direction === 'right') {
      await SavedRecipe.updateOne(
        { userId: req.user._id, recipeId },
        { $setOnInsert: { userId: req.user._id, recipeId } },
        { upsert: true }
      );
      saved = true;
    } else {
      await SavedRecipe.deleteOne({ userId: req.user._id, recipeId });
    }

    res.status(201).json({ swipe: { recipeId, direction }, saved });
  })
);

/** Undo: removes the most recent swipe and any save it created. */
swipesRouter.post(
  '/undo',
  asyncHandler(async (req, res) => {
    const last = await Swipe.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!last) return res.json({ undone: null });

    await Promise.all([
      Swipe.deleteOne({ _id: last._id }),
      last.direction === 'right'
        ? SavedRecipe.deleteOne({ userId: req.user._id, recipeId: last.recipeId })
        : Promise.resolve(),
    ]);

    const recipe = await Recipe.findById(last.recipeId);
    res.json({
      undone: { recipeId: last.recipeId.toString(), direction: last.direction },
      recipe: recipe ? publicRecipe(recipe) : null,
    });
  })
);

swipesRouter.get(
  '/',
  validate({
    query: z.object({
      direction: z.enum(SWIPE_DIRECTIONS).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { direction, limit } = req.valid.query;
    const swipes = await Swipe.find({
      userId: req.user._id,
      ...(direction ? { direction } : {}),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const recipes = await Recipe.find({ _id: { $in: swipes.map((swipe) => swipe.recipeId) } });
    const byId = new Map(recipes.map((recipe) => [recipe._id.toString(), publicRecipe(recipe)]));

    res.json({
      swipes: swipes
        .map((swipe) => ({
          direction: swipe.direction,
          createdAt: swipe.createdAt,
          recipe: byId.get(swipe.recipeId.toString()) ?? null,
        }))
        .filter((entry) => entry.recipe),
    });
  })
);
