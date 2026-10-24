// Persist user preferences (theme, sound, volume, nickname, solo config) in a cookie
// so they survive reloads and new visits.

const COOKIE_NAME = 'monkeyracer_settings';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const DEFAULT_SETTINGS = {
  theme: 'serika_dark',
  soundType: 'thock',
  volume: 0.35,
  username: '',
  soloMode: 'time',
  soloAmount: 120,
};

function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const entry = document.cookie.split('; ').find((c) => c.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

export function loadSettings() {
  try {
    const raw = readCookie(COOKIE_NAME);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(partial) {
  const next = { ...loadSettings(), ...partial };
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(next))}; max-age=${ONE_YEAR_SECONDS}; path=/; SameSite=Lax${secure}`;
  } catch {
    // Cookies blocked — settings simply won't persist
  }
  return next;
}
