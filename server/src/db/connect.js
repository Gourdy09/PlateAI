import mongoose from 'mongoose';

import { env } from '../config/env.js';

mongoose.set('strictQuery', true);

let connecting = null;

export function isDbReady() {
  return mongoose.connection.readyState === 1;
}

/**
 * Connect once and let Mongoose own reconnection. Callers await this at boot but
 * the server still starts if Mongo is briefly unavailable — requests that need
 * the database fail with a clean 503 via `requireDatabase`.
 */
export async function connectToDatabase() {
  if (isDbReady()) return mongoose.connection;
  if (connecting) return connecting;

  connecting = mongoose
    .connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 20,
      retryWrites: true,
    })
    .then((instance) => {
      connecting = null;
      return instance.connection;
    })
    .catch((error) => {
      connecting = null;
      throw error;
    });

  return connecting;
}

export function registerConnectionLogging() {
  mongoose.connection.on('connected', () => console.log('[db] connected'));
  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));
  mongoose.connection.on('error', (error) => console.error('[db] error', error.message));
}

export async function disconnectFromDatabase() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
}
