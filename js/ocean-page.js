// The front door: the live ocean with the Find box over it. Find works first; the render code loads behind it, and names.json last.
// Sections: finding, the ocean (loading it, the frame loop), looking around, then the things tests and tools use.
import { attachFind, notFoundText } from './search-box.js';
import { showSheet, hideSheet } from './card-sheet.js';
import { createAreaLoader } from './area-loader.js';
import { remember, recall, latest, keep } from './memory.js';
import { loadNames, showRetry } from './names.js';
import { lookupName, openName, secretToLink, linkToSecret } from '../core/site-find.js';
import { cardPath, showThumb, unpackRow, surprisePick, suggestIndex, suggestNames, spotlightRows } from '../core/site-names.js';
import { createSpotted } from './spotted.js';
import { createOverlay } from './overlay.js';
import { createReactions } from './reactions.js';
import { createFeeds, createHold } from './feed.js';
import { SEEK, createSeek, chooseHood } from './seek.js';
import { nameLabel, isHiddenRow } from './name-label.js';
import { WATCH, createWatchdog, dprAt, qualityAt, readGaps } from './watchdog.js';
import { flickSpeed, slowed } from './flick.js';
import { createSound } from './sound.js';
import { countZone } from './steps.js';

const $ = (id) => document.getElementById(id);
const fromSite = (path) => new URL(`../${path}`, import.meta.url);
const KEY = /^[0-9a-f]{12}$/;
const DEFAULT_ZONE = 'open';

const fetchJson = async (path) => {
  const res = await fetch(fromSite(path));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
};

// "open:2,reef:1": how many area files each zone has, so a file that doesn't exist is never asked for.
const counts = document.documentElement.dataset.areas ? Object.fromEntries(document.documentElement.dataset.areas.split(',').map((p) => { const [z, n] = p.split(':'); return [z, Number(n)]; })) : null;
const areas = createAreaLoader({ fetchJson, builtAt: document.documentElement.dataset.built || '', counts });
const canvas = $('ocean'), overlayCanvas = $('overlay');
const reactions = createReactions();
const feeds = createFeeds();
// Feeds first, then flips, so a creature that is eating can still be tapped and flip.
const poseAdjust = (res, pose, t) => reactions.adjust(res, feeds.adjust(res, pose, t), t);
let overlay = null;                    // made once the render code has loaded
let world = null, renderer = null;
// The ocean's sounds (js/sound.js): off until the speaker button turns them on, remembered on this phone.
const sound = createSound({ recall, remember });
const sizeOf = (res) => world?.sizeOf(res) ?? 20;
let oceanState = 'loading';            // 'loading', 'on' or 'off' (no WebGL2, or the render code didn't load)
let pick = 0, settled = 0;             // the visitor's latest ask, and the latest ask that has finished
let names = null;
// The milestone week (core/milestone.js): every creature glows softly while it runs.
function applyGlow() {
  const m = names?.milestone, now = Date.now();
  const on = !!(m?.reachedAt && m?.glowUntil && now >= Date.parse(m.reachedAt) && now < Date.parse(m.glowUntil));
  world?.setEventGlow?.(on);
}
let zone = DEFAULT_ZONE;               // the zone asked for most recently
let seek = null;                       // the round being played, if any (see the Hide and seek section)
let seekRange = null;                  // { from, to }: the part of the rail the camera may use during a round
let seekHud = false;                   // the round bar is up (during a round, and after it until closed)

// One zone press, find, swim or area turn. Each takes the next number, and after any wait only the latest may move the camera.
async function onePick(work) {
  const mine = ++pick;
  if (seekHud) endSeek(); // a find, zone press or swim ends the round cleanly first
  try { return await work(mine); }
  finally { if (mine === pick) { settled = mine; refreshWho(); } }
}
const picking = () => pick !== settled;

// ---- Finding ----

const say = (text) => { $('find-msg').textContent = text; };
const pageOf = (key, known) => fromSite(`${cardPath(key)}${known ? `#k=${secretToLink(known.secret)}` : ''}`);

// A creature's public row comes from its own small page, so finding needs neither names.json nor the area files.
// Null means that page doesn't exist: nobody has that key, or they have left.
async function rowFor(key) {
  if (!KEY.test(key)) return null;
  const res = await fetch(fromSite(cardPath(key)));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`card ${res.status}`);
  const page = new DOMParser().parseFromString(await res.text(), 'text/html');
  const row = page.getElementById('row'); // someone who has left has a page with no row
  return row ? JSON.parse(row.textContent) : null;
}

// A visitor who arrived on a ?c= link goes on to the card in place of that link, so Back doesn't bounce them forward again.
function goToCard(key, known) {
  const url = pageOf(key, known);
  keepPlace();
  if (key === arrival) location.replace(url); else location.assign(url);
}

function swimTo(key, known = null) { return onePick((mine) => swim(key, known, mine)); }

// Finds a creature and swims there. Everything after an await checks it is still the latest pick.
// `given` is a row already in hand (Surprise me picks from names.json), so there is nothing to fetch; it counts as spotted when the visitor gets there.
async function swim(key, known, mine, given = null) {
  say('');
  $('area-msg').replaceChildren();
  closeWho(); // an open Who lives here list would sit over the card
  const again = () => onePick((m) => swim(key, known, m, given));
  let row = given;
  if (!row) {
    try { row = await rowFor(key); }
    catch { firstAreaDone(); if (mine === pick) showRetry($('find-msg'), again); return; }
    if (mine !== pick) return;
    if (!row) { theyLeft(key, mine); return; }
  }
  known ??= !given && key === arrival ? await knownOnArrival(key, row) : null;
  if (mine !== pick) return;
  const arrived = () => { if (given) spot(row.species); };
  const toCard = () => { arrived(); goToCard(key, isHiddenRow(row) ? null : known); }; // a hidden person's card finds this visitor's last-found instead
  if (known) remember('everyone-zone', row.zone);
  if (oceanState === 'off') { toCard(); return; }
  zone = row.zone; markZone(zone);
  showSheet(row, known);
  if (!await oceanReady) { if (mine === pick) toCard(); return; }
  if (mine !== pick) return;
  try { await areas.show(row.zone, row.areaN); }
  catch { if (mine === pick) areaFailed(again); return; }
  if (mine !== pick) return;
  const res = areas.find(key);
  if (!res) { toCard(); return; } // names and the area file come from different publishes
  arrived();
  follow(res);
  sound.found();
}

// A visitor who arrives on ?c=<key> may hold the person's own link (#k=) or may have found this creature by name on this phone.
// Either gives the full name. The secret stays in the # part and in memory: it is never put in a query or a request.
async function knownOnArrival(key, row) {
  const secret = linkToSecret(new URLSearchParams(location.hash.slice(1)).get('k'));
  if (secret && row.sealed) {
    const opened = await openName(secret, row.sealed).catch(() => null);
    if (opened) {
      if (isHiddenRow(row)) { // their secret moves to this phone and leaves the address, so the address can't be copied on with it in
        remember('last-found', { key, username: opened.username, nickname: opened.nickname, secret: secretToLink(secret) });
        history.replaceState(history.state, '', location.pathname + location.search);
      }
      return { username: opened.username, nickname: opened.nickname, secret };
    }
  }
  const last = recall('last-found'), remembered = linkToSecret(last?.secret);
  if (last?.key === key && remembered) return { username: last.username, nickname: last.nickname, secret: remembered };
  return null;
}

