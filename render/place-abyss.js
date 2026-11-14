// The Abyss of Legends (spec 2026-11-08-ocean-environment): a lost sunken city of giant broken columns, stone gateways and ancient bones.
import { registerKit } from './set-pieces.js';
import { column, stoneWall, ribs, rock, gateway, steps, statue, fossilCabinet, crack, stoneRubble, gateGlyphs, atlantis, atlantisLights } from './place-art.js';

const scaled = (list, k, spread = 1) => list.map(([p, x, y, s, f]) => [p, .5 + (x - .5) * spread, y, s * k, f]);
const FAR = [['wall', .5, .74, .84], ['colB', .08, .72, .96], ['colB', .92, .72, .96], ['colC', .25, .72, .86], ['colA', .75, .72, .86]];
const BACK = [['colB', -.02, .86, 1.4], ['colC', 1.02, .86, 1.4], ['colA', .3, .8, .78]];
const FRAME = [[['colA', 'colC'], -.1, 1.05, 1.75], ['colB', 1.1, 1.05, 1.75], ['low', .18, 1.05, .78], ['low', .86, 1.05, .78, true], ['bones', .3, 1.0, .72], ['crack', .55, .995, .9]];

// Where each drawing sits on its square, so the live site keeps it cropped. From `node tools/place-boxes.mjs`; run it after changing a piece.
const BOXES = { colA: [-120, -836, 120, 16], colB: [-112, -960, 112, 16], colC: [-120, -604, 120, 16], rubble: [-508, -148, 512, 20], wall: [-472, -832, 472, 8], low: [-480, -396, 480, 8], bones: [-512, -540, 512, 20], gate: [-440, -992, 440, 16], steps: [-496, -704, 492, 8], statue: [-472, -980, 420, 8], cabinet: [-340, -800, 340, 8], crack: [-484, -528, 496, 36], atlantis: [-512, -892, 512, 20] };

registerKit('abyss', {
  pieces: {
    colA: { h: 90, draw: (g) => column(g, 4, 900, 92, '#464157'), live: (g) => column(g, 4, 900, 92, '#464157', true, true) }, colB: { h: 90, draw: (g) => column(g, 11, 960, 84, '#454056', false), live: (g) => column(g, 11, 960, 84, '#454056', false, true) }, colC: { h: 90, draw: (g) => column(g, 19, 900, 92, '#464157'), live: (g) => column(g, 19, 900, 92, '#464157', true, true) },
    rubble: { h: 50, draw: (g) => stoneRubble(g, 6) },
    wall: { h: 260, draw: (g) => stoneWall(g, 3) }, low: { h: 140, draw: (g) => rock(g, 11, 480, 360, '#27223a', false) }, bones: { h: 70, draw: (g) => ribs(g, 8, 9, 420, '#a39a8a') },
    gate: { h: 200, draw: (g) => gateway(g, 5), live: (g) => gateway(g, 5, undefined, true), detail: (g) => gateGlyphs(g, 5) }, steps: { h: 120, draw: (g) => steps(g, 7) }, statue: { h: 340, draw: (g) => statue(g, 9) }, cabinet: { h: 200, draw: (g) => fossilCabinet(g, 12) },
    crack: { h: 40, unlit: true, draw: (g) => crack(g, 3) },
    // Atlantis: the residents' best idea (2026-11-10). Built into the Sunken City once the saved ocean holds it (state.additions).
    atlantis: { h: 400, draw: (g) => atlantis(g, 7), over: atlantisLights },
  },
  hoods: {
    curiosities: { far: scaled(FAR, 1.15), mid: scaled(BACK, 1.1), frame: scaled(FRAME.slice(2), 1.05, 1.1), landmark: ['cabinet', .5, .98, .82] },
    'old-steps': { far: FAR, mid: BACK, frame: FRAME, landmark: ['steps', .5, 1.03, .9] },
    'sunken-city': { far: FAR, mid: BACK, frame: FRAME, landmark: ['gate', .5, .93, 1.05] },
    'titans-gate': { far: scaled(FAR, .82), mid: scaled(BACK, .85), frame: scaled(FRAME, .82), landmark: ['statue', .5, 1.04, 1.0] },
  },
  more: Object.fromEntries(['curiosities', 'old-steps', 'sunken-city', 'titans-gate'].map((id) => [id, { frame: [['rubble', .14, .985, .26], ['rubble', .86, .985, .26, true]] }])),
  // Pieces the residents asked for, each standing in its neighbourhood's landmark clearing in place of the landmark (set-pieces.js, composeTile).
  // Atlantis takes the whole floor of its clearing, so the bones and the glowing crack step aside there.
  built: { atlantis: { row: ['atlantis', .5, .985, 1.12], without: ['bones', 'crack'] } },
  boxes: BOXES,
});
