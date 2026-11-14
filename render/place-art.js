// Shared scenery drawings for the zones (spec 2026-11-08-ocean-environment). Each piece has its foot at (0,0) and grows up (-y).
import { rng, mix, rock } from './place-reef.js';
export { rock };
export { anemone } from './place-reef.js';
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgba = (h, a) => { const c = hex(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };

export function kelp(c, seed, H = 975, stem = '#6f6426', leaf = '#b39a36') {
  const R = rng(seed), sway = (R() - .5) * 150, N = 40, pts = [];
  for (let i = 0; i <= N; i++) { const u = i / N; pts.push([sway * u * u + Math.sin(u * 5.2 + seed) * 30, -H * u, u]); }
  for (let i = 3; i < N; i += 1) {
    const [x, y, u] = pts[i], side = i % 2 ? 1 : -1, L = (95 + R() * 85) * (1 - .22 * u), w = 11 + R() * 9, a = -1.57 + side * (.72 + R() * .34);
    c.save(); c.translate(x, y); c.rotate(a);
    const g = c.createLinearGradient(0, 0, L, 0); g.addColorStop(0, mix(leaf, '#1f2b10', .4)); g.addColorStop(.55, leaf); g.addColorStop(1, rgba('#e8cf62', .75));
    c.fillStyle = g; c.beginPath(); c.moveTo(14, 0);
    for (let s = 0; s <= 10; s++) { const v = s / 10; c.lineTo(14 + L * v, -Math.sin(v * 3.14) * w - Math.sin(v * 15 + seed) * 3); }
    for (let s = 10; s >= 0; s--) { const v = s / 10; c.lineTo(14 + L * v, Math.sin(v * 3.14) * w * .8 + Math.sin(v * 13 + seed) * 3); }
    c.closePath(); c.fill();
    c.strokeStyle = rgba('#3d3a14', .5); c.lineWidth = 2.5; c.beginPath(); c.moveTo(14, 0); c.lineTo(14 + L * .92, 0); c.stroke();
    const gb = c.createRadialGradient(10, -4, 1, 11, 0, 15); gb.addColorStop(0, '#e6cf72'); gb.addColorStop(1, '#6d5c1f'); c.fillStyle = gb; c.beginPath(); c.ellipse(10, 0, 10, 7, 0, 0, 6.283); c.fill();
    c.restore();
  }
  c.strokeStyle = stem; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 9; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
}
export function seagrass(c, seed, n = 60, H = 330, col = '#5f9a52') {
  const R = rng(seed); c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = (R() - .5) * 520, h = H * (.5 + R() * .55), b = (R() - .5) * 150;
    c.strokeStyle = mix(col, R() > .5 ? '#d7e08a' : '#1e4a35', R() * .55); c.lineWidth = 7 + R() * 7;
    c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + b * .2, -h * .6, x + b, -h); c.stroke();
  }
}
export function urchin(c, seed, r = 90, col = '#2a1c3a') {
  const R = rng(seed); c.lineCap = 'round';
  for (let i = 0; i < 130; i++) { const a = R() * 3.14 * 1.15 - 3.14 * 1.07, L = r * (1.2 + R() * .9); c.strokeStyle = mix(col, '#8f6ac0', R() * .4); c.lineWidth = 4.5; c.beginPath(); c.moveTo(Math.cos(a) * r * .5, -r * .7 + Math.sin(a) * r * .5); c.lineTo(Math.cos(a) * L, -r * .7 + Math.sin(a) * L); c.stroke(); }
  const g = c.createRadialGradient(-r * .3, -r * 1, 4, 0, -r * .7, r); g.addColorStop(0, mix(col, '#a18ad0', .5)); g.addColorStop(1, col); c.fillStyle = g; c.beginPath(); c.ellipse(0, -r * .7, r * .95, r * .8, 0, 0, 6.283); c.fill();
}
export function piling(c, seed, H = 985, w = 44, col = '#6b5238') {
  const R = rng(seed);
  const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, mix(col, '#17110b', .55)); g.addColorStop(.4, mix(col, '#e8d0a8', .2)); g.addColorStop(1, mix(col, '#17110b', .7));
  c.fillStyle = g; c.fillRect(-w, -H, w * 2, H + 10);
  c.strokeStyle = rgba('#20150b', .45); c.lineWidth = 3;
  for (let i = 0; i < 16; i++) { const x = -w + (i + .5) * (w * 2) / 16 + (R() - .5) * 5; c.beginPath(); c.moveTo(x, -H); c.bezierCurveTo(x + (R() - .5) * 18, -H * .66, x + (R() - .5) * 18, -H * .33, x + (R() - .5) * 8, 10); c.stroke(); }
  for (let i = 0; i < 620; i++) { const y = -Math.pow(R(), 1.6) * H * .7, x = (R() - .5) * w * 2, r = 1.5 + R() * 4; c.fillStyle = R() > .4 ? rgba('#d8d2bf', .75) : rgba('#3f7a5a', .7); c.beginPath(); c.ellipse(x, y, r, r * .8, 0, 0, 6.283); c.fill(); if (r > 3.6) { c.fillStyle = rgba('#2c2a24', .75); c.beginPath(); c.arc(x, y, r * .35, 0, 6.283); c.fill(); } }
}
export function driftwood(c, seed, L = 430, col = '#8a6f4f') {
  const R = rng(seed);
  c.save(); c.rotate(-.07);
  const g = c.createLinearGradient(0, -130, 0, 0); g.addColorStop(0, mix(col, '#efe0c4', .35)); g.addColorStop(1, mix(col, '#1a130b', .6));
  c.fillStyle = g; c.beginPath(); c.moveTo(-L, -18); c.bezierCurveTo(-L * .6, -120, L * .5, -130, L, -56); c.lineTo(L * .94, 0); c.bezierCurveTo(L * .4, 16, -L * .5, 14, -L, -18); c.closePath(); c.fill();
  c.lineCap = 'round'; c.strokeStyle = mix(col, '#efe0c4', .15); c.lineWidth = 34; c.beginPath(); c.moveTo(-L * .25, -95); c.quadraticCurveTo(-L * .3, -210, -L * .08, -290); c.stroke(); c.lineWidth = 22; c.beginPath(); c.moveTo(L * .35, -100); c.quadraticCurveTo(L * .5, -160, L * .62, -215); c.stroke();
  c.strokeStyle = rgba('#2a1d10', .42); c.lineWidth = 3;
  for (let i = 0; i < 11; i++) { const y = -105 + i * 9; c.beginPath(); c.moveTo(-L * .95, y * .45); c.bezierCurveTo(-L * .3, y + (R() - .5) * 20, L * .3, y + (R() - .5) * 20, L * .96, y * .7); c.stroke(); }
  c.restore();
}
export function tubeworms(c, seed, n = 13) {
  const R = rng(seed); c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = (i - n / 2) * 42 + (R() - .5) * 20, h = 260 + R() * 340, b = (R() - .5) * 90, ex = x + b, ey = -h;
    c.strokeStyle = mix('#d9d3c2', '#6e675b', R() * .6); c.lineWidth = 26; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + b * .1, -h * .55, ex, ey); c.stroke();
    for (let k = 0; k < 34; k++) { const a = R() * 6.283, L = 44 + R() * 44; c.strokeStyle = R() > .3 ? '#d4243f' : '#ff7a5e'; c.lineWidth = 6; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + Math.cos(a) * L, ey + Math.sin(a) * L * .78 - 16); c.stroke(); }
  }
}
export function chimney(c, seed, H = 760, col = '#2c2a2e') {
  const R = rng(seed);
  const p = new Path2D(); p.moveTo(-220, 6);
  for (let i = 1; i < 26; i++) { const u = i / 26; p.lineTo(-220 + u * 160 + (R() - .5) * 30 + Math.sin(u * 9) * 18, -H * u); }
  p.lineTo(-40, -H); p.lineTo(40, -H * 1.01);
  for (let i = 25; i > 0; i--) { const u = i / 26; p.lineTo(220 - u * 160 + (R() - .5) * 30 + Math.sin(u * 8 + 2) * 18, -H * u); }
  p.lineTo(220, 6); p.closePath();
  const g = c.createLinearGradient(-200, 0, 200, 0); g.addColorStop(0, mix(col, '#000000', .4)); g.addColorStop(.42, mix(col, '#8f8680', .4)); g.addColorStop(1, mix(col, '#000000', .55)); c.fillStyle = g; c.fill(p);
  c.save(); c.clip(p); for (let i = 0; i < 44; i++) { c.strokeStyle = R() > .55 ? 'rgba(255,120,40,.6)' : 'rgba(0,0,0,.45)'; c.lineWidth = 2 + R() * 5; const x = (R() - .5) * 400, y = -R() * H; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - .5) * 110, y + 30 + R() * 90); c.stroke(); } c.restore();
}
export function column(c, seed, H = 900, w = 92, col = '#6f6a7c', broken = true, fine = false) {
  const R = rng(seed), top = broken ? H * (.6 + R() * .3) : H;
  const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, mix(col, '#07060c', .7)); g.addColorStop(.38, mix(col, '#e7e2f0', .32)); g.addColorStop(1, mix(col, '#07060c', .78));
  const p = new Path2D(); p.moveTo(-w, 4); p.lineTo(-w * .86, -top);
  if (broken) { for (let i = 1; i < 8; i++) p.lineTo(-w * .86 + i * (w * 1.72 / 8), -top - (R() - .3) * 66); }
  p.lineTo(w * .86, -top); p.lineTo(w, 4); p.closePath(); c.fillStyle = g; c.fill(p);
  c.save(); c.clip(p);
  for (let i = 0; i < 9; i++) { const x = -w + (i + .5) * w * 2 / 9; c.strokeStyle = rgba('#0a0812', .45); c.lineWidth = 7; c.beginPath(); c.moveTo(x, 4); c.lineTo(x * .9, -top - 80); c.stroke(); c.strokeStyle = rgba('#e7e2f0', .13); c.lineWidth = 3; c.beginPath(); c.moveTo(x + 7, 4); c.lineTo(x * .9 + 7, -top - 80); c.stroke(); }
  for (let i = 0; i < 6; i++) { c.fillStyle = rgba('#0a0812', .7); c.fillRect(-w * 1.1, -(i + 1) * H / 6.3, w * 2.2, 5); }
  if (fine) { // long water stains, chipped drum edges, moss gathered low, and one carved band
    c.lineCap = 'round';
    for (let i = 0; i < 60; i++) { const x = (R() - .5) * w * 2, y = -R() * top, L = 60 + R() * 240; c.strokeStyle = rgba(R() > .3 ? '#07060c' : '#cfc8dc', .08 + R() * .16); c.lineWidth = 2 + R() * 7; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (R() - .5) * 12, y + L * .5, x + (R() - .5) * 8, y + L); c.stroke(); }
    for (let i = 0; i < 6; i++) { const y = -(i + 1) * H / 6.3; for (let k = 0; k < 6; k++) { const x = (R() - .5) * w * 2, s = 4 + R() * 9; c.fillStyle = rgba('#0a0812', .55); c.beginPath(); c.moveTo(x - s, y); c.lineTo(x, y + (R() > .5 ? s : -s) * .9); c.lineTo(x + s, y + 2); c.closePath(); c.fill(); } }
    for (let i = 0; i < 240; i++) { const y = -Math.pow(R(), 2.2) * top * .62, x = (R() - .5) * w * 2, r = 3 + R() * 10; c.fillStyle = rgba(R() > .5 ? '#3f8a6c' : '#6fae7c', .16 + R() * .3); c.beginPath(); c.ellipse(x, y, r * 1.4, r * .7, R() * 3, 0, 6.283); c.fill(); }
    const band = -top * .56; c.fillStyle = rgba('#0a0812', .42); c.fillRect(-w * 1.1, band - 44, w * 2.2, 88);
    c.strokeStyle = rgba('#9f92c8', .32); c.lineWidth = 3; c.lineJoin = 'round';
    for (let x = -w * .86; x < w * .8; x += 34) { c.beginPath(); let px = x, py = band - 28; c.moveTo(px, py); for (let k = 0; k < 4; k++) { px = x + R() * 22; py = band - 28 + (k + 1) * 14; c.lineTo(px, py); } c.stroke(); }
  } else for (let i = 0; i < 400; i++) { c.fillStyle = R() > .6 ? rgba('#4f9a7c', .32) : rgba('#07060c', .3); c.beginPath(); c.arc((R() - .5) * w * 2, -R() * top, 2 + R() * 6, 0, 6.283); c.fill(); }
  c.restore();
  c.fillStyle = mix(col, '#07060c', .3); c.fillRect(-w * 1.3, -12, w * 2.6, 26);
}
export function ribs(c, seed, n = 9, R0 = 300, col = '#c9c2ae') {
  const R = rng(seed); c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 92, h = R0 * (1.25 - Math.abs(i - (n - 1) / 2) * .13);
    const g = c.createLinearGradient(x - 90, 0, x + 90, 0); g.addColorStop(0, mix(col, '#1c1a14', .5)); g.addColorStop(.5, col); g.addColorStop(1, mix(col, '#1c1a14', .6));
    c.strokeStyle = g; c.lineWidth = 30 - Math.abs(i - (n - 1) / 2) * 1.4;
    c.beginPath(); c.moveTo(x, -8); c.bezierCurveTo(x - 118, -h * .4, x - 96, -h * .94, x + 24 + (R() - .5) * 24, -h); c.stroke();
  }
  c.fillStyle = col; for (let i = -2; i < n + 2; i++) { const x = (i - (n - 1) / 2) * 92; c.beginPath(); c.ellipse(x, -4, 44, 24, 0, 0, 6.283); c.fill(); c.fillStyle = mix(col, '#1c1a14', .5); c.beginPath(); c.ellipse(x + 36, -4, 9, 16, 0, 0, 6.283); c.fill(); c.fillStyle = col; }
}
export function stoneWall(c, seed, w = 470, H = 830, col = '#5d586e') {
  const R = rng(seed);
  const shape = new Path2D(); shape.moveTo(-w, 6); shape.lineTo(-w, -H * .78); shape.lineTo(-w * .55, -H * .9); shape.lineTo(-w * .22, -H * .72); shape.lineTo(w * .12, -H); shape.lineTo(w * .66, -H * .64); shape.lineTo(w, -H * .72); shape.lineTo(w, 6); shape.closePath();
  c.save(); c.clip(shape);
  const g = c.createLinearGradient(0, -H, 0, 0); g.addColorStop(0, mix(col, '#d8d2e6', .24)); g.addColorStop(1, mix(col, '#07060c', .66)); c.fillStyle = g; c.fillRect(-w, -H, w * 2, H + 8);
  const rowH = 74;
  for (let r = 0; r * rowH < H + 20; r++) { const y = -r * rowH; c.strokeStyle = rgba('#07060c', .62); c.lineWidth = 6; c.beginPath(); c.moveTo(-w, y); c.lineTo(w, y); c.stroke(); for (let x = -w + (r % 2 ? 90 : 0); x < w; x += 150 + R() * 50) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - rowH); c.stroke(); c.fillStyle = R() > .5 ? rgba('#e0dbea', .05) : rgba('#07060c', .16); c.fillRect(x, y - rowH, 170, rowH); } }
  c.fillStyle = '#07060e'; c.beginPath(); c.moveTo(-120, 8); c.lineTo(-120, -300); c.quadraticCurveTo(-120, -470, 0, -500); c.quadraticCurveTo(120, -470, 120, -300); c.lineTo(120, 8); c.closePath(); c.fill();
  for (let i = 0; i < 700; i++) { c.fillStyle = R() > .55 ? rgba('#4f9a7c', .28) : rgba('#07060c', .26); c.beginPath(); c.arc((R() - .5) * w * 2, -R() * H, 2 + R() * 7, 0, 6.283); c.fill(); }
  c.restore();
}

