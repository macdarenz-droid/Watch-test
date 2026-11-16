/**
 * US Navy circumference estimate. An estimate, not a measurement. These are the metric (cm)
 * constants of the Hodgdon–Beckett equations, so the inputs stay in cm (BR-01: they were
 * converted to inches first, which gave nonsense).
 */
export function navyBodyFat(input: { sex: 'male' | 'female'; heightCm: number; neckCm: number; waistCm: number; hipCm?: number }): number | null {
  const h = input.heightCm, n = input.neckCm, w = input.waistCm;
  if (![h, n, w].every(v => Number.isFinite(v) && v > 0)) return null;
  let pct: number;
  if (input.sex === 'male') {
    if (w - n <= 0) return null;
    pct = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
  } else {
    const hip = input.hipCm ?? 0;
    if (!(hip > 0) || w + hip - n <= 0) return null;
    pct = 495 / (1.29579 - 0.35004 * Math.log10(w + hip - n) + 0.221 * Math.log10(h)) - 450;
  }
  if (!Number.isFinite(pct) || pct < 2 || pct > 70) return null;
  return Math.round(pct * 10) / 10;
}
