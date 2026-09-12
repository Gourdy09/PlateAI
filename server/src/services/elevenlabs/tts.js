import { env } from '../../config/env.js';
import { badRequest } from '../../lib/errors.js';
import { elevenLabsRequest } from './client.js';

const MAX_TTS_CHARS = 2500;
const OUTPUT_FORMAT = 'mp3_44100_128';

/**
 * Synthesises speech and returns base64 audio for the client to play. Long
 * replies are truncated at a sentence boundary rather than mid-word.
 */
export async function synthesizeSpeech({ text, voiceId, speed = 1 }) {
  const trimmed = String(text || '').trim();
  if (!trimmed) throw badRequest('There is nothing to read out.');

  const spoken = trimmed.length > MAX_TTS_CHARS ? truncateAtSentence(trimmed, MAX_TTS_CHARS) : trimmed;
  const voice = voiceId?.trim() || env.elevenlabs.voiceId;

  const audio = await elevenLabsRequest(
    `/text-to-speech/${encodeURIComponent(voice)}?output_format=${OUTPUT_FORMAT}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text: spoken,
        model_id: env.elevenlabs.ttsModel,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75,
          speed: clampSpeed(speed),
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
    truncated: spoken.length < trimmed.length,
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