// A broken stone gateway: two columns and a heavy lintel.
export function gateway(c, seed, col = '#6f6a7c', fine = false) {
  const R = rng(seed);
  c.save(); c.translate(-300, 0); column(c, seed + 1, 880, 96, col, false, fine); c.restore();
  c.save(); c.translate(300, 0); column(c, seed + 2, 880, 96, col, false, fine); c.restore();
  const g = c.createLinearGradient(0, -1000, 0, -840); g.addColorStop(0, mix(col, '#e7e2f0', .3)); g.addColorStop(1, mix(col, '#07060c', .6));
  c.fillStyle = g; c.beginPath(); c.moveTo(-440, -860); c.lineTo(-430, -1000); c.lineTo(250, -1000); c.lineTo(300, -960); c.lineTo(355, -990); c.lineTo(440, -940); c.lineTo(432, -860); c.closePath(); c.fill();
  c.strokeStyle = rgba('#07060c', .55); c.lineWidth = 6;
  for (let x = -350; x < 420; x += 120 + R() * 40) { c.beginPath(); c.moveTo(x, -860); c.lineTo(x + (R() - .5) * 20, -1000); c.stroke(); }
}
// A great stone staircase, worn and cracked.
export function steps(c, seed, col = '#615c72') {
  const R = rng(seed), N = 9;
  for (let i = 0; i < N; i++) {
    const y = -i * 78, w = 490 - i * 34, top = mix(col, '#d8d2e6', .26 - i * .01), front = mix(col, '#07060c', .58);
    c.fillStyle = front; c.fillRect(-w, y - 60, w * 2, 66);
    c.fillStyle = top; c.beginPath(); c.moveTo(-w, y - 60); c.lineTo(-w + 24, y - 80); c.lineTo(w - 24, y - 80); c.lineTo(w, y - 60); c.closePath(); c.fill();
    c.strokeStyle = rgba('#07060c', .5); c.lineWidth = 4;
    for (let k = 0; k < 7; k++) { const x = -w + R() * 2 * w; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - .5) * 30, y - 58); c.stroke(); }
    for (let k = 0; k < 40; k++) { c.fillStyle = R() > .6 ? rgba('#4f9a7c', .3) : rgba('#07060c', .25); c.beginPath(); c.arc(-w + R() * 2 * w, y - R() * 66, 2 + R() * 5, 0, 6.283); c.fill(); }
  }
}
// A colossal broken statue: head and shoulders of no one in particular, worn smooth.
export function statue(c, seed, col = '#3b374b') {
  const R = rng(seed);
  const body = new Path2D();
  body.moveTo(-470, 6); body.lineTo(-450, -300); body.quadraticCurveTo(-420, -470, -210, -500); body.lineTo(-120, -560); body.lineTo(-130, -660);
  body.quadraticCurveTo(-170, -960, 20, -980); body.quadraticCurveTo(210, -960, 170, -660); body.lineTo(150, -560); body.lineTo(250, -500); body.lineTo(330, -420); body.lineTo(300, -360); body.lineTo(370, -300); body.lineTo(350, -120); body.lineTo(420, 6); body.closePath();
  const g = c.createLinearGradient(-300, 0, 300, 0); g.addColorStop(0, mix(col, '#07060c', .7)); g.addColorStop(.42, mix(col, '#e7e2f0', .3)); g.addColorStop(1, mix(col, '#07060c', .75));
  c.fillStyle = g; c.fill(body);
  c.save(); c.clip(body);
  c.strokeStyle = rgba('#07060c', .55); c.lineCap = 'round';
  for (let i = 0; i < 16; i++) { c.lineWidth = 4 + R() * 9; c.beginPath(); let x = (R() - .5) * 700, y = -R() * 900; c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (R() - .5) * 90; y += 30 + R() * 70; c.lineTo(x, y); } c.stroke(); }
  for (let i = 0; i < 700; i++) { c.fillStyle = R() > .7 ? rgba('#4f9a7c', .2) : rgba('#07060c', .22); c.beginPath(); c.arc((R() - .5) * 940, -R() * 1000, 2 + R() * 5, 0, 6.283); c.fill(); }
  c.restore();
}
// A stone cabinet of curiosities, its shelves holding fossils.
export function fossilCabinet(c, seed, col = '#5e5972') {
  const R = rng(seed);
  const shape = new Path2D(); shape.moveTo(-340, 6); shape.lineTo(-340, -680); shape.quadraticCurveTo(0, -920, 340, -680); shape.lineTo(340, 6); shape.closePath();
  const g = c.createLinearGradient(-340, 0, 340, 0); g.addColorStop(0, mix(col, '#07060c', .6)); g.addColorStop(.45, mix(col, '#e7e2f0', .25)); g.addColorStop(1, mix(col, '#07060c', .65));
  c.fillStyle = g; c.fill(shape);
  for (let i = 0; i < 3; i++) {
    const y = -60 - i * 210;
    c.fillStyle = '#0b0912'; c.fillRect(-270, y - 170, 540, 170);
    c.fillStyle = mix(col, '#d8d2e6', .2); c.fillRect(-290, y - 12, 580, 22);
    for (let k = 0; k < 3; k++) {
      const x = -180 + k * 180, r = 42 + R() * 22, yy = y - r - 8;
      c.fillStyle = '#b5ad98'; c.beginPath(); c.arc(x, yy, r, 0, 6.283); c.fill();
      c.strokeStyle = '#4c4538'; c.lineWidth = 4; c.beginPath();
      for (let a = 0; a < 16; a += 0.25) { const q = r * (1 - a / 17), px = x + Math.cos(a) * q, py = yy + Math.sin(a) * q; a ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke();
    }
  }
}
// The glowing crack in the sea floor.
export function crack(c, seed) {
  const R = rng(seed), glow = c.createRadialGradient(0, -60, 0, 0, -60, 470);
  glow.addColorStop(0, 'rgba(255,120,40,.55)'); glow.addColorStop(.5, 'rgba(255,90,40,.18)'); glow.addColorStop(1, 'rgba(255,80,40,0)');
  c.fillStyle = glow; c.fillRect(-500, -560, 1000, 620);
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [w, col] of [[26, 'rgba(255,90,30,.5)'], [12, 'rgba(255,150,60,.9)'], [4, 'rgba(255,240,190,1)']]) {
    const r = rng(seed + 1); c.strokeStyle = col; c.lineWidth = w; c.beginPath();
    let x = -470; c.moveTo(x, -16 + (r() - .5) * 26);
    while (x < 470) { x += 22 + r() * 44; c.lineTo(x, -16 + (r() - .5) * 34); }
    c.stroke();
  }
}

