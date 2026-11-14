// A "Save my finds" link (owner, 2026-11-10: "i dont want peoples progress in finding animals and stuff to be lost").
// Finds live in one browser, so Instagram's and Safari's lists are separate and clearing a browser loses them. The link carries
// them anywhere. It holds only animal kinds and the best Seek time, never a name, and sits after # so it never reaches the server.
const ID = /^[a-z0-9_]{1,40}$/;
const MAX_FINDS = 2000;
const SPOTTED = 'spotted', BEST = 'seek-best';

const kinds = (list) => (Array.isArray(list) ? list.filter((id) => typeof id === 'string' && ID.test(id)) : []);

// "#keep=1-<best in tenths of a second, or empty>-<kind>-<kind>…"
export function findsHash({ spotted = [], best = null } = {}) {
  const ids = [...new Set(kinds(spotted))].sort().slice(0, MAX_FINDS);
  const tenths = Number.isFinite(best) && best > 0 ? String(Math.round(best * 10)) : '';
  return `#keep=1-${tenths}-${ids.join('-')}`;
}

// What a link carries, or null if the address has no usable one.
export function readFindsHash(hash) {
  const m = /(?:^#|&)keep=([^&]*)/.exec(String(hash || ''));
  if (!m) return null;
  const [version, tenths, ...ids] = m[1].split('-');
  if (version !== '1') return null;
  const t = /^\d{1,7}$/.test(tenths || '') ? Number(tenths) / 10 : null;
  const spotted = [...new Set(kinds(ids))].slice(0, MAX_FINDS);
  if (!spotted.length && !(t > 0)) return null;
  return { spotted, best: t > 0 ? t : null };
}

// Adds a link's finds to this browser's: nothing already here is lost, and the faster Seek time wins. Returns how many finds are new here.
export function restoreFinds(memory, data) {
  const here = kinds(memory.recall(SPOTTED, []));
  const kept = new Set(here);
  for (const id of data.spotted) kept.add(id);
  const added = kept.size - new Set(here).size;
  if (added) memory.remember(SPOTTED, [...kept]);
  const best = memory.recall(BEST);
  if (data.best > 0 && (!(best > 0) || data.best < best)) memory.remember(BEST, data.best);
  return added;
}

// Everything this browser would put in a link.
export const savedFinds = (memory) => ({ spotted: kinds(memory.recall(SPOTTED, [])), best: memory.recall(BEST) });
