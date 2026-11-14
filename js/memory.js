// What a phone remembers between visits. If storage is blocked, it still remembers for this visit.
const visit = new Map();
const PREFIX = 'ocean:';

export function remember(key, value) {
  visit.set(key, value);
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* blocked: the per-visit copy is enough */ }
}

export function recall(key, fallback = null) {
  if (visit.has(key)) return visit.get(key);
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw !== null) return JSON.parse(raw);
  } catch { /* blocked or unreadable */ }
  return fallback;
}

// What's saved this moment, even if another tab wrote it after this page loaded. null if there's nothing or it can't be read.
export function latest(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? null : JSON.parse(raw);
  } catch { return null; }
}

// Asks the browser not to clear what's saved when the phone runs short of space. Only once there's something worth keeping, and once a visit.
let asked = false;
export function keep() {
  if (asked) return;
  asked = true;
  try { navigator.storage?.persist?.()?.catch?.(() => {}); } catch { /* not offered here */ }
}