function theyLeft(key, mine) {
  firstAreaDone();
  say("Not here yet. This creature isn't in the ocean right now.");
  if (recall('last-found')?.key === key) { remember('last-found', null); offerLastFound(); }
  // Arrived on a dead link: open the usual ocean, so the page isn't left empty.
  oceanReady.then((ok) => { if (ok && mine === pick && !areas.residents().length) chooseZone(DEFAULT_ZONE); });
}

function foundByName({ key, username, nickname, secret }) {
  remember('last-found', { key, username, nickname, secret: secretToLink(secret) });
  $('swim-to').hidden = true; // the offer is for the next visit
  return swimTo(key, { username, nickname, secret });
}

// The Swim to @name button on the next visit. If the resident has gone, names.json takes the offer back.
function offerLastFound() {
  const last = recall('last-found'), button = $('swim-to'), secret = linkToSecret(last?.secret);
  button.hidden = !(last?.key && secret);
  if (button.hidden) return;
  button.textContent = `Swim to @${last.username}`;
  button.onclick = () => { button.hidden = true; swimTo(last.key, { username: last.username, nickname: last.nickname, secret }); };
}

const lookup = (typed) => lookupName(typed, (bucket) => fetchJson(`find/${bucket}.json`));
const finder = attachFind({
  input: $('name'), button: $('find-btn'), lookup,
  // Names suggested as one is typed: names.json comes early if someone types before it has loaded.
  suggest: { load: () => loadNames().then(suggestIndex), match: suggestNames, thumb: showThumb },
  onFound: foundByName,
  onNotFound: (typed) => { hideSheet(); say(notFoundText(typed)); }, // the last person's card must not sit under a message about someone else
  onError: (retry) => showRetry($('find-msg'), retry),
});
if (window.earlyFind && $('name').value.trim()) finder.run(); // Find was pressed before this script had arrived

// ---- The ocean: loading it ----

// The water's own context tests the phone, then goes to the renderer: throwing it away cost 35 ms of each opening (2026-11-15, slowed 4x).
// Copied from render/water.js, which must not load on a phone that can't draw the ocean; test/site2.test.mjs checks they agree.
const WATER_GL = { preserveDrawingBuffer: true, antialias: false, alpha: false, powerPreference: 'high-performance' };
let waterCanvas = null;
function canDrawOcean() {
  const made = document.createElement('canvas');
  if (!made.getContext('webgl2', WATER_GL)) return false;
  waterCanvas = made;
  return true;
}

function noOcean() {
  oceanState = 'off';
  canvas.hidden = true; // the water picture underneath stays
  $('tip').hidden = true; $('controls').hidden = true; $('who-open').hidden = true; overlayCanvas.hidden = true;
  return false;
}

const oceanReady = startOcean();

async function startOcean() {
  if (!canDrawOcean()) return noOcean();
  try {
    world = await import('./world.js');
    applyGlow();
    renderer = new world.OceanRenderer(canvas, { light: true, pictures: true, waterCanvas });
    renderer.enableTricks({ play: !reduceMotion }); // paid items' tricks, on this page only
    // A creature without its picture yet is drawn live, which costs far more than making the picture. On arriving in a zone a screenful
    // of creatures needs pictures at once, so they get 10 ms a frame instead of 4 (2026-11-13, processor slowed 6 times, five zone presses:
    // long frames 38 to 20, 3.0 s to 1.9 s of them). Once a view's pictures are made there is nothing to spend it on.
    if (renderer.pictures) renderer.pictures.budgetMs = PICTURE_BAKE_MS;
    window.__ocean = renderer;
  } catch { waterCanvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext(); return noOcean(); }
  overlay = createOverlay(overlayCanvas, (target, tt) => world.screenOf(target, tt, cam, canvas.width, canvas.height, poseAdjust));
  resize(); addEventListener('resize', resize);
  buildZoneButtons();
  attachPointer();
  cam = base = from = world.viewAlong(zone, 0, areas.residents(), canvas.width, canvas.height);
  $('controls').hidden = false; $('who-open').hidden = false; $('zoom').hidden = false;
  refreshZoomButtons();
  if (METER_ASKED) startMeter();
  oceanState = 'on';
  if (justRemembered()) setJustOcean(true); // chosen earlier in this visit (a reload, or Back from a card)
  else if (!recall('tip-seen')) $('tip').hidden = false;
  return true;
}

// The hidden phone meter: ?fps=1 in the address shows how smoothly this phone draws the ocean. Nothing is loaded for it otherwise.
const METER_ASKED = new URLSearchParams(location.search).get('fps') === '1';
let meter = null, drawn = null; // drawn: the scene last handed to the renderer, for the meter's chip test
async function startMeter() {
  try {
    const { createMeter } = await import('./meter.js');
    meter = createMeter({
      renderer,
      read: () => ({ place: `${cam?.hood ?? zone}${mode.kind === 'follow' ? ' (following)' : ''}`, canvas: `${canvas.width}x${canvas.height}`, dpr, pace: watchdog.state().pace, quality: renderer.quality, zoom, paused }),
      scene: () => (drawn && cam ? { scene: drawn, t, cam } : null),
      onBusy: () => { last = since = performance.now(); gaps.length = 0; }, // the test's own pause says nothing about the phone
    });
  } catch { /* the ocean carries on without the meter */ }
}

// names.json waits until the first area has come, or failed.
let firstAreaDone;
const firstArea = new Promise((done) => { firstAreaDone = done; });
// The water fades in only once there is something to swim in it, and once the first frames are quick (2026-11-13, measured with the
// processor slowed 6 times: the opening view's first frames took 45 to 97 ms while its creatures' pictures were made, so the fade-in and the
// creatures stuttered). Until then the still water shows. A slow phone waits REVEAL.maxMs at most, and a hidden page shows it by timer.
const REVEAL = { quickMs: 25, quickFrames: 3, maxMs: 1200 };
let revealed = false, quickFrames = 0, loopStart = 0;
function reveal() { if (revealed) return; revealed = true; canvas.classList.add('on'); }
function frameLoopOn() {
  firstAreaDone();
  if (!looping) { looping = true; last = since = loopStart = performance.now(); requestAnimationFrame(frame); setTimeout(reveal, REVEAL.maxMs); }
}

// Device pixel ratio drops on slow phones, and comes back when there is room (the watchdog below).
const FULL_DPR = Math.min(devicePixelRatio || 1, 2);
let dpr = FULL_DPR, wantDpr = FULL_DPR;
function resize() {
  canvas.width = overlayCanvas.width = Math.round(innerWidth * dpr); canvas.height = overlayCanvas.height = Math.round(innerHeight * dpr); redraw = emptied = true; // resizing clears the canvas
  zoomMin = null; // a screen of another height may zoom out more or less
  if (world && zoomGoal < minZoom()) { zoomGoal = minZoom(); refreshZoomButtons(); }
}

