import express from 'express';
import { z } from 'zod';

import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { serviceUnavailable } from '../lib/errors.js';
import { Order, publicOrder } from '../models/Order.js';
import { hasAnyProvider, listProviders, requireProvider } from '../services/providers/registry.js';
import { STRATEGIES, rankQuotes, searchAcrossProviders } from '../services/providers/shopping.js';
import { Cart } from '../models/Cart.js';

export const shoppingRouter = express.Router();

shoppingRouter.use(requireAuth);

const NO_PROVIDER_MESSAGE =
  'No grocery service is connected to Plate yet, so prices, delivery, and ordering are not available. Your shopping list is saved.';

shoppingRouter.get(
  '/providers',
  asyncHandler(async (_req, res) => {
    res.json({
      providers: listProviders(),
      connected: hasAnyProvider(),
      ...(hasAnyProvider() ? {} : { message: NO_PROVIDER_MESSAGE }),
    });
  })
);

shoppingRouter.post(
  '/search',
  validate({ body: z.object({ query: z.string().trim().min(1).max(120) }) }),
  asyncHandler(async (req, res) => {
    if (!hasAnyProvider()) throw serviceUnavailable(NO_PROVIDER_MESSAGE);
    res.json(await searchAcrossProviders(req.valid.body.query, { userId: req.user._id }));
  })
);

/**
 * Asks every connected provider to quote the cart, then ranks the quotes using
 * only the figures they returned. Nothing here is estimated locally.
 */
shoppingRouter.post(
  '/quote',
  validate({
    body: z.object({
      strategy: z.enum(STRATEGIES).default('balanced'),
      providerIds: z.array(z.string().trim().max(60)).max(10).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    if (!hasAnyProvider()) throw serviceUnavailable(NO_PROVIDER_MESSAGE);

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart?.items?.length) throw serviceUnavailable('Your cart is empty.');

    const { strategy, providerIds } = req.valid.body;
    const candidates = listProviders().filter(
      (provider) =>
        provider.capabilities.includes('quoteCart') &&
        (!providerIds || providerIds.includes(provider.id))
    );

    const settled = await Promise.allSettled(
      candidates.map(async (summary) => {
        const provider = requireProvider(summary.id, 'quoteCart');
        const quote = await provider.quoteCart(cart.items, { userId: req.user._id });
        return { providerId: summary.id, providerName: summary.name, ...quote };
      })
    );

    const quotes = settled.filter((result) => result.status === 'fulfilled').map((result) => result.value);
    const ranking = rankQuotes(quotes, strategy);

    res.json({
      strategy,
      ...ranking,
      unavailableProviders: candidates
        .filter((_, index) => settled[index].status === 'rejected')
        .map((provider) => provider.id),
    });
  })
);

/**
 * Places an order. Requires explicit confirmation and a provider that actually
 * accepted it — Plate never records an order the provider did not confirm.
 */
shoppingRouter.post(
  '/orders',
  validate({
    body: z.object({
      providerId: z.string().trim().min(1).max(60),
      quote: z.record(z.string(), z.unknown()),
      confirm: z.literal(true, { message: 'Order confirmation is required.' }),
    }),
  }),
  asyncHandler(async (req, res) => {
    const provider = requireProvider(req.valid.body.providerId, 'createOrder');
    const confirmation = await provider.createOrder(req.valid.body.quote, { userId: req.user._id });

    if (!confirmation?.providerOrderId) {
      throw serviceUnavailable(
        `${provider.name} did not confirm the order. Nothing was placed — please try again.`
      );
    }

    const order = await Order.create({
      userId: req.user._id,
      providerId: provider.id,
      providerName: provider.name,
      providerOrderId: confirmation.providerOrderId,
      status: confirmation.status || 'placed',
      items: confirmation.items || [],
      totals: confirmation.totals || {},
      currency: confirmation.currency,
      placedAt: new Date(),
    });

    res.status(201).json({ order: publicOrder(order) });
  })
);

shoppingRouter.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ orders: orders.map(publicOrder) });
  })
);
