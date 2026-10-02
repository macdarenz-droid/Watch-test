// HT4-A3 C2 bad fixture: a feel row's `at.parts` names a part id that is not in bodyMuscles.ts.
import type { HowToContent } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  return {
    ...good,
    feel: { ...good.feel, rows: good.feel.rows.map((r, i) => (i === 0 ? { ...r, at: { ...r.at, parts: ['not-a-real-part'] } } : r)) },
  };
}
