// The Reef (spec 2026-11-08-ocean-environment): corals, sponges, anemones and rock, drawn in code. Each piece has its foot at (0,0) and grows up (-y).
import { registerKit } from './set-pieces.js';

export const rng = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hex = (h) => { if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); };
export const mix = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };
const rgba = (h, a) => { const c = hex(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };

function limb(c, R, x, y, a, len, w, d, col, tip, maxD) {
  const bend = (R() - .5) * .5;
  const ex = x + Math.cos(a + bend) * len, ey = y + Math.sin(a + bend) * len;
  c.strokeStyle = mix(col, tip, Math.pow(1 - d / maxD, 1.4) * .9);
  c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * len * .55, y + Math.sin(a) * len * .55, ex, ey); c.stroke();
  if (d > 0) {
    const n = R() < .45 ? 3 : 2;
    for (let i = 0; i < n; i++) limb(c, R, ex, ey, a + bend + (i - (n - 1) / 2) * (.42 + R() * .4), len * (.66 + R() * .2), w * .76, d - 1, col, tip, maxD);
  } else { c.fillStyle = tip; c.beginPath(); c.arc(ex, ey, w * .62, 0, 6.283); c.fill(); }
}
function staghorn(c, seed, col = '#a9794f', tip = '#f4dcae', n = 13, L = 118) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) limb(c, R, (i - n / 2) * 26 + (R() - .5) * 16, 0, -1.57 + (i - n / 2) * .1 + (R() - .5) * .28, L * (.8 + R() * .4), 26, 4, col, tip, 4);
}
function brain(c, seed, r = 300, col = '#c98f4d') {
  const R = rng(seed), H = r * .92;
  const dome = new Path2D(); dome.moveTo(-r, 0); dome.bezierCurveTo(-r, -H * 1.32, r, -H * 1.32, r, 0); dome.bezierCurveTo(r * .5, r * .08, -r * .5, r * .08, -r, 0); dome.closePath();
  const g = c.createRadialGradient(-r * .25, -H * .75, r * .05, 0, -H * .45, r * 1.1);
  g.addColorStop(0, mix(col, '#ffffff', .25)); g.addColorStop(.6, col); g.addColorStop(1, mix(col, '#1a2730', .55));
  c.fillStyle = g; c.fill(dome);
  c.save(); c.clip(dome);
  for (let ring = 0; ring < 21; ring++) {
    const f = 1 - ring / 21, p = R() * 9;
    for (const [dark, off] of [[true, 0], [false, -5]]) {
      c.strokeStyle = dark ? rgba('#3a2415', .62) : rgba('#ffe9c2', .34); c.lineWidth = dark ? 7 : 3;
      c.beginPath();
      for (let u = -1; u <= 1.001; u += .018) {
        const x = u * r * f * 1.04, y = -H * f * Math.sqrt(Math.max(0, 1 - u * u)) * 1.02 + Math.sin(u * 34 + p) * 7 + Math.sin(u * 13 + p * 2) * 5 + off;
        u === -1 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    }
  }
  c.restore();
}
function table(c, seed, w = 400, col = '#7fae9a', fine = false) {
  const R = rng(seed);
  for (let tier = 0; tier < 3; tier++) {
    const y = -170 - tier * 150, rx = w * (1 - tier * .24), ry = rx * .2, dx = (R() - .5) * 60;
    c.strokeStyle = mix(col, '#22333a', .55); c.lineWidth = 56 - tier * 12; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(dx * .4, tier ? -170 - (tier - 1) * 150 : 0); c.lineTo(dx, y); c.stroke();
    c.fillStyle = mix(col, '#14242c', .62); c.beginPath(); c.ellipse(dx, y + ry * .55, rx * .97, ry, 0, 0, 6.283); c.fill();
    const g = c.createLinearGradient(0, y - ry, 0, y + ry); g.addColorStop(0, mix(col, '#fff', .35)); g.addColorStop(1, col);
    c.fillStyle = g; c.beginPath(); c.ellipse(dx, y, rx, ry, 0, 0, 6.283); c.fill();
    for (let i = 0; i < 170; i++) {
      const a = R() * 6.283, d = Math.sqrt(R()); const x = dx + Math.cos(a) * d * rx * .96, yy = y + Math.sin(a) * d * ry * .92;
      c.fillStyle = R() > .5 ? rgba('#f5fff0', .55) : rgba('#20483f', .4); c.beginPath(); c.arc(x, yy, 3.4, 0, 6.283); c.fill();
    }
    if (fine) { // growth lines fanning out from the stem, and rings where the plate grew in seasons
      c.lineCap = 'round';
      for (let i = 0; i < 90; i++) { const a = i / 90 * 6.283 + R() * .04, k = .18 + R() * .2; c.strokeStyle = rgba(R() > .5 ? '#20483f' : '#f5fff0', .05 + R() * .07); c.lineWidth = 1.5 + R() * 2; c.beginPath(); c.moveTo(dx + Math.cos(a) * rx * (k + .3), y + Math.sin(a) * ry * (k + .3)); c.lineTo(dx + Math.cos(a) * rx * .95, y + Math.sin(a) * ry * .95); c.stroke(); }
    }
    for (let i = 0; i < 64; i++) { const a = i / 64 * 6.283; c.fillStyle = mix(col, '#fff', .2 + R() * .3); c.beginPath(); c.arc(dx + Math.cos(a) * rx, y + Math.sin(a) * ry, (fine ? 5 + R() * 12 : 9 + R() * 6), 0, 6.283); c.fill(); }
  }
}
function fan(c, seed, h = 620, col = '#a553c4') {
  const R = rng(seed);
  const back = new Path2D(); back.moveTo(0, 0); back.bezierCurveTo(-h * .78, -h * .3, -h * .74, -h * 1.05, 0, -h); back.bezierCurveTo(h * .76, -h * 1.03, h * .78, -h * .32, 0, 0);
  c.fillStyle = rgba(col, .05); c.fill(back);
  c.lineCap = 'round';
  const rays = 25;
  for (let i = 0; i < rays; i++) {
    const a = -1.57 + (i / (rays - 1) - .5) * 1.86, L = h * (.82 + R() * .16);
    c.strokeStyle = mix(col, '#fff', R() * .22); c.lineWidth = 9;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a) * L * .5 + (R() - .5) * 18, Math.sin(a) * L * .5, Math.cos(a) * L, Math.sin(a) * L); c.stroke();
    c.lineWidth = 4;
    for (let j = 0; j < 7; j++) {
      const k = .3 + j * .1, x = Math.cos(a) * L * k, y = Math.sin(a) * L * k, a2 = a + (R() > .5 ? .55 : -.55);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a2) * L * .16, y + Math.sin(a2) * L * .16); c.stroke();
    }
  }
}
function sponge(c, seed, col = '#e0b13c', n = 5) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const w = 62 + R() * 42, h = 300 + R() * 330, x = (i - (n - 1) / 2) * 112 + (R() - .5) * 26, lean = (i - (n - 1) / 2) * 22;
    c.save(); c.translate(x, 0); c.transform(1, 0, lean / h, 1, 0, 0);
    const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, mix(col, '#2b2413', .5)); g.addColorStop(.42, mix(col, '#fff', .2)); g.addColorStop(1, mix(col, '#2b2413', .62));
    c.fillStyle = g; c.beginPath(); c.moveTo(-w * .78, 0); c.bezierCurveTo(-w * 1.12, -h * .4, -w * 1.08, -h * .8, -w, -h); c.lineTo(w, -h); c.bezierCurveTo(w * 1.08, -h * .8, w * 1.12, -h * .4, w * .78, 0); c.closePath(); c.fill();
    for (let k = 0; k < 120; k++) { c.fillStyle = R() > .5 ? rgba('#fff4cf', .3) : rgba('#3d2c10', .28); c.beginPath(); c.arc((R() - .5) * w * 1.9, -R() * h, 3 + R() * 4, 0, 6.283); c.fill(); }
    c.fillStyle = mix(col, '#fff', .35); c.beginPath(); c.ellipse(0, -h, w * 1.06, w * .34, 0, 0, 6.283); c.fill();
    c.fillStyle = '#1b160c'; c.beginPath(); c.ellipse(0, -h + 2, w * .74, w * .22, 0, 0, 6.283); c.fill();
    c.restore();
  }
}
function softCoral(c, seed, col = '#ef7b5a', tip = '#ffd7c2') {
  const R = rng(seed);
  c.strokeStyle = mix(col, '#f6e8d8', .6); c.lineCap = 'round';
  const heads = [];
  for (let i = 0; i < 9; i++) {
    const a = -1.57 + (i - 4) * .2 + (R() - .5) * .14, L = 240 + R() * 240, ex = Math.cos(a) * L, ey = Math.sin(a) * L;
    c.lineWidth = 42 - Math.abs(i - 4) * 3; c.beginPath(); c.moveTo((i - 4) * 12, 0); c.quadraticCurveTo(Math.cos(a) * L * .6 + (R() - .5) * 60, Math.sin(a) * L * .55, ex, ey); c.stroke();
    heads.push([ex, ey]);
  }
  for (const [hx, hy] of heads) for (let i = 0; i < 16; i++) {
    const a = R() * 6.283, d = R() * 74, r = 34 + R() * 28, x = hx + Math.cos(a) * d, y = hy + Math.sin(a) * d * .8;
    const g = c.createRadialGradient(x - r * .3, y - r * .4, 2, x, y, r); g.addColorStop(0, tip); g.addColorStop(.7, col); g.addColorStop(1, mix(col, '#3a1a20', .4));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(255,255,255,.65)';
    for (let k = 0; k < 9; k++) { c.beginPath(); c.arc(x + (R() - .5) * r * 1.5, y + (R() - .5) * r * 1.5, 2.6, 0, 6.283); c.fill(); }
  }
}
export function anemone(c, seed, col = '#d65fa0', tip = '#ffe9f4', L = 300) {
  const R = rng(seed);
  c.fillStyle = mix(col, '#2a1020', .55); c.beginPath(); c.moveTo(-120, 0); c.quadraticCurveTo(-150, -70, -95, -110); c.lineTo(95, -110); c.quadraticCurveTo(150, -70, 120, 0); c.closePath(); c.fill();
  c.lineCap = 'round';
  for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 46; i++) {
    const a = -3.05 + (i + R() * .6) / 46 * 2.96, len = L * (.72 + R() * .34) * (1 - ring * .14);
    const x0 = Math.cos(a) * 84, y0 = -104 + Math.sin(a) * 26, ex = x0 + Math.cos(a) * len, ey = y0 + Math.sin(a) * len * .95 - 34;
    const g = c.createLinearGradient(x0, y0, ex, ey); g.addColorStop(0, mix(col, '#2a1020', .25)); g.addColorStop(.7, col); g.addColorStop(1, tip);
    c.strokeStyle = g; c.lineWidth = 15 - ring * 2;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + Math.cos(a) * len * .6 + (R() - .5) * 40, y0 + Math.sin(a) * len * .5, ex, ey); c.stroke();
    c.fillStyle = tip; c.beginPath(); c.arc(ex, ey, 7.5, 0, 6.283); c.fill();
  }
}
export function rock(c, seed, w = 470, h = 420, col = '#465357', crust = true, fine = false) {
  const R = rng(seed);
  const p = new Path2D(); const N = 46;
  p.moveTo(-w, 6);
  for (let i = 1; i < N; i++) {
    const u = i / N, a = 3.1416 - u * 3.1416;
    const n = 1 + Math.sin(u * 19 + seed) * .05 + Math.sin(u * 7 + seed * 2) * .09 + (R() - .5) * .05;
    p.lineTo(Math.cos(a) * w * n, -Math.pow(Math.sin(a), .72) * h * n);
  }
  p.lineTo(w, 6); p.closePath();
  const g = c.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, mix(col, '#e8efe3', .34)); g.addColorStop(.55, col); g.addColorStop(1, mix(col, '#0e1a22', .72));
  c.fillStyle = g; c.fill(p);
  c.save(); c.clip(p);
  for (let i = 0, n = crust ? 90 : 34; i < n; i++) { // craggy shadows and lit ledges
    const x = (R() - .5) * 2 * w, y = -R() * h, L = 40 + R() * 150;
    c.strokeStyle = R() > .45 ? rgba('#091419', crust ? .3 : .22) : rgba('#e6efe2', crust ? .13 : .05); c.lineWidth = 4 + R() * 10; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + L * (R() - .5), y + L * .4 * (R() - .2)); c.lineTo(x + L * (R() - .5) * 1.4, y + L * .7 * R()); c.stroke();
  }
  if (crust) for (let i = 0; i < 1500; i++) { // fine crust of algae and tiny life
    const x = (R() - .5) * 2 * w, y = -R() * h, r = 1.5 + R() * 5, k = R();
    c.fillStyle = k < .16 ? rgba('#b96f85', .5) : k < .36 ? rgba('#62895f', .46) : k < .6 ? rgba('#dcdcc2', .18) : rgba('#091419', .3);
    c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
  }
  if (fine) { // layered ledges, branching cracks, pale crusts and a few living lights
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < 15; i++) {
      const y0 = -h * (.05 + i * .066); let x = -w, y = y0;
      const line = [[x, y]];
      while (x < w) { x += 26 + R() * 44; y = y0 + (R() - .5) * 18 + Math.sin(x * .011 + i * 1.7) * 14; line.push([x, y]); }
      for (const [dy, tone, a, lw] of [[0, '#04090e', .42, 2.5 + R() * 3], [5, '#b9cdd8', .1, 2]]) { c.strokeStyle = rgba(tone, a); c.lineWidth = lw; c.beginPath(); line.forEach(([px, py], n) => (n ? c.lineTo(px, py + dy) : c.moveTo(px, py + dy))); c.stroke(); }
    }
    for (let i = 0; i < 12; i++) {
      let x = (R() - .5) * 1.7 * w, y = -h * (.1 + R() * .8), a = 1.57 + (R() - .5) * 1.2;
      c.strokeStyle = rgba('#02060a', .6); c.lineWidth = 3 + R() * 4; c.beginPath(); c.moveTo(x, y);
      for (let k = 0, n = 5 + R() * 5; k < n; k++) { a += (R() - .5) * .9; x += Math.cos(a) * (18 + R() * 30); y += Math.sin(a) * (18 + R() * 30); c.lineTo(x, y); }
      c.stroke();
    }
    for (let i = 0; i < 26; i++) { const x = (R() - .5) * 1.9 * w, y = -R() * h, r = 12 + R() * 34; c.fillStyle = rgba(R() > .5 ? '#6f8794' : '#7b6a86', .1 + R() * .14); c.beginPath(); c.ellipse(x, y, r, r * (.35 + R() * .3), R() * .6 - .3, 0, 6.283); c.fill(); }
    for (let i = 0; i < 46; i++) { const x = (R() - .5) * 1.9 * w, y = -R() * h, r = 7 + R() * 9, g = c.createRadialGradient(x, y, 0, x, y, r), t = R() > .35 ? '#7fe9ff' : '#b7a4ff'; g.addColorStop(0, rgba(t, .85)); g.addColorStop(.3, rgba(t, .3)); g.addColorStop(1, rgba(t, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  }
  c.restore();
}

// Broken coral, shell and pale stones where the reef meets the sand.
export function coralRubble(c, seed) {
  const R = rng(seed); c.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const x = (R() - .5) * 900, y = -R() * R() * 150, L = 14 + R() * 42, a = R() * 3.14, tone = mix(R() > .5 ? '#efe2c8' : '#d9b6a0', '#7d6f5e', R() * .5);
    c.strokeStyle = tone; c.lineWidth = 6 + R() * 8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L * .45); c.stroke();
    if (R() > .55) { c.lineWidth = 4 + R() * 3; c.beginPath(); c.moveTo(x + Math.cos(a) * L * .5, y + Math.sin(a) * L * .22); c.lineTo(x + Math.cos(a + .9) * L, y + Math.sin(a + .9) * L * .4); c.stroke(); }
  }
  for (let i = 0; i < 46; i++) { const x = (R() - .5) * 920, y = -R() * R() * 120, r = 9 + R() * 22; c.fillStyle = mix('#a39a86', '#e4dcc8', R()); c.beginPath(); c.ellipse(x, y, r, r * .6, R() * .8 - .4, 0, 6.283); c.fill(); c.fillStyle = rgba('#3d3528', .25); c.beginPath(); c.ellipse(x + r * .15, y + r * .25, r * .8, r * .3, 0, 0, 6.283); c.fill(); }
}

