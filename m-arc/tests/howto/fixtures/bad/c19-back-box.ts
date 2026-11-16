// HT4b-A5 C19 back-box fixtures (D-LR23-1). The pass fixture is the approved back box, word for word: "Get emergency
// help now." names no number, service or link, so it passes. M3 swaps that line for "Go to A&E.", which must fail.
const BACK = {
  name: 'Back pain',
  now: 'Numb or weak in both legs, numb around your genitals, or bladder or bowel changes? Get emergency help now.',
  doctor: 'No better in a few weeks? See a doctor.',
};
export const pass = <T extends object>(shared: T) => ({ ...shared, RED_FLAG_BACK: BACK });
export const m3 = <T extends object>(shared: T) => ({
  ...shared,
  RED_FLAG_BACK: { ...BACK, now: 'Numb or weak in both legs, numb around your genitals, or bladder or bowel changes? Go to A&E.' },
});
