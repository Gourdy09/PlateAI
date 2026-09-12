import 'dotenv/config';

function str(name, fallback = '') {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function int(name, fallback) {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: str('NODE_ENV', 'development'),
  port: int('PORT', 4000),

  mongodbUri: str('MONGODB_URI'),

  auth0: {
    domain: str('AUTH0_DOMAIN'),
    audience: str('AUTH0_AUDIENCE'),
  },

  gemini: {
    apiKey: str('GEMINI_API_KEY'),
    model: str('GEMINI_MODEL', 'gemini-2.5-flash'),
    visionModel: str('GEMINI_VISION_MODEL', 'gemini-2.5-flash'),
    timeoutMs: int('GEMINI_TIMEOUT_MS', 45_000),
  },

  elevenlabs: {
    apiKey: str('ELEVENLABS_API_KEY'),
    voiceId: str('ELEVENLABS_VOICE_ID', '21m00Tcm4TlvDq8ikWAM'),
    ttsModel: str('ELEVENLABS_TTS_MODEL', 'eleven_flash_v2_5'),
    sttModel: str('ELEVENLABS_STT_MODEL', 'scribe_v1'),
    timeoutMs: int('ELEVENLABS_TIMEOUT_MS', 45_000),
  },

  images: {
    /** Optional. Without it, recipe cards use Plate's own typographic cover. */
    unsplashAccessKey: str('UNSPLASH_ACCESS_KEY'),
  },

  /** Comma-separated origins; empty means reflect the request origin (dev default). */
  corsOrigins: str('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export const features = {
  get gemini() {
    return Boolean(env.gemini.apiKey);
  },
  get elevenlabs() {
    return Boolean(env.elevenlabs.apiKey);
  },
  get auth0() {
    return Boolean(env.auth0.domain);
  },
  /** True when access tokens are verifiable JWTs rather than opaque Auth0 tokens. */
  get auth0Jwt() {
    return Boolean(env.auth0.domain && env.auth0.audience);
  },
};

/** Fatal misconfiguration — the process cannot serve requests at all. */
export function assertRequiredEnv() {
  const missing = [];
  if (!env.mongodbUri) missing.push('MONGODB_URI');
  if (!env.auth0.domain) missing.push('AUTH0_DOMAIN');
  return missing;
}
