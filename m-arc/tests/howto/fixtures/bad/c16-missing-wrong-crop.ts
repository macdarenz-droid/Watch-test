// HT4-A3 C16 bad fixture: a posture zoom has captions/alts for both panels but no `wrong` crop defined.
import type { HowToContent, ZoomSpec } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  const zooms = good.zooms.map((z): ZoomSpec => (z.key === 'blades' ? { ...z, wrong: undefined } : z));
  return { ...good, zooms };
}
