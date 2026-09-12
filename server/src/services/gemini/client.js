import { env, features } from '../../config/env.js';
import { ApiError, serviceUnavailable, unprocessable } from '../../lib/errors.js';
import { fetchWithTimeout, retry, safeErrorBody } from '../../lib/http.js';

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';

const UNAVAILABLE = 'Plate AI is unavailable right now. Please try again in a moment.';

function assertConfigured() {
  if (!features.gemini) {
    throw serviceUnavailable('Plate AI is not configured on this server.', {
      internalMessage: 'GEMINI_API_KEY is missing',
    });
  }
}

function isTransient(error) {
  // 429 is a per-model quota. Retrying the same model does not help; the
  // fallback chain in callGemini handles that instead.
  return error instanceof ApiError && [500, 502, 503, 504].includes(error.status);
}

function isQuotaError(error) {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 429) return true;
  return /RESOURCE_EXHAUSTED|quota|rpd|rate.?limit|Too Many Requests/i.test(error.message);
}

function isMissingModel(error) {
  return error instanceof ApiError && (error.status === 404 || /NOT_FOUND|not found/i.test(error.message));
}

function supportsThinking(model) {
  return /^gemini-3/i.test(model) || /thinking/i.test(model);
}

function bodyForModel(model, body) {
  const generationConfig = { ...(body.generationConfig || {}) };
  if (!supportsThinking(model)) delete generationConfig.thinkingConfig;
  return { ...body, generationConfig };
}

function modelChain(preferred) {
  return [preferred, ...env.gemini.fallbackModels].filter(
    (model, index, list) => model && list.indexOf(model) === index
  );
}

/** model -> timestamp. Skip models that already hit today's RPD. */
const exhaustedUntil = new Map();
const QUOTA_COOLDOWN_MS = 6 * 60 * 60 * 1000;

function isExhausted(model) {
  const until = exhaustedUntil.get(model);
  return Boolean(until && until > Date.now());
}

function markExhausted(model) {
  exhaustedUntil.set(model, Date.now() + QUOTA_COOLDOWN_MS);
  console.warn(`[gemini] ${model} hit quota; skipping it for a few hours`);
}

async function callGemini({ model, body, timeoutMs }) {
  assertConfigured();

  const response = await fetchWithTimeout(`${API_ROOT}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.gemini.apiKey,
    },
    body: JSON.stringify(body),
    timeoutMs: timeoutMs ?? env.gemini.timeoutMs,
    serviceName: 'Plate AI',
  });

  if (!response.ok) {
    const detail = await safeErrorBody(response);
    const status = response.status === 429 ? 429 : response.status >= 500 ? 503 : response.status;
    throw new ApiError(status, 'ai_error', status === 429 ? 'Plate AI is busy. Please try again in a moment.' : UNAVAILABLE, {
      internalMessage: `Gemini ${model} responded ${response.status}: ${detail}`,
    });
  }

  const data = await response.json().catch(() => null);
  const candidate = data?.candidates?.[0];

  if (candidate?.finishReason === 'SAFETY' || data?.promptFeedback?.blockReason) {
    throw unprocessable("Plate can't help with that request.", {
      internalMessage: `Gemini blocked the request: ${
        data?.promptFeedback?.blockReason || candidate?.finishReason
      }`,
    });
  }

  const text = (candidate?.content?.parts || [])
    .filter((part) => !part?.thought && typeof part?.text === 'string')
    .map((part) => part.text)
    .join('')
    .trim();

  if (!text) {
    throw new ApiError(502, 'ai_empty', UNAVAILABLE, {
      internalMessage: `Gemini ${model} returned no text (finishReason=${candidate?.finishReason})`,
    });
  }

  return text;
}

async function callGeminiWithFallback({ model, body, timeoutMs }) {
  const chain = modelChain(model);
  let lastError;

  for (const candidate of chain) {
    if (isExhausted(candidate)) {
      console.warn(`[gemini] skipping ${candidate} (still over quota)`);
      continue;
    }

    try {
      const text = await callGemini({
        model: candidate,
        body: bodyForModel(candidate, body),
        timeoutMs,
      });
      if (candidate !== model) console.warn(`[gemini] ${model} unavailable, used ${candidate}`);
      return text;
    } catch (error) {
      lastError = error;
      if (isQuotaError(error) || isMissingModel(error)) {
        if (isQuotaError(error)) markExhausted(candidate);
        console.warn(`[gemini] ${candidate} failed, trying next model:`, error.message);
        continue;
      }
      throw error;
    }
  }

  throw (
    lastError ||
    serviceUnavailable('Plate AI is unavailable right now. Please try again in a moment.', {
      internalMessage: `No Gemini model left to try (primary=${model})`,
    })
  );
}

/** Strips markdown fences that occasionally survive JSON mode. */
function parseJson(text, context) {
  const cleaned = text
    .replace(/^\s*```(?:json)?/i, '')
    .replace(/```\s*$/, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new ApiError(502, 'ai_invalid_json', UNAVAILABLE, {
      internalMessage: `Gemini returned unparseable JSON for ${context}: ${cleaned.slice(0, 300)}`,
      cause: error,
    });
  }
}

function toParts({ prompt, images = [] }) {
  const parts = [];
  for (const image of images) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }
  parts.push({ text: prompt });
  return parts;
}

/**
 * Asks Gemini for JSON that conforms to `responseSchema`, parses it, then hands
 * it to `validate` (a Zod schema) so malformed AI output never reaches Mongo.
 */
export async function generateStructured({
  prompt,
  systemInstruction,
  responseSchema,
  validate,
  images = [],
  history = [],
  model = env.gemini.model,
  temperature = 0.9,
  context = 'structured request',
  attempts = 2,
}) {
  return retry(
    async () => {
      const text = await callGeminiWithFallback({
        model,
        body: {
          ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
          contents: [...history, { role: 'user', parts: toParts({ prompt, images }) }],
          generationConfig: {
            temperature,
            responseMimeType: 'application/json',
            ...(responseSchema ? { responseSchema } : {}),
            thinkingConfig: { thinkingLevel: 'minimal' },
          },
        },
      });

      const json = parseJson(text, context);
      if (!validate) return json;

      const result = validate.safeParse(json);
      if (!result.success) {
        throw new ApiError(502, 'ai_invalid_shape', UNAVAILABLE, {
          internalMessage: `Gemini output failed validation for ${context}: ${result.error.message.slice(0, 400)}`,
        });
      }
      return result.data;
    },
    {
      attempts,
      delayMs: 600,
      // Retry both flaky upstreams and one-off malformed generations.
      shouldRetry: (error) =>
        isTransient(error) ||
        (error instanceof ApiError && ['ai_invalid_json', 'ai_invalid_shape', 'ai_empty'].includes(error.code)),
    }
  );
}

/** Free-form conversational reply. Used for Plate chat and cooking questions. */
export async function generateText({
  prompt,
  systemInstruction,
  history = [],
  images = [],
  model = env.gemini.model,
  temperature = 0.7,
  maxOutputTokens = 900,
}) {
  return retry(
    () =>
      callGeminiWithFallback({
        model,
        body: {
          ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
          contents: [...history, { role: 'user', parts: toParts({ prompt, images }) }],
          generationConfig: {
            temperature,
            maxOutputTokens,
            thinkingConfig: { thinkingLevel: 'minimal' },
          },
        },
      }),
    { attempts: 2, delayMs: 600, shouldRetry: isTransient }
  );
}
