// GENERATED, do not edit. Written by tools/plates/generate.mjs (tools/plates/gen/content.mjs, tools/plates/gen/plates.mjs). inputsSha256=d5e987a440c22961f3d982cf45309a41f98e7f34809d725f1f8ac95a3404991c
// The only How-to module in the main bundle (plan 2.9: <= 2,048 B, no runtime imports).
export const HOWTO_IDS = [
  "lib_dumbbell_lateral_raise",
  "lib_barbell_back_squat",
  "lib_pull_up",
  "lib_hanging_leg_raise",
  "lib_lat_pulldown",
  "lib_seated_cable_row",
  "lib_leg_press",
  "lib_machine_chest_press",
] as const;
export type HowToId = (typeof HOWTO_IDS)[number];
export const HOWTO_LABEL = "How to do it";
export function hasHowTo(id: string): id is HowToId {
  return (HOWTO_IDS as readonly string[]).includes(id);
}
export const HOWTO_HINTS: Partial<Record<HowToId, string>> = {
  "lib_machine_chest_press": "Heel of palm, wrist straight.",
};
