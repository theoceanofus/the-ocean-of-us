// The three reusable world additions. Drawn with their base at y = 0 and growing upward,
// in world units. Each stays absent until the owner places it.
import { rng, lerp } from './util.js';
import { palette } from './creatures.js';

function shadedBlob(ctx, P, x, y, rx, ry, base, rot = 0) {
  const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.45, rx * 0.08, x, y, Math.max(rx, ry) * 1.05);
  g.addColorStop(0, P(base, 0.18)); g.addColorStop(0.65, P(base, 0)); g.addColorStop(1, P(base, -0.35));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, 6.283); ctx.fill();
}

function branch(ctx, P, r, x, y, angle, len, w, depth, col, t, sway) {
  const bend = Math.sin(t * 0.5 + x * 0.05) * sway * (5 - depth);
  const ex = x + Math.cos(angle + bend * 0.02) * len;
  const ey = y + Math.sin(angle + bend * 0.02) * len;
  ctx.strokeStyle = P(col, depth * 0.035);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + Math.cos(angle) * len * 0.5 + (r() - 0.5) * 5, y + Math.sin(angle) * len * 0.5, ex, ey);
  ctx.stroke();
  if (depth > 0) {
    const n = depth > 2 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const a = angle + lerp(-0.72, 0.72, n === 1 ? 0.5 : i / (n - 1)) + (r() - 0.5) * 0.22;
      branch(ctx, P, r, ex, ey, a, len * (0.68 + r() * 0.14), w * 0.7, depth - 1, col, t, sway);
    }
  } else {
    ctx.fillStyle = P(col, 0.32);
    ctx.beginPath(); ctx.arc(ex, ey, w * 0.74, 0, 6.283); ctx.fill();
  }
}

function fan(ctx, P, seed, x, y, h, col, t) {
  const r = rng(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 0.42 + seed) * 0.022);
  const outline = new Path2D();
  outline.moveTo(0, 0);
  outline.bezierCurveTo(-h * 0.72, -h * 0.32, -h * 0.68, -h * 1.05, 0, -h);
  outline.bezierCurveTo(h * 0.7, -h * 1.03, h * 0.72, -h * 0.34, 0, 0);
  ctx.fillStyle = P(col, -0.12, 0.54);
  ctx.fill(outline);
  ctx.strokeStyle = P(col, 0.1, 0.9);
  ctx.lineCap = 'round';
  const rays = 15;
  for (let i = 0; i < rays; i++) {
    const a = -Math.PI / 2 + lerp(-0.87, 0.87, i / (rays - 1));
    const L = h * (0.76 + r() * 0.2);
    ctx.lineWidth = 2.1;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * L * 0.5 + (r() - 0.5) * 7, Math.sin(a) * L * 0.5, Math.cos(a) * L, Math.sin(a) * L);
    ctx.stroke();
    ctx.lineWidth = 0.9;
    for (let j = 0; j < 3; j++) {
      const k = 0.48 + j * 0.16, ax = Math.cos(a) * L * k, ay = Math.sin(a) * L * k;
      const a2 = a + (r() > 0.5 ? 0.36 : -0.36);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + Math.cos(a2) * L * 0.2, ay + Math.sin(a2) * L * 0.2); ctx.stroke();
    }
  }
  ctx.restore();
}

