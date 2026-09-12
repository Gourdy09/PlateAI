import { gatewayTimeout, serviceUnavailable } from './errors.js';

/**
 * fetch with a hard timeout. Network and timeout failures are converted to
 * ApiError so route handlers never surface raw undici errors.
 */
export async function fetchWithTimeout(url, { timeoutMs = 30_000, serviceName = 'Service', ...init } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw gatewayTimeout(`${serviceName} took too long to respond. Please try again.`, {
        internalMessage: `${serviceName} request aborted after ${timeoutMs}ms`,
        cause: error,
      });
    }
    throw serviceUnavailable(`${serviceName} is unreachable right now. Please try again.`, {
      internalMessage: `${serviceName} fetch failed: ${error?.message}`,
      cause: error,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Read an error body without letting a huge/invalid payload break error handling. */
export async function safeErrorBody(response) {
  try {
    const text = await response.text();
    return text.slice(0, 600);
  } catch {
    return '';
  }
}

export async function retry(fn, { attempts = 2, delayMs = 400, shouldRetry = () => true } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1 || !shouldRetry(error)) break;
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}
