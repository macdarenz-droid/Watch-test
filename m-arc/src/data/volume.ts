/**
 * Weekly effective-set landmarks per training level (F3.2, plan 6.13/section 7).
 * Starting ranges only — RP revised its own landmarks substantially in 2023-24 —
 * kept here, not hardcoded in brain/volume.ts, so they can be edited or personalised later.
 */

/** [low, high] effective sets/week, indexed by trainingLevels()'s levelIndex (New..Advanced). Elite/Master reuse the Advanced band: the plan gives no landmarks past it. */
export const VOLUME_BANDS: Array<[number, number]> = [
  [4, 8], // New
  [6, 10], // Beginner
  [8, 14], // Developing
  [10, 18], // Established
  [12, 20], // Advanced
];

/** Per-muscle offset applied to both ends of the band: lower for lower back, higher for side delts and calves. */
export const VOLUME_OFFSET = {
  lower_back: -2,
  side_delts: 2,
  calves: 2,
} as const;
