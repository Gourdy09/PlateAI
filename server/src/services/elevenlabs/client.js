import { env, features } from '../../config/env.js';
import { ApiError, serviceUnavailable } from '../../lib/errors.js';
import { fetchWithTimeout, safeErrorBody } from '../../lib/http.js';

const API_ROOT = 'https://api.elevenlabs.io/v1';

export function assertVoiceConfigured() {
  if (!features.elevenlabs) {
    throw serviceUnavailable('Voice is not set up on this server. You can still type to Plate.', {
      internalMessage: 'ELEVENLABS_API_KEY is missing',
    });
  }
}

export async function elevenLabsRequest(path, { method = 'GET', body, headers = {}, expect = 'json' } = {}) {
  assertVoiceConfigured();

  const response = await fetchWithTimeout(`${API_ROOT}${path}`, {
    method,
    headers: { 'xi-api-key': env.elevenlabs.apiKey, ...headers },
    body,
    timeoutMs: env.elevenlabs.timeoutMs,
    serviceName: 'Voice service',
  });

  if (!response.ok) {
    const detail = await safeErrorBody(response);
    const publicMessage =
      response.status === 401
        ? 'Voice is not configured correctly on this server.'
        : response.status === 429
          ? 'Voice is busy right now. Please try again in a moment.'
          : 'Voice is unavailable right now. You can still type to Plate.';
    throw new ApiError(response.status === 429 ? 429 : 503, 'voice_error', publicMessage, {
      internalMessage: `ElevenLabs ${path} responded ${response.status}: ${detail}`,
    });
  }

  if (expect === 'buffer') return Buffer.from(await response.arrayBuffer());
  return response.json();
}
