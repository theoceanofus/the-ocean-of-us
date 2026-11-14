// Shared swim-cycle pictures for the live site (spec 2026-11-08-ocean-baked-pictures). Unlit creatures are drawn once
// per look, swim phase, size and fog band, and the live ocean places those pictures instead of redrawing every path.
// Reels never use this: pictures step through the swim and round sizes and fog, so they aren't exact.
import { hash32 } from './util.js';
import { NATURAL, variantOf } from './variation.js';
import { walksHere } from './roam.js';

const TAU = Math.PI * 2;
export const PICTURES = {
  tiers: [64, 128, 256], topTier: 512, // sides in pixels; the top tier is only for the few largest unlit creatures on screen
  topCount: 6,                         // how many of the nearest unlit creatures may have one
  phases: 8, smallPhases: 4, smallBelow: 128, // pictures per swim loop, and fewer for small pictures
  fogStep: 0.1,
  maxBytes: 90e6,                      // every picture counted exactly
  budgetMs: 4,                         // baking per frame, and always at least one picture
  idleFrames: 30,                      // a sheet nobody has used for this long can be dropped to make room
  box: 2.7,                            // a picture's side, as a multiple of the creature's on-screen radius
  blendFrom: 150,                      // on-screen radius from which neighbouring phases blend (slow giants would step)
  blendAfter: 0.6,                     // a phase holds for this share of its time, then blends into the next
};

const keys = new WeakMap();
// The bought things that are worn (a Christmas item, a hat, a look, a face thing) are part of the look; the rest are drawn by the scene.
const WORN_PAID = ['christmas', 'hat', 'look', 'face'];
const paidLook = (paid) => { const out = {}; for (const k of WORN_PAID) if (paid?.[k]) out[k] = paid[k]; return Object.keys(out).length ? out : null; };
const paidLookKey = (paid) => WORN_PAID.map((k) => (paid?.[k] ? `+${paid[k]}` : '')).join('');
const extrasKey = (ex) => (ex ? JSON.stringify(Object.keys(ex).filter((k) => k !== 'nickname').sort().map((k) => [k, ex[k]])) : '');

// The fields a drawing depends on. Two residents with the same key share every picture.
export function lookKey(res, lod) {
  let held = keys.get(res);
  if (!held) { held = {}; keys.set(res, held); }
  return held[lod] ||= [res.species + (walksHere(res) ? '~walk' : ''), res.colors?.primary, res.colors?.secondary, res.upgrade?.pattern || res.pattern || 'plain', res.upgrade?.effect || 'none', lod >= 2 ? extrasKey(res.extras) + paidLookKey(res.paid) + (NATURAL.has(res.species) ? `~${variantOf(res)}` : '') : '', lod].join('|');
}

// What a picture is drawn from. The seed comes from the look, so a picture never depends on who asked for it first.
// Paid things that are worn are part of the look; homes, companions, trails and the Spotlight are drawn by the scene, not the picture.
export function lookResident(res, key) {
  return { id: key, username: '', ...(/~walk\|/.test(key) ? { walk: true } : {}), variant: /\|2$/.test(key) ? variantOf(res) : 0, species: res.species, colors: res.colors, pattern: res.pattern, upgrade: res.upgrade, extras: res.extras, ...(paidLook(res.paid) ? { paid: paidLook(res.paid) } : {}), seed: hash32(key) || 1, size: 1 };
}

// Where in a swim loop the pictures fall, as shares of the loop. Evenly, unless a pulse has a quick squeeze that would
// fall between evenly spaced pictures: those loops get a run of pictures through the squeeze and relax.
const evens = new Map();
export function evenPhases(count) {
  if (!evens.has(count)) evens.set(count, Array.from({ length: count }, (_, i) => i / count));
  return evens.get(count);
}
export function squeezePhases(count, squeeze, relax) {
  const inSqueeze = Math.ceil(count * 0.375), inRelax = Math.max(1, Math.floor(count * 0.375)), rest = count - inSqueeze - inRelax;
  const shares = [];
  for (let i = 0; i < inSqueeze; i++) shares.push((i / inSqueeze) * squeeze);
  for (let i = 0; i < inRelax; i++) shares.push(squeeze + (i / inRelax) * relax);
  for (let i = 0; i < rest; i++) shares.push(squeeze + relax + (i / rest) * (1 - squeeze - relax));
  return shares;
}

