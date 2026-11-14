// Browser-safe helpers over names.json (built by site2-data.js packNames). Rows hold the username, or null when its owner has hidden it.
export const FLAG_FOUNDER = 1;
// The Spotlight (owner, 2026-11-12): a creature someone paid to have seen for 7 days.
export const FLAG_SPOTLIGHT = 2;

// Folders fan out by the first two characters of the key, so no folder holds tens of thousands of entries.
export const cardPath = (key) => `c/${key.slice(0, 2)}/${key}/`;
// Until 15 Nov 2026 each thumbnail was a file of its own at this address. Only a creature that left just then still gets one (a blank).
export const thumbPath = (key) => `thumbs/${key.slice(0, 2)}/${key}.webp`;
// Thumbnails now come packed, the few whose keys start with the same three characters in one file of base64 webp pictures (16 folders of at most 256), so the site
// stays far below Cloudflare Pages' 20,000-file limit however many people join (15 Nov 2026).
export const thumbPack = (key) => `thumbs/${key[0]}/${key.slice(0, 3)}.json`;

const packs = new Map();
// The picture as a data: address (the pages may show data: pictures), or null when the creature has none. Each pack is asked for once a visit.
export function thumbData(key) {
  const url = new URL(`../${thumbPack(String(key))}`, import.meta.url).href;
  if (!packs.has(url)) packs.set(url, fetch(url).then((r) => (r.ok ? r.json() : {})).catch(() => { packs.delete(url); return {}; }));
  return packs.get(url).then((pack) => (typeof pack[key] === 'string' ? `data:image/webp;base64,${pack[key]}` : null));
}
// Shows a creature's thumbnail in img. With none, img gets an 'error' event, as a missing picture file used to give it.
export function showThumb(img, key) {
  thumbData(key).then((src) => { if (src) img.src = src; else img.dispatchEvent(new Event('error')); });
}

export function unpackRow(names, row) {
  const [key, name, si, zi, area, flags, slot] = row;
  const sp = names.species[si]; const z = names.zones[zi];
  return { key, name, species: sp.id, speciesLabel: sp.label, zone: z.id, zoneLabel: z.label, area, founder: (flags & FLAG_FOUNDER) !== 0, spotlight: (flags & FLAG_SPOTLIGHT) !== 0, slot };
}

// The creatures in the Spotlight whose names show, in a different order each day (dateStr: YYYY-MM-DD), so each gets its turn first.
export function spotlightRows(names, dateStr) {
  const rows = (names?.rows || []).filter((r) => r[1] && (r[5] & FLAG_SPOTLIGHT));
  return dailyOrder(rows.map((r) => ({ id: r[0], r })), dateStr).map((x) => x.r);
}

