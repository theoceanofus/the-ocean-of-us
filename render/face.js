// The face kit (spec 2026-11-08-ocean-creature-look): one tidy, natural way to draw every eye.
// Eyes also report where they are, so requested looks (render/extras.js) can follow the head.
import { crisp } from './crisp.js';
const TAU = Math.PI * 2;
function ellipse(c, x, y, rx, ry, fill) { c.fillStyle = fill; c.beginPath(); c.ellipse(x, y, Math.max(rx, 0.01), Math.max(ry, 0.01), 0, 0, TAU); c.fill(); }

// What people asked for on their creature's eyes: an iris colour, bigger baby eyes, and a record of where each eye
// and helmet is (rec), so hats and glasses can follow the head. probe: helmets skip drawing while a species is probed.
let LOOK = null;
export function setEyeLook(v) { LOOK = v; }
export function note(c, kind, x, y, r) {
  if (!LOOK?.rec || !c.getTransform) return;
  const m = c.getTransform();
  LOOK.rec.push({ kind, dx: m.a * x + m.c * y + m.e, dy: m.b * x + m.d * y + m.f, dr: r * Math.hypot(m.a, m.b) });
}
export const isProbing = () => !!LOOK?.probe;

// Living eyes (2026-11-10): every eye glances about now and then, and animals with eyelids blink. Both go by the
// creature's own seed and the clock, so the same moment always draws the same way (Reels stay frame-exact).
// render/creatures.js sets them around a creature's drawing; probes and extras' placement never see them.
let LIDS = null;
export function setLids(v) { LIDS = v; }
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const ease = (u) => u * u * (3 - 2 * u);
// Where eyes look: mostly ahead, sometimes forward, back over the shoulder, up or down. x is forward along the body.
const GAZE = [[0, 0], [0, 0], [0.9, 0.05], [-0.85, -0.1], [0.55, -0.6], [0.35, 0.65], [0, 0], [-0.4, 0.5]];
const BLINK = 0.24; // seconds a blink takes: the site redraws a creature's eyes at least every quarter second
export function lidsAt(seed, t, blinks) {
  const s = (Number(seed) || 0) % 1000;
  // Gaze: held for 1.6 to 3.4 seconds, then a quick move (a tenth of a second) to the next.
  const hold = 1.6 + hash(s, 3) * 1.8, k = Math.floor((t + s) / hold), u = (t + s) / hold - k;
  const at = (n) => GAZE[Math.floor(hash(s, n) * GAZE.length)];
  const a = at(k - 1), b = at(k), m = ease(Math.min(1, (u * hold) / 0.1));
  const out = { gx: a[0] + (b[0] - a[0]) * m, gy: a[1] + (b[1] - a[1]) * m, shut: 0 };
  if (blinks) {
    // A blink every 3 to 6 seconds; now and then a second one straight after.
    const gap = 3 + hash(s, 7) * 3, j = Math.floor((t + s * 1.7) / gap), v = (t + s * 1.7) - j * gap - hash(s, j) * (gap - 0.7);
    const one = (w) => (w > 0 && w < BLINK ? Math.sin((Math.PI * w) / BLINK) : 0);
    out.shut = Math.max(one(v), hash(j, s) < 0.2 ? one(v - BLINK * 1.4) : 0);
  }
  return out;
}
// Designs that draw their own eyes call ownEye() so the extras can find them and recolour them.
export const ownEye = (c, x, y, r, col) => { note(c, 'eye', x, y, r); return LOOK?.iris || col; };
export const eyeScale = () => LOOK?.scale || 1;
export const lookIris = () => LOOK?.iris || null;

// Proportions of one eye of size r, relative to its centre (art units). Natural, not cartoon: the iris fills most of
// the socket, the pupil sits a little forward, and a single catch-light at the upper front makes it look wet.
export function eyeParts(r, { scale = 1 } = {}) {
  const s = r * scale;
  return {
    socket: { rx: 1.85 * s, ry: 1.55 * s },
    iris: { rx: 1.5 * s, ry: 1.25 * s, dx: 0.12 * s },
    pupil: { rx: 0.8 * s, ry: 0.95 * s, dx: 0.2 * s },
    glint: { dx: -0.45 * s, dy: -0.45 * s, r: 0.32 * s },
    lid: { r: 1.72 * s, from: Math.PI * 1.13, to: Math.PI * 1.87, width: 0.22 * s },
  };
}

