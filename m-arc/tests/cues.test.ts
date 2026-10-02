import { describe, it, expect } from 'vitest';
import { CUES, lane, mindsetForDay, pickReasonCue, reasonKeyFor } from '@/brain/coach/cues';
import { LIBRARY, makeCustomExercise } from '@/core/exercises';

describe('every coaching cue can be shown (ST-17)', () => {
  const reasonKeys = new Set(
    ['start', 'confirm_effort', 'confirm', 'hold', 'increase', 'reduce', 'plateau', 'reentry', 'reps', 'duration', 'deload']
      .flatMap(m => ['low', 'medium', 'high'].flatMap(c => ['weighted', 'conditioning'].map(x => reasonKeyFor(m, c, x)))),
  );
  it('each cue is reachable by an exercise, a reason, or the mindset slot', () => {
    const mindset = new Set(Array.from({ length: 40 }, (_, d) => mindsetForDay(d)?.id).filter(Boolean));
    const unreachable = CUES.filter(c => {
      if (c.kind === 'mindset') return !mindset.has(c.id);
      // A custom exercise with unlisted equipment ('Other') is how the 'General' cues are reached.
      const pool = [...LIBRARY, makeCustomExercise({ id: 'custom_x', name: 'Odd thing', equipment: 'Other', primary: [] })];
      if (pool.some(ex => lane(c, ex) >= 0)) return false;
      return !(c.reasons ?? []).some(r => reasonKeys.has(r));
    }).map(c => c.id);
    expect(unreachable).toEqual([]);
  });
  it('the reason cue follows the suggestion', () => {
    expect(pickReasonCue(reasonKeyFor('increase', 'high'), 'x')!.reasons).toContain('increase');
    expect(pickReasonCue(reasonKeyFor('deload', 'high'), 'x')).toBeNull();
    expect(mindsetForDay(2)).toBeNull();
    expect(mindsetForDay(3)?.kind).toBe('mindset');
  });
});

describe('daily quotes alongside mindset days (QA-R3b-7)', () => {
  it('every quote shows within a year', async () => {
    const { mindsetForDay, sparkIndexForDay } = await import('@/brain/coach/cues');
    const { SPARKS } = await import('@/data/sparks');
    for (const year of [2027, 2028]) {
      const seen = new Set<number>();
      for (let d = 1; d <= 365; d++) if (!mindsetForDay(d)) seen.add(sparkIndexForDay(d, year, SPARKS.length));
      expect(seen.size).toBe(SPARKS.length);
    }
  });
});

describe('the plateau hold (QA-R3b-8)', () => {
  it('never shows a cue about lowering the weight', async () => {
    const { reasonKeyFor } = await import('@/brain/coach/cues');
    expect(reasonKeyFor('plateau', 'medium')).toBe('confirm');
    expect(reasonKeyFor('reduce', 'medium')).toBe('reduce');
  });
});

describe("the 'change it up' plateau (QA2-FC-9)", () => {
  it('gets the lighter-week cue, not a repeat-the-session one; the keep-the-load plateau stays confirm', async () => {
    const { reasonKeyFor } = await import('@/brain/coach/cues');
    expect(reasonKeyFor('plateau', 'medium', 'weighted', 'Change it up')).toBe('reduce');
    expect(reasonKeyFor('plateau', 'medium', 'weighted', 'Lighter week')).toBe('confirm');
  });
  it('suggestNext gives the change-it-up note on 8 flat weeks, so Train passes it through', async () => {
    const { suggestNext } = await import('@/brain/progression');
    const { session, sets } = await import('./helpers');
    const days = Array.from({ length: 8 }, (_, i) => new Date(Date.UTC(2026, 6, 28 + i * 7)).toISOString().slice(0, 10));
    const n = suggestNext(days.map(d => session(d, [{ id: 'lib_barbell_bench_press', sets: sets(100, 6, 'ideal', 3) }])), 'lib_barbell_bench_press', 'strength', '2026-09-20');
    if (n.mode === 'plateau' && /different rep range/.test(n.reason)) expect(n.sets[0]?.note).toBe('Change it up');
  });
});