// The same bridge, built of staggered wedge stones with worn edges and glowing growth along its underside.
export function stoneBridgeFine(c, seed, col = '#2a3440') {
  const R = rng(seed);
  const p = new Path2D(); p.moveTo(-500, -520); p.quadraticCurveTo(0, -640, 500, -520); p.lineTo(500, -300); p.quadraticCurveTo(0, -480, -500, -300); p.closePath();
  const g = c.createLinearGradient(0, -640, 0, -300); g.addColorStop(0, mix(col, '#b9c8d8', .34)); g.addColorStop(1, mix(col, '#02060c', .65));
  c.fillStyle = g; c.fill(p);
  c.save(); c.clip(p); c.lineJoin = 'round'; c.lineCap = 'round';
  const top = (x) => -520 - 120 * (1 - (x / 500) ** 2) * .5, ROWS = 5, band = 220 / ROWS;
  for (let r = 0; r < ROWS; r++) {
    let x = -520 + (r % 2 ? 40 + R() * 30 : R() * 30);
    while (x < 520) {
      const w = 62 + R() * 46, y0 = top(x) + r * band - (x / 500) ** 2 * 0, y1 = top(x + w) + r * band;
      c.fillStyle = R() > .5 ? rgba('#d4e0ea', .03 + R() * .06) : rgba('#02060c', .06 + R() * .16);
      c.beginPath(); c.moveTo(x, y0); c.lineTo(x + w, y1); c.lineTo(x + w, y1 + band); c.lineTo(x, y0 + band); c.closePath(); c.fill();
      c.strokeStyle = rgba('#02060c', .62); c.lineWidth = 3.5 + R() * 2.5; c.stroke();
      c.strokeStyle = rgba('#c6d6e2', .14); c.lineWidth = 2; c.beginPath(); c.moveTo(x + 3, y0 + 5); c.lineTo(x + w - 3, y1 + 5); c.stroke();
      x += w;
    }
  }
  for (let i = 0; i < 90; i++) { const x = (R() - .5) * 990, y = -300 - (1 - (x / 500) ** 2) * 90 - R() * 30, r = 5 + R() * 7, h = c.createRadialGradient(x, y, 0, x, y, r), t = R() > .4 ? '#7fe9ff' : '#b7a4ff'; h.addColorStop(0, rgba(t, .8)); h.addColorStop(1, rgba(t, 0)); c.fillStyle = h; c.fillRect(x - r, y - r, r * 2, r * 2); }
  c.restore();
}

