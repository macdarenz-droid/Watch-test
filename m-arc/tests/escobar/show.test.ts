import { describe, it, expect } from 'vitest';
import { sampleEvenly, summarize } from '@/escobar/tools/show';
import { exerciseHistory } from '@/brain/history';
import { SHOW_COMPONENT_IDS } from '@/core/models';
import { ctxOf, sixMonthsState, emptyState, NOW } from './fixtures';
import { PPL6 } from '../fixtures/plans';

const six = ctxOf(sixMonthsState());
const sessionId = six.state.sessions.at(-1)!.id;
const PARAMS: Record<string, Record<string, unknown>> = {
  lift_trend: { exerciseId: 'lib_barbell_bench_press', weeks: 12 },
  recovery_map: { at: new Date(NOW + 24 * 3600e3).toISOString() },
  volume_bars: {},
  readiness_gauge: {},
  readiness_history: { days: 14 },
  week_summary: { offsetWeeks: 1 },
  session_summary: { sessionId },
  records_list: { limit: 5 },
  plan_week: {},
  plan_evaluation: { draft: PPL6 },
  exercise_card: { exerciseId: 'lib_barbell_bench_press' },
  heart_session: { sessionId },
  compare_periods: { metric: 'sets', a: { from: '2026-08-01', to: '2026-08-31' }, b: { from: '2026-09-01', to: '2026-09-21' } },
  body_trend: { weeks: 26 },
};

describe('show component summaries (§9)', () => {
  it.each(SHOW_COMPONENT_IDS)('%s summarises the six-month fixture with at most 12 points', c => {
    const s = summarize(c, PARAMS[c]!, six);
    expect(s).toBeTruthy();
    for (const v of Object.values(s)) if (Array.isArray(v) && c !== 'readiness_history' && c !== 'plan_week') expect(v.length).toBeLessThanOrEqual(12);
  });
  it('lift trend has first, last and best from the points drawn', () => {
    const s = summarize('lift_trend', PARAMS.lift_trend!, six) as { points: Array<{ value: number }>; first: number; last: number; best: number };
    expect(s.first).toBe(s.points[0]!.value);
    expect(s.last).toBe(s.points.at(-1)!.value);
    expect(s.best).toBe(Math.max(...s.points.map(p => p.value)));
  });
  it('lift trend over a long window: first, last and best from all of it, 12 points spread evenly (ES-15)', () => {
    const s = summarize('lift_trend', { exerciseId: 'lib_barbell_bench_press', weeks: 52 }, six) as { points: Array<{ day: string; value: number }>; first: number; last: number; best: number };
    const hist = exerciseHistory(six.state.sessions, 'lib_barbell_bench_press');
    expect(hist.length).toBeGreaterThan(12);
    expect(s.points).toHaveLength(12);
    expect(s.points[0]!.day).toBe(hist[0]!.day);
    expect(s.points.at(-1)!.day).toBe(hist.at(-1)!.day);
    expect(s.first).toBe(s.points[0]!.value);
    expect(s.last).toBe(s.points.at(-1)!.value);
    expect(s.best).toBe(Math.max(...hist.map(h => Math.round((h.bestE1rm || h.topKg) * 10) / 10)));
  });
  it('sampleEvenly keeps both ends and spreads the rest', () => {
    expect(sampleEvenly([1, 2, 3], 12)).toEqual([1, 2, 3]);
    const xs = Array.from({ length: 23 }, (_, i) => i);
    expect(sampleEvenly(xs, 12)).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
  });
  it('compare periods reports a delta', () => {
    const s = summarize('compare_periods', PARAMS.compare_periods!, six) as { a: { value: number }; b: { value: number }; delta: number };
    expect(s.delta).toBe(Math.round((s.b.value - s.a.value) * 10) / 10);
  });
  it('empty data gives plain words, not a crash', () => {
    const e = ctxOf(emptyState());
    expect(summarize('lift_trend', { exerciseId: 'lib_barbell_bench_press' }, e).empty).toMatch(/No Barbell Bench Press sessions/);
    expect(summarize('volume_bars', {}, e).empty).toBeTruthy();
    expect(summarize('readiness_gauge', {}, e).empty).toBeTruthy();
  });
  it('rejects bad params with a range', () => {
    expect(() => summarize('lift_trend', { exerciseId: 'lib_barbell_bench_press', weeks: 2 }, six)).toThrow(/4–52/);
    expect(() => summarize('compare_periods', { metric: 'e1rm', a: { from: '2026-08-01', to: '2026-08-31' }, b: { from: '2026-09-01', to: '2026-09-21' } }, six)).toThrow(/exerciseId/);
    expect(() => summarize('bogus', {}, six)).toThrow(/unknown component/);
  });
});

describe('QA3-10: session_summary counts working sets only', () => {
  it('warm-ups are left out of the set count and the effort tally', async () => {
    const { session } = await import('../helpers');
    const s = session('2026-09-10', [{ id: 'lib_barbell_bench_press', sets: [
      { kg: 40, reps: 10, kind: 'warmup', effort: 'easy' },
      { kg: 60, reps: 8, effort: 'ideal' },
      { kg: 60, reps: 8, effort: 'ideal' },
      { kg: 60, reps: 6, effort: 'max' },
    ] }]);
    const ctx = ctxOf({ ...six.state, sessions: [...six.state.sessions, s] });
    const out = summarize('session_summary', { sessionId: s.id }, ctx) as {
      exercises: Array<{ sets: number }>; effort: { easy: number; ideal: number; max: number };
    };
    expect(out.exercises[0]!.sets).toBe(3);
    expect(out.effort).toEqual({ easy: 0, ideal: 2, max: 1 });
  });
});
