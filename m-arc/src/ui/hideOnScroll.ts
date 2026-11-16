/**
 * BUG-22: hide a floating control while the page scrolls down, show it again on scroll-up, at
 * the top and at the end of the page (where the page's end padding keeps it clear of content).
 * The step is pure so it is unit-tested; `useHideOnScroll` wires it to the window scroll.
 */
import { useEffect, useState } from 'preact/hooks';

/** Pixels of travel in one direction before the control flips, so small jitters do nothing. */
export const SCROLL_SLOP = 8;
/** Within this many pixels of the end of the page the control shows again. */
export const END_SLACK = 8;

export interface HideState { hidden: boolean; anchor: number }
export interface ScrollSample {
  /** Current scroll offset. */
  y: number;
  /** Largest scroll offset (scrollHeight - viewport height); <= 0 when the page does not scroll. */
  max: number;
  /** Viewport height: a single step longer than this is a programmatic jump, not a finger. */
  view: number;
}

export function nextHideState(prev: HideState, s: ScrollSample): HideState {
  const y = Math.max(0, s.y);
  if (s.max <= 0 || y <= 0 || s.max - y <= END_SLACK) return { hidden: false, anchor: y };
  const delta = y - prev.anchor;
  // A jump (tab change restoring its scroll, scrollTo) re-anchors without flipping.
  if (Math.abs(delta) > s.view) return { hidden: prev.hidden, anchor: y };
  if (prev.hidden) {
    if (delta <= -SCROLL_SLOP) return { hidden: false, anchor: y };
    return { hidden: true, anchor: Math.max(prev.anchor, y) };
  }
  if (delta >= SCROLL_SLOP) return { hidden: true, anchor: y };
  return { hidden: false, anchor: Math.min(prev.anchor, y) };
}

function sample(): ScrollSample {
  const el = document.scrollingElement ?? document.documentElement;
  return { y: window.scrollY, max: el.scrollHeight - window.innerHeight, view: window.innerHeight };
}

/** True while the control should be out of the way. `resetKey` changing (a tab switch) shows it. */
export function useHideOnScroll(resetKey: unknown): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let st: HideState = { hidden: false, anchor: window.scrollY };
    setHidden(false);
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const next = nextHideState(st, sample());
        if (next.hidden !== st.hidden) setHidden(next.hidden);
        st = next;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [resetKey]);
  return hidden;
}
