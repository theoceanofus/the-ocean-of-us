// How a resident of a neighbourhood roams (owner, 2026-11-10: "lets make them actually swim and move around ... so they arent
// just going forwards a little then turning around"). A pure function of (resident, time): nothing is integrated, so any frame
// can be drawn on its own and a Reel re-renders exactly.
//
// The path is a string of legs that each take about the same time, so a long leg is a quick swim and a short one a slow dawdle.
// Legs come in runs that all go the same way; only the end of a run is a turn. Where the runs turn is a zigzag about a centre
// that itself wanders slowly from one side of the range to the other, so no two turns land in the same place: some runs are a
// short look round, some a long crossing. Height and depth wander too, run by run. Every axis is a monotone cubic through its
// waypoints (PCHIP), so the path is smooth and never leaves the range it was given.
import { clamp, smoother } from './util.js';
import { LENGTHS, artworkRadius } from './metrics.js';
import { motionOf } from './body-motion.js';
import { COMMUNITY_SPECIES } from '../core/community-species.js';
import { FOCAL, ZONE_CAM, walksOnFloor } from '../core/hoods.js';

// A well-mixed number in [0, 1) from three integers. Nothing in the render path may use Math.random.
export function mix01(a, b, c = 0) {
  let x = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b | 0) + 0x632be5ab, 0x85ebca77) ^ Math.imul((c | 0) + 0x5bd1e995, 0xc2b2ae35)) >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15; x = Math.imul(x, 0x846ca68b); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

// How each kind of animal roams.
//   reach: half its range sideways, in drawn body lengths.  pace: its usual speed, in body lengths a second.
//   runs: how many legs make up each run between two turns, as a repeating pattern (longer runs, fewer turns).
//   swing: how far each turn reaches out from the wandering centre, as a share of the range.
//   pause: the chance a leg is only a short dawdle.  dart: how hard a leg bursts at the start and coasts at the end.
//   rise, deep: how far it wanders up and down, and nearer and further, in body lengths.
export const STYLES = {
  cruise: { reach: 2.2, pace: 0.32, runs: [3, 2, 4, 3, 5, 2, 3], swing: [0.15, 0.6], pause: 0.04, dart: 0.4, rise: 0.3, deep: 0.45 },
  dart: { reach: 2.8, pace: 0.65, runs: [2, 1, 3, 2, 1, 4, 2], swing: [0.15, 0.6], pause: 0.2, dart: 2.6, rise: 0.5, deep: 0.5 },
  playful: { reach: 2.5, pace: 0.5, runs: [2, 3, 1, 4, 2, 3], swing: [0.15, 0.6], pause: 0.08, dart: 1.4, rise: 0.6, deep: 0.5 },
  glide: { reach: 2, pace: 0.26, runs: [3, 4, 2, 5, 3], swing: [0.15, 0.6], pause: 0.06, dart: 0.2, rise: 0.5, deep: 0.4 },
  giant: { reach: 1.4, pace: 0.15, runs: [3, 4, 3, 5], swing: [0.15, 0.6], pause: 0.03, dart: 0, rise: 0.2, deep: 0.3 },
  jet: { reach: 2, pace: 0.38, runs: [2, 3, 1, 3, 2], swing: [0.15, 0.6], pause: 0.15, dart: 0, rise: 0.45, deep: 0.45 },
  drift: { reach: 0.9, pace: 0.07, runs: [2, 3, 2, 4], swing: [0.15, 0.6], pause: 0.2, dart: 0, rise: 0.6, deep: 0.3 },
  paddle: { reach: 1.6, pace: 0.24, runs: [2, 3, 2, 4, 1, 3], swing: [0.15, 0.6], pause: 0.12, dart: 0.3, rise: 0.35, deep: 0.35 },
  walk: { reach: 0.9, pace: 0.13, runs: [2, 1, 3, 2, 2], swing: [0.15, 0.6], pause: 0.3, dart: 0.5, rise: 0, deep: 0.15 },
  crawl: { reach: 0.5, pace: 0.03, runs: [2, 3], swing: [0.15, 0.6], pause: 0.4, dart: 0, rise: 0, deep: 0.08 },
};
const PLAYFUL = new Set(['dolphin', 'cetacean', 'pilot', 'narwhal', 'seal', 'pinniped', 'harp', 'otter', 'penguin', 'selkie', 'mermaid', 'cat_mermaid', 'kyogre']);
const GLIDE = new Set(['turtle', 'stingray', 'manta', 'eagle_ray', 'whipray', 'sirenian', 'dugong', 'blue_dragon', 'sea_angel', 'mata_mata']);
const DRIFTERS = new Set(['siphonophore', 'pyrosome', 'man_o_war', 'pteropod', 'phytoplankton']);

