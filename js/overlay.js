import { ringCentre } from './seek.js';

// A transparent canvas over the ocean for the things the renderer doesn't draw: bubbles from a tapped creature, food drifting down.
// projectFn(target, t) gives where a target is on this canvas: { x, y, s, px } or null. A target is a resident (px is its drawn radius)
// or a world point { x, y, z } (s is pixels per world unit). When nothing is showing, draw() costs nothing after one last clear.
export const FOOD_SECONDS = 6, FOOD_SINK = 8; // food sinks this many world units a second, for this long
const BUBBLE_SECONDS = 1.4;
const BUBBLES = 7;

export function createOverlay(canvas, projectFn) {
  const ctx = canvas.getContext('2d');
  let bursts = [], food = [], dirty = false;
  let hint = null;  // { res, k, offset }: the ring that narrows towards the creature being sought

  function addBubbles(res) {
    const parts = [];
    for (let i = 0; i < BUBBLES; i++) parts.push({ dx: (Math.random() - 0.5) * 1.2, delay: Math.random() * 0.3, size: 0.6 + Math.random() * 0.8, rise: 0.8 + Math.random() * 0.8, phase: Math.random() * 6.28 });
    bursts.push({ res, born: null, parts });
  }

  // k is the ring's size, 1 down to 0 (see seek.js); offset is the round's { dx, dy } that keeps the ring off the target's exact spot. null takes the ring away. The page sets it every frame while the hint shows.
  function setHint(res, k, offset = { dx: 0, dy: 0 }) { hint = res && k !== null ? { res, k, offset } : null; }

  function drawHint(t) {
    const at = projectFn(hint.res, t);
    if (!at) return;
    const smallest = Math.max(at.px * 1.35, 30), biggest = Math.max(smallest, Math.min(canvas.width, canvas.height) * 0.55);
    const r = smallest + (biggest - smallest) * hint.k;
    const centre = ringCentre(at.x, at.y, r, hint.offset);
    const shimmer = 0.5 + 0.5 * Math.sin(t * 5);
    ctx.lineWidth = Math.max(2, canvas.width * 0.008);
    for (let i = 0; i < 2; i++) { // a bright ring and a fainter one just outside it
      ctx.globalAlpha = (i ? 0.3 : 0.55) + 0.35 * shimmer * (i ? 0.5 : 1);
      ctx.beginPath(); ctx.arc(centre.x, centre.y, r * (1 + i * 0.1), 0, 6.283);
      ctx.strokeStyle = '#ffe9a8'; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function addFood(pos) { food.push({ pos: { ...pos }, born: null }); }

  function ring(x, y, r, alpha) {
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283);
    ctx.fillStyle = 'rgba(210,245,250,0.25)'; ctx.fill();
    ctx.lineWidth = Math.max(1, r * 0.2); ctx.strokeStyle = 'rgba(235,252,255,0.9)'; ctx.stroke();
  }

  function draw(t) {
    if (!bursts.length && !food.length && !hint) {
      if (dirty) { ctx.clearRect(0, 0, canvas.width, canvas.height); dirty = false; }
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dirty = true;
    bursts = bursts.filter((b) => {
      b.born ??= t;
      const age = t - b.born;
      if (age > BUBBLE_SECONDS + 0.3) return false;
      const at = projectFn(b.res, t);
      if (!at) return true;
      const reach = Math.max(at.px, 8);
      for (const p of b.parts) {
        const a = age - p.delay;
        if (a < 0 || a > BUBBLE_SECONDS) continue;
        const k = a / BUBBLE_SECONDS;
        const x = at.x + p.dx * reach + Math.sin(a * 4 + p.phase) * reach * 0.08;
        const y = at.y - reach * (0.1 + 1.1 * k * p.rise);
        ring(x, y, Math.min(14, Math.max(2.5, reach * 0.07 * p.size)), (1 - k) * 0.85);
      }
      return true;
    });
    food = food.filter((f) => {
      f.born ??= t;
      const age = t - f.born;
      if (age > FOOD_SECONDS) return false;
      const at = projectFn({ x: f.pos.x, y: Math.max(0, f.pos.y - age * FOOD_SINK), z: f.pos.z, slideZ: f.pos.slideZ }, t);
      if (at) {
        ctx.globalAlpha = Math.min(1, (FOOD_SECONDS - age) / 1.5);
        ctx.beginPath(); ctx.arc(at.x, at.y, Math.min(8, Math.max(2, (at.s || 1) * 1.5)), 0, 6.283);
        ctx.fillStyle = '#e8c777'; ctx.fill();
      }
      return true;
    });
    ctx.globalAlpha = 1;
    if (hint) drawHint(t);
  }

  return { addBubbles, addFood, setHint, draw, busy: () => bursts.length + food.length };
}
