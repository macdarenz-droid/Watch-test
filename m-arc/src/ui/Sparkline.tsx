/** A small trend line (moved from History so Escobar's lazy chunk doesn't pull in History, §4.4). */
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { formatDay } from '@/core/dates';
import { track, SCRUB_HOLD_MS } from '@/ui/gesture';
import { haptic } from '@/native/haptics';
import { durFor, reduced } from '@/ui/motion';

const PAD = 6;
const fmt = (v: number): string => String(Math.round(v * 10) / 10);

/**
 * `height`/`labels` are optional so Escobar's static 56px chart (no labels) is unaffected.
 * History passes `height={96} labels dates={...}`. `scrub` (A6, History only) turns the plot into
 * a draggable/keyboard slider that reports its index via `onScrubIndex` (null = at rest, showing
 * the latest point); the caller renders the domain-specific readout text.
 */
export function Sparkline({ points, dates, height = 56, labels = false, scrub = false, onScrubIndex }: { points: number[]; dates?: string[]; height?: number; labels?: boolean; scrub?: boolean; onScrubIndex?: (i: number | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  // QA14-1: the guide/dot stay mounted at the last touched point and fade out (rather than vanish)
  // on release, so displayIndex keeps that position after scrubIndex reverts to null.
  const [displayIndex, setDisplayIndex] = useState<number | null>(null);
  const idxRef = useRef<number | null>(null);
  // BUG-12 (A4): the opaque min/max labels sit at the right edge. The plot ends left of them, so a
  // latest point that is the max or the min never has its end dot hidden under its own label.
  const labelsRef = useRef<HTMLDivElement>(null);
  const [gutter, setGutter] = useState(0);
  const gutterRef = useRef(0);
  gutterRef.current = gutter;
  // I12: read the real pixel width before paint, so the viewBox never scales non-uniformly (the
  // old preserveAspectRatio="none" stretched the end dot into an ellipse on any width but 300).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setW(el.clientWidth);
    const ro = new ResizeObserver(entries => { const cw = entries[0]?.contentRect.width; if (cw) setW(cw); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const n = points.length;
  const updateIndex = (i: number | null): void => {
    if (i === idxRef.current) return;
    idxRef.current = i;
    setScrubIndex(i);
    if (i !== null) { setDisplayIndex(i); haptic.tick(); }
    onScrubIndex?.(i);
  };
  // A6: drag past SLOP_PX (track()'s own axis-x lock) or hold SCRUB_HOLD_MS without moving — either
  // starts the scrub; releasing either way snaps back to the latest point.
  useEffect(() => {
    if (!scrub) return undefined;
    const el = ref.current;
    if (!el || n < 2) return undefined;
    const indexFromX = (clientX: number): number => {
      const r = el.getBoundingClientRect();
      const usable = Math.max(1, r.width - PAD * 2 - gutterRef.current);
      const relX = clientX - r.left - PAD;
      return Math.max(0, Math.min(n - 1, Math.round((relX / usable) * (n - 1))));
    };
    let startX = 0;
    let holdTimer: number | null = null;
    let dragging = false;
    const clearHold = () => { if (holdTimer != null) { window.clearTimeout(holdTimer); holdTimer = null; } };
    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      clearHold();
      holdTimer = window.setTimeout(() => { dragging = true; updateIndex(indexFromX(startX)); }, SCRUB_HOLD_MS);
    };
    const end = () => { clearHold(); if (dragging) { dragging = false; updateIndex(null); } };
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    const untrack = track(el, {
      axis: 'x', capture: 'afterSlop',
      onMove: d => { clearHold(); dragging = true; updateIndex(indexFromX(startX + d)); },
      onEnd: end,
      onCancel: end,
    });
    return () => {
      clearHold();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
      untrack();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrub, n, w]);
  // BUG-12 (A4): measured after each render, since the label text (and so its width) follows the data.
  useLayoutEffect(() => {
    const spans = labelsRef.current ? [...labelsRef.current.querySelectorAll('span')] : [];
    const g = spans.length ? Math.ceil(Math.max(...spans.map(el => el.getBoundingClientRect().width))) + 4 : 0;
    if (g !== gutter) setGutter(g);
  });
  if (n < 2) return null;
  const min = Math.min(...points), max = Math.max(...points);
  const vw = Math.max(1, w);
  const x = (i: number) => PAD + (i / (n - 1)) * Math.max(1, vw - PAD * 2 - gutter);
  const y = (v: number) => height - PAD - ((v - min) / Math.max(1e-6, max - min)) * (height - PAD * 2);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(' ');
  const lastX = x(n - 1), lastY = y(points[n - 1]!);
  const onKeyDown = (e: KeyboardEvent) => {
    if (!scrub) return;
    const idx = idxRef.current ?? n - 1;
    if (e.key === 'ArrowLeft') { e.preventDefault(); updateIndex(Math.max(0, idx - 1)); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); updateIndex(Math.min(n - 1, idx + 1)); }
    else if (e.key === 'Escape') updateIndex(null);
  };
  const a11y = scrub ? { tabIndex: 0, role: 'slider' as const, 'aria-valuemin': 0, 'aria-valuemax': n - 1, 'aria-valuenow': scrubIndex ?? n - 1, 'aria-valuetext': `${fmt(points[scrubIndex ?? n - 1]!)}${dates ? ` on ${formatDay(dates[scrubIndex ?? n - 1]!, { day: 'numeric', month: 'short' })}` : ''}`, onKeyDown } : {};
  return (
    <div class="sparkline-wrap" ref={ref} style={scrub ? { touchAction: 'pan-y' } : undefined} {...a11y}>
      <svg class="sparkline" viewBox={`0 0 ${vw} ${height}`} style={{ height: `${height}px` }} aria-hidden="true">
        <path d={d} fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx={lastX} cy={lastY} r="6.5" fill="var(--accent-soft)" />
        <circle cx={lastX} cy={lastY} r="3.5" fill="var(--accent)" />
        {scrub && displayIndex != null && (
          <>
            {/* QA14-1: opacity (not presence) tracks scrubIndex, so release fades the guide out over --dur-fast instead of an instant vanish; reduced() zeroes the transition itself for an instant swap. */}
            <line class="sparkline-guide" x1={x(displayIndex)} x2={x(displayIndex)} y1={0} y2={height} style={{ opacity: scrubIndex != null ? 1 : 0, transitionDuration: `${reduced() ? 0 : durFor('fast')}ms` }} />
            <circle class="sparkline-guide-dot" cx={x(displayIndex)} cy={y(points[displayIndex]!)} r="4" style={{ opacity: scrubIndex != null ? 1 : 0, transitionDuration: `${reduced() ? 0 : durFor('fast')}ms` }} />
          </>
        )}
      </svg>
      {labels && (
        <>
          <div class="sparkline-minmax" ref={labelsRef} style={{ height: `${height}px` }}>
            <span class="num" style={{ top: `${(y(max) / height) * 100}%` }}>{fmt(max)}</span>
            {max !== min && <span class="num" style={{ top: `${(y(min) / height) * 100}%` }}>{fmt(min)}</span>}
          </div>
          {dates && dates.length > 1 && (
            <div class="row-between sparkline-dates">
              <span>{formatDay(dates[0]!, { day: 'numeric', month: 'short' })}</span>
              <span>{formatDay(dates[dates.length - 1]!, { day: 'numeric', month: 'short' })}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
