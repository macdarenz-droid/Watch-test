/**
 * O4: "Work done, by effort" — a stacked bar per session (easy/right/max/unrated), shared between
 * History's Exercise progress card and Escobar's lift_trend chart.
 */
import { useEffect, useRef } from 'preact/hooks';
import type { ResistanceMode } from '@/core/models';
import type { ExerciseSessionSummary } from '@/brain/history';
import { effortLabel } from '@/brain/exposure';
import { formatDay } from '@/core/dates';

export interface EffortPoint { day: string; easy: number; ideal: number; max: number; unrated: number; }

const TALLEST_PX = 120;

/**
 * Timed/distance/carry work has no kg × reps to split, so the bars count working sets instead
 * (F13). QA13-2: a carry or sled logs kg and distance/time with no reps, so kg alone (with reps
 * defaulting to 0) isn't "has kg" — it must have both, or every bar is a 0-height stub.
 */
export function effortUsesSets(history: ExerciseSessionSummary[], mode: ResistanceMode): boolean {
  if (mode === 'duration') return true;
  if (mode === 'conditioning') return !history.some(h => h.sets.some(s => (s.kg ?? 0) > 0 && (s.reps ?? 0) > 0));
  return false;
}

/**
 * Per session, split working-set kg (load × reps) into effort buckets. A set to failure counts as
 * max (F2). Bodyweight/assisted moves use the F13 effective load: `bwAt(day, addedKg)` must return
 * that load already scaled by body-weight share, or null (no body weight saved / not shared with
 * Escobar), in which case the set counts as 0 kg — the same rule Stats uses. Timed/distance/carry
 * exercises with no kg count sets (1 per working set) instead.
 */
export function effortSplit(history: ExerciseSessionSummary[], mode: ResistanceMode, bwAt: (day: string, addedKg: number) => number | null): EffortPoint[] {
  const useSets = effortUsesSets(history, mode);
  return history.map(h => {
    const p: EffortPoint = { day: h.day, easy: 0, ideal: 0, max: 0, unrated: 0 };
    for (const set of h.sets) {
      const load = mode === 'bodyweight' || mode === 'assisted' ? bwAt(h.day, set.kg ?? 0) : (set.kg ?? 0);
      const amount = useSets ? 1 : (load ?? 0) * (set.reps ?? 0);
      const effort = effortLabel(set);
      if (effort === 'easy') p.easy += amount;
      else if (effort === 'ideal') p.ideal += amount;
      else if (effort === 'max') p.max += amount;
      else p.unrated += amount;
    }
    return p;
  });
}

/** OBS-TONNE: the "t" short form is a metric tonne (1,000 kg) — only right when the unit is kg. */
export const fmtTotal = (v: number, unit: string): string => {
  if (unit === 'sets') return String(Math.round(v));
  if (unit === 'kg' && v >= 10_000) return `${(Math.round(v / 100) / 10).toLocaleString()}t`;
  return Math.round(v).toLocaleString();
};

/**
 * `tappable=false` (Escobar) renders plain divs at a fixed 120px, no selection. History passes
 * `tappable` with `selected`/`onSelect` so a tap can reveal that session's logged sets.
 */
export function EffortBars({ points, unit, tappable = true, selected = null, onSelect }: { points: EffortPoint[]; unit: string; tappable?: boolean; selected?: number | null; onSelect?: (i: number) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSets = unit === 'sets';
  const totals = points.map(p => p.easy + p.ideal + p.max + p.unrated);
  const tallest = Math.max(1, ...totals);
  const hasUnrated = points.some(p => p.unrated > 0);
  const bestI = totals.reduce((best, v, i) => (v > totals[best]! ? i : best), 0);
  const latest = points[points.length - 1];
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollLeft = el.scrollWidth; }, [points.length]);
  if (!points.length) return null;
  const Tag = tappable ? 'button' : 'div';
  return (
    <div class="effort-chart">
      <div class="effort-legend hint">
        <span class="effort-swatch easy" />Easy · <span class="effort-swatch ideal" />Right · <span class="effort-swatch max" />Max
        {hasUnrated && <> · <span class="effort-swatch unrated" />Not rated</>}
      </div>
      <div class="effort-bars" ref={scrollRef}>
        {points.map((p, i) => {
          const total = totals[i]!;
          const scale = tallest > 0 ? TALLEST_PX / tallest : 0;
          return (
            <Tag key={p.day} type={tappable ? 'button' : undefined} class="effort-bar-col" aria-pressed={tappable ? selected === i : undefined} onClick={tappable ? () => onSelect?.(i) : undefined}>
              <span class="effort-bar-total num">{fmtTotal(total, unit)}</span>
              <div class="effort-bar-stack" style={{ height: `${Math.max(2, total * scale)}px` }}>
                {p.easy > 0 && <i class="easy" style={{ height: `${p.easy * scale}px` }} />}
                {p.ideal > 0 && <i class="ideal" style={{ height: `${p.ideal * scale}px` }} />}
                {p.max > 0 && <i class="max" style={{ height: `${p.max * scale}px` }} />}
                {p.unrated > 0 && <i class="unrated" style={{ height: `${p.unrated * scale}px` }} />}
              </div>
              <span class="effort-bar-date">{formatDay(p.day, { day: 'numeric', month: 'short' })}</span>
            </Tag>
          );
        })}
      </div>
      <p class="hint">
        Most work: {fmtTotal(totals[bestI]!, unit)} {isSets ? 'sets' : unit} on {formatDay(points[bestI]!.day, { day: 'numeric', month: 'short' })}.
        {latest && latest.max === 0 && ' Latest session had no max sets.'}
      </p>
    </div>
  );
}
