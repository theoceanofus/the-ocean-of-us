// Paid extras, drawn (spec 2026-11-10-ocean-paid-extras-design, Task 8). Thirteen original designs, no brands.
// Every item is drawn in its own units, about 100 across, centred on (0, 0): homes stand on y = 40, companions face +x,
// trail marks are single glyphs, and the two Christmas hats sit on y = 0 like the other hats in render/extras.js.
// Browser-safe and pure: what is drawn depends only on the item, the clock and the creature, so Reels stay frame-exact.
// Nothing from core/: this file ships to the site, which has no core/shop.js. A test keeps PAID_ITEM_IDS equal to SHOP_ITEMS.
// Since 2026-11-12 hats, face things and looks are worn (WORN_ITEMS, drawn by render/extras.js) and the Spotlight is a light (drawSpotlight).
import { ITEM_FITS } from './item-fits.js';

const TAU = Math.PI * 2;
const plain = (hex, l = 0, a = 1) => {
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.round(l >= 0 ? v + (255 - v) * l : v * (1 + l));
  return `rgba(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)},${a})`;
};
function oval(c, x, y, rx, ry, fill, stroke = null, width = 1, rot = 0) {
  c.beginPath(); c.ellipse(x, y, Math.max(rx, 0.01), Math.max(ry, 0.01), rot, 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function shape(c, d, fill, stroke = null, width = 1) {
  const p = new Path2D(d);
  if (fill) { c.fillStyle = fill; c.fill(p); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(p); }
  return p;
}
function lin(c, x0, y0, x1, y1, stops) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([at, col]) => g.addColorStop(at, col));
  return g;
}
export function sparkle(c, x, y, r, fill) {
  c.fillStyle = fill; c.beginPath(); c.moveTo(x, y - r);
  c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
}
// A soft light, for windows and glints. Nothing is drawn when it is off, so an item with no trick draws exactly as before.
function glow(c, P, x, y, r, col, a) {
  if (!(a > 0.01)) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, P(col, 0.3, 0.8 * a)); g.addColorStop(1, P(col, 0, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}
function sand(c, P, w) {
  oval(c, 0, 40, w, 7, P('#d8c49a'), null);
  oval(c, -w * 0.3, 39, w * 0.35, 3, P('#e8d8b0', 0, 0.7));
}

// ---------- homes ----------
function shellhouse(c, P, t, fx) {
  sand(c, P, 46);
  const body = shape(c, 'M-40 38 Q-46 10 -24 -8 Q-4 -28 24 -22 Q44 -16 46 6 Q46 28 32 38Z', lin(c, 0, -26, 0, 38, [[0, P('#f6dcc8')], [0.6, P('#eab49a')], [1, P('#c8806a')]]), P('#8a4a3a', 0, 0.7), 1.4);
  c.save(); c.clip(body);
  c.strokeStyle = P('#b86a56', 0, 0.55); c.lineWidth = 1.6;
  for (let q = 0; q < TAU * 2.2; q += 0.14) { const r = 3 + q * 3.4, x = 12 + Math.cos(q) * r, y = -2 + Math.sin(q) * r * 0.82; q ? c.lineTo(x, y) : (c.beginPath(), c.moveTo(x, y)); }
  c.stroke();
  for (let i = 0; i < 6; i++) shape(c, `M${-34 + i * 10} 38 Q${-30 + i * 10} 10 ${-18 + i * 9} -12`, null, P('#c8806a', 0, 0.45), 1.2);
  c.restore();
  shape(c, 'M-20 38 L-20 18 Q-12 6 -4 18 L-4 38Z', P('#5a3424'), P('#3a1e14'), 1.2);
  oval(c, -7.5, 28, 1.3, 1.3, P('#e8c45a'));
  oval(c, 22, 6, 7, 6, P('#ffe7a0', 0, 0.95), P('#8a4a3a', 0, 0.8), 1.4);
  const lit = litOf(fx);
  if (lit) { oval(c, 22, 6, 6.4, 5.4, P('#ffc84a', 0.1, lit)); oval(c, -7.5, 28, 1.3, 1.3, P('#fff2b0', 0, lit)); }
  shape(c, 'M15 6 L29 6 M22 0 L22 12', null, P('#8a4a3a', 0, 0.8), 1.2);
  glow(c, P, 22, 6, 20, '#ffc84a', lit);
  shape(c, 'M26 -20 L26 -32 L34 -32 L34 -18Z', P('#c8806a'), P('#8a4a3a', 0, 0.7), 1);
  for (let i = 0; i < 3; i++) { const a = ((t * 0.5 + i / 3) % 1); oval(c, 30 + Math.sin(a * 6 + i) * 3, -36 - a * 22, 2 + a * 2, 2 + a * 2, null, P('#ffffff', 0, 0.75 * (1 - a)), 1); }
  // Trick: one big bubble puffs up out of the chimney.
  if (fx?.u != null) { const u = fx.u, r = 3 + u * 7, y = -34 - u * 52, x = 30 + Math.sin(u * 7) * 3;
    oval(c, x, y, r, r, P('#dff6ff', 0, 0.2 * (1 - u)), P('#ffffff', 0, 0.95 * (1 - u * u)), 1.4); oval(c, x - r * 0.35, y - r * 0.35, r * 0.28, r * 0.2, P('#ffffff', 0, 0.9 * (1 - u)), null, 1, -0.6); }
}
const CASTLE_WINDOWS = [[0, 14], [-28, -14], [28, -6]];
function castle(c, P, t, fx) {
  sand(c, P, 50);
  const stone = '#a8a294', g = lin(c, -40, 0, 40, 0, [[0, P(stone, 0.12)], [1, P(stone, -0.3)]]);
  const tower = (x, w, top) => {
    shape(c, `M${x - w / 2} 40 L${x - w / 2} ${top} L${x + w / 2} ${top} L${x + w / 2} 40Z`, g, P(stone, -0.55, 0.85), 1.2);
    for (let i = 0; i < 3; i++) shape(c, `M${x - w / 2 + i * w / 2.5} ${top} l0 -5 l${w / 5} 0 l0 5Z`, g, P(stone, -0.55, 0.85), 1);
    oval(c, x, top + 12, 2.6, 4, P('#26201c'));
    if (lit) oval(c, x, top + 12, 2.2, 3.5, P('#ffc84a', 0.1, lit));
  };
  const lit = litOf(fx);
  tower(0, 46, 2); tower(-28, 18, -26); tower(28, 18, -18);
  shape(c, 'M-8 40 L-8 26 Q0 14 8 26 L8 40Z', P('#2a201a'));
  // Stone flecks, clipped to the walls so none float in the water.
  c.save(); c.beginPath(); c.rect(-23, 2, 46, 38); c.rect(-37, -26, 18, 66); c.rect(19, -18, 18, 58); c.clip(); c.globalAlpha *= 0.55; for (let i = 0; i < 14; i++) oval(c, -36 + ((i * 37) % 72), -20 + ((i * 53) % 56), 2.4, 1.4, P(stone, -0.25)); c.restore();
  shape(c, 'M-40 40 Q-46 20 -38 4 M-40 40 Q-34 22 -44 8', null, P('#3f8a4a'), 2.4);
  shape(c, 'M42 40 Q48 22 40 10', null, P('#2f7a3e'), 2.4);
  if (lit) for (const [x, y] of CASTLE_WINDOWS) glow(c, P, x, y, 11, '#ffc84a', lit);
  shape(c, 'M28 -23 L28 -40', null, P('#5a4a3a'), 1.4);
  // Trick: the flag waves. Still, it is the plain pennant.
  if (fx?.u != null) { const a = trickLift(fx.u) * 6, w = (k) => Math.sin(fx.u * 30 - k * 2.2) * a * k;
    shape(c, `M28 -40 Q31 ${-39 + w(0.25)} 34 ${-38 + w(0.5)} Q37 ${-37 + w(0.75)} 40 ${-36 + w(1)} Q37 ${-35 + w(0.75)} 34 ${-34 + w(0.5)} Q31 ${-33 + w(0.25)} 28 -32Z`, P('#d8322e')); }
  else shape(c, 'M28 -40 L40 -36 L28 -32Z', P('#d8322e'));
}
function treasurechest(c, P, t, fx) {
  sand(c, P, 46);
  const wood = '#8a5a2e', gold = '#e8b83a';
  // The lid stands open behind, so the gold shows.
  shape(c, 'M-34 0 L-30 -30 Q0 -40 30 -30 L34 0Z', lin(c, 0, -38, 0, 0, [[0, P(wood, -0.05)], [1, P(wood, -0.45)]]), P(wood, -0.6), 1.4);
  for (const x of [-22, 22]) shape(c, `M${x - 3} 0 L${x - 2} -33 M${x + 3} 0 L${x + 2} -33`, null, P(gold, -0.2), 1.4);
  c.save(); c.beginPath(); c.rect(-34, -40, 68, 44); c.clip();
  for (let i = 0; i < 9; i++) oval(c, -26 + i * 6.5, 2 - (i % 3) * 3, 5, 3, P(gold, 0.1), P(gold, -0.45), 0.8);
  for (let i = 0; i < 6; i++) oval(c, -18 + i * 7, -4 - (i % 2) * 3, 4.6, 2.8, P(gold, 0.15), P(gold, -0.45), 0.8);
  oval(c, 8, -10, 4.5, 4.5, P('#f8f6f0'), P('#c8c0b0'), 0.8); oval(c, 6.6, -11.4, 1.4, 1.2, P('#ffffff'));
  oval(c, -10, -8, 3.4, 2.6, P('#d8322e'), P('#7a1010'), 0.6);
  // Trick: a little fish pops up out of the gold and drops back in.
  if (fx?.u != null) { const u = fx.u, up = Math.sin(Math.PI * u); c.save(); c.translate(-4 + u * 10, 16 - up * 46); c.rotate(-0.5 + u); c.scale(0.3, 0.3); littlefish(c, P, t * 2); c.restore(); }
  c.restore();
  glow(c, P, 0, -8, 34, '#ffd84a', litOf(fx));
  const shine = 0.5 + 0.5 * Math.sin(t * 2);
  sparkle(c, 18, -14, 4 + shine * 2, P('#fff6c8', 0, 0.9));
  shape(c, 'M-34 4 L34 4 L34 36 L-34 36Z', lin(c, 0, 4, 0, 36, [[0, P(wood, 0.08)], [1, P(wood, -0.35)]]), P(wood, -0.6), 1.4);
  for (const x of [-22, 22]) shape(c, `M${x - 3} 36 L${x - 3} 4 M${x + 3} 36 L${x + 3} 4`, null, P(gold, -0.1), 1.4);
  shape(c, 'M-34 5 L34 5', null, P(gold), 3);
  shape(c, 'M-5 8 L5 8 L5 18 L-5 18Z', P(gold), P(gold, -0.5), 1); oval(c, 0, 13, 1.4, 2, P('#2a1a10'));
}
function coralgarden(c, P, t, fx) {
  sand(c, P, 50);
  const sway = Math.sin(t * 0.8) * 2;
  const branch = (x, col, h, spread) => {
    c.strokeStyle = P(col); c.lineCap = 'round'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x, 40); c.lineTo(x + sway * 0.3, 40 - h);
    for (const [s, f] of [[-1, 0.45], [1, 0.6], [-1, 0.75]]) { const yy = 40 - h * f; c.moveTo(x + sway * 0.2, yy); c.lineTo(x + s * spread + sway * 0.5, yy - h * 0.3); }
    c.stroke();
    for (const [dx, dy] of [[0, -h], [-spread, -h * 0.75], [spread, -h * 0.9], [-spread, -h * 1.05]]) {
      oval(c, x + dx + sway * 0.5, 40 + dy, 3.2, 3.2, P(col, 0.2));
      if (lit) { glow(c, P, x + dx + sway * 0.5, 40 + dy, 9, col, lit); oval(c, x + dx + sway * 0.5, 40 + dy, 2, 2, P('#ffffff', 0, 0.8 * lit)); }
    }
  };
  const lit = litOf(fx);
  // A sea fan: a rounded lattice on a short stem.
  const fan = shape(c, `M20 40 L20 30 Q2 22 4 0 Q8 -22 ${24 + sway} -24 Q42 -20 42 2 Q42 22 24 30 L24 40Z`, P('#9a5ac8', 0, 0.82), P('#6a3a98', 0, 0.85), 1.2);
  c.save(); c.clip(fan); c.strokeStyle = P('#d8a8f0', 0, 0.75); c.lineWidth = 0.9;
  for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(22, 32); c.lineTo(2 + i * 6.6 + sway * 0.6, -26); c.stroke(); }
  for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(22, 32, 10 + i * 9, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); }
  c.restore();
  branch(-26, '#e8604a', 44, 10); branch(-6, '#f08ab0', 34, 9);
  for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.95 + i / 8 * Math.PI * 0.9; shape(c, `M40 36 Q${40 + Math.cos(a) * 8} ${36 + Math.sin(a) * 8} ${40 + Math.cos(a) * 14 + sway} ${36 + Math.sin(a) * 14}`, null, P('#f2c94c'), 2.2); }
  oval(c, 40, 37, 6, 3, P('#e89a3a'));
  oval(c, -40, 37, 7, 4, P('#7a8a5a')); oval(c, -42, 35, 3, 2, P('#9aaa7a'));
  // Trick: a stream of bubbles rises from the sea fan.
  if (fx?.u != null) for (let i = 0; i < 5; i++) { const a = fx.u * 1.6 - i * 0.15; if (a <= 0 || a >= 1) continue; const r = 2 + a * 3, x = 22 + Math.sin(a * 8 + i) * 4, y = -20 - a * 50;
    oval(c, x, y, r, r, P('#dff6ff', 0, 0.2 * (1 - a)), P('#ffffff', 0, 0.9 * (1 - a)), 1.1); }
}

