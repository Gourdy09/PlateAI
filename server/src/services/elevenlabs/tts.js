import { env } from '../../config/env.js';
import { badRequest, serviceUnavailable } from '../../lib/errors.js';
import { elevenLabsRequest } from './client.js';

const MAX_TTS_CHARS = 2500;
const OUTPUT_FORMAT = 'mp3_44100_128';

/** Rachel and other Voice Library IDs return 402 on free ElevenLabs API keys. */
const LIBRARY_VOICE_IDS = new Set([
  '21m00Tcm4TlvDq8ikWAM', // Rachel
]);

/** Premade defaults that still work on many free API keys. Tried only if needed. */
const FREE_TIER_VOICE_CANDIDATES = [
  'EXAVITQu4vr4xnSDxMaL', // Sarah
  'JBFqnCBsd6RMkjVDRZzb', // George
  'XB0fDUnXU5powFXDhCwa', // Charlotte
  'pFZP5JQG7iQjIQuC4Bku', // Lily
  'nPczCjzI2devNBz1zQrb', // Brian
];

const LIBRARY_VOICE_MESSAGE =
  'This ElevenLabs key cannot use Voice Library voices over the API. In ElevenLabs, open Voices → My Voices, copy a voice you own, and set ELEVENLABS_VOICE_ID on the server.';

let cachedWorkingVoice = null;

/**
 * Synthesises speech and returns base64 audio for the client to play. Long
 * replies are truncated at a sentence boundary rather than mid-word.
 */
export async function synthesizeSpeech({ text, voiceId, speed = 1 }) {
  const trimmed = String(text || '').trim();
  if (!trimmed) throw badRequest('There is nothing to read out.');

  const spoken = trimmed.length > MAX_TTS_CHARS ? truncateAtSentence(trimmed, MAX_TTS_CHARS) : trimmed;
  const pace = clampSpeed(speed);
  const candidates = await voiceCandidates(voiceId);

  let lastError;
  for (const voice of candidates) {
    try {
      const audio = await requestSpeech({ voice, modelId: env.elevenlabs.ttsModel, speed: pace }, spoken);
      cachedWorkingVoice = voice;
      return {
        ...audio,
        truncated: spoken.length < trimmed.length,
      };
    } catch (error) {
      lastError = error;
      console.error(`[tts] ${voice} failed:`, error?.message || error);
      if (!isLibraryVoiceError(error)) throw error;
    }
  }

  throw serviceUnavailable(LIBRARY_VOICE_MESSAGE, {
    internalMessage: lastError?.message || 'No usable ElevenLabs voice on this API key',
  });
}

async function voiceCandidates(requested) {
  const seen = new Set();
  const ordered = [];

  const add = (id) => {
    const voice = typeof id === 'string' ? id.trim() : '';
    if (!voice || seen.has(voice) || LIBRARY_VOICE_IDS.has(voice)) return;
    seen.add(voice);
    ordered.push(voice);
  };

  add(requested);
  add(cachedWorkingVoice);
  add(env.elevenlabs.voiceId);

  for (const voice of await findAccountVoices()) add(voice);
  for (const voice of FREE_TIER_VOICE_CANDIDATES) add(voice);

  return ordered;
}

async function findAccountVoices() {
  try {
    const records = await listVoiceRecords();
    const preferred = records.filter((voice) => voice.category === 'cloned' || voice.category === 'generated');
    const premade = records.filter((voice) => voice.category === 'premade');
    return [...preferred, ...premade].map((voice) => voice.voice_id).filter(Boolean);
  } catch (error) {
    if (/voices_read|missing_permissions|401/i.test(error?.message || '')) {
      console.warn('[tts] API key cannot list voices (needs voices_read). Using fallback voice IDs.');
    }
    return [];
  }
}

async function listVoiceRecords() {
  const data = await elevenLabsRequest('/voices');
  return data?.voices || [];
}

async function requestSpeech({ voice, modelId, speed }, spoken) {
  const audio = await elevenLabsRequest(
    `/text-to-speech/${encodeURIComponent(voice)}?output_format=${OUTPUT_FORMAT}`,
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

function isLibraryVoiceError(error) {
  return /paid_plan_required|library voices|402/i.test(error?.message || '');
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
  try {
    return (await listVoiceRecords())
      .filter((voice) => voice.category !== 'professional')
      .map((voice) => ({
        id: voice.voice_id,
        name: voice.name,
        accent: voice.labels?.accent ?? null,
        description: voice.labels?.description ?? null,
        previewUrl: voice.preview_url ?? null,
      }))
      .filter((voice) => voice.id && voice.name);
  } catch (error) {
    if (/voices_read|missing_permissions|401/i.test(error?.message || '')) {
      return [];
    }
    throw error;
  }
}