function coralCluster(ctx, t, P, seed) {
  const r = rng(seed);
  fan(ctx, P, seed + 1, -92, -6, 118, '#e45a86', t);
  fan(ctx, P, seed + 2, 76, -4, 92, '#f39a5b', t);
  // Staghorn branches
  branch(ctx, P, rng(seed + 3), -24, -3, -1.5, 44, 13, 4, '#ff7a59', t, 0.5);
  branch(ctx, P, rng(seed + 4), 34, -3, -1.72, 34, 10, 3, '#ffc27a', t, 0.5);
  branch(ctx, P, rng(seed + 5), -128, -3, -1.45, 26, 8, 3, '#f2709c', t, 0.5);
  // Rounded brain coral
  shadedBlob(ctx, P, 6, -22, 56, 33, '#d99155');
  ctx.save();
  ctx.beginPath(); ctx.ellipse(6, -22, 55, 32, 0, 0, 6.283); ctx.clip();
  ctx.strokeStyle = P('#8d5637', 0, 0.42); ctx.lineWidth = 1.5;
  for (let i = 0; i < 11; i++) {
    let x = -52 + i * 10, y = -54;
    ctx.beginPath(); ctx.moveTo(x, y);
    while (y < 12) { y += 6; x += (r() - 0.5) * 11; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.restore();
  // Plate and mound corals with polyps
  shadedBlob(ctx, P, 110, -17, 40, 23, '#5ec4b2');
  shadedBlob(ctx, P, -84, -14, 30, 19, '#a68ae0');
  ctx.fillStyle = P('#fff4dc', 0, 0.64);
  for (let i = 0; i < 26; i++) {
    const a = r() * 6.283, d = Math.sqrt(r());
    ctx.beginPath(); ctx.arc(110 + Math.cos(a) * d * 35, -17 + Math.sin(a) * d * 19, 1.1, 0, 6.283); ctx.fill();
  }
  for (let i = 0; i < 18; i++) {
    const a = r() * 6.283, d = Math.sqrt(r());
    ctx.beginPath(); ctx.arc(-84 + Math.cos(a) * d * 26, -14 + Math.sin(a) * d * 16, 1, 0, 6.283); ctx.fill();
  }
}

function rockFacets(ctx, P, poly, base, seed) {
  const r = rng(seed);
  const p = new Path2D();
  poly.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  const ys = poly.map((q) => q[1]);
  const g = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
  g.addColorStop(0, P(base, 0.2)); g.addColorStop(0.55, P(base, -0.06)); g.addColorStop(1, P(base, -0.44));
  ctx.fillStyle = g; ctx.fill(p);
  ctx.save(); ctx.clip(p);
  const xs = poly.map((q) => q[0]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (let i = 0; i < 34; i++) {
    const cx = lerp(x0, x1, r()), cy = lerp(y0, y1, r()), s = 14 + r() * 44;
    const light = r() > 0.5;
    ctx.fillStyle = light ? P('#d8f0ea', 0, 0.09) : P('#02161f', 0, 0.12);
    ctx.beginPath();
    ctx.moveTo(cx - s, cy + (r() - 0.5) * s * 0.4);
    ctx.lineTo(cx + (r() - 0.5) * s * 0.5, cy - s * (0.3 + r() * 0.5));
    ctx.lineTo(cx + s, cy + (r() - 0.5) * s * 0.3);
    ctx.lineTo(cx + (r() - 0.5) * s * 0.4, cy + s * 0.32);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function rockArch(ctx, t, P, seed) {
  const r = rng(seed);
  // Back face first gives the opening real thickness.
  ctx.save();
  ctx.translate(16, -8);
  ctx.globalAlpha = 1;
  rockFacets(ctx, P, [[-250, 0], [-256, -150], [-212, -272], [-96, -348], [66, -358], [200, -292], [254, -168], [248, 0], [120, 0], [122, -128], [72, -212], [-2, -238], [-78, -212], [-126, -128], [-124, 0]], '#27505a', seed + 1);
  ctx.restore();
  rockFacets(ctx, P, [[-250, 0], [-262, -112], [-236, -220], [-180, -296], [-88, -350], [34, -362], [146, -330], [226, -252], [256, -142], [250, 0], [130, 0], [140, -82], [116, -162], [62, -214], [-6, -232], [-74, -212], [-122, -158], [-142, -78], [-130, 0]], '#60858a', seed + 2);
  // Sun-bleached top edge, soft algae and a little life on the stone
  ctx.strokeStyle = P('#e4f5ef', 0, 0.24); ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-236, -220); ctx.lineTo(-180, -296); ctx.lineTo(-88, -350); ctx.lineTo(34, -362); ctx.lineTo(146, -330); ctx.lineTo(226, -252); ctx.stroke();
  for (let i = 0; i < 46; i++) {
    const side = r() > 0.5 ? 1 : -1;
    const x = side * (146 + r() * 104), y = -r() * 160;
    ctx.fillStyle = P(r() > 0.5 ? '#3e8f73' : '#74b57a', 0, 0.46);
    ctx.beginPath(); ctx.ellipse(x, y, 5 + r() * 9, 2.5 + r() * 5, r() * 3, 0, 6.283); ctx.fill();
  }
  for (const [x, c] of [[-212, '#e45a86'], [204, '#ff9a5b'], [168, '#f2d36a']]) {
    shadedBlob(ctx, P, x, -7, 22, 15, c);
  }
}

function shipwreck(ctx, t, P, seed) {
  const r = rng(seed);
  ctx.save();
  ctx.rotate(-0.075);
  ctx.translate(0, 34);
  const W = 300;
  // Broken mast, behind the hull
  ctx.save();
  ctx.translate(-40, -150);
  ctx.rotate(0.27);
  const mast = ctx.createLinearGradient(-9, 0, 9, 0);
  mast.addColorStop(0, P('#4a3525')); mast.addColorStop(0.5, P('#7a5a3e')); mast.addColorStop(1, P('#39281c'));
  ctx.fillStyle = mast;
  ctx.beginPath(); ctx.moveTo(-8, 20); ctx.lineTo(-6, -212); ctx.lineTo(-1, -228); ctx.lineTo(3, -216); ctx.lineTo(7, -220); ctx.lineTo(8, 20); ctx.closePath(); ctx.fill();
  ctx.fillRect(-58, -160, 116, 8);
  // Torn sail remnant, moving gently in the current
  const s = Math.sin(t * 0.55) * 4;
  ctx.fillStyle = P('#cdbf9d', -0.08, 0.62);
  ctx.beginPath(); ctx.moveTo(-52, -152); ctx.lineTo(50, -152); ctx.bezierCurveTo(46 + s, -114, 26 + s, -96, 12 + s, -82); ctx.lineTo(0 + s, -106); ctx.lineTo(-17 + s, -74); ctx.lineTo(-31 + s, -112); ctx.closePath(); ctx.fill();
  ctx.restore();

  // Inner hull, seen through the broken side
  const hull = new Path2D();
  hull.moveTo(-W, -116);
  hull.bezierCurveTo(-W * 0.72, -92, -W * 0.3, -98, 0, -94);
  hull.bezierCurveTo(W * 0.46, -90, W * 0.82, -118, W * 1.04, -176);
  hull.lineTo(W * 0.92, -96);
  hull.bezierCurveTo(W * 0.78, -28, W * 0.48, 22, W * 0.2, 28);
  hull.lineTo(-W * 0.82, 28);
  hull.bezierCurveTo(-W * 0.96, -18, -W * 1.01, -70, -W, -116);
  hull.closePath();
  const hg = ctx.createLinearGradient(0, -170, 0, 28);
  hg.addColorStop(0, P('#8b6743')); hg.addColorStop(0.42, P('#65482f')); hg.addColorStop(1, P('#2c2119'));
  ctx.fillStyle = hg; ctx.fill(hull);
  ctx.save(); ctx.clip(hull);
  // Planks
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 13; i++) {
    const y = -158 + i * 15.5;
    ctx.strokeStyle = P('#241912', 0, 0.56);
    ctx.beginPath(); ctx.moveTo(-W * 1.1, y + 18); ctx.bezierCurveTo(-W * 0.4, y + 20, W * 0.4, y + 18, W * 1.1, y - 28); ctx.stroke();
    for (let j = 0; j < 4; j++) {
      const x = lerp(-W, W, r());
      ctx.fillStyle = P('#241912', 0, 0.42);
      ctx.fillRect(x, y + 12 - Math.max(0, x / W) * 28, 1.7, 13);
    }
  }
  // Algae staining, gathered low
  for (let i = 0; i < 40; i++) {
    const x = lerp(-W, W, r()), y = lerp(-42, 26, r());
    ctx.fillStyle = P(r() > 0.45 ? '#2f7d6e' : '#79a464', 0, 0.2 + r() * 0.2);
    ctx.beginPath(); ctx.ellipse(x, y, 6 + r() * 19, 2.5 + r() * 7, 0, 0, 6.283); ctx.fill();
  }
  // A dark gap where the planks gave way
  ctx.fillStyle = P('#080f12', 0, 0.84);
  ctx.beginPath();
  ctx.moveTo(-104, -66); ctx.lineTo(-64, -86); ctx.lineTo(-15, -74); ctx.lineTo(29, -83); ctx.lineTo(63, -49); ctx.lineTo(50, -16); ctx.lineTo(13, -6); ctx.lineTo(-36, -18); ctx.lineTo(-86, -11); ctx.lineTo(-117, -32);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = P('#3f2c1e'); ctx.lineWidth = 8; ctx.lineCap = 'butt';
  for (const x of [-74, -36, 4, 42]) { ctx.beginPath(); ctx.moveTo(x, -86); ctx.quadraticCurveTo(x + 4, -48, x - 4, -2); ctx.stroke(); }
  ctx.restore();
  // Gunwale
  ctx.strokeStyle = P('#a78457'); ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-W, -116); ctx.bezierCurveTo(-W * 0.72, -92, -W * 0.3, -98, 0, -94); ctx.bezierCurveTo(W * 0.46, -90, W * 0.82, -118, W * 1.04, -176); ctx.stroke();
  // Stern box
  ctx.fillStyle = P('#57402b');
  ctx.beginPath(); ctx.moveTo(-W * 1.0, -116); ctx.lineTo(-W * 1.05, -165); ctx.lineTo(-W * 0.72, -151); ctx.lineTo(-W * 0.67, -101); ctx.closePath(); ctx.fill();
  ctx.fillStyle = P('#101a1d', 0, 0.82);
  ctx.fillRect(-W * 0.93, -149, 22, 18); ctx.fillRect(-W * 0.83, -146, 22, 18);
  ctx.restore();
}

const DRAW = { coral_cluster: coralCluster, rock_arch: rockArch, shipwreck };
export const ADDITION_HEIGHT = { coral_cluster: 170, rock_arch: 370, shipwreck: 340 };

export function drawAddition(ctx, item, t, fog) {
  const fn = DRAW[item.type];
  if (fn) fn(ctx, t, palette(fog), item.seed || 11);
}
