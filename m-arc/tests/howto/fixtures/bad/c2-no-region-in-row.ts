// HT4-A3 C2 bad fixture (D-HT4-C2): a feel row highlights a NO_REGION muscle id (brachialis) - allowed as text-only
// in feel.secondary/watch, but a feel-row highlight needs a real drawn region to shimmer.
import type { HowToContent } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  return {
    ...good,
    feel: { ...good.feel, rows: good.feel.rows.map((r, i) => (i === 0 ? { ...r, at: { ...r.at, muscles: ['brachialis'] } } : r)) },
  };
}
