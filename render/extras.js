// Draws what people asked for on their creature (owner, 2026-11-08: "with the things that they even requested on
// them"): a bow, crown, pirate, party or disco hat, glasses, a cap or team jersey (team colours only, never a logo),
// a unicorn horn, a sword, blushing cheeks, a rose or swirl marking, glowing spots, and glow, sparkle and galaxy
// looks for the newer designs (the first nine draw those themselves).
//
// Nothing here knows any one species. Each species is drawn once off screen to find its eye, the top of its head,
// its outline and points inside its body. Every frame the creature's own eye is followed, so a hat stays on while
// it swims. Land animals keep their fishbowl helmet: what they wear sits inside the glass.
import { COMMUNITY_SPECIES } from '../core/community-species.js';
import { crisp } from './crisp.js';
import { flex, motionOf } from './body-motion.js';
import { drawChristmasHat, bulb, LIGHT_COLOURS, fitOf } from './paid-items.js';

const TAU = Math.PI * 2;
const K = 0.5, W = 1800, H = 1100; // the probe draws native units at half size
// The first nine species draw their own eyes, so their eyes are listed here.
const ORIGINAL_EYES = {
  reef_fish: [{ x: 32, y: -7, r: 3.9 }], turtle: [{ x: 65.8, y: -4.9, r: 2.7 }], dolphin: [{ x: 40, y: -3.4, r: 1.6 }],
  blue_whale: [{ x: 125, y: 6, r: 1.9 }], megalodon: [{ x: 85, y: -5, r: 2.6 }], leviathan: [{ x: 151, y: -10, r: 2.1 }],
  stingray: [{ x: 30.8, y: -7.5, r: 2.2 }, { x: 30.8, y: 5.5, r: 2.2 }],
};
const RAINBOW = ['#ff5f5f', '#ffd84a', '#62f08e', '#4ad8ff', '#b77bff'];
const TWINKLE = ['#ffd257', '#ff5a5a', '#5dff8f', '#fff3c4', '#6ad4ff'];

const eyesOf = (species) => ORIGINAL_EYES[species]
  || (COMMUNITY_SPECIES[species]?.family === 'turtle' && species !== 'giant_turtle' ? ORIGINAL_EYES.turtle : COMMUNITY_SPECIES[species]?.family === 'whipray' ? ORIGINAL_EYES.stingray : null);

function ellipse(c, x, y, rx, ry, fill, a = 0) { c.fillStyle = fill; c.beginPath(); c.ellipse(x, y, Math.max(rx, 0.01), Math.max(ry, 0.01), a, 0, TAU); c.fill(); }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (x, y, k) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(x.slice(i, i + 2), 16) * (1 - k) + parseInt(y.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
const inv = (m) => { const det = m.a * m.d - m.b * m.c || 1; return { a: m.d / det, b: -m.b / det, c: -m.c / det, d: m.a / det, e: (m.c * m.f - m.d * m.e) / det, f: (m.b * m.e - m.a * m.f) / det }; };
const ap = (m, x, y) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });
const scaleOf = (m) => Math.hypot(m.a, m.b) || 1;

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  if (typeof document !== 'undefined' && document.createElement) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  return null;
}

// Device-space eye and helmet records (from community-creatures.js) turned into the creature's own units.
function toLocal(rec, base) {
  if (!rec || !base) return null;
  const iv = inv(base), k = scaleOf(base);
  return {
    eyes: rec.filter((e) => e.kind === 'eye').map((e) => ({ ...ap(iv, e.dx, e.dy), r: e.dr / k })),
    helmets: rec.filter((e) => e.kind === 'helmet').map((e) => ({ ...ap(iv, e.dx, e.dy), r: e.dr / k })),
  };
}

// The main eye: the largest. Two the same size, side by side, are a face seen from the front.
function mainEye(eyes) {
  if (!eyes?.length) return null;
  let i = 0; eyes.forEach((e, j) => { if (e.r > eyes[i].r * 1.02) i = j; });
  const m = eyes[i];
  let j = eyes.findIndex((e, k) => k !== i && e.r >= m.r * 0.85 && Math.abs(e.y - m.y) < m.r * 1.6 && Math.abs(e.x - m.x) > m.r * 2.2);
  // Eyes one above the other: the creature is drawn from above (a ray, a crab), and its head is between them.
  const above = j < 0 ? eyes.findIndex((e, k) => k !== i && e.r >= m.r * 0.85 && Math.abs(e.x - m.x) < m.r * 2 && Math.abs(e.y - m.y) > m.r * 2.2) : -1;
  if (above >= 0) j = above;
  return { i, j, x: j >= 0 ? (m.x + eyes[j].x) / 2 : m.x, y: j >= 0 ? (m.y + eyes[j].y) / 2 : m.y, r: m.r, pair: j >= 0 ? [m, eyes[j]] : null, fromAbove: above >= 0 };
}

