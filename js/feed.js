// Feed the ocean: press and hold on the water and food drifts down; the nearest creatures swim over, stay a while, and ease home.
// createHold() is the press-and-hold timing; createFeeds() gives the renderer a pose adjustment (chained with reactions in ocean-page.js).
import { FOOD_SECONDS, FOOD_SINK } from './overlay.js';

export const FEED = { holdMs: 350, moveLimit: 8, eaters: 8, arrive: 2, stay: 6, back: 2, maxFeeds: 3 };
const TOTAL = FEED.arrive + FEED.stay + FEED.back;

// A press that stays put for holdMs fires onHold(x, y) once. Moving more than moveLimit px, letting go or cancelling stops it.
export function createHold({ onHold }) {
  let timer = 0, at = null;
  const stop = () => { clearTimeout(timer); timer = 0; at = null; };
  return {
    down(x, y) {
      stop();
      at = { x, y };
      timer = setTimeout(() => { const { x: hx, y: hy } = at; stop(); onHold(hx, hy); }, FEED.holdMs);
    },
    move(x, y) { if (at && Math.hypot(x - at.x, y - at.y) > FEED.moveLimit) stop(); },
    up: stop,
    cancel: stop,
    pending: () => at !== null,
  };
}

const smooth = (u) => { const c = Math.min(1, Math.max(0, u)); return c * c * (3 - 2 * c); };
const away = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

// How far a creature is from its own swimming and at the food, 0 to 1, at u seconds into its feed.
const pull = (u) => (u < FEED.arrive ? smooth(u / FEED.arrive) : u < FEED.arrive + FEED.stay ? 1 : 1 - smooth((u - FEED.arrive - FEED.stay) / FEED.back));

export function createFeeds() {
  const feeds = [];          // { t0, pos }
  const eating = new Map();  // resident id -> { t0, pos, dx, dy, dz, phase }
  let endsAt = 0;            // when the last eater is home; then every entry goes, even those never drawn since

  function prune(t) {
    for (let i = feeds.length - 1; i >= 0; i--) if (t - feeds[i].t0 >= TOTAL) feeds.splice(i, 1);
  }

  return {
    // Food lands at worldPos {x, y, z}. The nearest eaters of onScreenResidents (any that are free) come over. False when three feeds are already going.
    drop(worldPos, onScreenResidents, t) {
      prune(t);
      if (feeds.length >= FEED.maxFeeds) return false;
      const pos = { ...worldPos };
      feeds.push({ t0: t, pos });
      const best = []; // the nearest few so far, nearest first, so thousands of residents cost one pass
      for (const res of onScreenResidents) {
        const busy = eating.get(res.id);
        if (busy && t - busy.t0 < TOTAL) continue;
        const d = away(res.home, pos);
        if (best.length === FEED.eaters && d >= best[best.length - 1].d) continue;
        let i = best.length;
        while (i > 0 && best[i - 1].d > d) i--;
        best.splice(i, 0, { res, d });
        if (best.length > FEED.eaters) best.pop();
      }
      best.forEach(({ res }, i) => {
        // Spread round the food, the nearest first, so nobody sits on top of another.
        const angle = (i / FEED.eaters) * 2 * Math.PI + 0.4, r = 22 + 16 * (res.size || 1);
        endsAt = Math.max(endsAt, t + TOTAL);
        eating.set(res.id, { t0: t, pos, dx: Math.cos(angle) * r, dy: Math.sin(angle) * r * 0.5, dz: Math.sin(angle * 2) * r * 0.25, phase: i * 1.7 });
      });
      return true;
    },
    // Called for every resident every frame. Returns the pose itself unless this resident is eating; never changes the pose it is given.
    adjust(res, pose, t) {
      if (!eating.size) return pose;
      if (t >= endsAt) { eating.clear(); return pose; }
      const e = eating.get(res.id);
      if (!e) return pose;
      const u = t - e.t0;
      if (u >= TOTAL) { eating.delete(res.id); return pose; }
      if (!(u > 0)) return pose;
      const w = pull(u);
      // The food sinks while it lasts, and the creature goes down with it.
      const fy = Math.max(0, e.pos.y - Math.min(u, FOOD_SECONDS) * FOOD_SINK);
      const tx = e.pos.x + e.dx, ty = Math.max(0, fy + e.dy + Math.sin(u * 5 + e.phase) * 1.5 * w), tz = e.pos.z + e.dz;
      // Faces the food. Some animals swim tail first, so their drawing faces the other way.
      const toward = (e.pos.x >= tx ? 1 : -1) * (pose.m?.back ? -1 : 1);
      return {
        ...pose,
        x: pose.x + (tx - pose.x) * w, y: pose.y + (ty - pose.y) * w, z: pose.z + (tz - pose.z) * w,
        // A ground row slides sideways at its own depth (see slideDepth), so an eater eases from its slide depth to the food's.
        slideZ: pose.slideZ === undefined && e.pos.slideZ === undefined ? undefined : (pose.slideZ ?? pose.z) + ((e.pos.slideZ ?? tz) - (pose.slideZ ?? pose.z)) * w,
        facing: pose.facing + (toward - pose.facing) * w,
        pitch: (pose.pitch || 0) * (1 - w),
      };
    },
    active(t) { if (t !== undefined) prune(t); return feeds.length; },
  };
}