// Which pictures show a swim angle: the nearest one, or with blend the two either side and how far between them.
// The step from the last picture back to the first is always blended, because some body parts beat at their own rate
// and don't quite meet up at the end of a loop.
const share = (swim) => ((swim % TAU) + TAU) % TAU / TAU;
export function phaseAt(swim, table, blend = false) {
  const shares = typeof table === 'number' ? evenPhases(table) : table, n = shares.length, u = share(swim);
  let a = n - 1;
  for (let i = 1; i < n; i++) if (u < shares[i]) { a = i - 1; break; }
  const f = (u - shares[a]) / ((a === n - 1 ? 1 : shares[a + 1]) - shares[a]);
  if (blend || a === n - 1) return { a, b: (a + 1) % n, f };
  const near = f < 0.5 ? a : a + 1;
  return { a: near, b: near, f: 0 };
}

export function tierFor(want, allowTop = false) {
  for (const t of PICTURES.tiers) if (want <= t) return t;
  return allowTop ? PICTURES.topTier : PICTURES.tiers.at(-1);
}
export const phasesFor = (tier) => (tier < PICTURES.smallBelow ? PICTURES.smallPhases : PICTURES.phases);
// The baked phase of a sheet closest to `nearest`, as a picture to draw, or null when nothing on it is made yet.
function closestBaked(sheet, nearest) {
  for (let d = 0; d <= sheet.count; d++) for (const p of [(nearest + d) % sheet.count, (nearest - d + sheet.count) % sheet.count]) if (sheet.baked.has(p)) return { sheet, a: p, b: p, f: 0 };
  return null;
}
export const fogBand = (fog) => Math.round(Math.min(1, Math.max(0, fog)) / PICTURES.fogStep) / (1 / PICTURES.fogStep);

// Pictures in sheets, one sheet per look, tier and fog band, one cell per phase. Least recently used sheets go first.
export class PictureBook {
  // bake(ctx, cell) draws one phase into its cell. motionOf(species).pulse, if any, is that animal's { squeeze, relax }.
  constructor({ makeCanvas = () => document.createElement('canvas'), bake, maxBytes = PICTURES.maxBytes, budgetMs = PICTURES.budgetMs, now = () => performance.now(), motionOf = () => ({}) } = {}) {
    Object.assign(this, { makeCanvas, bake, maxBytes, budgetMs, now, motionOf });
    this.sheets = new Map(); this.bytes = 0; this.clock = 0; this.wanted = [];
  }

  beginFrame() { this.clock++; this.wanted.length = 0; }

  // Dropping a sheet sizes its canvas to 0: Safari holds on to a canvas's memory otherwise.
  _drop(id, sheet) { sheet.canvas.width = sheet.canvas.height = 0; this.sheets.delete(id); this.bytes -= sheet.bytes; }

  // Room for a new sheet, without touching any sheet used lately: a creature that can't have the picture it wants
  // must never be able to push out another creature's. False means it can't be done.
  _room(bytes) {
    if (bytes > this.maxBytes) return false;
    for (const [id, sheet] of this.sheets) {
      if (this.bytes + bytes <= this.maxBytes) break;
      if (this.clock - sheet.used < PICTURES.idleFrames) return false;
      this._drop(id, sheet);
    }
    return this.bytes + bytes <= this.maxBytes;
  }

  _sheet(res, lod, tier, fog) {
    const key = lookKey(res, lod), id = `${key}|${tier}|${fog}`;
    let sheet = this.sheets.get(id);
    if (sheet) { this.sheets.delete(id); this.sheets.set(id, sheet); }
    else {
      const count = phasesFor(tier), cols = count / 2, rows = 2, bytes = cols * tier * rows * tier * 4, pulse = this.motionOf(res.species).pulse;
      if (!this._room(bytes)) return null;
      const canvas = this.makeCanvas(); canvas.width = cols * tier; canvas.height = rows * tier;
      sheet = { id, canvas, ctx: canvas.getContext('2d'), tier, count, cols, rows, fog, lod, bytes, shares: pulse ? squeezePhases(count, pulse.squeeze, pulse.relax) : evenPhases(count), res: lookResident(res, key), baked: new Set() };
      this.sheets.set(id, sheet); this.bytes += bytes;
    }
    sheet.used = this.clock;
    return sheet;
  }