// A stone bridge across the canyon.
export function stoneBridge(c, seed, col = '#2a3440') {
  const R = rng(seed);
  const p = new Path2D(); p.moveTo(-500, -520); p.quadraticCurveTo(0, -640, 500, -520); p.lineTo(500, -300); p.quadraticCurveTo(0, -480, -500, -300); p.closePath();
  const g = c.createLinearGradient(0, -640, 0, -300); g.addColorStop(0, mix(col, '#b9c8d8', .34)); g.addColorStop(1, mix(col, '#02060c', .65));
  c.fillStyle = g; c.fill(p);
  c.save(); c.clip(p); c.strokeStyle = rgba('#02060c', .55); c.lineWidth = 5;
  for (let x = -490; x < 500; x += 74 + R() * 30) { c.beginPath(); c.moveTo(x, -650); c.lineTo(x + (R() - .5) * 26, -280); c.stroke(); }
  for (let y = -600; y < -280; y += 64) { c.beginPath(); c.moveTo(-510, y); c.quadraticCurveTo(0, y - 110, 510, y); c.stroke(); }
  c.restore();
}
// An old submarine resting on the floor, its plates rusted and its portholes dark.
export function submarine(c, seed, col = '#4d4a3f') {
  const R = rng(seed);
  c.save(); c.rotate(-.06);
  const p = new Path2D(); p.ellipse(0, -170, 480, 150, 0, 0, 6.283);
  const g = c.createLinearGradient(0, -320, 0, -20); g.addColorStop(0, mix(col, '#c9c0a2', .3)); g.addColorStop(.55, col); g.addColorStop(1, mix(col, '#050608', .75));
  c.fillStyle = g; c.fill(p);
  c.fillStyle = mix(col, '#050608', .25); c.fillRect(-90, -420, 180, 130); c.fillRect(-40, -490, 24, 80);
  c.save(); c.clip(p);
  c.strokeStyle = rgba('#050608', .5); c.lineWidth = 4;
  for (let x = -470; x < 480; x += 60) { c.beginPath(); c.moveTo(x, -330); c.lineTo(x, -10); c.stroke(); }
  for (let i = 0; i < 260; i++) { c.fillStyle = R() > .5 ? rgba('#8a4b24', .4) : rgba('#050608', .25); c.beginPath(); c.arc((R() - .5) * 960, -20 - R() * 310, 3 + R() * 12, 0, 6.283); c.fill(); }
  c.restore();
  for (const x of [-300, -180, 180, 300]) { c.fillStyle = '#0b1218'; c.beginPath(); c.arc(x, -190, 26, 0, 6.283); c.fill(); c.strokeStyle = '#8d8974'; c.lineWidth = 7; c.beginPath(); c.arc(x, -190, 26, 0, 6.283); c.stroke(); }
  c.restore();
}
// Hanging strands of living light.
export function lightCurtain(c, seed, col = '#6fd9ff') {
  const R = rng(seed); c.lineCap = 'round';
  for (let i = 0; i < 36; i++) {
    const x = -470 + (i + R()) * 26, top = -980 + R() * 120, bottom = top + 340 + R() * 460;
    c.strokeStyle = rgba(col, .18 + R() * .25); c.lineWidth = 3; c.beginPath(); c.moveTo(x, top); c.quadraticCurveTo(x + (R() - .5) * 60, (top + bottom) / 2, x + (R() - .5) * 26, bottom); c.stroke();
    for (let y = top; y < bottom; y += 34 + R() * 40) { const glow = c.createRadialGradient(x, y, 0, x, y, 11); glow.addColorStop(0, rgba('#f2feff', .9)); glow.addColorStop(1, rgba(col, 0)); c.fillStyle = glow; c.fillRect(x - 11, y - 11, 22, 22); }
  }
}
// A soft cloud of sparks.
export function glowCloud(c, seed, col = '#74e9ff') {
  const R = rng(seed), g = c.createRadialGradient(0, -400, 0, 0, -400, 380);
  g.addColorStop(0, rgba(col, .32)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(-400, -800, 800, 800);
  for (let i = 0; i < 180; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * 340, x = Math.cos(a) * d, y = -400 + Math.sin(a) * d * .9, r = 3 + R() * 7, h = c.createRadialGradient(x, y, 0, x, y, r * 2); h.addColorStop(0, rgba('#f0ffff', .95)); h.addColorStop(1, rgba(col, 0)); c.fillStyle = h; c.fillRect(x - r * 2, y - r * 2, r * 4, r * 4); }
}

// A lost lobster trap, its slats furred with growth.
export function lobsterTrap(c, seed, col = '#7a6a4a') {
  const R = rng(seed);
  c.save(); c.rotate(-.05);
  const w = 360, h = 260;
  c.fillStyle = rgba('#10160f', .55); c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w, -h * .7); c.quadraticCurveTo(0, -h * 1.3, w, -h * .7); c.lineTo(w, 0); c.closePath(); c.fill();
  c.strokeStyle = mix(col, '#f0e0b8', .2); c.lineCap = 'round';
  for (let i = 0; i <= 12; i++) { const x = -w + (i / 12) * 2 * w; c.lineWidth = 11; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, -h * (.7 + .6 * (1 - Math.pow(Math.abs(x / w), 2)) * .9)); c.stroke(); }
  for (const f of [.2, .5, .8]) { c.lineWidth = 9; c.beginPath(); for (let i = 0; i <= 20; i++) { const x = -w + (i / 20) * 2 * w, y = -f * h * (.7 + .6 * (1 - Math.pow(Math.abs(x / w), 2)) * .9) * 1; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  for (let i = 0; i < 180; i++) { c.fillStyle = R() > .5 ? rgba('#3f7a5a', .55) : rgba('#c4b48a', .4); c.beginPath(); c.arc((R() - .5) * 2 * w, -R() * h * 1.1, 3 + R() * 6, 0, 6.283); c.fill(); }
  c.restore();
}
// A shaft of sun coming down through the canopy.
export function sunbeam(c, col = '#fff0b4') {
  // Soft-edged: many thin layers, each narrower, so no hard line shows.
  for (let k = 0; k < 12; k++) {
    const w = 1 - k * 0.075, g = c.createLinearGradient(0, -980, 0, 0);
    g.addColorStop(0, rgba(col, 0.07)); g.addColorStop(0.75, rgba(col, 0.016)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.moveTo(-110 * w, -985); c.lineTo(110 * w, -985); c.lineTo(340 * w, 0); c.lineTo(-340 * w, 0); c.closePath(); c.fill();
  }
}

// A half-buried rowing boat.
export function rowingBoat(c, seed, col = '#8a5a34') {
  const R = rng(seed);
  c.save(); c.rotate(-.1);
  const hull = new Path2D(); hull.moveTo(-430, -150); hull.quadraticCurveTo(-300, 20, 0, 30); hull.quadraticCurveTo(320, 20, 450, -190); hull.quadraticCurveTo(0, -120, -430, -150); hull.closePath();
  const g = c.createLinearGradient(0, -190, 0, 30); g.addColorStop(0, mix(col, '#f1dcb4', .3)); g.addColorStop(1, mix(col, '#160e08', .68));
  c.fillStyle = g; c.fill(hull);
  c.save(); c.clip(hull); c.strokeStyle = rgba('#21150c', .55); c.lineWidth = 5;
  for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(-460, -150 + i * 24); c.quadraticCurveTo(0, -130 + i * 32, 470, -190 + i * 26); c.stroke(); }
  for (let i = 0; i < 150; i++) { c.fillStyle = R() > .5 ? rgba('#3f7a5a', .5) : rgba('#d8d2bf', .5); c.beginPath(); c.arc((R() - .5) * 860, -R() * 170, 2 + R() * 6, 0, 6.283); c.fill(); }
  c.restore();
  c.strokeStyle = mix(col, '#f1dcb4', .35); c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(-430, -150); c.quadraticCurveTo(0, -120, 450, -190); c.stroke();
  c.lineWidth = 12; c.strokeStyle = mix(col, '#160e08', .3); for (const x of [-180, 90]) { c.beginPath(); c.moveTo(x, -128); c.lineTo(x + 18, -44); c.stroke(); }
  c.restore();
}
// A scatter of shells and small stones.
export function shells(c, seed) {
  const R = rng(seed);
  for (let i = 0; i < 26; i++) {
    const x = (R() - .5) * 860, y = -R() * 90, r = 14 + R() * 26, a = R() * .8 - .4;
    c.save(); c.translate(x, y); c.rotate(a);
    if (R() > .45) {
      c.fillStyle = R() > .5 ? '#e9dcc4' : '#d9a98e';
      c.beginPath(); c.moveTo(0, r * .5); for (let k = 0; k <= 8; k++) { const b = Math.PI + (k / 8) * Math.PI; c.lineTo(Math.cos(b) * r, Math.sin(b) * r * .9 + (k % 2) * 2); } c.closePath(); c.fill();
      c.strokeStyle = rgba('#7a6448', .55); c.lineWidth = 2; for (let k = 1; k < 8; k += 2) { const b = Math.PI + (k / 8) * Math.PI; c.beginPath(); c.moveTo(0, r * .5); c.lineTo(Math.cos(b) * r * .95, Math.sin(b) * r * .86); c.stroke(); }
    } else { c.fillStyle = mix('#8d8676', '#cfc7b4', R()); c.beginPath(); c.ellipse(0, 0, r, r * .62, 0, 0, 6.283); c.fill(); }
    c.restore();
  }
}
// One great leaf with a bead of water on it, for the very smallest visitors.
export function dewdropLeaf(c) {
  const leaf = new Path2D(); leaf.moveTo(-470, -40); leaf.bezierCurveTo(-260, -470, 280, -430, 470, -130); leaf.bezierCurveTo(250, 30, -220, 40, -470, -40); leaf.closePath();
  const g = c.createLinearGradient(0, -420, 0, 20); g.addColorStop(0, '#9dc562'); g.addColorStop(1, '#3f6b33'); c.fillStyle = g; c.fill(leaf);
  c.strokeStyle = 'rgba(232,245,190,.55)'; c.lineWidth = 8; c.beginPath(); c.moveTo(-470, -40); c.quadraticCurveTo(0, -190, 470, -130); c.stroke(); c.lineWidth = 4;
  for (let i = -3; i <= 3; i++) { const x = i * 120; c.beginPath(); c.moveTo(x, -135 - Math.abs(i) * 4); c.quadraticCurveTo(x + 40, -240, x + 100, -330 + Math.abs(i) * 34); c.moveTo(x, -135 - Math.abs(i) * 4); c.quadraticCurveTo(x + 40, -60, x + 90, 2 - Math.abs(i) * 10); c.stroke(); }
  const d = c.createRadialGradient(-30, -350, 8, 10, -300, 118); d.addColorStop(0, 'rgba(255,255,255,.95)'); d.addColorStop(.5, 'rgba(190,232,240,.55)'); d.addColorStop(1, 'rgba(120,190,205,.85)');
  c.fillStyle = d; c.beginPath(); c.arc(10, -300, 110, 0, 6.283); c.fill();
}
// A rock crowded with barnacles.
export function barnacleStone(c, seed) {
  rock(c, seed, 470, 480, '#5d5a4e');
  const R = rng(seed + 1);
  for (let i = 0; i < 180; i++) { const a = Math.PI + R() * Math.PI, d = Math.sqrt(R()), x = Math.cos(a) * d * 430, y = Math.sin(a) * d * 420, r = 10 + R() * 22; c.fillStyle = '#d8d2bf'; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); c.fillStyle = '#39362c'; c.beginPath(); c.arc(x, y, r * .42, 0, 6.283); c.fill(); }
}
// Arching mangrove roots coming down into the shallows.
export function mangroveRoots(c, seed, col = '#5b4934') {
  const R = rng(seed); c.lineCap = 'round';
  for (let i = 0; i < 16; i++) { const x = -440 + i * 58 + (R() - .5) * 30, top = -640 - R() * 220, lean = (R() - .5) * 200; c.strokeStyle = mix(col, '#d8c8a8', R() * .35); c.lineWidth = 20 + R() * 20; c.beginPath(); c.moveTo(lean * .4, top); c.bezierCurveTo(lean, top * .55, x * .7, top * .3, x, 2); c.stroke(); }
  const g = c.createLinearGradient(-58, 0, 58, 0); g.addColorStop(0, mix(col, '#0e0a06', .55)); g.addColorStop(.5, mix(col, '#d8c8a8', .25)); g.addColorStop(1, mix(col, '#0e0a06', .65)); c.fillStyle = g; c.fillRect(-58, -985, 116, 340);
}
// A row of old pier posts under a sagging deck.
export function oldPier(c, seed) {
  for (const x of [-370, -130, 120, 360]) { c.save(); c.translate(x, 0); piling(c, seed + x, 930 + (x % 7) * 4, 38); c.restore(); }
  const g = c.createLinearGradient(0, -985, 0, -880); g.addColorStop(0, '#8e6a48'); g.addColorStop(1, '#3a2717'); c.fillStyle = g;
  c.save(); c.rotate(-.02); c.fillRect(-470, -960, 940, 66); c.strokeStyle = 'rgba(30,18,10,.6)'; c.lineWidth = 5; for (let x = -460; x < 470; x += 92) { c.beginPath(); c.moveTo(x, -960); c.lineTo(x, -894); c.stroke(); } c.restore();
}