// Apostrophes and hyphens go too, for Facebook short names ("D'Angelo", "Anne-Marie O."); an Instagram username never has them.
export const normalizeName = (s) => String(s ?? '').trim().toLowerCase().replace(/^@+/, '').replace(/[._\s'’-]/g, '');

// Find-box suggestions as a name is typed (owner, 2026-11-10). They come only from names.json, where a hidden person's row has no name,
// so a hidden name is never suggested: it is still found only by typing it in full and pressing Find. Made once per names.json, shortest
// names first and then in order, so the closest names come first. Each entry: { key, name, norm, speciesLabel }.
export function suggestIndex(names) {
  const out = [];
  for (const [key, name, si] of names?.rows ?? []) {
    if (typeof name !== 'string' || !name) continue;
    const norm = normalizeName(name);
    if (norm) out.push({ key, name, norm, speciesLabel: names.species?.[si]?.label ?? '' });
  }
  return out.sort((a, b) => a.norm.length - b.norm.length || (a.norm < b.norm ? -1 : a.norm > b.norm ? 1 : 0) || (a.key < b.key ? -1 : 1));
}

export const SUGGEST_LIMIT = 6;
// Names that start with what was typed, then names that hold it anywhere. Case, @, dots, underscores, spaces, apostrophes and hyphens
// don't matter (normalizeName). Stops early once it has enough names that start with it, so a phone does this on every key.
export function suggestNames(index, typed, limit = SUGGEST_LIMIT) {
  const q = normalizeName(typed);
  if (!q || !index) return [];
  const starts = [], holds = [];
  for (const s of index) {
    if (s.norm.length < q.length) continue;
    if (s.norm.startsWith(q)) { starts.push(s); if (starts.length === limit) break; }
    else if (holds.length < limit && s.norm.includes(q)) holds.push(s);
  }
  return [...starts, ...holds].slice(0, limit);
}

export function matchAnimals(names, q) {
  const needle = String(q ?? '').trim().toLowerCase();
  if (!needle) return [];
  return names.species.filter((s) => s.label.toLowerCase().includes(needle)).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export const speciesCount = (names, speciesId) => names.species.find((s) => s.id === speciesId)?.count ?? 0;

// A shuffle that is the same all day for everyone and different tomorrow (mulberry32 seeded from the date text).
export function dailyOrder(items, dateStr) {
  let h = 2166136261;
  for (const ch of String(dateStr)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export const neighbourhoodOf = (res) => res.neighbourhood ?? res.zone;

// Everyone tab. "Only one of its kind" is a species with a single resident in the whole ocean.
export const ONLY = 'only';

// Everyone of one animal in one zone (or, for speciesId 'only', the one-of-a-kinds), in the day's order. A shelf is the front of this list.
export function animalPeople(names, zoneId, speciesId, dateStr) {
  const zi = names.zones.findIndex((z) => z.id === zoneId);
  if (zi < 0) return [];
  const si = speciesId === ONLY ? -1 : names.species.findIndex((s) => s.id === speciesId);
  if (speciesId !== ONLY && si < 0) return [];
  const rows = names.rows.filter((r) => r[3] === zi && (speciesId === ONLY ? names.species[r[2]].count === 1 : r[2] === si));
  return dailyOrder(rows, dateStr);
}

// The zone's shelves: one-of-a-kinds first (only if there are any), then one per animal, most residents first. Empty zone gives [].
export function zoneShelves(names, zoneId, dateStr, perShelf = 12) {
  const zi = names.zones.findIndex((z) => z.id === zoneId);
  if (zi < 0) return [];
  const only = []; const bySpecies = new Map();
  for (const r of names.rows) {
    if (r[3] !== zi) continue;
    if (names.species[r[2]].count === 1) { only.push(r); continue; }
    (bySpecies.get(r[2]) || bySpecies.set(r[2], []).get(r[2])).push(r);
  }
  const shelves = [];
  if (only.length) shelves.push({ kind: 'only', speciesId: ONLY, heading: 'Only one of its kind', count: only.length, people: dailyOrder(only, dateStr).slice(0, perShelf) });
  const animals = [...bySpecies].map(([si, rows]) => ({ sp: names.species[si], rows })).sort((a, b) => b.rows.length - a.rows.length || a.sp.label.localeCompare(b.sp.label));
  for (const { sp, rows } of animals) shelves.push({ kind: 'animal', speciesId: sp.id, heading: `${sp.label} · ${rows.length}`, count: rows.length, people: dailyOrder(rows, dateStr).slice(0, perShelf) });
  return shelves;
}

// Surprise me: a random resident, weighted by 1 / sqrt(how many of that animal exist), so rare animals come up more often per person.
export function surprisePick(names, rand = Math.random) {
  const weight = (row) => 1 / Math.sqrt(Math.max(1, names.species[row[2]]?.count ?? 1));
  let total = 0;
  for (const row of names.rows) total += weight(row);
  if (!names.rows.length) return null;
  let left = rand() * total;
  for (const row of names.rows) { left -= weight(row); if (left < 0) return row; }
  return names.rows[names.rows.length - 1]; // rounding left a sliver over
}
