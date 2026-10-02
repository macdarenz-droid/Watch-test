// HT-8 (plan 2.5, critic fix 4): golden B's "Where you should feel it" behaviour, ported line for line from the
// pinned page script (tools/plates/layers/artifact/build-page.mjs, "where you should feel it (S4-S6)"; FEEL_JS in
// engine/feelmap.mjs is its standalone subset). No markup is built here: every state is in the pre-rendered section
// string; this only flips the classes, attributes and inline play state that golden B's script flips.
//
// Golden B runs one script per card, so its feel code can call the chip and close-up code directly. In the app those
// are separate sections, so the calls arrive as the cross-section events of events.ts (HT-6; supervisor, PR #111):
// `ht:feel-row` {row} (a close-up's "This is usually why": openRow(row, true, true)) and `ht:feel-chip` (the "Feel it"
// chip: scroll, focus the heading, play). A row's "Show me the ..." needs nothing here: HT-6's delegated click
// handler on the sheet opens the close-up from golden B's markup (supervisor ruling on HT-6's design note).
import { useLayoutEffect } from 'preact/hooks';
import type { RefObject } from 'preact';
import { listen } from '../events';

export interface FeelController {
  openRow(k: string | null, scroll: boolean, force?: boolean): string | null;
  play(): void;
  /** The "Feel it" chip: scroll to the section, focus its heading, play (golden B: feelChip click). */
  chip(): void;
  destroy(): void;
}

