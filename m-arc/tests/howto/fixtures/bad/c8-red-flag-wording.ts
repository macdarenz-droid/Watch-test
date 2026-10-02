// HT4-A3 C8 bad fixture: a row's fix carries its own red-flag wording instead of using `redFlag`.
import type { HowToContent } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  return {
    ...good,
    feel: {
      ...good.feel,
      rows: good.feel.rows.map((r, i) => (i === 0 ? { ...r, redFlag: undefined, fix: 'Stop and see a doctor if it keeps hurting.' } : r)),
    },
  };
}
