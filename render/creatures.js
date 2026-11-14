import { artworkScale } from './metrics.js';
import { COMMUNITY_SPECIES } from '../core/community-species.js';
import { SPECIES } from '../core/species.js';
import { drawCommunityCreature, setEyeLook } from './community-creatures.js';
import { drawEye, teeth, setLids, lidsAt } from './face.js';
import { crisp } from './crisp.js';
import { probeSpecies, drawExtras, drawExtrasBehind } from './extras.js';
import { wornExtras } from './paid-items.js';
import { motionOf, followBend, takeFollow, pulseAt } from './body-motion.js';
import { turnWidth } from './motion.js';
// Reusable creature artwork. Each species is one parametric drawing:
// colours, pattern, upgrade and fog change, and the anatomy and proportions never do.
import { hexRgb, lerp, clamp, rng } from './util.js';
import { variantOf } from './variation.js';

export const HAZE_RGB = [24, 92, 112];
// Far creatures fade into the colour of the water around them.
export function setHaze([r, g, b]) { HAZE_RGB[0] = Math.min(255, r * 275); HAZE_RGB[1] = Math.min(255, g * 275); HAZE_RGB[2] = Math.min(255, b * 275); }

export function palette(fog) {
  return (hex, light = 0, alpha = 1) => {
    const c = hexRgb(hex);
    const toward = light >= 0 ? 255 : 0;
    const k = Math.abs(light);
    const out = [0, 1, 2].map((i) => {
      const lit = lerp(c[i], toward === 0 ? c[i] * 0.2 : toward, k);
      return Math.round(lerp(lit, HAZE_RGB[i], fog));
    });
    return `rgba(${out[0]},${out[1]},${out[2]},${alpha})`;
  };
}

function smoothPath(path, pts, closed) {
  const n = pts.length;
  if (closed) {
    const s = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2];
    path.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      path.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    path.closePath();
  } else {
    path.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      path.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    path.lineTo(pts[n - 1][0], pts[n - 1][1]);
  }
  return path;
}

function shimmer(ctx, t, x0, x1, y0, y1, P) {
  const span = x1 - x0;
  const c = x0 + ((t * 0.16) % 1.4 - 0.2) * span;
  const g = ctx.createLinearGradient(c - span * 0.2, y0, c + span * 0.2, y1);
  g.addColorStop(0, P('#ffffff', 0, 0));
  g.addColorStop(0.5, P('#ffffff', 0, 0.3));
  g.addColorStop(1, P('#ffffff', 0, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, span, y1 - y0);
}

function constellation(ctx, seed, x0, x1, y0, y1, P, col) {
  const r = rng(seed + 991);
  const pts = [];
  for (let i = 0; i < 18; i++) pts.push([lerp(x0, x1, r()), lerp(y0, y1, r()), 0.5 + r() * 1.2]);
  ctx.strokeStyle = P(col, 0.2, 0.34);
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  for (let i = 0; i < pts.length - 1; i += 3) { ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.lineTo(pts[i + 2][0], pts[i + 2][1]); }
  ctx.stroke();
  ctx.fillStyle = P(col, 0.4, 0.95);
  for (const p of pts) { ctx.beginPath(); ctx.arc(p[0], p[1], p[2], 0, 6.283); ctx.fill(); }
}

function halo(ctx, rad, P, col) {
  const g = ctx.createRadialGradient(0, 0, rad * 0.3, 0, 0, rad);
  g.addColorStop(0, P(col, 0.3, 0.22));
  g.addColorStop(1, P(col, 0.3, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, rad, 0, 6.283); ctx.fill();
}

const look = (res) => ({
  a: res.colors?.primary || '#ff8a4c',
  b: res.colors?.secondary || '#fff1dc',
  pattern: res.upgrade?.pattern || res.pattern || 'plain',
  effect: res.upgrade?.effect || 'none',
  seed: res.seed || 1,
});

// ---------- Reef fish ----------
function reefFish(ctx, res, pose, t, P) {
  const { a, b, pattern, effect, seed } = look(res);
  if (effect === 'halo') halo(ctx, 62, P, a);
  const sw = pose.swim;
  const amp = 2.4 + clamp(pose.speed / 40) * 2.2;
  const bend = (x) => { const s = clamp((46 - x) / 92); return Math.sin(sw - s * 6.28) * amp * s * s; };
  const top = [], bot = [];
  const N = 12;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const x = lerp(48, -36, s);
    const belly = Math.pow(Math.sin(Math.PI * Math.pow(s * 0.95 + 0.005, 0.82)), 1.02);
    const taper = 2.8 + 25 * belly;
    top.push([x, -taper * 1.04 + bend(x)]);
    bot.push([x, taper * 0.88 + bend(x)]);
  }
  followBend(bend);
  const tb = bend(-36);
  const tailSwing = Math.cos(sw - 6.28) * 0.32;
  const tw = 1 - Math.abs(tailSwing) * 0.5;

  // Tail fin, with soft rays
  ctx.save();
  ctx.translate(-34, tb);
  ctx.rotate(tailSwing * 0.55);
  ctx.scale(tw, 1);
  const tail = new Path2D();
  tail.moveTo(2, -3.4);
  tail.bezierCurveTo(-8, -7, -24, -20, -38, -27);
  tail.quadraticCurveTo(-23, 0, -38, 27);
  tail.bezierCurveTo(-24, 20, -8, 7, 2, 3.4);
  tail.closePath();
  const tg = ctx.createLinearGradient(2, 0, -32, 0);
  tg.addColorStop(0, P(a, -0.12, 0.98));
  tg.addColorStop(1, P(b, -0.02, 0.86));
  ctx.fillStyle = tg; ctx.fill(tail);
  ctx.strokeStyle = P(a, -0.28, 0.32); ctx.lineWidth = 0.55;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(0, i * 0.8); ctx.quadraticCurveTo(-14, i * 3.1, -27 + Math.abs(i) * -0.8, i * 7.1); ctx.stroke(); }
  ctx.restore();

  // Dorsal and anal fins
  const finWave = Math.sin(sw * 0.5) * 1.3;
  const dorsal = new Path2D();
  dorsal.moveTo(26, top[3][1] + 3);
  dorsal.bezierCurveTo(19, -44 + finWave, 7, -49 + finWave, -2, -46 + finWave);
  dorsal.bezierCurveTo(-14, -42 + finWave, -24, -28 + bend(-24), -33, -20 + bend(-30));
  dorsal.lineTo(-27, -5 + bend(-27));
  dorsal.lineTo(-14, -12 + bend(-14));
  dorsal.closePath();
  const dg = ctx.createLinearGradient(0, -48, 0, -20);
  dg.addColorStop(0, P(b, -0.04, 0.94));
  dg.addColorStop(0.55, P(a, -0.1, 0.98));
  dg.addColorStop(1, P(a, -0.3, 1));
  ctx.fillStyle = dg; ctx.fill(dorsal);
  const anal = new Path2D();
  anal.moveTo(2, bot[6][1] - 2);
  anal.bezierCurveTo(-8, 39 - finWave, -24, 36 - finWave, -33, 16 + bend(-30));
  anal.lineTo(-15, 14 + bend(-15));
  anal.closePath();
  ctx.fillStyle = dg; ctx.fill(anal);
  ctx.strokeStyle = P(a, -0.3, 0.22); ctx.lineWidth = 0.5;
  for (let i = 0; i < 7; i++) { const x = 18 - i * 6; ctx.beginPath(); ctx.moveTo(x, -24 + bend(x)); ctx.lineTo(x - 5, -41 + i * 1.6 + finWave); ctx.stroke(); }

  // Body
  const body = new Path2D();
  const outline = [...top, ...bot.slice(0).reverse()];
  smoothPath(body, outline, true);
  const bg = ctx.createLinearGradient(0, -32, 0, 30);
  bg.addColorStop(0, P(a, -0.2));
  bg.addColorStop(0.38, P(a, 0));
  bg.addColorStop(0.78, P(a, 0.2));
  bg.addColorStop(1, P(b, 0.12));
  ctx.fillStyle = bg; ctx.fill(body);

  ctx.save();
  ctx.clip(body);
  drawBodyPattern(ctx, pattern, { a, b, seed, x0: -40, x1: 50, y0: -36, y1: 34, P, bend, t });
  // Overlapping scales that follow the body, and the lateral line.
  ctx.strokeStyle = P(a, -0.32, 0.36); ctx.lineWidth = 0.5; ctx.beginPath();
  for (let row = 0; row < 12; row++) for (let x = -36 + (row % 2) * 2.6; x < 20; x += 5.2) {
    const y = -29 + row * 5;
    ctx.moveTo(x, y - 2.4 + bend(x)); ctx.quadraticCurveTo(x - 2.6, y + bend(x - 2.6), x, y + 2.4 + bend(x));
  }
  ctx.stroke();
  ctx.strokeStyle = P(b, 0.15, 0.28); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(18, -12 + bend(18)); ctx.quadraticCurveTo(-8, -15 + bend(-8), -37, -1 + bend(-37)); ctx.stroke();
  const rim = ctx.createLinearGradient(0, -32, 0, -6);
  rim.addColorStop(0, P('#ffffff', 0, 0.26));
  rim.addColorStop(1, P('#ffffff', 0, 0));
  ctx.fillStyle = rim; ctx.fillRect(-40, -36, 90, 30);
  const lower = ctx.createLinearGradient(0, 8, 0, 32);
  lower.addColorStop(0, P('#04202e', 0, 0));
  lower.addColorStop(1, P('#04202e', 0, 0.24));
  ctx.fillStyle = lower; ctx.fillRect(-40, 8, 90, 26);
  // Gill line
  ctx.strokeStyle = P(a, -0.42, 0.42); ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(22, -17 + bend(22)); ctx.quadraticCurveTo(14.5, 1 + bend(14.5), 22, 18 + bend(22)); ctx.stroke();
  if (effect === 'shimmer') shimmer(ctx, t, -40, 50, -36, 34, P);
  ctx.restore();

  // Pectoral fin
  const flap = Math.sin(sw * 0.42) * 0.42;
  ctx.save();
  ctx.translate(15, 7 + bend(15));
  ctx.rotate(0.45 + flap);
  const pec = new Path2D();
  pec.moveTo(0, -3); pec.bezierCurveTo(-11, -9, -22, -4, -24, 4); pec.bezierCurveTo(-17, 9, -7, 7, 0, 3); pec.closePath();
  // Translucent and the body's own colour, as a real pectoral fin is (15 Nov 2026); filled in the pale second colour it had read as
  // a white oval stuck on the side.
  ctx.fillStyle = P(a, 0.14, 0.5); ctx.fill(pec);
  ctx.strokeStyle = P(a, -0.25, 0.4); ctx.lineWidth = 0.5;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-1, i); ctx.lineTo(-21, i * 3.2 + 1); ctx.stroke(); }
  ctx.restore();

  // Eye and mouth
  drawEye(ctx, 31.6, -7 + bend(31), P, 3.1);
  ctx.strokeStyle = P(a, -0.5, 0.6); ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(45.8, 3 + bend(45)); ctx.quadraticCurveTo(41, 6.2 + bend(41), 37.5, 4.5 + bend(38)); ctx.stroke();
}

