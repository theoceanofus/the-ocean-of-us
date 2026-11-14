// How each kind of animal moves its body while it swims. One row per family (and per original species), owner-agreed 2026-11-08.
//   k: 'fish'  a side-to-side wave. The camera is side-on and a little above, so it shows as the tail narrowing and a small rise and fall.
//      'fluke' up-and-down flexing that grows towards the tail (whales, dolphins, seals).
//      'sway'  a gentle flex along the spine, head steady (paddling animals, monsters, soft crawlers).  'upright' the same, down a body that hangs upright.
//      'wave'  a travelling wave set by the drawing (eels, serpents).  'bell' a jellyfish bell pulsing.  'jet' a mantle squeezing.
//      'own'   the drawing moves itself (the nine originals, rays).  'bob' rises and falls in one piece.  'still' crawlers and animals fixed to the seabed.
//   a: how far the body moves, as a share of its length.  w: how much of a wave fits along the body.  p: how close to the tail the bend sits.
//   rate: beats compared with a fish of the same length.  back: travels mantle first.  jet: surges with each squeeze.  rise: how far it bobs, as a share of length.
//   pulse: the timing of a one-way pulse, for animals whose bell or mantle visibly squeezes.
//   rigid: a hard shell, plates or rock: one piece that does not bend.  Every other animal must bend (test/motion.browser.test.mjs).
//   fixed: stays where it is.  noTurn: looks the same from every side, so it never turns.
import { COMMUNITY_SPECIES } from '../core/community-species.js';

const fish = (a, w, more) => ({ k: 'fish', a, w, ...more });
const fluke = (a, w, p, more) => ({ k: 'fluke', a, w, p, ...more });
const own = (more) => ({ k: 'own', ...more });
const sway = (a, w, p, more) => ({ k: 'sway', a, w, p, ...more });
const paddle = (more) => sway(0.02, 3, 1.2, { rise: 0.012, ...more });
const upright = (a, w, p, more) => ({ k: 'upright', a, w, p, ...more });
const wave = (more) => ({ k: 'wave', ...more });
const still = (rate, more) => ({ k: 'still', rate, ...more });
// One-way pulses: a quick squeeze, a slower relax, then a rest. A moon jelly squeezes in about 0.4 s and relaxes in about 1.4 s.
// squeeze and relax are shares of one pulse; thrust is the share of it during which the animal is being pushed along.
const PULSE = { bell: { squeeze: 0.1, relax: 0.34, thrust: 0.35 }, jet: { squeeze: 0.25, relax: 0.45, thrust: 0.55 } };
const waves = (n) => n * Math.PI * 2; // how much of a wave fits along the body
const squid = (rate = 0.5) => ({ k: 'jet', a: 0.14, rate, back: true, jet: true, pulse: PULSE.jet });