export const familyOf = (species) => COMMUNITY_SPECIES[species]?.family ?? species;
// Lives on its feet on the sand (a floor row) and walks rather than crawls, so it is drawn walking, not swimming.
export const walksHere = (res) => !!res?.home && res.home.y <= 6 && walksOnFloor(res) && styleName(res.species, true) === 'walk';
export const metresOf = (species) => LENGTHS[species]?.metres ?? 1;

// Which way of roaming suits this animal. Null for animals fixed to one spot. onFloor: it lives in a row on the sea floor.
export function styleName(species, onFloor = false) {
  const kind = motionOf(species), fam = familyOf(species), metres = metresOf(species);
  if (kind.fixed) return null;
  if (kind.k === 'still') return 'crawl';
  if (onFloor) return 'walk';
  if (kind.jet) return 'jet';
  if (kind.bell || kind.noTurn || kind.k === 'upright' || kind.k === 'bob' || DRIFTERS.has(fam)) return 'drift';
  if (metres >= 12) return 'giant';
  if (PLAYFUL.has(fam)) return 'playful';
  if (GLIDE.has(fam)) return 'glide';
  if (kind.k === 'sway') return 'paddle';
  return metres < 1 ? 'dart' : 'cruise';
}

const TAU = Math.PI * 2;
const WORLD_PER_METRE = (40 / 3) * 0.68; // art units per metre x CREATURE_SCALE, as in motion.js
export const TOP_SHARE = 0.14, LOW_SHARE = 0.76;
const ROW_DRIFT = 40;                      // world units: about half the height between two swimming rows // swimmers keep between these shares of the screen's height: clear of the Find box above and the floor rows below
const STRIDE = 0.9;                        // a walker covers about this many of its drawn lengths in one whole step of all four feet
const WALK_TURN = 0.35;                    // seconds: how long a walker on the sand takes to turn round
const NARROW_SHARE = 0.1;                  // at most about this share of the time drawn narrowed by a turn (two thirds of a turn is narrowed)

