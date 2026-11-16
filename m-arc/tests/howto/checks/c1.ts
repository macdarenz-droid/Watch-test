// HT-4 (HT4-A3): C1, cross-field rules across a single HowToContent. The shape itself is checked by `satisfies
// HowToContent` at authoring time; C1 checks only rules the type system can't: references between fields.
import type { HowToContent } from '../../../src/howto/content-types';

/** `knownIds` is every exercises.json id (ContentLibId), used to check `extends` targets. */
export function checkC1(content: HowToContent, knownIds: ReadonlySet<string>): string[] {
  const bad: string[] = [];
  const zoomKeys = new Set(content.zooms.map(z => z.key));
  const feelRowKeys = new Set(content.feel.rows.map(r => r.key));

  const checkZoomRef = (owner: string, zoom: string | undefined) => {
    if (zoom !== undefined && !zoomKeys.has(zoom)) bad.push(`C1: ${owner} references zoom "${zoom}", which is not in zooms`);
  };
  content.setup.forEach((s, i) => checkZoomRef(`setup[${i}]`, s.zoom));
  content.posture.forEach((p, i) => checkZoomRef(`posture[${i}] (${p.key})`, p.zoom));
  content.feel.rows.forEach((r, i) => checkZoomRef(`feel.rows[${i}] (${r.key})`, r.zoom));
  content.mistakes.forEach((m, i) => checkZoomRef(`mistakes[${i}] (${m.key})`, m.zoom));

  // Review fix (Medium 8, PR #107): the previous check here called checkZoomRef(..., undefined) for every
  // handling.faults object entry, which can never fail (HandFault has no `zoom` field to check - dead code, never
  // caught a real drift). The real, previously uncaught reference is the other direction: a zoom's `hand.wrong` can
  // name a fault by its string key (rather than embed a full HandFault object), and that key must exist in
  // handling.faults - a shared registry entry a zoom references, not one it owns.
  const faultKeys = new Set<string>();
  if (content.handling.archetype !== 'none') for (const f of content.handling.faults) faultKeys.add(typeof f === 'string' ? f : f.key);
  for (const z of content.zooms) {
    if (z.kind !== 'hand' || !z.hand) continue;
    for (const f of z.hand.wrong) {
      if (typeof f === 'string' && !faultKeys.has(f)) bad.push(`C1: zooms.${z.key}.hand.wrong references fault "${f}", which is not in handling.faults`);
    }
  }

  for (const z of content.zooms) if (z.feelRow !== undefined && !feelRowKeys.has(z.feelRow)) bad.push(`C1: zooms.${z.key} references feelRow "${z.feelRow}", which is not in feel.rows`);

  if (content.zooms.length > 4) bad.push(`C1: ${content.zooms.length} zooms, at most 4 allowed`);

  if (content.extends !== undefined && !knownIds.has(content.extends)) bad.push(`C1: extends "${content.extends}" is not a known id`);

  return bad;
}