export const MOTION = {
  // The nine original animals draw their own bending.
  reef_fish: own(), dolphin: own({ rate: 1.05 }), blue_whale: own({ rate: 0.9 }), megalodon: own({ rate: 0.85 }), leviathan: own({ rate: 0.85 }),
  jellyfish: own({ rate: 0.2, noTurn: true, bell: true, pulse: PULSE.bell }), turtle: own({ rate: 0.38, rigid: true }), stingray: own({ rate: 0.5 }), starfish: still(0.2, { noTurn: true, rigid: true }),
  // Fish and sharks.
  // Measured waves per body length: eel 0.58-0.75, trout and mackerel about 1.0, tuna 1.17. Sharks are set between eel and trout.
  shark: fish(0.05, waves(0.9)), hammerhead: fish(0.05, waves(0.9)), goblin: fish(0.05, waves(0.9)), skeleton: fish(0.05, waves(0.9)), helicoprion: fish(0.05, waves(0.9)), isonade: fish(0.05, waves(0.9)),
  placoderm: fish(0.045, 4.4), leedsichthys: fish(0.045, 4.2), sacabambaspis: fish(0.07, 5.2), tully: fish(0.06, 5),
  fish: fish(0.075, waves(1)), clownfish: fish(0.075, waves(1)), trigger: fish(0.06, waves(1)), flying: fish(0.06, waves(1)), cory: fish(0.06, waves(1)), puffer: fish(0.04, waves(1)), blob: fish(0.05, waves(1)),
  angler: fish(0.05, waves(1)), loosejaw: fish(0.05, waves(1)), stonefish: fish(0.03, waves(1)), billfish: fish(0.035, waves(1.17)), bluefin_tuna: fish(0.075, waves(1.17)),
  // Reptiles with side-to-side tails.
  ichthyosaur: fish(0.045, 4.4), mosasaur: fish(0.05, 4.2), crocodile: fish(0.04, 4.2), iguana: fish(0.05, 4.6), axolotl: fish(0.05, 4.8),
  // Whales, seals and others that flex up and down.
  kyogre: fluke(0.05, 2.6, 2.4), pikachu: paddle(), spongebob: paddle(), patrick: paddle(), mahoraga: paddle(), shuckle: still(0.4, { rigid: true }), greninja: paddle(),
  ceadeus: fluke(0.045, 2.6, 2.4, { rate: 0.6 }), ice_worm: wave({ rate: 0.6 }),
  reaper: wave({ rate: 0.6 }), gargantuan: wave({ rate: 0.45 }), tulkun: fluke(0.05, 2.6, 2.4, { rate: 0.7 }),
  cowfish: fish(0.012, waves(0.4), { rigid: true, rate: 0.8 }), nematode: wave({ rate: 1.2 }),
  lamprey: wave(), pteropod: { k: 'bob', rate: 0.6, rise: 0.02 }, cockatoo: paddle(), whipray: own(),
  telescope: fish(0.05, waves(0.9)), lookdown: fish(0.03, waves(0.6)),
  swallower: fish(0.05, waves(0.9)), livyatan: fluke(0.05, 2.6, 2.4), butterfly: fish(0.03, waves(0.6)), timingila: fish(0.04, waves(0.8), { rate: 0.6 }), goby: fish(0.04, waves(0.8)),
  pyrosome: sway(0.015, 2, 1, { rate: 0.4 }), phoenix: paddle(),
  bichir: fish(0.05, waves(1)), phronima: sway(0.015, 2, 1, { rate: 0.4 }), ctenophore: sway(0.012, 2, 1, { rate: 0.3 }), zekrom: paddle(),
  umibozu: sway(0.012, 2, 1, { rate: 0.3 }), basilosaurus: fish(0.05, waves(1.2)), reefback: fluke(0.03, 2.4, 2, { rate: 0.5 }), squatina: fish(0.04, waves(0.8)), handfish: fish(0.03, 4.6),
  cetacean: fluke(0.05, 2.6, 2.4), narwhal: fluke(0.05, 2.6, 2.4), seal: fluke(0.05, 3, 1.7), pinniped: fluke(0.05, 3, 1.7), sirenian: fluke(0.045, 2.6, 2.2),
  selkie: fluke(0.05, 3, 1.7), otter: fluke(0.05, 3, 1.7), ambulocetus: fluke(0.05, 3, 1.8), mermaid: fluke(0.07, 3, 1.7), plesio: fluke(0.04, 2.8, 1.8),
  shrimp: fluke(0.04, 3.4, 2), crustacean: fluke(0.035, 3.2, 2),
  // Jellyfish, squid and octopus.
  tiny_jelly: { k: 'bell', a: 0.15, rate: 0.2, noTurn: true, bell: true, pulse: PULSE.bell }, man_o_war: upright(0.02, 2.4, 1.3, { rate: 0.35 }),
  cephalopod: squid(), colossal: squid(), humboldt: squid(), blue_ringed: squid(), kraken: squid(0.4), nautilus: own({ rate: 0.5, back: true, jet: true, rigid: true }), dumbo: upright(0.02, 2.4, 1.3, { rate: 0.5 }),
  // Long bodies whose wave is set by the drawing itself (waveBody in community-creatures.js).
  eel: wave({ rate: 0.7 }), electric: wave({ rate: 0.8 }), frilled: wave({ rate: 0.8 }), serpent: wave({ rate: 0.7 }), titanoboa: wave({ rate: 0.7 }), oarfish: wave({ rate: 0.6 }), siphonophore: wave({ rate: 0.35 }),
  // Wings and sails that make up most of the body.
  manta: own({ rate: 0.5 }),
  // Monsters and soft animals: the whole body sways from the neck back.
  blue_dragon: sway(0.03, 3, 1.3), sea_angel: sway(0.03, 3, 1.3), kaiju: sway(0.02, 3, 1.2), hydra: sway(0.02, 3, 1.2), bloop: sway(0.02, 3, 1.2), maja: sway(0.02, 3, 1.2), cthulhu: sway(0.02, 3, 1.2), water_spirit: sway(0.02, 3, 1.2),
  // Designs added on 2026-11-08.
  maw: sway(0.02, 3, 1.2), whiskered: fish(0.05, 4.8), mako: fish(0.05, 4.6), perch: fish(0.06, 5.2), coelacanth: fish(0.045, 4.6), dragonfish: fish(0.05, 5),
  scorpionfish: fish(0.03, 4.6), batfish: fish(0.03, 4.6), pistol: fluke(0.04, 3.4, 2), pliosaur: fluke(0.04, 2.8, 1.8), flapjack: upright(0.02, 2.4, 1.3, { rate: 0.35 }),
  snake: wave({ rate: 0.7 }), naga: wave({ rate: 0.7 }), hagfish: wave({ rate: 0.7 }), bobbit: wave({ rate: 0.5 }),
  arthropleura: wave({ rate: 0.5 }), anomalocaris: sway(0.03, 3, 1.3), diver: paddle(), macropod: paddle(),
  ungulate: paddle(), burrower: paddle(), gecko: paddle(), mosquito: paddle(), pterosaur: paddle(), seabird: paddle(), raptor: paddle(),
  // Designs added in the third pass on 2026-11-09. Carpet sharks swim with more of the body, like eels; the Greenland shark is the slowest shark known.
  sea_eater: sway(0.02, 3, 1.2), rayquaza: wave({ rate: 0.7 }), phytoplankton: sway(0.015, 2, 1, { rate: 0.3 }), bahamut: fish(0.045, waves(0.9), { rate: 0.6 }),
  aspidochelone: sway(0.015, 2, 1, { rate: 0.3 }), monkfish: fish(0.04, waves(1)),
  megamouth: fish(0.045, waves(0.9), { rate: 0.6 }), unicornfish: fish(0.04, waves(0.6)),
  basking: fish(0.045, waves(0.9)), carpet: fish(0.055, waves(0.8)), sleeper: fish(0.04, waves(0.9), { rate: 0.6 }), requiem: fish(0.05, waves(0.9)),
  vampire: squid(0.4), box_jelly: { k: 'bell', a: 0.12, rate: 0.3, noTurn: true, bell: true, pulse: PULSE.bell }, harp: fluke(0.05, 3, 1.7),
  gulper: wave({ rate: 0.7 }), bigfin: upright(0.02, 2.4, 1.3, { rate: 0.35 }), bowhead: fluke(0.05, 2.6, 2.4),
  hippocamp: fluke(0.05, 3, 1.8), bobtail: squid(), strawberry: squid(0.4),
  phantom_jelly: { k: 'bell', a: 0.1, rate: 0.2, noTurn: true, bell: true, pulse: PULSE.bell }, lantern: fish(0.05, waves(0.9)), blanket: squid(0.4), pilot: fluke(0.05, 2.6, 2.4), dugong: fluke(0.045, 2.6, 2.2), kiwi: paddle(), barreleye: fish(0.05, waves(1)),
  tripod: still(0.2, { rigid: true }), urchin: still(0.15, { noTurn: true, rigid: true }),
  // The eagle ray flaps like the manta. The garden eel stays in its burrow and sways by itself; the spider crab is a hard shell on stilts.
  eagle_ray: own({ rate: 0.5 }), ribbon: wave({ rate: 0.7 }), garden_eel: own({ rate: 0.5, fixed: true }), spider_crab: still(0.5, { rigid: true }), frog: paddle(), catfish: fish(0.06, waves(1)),
  // The Trench Titan bends itself.
  trench_titan: own(),
  // Animals that paddle or hang in the water: the spine flexes while the legs paddle.
  beast: paddle(), land: paddle(), mammal: paddle(), theropod: paddle(), sauropod: paddle(), avian: paddle(), bird: paddle(), insect: paddle(), chipmunk: paddle(), duck: paddle(), cat_mermaid: paddle(), platypus: paddle(),
  mata_mata: paddle({ rate: 0.5 }), penguin: fish(0.025, waves(0.5), { rate: 0.7 }), barn_owl: upright(0.04, 2.4, 1.2, { rise: 0.012 }), seahorse: upright(0.03, 2.8, 1.3, { rate: 1.1, rise: 0.012 }), leafy: upright(0.03, 2.8, 1.3, { rise: 0.012 }),
  // Soft crawlers ripple; hard shells, plates and rocks stay one rigid piece.
  sea_pig: sway(0.03, 4, 1, { rate: 0.4 }), tardigrade: sway(0.03, 4, 1, { rate: 0.4 }), slug: sway(0.03, 4, 1, { rate: 0.3 }), cucumber: sway(0.035, 4, 1, { rate: 0.25 }), hallucigenia: sway(0.03, 4, 1, { rate: 0.5 }),
  crab: still(0.8, { rigid: true }), horseshoe: still(0.5, { rigid: true }), isopod: still(0.5, { rigid: true }), snail: still(0.25, { rigid: true }), fossil: still(0.2, { rigid: true }),
  land_turtle: { k: 'bob', rate: 0.38, rise: 0.012, rigid: true }, charybdis: own({ rigid: true }), angel: own({ rigid: true }),
  anemone: still(0.25, { fixed: true, noTurn: true, rigid: true }), sea_squirt: still(0.25, { fixed: true, noTurn: true, rigid: true }), sponge: still(0.1, { fixed: true, noTurn: true, rigid: true }), pet_rock: still(0.1, { fixed: true, noTurn: true, rigid: true }),
};

