import express from 'express';
import { z } from 'zod';

import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { idParam, validate } from '../middleware/validate.js';
import { conflict, notFound } from '../lib/errors.js';
import { FRIDGE_CATEGORIES, FridgeItem, publicFridgeItem } from '../models/FridgeItem.js';
import { analyzeFoodImage, prepareImage } from '../services/gemini/vision.js';

export const fridgeRouter = express.Router();

fridgeRouter.use(requireAuth);

const itemBody = z.object({
  name: z.string().trim().min(1).max(80),
  quantity: z.string().trim().max(24).default(''),
  unit: z.string().trim().max(24).default(''),
  category: z.enum(FRIDGE_CATEGORIES).default('other'),
  expirationDate: z.union([z.coerce.date(), z.null()]).optional(),
  notes: z.string().trim().max(300).default(''),
});

fridgeRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await FridgeItem.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ items: items.map(publicFridgeItem) });
  })
);

fridgeRouter.post(
  '/',
  validate({ body: itemBody }),
  asyncHandler(async (req, res) => {
    try {
      const item = await FridgeItem.create({ userId: req.user._id, ...req.valid.body });
      res.status(201).json({ item: publicFridgeItem(item) });
    } catch (error) {
      if (error?.code === 11000) {
        throw conflict(`${req.valid.body.name} is already in your fridge.`);
      }
      throw error;
    }
  })
);

/** Bulk add, used after a fridge photo scan or "add all" from a recipe. */
fridgeRouter.post(
  '/bulk',
  validate({ body: z.object({ items: z.array(itemBody).min(1).max(40) }) }),
  asyncHandler(async (req, res) => {
    const added = [];
    const skipped = [];

    for (const entry of req.valid.body.items) {
      try {
        const item = await FridgeItem.create({ userId: req.user._id, ...entry });
        added.push(publicFridgeItem(item));
      } catch (error) {
        if (error?.code === 11000) skipped.push(entry.name);
        else throw error;
      }
    }

    res.status(201).json({ added, skipped });
  })
);

fridgeRouter.patch(
  '/:id',
  validate({ params: idParam, body: itemBody.partial() }),
  asyncHandler(async (req, res) => {
    const item = await FridgeItem.findOne({ _id: req.valid.params.id, userId: req.user._id });
    if (!item) throw notFound('That ingredient is no longer in your fridge.');

    Object.assign(item, req.valid.body);
    try {
      await item.save();
    } catch (error) {
      if (error?.code === 11000) throw conflict(`${item.name} is already in your fridge.`);
      throw error;
    }
    res.json({ item: publicFridgeItem(item) });
  })
);

fridgeRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const result = await FridgeItem.deleteOne({ _id: req.valid.params.id, userId: req.user._id });
    if (!result.deletedCount) throw notFound('That ingredient is no longer in your fridge.');
    res.json({ ok: true });
  })
);

/**
 * Identifies ingredients in a photo so the cook can confirm and add them. Nothing
 * is written until they confirm — the response is a suggestion, not a mutation.
 */
fridgeRouter.post(
  '/scan',
  validate({
    body: z.object({
      image: z.object({
        base64: z.string().min(1),
        mimeType: z.string().trim().min(3).max(40),
      }),
    }),
  }),
  asyncHandler(async (req, res) => {
    const image = prepareImage(req.valid.body.image);
    const analysis = await analyzeFoodImage({
      image,
      question: 'List the individual grocery ingredients visible so they can be added to a kitchen inventory.',
      preferences: req.preferences,
    });

    const suggestions = analysis.detected
      .filter((entry) => entry.kind === 'ingredient' || entry.kind === 'packaged-item')
      .map((entry) => ({ name: entry.name, confidence: entry.confidence }));

    res.json({
      summary: analysis.summary,
      uncertain: analysis.uncertain,
      suggestions,
    });
  })
);
