import crypto from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { env, features } from '../config/env.js';
import { isDbReady } from '../db/connect.js';
import { fetchWithTimeout } from '../lib/http.js';
import { serviceUnavailable, unauthorized } from '../lib/errors.js';
import { ensureUserContext } from '../services/users/index.js';

const IDENTITY_TTL_MS = 5 * 60 * 1000;
const PROFILE_REFRESH_MS = 24 * 60 * 60 * 1000;

/** token hash -> { identity, expiresAt }. Avoids re-verifying on every request. */
const identityCache = new Map();

function cacheKey(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function readCache(key) {
  const entry = identityCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    identityCache.delete(key);
    return null;
  }
  return entry.identity;
}

function writeCache(key, identity, ttlMs) {
  if (identityCache.size > 500) {
    // Cheap bound: drop the oldest insertion when the cache grows too large.
    const oldest = identityCache.keys().next().value;
    if (oldest) identityCache.delete(oldest);
  }
  identityCache.set(key, { identity, expiresAt: Date.now() + ttlMs });
}

let jwks = null;
function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${env.auth0.domain}/.well-known/jwks.json`), {
      cooldownDuration: 30_000,
      timeoutDuration: 8_000,
    });
  }
  return jwks;
}

/** Verify an Auth0-issued JWT access token locally against the tenant JWKS. */
async function identityFromJwt(token) {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: `https://${env.auth0.domain}/`,
    audience: env.auth0.audience,
  });
  if (!payload.sub) throw unauthorized();
  return {
    auth0Id: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    profileImage: typeof payload.picture === 'string' ? payload.picture : undefined,
    expiresAt: typeof payload.exp === 'number' ? payload.exp * 1000 : undefined,
  };
}

/** Resolve an opaque access token through the Auth0 /userinfo endpoint. */
async function identityFromUserInfo(token) {
  const response = await fetchWithTimeout(`https://${env.auth0.domain}/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: 10_000,
    serviceName: 'Auth0',
  });

  if (response.status === 401 || response.status === 403) {
    throw unauthorized('Your session expired. Please sign in again.');
  }
  if (response.status === 429) {
    throw serviceUnavailable('Sign-in service is busy. Please try again in a moment.');
  }
  if (!response.ok) {
    throw unauthorized('We could not verify your session.', {
      internalMessage: `Auth0 /userinfo responded ${response.status}`,
    });
  }

  const profile = await response.json().catch(() => ({}));
  if (!profile?.sub) {
    throw unauthorized('We could not verify your session.', {
      internalMessage: 'Auth0 /userinfo returned no sub',
    });
  }
  return {
    auth0Id: profile.sub,
    email: typeof profile.email === 'string' ? profile.email : undefined,
    name:
      (typeof profile.name === 'string' && profile.name) ||
      (typeof profile.nickname === 'string' && profile.nickname) ||
      undefined,
    profileImage: typeof profile.picture === 'string' ? profile.picture : undefined,
  };
}

function bearerToken(req) {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

async function resolveIdentity(token) {
  const key = cacheKey(token);
  const cached = readCache(key);
  if (cached) return cached;

  let identity;
  if (features.auth0Jwt) {
    try {
      identity = await identityFromJwt(token);
    } catch (error) {
      if (error instanceof Error && error.name?.startsWith('JWT')) {
        // An opaque token (no audience requested) also lands here — fall back once.
        identity = await identityFromUserInfo(token);
      } else {
        throw error;
      }
    }
  } else {
    identity = await identityFromUserInfo(token);
  }

  const ttl = identity.expiresAt
    ? Math.max(30_000, Math.min(IDENTITY_TTL_MS, identity.expiresAt - Date.now()))
    : IDENTITY_TTL_MS;
  writeCache(key, identity, ttl);
  return identity;
}

/**
 * Authenticates the request and loads (or creates) the caller's MongoDB records.
 * Every downstream handler derives ownership from `req.user._id`, never from the
 * request body, so users cannot reach another user's documents.
 */
export function requireAuth(req, _res, next) {
  const token = bearerToken(req);
  if (!token) {
    next(unauthorized('Please sign in to continue.'));
    return;
  }
  if (!features.auth0) {
    next(
      serviceUnavailable('Sign-in is not configured on this server.', {
        internalMessage: 'AUTH0_DOMAIN is missing',
      })
    );
    return;
  }
  if (!isDbReady()) {
    next(
      serviceUnavailable('Plate cannot reach its database right now. Please try again shortly.', {
        internalMessage: 'Mongo connection not ready',
      })
    );
    return;
  }

  resolveIdentity(token)
    .then(async (identity) => {
      const context = await ensureUserContext(identity, { profileRefreshMs: PROFILE_REFRESH_MS });
      req.identity = identity;
      req.user = context.user;
      req.preferences = context.preferences;
      req.settings = context.settings;
      next();
    })
    .catch(next);
}

/** Guards routes that read or write Mongo but do not need an authenticated user. */
export function requireDatabase(_req, _res, next) {
  if (!isDbReady()) {
    next(
      serviceUnavailable('Plate cannot reach its database right now. Please try again shortly.', {
        internalMessage: 'Mongo connection not ready',
      })
    );
    return;
  }
  next();
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