const familyKey = (species) => (MOTION[species] ? species : COMMUNITY_SPECIES[species]?.family || species);
const NOT_LISTED = own();
export const motionOf = (species) => MOTION[familyKey(species)] || NOT_LISTED;
export const isListed = (species) => !!MOTION[familyKey(species)];

// The drawn point after the body has flexed, written to flex.x and flex.y (no new object per point, for speed on phones).
export const flex = { x: 0, y: 0, map: null };
export function setFlex(map) { flex.map = map; }
const BENDS = ['fish', 'fluke', 'sway', 'upright', 'wave', 'bell', 'jet'];

// How this frame's body bent, kept after the drawing so requested looks (render/extras.js) can follow it.
let followed = null;
export const setFollow = (map) => { followed = map; };
export const takeFollow = () => { const m = followed; followed = null; return m; };
// For the drawings that bend themselves: the same bend as a map of points.
export const followBend = (bend, k = 1) => setFollow((x, y) => { flex.x = x; flex.y = y + bend(x) * k; });

const pulsePosition = (phi) => { const u = phi / (Math.PI * 2); return u - Math.floor(u); };
const ease = (t) => t * t * (3 - 2 * t);
// How squeezed the bell or mantle is: 0 at rest, 1 fully squeezed.
export function pulseAt(phi, kind) {
  const { squeeze, relax } = PULSE[kind], u = pulsePosition(phi);
  if (u < squeeze) return ease(u / squeeze);
  return u < squeeze + relax ? ease(1 - (u - squeeze) / relax) : 0;
}
// How far ahead of a steady pace the animal is at this point in the pulse: pushed forward early, then falling back while it coasts.
export function surgeAt(phi, kind) {
  const T = PULSE[kind].thrust, u = pulsePosition(phi);
  return (u < T ? u / T - Math.sin((2 * Math.PI * u) / T) / (2 * Math.PI) : 1) - u;
}

