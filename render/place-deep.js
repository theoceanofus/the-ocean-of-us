// The Deep (spec 2026-11-08-ocean-environment): canyon walls, a whale's bones, smoking vents and living light.
import { registerKit } from './set-pieces.js';
import { rock, ribs, tubeworms, chimney, stoneBridge, stoneBridgeFine, submarine, lightCurtain, glowCloud, seaWhips } from './place-art.js';

const scaled = (list, k, spread = 1) => list.map(([p, x, y, s, f]) => [p, .5 + (x - .5) * spread, y, s * k, f]);
const FAR = [['wallB', .02, .76, .85], ['wallB', .98, .76, .9, true]];
const BACK = [['wallA', -.18, .9, 1.05], ['wallA', 1.18, .9, 1.1, true]];
const FRAME = [['wallA', -.3, 1.06, 1.15], ['wallA', 1.3, 1.06, 1.15, true], ['low', .22, 1.05, .78], ['low', .82, 1.05, .78, true], [['tube', 'tube2'], .77, .965, .36], [['tube', 'tube2'], .17, .96, .36]];
// A vent keeps smoking: a few soft puffs rising from its top.
function smoke(g, t, S, phase) {
  for (let i = 0; i < 5; i++) {
    const a = ((t * 0.18 + i / 5 + phase) % 1), y = -S * (0.72 + a * 0.5), r = S * (0.04 + a * 0.12);
    const c = g.createRadialGradient?.(0, y, 0, 0, y, r);
    if (!c) return;
    c.addColorStop(0, `rgba(150,160,170,${0.35 * (1 - a)})`); c.addColorStop(1, 'rgba(150,160,170,0)');
    g.fillStyle = c; g.fillRect(-r, y - r, r * 2, r * 2);
  }
}

// Where each drawing sits on its square, so the live site keeps it cropped. From `node tools/place-boxes.mjs`; run it after changing a piece.
const BOXES = { wallA: [-492, -884, 492, 8], wallB: [-492, -768, 492, 8], low: [-480, -416, 480, 8], whips: [-376, -596, 468, 12], tube: [-368, -648, 316, 16], tube2: [-268, -668, 236, 16], ribs: [-512, -592, 512, 20], vent: [-220, -768, 224, 8], bridge: [-500, -580, 500, -300], sub: [-492, -492, 472, -16], curtain: [-468, -988, 472, -108], cloud: [-380, -780, 380, -20], veil: [-480, -984, 468, -116] };

registerKit('deep', {
  pieces: {
    wallA: { h: 180, unlit: true, draw: (g) => rock(g, 2, 490, 800, '#101a24', false), live: (g) => rock(g, 2, 490, 800, '#101a24', false, true) }, wallB: { h: 180, unlit: true, draw: (g) => rock(g, 21, 490, 700, '#0e1720', false), live: (g) => rock(g, 21, 490, 700, '#0e1720', false, true) }, low: { h: 140, unlit: true, draw: (g) => rock(g, 11, 480, 380, '#141d28', false), live: (g) => rock(g, 11, 480, 380, '#141d28', false, true) },
    whips: { h: 60, sway: true, unlit: true, draw: (g) => seaWhips(g, 9) },
    tube: { h: 60, sway: true, draw: (g) => tubeworms(g, 4) }, tube2: { h: 60, sway: true, draw: (g) => tubeworms(g, 14, 9) }, ribs: { h: 70, draw: (g) => ribs(g, 3, 11, 460) },
    vent: { h: 130, draw: (g) => chimney(g, 6), over: smoke },
    bridge: { h: 200, draw: (g) => stoneBridge(g, 8), live: (g) => stoneBridgeFine(g, 8) }, sub: { h: 170, draw: (g) => submarine(g, 11) },
    curtain: { h: 40, unlit: true, sway: true, draw: (g) => lightCurtain(g, 5) }, cloud: { h: 40, unlit: true, side: 512, draw: (g) => glowCloud(g, 6) }, veil: { h: 40, unlit: true, sway: true, draw: (g) => lightCurtain(g, 12, '#c7a8ff') },
  },
  hoods: {
    glimmer: { far: FAR, mid: BACK, frame: scaled(FRAME.slice(0, 2), 1, 1.1), landmark: ['cloud', .5, .92, 1.2] },
    'angel-drift': { far: FAR, mid: BACK, frame: scaled(FRAME.slice(0, 2), 1, 1.1), landmark: ['veil', .5, .95, 1.05] },
    'jelly-canyon': { far: FAR, mid: BACK, frame: FRAME, landmark: ['curtain', .5, .92, .95] },
    narrows: { far: FAR, mid: BACK, frame: FRAME, landmark: ['bridge', .5, .96, 1.25] },
    'squid-hollow': { far: FAR, mid: BACK, frame: scaled(FRAME, .86), landmark: ['sub', .5, .99, .75] },
    'whale-fall': { far: scaled(FAR, .85), mid: scaled(BACK, .85), frame: [...scaled(FRAME, .85), ['vent', .84, .96, .5]], landmark: ['ribs', .47, .97, .85] },
  },
  more: Object.fromEntries(['jelly-canyon', 'narrows', 'squid-hollow', 'whale-fall'].map((id) => [id, { frame: [['whips', .52, 1.0, .42]] }])),
  boxes: BOXES,
});
