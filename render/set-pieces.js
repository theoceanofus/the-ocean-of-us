// Scenery (spec 2026-11-08-ocean-environment): pieces drawn in code, lit once by the creature light, then stamped behind residents.
// Far and middle distance are combined into a few soft cards per clearing, so the whole view costs about 15 picture draws a frame.
// Every neighbourhood is a row of clearings ("tiles"). Nothing here runs per frame except placing finished pictures.
import { hash32, rng, smooth } from './util.js';
import { HOOD_BY_ID, ZONE_CAM } from '../core/hoods.js';
import { LIGHT } from './light.js';

export const TILE = 438;             // world units between clearings, about 1.5 phone screens at the frame's depth
const FOCAL = 0.95;
const DEPTH = { far: 1400, mid: 900, frame: 560, edge: 260 }; // how far back each layer sits, which sets how fast it slides past
const PHONE_RATIO = 780 / 1688;     // a tile is composed for a phone's shape: width as a share of height
const BASE = 990 / 1024;            // where a piece's foot sits in its picture
const CARD = { w: 663, h: 844, span: 1.7, left: -0.35, fade: 0.16 }; // cards cover 1.7 phone widths, drawn at half size
const FADE = { far: { haze: 0.72, blur: 5, keep: 0.5 }, mid: { haze: 0.42, blur: 2, keep: 1 } }; // keep: the far card is so soft that a half-size copy looks the same
// The live site bakes every piece small first, so arriving is quick. Then, once the view is still, any piece the screen is
// stretching by more than `from` is baked again at `side`, one small step every `gap` frames (spec 2026-11-09-ocean-site-detail-and-speed-research).
const SHARP = { side: 1024, from: 1.35, gap: 4, still: 6, calm: 3 };
const FAR_SIDE = 256;               // a piece only the far card uses is drawn tiny and blurred, so it's baked small
const WHOLE = [0, 0, 1, 1];

const kits = {};
// kit.boxes says where each piece's drawing sits, in art units from its foot: [left, top, right, bottom]. A piece with a box
// is kept cropped to it, which is most of the memory a sharp piece would otherwise cost. tools/place-boxes.mjs works them out.
export const registerKit = (zoneId, kit) => {
  for (const [id, box] of Object.entries(kit.boxes || {})) if (kit.pieces[id]) kit.pieces[id].box = box;
  kits[zoneId] = kit;
};
export const kitOf = (zoneId) => kits[zoneId];
const hoodKit = (hood) => kits[hood.zone]?.hoods?.[hood.id];

// One clearing's pieces. Recipes are [piece or list of pieces, x across a phone screen, y down it, size, flip]. The same input always gives the same clearing.
// `live` adds a kit's site-only rows (kit.more) after everything a Reel uses, so a Reel's clearings can't change.
// `built` lists pieces the residents asked for that the saved ocean now holds (kit.built, by piece id): they stand in the landmark
// clearing in place of the landmark, and nothing else about the neighbourhood changes.
export function composeTile(hood, index, { landmarkAt = 1, live = false, built = [] } = {}) {
  const out = { far: [], mid: [], frame: [], edge: [] }, recipe = hoodKit(hood);
  if (!recipe) return out;
  const r = rng(hash32(`${hood.id}:${index}`)), kit = kits[hood.zone], pieces = kit.pieces;
  const place = (layer, [pick, x, y, s, flip], builtId = null) => {
    const piece = Array.isArray(pick) ? pick[Math.floor(r() * pick.length)] : pick;
    out[layer].push({ piece, x: x + (r() - 0.5) * 0.08, y: y + (r() - 0.5) * 0.015, s: s * (0.9 + r() * 0.2), flip: r() < 0.5 ? !flip : !!flip, sway: pieces[piece]?.sway ? r() * 6.283 : 0, ...(builtId ? { built: builtId } : {}) });
  };
  for (const layer of ['far', 'mid', 'frame', 'edge']) for (const row of recipe[layer] || []) place(layer, row);
  if (index === landmarkAt) {
    // kit.built[id] is a recipe row, or { row, without: [pieces that step aside in this clearing] }.
    const rows = built.map((id) => [id, kit.built?.[id]]).filter(([, b]) => b).map(([id, b]) => [id, Array.isArray(b) ? b : b.row, Array.isArray(b) ? [] : b.without || []]);
    if (rows.length) for (const [id, row, without] of rows) { if (without.length) for (const layer of ['far', 'mid', 'frame']) out[layer] = out[layer].filter((p) => !without.includes(p.piece)); place('frame', row, id); }
    else if (recipe.landmark) place('frame', recipe.landmark);
  }
  const more = live ? kit.more?.[hood.id] : null;
  if (more) for (const layer of ['far', 'mid', 'frame']) for (const row of more[layer] || []) place(layer, row);
  return out;
}
// Pieces a kit can build into this neighbourhood, from what the saved ocean holds: [{ piece, id }] in a fixed order.
export function builtIn(additions, hoodId) {
  const zone = HOOD_BY_ID[hoodId]?.zone;
  return (additions || []).filter((a) => a.hood === hoodId && a.piece && kits[zone]?.built?.[a.piece]).map((a) => ({ piece: a.piece, id: a.id })).sort((a, b) => (a.piece < b.piece ? -1 : a.piece > b.piece ? 1 : 0));
}