let t = 40, last = 0, since = 0, looping = false, paused = false;
let inCompany = null;                              // the residents neighbours were last worked out from (render/company.js)
let redraw = false, emptied = false;               // redraw: something moved while paused, or the canvas needs repainting. emptied: only the second
const watchdog = createWatchdog(), gaps = [];       // the frame gaps since the last reading
const PACED_GAP = 25;                              // milliseconds: at a pace of 30, a screen refresh sooner than this is skipped
const GLIDE = 1.6;                                 // seconds
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PICTURE_BAKE_MS = 10;                        // milliseconds a frame for making creature pictures (render/pictures.js has 4)
let mode = { kind: 'zone', zone: DEFAULT_ZONE };   // or { kind: 'follow', res } or { kind: 'hood', hood } (tools only)
let along = 0;                                     // where the camera is on the zone's rail, when looking around
let coast = 0;                                     // a flick still carrying the view along: CSS pixels a second, 0 for none (flick.js)
let cam = null, from = null, flown = Infinity;     // cam: as drawn, with the zoom on it. flown: seconds into the current glide
let base = null;                                   // the camera before the zoom is put on it; glides run on this
let zoom = 1, zoomGoal = 1, zoomAt = null;         // the zoom now, where it is easing to, and the canvas point it is centred on (null: the middle of the screen)
let pan = 0;                                       // zoomed in: how far the view looks up or down, as a share of the screen's height
const ZOOM_EASE = 10;                              // how fast the zoom closes on its goal, per second
const labels = new Map();                          // resident id -> until (t)

function target() {
  const W = canvas.width, H = canvas.height;
  if (mode.kind === 'follow') return clearOfCard(world.followCamera(mode.res, t, W, H), mode.res, W, H);
  cardLift = 0;
  if (mode.kind === 'hood') return world.viewForHood(mode.hood, W, H, areas.residents());
  return world.viewAlong(mode.zone, along, areas.residents(), W, H);
}

let cardLift = 0;                                  // canvas pixels the followed creature is raised by, eased so the view doesn't jump
const CARD_GAP = 16;                               // CSS pixels between the creature and the card
// The card covers the bottom of the screen, so a followed creature is raised into the clear water above it.
function clearOfCard(view, res, W, H) {
  let wanted = 0;
  if (!$('sheet').hidden) {
    const at = world.screenOf(res, t, world.zoomCam(view, zoom, pan), W, H, poseAdjust); // where it is drawn, with the zoom on
    const top = $('sheet').getBoundingClientRect().top * dpr, under = document.querySelector('.find-wrap').getBoundingClientRect().bottom * dpr;
    if (at) wanted = Math.min(0, Math.max((under + top) / 2, top - CARD_GAP * dpr - at.px) - at.y) / zoom;
  }
  cardLift += (wanted - cardLift) * 0.15;
  return { ...view, hor: view.hor + cardLift / H };
}

// Any look up or down goes into the glide's starting point, so the picture doesn't jump.
function glideTo(next) { coast = 0; from = pan ? { ...base, hor: base.hor + pan / zoom } : base; pan = 0; flown = 0; mode = next; }

function frame(now) {
  // Asked for first, so one bad frame can never stop the ocean for good.
  requestAnimationFrame(frame);
  if (!canvas.width || !canvas.height) resize();
  if (!canvas.width || !canvas.height) { last = since = now; gaps.length = 0; return; }
  // Paused holds the creatures still and draws nothing, except a camera on its way somewhere or a canvas that needs repainting.
  if (paused && !redraw && !coast && flown >= GLIDE && zoom === zoomGoal) { last = since = now; gaps.length = 0; meter?.skip(); return; }
  if (wantDpr !== dpr) { dpr = wantDpr; resize(); }
  // A steady 30: every second refresh is left alone, unless the canvas has been emptied. A finger dragging keeps to the pace too: that is when an uneven frame shows most.
  if (watchdog.state().pace === 30 && !emptied && now - last < PACED_GAP) return;
  redraw = emptied = false;
  const real = Math.max(0, (now - last) / 1000), rate = reduceMotion ? 0.3 : 1, began = meter ? performance.now() : 0;
  last = now;
  if (!paused) t += Math.min(0.1, real) * rate;
  const flying = flown < GLIDE;
  flown += real * rate; // glides run on real time, so a page drawing few frames still arrives
  // A creature that was found plays its items' tricks as the camera arrives (render/paid-items.js).
  if (flying && flown >= GLIDE && mode.kind === 'follow' && !paused && !reduceMotion) renderer.startTrick(areas.find(mode.res.id) || mode.res, t);
  if (seek) stepSeek(paused || document.hidden ? 0 : real);
  easeZoom(real);
  carryOn(Math.min(0.1, real));
  if (areas.residents() !== inCompany) { inCompany = areas.residents(); world.keepCompany(inCompany); }
  const goal = target();
  base = flown < GLIDE ? world.lerpCam(from, goal, (flown / GLIDE) ** 0.6) : goal;
  cam = world.zoomCam(base, zoom, pan);
  noteZone(now);
  const inView = (id) => { const res = areas.find(id); return !!res && world.labelHasBody(world.screenOf(res, t, cam, canvas.width, canvas.height, poseAdjust), canvas.height); };
  const shown = [...labels].filter(([id, until]) => until > t && inView(id)).map(([id]) => ({ id, alpha: 1 }));
  drawn = { residents: areas.residents(), additions: areas.additions(), arrivals: {}, labels: shown, poseAdjust };
  const drawStart = revealed ? 0 : performance.now();
  // During a glide the renderer is told where it is going, and makes that place's pictures on the way (render/scene.js, `ahead`).
  renderer.render(drawn, t, cam, flown < GLIDE ? world.zoomCam(goal, zoomGoal, pan) : null);
  if (!revealed) { quickFrames = performance.now() - drawStart < REVEAL.quickMs ? quickFrames + 1 : 0; if (quickFrames >= REVEAL.quickFrames || now - loopStart > REVEAL.maxMs) reveal(); }
  overlay.draw(t);
  namePlace();
  if (areas.residents() !== seekChecked) refreshSeekButton();
  if (real > 0) gaps.push(real * 1000);
  watchFrame(now, real);
  if (meter) { if (real > 1 || document.hidden) meter.skip(); meter.frame(now, performance.now() - began); }
}

// The zone sponsors' report (brand report B8): a visit counts for a zone once the ocean has drawn that zone, settled, for a couple of
// seconds. js/steps.js sends which zone and nothing else, at most once per zone per page view.
const ZONE_SEEN_MS = 2000;
let zoneShown = null, zoneShownSince = 0;
const zonesCounted = new Set(); // this page view's, so a counted zone costs nothing on later frames
function noteZone(now) {
  const drawnZone = areas.position().zone;
  const here = revealed && flown >= GLIDE && !document.hidden && drawnZone === zone ? zone : null;
  if (here !== zoneShown) { zoneShown = here; zoneShownSince = now; return; }
  if (here && !zonesCounted.has(here) && now - zoneShownSince >= ZONE_SEEN_MS) { zonesCounted.add(here); countZone('zone', here); }
}

