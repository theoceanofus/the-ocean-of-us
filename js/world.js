// The only file that knows the renderer's camera (project 2's app/render/view.js). Everything the ocean page needs from it goes through here.
import { alongOfHood, busiestHood, railLength, tapTarget, viewAt, viewForHood, viewForResident } from '../render/view.js';
import { poseAt, setCompany } from '../render/motion.js';
import { CREATURE_SCALE, FOCAL, magnifyFor, project } from '../render/scene.js';
import { artworkRadius } from '../render/metrics.js';
import { HOOD_BY_ID, hoodOf, slideDepth } from '../core/hoods.js';
import { ZONES } from '../core/zones.js';

export { OceanRenderer, lerpCam } from '../render/scene.js';
export { setEventGlow } from '../render/extras.js';
export { stillBaking } from '../render/pictures.js';
export { ZONES, viewForHood };
// The residents loaded, so neighbours can school, pair up, chase and circle now and then (render/company.js).
export const keepCompany = (residents) => setCompany(residents);
// A creature's size in world units, as the scene draws it (the sounds pitch a tapped creature's bubble by it).
export const sizeOf = (res) => artworkRadius(res.species) * CREATURE_SCALE * (res.size || 1);

// `along` is world units along a zone's rail: its occupied neighbourhoods end to end. Dragging moves along it.
export const railEnd = (zoneId, residents) => railLength(zoneId, residents);
export const zoneOfHood = (hoodId) => HOOD_BY_ID[hoodId].zone;
export const hoodLabel = (hoodId) => HOOD_BY_ID[hoodId]?.label ?? '';

// Where a zone opens: the middle of its busiest neighbourhood.
export function openingAlong(zoneId, residents) {
  const hood = busiestHood(zoneId, residents);
  return hood ? alongOfHood(hood.id, residents) : 0;
}

// The neighbourhood a camera is in (null in an empty zone), and the part of the zone's rail that stays inside it.
export const hoodOfCam = (cam) => cam?.hood ?? null;
export function hoodRange(hoodId, residents) {
  const zoneId = HOOD_BY_ID[hoodId].zone;
  let x0 = Infinity, x1 = -Infinity;
  for (const r of residents) {
    if (r.zone !== zoneId || hoodOf(r).id !== hoodId) continue;
    if (r.home.x < x0) x0 = r.home.x;
    if (r.home.x > x1) x1 = r.home.x;
  }
  if (x0 > x1) return null;
  const mid = alongOfHood(hoodId, residents), half = (x1 - x0) / 2;
  return { from: mid - half, to: mid + half };
}

export const viewAlong = (zoneId, along, residents, W, H) => viewAt(zoneId, along, W, H, residents);

