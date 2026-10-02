// HT4-A3 C7 bad fixture: pushes the visible-word budget (450) over, via zooms[].heading - shown, but with no own
// word cap in copy-lint.mjs's field map ('heading': [null, null]) - so this exercises the total-budget rule alone,
// with no other C7 rule also tripping.
import type { HowToContent, ZoomSpec } from '../../../../src/howto/content-types';

const PADDING = Array.from({ length: 460 }, (_, i) => `word${i}`).join(' ');

export function mutate(good: HowToContent): HowToContent {
  const zooms = good.zooms.map((z): ZoomSpec => (z.key === 'hand' ? { ...z, heading: `Hand: right and wrong ${PADDING}` } : z));
  return { ...good, zooms };
}
