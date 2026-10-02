/**
 * LT-5 (docs/LOAD-AWARE-TARGETS.md §5): sourced strength ratios between equipment groups performing
 * the same movement pattern, used to carry a strength estimate over to a substitute exercise. Kept
 * small on purpose: only pairs backed by a real, checkable source. `ratio` is the substitute's
 * per-implement load as a fraction of the replaced lift's strength estimate (both in canonical kg).
 */
export interface SubstitutionRatio {
  /** Exercise.pattern both lifts share. */
  pattern: string;
  /** equipmentGroup() of the replaced lift. */
  fromGroup: string;
  /** equipmentGroup() of the substitute. */
  toGroup: string;
  ratio: number;
  /** Citation, with any assumption made to get from the study's number to this ratio. */
  source: string;
  url: string;
}

export const SUBSTITUTION_RATIOS: SubstitutionRatio[] = [
  {
    pattern: 'horizontal_push',
    fromGroup: 'Barbell',
    toGroup: 'Dumbbells',
    ratio: 0.415,
    source:
      'Saeterbakken, van den Tillaar & Fimland (2011), J Sports Sci 29(5):533-538, n=12: two-dumbbell bench press 1RM (combined) was 17% below barbell bench press 1RM (P≤.001). Halved here for a per-hand load; the paper does not itself report a per-hand split.',
    url: 'https://doi.org/10.1080/02640414.2010.543916',
  },
  {
    pattern: 'vertical_push',
    fromGroup: 'Barbell',
    toGroup: 'Dumbbells',
    ratio: 0.467,
    source:
      'Saeterbakken & Fimland (2013), J Strength Cond Res 27(7):1824-1831, n=15: standing barbell overhead press 1RM was 7% above standing two-dumbbell overhead press 1RM (combined). Halved here for a per-hand load; the paper does not itself report a per-hand split.',
    url: 'https://doi.org/10.1519/JSC.0b013e318276b873',
  },
];

/**
 * The ratio for one pattern going from `fromGroup` to `toGroup` (equipmentGroup() values), or its
 * inverse when the table only holds the opposite direction. Null with no sourced pair for this move.
 */
export function substitutionRatio(pattern: string, fromGroup: string, toGroup: string): SubstitutionRatio | null {
  if (fromGroup === toGroup) return null;
  const direct = SUBSTITUTION_RATIOS.find(r => r.pattern === pattern && r.fromGroup === fromGroup && r.toGroup === toGroup);
  if (direct) return direct;
  const inverse = SUBSTITUTION_RATIOS.find(r => r.pattern === pattern && r.fromGroup === toGroup && r.toGroup === fromGroup);
  return inverse ? { ...inverse, fromGroup, toGroup, ratio: 1 / inverse.ratio } : null;
}
