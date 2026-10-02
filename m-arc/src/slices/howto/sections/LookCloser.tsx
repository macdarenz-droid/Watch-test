// "Look closer" (HT-6; plan 2.4 item 3, GA 2.1 and 2.4): the Mistake view's wrist line and the chip row under the
// tempo, as golden B's `alsoRow` / `chipRow` (howto-layers.mjs) write them. chips.test checks both `===` the page.
// The zoom host binds here, once per sheet.
import { useMemo } from 'preact/hooks';
import type { HowToContent } from '@/howto/content-types';
import { ZoomHostBinding, type ZoomSetup } from '../zoom/ZoomHost';
import { hasZoomKind } from '../zoom/registry';
import { esc, I } from './HandlingMistakes';
import '../css/hand.css';

export type ChipContent = Pick<HowToContent, 'id' | 'handling' | 'zooms' | 'chips'>;
/** The hand archetypes whose load goes through the hands: Hand is their first chip (GA 2.1). */
export const HAND_FIRST = ['push', 'pull', 'hang', 'hold', 'curl', 'on-body'];
export const MAX_CHIPS = 4;

/** What is registered in this build: the zoom kinds with a loader, and whether the feel section exists. */
export interface Registered { readonly kind: (kind: string) => boolean; readonly feel: boolean }

/** HT6-A3: the chip keys in golden B's order, keeping only what can open. Throws on golden B's own rules. */
export function chipKeys(c: ChipContent, reg: Registered): string[] {
  const all = c.chips ? [...c.chips] : [...c.zooms.map(z => z.key), 'feel'];
  if (all.length > MAX_CHIPS) throw new Error(`${c.id}: ${all.length} chips (max ${MAX_CHIPS})`);
  if (HAND_FIRST.includes(c.handling.archetype) && all[0] !== 'hand') throw new Error(`${c.id}: load goes through the hands, Hand must be the first chip`);
  if (all.includes('feel') && all[all.length - 1] !== 'feel') throw new Error(`${c.id}: "Where to feel it" must be the last chip`);
  return all.filter(k => (k === 'feel' ? reg.feel : (z => !!z && reg.kind(z.kind))(c.zooms.find(z => z.key === k))));
}

export function chipRowHtml(pre: string, c: ChipContent, keys: readonly string[]): string {
  if (!keys.length) return '';
  return `<div class="zx-chips-wrap"><span class="eyebrow" id="${pre}-look">Look closer</span><div class="zx-chips" role="group" aria-labelledby="${pre}-look">`
    + keys.map(k => k === 'feel'
      ? `<button type="button" class="zx-chip" id="${pre}-chip-feel" data-feel aria-label="Where to feel it">Feel it</button>`
      : (z => `<button type="button" class="zx-chip" id="${pre}-chip-${k}" data-zoom="${esc(k)}" aria-pressed="false" aria-controls="${pre}-zoom-${k}">${esc(z.chip)}${z.chipCaption ? `<span class="zx-chip-cap">${esc(z.chipCaption)}</span>` : ''}</button>`)(c.zooms.find(z => z.key === k)!)).join('')
    + `</div></div>`;
}

/** Push exercises: the Mistake view's one quiet line that opens the hand close-up (shown only while Mistake is on). */
export function alsoRowHtml(pre: string, c: ChipContent): string {
  if (c.handling.archetype !== 'push') return '';
  const z = c.zooms.find(q => q.kind === 'hand');
  if (!z) throw new Error(`${c.id}: push exercise without a hand close-up`);
  return `<p class="ht-also" id="${pre}-also" hidden><span>Also check your wrist:</span><button type="button" class="ht-also-btn" id="${pre}-also-hand" data-zoom="${esc(z.key)}" aria-controls="${pre}-zoom-${esc(z.key)}">${esc(z.chip)}${z.chipCaption ? `, ${esc(z.chipCaption.toLowerCase())}` : ''}${I.up(16)}</button></p>`;
}

export function LookCloser({ pre, content, feel }: { pre: string; content: ChipContent; feel: boolean }) {
  const html = useMemo(() => ({ __html: alsoRowHtml(pre, content) + chipRowHtml(pre, content, chipKeys(content, { kind: hasZoomKind, feel })) }), [content]);
  const setup = useMemo<ZoomSetup>(() => ({ chromeId: pre, kindOf: k => content.zooms.find(z => z.key === k)?.kind ?? null }), [content]);
  return <><div class="ht-look" dangerouslySetInnerHTML={html} /><ZoomHostBinding setup={setup} /></>;
}
