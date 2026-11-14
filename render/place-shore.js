// The Shore (spec 2026-11-08-ocean-environment): bright shallows under the waves, with sunlit sand, old pier posts and seagrass.
import { registerKit } from './set-pieces.js';
import { piling, rock, driftwood, seagrass, rowingBoat, shells, dewdropLeaf, barnacleStone, mangroveRoots, oldPier, pilingDetail, sandLife, meadow } from './place-art.js';

const scaled = (list, k, spread = 1) => list.map(([p, x, y, s, f]) => [p, .5 + (x - .5) * spread, y, s * k, f]);
// The far and middle layers stand on the sand behind the back walking row (camera lowered 15 Nov 2026: horizon at .34, back row at .46).
const FAR = [['rockL', .15, .39, .5], ['rockL', .85, .39, .55, true], ['postB', .28, .40, .5], ['postB', .72, .40, .46]];
// Owner, 14 Nov 2026 ("fix the shore"): the posts were twice this size and hid the animals; the giant ones in front are gone.
const BACK = [['post', .04, .45, .62], ['postB', .17, .43, .55], ['rockT', 0, .46, .55], ['post', .96, .45, .6], ['rockT', 1, .46, .5, true]];
// In front, only low things: a rock taller than the sand rows' feet makes the animals behind it look as if they stand on it.
const FRAME = [['rockT', 1.06, 1.03, .3, true], ['rockL', .84, 1.03, .45, true], ['grass', .9, .86, .5], ['log', .3, .98, .7], ['grassB', .08, 1, .75], ['grass', .58, 1.02, .5], ['rockL', .0, 1.03, .45], ['shell', .55, .97, .55]];
const EDGE = [['grass', -.3, 1.08, .5], ['grassB', 1.3, 1.08, .5]];

// Where each drawing sits on its square, so the live site keeps it cropped. From `node tools/place-boxes.mjs`; run it after changing a piece.
const BOXES = { post: [-52, -988, 56, 16], postB: [-44, -988, 44, 12], rockT: [-480, -776, 480, 8], rockL: [-480, -440, 480, 8], log: [-432, -304, 428, 24], grass: [-336, -384, 264, 8], grassB: [-296, -300, 260, 8], shell: [-468, -120, 384, 16], life: [-472, -156, 456, 12], meadow: [-512, -184, 512, 4], boat: [-452, -244, 440, 32], leaf: [-472, -412, 472, 12], stone: [-472, -516, 472, 24], roots: [-468, -988, 452, 24], pier: [-492, -972, 452, 12], fallen: [-476, -396, 468, 32] };

registerKit('shore', {
  pieces: {
    post: { h: 90, draw: (g) => piling(g, 3), detail: (g) => pilingDetail(g, 3) }, postB: { h: 90, draw: (g) => piling(g, 9, 985, 36) },
    rockT: { h: 120, draw: (g) => rock(g, 2, 480, 700, '#6f6a5c') }, rockL: { h: 120, draw: (g) => rock(g, 11, 480, 400, '#736c5d') },
    log: { h: 160, draw: (g) => driftwood(g, 4) }, grass: { h: 60, sway: true, draw: (g) => seagrass(g, 5, 70, 360, '#6fa85a') }, grassB: { h: 60, sway: true, draw: (g) => seagrass(g, 15, 60, 280, '#8fb863') },
    shell: { h: 40, draw: (g) => shells(g, 6) }, life: { h: 40, draw: (g) => sandLife(g, 21) }, meadow: { h: 40, draw: (g) => meadow(g, 4) },
    boat: { h: 150, draw: (g) => rowingBoat(g, 7) }, leaf: { h: 120, draw: (g) => dewdropLeaf(g) }, stone: { h: 150, draw: (g) => barnacleStone(g, 8) }, roots: { h: 80, draw: (g) => mangroveRoots(g, 9) }, pier: { h: 90, draw: (g) => oldPier(g, 10) }, fallen: { h: 200, draw: (g) => { g.save(); g.scale(1.1, 1.3); driftwood(g, 12); g.restore(); } },
  },
  hoods: {
    dewdrop: { far: FAR, mid: BACK, frame: scaled(FRAME.slice(0, 6), 1.1, 1.1), landmark: ['leaf', .5, .96, .8] },
    'rock-pool': { far: FAR, mid: BACK, frame: scaled(FRAME, 1.1, 1.08), edge: EDGE, landmark: ['stone', .5, 1.04, .6] },
    'tide-pools': { far: FAR, mid: BACK, frame: FRAME, edge: EDGE, landmark: ['boat', .5, .96, .62] },
    'sand-flats': { far: FAR, mid: BACK, frame: FRAME, edge: EDGE, landmark: ['pier', .5, 1.0, .45] },
    'crocodile-point': { far: scaled(FAR, .9), mid: scaled(BACK, .9), frame: scaled(FRAME, .85), edge: EDGE, landmark: ['roots', .5, 1.0, 1.45] },
    'dinosaur-bluff': { far: scaled(FAR, .8), mid: scaled(BACK, .8), frame: scaled(FRAME, .72), edge: EDGE, landmark: ['fallen', .5, .97, .72] },
  },
  more: Object.fromEntries(['dewdrop', 'rock-pool', 'tide-pools', 'sand-flats', 'crocodile-point', 'dinosaur-bluff'].map((id) => [id, { far: [['meadow', .22, .40, .62], ['meadow', .78, .40, .68, true]], mid: [['meadow', .5, .46, .7]], frame: [['life', .46, .968, .5]] }])),
  boxes: BOXES,
});
