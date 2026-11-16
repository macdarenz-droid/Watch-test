// HT4-A3 C1 bad fixture: a posture checkpoint points at a zoom key that does not exist.
import type { HowToContent } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  return { ...good, posture: good.posture.map((p, i) => (i === 0 ? { ...p, zoom: 'not-a-real-zoom' } : p)) };
}
