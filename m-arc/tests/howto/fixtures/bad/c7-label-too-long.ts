// HT4-A3 C7 bad fixture: a zoom chip (a "label" field) has more than labelMaxWords (3) words.
import type { HowToContent, ZoomSpec } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  const zooms = good.zooms.map((z): ZoomSpec => (z.key === 'hand' ? { ...z, chip: 'Hand position close up view' } : z));
  return { ...good, zooms };
}
