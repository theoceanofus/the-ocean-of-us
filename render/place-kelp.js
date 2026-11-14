// The Kelp Forest (spec 2026-11-08-ocean-environment): golden kelp rising to the surface like tall trees, over a rocky floor.
import { registerKit } from './set-pieces.js';
import { kelp, seagrass, urchin, rock, anemone, lobsterTrap, sunbeam, softSunbeam, kelpSprouts } from './place-art.js';

const scaled = (list, k, spread = 1) => list.map(([p, x, y, s, f]) => [p, .5 + (x - .5) * spread, y, s * k, f]);
const KELP = ['kA', 'kB', 'kC'];
const FAR = [[KELP, .1, .74, 1.5], [KELP, .3, .74, 1.5, true], [KELP, .48, .74, 1.5], [KELP, .66, .74, 1.5, true], [KELP, .84, .74, 1.5], [KELP, .97, .74, 1.5, true], [KELP, .2, .74, 1.5], [KELP, .57, .74, 1.5], [KELP, .76, .74, 1.5]];
const BACK = [[KELP, .06, .9, 1.75], [KELP, .22, .9, 1.75, true], [KELP, .84, .9, 1.75], [KELP, .96, .9, 1.75, true], ['rockL', .42, .84, .5]];
const FRAME = [[KELP, -.02, 1, 1.95], [KELP, .13, 1, 1.95, true], [KELP, .9, 1, 1.95], [KELP, 1.03, 1, 1.95, true], ['rockH', 0, 1.04, .8], ['rockL', .25, 1.05, .78], ['rockH', 1.02, 1.05, .78, true], ['rockL', .74, 1.06, .74, true], ['urchin', .3, .925, .26], ['urchinB', .42, .955, .3], ['urchin', .68, .93, .2], ['ane', .6, .99, .34], ['grass', .14, .93, .4], ['grass', .86, .93, .4]];

// Where each drawing sits on its square, so the live site keeps it cropped. From `node tools/place-boxes.mjs`; run it after changing a piece.
const BOXES = { kA: [-152, -992, 168, 8], kB: [-188, -992, 160, 8], kC: [-152, -992, 172, 8], rockL: [-480, -460, 480, 8], rockH: [-480, -680, 480, 8], urchin: [-212, -284, 204, 12], urchinB: [-172, -220, 168, 8], ane: [-324, -428, 356, 0], grass: [-260, -260, 280, 8], trap: [-376, -328, 368, 24], beam: [-292, -984, 292, -12], sprouts: [-436, -340, 416, 8] };

registerKit('kelp', {
  pieces: {
    kA: { h: 60, sway: true, draw: (g) => kelp(g, 3) }, kB: { h: 60, sway: true, draw: (g) => kelp(g, 8, 975, '#60592a', '#9c8a35') }, kC: { h: 60, sway: true, draw: (g) => kelp(g, 17, 975, '#756a2a', '#c0a43c') },
    rockL: { h: 120, draw: (g) => rock(g, 11, 480, 420, '#4a4d3f') }, rockH: { h: 120, draw: (g) => rock(g, 21, 480, 620, '#43473b') },
    urchin: { h: 60, draw: (g) => urchin(g, 5, 100) }, urchinB: { h: 60, draw: (g) => urchin(g, 9, 80, '#7b2a4a') }, ane: { h: 110, sway: true, draw: (g) => anemone(g, 13, '#d07a3e', '#ffe8c0', 260) }, grass: { h: 60, sway: true, draw: (g) => seagrass(g, 7, 44, 240, '#7a9c43') },
    trap: { h: 120, draw: (g) => lobsterTrap(g, 4) }, beam: { h: 30, unlit: true, side: 512, draw: (g) => sunbeam(g), live: (g) => softSunbeam(g) }, sprouts: { h: 60, sway: true, draw: (g) => kelpSprouts(g, 5) },
  },
  hoods: {
    understory: { far: FAR, mid: BACK, frame: scaled(FRAME, 1.05, 1.08), landmark: ['trap', .5, .98, .7] },
    'kelp-halls': { far: FAR, mid: BACK, frame: FRAME, landmark: ['beam', .5, .98, 1.5] },
    'seal-rocks': { far: scaled(FAR, .85), mid: scaled(BACK, .85), frame: scaled(FRAME, .8), landmark: ['rockH', .5, 1.04, .7] },
  },
  more: Object.fromEntries(['understory', 'kelp-halls', 'seal-rocks'].map((id) => [id, { mid: [['sprouts', .5, .9, .55]] }])),
  boxes: BOXES,
});
