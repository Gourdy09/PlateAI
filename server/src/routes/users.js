import express from 'express';
import { z } from 'zod';

import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { features } from '../config/env.js';
import { isImageProviderConfigured } from '../services/images/index.js';
import { hasAnyProvider } from '../services/providers/registry.js';
import { publicUser } from '../models/User.js';
import { publicPreferences } from '../models/UserPreferences.js';
import { publicSettings } from '../models/AppSettings.js';
import { publicCookingSession } from '../models/CookingSession.js';
import { CookingSession } from '../models/CookingSession.js';
import { FridgeItem } from '../models/FridgeItem.js';
import { Recipe } from '../models/Recipe.js';
import { SavedRecipe } from '../models/SavedRecipe.js';
import { Swipe } from '../models/Swipe.js';
import { Cart } from '../models/Cart.js';

export const usersRouter = express.Router();

usersRouter.use(requireAuth);

/**
 * Single bootstrap call: identity, preferences, settings, counts, the active
 * cooking session, and which integrations this deployment actually has.
 */
usersRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [savedCount, swipeCount, fridgeCount, cookedCount, cart, activeSession] = await Promise.all([
      SavedRecipe.countDocuments({ userId }),
      Swipe.countDocuments({ userId }),
      FridgeItem.countDocuments({ userId }),
      CookingSession.countDocuments({ userId, status: 'completed' }),
      Cart.findOne({ userId }).select('items').lean(),
      CookingSession.findOne({ userId, status: 'active' }).sort({ updatedAt: -1 }),
    ]);

    let sessionPayload = null;
    if (activeSession) {
      const recipe = await Recipe.findOne({ _id: activeSession.recipeId }).select(
        'title image instructions servings'
      );
      sessionPayload = publicCookingSession(activeSession, { recipe });
    }

    res.json({
      user: publicUser(req.user),
      preferences: publicPreferences(req.preferences),
      settings: publicSettings(req.settings),
      stats: {
        savedRecipes: savedCount,
        swipes: swipeCount,
        fridgeItems: fridgeCount,
        recipesCooked: cookedCount,
        cartItems: cart?.items?.length ?? 0,
      },
      activeCookingSession: sessionPayload,
      capabilities: {
        ai: features.gemini,
        voice: features.elevenlabs,
        recipeImages: isImageProviderConfigured(),
        grocery: hasAnyProvider(),
      },
    });
  })
);

usersRouter.patch(
  '/me',
  validate({
    body: z.object({
      name: z.string().trim().min(1).max(120).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    if (req.valid.body.name !== undefined) req.user.name = req.valid.body.name;
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  })
);