// Moving into a neighbourhood puts its name up for a moment, so a long swim along a zone says where it has got to.
let placeNamed = null, placeTimer = 0;
const PLACE_SHOWN_MS = 2400;
function namePlace() {
  const here = mode.kind === 'zone' && flown >= GLIDE && !seekHud ? cam.hood : null;
  if (!here || here === placeNamed) return;
  placeNamed = here;
  const box = $('place');
  // A neighbourhood with a piece the residents asked for says whose idea it was, while that person is here under their name.
  const built = areas.additions().find((a) => a.hood === here && a.name);
  // A sponsored zone says who supports it (core/sponsors.js), from names.json once it has come.
  const sponsor = names?.zones.find((z) => z.id === zone)?.sponsor;
  box.textContent = [world.hoodLabel(here), built ? `Built from @${built.name}'s idea` : '', sponsor ? (sponsor.charity ? `Partner charity: ${sponsor.name}` : `Paid for by ${sponsor.name}`) : ''].filter(Boolean).join('\n'); box.hidden = false;
  box.style.top = `${Math.round(document.querySelector('.find-wrap').getBoundingClientRect().bottom) + 8}px`;
  box.classList.add('on');
  clearTimeout(placeTimer);
  placeTimer = setTimeout(() => box.classList.remove('on'), PLACE_SHOWN_MS);
}

// A flick carrying on after the finger has gone, until it dies away or reaches the end of the rail.
function carryOn(seconds) {
  if (!coast) return;
  if (mode.kind !== 'zone' || flown < GLIDE) { coast = 0; return; } // dragging out of a followed creature is already a glide
  const was = along;
  along = keepOnRail(along - coast * seconds * dpr * world.worldPerPixel(canvas.height, zoom));
  turnAreaAtEdge();
  coast = along === was ? 0 : slowed(coast, seconds);
}

// How the last few seconds went, and what the watchdog makes of it.
function watchFrame(now, real) {
  applyPace(watchdog.enter(cam.hood ?? mode.zone ?? zone));
  // A long gap means the page was hidden, not that the phone is slow. Time spent paused says nothing either, nor does a camera on its way or a zoom under way.
  if (paused || real > 1 || document.hidden || flown < GLIDE || zoom !== zoomGoal) { since = now; gaps.length = 0; return; }
  if (now - since < WATCH.everyMs) return;
  // A view's first seconds, while its pictures, scenery and lit creatures are made, say nothing about how fast the phone is.
  if (!world.stillBaking(renderer.pictures) && !renderer.arriving() && gaps.length) applyPace(watchdog.note(readGaps(gaps), now));
  since = now; gaps.length = 0;
}

function applyPace({ level }) {
  renderer.quality = qualityAt(level);
  wantDpr = dprAt(level, FULL_DPR); // resizing empties the canvas, so it waits for the start of the next frame, which then fills it
}

// Fits the ocean's controls above the tabs bar, however tall it is on this phone.
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--bar-h', `${document.querySelector('.bar').getBoundingClientRect().height}px`);
}).observe(document.querySelector('.bar'));

// ---- Looking around ----

function markZone(id) {
  if (sound.setZone(id)) sound.move(); // a new zone: a whoosh, and its own water
  for (const b of $('zones').children) {
    b.setAttribute('aria-pressed', String(b.dataset.zone === id));
    if (b.dataset.zone === id) b.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
}

function buildZoneButtons() {
  $('zones').replaceChildren(...world.ZONES.map((z) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'zone'; b.dataset.zone = z.id; b.textContent = z.label.replace(/^The /, '');
    b.addEventListener('click', () => { hideSheet(); say(''); chooseZone(z.id); });
    return b;
  }));
  markZone(zone);
  $('zones').addEventListener('scroll', showZoneEdges, { passive: true });
  addEventListener('resize', showZoneEdges);
  showZoneEdges();
}

// The row of zones fades at an end that has more buttons past it.
function showZoneEdges() {
  const z = $('zones'), edge = (more) => (more ? '24px' : '0px');
  z.style.setProperty('--more-left', edge(z.scrollLeft > 2));
  z.style.setProperty('--more-right', edge(z.scrollLeft + z.clientWidth < z.scrollWidth - 2));
}

function areaFailed(retry) {
  firstAreaDone();
  showRetry($('area-msg'), () => { $('area-msg').replaceChildren(); retry(); });
}

function chooseZone(id, back = null) {
  return onePick(async (mine) => {
    zone = id; markZone(id);
    $('area-msg').replaceChildren();
    try { await areas.show(id, back?.area ?? 0); }
    catch { if (mine === pick) { if (back) chooseZone(id); else areaFailed(() => chooseZone(id)); } return; } // an area that a later publish took away is no reason to fail
    if (mine !== pick) return;
    labels.clear();
    if (back) {
      mode = { kind: 'zone', zone: id };
      along = keepOnRail(back.along);
      zoom = zoomGoal = world.clampZoom(back.zoom, minZoom());
      pan = world.clampPan(back.pan, zoom);
      refreshZoomButtons();
    } else {
      along = world.openingAlong(id, areas.residents());
      resetZoom();
      glideTo({ kind: 'zone', zone: id });
      // The first view of a visit starts where it is going: the 1.6 s glide from the zone's start ended on a screenful of creatures
      // whose pictures were then all made at once, a stutter just as the ocean settled. Now that work is done before the water shows.
      if (!revealed) flown = GLIDE;
    }
    frameLoopOn();
  });
}

// Back from a card or another tab lands where the visitor was, not at the start. It is kept with this page's entry in the browser's history, so nothing is stored.
function keepPlace() {
  if (oceanState !== 'on' || !cam || mode.kind === 'hood') return;
  const id = mode.kind === 'follow' ? mode.res.zone : mode.zone, place = areas.position();
  if (place.zone !== id) return;
  const at = mode.kind === 'follow' ? world.alongOfX(id, cam.x, areas.residents(), canvas.width, canvas.height) : along;
  try { history.replaceState({ ...history.state, place: { zone: id, area: place.n, along: at, zoom: zoomGoal, pan } }, ''); } catch { /* the browser won't: Back opens the usual view */ }
}
document.addEventListener('click', (e) => { if (e.target.closest?.('a[href]')) keepPlace(); }, true);

// Where Back has brought the visitor to, once only (a reload starts afresh), if it still makes sense.
function placeToReturnTo() {
  const p = history.state?.place;
  if (!p) return null;
  try { history.replaceState({ ...history.state, place: null }, ''); } catch { /* it would only be used again */ }
  return world.ZONES.some((z) => z.id === p.zone) && [p.area, p.along, p.zoom, p.pan].every(Number.isFinite) && p.area >= 0 && p.zoom > 0 ? p : null;
}

function follow(res) {
  labels.clear(); labels.set(res.id, Infinity);
  glideTo({ kind: 'follow', res });
  frameLoopOn();
}

// Press and hold drops food. Not while the camera is on its way, while paused, while a find or zone press is loading, or with reduced motion.
function dropFood(x, y) {
  if (oceanState !== 'on' || paused || reduceMotion || picking() || flown < GLIDE || seek) return false;
  const spot = world.foodSpot(areas.residents(), x * dpr, y * dpr, cam, canvas.width, canvas.height);
  if (!feeds.drop(spot.pos, spot.near, t)) return false;
  overlay.addFood(spot.pos);
  sound.food();
  return true;
}