// Draws the eye without reporting it (the first nine species list their eyes in render/extras.js instead).
// slit: a narrow upright pupil (reptiles, serpents, some mythical creatures).
// bar: a wide flat pupil (octopuses).
export function drawEye(c0, x, y, P, r = 2, { iris = null, scale = 1, slit = false, bar = false } = {}) {
  crisp(c0, (c) => {
  const p = eyeParts(r, { scale });
  const L = LIDS, shut = L ? Math.min(1, L.shut * 1.15) : 0;
  // A blink squeezes the eye shut from above and below; the body drawn underneath shows round it.
  if (shut > 0.02) { c.save(); c.translate(x, y); c.scale(1, Math.max(0.06, 1 - shut)); c.translate(-x, -y); }
  ellipse(c, x, y, p.socket.rx, p.socket.ry, P('#14252c', 0, 0.65));
  // A glance moves the iris and pupil inside the socket; the catch-light stays, as a reflection does.
  const gx = L ? L.gx * p.iris.rx * 0.3 : 0, gy = L ? L.gy * p.iris.ry * 0.24 : 0;
  x += gx; y += gy;
  const ix = x + p.iris.dx;
  const g = c.createRadialGradient(ix - p.iris.rx * 0.3, y - p.iris.ry * 0.3, 0.1, ix, y, p.iris.rx);
  g.addColorStop(0, P(iris || '#c1aa65', iris ? 0.3 : 0));
  g.addColorStop(0.6, P(iris || '#82764e'));
  g.addColorStop(1, P(iris || '#293a3c', iris ? -0.5 : 0));
  ellipse(c, ix, y, p.iris.rx, p.iris.ry, g);
  ellipse(c, x + p.pupil.dx, y, bar ? p.iris.rx * 0.82 : slit ? p.pupil.rx * 0.38 : p.pupil.rx, bar ? p.pupil.ry * 0.36 : slit ? p.iris.ry * 0.92 : p.pupil.ry, P('#050f15'));
  x -= gx; y -= gy;
  ellipse(c, x + p.glint.dx, y + p.glint.dy, p.glint.r, p.glint.r * 0.85, P('#ffffff', 0, 0.92));
  c.strokeStyle = P('#14252c', 0, 0.5); c.lineWidth = p.lid.width; c.lineCap = 'round';
  c.beginPath(); c.arc(x, y + p.socket.ry * 0.05, p.lid.r, p.lid.from, p.lid.to); c.stroke();
  if (shut > 0.02) {
    c.restore();
    // Shut (or nearly): one soft lash line, curved down like a closed eye.
    if (shut > 0.6) {
      c.strokeStyle = P('#14252c', 0, 0.75 * Math.min(1, (shut - 0.6) / 0.25)); c.lineWidth = p.lid.width * 1.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - p.socket.rx * 0.95, y); c.quadraticCurveTo(x, y + p.socket.ry * 0.55, x + p.socket.rx * 0.95, y); c.stroke();
    }
  }
  });
}

// Every other eye: reported for the extras, then drawn with any requested colour and size.
export function eye(c, x, y, P, r = 2, { iris = null, slit = false, bar = false } = {}) {
  note(c, 'eye', x, y, r);
  drawEye(c, x, y, P, r, { iris: LOOK?.iris || iris, scale: LOOK?.scale || 1, slit, bar });
}

// Teeth: one row along a jaw line, counted and spaced to fit it, shaped by the kind of animal.
// gap: space each tooth takes along the jaw; w and h: its width at the base and its length (all times size).
export const TOOTH = {
  triangle: { gap: 1.15, w: 1, h: 1.4 },   // sharks, megalodon
  needle: { gap: 1.6, w: 0.45, h: 2.4 },   // anglerfish, loosejaw
  peg: { gap: 1.3, w: 0.8, h: 0.8 },       // dolphins, orcas, other toothed whales
  fang: { gap: 2.2, w: 1, h: 1.9 },        // crocodiles, mosasaurs, theropods, dragons
  blunt: { gap: 1.05, w: 1, h: 0.7 },      // mammals and other land animals
};
export const FACE_LINE = 1.1; // the weight of every mouth, nostril and gill line, in art units

// A jaw is a quadratic curve from (x0, y0) to (x1, y1); bend pushes its middle sideways (+ is downward for a jaw drawn
// left to right). upper: the teeth hang down into the mouth; otherwise they stand up from the lower jaw.
function jawCurve({ x0, y0, x1, y1, bend = 0 }) {
  const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
  const cx = (x0 + x1) / 2 + nx * bend, cy = (y0 + y1) / 2 + ny * bend;
  const at = (t) => { const u = 1 - t; return { x: u * u * x0 + 2 * u * t * cx + t * t * x1, y: u * u * y0 + 2 * u * t * cy + t * t * y1 }; };
  const tangent = (t) => ({ x: 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx), y: 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy) });
  const N = 256, len = [0];
  let prev = at(0);
  for (let i = 1; i <= N; i++) { const p = at(i / N); len.push(len[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y)); prev = p; }
  const tAt = (s) => { let i = 1; while (i < N && len[i] < s) i++; const a = len[i - 1], b = len[i]; return (i - 1 + (b > a ? (s - a) / (b - a) : 0)) / N; };
  return { at, tangent, length: len[N], tAt, cx, cy };
}

