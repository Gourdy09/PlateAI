import mongoose from 'mongoose';

import { ApiError } from '../lib/errors.js';
import { env } from '../config/env.js';

/** Translates driver/library errors into the ApiError shape. */
function normalize(error) {
  if (error instanceof ApiError) return error;

  if (error instanceof mongoose.Error.ValidationError) {
    const first = Object.values(error.errors)[0];
    return new ApiError(400, 'validation_error', first?.message || 'Some of that information is not valid.', {
      internalMessage: error.message,
    });
  }
  if (error instanceof mongoose.Error.CastError) {
    return new ApiError(400, 'bad_request', 'That item could not be found.', {
      internalMessage: error.message,
    });
  }
  if (error?.code === 11000) {
    return new ApiError(409, 'conflict', 'That already exists.', { internalMessage: error.message });
  }
  if (error?.name === 'MongooseServerSelectionError' || error?.name === 'MongoNetworkError') {
    return new ApiError(503, 'database_unavailable', 'Plate cannot reach its database right now. Please try again shortly.', {
      internalMessage: error.message,
    });
  }
  if (error?.type === 'entity.too.large') {
    return new ApiError(413, 'payload_too_large', 'That upload is too large.', {
      internalMessage: error.message,
    });
  }
  if (error?.type === 'entity.parse.failed') {
    return new ApiError(400, 'bad_request', 'That request could not be read.', {
      internalMessage: error.message,
    });
  }

  return new ApiError(500, 'internal_error', 'Something went wrong on our side. Please try again.', {
    internalMessage: error?.message || String(error),
    cause: error,
  });
}

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, 'not_found', 'That endpoint does not exist.', {
    internalMessage: `No route for ${req.method} ${req.originalUrl}`,
  }));
}

export function errorHandler(error, req, res, _next) {
  const apiError = normalize(error);

  if (apiError.status >= 500 || apiError.code === 'ai_invalid_shape') {
    console.error(`[error] ${req.method} ${req.originalUrl} ${apiError.status} ${apiError.code}:`, apiError.message);
    if (apiError.cause && env.nodeEnv !== 'production') console.error(apiError.cause);
  } else {
    console.warn(`[warn] ${req.method} ${req.originalUrl} ${apiError.status} ${apiError.code}: ${apiError.message}`);
  }

  res.status(apiError.status).json({
    error: apiError.publicMessage,
    code: apiError.code,
    ...(apiError.details ? { details: apiError.details } : {}),
  });
}