// ---------- companions (face +x) ----------
function littlefish(c, P, t) {
  const w = Math.sin(t * 9) * 4;
  shape(c, `M-24 0 L-42 ${-14 + w} L-38 0 L-42 ${14 + w}Z`, P('#f2a03a'), P('#a85a1a', 0, 0.7), 1);
  shape(c, 'M-4 -18 Q4 -30 16 -18Z', P('#f2a03a'));
  const b = shape(c, 'M-28 0 Q-18 -20 8 -20 Q30 -18 40 0 Q30 18 8 20 Q-18 20 -28 0Z', lin(c, 0, -20, 0, 20, [[0, P('#f8b84a')], [1, P('#f8e0a0')]]), P('#a85a1a', 0, 0.7), 1.2);
  c.save(); c.clip(b); shape(c, 'M4 -24 Q10 0 4 24 L-6 24 Q0 0 -6 -24Z', P('#ffffff', 0, 0.85)); c.restore();
  oval(c, 26, -4, 5, 5, P('#ffffff')); oval(c, 27.5, -4, 3, 3.2, P('#111a20')); oval(c, 26.4, -5.4, 1, 1, P('#ffffff'));
  shape(c, 'M36 4 Q33 7 29 6', null, P('#7a3a10'), 1.2);
}
function babyseahorse(c, P, t, fx) {
  // A baby seahorse: big head with a little crown of knobs, a short tube snout, a round belly, a fluttering back fin and a tail
  // curled into a spiral underneath. Upright, facing +x, gently bobbing.
  // Trick: three quick bobs.
  const hop = fx?.u != null ? -Math.abs(Math.sin(fx.u * Math.PI * 3)) * 12 * (1 - fx.u * 0.4) : 0;
  const bob = Math.sin(t * 2.4) * 2 + Math.round(hop * 100) / 100, col = '#f28a6a', light = '#ffc9b4';
  c.save(); c.translate(0, bob);
  const G = lin(c, -14, -36, 14, 34, [[0, P(col, 0.2)], [1, P(col, -0.15)]]);
  // Tail: a tapering curl, drawn as overlapping round strokes so it stays smooth.
  const tail = [];
  for (let i = 0; i <= 14; i++) { const u = i / 14; tail.push([-3 - u * 2, 12 + u * 18]); }
  for (let i = 1; i <= 34; i++) { const u = i / 34, a = Math.PI - u * Math.PI * 2.2, r = 7 - u * 5; tail.push([2 + Math.cos(a) * r, 30 + Math.sin(a) * r]); }
  for (let i = 0; i < tail.length - 1; i++) { const k = i / (tail.length - 1), w = 9.5 * (1 - k) + 1.8; c.strokeStyle = P(col, -0.04 - k * 0.14); c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(...tail[i]); c.lineTo(...tail[i + 1]); c.stroke(); }
  // Back fin, see-through, fluttering.
  const f = Math.sin(t * 9) * 2.5;
  shape(c, `M-8 -6 Q-20 ${-10 + f} -19 ${2 + f} Q-16 ${10 - f} -7 8Z`, P(light, 0, 0.75), P(col, -0.3, 0.6), 0.8);
  // Body and belly.
  shape(c, 'M-6 -22 Q-12 -10 -10 2 Q-8 14 -2 16 Q10 16 12 4 Q12 -8 6 -14Z', G, P(col, -0.5), 1.2);
  shape(c, 'M4 -10 Q12 -4 11 6 Q8 13 0 14', null, P(light, 0, 0.8), 2.4);
  c.strokeStyle = P(col, -0.35, 0.55); c.lineWidth = 0.9;
  for (let i = 0; i < 5; i++) { const y = -10 + i * 5; c.beginPath(); c.moveTo(-10 + Math.abs(i - 2), y); c.quadraticCurveTo(0, y + 2, 10 - Math.abs(i - 1), y - 1); c.stroke(); }
  // Head, crown and tube snout.
  oval(c, 4, -26, 11, 9.5, G, P(col, -0.5), 1.2, -0.2);
  for (const [x, y, r] of [[-2, -35, 2.6], [3, -37, 2.8], [8, -35, 2.4]]) oval(c, x, y, r, r * 1.1, P(col, 0.15), P(col, -0.45), 0.8);
  shape(c, 'M12 -29 L25 -27.5 Q28 -27 28 -25 Q28 -23 25 -22.8 L12 -21.5Z', G, P(col, -0.5), 1.1);
  oval(c, 27.2, -24.9, 1.1, 1.6, P(col, -0.5));
  // A big, friendly eye and a little blush.
  oval(c, 4, -27, 5, 5, P('#ffffff'), P(col, -0.5), 0.8);
  oval(c, 5, -26.6, 3.4, 3.6, P('#1a2228')); oval(c, 3.8, -28.2, 1.3, 1.2, P('#ffffff')); oval(c, 6.2, -25.2, 0.6, 0.6, P('#ffffff', 0, 0.8));
  oval(c, 9, -20.5, 2.8, 1.6, P('#ff8aa0', 0, 0.55));
  c.restore();
}
function minijelly(c, P, t, fx) {
  // Trick: three strong pulses, glowing.
  const beat = fx?.u != null ? Math.abs(Math.sin(fx.u * Math.PI * 3)) * trickLift(fx.u) : 0;
  const p = 0.5 + 0.5 * Math.sin(t * 3), sq = 1 - p * 0.12 - beat * 0.28;
  c.save();
  glow(c, P, 0, -8, 40, '#ff9ad8', beat);
  for (let i = 0; i < 6; i++) { const x = -14 + i * 5.6; shape(c, `M${x} 6 Q${x + Math.sin(t * 2 + i) * 5} 22 ${x + Math.sin(t * 1.6 + i) * 8} 40`, null, P('#f4b6dc', 0, 0.7), 1.4); }
  shape(c, 'M-6 6 Q-4 18 -8 28 M4 6 Q8 18 4 26', null, P('#e88ac0', 0, 0.85), 3);
  shape(c, `M${-22 * sq} 6 Q${-22 * sq} -22 0 -24 Q${22 * sq} -22 ${22 * sq} 6 Q0 10 ${-22 * sq} 6Z`, lin(c, 0, -24, 0, 8, [[0, P('#fbd0ec', 0, 0.95)], [1, P('#e88ac0', 0, 0.85)]]), P('#c85aa0', 0, 0.7), 1.2);
  oval(c, -8, -12, 6, 3, P('#ffffff', 0, 0.45));
  c.restore();
}

