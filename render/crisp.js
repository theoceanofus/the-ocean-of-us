// Crisp parts (spec 2026-11-08-ocean-creature-look): eyes, teeth, whiskers, antennae, tentacles, thin fin tips and
// glowing parts would blur or dull under the light pass. While the light pass draws a creature (withCrisp), these go
// to a layer drawn on top of the lit picture, with the creature's own transform. Otherwise they draw in place.
let target = null;

export function crisp(c, fn) {
  if (!target || target === c || !c.getTransform) return fn(c);
  target.save();
  target.setTransform(c.getTransform());
  target.globalAlpha = c.globalAlpha;
  try { return fn(target); } finally { target.restore(); }
}

export function withCrisp(layer, fn) {
  const prev = target;
  target = layer;
  try { return fn(); } finally { target = prev; }
}
