import express from 'express';
import { z } from 'zod';

import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { idParam, objectId, validate } from '../middleware/validate.js';
import { notFound } from '../lib/errors.js';
import { Cart, publicCart } from '../models/Cart.js';
import { FRIDGE_CATEGORIES, FridgeItem, publicFridgeItem } from '../models/FridgeItem.js';
import { Recipe } from '../models/Recipe.js';
import { compareIngredients } from '../services/ingredients/match.js';
import { canonicalIngredientName, combineQuantities } from '../services/ingredients/units.js';
import { findOrCreate } from '../services/users/index.js';

export const cartRouter = express.Router();

cartRouter.use(requireAuth);

const cartItemBody = z.object({
  name: z.string().trim().min(1).max(80),
  quantity: z.string().trim().max(24).default(''),
  unit: z.string().trim().max(24).default(''),
  category: z.enum(FRIDGE_CATEGORIES).default('other'),
  note: z.string().trim().max(200).default(''),
  recipeId: objectId.optional(),
});

async function getCart(userId) {
  return findOrCreate(Cart, userId);
}

/**
 * Adds an item, merging with an existing line when the ingredient matches and
 * the units agree. When the quantities cannot be added (e.g. "2 cups" and
 * "a handful") both are kept rather than guessing a combined amount.
 */
function upsertCartItem(cart, entry) {
  const canonical = canonicalIngredientName(entry.name);
  const existing = cart.items.find(
    (item) => canonicalIngredientName(item.name) === canonical && canonical
  );

  if (!existing) {
    cart.items.push({
      name: entry.name,
      quantity: entry.quantity,
      unit: entry.unit,
      category: entry.category,
      note: entry.note,
      recipeIds: entry.recipeId ? [entry.recipeId] : [],
    });
    return { merged: false };
  }

  const combined = combineQuantities(existing, entry);
  if (combined) {
    existing.quantity = combined.quantity;
    existing.unit = combined.unit;
  } else if (entry.quantity && entry.quantity !== existing.quantity) {
    const addition = [entry.quantity, entry.unit].filter(Boolean).join(' ');
    existing.note = [existing.note, `plus ${addition}`].filter(Boolean).join(' · ').slice(0, 200);
  }

  if (entry.recipeId && !existing.recipeIds.some((id) => id.toString() === entry.recipeId)) {
    existing.recipeIds.push(entry.recipeId);
  }
  if (entry.category && existing.category === 'other') existing.category = entry.category;
  existing.checked = false;
  return { merged: true };
}

cartRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.user._id);
    res.json({ cart: publicCart(cart) });
  })
);

cartRouter.post(
  '/items',
  validate({ body: cartItemBody }),
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.user._id);
    upsertCartItem(cart, req.valid.body);
    await cart.save();
    res.status(201).json({ cart: publicCart(cart) });
  })
);

/** "Add missing ingredients" / "Add all ingredients" from a recipe. */
cartRouter.post(
  '/from-recipe',
  validate({
    body: z.object({
      recipeId: objectId,
      mode: z.enum(['missing', 'all']).default('missing'),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { recipeId, mode } = req.valid.body;

    const recipe = await Recipe.findOne({
      _id: recipeId,
      $or: [{ userId: null }, { userId: req.user._id }],
    });
    if (!recipe) throw notFound('That recipe is no longer available.');

    const [cart, fridgeItems] = await Promise.all([
      getCart(req.user._id),
      FridgeItem.find({ userId: req.user._id }).lean(),
    ]);

    const comparison = compareIngredients(recipe.ingredients, fridgeItems);
    const source = mode === 'all' ? recipe.ingredients : comparison.missing;

    let added = 0;
    for (const ingredient of source) {
      upsertCartItem(cart, {
        name: ingredient.name,
        quantity: ingredient.quantity || '',
        unit: ingredient.unit || '',
        category: 'other',
        note: '',
        recipeId,
      });
      added += 1;
    }

    await cart.save();
    res.status(201).json({ cart: publicCart(cart), added, skippedAlreadyHave: mode === 'missing' ? comparison.have.length : 0 });
  })
);

cartRouter.patch(
  '/items/:id',
  validate({
    params: idParam,
    body: z
      .object({
        quantity: z.string().trim().max(24),
        unit: z.string().trim().max(24),
        category: z.enum(FRIDGE_CATEGORIES),
        note: z.string().trim().max(200),
        checked: z.boolean(),
      })
      .partial()
      .refine((value) => Object.keys(value).length > 0, { message: 'Nothing to update.' }),
  }),
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.user._id);
    const item = cart.items.id(req.valid.params.id);
    if (!item) throw notFound('That item is no longer in your cart.');

    Object.assign(item, req.valid.body);
    await cart.save();
    res.json({ cart: publicCart(cart) });
  })
);

cartRouter.delete(
  '/items/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.user._id);
    const item = cart.items.id(req.valid.params.id);
    if (!item) throw notFound('That item is no longer in your cart.');

    item.deleteOne();
    await cart.save();
    res.json({ cart: publicCart(cart) });
  })
);

cartRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.user._id);
    cart.items = [];
    await cart.save();
    res.json({ cart: publicCart(cart) });
  })
);

/** Shopped items move from the cart into the fridge. */
cartRouter.post(
  '/move-to-fridge',
  validate({
    body: z.object({
      itemIds: z.array(objectId).min(1).max(60).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.user._id);
    const requested = req.valid.body.itemIds;
    const targets = cart.items.filter((item) =>
      requested ? requested.includes(item._id.toString()) : item.checked
    );

    if (!targets.length) {
      throw notFound('Select the items you picked up first.');
    }

    const moved = [];
    for (const item of targets) {
      try {
        const created = await FridgeItem.create({
          userId: req.user._id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
        });
        moved.push(publicFridgeItem(created));
      } catch (error) {
        // Already in the fridge — still remove it from the cart.
        if (error?.code !== 11000) throw error;
      }
      item.deleteOne();
    }

    await cart.save();
    res.json({ cart: publicCart(cart), moved });
  })
);
