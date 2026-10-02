// HT-4 (HT4-A3): C4, the thumb rule. overBody or `hang`, and the thumb default is not wrapped or `over` is offered.
import type { HowToContent } from '../../../src/howto/content-types';

export function checkC4(content: HowToContent): string[] {
  if (content.handling.archetype === 'none') return [];
  const h = content.handling;
  const needsWrapped = h.overBody === true || h.archetype === 'hang';
  if (!needsWrapped) return [];

  const defaultOk = h.thumb.mode === 'wrapped';
  const overOffered = (h.thumb.options ?? []).some(o => o.mode === 'over');
  if (!defaultOk && !overOffered) return [`C4: overBody/hang requires thumb.mode "wrapped" or an "over" option, got "${h.thumb.mode}"`];
  return [];
}
