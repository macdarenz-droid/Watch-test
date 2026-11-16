// HT4-A3 C2 bad fixture: the same muscle is listed as both primary and watch.
import type { HowToContent } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  const primaryId = good.feel.primary[0]!.muscleId;
  return { ...good, feel: { ...good.feel, watch: [...good.feel.watch, { muscleId: primaryId, plain: 'Should not double as a watch muscle.' }] } };
}
