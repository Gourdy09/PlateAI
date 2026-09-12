import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { fetchMe, login as apiLogin, signup as apiSignup, type AuthUser } from '@/lib/api';

const SESSION_KEY = 'plate.session';

type SessionPayload = {
  token: string;
  user: AuthUser;
};

type AuthContextValue = {
  session: SessionPayload | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
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

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await getItem(SESSION_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as SessionPayload;
        if (!parsed?.token) return;
        const { user } = await fetchMe(parsed.token);
        if (active) {
          const next = { token: parsed.token, user };
          await setItem(SESSION_KEY, JSON.stringify(next));
          setSession(next);
        }
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

  const value: AuthContextValue = {
    session,
    isLoading,
    async signIn(email, password) {
      const result = await apiLogin(email.trim().toLowerCase(), password);
      const next = { token: result.token, user: result.user };
      await setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
    },
    async signUp(name, email, password) {
      const result = await apiSignup(name.trim(), email.trim().toLowerCase(), password);
      const next = { token: result.token, user: result.user };
      await setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
    },
    async signOut() {
      await deleteItem(SESSION_KEY);
      setSession(null);
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
