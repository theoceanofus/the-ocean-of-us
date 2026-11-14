// Neighbourhoods (spec 2026-11-08-ocean-environment): each zone is a row of places, each for animals of a similar size.
// Sizes are true inside a neighbourhood. Its `magnify` is applied to every resident's drawn size, so all neighbourhoods
// share one camera, one fog and one set of speed budgets. Browser-safe: the public page uses this too.
import { LENGTHS, artworkRadius } from '../render/metrics.js';
import { ZONES, zoneCentreX } from './zones.js';
import { COMMUNITY_SPECIES, BOTTOM_FAMILIES } from './community-species.js';
import { motionOf } from '../render/body-motion.js';

export const FOCAL = 0.95;                // same as render/scene.js; a test keeps them equal
export const SCREEN_W = 292;              // world units across a portrait phone at depth 600
export const HOOD_SPAN = 180000;          // each neighbourhood's stretch of x: room for at least 6,000 residents
// Ground rows run back as far as 1,425 deep (the Shore), so a slide would move the back row at under half the speed of the
// front and they would look as if they were moving by themselves. Sideways, every ground row moves as if at this depth, which
// is where the swimming lanes are (the Shore's rows sit further back, so they share the depth of their middle row, which keeps
// its screens as full as before). Height on screen and size still come from real depth. Ground rows are told by their height (placement puts them at 6 or less, and swimmers at 20 or more), which every published file has; the lane number is not published.
export const FLOOR_SLIDE_Z = 600, SHORE_SLIDE_Z = 900;
export const slideDepth = (res) => (res.home?.y <= 6 ? (res.zone === 'shore' ? SHORE_SLIDE_Z : FLOOR_SLIDE_Z) : undefined);
export const DRIFT = { x: 25, y: 12, z: 20 }; // how far a resident may wander from home, so neighbours never touch

// The camera in each zone, starting values tuned on the picture sheets. Floor animals stand on the floor only if there is one.
export const ZONE_CAM = {
  // Owner, 15 Nov 2026 ("Yes, rearrange it"): was h 240, hor .5, which put the two front walking rows behind a phone's buttons
  // and the back row far off and tiny. Lower and closer: the walking rows stand between a half and two thirds of the way down.
  shore: { h: 120, hor: 0.34, floor: true },
  reef: { h: 160, hor: 0.6, floor: true },
  kelp: { h: 120, hor: 0.62, floor: true },
  open: { h: 300, hor: 0.5, floor: false },
  deep: { h: 120, hor: 0.62, floor: true },
  abyss: { h: 120, hor: 0.62, floor: true },
};