  // The picture for a creature this frame, or null when it has to be drawn another way.
  get({ res, lod, px, fog, swim, allowTop = false, blend = false }) {
    let tier = tierFor(px * PICTURES.box, allowTop), sheet;
    // No room for the size it wants: a smaller picture is better than none.
    while (tier && !(sheet = this._sheet(res, lod, tier, fogBand(fog)))) tier = PICTURES.tiers.filter((t) => t < tier).at(-1);
    if (!sheet) return null;
    const hit = phaseAt(swim, sheet.shares, blend), nearest = hit.f < 0.5 ? hit.a : hit.b;
    if (!sheet.baked.has(nearest)) this.wanted.push({ sheet, phase: nearest, px });
    if (sheet.baked.has(hit.a) && (!hit.f || sheet.baked.has(hit.b))) return { sheet, ...hit };
    if (!sheet.baked.size) {
      // Nothing made at this size yet (a glide's look-ahead can rank a creature one size up or down from the frame it arrives in, so
      // it asked for the other size): a size already made is better than drawing it live.
      const key = lookKey(res, lod), band = fogBand(fog);
      for (const t of [...PICTURES.tiers].sort((x, y) => Math.abs(x - tier) - Math.abs(y - tier))) {
        const other = t === tier ? null : this.sheets.get(`${key}|${t}|${band}`);
        if (!other?.baked.size) continue;
        other.used = this.clock;
        const h = phaseAt(swim, other.shares, blend);
        return closestBaked(other, h.f < 0.5 ? h.a : h.b);
      }
      return null;
    }
    // Not ready yet: the closest phase that is, so a creature never waits on a picture it could nearly use.
    return closestBaked(sheet, nearest);
  }

  _bakeCell(sheet, phase) {
    const col = phase % sheet.cols, row = Math.floor(phase / sheet.cols);
    this.bake(sheet.ctx, { x: col * sheet.tier, y: row * sheet.tier, side: sheet.tier, phase, angle: sheet.shares[phase] * TAU, fog: sheet.fog, lod: sheet.lod, res: sheet.res });
    sheet.baked.add(phase);
  }

  // Spends this frame's baking budget: every creature's current phase first, largest first, then the rest of their loops.
  // budgetMs: this frame's own allowance, when it should differ from the book's.
  bakeSome({ budgetMs = this.budgetMs } = {}) {
    const order = [], seen = new Set();
    for (const w of [...this.wanted].sort((a, b) => b.px - a.px)) { const k = `${w.sheet.id}#${w.phase}`; if (!seen.has(k)) { seen.add(k); order.push(w); } }
    const rest = [];
    for (const w of order) if (!rest.includes(w.sheet)) rest.push(w.sheet);
    for (const sheet of this.sheets.values()) if (sheet.used === this.clock && !rest.includes(sheet)) rest.push(sheet);
    const start = this.now();
    const spent = () => this.now() - start >= budgetMs;
    for (const { sheet, phase } of order) { if (sheet.baked.has(phase)) continue; this._bakeCell(sheet, phase); if (spent()) return; }
    for (const sheet of rest) {
      const from = order.find((w) => w.sheet === sheet)?.phase || 0;
      for (let i = 0; i < sheet.count; i++) { const phase = (from + i) % sheet.count; if (sheet.baked.has(phase)) continue; this._bakeCell(sheet, phase); if (spent()) return; }
    }
  }

  summary() {
    let baked = 0, queued = 0;
    for (const s of this.sheets.values()) { baked += s.baked.size; if (s.used === this.clock) queued += s.count - s.baked.size; }
    return { sheets: this.sheets.size, baked, queued, mb: Math.round(this.bytes / 1e5) / 10 };
  }
}

// True while the view on screen still has pictures to draw. Those first frames are not a sign of a slow device.
export const stillBaking = (book) => !!book && book.summary().queued > 0;

// Places a picture. frame is the creature's body frame (creatures.js): mirrored, narrowed for a turn, tipped and tilted.
// A blend draws the earlier phase solid, then the later one over it, so the water never shows through the body.
export function drawPicture(ctx, { sheet, a, b, f }, x, y, px, frame, fade) {
  const before = ctx.globalAlpha, T = sheet.tier, S = px * PICTURES.box;
  const put = (phase, alpha) => { ctx.globalAlpha = alpha; ctx.drawImage(sheet.canvas, (phase % sheet.cols) * T, Math.floor(phase / sheet.cols) * T, T, T, -S / 2, -S / 2, S, S); };
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(frame.sx, 1);
  if (frame.turn) ctx.rotate(frame.turn);
  if (frame.lean) ctx.rotate(frame.lean);
  const u = fade < 1 ? 0 : Math.max(0, (f - PICTURES.blendAfter) / (1 - PICTURES.blendAfter));
  if (u > 0) { const under = Math.min(1, 2 - 2 * u); if (under > 0) put(a, under); put(b, Math.min(1, 2 * u)); }
  else put(fade < 1 && f >= 0.5 ? b : a, fade);
  ctx.restore();
  ctx.globalAlpha = before;
}
