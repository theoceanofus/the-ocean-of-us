// Where a resident is at time t. Every path is a closed-form function of (resident, t):
// nothing is integrated, so any frame can be rendered alone and previews match exports exactly.
// Residents of a neighbourhood roam (render/roam.js) and now and then keep company with their neighbours (render/company.js).
// Residents with no neighbourhood keep the older back-and-forth paths, bounded by home + amplitudes (see core/placement.js).
import { hash32, rng, clamp, smoother, lerp } from './util.js';
import { COMMUNITY_SPECIES, BOTTOM_FAMILIES } from '../core/community-species.js';
import { LENGTHS } from './metrics.js';
import { motionOf, surgeAt } from './body-motion.js';
import { FOCAL, hoodOf, slideDepth } from '../core/hoods.js';
import { makeRoam, roamAt, mix01, TOP_SHARE, LOW_SHARE, walksHere } from './roam.js';
import { buildCompany, planSlot, slotOf, CELL } from './company.js';

export const AMPLITUDE = {
  reef_fish: { x: 110, y: 26, z: 70 },
  jellyfish: { x: 34, y: 46, z: 26 },
  turtle: { x: 190, y: 34, z: 90 },
  stingray: { x: 170, y: 8, z: 80 },
  dolphin: { x: 210, y: 42, z: 95 },
  blue_whale: { x: 185, y: 24, z: 85 },
  leviathan: { x: 175, y: 24, z: 75 },
  megalodon: { x: 200, y: 28, z: 90 },
  starfish: { x: 5, y: 0, z: 3 },
};
export const WORLD_TOP = 900;
for(const [id,s] of Object.entries(COMMUNITY_SPECIES)){
 const bottom=BOTTOM_FAMILIES.has(s.family);
 AMPLITUDE[id]=bottom?{x:s.family==='land'?45:12,y:2,z:8}:s.metres<.1?{x:6,y:3,z:3}:s.metres<1?{x:35,y:12,z:22}:{x:160,y:24,z:65};
}
export const WORLD_FLOOR = 0;
// The furthest any resident is ever drawn from its home, sideways, in world units: its own roaming plus the furthest a meeting
// with a neighbour can take it. Anything looking for who might be on screen looks this far beyond the screen's edge.
export const MAX_REACH = 700;

const TAU = Math.PI * 2;
const WORLD_PER_METRE = (40 / 3) * 0.68;      // art units per metre x CREATURE_SCALE
const CRUISE_LIMIT = 2;                       // no creature cruises faster than this many of its own body lengths a second

// Beats a second: big animals beat slowly and heavily, and each kind has its own pace (render/body-motion.js).
export function beatHz(species) {
  const metres = LENGTHS[species]?.metres ?? 1;
  return clamp(0.85 * Math.pow(metres, -0.37) * (motionOf(species).rate ?? 1), 0.1, 2.4);
}
// How long a turn takes, in seconds. A whale takes about three, a small fish about half a second.
export function turnSeconds(species) {
  return clamp(0.75 * Math.pow(LENGTHS[species]?.metres ?? 1, 0.42), 0.6, 3.4);
}