/** Binds golden B's feel behaviour to one `.feel` section inside `card` (the sheet body). */
export function createFeelController(card: HTMLElement, feel: HTMLElement): FeelController {
  const reduced = () => document.documentElement.getAttribute('data-motion') === 'reduce';
  const offs: (() => void)[] = [];
  const on = (el: EventTarget, type: string, fn: (e: Event) => void) => { el.addEventListener(type, fn); offs.push(() => el.removeEventListener(type, fn)); };
  const map = feel.querySelector<HTMLElement>('[data-feel-map]')!, feelH = feel.querySelector<HTMLElement>('h4')!;
  const rows = [...feel.querySelectorAll<HTMLElement>('.fr')], more = feel.querySelector<HTMLElement>('.fr-more');
  let played = false, openRowKey: string | null = null;
  const play = () => {
    played = true;
    if (reduced() || map.classList.contains('is-focus')) return;
    map.classList.remove('is-playing'); void map.getBoundingClientRect(); map.classList.add('is-playing');
  };
  on(map, 'animationend', e => { if ((e as AnimationEvent).animationName === 'feel-sweep') map.classList.remove('is-playing'); });
  let t: ReturnType<typeof setTimeout> | null = null;
  if (window.IntersectionObserver) {
    const io = new IntersectionObserver(([e]) => {
      if (played) { io.disconnect(); return; }
      if (e!.intersectionRatio >= 0.5) t = t || setTimeout(() => { io.disconnect(); if (!played) play(); }, 300);
      else { clearTimeout(t!); t = null; }
    }, { threshold: [0, 0.5] });
    io.observe(map);
    offs.push(() => { io.disconnect(); clearTimeout(t!); });
  }
  on(map, 'click', play);
  // pause a running sweep while the map is scrolled fully out of view; it resumes where it stopped (FEEL_JS, plan
  // S-2 condition 6). Behaviour only: inline animation-play-state, no pixel change while visible.
  if (window.IntersectionObserver) {
    const hold = new IntersectionObserver(([e]) => {
      map.querySelectorAll<HTMLElement>('.feel-band').forEach(b => { b.style.animationPlayState = e!.isIntersecting ? '' : 'paused'; });
    }, { threshold: 0 });
    hold.observe(map);
    offs.push(() => hold.disconnect());
  }
  const setMore = (open: boolean) => {
    if (!more) return;
    rows.forEach(r => { if (r.hasAttribute('data-more')) r.hidden = !open && r.dataset.row !== openRowKey; });
    more.setAttribute('aria-expanded', String(open));
    more.textContent = open ? 'Show fewer' : 'Show ' + more.dataset.n + ' more';
  };
  function openRow(k: string | null, scroll: boolean, force?: boolean): string | null {
    const target = k === openRowKey && !force ? null : k;   // a row button toggles; a "This is usually why" link only opens
    rows.forEach(r => {
      const isOn = r.dataset.row === target, b = r.querySelector<HTMLElement>('.fr-btn')!;
      b.setAttribute('aria-expanded', String(isOn));
      r.querySelector<HTMLElement>('.fr-body')!.hidden = !isOn;
      if (isOn) r.hidden = false;
    });
    const prevKey = openRowKey; openRowKey = target;
    if (more && more.getAttribute('aria-expanded') !== 'true') rows.forEach(r => { if (r.hasAttribute('data-more')) r.hidden = r.dataset.row !== openRowKey; });
    const btn = target ? feel.querySelector<HTMLElement>('.fr[data-row="' + target + '"] .fr-btn') : null;
    map.querySelectorAll<HTMLElement>('.feel-mark').forEach(g => g.classList.toggle('on', g.dataset.row === target));
    const marked = !!(btn && (btn.hasAttribute('data-watch') || btn.hasAttribute('data-pain')));
    map.classList.toggle('is-focus', marked);
    if (marked) map.classList.remove('is-playing');
    feel.querySelector<HTMLElement>('.lg-watch')!.hidden = !(btn && btn.hasAttribute('data-watch'));
    feel.querySelector<HTMLElement>('.lg-pain')!.hidden = !(btn && btn.hasAttribute('data-pain'));
    map.setAttribute('aria-label', btn ? btn.dataset.label! : map.dataset.restLabel!);
    if (scroll && btn) { btn.focus({ preventScroll: true }); btn.closest('.fr')!.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); }
    return prevKey;
  }
  rows.forEach(r => on(r.querySelector('.fr-btn')!, 'click', () => openRow(r.dataset.row!, false)));
  if (more) on(more, 'click', () => setMore(more.getAttribute('aria-expanded') !== 'true'));
  // the "Feel it" chip (golden B: feelChip click) and a close-up's "This is usually why" (golden B: [data-feelrow])
  let chipT: ReturnType<typeof setTimeout> | null = null;
  const chip = () => {
    feel.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
    feelH.focus({ preventScroll: true });
    played = true; clearTimeout(chipT!); chipT = setTimeout(play, reduced() ? 0 : 450);
  };
  offs.push(listen(card, 'ht:feel-chip', chip));
  offs.push(() => clearTimeout(chipT!));
  offs.push(listen(card, 'ht:feel-row', d => openRow(d.row, true, true)));
  // a feel row's "When to get it checked": the sheet's one red-flag block, in Risks (plan 2.4, HT9-A3)
  feel.querySelectorAll<HTMLElement>('.rf-link').forEach(b => on(b, 'click', () => {
    const f = card.querySelector<HTMLElement>('#' + b.getAttribute('aria-controls'));
    if (!f) return;
    f.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    f.focus({ preventScroll: true });
  }));
  return { openRow, play, chip, destroy: () => offs.splice(0).forEach(f => f()) };
}

/** A chip tap or a "This is usually why" that arrived before the section was in; replayed once it is. */
export interface FeelPending { chip?: boolean; row?: string }

/** Binds the controller once the section string is in (`ready`); the event channel is the sheet body `.ht`.
 *  `pending` holds what Feel caught before the mount; it is replayed here, the same as a tap after load. */
export function useFeelMap(host: RefObject<HTMLElement>, ready: boolean, pending?: { current: FeelPending | null }): void {
  useLayoutEffect(() => {
    const feel = ready ? host.current?.querySelector<HTMLElement>('.feel') : null;
    if (!feel) return;
    const c = createFeelController(feel.closest<HTMLElement>('.ht') ?? host.current!, feel);
    const p = pending?.current;
    if (pending) pending.current = null;
    if (p?.row) c.openRow(p.row, !p.chip, true);
    if (p?.chip) c.chip();
    return () => c.destroy();
  }, [ready]);
}
