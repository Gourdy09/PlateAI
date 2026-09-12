import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import {
  fetchUserInfo,
  loginWithConnection,
  loginWithPassword,
  loginWithUniversal,
  logoutBrowserSession,
  refreshTokens,
  requestPasswordReset,
  signupWithPassword,
  type AuthSessionPayload,
  type AuthUser,
} from '@/lib/auth0';

const SESSION_KEY = 'plate.auth0.session';

type AuthContextValue = {
  session: AuthSessionPayload | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  resetPassword: (email: string) => Promise<string>;
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

function isPasswordGrantDisabled(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /password-realm|unauthorized_client|Grant type/i.test(message);
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

  async function applySession(next: AuthSessionPayload) {
    await persist(next);
    setSession(next);
  }

  const value: AuthContextValue = {
    session,
    isLoading,
    async signIn(email, password) {
      try {
        await applySession(await loginWithPassword(email, password));
      } catch (error) {
        if (!isPasswordGrantDisabled(error)) throw error;
        // Native apps without Password grant: Auth0 Universal Login (hosted).
        await applySession(
          await loginWithUniversal({
            loginHint: email.trim().toLowerCase(),
            screenHint: 'login',
          })
        );
      }
    },
    async signUp(name, email, password) {
      try {
        await applySession(await signupWithPassword(name, email, password));
      } catch (error) {
        if (!isPasswordGrantDisabled(error)) throw error;
        // Account may already be created; finish with Auth0 hosted login.
        await applySession(
          await loginWithUniversal({
            loginHint: email.trim().toLowerCase(),
            screenHint: 'login',
          })
        );
      }
    },
    async signInWithGoogle() {
      await applySession(await loginWithConnection('google-oauth2'));
    },
    async signInWithApple() {
      await applySession(await loginWithConnection('apple'));
    },
    async resetPassword(email) {
      return requestPasswordReset(email);
    },
    async signOut() {
      await deleteItem(SESSION_KEY);
      setSession(null);
      await logoutBrowserSession();
    },
  };

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