const motionCache = new Map();
function params(res) {
  let m = motionCache.get(res.id);
  const home = res.home;
  if (m && m.seed === res.seed && m.species === res.species && m.hx === home.x && m.hy === home.y && m.hz === home.z && m.zone === res.zone) return m;
  const r = rng(res.seed || hash32(res.id));
  const a = AMPLITUDE[res.species] || AMPLITUDE.reef_fish;
  m = {
    seed: res.seed, species: res.species, hx: home.x, hy: home.y, hz: home.z, zone: res.zone,
    ax: a.x * (0.65 + r() * 0.35), ay: a.y * (0.65 + r() * 0.35), az: a.z * (0.65 + r() * 0.35),
    wx: 0, p1: r() * TAU, p2: r() * TAU, p3: r() * TAU, p4: r() * TAU,
    tail: 0, r5: r(),
  };
  const speed = { reef_fish: 0.17, jellyfish: 0.05, turtle: 0.075, stingray: 0.095, dolphin: 0.13, leviathan: 0.06, blue_whale: 0.055, megalodon: 0.085, starfish: 0.006 }[res.species] || 0.1;
  m.wx = speed * (0.8 + r() * 0.4);
  const hood = res.zone ? hoodOf(res) : null;
  const kind = motionOf(res.species), metres = LENGTHS[res.species]?.metres ?? 1, L = metres * WORLD_PER_METRE * (res.size || 1) * (hood?.magnify ?? 1);
  if (kind.fixed) m.ax = m.ay = m.az = 0;
  m.wx = Math.min(m.wx, CRUISE_LIMIT * L * (Math.PI / 2) / Math.max(m.ax, 1e-3));
  m.tail = beatHz(res.species) * (0.92 + r() * 0.16) * TAU;
  // Half the turn, measured in the same angle that drives the path below.
  // Animals that jet can surge through a turn, so a short turn is given a little more time.
  m.hw = clamp(m.wx * Math.max(turnSeconds(res.species), kind.jet ? 1.4 : 0) / 2, 0.001, 0.6);
  m.k = Math.cos(m.hw * 0.7); m.ask = Math.asin(m.k);
  m.lane = r() < 0.5 ? -1 : 1;
  m.pmax = clamp(0.3 - metres * 0.012, 0.08, 0.3);
  m.U = Math.max(m.ax * m.wx * 0.66, 1e-3);
  // How far a jet surges along its path. Slowest while coasting, it never stops or goes backwards.
  m.jet = kind.jet ? 0.5 * m.wx * TAU / m.tail : 0;
  m.back = !!kind.back;
  m.lift = kind.bell ? Math.min(4.5, 0.3 * L) : 0;
  // In a neighbourhood the resident roams (render/roam.js). Animals fixed in place keep the old gentle sway on the spot.
  m.roam = hood && !kind.fixed ? makeRoam(res, hood, { tail: m.tail, p3: m.p3, turn: turnSeconds(res.species), jet: !!kind.jet }) : null;
  if (m.roam) { m.U = m.roam.U; m.vs = 0.5 * m.roam.U; }
  m.companyAt = -1;
  motionCache.set(res.id, m);
  return m;
}

// The angle that drives a resident back and forth. It only ever goes forwards, so the path can't stutter.
const pathAngle = (t, m) => m.wx * t + m.p1 + 0.35 * Math.sin(0.37 * m.wx * t + m.p2) + (m.jet ? m.jet * surgeAt(m.tail * t + m.p3, 'jet') : 0);

function raw(res, t, m) {
  const w = m.wx, th = pathAngle(t, m);
  // A steady cruise that rounds off only at the ends, instead of slowing the whole way like a pendulum.
  const x = res.home.x + m.ax * Math.asin(m.k * Math.sin(th)) / m.ask;
  let y = res.home.y + m.ay * Math.sin(0.73 * w * t + m.p3);
  // Two lanes, like a racetrack, so a turn is a curve through depth.
  const c = clamp(Math.cos(th) / Math.sin(m.hw), -1, 1), lane = c * (1.5 - 0.5 * c * c);
  const z = res.home.z + m.az * (0.72 * Math.sin(0.61 * w * t + m.p4) + 0.28 * lane * m.lane);
  // Each pulse lifts a jellyfish quickly, then it sinks slowly until the next one.
  if (m.lift) y += m.lift * 2 * surgeAt(m.tail * t + m.p3, 'bell');
  return { x, y, z };
}

// Which way a back-and-forth path travels at angle th: +1 right, -1 left, passing smoothly through 0 during a turn of half-width hw.
function zigzag(th, hw) {
  const n = Math.round((th - Math.PI / 2) / Math.PI), d = th - (Math.PI / 2 + n * Math.PI);
  const yaw = Math.PI * smoother((d + hw) / (2 * hw)), before = n % 2 === 0 ? 1 : -1;
  return { facing: before * Math.cos(yaw), turning: Math.sin(yaw) };
}
const heading = (t, m) => zigzag(pathAngle(t, m), m.hw);

// How wide a creature is drawn for a given facing. Never quite zero, and the same on both sides of the turn.
export const turnWidth = (facing) => Math.max(Math.abs(facing), 0.06);

// Where a resident would be by itself, keeping no company: { x, y, z, travel, turning, ahead }.
function ownPlace(res, t, m) {
  if (m.roam) {
    const q = roamAt(m.roam, t);
    let y = res.home.y + q.dy;
    if (m.lift) y += m.lift * 2 * surgeAt(m.tail * t + m.p3, 'bell');
    return { x: res.home.x + q.dx, y, z: res.home.z + q.dz, travel: q.travel, turning: q.turning, ahead: q.ahead, step: q.step };
  }
  const p = raw(res, t, m), h = heading(t, m);
  return { x: p.x, y: p.y, z: p.z, travel: h.facing, turning: h.turning, ahead: 0 };
}