// The clearings around a camera, for `want`.
export function tilesNear(hood, camX, lastTile, span = 1) {
  const i = Math.floor((camX - hood.x0) / TILE), out = [];
  for (let k = Math.max(-1, i - span); k <= Math.min(lastTile + 1, i + span); k++) out.push(k);
  return out;
}
// The clearing at the middle of where a neighbourhood's residents live: its landmark's, and where the camera lands.
export const landingTile = (hood, firstX, lastX) => Math.floor(((firstX + lastX) / 2 - hood.x0) / TILE);

export class SetPieces {
  constructor({ pass = null, video = false, now = () => performance.now(), maxPixels = video ? Infinity : 12e6, budgetMs = 6, make = () => document.createElement('canvas'), side = null } = {}) {
    Object.assign(this, { pass, video, now, maxPixels, budgetMs, make, side: side ?? (video ? 1024 : 512) });
    this.pictures = new Map();  // key -> { data, used, pixels, side, box } (data: { lit, shadow } for pieces, a canvas for cards)
    this.queue = [];
    this.stretched = new Map(); // key -> the most the screen stretched that piece in the last frame
    this.sharp = null;          // the sharp bake under way, if any
    this.scratch = { lit: null, shadow: null };
    this.tiles = new Map();     // clearings already worked out: they never change
    this.tick = 0; this.lastSharp = -SHARP.gap; this.calm = 0; this.camX = null; this.thin = false; this.frameMark = 0;
    this.wanted = [];
    this.wantKey = '';
    this.revealed = [];        // built pieces rising out of the floor this frame: [{ x, y, S, rev }] in screen pixels, for the sand they stir up
    this.used = 0;
    this.pixels = 0;
    this.available = true;
    this.failed = new Set();
    this.hadLight = !!pass?.available;
  }

  get stats() { return { queued: this.queue.length, pixels: this.pixels, pictures: this.pictures.size, sharpening: !!this.sharp }; }

