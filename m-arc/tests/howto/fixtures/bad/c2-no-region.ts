// HT4-A3 C2 bad fixture: a shimmer role uses an id with no drawn region.
import type { HowToContent } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  return { ...good, feel: { ...good.feel, primary: [...good.feel.primary, { muscleId: 'brachialis', plain: 'Text-only muscle, drawn as shimmer by mistake.' }] } };
}
