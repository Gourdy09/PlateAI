import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import {
  completeAuthFromRedirectParams,
  fetchUserInfo,
  loginWithConnection,
  loginWithPassword,
  logoutBrowserSession,
  refreshTokens,
  requestPasswordReset,
  signupWithPassword,
  type AuthSessionPayload,
  type AuthUser,
} from '@/lib/auth0';

const SESSION_KEY = 'plate.auth0.session';

function assertLoggedIn(session: AuthSessionPayload | null | undefined): AuthSessionPayload {
  if (!session?.tokens?.accessToken || !session.user?.id) {
    throw new Error('Sign in did not complete. Please try again.');
  }
  return session;
}

type AuthContextValue = {
  session: AuthSessionPayload | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthSessionPayload>;
  signUp: (name: string, email: string, password: string) => Promise<AuthSessionPayload>;
  signInWithGoogle: () => Promise<AuthSessionPayload>;
  signInWithApple: () => Promise<AuthSessionPayload>;
  resetPassword: (email: string) => Promise<string>;
  finishOAuthRedirect: (params: {
    code?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function getItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

async function persist(session: AuthSessionPayload) {
  await setItem(SESSION_KEY, JSON.stringify(session));
}

async function restoreSession(): Promise<AuthSessionPayload | null> {
  const raw = await getItem(SESSION_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as AuthSessionPayload;
  if (!parsed?.tokens?.accessToken || !parsed.user) return null;

  let tokens = parsed.tokens;
  if (tokens.expiresAt < Date.now() + 60_000) {
    if (!tokens.refreshToken) {
      await deleteItem(SESSION_KEY);
      return null;
    }
    tokens = { ...tokens, ...(await refreshTokens(tokens.refreshToken)) };
  }

  const user = await fetchUserInfo(tokens.accessToken);
  const next = { tokens, user };
  await persist(next);
  return next;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSessionPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const next = await restoreSession();
        if (active) setSession(next);
      } catch {
        await deleteItem(SESSION_KEY);
        if (active) setSession(null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // The backend creates the MongoDB user record on the first authenticated
  // request, which the app makes as soon as it loads its bootstrap data.
  const applySession = useCallback(async (next: AuthSessionPayload) => {
    await persist(next);
    setSession(next);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const next = await loginWithPassword(email, password);
      await applySession(next);
      return assertLoggedIn(next);
    },
    [applySession]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const next = await signupWithPassword(name, email, password);
        await applySession(next);
        return assertLoggedIn(next);
      } catch (error) {
        const created =
          typeof error === 'object' &&
          error !== null &&
          'signupCreated' in error &&
          Boolean((error as { signupCreated?: boolean }).signupCreated);

        if (created) {
          throw new Error(
            error instanceof Error
              ? error.message
              : 'Your account was created, but automatic sign-in failed. Please sign in with the same email and password.'
          );
        }
        throw error;
      }
    },
    [applySession]
  );

  const signInWithGoogle = useCallback(async () => {
    const next = await loginWithConnection('google-oauth2');
    if (!next) throw new Error('Google sign in did not complete. Please try again.');
    await applySession(next);
    return assertLoggedIn(next);
  }, [applySession]);

  const signInWithApple = useCallback(async () => {
    const next = await loginWithConnection('apple');
    if (!next) throw new Error('Apple sign in did not complete. Please try again.');
    await applySession(next);
    return assertLoggedIn(next);
  }, [applySession]);

  const resetPassword = useCallback(async (email: string) => {
    return requestPasswordReset(email);
  }, []);

  const finishOAuthRedirect = useCallback(
    async (params: {
      code?: string | string[];
      error?: string | string[];
      error_description?: string | string[];
    }) => {
      const next = await completeAuthFromRedirectParams(params);
      if (!next) return false;
      await applySession(next);
      return true;
    },
    [applySession]
  );

  const signOut = useCallback(async () => {
    await deleteItem(SESSION_KEY);
    setSession(null);
    await logoutBrowserSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      resetPassword,
      finishOAuthRedirect,
      signOut,
    }),
    [
      session,
      isLoading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      resetPassword,
      finishOAuthRedirect,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export type { AuthUser };
