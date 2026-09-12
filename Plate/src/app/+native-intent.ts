/**
 * Auth0 returns to `plate://redirect` (and Expo Go sometimes to `exp://…/--/redirect`).
 * Map those system URLs onto the in-app /redirect route before Expo Router
 * treats them as the launch path.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  const trimmed = path.replace(/^\/+/, '');
  const withoutPrefix = trimmed.startsWith('--/') ? trimmed.slice(3) : trimmed;
  if (withoutPrefix === 'redirect' || withoutPrefix.startsWith('redirect?')) {
    const query = withoutPrefix.includes('?') ? withoutPrefix.slice(withoutPrefix.indexOf('?')) : '';
    return `/redirect${query}`;
  }
  return path;
}
