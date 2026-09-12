import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

function readExtra(key: 'auth0Domain' | 'auth0ClientId') {
  const extra = Constants.expoConfig?.extra as Record<string, string | null | undefined> | undefined;
  const value = extra?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

const domain =
  process.env.EXPO_PUBLIC_AUTH0_DOMAIN?.trim() || readExtra('auth0Domain') || undefined;
const clientId =
  process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID?.trim() || readExtra('auth0ClientId') || undefined;
const connection =
  process.env.EXPO_PUBLIC_AUTH0_CONNECTION?.trim() || 'Username-Password-Authentication';

const PKCE_STORAGE_KEY = 'plate.auth0.pkce';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  picture?: string;
};

export type AuthTokens = {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt: number;
};

export type AuthSessionPayload = {
  tokens: AuthTokens;
  user: AuthUser;
};

function assertConfig() {
  if (!domain || !clientId) {
    throw new Error(
      'Auth0 is not configured. Set EXPO_PUBLIC_AUTH0_DOMAIN and EXPO_PUBLIC_AUTH0_CLIENT_ID in Plate/.env'
    );
  }
  return { domain, clientId };
}

function auth0Error(data: Record<string, unknown>, fallback: string) {
  const code =
    (typeof data.code === 'string' && data.code) ||
    (typeof data.error === 'string' && data.error) ||
    '';
  const description =
    (typeof data.error_description === 'string' && data.error_description) ||
    (typeof data.description === 'string' && data.description) ||
    (typeof data.message === 'string' && data.message) ||
    fallback;

  if (/invalid_signup|PasswordStrengthError|PasswordDictionaryError|PasswordNoUserInfoError/i.test(
    `${code} ${description}`
  )) {
    return new Error(
      'That password was rejected. Use at least 8 characters — no special character rules are required.'
    );
  }
  if (/user_exists|already.?exists/i.test(`${code} ${description}`)) {
    return new Error('An account with this email already exists. Try signing in instead.');
  }

  return new Error(description);
}

