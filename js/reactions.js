// A creature's quick flip when it is tapped. The page hands adjust() to the renderer as `poseAdjust`, so Reels never see it.
export const FLIP_SECONDS = 0.8;

// The pose partway through a flip that began at startedAt. Outside the flip it is the pose itself, so a flip ends exactly where it started.
export function reactionPose(pose, startedAt, t) {
  const u = (t - startedAt) / FLIP_SECONDS;
  if (!(u > 0) || u >= 1) return pose;
  const eased = u * u * (3 - 2 * u);
  // Turns through head-on and back, and somersaults for the animals that tilt.
  return { ...pose, facing: pose.facing * Math.cos(2 * Math.PI * u), pitch: (pose.pitch || 0) + 2 * Math.PI * eased };
}

export function createReactions() {
  const started = new Map(); // resident id -> t the flip began
  return {
    start(res, t) { started.set(res.id, t); },
    // Called for every resident every frame, so with no flip going it is one size check.
    adjust(res, pose, t) {
      if (!started.size) return pose;
      const at = started.get(res.id);
      if (at === undefined) return pose;
      if (t - at >= FLIP_SECONDS) { started.delete(res.id); return pose; }
      return reactionPose(pose, at, t);
    },
    active: () => started.size,
  };
}