function analyse(img, local, species) {
  const w = img.width, h = img.height, d = img.data;
  const at = (x, y) => { const px = Math.round(x * K + w / 2), py = Math.round(y * K + h / 2); return px < 0 || py < 0 || px >= w || py >= h ? 0 : d[(py * w + px) * 4 + 3]; };
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  for (let py = 0; py < h; py += 2) for (let px = 0; px < w; px += 2) if (d[(py * w + px) * 4 + 3] > 100) { if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
  if (x1 < 0) return null;
  const box = { x0: (x0 - w / 2) / K, x1: (x1 - w / 2) / K, y0: (y0 - h / 2) / K, y1: (y1 - h / 2) / K };
  const bw = box.x1 - box.x0, bh = box.y1 - box.y0;
  // Top and bottom of the body in each column, for the jersey and markings; and the top of the solid body in each column, below
  // any thin spine or fin tip, for a hat (owner, 2026-11-13: crowns must sit on the creature, not float on a lionfish's spines).
  // Solid means the body is at least a little wide there: the pixels a few units either side are opaque too.
  const step = 2, cols = { x0: box.x0, step, top: [], bot: [], solid: [] }, wide = Math.max(1.5, bw * 0.035);
  for (let x = box.x0; x <= box.x1; x += step) {
    let t = null, b = null, s = null;
    for (let y = box.y0; y <= box.y1; y += 1) if (at(x, y) > 120) { if (t === null) t = y; b = y; if (s === null && at(x - wide, y) > 120 && at(x + wide, y) > 120) s = y; }
    cols.top.push(t); cols.bot.push(b); cols.solid.push(s ?? t);
  }
  // Points well inside the body, for sparkles, glowing spots and galaxy stars.
  const g = clamp(Math.min(bw, bh) / 12, 2.5, 9), e = g * 1.1, pts = [];
  for (let y = box.y0 + e; y < box.y1 - e; y += g) for (let x = box.x0 + e; x < box.x1 - e; x += g)
    if (at(x, y) > 220 && at(x - e, y) > 220 && at(x + e, y) > 220 && at(x, y - e) > 220 && at(x, y + e) > 220) pts.push([x, y]);
  // Any point on the body, thin arms and fins included, for sparkles.
  const loose = [];
  for (let y = box.y0; y < box.y1; y += g) for (let x = box.x0; x < box.x1; x += g) if (at(x, y) > 200) loose.push([x, y]);
  const eyes = eyesOf(species) || local?.eyes || [];
  const me = mainEye(eyes);
  const helmet = local?.helmets?.[0] || null;
  let top;
  if (me?.fromAbove) top = { x: me.x, y: me.y };
  else if (me) {
    let y = me.y - me.r, last = y, gap = 0;
    while (y > box.y0 - 2 && gap < 3) { if (at(me.x, y) > 90) { last = y; gap = 0; } else gap++; y -= 1; }
    top = { x: me.x, y: last };
  } else {
    const cx = (box.x0 + box.x1) / 2; let y = box.y0; while (y < box.y1 && at(cx, y) < 100) y += 1;
    top = { x: cx, y };
  }
  // No eye at all (jellyfish, kraken, starfish and others, owner 2026-11-12): a face's place in the middle of the body's solid part, a
  // little high, so sunglasses, lashes, blush and big baby eyes still have somewhere to go. Never used to move or draw the animal itself.
  let face = null;
  const from = pts.length ? pts : loose;
  const upper = from.filter((p) => p[1] <= box.y0 + bh * 0.45);
  const use = upper.length >= 3 ? upper : from;
  if (!me && use.length) {
    const mx = use.reduce((n, p) => n + p[0], 0) / use.length, my = use.reduce((n, p) => n + p[1], 0) / use.length;
    const span = Math.min(bw, bh), d = span * 0.13, r = Math.max(1.5, span * 0.04), y = my - span * 0.08;
    face = { x: mx, y, r, pair: [{ x: mx - d, y, r }, { x: mx + d, y, r }], virtual: true };
  }
  const headH = me ? me.y - top.y : bh * 0.2;
  let s = me ? Math.max(me.r * 6, headH * 1.8, bh * 0.28, bw * 0.13) : Math.max(headH * 1.7, bw * 0.2);
  if (helmet) s = Math.min(s, helmet.r * 0.95); // inside the fishbowl
  s = clamp(s, 9, 90);
  return { box, cols, pts, loose, eye: me, face, eyeCount: eyes.length, helmet, top, s };
}

const probes = new Map();
// draw(ctx) draws the species at rest in its own units; hook(look) switches eye and helmet recording on and off.
export function probeSpecies(species, draw, hook) {
  if (probes.has(species)) return probes.get(species);
  let out = null;
  try {
    const cv = makeCanvas(W * K, H * K);
    const c = cv?.getContext('2d');
    if (c && c.getImageData) {
      const base = { a: K, b: 0, c: 0, d: K, e: W * K / 2, f: H * K / 2 };
      c.setTransform(K, 0, 0, K, W * K / 2, H * K / 2);
      const rec = [];
      hook?.({ rec, probe: true });
      try { draw(c); } finally { hook?.(null); }
      out = analyse(c.getImageData(0, 0, W * K, H * K), toLocal(rec, base), species);
    }
  } catch { out = null; }
  probes.set(species, out);
  return out;
}

// Where things go this frame: the probe's layout, moved with the creature's own eye.
// How far the body has bent at x, relative to the eye the layout already follows.
function bendAt(follow, L) {
  if (!follow || !L.eye) return null;
  const rest = { x: L.eye.x - L.dx, y: L.eye.y - L.dy };
  follow(rest.x, rest.y); const atEye = flex.y - rest.y;
  return (x) => { follow(x - L.dx, 0); return flex.y - atEye; };
}
function layout(res, pr, live) {
  const fallbackEye = eyesOf(res.species)?.[0] || { x: 40, y: -8, r: 3 };
  if (!pr) return { eye: { ...fallbackEye, pair: null }, top: { x: fallbackEye.x, y: fallbackEye.y - 14 }, s: 16, box: { x0: -80, x1: 80, y0: -40, y1: 40 }, cols: null, pts: [], loose: [], dx: 0, dy: 0, helmet: null };
  let dx = 0, dy = 0, eye = pr.eye ? { ...pr.eye } : pr.face ? { ...pr.face } : null;
  const liveEye = live?.eyes?.length === pr.eyeCount && pr.eye ? live.eyes[pr.eye.i] : null;
  if (liveEye) {
    const pair = pr.eye.pair ? [live.eyes[pr.eye.i], live.eyes[pr.eye.j]] : null;
    const x = pair ? (pair[0].x + pair[1].x) / 2 : liveEye.x, y = pair ? (pair[0].y + pair[1].y) / 2 : liveEye.y;
    dx = x - pr.eye.x; dy = y - pr.eye.y; eye = { ...pr.eye, x, y, pair };
  }
  const helmet = live?.helmets?.[0] || (pr.helmet ? { ...pr.helmet, x: pr.helmet.x + dx, y: pr.helmet.y + dy } : null);
  const { pts, loose } = res.species === 'starfish' ? starfishPoints(pr, res.seed || 1) : pr;
  return { eye, top: { x: pr.top.x + dx, y: pr.top.y + dy }, s: pr.s, box: pr.box, cols: pr.cols, pts, loose, dx, dy, helmet };
}
// Each starfish is drawn turned by its own seed (starfish() in render/creatures.js: spin = seed % 628 / 100, arms on a circle
// squashed to 0.64 of its height), but its profile was drawn with seed 1. Its sparkles and spots are turned to match, so they
// sit on its arms instead of in the water between them.
const starTurned = new Map();
function starfishPoints(pr, seed) {
  const key = seed % 628;
  if (!starTurned.has(key)) {
    const a = key / 100 - 0.01, cos = Math.cos(a), sin = Math.sin(a), SQ = 0.64;
    const turn = (list) => list?.map(([x, y]) => { const u = y / SQ; return [x * cos - u * sin, (x * sin + u * cos) * SQ]; });
    if (starTurned.size > 700) starTurned.clear();
    starTurned.set(key, { pts: turn(pr.pts), loose: turn(pr.loose) });
  }
  return starTurned.get(key);
}

function colAt(L, x) {
  if (!L.cols) return null;
  const i = Math.round((x - L.dx - L.cols.x0) / L.cols.step);
  const t = L.cols.top[i], b = L.cols.bot[i], s = L.cols.solid?.[i] ?? t;
  const d = L.bend ? L.bend(x) : 0;
  return t == null ? null : { top: t + L.dy + d, bot: b + L.dy + d, solid: s + L.dy + d };
}
// A stable spread of points inside the body (same ones every frame for one resident).
function spread(L, n, seed, list = L.pts) {
  const p = list || []; if (!p.length) return [];
  const out = [], used = new Set(); let k = (seed * 9301 + 49297) % 233280;
  for (let i = 0; i < n * 3 && out.length < Math.min(n, p.length); i++) {
    k = (k * 9301 + 49297) % 233280; const j = Math.floor(k / 233280 * p.length);
    if (used.has(j)) continue; used.add(j); const px = p[j][0] + L.dx; out.push([px, p[j][1] + L.dy + (L.bend ? L.bend(px) : 0)]);
  }
  return out;
}

// How big worn things are drawn: the head size, a little bigger, and at least a sixth of a long body's length, so a hat or sunglasses
// reads on a whale shark as well as on a little fish (owner, 2026-11-12).
const wearSize = (L) => {
  const bw = L.box.x1 - L.box.x0, bh = L.box.y1 - L.box.y0;
  return Math.min(Math.max(L.s * 1.12, bw * 0.17), Math.sqrt(bw * bh) * 0.4, bh * 0.75, bw * 0.9);
};

// ---------- worn on the head ----------
function bow(c, P, s, col) {
  const w = s * 0.6;
  for (const side of [-1, 1]) {
    const g = c.createLinearGradient(0, -w * 0.6, 0, w * 0.6); g.addColorStop(0, P(col, 0.28)); g.addColorStop(1, P(col, -0.3));
    c.fillStyle = P(col, -0.18);
    c.beginPath(); c.moveTo(side * w * 0.1, w * 0.12); c.lineTo(side * w * 0.55, w * 0.95); c.lineTo(side * w * 0.36, w * 0.78); c.lineTo(side * w * 0.22, w * 1.0); c.lineTo(0, w * 0.18); c.fill();
    c.fillStyle = g;
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(side * w * 0.3, -w * 0.8, side * w * 1.2, -w * 0.6, side * w * 1.08, 0); c.bezierCurveTo(side * w * 1.2, w * 0.58, side * w * 0.3, w * 0.62, 0, 0); c.fill();
    c.strokeStyle = P(col, -0.5, 0.7); c.lineWidth = Math.max(0.4, s * 0.03); c.stroke();
    c.strokeStyle = P(col, -0.38, 0.55); c.beginPath(); c.moveTo(side * w * 0.18, -w * 0.1); c.quadraticCurveTo(side * w * 0.62, -w * 0.32, side * w * 0.9, -w * 0.12); c.moveTo(side * w * 0.18, w * 0.1); c.quadraticCurveTo(side * w * 0.6, w * 0.3, side * w * 0.88, w * 0.14); c.stroke();
    ellipse(c, side * w * 0.62, -w * 0.25, w * 0.16, w * 0.07, P('#ffffff', 0, 0.35), side * -0.3);
  }
  ellipse(c, 0, 0, w * 0.24, w * 0.28, P(col, -0.08));
  ellipse(c, -w * 0.06, -w * 0.08, w * 0.08, w * 0.07, P('#ffffff', 0, 0.4));
}
function crown(c, P, s, col) {
  const w = s * 0.55, h = s * 0.55;
  const tips = [[-w, -h * 0.72], [-w * 0.5, -h * 0.86], [0, -h], [w * 0.5, -h * 0.86], [w, -h * 0.72]];
  const g = c.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, P(col, 0.4)); g.addColorStop(0.55, P(col, 0.05)); g.addColorStop(1, P(col, -0.32));
  c.fillStyle = g; c.beginPath(); c.moveTo(-w * 0.92, 0);
  tips.forEach(([x, y], i) => { c.lineTo(x, y); if (i < 4) c.lineTo(x + w * 0.25, -h * 0.32); });
  c.lineTo(w * 0.92, 0); c.closePath(); c.fill(); c.strokeStyle = P(col, -0.5, 0.8); c.lineWidth = Math.max(0.4, s * 0.025); c.stroke();
  ellipse(c, 0, -h * 0.1, w * 0.95, h * 0.13, P(col, -0.18));
  for (const [x, y] of tips) { ellipse(c, x, y, s * 0.05, s * 0.05, P(col, 0.45)); ellipse(c, x - s * 0.015, y - s * 0.015, s * 0.018, s * 0.018, P('#ffffff', 0, 0.8)); }
  [['#d8322e', 0], ['#3a7fd6', -w * 0.5], ['#3a7fd6', w * 0.5]].forEach(([gem, x]) => { ellipse(c, x, -h * 0.12, s * 0.07, s * 0.06, P(gem)); ellipse(c, x - s * 0.02, -h * 0.15, s * 0.022, s * 0.018, P('#ffffff', 0, 0.75)); });
  c.strokeStyle = P('#ffffff', 0, 0.35); c.lineWidth = Math.max(0.3, s * 0.02); c.beginPath(); c.moveTo(-w * 0.7, -h * 0.3); c.lineTo(-w * 0.55, -h * 0.66); c.stroke();
}
function pirateHat(c, P, s) {
  const w = s * 0.9, h = s * 0.62, black = '#1d1b22', gold = '#d9a93a';
  const g = c.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, P(black, 0.16)); g.addColorStop(1, P(black, -0.1));
  c.fillStyle = g; c.beginPath(); c.moveTo(-w, -h * 0.05); c.quadraticCurveTo(-w * 0.85, -h * 0.75, -w * 0.32, -h * 0.85); c.quadraticCurveTo(0, -h * 1.15, w * 0.32, -h * 0.85);
  c.quadraticCurveTo(w * 0.85, -h * 0.75, w, -h * 0.05); c.quadraticCurveTo(0, h * 0.18, -w, -h * 0.05); c.fill();
  c.strokeStyle = P(gold); c.lineWidth = Math.max(0.5, s * 0.045);
  c.beginPath(); c.moveTo(-w * 0.96, -h * 0.08); c.quadraticCurveTo(-w * 0.82, -h * 0.72, -w * 0.32, -h * 0.82); c.quadraticCurveTo(0, -h * 1.1, w * 0.32, -h * 0.82); c.quadraticCurveTo(w * 0.82, -h * 0.72, w * 0.96, -h * 0.08); c.stroke();
  const k = s * 0.13, cy = -h * 0.5;
  c.strokeStyle = P('#f1ece0'); c.lineWidth = Math.max(0.4, s * 0.045); c.lineCap = 'round';
  c.beginPath(); c.moveTo(-k * 1.4, cy - k * 0.2); c.lineTo(k * 1.4, cy + k * 1.5); c.moveTo(k * 1.4, cy - k * 0.2); c.lineTo(-k * 1.4, cy + k * 1.5); c.stroke();
  ellipse(c, 0, cy, k, k * 0.9, P('#f1ece0')); ellipse(c, 0, cy + k * 0.75, k * 0.6, k * 0.45, P('#f1ece0'));
  ellipse(c, -k * 0.38, cy - k * 0.05, k * 0.26, k * 0.3, P(black)); ellipse(c, k * 0.38, cy - k * 0.05, k * 0.26, k * 0.3, P(black));
}
function partyHat(c, P, s, cols) {
  const w = s * 0.36, h = s * 1.05;
  const cone = new Path2D(); cone.moveTo(-w, 0); cone.quadraticCurveTo(0, w * 0.35, w, 0); cone.lineTo(w * 0.06, -h); cone.lineTo(-w * 0.06, -h); cone.closePath();
  c.save(); c.clip(cone);
  const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, P(cols[0], 0.15)); g.addColorStop(1, P(cols[0], -0.25));
  c.fillStyle = g; c.fillRect(-w * 1.2, -h * 1.1, w * 2.4, h * 1.4);
  for (let i = 0; i < 5; i++) { c.fillStyle = P(cols[1 + (i % (cols.length - 1))], 0.05, 0.92); c.beginPath(); const y = -h * (0.12 + i * 0.2); c.moveTo(-w * 1.2, y); c.lineTo(w * 1.2, y - h * 0.16); c.lineTo(w * 1.2, y - h * 0.08); c.lineTo(-w * 1.2, y + h * 0.08); c.fill(); }
  c.restore();
  c.strokeStyle = P(cols[0], -0.5, 0.6); c.lineWidth = Math.max(0.4, s * 0.025); c.stroke(cone);
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = s * 0.11; ellipse(c, Math.cos(a) * r * 0.55, -h + Math.sin(a) * r * 0.55, r * 0.55, r * 0.5, P(i % 2 ? '#fff4c2' : '#ffe07a')); }
  ellipse(c, 0, -h, s * 0.09, s * 0.09, P('#fff7d6'));
}
function discoHat(c, P, s, col, t) {
  const w = s * 0.5, hh = s * 0.4;
  ellipse(c, 0, 0, w, s * 0.09, P(col, -0.25));
  const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, P(col, 0.12)); g.addColorStop(1, P(col, -0.3));
  c.fillStyle = g; c.fillRect(-w * 0.62, -hh, w * 1.24, hh);
  ellipse(c, 0, -hh, w * 0.62, s * 0.06, P(col, 0.05));
  c.fillStyle = P('#f2c6ff', 0, 0.85); c.fillRect(-w * 0.62, -hh * 0.32, w * 1.24, hh * 0.18);
  const r = s * 0.32, cy = -hh - r * 0.92;
  const ball = new Path2D(); ball.arc(0, cy, r, 0, TAU);
  const bg = c.createRadialGradient(-r * 0.35, cy - r * 0.35, r * 0.1, 0, cy, r); bg.addColorStop(0, P('#ffffff')); bg.addColorStop(0.5, P('#b8c4cf')); bg.addColorStop(1, P('#56606b'));
  c.fillStyle = bg; c.fill(ball);
  c.save(); c.clip(ball);
  const tile = r / 3.2, spin = (t * 0.6) % 1;
  for (let row = -4; row <= 4; row++) for (let k = -5; k <= 5; k++) {
    const x = (k + spin) * tile, y = cy + row * tile; if (Math.hypot(x, y - cy) > r) continue;
    const lit = Math.sin(k * 1.7 + row * 2.3 + t * 3) > 0.55;
    c.fillStyle = lit ? P(RAINBOW[(k + row + 20) % 5], 0.3, 0.9) : P('#2c333b', 0, 0.22);
    c.fillRect(x - tile * 0.42, y - tile * 0.42, tile * 0.84, tile * 0.84);
  }
  c.restore();
  c.strokeStyle = P('#3a434d', 0, 0.6); c.lineWidth = Math.max(0.3, s * 0.015); c.stroke(ball);
  for (let i = 0; i < 3; i++) { const a = t * 1.5 + i * 2.1, x = Math.cos(a) * r * 1.5, y = cy + Math.sin(a) * r * 1.1; sparkleStar(c, x, y, s * 0.09 * (0.6 + 0.4 * Math.sin(t * 4 + i)), P('#ffffff', 0, 0.9)); }
}
function cap(c, P, s, cols) {
  const w = s * 0.5, h = s * 0.42;
  const dome = new Path2D(); dome.moveTo(-w, 0); dome.bezierCurveTo(-w, -h * 1.25, w, -h * 1.25, w, 0); dome.closePath();
  const g = c.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, P(cols[0], 0.2)); g.addColorStop(1, P(cols[0], -0.22));
  c.fillStyle = g; c.fill(dome);
  if (cols.length > 2) { c.save(); c.clip(dome); cols.forEach((col, i) => { c.fillStyle = P(col); c.fillRect(-w + i * (2 * w / cols.length), -h * 1.3, 2 * w / cols.length + 0.5, h * 1.4); }); c.restore(); }
  c.strokeStyle = P(cols[0], -0.45, 0.55); c.lineWidth = Math.max(0.3, s * 0.02);
  c.beginPath(); c.moveTo(0, -h * 0.94); c.quadraticCurveTo(-w * 0.2, -h * 0.5, -w * 0.12, 0); c.moveTo(0, -h * 0.94); c.quadraticCurveTo(w * 0.35, -h * 0.5, w * 0.4, 0); c.stroke();
  c.stroke(dome);
  const brim = cols.length === 2 ? cols[1] : cols[0];
  c.fillStyle = P(brim, -0.08); c.beginPath(); c.moveTo(w * 0.7, -h * 0.05); c.quadraticCurveTo(w * 1.5, -h * 0.12, w * 1.75, h * 0.08); c.quadraticCurveTo(w * 1.3, h * 0.22, w * 0.6, h * 0.12); c.closePath(); c.fill();
  c.strokeStyle = P(brim, -0.45, 0.6); c.stroke();
  ellipse(c, 0, -h * 0.96, s * 0.06, s * 0.035, P(brim, -0.05));
  ellipse(c, -w * 0.42, -h * 0.62, w * 0.16, h * 0.08, P('#ffffff', 0, 0.22), -0.6);
}
function unicornHorn(c, P, s, col) {
  const w = s * 0.13, h = s * 0.95;
  c.rotate(0.42);
  const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, P(col, 0.25)); g.addColorStop(0.5, P('#ffffff', 0, 0.95)); g.addColorStop(1, P(col, -0.2));
  c.fillStyle = g; c.beginPath(); c.moveTo(-w, 0); c.quadraticCurveTo(-w * 0.5, -h * 0.5, 0, -h); c.quadraticCurveTo(w * 0.5, -h * 0.5, w, 0); c.quadraticCurveTo(0, w * 0.4, -w, 0); c.fill();
  c.strokeStyle = P('#e3b34a', 0, 0.85); c.lineWidth = Math.max(0.35, s * 0.025);
  for (let i = 0; i < 5; i++) { const y = -h * (0.12 + i * 0.17), ww = w * (1 - (i * 0.17 + 0.1)); c.beginPath(); c.moveTo(-ww, y + ww * 0.5); c.quadraticCurveTo(0, y - ww * 0.3, ww, y - ww * 0.35); c.stroke(); }
  sparkleStar(c, 0, -h, s * 0.09, P('#ffffff', 0, 0.9));
}
function glasses(c, P, L, s) {
  const e = L.eye; if (!e) return;
  const lw = Math.max(e.r * 3, s * 0.3), lh = lw * 0.7;
  const lens = (x, y) => {
    const g = c.createLinearGradient(x, y - lh, x, y + lh); g.addColorStop(0, P('#2d3442', 0, 0.94)); g.addColorStop(1, P('#11141b', 0, 0.94));
    c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(x - lw, y - lh, lw * 2, lh * 2, lh * 0.7) : c.ellipse(x, y, lw, lh, 0, 0, TAU); c.fill();
    // A pale edge round the frame first, so sunglasses still show on a dark animal (an orca, a black shark).
    c.strokeStyle = P('#e9eef2', 0, 0.55); c.lineWidth = Math.max(0.9, lw * 0.3); c.stroke();
    c.strokeStyle = P('#0c0d10'); c.lineWidth = Math.max(0.5, lw * 0.16); c.stroke();
    c.strokeStyle = P('#ffffff', 0, 0.55); c.lineWidth = Math.max(0.3, lw * 0.1); c.beginPath(); c.moveTo(x - lw * 0.55, y - lh * 0.2); c.lineTo(x - lw * 0.15, y - lh * 0.62); c.moveTo(x - lw * 0.2, y + lh * 0.05); c.lineTo(x + lw * 0.1, y - lh * 0.3); c.stroke();
  };
  c.strokeStyle = P('#0c0d10'); c.lineWidth = Math.max(0.5, lw * 0.16); c.lineCap = 'round';
  if (e.pair) {
    const [a, b] = e.pair;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    lens(a.x, a.y); lens(b.x, b.y);
  } else {
    c.beginPath(); c.moveTo(e.x - lw * 0.9, e.y - lh * 0.3); c.lineTo(e.x - lw * 3.2, e.y - lh * 0.55); c.stroke();
    lens(e.x, e.y);
  }
}
function jersey(c, P, L, cols) {
  const e = L.eye; if (!e || !L.cols) return;
  const bw = L.box.x1 - L.box.x0, bh = L.box.y1 - L.box.y0, upright = bh > bw * 1.15;
  // A band of the body just behind the head: across the back for a swimmer, down the chest for an upright penguin.
  const [xa, xb] = upright ? [L.box.x1 + L.dx, L.box.x0 + L.dx] : [e.x - L.s * 0.75, e.x - L.s * 2.45];
  const [ya, yb] = upright ? [e.y + bh * 0.12, e.y + bh * 0.5] : [-1e9, 1e9];
  // Fins stick out of the body; the jersey keeps to the body's own depth just behind the head.
  const k0 = colAt(L, xa) || colAt(L, e.x), mid = k0 ? (k0.top + k0.bot) / 2 : e.y, half = k0 ? (k0.bot - k0.top) * 0.56 : 1e9;
  const top = [], bot = [];
  for (let x = xa; x >= xb; x -= 2) { const k = colAt(L, x); if (!k) continue;
    const t = Math.max(k.top + 0.6, ya, upright ? -1e9 : mid - half), u = Math.min(k.bot - 0.6, yb, upright ? 1e9 : mid + half);
    if (u > t) { top.push([x, t]); bot.push([x, u]); } }
  if (top.length < 3) return;
  const shape = new Path2D(); top.forEach(([x, y], i) => shape[i ? 'lineTo' : 'moveTo'](x, y)); [...bot].reverse().forEach(([x, y]) => shape.lineTo(x, y)); shape.closePath();
  const [a, b] = cols, y0 = L.box.y0 + L.dy - 4, h = bh + 8;
  c.save(); c.clip(shape);
  const g = upright ? c.createLinearGradient(xb, 0, xa, 0) : c.createLinearGradient(0, y0, 0, y0 + h);
  g.addColorStop(0, P(a, 0.12)); g.addColorStop(1, P(a, -0.28));
  c.fillStyle = g; c.fillRect(Math.min(xa, xb) - 4, y0, Math.abs(xa - xb) + 8, h);
  c.fillStyle = P(b);
  if (upright) { const band = (yb - ya) * 0.1; for (const y of [ya + band * 0.6, yb - band * 1.6]) c.fillRect(xb - 4, y, xa - xb + 8, band); c.fillRect(xb - 4, ya + band * 2.2, xa - xb + 8, band * 0.5); }
  else { const band = (xa - xb) * 0.11; for (const [x, w] of [[xa - band * 1.1, 0.7], [xb + band * 0.4, 0.7], [xa - band * 2.1, 0.45], [xb + band * 1.5, 0.45]]) c.fillRect(x, y0, band * w, h); }
  c.strokeStyle = P(a, -0.35, 0.35); c.lineWidth = 0.7;
  for (let i = 1; i < 4; i++) { const x = xa - (xa - xb) * i / 4; c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x - 3, y0 + h / 2, x + 1, y0 + h); c.stroke(); }
  c.restore();
  c.strokeStyle = P(b, -0.2); c.lineWidth = Math.max(0.6, L.s * 0.05); c.beginPath();
  (upright ? top : top.slice(0, 3)).forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](x, y)); c.stroke();
}