  // What should be ready: [{ hood, tiles, look, landmarkAt }]. Called every frame; only does work when the answer changes.
  // Each entry may carry `built` (piece ids built into that neighbourhood) and `reveals` (piece id -> { t0, dur } in world time, for a Reel's reveal).
  // `early` (the live site's glides): clearings the camera is on its way to, in the same form. They are baked after everything the
  // view needs, so arriving doesn't bake a whole neighbourhood in one frame, and nothing is ever drawn from them. Reels never pass it.
  want(list, early = []) {
    if (!this.available) return;
    const keyOf = (l) => l.map((w) => `${w.hood.id}:${w.tiles.join()}:${w.landmarkAt ?? ''}:${(w.built || []).join('+')}`).join('|');
    const key = keyOf(list) + (early.length ? `>${keyOf(early)}` : '');
    if (key === this.wantKey) { list.forEach((w, i) => { if (this.wanted[i]) this.wanted[i].reveals = w.reveals; }); return; }
    this.wantKey = key;
    this.wanted = list;
    this.queue = [];
    this.stretched.clear();
    this._dropSharp();
    // A piece is baked again if the one held is smaller than this layer needs (a far-only piece now wanted up close).
    // Jobs only `early` asked for are marked, so a busy frame can leave them for a quieter one (bakeSome).
    const seen = new Set(), add = (job, soon) => { if (!seen.has(job.key) && !((this.pictures.get(job.key)?.side ?? 0) >= (job.side ?? 1)) && !this.failed.has(job.key)) { seen.add(job.key); if (soon) job.early = true; this.queue.push(job); } };
    for (const [entries, soon] of [[list, false], [early, true]]) for (const { hood, tiles, look, landmarkAt, built } of entries) {
      // The frame layer comes first: it's what makes a place of it.
      for (const layer of ['frame', 'mid', 'far', 'edge']) for (const i of tiles) {
        // Edge pieces belong to the screen and show in its corners wherever they are ready, mid-glide too, so they wait for arriving (they are small).
        if (soon && layer === 'edge') continue;
        const tile = this._tile(hood, i, landmarkAt, built);
        for (const p of tile[layer]) add(this._pieceJob(hood.zone, p.piece, look, layer === 'edge', layer === 'far'), soon);
        if ((layer === 'far' || layer === 'mid') && tile[layer].length) add({ key: this._cardKey(hood, i, layer), run: () => this._bakeCard(hood, i, layer, tile[layer], look) }, soon);
      }
    }
    if (this.video) this.bakeSome();
  }

  // Up to the time budget of baking, at least one job so progress never stalls. Reels bake everything.
  // early: false leaves the jobs only `want`'s early list asked for, for a frame with time to spare.
  bakeSome({ early = true } = {}) {
    if (this.hadLight && !this.pass.available) this._switchOff();
    if (!this.available) return;
    const start = this.now();
    this.tick++;
    if (!this.queue.length) { this._sharpen(); return; }
    while (this.queue.length && this.available) {
      const at = early ? 0 : this.queue.findIndex((j) => !j.early);
      if (at < 0) break;
      const job = this.queue.splice(at, 1)[0];
      try { job.run(); } catch { this.failed.add(job.key); }
      this._evict();
      if (!this.video && this.now() - start >= this.budgetMs) break;
    }
  }

  // The sharpest a piece is ever baked on the live site: its own `side` if it has one (soft glows gain nothing from more).
  _sharpSide(def) { return Math.min(SHARP.side, def.side ?? SHARP.side); }

  // The piece the screen is stretching most, if it could be sharper.
  // Never one that would push out something this view is showing: a big screen simply keeps a few pieces softer.
  _nextSharp() {
    let best = null, showing = 0;
    for (const pic of this.pictures.values()) if (pic.used > this.frameMark) showing += pic.pixels;
    for (const [key, s] of this.stretched) {
      const pic = this.pictures.get(key), def = kits[s.zone]?.pieces?.[s.id];
      if (!pic || !def || this.failed.has(`${key}:sharp`) || pic.side >= this._sharpSide(def) || s.most <= SHARP.from) continue;
      const side = this._sharpSide(def), grow = (side / pic.side) ** 2;
      if (showing + pic.pixels * (grow - 1) > this.maxPixels) continue;
      if (!best || s.most > best.most) best = { key, def, most: s.most, look: s.look, side, step: 0, art: null, out: null };
    }
    return best;
  }

  // Work still to do for this view: first bakes, then anything waiting to be sharpened.
  get pending() { return this.queue.length + (!this.video && this.available && !this.thin && (this.sharp || this._nextSharp()) ? 1 : 0); }

