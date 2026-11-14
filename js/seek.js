// Hide and seek: one round. A random resident of one neighbourhood is the target; the visitor has 60 seconds to find and tap it.
// This file holds the rules and the clock only. The camera, the picture of the target and the hint ring are drawn by the ocean page.

// Same as site-names.js's neighbourhoodOf. Not imported: this file is tested from source, where ../core is not beside it.
const neighbourhoodOf = (res) => res.neighbourhood ?? res.zone;

export const SEEK = { seconds: 60, hintAfter: 20 };
export const SEEK_MIN_RESIDENTS = 2;   // a neighbourhood with one resident makes a poor game
const MAX_STEP = 1;                    // a longer gap than this is a hidden tab or a stalled phone, not time the visitor spent looking

// Where a round starts: the neighbourhood the camera is in if it has two or more residents, otherwise the zone's busiest.
// Counts only residents of `zoneId`. Null when no neighbourhood there has two.
export function chooseHood(residents, current, zoneId) {
  const counts = new Map();
  for (const r of residents) if (r.zone === zoneId) counts.set(neighbourhoodOf(r), (counts.get(neighbourhoodOf(r)) || 0) + 1);
  if ((counts.get(current) || 0) >= SEEK_MIN_RESIDENTS) return current;
  let best = null;
  for (const [id, n] of counts) if (n >= SEEK_MIN_RESIDENTS && (best === null || n > counts.get(best))) best = id;
  return best;
}

export const RING_OFFSET_MAX = 0.7;    // the ring's centre is at most this share of its radius from the target, so the target is always inside it

// Where the hint ring is centred, for a ring of radius r around a target drawn at (x, y). offset is the round's own { dx, dy } (see createSeek).
export const ringCentre = (x, y, r, offset) => ({ x: x + offset.dx * r, y: y + offset.dy * r });

// Null when the neighbourhood has nobody in it.
export function createSeek({ residents, neighbourhood, rand = Math.random }) {
  const pool = residents.filter((r) => neighbourhoodOf(r) === neighbourhood);
  if (!pool.length) return null;
  const target = pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
  // One fixed nudge for the whole round, in a direction picked now, so the ring never sits exactly on the target.
  const angle = rand() * 2 * Math.PI, nudge = RING_OFFSET_MAX * Math.sqrt(rand());
  const ringOffset = { dx: Math.cos(angle) * nudge, dy: Math.sin(angle) * nudge };
  let elapsed = 0, state = 'playing';

  return {
    target,
    ringOffset,
    get state() { return state; },
    elapsed: () => elapsed,
    left: () => SEEK.seconds - elapsed,
    // dt is seconds. Ignored once the round is over, and when it is a long gap.
    tick(dt) {
      if (state !== 'playing' || !(dt > 0) || dt > MAX_STEP) return;
      elapsed += dt;
      if (elapsed >= SEEK.seconds) { elapsed = SEEK.seconds; state = 'timeout'; }
    },
    // Only the target counts. Any other creature is 'wrong' and changes nothing.
    tap(res) {
      if (state !== 'playing' || res?.id !== target.id) return 'wrong';
      state = 'found';
      return 'found';
    },
    giveUp() { if (state === 'playing') state = 'timeout'; },
    // null until the hint starts, then 1 shrinking to 0 as the time runs out: the share of the ring's full size that is left.
    hintRadius() {
      if (state !== 'playing' || elapsed < SEEK.hintAfter) return null;
      return Math.max(0, 1 - (elapsed - SEEK.hintAfter) / (SEEK.seconds - SEEK.hintAfter));
    },
  };
}
