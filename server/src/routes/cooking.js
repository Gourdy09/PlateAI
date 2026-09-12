import express from 'express';
import { z } from 'zod';

import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { idParam, objectId, validate } from '../middleware/validate.js';
import { badRequest, notFound } from '../lib/errors.js';
import {
  COOKING_STATUSES,
  CookingSession,
  publicCookingSession,
} from '../models/CookingSession.js';
import { Conversation } from '../models/Conversation.js';
import { FridgeItem } from '../models/FridgeItem.js';
import { Recipe, publicRecipe } from '../models/Recipe.js';
import { compareIngredients } from '../services/ingredients/match.js';

export const cookingRouter = express.Router();

cookingRouter.use(requireAuth);

async function loadSession(sessionId, userId) {
  const session = await CookingSession.findOne({ _id: sessionId, userId });
  if (!session) throw notFound('That cooking session is no longer available.');
  return session;
}

/**
 * Starts cooking a recipe, or resumes the existing active session for it so a
 * cook who backs out and returns keeps their place.
 */
cookingRouter.post(
  '/sessions',
  validate({
    body: z.object({
      recipeId: objectId,
      servings: z.coerce.number().int().min(1).max(24).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { recipeId, servings } = req.valid.body;

    const recipe = await Recipe.findOne({
      _id: recipeId,
      $or: [{ userId: null }, { userId: req.user._id }],
    });
    if (!recipe) throw notFound('That recipe is no longer available.');

    const existing = await CookingSession.findOne({
      userId: req.user._id,
      recipeId,
      status: 'active',
    });

    if (existing) {
      if (servings && servings !== existing.servings) {
        existing.servings = servings;
        await existing.save();
      }
      return res.json({
        session: publicCookingSession(existing, { recipe }),
        recipe: publicRecipe(recipe),
        resumed: true,
      });
    }

    const session = await CookingSession.create({
      userId: req.user._id,
      recipeId,
      servings: servings ?? recipe.servings,
      currentStep: 0,
      completedSteps: [],
      status: 'active',
    });

    res.status(201).json({
      session: publicCookingSession(session, { recipe }),
      recipe: publicRecipe(recipe),
      resumed: false,
    });
  })
);

cookingRouter.get(
  '/sessions',
  validate({
    query: z.object({
      status: z.enum(COOKING_STATUSES).optional(),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { status, limit } = req.valid.query;
    const sessions = await CookingSession.find({
      userId: req.user._id,
      ...(status ? { status } : {}),
    })
      .sort({ updatedAt: -1 })
      .limit(limit);

    const recipes = await Recipe.find({ _id: { $in: sessions.map((s) => s.recipeId) } }).select(
      'title image instructions servings totalTime'
    );
    const byId = new Map(recipes.map((recipe) => [recipe._id.toString(), recipe]));

    res.json({
      sessions: sessions.map((session) =>
        publicCookingSession(session, { recipe: byId.get(session.recipeId.toString()) })
      ),
    });
  })
);

cookingRouter.get(
  '/sessions/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const session = await loadSession(req.valid.params.id, req.user._id);
    const [recipe, fridgeItems, conversation] = await Promise.all([
      Recipe.findById(session.recipeId),
      FridgeItem.find({ userId: req.user._id }).lean(),
      Conversation.findOne({ userId: req.user._id, cookingSessionId: session._id }),
    ]);
    if (!recipe) throw notFound('That recipe is no longer available.');

    res.json({
      session: publicCookingSession(session, { recipe }),
      recipe: publicRecipe(recipe),
      ingredients: compareIngredients(recipe.ingredients, fridgeItems),
      conversationId: conversation ? conversation._id.toString() : null,
    });
  })
);

/** Step navigation and completion. Progress is written before the UI advances. */
cookingRouter.patch(
  '/sessions/:id',
  validate({
    params: idParam,
    body: z
      .object({
        currentStep: z.coerce.number().int().min(0).max(200),
        completeStep: z.coerce.number().int().min(0).max(200),
        uncompleteStep: z.coerce.number().int().min(0).max(200),
        status: z.enum(COOKING_STATUSES),
        servings: z.coerce.number().int().min(1).max(24),
      })
      .partial()
      .refine((value) => Object.keys(value).length > 0, { message: 'Nothing to update.' }),
  }),
  asyncHandler(async (req, res) => {
    const session = await loadSession(req.valid.params.id, req.user._id);
    const recipe = await Recipe.findById(session.recipeId);
    if (!recipe) throw notFound('That recipe is no longer available.');

    const lastStep = Math.max(recipe.instructions.length - 1, 0);
    const patch = req.valid.body;

    if (patch.currentStep !== undefined) {
      if (patch.currentStep > lastStep) {
        throw badRequest('That step does not exist in this recipe.');
      }
      session.currentStep = patch.currentStep;
    }
    if (patch.completeStep !== undefined) {
      if (patch.completeStep > lastStep) throw badRequest('That step does not exist in this recipe.');
      if (!session.completedSteps.includes(patch.completeStep)) {
        session.completedSteps = [...session.completedSteps, patch.completeStep].sort((a, b) => a - b);
      }
    }
    if (patch.uncompleteStep !== undefined) {
      session.completedSteps = session.completedSteps.filter((step) => step !== patch.uncompleteStep);
    }
    if (patch.servings !== undefined) session.servings = patch.servings;

    if (patch.status !== undefined) {
      session.status = patch.status;
      session.completedAt = patch.status === 'completed' ? new Date() : null;
      if (patch.status === 'completed') {
        session.completedSteps = recipe.instructions.map((_, index) => index);
        session.currentStep = lastStep;
      }
    }

    await session.save();
    res.json({ session: publicCookingSession(session, { recipe }) });
  })
);

cookingRouter.delete(
  '/sessions/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const session = await loadSession(req.valid.params.id, req.user._id);
    session.status = 'abandoned';
    await session.save();
    res.json({ ok: true });
  })
);