// A raft of golden weed drifting at the surface, its strands hanging down.
export function weedRaft(c, seed, col = '#b18b2f') {
  const R = rng(seed); c.lineCap = 'round';
  for (let i = 0; i < 30; i++) {
    const x = -420 + i * 29 + (R() - .5) * 18, top = -930 + R() * 50, L = 260 + R() * 560, sway = (R() - .5) * 90;
    c.strokeStyle = mix(col, '#4c3c12', R() * .55); c.lineWidth = 5 + R() * 5; c.beginPath(); c.moveTo(x, top); c.quadraticCurveTo(x + sway, top + L * .5, x + sway * .4, top + L); c.stroke();
    for (let k = 0; k < 12; k++) {
      const u = k / 12, px = x + sway * u * (2 - u) * .5, py = top + L * u, r = 11 + R() * 14, a = (R() > .5 ? .8 : -.8) + (R() - .5) * .5;
      c.fillStyle = mix(col, '#e6c864', R() * .6); c.beginPath(); c.ellipse(px + Math.cos(a) * r, py + Math.sin(a) * r * .7, r, r * .42, a, 0, 6.283); c.fill();
      if (k % 3 === 0) { c.fillStyle = mix(col, '#f0dc8c', .5); c.beginPath(); c.arc(px - Math.cos(a) * r * .7, py, 7, 0, 6.283); c.fill(); }
    }
  }
  for (let i = 0; i < 220; i++) {
    const x = (R() - .5) * 930, y = -925 + (R() - .5) * 70 * (1 - Math.abs(x) / 620), r = 12 + R() * 22, a = R() * 3;
    c.fillStyle = mix(col, R() > .5 ? '#f0dc8c' : '#4c3c12', R() * .55); c.beginPath(); c.ellipse(x, y, r, r * .5, a, 0, 6.283); c.fill();
  }
}
// A seamount rising out of the dark, far off.
export function seamount(c, seed) {
  const R = rng(seed), p = new Path2D(); p.moveTo(-500, 6); let x = -500, y = 0;
  while (x < 500) { x += 28 + R() * 34; const u = 1 - Math.pow(Math.abs(x) / 500, 1.6); y = -880 * Math.max(0, u) * (0.9 + R() * 0.14); p.lineTo(x, y); }
  p.lineTo(500, 6); p.closePath();
  const g = c.createLinearGradient(0, -900, 0, 0); g.addColorStop(0, '#16426a'); g.addColorStop(.5, '#0a2542'); g.addColorStop(1, '#03101e');
  c.fillStyle = g; c.fill(p);
}

// ---- Finer work for the live site only. Reels keep the drawings above. ----

