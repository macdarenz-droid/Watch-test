/**
 * Hold-and-drag reordering for the live session's exercise list (owner request). Hold an
 * exercise for a moment, then drag it up or down; the others slide out of the way and it drops
 * into place on release. It only moves things: no selection state, no highlight, and it never
 * starts from inputs or buttons, so logging sets is untouched. A short move before the hold
 * ends is treated as a scroll. Keyboard and screen-reader users get Move up / Move down (moveBy).
 */
import { useRef, useState } from 'preact/hooks';
import { haptic } from '@/native/haptics';
import { durFor, springEase } from '@/ui/motion';
import { AUTOSCROLL_EDGE_PX, AUTOSCROLL_MAX_PX, REORDER_HOLD_MS, SLOP_PX } from '@/ui/gesture';

interface Drag { from: number; to: number; dy: number; tops: number[]; heights: number[]; step: number }

export function useReorder(onMove: (from: number, to: number) => void) {
  const listRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const live = useRef<Drag | null>(null);
  const suppressUntil = useRef(0);

  const onPointerDown = (index: number) => (e: PointerEvent) => {
    if (e.button !== 0 || live.current) return;
    if ((e.target as Element).closest('input, textarea, select, button, a, [role="switch"]')) return;
    const startX = e.clientX, startY = e.clientY;
    let started = false;
    let lastClientY = e.clientY;
    let scrollAccum = 0;
    let rafId: number | null = null;
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('touchmove', block);
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
    };
    const block = (t: TouchEvent) => { if (started) t.preventDefault(); };
    const dyFor = (clientY: number) => clientY - startY + scrollAccum;
    const recompute = (d: Drag, dy: number): Drag => {
      const centre = d.tops[d.from]! + d.heights[d.from]! / 2 + dy;
      const to = d.tops.filter((t, j) => j !== d.from && t + d.heights[j]! / 2 < centre).length;
      if (to !== d.to) void haptic.tick();
      return { ...d, dy, to };
    };
    // I11: while a drag is active, holding near the top (below the sticky live header) or bottom
    // (above the nav, or the rest banner when it's up) of the screen scrolls the page, so a long
    // list is reachable without letting go.
    const edgeTop = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--live-top-h')) || 0;
    const edgeBottom = () => {
      const navTop = document.querySelector('.nav')?.getBoundingClientRect().top ?? window.innerHeight;
      const rest = document.querySelector('.rest');
      const restTop = rest ? rest.getBoundingClientRect().top : Infinity;
      return Math.min(navTop, restTop);
    };
    const autoScrollTick = () => {
      const d = live.current;
      if (!d) return;
      const intoTop = AUTOSCROLL_EDGE_PX - Math.max(0, lastClientY - edgeTop());
      const intoBottom = AUTOSCROLL_EDGE_PX - Math.max(0, edgeBottom() - lastClientY);
      let delta = 0;
      if (intoTop > 0) delta = -AUTOSCROLL_MAX_PX * (intoTop / AUTOSCROLL_EDGE_PX) ** 2;
      else if (intoBottom > 0) delta = AUTOSCROLL_MAX_PX * (intoBottom / AUTOSCROLL_EDGE_PX) ** 2;
      if (delta) {
        window.scrollBy(0, delta);
        scrollAccum += delta;
        live.current = recompute(d, dyFor(lastClientY));
        setDrag(live.current);
      }
      rafId = requestAnimationFrame(autoScrollTick);
    };
    const begin = () => {
      const items = [...(listRef.current?.querySelectorAll<HTMLElement>(':scope > .reorder-item') ?? [])];
      if (!items[index]) return;
      const rects = items.map(el => el.getBoundingClientRect());
      const step = rects.length > 1 ? rects[1]!.top - rects[0]!.bottom : 12;
      started = true;
      live.current = { from: index, to: index, dy: 0, tops: rects.map(r => r.top), heights: rects.map(r => r.height), step };
      setDrag(live.current);
      void haptic.dragStart();
      rafId = requestAnimationFrame(autoScrollTick);
    };
    const timer = setTimeout(begin, REORDER_HOLD_MS);
    const move = (m: PointerEvent) => {
      lastClientY = m.clientY;
      if (!started) {
        if (Math.abs(m.clientX - startX) > SLOP_PX || Math.abs(m.clientY - startY) > SLOP_PX) cleanup();
        return;
      }
      live.current = recompute(live.current!, dyFor(m.clientY));
      setDrag(live.current);
    };
    // I11: FLIP the dropped item back into its slot — record where it visually sits before the
    // reorder commits, then once the list has re-rendered in its new order, measure where that
    // same element (same key, so Preact keeps the DOM node) landed and animate the gap away. The
    // same settle plays whether the drag committed a move or was released/cancelled in place.
    const settle = (d: Drag, commit: boolean) => {
      const el = listRef.current?.querySelectorAll<HTMLElement>(':scope > .reorder-item')[d.from] ?? null;
      const before = el?.getBoundingClientRect().top;
      if (commit && d.to !== d.from) onMove(d.from, d.to);
      setDrag(null);
      if (el == null || before == null) { void haptic.drop(); return; }
      requestAnimationFrame(() => {
        const after = el.getBoundingClientRect().top;
        const delta = before - after;
        const liftScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lift-scale')) || 1;
        if (Math.abs(delta) > 0.5 && el.animate) {
          el.animate(
            [{ translate: `0 ${delta}px`, scale: String(liftScale) }, { translate: '0 0', scale: '1' }],
            { duration: durFor('spring'), easing: springEase() },
          );
        }
        void haptic.drop();
      });
    };
    const finish = (commit: boolean) => {
      cleanup();
      const d = live.current;
      live.current = null;
      if (!started || !d) { setDrag(null); return; }
      suppressUntil.current = Date.now() + 400;
      settle(d, commit);
    };
    const up = () => finish(true);
    const cancel = () => finish(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('touchmove', block, { passive: false });
  };

  /** Where item `i` sits while a drag is in progress. */
  const styleFor = (i: number): Record<string, string> | undefined => {
    if (!drag) return undefined;
    const shift = drag.heights[drag.from]! + drag.step;
    if (i === drag.from) return { translate: `0 ${drag.dy}px` };
    if (drag.from < drag.to && i > drag.from && i <= drag.to) return { translate: `0 ${-shift}px` };
    if (drag.to < drag.from && i >= drag.to && i < drag.from) return { translate: `0 ${shift}px` };
    return { translate: '0 0' };
  };

  /** The item currently being held: it lifts with a shadow and a click (CSS `.lifted`). */
  const isLifted = (i: number): boolean => drag != null && i === drag.from;

  /**
   * AUD-10 (UI-09): Move up / Move down for keyboard and screen-reader users. The same move a
   * drop makes (onMove), one place at a time; nothing happens mid-drag or past either end.
   */
  const moveBy = (index: number, delta: -1 | 1, count: number): boolean => {
    const to = index + delta;
    if (live.current || to < 0 || to >= count) return false;
    onMove(index, to);
    return true;
  };

  /** A tap that ends a drag must not also open or close the card. */
  const clickAllowed = (): boolean => Date.now() > suppressUntil.current;

  return { listRef, dragging: drag != null, onPointerDown, moveBy, styleFor, isLifted, clickAllowed };
}