// Who a tap at this point of the page finds: the nearest creature within reach, or null on open water.
// `ahead` looks that many seconds on, with the camera where it is now.
const tapAt = (x, y, ahead = 0) => world.tapHit(areas.residents(), x * dpr, y * dpr, t + ahead, cam, canvas.width, canvas.height, 40 * dpr, poseAdjust);

function attachPointer() {
  let drag = null;
  const fingers = new Map();  // pointer id -> { x, y }: everything pressed on the ocean right now
  let pinch = null;           // two fingers on the ocean: { gap, from }, how far apart they were when it began and the zoom then
  const twoFingers = () => { const [a, b] = fingers.values(); return { gap: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
  const startPinch = () => { pinch = { gap: twoFingers().gap, from: zoomGoal }; };
  // Letting one finger go ends the pinch. `drag` stays empty until every finger is up, so the one left behind is neither a drag nor a tap.
  const fingerGone = (id) => { fingers.delete(id); if (fingers.size >= 2) startPinch(); else pinch = null; };
  // A long press must bring up neither the browser's own menu nor a text selection.
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  const hold = createHold({ onHold: (x, y) => { if (drag && !drag.moved && dropFood(x, y)) drag.fed = true; } });
  canvas.addEventListener('pointerdown', (e) => {
    if (e.isPrimary) fingers.clear(); // the first finger of a new touch: anything still listed is a lift the page never heard about
    const stoppedFlick = coast !== 0; coast = 0; // a finger on the glass stops the view, and that touch isn't a tap on whoever is under it
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch { /* a synthetic pointer has nothing to capture */ }
    if (fingers.size > 1) { drag = null; hold.cancel(); if (fingers.size === 2) startPinch(); return; } // never a tap, a hold or a drag
    drag = { x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false, fed: false, stoppedFlick, moves: [] };
    hold.down(e.clientX, e.clientY);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (fingers.has(e.pointerId)) fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch) { const now = twoFingers(); setZoom((pinch.from * now.gap) / pinch.gap, { x: now.x * dpr, y: now.y * dpr }); return; }
    if (!drag || (seek && paused)) return; // a paused round is not a free look around
    hold.move(e.clientX, e.clientY);
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) <= 8) return;
    drag.moved = true;
    if (mode.kind === 'follow') stopFollowing();
    if (mode.kind === 'zone') {
      along = keepOnRail(along - (e.clientX - drag.lastX) * dpr * world.worldPerPixel(canvas.height, zoom));
      pan = world.clampPan(pan + ((e.clientY - drag.lastY) * dpr) / canvas.height, zoom);
      redraw = true;
      turnAreaAtEdge();
      drag.moves.push({ t: e.timeStamp, x: e.clientX });
      if (drag.moves.length > 24) drag.moves.shift();
    }
    drag.lastX = e.clientX; drag.lastY = e.clientY;
  });
  const end = (e) => {
    fingerGone(e.pointerId);
    const wasDrag = !drag || drag.moved || drag.fed || drag.stoppedFlick; // a press that dropped food isn't a tap
    if (drag?.moved && mode.kind === 'zone' && !reduceMotion && !(seek && paused)) coast = flickSpeed(drag.moves, e.timeStamp);
    drag = null; hold.up();
    if (!wasDrag && justOcean) { setJustOcean(false); return; } // with just the ocean showing, a tap brings the menus back
    if (wasDrag || (seek && paused) || picking() || flown < GLIDE) return; // while the camera is on its way, a tap can't put up a different card
    const hit = tapAt(e.clientX, e.clientY);
    if (!hit) return;
    countZone('tap', hit.zone ?? zone); // the zone sponsors' report: a tap on a creature in this zone (js/steps.js), never which one
    if (seek) { seekTapped(hit); return; }
    labels.set(hit.id, t + 6); showSheet(hit); closeWho(); spot(hit.species);
    sound.tap(sizeOf(hit)); if (hit.paid && !reduceMotion && !paused) sound.trick();
    if (!reduceMotion && !paused) { reactions.start(hit, t); overlay.addBubbles(hit); renderer.startTrick(hit, t); } // time stands still while paused, so a flip would hang until Play
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', (e) => { fingerGone(e.pointerId); drag = null; hold.cancel(); });

  // iPhone browsers, Instagram's included, can zoom the page on a pinch despite touch-action. Only a pinch that began on the ocean is ours.
  for (const type of ['gesturestart', 'gesturechange']) canvas.addEventListener(type, (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', (e) => { if (e.targetTouches.length >= 2) e.preventDefault(); }, { passive: false });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const pixels = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    setZoom(zoomGoal * Math.exp(-pixels * (e.ctrlKey ? 0.01 : 0.002)), { x: e.clientX * dpr, y: e.clientY * dpr }); // ctrl is how a trackpad reports a pinch
  }, { passive: false });
}

// A round keeps the camera in its neighbourhood.
const keepOnRail = (a) => Math.max(seekRange?.from ?? 0, Math.min(seekRange?.to ?? world.railEnd(mode.zone, areas.residents()), a));

// ---- Just the ocean (owner, 2026-11-13: "get rid of all menu things and view just the ocean itself") ----
// One button beside + and - hides every menu, button, tip and label, leaving the live ocean; dragging and zooming still work. A tap on the
// water, the small Show menus button or Escape brings everything back. The menus are only made invisible (site.css), so they keep their
// places. Real fullscreen is asked for too where the browser allows it: Instagram's own browser usually doesn't, and the view works without.
// The choice lasts for this visit only (sessionStorage).
const JUST_KEY = 'ocean:just-ocean';
let justOcean = false, wentFullscreen = false;
function setJustOcean(on, { fullscreen = false } = {}) {
  on = !!on;
  if (on === justOcean) return;
  justOcean = on;
  if (on) { if (seekHud) endSeek(); hideSheet(); closeWho(); $('tip').hidden = true; }
  document.body.classList.toggle('just-ocean', on);
  $('show-all').hidden = !on;
  $('just-ocean').setAttribute('aria-pressed', String(on));
  try { if (on) sessionStorage.setItem(JUST_KEY, '1'); else sessionStorage.removeItem(JUST_KEY); } catch { /* storage blocked: it lasts until the page closes */ }
  zoomMin = null; // with the Find box out of sight, the scenery's top edge has to stay off the whole screen
  if (world && zoomGoal < minZoom()) { zoomGoal = minZoom(); }
  if (world) refreshZoomButtons();
  redraw = true;
  if (on && fullscreen && document.fullscreenEnabled && !document.fullscreenElement) {
    document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).then(() => { wentFullscreen = true; }).catch(() => { /* not allowed here: the menus are hidden anyway */ });
  } else if (!on && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  // Keyboard focus follows the button that was pressed, so Tab and Enter work both ways.
  if (on && fullscreen) $('show-all').focus({ preventScroll: true });
  else if (!on && document.activeElement === $('show-all')) $('just-ocean').focus({ preventScroll: true });
}
$('just-ocean').addEventListener('click', () => setJustOcean(true, { fullscreen: true }));
$('show-all').addEventListener('click', () => setJustOcean(false));
// Leaving the browser's fullscreen (its own Escape, a back swipe) brings the menus back with it.
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && wentFullscreen) { wentFullscreen = false; setJustOcean(false); } });
const justRemembered = () => { try { return sessionStorage.getItem(JUST_KEY) === '1'; } catch { return false; } };