// A sunbeam drawn in rows, one soft layer deep: stacked see-through gradients show a woven pattern when stretched.
export function softSunbeam(c, col = '#fff0b4') {
  const [r, g, b] = hex(col), ROW = 4;
  for (let y = -988; y < 0; y += ROW) {
    const u = (y + 988) / 988, half = 110 + (340 - 110) * u, a = 0.42 * Math.min(1, u * 7) * Math.pow(1 - u, 1.25) + 0.0;
    const fill = c.createLinearGradient(-half, 0, half, 0);
    for (const [k, v] of [[0, 0], [.22, .34], [.5, 1], [.78, .34], [1, 0]]) fill.addColorStop(k, `rgba(${r},${g},${b},${a * v})`);
    c.fillStyle = fill; c.fillRect(-half, y, half * 2, ROW);
  }
}
// A wet tide line, a turn or two of old rope, and weed trailing from a pier post.
export function pilingDetail(c, seed, H = 985, w = 44) {
  const R = rng(seed + 50); c.lineCap = 'round';
  const wet = c.createLinearGradient(0, -H * .78, 0, -H * .6); wet.addColorStop(0, 'rgba(20,14,8,0)'); wet.addColorStop(1, 'rgba(20,14,8,.3)');
  c.fillStyle = wet; c.fillRect(-w, -H * .78, w * 2, H * .78 + 8);
  for (const y0 of [-H * (.52 + R() * .05)]) for (let k = 0; k < 4; k++) {
    const y = y0 + k * 8; c.strokeStyle = mix('#7d6a4c', '#3f3222', R() * .6); c.lineWidth = 6.5; c.beginPath(); c.moveTo(-w, y + 3); c.quadraticCurveTo(0, y - 4, w, y + 2); c.stroke();
    c.strokeStyle = 'rgba(30,20,10,.4)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-w, y + 6); c.quadraticCurveTo(0, y - 1, w, y + 5); c.stroke();
  }
  for (let i = 0; i < 16; i++) {
    const x = (R() - .5) * w * 1.7, y = -H * (.08 + R() * .4), L = 24 + R() * 60, b = (R() - .5) * 14;
    c.strokeStyle = mix('#35644a', '#6f8f58', R()); c.lineWidth = 2.5 + R() * 2.5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + b * .3, y + L * .5, x + b, y + L); c.stroke();
  }
  for (let i = 0; i < 70; i++) { const y = -Math.pow(R(), 2) * H * .22, x = (R() - .5) * w * 2, r = 6 + R() * 9; c.fillStyle = mix('#1b2533', '#3f5468', R()); c.beginPath(); c.ellipse(x, y, r * .7, r, R() * 1.2 - .6, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(190,210,225,.4)'; c.lineWidth = 1.5; c.stroke(); }
}
// Starfish, whelks and pebbles on the sand.
export function sandLife(c, seed) {
  const R = rng(seed);
  for (let i = 0; i < 70; i++) { const x = (R() - .5) * 920, y = -R() * R() * 130, r = 6 + R() * 16; c.fillStyle = mix('#8f8675', '#ddd4c0', R()); c.beginPath(); c.ellipse(x, y, r, r * .6, R() - .5, 0, 6.283); c.fill(); }
  for (const [x, y, r, col, a] of [[-250, -66, 62, '#d9673f', .3], [210, -38, 48, '#c4507e', -.5], [40, -112, 38, '#e8a040', 1.1]]) {
    c.save(); c.translate(x, y); c.rotate(a); c.scale(1, .72);
    const p = new Path2D();
    for (let k = 0; k < 10; k++) { const q = -1.57 + k * .6283, d = k % 2 ? r * .36 : r, px = Math.cos(q) * d, py = Math.sin(q) * d; k ? p.lineTo(px, py) : p.moveTo(px, py); }
    p.closePath(); c.lineJoin = 'round'; c.strokeStyle = col; c.lineWidth = r * .24; c.stroke(p); c.fillStyle = col; c.fill(p);
    c.fillStyle = 'rgba(255,240,215,.7)';
    for (let k = 0; k < 5; k++) { const q = -1.57 + k * 1.2566; for (let j = 1; j < 6; j++) { c.beginPath(); c.arc(Math.cos(q) * r * j * .17, Math.sin(q) * r * j * .17, r * .045, 0, 6.283); c.fill(); } }
    c.restore();
  }
  for (const [x, y, r] of [[-90, -30, 34], [330, -78, 28], [-400, -48, 26]]) {
    c.save(); c.translate(x, y); c.rotate(-.3);
    const g = c.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, '#f1e3c9'); g.addColorStop(1, '#a98658'); c.fillStyle = g; c.beginPath(); c.moveTo(-r * 1.2, r * .45); c.quadraticCurveTo(-r * .3, -r * .9, r, -r * .1); c.quadraticCurveTo(r * .4, r * .75, -r * 1.2, r * .45); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(100,70,40,.55)'; c.lineWidth = 2.5; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(-r * .9 + k * r * .34, -r * .5 + k * .5); c.quadraticCurveTo(-r * .7 + k * r * .34, r * .2, -r * .9 + k * r * .32, r * .5); c.stroke(); }
    c.restore();
  }
}
// A low hazy line of seagrass meadow, far off across the sand.
export function meadow(c, seed, col = '#4f8f6a') {
  const R = rng(seed); c.lineCap = 'round';
  c.fillStyle = col; c.beginPath(); c.moveTo(-512, 4); let y = -60;
  for (let x = -512; x <= 512; x += 36) { y = -60 - Math.sin(x * .006 + seed) * 26 - R() * 20; c.lineTo(x, y); }
  c.lineTo(512, 4); c.closePath(); c.fill();
  for (let i = 0; i < 300; i++) { const x = (R() - .5) * 1010, h = 50 + R() * 90, b = (R() - .5) * 40; c.strokeStyle = mix(col, R() > .5 ? '#a8d08a' : '#23543f', R() * .7); c.lineWidth = 5 + R() * 4; c.beginPath(); c.moveTo(x, -40); c.quadraticCurveTo(x + b * .3, -40 - h * .6, x + b, -40 - h); c.stroke(); }
}
// Young kelp and red weed on the rocks.
export function kelpSprouts(c, seed) {
  const R = rng(seed); c.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const x = (R() - .5) * 860, h = 110 + R() * 230, b = (R() - .5) * 110, red = R() > .68;
    c.strokeStyle = red ? mix('#9c3f4a', '#d97a5a', R()) : mix('#7a6a2a', '#c4ab45', R()); c.lineWidth = 5 + R() * 4;
    c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + b * .2, -h * .6, x + b, -h); c.stroke();
    for (let k = 2; k < 8; k++) { const u = k / 8, px = x + b * u * u, py = -h * u, side = k % 2 ? 1 : -1, L = (red ? 22 : 34) + R() * 22; c.fillStyle = red ? mix('#a8434f', '#e08a68', R()) : mix('#8d7a2c', '#d8bd58', R()); c.save(); c.translate(px, py); c.rotate(-1.57 + side * (.7 + R() * .3)); c.beginPath(); c.ellipse(L * .5, 0, L * .55, red ? 5 : 8, 0, 0, 6.283); c.fill(); c.restore(); }
  }
}
// A seamount with ridges and light down one face, in place of a flat shape.
export function seamountFine(c, seed) {
  const R = rng(seed), p = new Path2D(), ridge = []; p.moveTo(-500, 6); let x = -500, y = 0;
  while (x < 500) { x += 28 + R() * 34; const u = 1 - Math.pow(Math.abs(x) / 500, 1.6); y = -880 * Math.max(0, u) * (0.9 + R() * 0.14); p.lineTo(x, y); ridge.push([x, y]); }
  p.lineTo(500, 6); p.closePath();
  const g = c.createLinearGradient(0, -900, 0, 0); g.addColorStop(0, '#16426a'); g.addColorStop(.5, '#0a2542'); g.addColorStop(1, '#03101e');
  c.fillStyle = g; c.fill(p);
  c.save(); c.clip(p); c.lineJoin = 'round';
  for (let i = 0; i < ridge.length; i += 2) {
    const [rx, ry] = ridge[i], lit = rx < 40;
    let px = rx, py = ry, w = 42 + R() * 60; c.beginPath(); c.moveTo(px, py);
    const pts = [[px, py]];
    while (py < 6) { py += 60 + R() * 90; px += (rx < 0 ? -1 : 1) * (10 + R() * 60) + (R() - .5) * 40; pts.push([px, py]); c.lineTo(px, py); }
    for (let k = pts.length - 1; k >= 0; k--) c.lineTo(pts[k][0] + w * (lit ? 1 : -1), pts[k][1] + 18);
    c.closePath(); c.fillStyle = lit ? rgba('#3f7fae', .05 + R() * .07) : rgba('#01060e', .12 + R() * .16); c.fill();
    c.strokeStyle = rgba(lit ? '#6fa6cc' : '#01060e', .16); c.lineWidth = 2.5; c.beginPath(); pts.forEach(([a, b], n) => (n ? c.lineTo(a, b) : c.moveTo(a, b))); c.stroke();
  }
  const fade = c.createLinearGradient(0, -260, 0, 6); fade.addColorStop(0, 'rgba(3,16,30,0)'); fade.addColorStop(1, 'rgba(3,16,30,.85)'); c.fillStyle = fade; c.fillRect(-512, -260, 1024, 270);
  c.restore();
}
// Loose clumps of weed drifting below the raft.
export function weedDrift(c, seed, col = '#b18b2f') {
  const R = rng(seed);
  for (let n = 0; n < 7; n++) {
    const cx = (R() - .5) * 860, cy = -980 + R() * 900, s = 26 + R() * 44;
    for (let i = 0; i < 44; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * s * 1.7, r = 6 + R() * 11; c.fillStyle = mix(col, R() > .5 ? '#f0dc8c' : '#4c3c12', R() * .55); c.beginPath(); c.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .6, r, r * .5, R() * 3, 0, 6.283); c.fill(); }
  }
}
// Pale sea whips and stalked sea lilies, on the floor of the dark.
export function seaWhips(c, seed) {
  const R = rng(seed); c.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const x = (R() - .5) * 840, h = 170 + R() * 420, b = (R() - .5) * 140;
    c.strokeStyle = mix('#c9d6df', '#5f7686', R()); c.lineWidth = 5 + R() * 5; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + b * .1, -h * .6, x + b, -h); c.stroke();
    if (i % 3 === 0) { const ex = x + b, ey = -h; for (let k = 0; k < 11; k++) { const a = -2.9 + k * .27, L = 40 + R() * 44; c.strokeStyle = mix('#f1d9e8', '#a77fa0', R()); c.lineWidth = 3.5; c.beginPath(); c.moveTo(ex, ey); c.quadraticCurveTo(ex + Math.cos(a) * L * .6, ey + Math.sin(a) * L * .9 - 10, ex + Math.cos(a) * L, ey + Math.sin(a) * L + 20); c.stroke(); } }
    else for (let k = 0; k < 7; k++) { const u = R(), g = c.createRadialGradient(x + b * u * u, -h * u, 0, x + b * u * u, -h * u, 11); g.addColorStop(0, 'rgba(160,240,255,.85)'); g.addColorStop(1, 'rgba(160,240,255,0)'); c.fillStyle = g; c.fillRect(x + b * u * u - 11, -h * u - 11, 22, 22); }
  }
}
// Fallen drums of old columns and broken blocks.
export function stoneRubble(c, seed, col = '#4a4560') {
  const R = rng(seed);
  for (let i = 0; i < 9; i++) {
    const x = -420 + i * 105 + (R() - .5) * 40, w = 50 + R() * 58, h = 44 + R() * 70, a = (R() - .5) * .5;
    c.save(); c.translate(x, -h * .5); c.rotate(a);
    const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, mix(col, '#d8d2e6', .3)); g.addColorStop(1, mix(col, '#07060c', .7)); c.fillStyle = g;
    c.beginPath(); c.moveTo(-w, -h / 2); c.lineTo(w * .3, -h / 2 - R() * 14); c.lineTo(w, -h / 2 + R() * 10); c.lineTo(w, h / 2); c.lineTo(-w, h / 2); c.closePath(); c.fill();
    c.strokeStyle = rgba('#07060c', .5); c.lineWidth = 3.5; for (let k = 0; k < 4; k++) { const px = -w + R() * 2 * w; c.beginPath(); c.moveTo(px, -h / 2); c.lineTo(px + (R() - .5) * 18, h / 2); c.stroke(); }
    c.restore();
  }
  c.save(); c.translate(90, -66); c.rotate(.08);
  const drum = c.createLinearGradient(0, -70, 0, 70); drum.addColorStop(0, mix(col, '#e7e2f0', .3)); drum.addColorStop(.6, col); drum.addColorStop(1, mix(col, '#07060c', .78)); c.fillStyle = drum; c.fillRect(-170, -66, 320, 132);
  c.strokeStyle = rgba('#0a0812', .42); c.lineWidth = 6; for (let k = 0; k < 8; k++) { const y = -56 + k * 16; c.beginPath(); c.moveTo(-170, y); c.lineTo(150, y); c.stroke(); }
  c.fillStyle = mix(col, '#d8d2e6', .18); c.beginPath(); c.ellipse(150, 0, 28, 66, 0, 0, 6.283); c.fill(); c.strokeStyle = rgba('#07060c', .5); c.lineWidth = 4; for (const r of [.7, .4]) { c.beginPath(); c.ellipse(150, 0, 28 * r, 66 * r, 0, 0, 6.283); c.stroke(); }
  c.restore();
  for (let i = 0; i < 80; i++) { const x = (R() - .5) * 980, y = -R() * R() * 110, r = 3 + R() * 9; c.fillStyle = R() > .55 ? rgba('#3f8a6c', .55) : rgba('#07060c', .5); c.beginPath(); c.ellipse(x, y, r * 1.5, r * .7, 0, 0, 6.283); c.fill(); }
}
// Worn signs cut into the lintel of the great gate, with the last of a light in them.
export function gateGlyphs(c, seed) {
  const R = rng(seed); c.lineCap = 'round'; c.lineJoin = 'round';
  for (let x = -380; x < 370; x += 44) {
    const y = -950, ox = x + R() * 6;
    c.strokeStyle = 'rgba(120,100,210,.14)'; c.lineWidth = 9;
    const stroke = () => { c.beginPath(); let px = ox, py = y; c.moveTo(px, py); for (let k = 0; k < 5; k++) { px = ox + r3[k * 2]; py = y + r3[k * 2 + 1]; c.lineTo(px, py); } c.stroke(); };
    const r3 = Array.from({ length: 10 }, (_, k) => (k % 2 ? 6 + R() * 42 : R() * 26)); stroke();
    c.strokeStyle = 'rgba(190,178,226,.5)'; c.lineWidth = 3; stroke();
  }
}