// ---------- trail marks ----------
function bubbletrail(c, P) {
  // A trail of bubbles curving away behind, small to large.
  for (let i = 0; i < 7; i++) { const u = i / 6, x = -42 + u * 80, y = 26 - Math.sin(u * Math.PI * 0.9) * 40 + u * 8, r = 4 + u * 13;
    oval(c, x, y, r, r, P('#dff6ff', 0, 0.16), P('#e8faff', 0, 0.9), 1.4 + u * 1.6); oval(c, x - r * 0.35, y - r * 0.35, r * 0.28, r * 0.2, P('#ffffff', 0, 0.85), null, 1, -0.6); }
}
// One bubble of the trail, for the card (radius 30).
export function bubbleMark(c, P = plain) { oval(c, 0, 0, 30, 30, P('#dff6ff', 0, 0.18), P('#e8faff', 0, 0.9), 3); oval(c, -10, -10, 8, 6, P('#ffffff', 0, 0.85), null, 1, -0.6); }
export const RAINBOW = ['#e8322e', '#f2a03a', '#f8d24a', '#4ab84a', '#3a7fd6', '#7a4ac8'];
function rainbowtrail(c, P) {
  RAINBOW.forEach((col, i) => { c.strokeStyle = P(col); c.lineWidth = 6; c.beginPath(); c.arc(0, 26, 40 - i * 6, Math.PI, 0); c.stroke(); });
  oval(c, -36, 28, 12, 7, P('#ffffff', 0, 0.95)); oval(c, 36, 28, 12, 7, P('#ffffff', 0, 0.95));
}
function startrail(c, P, t) {
  // A trail of stars sweeping in behind, the nearest the brightest.
  for (let i = 0; i < 7; i++) { const u = i / 6, x = -42 + u * 82, y = 24 - Math.sin(u * Math.PI * 0.9) * 38 + u * 6, r = 5 + u * 18;
    sparkle(c, x, y, r * (0.85 + 0.15 * Math.sin(t * 4 + i)), P(i % 2 ? '#fff3b0' : '#ffffff', 0, 0.55 + u * 0.45)); }
  sparkle(c, 40, 0, 9, P('#ffffff'));
}