function drawBodyPattern(ctx, pattern, o) {
  const { a, b, seed, x0, x1, y0, y1, P, bend } = o;
  const off = bend || (() => 0);
  if (pattern === 'stripes') {
    ctx.fillStyle = P(b, 0.02, 0.9);
    for (let i = 0; i < 5; i++) {
      const x = lerp(x1 - 22, x0 + 8, i / 4);
      const y = off(x);
      ctx.beginPath();
      ctx.moveTo(x + 2.8, y0); ctx.quadraticCurveTo(x - 3.2, y, x + 2.8, y1);
      ctx.lineTo(x - 3.2, y1); ctx.quadraticCurveTo(x - 9.2, y, x - 3.2, y0); ctx.closePath(); ctx.fill();
    }
  } else if (pattern === 'bands') {
    ctx.fillStyle = P(b, 0.06, 0.97);
    for (const f of [0.26, 0.62]) {
      const x = lerp(x1, x0, f), w = 7.5, y = off(x);
      ctx.beginPath();
      ctx.moveTo(x + w, y0); ctx.quadraticCurveTo(x + w - 6, y, x + w, y1);
      ctx.lineTo(x - w, y1); ctx.quadraticCurveTo(x - w - 6, y, x - w, y0); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = P('#101a22', 0, 0.55); ctx.lineWidth = 1;
    ctx.stroke();
  } else if (pattern === 'spots') {
    const r = rng(seed + 7);
    ctx.fillStyle = P(b, 0.02, 0.92);
    for (let i = 0; i < 17; i++) {
      const x = lerp(x0 + 2, x1 - 18, r()), y = lerp(y0 + 6, y1 - 12, r()), s = 1.6 + r() * 2.5;
      ctx.beginPath(); ctx.ellipse(x, y + off(x), s * 1.1, s, 0, 0, 6.283); ctx.fill();
    }
  } else if (pattern === 'gradient') {
    const g = ctx.createLinearGradient(x1, 0, x0, 0);
    g.addColorStop(0.08, P(b, 0, 0));
    g.addColorStop(0.92, P(b, 0, 0.98));
    ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  } else if (pattern === 'constellation') {
    constellation(ctx, seed, x0 + 6, x1 - 14, y0 + 8, y1 - 10, P, b);
  }
}

// ---------- Jellyfish ----------
function jellyfish(ctx, res, pose, t, P) {
  const { a, b, pattern, effect, seed } = look(res);
  if (effect === 'halo') halo(ctx, 74, P, a);
  const ph = pose.swim;
  const pulse = pose.effort === undefined ? Math.pow(0.5 + 0.5 * Math.sin(ph), 1.6) : pulseAt(ph, 'bell');
  const w = 42 - pulse * 8.5, h = 36 + pulse * 5.5;
  const sway = Math.sin(t * 0.34 + seed) * 0.08;
  ctx.rotate(sway);
  const r = rng(seed + 3);

  // Tentacles behind the bell (kept sharp over the light pass)
  crisp(ctx, (ctx) => { for (let i = 0; i < 11; i++) {
    const f = (i / 10) * 2 - 1;
    const len = 70 + r() * 40;
    const p0 = r() * 6.283;
    ctx.beginPath();
    const steps = 9;
    for (let s = 0; s <= steps; s++) {
      const k = s / steps;
      const x = f * w * (0.86 - k * 0.28) + Math.sin(ph * 0.75 - k * 3.3 + p0) * (2 + k * 8);
      const y = 8 + k * len * (1 - pulse * 0.12);
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = P(i % 2 ? b : a, 0.12, 0.36);
    ctx.lineWidth = 0.9;
    ctx.stroke();
  } });
  // Ruffled oral arms
  for (let i = 0; i < 4; i++) {
    const f = (i - 1.5) / 1.5;
    const p0 = i * 1.7 + seed % 5;
    const left = [], right = [];
    const steps = 12;
    for (let s = 0; s <= steps; s++) {
      const k = s / steps;
      const cx = f * 13 * (1 - k * 0.3) + Math.sin(ph * 0.65 - k * 3.7 + p0) * (1 + k * 6);
      const y = 5 + k * 58;
      const wid = (1 - k) * 5.4 * (0.72 + 0.34 * Math.sin(k * 21 + p0)) + 0.5;
      left.push([cx - wid, y]); right.push([cx + wid, y]);
    }
    const p = new Path2D();
    smoothPath(p, [...left, ...right.reverse()], true);
    ctx.fillStyle = P(b, 0.05, 0.42);
    ctx.fill(p);
  }

  // Bell
  const bell = new Path2D();
  bell.moveTo(-w, 7);
  bell.bezierCurveTo(-w * 1.04, -h * 0.6, -w * 0.58, -h, 0, -h);
  bell.bezierCurveTo(w * 0.58, -h, w * 1.04, -h * 0.6, w, 7);
  const scallops = 9;
  for (let i = 0; i < scallops; i++) {
    const x0 = lerp(w, -w, i / scallops), x1 = lerp(w, -w, (i + 1) / scallops);
    bell.quadraticCurveTo((x0 + x1) / 2, 12.5 - Math.abs((x0 + x1) / w) * 1.2, x1, 7);
  }
  bell.closePath();
  const g = ctx.createRadialGradient(-w * 0.22, -h * 0.62, 2, 0, -h * 0.25, w * 1.42);
  g.addColorStop(0, P(b, 0.3, 0.97));
  g.addColorStop(0.44, P(a, 0.08, 0.93));
  g.addColorStop(1, P(a, -0.08, 0.84));
  ctx.fillStyle = g; ctx.fill(bell);

  ctx.save();
  ctx.clip(bell);
  // Radial canals from the centre of the bell to its rim.
  ctx.strokeStyle = P(b, 0.3, 0.32); ctx.lineWidth = 0.55; ctx.beginPath();
  for (let i = 0; i < 16; i++) { const f = ((i + 0.5) / 16) * 2 - 1; ctx.moveTo(f * w * 0.16, -h * 0.82); ctx.quadraticCurveTo(f * w * 0.7, -h * 0.62, f * w * 0.98, 8); }
  ctx.stroke();
  // Inner glow shapes
  ctx.fillStyle = P(b, 0.2, 0.5);
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * w * 0.34;
    ctx.beginPath(); ctx.ellipse(x, -h * 0.28, w * 0.13, h * 0.2, x * 0.012, 0, 6.283); ctx.fill();
    ctx.save(); ctx.strokeStyle = P(a, -0.12, 0.55); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, -h * 0.28, w * 0.075, h * 0.12, 0, 0.5, 5.8); ctx.stroke(); ctx.restore(); // the horseshoe of each gonad
  }
  if (pattern === 'spots') {
    const rr = rng(seed + 11);
    ctx.fillStyle = P(b, 0.3, 0.86);
    for (let i = 0; i < 18; i++) { const x = lerp(-w, w, rr()), y = lerp(-h * 0.97, 2, rr()); ctx.beginPath(); ctx.arc(x, y, 1 + rr() * 2.1, 0, 6.283); ctx.fill(); }
  } else if (pattern === 'rings') {
    ctx.strokeStyle = P(b, 0.24, 0.72); ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(0, 7, w * (i / 3.1), h * (i / 3) + 4, 0, 3.14, 6.283); ctx.stroke(); }
  } else if (pattern === 'gradient') {
    const gg = ctx.createLinearGradient(0, -h, 0, 10);
    gg.addColorStop(0, P(b, 0, 0));
    gg.addColorStop(1, P(b, 0, 0.92));
    ctx.fillStyle = gg; ctx.fillRect(-w * 1.1, -h, w * 2.2, h + 14);
  } else if (pattern === 'constellation') {
    constellation(ctx, seed, -w, w, -h, 2, P, b);
  }
  // Highlight on the dome
  const hl = ctx.createRadialGradient(-w * 0.32, -h * 0.72, 0.5, -w * 0.32, -h * 0.72, w * 0.56);
  hl.addColorStop(0, P('#ffffff', 0, 0.58)); hl.addColorStop(1, P('#ffffff', 0, 0));
  ctx.fillStyle = hl; ctx.fillRect(-w * 1.1, -h, w * 2.2, h);
  if (effect === 'shimmer') shimmer(ctx, t, -w, w, -h, 12, P);
  ctx.restore();
  ctx.strokeStyle = P(b, 0.3, 0.5); ctx.lineWidth = 0.8; ctx.stroke(bell);
}