// ---- Zoom ----

// How far out this screen may zoom: the painted scenery's top edge has to stay behind the Find box (world.minZoomFor). Measured again after a resize.
// With just the ocean showing there is no Find box, so the edge stays above the screen.
let zoomMin = null;
function minZoom() {
  if (zoomMin === null && justOcean) zoomMin = world.minZoomFor(0);
  if (zoomMin === null) {
    const row = document.querySelector('.find').getBoundingClientRect(), pad = parseFloat(getComputedStyle(document.querySelector('.find-wrap')).paddingBottom) || 0;
    zoomMin = innerHeight > 0 ? world.minZoomFor((row.bottom + pad - 1) / innerHeight) : world.ZOOM.min;
  }
  return zoomMin;
}

// Off during a round, so that every target stays within reach.
function setZoom(value, at = null) {
  if (seek || oceanState !== 'on') return;
  zoomGoal = world.clampZoom(value, minZoom()); zoomAt = at;
  refreshZoomButtons();
}

function resetZoom() { zoomGoal = 1; zoomAt = null; refreshZoomButtons(); }

function refreshZoomButtons() {
  if (!world) return;
  $('zoom-in').disabled = !!seek || zoomGoal >= world.ZOOM.max;
  $('zoom-out').disabled = !!seek || zoomGoal <= minZoom();
}

// Closes on the goal each frame. Looking around, the point the zoom is centred on stays where it is; on a followed creature the creature stays in the middle.
function easeZoom(real) {
  if (zoom === zoomGoal) return;
  let next = zoom * (zoomGoal / zoom) ** (reduceMotion ? 1 : 1 - Math.exp(-real * ZOOM_EASE));
  if (Math.abs(Math.log(next / zoomGoal)) < 0.002) next = zoomGoal;
  if (mode.kind === 'zone') {
    const H = canvas.height, sideways = (zoomAt?.x ?? canvas.width / 2) - canvas.width / 2, upright = (zoomAt?.y ?? H / 2) / H - 0.5;
    along = keepOnRail(along + sideways * world.worldPerPixel(H) * (1 / zoom - 1 / next));
    pan = upright - (next / zoom) * (upright - pan);
  }
  zoom = next;
  pan = world.clampPan(pan, zoom);
}

$('zoom-in').addEventListener('click', () => setZoom(world.zoomStep(zoomGoal, true)));
$('zoom-out').addEventListener('click', () => setZoom(world.zoomStep(zoomGoal, false, minZoom())));

// Dragging out of a followed creature looks around from where the camera already is.
function stopFollowing() {
  const res = mode.res;
  along = world.alongOfX(res.zone, cam.x, areas.residents(), canvas.width, canvas.height);
  labels.delete(res.id);
  zone = res.zone;
  glideTo({ kind: 'zone', zone: res.zone });
  // Zoomed in, the visitor stays at the height they were looking at, as far as the limits allow, instead of sliding back to the zone's usual height.
  pan = world.clampPan(zoom * (from.hor - target().hor), zoom);
  from = { ...from, hor: from.hor - pan / zoom };
}

// In a zone with several areas, reaching the end of what is loaded brings in the next or previous area.
// It waits its turn: a drag can't interrupt a find or zone press that is still loading.
const EDGE = 150;
function turnAreaAtEdge() {
  if (picking() || mode.kind !== 'zone' || seekRange) return; // a round stays in the area it started in
  const place = areas.position();
  if (place.zone !== mode.zone) return;
  const end = world.railEnd(mode.zone, areas.residents());
  const dir = along >= end - EDGE ? 1 : along <= EDGE ? -1 : 0;
  if (!dir) return;
  if (dir > 0 ? place.nextFailed : place.prevFailed) { if (!$('area-msg').hasChildNodes()) areaFailed(() => turnArea(place.zone, place.n)); return; }
  if (dir > 0 ? place.hasNext : place.hasPrev) turnArea(place.zone, place.n + dir);
}

// Shows area n and keeps the camera where it is, even though the rail under it changes.
function turnArea(z, n) {
  return onePick(async (mine) => {
    const before = areas.residents();
    let list;
    try { list = await areas.show(z, n); }
    catch { if (mine === pick) areaFailed(() => turnArea(z, n)); return; }
    if (mine !== pick || list === before) return;
    along = world.alongOfX(z, world.viewAlong(z, along, before, canvas.width, canvas.height).x, list, canvas.width, canvas.height);
  });
}

// ---- Who lives here ----

let whoModule = null;
let whoShown = null;                   // what the list was last drawn for: { zone, residents, loading }
const closeWho = () => { whoShown = null; whoModule?.closeWho(); };

// The list is for the zone the visitor is in. While that zone's residents are still on their way it says so, rather than counting the old zone's.
function drawWho() {
  const loaded = !picking() && areas.position().zone === zone;
  const residents = loaded ? areas.residents().filter((r) => r.zone === zone) : null;
  if (whoShown && whoShown.zone === zone && whoShown.residents === residents && whoShown.loading === !loaded) return;
  whoShown = { zone, residents, loading: !loaded };
  const label = world.ZONES.find((z) => z.id === zone)?.label ?? '';
  const zi = names ? names.zones.findIndex((z) => z.id === zone) : -1;
  const total = zi >= 0 ? names.rows.reduce((n, r) => n + (r[3] === zi ? 1 : 0), 0) : (residents?.length ?? 0);
  whoModule.openWho({
    residents: residents ?? [], zone, zoneLabel: label, loading: !loaded, zoneTotal: Math.max(total, residents?.length ?? 0), goals: names?.zoneGoals ?? null,
    onSwim: (res) => onePick(async () => { closeWho(); zone = res.zone; markZone(zone); follow(res); showSheet(res); spot(res.species); }),
  });
}

// When a pick settles, an open list catches up with the zone it is now in.
function refreshWho() { if (whoShown && whoModule && !$('who').hidden) drawWho(); }

$('who-open').addEventListener('click', async () => {
  whoModule ??= await import('./who-lives-here.js');
  hideSheet();
  whoShown = null;
  drawWho();
});

// The speaker button. Sound left on last visit comes back with the first tap (phones allow sound no sooner).
function showSound() {
  const b = $('sound'); if (!b) return;
  b.setAttribute('aria-pressed', String(sound.on));
  b.setAttribute('aria-label', sound.on ? 'Turn sound off' : 'Turn sound on');
  b.title = sound.on ? 'Sound on' : 'Sound off';
}
$('sound')?.addEventListener('click', () => { sound.setZone(zone); sound.toggle(); showSound(); });
addEventListener('pointerdown', (e) => { if (!e.target.closest?.('#sound')) sound.wake(); }, true);
showSound();

$('pause').addEventListener('click', () => {
  paused = !paused;
  $('pause').textContent = paused ? 'Play' : 'Pause';
  $('pause').setAttribute('aria-label', paused ? 'Play the ocean' : 'Pause the ocean');
});

