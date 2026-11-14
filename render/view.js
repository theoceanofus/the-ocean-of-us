// The camera for the neighbourhoods (spec 2026-11-08-ocean-environment). Pages and Reels call this and add no camera of their own.
// A zone's rail is its occupied neighbourhoods end to end, joined by a short glide. `along` is world units along that rail.
import { CREATURE_SCALE, magnifyFor, project } from './scene.js';
import { poseAt } from './motion.js';
import { artworkRadius } from './metrics.js';
import { lerp, smooth, clamp } from './util.js';
import { TILE, landingTile } from './set-pieces.js';
import { FOCAL, HOOD_BY_ID, ZONE_CAM, hoodOf, hoodsOf } from '../core/hoods.js';
import { zoneCentreX } from '../core/zones.js';

const GLIDE = 120;              // rail length of the glide between two neighbourhoods
const HALF_SCREEN = 130;        // about half a phone screen, in world units, at the residents' depth
const REACH_FACTOR = 0.7;       // how far from a creature's centre a tap still finds it, as a share of its drawn radius

const cameraFor = (zoneId, x, hood, extra) => ({ x, ...pick(ZONE_CAM[zoneId]), z: 0, hoodScale: true, hood, ...extra });
const pick = ({ h, hor }) => ({ h, hor });

const stretchCache = new WeakMap();
// Each occupied neighbourhood of a zone, in order, with where its residents start and end.
function stretchesOf(zoneId, residents) {
  let byZone = stretchCache.get(residents), sum = 0;
  for (const r of residents) sum += r.home.x;
  if (!byZone || byZone.n !== residents.length || byZone.sum !== sum) { byZone = { n: residents.length, sum, zones: {} }; stretchCache.set(residents, byZone); }
  if (byZone.zones[zoneId]) return byZone.zones[zoneId];
  const found = new Map();
  for (const r of residents) {
    if (r.zone !== zoneId) continue;
    const id = hoodOf(r).id, s = found.get(id);
    if (s) { s.x0 = Math.min(s.x0, r.home.x); s.x1 = Math.max(s.x1, r.home.x); s.count++; }
    else found.set(id, { id, x0: r.home.x, x1: r.home.x, count: 1 });
  }
  return (byZone.zones[zoneId] = hoodsOf(zoneId).map((h) => found.get(h.id)).filter(Boolean));
}

export function railLength(zoneId, residents) {
  const list = stretchesOf(zoneId, residents);
  return list.length ? list.reduce((sum, s) => sum + (s.x1 - s.x0), 0) + GLIDE * (list.length - 1) : 0;
}

export function viewAt(zoneId, along, W, H, residents) {
  const list = stretchesOf(zoneId, residents);
  if (!list.length) return cameraFor(zoneId, zoneCentreX(zoneId), null);
  let left = clamp(along, 0, railLength(zoneId, residents));
  for (let i = 0; i < list.length; i++) {
    const s = list[i], len = s.x1 - s.x0;
    if (left <= len || i === list.length - 1) return cameraFor(zoneId, s.x0 + Math.min(left, len), s.id);
    left -= len;
    if (left < GLIDE) {
      const u = left / GLIDE, next = list[i + 1];
      return cameraFor(zoneId, lerp(s.x1, next.x0, smooth(u)), u < 0.5 ? s.id : next.id);
    }
    left -= GLIDE;
  }
  return cameraFor(zoneId, list.at(-1).x1, list.at(-1).id);
}

// Where along its zone's rail the middle of a neighbourhood is.
export function alongOfHood(hoodId, residents) {
  const zoneId = HOOD_BY_ID[hoodId].zone;
  let sum = 0;
  for (const s of stretchesOf(zoneId, residents)) {
    if (s.id === hoodId) return sum + (s.x1 - s.x0) / 2;
    sum += s.x1 - s.x0 + GLIDE;
  }
  return 0;
}

export function viewForHood(hoodId, W, H, residents) {
  const hood = HOOD_BY_ID[hoodId], s = stretchesOf(hood.zone, residents).find((x) => x.id === hoodId);
  if (!s) return cameraFor(hood.zone, hood.x0, hoodId);
  // Lands on the clearing with the neighbourhood's landmark, so the place is framed from the first moment.
  const tile = landingTile(hood, s.x0, s.x1);   // the clearing that holds its landmark
  // The clearing's middle, unless nobody would be in view from there: then the nearest resident.
  const centre = hood.x0 + TILE * (tile + 0.5);
  let nearest = s.x0;
  for (const r of residents) if (r.zone === hood.zone && hoodOf(r).id === hoodId && Math.abs(r.home.x - centre) < Math.abs(nearest - centre)) nearest = r.home.x;
  return cameraFor(hood.zone, Math.abs(nearest - centre) <= HALF_SCREEN ? centre : nearest, hoodId);
}

export function busiestHood(zoneId, residents) {
  const list = stretchesOf(zoneId, residents);
  return list.length ? HOOD_BY_ID[list.reduce((a, b) => (b.count > a.count ? b : a)).id] : null;
}

// The resident centred on screen, among its real neighbours: the view slides up or down to bring it to the middle.
export function viewForResident(res, t, W, H) {
  const p = poseAt(res, t), { h } = ZONE_CAM[res.zone];
  return cameraFor(res.zone, p.x, hoodOf(res).id, { focusId: res.id, hor: 0.5 - ((h - p.y) * FOCAL) / p.z });
}

// Who a tap lands on: the nearest resident within reach, or null. px, py and minReach are in canvas pixels.
export function tapTarget(residents, px, py, t, cam, W, H, minReach = 88) {
  let best = null;
  for (const r of residents) {
    const q = project(poseAt(r, t), cam, W, H);
    if (!q || q.dz < 40) continue;
    const drawn = artworkRadius(r.species) * CREATURE_SCALE * (r.size || 1) * magnifyFor(r, cam) * q.s;
    const d = Math.hypot(q.x - px, q.y - py);
    if (d < Math.max(minReach, drawn * REACH_FACTOR) && (!best || d < best.d)) best = { r, d };
  }
  return best ? best.r : null;
}