// ---------- Turtle ----------
function turtle(ctx, res, pose, t, P) {
  const { a, b, pattern, effect, seed } = look(res);
  if (effect === 'halo') halo(ctx, 84, P, a);
  const ph = pose.swim;
  const row = Math.sin(ph);
  ctx.rotate(-pose.vy * 0.004 + Math.sin(ph) * 0.012);
  const skin = (l = 0, al = 1) => P(b, l, al);
  const flipper = (x, y, rot, len, wid) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    const f = new Path2D();
    f.moveTo(0, -wid * 0.45);
    f.bezierCurveTo(-len * 0.28, -wid * 0.7, -len * 0.82, -wid * 0.28, -len, wid * 0.6);
    f.bezierCurveTo(-len * 0.64, wid * 0.76, -len * 0.24, wid * 0.64, 0, wid * 0.45);
    f.closePath();
    const g = ctx.createLinearGradient(0, -wid, 0, wid);
    g.addColorStop(0, skin(-0.1)); g.addColorStop(1, skin(0.1));
    ctx.fillStyle = g; ctx.fill(f);
    ctx.fillStyle = P(a, -0.3, 0.34);
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(-len * (0.2 + i * 0.15), wid * (0.03 + i * 0.09), 2.2, 1.4, 0.3, 0, 6.283); ctx.fill(); }
    ctx.restore();
  };
  // Far-side flippers. A sea turtle's front flippers are long wings (2026-11-14); the snapping turtle keeps its short ones.
  const seaFlip = res.species !== 'alligator_snapping_turtle';
  // The far one beats with the near one, so it rises as the near one comes down.
  if (seaFlip) flipper(21, -4, 0.62 - row * 0.62, 46, 13); else flipper(23, -3, 2.0 - row * 0.5, 40, 14);
  flipper(-30, -2, 2.6 + row * 0.2, 19, 8);
  // Rear near flipper
  flipper(-37, 11, -0.28 - row * 0.22, 26, 11);

  // Neck and head
  const hb = Math.sin(ph * 0.5) * 1.2;
  const neck = new Path2D();
  neck.moveTo(31, -8); neck.quadraticCurveTo(45, -11 + hb, 54, -9 + hb); neck.lineTo(52, 8 + hb); neck.quadraticCurveTo(43, 9, 30, 9); neck.closePath();
  ctx.fillStyle = skin(-0.04); ctx.fill(neck);
  const hawk = res.species === 'hawksbill_turtle';
  const head = new Path2D();
  head.moveTo(48, -6 + hb);
  if (hawk) { head.bezierCurveTo(54, -14 + hb, 72, -12 + hb, 82, -3 + hb); head.quadraticCurveTo(84, 2 + hb, 80, 3 + hb); head.bezierCurveTo(72, 8 + hb, 64, 9 + hb, 56, 9 + hb); }
  else {
  head.bezierCurveTo(54, -15 + hb, 72, -14 + hb, 76, -2 + hb);
  head.bezierCurveTo(77, 4 + hb, 69, 10 + hb, 56, 9 + hb);
  }
  head.bezierCurveTo(50, 8 + hb, 47, 3 + hb, 48, -6 + hb);
  head.closePath();
  const hg = ctx.createLinearGradient(60, -14, 60, 10);
  hg.addColorStop(0, skin(-0.18)); hg.addColorStop(1, skin(0.2));
  ctx.fillStyle = hg; ctx.fill(head);
  ctx.save(); ctx.clip(head);
  ctx.fillStyle = P(a, -0.28, 0.34);
  for (const [x, y, s] of [[56, -8, 2.1], [62, -10, 1.7], [52, -2, 1.8], [59, -4, 1.4]]) { ctx.beginPath(); ctx.ellipse(x, y + hb, s * 1.2, s, 0, 0, 6.283); ctx.fill(); }
  ctx.restore();
  drawEye(ctx, 65.4, -5 + hb, P, 2, { iris: '#6b4a22' });
  ctx.strokeStyle = P(a, -0.5, 0.48); ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(75.5, 1.5 + hb); ctx.quadraticCurveTo(69, 4.8 + hb, 62, 4 + hb); ctx.stroke();

  // Plastron underside
  const under = new Path2D();
  under.moveTo(-47, 6); under.bezierCurveTo(-30, 25, 22, 25, 43, 6); under.closePath();
  ctx.fillStyle = skin(0.26); ctx.fill(under);

  // Shell. Redrawn 2026-11-14: a sea turtle's shell is low and streamlined, a teardrop seen from the side, not a tortoise's dome.
  // The scutes are in their real rows: five down the spine, four big ones on each side, and a fringe of small plates round the
  // edge. The alligator snapping turtle keeps its high, keeled shell.
  const snapper = res.species === 'alligator_snapping_turtle', dome = snapper ? 39 : 31;
  const shellTop = (x) => { const u = clamp((x + 54) / 100, 0, 1); return 6.5 - (dome + 6.5) * Math.pow(4 * u * (1 - u), 0.7) - (snapper ? 0 : (x - 46) * -0.02); };
  const shell = new Path2D();
  if (snapper) {
    shell.moveTo(-53, 7);
    shell.bezierCurveTo(-52, -19, -21, -40, 4, -39);
    shell.bezierCurveTo(26, -38, 44, -21, 46, 6);
  } else {
    shell.moveTo(-56, 6);
    shell.bezierCurveTo(-52, -12, -26, -31, 0, -31);
    shell.bezierCurveTo(24, -31, 41, -15, 46, 3);
  }
  shell.bezierCurveTo(23, 14, -28, 14, snapper ? -53 : -56, snapper ? 7 : 6);
  shell.closePath();
  const sg = ctx.createLinearGradient(0, -dome - 1, 0, 14);
  sg.addColorStop(0, P(a, 0.16)); sg.addColorStop(0.5, P(a, -0.02)); sg.addColorStop(1, P(a, -0.36));
  ctx.fillStyle = sg; ctx.fill(shell);
  ctx.save(); ctx.clip(shell);
  // Scutes keep the turtle reading as a turtle in every pattern: each a plate, lit from above, with a dark seam.
  const plate = (pts, i) => {
    const q = new Path2D();
    pts.forEach(([x, y], j) => (j ? q.lineTo(x, y) : q.moveTo(x, y))); q.closePath();
    const cx = pts.reduce((v, k) => v + k[0], 0) / pts.length, cy = pts.reduce((v, k) => v + k[1], 0) / pts.length;
    const g = ctx.createRadialGradient(cx - 2, cy - 4, 1, cx, cy, 20);
    g.addColorStop(0, P(a, 0.17, 0.72)); g.addColorStop(1, P(a, -0.18, 0.6));
    ctx.fillStyle = g; ctx.fill(q);
    ctx.strokeStyle = P(a, -0.56, 0.58); ctx.lineWidth = 1.05; ctx.stroke(q);
    if (pattern === 'rings' && i < 9) {
      ctx.strokeStyle = P(b, 0.15, 0.62); ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.ellipse(cx, cy, i < 4 ? 7 : 5.5, i < 4 ? 4.6 : 3, 0, 0, 6.283); ctx.stroke();
    }
  };
  // A row between two curves (as heights below the top of the shell, or fixed), cut at the given x's.
  const scuteRow = (cuts, yA, yB) => cuts.slice(0, -1).map((x0, i) => {
    const x1 = cuts[i + 1], top = [], bot = [];
    for (let k = 0; k <= 4; k++) { const x = lerp(x0, x1, k / 4); top.push([x, yA(x)]); bot.unshift([x, yB(x)]); }
    return [...top, ...bot];
  });
  const rim = (x) => 9 - Math.abs(x + 4) * 0.035, band = (x) => rim(x) - 6;
  const spine = (x) => shellTop(x) + 9 + Math.abs(x + 4) * 0.02;
  let n = 0;
  for (const pts of scuteRow([-56, -30, -8, 14, 48], spine, band)) plate(pts, n++);                       // four costals on the side
  for (const pts of scuteRow([-50, -32, -14, 4, 22, 40], (x) => shellTop(x) - 4, spine)) plate(pts, n++); // five vertebrals on the spine
  for (const pts of scuteRow([-58, -50, -42, -34, -26, -18, -10, -2, 6, 14, 22, 30, 38, 48], band, (x) => rim(x) + 4)) plate(pts, n++); // the edge
  // Hawksbill (Eretmochelys imbricata), 2026-11-15: its overlapping plates are tortoiseshell, amber streaked and flamed with dark brown.
  if (hawk) { const r = rng(seed + 31); for (let i = 0; i < 46; i++) { const x = lerp(-52, 42, r()), y = lerp(-30, 8, r()), l = 5 + r() * 7, q = -1.2 + r() * 2.4; ctx.strokeStyle = P(i % 3 ? '#3a2214' : '#f2c860', 0, i % 3 ? 0.62 : 0.5); ctx.lineWidth = i % 3 ? 1.8 : 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(q) * l * 0.5 + 1.5, y + Math.sin(q) * l * 0.5, x + Math.cos(q) * l, y + Math.sin(q) * l); ctx.stroke(); } }
  // Leatherback (Dermochelys coriacea): no hard plates, but a leathery shell with seven ridges running nose to tail,
  // dark and speckled with white. Alligator snapping turtle (Macrochelys temminckii): three rows of tall, pointed keels.
  if (res.species === 'leatherback_sea_turtle') {
    const lg = ctx.createLinearGradient(0, -dome - 1, 0, 14); lg.addColorStop(0, P(a, 0.1)); lg.addColorStop(1, P(a, -0.32)); ctx.fillStyle = lg; ctx.fillRect(-58, -42, 108, 58);
    ctx.strokeStyle = P(a, 0.2, 0.7); ctx.lineWidth = 1.6;
    for (let k = 0; k < 5; k++) { const y = -dome + 3 + k * dome * 0.26; ctx.beginPath(); ctx.moveTo(-54, 6 + k * 0.4); ctx.bezierCurveTo(-36, y + 4, 20, y + 2, 46, 6); ctx.stroke(); }
    const r = rng(seed + 9); ctx.fillStyle = P(b, 0.25, 0.85);
    for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(lerp(-48, 42, r()), lerp(-dome + 3, 8, r()), 0.5 + r() * 0.9, 0, 6.283); ctx.fill(); }
  }
  if (pattern === 'spots') {
    const r = rng(seed + 5);
    ctx.fillStyle = P(b, 0.24, 0.88);
    for (let i = 0; i < 22; i++) { ctx.beginPath(); ctx.arc(lerp(-48, 42, r()), lerp(-36, 10, r()), 1 + r() * 1.9, 0, 6.283); ctx.fill(); }
  } else if (pattern === 'gradient') {
    const g = ctx.createLinearGradient(44, 0, -50, 0);
    g.addColorStop(0, P(b, 0, 0)); g.addColorStop(1, P(b, 0, 0.82));
    ctx.fillStyle = g; ctx.fillRect(-54, -40, 102, 55);
  } else if (pattern === 'constellation') {
    constellation(ctx, seed, -44, 38, -34, 6, P, b);
  }
  const shine = ctx.createRadialGradient(-5, -dome + 6, 1, -5, -dome + 6, 28);
  shine.addColorStop(0, P('#ffffff', 0, 0.34)); shine.addColorStop(1, P('#ffffff', 0, 0));
  ctx.fillStyle = shine; ctx.fillRect(-54, -40, 102, 44);
  if (effect === 'shimmer') shimmer(ctx, t, -54, 48, -40, 14, P);
  ctx.restore();
  if (res.species === 'alligator_snapping_turtle') {
    ctx.fillStyle = P(a, -0.12); ctx.strokeStyle = P(a, -0.5, 0.6); ctx.lineWidth = 0.8;
    for (const [x0, x1, h] of [[-44, 36, 0], [-40, 30, 8], [-38, 28, 15]]) for (let x = x0; x <= x1; x += 13) {
      const top = -Math.sqrt(Math.max(0, 1 - ((x + 3) / 50) ** 2)) * 39 + h, tip = top - 7 + h * 0.2;
      ctx.beginPath(); ctx.moveTo(x - 4, top + 2); ctx.lineTo(x + 1, tip); ctx.lineTo(x + 5, top + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  // Front near flipper over the shell edge
  flipper(25, 9, -0.56 + row * 0.62, res.species === 'leatherback_sea_turtle' ? 68 : seaFlip ? 60 : 47, res.species === 'leatherback_sea_turtle' ? 17 : 15);
}

// ---------- Stingray ----------
// Redrawn 2026-11-13 (creature upgrades): a rounded disc with curved leading edges and rounded wing tips instead of a flat diamond,
// pelvic fins at the back, a real tail that is thick at the base and tapers to a whip, a raised ridge down the middle, domed eyes,
// faint mottling and a soft pale margin. Same size as before, seen from a little above.
// 15 Nov 2026: grey-brown on top as real stingrays are (the blue-grey disappeared into the water), darker and opaque, with a longer,
// thicker whip of a tail, smaller pelvic fins, darker mottling and only a faint pale edge, so it reads at phone size.
function stingray(ctx, res, pose, t, P) {
  const { a, b, pattern, effect, seed } = look(res);
  if (effect === 'halo') halo(ctx, 76, P, a);
  const whip = res.species === 'leopard_whipray';
  const ph = pose.swim;
  const far = Math.sin(ph) * 7, near = Math.sin(ph + 0.8) * 8;
  const midF = Math.sin(ph + 1.3) * 3.5, midN = Math.sin(ph + 2.1) * 4;
  const sq = 0.46; // the camera looks down on the ray
  // The tail: a tapering ribbon along a swimming wave, thick where it leaves the body.
  const tl = whip ? 130 : 108, w0 = whip ? 3.6 : 6.4, steps = 16;
  const tailAt = (k) => ({ x: -40 - k * tl, y: Math.sin(ph * 0.8 - k * 3.2) * (2 + k * 8), w: w0 * Math.pow(1 - k, 1.25) + 0.5 });
  const tail = new Path2D();
  for (let i = 0; i <= steps; i++) { const q = tailAt(i / steps); if (i) tail.lineTo(q.x, q.y - q.w / 2); else tail.moveTo(q.x, q.y - q.w / 2); }
  for (let i = steps; i >= 0; i--) { const q = tailAt(i / steps); tail.lineTo(q.x, q.y + q.w / 2); }
  tail.closePath();
  ctx.fillStyle = P(a, -0.3); ctx.fill(tail);
  ctx.strokeStyle = P(a, -0.42, 0.7); ctx.lineWidth = 0.7; ctx.stroke(tail);
  // The venomous barb, a third of the way down the tail.
  { const q = tailAt(0.3); ctx.strokeStyle = P('#e6dcc0', 0, 0.92); ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(q.x + 5, q.y - 0.5); ctx.lineTo(q.x - 12, q.y - 3); ctx.stroke();
    ctx.lineWidth = 0.6; for (let i = 0; i < 4; i++) { const x = q.x + 2 - i * 3.5, y = q.y - 0.9 - i * 0.55; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 1.4, y - 1.2); ctx.stroke(); } }
  // Pelvic fins: two small rounded lobes either side of the tail base, behind the disc.
  for (const s of [-1, 1]) { ctx.fillStyle = P(a, -0.14); ctx.beginPath(); ctx.moveTo(-32, s * 10 * sq); ctx.bezierCurveTo(-41, s * 22 * sq, -52, s * 20 * sq, -50, s * 6 * sq); ctx.quadraticCurveTo(-50, s * 1 * sq, -34, s * 2 * sq); ctx.closePath(); ctx.fill(); ctx.strokeStyle = P(b, 0.04, 0.45); ctx.lineWidth = 0.9; ctx.stroke(); }
  // The disc: a rounded snout, convex leading edges, rounded wing tips, and a rear margin curving in to the tail.
  const body = new Path2D();
  body.moveTo(56, 0);
  body.bezierCurveTo(55, -12 * sq + midF * 0.3, 42, -56 * sq + midF, 12, -73 * sq + far);
  body.bezierCurveTo(0, -79 * sq + far, -14, -76 * sq + far, -22, -60 * sq + far * 0.6);
  body.bezierCurveTo(-30, -44 * sq, -37, -24 * sq, -42, -9 * sq);
  body.quadraticCurveTo(-46, 0, -42, 9 * sq);
  body.bezierCurveTo(-37, 24 * sq, -30, 44 * sq, -22, 60 * sq + near * 0.6);
  body.bezierCurveTo(-14, 76 * sq + near, 0, 79 * sq + near, 12, 73 * sq + near);
  body.bezierCurveTo(42, 56 * sq + midN, 55, 12 * sq + midN * 0.3, 56, 0);
  body.closePath();
  const g = ctx.createRadialGradient(8, -6, 4, 0, 0, 74);
  g.addColorStop(0, P(a, 0.12));
  g.addColorStop(0.62, P(a, -0.02));
  g.addColorStop(1, P(a, -0.22));
  ctx.fillStyle = g; ctx.fill(body);
  ctx.save(); ctx.clip(body);
  // Faint mottling, so a plain ray isn't a flat sheet.
  { const r = rng(seed + 5); for (let i = 0; i < 26; i++) { const x = lerp(-34, 46, r()), y = lerp(-30, 30, r()); ctx.fillStyle = P(a, r() < 0.4 ? 0.14 : -0.26, 0.2); ctx.beginPath(); ctx.ellipse(x, y, 4 + r() * 6, 2.5 + r() * 3, r() * 3, 0, 6.283); ctx.fill(); } }
  // The paler margin round the disc, in the second colour: soft, not an outline.
  ctx.strokeStyle = P(b, 0, whip ? 0.32 : 0.12); ctx.lineWidth = 6; ctx.stroke(body); ctx.strokeStyle = P(b, 0.06, whip ? 0.55 : 0.22); ctx.lineWidth = 2.2; ctx.stroke(body);
  // Leopard whipray (Himantura leoparda): pale with dark leopard rosettes over the whole disc.
  if (whip) { const r = rng(seed + 77); for (let i = 0; i < 30; i++) { const x = lerp(-36, 44, r()), y = lerp(-30, 30, r()), rr = 2.2 + r() * 1.6, an = r() * 3; for (let j = 0; j < 5; j++) { const q = an + j * 1.26; ctx.fillStyle = P('#2a2018', 0, 0.85); ctx.beginPath(); ctx.ellipse(x + Math.cos(q) * rr, y + Math.sin(q) * rr * 0.85, 1.1, 0.9, q, 0, 6.283); ctx.fill(); } ctx.fillStyle = P(a, -0.12, 0.8); ctx.beginPath(); ctx.ellipse(x, y, rr * 0.55, rr * 0.45, 0, 0, 6.283); ctx.fill(); } }
  if (pattern === 'spots') {
    const r = rng(seed + 21);
    ctx.fillStyle = P(b, 0.1, 0.9);
    for (let i = 0; i < 26; i++) { const x = lerp(-34, 44, r()), y = lerp(-34, 34, r()); ctx.beginPath(); ctx.ellipse(x, y, 2 + r() * 2.2, 1.3 + r() * 1.3, 0, 0, 6.283); ctx.fill(); }
  } else if (pattern === 'stripes') {
    ctx.strokeStyle = P(b, 0.04, 0.72); ctx.lineWidth = 2.3;
    for (let i = -3; i <= 3; i++) { if (i === 0) continue; ctx.beginPath(); ctx.moveTo(30, i * 2); ctx.quadraticCurveTo(0, i * 8, -24, i * 13.5); ctx.stroke(); }
  } else if (pattern === 'gradient') {
    const gg = ctx.createRadialGradient(0, 0, 8, 0, 0, 60);
    gg.addColorStop(0, P(b, 0, 0)); gg.addColorStop(1, P(b, 0, 0.95));
    ctx.fillStyle = gg; ctx.fillRect(-60, -55, 120, 110);
  } else if (pattern === 'constellation') {
    constellation(ctx, seed, -36, 44, -34, 34, P, b);
  }
  // Lit far wing, shaded near wing.
  const lg = ctx.createLinearGradient(0, -40, 0, 40);
  lg.addColorStop(0, P('#ffffff', 0, 0.17)); lg.addColorStop(0.5, P('#ffffff', 0, 0)); lg.addColorStop(1, P('#03202c', 0, 0.3));
  ctx.fillStyle = lg; ctx.fillRect(-60, -50, 120, 100);
  // The raised middle of the body, from the head to the tail base: a lit ridge with a soft shadow below it.
  const rg = ctx.createLinearGradient(0, -11, 0, 11);
  rg.addColorStop(0, P(a, 0.24, 0.5)); rg.addColorStop(0.55, P(a, 0.08, 0.22)); rg.addColorStop(1, P(a, -0.3, 0.3));
  ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(44, -1); ctx.bezierCurveTo(30, -11, -10, -12, -40, -3); ctx.lineTo(-40, 3); ctx.bezierCurveTo(-10, 12, 30, 11, 44, 1); ctx.closePath(); ctx.fill();
  if (effect === 'shimmer') shimmer(ctx, t, -50, 56, -46, 46, P);
  ctx.restore();
  ctx.strokeStyle = P(a, -0.5, 0.7); ctx.lineWidth = 1; ctx.stroke(body);
  // Spiracles behind the eyes, which it breathes through while lying on the sand.
  for (const y of [-9.5, 7.5]) { ctx.fillStyle = P(a, -0.45, 0.8); ctx.beginPath(); ctx.ellipse(23, y, 2.6, 1.4, 0.2, 0, 6.283); ctx.fill(); }
  // Eyes on raised domes on top of the head.
  for (const y of [-7.5, 5.5]) {
    ctx.fillStyle = P(a, 0.16, 0.85); ctx.beginPath(); ctx.ellipse(30.4, y + 0.3, 3.4, 2.4, 0, 0, 6.283); ctx.fill();
    drawEye(ctx, 30.4, y, P, 2);
  }
}

// ---------- Starfish ----------
function starfish(ctx, res, pose, t, P) {
  const { a, b, pattern, effect, seed } = look(res);
  if (effect === 'halo') halo(ctx, 68, P, a);
  const sq = 0.64;
  const spin = (seed % 628) / 100;
  const R = 44, r0 = 13;
  ctx.scale(1, sq);
  const pts = [];
  const arms = [];
  for (let i = 0; i < 5; i++) {
    const th = spin + (i * 6.283) / 5;
    const curl = 1 + 0.035 * Math.sin(t * 0.4 + i * 1.7 + seed);
    const tip = R * curl;
    const sideA = th - 0.63, sideB = th + 0.63;
    pts.push([Math.cos(sideA) * r0, Math.sin(sideA) * r0]);
    pts.push([Math.cos(th - 0.2) * tip * 0.58, Math.sin(th - 0.2) * tip * 0.58]);
    pts.push([Math.cos(th) * tip * 1.07, Math.sin(th) * tip * 1.07]);
    pts.push([Math.cos(th) * tip * 1.07, Math.sin(th) * tip * 1.07]);
    pts.push([Math.cos(th + 0.2) * tip * 0.58, Math.sin(th + 0.2) * tip * 0.58]);
    pts.push([Math.cos(sideB) * r0, Math.sin(sideB) * r0]);
    arms.push({ th, tip });
  }
  const body = new Path2D();
  smoothPath(body, pts, true);
  // Contact thickness
  ctx.save(); ctx.translate(0, 4.5); ctx.fillStyle = P(a, -0.44, 0.9); ctx.fill(body); ctx.restore();
  const g = ctx.createRadialGradient(-2, -7, 3, 0, 0, 52);
  g.addColorStop(0, P(a, 0.22)); g.addColorStop(0.55, P(a, 0)); g.addColorStop(1, P(a, -0.12));
  ctx.fillStyle = g; ctx.fill(body);
  ctx.save(); ctx.clip(body);
  const r = rng(seed + 31);
  for (const { th, tip } of arms) {
    const c = Math.cos(th), s = Math.sin(th);
    ctx.strokeStyle = P(a, -0.28, 0.42); ctx.lineWidth = 2.1;
    ctx.beginPath(); ctx.moveTo(c * 4, s * 4); ctx.lineTo(c * tip, s * tip); ctx.stroke();
    for (let k = 0.18; k < 0.92; k += 0.1) { ctx.fillStyle = P(b, 0.05, 0.9); ctx.beginPath(); ctx.arc(c * tip * k, s * tip * k, 1.25 * (1 - k * 0.45), 0, 6.283); ctx.fill(); } // the row of knobs down each arm
    if (pattern === 'bands') {
      ctx.fillStyle = P(b, 0.02, 0.92);
      for (const k of [0.46, 0.67, 0.87]) {
        ctx.save(); ctx.translate(c * tip * k, s * tip * k); ctx.rotate(th);
        ctx.fillRect(-2, -13, 4.2, 26); ctx.restore();
      }
    }
    for (let k = 0.2; k < 0.95; k += 0.115) {
      const off = pattern === 'spots' ? 3.8 : 2.7;
      for (const side of [-1, 1]) {
        const x = c * tip * k - s * side * off * (1 - k * 0.55);
        const y = s * tip * k + c * side * off * (1 - k * 0.55);
        ctx.fillStyle = pattern === 'spots' ? P(b, 0.06, 0.96) : P(b, 0.1, 0.8);
        ctx.beginPath(); ctx.arc(x, y, (pattern === 'spots' ? 2 : 1.1) * (1 - k * 0.4), 0, 6.283); ctx.fill();
      }
    }
  }
  // The sieve plate every sea star has on its back, just off centre, ringed by small knobs.
  ctx.fillStyle = P(b, 0.05, 0.85); for (let i = 0; i < 10; i++) { const q = i * 0.628; ctx.beginPath(); ctx.arc(Math.cos(q) * 9, Math.sin(q) * 9, 0.9, 0, 6.283); ctx.fill(); }
  ctx.fillStyle = P(b, 0, 0.9); ctx.beginPath(); ctx.arc(5, -4, 1.8, 0, 6.283); ctx.fill();
  // The second colour also tips each arm, as many sea stars' paler arm tips do.
  for (const { th, tip } of arms) { const gt = ctx.createRadialGradient(Math.cos(th) * tip, Math.sin(th) * tip, 0, Math.cos(th) * tip, Math.sin(th) * tip, tip * 0.42); gt.addColorStop(0, P(b, 0, 0.85)); gt.addColorStop(1, P(b, 0, 0)); ctx.fillStyle = gt; ctx.fillRect(-50, -50, 100, 100); }
  if (pattern === 'spots') { ctx.fillStyle = P(b, 0.06, 0.9); for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(lerp(-10, 10, r()), lerp(-10, 10, r()), 1.5, 0, 6.283); ctx.fill(); } }
  if (pattern === 'gradient') {
    const gg = ctx.createRadialGradient(0, 0, 8, 0, 0, 44);
    gg.addColorStop(0, P(b, 0, 0)); gg.addColorStop(1, P(b, 0, 0.95));
    ctx.fillStyle = gg; ctx.fillRect(-50, -50, 100, 100);
  } else if (pattern === 'constellation') constellation(ctx, seed, -36, 36, -36, 36, P, b);
  const hi = ctx.createRadialGradient(-3, -8, 0, -3, -8, 22);
  hi.addColorStop(0, P('#ffffff', 0, 0.27)); hi.addColorStop(1, P('#ffffff', 0, 0));
  ctx.fillStyle = hi; ctx.fillRect(-30, -32, 56, 54);
  if (effect === 'shimmer') shimmer(ctx, t, -48, 48, -48, 48, P);
  ctx.restore();
}