addEventListener('keydown', (e) => { if (e.key === 'Escape' && justOcean) { setJustOcean(false); return; } if (e.key === 'Escape' && !$('sheet').hidden) hideSheet(); });
document.addEventListener('touchstart', () => {}, { passive: true }); // without a listener like this iPhones never show a button as pressed

addEventListener('pointerdown', () => { if (!$('tip').hidden) { $('tip').hidden = true; remember('tip-seen', true); } }, true);

// ---- Spotted and Surprise me ----

let spotted = null;                    // made when names.json arrives
const waiting = [];                    // animals met before then
let celebrateTimer = 0;

// The count shows from the first find: "Spotted 0 of 163" on a first visit was one more line over the water that meant nothing yet.
function showSpotted() {
  $('spotted-count').textContent = spotted?.count() ? `Spotted ${spotted.count()} of ${spotted.total()}` : '';
}

const CHEERS = { only: "You've found the only one in the ocean", rare: "A rare find: only a few of these live in the ocean" };
function celebrate(kind) {
  const box = $('celebrate');
  box.textContent = CHEERS[kind];
  box.hidden = false;
  box.style.animation = 'none'; void box.offsetWidth; box.style.animation = ''; // plays again for a second find
  clearTimeout(celebrateTimer);
  celebrateTimer = setTimeout(() => { box.hidden = true; }, 4000);
}

// A species counts when the visitor taps one, swims to one from Who lives here, or lands on one with Surprise me.
function spot(speciesId) {
  if (!spotted) { waiting.push(speciesId); return; }
  const { celebrate: kind } = spotted.add(speciesId);
  showSpotted();
  if (kind) celebrate(kind);
}

function startSpotted() {
  spotted = createSpotted({ names, memory: { remember, recall, latest, keep } });
  const earlier = waiting.splice(0).map((id) => spotted.add(id));
  showSpotted();
  const kind = earlier.find((r) => r.celebrate)?.celebrate;
  if (kind) celebrate(kind);
  $('play').hidden = false;
  refreshSeekButton();
}

// ---- In the spotlight (owner, 2026-11-12) ----
// Creatures someone paid to have seen for 7 days, at the top of the ocean: tapping one swims there, the Surprise me way. A different one
// leads each day. Hidden names aren't listed (their creature still glows). While the shop is open, the last chip leads to it.
// Every one is listed, however many (owner, 2026-11-13: the shop promises each a place at the top), and the row scrolls sideways (site.css).
function showSpotlight() {
  const strip = $('spot'), shopTab = document.querySelector('nav.tabs a[href$="shop/"]');
  const rows = names ? spotlightRows(names, new Date().toISOString().slice(0, 10)) : [];
  if (!strip || (!rows.length && !shopTab)) return;
  const label = document.createElement('span'); label.className = 'spot-label'; label.textContent = '\u2728 In the spotlight';
  const chips = rows.map((row) => {
    const res = unpackRow(names, row), b = document.createElement('button');
    b.type = 'button'; b.className = 'spot-chip'; b.textContent = nameLabel(res.name);
    b.addEventListener('click', () => { hideSheet(); closeWho(); say(''); onePick((mine) => swim(res.key, null, mine, { ...res, areaN: res.area })); });
    return b;
  });
  if (shopTab) { const a = document.createElement('a'); a.className = 'spot-chip spot-yours'; a.href = `${shopTab.getAttribute('href')}#item=spotlight`; a.textContent = 'About the Spotlight'; /* neutral, never a nudge to buy (report S2) */ chips.push(a); }
  strip.replaceChildren(label, ...chips);
  strip.hidden = false;
}

// Same last-pick-wins path as a find or zone press. Without the ocean it goes to the card page instead of swimming.
$('surprise').addEventListener('click', () => {
  const row = names && surprisePick(names);
  if (!row) return;
  const res = unpackRow(names, row);
  hideSheet(); closeWho(); say('');
  onePick((mine) => swim(res.key, null, mine, { ...res, areaN: res.area }));
});

// ---- Hide and seek ----

let seekChecked = null;                // the residents the button was last worked out for
let seekShown = '';                    // the line last written to the round bar
let seekTarget = null;                 // the creature being sought, until the bar is closed
let seekNote = '', seekNoteUntil = 0;  // who a wrong tap landed on, shown for a moment
const BEST = 'seek-best';
const WRONG_SHOWN_MS = 2500;
const seekZone = () => areas.position().zone;

// The button waits for names.json with the rest of Play, needs the ocean, and is off in a zone where no neighbourhood has two residents.
function refreshSeekButton() {
  seekChecked = areas.residents();
  $('seek').hidden = oceanState !== 'on';
  $('seek').disabled = !chooseHood(seekChecked, null, seekZone());
}

function seekLine() {
  if (!seek) return seekShown;
  if (seekNote && performance.now() < seekNoteUntil) return seekNote;
  const s = Math.ceil(seek.left());
  return seek.hintRadius() === null ? `${s} s left` : `${s} s left. Follow the shimmer.`;
}

function showSeekLine(text) {
  if (text === seekShown) return;
  seekShown = text; $('seek-line').textContent = text;
}

function startSeek(rand = Math.random) {
  if (oceanState !== 'on' || seek || seekHud || picking() || flown < GLIDE || !cam) return null;
  const residents = areas.residents();
  const hood = chooseHood(residents, world.hoodOfCam(cam), seekZone());
  const range = hood && world.hoodRange(hood, residents);
  const round = range && createSeek({ residents, neighbourhood: hood, rand });
  if (!round) return null;
  hideSheet(); closeWho(); say(''); labels.clear();
  zone = seekZone(); markZone(zone);
  // Stay put if the camera is already in that neighbourhood; otherwise swim to the middle of it.
  along = world.hoodOfCam(cam) === hood ? Math.max(range.from, Math.min(range.to, world.alongOfX(zone, cam.x, residents, canvas.width, canvas.height))) : (range.from + range.to) / 2;
  seek = round; seekTarget = round.target; seekRange = range; seekHud = true; seekNote = ''; seekNoteUntil = 0;
  resetZoom();
  glideTo({ kind: 'zone', zone });
  showThumb($('seek-img'), round.target.key);
  $('seek-name').textContent = `Find ${nameLabel(round.target.name)}`;
  $('seek-end').textContent = 'Give up';
  seekShown = ''; showSeekLine(seekLine());
  $('seek-hud').hidden = false; document.body.classList.add('seeking');
  frameLoopOn();
  return hood;
}

// A tap during a round: the target ends it; anyone else is named and costs nothing.
function seekTapped(hit) {
  if (seek.tap(hit) === 'wrong') {
    seekNote = `That was ${nameLabel(hit.name)}`; seekNoteUntil = performance.now() + WRONG_SHOWN_MS;
    sound.wrong();
    showSeekLine(seekLine());
    return;
  }
  const secs = seek.elapsed(), res = seek.target, best = recall(BEST);
  const record = !(best > 0) || secs < best;
  if (record) remember(BEST, secs);
  labels.set(res.id, t + 6); spot(res.species);
  sound.found();
  if (!reduceMotion && !paused) { reactions.start(res, t); overlay.addBubbles(res); renderer.startTrick(res, t); }
  finishSeek(`Found it in ${secs.toFixed(1)} s. ${record ? 'A new best!' : `Best: ${best.toFixed(1)} s`}`);
}

