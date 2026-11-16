// "Common handling mistakes" (HT-6; plan 2.4 item 4): golden B's list inside the Grip section, as
// tools/plates/layers/artifact/howto-layers.mjs `gripSection` writes it. chips.test checks it `===` the page.
import type { HowToContent } from '@/howto/content-types';

/** golden B's esc (howto-layers.mjs). */
export const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** golden B's icons (the app's base() style), byte for byte. */
const ic = (d: string, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${(1.5 * 24 / s).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const I = {
  x: (s?: number) => ic('<path d="M6 6l12 12M18 6L6 18"/>', s),
  arrow: (s?: number) => ic('<path d="M5 12h13M13 7l5 5-5 5"/>', s),
  up: (s?: number) => ic('<path d="M12 19V6M7 11l5-5 5 5"/>', s),
};
export const zoomChip = (c: Pick<HowToContent, 'zooms'>, key: string) => c.zooms.find(z => z.key === key)?.chip;

/** The heading and list of one exercise's handling mistakes. */
export function handlingMistakesHtml(pre: string, c: Pick<HowToContent, 'zooms' | 'mistakes'>): string {
  const items = c.mistakes.map(m => `<li class="hm"><p class="hm-t">${I.x(16)}<b>${esc(m.title)}</b></p><p class="hm-fix"><span class="sr-only">Fix: </span>${esc(m.fix)}</p>`
    + (m.zoom && zoomChip(c, m.zoom) ? `<button type="button" class="st-show hm-show" id="${pre}-mis-${m.key}-show" data-zoom="${esc(m.zoom)}">Show me the ${esc(zoomChip(c, m.zoom)!.toLowerCase())}${I.arrow(16)}</button>` : '')
    + `</li>`).join('');
  return `<h5 class="eyebrow hm-head" id="${pre}-mis-h">Common handling mistakes</h5><ul class="hm-list" aria-labelledby="${pre}-mis-h">${items}</ul>`;
}