// The function that bends a resident's points this frame, or null when it doesn't bend (or when the pose is a still picture).
export function bodyMap(species, pose) {
  const M = motionOf(species);
  if (pose.effort === undefined || pose.walk || !BENDS.includes(M.k)) return null; // a walker is carried steady on its legs
  if (M.k === 'wave') return (x, y) => { flex.x = x; flex.y = y; };
  const S = COMMUNITY_SPECIES[species]?.nativeLength || 120, head = S * 0.46, phi = pose.swim, A = M.a * pose.effort, w = M.w;
  const along = (x) => Math.min(1.25, Math.max(0, (head - x) / S));
  if (M.k === 'bell') {
    const u = pulseAt(phi, 'bell');
    return (x, y) => { const f = y < 8 ? 1 : Math.max(0, 1 - (y - 8) / 70); flex.x = x * (1 - M.a * u * f); flex.y = y < 0 ? y * (1 + M.a * 0.7 * u) : y - (1 - f) * u * 6; };
  }
  if (M.k === 'jet') {
    const u = pulseAt(phi, 'jet');
    return (x, y) => { const g = x < -12 ? Math.min(1, (-12 - x) / 30) : 0; flex.x = x; flex.y = y * (1 - M.a * u * g); };
  }
  if (M.k === 'upright') {
    const p = M.p, top = -S * 0.45;
    return (x, y) => { const s = Math.min(1.25, Math.max(0, (y - top) / S)); flex.x = x + S * A * Math.pow(s, p) * Math.sin(phi - w * s); flex.y = y; };
  }
  if (M.k === 'fluke' || M.k === 'sway') {
    const p = M.p;
    return (x, y) => { const s = along(x); flex.x = x; flex.y = y + S * A * Math.pow(s, p) * Math.sin(phi - w * s); };
  }
  return (x, y) => {
    const s = along(x), q = phi - w * s, sn = Math.sin(q), cs = Math.cos(q), env = 0.06 + 0.34 * s + 0.6 * s * s, g = A * ((0.34 + 1.2 * s) * sn - w * env * cs);
    flex.x = x + S * s * g * g * 0.45;
    flex.y = y + 0.42 * S * A * env * sn;
  };
}