// ---------- the princess floral dress (owner's gift to @victoria.nicoleoficial, 15 Nov 2026: "A doplhin with a princesa floral
// dressssss"). A shop look (core/shop.js princessdress) given only as a gift for now. Worn round the body: a fitted bodice from just
// behind the head to a waist behind the front fins, a lace-edged neckline, a puffed sleeve at the shoulder, a satin sash and bow at the
// waist, and a full skirt in ruffled tiers that flares out and flows back along the body, rippling as the creature swims. Blush pink,
// printed with small roses, blossoms and leaves, soft colours that sit well on a grey dolphin. Never over the face or eyes.
const DRESS = { base: '#f6c6d4', deep: '#e08ba7', lace: '#fff5f8', rose: '#d4517a', rose2: '#ee8fad', bloom: '#fff9f4', heart: '#f2c447', leaf: '#86b07e', bow: '#d4567f' };
function dressRng(seed) { let k = (seed * 9301 + 49297) % 233280; return () => { k = (k * 9301 + 49297) % 233280; return k / 233280; }; }
function dressFlower(c, P, x, y, r, kind, turn) {
  if (kind === 0) { // a rose: a round bloom with a curl of petals
    ellipse(c, x, y, r, r * 0.92, P(DRESS.rose));
    c.strokeStyle = P(DRESS.rose, 0.35, 0.85); c.lineWidth = Math.max(0.25, r * 0.22);
    c.beginPath(); c.arc(x, y, r * 0.55, turn, turn + 4.2); c.stroke();
    ellipse(c, x - r * 0.25, y - r * 0.3, r * 0.3, r * 0.22, P('#ffffff', 0, 0.35));
  } else if (kind === 1) { // a blossom: five round petals and a yellow heart
    for (let i = 0; i < 5; i++) { const a = turn + i * TAU / 5; ellipse(c, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.5, r * 0.5, P(DRESS.bloom)); }
    ellipse(c, x, y, r * 0.34, r * 0.34, P(DRESS.heart));
  } else { // a small pink bud
    ellipse(c, x, y, r * 0.7, r * 0.6, P(DRESS.rose2));
  }
}
function dressAlong(c, P, L, t, seed) {
  const s = L.s, bw = L.box.x1 - L.box.x0;
  if (!L.cols || !(bw > 0) || !(s > 0)) return false;
  const e = L.eye || L.face, head = L.box.x1 + L.dx, tail = L.box.x0 + L.dx;
  // Down the length of the body, head end first: where the neckline sits, the waist and the end of the skirt.
  let xn = e ? e.x - Math.max(s * 0.8, (e.r || 0) * 3.5) : head - bw * 0.2;
  xn = Math.min(xn, head - bw * 0.12);
  const xw = xn - bw * 0.17, xh = Math.max(tail + bw * 0.16, xw - bw * 0.3);
  if (!(xw > xh + 2)) return false;
  // The body's back (its solid top, so a back fin is passed under) and belly (a hanging fin is passed over), smoothed as they go.
  const N = 32, sta = [];
  let back = null, belly = null;
  for (let i = 0; i <= N; i++) {
    const x = xn - (xn - xh) * i / N, k = colAt(L, x); if (!k) continue;
    const top = k.solid ?? k.top;
    back = back === null ? top : clamp(top, back - s * 0.1, back + s * 0.2);
    belly = belly === null ? k.bot : clamp(k.bot, belly - s * 0.2, belly + s * 0.07);
    if (belly - back < s * 0.15) continue;
    sta.push({ x, back, belly, u: x <= xw ? (xw - x) / (xw - xh) : -1 });
  }
  if (sta.length < 8) return false;
  const bod = sta.filter((q) => q.u < 0), sk = sta.filter((q) => q.u >= 0);
  if (bod.length < 2 || sk.length < 3) return false;
  // Everything is sized from the body's depth at the waist, so the dress fits a slim fish and a round seal alike.
  const w0 = bod[bod.length - 1], d = Math.max(s * 0.4, w0.belly - w0.back), lw = Math.max(0.35, d * 0.02);
  const wave = (u, k = 1) => Math.sin(t * 3.1 - u * 5.2) * d * 0.08 * u * k;
  // The skirt flares out a little above the back and cascades well below the belly, its lower edge sweeping back, as a gown flows in water.
  const up = (u) => d * (0.04 + 0.28 * Math.pow(u, 1.3)), down = (u) => d * (0.08 + 1.25 * Math.pow(u, 1.05));
  const top = sk.map((q) => [q.x - q.u * d * 0.05, q.back - up(q.u) + wave(q.u)]);
  const bot = sk.map((q) => [q.x - q.u * q.u * d * 0.5, q.belly + down(q.u) + wave(q.u, 1.3)]);
  const hem = (shape, f0, scallops, depth) => { const [hx0, hy0] = top[top.length - 1], [hx1, hy1] = bot[bot.length - 1];
    for (let i = 1; i <= scallops; i++) { const f = i / scallops, pf = (i - 0.5) / scallops; shape.quadraticCurveTo(hx0 + (hx1 - hx0) * pf - depth, hy0 + (hy1 - hy0) * pf, hx0 + (hx1 - hx0) * f, hy0 + (hy1 - hy0) * f); } };
  const skirt = new Path2D(); top.forEach(([x, y], i) => skirt[i ? 'lineTo' : 'moveTo'](x, y)); hem(skirt, 0, 7, d * 0.2);
  [...bot].reverse().forEach(([x, y]) => skirt.lineTo(x, y)); skirt.closePath();
  // A lace petticoat just showing below and behind the skirt.
  const pet = new Path2D(); { const pb = sk.map((q) => [q.x - q.u * q.u * d * 0.58, q.belly + down(q.u) * 1.09 + d * 0.04 + wave(q.u, 1.5)]);
    pb.forEach(([x, y], i) => pet[i ? 'lineTo' : 'moveTo'](x, y)); const [ex, ey] = pb[pb.length - 1], [tx, ty] = top[top.length - 1];
    for (let i = 1; i <= 9; i++) { const f = i / 9, pf = (i - 0.5) / 9; pet.quadraticCurveTo(ex + (tx - ex) * pf - d * 0.13, ey + (ty - ey) * pf, ex + (tx - ex) * f, ey + (ty - ey) * f); }
    pet.lineTo(sk[0].x, sk[0].back); pet.closePath(); }
  c.fillStyle = P(DRESS.lace, -0.02, 0.97); c.fill(pet); c.strokeStyle = P(DRESS.deep, 0.1, 0.7); c.lineWidth = lw; c.stroke(pet);
  // The bodice: fitted to the body from the neckline back to the waist, a little in from its edges.
  const bodice = new Path2D(); bod.forEach((q, i) => bodice[i ? 'lineTo' : 'moveTo'](q.x, q.back + d * 0.02));
  bodice.lineTo(w0.x - d * 0.02, w0.back + d * 0.02); bodice.lineTo(w0.x - d * 0.02, w0.belly - d * 0.02);
  [...bod].reverse().forEach((q) => bodice.lineTo(q.x, q.belly - d * 0.02));
  // The neckline: a sweetheart curve, dipping in the middle.
  const n0 = bod[0], nd = n0.belly - n0.back, mid = (n0.back + n0.belly) / 2;
  bodice.quadraticCurveTo(n0.x + d * 0.08, n0.belly - nd * 0.18, n0.x - d * 0.06, mid);
  bodice.quadraticCurveTo(n0.x + d * 0.08, n0.back + nd * 0.18, n0.x, n0.back + d * 0.02); bodice.closePath();
  const y0 = Math.min(...top.map((q) => q[1])) - d * 0.2, y1 = Math.max(...bot.map((q) => q[1])) + d * 0.2;
  const fill = (shape, light) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, P(DRESS.base, 0.28 + light)); g.addColorStop(0.5, P(DRESS.base, light)); g.addColorStop(1, P(DRESS.deep, -0.08 + light)); c.fillStyle = g; c.fill(shape); };
  fill(skirt, 0); c.strokeStyle = P(DRESS.deep, -0.15, 0.85); c.lineWidth = lw; c.stroke(skirt);
  { const g = c.createLinearGradient(0, n0.back, 0, n0.belly); g.addColorStop(0, P(DRESS.rose2, 0.12)); g.addColorStop(1, P(DRESS.rose2, -0.12)); c.fillStyle = g; c.fill(bodice); c.stroke(bodice); }
  c.save(); const both = new Path2D(); both.addPath(skirt); both.addPath(bodice); c.clip(both);
  // Soft folds fanning out from the waist to the hem, and two ruffled tiers that follow the hem's curve.
  const [hx0, hy0] = top[top.length - 1], [hx1, hy1] = bot[bot.length - 1], wx = w0.x, wy = (w0.back + w0.belly) / 2;
  for (let i = 0; i < 6; i++) { const f = (i + 0.5) / 6, ex = hx0 + (hx1 - hx0) * f, ey = hy0 + (hy1 - hy0) * f;
    const gf = c.createLinearGradient(wx, wy, ex, ey); gf.addColorStop(0, P(DRESS.deep, 0, 0)); gf.addColorStop(1, P(DRESS.deep, -0.05, 0.45));
    c.strokeStyle = gf; c.lineWidth = Math.max(0.5, d * 0.07); c.beginPath(); c.moveTo(wx, wy + (f - 0.5) * d * 0.6); c.quadraticCurveTo((wx + ex) / 2, (wy + ey) / 2 + d * 0.15, ex, ey); c.stroke(); }
  for (const tu of [0.5, 0.8]) {
    const i = Math.round(tu * (sk.length - 1)), [tx, ty] = top[i], [bx, by] = bot[i], pts = [];
    for (let j = 0; j <= 7; j++) { const f = j / 7; pts.push([tx + (bx - tx) * f - Math.sin(f * Math.PI) * d * 0.1, ty + (by - ty) * f]); }
    c.strokeStyle = P(DRESS.lace, 0, 0.75); c.lineWidth = Math.max(0.5, d * 0.06); c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    c.strokeStyle = P(DRESS.deep, -0.05, 0.75); c.lineWidth = Math.max(0.3, d * 0.022); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length; k++) c.quadraticCurveTo((pts[k - 1][0] + pts[k][0]) / 2 - d * 0.07, (pts[k - 1][1] + pts[k][1]) / 2, pts[k][0], pts[k][1]); c.stroke();
  }
  // The floral print: little roses, blossoms and buds with leaves.
  const rnd = dressRng(seed), area = (xn - hx1) * (y1 - y0), count = clamp(Math.round(area / (d * d * 0.1)), 16, 60);
  for (let i = 0; i < count; i++) {
    const j = Math.floor(rnd() * sta.length), q = sta[j], u = q.u, x = q.x - (u > 0 ? rnd() * u * u * d * 0.45 : 0);
    const lo = u >= 0 ? q.back - up(u) : q.back, hi = u >= 0 ? q.belly + down(u) : q.belly, y = lo + (hi - lo) * (0.06 + rnd() * 0.88);
    const r = d * (0.055 + rnd() * 0.035), kind = i % 5 === 0 ? 2 : i % 2, turn = rnd() * TAU;
    for (const sd of [-1, 1]) ellipse(c, x + sd * r * 1.25, y + r * 0.75, r * 0.6, r * 0.28, P(DRESS.leaf, 0, 0.9), sd * 0.6 + turn * 0.1);
    dressFlower(c, P, x, y, r, kind, turn);
  }
  { const g = c.createLinearGradient(0, n0.back, 0, mid); g.addColorStop(0, P('#ffffff', 0, 0.3)); g.addColorStop(1, P('#ffffff', 0, 0)); c.fillStyle = g; c.fill(bodice); }
  c.restore();
  // Lace along the neckline: a row of tiny scallops.
  c.strokeStyle = P(DRESS.lace, 0, 0.95); c.lineWidth = Math.max(0.4, d * 0.045);
  { c.beginPath(); const steps = 6; for (let i = 0; i <= steps; i++) { const f = i / steps, y = n0.back + d * 0.03 + (nd - d * 0.06) * f, x = n0.x - Math.sin(f * Math.PI) * d * 0.06; i ? c.quadraticCurveTo(x + d * 0.06, y - nd / steps / 2, x, y) : c.moveTo(x, y); } c.stroke(); }
  // The satin sash at the waist.
  const sashW = d * 0.1;
  c.fillStyle = P(DRESS.bow); c.beginPath(); c.moveTo(w0.x + sashW * 0.3, w0.back + d * 0.02); c.lineTo(w0.x + sashW * 0.3, w0.belly - d * 0.02); c.lineTo(w0.x - sashW, w0.belly + d * 0.03); c.lineTo(w0.x - sashW, w0.back - d * 0.01); c.closePath(); c.fill();
  c.strokeStyle = P(DRESS.bow, 0.35, 0.6); c.lineWidth = Math.max(0.3, d * 0.025); c.beginPath(); c.moveTo(w0.x - sashW * 0.3, w0.back + d * 0.05); c.lineTo(w0.x - sashW * 0.3, w0.belly - d * 0.05); c.stroke();
  // A puffed sleeve at the shoulder, where the front fin joins, gathered into a lace cuff.
  { const q = bod[Math.min(bod.length - 1, Math.round(bod.length * 0.4))], sx = q.x, rx = d * 0.26, ry = d * 0.21, sy = q.belly - ry * 0.55;
    const g = c.createRadialGradient(sx - rx * 0.3, sy - ry * 0.45, rx * 0.1, sx, sy, rx * 1.1); g.addColorStop(0, P(DRESS.base, 0.38)); g.addColorStop(1, P(DRESS.deep, -0.02));
    ellipse(c, sx, sy, rx, ry, g); c.strokeStyle = P(DRESS.deep, -0.2, 0.8); c.lineWidth = lw; c.beginPath(); c.ellipse(sx, sy, rx, ry, 0, 0, TAU); c.stroke();
    c.strokeStyle = P(DRESS.deep, -0.05, 0.55); c.lineWidth = Math.max(0.3, d * 0.02); for (const dd of [-0.5, 0, 0.5]) { c.beginPath(); c.moveTo(sx + dd * rx, sy - ry * 0.92); c.quadraticCurveTo(sx + dd * rx * 1.35, sy, sx + dd * rx, sy + ry * 0.92); c.stroke(); }
    dressFlower(c, P, sx + rx * 0.15, sy - ry * 0.1, d * 0.06, 0, 1.2);
    c.strokeStyle = P(DRESS.lace, 0, 0.97); c.lineWidth = Math.max(0.5, d * 0.05); c.beginPath(); c.ellipse(sx, sy + ry * 0.82, rx * 0.72, ry * 0.25, 0, 0.1, Math.PI - 0.1); c.stroke(); }
  // A big satin bow on the back of the waist, its two tails trailing back over the skirt.
  { const bx = w0.x - sashW * 0.4, by = w0.back + d * 0.3, r = d * 0.27, sway = Math.sin(t * 2.4) * d * 0.04;
    c.lineCap = 'round';
    for (const [tx, ty, wdt] of [[-r * 2.4, r * 1.3, 0.13], [-r * 2.0, r * 0.45, 0.11]]) { c.strokeStyle = P(DRESS.bow, -0.12); c.lineWidth = Math.max(0.6, d * wdt); c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + tx * 0.45, by - r * 0.1, bx + tx + sway, by + ty); c.stroke();
      c.fillStyle = P(DRESS.bow, -0.12); c.beginPath(); c.moveTo(bx + tx + sway, by + ty - d * wdt * 0.6); c.lineTo(bx + tx + sway - d * 0.12, by + ty - d * 0.02); c.lineTo(bx + tx + sway, by + ty + d * wdt * 0.6); c.fill(); }
    for (const sd of [-1, 1]) { const loop = new Path2D(); loop.moveTo(bx, by); loop.bezierCurveTo(bx + sd * r * 0.7, by - r * 1.25, bx + sd * r * 1.5, by - r * 0.55, bx + sd * r * 0.25, by + r * 0.05); loop.closePath();
      const g = c.createLinearGradient(bx, by - r, bx, by + r * 0.2); g.addColorStop(0, P(DRESS.bow, 0.32)); g.addColorStop(1, P(DRESS.bow, -0.22)); c.fillStyle = g; c.fill(loop);
      c.strokeStyle = P(DRESS.bow, -0.42, 0.85); c.lineWidth = Math.max(0.35, d * 0.025); c.stroke(loop);
      c.strokeStyle = P(DRESS.bow, -0.3, 0.6); c.beginPath(); c.moveTo(bx + sd * r * 0.15, by - r * 0.1); c.quadraticCurveTo(bx + sd * r * 0.7, by - r * 0.7, bx + sd * r * 0.95, by - r * 0.45); c.stroke(); }
    ellipse(c, bx, by - r * 0.05, r * 0.22, r * 0.26, P(DRESS.bow, -0.15)); ellipse(c, bx - r * 0.06, by - r * 0.14, r * 0.08, r * 0.06, P('#ffffff', 0, 0.6)); }
  return true;
}
// Where the dress can't follow a long body (a jellyfish's bell, a starfish, the kraken's arms), a little floral skirt with a sash and bow
// is worn round the body's middle instead, so the gift always shows.
function dressSmall(c, P, L, t, seed) {
  const s = L.s, bw = L.box.x1 - L.box.x0, bh = L.box.y1 - L.box.y0;
  if (!(bw > 0) || !(bh > 0) || !(s > 0)) return;
  const cx = (L.box.x0 + L.box.x1) / 2 + L.dx, k = colAt(L, cx), wy = k ? k.top + (k.bot - k.top) * 0.5 : (L.box.y0 + L.box.y1) / 2 + L.dy;
  const w = clamp(Math.min(bw * 0.6, s * 2.4), s * 0.9, s * 3), h = w * 0.62, sw = Math.sin(t * 3) * w * 0.03;
  const skirt = new Path2D(); skirt.moveTo(cx - w * 0.28, wy); skirt.lineTo(cx + w * 0.28, wy);
  skirt.quadraticCurveTo(cx + w * 0.42, wy + h * 0.5, cx + w * 0.5 + sw, wy + h);
  for (let i = 1; i <= 8; i++) { const f = i / 8, pf = (i - 0.5) / 8; skirt.quadraticCurveTo(cx + w * 0.5 - w * pf + sw, wy + h + w * 0.08, cx + w * 0.5 - w * f + sw, wy + h); }
  skirt.quadraticCurveTo(cx - w * 0.42, wy + h * 0.5, cx - w * 0.28, wy); skirt.closePath();
  const g = c.createLinearGradient(0, wy, 0, wy + h); g.addColorStop(0, P(DRESS.base, 0.28)); g.addColorStop(1, P(DRESS.deep, -0.05));
  c.fillStyle = P(DRESS.lace, -0.02, 0.95); c.beginPath(); c.ellipse(cx + sw, wy + h + w * 0.03, w * 0.52, w * 0.07, 0, 0, TAU); c.fill();
  c.fillStyle = g; c.fill(skirt); c.strokeStyle = P(DRESS.deep, -0.15, 0.85); c.lineWidth = Math.max(0.35, w * 0.02); c.stroke(skirt);
  c.save(); c.clip(skirt); const rnd = dressRng(seed);
  for (let i = 0; i < 9; i++) { const x = cx - w * 0.42 + rnd() * w * 0.84, y = wy + h * (0.15 + rnd() * 0.75), r = w * (0.045 + rnd() * 0.025), turn = rnd() * TAU;
    for (const sd of [-1, 1]) ellipse(c, x + sd * r * 1.25, y + r * 0.75, r * 0.6, r * 0.28, P(DRESS.leaf, 0, 0.9), sd * 0.6);
    dressFlower(c, P, x, y, r, i % 5 === 0 ? 2 : i % 2, turn); }
  c.restore();
  c.fillStyle = P(DRESS.bow); c.fillRect(cx - w * 0.3, wy - w * 0.04, w * 0.6, w * 0.08);
  const r = w * 0.13; for (const sd of [-1, 1]) ellipse(c, cx + sd * r * 0.9, wy, r, r * 0.6, P(DRESS.bow, 0.1), sd * 0.3);
  ellipse(c, cx, wy, r * 0.4, r * 0.45, P(DRESS.bow, -0.15));
}
function dress(c, P, L, t, seed = 1) {
  if (!dressAlong(c, P, L, t, seed)) dressSmall(c, P, L, t, seed);
}

