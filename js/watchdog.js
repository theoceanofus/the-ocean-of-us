// Keeps the ocean smooth on whatever phone it finds itself on, and gives back what it took when there is room again (research 2026-11-09, Smoother rank 5).
// Every few seconds the page reports how the last few seconds went. The answer is a level (the extras given up, then canvas resolution)
// and a pace: 60, or a deliberate steady 30 when a view keeps just missing 60, because even frames at 30 look smoother than frames swinging between 30 and 60.
// Kept apart from the page and free of the browser, so all of this can be tested.

export const WATCH = {
  everyMs: 3000,      // how long one reading lasts
  slow: 24,           // under this a phone gives something up at once
  holds60: 55,        // frames a second that count as keeping up at a pace of 60
  holds30: 27,        // the same at a pace of 30
  mostly60: 48,       // at a pace of 60, this or better with nine frames in ten on time keeps up too
  roomy: 5,           // good readings in a row before trying for more
  proven: 2,          // good readings that make a trial stick
  retryMs: 30_000,    // the wait after a trial that failed, doubled each time it fails again
  retryMostMs: 240_000,
  maxLevel: 6,        // 0 to 4 are the renderer's quality steps; 4 and up also lower the canvas
  swing: 1.35,        // the slowest tenth of frames against the quickest tenth: over this the frames are uneven
};

// Canvas resolution at a level: full until the extras are gone, then 0.7 of itself a step, never under 0.75.
export const dprAt = (level, full) => Math.max(Math.min(0.75, full), level < 4 ? full : full * 0.7 ** (level - 3));
export const qualityAt = (level) => Math.min(level, 4);

// How a list of frame gaps (milliseconds) went.
export function readGaps(gaps) {
  const g = [...gaps].sort((a, b) => a - b), at = (share) => g[Math.min(g.length - 1, Math.floor(g.length * share))];
  const total = g.reduce((n, x) => n + x, 0);
  return { fps: total > 0 ? (g.length * 1000) / total : 0, quick: g.length ? at(0.1) : 0, slow: g.length ? at(0.9) : 0 };
}

export function createWatchdog({ start = 0 } = {}) {
  let level = start, pace = 60, good = 0, trial = null, retry = WATCH.retryMs, nextTry = 0, view = null, heldHere = true;
  const held = new Map(); // view -> { level, pace } that kept up there

  const failed = (now) => { retry = Math.min(WATCH.retryMostMs, retry * 2); nextTry = now + retry; };
  const out = () => ({ level, pace, trial: trial?.kind ?? null });

  return {
    // A phone that the system holds to a steady 30 (Low Power Mode does this and can't be detected) is keeping up, not falling behind.
    note({ fps, quick, slow }, now) {
      const steady = quick > 0 && slow <= quick * WATCH.swing;
      const capped = pace === 60 && steady && fps >= WATCH.holds30 && fps <= 33;
      // The odd late frame in an even 60 is no reason for 30, which makes every frame late (2026-11-15: a page holding 60 read 54 to 58).
      const mostly = pace === 60 && steady && fps >= WATCH.mostly60;
      const keeping = pace === 60 ? fps >= WATCH.holds60 || capped || mostly : fps >= WATCH.holds30;
      heldHere = keeping;
      if (fps < WATCH.slow) {
        good = 0;
        if (trial) { ({ level, pace } = trial.from); trial = null; failed(now); return out(); }
        level = Math.min(WATCH.maxLevel, level + 1); pace = 30;
        return out();
      }
      if (!keeping) {
        good = 0;
        if (trial) { ({ level, pace } = trial.from); trial = null; failed(now); return out(); }
        if (pace === 60) pace = 30;
        else level = Math.min(WATCH.maxLevel, level + 1); // only just under a steady 30: not quite enough room even so
        return out();
      }
      good++;
      if (trial) {
        if (good < WATCH.proven) return out();
        // 60 proven: places that held only 30 at this level get another go.
        if (trial.kind === 'pace') for (const [place, was] of held) if (was.pace === 30 && was.level === level) held.delete(place);
        trial = null; retry = WATCH.retryMs; good = 0;
        return out();
      }
      if (good < WATCH.roomy || now < nextTry) return out();
      // Detail comes back first, then the pace, one thing at a time, and each has to prove itself.
      if (level > 0) { trial = { kind: 'level', from: { level, pace } }; level--; good = 0; }
      else if (pace === 30) { trial = { kind: 'pace', from: { level, pace } }; pace = 60; good = 0; }
      return out();
    },
    // The visitor has moved on. What a slow place gave up stays there: a place seen before goes back to what held there, a new one tries one step better.
    // So that a visitor who keeps moving gets 60 back, good readings still count after a move, and a trial of 60 goes on in a new place.
    enter(next) {
      if (next === view) return out();
      if (view !== null && heldHere && !trial) held.set(view, { level, pace });
      const known = held.get(next), from = trial && !(trial.kind === 'pace' && !known) ? trial.from : null;
      if (from) { level = from.level; pace = from.pace; trial = null; }
      if (known) ({ level, pace } = known);
      else if (view !== null) level = Math.max(0, level - 1);
      view = next; heldHere = true;
      return out();
    },
    state: out,
  };
}