// ---------- Dolphin ----------
function dolphin(ctx, res, pose, t, P) {
  const { a, b, pattern, effect, seed } = look(res);
  // Streamlined adult proportions rather than a round, juvenile silhouette.
  ctx.scale(1, 0.76);
  if (effect === 'halo') halo(ctx, 92, P, a);
  const sw = pose.swim;
  // Dolphins pump their tails up and down, so the wave shows clearly from the side.
  const amp = 4.6 + clamp(pose.speed / 45) * 3.2;
  const bend = (x) => { const s = clamp((30 - x) / 92); return Math.sin(sw - s * 1.9) * amp * s * s; };
  ctx.rotate(clamp(-pose.vy * 0.007, -0.32, 0.32) + Math.sin(sw * 0.5) * 0.012);
  const pt = (x, y) => [x, y + bend(x)];
  followBend(bend, 0.76);

  // Far flipper, in shadow behind the body
  ctx.save();
  ctx.translate(25, 10 + bend(25)); ctx.rotate(0.3 + Math.sin(sw) * 0.1);
  const farFlip = new Path2D();
  farFlip.moveTo(5, -4); farFlip.bezierCurveTo(-5, 4, -15, 15, -29, 22); farFlip.bezierCurveTo(-18, 22, -3, 15, 6, 5); farFlip.closePath();
  ctx.fillStyle = P(a, -0.42, 0.9); ctx.fill(farFlip);
  ctx.restore();

  // Flukes: horizontal in life, so seen as a flattened crescent from a slightly raised camera.
  const tailX = -60;
  ctx.save();
  ctx.translate(tailX, bend(tailX));
  ctx.rotate(Math.cos(sw - 1.9) * 0.48);
  const fluke = new Path2D();
  fluke.moveTo(4, -2.4);
  fluke.bezierCurveTo(-5, -5, -14, -10, -27, -15);
  fluke.bezierCurveTo(-24, -8, -20, -3, -15, 0.5);
  fluke.bezierCurveTo(-19, 5, -21, 11, -20, 19);
  fluke.bezierCurveTo(-11, 13, -3, 7, 4, 2.4);
  fluke.closePath();
  const fg = ctx.createLinearGradient(0, -15, 0, 19);
  fg.addColorStop(0, P(a, -0.2)); fg.addColorStop(1, P(a, -0.44));
  ctx.fillStyle = fg; ctx.fill(fluke);
  ctx.restore();

  // Dorsal fin, swept back with a hooked tip
  const dorsal = new Path2D();
  const dA = pt(14, -25), dB = pt(-15, -21);
  dorsal.moveTo(dA[0], dA[1] + 3);
  dorsal.bezierCurveTo(6, -32 + bend(4), -5, -40 + bend(-5), -17, -44 + bend(-8));
  // Bottlenose dolphins are told apart by the nicks in the trailing edge of the dorsal fin: each resident has its own
  // (render/variation.js). Variant 0 is the clean fin it always had.
  const nv = variantOf(res);
  if (!nv) dorsal.bezierCurveTo(-12, -37 + bend(-11), -11, -28 + bend(-12), dB[0], dB[1] + 3);
  else {
    const c0 = [-17, -44 + bend(-8)], c1 = [-12, -37 + bend(-11)], c2 = [-11, -28 + bend(-12)], c3 = [dB[0], dB[1] + 3];
    const nicks = [[], [0.35], [0.25, 0.6], [0.5], [0.7], [0.2, 0.45, 0.7]][nv];
    for (let i = 1; i <= 40; i++) {
      const u = i / 40, m = 1 - u, w = [m * m * m, 3 * m * m * u, 3 * m * u * u, u * u * u];
      let x = w[0] * c0[0] + w[1] * c1[0] + w[2] * c2[0] + w[3] * c3[0], y = w[0] * c0[1] + w[1] * c1[1] + w[2] * c2[1] + w[3] * c3[1];
      const n = nicks.find((q) => Math.abs(q - u) < 0.05);
      if (n !== undefined) { const k = 1 - Math.abs(n - u) / 0.05; x += 4.2 * k; y += 0.6 * k; }
      dorsal.lineTo(x, y);
    }
  }
  dorsal.closePath();
  const dfg = ctx.createLinearGradient(0, -44, 0, -20);
  dfg.addColorStop(0, P(a, -0.1)); dfg.addColorStop(1, P(a, -0.34));
  ctx.fillStyle = dfg; ctx.fill(dorsal);

  // Body: a short, stout beak, a round melon, a deep chest and a long tail stock (beak shortened and the melon rounded 2026-11-14:
  // a bottlenose's beak is short, about a twentieth of its length).
  const top = [[65.5, 3.2], [64, 0.4], [59, -1.4], [54.5, -3.2], [52, -10], [46, -18.5], [32, -24.5], [10, -27], [-14, -22], [-36, -12.5], [-52, -6], [-62, -3]];
  const bot = [[-62, 3], [-52, 5.5], [-36, 11.5], [-14, 19], [10, 23.5], [31, 21], [46, 14], [55, 10.5], [62, 9.4], [66, 6.6]];
  const body = new Path2D();
  smoothPath(body, [...top, ...bot].map(([x, y]) => pt(x, y)), true);
  const bg = ctx.createLinearGradient(0, -28, 0, 24);
  bg.addColorStop(0, P(a, -0.26)); bg.addColorStop(0.4, P(a, -0.04)); bg.addColorStop(1, P(a, 0.1));
  ctx.fillStyle = bg; ctx.fill(body);

  ctx.save();
  ctx.clip(body);
  // Pale belly with a soft waterline along the flank
  const belly = new Path2D();
  const line = [[72, 4.4], [60, 5], [47, 4], [32, 7], [14, 10.5], [-8, 11], [-30, 6.5], [-52, 3.5], [-68, 2.5]].map(([x, y]) => pt(x, y));
  belly.moveTo(line[0][0], line[0][1]);
  for (let i = 1; i < line.length - 1; i++) {
    const q = line[i], n = line[i + 1];
    belly.quadraticCurveTo(q[0], q[1], (q[0] + n[0]) / 2, (q[1] + n[1]) / 2);
  }
  belly.lineTo(-70, 30); belly.lineTo(78, 30); belly.closePath();
  const pg = ctx.createLinearGradient(0, 3, 0, 18);
  pg.addColorStop(0, P(b, -0.08, 0.62)); pg.addColorStop(0.6, P(b, 0, 0.96)); pg.addColorStop(1, P(b, 0.12, 1));
  ctx.fillStyle = pg; ctx.fill(belly);

  if (pattern === 'spots') {
    const r = rng(seed + 41);
    for (let i = 0; i < 34; i++) {
      const x = lerp(-48, 46, r()), y = lerp(-24, 16, r());
      ctx.fillStyle = y < 6 ? P(b, 0.05, 0.75) : P(a, -0.15, 0.55);
      ctx.beginPath(); ctx.ellipse(x, y + bend(x), 0.9 + r() * 1.3, 0.8 + r() * 1, 0, 0, 6.283); ctx.fill();
    }
  } else if (pattern === 'stripes') {
    // A striped dolphin's markings: an eye line, and a pale blaze sweeping back along the flank.
    ctx.strokeStyle = P(a, -0.42, 0.85); ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(42, -1 + bend(42)); ctx.quadraticCurveTo(16, 9 + bend(16), -18, 7.5 + bend(-18)); ctx.lineTo(-44, 3 + bend(-44)); ctx.stroke();
    ctx.strokeStyle = P(b, 0.02, 0.8); ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(18, -10 + bend(18)); ctx.quadraticCurveTo(-6, -12 + bend(-6), -38, -2 + bend(-38)); ctx.stroke();
  } else if (pattern === 'gradient') {
    const g = ctx.createLinearGradient(50, 0, -62, 0);
    g.addColorStop(0, P(b, 0, 0)); g.addColorStop(1, P(b, 0, 0.92));
    ctx.fillStyle = g; ctx.fillRect(-70, -28, 145, 56);
  } else if (pattern === 'constellation') {
    constellation(ctx, seed, -44, 44, -22, 6, P, b);
  }
  // A darker cape along the back, from the melon to behind the dorsal fin, as bottlenose dolphins have (2026-11-14)
  const capeY = [[50, -12], [36, -12], [16, -11], [-6, -9], [-26, -6], [-46, -4], [-66, -3]];
  const cape = new Path2D(); cape.moveTo(54, -30 + bend(54));
  capeY.forEach(([x, y]) => cape.lineTo(x, y + bend(x))); cape.lineTo(-70, -30); cape.closePath();
  const cg = ctx.createLinearGradient(0, -24, 0, -6);
  cg.addColorStop(0, P(a, -0.2, 0.5)); cg.addColorStop(0.75, P(a, -0.2, 0.3)); cg.addColorStop(1, P(a, -0.2, 0));
  ctx.fillStyle = cg; ctx.fill(cape);
  // Sunlit back, which keeps the body round
  const sun = ctx.createLinearGradient(0, -28, 0, -10);
  sun.addColorStop(0, P('#ffffff', 0, 0.3)); sun.addColorStop(1, P('#ffffff', 0, 0));
  ctx.fillStyle = sun; ctx.fillRect(-70, -30, 145, 22);
  const under = ctx.createLinearGradient(0, 12, 0, 24);
  under.addColorStop(0, P('#04202e', 0, 0)); under.addColorStop(1, P('#04202e', 0, 0.16));
  ctx.fillStyle = under; ctx.fillRect(-70, 12, 145, 14);
  // Fine tooth-rake scars along the flank, as real dolphins carry.
  ctx.strokeStyle = P(b, 0.1, 0.13); ctx.lineWidth = 0.5; ctx.beginPath();
  const rake = rng(seed + 61);
  for (let i = 0; i < 7; i++) { const x = -34 + rake() * 62, y = -16 + rake() * 18; for (let j = 0; j < 3; j++) { ctx.moveTo(x + j * 1.7, y + bend(x)); ctx.lineTo(x + j * 1.7 - 5, y + 6 + bend(x - 5)); } }
  ctx.stroke();
  if (effect === 'shimmer') shimmer(ctx, t, -62, 74, -26, 22, P);
  ctx.restore();

  // Near flipper, sculling gently, held out below the chest (2026-11-14: it used to lie flat against the belly)
  ctx.save();
  ctx.translate(23, 10 + bend(23)); ctx.rotate(-0.04 + Math.sin(sw) * 0.13);
  const flip = new Path2D();
  flip.moveTo(6, -4.5); flip.bezierCurveTo(-4, 3, -14, 15, -31, 22); flip.bezierCurveTo(-18, 24, -2, 17, 8, 5); flip.closePath();
  const fl = ctx.createLinearGradient(0, -4, 0, 22);
  fl.addColorStop(0, P(a, -0.08)); fl.addColorStop(1, P(a, -0.34));
  ctx.fillStyle = fl; ctx.fill(flip);
  ctx.restore();

  // Mouth, a small eye and the blowhole
  const b45 = bend(45);
  ctx.strokeStyle = P(a, -0.56, 0.72); ctx.lineWidth = 0.95; ctx.lineCap = 'round';
  // The mouth line turns up at its corner, the dolphin's "smile".
  ctx.beginPath(); ctx.moveTo(65.2, 4.8 + bend(65)); ctx.quadraticCurveTo(56, 6.4 + bend(56), 48.5, 4.2 + bend(48)); ctx.quadraticCurveTo(46, 3.4 + b45, 45, 1.6 + b45); ctx.stroke();
  ctx.strokeStyle = P(a, -0.35, 0.5); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(51, -8 + bend(51)); ctx.quadraticCurveTo(48.5, -2 + bend(48), 50.5, 2.6 + bend(50)); ctx.stroke(); // where the melon meets the beak
  drawEye(ctx, 40, -3.4 + bend(40), P, 1.4, { iris: '#3a2a1c' });
  ctx.strokeStyle = P(a, -0.5, 0.5); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(32, -23.2 + bend(32)); ctx.lineTo(28.5, -23.8 + bend(28)); ctx.stroke();
}