// Over-ear headphones seen from the side, as most creatures are drawn: a thick band arching over the top of the head and one big padded
// cup over where an ear would be, behind the eye. The far cup is hidden by the head. (s: the wear size; (0, 0) is the top of the head.)
function headphonesSide(c, P, L, s, col) {
  // Placed from the eye, as real ones sit: the cup level with the eye and just behind it, the band rising from the cup over the top of the
  // body there and down towards the forehead.
  const e = L.eye, cx = e.x - Math.max(e.r * 2.6, s * 0.42), cy = e.y + s * 0.02, rx = s * 0.22, ry = s * 0.28;
  const top = Math.min(colAt(L, cx)?.top ?? L.top.y, cy - ry * 1.2), front = colAt(L, cx + s * 0.42)?.top ?? top;
  c.lineCap = 'round';
  const arch = () => { c.beginPath(); c.moveTo(cx, cy - ry * 0.8); c.bezierCurveTo(cx - s * 0.06, top - s * 0.3, cx + s * 0.34, top - s * 0.3, cx + s * 0.42, front + s * 0.03); c.stroke(); };
  c.strokeStyle = P('#23262c'); c.lineWidth = Math.max(0.6, s * 0.12); arch();
  c.strokeStyle = P(col, 0.2); c.lineWidth = Math.max(0.4, s * 0.045); arch();
  const g = c.createRadialGradient(cx - rx * 0.35, cy - ry * 0.4, rx * 0.1, cx, cy, ry * 1.1); g.addColorStop(0, P(col, 0.35)); g.addColorStop(1, P(col, -0.35));
  ellipse(c, cx, cy, rx * 1.12, ry * 1.08, P('#1c1e22', 0, 0.95));
  ellipse(c, cx, cy, rx, ry, g);
  ellipse(c, cx, cy, rx * 0.46, ry * 0.46, P(col, -0.5, 0.55));
  ellipse(c, cx - rx * 0.4, cy - ry * 0.45, rx * 0.28, ry * 0.18, P('#ffffff', 0, 0.5));
}
// Seen from the front (a creature with two eyes facing us): a band over the top and a round cup on each side.
function headphones(c, P, s, col) {
  const w = s * 0.62, top = -s * 0.42, cupY = s * 0.32, cr = s * 0.21;
  c.lineCap = 'round';
  c.strokeStyle = P('#23262c'); c.lineWidth = Math.max(0.6, s * 0.11);
  c.beginPath(); c.moveTo(-w, cupY - cr * 0.6); c.bezierCurveTo(-w * 1.02, top - s * 0.18, w * 1.02, top - s * 0.18, w, cupY - cr * 0.6); c.stroke();
  c.strokeStyle = P(col, 0.15); c.lineWidth = Math.max(0.4, s * 0.06);
  c.beginPath(); c.moveTo(-w * 0.62, top + s * 0.02); c.bezierCurveTo(-w * 0.3, top - s * 0.12, w * 0.3, top - s * 0.12, w * 0.62, top + s * 0.02); c.stroke();
  for (const side of [-1, 1]) {
    const x = side * w;
    const g = c.createRadialGradient(x - cr * 0.3, cupY - cr * 0.35, cr * 0.1, x, cupY, cr * 1.15); g.addColorStop(0, P(col, 0.3)); g.addColorStop(1, P(col, -0.35));
    ellipse(c, x, cupY, cr * 0.95, cr * 1.15, g);
    ellipse(c, x - side * cr * 0.35, cupY, cr * 0.42, cr * 0.95, P('#1c1e22', 0, 0.9));
    ellipse(c, x + side * cr * 0.12 - cr * 0.25, cupY - cr * 0.5, cr * 0.22, cr * 0.16, P('#ffffff', 0, 0.45));
  }
}
const reddish = (h) => { if (!/^#[0-9a-f]{6}$/i.test(h || '')) return false; const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return r > 120 && r > g * 1.6 && r > b * 1.4; };
// A cape fastened at the neck and streaming back over the shoulders, rippling as the creature swims.
function cape(c, P, L, col, t) {
  const e = L.eye; if (!e || !L.cols) return;
  const s = L.s, x0 = e.x - s * 0.55, len = clamp((L.box.x1 - L.box.x0) * 0.55, s * 1.6, s * 3.4);
  const top = [], bot = [];
  // It lies along the back, so a fin sticking up is passed over rather than climbed.
  let back = null;
  for (let i = 0; i <= 16; i++) {
    const u = i / 16, x = x0 - len * u, k = colAt(L, x) || colAt(L, x0); if (!k) continue;
    back = back === null ? k.top : clamp(k.top, back - s * 0.06, back + s * 0.3);
    const wave = Math.sin(t * 3.2 - u * 5) * s * 0.14 * u, lift = -u * u * s * 0.35;
    const y = back + s * 0.06 + lift + wave * 0.5, depth = s * (0.22 + 0.75 * u) + wave;
    top.push([x, y]); bot.push([x - u * s * 0.15, Math.min(k.bot, y + depth)]);
  }
  if (top.length < 4) return;
  const shape = new Path2D(); top.forEach(([x, y], i) => shape[i ? 'lineTo' : 'moveTo'](x, y)); [...bot].reverse().forEach(([x, y]) => shape.lineTo(x, y)); shape.closePath();
  const g = c.createLinearGradient(x0, 0, x0 - len, 0); g.addColorStop(0, P(col, 0.08)); g.addColorStop(0.5, P(col, -0.12)); g.addColorStop(1, P(col, -0.3));
  c.fillStyle = g; c.fill(shape);
  c.strokeStyle = P(col, -0.5, 0.7); c.lineWidth = Math.max(0.4, s * 0.035); c.stroke(shape);
  c.strokeStyle = P(col, -0.35, 0.55); c.lineWidth = Math.max(0.3, s * 0.03);
  for (const f of [0.35, 0.6, 0.82]) { const i = Math.round(f * (top.length - 1)); c.beginPath(); c.moveTo(top[i][0], top[i][1] + s * 0.05); c.lineTo(bot[i][0] + s * 0.05, bot[i][1] - s * 0.05); c.stroke(); }
  ellipse(c, top[0][0], top[0][1] + s * 0.04, s * 0.12, s * 0.12, P('#e3b34a')); ellipse(c, top[0][0] - s * 0.03, top[0][1], s * 0.04, s * 0.035, P('#ffffff', 0, 0.7));
}
// A skateboard under the belly: deck with kicked-up ends, grip tape, trucks and four wheels (two show).
function skateboard(c, P, L, col) {
  const s = L.s, bw = L.box.x1 - L.box.x0, cx = L.box.x0 + bw * 0.5 + L.dx, k = colAt(L, cx);
  const y = (k ? k.bot : L.box.y1 + L.dy) + s * 0.1, half = clamp(bw * 0.3, s * 0.9, s * 2.2), th = Math.max(0.8, s * 0.15);
  c.save(); c.translate(cx, y);
  const deck = new Path2D(); deck.moveTo(-half, -th * 2.2); deck.quadraticCurveTo(-half * 0.92, 0, -half * 0.78, 0); deck.lineTo(half * 0.78, 0); deck.quadraticCurveTo(half * 0.92, 0, half, -th * 2.2);
  deck.lineTo(half * 0.98, -th * 1.2); deck.quadraticCurveTo(half * 0.9, th, half * 0.76, th); deck.lineTo(-half * 0.76, th); deck.quadraticCurveTo(-half * 0.9, th, -half * 0.98, -th * 1.2); deck.closePath();
  c.fillStyle = P(col); c.fill(deck); c.strokeStyle = P(col, -0.5, 0.8); c.lineWidth = Math.max(0.3, th * 0.3); c.stroke(deck);
  c.strokeStyle = P('#26282c', 0, 0.9); c.lineWidth = th * 0.55; c.beginPath(); c.moveTo(-half * 0.8, -th * 0.15); c.lineTo(half * 0.8, -th * 0.15); c.stroke();
  for (const sx of [-1, 1]) {
    const wx = sx * half * 0.55;
    c.fillStyle = P('#a7adb4'); c.fillRect(wx - th * 1.4, th, th * 2.8, th * 1.1);
    const wr = Math.max(1, s * 0.2);
    ellipse(c, wx, th * 2.1 + wr, wr, wr, P('#f1ead8')); ellipse(c, wx, th * 2.1 + wr, wr * 0.4, wr * 0.4, P('#8d8f93'));
  }
  c.restore();
}

// ---------- more hats (2026-11-10) ----------
function topHat(c, P, s, col) {
  const w = s * 0.42, h = s * 0.85;
  ellipse(c, 0, 0, w * 1.55, s * 0.1, P(col, -0.25));
  const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, P(col, 0.15)); g.addColorStop(0.5, P(col, 0.02)); g.addColorStop(1, P(col, -0.3));
  c.fillStyle = g; c.beginPath(); c.moveTo(-w, -s * 0.02); c.lineTo(-w * 0.94, -h); c.quadraticCurveTo(0, -h - s * 0.06, w * 0.94, -h); c.lineTo(w, -s * 0.02); c.closePath(); c.fill();
  c.strokeStyle = P(col, -0.5, 0.7); c.lineWidth = Math.max(0.3, s * 0.02); c.stroke();
  ellipse(c, 0, -h, w * 0.94, s * 0.06, P(col, 0.1));
  c.fillStyle = P('#b8323a'); c.fillRect(-w * 0.98, -s * 0.2, w * 1.96, s * 0.13);
  c.strokeStyle = P('#ffffff', 0, 0.25); c.lineWidth = Math.max(0.3, s * 0.04); c.beginPath(); c.moveTo(-w * 0.6, -h * 0.9); c.lineTo(-w * 0.62, -h * 0.3); c.stroke();
}
function cowboyHat(c, P, s, col) {
  const w = s * 0.42, h = s * 0.5;
  const brim = new Path2D(); brim.moveTo(-w * 2.1, -s * 0.12); brim.quadraticCurveTo(-w * 1.6, s * 0.12, 0, s * 0.1); brim.quadraticCurveTo(w * 1.6, s * 0.12, w * 2.1, -s * 0.12); brim.quadraticCurveTo(w * 1.2, s * 0.02, 0, s * 0.0); brim.quadraticCurveTo(-w * 1.2, s * 0.02, -w * 2.1, -s * 0.12); brim.closePath();
  c.fillStyle = P(col, -0.12); c.fill(brim); c.strokeStyle = P(col, -0.5, 0.7); c.lineWidth = Math.max(0.3, s * 0.02); c.stroke(brim);
  const g = c.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, P(col, 0.15)); g.addColorStop(1, P(col, -0.2));
  c.fillStyle = g; c.beginPath(); c.moveTo(-w, 0); c.quadraticCurveTo(-w * 1.05, -h, -w * 0.4, -h * 1.05); c.quadraticCurveTo(0, -h * 0.8, w * 0.4, -h * 1.05); c.quadraticCurveTo(w * 1.05, -h, w, 0); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = P('#3a2416'); c.fillRect(-w * 0.98, -s * 0.14, w * 1.96, s * 0.1);
}
function wizardHat(c, P, s, col) {
  const w = s * 0.55, h = s * 1.3, bend = s * 0.25;
  ellipse(c, 0, 0, w * 1.35, s * 0.12, P(col, -0.25));
  const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, P(col, 0.15)); g.addColorStop(1, P(col, -0.3));
  c.fillStyle = g; c.beginPath(); c.moveTo(-w, -s * 0.02); c.quadraticCurveTo(-w * 0.2, -h * 0.6, bend, -h); c.quadraticCurveTo(w * 0.3, -h * 0.5, w, -s * 0.02); c.closePath(); c.fill();
  c.strokeStyle = P(col, -0.5, 0.7); c.lineWidth = Math.max(0.3, s * 0.02); c.stroke();
  for (const [x, y, r] of [[-w * 0.35, -h * 0.25, 0.09], [w * 0.25, -h * 0.45, 0.07], [-w * 0.05, -h * 0.65, 0.06]]) sparkleStar(c, x, y, s * r, P('#f8d24a'));
}
function propellerHat(c, P, s, col, t) {
  const w = s * 0.5, h = s * 0.42, cols = [col, '#f8d24a', '#3a7fd6', '#2fae5a'];
  const dome = new Path2D(); dome.moveTo(-w, 0); dome.bezierCurveTo(-w, -h * 1.25, w, -h * 1.25, w, 0); dome.closePath();
  c.save(); c.clip(dome); cols.forEach((cc, i) => { c.fillStyle = P(cc); c.fillRect(-w + i * (w / 2), -h * 1.3, w / 2 + 0.5, h * 1.4); }); c.restore();
  c.strokeStyle = P('#1c1c22', 0, 0.55); c.lineWidth = Math.max(0.3, s * 0.02); c.stroke(dome);
  c.fillStyle = P('#7a7f86'); c.fillRect(-s * 0.025, -h * 1.25, s * 0.05, h * 0.3);
  const spin = Math.cos(t * 9), bw = s * 0.55 * Math.abs(spin) + s * 0.05;
  ellipse(c, 0, -h * 1.28, bw, s * 0.06, P('#e8322e', 0, 0.95)); ellipse(c, 0, -h * 1.28, s * 0.05, s * 0.05, P('#f8d24a'));
}
function flowerHat(c, P, s, col) {
  const r = s * 0.2, cy = -s * 0.28;
  c.strokeStyle = P('#3f8a3a'); c.lineWidth = Math.max(0.5, s * 0.05); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 0.05, cy * 0.5, 0, cy); c.stroke();
  ellipse(c, s * 0.12, cy * 0.45, s * 0.12, s * 0.05, P('#4aa040'), -0.5);
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; ellipse(c, Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.62, r * 0.3, P(col, i % 2 ? 0.05 : -0.05), a); }
  ellipse(c, 0, cy, r * 0.55, r * 0.55, P('#6a3e1c')); ellipse(c, -r * 0.15, cy - r * 0.15, r * 0.2, r * 0.18, P('#ffffff', 0, 0.3));
}
function castleHat(c, P, s, col) {
  const w = s * 0.75, h = s * 0.7, stone = col;
  const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, P(stone, 0.12)); g.addColorStop(1, P(stone, -0.28));
  c.fillStyle = g; c.strokeStyle = P(stone, -0.5, 0.8); c.lineWidth = Math.max(0.3, s * 0.02);
  const tower = (x, tw, th) => { c.beginPath(); c.rect(x - tw / 2, -th, tw, th); c.fill(); c.stroke(); for (let i = 0; i < 3; i++) { c.beginPath(); c.rect(x - tw / 2 + i * tw / 2.5, -th - tw * 0.22, tw / 5, tw * 0.22); c.fill(); c.stroke(); } };
  // A rocky mound under the walls sits down into the head, so the castle never floats on a sloping brow.
  const mound = new Path2D(); mound.moveTo(-w * 1.0, -h * 0.05); mound.quadraticCurveTo(-w * 0.9, h * 0.45, 0, h * 0.5); mound.quadraticCurveTo(w * 0.9, h * 0.45, w * 1.0, -h * 0.05); mound.closePath();
  c.fillStyle = P('#8a7a60'); c.fill(mound); c.strokeStyle = P('#5a4a3a', 0, 0.8); c.stroke(mound); c.fillStyle = g; c.strokeStyle = P(stone, -0.5, 0.8);
  tower(0, w * 1.1, h * 0.6); tower(-w * 0.62, w * 0.5, h); tower(w * 0.62, w * 0.5, h);
  c.fillStyle = P('#2a1e18'); c.beginPath(); c.moveTo(-w * 0.15, 0); c.lineTo(-w * 0.15, -h * 0.25); c.arc(0, -h * 0.25, w * 0.15, Math.PI, 0); c.lineTo(w * 0.15, 0); c.fill();
  for (const x of [-w * 0.62, w * 0.62]) { c.fillStyle = P('#2a1e18'); c.fillRect(x - w * 0.05, -h * 0.7, w * 0.1, h * 0.14); }
  c.strokeStyle = P('#5a4a3a'); c.lineWidth = Math.max(0.8, s * 0.045); c.beginPath(); c.moveTo(w * 0.62, -h * 0.95); c.lineTo(w * 0.62, -h * 1.55); c.stroke();
  c.fillStyle = P('#d8322e'); c.beginPath(); c.moveTo(w * 0.62, -h * 1.55); c.lineTo(w * 0.95, -h * 1.47); c.lineTo(w * 0.62, -h * 1.39); c.fill();
}
// ---------- on the face (2026-11-10) ----------
// Diving gear: a mask over the eyes with a strap round the head, and a snorkel rising behind.
function goggles(c, P, L) {
  const e = L.eye; if (!e) return;
  const s = wearSize(L), list = e.pair || [e], lw = Math.max(e.r * 3.4, s * 0.32), lh = lw * 0.78;
  const cx = list.reduce((v, k) => v + k.x, 0) / list.length, cy = list.reduce((v, k) => v + k.y, 0) / list.length;
  c.strokeStyle = P('#1f2a33'); c.lineWidth = Math.max(0.6, lw * 0.24); c.lineCap = 'round';
  if (!e.pair) { c.beginPath(); c.moveTo(cx - lw * 0.9, cy - lh * 0.2); c.lineTo(cx - lw * 3.2, cy - lh * 0.6); c.stroke(); }
  for (const k of list) {
    c.fillStyle = P('#f2c94c'); c.beginPath(); c.roundRect ? c.roundRect(k.x - lw * 1.15, k.y - lh * 1.15, lw * 2.3, lh * 2.3, lh * 0.8) : c.ellipse(k.x, k.y, lw * 1.15, lh * 1.15, 0, 0, TAU); c.fill();
    c.strokeStyle = P('#9a7a1c', 0, 0.8); c.lineWidth = Math.max(0.3, lw * 0.08); c.stroke();
    const g = c.createLinearGradient(k.x, k.y - lh, k.x, k.y + lh); g.addColorStop(0, P('#bfe8f4', 0, 0.55)); g.addColorStop(1, P('#5aa8c8', 0, 0.35));
    c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(k.x - lw * 0.92, k.y - lh * 0.92, lw * 1.84, lh * 1.84, lh * 0.65) : c.ellipse(k.x, k.y, lw * 0.92, lh * 0.92, 0, 0, TAU); c.fill();
    c.strokeStyle = P('#ffffff', 0, 0.7); c.lineWidth = Math.max(0.3, lw * 0.12); c.beginPath(); c.moveTo(k.x - lw * 0.55, k.y - lh * 0.15); c.lineTo(k.x - lw * 0.2, k.y - lh * 0.6); c.stroke();
  }
  const sx = cx - lw * 1.3, sy = cy + lh * 0.4;
  c.strokeStyle = P('#e8322e'); c.lineWidth = Math.max(0.6, s * 0.1); c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx - s * 0.15, sy + s * 0.2, sx - s * 0.15, sy - s * 0.2); c.lineTo(sx - s * 0.12, sy - s * 1.1); c.stroke();
  c.strokeStyle = P('#f2c94c'); c.lineWidth = Math.max(0.6, s * 0.12); c.beginPath(); c.moveTo(sx - s * 0.12, sy - s * 1.1); c.lineTo(sx - s * 0.11, sy - s * 1.25); c.stroke();
}
function plainEye(c, P, k) {
  ellipse(c, k.x, k.y, k.r * 1.15, k.r * 1.3, P('#0a1720'));
  ellipse(c, k.x - k.r * 0.35, k.y - k.r * 0.45, k.r * 0.38, k.r * 0.32, P('#ffffff', 0, 0.95));
}
function lashes(c, P, L) {
  const e = L.eye; if (!e) return;
  if (e.virtual) for (const k of e.pair || [e]) plainEye(c, P, k);
  c.strokeStyle = P('#14181c'); c.lineCap = 'round';
  for (const k of e.pair || [e]) {
    const r = Math.max(k.r * 2.4, wearSize(L) * (e.pair ? 0.12 : 0.17), 1.8); c.lineWidth = Math.max(0.6, r * 0.24);
    for (let i = 0; i < 5; i++) { const a = -Math.PI * (0.22 + i * 0.13), x0 = k.x + Math.cos(a) * r, y0 = k.y + Math.sin(a) * r * 0.95, x1 = k.x + Math.cos(a) * r * 1.7, y1 = k.y + Math.sin(a) * r * 1.75;
      const lash = () => { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x1 + r * 0.1, y0 - r * 0.15, x1 + r * 0.25, y1 - r * 0.1); c.stroke(); };
      const w = c.lineWidth; c.strokeStyle = P('#f4f1ea', 0, 0.7); c.lineWidth = w * 1.9; lash(); c.strokeStyle = P('#14181c'); c.lineWidth = w; lash(); }
  }
}
function monocle(c, P, L) {
  const e = L.eye; if (!e) return;
  const k = (e.pair || [e])[0], r = Math.max(k.r * 2.8, wearSize(L) * 0.26);
  if (e.virtual) plainEye(c, P, k);
  ellipse(c, k.x, k.y, r, r, P('#dff2f6', 0, 0.3));
  c.strokeStyle = P('#7a5414'); c.lineWidth = Math.max(0.8, r * 0.3); c.beginPath(); c.arc(k.x, k.y, r, 0, TAU); c.stroke();
  c.strokeStyle = P('#f0c54a'); c.lineWidth = Math.max(0.6, r * 0.2); c.beginPath(); c.arc(k.x, k.y, r, 0, TAU); c.stroke();
  ellipse(c, k.x - r * 0.35, k.y - r * 0.4, r * 0.28, r * 0.16, P('#ffffff', 0, 0.75), -0.6);
  c.strokeStyle = P('#d9a93a'); c.lineWidth = Math.max(0.4, r * 0.09); c.beginPath(); c.moveTo(k.x - r * 0.2, k.y + r); c.quadraticCurveTo(k.x - r * 1.2, k.y + r * 2.6, k.x - r * 2.4, k.y + r * 1.6); c.stroke();
}
// Scars: one healed slash across the eye and two on the flank, pale and slightly raised.
function scars(c, P, L, res) {
  const e = L.eye, s = L.s, col = mix(res.colors?.primary || '#8c9aa3', '#f4ece6', 0.78);
  const slash = (x, y, len, ang) => { c.save(); c.translate(x, y); c.rotate(ang); c.strokeStyle = P(col, -0.35, 0.5); c.lineWidth = Math.max(0.8, s * 0.13); c.lineCap = 'round'; c.beginPath(); c.moveTo(-len / 2, 0); c.lineTo(len / 2, 0); c.stroke(); c.strokeStyle = P(col, 0, 0.95); c.lineWidth = Math.max(0.5, s * 0.08); c.beginPath(); c.moveTo(-len / 2, 0); c.lineTo(len / 2, 0); c.stroke();
    c.lineWidth = Math.max(0.3, s * 0.03); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * len * 0.18, -s * 0.07); c.lineTo(i * len * 0.18 + s * 0.02, s * 0.07); c.stroke(); } c.restore(); };
  if (e) slash(e.x, e.y, Math.max(e.r * 6, s * 0.7), -1.1);
  for (const f of [0.42, 0.58]) { const m = markAt(L, f); if (m) slash(m.x, m.y - m.h * 0.12, Math.min(m.h * 0.6, s * 1.1), -0.5 - f); }
}
// Coral and barnacles growing on the back, as on an old turtle or whale.
function coral(c, P, L) {
  const s = L.s;
  for (const [f, col, kind] of [[0.35, '#e8714a', 0], [0.5, '#f0a8c0', 1], [0.62, '#e8d8b8', 2], [0.44, '#c8506a', 1]]) {
    const x = L.box.x0 + (L.box.x1 - L.box.x0) * f + L.dx, k = colAt(L, x); if (!k) continue;
    const y = k.top + s * 0.05, h = Math.min(s * 0.55, (k.bot - k.top) * 0.6);
    if (kind === 2) { for (let i = 0; i < 3; i++) { ellipse(c, x + (i - 1) * s * 0.12, y, s * 0.07, s * 0.06, P(col)); ellipse(c, x + (i - 1) * s * 0.12, y - s * 0.02, s * 0.03, s * 0.02, P('#5a4a3a')); } continue; }
    c.strokeStyle = P(col); c.lineCap = 'round'; c.lineWidth = Math.max(0.6, s * 0.07);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.moveTo(x, y - h * 0.45); c.lineTo(x - h * 0.35, y - h * 0.8); c.moveTo(x, y - h * 0.6); c.lineTo(x + h * 0.3, y - h * 0.95); c.stroke();
    if (kind === 1) for (const [dx, dy] of [[0, -h], [-h * 0.35, -h * 0.8], [h * 0.3, -h * 0.95]]) ellipse(c, x + dx, y + dy, s * 0.05, s * 0.05, P(col, 0.15));
  }
}
// A knitted scarf round the neck, its end trailing back.
function scarf(c, P, L, col, t) {
  const e = L.eye; if (!e || !L.cols) return;
  // Round the neck: just behind the head, or at the back of a land animal's air helmet.
  const s = L.s, x = L.helmet ? L.helmet.x - L.helmet.r * 0.92 : e.x - s * 0.75, k = colAt(L, x); if (!k) return;
  const h = Math.min(s * 0.4, (k.bot - k.top) * 0.35), w = s * 0.42;
  c.fillStyle = P(col); c.strokeStyle = P(col, -0.45, 0.8); c.lineWidth = Math.max(0.3, s * 0.03);
  c.beginPath(); c.moveTo(x - w / 2, k.top - s * 0.04); c.quadraticCurveTo(x + w * 0.1, k.top - s * 0.08, x + w / 2, k.top - s * 0.02); c.quadraticCurveTo(x + w * 0.85, (k.top + k.bot) / 2, x + w / 2, k.bot + s * 0.02); c.quadraticCurveTo(x, k.bot + s * 0.08, x - w / 2, k.bot + s * 0.04); c.quadraticCurveTo(x - w * 0.15, (k.top + k.bot) / 2, x - w / 2, k.top - s * 0.04); c.closePath(); c.fill(); c.stroke();
  const f = Math.sin(t * 3) * s * 0.12, y0 = k.top + (k.bot - k.top) * 0.35;
  c.beginPath(); c.moveTo(x - w / 2, y0); c.quadraticCurveTo(x - s * 0.8, y0 + s * 0.3 + f, x - s * 1.15, y0 + s * 0.75 + f * 1.4); c.lineTo(x - s * 0.9, y0 + s * 0.95 + f * 1.4); c.quadraticCurveTo(x - s * 0.55, y0 + s * 0.55 + f, x - w / 2, y0 + h); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = P(col, 0.25, 0.9); c.lineWidth = Math.max(0.3, s * 0.03); for (let i = 0; i < 4; i++) { const fx = x - s * (0.92 + i * 0.07), fy = y0 + s * (0.88 + i * 0.03) + f * 1.4; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx - s * 0.03, fy + s * 0.14); c.stroke(); }
  c.strokeStyle = P('#ffffff', 0, 0.45); c.lineWidth = Math.max(0.4, s * 0.06);
  for (let i = 1; i < 5; i++) { const y = k.top + (k.bot - k.top) * i / 5; c.beginPath(); c.moveTo(x - w * 0.35, y); c.quadraticCurveTo(x, y + s * 0.04, x + w * 0.45, y); c.stroke(); }
}
// Paid fairy lights (Christmas): a string of glowing bulbs draped along the back, twinkling in turn.
function fairyLights(c, P, L, t, u = null) {
  if (!L.cols) return;
  const s = L.s, x0 = L.box.x0 + L.dx, x1 = L.box.x1 + L.dx, n = 9, pts = [];
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * (0.12 + 0.72 * i / n), k = colAt(L, x); if (k) pts.push([x, k.top + Math.min(s * 0.25, (k.bot - k.top) * 0.18) + (i % 2 ? s * 0.12 : 0)]); }
  if (pts.length < 3) return;
  c.strokeStyle = P('#2a4a2a', 0, 0.9); c.lineWidth = Math.max(0.4, s * 0.04); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  crisp(c, (c) => pts.forEach(([x, y], i) => bulb(c, P, x, y + s * 0.08, Math.max(0.8, s * 0.09), LIGHT_COLOURS[i % LIGHT_COLOURS.length], t, i, u)));
}