export function toothLayout(jaw, type, size) {
  const T = TOOTH[type] || TOOTH.triangle, curve = jawCurve(jaw);
  const n = Math.max(2, Math.min(40, Math.floor(curve.length / (size * T.gap))));
  const down = jaw.upper !== false;
  return Array.from({ length: n }, (_, i) => {
    const t = curve.tAt(((i + 0.5) / n) * curve.length), p = curve.at(t), d = curve.tangent(t), dl = Math.hypot(d.x, d.y) || 1;
    let nx = -d.y / dl, ny = d.x / dl;
    if ((down && ny < 0) || (!down && ny > 0)) { nx = -nx; ny = -ny; }
    return { x: p.x, y: p.y, angle: Math.atan2(ny, nx), w: T.w * size, h: T.h * size };
  });
}

// Each tooth in its own frame: base on the jaw from (0,-w/2) to (0,w/2), pointing along +x.
const SHAPES = {
  triangle: (w, h) => `M0 ${-w / 2} Q${h * 0.45} ${-w * 0.32} ${h} 0 Q${h * 0.45} ${w * 0.32} 0 ${w / 2}Z`,
  needle: (w, h) => `M0 ${-w / 2} Q${h * 0.55} ${-w * 0.2} ${h} ${w * 0.35} Q${h * 0.5} ${w * 0.3} 0 ${w / 2}Z`,
  peg: (w, h) => `M0 ${-w / 2} L${h * 0.62} ${-w * 0.36} Q${h} 0 ${h * 0.62} ${w * 0.36} L0 ${w / 2}Z`,
  fang: (w, h) => `M0 ${-w / 2} Q${h * 0.62} ${-w * 0.42} ${h} ${w * 0.18} Q${h * 0.5} ${w * 0.16} 0 ${w / 2}Z`,
  blunt: (w, h) => `M0 ${-w / 2} L${h * 0.72} ${-w / 2} Q${h} ${-w / 2} ${h} 0 Q${h} ${w / 2} ${h * 0.72} ${w / 2} L0 ${w / 2}Z`,
};
function strokeJaw(c, jaw, width, col) {
  const k = jawCurve(jaw);
  c.strokeStyle = col; c.lineWidth = width; c.lineCap = 'round';
  c.beginPath(); c.moveTo(jaw.x0, jaw.y0); c.quadraticCurveTo(k.cx, k.cy, jaw.x1, jaw.y1); c.stroke();
}

// gum: a soft gum band along the jaw, for mouths shown open (off by default: a closed mouth line is the gum).
export function teeth(c0, P, jaw, { type = 'triangle', size = 1.5, color = '#f1e9d6', gum = false } = {}) {
  crisp(c0, (c) => {
  const row = toothLayout(jaw, type, size), shape = SHAPES[type] || SHAPES.triangle;
  if (gum) strokeJaw(c, jaw, size * 0.5, P('#8a4a4c', -0.15, 0.55));
  for (const t of row) {
    c.save(); c.translate(t.x, t.y); c.rotate(t.angle);
    const g = c.createLinearGradient(0, 0, t.h, 0);
    g.addColorStop(0, P(color, -0.28)); g.addColorStop(0.35, P(color, 0)); g.addColorStop(1, P(color, 0.1));
    const p = new Path2D(shape(t.w, t.h));
    c.fillStyle = g; c.fill(p);
    c.strokeStyle = P(color, -0.5, 0.45); c.lineWidth = size * 0.1; c.lineJoin = 'round'; c.stroke(p);
    c.restore();
  }
  });
}

// A mouth line along the upper jaw; with a lower jaw and open > 0, the inside of the mouth is shaded dark first.
export function mouth(c, P, upperJaw, lowerJaw = null, { open = 0, color = null } = {}) {
  if (lowerJaw && open > 0) {
    const a = jawCurve(upperJaw), b = jawCurve(lowerJaw);
    const g = c.createLinearGradient(0, Math.min(upperJaw.y0, upperJaw.y1), 0, Math.max(lowerJaw.y0, lowerJaw.y1));
    g.addColorStop(0, P('#1b0f12', 0, open)); g.addColorStop(1, P('#3a1c22', 0, open));
    c.fillStyle = g; c.beginPath(); c.moveTo(upperJaw.x0, upperJaw.y0); c.quadraticCurveTo(a.cx, a.cy, upperJaw.x1, upperJaw.y1);
    c.lineTo(lowerJaw.x1, lowerJaw.y1); c.quadraticCurveTo(b.cx, b.cy, lowerJaw.x0, lowerJaw.y0); c.closePath(); c.fill();
  }
  const col = color || P('#14252c', 0, 0.72);
  strokeJaw(c, upperJaw, FACE_LINE, col);
  if (lowerJaw && open > 0) strokeJaw(c, lowerJaw, FACE_LINE, col);
}

// Mouths, nostrils and gills: one clean line weight (FACE_LINE) everywhere, with round ends and no stray marks.
export function faceLine(c, P, d, col = null, weight = 1) {
  c.strokeStyle = col || P('#14252c', 0, 0.72); c.lineWidth = FACE_LINE * weight; c.lineCap = 'round'; c.lineJoin = 'round';
  c.stroke(typeof d === 'string' ? new Path2D(d) : d);
}
