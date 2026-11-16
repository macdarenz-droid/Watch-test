// HT4-A3 C7 bad fixture: the grip line uses a banned phrase.
import type { HowToContent, HandlingSpec } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  const h = good.handling as HandlingSpec;
  return { ...good, handling: { ...h, gripLine: 'Engage your core and maximise the squeeze at the top.' } };
}
