// The step counter's browser side (buying-and-participation report, 2026-11-13, F4 and S5): when someone opens the shop, picks an item,
// taps Try one on, Pay, Ask someone to buy it, Copy the link or Send to a friend, or opens a keepsake, it adds one to that day's total
// (functions/api/steps.js).
// For the zone sponsors' report (brand report B8, 2026-11-14) the ocean also counts a visit that spends a moment in a zone, and a visit
// that taps a creature in a zone: which zone, and nothing else (countZone below).
// It sends only the step's name, whether the shop came from an ask link, whether this is Instagram's or Facebook's own browser (worked out
// here; the browser's description never leaves the phone) and the shop's layout. No cookie, nothing stored on the phone, nothing about
// who. Each step counts at most once per page view. It counts only on the live site, which marks its pages with
// <meta name="ocean-steps" content="on"> (tools/build-site2.mjs), never on the next/ preview or a test build.

export const SHOP_STEPS = Object.freeze(['shop-open', 'item-picked', 'try-on', 'pay', 'ask', 'copy-link', 'send', 'keepsake', 'print']);
export const ZONE_IDS = Object.freeze(['shore', 'reef', 'kelp', 'open', 'deep', 'abyss']);
export const STEPS = Object.freeze([...SHOP_STEPS, ...ZONE_IDS.flatMap((z) => [`zone-${z}`, `tap-${z}`])]);
const ENDPOINT = new URL('../api/steps', import.meta.url).href;

// Instagram's and Facebook's own browsers, where Apple Pay and Google Pay often don't show.
export const inAppBrowser = (ua) => /\b(Instagram|FBAN|FBAV|FB_IAB|FBIOS)\b/.test(String(ua || ''));

// What is sent for one step: these four fields and nothing else.
export function stepBody(step, { ask = false, app = false, layout = '' } = {}) {
  const p = new URLSearchParams({ s: step, ask: ask ? '1' : '0', app: app ? '1' : '0' });
  if (layout) p.set('layout', layout);
  return p.toString();
}

const sent = new Set();
let on = null;
const counting = () => (on ??= typeof document !== 'undefined' && document.querySelector('meta[name="ocean-steps"]')?.getAttribute('content') === 'on');

// Adds one to today's total for this step, once per page view. Never throws and never waits: a count that can't be sent is lost.
export function count(step, { ask = false, layout = '' } = {}) {
  if (!STEPS.includes(step) || sent.has(step) || !counting()) return;
  sent.add(step);
  try {
    const app = inAppBrowser(navigator.userAgent);
    // keepalive: Pay and Try one on leave the page straight away, and the count still goes.
    fetch(ENDPOINT, { method: 'POST', body: stepBody(step, { ask, app, layout }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, keepalive: true, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' }).catch(() => {});
  } catch { /* a count is never worth an error */ }
}

// Counts a step when anything matching the selector is tapped, now or added later (the ocean's card sheet is drawn on demand).
const watched = new Set();
export function countTaps(selector, step) {
  if (typeof document === 'undefined' || watched.has(`${selector}|${step}`)) return;
  watched.add(`${selector}|${step}`);
  document.addEventListener('click', (e) => { if (e.target instanceof Element && e.target.closest(selector)) count(step); }, true);
}

// The zone sponsors' counts: kind 'zone' (this visit spent a moment in the zone) or 'tap' (this visit tapped a creature living there).
// Once per zone per page view, like every step; a zone that isn't one of the six is never sent.
export const countZone = (kind, zoneId) => { if ((kind === 'zone' || kind === 'tap') && ZONE_IDS.includes(zoneId)) count(`${kind}-${zoneId}`); };
