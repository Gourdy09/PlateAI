import { useMemo } from 'react';

import { useAuth } from '@/ctx/auth';
import { apiRequest } from '@/lib/api';

type Body = Record<string, unknown> | undefined;

/**
 * Binds the current access token to the API transport. Screens and hooks call
 * this rather than touching `apiRequest` so the token can never be forgotten.
 */
export function useApiClient() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;

  return useMemo(
    () => ({
      isReady: Boolean(token),
      get: <T>(path: string, options?: { long?: boolean; signal?: AbortSignal }) =>
        apiRequest<T>(path, token, { ...options }),
      post: <T>(path: string, body?: Body, options?: { long?: boolean }) =>
        apiRequest<T>(path, token, { method: 'POST', body, ...options }),
      patch: <T>(path: string, body?: Body) =>
        apiRequest<T>(path, token, { method: 'PATCH', body }),
      put: <T>(path: string, body?: Body) => apiRequest<T>(path, token, { method: 'PUT', body }),
      del: <T>(path: string, body?: Body) => apiRequest<T>(path, token, { method: 'DELETE', body }),
    }),
    [token]
  );
}

export type ApiClient = ReturnType<typeof useApiClient>;

export const queryKeys = {
  bootstrap: ['bootstrap'] as const,
  meta: ['meta', 'options'] as const,
  preferences: ['preferences'] as const,
  settings: ['settings'] as const,
  fridge: ['fridge'] as const,
  cart: ['cart'] as const,
  saved: ['saved'] as const,
  discovery: (filters: unknown) => ['discovery', filters] as const,
  recipe: (id: string) => ['recipe', id] as const,
  recipeHistory: ['recipes', 'history'] as const,
  cookingSessions: (status?: string) => ['cooking', 'sessions', status ?? 'all'] as const,
  cookingSession: (id: string) => ['cooking', 'session', id] as const,
  conversations: ['conversations'] as const,
  conversationMessages: (id: string) => ['conversation', id, 'messages'] as const,
  swipes: (direction?: string) => ['swipes', direction ?? 'all'] as const,
  voiceStatus: ['voice', 'status'] as const,
  voices: ['voice', 'voices'] as const,
  shoppingProviders: ['shopping', 'providers'] as const,
};
