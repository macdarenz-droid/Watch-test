// The golden block (HT-3, plan 2.4 item 2 and 2.5): plate-fit and figure, cue line, Trace / Mistake / Saved offline,
// tells and tempo, built exactly as the approved gallery's card() builds them (tools/plates/vendor/artifact/
// build-page.mjs:159-174) from the golden strings, and inserted once. Only the two mapped wrapper classes differ
// (`plate` -> `ht-plate`, `plate-fit` -> `ht-plate-fit`), plus the empty zoom slot after the plate box.
import { createContext } from 'preact';
import { useContext, useEffect, useMemo, useRef } from 'preact/hooks';
import type { BuiltHowTo } from '@/howto/types';
import { usePlateState, type PlateApi } from './usePlateState';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The gallery's icons (build-page `I.trace(18)`, `I.check(14)`), byte for byte; plate-state.test checks them. */
export const TRACE_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.00" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 18c2-7 7-11 14-12"/><path d="M15.5 4.5L19 6l-2 3.2"/></svg>';
export const CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.57" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l4 4L19 7"/></svg>';

/** The gallery chrome id (`lateral-raise`), read from the first tagged callout id (`lateral-raise-n-<key>`). */
export function chromeIdOf(h: BuiltHowTo): string {
  const k = h.plate.normal.firstKey;
  const m = h.plate.normal.overlay.match(new RegExp(`id="([a-z0-9-]+)-n-${k}"`));
  if (!m) throw new Error(`${h.id}: no tagged callout ${k}`);
  return m[1]!;
}

/** The mistake figure, as the gallery writes it (inserted on the first Mistake tap). */
export const mistakeFigureHtml = (h: BuiltHowTo) =>
  `<figure class="ht-plate" data-mode="mistake" hidden>${h.plate.mistake.svg}${h.plate.mistake.overlay}<figcaption class="sr-only">${esc(h.plate.mistakeAlt)}</figcaption></figure>`;

/** The golden block's inner HTML at S0: the gallery card from plate-fit to tempo, without the mistake figure. */
export function goldenBlockHtml(h: BuiltHowTo): string {
  const id = chromeIdOf(h), p = h.plate;
  const n0 = p.normal.cues.find(c => c.key === p.normal.firstKey)!;
  const figN = `<figure class="ht-plate" data-mode="normal">${p.normal.svg}${p.normal.overlay}<figcaption class="sr-only">${esc(p.alt)}</figcaption></figure>`;
  return `<div class="ht-plate-fit" id="${id}-plate">${figN}</div><div class="ht-zoom-slot" hidden></div>
  <p class="cue-line" id="${id}-cue" aria-live="polite">${esc(n0.cue)}</p>
  <div class="plate-controls">
    <button type="button" class="howto-pill" id="${id}-trace" aria-pressed="false" aria-label="Trace the movement once">${TRACE_ICON} Trace</button>
    <button type="button" class="howto-pill mistake" id="${id}-mistake" aria-pressed="false">Mistake</button>
    <span class="grow"></span>
    <span class="hint howto-offline">${CHECK_ICON} Saved offline</span>
  </div>
  ${p.tells}
  ${p.tempo}`;
}

/** The zoom slot API for the sections below the plate (HT-6, HT-7); null until the plate is bound. */
export const PlateApiContext = createContext<PlateApi | null>(null);
export const usePlateApi = () => useContext(PlateApiContext);

/** The element the API is also set on, as a read-only handle for gate block HT-3. */
export type GoldenElement = HTMLDivElement & { readonly htPlateApi?: PlateApi };

/** Inserted once per open: `html` is memoised, and Preact re-sets innerHTML only when the string changes. */
export function PlateView({ howTo, onApi }: { howTo: BuiltHowTo; onApi: (api: PlateApi) => void }) {
  const ref = useRef<GoldenElement>(null);
  const html = useMemo(() => ({ __html: goldenBlockHtml(howTo) }), [howTo]);
  const api = usePlateState(ref, {
    chromeId: chromeIdOf(howTo),
    selN: howTo.plate.normal.firstKey,
    selM: howTo.plate.mistake.firstKey,
    mountMistake: () => {
      const figN = ref.current!.querySelector('.ht-plate[data-mode="normal"]')!;
      figN.insertAdjacentHTML('afterend', mistakeFigureHtml(howTo));
      return figN.nextElementSibling as HTMLElement;
    },
  });
  // A read-only, non-enumerable handle for gate block HT-3; no app code reads it (sections use usePlateApi()).
  useEffect(() => { if (api) { Object.defineProperty(ref.current!, 'htPlateApi', { value: api, enumerable: false, configurable: true }); onApi(api); } }, [api]);
  // The HTML is our own generated golden content (src/howto/generated, hash-locked), never user input.
  return <div class="ht-golden" ref={ref} dangerouslySetInnerHTML={html} />;
}
