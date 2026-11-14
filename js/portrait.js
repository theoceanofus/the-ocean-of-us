// Draws one resident's portrait (Ocean site experience, spec 2026-11-08). Browser only. Used by the picture maker, and later by the site.
// Imports follow the built site's layout, where js/, render/ and core/ sit side by side.
import { drawCreature, bakePose, bakeTime } from '../render/creatures.js';
import { artworkScale, LENGTHS } from '../render/metrics.js';
import { drawLitItem } from '../render/light.js';
import { withCrisp } from '../render/crisp.js';
import { drawPaidItem, sparkle, bubbleMark, drawSpotlight, fitOf, trailFade, drawRainbowRibbon, starGlow } from '../render/paid-items.js';

const POSE = { facing: 1, swim: 4.2, speed: 12, vy: 0 };
const blank = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// The largest font size up to maxPx (never below minPx) at which the text fits maxWidth. fontFor(px) gives the font string.
export function fitFont(ctx, text, fontFor, maxWidth, maxPx, minPx) {
  const before = ctx.font;
  let px = maxPx;
  for (; px > minPx; px--) {
    ctx.font = fontFor(px);
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  ctx.font = before;
  return Math.max(px, minPx);
}

const zoomFor = (species, width) => width * 0.394 / (LENGTHS[species]?.radius || 100) / artworkScale(species);

function drawPlain(ctx, res, x, y, z, pose = POSE, t = 3) {
  ctx.save(); ctx.translate(x, y); ctx.scale(z, z);
  try { drawCreature(ctx, res, pose, t, 0, 2); } finally { ctx.restore(); }
}

// Draws the creature centred at (x, y), `width` being the picture's width. With a light pass it is lit like the ocean (light is the zone's
// light level); if the pass can't be used the plain picture is drawn.
// `swim`: the tail-beat phase, so a caller can animate it (default: the still pose). An animated portrait uses the ocean's own swimming
// pose, because the still pose has no effort and most bodies only bend when they have one.
// Paid extras on the card (Task 8): the home stands behind, lower right; the trail runs back from the tail; the companion
// swims behind the creature's shoulder. Christmas items are worn, so drawCreature draws those. Nothing changes without `paid`.
// With a home, the creature moves a little left and shrinks, and the home stands to its right on the sand with a clear gap,
// sized to the creature, so it never covers a nose or fin at any card size. Without one the creature is placed as it always was.
export const HOME_ROOM = { shift: 0.13, scale: 0.74, up: 0.03 };
function placed(paid, x, y, width) {
  return paid?.home ? { x: x - width * HOME_ROOM.shift, y: y - width * HOME_ROOM.up, width: width * HOME_ROOM.scale } : { x, y, width };
}
// A fit from the shop's fit check (render/paid-items.js fitFor) is in the creature's own size, which on a card is 0.42 of its width.
const CARD_R = 0.42;
function paidBehind(ctx, paid, x, y, width, t, species) {
  const at = placed(paid, x, y, width);
  if (paid.home) {
    // The creature's right edge is about 0.42 of its width from its middle; the home starts a gap beyond that.
    const f = fitOf(species, paid.home), u = at.width * CARD_R;
    const hs = at.width * 0.42 * f.scale, left = at.x + at.width * 0.42 + width * 0.04 + f.x * u;
    ctx.save(); ctx.translate(left + hs * 0.5, y + width * 0.22 + f.y * u); const k = hs / 100; ctx.scale(k, k); ctx.translate(0, -40); drawPaidItem(ctx, paid.home, t); ctx.restore();
  }
  // The Spotlight: a gold light behind the creature on its card.
  if (paid.spotlight) drawSpotlight(ctx, at.x, at.y, at.width * 0.27, t);
  // The trail, moved and sized by its fit.
  const tf = fitOf(species, paid.trail), cx = at.x + tf.x * at.width * CARD_R, cy = at.y + tf.y * at.width * CARD_R, w = at.width * tf.scale;
  // As in the ocean (render/scene.js): one smooth line, rippling with the swim and fading into the water at its end (owner, 2026-11-14).
  if (paid.trail === 'rainbowtrail') {
    const line = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16; line.push({ x: cx - w * (0.31 + u * 0.29), y: cy + Math.sin(t * 1.6 - u * 5) * w * (0.006 + 0.022 * u), s: 1, u }); }
    drawRainbowRibbon(ctx, line, w * 0.014, 1, true);
  } else if (paid.trail) {
    const bubbles = paid.trail === 'bubbletrail', along = (u) => ({ x: cx - w * (0.38 + u * 0.2), y: cy - w * (bubbles ? u * 0.09 : 0) + Math.sin(t * 1.6 - u * 5) * w * (0.006 + 0.02 * u), s: 1, u });
    if (!bubbles) { const line = []; for (let i = 0; i <= 12; i++) line.push(along((i / 12) * (5 / 6))); starGlow(ctx, line, w * 0.03, 1); }
    for (let i = 0; i < 6; i++) { const u = i / 6, o = along(u), r = w * (0.032 - u * 0.014);
      ctx.save(); ctx.globalAlpha = trailFade(0.08 + 0.92 * u); ctx.translate(o.x, o.y); ctx.scale(r / 30, r / 30);
      if (bubbles) bubbleMark(ctx); else sparkle(ctx, 0, 0, 30, i % 2 ? '#fff3b0' : '#ffffff'); ctx.restore(); }
  }
}
function paidFront(ctx, paid, x, y, width, t, species) {
  if (!paid.companion) return;
  // Up and behind the shoulder, clear of the head and of any hat.
  const at = placed(paid, x, y, width), f = fitOf(species, paid.companion), u = at.width * CARD_R;
  ctx.save(); ctx.translate(at.x - at.width * 0.3 + f.x * u, at.y - at.width * 0.3 + f.y * u + Math.sin(t * 1.3) * at.width * 0.012); const k = at.width * 0.16 * f.scale / 90; ctx.scale(k, k); drawPaidItem(ctx, paid.companion, t); ctx.restore();
}