async function postForm(path: string, body: Record<string, string>) {
  const { domain } = assertConfig();
  const response = await fetch(`https://${domain}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw auth0Error(data, `Auth0 request failed (${response.status})`);
  return data;
}

async function postJson(path: string, body: Record<string, unknown>) {
  const { domain } = assertConfig();
  const response = await fetch(`https://${domain}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw auth0Error(data, `Auth0 request failed (${response.status})`);
  return data;
}

function tokensFromOauth(data: Record<string, unknown>): AuthTokens {
  const accessToken = String(data.access_token ?? '');
  if (!accessToken) throw new Error('Auth0 did not return an access token');
  const expiresIn = Number(data.expires_in ?? 3600);
  return {
    accessToken,
    idToken: typeof data.id_token === 'string' ? data.id_token : undefined,
    refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

function tokensFromTokenResponse(tokenResult: AuthSession.TokenResponse): AuthTokens {
  return {
    accessToken: tokenResult.accessToken,
    idToken: tokenResult.idToken,
    refreshToken: tokenResult.refreshToken,
    expiresAt: tokenResult.expiresIn
      ? Date.now() + tokenResult.expiresIn * 1000
      : Date.now() + 3600 * 1000,
  };
}

function savePkce(payload: { codeVerifier: string; redirectUri: string; state?: string | null }) {
  if (Platform.OS !== 'web') return;
  try {
    sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures; popup flow may still work.
  }
}

function readPkce(): { codeVerifier: string; redirectUri: string; state?: string | null } | null {
  if (Platform.OS !== 'web') return null;
  try {
    const raw = sessionStorage.getItem(PKCE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { codeVerifier: string; redirectUri: string; state?: string | null };
  } catch {
    return null;
  }
}

function clearPkce() {
  if (Platform.OS !== 'web') return;
  try {
    sessionStorage.removeItem(PKCE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function signupWithPassword(name: string, email: string, password: string) {
  const { clientId } = assertConfig();
  await postJson('/dbconnections/signup', {
    client_id: clientId,
    email: email.trim().toLowerCase(),
    password,
    name: name.trim(),
    connection,
  });
  return loginWithPassword(email, password);
}

export async function loginWithPassword(email: string, password: string) {
  const { clientId } = assertConfig();
  const data = await postForm('/oauth/token', {
    grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
    username: email.trim().toLowerCase(),
    password,
    client_id: clientId,
    realm: connection,
    scope: 'openid profile email offline_access',
  });
  const tokens = tokensFromOauth(data);
  const user = await fetchUserInfo(tokens.accessToken);
  return { tokens, user } satisfies AuthSessionPayload;
}

export async function requestPasswordReset(email: string) {
  const { clientId } = assertConfig();
  const response = await fetch(`https://${assertConfig().domain}/dbconnections/change_password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      email: email.trim().toLowerCase(),
      connection,
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    try {
      throw auth0Error(JSON.parse(text) as Record<string, unknown>, 'Could not send reset email');
    } catch (error) {
      if (error instanceof Error && error.message !== 'Could not send reset email') throw error;
      throw new Error(text || 'Could not send reset email');
    }
  }
  return text || "We've just sent you an email to reset your password.";
}

export async function fetchUserInfo(accessToken: string): Promise<AuthUser> {
  const { domain } = assertConfig();
  const response = await fetch(`https://${domain}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw auth0Error(data, 'Could not load Auth0 profile');
  return {
    id: String(data.sub ?? ''),
    name: String(data.name ?? data.nickname ?? data.email ?? 'Chef'),
    email: String(data.email ?? ''),
    picture: typeof data.picture === 'string' ? data.picture : undefined,
  };
}

export async function refreshTokens(refreshToken: string) {
  const { clientId } = assertConfig();
  const data = await postForm('/oauth/token', {
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  });
  return tokensFromOauth(data);
}

function discovery() {
  const { domain } = assertConfig();
  return {
    authorizationEndpoint: `https://${domain}/authorize`,
    tokenEndpoint: `https://${domain}/oauth/token`,
    revocationEndpoint: `https://${domain}/oauth/revoke`,
    endSessionEndpoint: `https://${domain}/v2/logout`,
  };
}

export function getRedirectUri() {
  // Keep a stable custom-scheme URI on native so Auth0 allow-list doesn't need LAN IPs.
  // Web still uses the current origin (e.g. http://localhost:8081/redirect).
  return AuthSession.makeRedirectUri({
    scheme: 'plate',
    path: 'redirect',
    native: 'plate://redirect',
  });
}

async function sessionFromCode(code: string, redirectUri: string, codeVerifier?: string) {
  const { clientId } = assertConfig();
  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri,
      extraParams: codeVerifier ? { code_verifier: codeVerifier } : undefined,
    },
    discovery()
  );
  const tokens = tokensFromTokenResponse(tokenResult);
  const user = await fetchUserInfo(tokens.accessToken);
  clearPkce();
  return { tokens, user } satisfies AuthSessionPayload;
}

/** Finish Auth0 login when the app (or web tab) lands on /redirect with ?code= */
export async function completeAuthFromRedirectParams(params: {
  code?: string | string[];
  error?: string | string[];
  error_description?: string | string[];
}) {
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  if (error) {
    const description = Array.isArray(params.error_description)
      ? params.error_description[0]
      : params.error_description;
    clearPkce();
    throw new Error(description || error);
  }

  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  if (!code) return null;

  const pkce = readPkce();
  const redirectUri = pkce?.redirectUri || getRedirectUri();
  return sessionFromCode(code, redirectUri, pkce?.codeVerifier);
}

/** Google / Apple / email Universal Login via Auth0 hosted page (no local server). */
export async function loginWithUniversal(options?: {
  connection?: string;
  screenHint?: 'login' | 'signup';
  loginHint?: string;
}) {
  const { clientId } = assertConfig();
  const redirectUri = getRedirectUri();
  const extraParams: Record<string, string> = {};
  if (options?.connection) extraParams.connection = options.connection;
  if (options?.screenHint) extraParams.screen_hint = options.screenHint;
  if (options?.loginHint) extraParams.login_hint = options.loginHint;

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    usePKCE: true,
    extraParams,
  });

  await request.makeAuthUrlAsync(discovery());
  savePkce({
    codeVerifier: request.codeVerifier ?? '',
    redirectUri,
    state: request.state,
  });

  const result = await request.promptAsync(discovery(), { showInRecents: true });
  if (result.type === 'success' && result.params.code) {
    return sessionFromCode(result.params.code, redirectUri, request.codeVerifier);
  }

  // Web full-page redirect: the opener is gone; /redirect will finish via completeAuthFromRedirectParams.
  if (Platform.OS === 'web' && (result.type === 'dismiss' || result.type === 'locked')) {
    return null;
  }

  clearPkce();
  if (result.type === 'dismiss' || result.type === 'cancel') {
    throw new Error('Sign in was cancelled');
  }
  throw new Error('Auth0 sign in failed');
}

export async function loginWithConnection(connectionName: string) {
  return loginWithUniversal({ connection: connectionName });
}

export async function logoutBrowserSession() {
  const { domain, clientId } = assertConfig();
  const returnTo = getRedirectUri();
  const url = `https://${domain}/v2/logout?client_id=${encodeURIComponent(clientId)}&returnTo=${encodeURIComponent(returnTo)}`;
  try {
    await WebBrowser.openAuthSessionAsync(url, returnTo);
  } catch {
    // Local session clear still happens even if the browser logout is dismissed.
  }
}