// Separate anatomies: a long rorqual with a flat rostrum, and a powerful fossil shark.
// The megalodon is an artistic reconstruction; anatomy and size estimates are uncertain.
function blueWhale(ctx, res, pose, t, P, low = false) {
  const { a, b, pattern, effect, seed } = look(res);
  const sw = pose.swim;
  // A wave that travels to the flukes, biggest at the tail.
  const bend = x => { const s = clamp((70 - x) / 220); return s * s * Math.sin(sw - s * 2.4) * 11 * (pose.effort ?? 1); };
  followBend(bend);
  const path = points => { const p = new Path2D(); smoothPath(p, points.map(([x,y]) => [x,y+bend(x)]), true); return p; };
  const fill = (p,col) => { ctx.fillStyle=col; ctx.fill(p); };
  ctx.rotate(clamp(-pose.vy * 0.004, -0.12, 0.12));
  if (!low && effect === 'halo') halo(ctx, 175, P, a);
  // Slim far flipper and very small dorsal fin in the rear third.
  fill(path([[78,14],[34,38],[44,23],[68,10]]),P(a,-0.45));
  fill(path([[-70,-14],[-89,-28],[-93,-18],[-107,-9]]),P(a,-0.18));
  ctx.save(); ctx.translate(-137,bend(-137)); ctx.rotate(Math.cos(sw-2.4)*0.26);
  const flukes = new Path2D();
  flukes.moveTo(5,-2); flukes.bezierCurveTo(-7,-10,-19,-23,-31,-28);
  flukes.quadraticCurveTo(-26,-11,-15,0); flukes.quadraticCurveTo(-26,10,-31,26);
  flukes.bezierCurveTo(-15,21,-5,9,5,3); flukes.closePath();
  fill(flukes,P(a,-0.1));
  ctx.strokeStyle=P(b,0,0.35);ctx.lineWidth=0.7;ctx.stroke(flukes);ctx.restore();
  // Flat, broad rostrum: no round melon or humpback-like bulbous forehead.
  const body=path([[165,-9],[160,-14],[137,-17],[107,-19],[73,-24],[28,-27],[-19,-25],[-62,-19],[-101,-10],[-139,-3],[-140,3],[-102,7],[-67,16],[-20,26],[30,31],[79,29],[119,23],[151,13],[166,3]]);
  const g=ctx.createLinearGradient(0,-29,0,34);
  g.addColorStop(0,P(a,0.18));g.addColorStop(0.32,P(a,0.02));g.addColorStop(0.75,P(a,-0.12));g.addColorStop(1,P(a,-0.3));fill(body,g);
  ctx.save();ctx.clip(body);
  // Pale throat, kept blue-grey rather than a white cartoon belly.
  const belly=path([[171,4],[142,8],[105,12],[63,14],[13,13],[-42,10],[-110,3],[-150,4],[-150,45],[175,45]]);
  const bg=ctx.createLinearGradient(0,6,0,30);bg.addColorStop(0,P(b,-0.06,0.55));bg.addColorStop(1,P(b,-0.08,0.95));fill(belly,bg);
  if(!low){
    const r=rng(seed+107);
    for(let i=0;i<150;i++){
      const x=-113+r()*268,y=-26+r()*56;
      ctx.fillStyle=P(i%3?a:b,i%3?0.23:0,pattern==='spots'?0.48:0.32);
      ctx.beginPath();ctx.ellipse(x,y+bend(x),1+r()*4,0.4+r()*1.1,-0.12,0,Math.PI*2);ctx.fill();
    }
    // Fine ventral grooves sweep back from the lower jaw, not rings around the body.
    // Large pale and dark blotches, the mottling blue whales are named for.
    const blotch=rng(seed+211);
    for(let i=0;i<46;i++){const x=-118+blotch()*270,y=-24+blotch()*28;ctx.fillStyle=P(i%2?b:a,i%2?0.2:-0.26,0.26);ctx.beginPath();ctx.ellipse(x,y+bend(x),3+blotch()*9,1+blotch()*2.4,-0.1+blotch()*0.2,0,Math.PI*2);ctx.fill();}
    ctx.lineWidth=0.6;ctx.strokeStyle=P(a,-0.45,0.72);
    for(let i=0;i<10;i++){
      const x3=2-i*3;ctx.beginPath();ctx.moveTo(161-i*1.2,6+i*0.55+bend(161));
      ctx.bezierCurveTo(122,15+i*1.6+bend(122),66,15+i*1.8+bend(66),x3,16+i*1.0+bend(x3));ctx.stroke();
    }
    const sun=ctx.createLinearGradient(0,-28,0,-7);sun.addColorStop(0,P('#b6e6ef',0,0.45));sun.addColorStop(1,P('#b6e6ef',0,0));ctx.fillStyle=sun;ctx.fillRect(-150,-30,330,30);
    giantPattern(ctx,pattern,effect,seed,t,P,a,b,-145,170,-28,34);
  }
  ctx.restore();
  ctx.strokeStyle=P(a,-0.5,0.55);ctx.lineWidth=1;ctx.stroke(body); // a darker edge, so the long body stands out from the water (15 Nov 2026)
  ctx.save();ctx.translate(73,17+bend(73));ctx.rotate(Math.sin(sw)*0.1);
  const flipper=new Path2D();flipper.moveTo(11,-3);flipper.bezierCurveTo(-5,6,-33,27,-54,35);flipper.bezierCurveTo(-39,37,-15,23,9,5);flipper.closePath();
  const fg=ctx.createLinearGradient(0,-2,-30,33);fg.addColorStop(0,P(a,0.05));fg.addColorStop(1,P(a,-0.4));fill(flipper,fg);ctx.restore();
  if(low)return;
  // Long upper-jaw line and paired blowholes behind the head's central ridge.
  ctx.strokeStyle=P(a,-0.58,0.8);ctx.lineWidth=0.85;ctx.beginPath();ctx.moveTo(164,2);ctx.bezierCurveTo(145,3,126,8,107,9);ctx.stroke();
  ctx.strokeStyle=P(b,0.13,0.35);ctx.beginPath();ctx.moveTo(162,-12);ctx.lineTo(111,-17);ctx.stroke();
  ctx.fillStyle=P('#12313f');for(const y of [-20,-18]){ctx.beginPath();ctx.ellipse(101,y,3.5,0.7,-0.1,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle=P(a,-0.3,0.7);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(113,-17.4);ctx.quadraticCurveTo(110,-19.4,106,-18.6);ctx.stroke(); // the splash guard in front of the blowholes
  drawEye(ctx, 125, 6, P, 1.05, { iris: '#3a2a1c' });
}
function giantPattern(ctx,pattern,effect,seed,t,P,a,b,x0,x1,y0,y1){
  if(pattern==='gradient'){const g=ctx.createLinearGradient(x0,0,x1,0);g.addColorStop(0,P(b,0,0.7));g.addColorStop(1,P(b,0,0));ctx.fillStyle=g;ctx.fillRect(x0,y0,x1-x0,y1-y0);}
  if(pattern==='constellation')constellation(ctx,seed,x0+20,x1-20,y0+5,y1-10,P,b);
  if(effect==='shimmer')shimmer(ctx,t,x0,x1,y0,y1,P);
}
function megalodon(ctx,res,pose,t,P,low=false){
  const {a,b,pattern,effect,seed}=look(res),sw=pose.swim;
  // A shark's tail sweeps side to side: a small rise and fall from this camera, and the tail narrowing as it swings.
  const bend=x=>{const s=clamp((30-x)/135);return s*s*Math.sin(sw-s*5.65)*4.5*(pose.effort??1);};
  followBend(bend);
  const path=points=>{const p=new Path2D();smoothPath(p,points.map(([x,y])=>[x,y+bend(x)]),true);return p;};
  const fill=(p,col)=>{ctx.fillStyle=col;ctx.fill(p);};
  ctx.rotate(clamp(-pose.vy*0.004,-0.13,0.13));
  if(!low&&effect==='halo')halo(ctx,145,P,a);
  fill(path([[38,10],[-9,41],[9,17]]),P(a,-0.6));
  // Sharp fin contours retain the apex-predator silhouette, even at low detail.
  const dorsal=new Path2D();dorsal.moveTo(20,-24+bend(20));dorsal.quadraticCurveTo(4,-48+bend(4),-12,-63+bend(-12));dorsal.quadraticCurveTo(-15,-39+bend(-15),-28,-23+bend(-28));dorsal.closePath();fill(dorsal,P(a,-0.18));
  ctx.save();ctx.translate(-95,bend(-95));ctx.scale(0.8+Math.cos(sw-5.65)*0.2,1);
  const tail=new Path2D();tail.moveTo(6,-4);tail.bezierCurveTo(-7,-10,-17,-39,-29,-57);tail.quadraticCurveTo(-30,-22,-15,-2);tail.quadraticCurveTo(-20,17,-30,35);tail.quadraticCurveTo(-10,25,6,4);tail.closePath();fill(tail,P(a,-0.17));ctx.restore();
  const body=path([[115,-1],[106,-9],[85,-19],[54,-27],[15,-30],[-25,-25],[-59,-14],[-82,-6],[-99,-3],[-100,3],[-76,8],[-46,18],[-7,29],[35,32],[68,29],[95,20],[112,10]]);
  const g=ctx.createLinearGradient(0,-31,0,33);g.addColorStop(0,P(a,-0.2));g.addColorStop(0.32,P(a,0.08));g.addColorStop(0.65,P(a,-0.2));g.addColorStop(1,P(a,-0.4));fill(body,g);
  ctx.save();ctx.clip(body);
  fill(path([[118,6],[85,10],[53,12],[23,17],[-14,14],[-53,7],[-102,2],[-110,45],[120,45]]),P(b,-0.04));
  if(!low){
    const sun=ctx.createLinearGradient(0,-30,0,-14);sun.addColorStop(0,P('#c4e3e2',0,0.3));sun.addColorStop(1,P('#c4e3e2',0,0));ctx.fillStyle=sun;ctx.fillRect(-100,-31,220,24);
    // Rows of tiny scales, a lateral line and the sensory pores on the snout.
    ctx.strokeStyle=P(a,-0.4,0.2);ctx.lineWidth=0.45;ctx.beginPath();
    for(let row=0;row<11;row++)for(let x=-92+(row%2)*4;x<112;x+=8){const y=-29+row*5.4;ctx.moveTo(x,y+bend(x));ctx.lineTo(x+2.8,y+0.5+bend(x+2.8));}
    ctx.stroke();
    ctx.strokeStyle=P(b,0.1,0.3);ctx.lineWidth=0.55;ctx.beginPath();ctx.moveTo(40,-9+bend(40));ctx.quadraticCurveTo(-30,-13+bend(-30),-96,bend(-96));ctx.stroke();
    ctx.fillStyle=P(a,-0.62,0.65);for(let i=0;i<20;i++){const x=90+(i%5)*4+(i%2),y=-14+Math.floor(i/5)*3.4+((i*7)%3)*0.4;ctx.beginPath();ctx.ellipse(x,y,0.45,0.35,0,0,Math.PI*2);ctx.fill();}
    const r=rng(seed+13);for(let i=0;i<48;i++){ctx.fillStyle=P(b,0,pattern==='spots'?0.36:0.07);const sx=-75+r()*155,sy=-24+r()*43;ctx.beginPath();ctx.ellipse(sx,sy+bend(sx),0.5+r()*1.7,0.35+r()*0.6,0,0,Math.PI*2);ctx.fill();}
    // Subtle healed scratches distinguish residents without changing their requested colours.
    ctx.strokeStyle=P(b,-0.1,0.35);ctx.lineWidth=0.8;const sx=-12+(seed%29);
    for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(sx+i*4,-15+bend(sx+i*4));ctx.lineTo(sx-8+i*4,-2+bend(sx-8+i*4));ctx.stroke();}
    giantPattern(ctx,pattern,effect,seed,t,P,a,b,-100,117,-30,34);
  }
  ctx.restore();
  const fin=new Path2D();fin.moveTo(38,12+bend(38));fin.bezierCurveTo(21,32+bend(21),0,50+bend(0),-26,59+bend(-26));fin.quadraticCurveTo(-9,34+bend(-9),8,18+bend(8));fin.closePath();
  const fg=ctx.createLinearGradient(30,10,-24,59);fg.addColorStop(0,P(a,-0.1));fg.addColorStop(1,P(a,-0.65));fill(fin,fg);
  // A slightly open jaw reveals large interlocking triangular teeth, with no gore.
  const jaw=new Path2D();jaw.moveTo(113,5);jaw.bezierCurveTo(100,7,81,6,63,8);jaw.bezierCurveTo(68,23,84,28,101,16);jaw.quadraticCurveTo(109,11,113,5);fill(jaw,P('#08151f',-0.05));
  if(low)return;
  ctx.save();ctx.clip(jaw);
  ctx.fillStyle=P('#263038');ctx.beginPath();ctx.ellipse(89,23,23,7,-0.1,0,Math.PI*2);ctx.fill();
  teeth(ctx,P,{x0:65,y0:7.4,x1:109,y1:5.6},{type:'triangle',size:4.6,color:'#ebe8d6',gum:false});
  teeth(ctx,P,{x0:73,y0:21,x1:102,y1:16.5,bend:2,upper:false},{type:'triangle',size:3.6,color:'#ebe8d6',gum:false});
  ctx.restore();ctx.strokeStyle=P(a,-0.65,0.8);ctx.lineWidth=0.8;ctx.stroke(jaw);
  // Deep gills, a small dark eye and its orbital ridge provide menace without human eyebrows.
  ctx.strokeStyle=P(a,-0.7,0.9);ctx.lineWidth=1.8;ctx.lineCap='round';
  for(let i=0;i<5;i++){const x=39+i*4;ctx.beginPath();ctx.moveTo(x,-10-i*0.25);ctx.quadraticCurveTo(x-4,0,x-1,12-i*0.4);ctx.stroke();}
  drawEye(ctx, 85, -5, P, 2.3, { iris: '#2a3236' });
  ctx.strokeStyle=P(a,-0.58);ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(80,-8);ctx.quadraticCurveTo(85,-9,91,-7);ctx.stroke();
  ctx.fillStyle=P(a,-0.5);ctx.beginPath();ctx.ellipse(104,-2,1.6,0.7,-0.1,0,Math.PI*2);ctx.fill();
}

// Mythical sea serpent, rendered with plausible aquatic materials and eel-like propulsion.
// Its 32 m design length is fictional, not a biological claim.
function leviathan(ctx, res, pose, t, P, low = false) {
  const {a,b,pattern,effect,seed}=look(res),sw=pose.swim;
  const mid=x=>Math.sin(sw-(135-x)*0.021)*Math.pow(clamp((145-x)/345),0.75)*22;
  const half=x=>4+33*Math.pow(clamp((x+202)/335),0.6);
  followBend(mid);
  const path=pts=>{const p=new Path2D();smoothPath(p,pts.map(([x,y])=>[x,y+mid(x)]),true);return p;};
  const fill=(p,c)=>{ctx.fillStyle=c;ctx.fill(p);};
  ctx.rotate(clamp(-pose.vy*0.004,-0.12,0.12));
  if(!low&&effect==='halo')halo(ctx,220,P,a);
  // Continuous low sail, tapering towards the tail instead of terrestrial dragon wings.
  const finTop=[],finBottom=[];
  for(let x=-197;x<=98;x+=10){const h=half(x);finTop.push([x,-h-6-14*Math.pow(Math.sin((x+197)/295*Math.PI),2)]);finBottom.unshift([x,-h+3]);}
  fill(path([...finTop,...finBottom]),P(a,0.1,0.72));
  if(!low){ctx.strokeStyle=P(a,-0.25,0.35);ctx.lineWidth=0.5;ctx.beginPath();for(let x=-187;x<=92;x+=7){const h=half(x),tip=-h-6-14*Math.pow(Math.sin((x+197)/295*Math.PI),2);ctx.moveTo(x,-h+mid(x));ctx.lineTo(x-3,tip+1+mid(x-3));}ctx.stroke();}
  // Paired, streamlined steering fins, the far fin behind the body.
  fill(path([[103,14],[64,52],[47,55],[77,17]]),P(a,-0.5));
  const tail=new Path2D();tail.moveTo(-183,mid(-183)-6);tail.quadraticCurveTo(-207,mid(-200)-18,-232,mid(-212)-31);tail.quadraticCurveTo(-219,mid(-210)-2,-229,mid(-212)+24);tail.quadraticCurveTo(-203,mid(-200)+12,-184,mid(-183)+5);tail.closePath();fill(tail,P(a,-0.2));
  const top=[],bottom=[];
  for(let x=-199;x<=127;x+=9){top.push([x,-half(x)]);bottom.unshift([x,half(x)*0.74]);}
  // A broad, tapered predatory head and long muscular trunk.
  const body=path([...top,[146,-31],[162,-24],[177,-14],[186,-5],[181,4],[166,11],[144,20],[124,25],...bottom]);
  const g=ctx.createLinearGradient(0,-35,0,40);g.addColorStop(0,P(a,0.15));g.addColorStop(0.34,P(a));g.addColorStop(0.65,P(a,-0.25));g.addColorStop(1,P(a,-0.45));fill(body,g);
  ctx.save();ctx.clip(body);
  const bellyTop=[];for(let x=-205;x<=180;x+=10)bellyTop.push([x,half(x)*0.35]);
  fill(path([...bellyTop,[190,65],[-220,65]]),P(b,-0.12,0.7));
  if(!low){
    // Small overlapping scutes with restrained highlights, locked to the moving body.
    const r=rng(seed+331);
    for(let row=0;row<12;row++)for(let x=-175+(row%2)*2.5;x<139;x+=5){
      const y=-half(x)+4+row*3.5;if(y>half(x)*0.75)continue;
      ctx.strokeStyle=P(row<3?b:a,row<3?0.12:-0.45,0.1+r()*0.12);ctx.lineWidth=0.55;
      ctx.beginPath();ctx.moveTo(x-2,y+mid(x));ctx.quadraticCurveTo(x,y+1.8+mid(x),x+2.5,y+mid(x));ctx.stroke();
    }
    // Segmented throat plates read as flexible skin, not armour bolted on.
    ctx.strokeStyle=P(a,-0.4,0.5);ctx.lineWidth=0.7;
    for(let x=-105;x<140;x+=9){ctx.beginPath();ctx.moveTo(x,half(x)*0.4+mid(x));ctx.quadraticCurveTo(x-5,half(x)*0.65+mid(x),x-6,half(x)*0.8+mid(x));ctx.stroke();}
    // Dark saddles across the back, fading down the flank.
    for(let x=-168;x<110;x+=34){const wd=14;fill(path([[x,-half(x)-2],[x+wd,-half(x+wd)-2],[x+wd-5,half(x)*0.05],[x-5,half(x)*0.05]]),P(a,-0.5,0.26));}
    if(pattern==='spots'){const r=rng(seed);for(let i=0;i<65;i++){const x=-155+r()*290,y=-half(x)+r()*half(x)*1.5;ctx.fillStyle=P(b,0,0.4);ctx.beginPath();ctx.ellipse(x,y+mid(x),1.5+r()*3,0.7+r(),0,0,Math.PI*2);ctx.fill();}}
    giantPattern(ctx,pattern,effect,seed,t,P,a,b,-215,186,-55,60);
    const light=ctx.createLinearGradient(0,-34,0,-10);light.addColorStop(0,P('#a1d6ca',0,0.3));light.addColorStop(1,P('#a1d6ca',0,0));ctx.fillStyle=light;ctx.fillRect(-210,-55,410,47);
  }
  ctx.restore();
  // Small swept crest follows the head; no oversized horns or glowing eyes.
  // Swept-back horns along the skull, sharp at the tip, rooted in the body.
  for(const [x0,x1,tx,ty,k] of [[150,116,98,-60,-0.25],[112,88,72,-58,-0.32],[80,58,44,-55,-0.38]]){const yb=x=>-half(Math.min(x,127))+3+mid(x),h=new Path2D();
    h.moveTo(x0,yb(x0)+(x0>127?2:0));h.quadraticCurveTo((x0+tx)/2+6,(yb(x0)+ty+mid(tx))/2-4,tx,ty+mid(tx));h.quadraticCurveTo((x1+tx)/2+4,(yb(x1)+ty+mid(tx))/2+3,x1,yb(x1));h.closePath();fill(h,P(a,k));}
  ctx.save();ctx.translate(97,13+mid(97));ctx.rotate(Math.sin(sw)*0.08);ctx.scale(1.2,1.2);
  const flipper=new Path2D();flipper.moveTo(11,-3);flipper.bezierCurveTo(0,13,-25,36,-45,41);flipper.quadraticCurveTo(-33,20,-8,2);flipper.closePath();
  const fg=ctx.createLinearGradient(0,0,-35,40);fg.addColorStop(0,P(a,-0.02));fg.addColorStop(1,P(a,-0.55));fill(flipper,fg);ctx.restore();
  const jaw=path([[183,-1],[162,3],[136,5],[147,15],[168,11],[181,3]]);fill(jaw,P('#081c20'));
  if(low)return;
  ctx.save();ctx.clip(jaw);teeth(ctx,P,{x0:140,y0:3.6+mid(140),x1:178,y1:0.4+mid(178)},{type:'fang',size:3.4,color:'#d5d1ab',gum:false});ctx.restore();
  ctx.fillStyle=P(a,-0.6,0.8);ctx.beginPath();ctx.ellipse(172,-9+mid(172),1.8,0.8,-0.1,0,Math.PI*2);ctx.fill();
  // Gills and a gold-brown iris reflect a plausible submerged predator.
  ctx.strokeStyle=P(a,-0.65,0.8);ctx.lineWidth=1.1;
  for(let i=0;i<4;i++){const x=110+i*5;ctx.beginPath();ctx.moveTo(x,-11+mid(x));ctx.quadraticCurveTo(x-5,0+mid(x),x-1,11+mid(x));ctx.stroke();}
  // A heavy brow ridge over the eye gives the big head its weight.
  ctx.fillStyle=P(a,-0.35,0.55);ctx.beginPath();ctx.moveTo(140,-14+mid(140));ctx.quadraticCurveTo(152,-20+mid(152),163,-13+mid(163));ctx.quadraticCurveTo(152,-16+mid(152),140,-14+mid(140));ctx.fill();
  drawEye(ctx, 151, -10 + mid(150), P, 1.9, { iris: '#9d9057', slit: true });
}

const DRAW = { reef_fish: reefFish, jellyfish, turtle, stingray, dolphin, starfish, blue_whale: blueWhale, megalodon, leviathan };
for(const [id,s] of Object.entries(COMMUNITY_SPECIES)) DRAW[id]=s.family==='whipray'?stingray:s.family==='turtle'&&id!=='giant_turtle'?turtle:(ctx,res,pose,t,P)=>drawCommunityCreature(ctx,res,pose,t,P);

// Simplified forms for distant residents. Still the real resident in its real colour.
function simple(ctx, res, pose, P) {
  if(COMMUNITY_SPECIES[res.species]){
    if(COMMUNITY_SPECIES[res.species].family==='turtle' && res.species!=='giant_turtle')turtle(ctx,res,pose,0,P);
    else if(COMMUNITY_SPECIES[res.species].family==='whipray')stingray(ctx,res,pose,0,P);
    else drawCommunityCreature(ctx,res,pose,0,P,true);
    return;
  }
  const a = res.colors?.primary || '#ff8a4c';
  ctx.fillStyle = P(a, 0);
  switch (res.species) {
    case 'jellyfish':
      // A domed bell with its frilly arms and trailing tentacles hanging below (15 Nov 2026), as the full drawing has them.
      ctx.beginPath(); ctx.ellipse(0, 6, 40, 36, 0, Math.PI, 2 * Math.PI); ctx.quadraticCurveTo(0, 14, -40, 6); ctx.fill();
      ctx.lineCap = 'round'; ctx.strokeStyle = P(res.colors?.secondary || a, 0.05, 0.55); ctx.lineWidth = 6;
      for (const x of [-13, -4, 5, 14]) { ctx.beginPath(); ctx.moveTo(x, 9); ctx.quadraticCurveTo(x * 1.5 + 5, 36, x * 0.7, 62); ctx.stroke(); }
      ctx.strokeStyle = P(a, 0.12, 0.5); ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) { const x = -33 + i * 11; ctx.beginPath(); ctx.moveTo(x, 9); ctx.quadraticCurveTo(x + 6, 46, x - 3, 86); ctx.stroke(); }
      break;
    case 'turtle':
      // A sea turtle's low shell and long front flipper (2026-11-14), as the full drawing has them.
      ctx.beginPath(); ctx.ellipse(-4, -6, 52, 21, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(58, -2, 14, 10, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(6, 24, 11, 33, 0.75, 0, 6.283); ctx.fill();
      break;
    case 'leviathan':
      leviathan(ctx, res, pose, 0, P, true);
      break;
    case 'blue_whale':
      blueWhale(ctx, res, pose, 0, P, true);
      break;
    case 'megalodon':
      megalodon(ctx, res, pose, 0, P, true);
      break;
    case 'dolphin':
      // As the full drawing has had since 14 Nov (redrawn 15 Nov 2026): a short stout beak under a rounded melon, a curved back fin,
      // flukes, and a pale belly. It had kept the old long pointed beak.
      ctx.beginPath(); ctx.moveTo(-56, -2); ctx.bezierCurveTo(-30, -22, 30, -25, 50, -12); ctx.quadraticCurveTo(60, -7, 62, -1); ctx.lineTo(71, 1); ctx.quadraticCurveTo(66, 6, 52, 8); ctx.bezierCurveTo(30, 18, -30, 16, -56, 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, -20); ctx.quadraticCurveTo(-2, -38, -18, -45); ctx.quadraticCurveTo(-12, -30, -14, -17); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-52, -1); ctx.lineTo(-82, -17); ctx.quadraticCurveTo(-73, 0, -82, 18); ctx.lineTo(-52, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = P(res.colors?.secondary || a, 0, 0.85); ctx.beginPath(); ctx.moveTo(62, 3); ctx.quadraticCurveTo(20, 16, -34, 9); ctx.quadraticCurveTo(10, 6, 62, 1); ctx.closePath(); ctx.fill();
      break;
    case 'stingray':
      // The rounded disc and the long whip of a tail, as the full drawing has them (15 Nov 2026).
      ctx.beginPath(); ctx.moveTo(56, 0); ctx.bezierCurveTo(50, -24, 20, -36, 4, -34); ctx.bezierCurveTo(-24, -30, -40, -12, -42, 0); ctx.bezierCurveTo(-40, 12, -24, 30, 4, 34); ctx.bezierCurveTo(20, 36, 50, 24, 56, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-38, -3); ctx.quadraticCurveTo(-90, 2, -146, 4); ctx.lineTo(-38, 3); ctx.fill();
      break;
    case 'starfish':
      ctx.scale(1, 0.64);
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const rr = i % 2 ? 15 : 44, th = (i * 6.283) / 10; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(th) * rr, Math.sin(th) * rr); }
      ctx.closePath(); ctx.fill();
      break;
    default:
      ctx.beginPath(); ctx.ellipse(6, 0, 44, 27, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-32, 0); ctx.lineTo(-66, -22); ctx.lineTo(-66, 22); ctx.closePath(); ctx.fill();
  }
}