// The along that shows world position x, so a view can stay put when the loaded residents change the rail under it.
export function alongOfX(zoneId, x, residents, W, H) {
  let lo = 0, hi = railLength(zoneId, residents);
  if (hi <= 0) return 0;
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    if (viewAt(zoneId, mid, W, H, residents).x < x) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// The opening view of a zone, and the resident nearest the middle of it (null if the zone is empty).
export function viewForZone(zoneId, residents, t, W, H) {
  const cam = viewAlong(zoneId, openingAlong(zoneId, residents), residents, W, H);
  let star = null, best = Infinity;
  for (const r of residents) {
    if (r.zone !== zoneId) continue;
    const off = Math.abs(poseAt(r, t).x - cam.x);
    if (off < best) { best = off; star = r; }
  }
  return { cam, star };
}

export const followCamera = (res, t, W, H) => viewForResident(res, t, W, H);

// ---- Zoom ----
// Zoom 1 is the ordinary view. A zoomed camera is the same camera with a longer or shorter lens, centred on the middle of the screen.
export const ZOOM = {
  min: 0.85, // further out and the straight top edge of the painted scenery comes out from behind the Find box on a phone (a taller screen stops sooner: minZoomFor)
  max: 2,    // further in and the typical creature's picture is stretched over 1.3 times and goes soft (measured on the real residents)
  step: 1.5,
};
const SWIM_DEPTH = 600; // the depth the swimming lanes and most ground rows slide at

// How far out this screen may zoom. Zoomed out to z, the painted scenery's straight top edge sits (1 - z) / 2 of the way down the screen,
// so it has to stay behind the Find box. `cover` is how much of the screen's height the Find box hides: a taller screen zooms out less.
export const minZoomFor = (cover) => Math.max(ZOOM.min, Math.min(1, 1 - 2 * cover));
export const clampZoom = (z, min = ZOOM.min) => Math.max(min, Math.min(ZOOM.max, z));
// The next button press from z. A press that would pass the ordinary view stops on it.
export function zoomStep(z, up, min = ZOOM.min) {
  const next = up ? z * ZOOM.step : z / ZOOM.step;
  return z !== 1 && z < 1 !== next < 1 ? 1 : clampZoom(next, min);
}
// How far up or down the view may look (as a share of the screen's height) at this zoom: zoomed in, as far as the ordinary view's top and bottom; never past them.
export const clampPan = (pan, z) => { const most = Math.max(0, (z - 1) / 2); return Math.max(-most, Math.min(most, pan)); };
// Zoomed in, a creature can be looked away from while its name is still up. The name stops at the top and bottom of the screen, so without this it
// would stay there on empty water. at: where the creature is (screenOf). H: the canvas height.
export const labelHasBody = (at, H) => !!at && at.y + at.px / 2 > H * 0.1 && at.y - at.px / 2 < H * 0.9;
// World units along the rail for one canvas pixel on screen, at the depth people swim at.
export const worldPerPixel = (H, z = 1) => SWIM_DEPTH / (FOCAL * H * z);
// The camera as drawn: `cam` with the zoom and the look up or down added. Zoom 1 with no pan is the very same camera.
export const zoomCam = (cam, z, pan = 0) => (z === 1 && !pan ? cam : { ...cam, zoom: z, hor: 0.5 + z * (cam.hor - 0.5) + pan });

// Who a tap lands on, or null. px, py and reach are in canvas pixels.
// With `adjust` (the page's poseAdjust), a creature is found where it is drawn, not where poseAt alone puts it.
export function tapHit(residents, px, py, t, cam, W, H, reach, adjust = null) {
  if (!adjust) return tapTarget(residents, px, py, t, cam, W, H, reach);
  let best = null;
  for (const r of residents) {
    const q = project(drawnPose(r, t, adjust), cam, W, H);
    if (!q || q.dz < 40) continue;
    const drawn = artworkRadius(r.species) * CREATURE_SCALE * (r.size || 1) * magnifyFor(r, cam) * q.s;
    const d = Math.hypot(q.x - px, q.y - py);
    if (d < Math.max(reach, drawn * TAP_REACH) && (!best || d < best.d)) best = { r, d };
  }
  return best ? best.r : null;
}
const TAP_REACH = 0.7; // same share of the drawn radius as view.js's tapTarget
const drawnPose = (res, t, adjust) => { const p = poseAt(res, t); return (adjust && adjust(res, p, t)) || p; };

// Where a resident, or a world point { x, y, z }, is on a canvas of W x H under this camera, for drawing over the ocean.
// px is a resident's drawn radius in pixels; s is pixels per world unit. Null when it is behind the lens.
export function screenOf(target, t, cam, W, H, adjust = null) {
  const isResident = !!target.home;
  const q = project(isResident ? drawnPose(target, t, adjust) : target, cam, W, H);
  if (!q) return null;
  const px = isResident ? q.s * CREATURE_SCALE * (target.size || 1) * magnifyFor(target, cam) * artworkRadius(target.species) : 0;
  return { x: q.x, y: q.y, s: q.s, px };
}

// Where food dropped at canvas point (px, py) lands, and who is on screen to come to it.
// The food sits at the depth of the creatures nearest the finger (the middle one of the eight nearest), so it lands among them.
// Returns { pos: { x, y, z, slideZ }, near: [residents on screen] }. A creature's home stands in for where it is, which is close enough to pick the nearest.
// Ground rows slide sideways at slideDepth, not at their real depth, so the food does too when it lands among them.
export function foodSpot(residents, px, py, cam, W, H) {
  const near = [];
  for (const r of residents) {
    const q = project({ ...r.home, slideZ: slideDepth(r) }, cam, W, H);
    if (!q || q.dz < 40 || q.x < 0 || q.x > W || q.y < 0 || q.y > H) continue;
    near.push({ r, d: Math.hypot(q.x - px, q.y - py) });
  }
  near.sort((a, b) => a.d - b.d);
  const close = near.slice(0, 8);
  const middle = close.length ? close[close.length >> 1].r : null;
  const z = middle ? middle.home.z : cam.z + 600, slideZ = middle ? slideDepth(middle) : undefined;
  const unit = project({ x: cam.x + 1, y: cam.h, z, slideZ }, cam, W, H); // where one world unit to the side lands gives the sideways scale; s is the upright one
  return {
    pos: { x: cam.x + (px - W / 2) / (unit.x - W / 2), y: Math.max(0, cam.h - (py - cam.hor * H) / unit.s), z, slideZ },
    near: near.map((n) => n.r),
  };
}
