import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import { assertRequiredEnv, env, features } from './config/env.js';
import { connectToDatabase, disconnectFromDatabase, isDbReady, registerConnectionLogging } from './db/connect.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { cartRouter } from './routes/cart.js';
import { conversationsRouter } from './routes/conversations.js';
import { cookingRouter } from './routes/cooking.js';
import { fridgeRouter } from './routes/fridge.js';
import { mealPlansRouter } from './routes/mealPlans.js';
import { metaRouter } from './routes/meta.js';
import { preferencesRouter } from './routes/preferences.js';
import { recipesRouter } from './routes/recipes.js';
import { savedRouter } from './routes/saved.js';
import { settingsRouter } from './routes/settings.js';
import { shoppingRouter } from './routes/shopping.js';
import { swipesRouter } from './routes/swipes.js';
import { usersRouter } from './routes/users.js';
import { voiceRouter } from './routes/voice.js';

const missing = assertRequiredEnv();
if (missing.length) {
  console.error(`Missing required environment variables in server/.env: ${missing.join(', ')}`);
  console.error('See server/.env.example for the full list.');
  process.exit(1);
}

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins.length ? env.corsOrigins : true,
    credentials: true,
    maxAge: 600,
  })
);
// Voice recordings and food photos arrive as base64 JSON.
app.use(express.json({ limit: '20mb' }));

const generalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 240,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'You are going a little fast. Please try again in a moment.', code: 'rate_limited' },
});

/** AI and voice calls are expensive upstream, so they get a tighter budget. */
const aiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Budget per signed-in user, falling back to a normalised IP for anonymous calls.
  keyGenerator: (req) => req.headers.authorization?.slice(-32) || ipKeyGenerator(req.ip),
  message: { error: 'Plate is catching up on your last few requests. Try again shortly.', code: 'rate_limited' },
});

app.use(generalLimiter);

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'plate-api',
    database: isDbReady() ? 'connected' : 'disconnected',
    integrations: {
      auth0: features.auth0,
      auth0TokenVerification: features.auth0Jwt ? 'jwt' : 'userinfo',
      gemini: features.gemini,
      elevenlabs: features.elevenlabs,
    },
  });
});

app.use('/meta', metaRouter);
app.use('/users', usersRouter);
app.use('/preferences', preferencesRouter);
app.use('/settings', settingsRouter);
app.use('/fridge', fridgeRouter);
app.use('/recipes', aiLimiter, recipesRouter);
app.use('/swipes', swipesRouter);
app.use('/saved', savedRouter);
app.use('/cooking', cookingRouter);
app.use('/conversations', aiLimiter, conversationsRouter);
app.use('/voice', aiLimiter, voiceRouter);
app.use('/cart', cartRouter);
app.use('/meal-plans', mealPlansRouter);
app.use('/shopping', shoppingRouter);

app.use(notFoundHandler);
app.use(errorHandler);

registerConnectionLogging();

try {
  await connectToDatabase();
} catch (error) {
  // Start anyway: routes return a clean 503 until Mongoose reconnects.
  console.error('[db] initial connection failed:', error.message);
}

if (!features.gemini) console.warn('[config] GEMINI_API_KEY is not set — AI features will report as unavailable.');
if (!features.elevenlabs) console.warn('[config] ELEVENLABS_API_KEY is not set — voice will report as unavailable.');
if (!features.auth0Jwt) {
  console.warn('[config] AUTH0_AUDIENCE is not set — tokens are verified via Auth0 /userinfo instead of locally.');
}

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`Plate API listening on http://0.0.0.0:${env.port}`);
});

async function shutdown(signal) {
  console.log(`[server] ${signal} received, shutting down`);
  server.close(async () => {
    await disconnectFromDatabase();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