// Atlantis (the residents' best idea, built 2026-11-10): a drowned castle city for the Sunken City. A keep with a broken dome
// over a great arch, a tower each side (one still roofed, one sheared off), ramparts behind, a wide stair down to the floor,
// and windows that still hold a little living light. It is paler stone than the columns around it, so it reads as the place itself.
// Windows as [x, y, width, height] in art units from the foot; the light that pulses in them (atlantisLights) reads the same list.
export const ATLANTIS_WINDOWS = [[-90, -560, 24, 54], [0, -580, 28, 62], [90, -560, 24, 54], [-60, -430, 22, 50], [60, -430, 22, 50], [-300, -590, 20, 46], [-300, -480, 20, 46], [300, -420, 20, 46], [-300, -370, 20, 46], [300, -310, 20, 46]];
const ATLANTIS_GLOW = '#7fe9ff';
export function atlantis(c, seed, col = '#67739a') {
  const R = rng(seed), dark = (u) => mix(col, '#07060c', u), pale = (u) => mix(col, '#eef0f8', u);
  c.lineJoin = 'round'; c.lineCap = 'round';
  // A wall face: lit from the upper left, with the mortar lines of its blocks and a few darker stones.
  const face = (shape, x0, y0, x1, y1, rowH = 52) => {
    const g = c.createLinearGradient(x0, y0, x1, y1 * .4); g.addColorStop(0, pale(.34)); g.addColorStop(.5, mix(col, '#ffffff', .08)); g.addColorStop(1, dark(.58));
    c.fillStyle = g; c.fill(shape);
    c.save(); c.clip(shape);
    for (let r = 0; r * rowH < y0 - y1 + rowH; r++) {
      const y = y0 - r * rowH;
      c.strokeStyle = rgba('#07060c', .5); c.lineWidth = 3.5; c.beginPath(); c.moveTo(x0 - 10, y); c.lineTo(x1 + 10, y); c.stroke();
      for (let x = x0 + (r % 2 ? 42 : 0); x < x1; x += 70 + R() * 40) {
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - .5) * 4, y - rowH); c.stroke();
        c.fillStyle = R() > .6 ? rgba('#eef0f8', .06) : rgba('#07060c', .13); c.fillRect(x, y - rowH, 80, rowH);
      }
    }
    c.restore();
  };
  // Growth gathered low on a face, water stains running down it, and the odd crack.
  const weather = (shape, x0, y0, x1, y1, n) => {
    c.save(); c.clip(shape);
    for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), y = y0 - Math.pow(R(), 2.2) * (y0 - y1) * .7, r = 3 + R() * 9; c.fillStyle = rgba(R() > .5 ? '#3f8a6c' : '#6fae7c', .14 + R() * .3); c.beginPath(); c.ellipse(x, y, r * 1.4, r * .7, R() * 3, 0, 6.283); c.fill(); }
    for (let i = 0; i < n / 5; i++) { const x = x0 + R() * (x1 - x0), y = y1 + R() * (y0 - y1) * .6, L = 60 + R() * 200; c.strokeStyle = rgba(R() > .4 ? '#07060c' : '#cfd5e6', .07 + R() * .14); c.lineWidth = 2 + R() * 6; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (R() - .5) * 10, y + L * .5, x + (R() - .5) * 8, y + L); c.stroke(); }
    for (let i = 0; i < 3; i++) { let x = x0 + R() * (x1 - x0), y = y1 + R() * (y0 - y1) * .5; c.strokeStyle = rgba('#07060c', .55); c.lineWidth = 3 + R() * 4; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (R() - .5) * 40; y += 24 + R() * 50; c.lineTo(x, y); } c.stroke(); }
    c.restore();
  };
  // A window: dark inside, with a soft light behind it.
  const window = ([x, y, w, h]) => {
    c.fillStyle = '#080a16'; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h + w / 2); c.arc(x, y - h + w / 2, w / 2, 3.1416, 0); c.lineTo(x + w / 2, y); c.closePath(); c.fill();
    const g = c.createRadialGradient(x, y - h * .45, 0, x, y - h * .45, h * 1.2); g.addColorStop(0, rgba(ATLANTIS_GLOW, .7)); g.addColorStop(.4, rgba(ATLANTIS_GLOW, .22)); g.addColorStop(1, rgba(ATLANTIS_GLOW, 0));
    c.fillStyle = g; c.fillRect(x - h * 1.3, y - h * 1.7, h * 2.6, h * 2.6);
  };
  // Living light clinging to a ledge: the sparks the Abyss grows on old stone.
  const sparks = (x0, y, x1, n, drop = 10) => { for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), yy = y + R() * drop, r = 4 + R() * 6, t = R() > .4 ? ATLANTIS_GLOW : '#b7a4ff', h = c.createRadialGradient(x, yy, 0, x, yy, r); h.addColorStop(0, rgba(t, .85)); h.addColorStop(1, rgba(t, 0)); c.fillStyle = h; c.fillRect(x - r, yy - r, r * 2, r * 2); } };

  // Ramparts behind everything, their battlements broken here and there.
  const wall = new Path2D(); wall.moveTo(-440, 8); wall.lineTo(-440, -300);
  for (let x = -440; x < 440; x += 84) { const up = R() > .22 ? 34 : 6, w = 44 - R() * 10; wall.lineTo(x, -300); wall.lineTo(x, -300 - up); wall.lineTo(x + w, -300 - up + (up > 10 && R() > .7 ? 14 : 0)); wall.lineTo(x + w, -300); }
  wall.lineTo(440, -300); wall.lineTo(440, 8); wall.closePath();
  face(wall, -440, 8, 440, -334, 50); weather(wall, -440, 8, 440, -334, 200);

  // The left tower keeps its roof, with a bite out of one side.
  const tL = new Path2D(); tL.moveTo(-362, 8); tL.lineTo(-362, -660); tL.lineTo(-238, -660); tL.lineTo(-238, 8); tL.closePath();
  face(tL, -362, 8, -238, -660, 48); weather(tL, -362, 8, -238, -660, 110);
  const roof = new Path2D(); roof.moveTo(-382, -656); roof.lineTo(-300, -870); roof.lineTo(-278, -820); roof.lineTo(-262, -842); roof.lineTo(-248, -770); roof.lineTo(-218, -656); roof.closePath();
  const rg = c.createLinearGradient(-382, -870, -240, -656); rg.addColorStop(0, mix('#4a4466', '#d6cfea', .32)); rg.addColorStop(1, mix('#4a4466', '#07060c', .55)); c.fillStyle = rg; c.fill(roof);
  c.save(); c.clip(roof); c.strokeStyle = rgba('#07060c', .45); c.lineWidth = 3; for (let y = -680; y > -870; y -= 26) { c.beginPath(); c.moveTo(-390, y); c.lineTo(-210, y + 8); c.stroke(); } c.restore();
  // The right tower was sheared off long ago.
  const tR = new Path2D(); tR.moveTo(238, 8); tR.lineTo(238, -540); tR.lineTo(264, -568); tR.lineTo(296, -530); tR.lineTo(330, -552); tR.lineTo(362, -460); tR.lineTo(362, 8); tR.closePath();
  face(tR, 238, 8, 362, -568, 48); weather(tR, 238, 8, 362, -568, 110);

  // The keep, and the dome it has mostly lost.
  const keep = new Path2D(); keep.moveTo(-170, 8); keep.lineTo(-170, -700); keep.lineTo(170, -700); keep.lineTo(170, 8); keep.closePath();
  face(keep, -170, 8, 170, -700, 56);
  const dome = new Path2D(); dome.moveTo(-186, -700); dome.bezierCurveTo(-186, -900, 60, -920, 110, -860); dome.lineTo(86, -838); dome.lineTo(118, -806); dome.lineTo(96, -770); dome.lineTo(140, -742); dome.lineTo(186, -700); dome.closePath();
  const dg = c.createLinearGradient(-186, -920, 186, -700); dg.addColorStop(0, pale(.42)); dg.addColorStop(.55, mix(col, '#ffffff', .06)); dg.addColorStop(1, dark(.62)); c.fillStyle = dg; c.fill(dome);
  c.save(); c.clip(dome); c.strokeStyle = rgba('#07060c', .4); c.lineWidth = 3; for (let i = 1; i < 8; i++) { const a = 3.1416 + i * 3.1416 / 8; c.beginPath(); c.moveTo(0, -700); c.lineTo(Math.cos(a) * 190, -700 + Math.sin(a) * 200); c.stroke(); } for (let y = -730; y > -900; y -= 34) { c.beginPath(); c.moveTo(-200, y); c.quadraticCurveTo(0, y - 30, 200, y); c.stroke(); } c.restore();
  // A band of gold under the battlements: the one thing left that says this was a city of some wealth.
  c.fillStyle = rgba('#e0b85a', .6); c.fillRect(-176, -692, 352, 16); c.fillStyle = rgba('#07060c', .4); c.fillRect(-176, -676, 352, 4);
  for (let x = -170; x < 170; x += 56) { c.fillStyle = dark(.3); c.fillRect(x, -700, 30, -26); }
  weather(keep, -170, 8, 170, -700, 180);

  // The great arch, with a glow from somewhere inside, and its keystone.
  const arch = new Path2D(); arch.moveTo(-82, 8); arch.lineTo(-82, -220); arch.arc(0, -220, 82, 3.1416, 0); arch.lineTo(82, 8); arch.closePath();
  c.fillStyle = '#07060e'; c.fill(arch);
  const ag = c.createRadialGradient(0, -150, 10, 0, -150, 240); ag.addColorStop(0, rgba(ATLANTIS_GLOW, .55)); ag.addColorStop(.5, rgba(ATLANTIS_GLOW, .14)); ag.addColorStop(1, rgba(ATLANTIS_GLOW, 0));
  c.save(); c.clip(arch); c.fillStyle = ag; c.fillRect(-240, -400, 480, 420); c.restore();
  c.strokeStyle = pale(.26); c.lineWidth = 14; c.beginPath(); c.moveTo(-96, 0); c.lineTo(-96, -220); c.arc(0, -220, 96, 3.1416, 0); c.lineTo(96, 0); c.stroke();
  c.fillStyle = rgba('#e0b85a', .65); c.beginPath(); c.moveTo(-18, -326); c.lineTo(18, -326); c.lineTo(12, -298); c.lineTo(-12, -298); c.closePath(); c.fill();
  for (const w of ATLANTIS_WINDOWS) window(w);

  // Broken columns either side of the way in, with rubble around their feet.
  for (const [x, s] of [[-206, 1], [208, 2]]) { c.save(); c.translate(x, 0); c.scale(.5, .5); column(c, seed + s, 760, 70, '#565379', true); c.restore(); }
  c.save(); c.scale(.64, .6); stoneRubble(c, seed + 3, '#585578'); c.restore();

  // The stair down to the floor, worn in the middle.
  for (let i = 0; i < 6; i++) {
    const y = -72 + i * 12, w = 128 + i * 32, dip = (2.5 - Math.abs(i - 2.5)) * 2;
    c.fillStyle = dark(.56); c.fillRect(-w, y, w * 2, 13);
    c.fillStyle = pale(.3 - i * .02); c.beginPath(); c.moveTo(-w, y); c.lineTo(-w + 10, y - 12 + dip * .3); c.lineTo(w - 10, y - 12 + dip * .3); c.lineTo(w, y); c.closePath(); c.fill();
    c.strokeStyle = rgba('#07060c', .45); c.lineWidth = 3; for (let k = 0; k < 4; k++) { const x = -w + R() * 2 * w; c.beginPath(); c.moveTo(x, y + 12); c.lineTo(x + (R() - .5) * 20, y - 10); c.stroke(); }
  }
  // Living light along the ledges: the keep's cornice, the tower tops, the arch and the stair.
  sparks(-170, -704, 170, 26); sparks(-362, -664, -238, 12); sparks(238, -560, 362, 10, 60); sparks(-186, -700, -120, 6, 60);
  for (let i = 0; i < 6; i++) sparks(-128 - i * 32, -84 + i * 12, 128 + i * 32, 4, 6);
  for (let a = 3.3; a < 6.2; a += .32) { const x = Math.cos(a) * 100, y = -220 + Math.sin(a) * 100; sparks(x - 6, y - 6, x + 6, 1, 12); }
  // Sand drifted against the foot of everything.
  const sand = c.createLinearGradient(0, -30, 0, 16); sand.addColorStop(0, rgba('#2a2338', 0)); sand.addColorStop(1, rgba('#2a2338', .9)); c.fillStyle = sand; c.fillRect(-512, -30, 1024, 50);
}
// The living light in Atlantis's windows and gate, breathing slowly. Drawn over the lit piece every frame, so it never dims with the stone.
// S is the piece's square on screen in pixels; phase makes one clearing's lights breathe out of step with another's.
export function atlantisLights(g, t, S, phase) {
  const k = S / 1024;
  if (!g.createRadialGradient) return;
  const glow = (x, y, r, a) => { const c = g.createRadialGradient(x * k, y * k, 0, x * k, y * k, r * k); c.addColorStop(0, `rgba(170,240,255,${a})`); c.addColorStop(.5, `rgba(127,233,255,${a * .35})`); c.addColorStop(1, 'rgba(127,233,255,0)'); g.fillStyle = c; g.fillRect((x - r) * k, (y - r) * k, 2 * r * k, 2 * r * k); };
  ATLANTIS_WINDOWS.forEach(([x, y, , h], i) => glow(x, y - h * .5, h * 1.4, .22 + .2 * (.5 + .5 * Math.sin(t * .7 + i * 1.9 + phase * 6.283))));
  glow(0, -150, 220, .1 + .08 * (.5 + .5 * Math.sin(t * .45 + phase * 6.283)));
}