// The Reef's kit: lists are [piece or pieces, x across a phone screen, y down it, size, flip], starting from the approved sketch.
const CORAL = ['stagA', 'stagB', 'stagC', 'softA', 'softB'], PLATE = ['tableA', 'tableB'], FAN = ['fanA', 'fanB'], SPONGE = ['spongeA', 'spongeB'], ANEMONE = ['aneA', 'aneB'], BRAIN = ['brainA', 'brainB'];
const FAR = [[PLATE, .08, .615, .42], [CORAL, .24, .62, .4], [FAN, .36, .615, .38], [BRAIN, .5, .62, .36], [PLATE, .63, .615, .4], [CORAL, .78, .615, .36], [CORAL, .92, .62, .42], ['rockB', .2, .63, .6], ['rockB', .74, .632, .66, true], ['rockC', -.03, .64, .5], ['rockC', 1.03, .64, .55, true]];
const BACK = [['rockC', .0, .72, .62], [PLATE, .13, .55, .38], [FAN, .05, .5, .36], [CORAL, .17, .68, .4], ['rockC', 1.0, .72, .66, true], [CORAL, .87, .54, .36], [PLATE, .94, .46, .34], [CORAL, .84, .69, .4], [BRAIN, .34, .72, .3], [FAN, .5, .69, .3], [CORAL, .63, .72, .36]];
const FRAME = [['rockC', -.1, .99, .82], ['rockA', .12, 1.0, .58], [PLATE, .13, .46, .56], [FAN, .03, .44, .62], [CORAL, .17, .63, .5], [BRAIN, .1, .76, .52], [SPONGE, .29, .83, .4], [CORAL, .03, .63, .46], [ANEMONE, .2, .9, .4], ['rockC', 1.1, .99, .8, true], ['rockA', .88, 1.0, .56, true], [FAN, 1.0, .5, .6], [CORAL, .93, .66, .54], [PLATE, .88, .6, .52], [CORAL, .82, .78, .5], [BRAIN, .95, .82, .52], [SPONGE, .74, .9, .4], [ANEMONE, .84, .95, .42], ['rockB', .48, 1.03, .7], [BRAIN, .42, .94, .46], [ANEMONE, .58, .95, .34], [CORAL, .34, .97, .42], [SPONGE, .62, 1.0, .34], [ANEMONE, .5, 1.0, .32]];
const EDGE = [[FAN, -.36, 1.09, .62, false], [CORAL, 1.36, 1.09, .62, false]];
const scaled = (list, k, spread = 1) => list.map(([p, x, y, s, f]) => [p, .5 + (x - .5) * spread, y, s * k, f]);

