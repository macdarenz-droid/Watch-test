// HT4-A3 C16 bad fixture: a posture zoom sets `view` (a camera different from the plate's own) but no camLabel.
import type { HowToContent, ZoomSpec } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  const zooms = good.zooms.map((z): ZoomSpec => (z.key === 'blades' ? { ...z, view: 'back' } : z));
  return { ...good, zooms };
}
