import { env } from '../../config/env.js';
import { badRequest } from '../../lib/errors.js';
import { elevenLabsRequest } from './client.js';

const MAX_TTS_CHARS = 2500;
const OUTPUT_FORMATS = ['mp3_44100_128', 'mp3_22050_32'];
const MODEL_FALLBACKS = ['eleven_turbo_v2_5', 'eleven_multilingual_v2'];

/**
 * Synthesises speech and returns base64 audio for the client to play. Long
 * replies are truncated at a sentence boundary rather than mid-word.
 */
export async function synthesizeSpeech({ text, voiceId, speed = 1 }) {
  const trimmed = String(text || '').trim();
  if (!trimmed) throw badRequest('There is nothing to read out.');

  const spoken = trimmed.length > MAX_TTS_CHARS ? truncateAtSentence(trimmed, MAX_TTS_CHARS) : trimmed;
  const preferredVoice = voiceId?.trim() || env.elevenlabs.voiceId;
  const pace = clampSpeed(speed);

  const attempts = [
    { voice: preferredVoice, modelId: env.elevenlabs.ttsModel, outputFormat: OUTPUT_FORMATS[0], speed: pace },
    { voice: env.elevenlabs.voiceId, modelId: env.elevenlabs.ttsModel, outputFormat: OUTPUT_FORMATS[1], speed: 1 },
    { voice: env.elevenlabs.voiceId, modelId: MODEL_FALLBACKS[0], outputFormat: OUTPUT_FORMATS[1], speed: 1 },
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      const audio = await requestSpeech(attempt, spoken);
      return {
        ...audio,
        truncated: spoken.length < trimmed.length,
      };
    } catch (error) {
      lastError = error;
      console.error(
        `[tts] ${attempt.voice} ${attempt.modelId} ${attempt.outputFormat} failed:`,
        error?.internalMessage || error?.message || error
      );
    }
  }

  throw lastError;
}

async function requestSpeech({ voice, modelId, outputFormat, speed }, spoken) {
  const audio = await elevenLabsRequest(
    `/text-to-speech/${encodeURIComponent(voice)}?output_format=${outputFormat}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text: spoken,
        model_id: modelId,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75,
          ...(speed === 1 ? {} : { speed }),
        },
      }),
      expect: 'buffer',
    }
  );

  return {
    audioBase64: audio.toString('base64'),
    mimeType: 'audio/mpeg',
    voiceId: voice,
    spokenText: spoken,
  };
}

/** ElevenLabs rejects values outside this range. */
function clampSpeed(speed) {
  const value = Number(speed);
  if (!Number.isFinite(value)) return 1;
  return Math.min(1.2, Math.max(0.7, Math.round(value * 100) / 100));
}

function truncateAtSentence(text, limit) {
  const slice = text.slice(0, limit);
  const lastBreak = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
  return lastBreak > limit * 0.5 ? slice.slice(0, lastBreak + 1) : slice;
}

export async function listVoices() {
  const data = await elevenLabsRequest('/voices');
  return (data?.voices || [])
    .map((voice) => ({
      id: voice.voice_id,
      name: voice.name,
      accent: voice.labels?.accent ?? null,
      description: voice.labels?.description ?? null,
      previewUrl: voice.preview_url ?? null,
    }))
    .filter((voice) => voice.id && voice.name);
}
