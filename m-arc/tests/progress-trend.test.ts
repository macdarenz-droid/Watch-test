import { describe, it, expect } from 'vitest';
import { progressHint, progressTrend, progressValue } from '@/slices/history/progressTrend';
import { exerciseHistory, modeOf } from '@/brain/history';
import { session, sets } from './helpers';

const weekly = (n: number) => Array.from({ length: n }, (_, i) => new Date(Date.UTC(2026, 6, 28 + i * 7)).toISOString().slice(0, 10));
const histOf = (id: string, set: (i: number) => Parameters<typeof session>[1][number]['sets']) =>
  exerciseHistory(weekly(8).map((d, i) => session(d, [{ id, sets: set(i) }])), id);

describe('the Exercise progress card trend follows the lift mode (QA2-FC-1)', () => {
  it('an assisted lift needing less help is improving, not slipping', () => {
    expect(modeOf('lib_assisted_pull_up')).toBe('assisted');
    const h = histOf('lib_assisted_pull_up', i => sets(40 - i * 4, 8, 'ideal', 3));
    expect(progressTrend(h, 'assisted').direction).toBe('up');
    expect(progressTrend(histOf('lib_assisted_pull_up', i => sets(12 + i * 4, 8, 'ideal', 3)), 'assisted').direction).toBe('down');
  });
  it('a hold getting longer is improving, not early', () => {
    expect(modeOf('lib_plank')).toBe('duration');
    const h = histOf('lib_plank', i => [{ durationSec: 30 + i * 10, effort: 'ideal' as const }]);
    expect(progressTrend(h, 'duration').direction).toBe('up');
  });
  it('weighted lifts keep the strength score, and volume for sets over 10 reps', () => {
    expect(progressTrend(histOf('lib_barbell_bench_press', i => sets(80 + i * 2.5, 5, 'ideal', 3)), 'weighted').direction).toBe('up');
    expect(progressTrend(histOf('lib_barbell_bench_press', i => sets(20, 12 + (i >> 1), 'ideal', 3)), 'weighted').direction).toBe('up');
  });
  it('UI-11: four carries of 20/40/60/80 m give a rising distance trend, not a flat line', () => {
    expect(modeOf('lib_farmer_s_carry')).toBe('conditioning');
    const id = 'lib_farmer_s_carry';
    const h = exerciseHistory(weekly(4).map((d, i) => session(d, [{ id, sets: [{ distanceM: (i + 1) * 20, effort: 'ideal' as const }] }])), id);
    expect(h.map(x => progressValue(x, 'conditioning'))).toEqual([20, 40, 60, 80]);
    expect(progressTrend(h, 'conditioning').direction).toBe('up');
  });
});

describe('the card line and hint agree with the trend (QA2-FC-1 follow-up)', () => {
  it('an assisted lift needing less help draws a rising line', () => {
    const pts = histOf('lib_assisted_pull_up', i => sets(40 - i * 4, 8, 'ideal', 3)).map(h => progressValue(h, 'assisted'));
    expect(pts[pts.length - 1]!).toBeGreaterThan(pts[0]!);
    for (let i = 1; i < pts.length; i++) expect(pts[i]!).toBeGreaterThan(pts[i - 1]!);
  });
  it('a hold draws its time, a bodyweight lift its reps', () => {
    expect(histOf('lib_plank', i => [{ durationSec: 30 + i * 10, effort: 'ideal' as const }]).map(h => progressValue(h, 'duration'))).toEqual([30, 40, 50, 60, 70, 80, 90, 100]);
    expect(histOf('lib_pull_up', i => [{ reps: 5 + i, effort: 'ideal' as const }]).map(h => progressValue(h, 'bodyweight'))).toEqual([5, 6, 7, 8, 9, 10, 11, 12]);
  });
  it('the hint names what each mode follows', () => {
    expect(progressHint('assisted')).toMatch(/assistance/);
    expect(progressHint('bodyweight')).toMatch(/reps/);
    expect(progressHint('duration')).toMatch(/hold/);
    expect(progressHint('conditioning')).toMatch(/distance/);
    expect(progressHint('weighted')).toMatch(/one-rep/);
  });
});
