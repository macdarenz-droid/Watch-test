// HT4-A3 C16 bad fixture: a zoom is missing alt.wrong.
import type { HowToContent } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  return { ...good, zooms: good.zooms.map((z, i) => (i === 0 ? { ...z, alt: { ...z.alt, wrong: '' } } : z)) };
}