// How far a paddling or floating animal rises and falls this frame, in drawing units.
export function bobHeight(species, pose) {
  const M = motionOf(species);
  if (!M.rise || pose.effort === undefined || pose.walk) return 0;
  return (COMMUNITY_SPECIES[species]?.nativeLength || 120) * M.rise * pose.effort * Math.sin(2 * pose.swim);
}

// Path strings turned into numbers once. 0 move, 1 line, 2 quadratic, 3 cubic, 4 close, all in absolute coordinates.
const parsed = new Map();
export function parsePath(d) {
  let out = parsed.get(d);
  if (out !== undefined) return out;
  out = [];
  const T = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let i = 0, x = 0, y = 0, sx = 0, sy = 0, cmd = '';
  const num = () => +T[i++];
  while (i < T.length) {
    if (/[a-zA-Z]/.test(T[i])) cmd = T[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), dx = rel ? x : 0, dy = rel ? y : 0;
    if (C === 'M') { x = num() + dx; y = num() + dy; sx = x; sy = y; out.push(0, x, y); cmd = rel ? 'l' : 'L'; }
    else if (C === 'L') { x = num() + dx; y = num() + dy; out.push(1, x, y); }
    else if (C === 'H') { x = num() + dx; out.push(1, x, y); }
    else if (C === 'V') { y = num() + dy; out.push(1, x, y); }
    else if (C === 'Q') { const a = num() + dx, b = num() + dy; x = num() + dx; y = num() + dy; out.push(2, a, b, x, y); }
    else if (C === 'C') { const a = num() + dx, b = num() + dy, e = num() + dx, f = num() + dy; x = num() + dx; y = num() + dy; out.push(3, a, b, e, f, x, y); }
    else if (C === 'Z') { out.push(4); x = sx; y = sy; }
    else { out = null; break; }
  }
  // Strings that change every frame have long decimals; keeping them would only fill memory.
  if (!/\.\d{4}/.test(d)) { if (parsed.size > 20000) parsed.clear(); parsed.set(d, out); }
  return out;
}

// A Path2D of the string with every point bent. Falls back to the plain path for any command it doesn't know.
export function flexedPath(d) {
  const o = parsePath(d);
  if (!o) return new Path2D(d);
  const p = new Path2D(), m = flex.map;
  let i = 0;
  while (i < o.length) {
    const k = o[i++];
    if (k === 4) { p.closePath(); continue; }
    if (k < 2) { m(o[i], o[i + 1]); i += 2; if (k) p.lineTo(flex.x, flex.y); else p.moveTo(flex.x, flex.y); }
    else if (k === 2) { m(o[i], o[i + 1]); const a = flex.x, b = flex.y; m(o[i + 2], o[i + 3]); i += 4; p.quadraticCurveTo(a, b, flex.x, flex.y); }
    else { m(o[i], o[i + 1]); const a = flex.x, b = flex.y; m(o[i + 2], o[i + 3]); const e = flex.x, f = flex.y; m(o[i + 4], o[i + 5]); i += 6; p.bezierCurveTo(a, b, e, f, flex.x, flex.y); }
  }
  return p;
}
