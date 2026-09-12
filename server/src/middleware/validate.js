import mongoose from 'mongoose';
import { z } from 'zod';

import { badRequest } from '../lib/errors.js';

export const objectId = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), { message: 'Invalid id' });

/** Trimmed, length-capped list of short strings, deduplicated case-insensitively. */
export const tagList = (max = 40, itemMax = 60) =>
  z
    .array(z.string().trim().min(1).max(itemMax))
    .max(max)
    .transform((values) => {
      const seen = new Map();
      for (const value of values) {
        const key = value.toLowerCase();
        if (!seen.has(key)) seen.set(key, value);
      }
      return [...seen.values()];
    });

function firstIssue(error) {
  const issue = error.issues?.[0];
  if (!issue) return 'That request could not be processed.';
  const path = issue.path?.join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}

/**
 * Parses request parts with Zod and exposes the typed result on `req.valid`.
 * Handlers read only from `req.valid`, so unvalidated client input never reaches
 * a database query.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    req.valid = {};
    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        next(badRequest(firstIssue(result.error), { internalMessage: result.error.message }));
        return;
      }
      req.valid[part] = result.data;
    }
    next();
  };
}

export const idParam = z.object({ id: objectId });

export const pagination = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().trim().max(64).optional(),
});
