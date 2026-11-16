// HT-4 (HT4-A3): C16, accessibility and meaning (the content-authored part: hotspot/icon rendering is a template
// concern, checked elsewhere). A zoom without alt.right/alt.wrong; a hand zoom without a camera label when the
// engine cannot print one itself (5.1: it only ever prints "above"/"side"); a Right/Wrong pair without both words.
//
// Review fix (Medium 7, PR #107): a posture zoom drawn with `view` set (a camera different from the plate's own,
// e.g. hanging_leg_raise/pull_up's "shoulders" zoom, drawn from behind) needs its own camLabel, same reasoning as
// the hand camera check above - the reader cannot tell the view changed unless the label says so. Decision on the
// finding's second half ("Right/Wrong words presence"), recorded in docs/COACHING-DECISIONS.md: content-types.ts's
// ZoomSpec already makes `hand.notes.right`/`.wrong` a matched pair (TypeScript alone catches one without the
// other), so the real, previously unchecked gap is the crop definitions themselves - a posture zoom can declare
// captions/alts for both panels while leaving `right`/`wrong` (which pose each panel actually draws) undefined for
// one side, since both are optional on ZoomSpec.
import type { HowToContent } from '../../../src/howto/content-types';

export function checkC16(content: HowToContent): string[] {
  const bad: string[] = [];
  for (const z of content.zooms) {
    if (!z.alt.right) bad.push(`C16: zooms.${z.key}: no alt.right`);
    if (!z.alt.wrong) bad.push(`C16: zooms.${z.key}: no alt.wrong`);
    if (!z.caption.right) bad.push(`C16: zooms.${z.key}: no caption for the right panel`);
    if (!z.caption.wrong) bad.push(`C16: zooms.${z.key}: no caption for the wrong panel`);
    if (z.kind === 'hand' && z.hand) {
      const engineLabels = z.hand.camera === 'side' || z.hand.camera === 'above';
      if (!engineLabels && !z.hand.cameraLabel) bad.push(`C16: zooms.${z.key}: camera "${z.hand.camera}" needs its own cameraLabel`);
    }
    if (z.kind === 'posture') {
      if (z.view && !z.camLabel) bad.push(`C16: zooms.${z.key}: view "${z.view}" (differs from the plate's own view) needs its own camLabel`);
      if (!z.right) bad.push(`C16: zooms.${z.key}: no right crop defined`);
      if (!z.wrong) bad.push(`C16: zooms.${z.key}: no wrong crop defined`);
    }
  }
  return bad;
}
