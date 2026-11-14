import { artworkRadius, artworkScale, LENGTHS } from './metrics.js';
import { eventGlowOn } from './extras.js';
import { zoneLookAt, ZONE_LOOKS } from './zone-look.js';
// A picture's haze is its creature's own zone's (render/zone-look.js), never the camera's: on a glide across a border the camera's look
// blends, so a picture made on the way would miss the band the creature is drawn in when it arrives, and it would be drawn live.
const pictureFog = (res, dz, cam) => fogAt(dz, (ZONE_LOOKS[res.zone]?.fog ?? 1) * (cam.fogScale ?? 1));
// Composes one frame. renderScene is a pure function of its inputs: the same scene and time
// always give the same pixels, which is what makes previews and exports match.
import { Water } from './water.js';
import { poseAt, arrivalProgress, reachOf, MAX_REACH } from './motion.js';
import { drawCreature, HAZE_RGB, setHaze, bakePose, bakeTime, pictureFrame, bodyFrame } from './creatures.js';
import { drawAddition, ADDITION_HEIGHT } from './scenery.js';
import { hash01, clamp, lerp, smooth, range } from './util.js';
import { createLightPass, lightPolicy, litPoses, litStale, litShare, litAllowance, litNewcomers, litSharp, LIT_SHARE, spriteSize, SpriteCache, drawLitItem } from './light.js';
import { withCrisp } from './crisp.js';
import { hoodOf, HOOD_BY_ID, ZONE_CAM, slideDepth } from '../core/hoods.js';
import { drawPaidItem, companionSize, homeSize, trailSize, trailFarBoost, TRAIL_STEPS, TRAIL_GAP, sparkle, RAINBOW, trickAt, trickLift, drawSpotlight, fitOf, smoothTrail, trailFade, rippleTrail, drawRainbowRibbon, starGlow } from './paid-items.js';
import { SetPieces, TILE, builtIn, landingTile, tilesNear } from './set-pieces.js';
import './place-reef.js';
import './place-abyss.js';
import './place-deep.js';
import './place-kelp.js';
import './place-shore.js';
import './place-open.js';
import { PICTURES, PictureBook, drawPicture } from './pictures.js';
import { motionOf } from './body-motion.js';

// Lit pictures come in steps of size, so a creature drifting nearer keeps its picture between redraws.
const SPRITE_STEP = Math.log(1.12);
// On phones (tuned with tools/look-speed.mjs): how many creatures are lit a frame, and the largest picture of one.
export const LIVE_LIGHT = { cap: 12, maxSide: 512, sharpSides: [640, 768], detailBudget: 30, waterScale: 0.5 };
// A gliding camera's destination (render's `ahead`): frames between working out again who it will find there, and how quick a
// frame's drawing must have been to spend its allowance on that place too. The glide's first frames still show where it set off
// from, and making pictures on top of those made them slower still (100 ms with the processor slowed 6 times). A glide has time to
// spare, so its frames make pictures at the book's usual pace (PICTURES.budgetMs), not the faster one a page may set for arriving.
// A frame whose pictures took it past frameMs leaves the scenery for the next one, so the two never land in the same frame.
const AHEAD = { every: 8, quietMs: 8, frameMs: 12, pictureMs: PICTURES.budgetMs };
// On the live site a lit picture is made at full length, facing the way the creature faces, and a turn is shown by narrowing
// it when it is placed (light.js, drawLitItem). So the light always falls from the same side, and a turn costs no redraws.
const fullLength = (pose) => ({ ...pose, facing: pose.facing < 0 ? -1 : 1, turning: 0 });
// How a body has moved as one piece since its lit picture was made: narrowed by a turn, mirrored if it has come out the
// other side before its redraw, and tipped as it rises or sinks.
function litTurn(made, res, pose) {
  const now = bodyFrame(res, pose);
  return { width: now.sx * made.sign, angle: made.sign * (now.turn + now.lean - made.lean) };
}
// The size of a creature's lit picture for its size on screen.
// sharp (the live site's biggest few, light.js litSharp): past the usual largest it takes the next of a couple of set sizes, so a body drifting nearer keeps its picture.
function litSize(px, video, sharp = false) {
  const usual = spriteSize(Math.exp(Math.ceil(Math.log(px) / SPRITE_STEP) * SPRITE_STEP), video ? 1024 : LIVE_LIGHT.maxSide);
  if (!sharp || usual.scale === 1) return usual;
  const want = usual.side / usual.scale, side = LIVE_LIGHT.sharpSides.find((s) => s >= want) ?? LIVE_LIGHT.sharpSides.at(-1);
  return { side, scale: side / want };
}
// A picture of this side, as a share of the redraw budget: its upload and light work go with its area.
const litCost = (side) => Math.max(1, (side / LIVE_LIGHT.maxSide) ** 2);
const phaseOf = (id) => { let n = 0; for (const ch of String(id)) n += ch.charCodeAt(0); return n % 4; };
const blank = (side) => { const c = document.createElement('canvas'); c.width = c.height = side; return c; };
// Draws one swim phase of a look into its cell of a picture sheet.
function bakeCell(g, { x, y, side, angle, fog, lod, res }) {
  g.save();
  g.beginPath(); g.rect(x, y, side, side); g.clip();
  g.translate(x + side / 2, y + side / 2);
  const s = side / (PICTURES.box * artworkRadius(res.species));
  g.scale(s, s);
  drawCreature(g, res, bakePose(angle, !!res.walk), bakeTime(angle), fog, lod);
  g.restore();
}

// A phone that can't keep up gives up the extras in this order. Residents are never on the list.
export const qualityStep = (q, fps) => (fps < 24 ? Math.min(4, q + 1) : q);
// Where the tiles of rippling light go: whole pixels, edge to edge, so no seam can show.
export function rippleTiles(t, W, H) {
  const S = Math.round(H * 0.9), tiles = [];
  for (const [sx, sy] of [[9, 6], [-6, 8]]) {
    const ox = Math.round((((t * sx) % S) + S) % S) - S, oy = Math.round((((t * sy) % S) + S) % S) - S;
    for (let y = oy; y < H; y += S) for (let x = ox; x < W; x += S) tiles.push([x, y, S]);
  }
  return tiles;
}
export const qualityFlags = (q) => ({ edge: q < 1, ripples: q < 1, waterScale: q < 2 ? 0.5 : 0.25, thinFrame: q >= 3, lowerCanvas: q >= 4 });

export const FOCAL = 0.95;     // focal length as a share of canvas height
export const WIDE_CAMERA = { x: 0, h: 150, z: 0, hor: 0.565 };
export const CREATURE_SCALE = 0.68; // world units per artwork unit
export const FULL_DETAIL_BUDGET = 70;
const MACRO_DIST = 80;         // how close a magnified close-up stands

// k is the zone's water: higher means the distance fades sooner.
export const fogAt = (dz, k = 1) => 1 - Math.exp(-Math.pow(Math.max(dz - 200, 0) * 0.00112 * k, 1.28)) * 0.72;

// cam.zoom (live site only) is a longer or shorter lens: the whole picture scales about (W / 2, cam.hor * H). Without it nothing changes.
export function project(p, cam, W, H) {
  const f = FOCAL * H * (cam.zoom ?? 1);
  const dz = p.z - cam.z;
  if (dz <= 1) return null;
  const s = f / dz;
  // Only in a neighbourhood view: a close-up keeps true depth, and a glide into one eases between the two.
  const slide = p.slideZ && cam.hoodScale ? lerp(s, f / p.slideZ, cam.hoodBlend ?? 1) : s;
  return { x: W / 2 + (p.x - cam.x) * slide, y: cam.hor * H + (cam.h - p.y) * s, s, dz };
}

// A close-up camera that puts a point at a chosen height on screen.
export function closeUpCamera(p, res, W, H, opts = {}) {
  const calibrated = !!LENGTHS[res?.species];
  // A window that has no size yet still gets a usable camera, so a glide can start from it.
  const tall = W > 0 && H > 0 ? H / W : 16 / 9;
  const fit = 2 * artworkRadius(res?.species) * CREATURE_SCALE * (res?.size || 1) * FOCAL * tall / 0.76;
  const defaultDist = calibrated ? fit : res?.species === 'starfish' ? 230 : res?.species === 'jellyfish' ? 300 : 245;
  // Keep small calibrated residents beyond the renderer near plane in wide windows.
  const dist = Math.max(calibrated ? Math.max(fit, MACRO_DIST) : 0, opts.dist ?? defaultDist);
  const hor = opts.hor ?? (res?.species === 'starfish' ? 0.36 : res?.species === 'jellyfish' ? 0.7 : 0.6);
  const screenY = opts.screenY ?? (res?.species === 'starfish' ? 0.58 : 0.5);
  const h = Math.max(30, p.y + ((screenY - hor) * dist) / FOCAL);
  const macro = calibrated && fit < MACRO_DIST ? MACRO_DIST / Math.max(fit, .0001) : 1;
  return { x: p.x + (opts.lead || 0), h, z: p.z - dist, hor, macro, focusId: res?.id };
}