// What a whole body does as one piece: mirrored for the way it faces, narrowed and tipped as it turns, tilted as it
// rises or sinks. drawCreature and the live site's pictures (render/pictures.js) both use this, so a creature turns
// the same way however it is drawn.
export function bodyFrame(res, pose) {
  if (motionOf(res.species).noTurn) return { sx: 1, turn: 0, lean: 0 };
  // Full length whenever it is cruising. A turn narrows it smoothly through head-on and out the other side.
  const f = pose.facing, family = COMMUNITY_SPECIES[res.species]?.family;
  // The nine originals and the turtles tilt themselves when they rise or sink.
  return { sx: (f < 0 ? -1 : 1) * turnWidth(f), turn: pose.turning ? 0.1 * pose.turning : 0, lean: pose.pitch && family && family !== 'turtle' ? -pose.pitch : 0 };
}

// The pose a picture is drawn at. Facing, rising and sinking are added when the picture is placed.
export const bakePose = (swim, walk = false) => ({ facing: 1, swim, speed: 20, vx: 0, vy: 0, vz: 0, effort: 1, pitch: 0, turning: 0, ...(walk ? { walk: true } : {}) });
// Time in a picture follows the swim loop and comes back to where it started, so nothing jumps at the end of a loop.
export const bakeTime = (swim) => 8 + 4 * Math.sin(swim);
// A few drawings tilt themselves as they rise and sink. A picture is drawn level, so it is tilted the same when placed.
const RISE_TILT = new Map([[turtle, [0.004, Infinity]], [dolphin, [0.007, 0.32]], [blueWhale, [0.004, 0.12]], [megalodon, [0.004, 0.13]], [leviathan, [0.004, 0.12]]]);
export function pictureFrame(res, pose) {
  const frame = bodyFrame(res, pose), rise = RISE_TILT.get(DRAW[res.species]);
  if (rise) frame.lean += clamp(-pose.vy * rise[0], -rise[1], rise[1]);
  return frame;
}

