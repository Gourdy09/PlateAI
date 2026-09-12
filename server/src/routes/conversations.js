import express from 'express';
import { z } from 'zod';

import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { idParam, objectId, validate } from '../middleware/validate.js';
import { badRequest, notFound } from '../lib/errors.js';
import { Conversation, publicConversation } from '../models/Conversation.js';
import { CookingSession } from '../models/CookingSession.js';
import { FridgeItem } from '../models/FridgeItem.js';
import { Message, publicMessage } from '../models/Message.js';
import { Recipe } from '../models/Recipe.js';
import { conversationTitle, plateReply } from '../services/gemini/plate.js';
import { analyzeFoodImage, prepareImage } from '../services/gemini/vision.js';
import { synthesizeSpeech } from '../services/elevenlabs/tts.js';

export const conversationsRouter = express.Router();

conversationsRouter.use(requireAuth);

const HISTORY_WINDOW = 14;

async function loadConversation(conversationId, userId) {
  const conversation = await Conversation.findOne({ _id: conversationId, userId });
  if (!conversation) throw notFound('That conversation is no longer available.');
  return conversation;
}

conversationsRouter.get(
  '/',
  validate({ query: z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) }) }),
  asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({ userId: req.user._id })
      .sort({ lastMessageAt: -1 })
      .limit(req.valid.query.limit);

    const recipeIds = conversations.map((item) => item.recipeId).filter(Boolean);
    const recipes = await Recipe.find({ _id: { $in: recipeIds } }).select('title image');
    const byId = new Map(recipes.map((recipe) => [recipe._id.toString(), recipe]));

    res.json({
      conversations: conversations.map((conversation) => ({
        ...publicConversation(conversation),
        recipeTitle: conversation.recipeId
          ? byId.get(conversation.recipeId.toString())?.title ?? null
          : null,
        recipeImage: conversation.recipeId
          ? byId.get(conversation.recipeId.toString())?.image ?? null
          : null,
      })),
    });
  })
);

/**
 * Opens the conversation for a recipe or cooking session, reusing the existing
 * thread so context and history survive navigating away.
 */