const T = Infinity;
// [zone, id, label, min metres, max metres, reference metres (fills about 30% of a phone), landmark]
const TABLE = [
  ['shore', 'dewdrop', 'The Dewdrop', 0, .01, .0075, 'dewdrop-leaf'],
  ['shore', 'rock-pool', 'The Rock Pool', .01, .1, 0.085, 'barnacle-stone'],
  ['shore', 'tide-pools', 'Tide Pools', .1, .5, 0.37, 'rowing-boat'],
  ['shore', 'sand-flats', 'The Sand Flats', .5, 2.5, 1.5, 'old-pier'],
  ['shore', 'crocodile-point', 'Crocodile Point', 2.5, 12, 5.1, 'mangrove-roots'],
  ['shore', 'dinosaur-bluff', 'Dinosaur Bluff', 12, T, 14, 'fallen-tree'],
  ['reef', 'tiny-garden', 'The Tiny Garden', 0, .01, 0.011, 'great-polyp'],
  ['reef', 'nursery', 'The Nursery', .01, .1, 0.069, 'anemone-meadow'],
  ['reef', 'coral-gardens', 'Coral Gardens', .1, .5, 0.34, 'giant-table'],
  ['reef', 'reef-wall', 'The Reef Wall', .5, T, 1.2, 'rock-arch'],
  ['kelp', 'understory', 'The Understory', 0, .5, 0.28, 'lobster-trap'],
  ['kelp', 'kelp-halls', 'The Kelp Halls', .5, 2.5, 1.7, 'kelp-ring'],
  ['kelp', 'seal-rocks', 'Seal Rocks', 2.5, T, 3.2, 'seal-rocks'],
  ['open', 'sunlit-blue', 'The Sunlit Blue', 0, 2.5, 2, 'weed-raft'],
  ['open', 'shark-alley', 'Shark Alley', 2.5, 12, 5.4, 'far-wreck'],
  ['open', 'whale-road', 'Whale Road', 12, T, 18, 'seamount'],
  ['deep', 'glimmer', 'The Glimmer', 0, .01, 0.0041, 'glow-cloud'],
  ['deep', 'angel-drift', 'Angel Drift', .01, .1, 0.058, 'veil'],
  ['deep', 'jelly-canyon', 'Jelly Canyon', .1, .5, 0.55, 'light-curtain'],
  ['deep', 'narrows', 'The Narrows', .5, 2.5, 2.3, 'stone-bridge'],
  ['deep', 'squid-hollow', 'Squid Hollow', 2.5, 12, 11, 'submarine'],
  ['deep', 'whale-fall', 'The Whale Fall', 12, T, 30, 'whale-skeleton'],
  ['abyss', 'curiosities', 'The Curiosities', 0, .5, .084, 'fossil-cabinet'],
  ['abyss', 'old-steps', 'The Old Steps', .5, 12, 5.3, 'stone-steps'],
  ['abyss', 'sunken-city', 'The Sunken City', 12, 30, 20, 'stone-gateway'],
  ['abyss', 'titans-gate', "Titans' Gate", 30, T, 47, 'broken-statue'],
];

const byZone = Object.fromEntries(ZONES.map((z) => [z.id, TABLE.filter((row) => row[0] === z.id)]));
export const HOODS = TABLE.map(([zone, id, label, min, max, ref, landmark]) => {
  const list = byZone[zone], slot = list.findIndex((row) => row[1] === id);
  return { id, zone, label, min, max, ref, landmark, magnify: 9.66 / ref, screenAcross: ref / 0.3, slot, x0: zoneCentreX(zone) + (slot - list.length / 2) * HOOD_SPAN };
});
export const HOOD_BY_ID = Object.fromEntries(HOODS.map((h) => [h.id, h]));

export const hoodsOf = (zoneId) => HOODS.filter((h) => h.zone === zoneId);
export const lengthOf = (res) => (LENGTHS[res.species]?.metres ?? 1) * (res.size || 1);
export const hoodFor = (zoneId, metres) => HOODS.find((h) => h.zone === zoneId && metres < h.max);

const derived = new Map();
// The stored neighbourhood if there is one; public rows don't carry it, and derive the same answer from zone, species and size.
export function hoodOf(res) {
  if (res.hood && HOOD_BY_ID[res.hood]) return HOOD_BY_ID[res.hood];
  const key = `${res.zone}|${res.species}|${res.size || 1}`;
  if (!derived.has(key)) derived.set(key, hoodFor(res.zone, lengthOf(res)));
  return derived.get(key);
}

// How much of a phone's width this resident's drawing fills in that neighbourhood, at the viewing distance.
export const drawnShare = (res, hood) => (2 * artworkRadius(res.species) * 0.68 * (res.size || 1) * hood.magnify) / SCREEN_W;

export const walksOnFloor = (res) => res.species === 'starfish' || BOTTOM_FAMILIES.has(COMMUNITY_SPECIES[res.species]?.family);
// Roughly how tall an animal is for its length, for keeping neighbours apart: fish are long and low, walkers and jellies are not.
export function heightRatio(res) {
  const kind = motionOf(res.species);
  if (kind.k === 'upright') return 1.3;
  if (kind.bell) return 1;
  return walksOnFloor(res) ? 0.75 : 0.45;
}
