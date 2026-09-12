/** Small display helpers. Option vocabularies come from the API, not from here. */

export function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(name?: string | null, email?: string | null) {
  const fromName = name?.trim().split(' ')[0];
  if (fromName) return fromName.charAt(0).toUpperCase() + fromName.slice(1);
  const local = email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  if (!local) return 'Chef';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/** "1 h 20 min" reads better than "80 min" once a recipe runs long. */
export function formatMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
