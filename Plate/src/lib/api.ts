import { Platform } from 'react-native';

const fallbackHost = Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? fallbackHost).replace(/\/$/, '');

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

type ApiError = {
  error?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function signup(name: string, email: string, password: string) {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function fetchMe(token: string) {
  return request<{ user: AuthUser }>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
