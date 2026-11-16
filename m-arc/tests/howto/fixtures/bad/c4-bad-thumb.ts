// HT4-A3 C4 bad fixture: overBody is true, but the thumb default is not wrapped and no "over" option is offered.
import type { HowToContent, HandlingSpec } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  const h = good.handling as HandlingSpec;
  return { ...good, handling: { ...h, overBody: true, thumb: { mode: 'beside', claim: h.thumb.claim } } };
}
