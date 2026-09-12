import { useEffect, useRef, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  focusManager,
} from '@tanstack/react-query';

import { useAuth } from '@/ctx/auth';
import { ApiError } from '@/lib/api';

/**
 * The cache needs to call `signOut`, which changes identity between renders, so the
 * current one is kept on a small mutable bridge the client closes over once.
 */
type AuthBridge = {
  signOut: () => Promise<void>;
  signedOut: boolean;
};

/**
 * The bridge and the client live outside React: the app has a single query cache
 * for its whole lifetime, and keeping them out of component state lets the
 * sign-out callback be swapped without recreating the cache.
 */
const authBridge: AuthBridge = {
  signOut: async () => {},
  signedOut: false,
};

function createClient(auth: AuthBridge) {
  const onError = (error: unknown) => {
    if (error instanceof ApiError && error.isAuthError && !auth.signedOut) {
      auth.signedOut = true;
      auth.signOut().catch(() => {});
    }
  };

  return new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 30 * 60 * 1000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && !error.isRetryable) return false;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

const queryClient = createClient(authBridge);

/**
 * React Query owns server state: caching, loading, and error states come from
 * one place so screens never hold stale copies of MongoDB data.
 *
 * A 401 means the Auth0 token is no longer good, so the session is cleared once
 * and the app returns to sign-in rather than showing broken screens.
 */
export function QueryProvider({ children }: PropsWithChildren) {
  const { signOut, session } = useAuth();

  useEffect(() => {
    authBridge.signOut = signOut;
  }, [signOut]);

  // A fresh sign-in must not inherit the previous account's cached documents.
  const userId = session?.user.id ?? null;
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const previous = previousUserId.current;
    previousUserId.current = userId;
    if (previous === undefined || previous === userId) return;
    authBridge.signedOut = false;
    queryClient.clear();
  }, [userId]);

  // Native apps have no window focus event; use foreground/background instead.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