  // One small step of a sharp bake: draw the art, light it, then swap it in. Only when arriving is over and the view is still,
  // and never two steps close together, so sharpening can't be felt and a slow phone isn't taken for a struggling one.
  _sharpen() {
    if (this.video || !this.available || this.thin || this.calm < SHARP.calm || this.tick - this.lastSharp < SHARP.gap) return;
    if (!this.sharp && !(this.sharp = this._nextSharp())) { this._freeScratch(); return; }
    const job = this.sharp;
    this.lastSharp = this.tick;
    try {
      if (job.step === 0) { job.art = this._art(job.def, job.side); if (!job.art) { this.sharp = null; return; } job.step = 1; }
      else if (job.step === 1) { job.out = this._light(job.def, job.look, job.side, job.art, true); job.step = 2; }
      else { this.sharp = null; this._finish(job.key, job.def, false, job.side, job.art, job.out); this._evict(); }
    } catch { this.failed.add(`${job.key}:sharp`); this._dropSharp(); }
  }

  _dropSharp() {
    const job = this.sharp;
    if (job) { this._free(job.art); if (job.out && job.out.lit !== this.scratch.lit) { this._free(job.out.lit); this._free(job.out.shadow); } }
    this.sharp = null;
  }

  // The two working canvases are only held while there is baking to do.
  _freeScratch() {
    if (!this.scratch.lit) return;
    this._free(this.scratch.lit); this._free(this.scratch.shadow);
    this.scratch = { lit: null, shadow: null };
  }

  // Out of graphics memory, or the context is gone: the rest of the visit goes without scenery.
  _switchOff() {
    this.available = false;
    this.queue = [];
    this.wanted = [];
    this._dropSharp();
    this._freeScratch();
    for (const key of [...this.pictures.keys()]) this._drop(key);
  }

  _free(canvas) { if (canvas) canvas.width = canvas.height = 0; }

  _drop(key) {
    const pic = this.pictures.get(key);
    if (pic.data.getContext) this._free(pic.data); else { this._free(pic.data.lit); this._free(pic.data.shadow); }
    this.pixels -= pic.pixels;
    this.pictures.delete(key);
  }

  _tile(hood, i, landmarkAt, built = []) {
    const key = `${hood.id}:${i}:${landmarkAt}:${built.join('+')}`;
    let tile = this.tiles.get(key);
    if (!tile) { if (this.tiles.size > 256) this.tiles.clear(); this.tiles.set(key, tile = composeTile(hood, i, { landmarkAt, live: !this.video, built })); }
    return tile;
  }

  _pieceKey(zone, id, edge) { return `${zone}:${id}${edge ? ':edge' : ''}`; }
  _cardKey(hood, i, layer) { return `${hood.id}:${i}:${layer}`; }

  _pieceJob(zone, id, look, edge, far = false) {
    const key = this._pieceKey(zone, id, edge), def = kits[zone]?.pieces?.[id];
    const first = this.video || !def ? this.side : Math.min(this.side, this._sharpSide(def));
    const side = edge ? Math.round(this.side / 2) : far && !this.video ? Math.min(first, FAR_SIDE) : first;
    return { key, side, run: () => this._bakePiece(key, zone, id, look, edge, side) };
  }

  _bakePiece(key, zone, id, look, edge, side) {
    const def = kits[zone]?.pieces?.[id];
    if (!def) { this.failed.add(key); return; }
    const art = this._art(def, side);
    if (art) this._finish(key, def, edge, side, art, this._light(def, look, side, art, !edge));
  }

  // The piece's own drawing, on a square with its foot at the bottom middle.
  _art(def, side) {
    const c = this.make(side, side);
    c.width = c.height = side;
    const g = c.getContext('2d');
    if (!g) { this._switchOff(); return null; }
    g.save(); g.scale(side / 1024, side / 1024); g.translate(512, 990);
    // The live site can use a redrawn piece (live) or finer work over the top (detail). A Reel always gets the plain drawing.
    if (this.video) def.draw(g); else { (def.live || def.draw)(g); def.detail?.(g); }
    g.restore();
    return c;
  }

  // Lit by the creature light. A piece that will be cropped is lit onto two working canvases used again for every piece.
  _light(def, look, side, art, reuse) {
    if (!this.pass?.available || def.unlit) return null;
    const into = reuse && this._crops(def) ? this.scratch : {};
    if (into === this.scratch) { into.lit ||= this.make(side, side); into.shadow ||= this.make(side, side); }
    return this.pass.apply(art, { light: look.light, t: 0, h: (def.h * side) / 1024, haze: look.water.haze }, into);
  }

