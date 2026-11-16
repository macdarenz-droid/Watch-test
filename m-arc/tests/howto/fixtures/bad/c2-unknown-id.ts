// HT4-A3 C2 bad fixture (D-HT4-C2): a feel.secondary entry uses a muscle id that does not exist at all.
import type { HowToContent } from '../../../../src/howto/content-types';
import type { MuscleId } from '../../../../src/data/muscles';

export function mutate(good: HowToContent): HowToContent {
  return { ...good, feel: { ...good.feel, secondary: [...good.feel.secondary, { muscleId: 'not_a_real_muscle' as MuscleId, plain: 'Made up.' }] } };
}