// Worn on the head: a bought hat, a Christmas hat, or a hat asked for in a comment.
const HEAD_ITEMS = new Set(['santahat', 'snowcrown']);
const wearsOnHead = (row) => !!(row?.paid?.hat || HEAD_ITEMS.has(row?.paid?.christmas) || (row?.extras?.wear && !['glasses', 'jersey'].includes(row.extras.wear)));
export function drawPortrait(ctx, row, given) {
  // Owner, 2026-11-12: a little smaller and lower with a hat on, so the hat fits on the card too.
  const opts = wearsOnHead(row) ? { ...given, width: given.width * 0.8, y: given.y + given.width * 0.08 } : given;
  const paid = row?.paid, t = opts.swim === null || opts.swim === undefined ? 3 : bakeTime(opts.swim);
  if (paid) paidBehind(ctx, paid, opts.x, opts.y, opts.width, t, row.species);
  drawCreaturePortrait(ctx, row, paid?.home ? { ...opts, ...placed(paid, opts.x, opts.y, opts.width) } : opts);
  if (paid) paidFront(ctx, paid, opts.x, opts.y, opts.width, t, row.species);
}
function drawCreaturePortrait(ctx, row, { x, y, width, lightPass = null, light = 1, swim = null }) {
  const res = { ...row, id: `portrait-${row.key}` };
  const pose = swim === null ? POSE : bakePose(swim), t = swim === null ? 3 : bakeTime(swim);
  const z = zoomFor(row.species, width);
  if (!lightPass?.available) return drawPlain(ctx, res, x, y, z, pose, t);
  const side = Math.min(1024, Math.ceil(width * 1.06));
  const body = blank(side, side), crisp = blank(side, side);
  let out = null;
  try {
    withCrisp(crisp.getContext('2d'), () => drawPlain(body.getContext('2d'), res, side / 2, side / 2, z, pose, t));
    out = lightPass.apply(body, { light, t: 3 });
  } catch { out = null; }
  if (!out) return drawPlain(ctx, res, x, y, z, pose, t);
  drawLitItem(ctx, x, y, { ...out, crisp, side, scale: 1 }, 1);
}
