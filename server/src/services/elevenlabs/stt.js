import { env } from '../../config/env.js';
import { badRequest, unprocessable } from '../../lib/errors.js';
import { elevenLabsRequest } from './client.js';

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/mpeg', 'audio/mp3',
  'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/aac', 'audio/3gpp',
]);

const EXTENSIONS = {
  'audio/mp4': 'm4a', 'audio/m4a': 'm4a', 'audio/x-m4a': 'm4a',
  'audio/mpeg': 'mp3', 'audio/mp3': 'mp3',
  'audio/wav': 'wav', 'audio/x-wav': 'wav',
  'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/aac': 'aac', 'audio/3gpp': '3gp',
};

/**
 * Transcribes a base64 recording from the app. The audio is forwarded to
 * ElevenLabs and discarded; nothing is written to disk or to MongoDB.
 */
export async function transcribeAudio({ base64, mimeType }) {
  const normalizedMime = String(mimeType || '').toLowerCase().split(';')[0].trim();
  if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
    throw badRequest('That recording format is not supported.');
  }

  const data = String(base64 || '').replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  if (!data) throw badRequest('The recording was empty. Hold the microphone button and try again.');

  const buffer = Buffer.from(data, 'base64');
  if (!buffer.length) throw badRequest('The recording was empty. Hold the microphone button and try again.');
  if (buffer.length > MAX_AUDIO_BYTES) {
    throw badRequest('That recording is too long. Try asking in a shorter clip.');
  }

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: normalizedMime }), `speech.${EXTENSIONS[normalizedMime] ?? 'bin'}`);
  form.append('model_id', env.elevenlabs.sttModel);

  const result = await elevenLabsRequest('/speech-to-text', { method: 'POST', body: form });

  const text = String(result?.text || '').trim();
  if (!text) {
    throw unprocessable("Plate couldn't make out any speech in that recording. Try again somewhere quieter.");
  }

  return {
    text,
    languageCode: result?.language_code ?? null,
    languageConfidence:
      typeof result?.language_probability === 'number' ? result.language_probability : null,
  };
}