// The roaming for one resident. hood: its neighbourhood; base: { tail, turn (seconds), jet, p }: its beat and turn from motion.js.
export function makeRoam(res, hood, base) {
  const onFloor = res.home.y <= 6, name = styleName(res.species, onFloor);
  if (!name) return null;
  const S = STYLES[name], id = (res.seed || 0) ^ 0x2c1b3c6d, metres = metresOf(res.species), size = res.size || 1, magnify = hood.magnify;
  const Ld = 2 * artworkRadius(res.species) * 0.68 * size * magnify;          // drawn length, world units
  const Lm = metres * WORLD_PER_METRE * size * magnify;                        // body length the speed limits are measured in
  const R = clamp(S.reach * Ld, 24, 230);
  const left = Math.max(0, Math.min(R, res.home.x - hood.x0 - Ld / 2));       // never back past the start of its neighbourhood
  // Height: a swimmer keeps between TOP_SHARE and LOW_SHARE of the screen, measured from where its row sits.
  // yLo and yHi are the whole band, which company may use; up and down are how far it wanders by itself.
  let up = 0, down = 0, yLo = res.home.y, yHi = res.home.y;
  if (!onFloor) {
    const cam = ZONE_CAM[res.zone] || { h: 200, hor: 0.5 }, z = res.home.z, v = cam.hor - ((res.home.y - cam.h) * FOCAL) / z;
    // By itself it rises and sinks within about half the gap between rows, so it rarely drifts across the animals of the next row.
    const above = Math.max(0, (v - TOP_SHARE) * z / FOCAL), below = Math.max(0, Math.min((LOW_SHARE - v) * z / FOCAL, res.home.y - 20)), want = Math.min(S.rise * Ld, ROW_DRIFT);
    up = Math.min(above, want); down = Math.min(below, want);
    yLo = res.home.y - below; yHi = res.home.y + above;
  }
  const band = ZONE_CAM[res.zone] || { h: 200, hor: 0.5 };
  const deep = Math.min(S.deep * Ld, onFloor ? 12 : 45);
  const runs = S.runs.slice(), shift = Math.floor(mix01(id, 1, 1) * runs.length);
  const pattern = runs.slice(shift).concat(runs.slice(0, shift));
  const sum = pattern.reduce((a, b) => a + b, 0), meanK = sum / pattern.length;
  const swing0 = S.swing[0], swing1 = S.swing[1];
  // Average distance a leg covers, in world units, so the leg rate gives the animal's pace.
  const meanLeg = (2 * (swing0 + (swing1 - swing0) / 3) * (left + R) / 2) / meanK;
  // An animal on its feet turns round in a quick step; a slow swimmer's turn on legs reads as squashing to a sliver.
  const turnSec = name === 'walk' ? Math.min(base.turn, WALK_TURN) : Math.max(base.turn, base.jet ? 1.4 : 0);
  let w = (S.pace * Lm) / Math.max(meanLeg, 1e-3);
  w = Math.min(w, (NARROW_SHARE * meanK) / (0.66 * turnSec), 0.9 / turnSec, 1.2);
  const rm = {
    style: name, id, Ld, Lm, R, left, right: R, up, down, yLo, yHi, camH: band.h, camHor: band.hor, floor: onFloor, deep, lane: deep * 0.4, laneSign: mix01(id, 2, 2) < 0.5 ? -1 : 1,
    pattern, sum, swing0, swing1, centre: 1 - swing1, c1: mix01(id, 3, 3) * TAU, c2: mix01(id, 4, 4) * TAU,
    pause: S.pause, dart: S.dart, w, h: Math.min(0.45, (turnSec * w) / 2),
    p1: 64 + mix01(id, 5, 5) * 4096, p2: mix01(id, 6, 6) * TAU, p5: mix01(id, 7, 7) * TAU,
    tail: base.tail, p3: base.p3, jet: base.jet ? (0.5 * w * TAU) / base.tail : 0,
    U: Math.max(S.pace * Lm, 1e-3),
    stride: Math.max(6, STRIDE * Ld),
  };
  rm.reach = Math.max(rm.left, rm.right);
  return rm;
}

// The leg parameter at time t: leg n runs from s = n to n + 1. It only ever goes forwards.
export const legAt = (rm, t) => rm.w * t + rm.p1 + 0.3 * Math.sin(0.37 * rm.w * t + rm.p2) + 0.22 * Math.sin(0.23 * rm.w * t + rm.p5)
  + (rm.jet ? rm.jet * jetSurge(rm.tail * t + rm.p3) : 0);
// How far ahead of a steady pace a jet is in its pulse (as surgeAt in body-motion.js, for the 'jet' pulse: thrust 0.55).
function jetSurge(phi) { const T = 0.55, u = phi / TAU - Math.floor(phi / TAU); return (u < T ? u / T - Math.sin((TAU * u) / T) / TAU : 1) - u; }

// Which run leg n belongs to: r (counting runs from the start of time), j (its place in the run) and K (legs in the run).
function runOf(rm, n) {
  const c = Math.floor(n / rm.sum);
  let rem = n - c * rm.sum, i = 0;
  while (rem >= rm.pattern[i]) { rem -= rm.pattern[i]; i++; }
  return { r: c * rm.pattern.length + i, j: rem, K: rm.pattern[i] };
}
const even = (r) => ((r % 2) + 2) % 2 === 0;
// Where run r begins, in [-1, 1] across the range: alternately low and high about a centre that wanders slowly.
function turnPoint(rm, r) {
  const M = rm.centre * (0.6 * Math.sin(0.17 * r + rm.c1) + 0.4 * Math.sin(0.29 * r + rm.c2));
  const A = rm.swing0 + (rm.swing1 - rm.swing0) * mix01(rm.id, r, 11) ** 2; // mostly short swings, now and then a long one
  return clamp(M + (even(r) ? -A : A), -1, 1);
}
// How much of its run each leg covers: mostly a fair share, sometimes only a dawdle.
const share = (rm, r, i) => (mix01(rm.id, r, 20 + i) < rm.pause ? 0.08 : 0.45 + mix01(rm.id, r, 40 + i));
function wayX(rm, n) {
  const { r, j, K } = runOf(rm, n), a = turnPoint(rm, r);
  if (!j) return a;
  let all = 0, before = 0;
  for (let i = 0; i < K; i++) { const s = share(rm, r, i); all += s; if (i < j) before += s; }
  return a + (turnPoint(rm, r + 1) - a) * (before / all);
}
// Height and depth: a value per run, eased from one to the next along the run, with a little leg-by-leg wobble.
function wayV(rm, n, axis) {
  const { r, j, K } = runOf(rm, n), a = 2 * mix01(rm.id, r, axis) - 1, b = 2 * mix01(rm.id, r + 1, axis) - 1;
  return clamp(0.75 * (a + (b - a) * (j / K)) + 0.25 * (2 * mix01(rm.id, n, axis + 1) - 1), -1, 1);
}