export function lerpCam(a, b, u) {
  return { x: lerp(a.x, b.x, u), h: lerp(a.h, b.h, u), z: lerp(a.z, b.z, u), hor: lerp(a.hor, b.hor, u), macro:lerp(a.macro||1,b.macro||1,u),focusId:b.focusId||a.focusId,
    ...(a.hoodScale||b.hoodScale ? { hoodScale: true, hood: b.hood ?? a.hood ?? null, hoodBlend: lerp(a.hoodScale ? (a.hoodBlend ?? 1) : 0, b.hoodScale ? (b.hoodBlend ?? 1) : 0, u) } : {}) };
}

// How much bigger a resident is drawn. Neighbourhood cameras use its neighbourhood's scale; other cameras behave as before.
export function magnifyFor(res, cam) {
  const plain = cam.focusId === res.id ? (cam.macro || 1) : 1;
  if (!cam.hoodScale || !res.zone) return plain;
  const hood = hoodOf(res)?.magnify ?? 1, blend = cam.hoodBlend ?? 1;
  // On a glide between a close-up and a neighbourhood, the size changes gradually too.
  return blend >= 1 ? hood : Math.exp(lerp(Math.log(plain), Math.log(hood), blend));
}

// Residents in x order, kept until any of them moves: the sum of their homes changes if one does.
export function knownOrder(cache, list) {
  let sum = 0;
  for (const r of list) sum += r.home.x;
  let known = cache.get(list);
  if (!known || known.n !== list.length || known.sum !== sum) { known = { n: list.length, sum, sorted: [...list].sort((a, b) => a.home.x - b.home.x) }; cache.set(list, known); }
  return known;
}

// The residents of a list sorted by home.x whose homes lie in [x0, x1].
export function windowOf(sorted, x0, x1) {
  let lo = 0, hi = sorted.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid].home.x < x0) lo = mid + 1; else hi = mid; }
  const out = [];
  for (let i = lo; i < sorted.length && sorted[i].home.x <= x1; i++) out.push(sorted[i]);
  return out;
}

export function formatAcross(metres) {
  if (metres < 0.02) return `${Math.round(metres * 1000)} mm`;
  if (metres < 1) return `${Math.round(metres * 100)} cm`;
  return `${Math.round(metres)} m`;
}

function softSprite(size, stops) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return c;
}

// One tile of soft light and dark, repeating.
function rippleSprite() {
  const size = 256, c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  for (let i = 0; i < 90; i++) {
    const x = hash01(i * 1.3) * size, y = hash01(i * 2.7) * size, r = 16 + hash01(i * 4.9) * 40;
    for (const [dx, dy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      gr.addColorStop(0, 'rgba(255,250,220,.5)'); gr.addColorStop(1, 'rgba(255,250,220,0)');
      g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
    }
  }
  return c;
}

function bubbleSprite() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const r = size * 0.44;
  const gr = g.createRadialGradient(size / 2, size / 2, r * 0.62, size / 2, size / 2, r);
  gr.addColorStop(0, 'rgba(225,250,248,0.02)');
  gr.addColorStop(0.8, 'rgba(225,250,248,0.12)');
  gr.addColorStop(1, 'rgba(235,255,252,0.62)');
  g.fillStyle = gr; g.beginPath(); g.arc(size / 2, size / 2, r, 0, 6.283); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.beginPath(); g.ellipse(size * 0.38, size * 0.34, 5.5, 3.6, -0.7, 0, 6.283); g.fill();
  return c;
}

export class OceanRenderer {
  // video: every creature is lit every frame (Reels render offline). light: false draws everything unlit.
  // pictures: unlit creatures come from shared baked pictures. Only the live site asks for this; a Reel never gets it.
  // waterCanvas: a canvas already holding the water's graphics context (water.js, WATER_GL), when the page made one to test the phone.
  constructor(canvas, { video = false, light = true, pictures = false, waterCanvas = undefined } = {}) {
    this.canvas = canvas;
    this.video = video;
    // Paid items' tricks (render/paid-items.js): off unless the live page turns them on with enableTricks(), so Reels never have them.
    this.tricks = null;
    this.pictures = pictures && !video ? new PictureBook({ bake: bakeCell, motionOf }) : null;
    this.light = light ? createLightPass() : null;
    this.sprites = new SpriteCache();
    this.frame = 0;
    this.bodies = new Map();
    this.heights = new Map();
    this.sortedByX = new WeakMap();
    this.halos = new Map();
    this.ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
    this.water = new Water(waterCanvas);
    this.places = new SetPieces({ pass: this.light, video });
    this.quality = 0;
    this.spark = ['rgba(90,230,255,1)', 'rgba(130,255,200,1)', 'rgba(200,160,255,1)'].map((c) => softSprite(24, [[0, c], [0.35, c.replace(',1)', ',.4)')], [1, c.replace(',1)', ',0)')]]));
    this.ripple = rippleSprite();
    this.snow = softSprite(32, [[0, 'rgba(230,250,245,1)'], [0.4, 'rgba(225,248,245,0.5)'], [1, 'rgba(225,248,245,0)']]);
    this.bokeh = softSprite(96, [[0, 'rgba(210,245,240,0.32)'], [0.72, 'rgba(210,245,240,0.21)'], [0.9, 'rgba(210,245,240,0.08)'], [1, 'rgba(210,245,240,0)']]);
    this.shadow = softSprite(128, [[0, 'rgba(3,28,40,0.74)'], [0.55, 'rgba(3,28,40,0.34)'], [1, 'rgba(3,28,40,0)']]);
    this.puff = softSprite(128, [[0, 'rgba(226,212,178,0.7)'], [0.6, 'rgba(226,212,178,0.25)'], [1, 'rgba(226,212,178,0)']]);
    this.bubble = bubbleSprite();
    this.stats = { drawn: 0, full: 0, simple: 0, dots: 0, culled: 0, lit: 0, pictured: 0 };
    // The live site's hidden phone meter (app/site2/js/meter.js) puts an object here to be told how long the water and the light took.
    // It only ever reads the clock, so a frame comes out the same with or without it.
    this.meter = null;
  }