// ---------- Christmas (hats sit on y = 0, s is the head size the extras use) ----------
function santahat(c, P, t, s = 50, fx) {
  // Trick: the pom-pom bounces three times, hopping up off the tip and squashing as it lands.
  const beat = fx?.u != null ? Math.abs(Math.sin(fx.u * Math.PI * 3)) * (1 - fx.u * 0.5) : 0;
  const w = s * 0.5, h = s * 0.95, flop = Math.sin(t * 1.5) * s * 0.04, py = -h * 0.45 - beat * s * 0.16;
  shape(c, `M${-w} 0 Q${-w * 0.7} ${-h * 0.75} ${w * 0.25} ${-h} Q${w * 1.05 + flop} ${-h * 0.95} ${w * 1.15 + flop} ${py} Q${w * 0.8} ${-h * 0.7} ${w * 0.35} ${-h * 0.6} Q${w * 0.75} ${-h * 0.3} ${w} 0Z`,
    lin(c, -w, -h, w, 0, [[0, P('#e8322e', 0.1)], [1, P('#a8181a')]]), P('#6a1010', 0, 0.7), Math.max(0.3, s * 0.02));
  oval(c, w * 1.15 + flop, py, s * 0.13, s * 0.13, P('#f8f6f0'), P('#c8c0b8', 0, 0.8), Math.max(0.3, s * 0.015));
  shape(c, `M${-w * 1.08} ${-s * 0.02} Q0 ${-s * 0.2} ${w * 1.08} ${-s * 0.02} Q${w * 1.1} ${s * 0.1} ${w * 0.9} ${s * 0.12} Q0 ${-s * 0.02} ${-w * 0.9} ${s * 0.12} Q${-w * 1.1} ${s * 0.1} ${-w * 1.08} ${-s * 0.02}Z`, P('#f8f6f0'), P('#c8c0b8', 0, 0.8), Math.max(0.3, s * 0.015));
}
function snowcrown(c, P, t, s = 50, fx) {
  // A crown of ice: a frosted band round the head, five clear icicle spires (the middle one tallest), a snowflake at the top of
  // each of the three tall spires, an ice-blue gem in front, and a glint that comes and goes.
  const w = s * 0.56, bh = s * 0.17, lw = Math.max(0.3, s * 0.018);
  const ice = (a = 1) => lin(c, 0, -s * 0.9, 0, 0, [[0, P('#ffffff', 0, 0.95 * a)], [0.5, P('#cdeeff', 0, 0.9 * a)], [1, P('#7cc4ee', 0, 0.9 * a)]]);
  // The back of the band, behind the head's crown.
  shape(c, `M${-w} ${-bh} Q0 ${-bh - s * 0.12} ${w} ${-bh}`, null, P('#a8daf4', 0, 0.8), lw * 2.4);
  const spires = [[-0.78, 0.42], [-0.4, 0.62], [0, 0.88], [0.4, 0.62], [0.78, 0.42]];
  for (const [u, h] of spires) {
    const x = u * w, top = -bh - s * h, half = s * (0.07 + h * 0.06);
    shape(c, `M${x - half} ${-bh + 1} L${x - half * 0.7} ${top + s * 0.08} L${x} ${top} L${x + half * 0.7} ${top + s * 0.08} L${x + half} ${-bh + 1}Z`, ice(), P('#5a9ccc', 0, 0.85), lw);
    shape(c, `M${x - half * 0.25} ${-bh} L${x - half * 0.2} ${top + s * 0.1}`, null, P('#ffffff', 0, 0.8), lw * 1.2);
  }
  // The band: frosted, slightly curved round the front of the head, with a row of small ice beads.
  const band = shape(c, `M${-w} ${-bh} Q0 ${-bh + s * 0.05} ${w} ${-bh} L${w * 0.98} 0 Q0 ${s * 0.07} ${-w * 0.98} 0Z`, lin(c, 0, -bh, 0, s * 0.05, [[0, P('#f4fbff')], [1, P('#8cc8ec')]]), P('#5a9ccc', 0, 0.9), lw);
  c.save(); c.clip(band); for (let i = 0; i < 9; i++) oval(c, -w * 0.85 + i * w * 0.212, -bh * 0.45 + s * 0.01, s * 0.022, s * 0.022, P('#ffffff', 0, 0.85)); c.restore();
  oval(c, 0, -bh * 0.5, s * 0.065, s * 0.075, P('#4ab0ff'), P('#1a6aa8', 0, 0.9), lw); oval(c, -s * 0.02, -bh * 0.62, s * 0.02, s * 0.022, P('#ffffff', 0, 0.9));
  const flake = (x, y, r) => { c.strokeStyle = P('#ffffff'); c.lineWidth = Math.max(0.4, r * 0.2); c.lineCap = 'round'; c.beginPath();
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 2, ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r; c.moveTo(x, y); c.lineTo(ex, ey);
      const mx = x + Math.cos(a) * r * 0.55, my = y + Math.sin(a) * r * 0.55; for (const d of [-0.7, 0.7]) { c.moveTo(mx, my); c.lineTo(mx + Math.cos(a + d) * r * 0.32, my + Math.sin(a + d) * r * 0.32); } }
    c.stroke(); oval(c, x, y, r * 0.18, r * 0.18, P('#bfe6ff')); };
  flake(0, -bh - s * 0.88, s * 0.13); flake(-0.4 * w, -bh - s * 0.62, s * 0.09); flake(0.4 * w, -bh - s * 0.62, s * 0.09);
  sparkle(c, w * 0.22, -bh - s * 0.5, s * 0.07 * (0.6 + 0.4 * Math.sin(t * 3)), P('#ffffff', 0, 0.95));
  if (fx?.u != null) crownGlint(c, P, s, fx.u);
}
// The crown's trick: a glint sweeps across the spires.
function crownGlint(c, P, s, u) {
  const w = s * 0.56, bh = s * 0.17, x = (-1 + 2 * u) * w, y = -bh - s * (0.3 + 0.35 * Math.sin(Math.PI * u)), r = s * 0.22 * trickLift(u);
  glow(c, P, x, y, r * 1.6, '#cdeeff', trickLift(u)); sparkle(c, x, y, r, P('#ffffff')); sparkle(c, x, y, r * 0.45, P('#ffffff'));
}
export const LIGHT_COLOURS = ['#ff4a4a', '#ffd84a', '#4aff8a', '#4ab0ff', '#ff8ae0'];
function fairylights(c, P, t, fx) {
  const pts = Array.from({ length: 9 }, (_, i) => [-44 + i * 11, Math.sin(i * 0.9) * 8 + (i % 2 ? 6 : -2)]);
  c.strokeStyle = P('#2a4a2a'); c.lineWidth = 1.6; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  pts.forEach(([x, y], i) => bulb(c, P, x, y + 4, 4.2, LIGHT_COLOURS[i % 5], t, i, fx?.u));
}
// u: the fairy lights' trick, 0 to 1 while it runs: a bright twinkle chases along the string.
export function bulb(c, P, x, y, r, col, t, i, u = null) {
  let on = 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7), big = 2.6;
  if (u != null) { const chase = Math.max(0, Math.cos(i * 0.8 - u * 14)) ** 3 * trickLift(u); on = Math.min(1.6, on + chase); big += chase * 1.6; }
  const g = c.createRadialGradient(x, y, 0, x, y, r * big); g.addColorStop(0, P(col, 0.3, Math.min(1, 0.55 * on))); g.addColorStop(1, P(col, 0, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r * big, 0, TAU); c.fill();
  oval(c, x, y, r * 0.8, r, P(col, Math.min(0.6, 0.2 * on))); oval(c, x - r * 0.25, y - r * 0.35, r * 0.25, r * 0.3, P('#ffffff', 0, 0.7));
  c.fillStyle = P('#3a5a3a'); c.fillRect(x - r * 0.45, y - r * 1.35, r * 0.9, r * 0.5);
}

