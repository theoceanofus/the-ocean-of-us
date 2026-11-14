// A flick: a finger lifted while still moving leaves the view carrying on, slowing to a stop, the way a page does on a phone.
// Speeds are CSS pixels a second, signed the way the finger went. Kept apart from the page so that it can be tested.
export const FLICK = {
  looksBack: 100,  // milliseconds of the finger's last movement the speed is read from
  heldStill: 50,   // a finger that stopped this many milliseconds before lifting was placing the view, not flicking it
  shortest: 8,     // less movement time than this can't give a speed worth trusting
  from: 240,       // slower than this the view stays where the finger left it
  most: 3000,      // however hard the flick, about a screen and a half at most
  slowing: 3.2,    // how fast it dies away, per second
  stop: 16,        // slower than this it has stopped
};

// moves is [{ t, x }] from the drag, oldest first, t in milliseconds. Returns the speed to carry on at, 0 for none.
export function flickSpeed(moves, liftedAt) {
  const last = moves[moves.length - 1];
  if (!last || liftedAt - last.t > FLICK.heldStill) return 0;
  const first = moves.find((m) => last.t - m.t <= FLICK.looksBack), ms = last.t - first.t;
  if (ms < FLICK.shortest) return 0;
  const speed = ((last.x - first.x) / ms) * 1000;
  return Math.abs(speed) < FLICK.from ? 0 : Math.sign(speed) * Math.min(FLICK.most, Math.abs(speed));
}

// The speed `seconds` later; 0 once it has died away.
export function slowed(speed, seconds) {
  const next = speed * Math.exp(-FLICK.slowing * seconds);
  return Math.abs(next) < FLICK.stop ? 0 : next;
}