// ---- Company ----
let company = null, version = 0;
const plans = new Map();
// The page hands over the residents it has loaded, so neighbours can meet; null stops all meetings. Reels don't call this.
// A stretch whose neighbours are unchanged keeps its plans, so loading the next area never makes anyone in company jump.
export function setCompany(residents) {
  const next = residents && residents.length ? buildCompany(residents) : null;
  if (next && company) {
    for (const [key, cell] of next.cells) {
      const old = company.cells.get(key);
      if (!old || old.ids !== cell.ids) continue;
      next.cells.set(key, old);
      for (const g of old.groups) for (const m of g.members) next.cellOf.set(m.id, old);
    }
    for (const key of [...plans.keys()]) if (next.cells.get(key.slice(0, key.lastIndexOf('#'))) !== company.cells.get(key.slice(0, key.lastIndexOf('#')))) plans.delete(key);
  } else plans.clear();
  company = next;
  version++;
}

const metOf = (g) => g.met ||= g.members.map((r) => params(r));
// How far from home a meeting of g can take member i: where the others roam, plus a circle's width or a hunter's gap.
function reachIn(g, i) {
  const ms = metOf(g), res = g.members[i];
  const beyond = g.kind === 'circle' ? 160 : g.kind === 'chase' && i === 0 ? gapOf(ms[0].roam, ms[1].roam) + 20 : 30;
  let far = 0;
  g.members.forEach((o, j) => { far = Math.max(far, Math.abs(o.home.x - res.home.x) + (ms[j].roam?.reach ?? 0) + beyond); });
  return far;
}
// A group spread so wide that a meeting would take someone past MAX_REACH never meets (a cuttlefish went 713 on 11 Nov).
const tooWide = (g) => g.wide ??= g.members.some((_, i) => reachIn(g, i) > MAX_REACH);
// Whether a group is close enough at t0 to meet: everyone within easy reach of the first, sideways and up or down.
// A chase also needs the fish to have room to dash away from the hunter, so the hunter only ever follows from behind.
function near(g, t0) {
  if (tooWide(g)) return false;
  const ms = metOf(g), first = ownPlace(g.members[0], t0, ms[0]);
  const big = Math.max(...ms.map((m) => m.roam?.Ld ?? 0)), reach = (g.kind === 'chase' ? 2.6 : g.kind === 'circle' ? 2.2 : 1.8) * big + 60;
  for (let i = 1; i < ms.length; i++) {
    const b = ownPlace(g.members[i], t0, ms[i]);
    if (Math.abs(b.x - first.x) > reach || Math.abs(b.y - first.y) > reach * 0.8) return false;
  }
  return g.kind !== 'chase' || !!escapeOf(g, t0);
}
// Which way the fish of a chase dash, and how far: straight away from the hunter, as far as their own range allows (null: no room).
function escapeOf(g, t0) {
  const ms = metOf(g), hunter = ownPlace(g.members[0], t0, ms[0]), fish = g.members[1], fm = ms[1], at = ownPlace(fish, t0, fm);
  const dir = at.x >= hunter.x ? 1 : -1, rm = fm.roam, hm = ms[0].roam;
  const room = dir > 0 ? fish.home.x + rm.right - at.x : at.x - (fish.home.x - rm.left);
  // The hunter follows from behind, so behind the fish there must be room for it inside the neighbourhood, and the chase must
  // not take it further from home than anyone ever goes (MAX_REACH: what the renderer looks beyond the screen for).
  if (dir > 0 && at.x - gapOf(hm, rm) < hoodOf(fish).x0 + hm.Ld / 2) return null;
  if (Math.abs(fish.home.x - g.members[0].home.x) + rm.reach + gapOf(hm, rm) + 20 > MAX_REACH) return null;
  return room >= 1.5 * rm.Ld ? { dir, far: Math.min(0.9 * room, 4 * rm.Ld), at } : null;
}
// How far behind the fish a hunter keeps, from the middle of one to the middle of the other.
const gapOf = (hunter, fish) => 0.75 * (hunter.Ld + fish.Ld);
function planOf(cell, k) {
  const key = `${cell.key}#${k}`;
  let list = plans.get(key);
  if (!list) {
    if (plans.size > 4000) plans.clear();
    list = planSlot(cell, k, near);
    for (const ep of list) prepare(ep);
    plans.set(key, list);
  }
  return list;
}
// What a meeting needs, worked out once: how far behind each other they swim, the chase's dash, the circle's track.
function prepare(ep) {
  const g = ep.g, ms = metOf(g), lead = ms[g.kind === 'chase' ? 1 : 0];
  ep.lag = clamp((0.55 * lead.roam.Ld) / lead.roam.U, 0.3, 1.1);
  // The row each follower swims in, as a height above or below the one it follows: clear of it, and on whichever side keeps
  // it inside the band of the screen swimmers keep to (worked out where the leader is as the meeting begins).
  if (g.kind !== 'circle') {
    const leadY = ownPlace(g.members[g.kind === 'chase' ? 1 : 0], ep.t0, lead).y, first = g.kind === 'chase' ? 2 : 1;
    ep.rows = ms.map((me, i) => {
      if (i < first) return 0;
      const off = rowOf(i - first + 1) * 0.5 * Math.max(me.roam.Ld, lead.roam.Ld), [lo, hi] = bandAt(me.roam, g.members[i].home.z);
      const fits = (y) => y >= lo + 0.1 * me.roam.Ld && y <= hi - 0.1 * me.roam.Ld;
      return me.roam.floor ? 0 : fits(leadY + off) || !fits(leadY - off) ? off : -off;
    });
  }
  if (g.kind === 'chase') {
    const hunter = ms[0].roam, fish = lead.roam;
    ep.escape = escapeOf(g, ep.t0);
    ep.gap = gapOf(hunter, fish);
    ep.rise = clamp(0.3 * fish.Ld, 0, fish.up);
  }
  if (g.kind === 'circle') {
    const [ma, mb] = ms, a = ownPlace(g.members[0], ep.t0, ma), b = ownPlace(g.members[1], ep.t0, mb);
    const big = Math.max(ma.roam.Ld, mb.roam.Ld), turn = Math.max(turnSeconds(g.members[0].species), turnSeconds(g.members[1].species));
    // A smaller track near the start of the neighbourhood, so neither of them ever circles out of it.
    const mid = (a.x + b.x) / 2, room = mid - hoodOf(g.members[0]).x0 - big / 2;
    const Rx = clamp(Math.min(0.5 * big + 20, room), 30, 140), v = Math.min(ma.roam.U, mb.roam.U) * 1.1;
    const w = Math.min((Math.PI * v) / (2 * Rx), 0.45 / turn), hw = clamp((w * turn) / 2, 0.05, 0.6);
    const first = a.x < b.x ? -Math.PI / 2 : Math.PI / 2;
    ep.orbit = { M: { x: mid + Math.max(0, Rx - room), y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }, Rx, Rz: 30, Ry: 0.25 * big, w, hw, k: Math.cos(hw * 0.7),
      dir: mix01(g.members[0].seed | 0, g.members[1].seed | 0, 5) < 0.5 ? -1 : 1, th0: [first, first + Math.PI] };
    ep.orbit.ask = Math.asin(ep.orbit.k);
    const [lo, hi] = bandAt(ma.roam, ep.orbit.M.z), Ry = ep.orbit.Ry;
    ep.orbit.M.y = hi - lo > 2 * Ry ? clamp(ep.orbit.M.y, lo + Ry, hi - Ry) : (lo + hi) / 2;
  }
}
// The meeting this resident is in at time t, and its place in the group, or null.
function meetingOf(res, t) {
  const cell = company?.cellOf.get(res.id);
  if (!cell) return null;
  for (const ep of planOf(cell, slotOf(cell, t))) {
    if (t < ep.t0 || t > ep.t0 + ep.D) continue;
    const i = ep.g.members.findIndex((m) => m.id === res.id);
    if (i >= 0) return { ep, i };
  }
  return null;
}
// The meeting a resident is in at time t, for tests and tools: { kind, i (its place in the group), ids, t0, D, w } or null.
export function meetingAt(res, t) {
  params(res);
  const hit = meetingOf(res, t);
  return hit && { kind: hit.ep.g.kind, i: hit.i, ids: hit.ep.g.members.map((m) => m.id), t0: hit.ep.t0, D: hit.ep.D, w: weightOf(hit.ep, t) };
}
// How far into the meeting the resident has gone, 0 to 1: it eases in, stays, and eases out again.
const weightOf = (ep, t) => smoother((t - ep.t0) / ep.ramp) * smoother((ep.t0 + ep.D - t) / ep.ramp);
// The fish's dash in a chase, at time t: straight away from the hunter, quick at first, then coasting to a stop well ahead,
// a little higher and a little nearer. Before the chase it is where the fish was when the chase began.
function escapeAt(ep, t) {
  const { dir, far, at } = ep.escape, u = smoother((t - ep.t0) / (0.55 * ep.D));
  return { x: at.x + dir * far * u, y: at.y + ep.rise * u, z: at.z - 20 * u, travel: dir, turning: 0, ahead: 0 };
}
// The heights a swimmer may be at, at depth z: between TOP_SHARE and LOW_SHARE of the screen, and above the floor.
const bandAt = (rm, z) => [Math.max(20, rm.camH + ((rm.camHor - LOW_SHARE) * z) / FOCAL), rm.camH + ((rm.camHor - TOP_SHARE) * z) / FOCAL];
// Which row of a school member i swims in: the leader's own, then one above, one below, two above, two below.
const rowOf = (i) => (i % 2 ? 1 : -1) * Math.ceil(i / 2);
// Where a member of a meeting is heading at time t (absolute), or null if it simply carries on with its own roaming.
function meetingPlace(ep, i, t, res, m) {
  const g = ep.g, ms = metOf(g);
  if (g.kind === 'school' || g.kind === 'pair') {
    if (i === 0) return null;
    // Each a moment behind the one in front and in a row of its own above or below, so they are all seen: a loose diamond.
    const q = ownPlace(g.members[0], t - i * ep.lag, ms[0]);
    return { ...q, y: q.y + ep.rows[i], z: q.z + (i % 2 ? 1 : -1) * (12 + 6 * i) };
  }
  if (g.kind === 'chase') {
    if (i === 0) {
      // The hunter keeps a good way behind the fish, a little higher and further back, and gives up when they get away.
      const q = escapeAt(ep, Math.max(ep.t0, t - 1)), me = m.roam;
      return { ...q, x: q.x - ep.escape.dir * ep.gap, y: q.y + Math.min(me.up, 0.25 * me.Ld), z: q.z + 45 };
    }
    // The fish spread out as they dash, then gather again.
    const q = escapeAt(ep, Math.max(ep.t0, t - (i - 1) * 0.3)), spread = 1 + 1.8 * Math.max(0, Math.sin(Math.PI * clamp((t - ep.t0) / (0.7 * ep.D))));
    return { ...q, y: q.y + ep.rows[i] * spread, z: q.z + (i % 2 ? 1 : -1) * (12 + 6 * i + 14 * (spread - 1)) };
  }
  // circle
  const o = ep.orbit, th = o.w * (t - ep.t0) + o.th0[i];
  const c = clamp(Math.cos(th) / Math.sin(o.hw), -1, 1), lane = c * (1.5 - 0.5 * c * c), turn = zigzag(th, o.hw);
  return {
    x: o.M.x + (o.Rx * Math.asin(o.k * Math.sin(th))) / o.ask, y: o.M.y + (i ? -1 : 1) * o.Ry,
    z: o.M.z + o.Rz * lane * o.dir, travel: turn.facing, turning: turn.turning, ahead: 0,
  };
}