  _crops(def) { return !this.video && !!def.box; }

  // Where the piece and its soft shadow sit on the square, in whole pixels: [x, y, w, h].
  _cropOf(def, side, lit) {
    const k = side / 1024, h = def.h * k, reach = lit ? Math.max(2, LIGHT.heightBlur * h) + 2 : 2, drop = lit ? LIGHT.shadowOffset * LIGHT.unit * h : 0;
    const [l, t, r, b] = def.box;
    const x0 = Math.max(0, Math.floor((512 + l) * k - reach)), y0 = Math.max(0, Math.floor((990 + t) * k - reach));
    const x1 = Math.min(side, Math.ceil((512 + r) * k + reach)), y1 = Math.min(side, Math.ceil((990 + b) * k + reach + drop));
    return [x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)];
  }

  // A copy of part of a canvas, at a share of its size.
  _cut(canvas, x, y, w, h, scale) {
    const out = this.make(), ow = Math.max(1, Math.round(w * scale)), oh = Math.max(1, Math.round(h * scale));
    out.width = ow; out.height = oh;
    out.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, ow, oh);
    return out;
  }

  _finish(key, def, edge, side, art, out) {
    if (!edge && this._crops(def)) {
      const [x, y, w, h] = this._cropOf(def, side, !!out);
      const lit = this._cut(out ? out.lit : art, x, y, w, h, 1), shadow = out ? this._cut(out.shadow, x, y, w, h, 0.5) : null;
      this._free(art);
      if (out && out.lit !== this.scratch.lit) { this._free(out.lit); this._free(out.shadow); }
      this._keep(key, { lit, shadow }, lit.width * lit.height + (shadow ? shadow.width * shadow.height : 0), side, [x / side, y / side, w / side, h / side]);
      return;
    }
    let data = { lit: art, shadow: null };
    if (out) { this._free(art); data = { lit: out.lit, shadow: this._quarter(out.shadow) }; }
    if (edge) { const lit = data.lit, tint = this._tinted(lit, '#04202c', 0.4); data = { lit: this._soften(tint, 3), shadow: null }; this._free(tint); this._free(lit); }
    this._keep(key, data, side * side + (data.shadow ? (side * side) / 4 : 0), side);
  }

  // Shadows are soft, so a half-size one looks the same for a quarter of the memory.
  _quarter(canvas) {
    const small = this.make();
    small.width = Math.max(1, canvas.width >> 1); small.height = Math.max(1, canvas.height >> 1);
    small.getContext('2d').drawImage(canvas, 0, 0, small.width, small.height);
    this._free(canvas);
    return small;
  }

  _tinted(canvas, colour, alpha) {
    const out = this.make(canvas.width, canvas.height);
    out.width = canvas.width; out.height = canvas.height;
    const g = out.getContext('2d');
    g.drawImage(canvas, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = alpha; g.fillStyle = colour; g.fillRect(0, 0, canvas.width, canvas.height);
    return out;
  }

  // Soft focus without ctx.filter (unreliable on iPhones): draw small, then draw big.
  _soften(canvas, factor, keep = 1) {
    const w = Math.max(1, Math.round(canvas.width * keep)), h = Math.max(1, Math.round(canvas.height * keep));
    const small = this.make(), out = this.make(w, h);
    small.width = Math.max(1, Math.round(canvas.width / factor)); small.height = Math.max(1, Math.round(canvas.height / factor));
    out.width = w; out.height = h;
    const down = small.getContext('2d'), up = out.getContext('2d');
    down.imageSmoothingQuality = up.imageSmoothingQuality = 'high';
    down.drawImage(canvas, 0, 0, small.width, small.height);
    up.drawImage(small, 0, 0, w, h);
    this._free(small);
    return out;
  }

  _bakeCard(hood, index, layer, placed, look) {
    const c = this.make(CARD.w, CARD.h);
    c.width = CARD.w; c.height = CARD.h;
    const g = c.getContext('2d');
    for (const p of placed) {
      const pic = this.pictures.get(this._pieceKey(hood.zone, p.piece, false));
      if (!pic) continue;
      const S = (1024 * p.s * CARD.h) / 1688, x = ((p.x - CARD.left) / CARD.span) * CARD.w, y = p.y * CARD.h;
      g.save(); g.translate(x, y); if (p.flip) g.scale(-1, 1);
      if (layer === 'mid' && pic.data.shadow) { g.globalAlpha = 0.34; this._put(g, pic.data.shadow, pic.box, S); g.globalAlpha = 1; }
      this._put(g, pic.data.lit, pic.box, S);
      g.restore();
    }
    const [r, h, b] = look.water.haze;
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = FADE[layer].haze; g.fillStyle = `rgb(${Math.min(255, r * 340) | 0},${Math.min(255, h * 340) | 0},${Math.min(255, b * 340) | 0})`; g.fillRect(0, 0, CARD.w, CARD.h);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // A piece running off the card would stop in a hard vertical line, so on the site the card's sides fade out.
    if (!this.video && g.createLinearGradient) {
      const fade = g.createLinearGradient(0, 0, CARD.w, 0);
      fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(CARD.fade, '#000'); fade.addColorStop(1 - CARD.fade, '#000'); fade.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalCompositeOperation = 'destination-in'; g.fillStyle = fade; g.fillRect(0, 0, CARD.w, CARD.h); g.globalCompositeOperation = 'source-over';
    }
    const card = this._soften(c, FADE[layer].blur, this.video ? 1 : FADE[layer].keep);
    this._free(c);
    this._keep(this._cardKey(hood, index, layer), card, card.width * card.height);
  }

  // Places a piece's picture where its whole square would go: a cropped one lands on its own part of that square.
  _put(ctx, canvas, box, S) { ctx.drawImage(canvas, (box[0] - 0.5) * S, (box[1] - BASE) * S, box[2] * S, box[3] * S); }

  _keep(key, data, pixels, side = 1, box = WHOLE) {
    if (this.pictures.has(key)) this._drop(key);
    this.pictures.set(key, { data, used: ++this.used, pixels, side, box });
    this.pixels += pixels;
  }

  _evict() {
    while (this.pixels > this.maxPixels && this.pictures.size > 1) {
      let oldKey = null, oldest = Infinity;
      for (const [k, v] of this.pictures) if (v.used < oldest) { oldest = v.used; oldKey = k; }
      this._drop(oldKey);
    }
  }

  // Draws one layer: 'far', 'mid', 'frame' or 'edge'. A failure here switches scenery off for the visit; water and residents carry on.
  draw(ctx, layer, cam, t, W, H, { thin = false } = {}) {
    if (!this.available) return;
    if (layer === 'far') this.frameMark = this.used;
    if (layer === 'frame') {
      // How still the view is, in screen pixels a frame: sharpening waits for a glide or a fast drag to end.
      const moved = this.camX === null ? Infinity : Math.abs(cam.x - this.camX) * ((FOCAL * H) / DEPTH.frame);
      this.calm = moved < SHARP.still ? this.calm + 1 : 0;
      this.camX = cam.x; this.thin = thin;
      this.revealed = [];
    }
    try {
      for (const entry of this.wanted) this._drawHood(ctx, layer, entry, cam, t, W, H, thin);
    } catch { this.available = false; }
  }

  _drawHood(ctx, layer, { hood, tiles, landmarkAt, built = [], reveals = null }, cam, t, W, H, thin) {
    const scale = (FOCAL * H) / DEPTH[layer], phone = PHONE_RATIO * H;
    // A zoomed view (cam.zoom) draws this layout scaled about the middle of the screen, so what is in view is wider or narrower than W.
    const halfView = W / 2 / (cam.zoom ?? 1), left = W / 2 - halfView, right = W / 2 + halfView;
    const dy = (cam.hor - ZONE_CAM[hood.zone].hor) * H, centre = (i) => W / 2 + (hood.x0 + TILE * (i + 0.5) - cam.x) * scale;
    if (layer === 'far' || layer === 'mid') {
      for (const i of tiles) {
        const pic = this.pictures.get(this._cardKey(hood, i, layer));
        if (!pic) continue;
        pic.used = ++this.used;
        const dw = CARD.span * phone;
        const x = centre(i) + (CARD.left - 0.5) * phone;
        if (x + dw < left || x > right) continue;
        ctx.drawImage(pic.data, x, dy, dw, H);
      }
      return;
    }
    if (layer === 'edge') {
      // Edge pieces belong to the screen, not the world: they stay in the corners as you swim, with only a hint of movement.
      const i = Math.round((cam.x - hood.x0) / TILE - 0.5), shift = Math.max(-10, Math.min(10, ((hood.x0 + TILE * (i + 0.5) - cam.x) * scale) * 0.04));
      for (const p of this._tile(hood, i, landmarkAt, built).edge) {
        const pic = this.pictures.get(this._pieceKey(hood.zone, p.piece, true));
        if (!pic) continue;
        pic.used = ++this.used;
        const S = (1024 * p.s * H) / 1688, x = (p.x < 0.5 ? p.x * phone : W - (1 - p.x) * phone) + shift, y = p.y * H + dy;
        ctx.save(); ctx.translate(x, y);
        if (p.flip) ctx.scale(-1, 1);
        if (p.sway) ctx.transform(1, 0, Math.sin(t * 0.5 + p.sway) * 0.02, 1, 0, 0);
        this._put(ctx, pic.data.lit, pic.box, S);
        ctx.restore();
      }
      return;
    }
    const note = !this.video && this.stretched, look = this.wanted.find((w) => w.hood === hood)?.look;
    for (const i of tiles) {
      for (const [n, p] of this._tile(hood, i, landmarkAt, built)[layer].entries()) {
        if (thin && layer === 'frame' && n % 2) continue;
        const key = this._pieceKey(hood.zone, p.piece, false), pic = this.pictures.get(key);
        if (!pic) continue;
        // A built piece being revealed is absent until its moment, then rises out of the floor.
        const rev = p.built && reveals?.[p.built], up = rev ? smooth((t - rev.t0) / rev.dur) : 1;
        if (rev && t < rev.t0) continue;
        pic.used = ++this.used;
        const S = (1024 * p.s * H) / 1688, x = centre(i) + (p.x - 0.5) * phone, y = p.y * H + dy;
        if (note && layer === 'frame' && pic.side < SHARP.side) {
          const s = this.stretched.get(key), most = (S * (cam.zoom ?? 1)) / pic.side;
          if (!s) this.stretched.set(key, { zone: hood.zone, id: p.piece, look, most }); else if (most > s.most) s.most = most;
        }
        // Off screen? A cropped piece reaches less far to each side than its square (a little is allowed for its sway).
        const b = pic.box, reach = b === WHOLE ? S / 2 : (Math.max(Math.abs(b[0] - 0.5), Math.abs(b[0] + b[2] - 0.5)) + (p.sway ? 0.03 : 0)) * S;
        if (x + reach < left || x - reach > right) continue;
        ctx.save();
        ctx.translate(x, y);
        if (p.flip) ctx.scale(-1, 1);
        if (p.sway) ctx.transform(1, 0, Math.sin(t * 0.5 + p.sway) * 0.02, 1, 0, 0);
        if (up < 1) { ctx.beginPath(); ctx.rect(-S, -S * 1.5, S * 2, S * 1.5 + S * 0.012); ctx.clip(); ctx.translate(0, (1 - up) * S * (BASE - (pic.box === WHOLE ? 0 : pic.box[1]))); this.revealed.push({ x, y, S, rev }); }
        if (pic.data.shadow) { ctx.globalAlpha = 0.34; this._put(ctx, pic.data.shadow, pic.box, S); ctx.globalAlpha = 1; }
        this._put(ctx, pic.data.lit, pic.box, S);
        const over = kits[hood.zone]?.pieces?.[p.piece]?.over;
        if (over) over(ctx, t, S, (i * 0.37) % 1);
        ctx.restore();
      }
    }
  }
}