// Monotone cubic through four waypoints at n-1, n, n+1, n+2, at q in [0, 1] between n and n+1 (Fritsch-Butland slopes).
function pchip(p0, p1, p2, p3, q) {
  const d0 = p1 - p0, d1 = p2 - p1, d2 = p3 - p2;
  const m1 = d0 * d1 > 0 ? (2 * d0 * d1) / (d0 + d1) : 0, m2 = d1 * d2 > 0 ? (2 * d1 * d2) / (d1 + d2) : 0;
  const q2 = q * q, q3 = q2 * q;
  return (2 * q3 - 3 * q2 + 1) * p1 + (q3 - 2 * q2 + q) * m1 + (3 * q2 - 2 * q3) * p2 + (q3 - q2) * m2;
}
const curve = (rm, n, q, way, axis) => pchip(way(rm, n - 1, axis), way(rm, n, axis), way(rm, n + 1, axis), way(rm, n + 2, axis), q);

// Where the resident is at time t, relative to its home, and which way it travels:
// { dx, dy, dz, travel (+1 right, -1 left, through 0 in a turn), turning (0 to 1), ahead (seconds a dart has gained, for the tail beat) }.
export function roamAt(rm, t) {
  const s = legAt(rm, t), n = Math.floor(s), u = s - n;
  // A leg can burst at the start and coast at the end; it starts and ends at the same speed either way, so legs join smoothly.
  const a = rm.dart ? rm.dart * mix01(rm.id, n, 7) : 0, q = u + a * (u * (1 - u)) ** 2;
  const X = curve(rm, n, q, wayX), Y = rm.up || rm.down ? curve(rm, n, q, wayV, 31) : 0, Z = curve(rm, n, q, wayV, 61);
  // Turns happen only where a run ends, centred on the waypoint, and take the animal's own turn time.
  const { r, j, K } = runOf(rm, n), dir = even(r) ? 1 : -1, h = rm.h;
  let travel = dir, turning = 0;
  if (j === 0 && u < h) { const yaw = Math.PI * smoother((u + h) / (2 * h)); travel = -dir * Math.cos(yaw); turning = Math.sin(yaw); }
  else if (j === K - 1 && u > 1 - h) { const yaw = Math.PI * smoother((u - 1 + h) / (2 * h)); travel = dir * Math.cos(yaw); turning = Math.sin(yaw); }
  // A walker's feet follow the ground it covers: a whole number of steps in each leg, so the steps join from leg to leg, and its
  // feet stand still when it stops to turn (owner, 14 Nov 2026: the shore animals "move weird"; they paddled in place on the sand).
  let step = 0;
  if (rm.style === 'walk') {
    const side = (v) => (v < 0 ? v * rm.left : v * rm.right), from = side(curve(rm, n, 0, wayX)), span = Math.abs(side(curve(rm, n, 1, wayX)) - from);
    step = span > 1e-6 ? Math.max(1, Math.round(span / rm.stride)) * Math.min(1, Math.abs(side(X) - from) / span) : 0;
  }
  return {
    step,
    dx: X < 0 ? X * rm.left : X * rm.right,
    dy: Y < 0 ? Y * rm.down : Y * rm.up,
    // Two lanes, like a racetrack: one way a little nearer, the other a little further, so a turn is a curve through depth.
    dz: Z * rm.deep + rm.lane * rm.laneSign * travel,
    travel, turning, ahead: (q - u) / rm.w,
  };
}