const DRAW = { shellhouse, castle, treasurechest, coralgarden, littlefish, babyseahorse, minijelly, bubbletrail, rainbowtrail, startrail, santahat, snowcrown, fairylights };
// The items drawn on their own (homes, companions, trails and Christmas items).
export const SCENE_ITEM_IDS = Object.keys(DRAW);

// ---------- worn items (owner, 2026-11-12) ----------
// Hats, face things and looks are worn like requested looks, and render/extras.js draws them. Each id gives the extras it adds.
export const WORN_ITEMS = Object.freeze({
  bow: { wear: 'bow' }, cap: { wear: 'cap' }, crown: { wear: 'crown' }, partyhat: { wear: 'party_hat' }, tophat: { wear: 'top_hat' },
  cowboyhat: { wear: 'cowboy_hat' }, wizardhat: { wear: 'wizard_hat' }, piratehat: { wear: 'pirate_hat' }, unicornhorn: { wear: 'unicorn_horn' },
  headphones: { wear: 'headphones' },
  babylook: { baby: true }, sparkle: { sparkle: true }, blush: { cheeks: '#ff8aa0' }, lashes: { lashes: true },
  glasses: { glasses: true }, goggles: { goggles: true }, monocle: { monocle: true },
  // A gift-only look for now (core/shop.js giftOnly): the princess floral dress, worn round the body (render/extras.js dress).
  princessdress: { dress: 'princess' },
});
// The kinds that are worn, so they are part of a creature's look (and its pictures).
export const WORN_KINDS = Object.freeze(['hat', 'look', 'face']);
// A creature's extras with its bought hat, look and face thing on. A bought hat takes the place of an asked-for one and of that
// one's colours; asked-for glasses stay on under a bought hat. Without any of them the extras come back unchanged (the same object).
export function wornExtras(extras, paid) {
  if (!paid || !WORN_KINDS.some((k) => WORN_ITEMS[paid[k]])) return extras;
  const ex = { ...(extras || {}) };
  if (WORN_ITEMS[paid.hat]) {
    if (ex.wear === 'glasses') ex.glasses = true;
    delete ex.wearColor; delete ex.wearColors;
    Object.assign(ex, WORN_ITEMS[paid.hat]);
  }
  for (const k of ['look', 'face']) if (WORN_ITEMS[paid[k]]) Object.assign(ex, WORN_ITEMS[paid[k]]);
  return ex;
}

