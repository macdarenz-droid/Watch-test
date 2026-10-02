// HT4-A3 C1 bad fixture: a hand zoom's hand.wrong references a fault key not in handling.faults (Medium 8: the
// previous check here was dead code - checkZoomRef(..., undefined) can never fail).
import type { HowToContent, ZoomSpec } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  const zooms = good.zooms.map((z): ZoomSpec => (z.key === 'hand' && z.hand ? { ...z, hand: { ...z.hand, wrong: ['not-a-real-fault'] } } : z));
  return { ...good, zooms };
}