// Draws a resident centred on the current transform, where 1 unit is about 1/100 of its body length.
// The albino look: white all over with a faint pink flush, and pink-red eyes (unless other eyes were asked for).
const ALBINO = { primary: '#f2ece6', secondary: '#f6dcdc' };
function albino(res) { return { ...res, colors: ALBINO, extras: { ...res.extras, eyeColor: res.extras.eyeColor || '#d8455e' } }; }
export function drawCreature(ctx, res, pose, t, fog, lod) {
  if (res.extras?.albino) res = albino(res);
  // A paid Christmas item is worn like a requested look. `paid` only carries it while Christmas items show (core/shop.js).
  // xmasTrick: how far through its trick the Christmas item is (render/scene.js, on the live ocean page only).
  if (res.paid?.christmas) res = { ...res, extras: { ...(res.extras || {}), xmas: res.paid.christmas, ...(res.xmasTrick != null ? { xmasU: res.xmasTrick } : {}) } };
  // Bought hats, face things and looks are worn the same way (render/paid-items.js wornExtras).
  if (res.paid) { const worn = wornExtras(res.extras, res.paid); if (worn !== res.extras) res = { ...res, extras: worn }; }
  // At full art a galaxy skin (render/extras.js) draws its own stars, so its constellation upgrade doesn't draw them again
  // or cover the stripes or spots underneath. Smaller, extras aren't drawn and the upgrade's stars stand in.
  if (lod >= 2 && res.extras?.galaxy && res.upgrade?.pattern === 'constellation') res = { ...res, upgrade: { ...res.upgrade, pattern: null } };
  const P = palette(fog);
  const drawFn = DRAW[res.species] || reefFish;
  ctx.save();
  const speciesScale = artworkScale(res.species);
  ctx.scale(speciesScale, speciesScale);
  const frame = bodyFrame(res, pose);
  ctx.scale(frame.sx, 1);
  if (frame.turn) ctx.rotate(frame.turn);
  if (frame.lean) ctx.rotate(frame.lean);
  const ex = lod >= 2 ? res.extras : null;
  if (!ex) { if (lod >= 2) withLids(res, t, () => drawFn(ctx, res, pose, t, P)); else simple(ctx, res, pose, P); ctx.restore(); return; }
  // Extras people asked for (render/extras.js): placed from the creature's own eye and outline.
  const def = SPECIES[res.species] || COMMUNITY_SPECIES[res.species];
  const pr = probeSpecies(res.species, (c) => drawFn(c, { species: res.species, colors: def?.defaults || res.colors, pattern: 'plain', seed: 1, size: 1, upgrade: null }, REST, 0, palette(0)), setEyeLook);
  const base = ctx.getTransform ? ctx.getTransform() : null;
  const rec = base ? [] : null;
  drawExtrasBehind(ctx, res, pr, P);
  setEyeLook({ iris: ex.eyeColor || null, scale: ex.baby || ex.bigEyes ? 1.7 : 1, rec });
  try { withLids(res, t, () => drawFn(ctx, res, pose, t, P)); } finally { setEyeLook(null); }
  drawExtras(ctx, res, t, P, pr, rec, base, takeFollow());
  ctx.restore();
}
const REST = { facing: 1, swim: 0, speed: 0, vy: 0 };
// Who blinks: animals with eyelids (mammals, birds, turtles, crocodiles and other lizards, frogs) and the made-up
// creatures drawn like them. Fish, sharks, squid, snakes, insects and crabs have no eyelids, so they only glance.
const BLINKERS = new Set(['dolphin', 'blue_whale', 'turtle', 'leviathan']);
const BLINK_FAMILIES = new Set(['seal', 'cetacean', 'narwhal', 'crocodile', 'otter', 'platypus', 'pinniped', 'sirenian', 'harp', 'bowhead', 'pilot', 'dugong',
  'turtle', 'land_turtle', 'mosasaur', 'plesio', 'pliosaur', 'ichthyosaur', 'ambulocetus', 'mata_mata', 'frog', 'iguana', 'gecko', 'kaiju', 'serpent', 'hippocamp',
  'mermaid', 'cat_mermaid', 'selkie', 'beast', 'angel', 'cthulhu', 'hydra', 'naga', 'duck', 'seabird', 'bird', 'avian', 'raptor', 'kiwi', 'penguin', 'water_spirit',
  'sauropod', 'theropod', 'pterosaur', 'ungulate', 'burrower', 'macropod', 'chipmunk', 'diver']);
const blinksCache = new Map();
export function blinks(species) {
  if (!blinksCache.has(species)) { const f = COMMUNITY_SPECIES[species]?.family; blinksCache.set(species, BLINKERS.has(species) || BLINK_FAMILIES.has(f)); }
  return blinksCache.get(species);
}
function withLids(res, t, fn) {
  setLids(Number.isFinite(t) ? lidsAt(res.seed, t, blinks(res.species)) : null);
  try { return fn(); } finally { setLids(null); }
}