function stepSeek(dt) {
  seek.tick(dt);
  if (seek.state === 'timeout') { timeUp(); return; }
  overlay.setHint(seek.target, seek.hintRadius(), seek.ringOffset);
  showSeekLine(seekLine());
}

// Out of time, or given up: the camera swims to it.
function timeUp() {
  const res = seek.target;
  finishSeek(seek.elapsed() >= SEEK.seconds ? "Time's up. Here it is." : 'Here it is.');
  sound.timeUp();
  follow(res);
}

// The round is over; the bar stays up with the result until it is closed.
function finishSeek(text) {
  seek = null; seekRange = null;
  refreshZoomButtons();
  overlay.setHint(null, null);
  showSeekLine(text);
  $('seek-end').textContent = 'OK';
}

// Closes everything, from a close, or because the visitor went somewhere else.
function endSeek() {
  seek = null; seekTarget = null; seekRange = null; seekHud = false;
  refreshZoomButtons();
  overlay.setHint(null, null);
  $('seek-hud').hidden = true; document.body.classList.remove('seeking');
}

$('seek').addEventListener('click', () => { startSeek(); });
$('seek-end').addEventListener('click', () => { if (seek) { seek.giveUp(); timeUp(); } else endSeek(); });

// ---- names.json loads last: counts, and whether the remembered resident is still here ----

async function loadNamesLast() {
  try { names = await loadNames(); applyGlow(); }
  catch { showRetry($('names-msg'), () => { $('names-msg').replaceChildren(); loadNamesLast(); }); return; }
  canvas.setAttribute('aria-label', `A live ocean with ${names.rows.length} residents swimming in it`);
  startSpotted();
  showSpotlight();
  if (whoShown && !$('who').hidden) { whoShown = null; drawWho(); } // a list opened before names.json arrived gains its count and the zone goals
  const last = recall('last-found');
  if (last?.key && !names.rows.some((r) => r[0] === last.key)) { remember('last-found', null); offerLastFound(); }
}

// ---- Start ----

offerLastFound();
const arrival = new URLSearchParams(location.search).get('c');
if (arrival !== null) swimTo(arrival);
else oceanReady.then((ok) => { if (ok && pick === 0) { const back = placeToReturnTo(); chooseZone(back?.zone ?? DEFAULT_ZONE, back); } });
oceanReady.then((ok) => (ok ? firstArea : null)).then(loadNamesLast);

// For tests and tools.
window.oceanPage = {
  sound: () => ({ on: sound.on, running: sound.running, zone: sound.zone, played: [...sound.played] }),
  findName(typed) { $('name').value = typed; return finder.run(); },
  swimToKey: (key) => swimTo(key),
  flips: () => reactions.active(),
  tricks: () => renderer?.tricks?.started.size ?? 0,
  feeding: () => feeds.active(t),
  bubbling: () => overlay?.busy() ?? 0,
  spottedCount: () => spotted?.count() ?? null,
  state: () => ({ justOcean, revealed, bakeMs: renderer?.pictures?.budgetMs ?? null, ocean: oceanState, zone, area: areas.position().n, follow: mode.kind === 'follow' ? mode.res.key : null, camX: cam?.x ?? null, still: flown >= GLIDE, paused, residents: areas.residents().length, names: !!names, findReadyAt, zoom, zoomGoal, pan, along, coast, pace: watchdog.state().pace, level: watchdog.state().level, dpr }),
  residents: () => areas.residents(),
  // The hidden phone meter's numbers (null unless the address has ?fps=1), for tests.
  meter: () => meter?.numbers() ?? null,
  // Zoom, for tests and the speed tool: 'min', 'max' or a number, centred on a canvas point if `at` is given.
  zoomTo(z, at = null) { setZoom(z === 'min' ? minZoom() : z === 'max' ? world.ZOOM.max : z, at); },
  zoomLimits: () => (world ? { min: minZoom(), max: world.ZOOM.max } : null),
  // The id of whoever a tap at this point of the page would find, now or `ahead` seconds on; null on open water. The same check a real tap makes.
  tapProbe: (x, y, ahead = 0) => (oceanState === 'on' && cam ? tapAt(x, y, ahead)?.id ?? null : null),
  // Hide and seek, for tests: start a round (rand is a number from 0 to 1), look along the rail, run the clock, and see where the target is.
  startSeek: (rand) => startSeek(typeof rand === 'number' ? () => rand : undefined),
  seekLook(a) { if (seekRange) { along = Math.max(seekRange.from, Math.min(seekRange.to, a)); redraw = true; } },
  seekAdvance(secs) { for (let left = secs; seek && left > 0; left -= 0.5) stepSeek(Math.min(0.5, left)); },
  seekInfo: () => ({ playing: !!seek, bar: seekHud, range: seekRange, target: seekTarget && { id: seekTarget.id, key: seekTarget.key, name: seekTarget.name, hood: seekTarget.neighbourhood ?? seekTarget.zone }, camHood: cam?.hood ?? null, line: $('seek-line').textContent, name: $('seek-name').textContent, hint: seek ? seek.hintRadius() : null, left: seek ? seek.left() : null, button: { hidden: $('seek').hidden, disabled: $('seek').disabled } }),
  // Where a resident (default: the target) is on the canvas with the camera at `a` along the rail (or where it is now), and who a tap there would find.
  seekProbe(a, id) {
    const W = canvas.width, H = canvas.height, res = areas.residents(), who = id ? res.find((r) => r.id === id) : seekTarget;
    const view = a === undefined || a === null ? cam : world.viewAlong(zone, a, res, W, H);
    const at = world.screenOf(who, t, view, W, H, poseAdjust);
    const hit = at && world.tapHit(res, at.x, at.y, t, view, W, H, 40 * dpr, poseAdjust);
    return { x: at?.x ?? null, y: at?.y ?? null, W, H, hood: view.hood, hit: hit?.id ?? null, hitsIt: hit?.id === who.id };
  },
  // A real tap on a resident (default: the target) where it is drawn now.
  seekTapTarget(id) {
    const who = id ? areas.residents().find((r) => r.id === id) : seekTarget;
    const at = world.screenOf(who, t, cam, canvas.width, canvas.height, poseAdjust);
    for (const type of ['pointerdown', 'pointerup']) canvas.dispatchEvent(new PointerEvent(type, { clientX: at.x / dpr, clientY: at.y / dpr, pointerId: 1, bubbles: true }));
    return { x: at.x, y: at.y };
  },
  // Points the camera at one neighbourhood exactly as the review page does, for the speed tool.
  lookAtHood(id) {
    return onePick(async (mine) => {
      const z = world.zoneOfHood(id);
      zone = z; markZone(z);
      await areas.show(z, 0);
      if (mine !== pick) return;
      glideTo({ kind: 'hood', hood: id });
      frameLoopOn();
    });
  },
};
const findReadyAt = Math.round(performance.now());
