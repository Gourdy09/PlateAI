import { z } from 'zod';

import { badRequest } from '../../lib/errors.js';
import { env } from '../../config/env.js';
import { generateStructured } from './client.js';
import { constraintBlock } from '../recipes/prompt.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

/**
 * Validates a base64 image from the client. Images are held in memory for the
 * duration of the request only — Plate does not store photo bytes.
 */
export function prepareImage({ base64, mimeType }) {
  if (typeof base64 !== 'string' || !base64.trim()) {
    throw badRequest('That photo could not be read. Try taking it again.');
  }
  const normalizedMime = String(mimeType || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
    throw badRequest('Plate supports JPEG, PNG, WebP, and HEIC photos.');
  }

  const data = base64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    throw badRequest('That photo could not be read. Try taking it again.');
  }
  const approximateBytes = Math.floor((data.length * 3) / 4);
  if (approximateBytes > MAX_IMAGE_BYTES) {
    throw badRequest('That photo is too large. Try a smaller or lower-resolution image.');
  }

  return { data, mimeType: normalizedMime };
}

const analysisSchema = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    detected: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          kind: { type: 'STRING', enum: ['dish', 'ingredient', 'packaged-item', 'equipment', 'other'] },
          confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
        },
        required: ['name', 'kind', 'confidence'],
        propertyOrdering: ['name', 'kind', 'confidence'],
      },
    },
    allergenConcerns: { type: 'ARRAY', items: { type: 'STRING' } },
    uncertain: { type: 'ARRAY', items: { type: 'STRING' } },
    suggestion: { type: 'STRING' },
  },
  required: ['summary', 'detected', 'uncertain'],
  propertyOrdering: ['summary', 'detected', 'allergenConcerns', 'uncertain', 'suggestion'],
};

const analysisZod = z.object({
  summary: z.string().trim().min(1).max(1200),
  detected: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        kind: z.enum(['dish', 'ingredient', 'packaged-item', 'equipment', 'other']),
        confidence: z.enum(['high', 'medium', 'low']),
      })
    )
    .max(30)
    .default([]),
  allergenConcerns: z.array(z.string().trim().max(60)).max(20).default([]),
  uncertain: z.array(z.string().trim().max(160)).max(10).default([]),
  suggestion: z.string().trim().max(600).default(''),
});

const VISION_SYSTEM_INSTRUCTION = `You identify food in photographs for the Plate cooking app.

- Report only what is visibly present. Never guess a hidden ingredient and present it as fact.
- Put anything you cannot determine from the image into the "uncertain" list, phrased as what the photo cannot show.
- You cannot judge doneness, freshness, or food safety from an image. If asked, say so and give the temperature or visual cue to check instead.
- Flag possible allergens only when a visible ingredient commonly contains them, and say it is a possibility rather than a fact.
- No emoji. Plain, specific language.`;

/**
 * Structured identification of food in a photo. Used for fridge scanning and to
 * ground Plate's answer when the cook attaches an image.
 */
export async function analyzeFoodImage({ image, question, preferences, recipeTitle }) {
  const prompt = [
    question
      ? `The cook asked: "${question}"`
      : 'Identify the food in this photo and describe what you can tell about it.',
    recipeTitle ? `They are currently cooking: ${recipeTitle}.` : '',
    preferences
      ? `Their constraints:\n${constraintBlock({ preferences })}`
      : '',
    'List each distinct food item you can see. Keep the summary under 120 words.',
  ]
    .filter(Boolean)
    .join('\n\n');

  return generateStructured({
    prompt,
    systemInstruction: VISION_SYSTEM_INSTRUCTION,
    responseSchema: analysisSchema,
    validate: analysisZod,
    images: [image],
    model: env.gemini.visionModel,
    temperature: 0.3,
    context: 'image analysis',
  });
}
