// HT4b-A5 C19 bad fixture M2: "…? Call 999." in RED_FLAG_KNEE.now.
type Box = { name: string; now: string; doctor: string };
export const mutate = <T extends { RED_FLAG_KNEE: Box }>(shared: T) => ({
  ...shared,
  RED_FLAG_KNEE: { ...shared.RED_FLAG_KNEE, now: 'Knee locked or giving way? Call 999.' },
});
