// The How-to sections' cross-section contract (supervisor, PR #111, 2026-09-30): sections talk through bubbling
// CustomEvents dispatched on the sheet, never by importing each other. Part of the zoom host (HT-6).
// - `ht:zoom-open` {key, opener}: Feel (HT-8), Setup (HT-9) and the handling mistakes (HT-6) ask for a close-up;
//   the zoom host opens it (golden B's "Show me": open it, or bring the open one into view), and focus returns to
//   `opener` when it closes.
// - `ht:feel-row` {row}: a close-up's "This is usually why" (HT-6, HT-7); Feel opens that row.
// - `ht:feel-chip`: the "Where to feel it" chip (HT-6); Feel scrolls to its section, focuses it and plays.
// Red-flag links use ids only (`#<pre>-redflag-<flag>`, HT-9).

export interface HowToEvents {
  'ht:zoom-open': { readonly key: string; readonly opener: HTMLElement };
  'ht:feel-row': { readonly row: string };
  'ht:feel-chip': Record<string, never>;
}
export type HowToEventName = keyof HowToEvents;

/** Dispatches `name` from `from`; it bubbles to the sheet, where the listeners sit. */
export function emit<K extends HowToEventName>(from: EventTarget, name: K, detail: HowToEvents[K]): boolean {
  return from.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
}

/** Listens for `name` on `root` (the sheet's dialog); returns the remover. */
export function listen<K extends HowToEventName>(root: EventTarget, name: K, fn: (detail: HowToEvents[K], e: CustomEvent<HowToEvents[K]>) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<HowToEvents[K]>).detail, e as CustomEvent<HowToEvents[K]>);
  root.addEventListener(name, h);
  return () => root.removeEventListener(name, h);
}
