// HT4-A3 C8 bad fixture: a setup step has no Claim.
import type { HowToContent } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  return { ...good, setup: good.setup.map((s, i) => (i === 0 ? ({ ...s, claim: undefined } as unknown as typeof s) : s)) };
}
