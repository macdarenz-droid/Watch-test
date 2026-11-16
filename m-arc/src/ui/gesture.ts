// Gesture constants shared by every touch interaction. Values are cited in
// docs/UI-POLISH-PLAN.md §2/§8 (AOSP ViewConfiguration, AndroidX ItemTouchHelper, Vaul, Sonner).
// EDGE_IGNORE_PX, AXIS_RATIO and SCRUB_HOLD_MS are M/ARC tuning choices (unverified).

export const SLOP_PX = 8;
export const AXIS_RATIO = 1.2;
export const VELOCITY_WINDOW_MS = 100;
export const FLING_PX_PER_MS = 0.4;
export const SHEET_CLOSE_FRACTION = 0.25;
export const SCROLL_LOCK_MS = 100;
export const RUBBER_MAX_PX = 24;
export const LONG_PRESS_MS = 400;
export const REORDER_HOLD_MS = 320;
export const SWIPE_COMMIT_FRACTION = 0.5;
export const SWIPE_FLING_MIN_PX = 32;
export const AUTOSCROLL_EDGE_PX = 72;
export const AUTOSCROLL_MAX_PX = 20;
export const TOAST_SWIPE_PX = 45;
export const TOAST_FLING_PX_PER_MS = 0.11;
export const EDGE_IGNORE_PX = 32;
export const HOLD_CONFIRM_MS = 800;
export const SCRUB_HOLD_MS = 150;

/** A3: the rubber-band resistance curve for over-pulling past a drag's natural range — approaches
 * RUBBER_MAX_PX asymptotically, never a hard stop. */
export function rubber(d: number): number {
  return RUBBER_MAX_PX * (1 - 1 / (1 + d / 80));
}

/** QA11-4: a sheet's body-drag (scrolled-to-top content, dragged down to close) must only engage
 * for a genuinely vertical touch — a horizontal scroller, or a diagonal touch, at scrollTop 0
 * must not get taken over just because dy happens to be positive. */
export function isVerticalDrag(dy: number, dx: number): boolean {
  return dy > 0 && dy > AXIS_RATIO * Math.abs(dx);
}

export interface TrackHandlers {
  /** The axis this drag is locked to once past slop. */
  axis: 'x' | 'y';
  /** 'down': capture the pointer immediately (the element already owns the gesture, e.g. a
   * touch-action:none grab handle). 'afterSlop' (default): only take over once the axis lock
   * confirms this is really our gesture, so a scrollable ancestor keeps native scroll until then. */
  capture?: 'down' | 'afterSlop';
  /** Pointerdown starts the gesture only if this returns true (e.g. not on a button, not near an edge). */
  canStart?: (e: PointerEvent) => boolean;
  onStart?: (e: PointerEvent) => void;
  /** d = signed distance along `axis` since pointerdown; v = signed velocity in px/ms. */
  onMove?: (d: number, v: number) => void;
  onEnd?: (d: number, v: number) => void;
  onCancel?: () => void;
}

/** Attaches a shared pointer-drag gesture to `el`: slop, single-axis lock (aborting to let native
 * scroll take over on the wrong axis), rAF-coalesced onMove, and a velocity estimate from samples
 * within VELOCITY_WINDOW_MS. Returns a cleanup function. */
export function track(el: HTMLElement, h: TrackHandlers): () => void {
  let active = false;
  let locked = false;
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let samples: { t: number; x: number; y: number }[] = [];
  let rafId: number | null = null;
  let pendingD = 0;
  let pendingV = 0;

  const primary = (x: number, y: number) => (h.axis === 'x' ? x - startX : y - startY);
  const other = (x: number, y: number) => (h.axis === 'x' ? y - startY : x - startX);
  const coordOf = (x: number, y: number) => (h.axis === 'x' ? x : y);

  function velocityAt(now: number, curCoord: number): number {
    const cutoff = now - VELOCITY_WINDOW_MS;
    let first: { t: number; x: number; y: number } | undefined;
    for (const s of samples) { if (s.t >= cutoff) { first = s; break; } }
    if (!first) first = samples[0];
    if (!first) return 0;
    const dt = now - first.t;
    if (dt <= 0) return 0;
    return (curCoord - coordOf(first.x, first.y)) / dt;
  }

  function scheduleMove(d: number, v: number): void {
    pendingD = d; pendingV = v;
    if (rafId != null) return;
    rafId = requestAnimationFrame(() => { rafId = null; if (active) h.onMove?.(pendingD, pendingV); });
  }

  function reset(): void {
    active = false; locked = false; pointerId = null; samples = [];
    if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function onPointerDown(e: PointerEvent): void {
    if (!e.isPrimary || pointerId != null) return;
    if (h.axis === 'x' && (e.clientX < EDGE_IGNORE_PX || e.clientX > window.innerWidth - EDGE_IGNORE_PX)) return;
    if (h.canStart && !h.canStart(e)) return;
    active = true; locked = h.capture === 'down';
    pointerId = e.pointerId;
    startX = e.clientX; startY = e.clientY;
    samples = [{ t: performance.now(), x: e.clientX, y: e.clientY }];
    if (locked) { try { el.setPointerCapture(e.pointerId); } catch { /* unsupported */ } }
    h.onStart?.(e);
  }

  function onPointerMove(e: PointerEvent): void {
    if (!active || e.pointerId !== pointerId) return;
    const now = performance.now();
    samples.push({ t: now, x: e.clientX, y: e.clientY });
    while (samples.length > 2 && samples[0]!.t < now - VELOCITY_WINDOW_MS * 2) samples.shift();
    const dPrimary = primary(e.clientX, e.clientY);
    const dOther = other(e.clientX, e.clientY);
    if (!locked) {
      if (Math.abs(dPrimary) < SLOP_PX && Math.abs(dOther) < SLOP_PX) return;
      // QA11-2: this tracker never locked onto its axis — the gesture belongs to whichever other
      // tracker (or native scroll) the dominant axis matches, so this is not this tracker's
      // cancel to report (same "never crossed slop" rule as finish()'s wasLocked check below).
      // For two trackers sharing one element (the toast's x/y pair), calling onCancel here used
      // to make the tracker that *didn't* lock fight the one that did.
      if (Math.abs(dPrimary) <= AXIS_RATIO * Math.abs(dOther)) { reset(); return; }
      locked = true;
      if (h.capture !== 'down') { try { el.setPointerCapture(e.pointerId); } catch { /* unsupported */ } }
    }
    scheduleMove(dPrimary, velocityAt(now, coordOf(e.clientX, e.clientY)));
  }

  function finish(e: PointerEvent, cancelled: boolean): void {
    if (e.pointerId !== pointerId) return;
    const wasLocked = locked;
    const d = primary(e.clientX, e.clientY);
    const v = velocityAt(performance.now(), coordOf(e.clientX, e.clientY));
    reset();
    if (!wasLocked) return; // never crossed slop on the tracked axis: a tap, nothing to end.
    if (cancelled) h.onCancel?.(); else h.onEnd?.(d, v);
  }

  const onPointerUp = (e: PointerEvent) => finish(e, false);
  const onPointerCancel = (e: PointerEvent) => finish(e, true);
  function onVisibility(): void {
    if (active && document.hidden) { const wasLocked = locked; reset(); if (wasLocked) h.onCancel?.(); }
  }

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerCancel);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', onPointerUp);
    el.removeEventListener('pointercancel', onPointerCancel);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
