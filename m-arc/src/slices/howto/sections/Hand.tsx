// The Grip section (HT-6; plan 2.4 item 4, GA 2.1): the grip line, the wrist limit and handle note, then
// "Common handling mistakes", as golden B's `gripSection` (howto-layers.mjs) writes it. chips.test checks `===`.
import { useMemo } from 'preact/hooks';
import type { HowToContent } from '@/howto/content-types';
import type { BuiltHowTo } from '@/howto/types';
import { chromeIdOf } from '../PlateView';
import { esc, handlingMistakesHtml } from './HandlingMistakes';
import { LookCloser, type ChipContent } from './LookCloser';
import { SECTIONS, type SectionProps } from './index';

export type GripContent = Pick<HowToContent, 'id' | 'handling' | 'zooms' | 'mistakes'>;

export function gripHtml(pre: string, c: GripContent): string {
  const h = c.handling;
  if (h.archetype === 'none' || !h.gripLine) throw new Error(`${c.id}: no grip line`);
  const limit = 'limitText' in h.wrist ? h.wrist.limitText : undefined, sore = h.handleChoice?.sore;
  return `<section class="hw-sec grip" id="${pre}-grip" aria-labelledby="${pre}-grip-h"><h4 class="eyebrow" id="${pre}-grip-h">Grip</h4>`
    + `<p class="grip-lead">${esc(h.gripLine)}</p>`
    + (limit ? `<p class="grip-note">${esc(limit)}</p>` : '') + (sore ? `<p class="grip-note">${esc(sore)}</p>` : '')
    + handlingMistakesHtml(pre, c) + `</section>`;
}

export function Hand({ pre, content }: { pre: string; content: GripContent }) {
  const html = useMemo(() => ({ __html: gripHtml(pre, content) }), [content]);
  return <div class="ht-grip" dangerouslySetInnerHTML={html} />;
}

/** The content this card reads. HT-5 generates it from golden B into the base chunk; until then it is absent and
 *  the sections render nothing. */
export type HandContent = GripContent & ChipContent;
export function handContentOf(howTo: BuiltHowTo): HandContent | null {
  const c = howTo as unknown as Partial<HowToContent>;
  if (!c.handling || !c.zooms || !c.mistakes || c.handling.archetype === 'none') return null;
  return { id: c.id ?? howTo.id, handling: c.handling, zooms: c.zooms, mistakes: c.mistakes, chips: c.chips } as HandContent;
}

/** The registry entry (sections/index.ts, `hand`): Look closer, then Grip with its handling mistakes (golden order). */
export function HandSections({ howTo }: SectionProps) {
  const content = useMemo(() => handContentOf(howTo), [howTo]);
  if (!content) return null;
  const pre = chromeIdOf(howTo);
  return <><LookCloser pre={pre} content={content} feel={SECTIONS.some(s => s.id === 'feel')} /><Hand pre={pre} content={content} /></>;
}