// ---------- held, cheeks and markings ----------
function sword(c, P, L) {
  const e = L.eye || { x: L.top.x, y: L.top.y + 10, r: 3 }, s = L.s;
  // Held low at the front, in a paw or fin, pointing forward and up.
  const boxW = L.box.x1 - L.box.x0, boxH = L.box.y1 - L.box.y0, x = L.box.x0 + boxW * 0.72 + L.dx, k = colAt(L, x);
  const y = k ? k.bot - (k.bot - k.top) * 0.28 : L.box.y1 - boxH * 0.25 + L.dy;
  c.save(); c.translate(x, y); c.rotate(-0.22);
  const bl = s * 1.7, bw = s * 0.08;
  const g = c.createLinearGradient(0, -bw, 0, bw); g.addColorStop(0, P('#f4f8fb')); g.addColorStop(0.5, P('#b9c4cc')); g.addColorStop(1, P('#7d8a94'));
  c.fillStyle = g; c.beginPath(); c.moveTo(s * 0.12, -bw); c.lineTo(bl, -bw * 0.6); c.lineTo(bl + bw * 2.2, 0); c.lineTo(bl, bw * 0.6); c.lineTo(s * 0.12, bw); c.fill();
  c.strokeStyle = P('#6d7a84', 0, 0.8); c.lineWidth = Math.max(0.3, bw * 0.25); c.beginPath(); c.moveTo(s * 0.18, 0); c.lineTo(bl * 0.92, 0); c.stroke();
  c.fillStyle = P('#d9a93a'); c.beginPath(); c.roundRect ? c.roundRect(s * 0.06, -bw * 3.2, bw * 1.3, bw * 6.4, bw * 0.5) : c.rect(s * 0.06, -bw * 3.2, bw * 1.3, bw * 6.4); c.fill();
  c.fillStyle = P('#6b4127'); c.fillRect(-s * 0.26, -bw * 0.95, s * 0.32, bw * 1.9);
  c.strokeStyle = P('#3f2616', 0, 0.8); c.lineWidth = Math.max(0.25, bw * 0.3);
  for (let i = 0; i < 5; i++) { const x = -s * 0.24 + i * s * 0.065; c.beginPath(); c.moveTo(x, -bw * 0.95); c.lineTo(x + s * 0.04, bw * 0.95); c.stroke(); }
  ellipse(c, -s * 0.3, 0, bw * 1.3, bw * 1.3, P('#d9a93a')); ellipse(c, -s * 0.3, 0, bw * 0.6, bw * 0.6, P('#d8322e'));
  c.restore();
}
function cheeks(c, P, L, col) {
  const e = L.eye; if (!e) return;
  const list = e.pair ? e.pair : [e];
  for (const k of list) {
    let r = Math.max(k.r * 3, wearSize(L) * 0.2), x = k.x - (e.pair ? 0 : r * 0.5), y = k.y + Math.max(k.r * 2.4, r * 0.95);
    const span = colAt(L, x);
    if (span) { r = Math.max(1.2, Math.min(r, (span.bot - span.top) * 0.36)); y = Math.min(k.y + Math.max(k.r * 2, r * 0.9), span.bot - r * 0.9); x = k.x - (e.pair ? 0 : r * 0.5); }
    const g = c.createRadialGradient(x, y, 0, x, y, r); const blush = mix(col, '#e0336f', 0.45); g.addColorStop(0, P(blush, 0, 0.85)); g.addColorStop(0.6, P(blush, 0, 0.45)); g.addColorStop(1, P(blush, 0, 0));
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r * 0.7, 0, 0, TAU); c.fill();
  }
}
function markAt(L, frac) {
  const x = L.box.x0 + (L.box.x1 - L.box.x0) * frac + L.dx, k = colAt(L, x);
  return k ? { x, y: (k.top + k.bot) / 2, h: k.bot - k.top } : null;
}
function rose(c, P, L, col) {
  const m = markAt(L, 0.46); if (!m) return;
  const r = clamp(m.h * 0.3, 4, L.s * 0.75), lw = Math.max(0.35, r * 0.07);
  c.save(); c.translate(m.x, m.y);
  // Stem and two leaves, then three rings of petals curling into the centre.
  c.strokeStyle = P(col, -0.42, 0.9); c.lineWidth = lw * 1.6; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, r * 0.75); c.bezierCurveTo(r * 0.25, r * 1.3, -r * 0.3, r * 1.7, -r * 0.05, r * 2.2); c.stroke();
  for (const [side, y] of [[-1, r * 1.35], [1, r * 1.65]]) {
    c.save(); c.translate(side * r * 0.1, y); c.rotate(side * 0.75);
    c.fillStyle = P(col, -0.36, 0.92); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(side * r * 0.45, -r * 0.32, side * r * 0.95, 0); c.quadraticCurveTo(side * r * 0.45, r * 0.32, 0, 0); c.fill();
    c.strokeStyle = P(col, -0.55, 0.8); c.lineWidth = lw; c.beginPath(); c.moveTo(0, 0); c.lineTo(side * r * 0.8, 0); c.stroke(); c.restore();
  }
  const ring = (n, rr, ww, hh, shade, off) => { for (let i = 0; i < n; i++) { const a = off + i / n * Math.PI * 2;
    c.save(); c.rotate(a); c.translate(0, -rr);
    c.fillStyle = P(col, shade, 0.95); c.beginPath(); c.moveTo(-ww, hh * 0.35); c.quadraticCurveTo(-ww * 1.05, -hh, 0, -hh * 1.05); c.quadraticCurveTo(ww * 1.05, -hh, ww, hh * 0.35); c.closePath(); c.fill();
    c.strokeStyle = P(col, -0.5, 0.7); c.lineWidth = lw; c.beginPath(); c.moveTo(-ww * 0.85, hh * 0.2); c.quadraticCurveTo(0, -hh * 0.45, ww * 0.85, hh * 0.2); c.stroke(); c.restore(); } };
  ring(5, r * 0.55, r * 0.5, r * 0.42, -0.08, 0.2);
  ring(4, r * 0.3, r * 0.36, r * 0.32, -0.2, 0.9);
  ring(3, r * 0.12, r * 0.24, r * 0.22, -0.32, 0.4);
  c.strokeStyle = P(col, -0.6, 0.9); c.lineWidth = lw; c.beginPath();
  for (let a = 0; a < Math.PI * 4; a += 0.3) { const rr = r * 0.03 + a / (Math.PI * 4) * r * 0.2; c[a ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); }
  c.stroke(); c.restore();
}
function swirl(c, P, L, col) {
  const m = markAt(L, 0.66); if (!m) return;
  const r = clamp(m.h * 0.22, 3, L.s * 0.5);
  c.strokeStyle = P(col, -0.3, 0.85); c.lineWidth = Math.max(0.5, r * 0.2); c.lineCap = 'round'; c.beginPath();
  for (let a = 0; a < TAU * 2.3; a += 0.2) { const rr = a / (TAU * 2.3) * r; c[a ? 'lineTo' : 'moveTo'](m.x + Math.cos(a) * rr, m.y + Math.sin(a) * rr); }
  c.stroke();
}

