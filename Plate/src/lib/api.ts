import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Thin transport for the Plate API.
 *
 * Every request carries the Auth0 access token; the backend derives the user
 * from it. No provider keys or database credentials exist on the client.
 */

const DEFAULT_TIMEOUT_MS = 30_000;
const LONG_TIMEOUT_MS = 90_000;

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** True when the caller should offer a retry rather than a dead end. */
  get isRetryable() {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }

  get isAuthError() {
    return this.status === 401;
  }
}

export const NETWORK_ERROR_MESSAGE =
  'Plate cannot reach the internet right now. Check your connection and try again.';

function isUsableApiUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    // Auth0 API identifier — not a reachable host.
    if (url.hostname === 'api.plate.app') return false;
    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

function readExtraApiUrl() {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const value = extra?.apiUrl;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function resolveApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv && isUsableApiUrl(fromEnv)) return fromEnv.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  const expoGoHost =
    typeof hostUri === 'string' && hostUri.length > 0 ? hostUri.split(':')[0] : undefined;

  // Expo Go on a LAN should keep talking to the machine running Metro, not Render.
  if (expoGoHost && expoGoHost !== 'localhost' && expoGoHost !== '127.0.0.1') {
    return `http://${expoGoHost}:4000`;
  }

  const fromExtra = readExtraApiUrl();
  if (fromExtra && isUsableApiUrl(fromExtra)) return fromExtra.replace(/\/$/, '');

  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  return 'http://127.0.0.1:4000';
}

export const apiBaseUrl = resolveApiUrl();

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** AI, voice, and image requests need more headroom than a plain read. */
  long?: boolean;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  path: string,
  accessToken: string | undefined,
  { method = 'GET', body, long = false, signal }: RequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    long ? LONG_TIMEOUT_MS : DEFAULT_TIMEOUT_MS
  );
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    const timedOut = controller.signal.aborted;
    throw new ApiError(
      0,
      timedOut ? 'timeout' : 'network_error',
      timedOut ? 'That took too long. Please try again.' : NETWORK_ERROR_MESSAGE
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; code?: string; details?: unknown }
    | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.code ?? 'request_failed',
      payload?.error ??
        (payload
          ? 'Something went wrong. Please try again.'
          : `The Plate API returned ${response.status} without a JSON body. Confirm Expo is talking to the current server on port 4000.`),
      payload?.details
    );
  }

  return payload as T;
}

/** Turns any thrown value into a message that is safe to show a user. */
export function messageFromError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) {
    return /fetch|network|json/i.test(error.message) ? NETWORK_ERROR_MESSAGE : error.message;
  }
  return fallback;
}
