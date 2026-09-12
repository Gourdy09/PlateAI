import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'plate.session';

type AuthContextValue = {
  session: string | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<void>;
  signUp: (name: string, email: string) => Promise<void>;
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
  const [session, setSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const value = await getItem(SESSION_KEY);
        if (active) setSession(value);
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
    async signIn(email) {
      const next = email.trim().toLowerCase() || 'guest@plate.app';
      await setItem(SESSION_KEY, next);
      setSession(next);
    },
    async signUp(name, email) {
      const next = email.trim().toLowerCase() || name.trim() || 'chef@plate.app';
      await setItem(SESSION_KEY, next);
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