// Where a resident is at time t, with any company it keeps. w: how far into a meeting it is (0 when on its own).
function place(res, t, m) {
  const own = ownPlace(res, t, m);
  if (!company || !m.roam) return own;
  const hit = meetingOf(res, t);
  if (!hit) return own;
  const w = weightOf(hit.ep, t), to = w > 0 ? meetingPlace(hit.ep, hit.i, t, res, m) : null;
  if (!to) return own;
  // In company a swimmer may go to any height its friends are at, but never out of the band of the screen swimmers keep to.
  if (m.roam.floor) to.y = res.home.y;
  else { const [lo, hi] = bandAt(m.roam, to.z); to.y = clamp(to.y, lo, hi); }
  return {
    x: lerp(own.x, to.x, w), y: lerp(own.y, to.y, w), z: lerp(own.z, to.z, w),
    travel: lerp(own.travel, to.travel, w), turning: lerp(own.turning, to.turning, w), ahead: lerp(own.ahead, to.ahead, w), w, step: own.step,
  };
}

// The furthest this resident is ever drawn from its home, sideways: its own roaming, or where a meeting can take it.
// A follower goes where its leader roams; a circle can reach one track's width beyond either of the pair; a hunter keeps
// its gap behind the fish's dash. Never more than MAX_REACH (test/roam.test.mjs checks every resident).
export function reachOf(res) {
  const m = params(res);
  if (!m.roam) return Math.max(m.ax, 0);
  if (m.companyAt !== version) {
    m.companyAt = version;
    m.reach = m.roam.reach;
    const cell = company?.cellOf.get(res.id);
    if (cell) for (const g of cell.groups) {
      const i = g.members.findIndex((o) => o.id === res.id);
      if (i < 0 || tooWide(g)) continue;
      m.reach = Math.max(m.reach, reachIn(g, i));
    }
  }
  return m.reach;
}