  // A creature's lit picture, redrawn when its turn comes. Null means draw it the ordinary way this frame.
  _litEntry(it, k, t, fog, light, rank, xmasTrick = null) {
    const pass = this.light;
    if (!pass?.available) return null;
    const { lit, refresh } = lightPolicy({ px: it.px, rank, frame: this.frame, phase: phaseOf(it.res.id), video: this.video, cap: LIVE_LIGHT.cap, turning: it.pose.turning > 0.02, beatHz: it.pose.m.tail / 6.283 });
    if (!lit) return null;
    const { side, scale } = litSize(it.px, this.video, !!this.litPlan?.sharp.has(it.res.id));
    let entry = this.sprites.get(it.res.id, side);
    const plan = this.litPlan, had = plan && !entry ? this.sprites.any(it.res.id) : null;
    // A new picture waits its turn. Until then the picture it has at another size stands in, and with none it is drawn the plain way.
    if (plan && !entry && !plan.fresh.has(it.res.id)) { if (had) had.scale = had.baseScale * (had.k / k); return had || null; }
    // On the live site the frame's plan says who is redrawn (_litPlan). Everywhere else each creature goes by the frame number.
    const planned = plan ? plan.due.has(it.res.id) : refresh, due = planned || xmasTrick != null;
    // A Christmas trick redraws its creature every frame; that comes out of the frame's lighting allowance like any other.
    if (plan && !planned && due) this.litLeft -= litCost(side);
    if (!entry || due) {
      const next = entry || { crisp: blank(side), lit: null, shadow: null, side, baseScale: scale, scale, k, born: plan && !had ? t : undefined };
      if (!this.bodies.has(side)) this.bodies.set(side, blank(side));
      const body = this.bodies.get(side), b = body.getContext('2d'), cr = next.crisp.getContext('2d'), began = this.meter ? performance.now() : 0;
      for (const c of [b, cr]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, side, side); c.globalAlpha = 1; }
      b.translate(side / 2, side / 2);
      b.scale(k * scale, k * scale);
      const drawnAs = this.litPlan ? fullLength(it.pose) : it.pose, whole = this.litPlan ? bodyFrame(it.res, drawnAs) : null, drawnRes = xmasTrick == null ? it.res : { ...it.res, xmasTrick };
      withCrisp(cr, () => drawCreature(b, drawnRes, drawnAs, t, fog, 2));
      // The creature's height is measured once per species (art units), on a copy the processor draws: reading pixels back from the graphics chip is slow.
      if (!this.heights.has(it.res.species)) this.heights.set(it.res.species, pass.measureDrawing((c, aside) => { c.translate(side / 2, side / 2); c.scale(k * scale, k * scale); withCrisp(aside, () => drawCreature(c, drawnRes, drawnAs, t, fog, 2)); }, side) / (k * scale));
      const h = this.heights.get(it.res.species) * k * scale;
      const out = pass.apply(body, { light, t, h, haze: this.look.water.haze }, { lit: next.lit, shadow: next.shadow });
      if (!out) return null;
      // Capped pictures share a side across sizes, so the scale it was drawn at is stored with each redraw.
      next.lit = out.lit; next.shadow = out.shadow; next.k = k; next.baseScale = scale; next.swim = it.pose.swim; next.t = t;
      if (whole) { next.sign = whole.sx < 0 ? -1 : 1; next.lean = whole.lean; }
      if (!entry) this.sprites.put(it.res.id, side, next);
      entry = next;
      if (this.meter) { this.meter.lit += performance.now() - began; this.meter.redraws++; }
    }
    entry.scale = entry.baseScale * (entry.k / k);
    return entry;
  }

  // The live site: which lit creatures are redrawn this frame, decided before any is drawn so that they share one budget
  // fairly (light.js, LIT_SHARE). Each is due by how far its own tail has moved since its picture was made.
  _litPlan(items, rankOf, t, focusId) {
    const passed = Math.max(0, t - (this.litAt ?? t));
    this.litLeft = litAllowance(this.litLeft ?? LIT_SHARE.burst, passed);
    this.litAt = t;
    const list = [], waiting = [], lit = items.filter((it) => it.kind === 'res' && it.px >= 42 && rankOf.get(it) < LIVE_LIGHT.cap);
    // A phone that has had to give things up keeps to the usual size. A creature with no picture yet starts at the usual size too, so arriving costs no more.
    const could = this.quality === 0 ? lit.filter((it) => litSize(it.px, false).scale < 1 && this.sprites.any(it.res.id)) : [];
    this.litSharpNow = litSharp(this.litSharpNow ?? new Set(), could.map((it) => ({ key: it.res.id, px: it.px, first: it.res.id === focusId })));
    for (const it of lit) {
      const { side } = litSize(it.px, false, this.litSharpNow.has(it.res.id)), made = this.sprites.get(it.res.id, side), cost = litCost(side);
      if (!made) { waiting.push({ key: it.res.id, order: it.res.id === focusId ? -1 : rankOf.get(it), cost, sharper: side > LIVE_LIGHT.maxSide && !!this.sprites.any(it.res.id) }); continue; }
      const poses = litPoses(it.px, !!motionOf(it.res.species).pulse);
      const stale = litStale(made, it.pose.swim, t, poses, (0.5 * it.pose.m.tail * Math.min(passed, 0.1) * poses) / 6.283);
      // A body that has turned to face the other way needs its picture made again from that side, before anyone else's.
      list.push({ key: it.res.id, cost, stale: (bodyFrame(it.res, it.pose).sx < 0 ? -1 : 1) !== made.sign ? 1000 + stale : stale });
    }
    const costOf = new Map([...list, ...waiting].map((x) => [x.key, x.cost])), spend = (keys) => { for (const k of keys) this.litLeft -= costOf.get(k); return keys; };
    // Everyone on screen gets a picture before anyone gets a sharper one, and then one a frame. It goes ahead of the redraws, or a busy view would leave its stand-in unmoving.
    const first = waiting.filter((x) => !x.sharper), sharper = waiting.filter((x) => x.sharper).sort((a, b) => a.order - b.order)[0];
    this.litWaiting = first.length;
    const fresh = spend(litNewcomers(first));
    if (!first.length && sharper && sharper.cost <= this.litLeft) fresh.push(...spend([sharper.key]));
    return { due: new Set(spend(litShare(list, this.litLeft))), fresh: new Set(fresh), sharp: this.litSharpNow };
  }

  // The live site: true while the view still has scenery, or creatures' first lit pictures, to make. Like the shared pictures still
  // being made (pictures.js, stillBaking), those first frames say nothing about how fast the phone is (site2/js/watchdog.js).
  arriving() { return (this.litWaiting ?? 0) > 0 || this.places.queue.length > 0; }

  // Only the residents who could be on screen: with neighbourhood cameras a long ocean costs no more than a short one.
  _residentsNear(scene, cam, W, H) {
    const list = scene.residents || [];
    if (!cam.hoodScale) return list;
    const known = knownOrder(this.sortedByX, list);
    // Half the screen at the furthest rows, plus as far as anyone roams from home.
    const reach = ((W / H) / FOCAL) * 650 / (cam.zoom ?? 1) + MAX_REACH;
    const near = windowOf(known.sorted, cam.x - reach, cam.x + reach);
    const extra = list.filter((r) => (scene.arrivals?.[r.id] || r.id === cam.focusId) && Math.abs(r.home.x - cam.x) > reach);
    return extra.length ? near.concat(extra) : near;
  }

  // Which clearings a neighbourhood's residents reach, and the one that holds its landmark. Recounted when residents move.
  _stretch(scene, hood) {
    const known = this.sortedByX.get(scene.residents || []);
    if (!known) return { last: 1, mid: 0 };
    known.stretch ||= new Map();
    if (!known.stretch.has(hood.id)) {
      let first = Infinity, far = -Infinity;
      for (const r of known.sorted) if (r.zone === hood.zone && hoodOf(r)?.id === hood.id) { first = Math.min(first, r.home.x); far = Math.max(far, r.home.x); }
      known.stretch.set(hood.id, far < first ? { last: 1, mid: 0 } : { last: Math.ceil((far - hood.x0) / TILE), mid: landingTile(hood, first, far) });
    }
    return known.stretch.get(hood.id);
  }

  // A creature's shared picture this frame, or null when it has to be drawn. Followed creatures are always drawn sharp.
  // near is its place counting from the camera: only the nearest few, which nothing covers, get the sharpest picture.
  _picture(it, fog, near, cam) {
    if (!this.pictures || it.res.id === cam.focusId) return null;
    return this.pictures.get({ res: it.res, lod: it.px > 42 ? 2 : 1, px: it.px, fog, swim: it.pose.swim, allowTop: near < PICTURES.topCount, blend: it.px >= PICTURES.blendFrom });
  }

  // The clearings a gliding camera will land among, for the scenery to bake early (SetPieces.want's `early`). Only in the
  // neighbourhood being drawn, and lit by the look of where the camera is going, the same as they will be drawn there.
  _aheadPlaces(ahead, hood, last, mid, built, W, H) {
    if (!ahead?.hoodScale || ahead.hood !== hood.id) return [];
    const zoom = ahead.zoom ?? 1;
    return [{ hood, tiles: tilesNear(hood, ahead.x, last, Math.max(1, Math.ceil(((W / H) * 1.2) / zoom))), look: zoneLookAt(ahead.x), landmarkAt: mid, built: built.map((b) => b.piece) }];
  }

  // Asks for the pictures a gliding camera's destination will be drawn with, so this frame's bakeSome makes them (PictureBook.get
  // queues any it hasn't made). Who is there is worked out again every few frames: in that time it changes too little to matter.
  _aheadPictures(scene, t, ahead, W, H) {
    const key = `${ahead.hood}|${Math.round(ahead.x / 50)}|${(ahead.zoom ?? 1).toFixed(2)}|${ahead.focusId ?? ''}`, list = scene.residents || [];
    let plan = this.aheadPlan;
    if (!plan || plan.key !== key || plan.list !== list || this.frame - plan.frame >= AHEAD.every) plan = this.aheadPlan = { key, list, frame: this.frame, asks: this._aheadAsks(scene, t, ahead, W, H) };
    for (const ask of plan.asks) this.pictures.get(ask);
  }

  // The same choices render makes for the creatures on screen: the nearest get the sharpest pictures, every picture is asked for with
  // the zone's own haze (as render draws it), and a followed creature is always drawn, never pictured.
  _aheadAsks(scene, t, cam, W, H) {
    if (cam.macro > 1.01 && cam.focusId) return [];
    const seen = [];
    for (const res of this._residentsNear(scene, cam, W, H)) {
      if (res.id === cam.focusId) continue;
      const arrival = scene.arrivals?.[res.id];
      if (arrival && t < arrival.t0) continue;
      let pose = poseAt(res, t, arrival);
      if (scene.poseAdjust) pose = scene.poseAdjust(res, pose, t) || pose;
      const q = project(pose, cam, W, H);
      if (!q || q.dz < 40) continue;
      const px = q.s * CREATURE_SCALE * (res.size || 1) * magnifyFor(res, cam) * artworkRadius(res.species);
      if (px < 9 || q.x + px < -60 || q.x - px > W + 60 || q.y + px * 1.1 < -60 || q.y - px > H + 60) continue;
      seen.push({ res, swim: pose.swim, dz: q.dz, px });
    }
    return seen.sort((a, b) => a.dz - b.dz).map((it, near) => ({ res: it.res, lod: it.px > 42 ? 2 : 1, px: it.px, fog: pictureFog(it.res, it.dz, cam), swim: it.swim, allowTop: near < PICTURES.topCount, blend: it.px >= PICTURES.blendFrom }));
  }

  // Paid items' tricks. The live ocean page turns them on, and starts a creature's tricks when it is tapped or when the camera
  // lands on a creature that was found (startTrick). A followed creature's home keeps its lights on, fading in and out.
  // play: false (reduced motion) keeps a followed home's lights but plays no tricks.
  enableTricks({ play = true } = {}) { this.tricks ||= { started: new Map(), focus: null, focusAt: 0, left: null, leftAt: 0, play }; }
  // Only for a creature with items, and a second tap while its trick runs leaves the trick going rather than starting it again.
  startTrick(res, t) {
    const T = this.tricks;
    if (!T?.play || !res?.paid || res.id == null) return;
    if (T.started.has(res.id) && trickAt(T.started.get(res.id), t) != null) return;
    T.started.set(res.id, t);
  }
  // A creature's trick this frame: { u: 0 to 1 while one runs, else null; lit: its home's lights }, or null with none at all.
  trickOf(res, t, cam) {
    const T = this.tricks;
    if (!T || !res?.paid) return null;
    let u = null;
    if (T.started.has(res.id)) { u = trickAt(T.started.get(res.id), t); if (u == null && t >= T.started.get(res.id)) T.started.delete(res.id); }
    const lit = cam?.focusId === res.id ? clamp((t - T.focusAt) / 0.5) : T.left === res.id ? clamp(1 - (t - T.leftAt) / 0.5) : 0;
    return u == null && !lit ? null : { u, lit };
  }
  _noticeFocus(cam, t) {
    const T = this.tricks;
    if (!T || (cam.focusId ?? null) === T.focus) return;
    if (T.focus != null) { T.left = T.focus; T.leftAt = t; }
    T.focus = cam.focusId ?? null; T.focusAt = t;
  }

  // scene: { residents, additions, arrivals: {id: {t0,dur,fromSide}}, additionReveals: {id:{t0,dur}}, label: id|null, labelAll, hidden:Set }
  // ahead (the live site only): where a gliding camera is going. A glide between zones sees nothing until its last frame, which then
  // had to make a whole neighbourhood's scenery and creature pictures at once (2026-11-14: 133 to 166 ms with the processor slowed
  // 6 times). Now that place's pictures are made on the way, out of each frame's usual allowance. Nothing is drawn from it, so every
  // frame shows what it would have shown anyway, and Reels never pass it.
  render(scene, t, cam, ahead = null) {
    const { canvas, ctx } = this;
    const W = canvas.width, H = canvas.height;
    // A window with no size has nothing to draw on, and copying an empty water canvas would throw.
    if (!W || !H) return this.stats;
    if (this.video || !this.pictures) ahead = null;
    if (!ahead) this.aheadPlan = null;
    const began = ahead ? performance.now() : 0;
    this.pictures?.beginFrame();
    this._noticeFocus(cam, t);
    const hor = cam.hor * H, zoom = cam.zoom ?? 1;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // The zone the camera is in sets the water, the floor, the light and the haze.
    const look = zoneLookAt(cam.x);
    this.look = look;
    setHaze(look.water.haze);
    // The water is soft, so on phones it's drawn at half size and scaled up. Reels draw it at full size.
    const flags = qualityFlags(this.video ? 0 : this.quality), ws = this.video ? 1 : flags.waterScale, meter = this.meter;
    if (meter) { meter.lit = 0; meter.redraws = 0; meter.waterCall = [Math.ceil(W * ws), Math.ceil(H * ws), t, cam, FOCAL * H * ws * zoom, hor * ws, look]; meter.water = performance.now(); }
    ctx.drawImage(this.water.render(Math.ceil(W * ws), Math.ceil(H * ws), t, cam, FOCAL * H * ws * zoom, hor * ws, look), 0, 0, W, H);
    if (meter) meter.water = performance.now() - meter.water;
    ctx.globalAlpha = 1;

    // The place itself: far distance, middle distance, then the sharp frame around the clearing.
    const near = this._residentsNear(scene, cam, W, H), inHood = cam.hoodScale ? HOOD_BY_ID[cam.hood] : null;
    if (inHood) {
      const { last, mid } = this._stretch(scene, inHood);
      // Pieces the residents asked for stand in this neighbourhood's landmark clearing. In a Reel, one may still be rising out of the floor.
      const built = builtIn(scene.additions, inHood.id), reveals = {};
      for (const b of built) if (scene.additionReveals?.[b.id]) reveals[b.piece] = scene.additionReveals[b.id];
      this.places.want([{ hood: inHood, tiles: tilesNear(inHood, cam.x, last, Math.max(1, Math.ceil(((W / H) * 1.2) / zoom))), look, landmarkAt: mid, built: built.map((b) => b.piece), reveals }], this._aheadPlaces(ahead, inHood, last, mid, built, W, H));
      // Scenery is laid out on the screen, so a zoomed view scales it about the point the lens keeps still.
      if (zoom !== 1) { ctx.save(); ctx.translate(W / 2, hor); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -hor); }
      for (const layer of ['far', 'mid', 'frame']) this.places.draw(ctx, layer, cam, t, W, H, { thin: flags.thinFrame });
      for (const r of this.places.revealed) this._sandPuffs({ x: r.x, y: r.y }, r.rev, t, r.S * 0.42);
      if (zoom !== 1) ctx.restore();
    } else this.places.want([]);

    const items = [];
    const stats = { drawn: 0, full: 0, simple: 0, dots: 0, culled: 0, lit: 0, pictured: 0 };
    const margin = 0.5;
    for (const add of scene.additions || []) {
      if (add.hood) continue; // built into a neighbourhood's clearing, drawn with the scenery above
      const rev = scene.additionReveals?.[add.id];
      if (rev && t < rev.t0) continue;
      const q = project(add.pos, cam, W, H);
      if (!q) continue;
      const halfW = (add.width || 400) * 0.6 * q.s;
      if (q.x + halfW < -W * margin || q.x - halfW > W * (1 + margin)) continue;
      items.push({ kind: 'add', add, q, dz: q.dz, rev });
    }
    const resById = new Map();
    for (const res of near) {
      const focused = cam.focusId === res.id;
      if(cam.macro>1.01 && cam.focusId && !focused)continue;
      resById.set(res.id, res);
      const arrival = scene.arrivals?.[res.id];
      if (arrival && t < arrival.t0) continue;
      // On the live site a bought home stands at its spot whether or not its owner is on screen. A Reel shows a home only
      // with its owner (below), so it never appears ahead of them.
      if (!this.video && res.paid?.home && res.home) { const home = this._homeAt(res, cam, W, H); if (home) items.push(home); }
      const magnify=magnifyFor(res, cam);
      const pin = focused && (cam.macro || 1) > 1.01 ? 1 - (cam.hoodScale ? (cam.hoodBlend ?? 1) : 0) : 0, macro = pin > 0 && magnify > 1.01;
      const size = (res.size || 1)*magnify;
      // Quick reject before computing a pose, which is what lets large populations cull cheaply.
      // Never the followed creature: its home can be a whole zone from a camera still on its way.
      if (!arrival && !focused) {
        const dzHome = res.home.z - cam.z;
        // Near a resident, defer culling to its actual animated position below.
        if (dzHome > 160) {
        const f = (FOCAL * H * zoom) / dzHome;
        const sxHome = W / 2 + (res.home.x - cam.x) * f;
        const reach = (reachOf(res) + 40 + artworkRadius(res.species) * CREATURE_SCALE * size) * f;
        if (sxHome + reach < -W * margin || sxHome - reach > W * (1 + margin)) { stats.culled++; continue; }
        }
      }
      let pose = poseAt(res, t, arrival);
      if (scene.poseAdjust) pose = scene.poseAdjust(res, pose, t) || pose;
      // A magnified creature stays in front of the lens even if the camera sets off from beyond it.
      if (macro) pose = { ...pose, z: Math.max(pose.z, cam.z + MACRO_DIST) };
      const q = project(pose, cam, W, H);
      if(q && macro){q.x=lerp(q.x,W/2,pin);q.y=lerp(q.y,H*.5,pin);}
      if (!q || q.dz < 40) { stats.culled++; continue; }
      const px = q.s * CREATURE_SCALE * size * artworkRadius(res.species);
      if (q.x + px < -60 || q.x - px > W + 60) { stats.culled++; continue; }
      if (q.y + px * 1.1 < -60 || q.y - px > H + 60) { stats.culled++; continue; }
      items.push({ kind: 'res', res, pose, q, dz: q.dz, px, size, arrival });
      if (this.video && res.paid?.home && res.home) { const home = this._homeAt(res, cam, W, H); if (home) items.push(home); }
    }
    // Far to near, and the creature the camera is on goes last so nobody can swim in front of it.
    const onTop = (i) => (i.kind === 'res' && i.res.id === cam.focusId ? 1 : 0);
    items.sort((a, b) => onTop(a) - onTop(b) || b.dz - a.dz);
    // Detail budget: the nearest residents get full artwork, the rest a simplified form.
    // Under FULL_DETAIL_BUDGET residents on screen, nobody is simplified.
    const resCount = items.reduce((n, i) => n + (i.kind === 'res' ? 1 : 0), 0);
    let toSkip = Math.max(0, resCount - (this.video ? FULL_DETAIL_BUDGET : LIVE_LIGHT.detailBudget));

    // Contact shadows sit on the sand beneath everything else.
    for (const it of items) {
      if (it.kind !== 'res') continue;
      const dzFloor = it.pose.z - cam.z;
      const fs = (FOCAL * H * zoom) / dzFloor;
      const sy = hor + cam.h * fs;
      if (sy > H + 40 || it.px < 8) continue;
      const height = it.pose.y;
      const alpha = clamp(1 - height / 620) * (it.res.species === 'starfish' ? 0.62 : 0.5) * clamp(1 - fogAt(dzFloor, look.fog) * 1.15);
      if (alpha <= 0.01) continue;
      const rw = (LENGTHS[it.res.species] ? artworkRadius(it.res.species) * 0.7 : it.res.species === 'stingray' ? 72 : it.res.species === 'starfish' ? 56 : 62) * it.size * CREATURE_SCALE * fs * (1 + height * 0.0016);
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.shadow, it.q.x - rw, sy - rw * 0.2 + (it.res.species === 'starfish' ? rw * 0.07 : 0), rw * 2, rw * 0.4);
    }
    ctx.globalAlpha = 1;

    this._drawSnow(t, cam, W, H, 'far');

    const P = {};
    // The largest creatures on screen get the light first.
    const rankOf = new Map(items.filter((i) => i.kind === 'res').sort((a, b) => b.px - a.px).map((i, n) => [i, n]));
    this.litPlan = this.pictures && this.light?.available ? this._litPlan(items, rankOf, t, cam.focusId) : null;
    // Pictures are chosen nearest first, so when memory is short the creatures in front get it.
    if (this.pictures) {
      let near = 0;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (it.kind !== 'res' || it.px < 9) continue;
        it.near = near++;
        if (!(this.light?.available && rankOf.get(it) < LIVE_LIGHT.cap)) it.picture = this._picture(it, pictureFog(it.res, it.dz, cam), it.near, cam);
      }
    }
    for (const it of items) {
      // The creature the camera is on always stays clear of the haze, however far back the camera has to stand.
      const fog = (it.kind === 'res' || it.kind === 'home') && it.res.id === cam.focusId ? Math.min(0.15, fogAt(it.dz, look.fog)) : fogAt(it.dz, look.fog * (cam.fogScale ?? 1));
      if (it.kind === 'add') {
        this._drawAdd(it, t, fog, H);
        continue;
      }
      if (it.kind === 'home') { this._drawHome(it, t, cam, fog); continue; }
      stats.drawn++;
      if (it.px < 9) {
        stats.dots++;
        const c = hexToFog(it.res.colors?.primary, fog);
        // A creature in the Spotlight still shows from far off: a small gold light round its dot.
        if (it.res.paid?.spotlight) { ctx.save(); ctx.globalAlpha = Math.max(0.35, 1 - fog * 0.6); drawSpotlight(ctx, it.q.x, it.q.y, Math.max(it.px * 0.6, 3), t); ctx.restore(); }
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(it.q.x, it.q.y, Math.max(it.px * 0.5, 1), Math.max(it.px * 0.28, 0.8), 0, 0, 6.283); ctx.fill();
        continue;
      }
      // Paid extras (Task 8): the home and the trail sit behind the creature, its companion swims in front of it.
      const fx = it.res.paid ? this.trickOf(it.res, t, cam) : null;
      if (it.res.paid) this._paidBehind(it, t, cam, W, H, fog, fx);
      if (look.halo[3] > 0.01) this._halo(it, look.halo);
      let lod = it.px > 42 ? 2 : 1;
      // With pictures on, only creatures in line for the light keep full art drawn live; the rest still show it in pictures.
      if (toSkip > 0) { toSkip--; if (this.pictures ? rankOf.get(it) >= LIVE_LIGHT.cap : it.px < 150) lod = 1; }
      lod === 2 ? stats.full++ : stats.simple++;
      ctx.save();
      ctx.translate(it.q.x, it.q.y);
      const k = it.q.s * CREATURE_SCALE * it.size;
      ctx.scale(k, k);
      const u = it.arrival ? arrivalProgress(it.arrival, t) : 1;
      // Anyone almost touching the lens melts away, so nobody ever blocks a close-up. The creature it's a close-up of stays solid.
      const fadeScale = Math.min(1, artworkScale(it.res.species));
      const nearLens = it.res.id === cam.focusId ? 1 : smooth((it.dz - 100 * fadeScale) / (110 * fadeScale));
      if (nearLens <= 0) { ctx.restore(); continue; }
      const fade = (u < 1 ? smooth(u * 7) : 1) * nearLens;
      ctx.globalAlpha = fade;
      // The milestone week (core/milestone.js): a soft sea-light behind every creature, however it's drawn below.
      if (eventGlowOn()) {
        const R = artworkRadius(it.res.species) * 0.8, g = ctx.createRadialGradient(0, 0, R * 0.05, 0, 0, R);
        g.addColorStop(0, 'rgba(127, 246, 255, 0.6)'); g.addColorStop(0.45, 'rgba(127, 246, 255, 0.24)'); g.addColorStop(1, 'rgba(127, 246, 255, 0)');
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      // A Christmas item's trick is part of the creature's art, so it shows only where the creature is drawn at full art: in its
      // lit picture (redrawn every frame of the trick), or live in place of a shared picture. Smaller, it wears no hat to move.
      const xmasTrick = fx?.u != null && it.res.paid.christmas ? fx.u : null;
      const entry = lod === 2 ? this._litEntry(it, k, t, fog, look.light, rankOf.get(it), xmasTrick) : null;
      // A new lit picture comes up over the plain creature, so nothing pops.
      const coming = entry?.born === undefined ? 1 : clamp((t - entry.born) / LIT_SHARE.fadeIn), under = !entry || coming < 1;
      const wears = xmasTrick != null && !entry && (it.picture ? it.px > 42 : lod === 2 && (!this.pictures || it.res.id === cam.focusId));
      const picture = !under || wears ? null : it.picture !== undefined ? it.picture : this._picture(it, fog, it.near ?? 0, cam);
      if (!under) ctx.restore();
      else if (picture) { ctx.restore(); drawPicture(ctx, picture, it.q.x, it.q.y, it.px, pictureFrame(it.res, it.pose), fade); if (!entry) stats.pictured++; }
      // Until its picture is ready, a creature is drawn the simple way. The followed creature always gets its full art.
      else if (wears) { drawCreature(ctx, { ...it.res, xmasTrick }, it.pose, t, fog, 2); ctx.restore(); }
      else { drawCreature(ctx, it.res, it.pose, t, fog, this.pictures && it.res.id !== cam.focusId ? 1 : lod); ctx.restore(); }
      if (entry) { drawLitItem(ctx, it.q.x, it.q.y, entry, fade * coming, entry.sign ? litTurn(entry, it.res, it.pose) : null); stats.lit++; }
      ctx.globalAlpha = 1;
      if (lod === 2) this._residentBubbles(it, t, cam, W, H);
      if (it.res.paid?.companion) this._paidCompanion(it, t, cam, W, H, fog, fx);
      if (fx?.u != null && it.res.paid.trail) this._paidBurst(it, fx.u, fog);
    }
    this.stats = stats;
    this.frame++;
    // The edge pieces belong to the screen, so a zoomed view leaves them where the same camera without the zoom would have them.
    if (inHood && flags.edge) this.places.draw(ctx, 'edge', zoom === 1 ? cam : { ...cam, hor: 0.5 + (cam.hor - 0.5) / zoom }, t, W, H);
    if (flags.ripples && look.caustic > 0.05) this._ripples(t, W, H, look.caustic);
    if (look.halo[3] > 0.01) this._sparks(t, cam, W, H);
    // Only a frame that was quick to draw spends its allowance on where the camera is going as well.
    const quiet = !!ahead && performance.now() - began < AHEAD.quietMs;
    if (quiet) this._aheadPictures(scene, t, ahead, W, H);
    this.pictures?.bakeSome(quiet ? { budgetMs: Math.min(this.pictures.budgetMs, AHEAD.pictureMs) } : undefined);
    this.places.bakeSome({ early: quiet && performance.now() - began < AHEAD.frameMs });
    if(cam.macro>1.01){ctx.save();ctx.font=`${Math.max(13,W*.016)}px sans-serif`;ctx.fillStyle='rgba(218,245,245,.88)';ctx.textAlign='right';ctx.fillText(`Close-up · ${cam.macro.toFixed(cam.macro<10?1:0)}× magnification`,W-20,H-24);ctx.restore();}
    const seen = cam.hoodScale ? HOOD_BY_ID[cam.hood] : null;
    if (seen && seen.ref < 0.1) { ctx.save(); ctx.font = `${Math.max(13, W * .016)}px sans-serif`; ctx.fillStyle = 'rgba(218,245,245,.88)'; ctx.textAlign = 'right'; ctx.fillText(`Magnified · this screen is about ${formatAcross(seen.screenAcross)} across`, W - 20, H - 24); ctx.restore(); }

    // Arrival bubbles
    for (const id of Object.keys(scene.arrivals || {})) {
      const res = resById.get(id);
      if (res) this._arrivalBubbles(res, scene.arrivals[id], t, cam, W, H);
    }
    this._ambientBubbles(t, cam, W, H);
    this._drawSnow(t, cam, W, H, 'near');

    // Username label, only for a close-up or the current selection.
    const labels = scene.labels || [];
    for (const l of labels) {
      const it = items.find((i) => i.kind === 'res' && i.res.id === l.id);
      if (it) drawUsernameLabel(ctx, it, l.alpha ?? 1, W, H, l.safe);
    }
    return stats;
  }

  // Sunlight rippling over everything in the bright zones: two drifting copies of one soft pattern.
  _ripples(t, W, H, strength) {
    const { ctx } = this;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.05 * strength;
    for (const [x, y, S] of rippleTiles(t, W, H)) ctx.drawImage(this.ripple, x, y, S, S);
    ctx.restore();
  }

  // Tiny sparks of living light in the dark zones.
  _sparks(t, cam, W, H) {
    const { ctx } = this;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 44; i++) {
      const x = mod(hash01(i * 3.3) * W * 1.4 - cam.x * 0.35 + Math.sin(t * 0.13 + i) * 18, W * 1.4) - W * 0.2;
      const y = mod(hash01(i * 7.1) * H + Math.sin(t * 0.09 + i * 2) * 22, H);
      const r = (1.6 + hash01(i + 9) * 3.4) * Math.max(1, H / 1000);
      ctx.globalAlpha = 0.25 + 0.55 * Math.pow(Math.max(0, Math.sin(t * (0.5 + hash01(i) * 1.1) + i)), 3);
      ctx.drawImage(this.spark[i % 3], x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  }

  // Whether the page should also lower the canvas resolution, after the renderer has given up what it can.
  noteFps(fps) {
    if (this.video) return false;
    this.quality = qualityStep(this.quality, fps);
    return fps < 24 && qualityFlags(this.quality).lowerCanvas;
  }

  // A soft glow behind a resident, so nobody disappears in the dark zones.
  _halo(it, [r, g, b, a]) {
    const { ctx } = this, key = [r, g, b].map((v) => Math.round(v * 12)).join();
    if (!this.halos.has(key)) this.halos.set(key, softSprite(128, [[0, `rgba(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0},1)`], [0.5, `rgba(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0},0.32)`], [1, `rgba(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0},0)`]]));
    const R = it.px * 1.25;
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = a; ctx.drawImage(this.halos.get(key), it.q.x - R, it.q.y - R, R * 2, R * 2); ctx.restore();
  }

  _drawAdd(it, t, fog, H) {
    const { ctx } = this;
    const { add, q, rev } = it;
    const u = rev ? smooth((t - rev.t0) / rev.dur) : 1;
    const k = q.s;
    const height = ADDITION_HEIGHT[add.type] || 200;
    const groundY = q.y;
    // Soft contact pool
    ctx.globalAlpha = 0.5 * clamp(1 - fog) * u;
    const w = (add.width || 400) * 0.64 * k;
    ctx.drawImage(this.shadow, q.x - w, groundY - w * 0.08, w * 2, w * 0.2);
    ctx.globalAlpha = 1;
    ctx.save();
    // Rises up out of the sand, clipped at the ground line.
    if (u < 1) {
      ctx.beginPath(); ctx.rect(q.x - w * 2, -H, w * 4, groundY + H + 6 * k); ctx.clip();
    }
    ctx.translate(q.x, groundY + (1 - u) * height * k);
    ctx.scale(k, k);
    drawAddition(ctx, add, t, fog * 0.7);
    ctx.restore();
    // Sand mound hides the seam where the piece meets the floor.
    ctx.globalAlpha = 0.72 * (1 - fog);
    ctx.drawImage(this.puff, q.x - w * 1.02, groundY - w * 0.035, w * 2.04, w * 0.1);
    ctx.globalAlpha = 1;
    if (rev && t < rev.t0 + rev.dur + 3) this._sandPuffs(q, rev, t, w);
  }

  _sandPuffs(q, rev, t, w) {
    const { ctx } = this;
    const age = t - rev.t0;
    if (age < 0) return;
    for (let i = 0; i < 16; i++) {
      const dir = (hash01(i + 3) - 0.5) * 2;
      const life = 2.4 + hash01(i + 40) * 2.2;
      const a = (age - hash01(i + 90) * rev.dur * 0.8) / life;
      if (a < 0 || a > 1) continue;
      const x = q.x + dir * w * (0.34 + a * 0.58);
      const y = q.y - a * w * 0.12 * (0.6 + hash01(i + 7));
      const s = w * (0.14 + a * 0.26 + hash01(i) * 0.08);
      ctx.globalAlpha = (1 - a) * Math.min(1, a * 9) * 0.5;
      ctx.drawImage(this.puff, x - s, y - s * 0.6, s * 2, s * 1.2);
    }
    ctx.globalAlpha = 1;
  }

  _drawSnow(t, cam, W, H, layer) {
    const { ctx } = this;
    const f = FOCAL * H;
    const near = layer === 'near';
    // Snow is most of what is placed on the canvas each frame, so a phone that is struggling sees less of the far flakes. Reels never do.
    const count = near ? 26 : Math.round(150 * SNOW_AT[this.video ? 0 : this.quality]);
    const zMin = near ? 62 : 200, zSpan = near ? 150 : 1100;
    for (let i = 0; i < count; i++) {
      const id = i + (near ? 1000 : 0);
      const hz = hash01(id * 3.1 + 1);
      const relZ = zMin + hz * zSpan;
      const scale = f / relZ;
      const span = ((W * 1.25) / scale);
      const spanY = ((H * 1.25) / scale);
      const drift = t * (1.2 + hash01(id + 7) * 2);
      const wx = hash01(id * 1.7) * span * 3 + drift * 0.6 + Math.sin(t * 0.24 + id) * 5;
      const wy = hash01(id * 2.9) * spanY * 3 - t * (1.6 + hash01(id + 2) * 2.4) + Math.sin(t * 0.17 + id * 2) * 3;
      // Wrap inside a window that follows the camera, so the field never runs out.
      const rx = mod(wx - cam.x, span) - span / 2;
      const ry = mod(wy - (cam.h - 300), spanY) - spanY / 2;
      const sx = W / 2 + rx * scale;
      const sy = H * 0.5 + ry * scale;
      const r = near ? (0.8 + hash01(id + 4) * 1.7) * scale : (0.28 + hash01(id + 4) * 0.5) * scale * 1.05;
      const twinkle = 0.65 + 0.35 * Math.sin(t * (0.3 + hash01(id) * 0.5) + id);
      if (near) {
        ctx.globalAlpha = 0.14 * twinkle;
        ctx.drawImage(this.bokeh, sx - r, sy - r, r * 2, r * 2);
      } else {
        ctx.globalAlpha = (0.45 - hz * 0.24) * twinkle;
        ctx.drawImage(this.snow, sx - r, sy - r, r * 2, r * 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  _bubbleAt(x0, y0, z0, age, id, cam, W, H) {
    const y = y0 + age * (32 + hash01(id) * 24);
    const x = x0 + Math.sin(age * 2.1 + id) * (3 + age * 1.2);
    const q = project({ x, y, z: z0 }, cam, W, H);
    if (!q) return;
    const r = (1.25 + hash01(id + 3) * 2.2) * q.s;
    if (r < 0.7) return;
    this.ctx.drawImage(this.bubble, q.x - r, q.y - r, r * 2, r * 2);
  }

  // Paid extras, in the creature's own world: R is its size in world units. Points along its path come from the same poseAt as
  // the creature, measured from where poseAt puts it now and added to where it is actually drawn, so they stay with it when its
  // pose is adjusted (feeding, a close-up pushing it nearer, any pose adjustment) or pinned on screen. The side they trail on
  // eases through a turn with the body's own turn (bodyFrame), rather than flipping.
  _paidPath(it, t, cam, W, H) {
    const here = project(poseAt(it.res, t, it.arrival), cam, W, H), R = artworkRadius(it.res.species) * CREATURE_SCALE * it.size;
    if (!here) return () => null;
    // The way it is moving decides which way a companion faces, so it never swims backwards beside a creature drawn the other way round.
    const now = poseAt(it.res, t, it.arrival), before = poseAt(it.res, Math.max(0, t - 0.4), it.arrival), moving = now.x - before.x;
    const at = (dt, back, lift) => {
      const p = poseAt(it.res, Math.max(0, t - dt), it.arrival), sx = bodyFrame(it.res, p).sx;
      const then = project({ ...p, x: p.x - sx * R * back, y: p.y + R * lift }, cam, W, H);
      const way = Math.abs(moving) > R * 0.02 ? Math.sign(moving) : Math.sign(sx || 1);
      return then ? { x: it.q.x + (then.x - here.x), y: it.q.y + (then.y - here.y), s: then.s, facing: way * Math.max(0.25, Math.abs(sx)) } : null;
    };
    // The tail's beat now and its pace, for a trail's ripple (render/paid-items.js rippleTrail).
    at.swim = now.swim; at.tail = now.m?.tail;
    return at;
  }
  // A bought home, beside where its owner lives: on the floor where the zone has one, otherwise a little below the home point.
  // It is its own item in the scene, so it stays when its owner roams off screen.
  _homeAt(res, cam, W, H) {
    // Sized like its owner, neighbourhood magnification included, as the owner is drawn.
    // Its fit (render/paid-items.js fitFor): further out (x) and lower (y), in its owner's size, and bigger or smaller.
    const f = fitOf(res.species, res.paid.home);
    const R = artworkRadius(res.species) * CREATURE_SCALE * (res.size || 1) * magnifyFor(res, cam), hs = homeSize(R) * f.scale, side = hash01((res.seed || 1) % 997) < 0.5 ? -1 : 1;
    const floor = ZONE_CAM[res.zone]?.floor;
    const q = project({ x: res.home.x + side * (R * (0.9 + f.x) + hs * 0.7), y: floor ? 0 : res.home.y - R * (0.9 + f.y), z: res.home.z + 4, slideZ: slideDepth(res) }, cam, W, H);
    if (!q || q.dz < 40 || q.s * hs < 10) return null;
    const half = q.s * hs * 0.6;
    if (q.x + half < -60 || q.x - half > W + 60 || q.y - half * 1.6 > H + 60 || q.y < -60) return null;
    return { kind: 'home', res, q, dz: q.dz, hs };
  }
  _drawHome(it, t, cam, fog) {
    const { ctx } = this, k = it.q.s * it.hs / 100;
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - fog * 0.85); ctx.translate(it.q.x, it.q.y); ctx.scale(k, k); ctx.translate(0, -40);
    drawPaidItem(ctx, it.res.paid.home, t, undefined, this.trickOf(it.res, t, cam)); ctx.restore();
  }
  _paidBehind(it, t, cam, W, H, fog, fx = null) {
    const { ctx } = this, paid = it.res.paid, R = artworkRadius(it.res.species) * CREATURE_SCALE * it.size;
    ctx.save(); ctx.globalAlpha *= Math.max(0, 1 - fog * 0.85);
    // The Spotlight: a gold light behind the creature, wherever it swims (it is with the creature, not its home).
    if (paid.spotlight) { ctx.save(); ctx.globalAlpha = Math.max(0.35, 1 - fog * 0.6); drawSpotlight(ctx, it.q.x, it.q.y, R * it.q.s, t); ctx.restore(); }
    if (paid.trail) {
      // Its fit: further forward (x) or lower (y) along the path, in the creature's size, and bigger or smaller.
      // A star trail far off is drawn bigger than its share, so it still shows (render/paid-items.js trailFarBoost).
      const f = fitOf(it.res.species, paid.trail), at = this._paidPath(it, t, cam, W, H), pts = [];
      const ts = trailSize(R) * f.scale * (paid.trail === 'startrail' ? trailFarBoost(it.px) : 1);
      // Each mark is a little further back as well as a little earlier, so even a creature standing still trails behind it.
      for (let i = 1; i <= TRAIL_STEPS; i++) { const o = at(i * TRAIL_GAP, 0.85 - f.x + i * 0.16, -f.y); if (o) pts.push(o); }
      // Where it starts, just behind the tail, drawn closer in with the marks when they are.
      let from = at(0, 0.85 - f.x, -f.y);
      const k = withinReach(pts, it, R, TRAIL_REACH);
      if (from && k < 1) from = { ...from, x: it.q.x + (from.x - it.q.x) * k, y: it.q.y + (from.y - it.q.y) * k };
      // One smooth line that ripples up and down with the swim and fades into the water at its end (owner, 2026-11-14).
      rippleTrail(from, pts, at.swim, at.tail, R);
      const shown = Math.max(0, 1 - fog * 0.85);
      if (paid.trail === 'rainbowtrail' && pts.length > 2) {
        drawRainbowRibbon(ctx, smoothTrail(from ? [from, ...pts] : pts), ts * 0.42, 1);
      } else if (pts.length) {
        const stars = paid.trail !== 'bubbletrail', n = pts.length;
        // Starlight: a soft glow along the line, under the stars, lighting the water and fading with them.
        if (stars && n > 1) starGlow(ctx, smoothTrail(from ? [from, ...pts] : pts), ts, 1); // the fog is already in globalAlpha
        pts.forEach((o, i) => {
          const u = n > 1 ? i / (n - 1) : 0, fade = trailFade(0.08 + 0.92 * u);
          const r = ts * o.s * (stars ? 1 - 0.4 * u : 0.7 + 0.5 * hash01(i + it.res.seed % 97));
          if (r < 0.5 || fade <= 0.01) return;
          ctx.globalAlpha = shown * fade;
          if (!stars) { const rise = i * ts * o.s * 0.6, sway = Math.sin(t * 2.1 + i * 1.3) * r * 0.35; ctx.drawImage(this.bubble, o.x - r + sway, o.y - r - rise, r * 2, r * 2); }
          else sparkle(ctx, o.x, o.y + Math.sin(t * 3 + i) * r * 0.3, r * (0.7 + 0.3 * Math.sin(t * 4 + i * 1.7)), i % 2 ? '#fff3b0' : '#ffffff');
        });
      }
    }
    ctx.restore();
  }
  // Where the companion is this frame (screen point, scale, side), for the drawing and for tests.
  // Its fit moves it forward (x) or down (y), in the creature's size. It keeps within reach of its creature (COMPANION_REACH).
  paidCompanionAt(it, t, cam, W, H) {
    const f = fitOf(it.res.species, it.res.paid?.companion), o = this._paidPath(it, t, cam, W, H)(0.7, 0.55 - f.x, 0.55 - f.y + 0.08 * Math.sin(t * 1.3));
    if (o) withinReach([o], it, artworkRadius(it.res.species) * CREATURE_SCALE * it.size, COMPANION_REACH);
    return o;
  }
  _paidCompanion(it, t, cam, W, H, fog, fx = null) {
    const R = artworkRadius(it.res.species) * CREATURE_SCALE * it.size;
    let o = this.paidCompanionAt(it, t, cam, W, H);
    if (!o) return;
    // The little fish's trick: one loop right round its creature, easing out of its place and back into it.
    if (fx?.u != null && it.res.paid.companion === 'littlefish') {
      const u = fx.u, a = Math.atan2(o.y - it.q.y, o.x - it.q.x) + u * Math.PI * 2, r = R * it.q.s, m = Math.min(1, Math.min(u, 1 - u) * 6);
      const lx = it.q.x + Math.cos(a) * r * 1.15, ly = it.q.y + Math.sin(a) * r * 0.7, way = -Math.sin(a) >= 0 ? 1 : -1;
      o = { ...o, x: o.x + (lx - o.x) * m, y: o.y + (ly - o.y) * m, facing: m > 0.5 ? way : o.facing };
    }
    const k = o.s * companionSize(R) * fitOf(it.res.species, it.res.paid.companion).scale / 90; if (k * 90 < 3) return;
    const { ctx } = this;
    ctx.save(); ctx.globalAlpha *= Math.max(0, 1 - fog * 0.85); ctx.translate(o.x, o.y); ctx.scale(k * o.facing, k);
    drawPaidItem(ctx, it.res.paid.companion, t, undefined, fx); ctx.restore();
  }
  // A trail's trick: a quick burst round the creature (bubbles, a rainbow swirl or starlight) that spreads and fades.
  _paidBurst(it, u, fog) {
    const { ctx } = this, R = artworkRadius(it.res.species) * CREATURE_SCALE * it.size, r = R * it.q.s, ts = trailSize(R) * it.q.s;
    const out = 1 - (1 - u) ** 2, fade = Math.max(0, 1 - fog * 0.85) * Math.min(1, u * 8) * (1 - u), seed = (it.res.seed || 1) % 97;
    if (ts < 0.4) return;
    ctx.save();
    if (it.res.paid.trail === 'rainbowtrail') {
      ctx.lineCap = 'round';
      RAINBOW.forEach((col, b) => { ctx.strokeStyle = col; ctx.globalAlpha = fade * 0.85; ctx.lineWidth = Math.max(0.8, ts * 0.45);
        const rr = r * (0.75 + 0.55 * out) + (b - 2.5) * ts * 0.45, a0 = u * Math.PI * 3 + seed;
        ctx.beginPath(); ctx.ellipse(it.q.x, it.q.y, rr, rr * 0.7, 0, a0, a0 + Math.PI * (0.6 + 0.6 * out)); ctx.stroke(); });
    } else {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + seed, d = r * (0.6 + 0.8 * out) * (0.8 + 0.4 * hash01(i + seed)), x = it.q.x + Math.cos(a) * d, y = it.q.y + Math.sin(a) * d * 0.75;
        ctx.globalAlpha = fade;
        if (it.res.paid.trail === 'bubbletrail') { const b = ts * (1.1 + 1.1 * hash01(i * 7 + seed)), by = y - u * r * 0.4;
          ctx.fillStyle = 'rgba(223,246,255,0.18)'; ctx.strokeStyle = 'rgba(240,252,255,0.95)'; ctx.lineWidth = Math.max(0.6, b * 0.14);
          ctx.beginPath(); ctx.arc(x, by, b, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.ellipse(x - b * 0.35, by - b * 0.35, b * 0.28, b * 0.2, -0.6, 0, Math.PI * 2); ctx.fill(); }
        else sparkle(ctx, x, y, ts * (0.9 + 0.6 * Math.sin(u * 12 + i)), i % 2 ? '#fff3b0' : '#ffffff');
      }
    }
    ctx.restore();
  }

  _residentBubbles(it, t, cam, W, H) {
    const { res } = it;
    if (['starfish', 'blue_whale', 'dolphin', 'megalodon', 'leviathan'].includes(res.species)) return;
    const period = 9;
    const key = hash01((res.seed || 1) % 1000);
    for (let b = 0; b < 2; b++) {
      const k = Math.floor(t / period) - b;
      if (hash01(k * 3.7 + key * 91) > 0.42) continue;
      const t0 = (k + hash01(k + key)) * period;
      const age = t - t0;
      if (age < 0 || age > 7) continue;
      const p = poseAt(res, t0, it.arrival);
      const mouth = res.species === 'jellyfish' ? 0 : Math.sign(p.facing || 1) * 34 * (res.size || 1);
      const fade = Math.min(1, age * 3) * (1 - range(5.2, 7, age));
      this.ctx.globalAlpha = 0.72 * fade * (1 - fogAt(it.dz, this.look.fog));
      for (let n = 0; n < 3; n++) {
        const a2 = age - n * 0.42;
        if (a2 > 0) this._bubbleAt(p.x + mouth, p.y + 3, p.z, a2, k * 3 + n + key * 7, cam, W, H);
      }
    }
    this.ctx.globalAlpha = 1;
  }

  _arrivalBubbles(res, ar, t, cam, W, H) {
    const age = t - ar.t0;
    if (age < 0 || age > ar.dur + 5) return;
    for (let n = 0; n < 18; n++) {
      const start = n * 0.1 * ar.dur * 0.42;
      const a = age - start;
      if (a < 0 || a > 5) continue;
      const p = poseAt(res, ar.t0 + start, ar);
      const dx = (hash01(n + 5) - 0.5) * 72, dz = (hash01(n + 8) - 0.5) * 60;
      this.ctx.globalAlpha = 0.75 * Math.min(1, a * 3) * (1 - range(3.4, 5, a));
      this._bubbleAt(p.x + dx, p.y + (hash01(n + 2) - 0.5) * 40, p.z + dz, a, n + 41, cam, W, H);
    }
    this.ctx.globalAlpha = 1;
  }

  _ambientBubbles(t, cam, W, H) {
    const period = 7;
    const k0 = Math.floor(t / period);
    for (let k = k0 - 3; k <= k0; k++) {
      if (hash01(k * 1.23 + 5) > 0.6) continue;
      const t0 = (k + hash01(k + 9)) * period;
      const age = t - t0;
      if (age < 0) continue;
      const fz = cam.z + 310 + hash01(k + 2) * 500;
      const fx = cam.x + (hash01(k + 6) - 0.5) * (fz - cam.z) * (W / (FOCAL * H)) * 1.1;
      this.ctx.globalAlpha = 0.5 * Math.min(1, age * 2) * (1 - range(13, 18, age));
      for (let n = 0; n < 5; n++) {
        const a = age - n * 0.36;
        if (a > 0 && a < 18) this._bubbleAt(fx, 10, fz, a, k * 5 + n, cam, W, H);
      }
    }
    this.ctx.globalAlpha = 1;
  }
}

const mod = (a, b) => ((a % b) + b) % b;
const SNOW_AT = [1, 0.8, 0.6, 0.45, 0.3]; // how much of the far snow each quality step keeps

function hexToFog(hex, fog) {
  const n = parseInt((hex || '#ffffff').slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return `rgb(${lerp(c[0], HAZE_RGB[0], fog) | 0},${lerp(c[1], HAZE_RGB[1], fog) | 0},${lerp(c[2], HAZE_RGB[2], fog) | 0})`;
}

// A small scallop shell beside a Founder's name: the first 500 residents (2026-11-07).
function drawFounderShell(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 20, s / 20);
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(-12, -2, -9, -10); ctx.quadraticCurveTo(0, -16, 9, -10); ctx.quadraticCurveTo(12, -2, 0, 8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c9a35a';
  ctx.beginPath(); ctx.ellipse(0, 9, 4, 2.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// A companion and a trail follow where their creature was a moment ago. A small creature swimming fast covers several of its own lengths
// in that moment, and left them behind, off a Reel close-up altogether (the shop's fit check, 2026-11-14). So a companion stays within
// this many creature sizes of its middle, and no further to the side than REACH_SIDE (a close-up shows about 1.3 either side); a trail
// whose first mark is out of reach is drawn closer in, keeping its shape. Within reach (nearly always), nothing moves.
export const COMPANION_REACH = 1.6, TRAIL_REACH = 1.4, REACH_SIDE = 1.15;
// Returns how much they were drawn in (1: not at all).
function withinReach(pts, it, R, reach) {
  const r = R * it.q.s, first = pts[0];
  if (!first) return 1;
  const dx = first.x - it.q.x, d = Math.hypot(dx, first.y - it.q.y);
  const k = Math.min(d > r * reach ? (r * reach) / d : 1, Math.abs(dx) > r * REACH_SIDE ? (r * REACH_SIDE) / Math.abs(dx) : 1);
  if (!(k < 1)) return 1;
  for (const o of pts) { o.x = it.q.x + (o.x - it.q.x) * k; o.y = it.q.y + (o.y - it.q.y) * k; }
  return k;
}

export function drawUsernameLabel(ctx, it, alpha, W, H) {
  if (it.res.unnamed) return; // a Facebook person in a Reel: Reels name Instagram people only (owner, 2026-11-10)
  const size = Math.round(H * 0.0205);
  const text = it.res.shownName ?? '@' + it.res.username; // the site gives its label as it is ("Name hidden"); Reels never set shownName
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `600 ${size}px Figtree, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const top = it.q.y - it.px * (it.res.species === 'jellyfish' ? 0.52 : it.res.species === 'starfish' ? 0.46 : 0.58);
  const m = ctx.measureText(text).width / 2;
  const x = clamp(it.q.x, m + W * 0.06, W - m - W * 0.11);
  // Below the caption band at the top (hooks, zone notes), so a name never sits on top of the words.
  const y = clamp(top - size * 0.7, H * 0.24, H * 0.74);
  ctx.shadowColor = 'rgba(2,28,42,0.85)';
  ctx.shadowBlur = size * 0.55;
  ctx.shadowOffsetY = size * 0.05;
  ctx.fillStyle = '#f4fbf8';
  ctx.fillText(text, x, y);
  // The name people gave their creature ("its name should be satoru"), small, above the username.
  const nick = it.res.extras?.nickname;
  if (nick) { ctx.font = `italic 500 ${Math.round(size * 0.78)}px Figtree, sans-serif`; ctx.fillStyle = '#cfe9e6'; ctx.fillText(`“${nick}”`, x, y - size * 1.05); ctx.font = `600 ${size}px Figtree, sans-serif`; ctx.fillStyle = '#f4fbf8'; }
  if (it.res.founder) { ctx.shadowBlur = 0; drawFounderShell(ctx, x + m + size * 0.75, y - size * 0.33, size); }
  ctx.restore();
}
