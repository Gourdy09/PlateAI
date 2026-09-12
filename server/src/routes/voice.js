import express from 'express';
import { z } from 'zod';

import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { features } from '../config/env.js';
import { listVoices, synthesizeSpeech } from '../services/elevenlabs/tts.js';
import { transcribeAudio } from '../services/elevenlabs/stt.js';

export const voiceRouter = express.Router();

voiceRouter.use(requireAuth);

voiceRouter.get(
  '/status',
  asyncHandler(async (_req, res) => {
    res.json({
      available: features.elevenlabs,
      /**
       * Continuous "Hey Plate" listening needs a native always-on wake word engine,
       * which this build does not include. The microphone button is the trigger.
       */
      wakeWord: { supported: false, phrase: 'Hey Plate', trigger: 'microphone-button' },
    });
  })
);

voiceRouter.get(
  '/voices',
  asyncHandler(async (_req, res) => {
    res.json({ voices: await listVoices() });
  })
);

voiceRouter.post(
  '/stt',
  validate({
    body: z.object({
      audio: z.object({
        base64: z.string().min(1),
        mimeType: z.string().trim().min(3).max(60),
      }),
    }),
  }),
  asyncHandler(async (req, res) => {
    res.json(await transcribeAudio(req.valid.body.audio));
  })
);

voiceRouter.post(
  '/tts',
  validate({
    body: z.object({
      text: z.string().trim().min(1).max(4000),
      voiceId: z.string().trim().max(60).optional(),
      speed: z.coerce.number().min(0.7).max(1.2).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { text, voiceId, speed } = req.valid.body;
    res.json(
      await synthesizeSpeech({
        text,
        voiceId: voiceId || req.settings.preferredVoice,
        speed: speed ?? req.settings.voiceSpeed,
      })
    );
  })
);
