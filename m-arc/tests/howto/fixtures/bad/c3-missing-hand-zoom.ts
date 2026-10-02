// HT4-A3 C3 bad fixture: handling is not none, but no hand zoom exists.
import type { HowToContent } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  return { ...good, zooms: good.zooms.filter(z => z.kind !== 'hand') };
}