// Where each drawing sits on its square, so the live site keeps it cropped. From `node tools/place-boxes.mjs`; run it after changing a piece.
const BOXES = { stagA: [-512, -448, 468, 36], stagB: [-380, -436, 476, 16], stagC: [-484, -468, 404, 16], brainA: [-332, -304, 332, 20], brainB: [-300, -276, 300, 20], tableA: [-468, -532, 408, 4], tableB: [-400, -524, 392, 4], fanA: [-512, -664, 500, 8], fanB: [-456, -612, 464, 8], spongeA: [-300, -484, 316, 8], spongeB: [-240, -608, 248, 8], softA: [-356, -536, 404, 24], softB: [-360, -512, 336, 24], aneA: [-384, -468, 392, 0], aneB: [-356, -468, 396, 0], rockA: [-480, -840, 480, 8], rockB: [-480, -472, 480, 8], rockC: [-484, -908, 512, 8], 'giant-table': [-512, -664, 512, 4], rubble: [-464, -156, 484, 28], 'great-polyp': [-512, -684, 512, 0] };

const REEF_FLOOR = { frame: [['rubble', .5, .998, .5]] };
registerKit('reef', {
  pieces: {
    stagA: { h: 90, draw: (g) => staghorn(g, 3, '#9a6d4a', '#f2dcb2') }, stagB: { h: 90, draw: (g) => staghorn(g, 9, '#5f6fb0', '#c8d6ff') }, stagC: { h: 90, draw: (g) => staghorn(g, 14, '#a3567f', '#ffd0e6', 11) },
    brainA: { h: 240, draw: (g) => brain(g, 5, 330, '#cf9450') }, brainB: { h: 240, draw: (g) => brain(g, 12, 300, '#8fae66') },
    tableA: { h: 120, draw: (g) => table(g, 7, 420, '#79b3a0'), live: (g) => table(g, 7, 420, '#79b3a0', true) }, tableB: { h: 120, draw: (g) => table(g, 21, 380, '#c8a35c'), live: (g) => table(g, 21, 380, '#c8a35c', true) },
    fanA: { h: 80, sway: true, draw: (g) => fan(g, 4, 660, '#a24fc4') }, fanB: { h: 80, sway: true, draw: (g) => fan(g, 8, 600, '#e0577f') },
    spongeA: { h: 170, draw: (g) => sponge(g, 6, '#e3b43f') }, spongeB: { h: 170, draw: (g) => sponge(g, 16, '#d9713c', 4) },
    softA: { h: 150, sway: true, draw: (g) => softCoral(g, 2, '#ef7a5c', '#ffdcc9') }, softB: { h: 150, sway: true, draw: (g) => softCoral(g, 19, '#d65fa4', '#ffd8f0') },
    aneA: { h: 110, sway: true, draw: (g) => anemone(g, 3, '#d9629f', '#ffeef6') }, aneB: { h: 110, sway: true, draw: (g) => anemone(g, 13, '#46b6a4', '#e6fff5') },
    rockA: { h: 120, draw: (g) => rock(g, 2, 480, 760, '#465357') }, rockB: { h: 120, draw: (g) => rock(g, 11, 480, 430, '#4c5855') }, rockC: { h: 120, draw: (g) => rock(g, 23, 480, 900, '#414f54') },
    'giant-table': { h: 140, draw: (g) => { g.save(); g.scale(1.25, 1.25); table(g, 33, 400, '#8cc2ae'); g.restore(); }, live: (g) => { g.save(); g.scale(1.25, 1.25); table(g, 33, 400, '#8cc2ae', true); g.restore(); } },
    rubble: { h: 40, draw: (g) => coralRubble(g, 31) },
    'great-polyp': { h: 160, sway: true, draw: (g) => { g.save(); g.scale(1.6, 1.6); anemone(g, 41, '#7ad8c8', '#f4fff9', 260); g.restore(); } },
  },
  hoods: {
    // The smallest animals see coral up close: fewer, larger pieces.
    'tiny-garden': { far: scaled(FAR, 1.2), mid: scaled(BACK, 1.25), frame: scaled(FRAME.filter((_, i) => i % 3 !== 1), 1.12, 1.14), edge: EDGE, landmark: ['great-polyp', .5, .92, 1.0] },
    nursery: { far: scaled(FAR, 1.1), mid: scaled(BACK, 1.12), frame: scaled(FRAME.filter((_, i) => i % 4 !== 1), 1.06, 1.1), edge: EDGE, landmark: [ANEMONE, .5, .95, .75] },
    'coral-gardens': { far: FAR, mid: BACK, frame: FRAME, edge: EDGE, landmark: ['giant-table', .3, .78, .72] },
    // Bigger animals see the reef from further off.
    'reef-wall': { far: scaled(FAR, .75), mid: scaled(BACK, .78), frame: scaled(FRAME, .7), edge: EDGE, landmark: ['rockA', .5, 1.04, .62] },
  },
  more: { 'tiny-garden': REEF_FLOOR, nursery: REEF_FLOOR, 'coral-gardens': REEF_FLOOR, 'reef-wall': { frame: [['rubble', .5, .99, .42]] } },
  boxes: BOXES,
});