// ---------- the Spotlight (owner, 2026-11-12: "being seen") ----------
// A warm gold light behind the creature, a soft gold ring round it and three gold sparkles going round. (x, y): its middle on
// screen, r: its radius on screen. Drawn behind the creature by the scene and the card; what it draws depends only on the clock.
export const SPOTLIGHT_GOLD = '#ffd25a';
export function drawSpotlight(c, x, y, r, t, P = plain) {
  if (!(r > 0.5)) return;
  const pulse = 0.9 + 0.1 * Math.sin(t * 2), out = r * 1.9 * pulse;
  c.save();
  const g = c.createRadialGradient(x, y, r * 0.15, x, y, out);
  g.addColorStop(0, P(SPOTLIGHT_GOLD, 0.4, 0.6)); g.addColorStop(0.5, P(SPOTLIGHT_GOLD, 0.1, 0.28)); g.addColorStop(1, P(SPOTLIGHT_GOLD, 0, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, out, 0, TAU); c.fill();
  oval(c, x, y, r * 1.4, r * 1.12, null, P(SPOTLIGHT_GOLD, 0.25, 0.55 + 0.2 * Math.sin(t * 2)), Math.max(0.8, r * 0.045));
  for (let i = 0; i < 3; i++) { const a = t * 0.9 + i * TAU / 3; sparkle(c, x + Math.cos(a) * r * 1.4, y + Math.sin(a) * r * 1.12, Math.max(1, r * 0.13) * (0.7 + 0.3 * Math.sin(t * 4 + i)), P('#fff6c8', 0, 0.95)); }
  c.restore();
}

// Every shop item: drawn on its own, worn, or the Spotlight. A test keeps this equal to SHOP_ITEMS.
export const PAID_ITEM_IDS = [...SCENE_ITEM_IDS, ...Object.keys(WORN_ITEMS), 'spotlight'];

// ---------- fits (owner, 2026-11-14: every bought item is checked on the creature, and fixed if needed, before it is given) ----------
// The shop's fit check (tools/fit-check.mjs) draws each bought item on its creature and, when the usual placement fails on that species,
// saves a small fit for it in render/item-fits.js. A fit belongs to a drawing, so an asked-for crown and a bought crown share it.
// The fit's key: the hat's own drawing (party_hat for the Party hat), the look's (cheeks for Rosy cheeks, baby for the Baby look), else the id.
const FIT_KEYS = { blush: 'cheeks', babylook: 'baby' };
export const fitKeyOf = (id) => WORN_ITEMS[id]?.wear || FIT_KEYS[id] || id;
// The fit check tries fits on the page with tryItemFits(table) before it saves one; null goes back to the saved ones.
let trying = null;
export function tryItemFits(table) { trying = table || null; }
// A species' fit for a drawing, or null (the usual placement). What it means:
//   worn on the head: x moves it along the body towards the snout, in head sizes, and it still sits on the body there; y moves it down
//     (or up, below 0) in item sizes; scale grows or shrinks it.
//     On a helmet, or a face seen from the front, x moves it sideways in item sizes.
//   on the face and looks: x and y move it from the eye, in item sizes; scale grows or shrinks it round the eye.
//   companions and trails: x moves it forward (or back) and y down (or up), in the creature's own size; scale grows or shrinks it.
//   homes: x moves it further from its owner (or nearer), and y lower (off the seabed only), in the owner's size; scale as above.
export function fitFor(species, key) {
  const f = (trying || ITEM_FITS)[species]?.[key];
  return f && typeof f === 'object' ? f : null;
}
// The same fit, with nothing missing: { x: 0, y: 0, scale: 1 } when there is none.
export function fitOf(species, key) {
  const f = fitFor(species, key);
  return { x: Number.isFinite(f?.x) ? f.x : 0, y: Number.isFinite(f?.y) ? f.y : 0, scale: Number.isFinite(f?.scale) && f.scale > 0 ? f.scale : 1 };
}

// One item at its own size, centred on (0, 0). P is a palette (render/creatures.js palette, or `plain` for pictures without fog).
// fx, when given, is the item's trick: { u: 0 to 1 while a trick runs, else null; lit: 0 to 1, a home's lights }. Without it
// (cards, shop pictures, Reels) every item draws exactly as it always has.
export function drawPaidItem(c, id, t = 0, P = plain, fx = null) {
  const f = DRAW[id];
  if (!f) return false;
  c.save();
  try { if (id === 'santahat' || id === 'snowcrown') { c.translate(0, 22); f(c, P, t, 60, fx); } else f(c, P, t, fx); } finally { c.restore(); }
  return true;
}
// The worn Christmas hats, for render/extras.js: s is the head size, the hat sits on (0, 0). u: the trick, as for drawPaidItem.
export function drawChristmasHat(c, P, id, s, t, u = null) { (id === 'santahat' ? santahat : snowcrown)(c, P, t, s, u == null ? null : { u }); }

// ---------- tricks ----------
// Each paid item has one small trick, only on the live ocean page: it plays when the creature is tapped or found, and a home's
// windows glow while its creature is followed. Cosmetic only: nothing else (casting, size, rank, roaming) ever reads them.
export const TRICK_SECONDS = 1.6;
// How far through a trick that began at startedAt the clock t is (0 to 1), or null when none is running.
export function trickAt(startedAt, t) { const d = t - startedAt; return d >= 0 && d < TRICK_SECONDS - 1e-9 ? d / TRICK_SECONDS : null; }
// Up and back down over a trick: 0 at both ends, so a trick never pops on or off.
export function trickLift(u) { return u == null ? 0 : Math.sin(Math.PI * Math.min(1, Math.max(0, u))) ** 2; }
// A home's lights: on while followed (lit), and up for its trick.
function litOf(fx) { return fx ? Math.max(fx.lit || 0, trickLift(fx.u)) : 0; }

// ---------- where they go round a swimming creature (render/scene.js and the card) ----------
// R: the creature's size in world units. Companions, homes and trail marks are a share of it, so a little crab gets a little house
// and never one bigger than itself at close-up. A home stops growing at giant size. A companion holds at its cap for a while, then
// keeps a fifth of a giant's size, and trail marks a tenth of any creature's, so both still show beside a leviathan, in a Reel
// close-up and in the ocean from afar (owner, 2026-11-14: "make them bigger").
export const companionSize = (R) => Math.max(Math.min(30, R * 0.32), R * 0.2);
export const homeSize = (R) => Math.min(110, R * 1.1);
export const trailSize = (R) => R * 0.1;
// Far off, a star trail is drawn bigger than its share of the creature, so it still reads as a trail of stars and not a speck or
// two (2026-11-14). px: the creature's radius on screen. From FAR_TRAIL_FROM px up (every Reel close-up, about 200 px) nothing
// changes, and the cards draw their own; at the live ocean's usual 45 px the stars are 1.45 times the size, at most 1.6 times.
export const FAR_TRAIL_FROM = 90;
export const trailFarBoost = (px) => (px >= FAR_TRAIL_FROM ? 1 : 1 + 0.6 * Math.min(1, (FAR_TRAIL_FROM - Math.max(0, px)) / 60));
export const TRAIL_STEPS = 12, TRAIL_GAP = 0.3; // seconds between trail marks along the path

// ---------- a trail's line: smooth, rippling with the swim, fading into the water (owner, 2026-11-14) ----------
// "make sure the trails arent blocky and like fade into the ocean at the end of it and fade and move up and down as the creature moves"
// The marks a trail is drawn through ([{ x, y, s }], nearest the creature first) as one smooth line (Catmull-Rom), k points to each
// gap. Each point carries its scale s and u, how far along the trail it is: 0 at the first mark, 1 at the last.
export function smoothTrail(pts, k = 4) {
  const n = pts.length, out = [];
  if (n < 2) return n ? [{ ...pts[0], u: 0 }] : out;
  const at = (i) => pts[Math.max(0, Math.min(n - 1, i))];
  const cr = (a, b, c, d, q) => 0.5 * (2 * b + (c - a) * q + (2 * a - 5 * b + 4 * c - d) * q * q + (3 * b - a - 3 * c + d) * q * q * q);
  for (let i = 0; i < n - 1; i++) {
    const a = at(i - 1), b = at(i), c = at(i + 1), d = at(i + 2);
    for (let j = 0; j < k; j++) { const q = j / k; out.push({ x: cr(a.x, b.x, c.x, d.x, q), y: cr(a.y, b.y, c.y, d.y, q), s: b.s + (c.s - b.s) * q, u: (i + q) / (n - 1) }); }
  }
  out.push({ x: pts[n - 1].x, y: pts[n - 1].y, s: pts[n - 1].s, u: 1 });
  return out;
}
// How strongly a trail shows u of the way along it (0 to 1): coming out from behind the tail, full for its first third, then fading
// softly into the water, to nothing at its end.
export const TRAIL_FADE = Object.freeze([[0, 0.65], [0.08, 1], [0.35, 0.94], [0.7, 0.42], [1, 0]]);
export function trailFade(u) {
  const v = Math.min(1, Math.max(0, u));
  for (let i = 1; i < TRAIL_FADE.length; i++) {
    const [u1, a1] = TRAIL_FADE[i];
    if (v <= u1) { const [u0, a0] = TRAIL_FADE[i - 1], q = (v - u0) / (u1 - u0 || 1); return a0 + (a1 - a0) * q * q * (3 - 2 * q); }
  }
  return 0;
}
// The ripple a trail makes as its creature swims: a wave running back along it with the tail's beat, small near the creature and
// growing towards the far end, across the line (up and down when it swims level). It is not each mark's own tail beat, which at
// 0.3 seconds apart would jump about: one wave, TRAIL_WAVE radians from one mark to the next, at the beat's pace (no faster than
// TRAIL_WAVE_HZ, so a small fish's trail never shivers). from: the point behind the tail the trail starts at (it stays put); pts: the
// marks; swim, tail: the creature's tail beat and its pace (render/motion.js poseAt swim and m.tail); R: its size in world units.
export const TRAIL_WAVE = 0.9, TRAIL_WAVE_HZ = 1.2;
export function rippleTrail(from, pts, swim, tail, R) {
  const n = pts.length;
  if (!n || !Number.isFinite(swim)) return pts;
  const pace = tail > 0 ? Math.min(1, (TAU * TRAIL_WAVE_HZ) / tail) : 1, phase = swim * pace;
  const across = pts.map((o, i) => {
    const a = i ? pts[i - 1] : from || o, b = pts[Math.min(n - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    return d > 1e-6 ? { x: -dy / d, y: dx / d } : { x: 0, y: 1 };
  });
  pts.forEach((o, i) => {
    const u = (i + 1) / n, amp = R * o.s * (0.02 + 0.12 * u) * Math.sin(phase - (i + 1) * TRAIL_WAVE), nx = across[i].x, ny = across[i].y;
    // Across the line, turned to point down when the line runs level, so the wave is the same either way the creature faces.
    const k = ny < 0 || (ny === 0 && nx < 0) ? -1 : 1;
    o.x += nx * k * amp; o.y += ny * k * amp;
  });
  return pts;
}
// The line in runs that each lead steadily away from where they start ([first, last] point indexes, each run sharing its last point
// with the next). A trail is faded run by run, by distance from the run's start, so the fade follows the line even where it curves
// back past its creature in a turn.
export function trailRuns(line) {
  const runs = [];
  let a = 0, far = 0;
  for (let i = 1; i < line.length; i++) {
    const d = Math.hypot(line[i].x - line[a].x, line[i].y - line[a].y);
    if (d + 0.5 < far && i - 1 > a) { runs.push([a, i - 1]); a = i - 1; far = Math.hypot(line[i].x - line[a].x, line[i].y - line[a].y); }
    else far = Math.max(far, d);
  }
  if (line.length) runs.push([a, line.length - 1]);
  return runs;
}
// One run's fade as a gradient, out from its start: each point of the line gets the fade for how far along the trail it is (trailFade),
// so it fades to nothing at the trail's end. alpha: the whole trail's; col: an rgb triple; soft: it fades in at its start too (the card,
// where the start is not tucked behind the tail).
const softStart = (u) => { const q = Math.min(1, Math.max(0, u / 0.14)); return q * q * (3 - 2 * q); };
// back: how far behind the start the fade is measured from, about the trail's width, so its fade runs evenly across a wide ribbon.
export function trailGradient(c, line, [a, b] = [0, line.length - 1], alpha = 1, col = [255, 255, 255], soft = false, back = 0) {
  const s0 = line[a], s1 = line[Math.min(b, a + 2)], dx = s1.x - s0.x, dy = s1.y - s0.y, len = Math.hypot(dx, dy) || 1;
  const o = { x: s0.x - (dx / len) * back, y: s0.y - (dy / len) * back }, d = [];
  let far = 0;
  const near = back > 0 ? Math.max(0, back * 0.98) : 0;
  for (let i = a; i <= b; i++) { far = Math.max(far, Math.hypot(line[i].x - o.x, line[i].y - o.y)); d.push(far); }
  const g = c.createRadialGradient(o.x, o.y, 0, o.x, o.y, Math.max(far, 1e-3)), rgba = (u) => `rgba(${col[0]},${col[1]},${col[2]},${(alpha * trailFade(u) * (soft ? softStart(u) : 1)).toFixed(3)})`;
  if (near > 0 && far > near) g.addColorStop(0, rgba(line[a].u));
  for (let i = a; i <= b; i++) g.addColorStop(far > 0 ? Math.max(far > near ? near / far : 0, d[i - a] / far) : 0, rgba(line[i].u));
  if (far <= 0) g.addColorStop(1, rgba(line[b].u));
  return g;
}
// The rainbow trail as one ribbon: its six bands side by side across the line, narrowing to under half towards the far end, painted
// whole and then faded along its length, so no seam shows between the bands or along them. line: smoothTrail's points; band: one
// band's width at scale 1 (each point's s scales it); alpha: the whole trail's (fog); soft: it fades in at its start (trailGradient).
let ribbonCanvas = null;
function scratch(w, h) {
  if (!ribbonCanvas) ribbonCanvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : document.createElement('canvas');
  if (ribbonCanvas.width < w) ribbonCanvas.width = w;
  if (ribbonCanvas.height < h) ribbonCanvas.height = h;
  return ribbonCanvas;
}
export function drawRainbowRibbon(ctx, line, band, alpha = 1, soft = false) {
  const n = line.length;
  if (n < 2 || !(alpha > 0) || !(band > 0)) return;
  const across = line.map((o, i) => {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(n - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    return d > 1e-6 ? { x: -dy / d, y: dx / d } : { x: 0, y: 1 };
  });
  const half = RAINBOW.length / 2;
  // Red on top when the line runs level, whichever way the creature faces.
  const flip = across.reduce((s, v) => s + v.y, 0) < 0 ? -1 : 1;
  const edge = (i, k) => { const o = line[i], w = band * o.s * (1 - 0.55 * o.u), m = (k - half) * w * flip; return [o.x + across[i].x * m, o.y + across[i].y * m]; };
  for (const run of trailRuns(line)) {
    const [a, b] = run;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = a; i <= b; i++) for (const k of [0, RAINBOW.length]) { const [x, y] = edge(i, k); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const pad = 2, W = Math.ceil(x1 - x0) + pad * 2, H = Math.ceil(y1 - y0) + pad * 2;
    if (!(W > 0 && H > 0) || W * H > 4096 * 4096) continue;
    const cv = scratch(W, H), c = cv.getContext('2d');
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, W, H);
    c.translate(pad - x0, pad - y0);
    // Opaque bands, each a little over the next, so no gap or seam can show between them.
    RAINBOW.forEach((col, k) => {
      const out = k === RAINBOW.length - 1 ? k + 1 : k + 1.12;
      c.fillStyle = col; c.beginPath();
      for (let i = a; i <= b; i++) { const [x, y] = edge(i, k); i > a ? c.lineTo(x, y) : c.moveTo(x, y); }
      for (let i = b; i >= a; i--) { const [x, y] = edge(i, out); c.lineTo(x, y); }
      c.closePath(); c.fill();
    });
    // The fade, the same along every band.
    c.globalCompositeOperation = 'destination-in'; c.fillStyle = trailGradient(c, line, run, 0.85, undefined, soft, band * line[a].s * RAINBOW.length * 1.5); c.fillRect(x0 - pad, y0 - pad, W, H);
    c.restore();
    ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(cv, 0, 0, W, H, x0 - pad, y0 - pad, W, H); ctx.restore();
  }
}
// The star trail's glow along its line, under the stars: a wide haze and a fine thread of light, added to the water's own light so it
// glows rather than lies on it, fading with the trail. line: smoothTrail's points; mark: a star's size at scale 1; alpha: the trail's.
export function starGlow(ctx, line, mark, alpha = 1) {
  const w = mark * (line[0]?.s || 0);
  if (line.length < 2 || w < 0.4 || !(alpha > 0)) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const run of trailRuns(line)) for (const [width, a] of [[1.3, 0.07], [0.32, 0.2]]) {
    ctx.lineWidth = Math.max(0.5, w * width); ctx.strokeStyle = trailGradient(ctx, line, run, a * alpha, [255, 240, 190], false, w * 2);
    ctx.beginPath(); for (let i = run[0]; i <= run[1]; i++) (i > run[0] ? ctx.lineTo(line[i].x, line[i].y) : ctx.moveTo(line[i].x, line[i].y)); ctx.stroke();
  }
  ctx.restore();
}
