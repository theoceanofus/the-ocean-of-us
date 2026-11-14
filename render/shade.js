// Shading drawn into the bodies (spec 2026-11-08-ocean-creature-look): see-through fins, darker far-side parts and
// glassy jellies. Used everywhere, and the whole look when the light pass is off.

// Fins and flukes: darker and solid at the root, lighter and see-through at the tip.
export function finFill(c, P, col, x0, y0, x1, y1) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, P(col, -0.25, 0.95));
  g.addColorStop(1, P(col, 0.25, 0.55));
  return g;
}

// Fins and limbs on the far side of the body sit in its shadow.
export const FAR = -0.22;
export const farPalette = (P) => (col, l = 0, a) => P(col, l + FAR, a);

// Jellyfish bells and other see-through bodies: a translucent fill, a soft glow from inside and a bright rim.
export function glassBody(c, P, shape, col) {
  c.fillStyle = P(col, 0.1, 0.45); c.fill(shape);
  c.save(); c.clip(shape);
  const g = c.createRadialGradient(0, -6, 2, 0, -2, 46);
  g.addColorStop(0, P(col, 0.45, 0.5)); g.addColorStop(1, P(col, 0.45, 0));
  c.fillStyle = g; c.fillRect(-90, -90, 180, 180);
  c.restore();
  c.strokeStyle = P(col, 0.35, 0.7); c.lineWidth = 1.1; c.stroke(shape);
}