// ---------- looks ----------
function sparkleStar(c, x, y, r, fill) {
  c.fillStyle = fill; c.beginPath(); c.moveTo(x, y - r);
  c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
}
function glowSpots(c, P, L, kind, res, t) {
  const pts = spread(L, 16, res.seed || 1), r0 = clamp((L.box.y1 - L.box.y0) * 0.04, 1.2, 7);
  const base = res.colors?.secondary || '#d8fbff';
  c.save(); c.globalCompositeOperation = 'lighter';
  pts.forEach(([x, y], i) => {
    // The Twinkle Tide's spots (core/events.js): festive colours that twinkle one after another. Spots on the body, never a
    // string of lights, which is the shop's fairy lights.
    const col = kind === 'rainbow' ? RAINBOW[i % RAINBOW.length] : kind === 'twinkle' ? TWINKLE[i % TWINKLE.length] : base;
    const pulse = kind === 'twinkle' ? 0.25 + 0.75 * Math.max(0, Math.sin(t * 3 - i * 0.9)) ** 2 : 0.7 + 0.3 * Math.sin(t * 2 + i * 1.3);
    const g = c.createRadialGradient(x, y, 0, x, y, r0 * 3); g.addColorStop(0, P(col, 0.45, 0.9 * pulse)); g.addColorStop(0.35, P(col, 0.2, 0.45 * pulse)); g.addColorStop(1, P(col, 0, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r0 * 3, 0, TAU); c.fill();
  });
  c.restore();
}
// A pink or red body, where a pink blush wouldn't show.
const pinkish = (h) => { if (!/^#[0-9a-f]{6}$/i.test(h || '')) return false; const n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return r > 150 && r > g * 1.25 && r >= b * 0.95; };
// A body light enough that white sparkles wouldn't show on it.
const pale = (h) => { if (!/^#[0-9a-f]{6}$/i.test(h || '')) return false; const n = parseInt(h.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 200; };
function sparkles(c, P, L, res, t) {
  // Land animals' legs paddle and long bodies curve, so their sparkles stay well inside the body.
  const pts = spread(L, 12, (res.seed || 1) + 7, COMMUNITY_SPECIES[res.species]?.helmet || motionOf(res.species).k === 'wave' ? L.pts : L.loose), r0 = clamp(L.s * 0.16, 1.5, 9);
  c.save(); c.globalCompositeOperation = 'lighter';
  pts.forEach(([x, y], i) => { const ph = (t * 0.7 + i * 0.37) % 1, a = Math.sin(ph * Math.PI); if (a > 0.05) sparkleStar(c, x, y, r0 * (0.4 + a * 0.8), P(pale(res.colors?.primary) ? '#e8a915' : '#ffffff', 0, 0.85 * a)); });
  c.restore();
}
function galaxy(c, P, L, res, t) {
  const pts = spread(L, 30, (res.seed || 1) + 13), r0 = clamp(Math.min(L.box.x1 - L.box.x0, L.box.y1 - L.box.y0) * 0.09, 2, 10);
  pts.slice(0, 14).forEach(([x, y], i) => {
    const col = ['#3b1a78', '#1b2f86', '#7a2a8c'][i % 3];
    const g = c.createRadialGradient(x, y, 0, x, y, r0); g.addColorStop(0, P(col, 0, 0.55)); g.addColorStop(1, P(col, 0, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r0, 0, TAU); c.fill();
  });
  c.strokeStyle = P('#d9e4ff', 0, 0.35); c.lineWidth = Math.max(0.3, r0 * 0.06); c.beginPath();
  for (let i = 0; i + 2 < 15; i += 3) { const [a, b, d] = [pts[i], pts[i + 1], pts[i + 2]]; if (!d) break; c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); }
  c.stroke();
  pts.forEach(([x, y], i) => { const tw = 0.6 + 0.4 * Math.sin(t * 3 + i); ellipse(c, x, y, r0 * 0.1 * (1 + (i % 3) * 0.5), r0 * 0.1 * (1 + (i % 3) * 0.5), P('#ffffff', 0, 0.9 * tw)); });
}
function glowHalo(c, P, L, res) {
  const cx = (L.box.x0 + L.box.x1) / 2 + L.dx, cy = (L.box.y0 + L.box.y1) / 2 + L.dy;
  const rx = (L.box.x1 - L.box.x0) * 0.62, ry = Math.max((L.box.y1 - L.box.y0) * 0.9, rx * 0.35);
  const col = res.colors?.primary || '#bff8ff';
  c.save(); c.translate(cx, cy); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx); g.addColorStop(0, P(col, 0.35, 0.34)); g.addColorStop(0.55, P(col, 0.3, 0.12)); g.addColorStop(1, P(col, 0.3, 0));
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}
function bodyGlow(c, P, L, res, t) {
  const pts = spread(L, 18, (res.seed || 1) + 3), r0 = clamp(Math.min(L.box.x1 - L.box.x0, L.box.y1 - L.box.y0) * 0.12, 2, 14);
  const col = res.colors?.primary || '#bff8ff', pulse = 0.75 + 0.25 * Math.sin(t * 1.6);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const [x, y] of pts) { const g = c.createRadialGradient(x, y, 0, x, y, r0); g.addColorStop(0, P(col, 0.5, 0.2 * pulse)); g.addColorStop(1, P(col, 0.5, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r0, 0, TAU); c.fill(); }
  c.restore();
}
// The first nine species draw their own eyes, so a new eye colour or big baby eyes go over theirs.
function overlayEye(c, P, L, ex) {
  const e = L.eye; if (!e) return;
  const baby = ex.baby || ex.bigEyes;
  for (const k of e.pair || [e]) {
    const r = baby ? Math.max(k.r * 1.85, wearSize(L) * (e.pair ? 0.1 : 0.15)) : k.r * 1.05;
    if (baby) { ellipse(c, k.x, k.y, r * 1.42, r * 1.37, P('#0a1720', 0, 0.55)); ellipse(c, k.x, k.y, r * 1.35, r * 1.3, P('#fbfbf2')); }
    if (ex.eyeColor) { const g = c.createRadialGradient(k.x, k.y, 0, k.x, k.y, r); g.addColorStop(0, P(ex.eyeColor, 0.3)); g.addColorStop(1, P(ex.eyeColor, -0.4)); ellipse(c, k.x, k.y, r, r, g); }
    ellipse(c, k.x + r * 0.08, k.y, r * (ex.eyeColor ? 0.55 : 0.95), r * (ex.eyeColor ? 0.6 : 0.95), P('#0a1720'));
    ellipse(c, k.x - r * 0.3, k.y - r * 0.35, r * 0.3, r * 0.26, P('#ffffff', 0, 0.95));
    ellipse(c, k.x + r * 0.35, k.y + r * 0.35, r * 0.12, r * 0.1, P('#ffffff', 0, 0.7));
  }
}

const HEAD_WEAR = { bow: (c, P, s, ex) => bow(c, P, s, ex.wearColor || '#ee4d94'), crown: (c, P, s, ex) => crown(c, P, s, ex.wearColor || '#e8b43a'),
  pirate_hat: (c, P, s) => pirateHat(c, P, s), party_hat: (c, P, s, ex) => partyHat(c, P, s, [ex.wearColor || '#4a45b0', '#f8d24a', '#ee4d94', '#2fd6c3']),
  disco_hat: (c, P, s, ex, t) => discoHat(c, P, s, ex.wearColor || '#8a58c9', t), unicorn_horn: (c, P, s, ex) => unicornHorn(c, P, s, ex.wearColor || '#e7d9ff'),
  cap: (c, P, s, ex) => cap(c, P, s, ex.wearColors || [ex.wearColor || '#d9413a', ex.wearColor || '#d9413a']),
  headphones: (c, P, s, ex) => headphones(c, P, s, ex.wearColor || '#d9413a'),
  santahat: (c, P, s, ex, t) => drawChristmasHat(c, P, 'santahat', s, t, ex.xmasU), snowcrown: (c, P, s, ex, t) => drawChristmasHat(c, P, 'snowcrown', s, t, ex.xmasU),
  top_hat: (c, P, s, ex) => topHat(c, P, s, ex.wearColor || '#1d1c22'), cowboy_hat: (c, P, s, ex) => cowboyHat(c, P, s, ex.wearColor || '#9a6a3a'),
  wizard_hat: (c, P, s, ex) => wizardHat(c, P, s, ex.wearColor || '#3a3a9a'), propeller_hat: (c, P, s, ex, t) => propellerHat(c, P, s, ex.wearColor || '#d9413a', t),
  flower: (c, P, s, ex) => flowerHat(c, P, s, ex.wearColor || '#f8d24a'), castle: (c, P, s, ex) => castleHat(c, P, s, ex.wearColor || '#b8b0a0') };
const LIFT = { santahat: 0.1, snowcrown: 0.06, bow: 0.12, crown: 0.06, pirate_hat: 0.14, party_hat: 0.05, disco_hat: 0.04, unicorn_horn: 0.05, cap: 0.12, headphones: 0.3, top_hat: 0.08, cowboy_hat: 0.1, wizard_hat: 0.06, propeller_hat: 0.12, flower: 0.06, castle: 0.04 };

export function hasLooksOfItsOwn(species) { return !COMMUNITY_SPECIES[species] || (COMMUNITY_SPECIES[species].family === 'turtle' && species !== 'giant_turtle') || COMMUNITY_SPECIES[species].family === 'whipray'; }

// The milestone week (core/milestone.js): the scene draws one soft sea-light behind every creature (render/scene.js). Off unless
// the ocean page turns it on.
let EVENT_GLOW = false;
export const setEventGlow = (on) => { EVENT_GLOW = !!on; };
export const eventGlowOn = () => EVENT_GLOW;

// Before the creature: glow behind it (newer designs only).
export function drawExtrasBehind(c, res, pr, P) {
  const ex = res.extras; if (!ex?.glow || hasLooksOfItsOwn(res.species) || COMMUNITY_SPECIES[res.species]?.family === 'axolotl') return;
  glowHalo(c, P, layout(res, pr, null), res);
}

// The shop's fit check (tools/fit-check.mjs) watches where things go: given a function, every drawExtras call reports the eyes, the
// helmet and where the head item sat, in canvas pixels. Off (null) everywhere else, so nothing is reported or slowed.
let WATCH = null;
export const watchExtras = (fn) => { WATCH = typeof fn === 'function' ? fn : null; };
const plainFit = (f) => !f.x && !f.y && f.scale === 1;
// A fit on the face (render/paid-items.js fitFor): moved from the eye and grown or shrunk round it. With none, drawn exactly as before.
function onFace(c, L, species, key, draw) {
  const f = fitOf(species, key), e = L.eye;
  if (!e || plainFit(f)) return draw();
  const s = wearSize(L);
  c.save(); c.translate(e.x + f.x * s, e.y + f.y * s); c.scale(f.scale, f.scale); c.translate(-e.x, -e.y);
  try { draw(); } finally { c.restore(); }
}

// After the creature, in its own units. rec and base come from the eye recording (null in Node).
export function drawExtras(c, res, t, P, pr, rec, base, follow = null) {
  const ex = res.extras; if (!ex) return;
  const L = layout(res, pr, toLocal(rec, base));
  L.bend = bendAt(follow, L);
  const own = hasLooksOfItsOwn(res.species), sp = res.species;
  c.save();
  // Glowing looks stay bright and unlit over the light pass (render/crisp.js).
  if (ex.glow && !own) crisp(c, (c) => bodyGlow(c, P, L, res, t));
  if (ex.galaxy) crisp(c, (c) => galaxy(c, P, L, res, t));
  if (ex.glowSpots) crisp(c, (c) => glowSpots(c, P, L, ex.glowSpots, res, t));
  if (ex.mark === 'rose') rose(c, P, L, ex.markColor || res.colors?.secondary || '#3a7fd6');
  if (ex.mark === 'swirl') swirl(c, P, L, ex.markColor || mix(res.colors?.primary || '#8c9aa3', '#1b1f24', 0.55));
  if ((own && ex.eyeColor) || ex.baby || ex.bigEyes) onFace(c, L, sp, ex.baby || ex.bigEyes ? 'baby' : 'eyes', () => overlayEye(c, P, L, ex));
  if (ex.scars) scars(c, P, L, res);
  if (ex.coral) coral(c, P, L);
  // On a pink or red animal the usual blush vanishes, so it goes a deeper rose there.
  if (ex.cheeks) onFace(c, L, sp, 'cheeks', () => cheeks(c, P, L, pinkish(res.colors?.primary) ? '#a8143c' : ex.cheeks));
  if (ex.scarf) scarf(c, P, L, ex.scarfColor || '#d9413a', t);
  if (ex.cape) cape(c, P, L, ex.capeColor || (reddish(res.colors?.primary) ? '#2c3f8f' : '#c8283a'), t);
  if (ex.xmas === 'fairylights') {
    // Its fit moves the string down the body (or up), in head sizes, and grows or shrinks the bulbs' spread round the middle.
    const f = fitOf(sp, 'fairylights'), cx = (L.box.x0 + L.box.x1) / 2 + L.dx, cy = (L.box.y0 + L.box.y1) / 2 + L.dy;
    if (plainFit(f)) fairyLights(c, P, L, t, ex.xmasU);
    else { c.save(); c.translate(cx + f.x * L.s, cy + f.y * L.s); c.scale(f.scale, f.scale); c.translate(-cx, -cy); fairyLights(c, P, L, t, ex.xmasU); c.restore(); }
  }
  if (ex.wear === 'jersey') jersey(c, P, L, ex.wearColors || [ex.wearColor || '#3a7fd6', '#f5f3ec']);
  if (ex.dress === 'princess') dress(c, P, L, t, res.seed || 1);
  if (ex.wear === 'glasses' || ex.glasses) onFace(c, L, sp, 'glasses', () => glasses(c, P, L, wearSize(L)));
  if (ex.lashes) onFace(c, L, sp, 'lashes', () => lashes(c, P, L));
  if (ex.goggles) onFace(c, L, sp, 'goggles', () => goggles(c, P, L));
  if (ex.monocle) onFace(c, L, sp, 'monocle', () => monocle(c, P, L));
  // A paid Christmas hat is worn instead of an asked-for hat while Christmas items show (core/shop.js christmasShowing).
  const wearId = ex.xmas === 'santahat' || ex.xmas === 'snowcrown' ? ex.xmas : ex.wear;
  const head = HEAD_WEAR[wearId];
  // Its fit, from the shop's fit check: with none (nearly every species) it is placed exactly as before.
  const hf = head ? fitOf(sp, wearId) : null;
  let at = null; // where the head item sat, for the fit check
  // Headphones on a creature seen from the side are placed from its eye (headphonesSide), not hung from the top of its head.
  if (wearId === 'headphones' && L.eye && !L.eye.pair && !L.helmet) {
    const ws = wearSize(L), e = L.eye;
    if (plainFit(hf)) headphonesSide(c, P, L, ws, ex.wearColor || '#d9413a');
    else { c.save(); c.translate(e.x + hf.x * ws, e.y + hf.y * ws); c.scale(hf.scale, hf.scale); c.translate(-e.x, -e.y); headphonesSide(c, P, L, ws, ex.wearColor || '#d9413a'); c.restore(); }
    at = { x: e.x + hf.x * ws, y: e.y + hf.y * ws, ws: ws * hf.scale, how: 'phones' };
  } else if (head && L.helmet) {
    // A land visitor in its bubble helmet wears it on top of the helmet (owner, 2026-11-12: every item looks right on every animal).
    const ws = Math.min(wearSize(L), L.helmet.r * 1.1) * hf.scale;
    const x = L.helmet.x + hf.x * ws, y = L.helmet.y - L.helmet.r * 0.93 + ws * LIFT[wearId] * 0.5 + hf.y * ws;
    c.save(); c.translate(x, y); c.rotate(-0.08); head(c, P, ws, ex, t); c.restore();
    at = { x, y, ws, how: 'helmet' };
  } else if (head) {
    c.save();
    let hx = L.top.x, hy = L.top.y, ang = L.eye?.pair ? 0 : -0.12, how = 'top';
    if (L.eye && !L.eye.pair && !L.helmet) {
      const x = L.eye.x - L.s * (0.4 - hf.x), k = colAt(L, x), a = colAt(L, x - 4), b = colAt(L, x + 4);
      // On the solid top of the head, not on a spine or fin tip above it; tilted with the slope of the head there.
      if (k && k.solid < L.eye.y) { hx = x; hy = k.solid; how = 'solid'; if (a && b) ang = clamp(Math.atan2(b.solid - a.solid, 8), -0.55, 0.55) - 0.1; }
      else if (hf.x) hx += hf.x * L.s;
    } else if (hf.x) hx += hf.x * wearSize(L);
    const ws = wearSize(L) * hf.scale, hy2 = hy + ws * LIFT[wearId] + (hf.y ? hf.y * ws : 0);
    c.translate(hx, hy2);
    c.rotate(ang);
    head(c, P, ws, ex, t);
    c.restore();
    at = { x: hx, y: hy2, ws, how };
  }
  if (ex.hold === 'sword') sword(c, P, L);
  if (ex.ride === 'skateboard') skateboard(c, P, L, ex.rideColor || '#e0702a');
  if (ex.sparkle) sparkles(c, P, L, res, t);
  if (WATCH && c.getTransform) {
    // Sizes by the vertical scale: a body narrowing through a turn is squeezed side to side only.
    const m = c.getTransform(), k = Math.hypot(m.c, m.d), dev = (p) => ({ x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f });
    const e = L.eye, face = e ? (e.pair || [e]).map((q) => ({ ...dev(q), r: q.r * k })) : [];
    WATCH({
      species: sp, view: !e || e.virtual ? 'none' : e.fromAbove ? 'above' : e.pair ? 'front' : 'side',
      eyes: e && !e.virtual ? face : [], face, helmet: L.helmet ? { ...dev(L.helmet), r: L.helmet.r * k } : null,
      head: at ? { ...dev(at), ws: at.ws * k, how: at.how } : null, s: L.s * k, ws: wearSize(L) * k,
    });
  }
  c.restore();
}
