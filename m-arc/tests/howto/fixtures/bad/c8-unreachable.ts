// HT4-A3 C8 bad fixture: a claim's only source is marked "unreachable" in the registry.
import type { HowToContent } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  return {
    ...good,
    feel: { ...good.feel, claim: { tags: ['WEAK'], sources: ['unreachable-source'] } },
  };
}
