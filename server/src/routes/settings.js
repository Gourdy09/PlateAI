import express from 'express';
import { z } from 'zod';

import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { THEME_MODES, publicSettings } from '../models/AppSettings.js';

export const settingsRouter = express.Router();

settingsRouter.use(requireAuth);

const settingsPatch = z
  .object({
    theme: z.enum(THEME_MODES),
    voiceEnabled: z.boolean(),
    voiceSpeed: z.coerce.number().min(0.7).max(1.2),
    preferredVoice: z.string().trim().max(60),
    autoSpeakReplies: z.boolean(),
    hapticsEnabled: z.boolean(),
    reduceMotion: z.boolean(),
    showNutritionOnCards: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'Nothing to update.' });

settingsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ settings: publicSettings(req.settings) });
  })
);

settingsRouter.patch(
  '/',
  validate({ body: settingsPatch }),
  asyncHandler(async (req, res) => {
    Object.assign(req.settings, req.valid.body);
    await req.settings.save();
    res.json({ settings: publicSettings(req.settings) });
  })
);