export function poseAt(res, t, arrival) {
  const m = params(res);
  const e = 0.05;
  let a = place(res, t - e, m), b = place(res, t + e, m);
  let p = place(res, t, m);
  let arriving = 0;
  if (arrival && t < arrival.t0 + arrival.dur) {
    const dir = arrival.fromSide || 1;
    const lift = res.species === 'starfish' ? 330 : 40;
    const side = res.species === 'starfish' ? 40 : res.species === 'jellyfish' ? 120 : 380;
    const entry = (q) => ({ x: q.x - dir * side, y: q.y + lift, z: q.z + 90 });
    const blend = (q, tt) => {
      const u = smoother((tt - arrival.t0) / arrival.dur);
      const s = entry(q);
      return { ...q, x: lerp(s.x, q.x, u), y: lerp(s.y, q.y, u), z: lerp(s.z, q.z, u) };
    };
    a = blend(a, t - e); b = blend(b, t + e); p = blend(p, t);
    // A new arrival faces the way it is swimming in, then eases on to its usual path.
    arriving = 1 - smoother((t - (arrival.t0 + arrival.dur * 0.7)) / (arrival.dur * 0.3));
  }
  const vx = (b.x - a.x) / (2 * e);
  const vy = (b.y - a.y) / (2 * e);
  const vz = (b.z - a.z) / (2 * e);
  let travel = p.travel, turning = p.turning;
  // Joining or leaving company, a creature faces the way it is actually going, so it never swims backwards to its friends.
  // The way it is going is measured over three seconds, so a quick wobble in the blend never flips the drawing.
  if (p.w > 0 && p.w < 1) {
    const k = (4 * p.w * (1 - p.w)) ** 2, going = (place(res, t + 1.5, m).x - place(res, t - 1.5, m).x) / 3;
    travel = (1 - k) * travel + k * Math.sin((Math.PI / 2) * clamp(going / m.vs, -1, 1));
    turning = Math.max(turning, k * Math.sqrt(Math.max(0, 1 - travel * travel)));
  }
  const travelling = arriving ? lerp(travel, Math.tanh(vx / 6), arriving) : travel;
  // facing is the way the drawing's front points. Squid and octopus travel mantle first, so theirs is the opposite of travel.
  const facing = m.back ? -travelling : travelling;
  const speed = Math.hypot(vx, vy, vz);
  const pitch = clamp((vy / m.U) * 0.4, -m.pmax, m.pmax);
  // A roaming animal works harder when it goes faster, and eases off in a turn. Kept within the old range (0.84 to 1.16), which
  // every design and requested look is checked against (test/motion.browser.test.mjs).
  const effort = m.roam
    ? (1 - 0.45 * turning) * clamp(0.9 + (0.1 * speed) / m.U, 0.9, 1.08) * (1 + 0.07 * Math.sin(0.23 * t + m.p4))
    : (1 - 0.45 * turning) * (1 + 0.16 * Math.sin(0.23 * t + m.p4));
  // The tail beats a little faster while a dart is gaining ground, and slower while it coasts.
  // A walker on the sand steps with the ground it covers instead (roam.js): its legs walk, not paddle, and rest when it stops.
  const walk = m.roam?.style === 'walk' && walksHere(res);
  const swim = walk ? Math.PI * 2 * (p.step || 0) + m.p3 : m.tail * (t + 0.6 * p.ahead) + m.p3;
  return { x: p.x, y: Math.max(p.y, 0), z: p.z, slideZ: slideDepth(res), vx, vy, vz, facing, speed, swim, m, effort, pitch, turning, ...(walk ? { walk: true } : {}) };
}

export function arrivalProgress(arrival, t) {
  return arrival ? clamp((t - arrival.t0) / arrival.dur) : 1;
}
export { CELL };
