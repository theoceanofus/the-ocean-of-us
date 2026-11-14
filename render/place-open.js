// Open Water (spec 2026-11-08-ocean-environment): no floor, just endless blue. Its landmarks are few and far away, because the blue is the point.
import { registerKit } from './set-pieces.js';
import { seamount, seamountFine, weedRaft, weedDrift } from './place-art.js';
import { drawAddition } from './scenery.js';

// Where each drawing sits on its square, so the live site keeps it cropped. From `node tools/place-boxes.mjs`; run it after changing a piece.
const BOXES = { raft: [-464, -984, 492, -76], wreck: [-408, -424, 380, 36], mount: [-500, -812, 512, 8], drift: [-444, -992, 480, -228] };

registerKit('open', {
  pieces: {
    raft: { h: 60, sway: true, draw: (g) => weedRaft(g, 3) },
    wreck: { h: 120, unlit: true, draw: (g) => { g.save(); g.scale(1.25, 1.25); drawAddition(g, { type: 'shipwreck', seed: 7 }, 0, 0.72); g.restore(); } },
    mount: { h: 200, unlit: true, draw: (g) => seamount(g, 2), live: (g) => seamountFine(g, 2) },
    drift: { h: 40, sway: true, draw: (g) => weedDrift(g, 6) },
  },
  hoods: {
    'sunlit-blue': { landmark: ['raft', .55, .55, .6] },
    'shark-alley': { landmark: ['wreck', .5, .985, .42] },
    'whale-road': { landmark: ['mount', .78, 1.14, 1.05] },
  },
  // The blue stays the point: only a little loose weed. (Anything on a background card turns paler than the dark lower water, so nothing goes on one here.)
  more: { 'sunlit-blue': { frame: [['drift', .5, .62, .55]] } },
  boxes: BOXES,
});