conversationsRouter.post(
  '/',
  validate({
    body: z.object({
      recipeId: objectId.optional(),
      cookingSessionId: objectId.optional(),
      title: z.string().trim().max(140).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { recipeId, cookingSessionId, title } = req.valid.body;

    if (cookingSessionId) {
      const session = await CookingSession.findOne({ _id: cookingSessionId, userId: req.user._id });
      if (!session) throw notFound('That cooking session is no longer available.');
    }
    if (recipeId) {
      const exists = await Recipe.exists({
        _id: recipeId,
        $or: [{ userId: null }, { userId: req.user._id }],
      });
      if (!exists) throw notFound('That recipe is no longer available.');
    }

    const lookup = {
      userId: req.user._id,
      ...(cookingSessionId
        ? { cookingSessionId }
        : recipeId
          ? { recipeId, cookingSessionId: null }
          : { recipeId: null, cookingSessionId: null }),
    };

    const existing = await Conversation.findOne(lookup).sort({ lastMessageAt: -1 });
    if (existing) {
      const messages = await Message.find({ conversationId: existing._id })
        .sort({ createdAt: 1 })
        .limit(200);
      return res.json({
        conversation: publicConversation(existing),
        messages: messages.map(publicMessage),
        created: false,
      });
    }

    let resolvedTitle = title;
    if (!resolvedTitle && recipeId) {
      const recipe = await Recipe.findById(recipeId).select('title');
      resolvedTitle = recipe?.title ?? 'Plate';
    }

    const conversation = await Conversation.create({
      ...lookup,
      recipeId: recipeId ?? null,
      cookingSessionId: cookingSessionId ?? null,
      title: resolvedTitle || 'Plate',
    });

    res.status(201).json({
      conversation: publicConversation(conversation),
      messages: [],
      created: true,
    });
  })
);

conversationsRouter.get(
  '/:id/messages',
  validate({
    params: idParam,
    query: z.object({ limit: z.coerce.number().int().min(1).max(200).default(100) }),
  }),
  asyncHandler(async (req, res) => {
    const conversation = await loadConversation(req.valid.params.id, req.user._id);
    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(req.valid.query.limit);

    res.json({
      conversation: publicConversation(conversation),
      messages: messages.reverse().map(publicMessage),
    });
  })
);

/**
 * Sends a message to Plate.
 *
 * The user message is stored first so a Gemini failure never loses what the cook
 * typed. Attached photos are analysed in-request and only the resulting text
 * summary is persisted — image bytes are never written to MongoDB.
 */
conversationsRouter.post(
  '/:id/messages',
  validate({
    params: idParam,
    body: z.object({
      content: z.string().trim().max(2000).default(''),
      messageType: z.enum(['text', 'voice']).default('text'),
      image: z
        .object({
          base64: z.string().min(1),
          mimeType: z.string().trim().min(3).max(40),
        })
        .optional(),
      speak: z.boolean().default(false),
    }),
  }),
  asyncHandler(async (req, res) => {
    const conversation = await loadConversation(req.valid.params.id, req.user._id);
    const { content, messageType, image: rawImage, speak } = req.valid.body;

    if (!content && !rawImage) {
      throw badRequest('Type a question or attach a photo for Plate.');
    }

    const image = rawImage ? prepareImage(rawImage) : null;

    const [recipe, session, fridgeItems, history] = await Promise.all([
      conversation.recipeId ? Recipe.findById(conversation.recipeId) : null,
      conversation.cookingSessionId
        ? CookingSession.findOne({ _id: conversation.cookingSessionId, userId: req.user._id })
        : null,
      FridgeItem.find({ userId: req.user._id }).lean(),
      Message.find({ conversationId: conversation._id }).sort({ createdAt: -1 }).limit(HISTORY_WINDOW),
    ]);

    let imageSummary = '';
    if (image) {
      const analysis = await analyzeFoodImage({
        image,
        question: content || undefined,
        preferences: req.preferences,
        recipeTitle: recipe?.title,
      });
      imageSummary = [
        analysis.summary,
        analysis.detected.length
          ? `Visible: ${analysis.detected.map((item) => `${item.name} (${item.confidence} confidence)`).join(', ')}`
          : '',
        analysis.uncertain.length ? `Cannot tell from the photo: ${analysis.uncertain.join('; ')}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }

    const userMessage = await Message.create({
      conversationId: conversation._id,
      userId: req.user._id,
      role: 'user',
      content: content || 'Sent a photo.',
      messageType: image ? 'image' : messageType,
      imageSummary,
    });

    const prompt = [
      content || 'What can you tell me about this?',
      imageSummary ? `\nPHOTO ANALYSIS (already performed, treat as ground truth about what is visible):\n${imageSummary}` : '',
    ].join('');

    const reply = await plateReply({
      preferences: req.preferences,
      recipe,
      session,
      history: history.reverse(),
      message: prompt,
      fridgeItems,
    });

    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      userId: req.user._id,
      role: 'assistant',
      content: reply,
      messageType: 'text',
    });

    if (!conversation.messageCount && !conversation.recipeId) {
      const generated = await conversationTitle(content || 'a food photo');
      if (generated) conversation.title = generated;
    }
    conversation.messageCount += 2;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Voice is a bonus on top of the text reply; a TTS failure must not fail the turn.
    let audio = null;
    let audioError = null;
    if (speak && req.settings.voiceEnabled) {
      try {
        audio = await synthesizeSpeech({
          text: reply,
          voiceId: req.settings.preferredVoice,
          speed: req.settings.voiceSpeed,
        });
      } catch (error) {
        console.error('[tts] conversation speak failed:', error?.message || error);
        audioError = error.publicMessage || 'Voice is unavailable right now.';
      }
    }

    res.status(201).json({
      messages: [publicMessage(userMessage), publicMessage(assistantMessage)],
      conversation: publicConversation(conversation),
      audio,
      audioError,
    });
  })
);

conversationsRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const conversation = await loadConversation(req.valid.params.id, req.user._id);
    await Promise.all([
      Message.deleteMany({ conversationId: conversation._id }),
      Conversation.deleteOne({ _id: conversation._id }),
    ]);
    res.json({ ok: true });
  })
);
