// HT4-A3 C7 bad fixture: a feel-row fix does not start with an imperative verb (FIX_VERBS).
import type { FeelRow, HowToContent } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  const rows: FeelRow[] = good.feel.rows.map(r => (r.key === 'wrist' ? { ...r, fix: 'Heel of your palm takes the push, go lighter if it bends.' } : r));
  return { ...good, feel: { ...good.feel, rows } };
}
