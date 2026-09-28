
// Shared deterministic orbital choreography.
// Both canvases use the same flight path.
//
// delay is optional and measured in seconds.
// Use delay = 5 for the background mannequin.
// Leave delay = 0 for the live camera feed.

export function getOrbitPose(t, delay = 0) {
  const phase =
    Math.max(0, t - delay) * 0.34 +
    Math.PI / 2;

  const x = 65 * Math.sin(phase);
  const y = 5 * Math.sin(phase * 2 - 0.4);

  // Approximately one in seven centre crossings
  // produces a close fly-by.
  const crossing = Math.floor(
    phase / Math.PI + 0.5
  );

  const rarePass =
    ((crossing % 7) + 7) % 7 === 3;

  const proximity = rarePass
    ? Math.exp(
        -Math.pow(
          Math.sin(phase) / 0.29,
          2
        )
      )
    : 0;

  const z = -34 + 28 * proximity;

  const dx =
    65 * 0.34 * Math.cos(phase);

  const dy =
    5 * 0.68 *
    Math.cos(phase * 2 - 0.4);

  const dz = rarePass
    ? 28 *
      proximity *
      (
        -2 *
        Math.sin(phase) *
        Math.cos(phase) *
        0.34 /
        (0.29 * 0.29)
      )
    : 0;

  return {
    x,
    y,
    z,
    dx,
    dy,
    dz,
    burst: Math.abs(Math.cos(phase)) < 0.35,
    proximity,
  };
}
