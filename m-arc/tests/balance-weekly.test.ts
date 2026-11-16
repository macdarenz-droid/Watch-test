import { describe, it, expect } from 'vitest';
import { trainingBalance } from '@/brain/balance';
import { trainingStreak, weekSummary } from '@/brain/weekly';
import { coachInsights } from '@/brain/coach/rules';
import { emptySchedule } from '@/core/models';
import { baseCoachExtras, session, sets } from './helpers';

describe('balance', () => {
  it('flags heavy push with no pull over three weeks', () => {
    const days = ['2026-09-01', '2026-09-04', '2026-09-08', '2026-09-11', '2026-09-15'];
    const s = days.map(d => session(d, [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'ideal', 5) }, { id: 'lib_shoulder_press', sets: sets(30, 8, 'ideal', 4) }]));
    const b = trainingBalance(s, '2026-09-18');
    expect(b?.pair).toBe('push_pull');
    expect(b?.weak).toBe('Pull');
  });
  it('stays quiet with balanced work', () => {
    const days = ['2026-09-01', '2026-09-04', '2026-09-08', '2026-09-11', '2026-09-15'];
    const s = days.map(d => session(d, [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'ideal', 4) }, { id: 'lib_lat_pulldown', sets: sets(50, 8, 'ideal', 4) }, { id: 'lib_leg_press', sets: sets(100, 8, 'ideal', 4) }]));
    expect(trainingBalance(s, '2026-09-18')).toBeNull();
  });
});

describe('weekly', () => {
  it('summarises the current week', () => {
    const s = [session('2026-09-14', [{ id: 'lib_barbell_bench_press', sets: sets(60, 8) }]), session('2026-09-16', [{ id: 'lib_barbell_bench_press', sets: sets(62.5, 8) }])];
    const w = weekSummary(s, '2026-09-18');
    expect(w.workouts).toBe(2);
    expect(w.sets).toBe(6);
    expect(w.volumeKg).toBe(60 * 8 * 3 + 62.5 * 8 * 3);
    expect(w.records.length).toBeGreaterThan(0);
    expect(w.grade.title).toBe('Building momentum');
  });
  it('schedule-aware streak ignores rest days and forgives today', () => {
    const schedule = { ...emptySchedule(), mon: 'split_push', wed: 'split_pull', fri: 'split_legs' };
    const s = [session('2026-09-14', [{ id: 'lib_barbell_bench_press', sets: sets(60, 8) }]), session('2026-09-16', [{ id: 'lib_lat_pulldown', sets: sets(60, 8) }])];
    expect(trainingStreak(s, schedule, '2026-09-18')).toBe(2); // Friday not yet done
    expect(trainingStreak(s, schedule, '2026-09-21')).toBe(0); // Friday missed
    expect(trainingStreak(s, emptySchedule(), '2026-09-17')).toBe(1); // yesterday counts, today is forgiven
    expect(trainingStreak(s, emptySchedule(), '2026-09-18')).toBe(0);
    expect(trainingStreak(s, emptySchedule(), '2026-09-16')).toBe(1);
  });
});

describe('coach', () => {
  it('asks for a first session on an empty app', () => {
    const insights = coachInsights({ sessions: [], splits: [], schedule: emptySchedule(), custom: [], today: '2026-09-18', now: Date.now(), ...baseCoachExtras });
    expect(insights[0]?.id).toBe('first-session');
  });
  it('flags missing effort ratings and imbalance with plain words', () => {
    const days = ['2026-09-01', '2026-09-04', '2026-09-08', '2026-09-11', '2026-09-15'];
    const s = days.map(d => session(d, [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, null, 5) }, { id: 'lib_shoulder_press', sets: sets(30, 8, undefined, 4) }]));
    const insights = coachInsights({ sessions: s, splits: [], schedule: emptySchedule(), custom: [], today: '2026-09-18', now: Date.now(), ...baseCoachExtras });
    const ids = insights.map(i => i.id);
    expect(ids).toContain('balance:push_pull');
    expect(ids).toContain('effort-missing');
    for (const i of insights) expect(i.action.length).toBeGreaterThan(10);
  });
});

describe('balance counts exercise sets, not muscles touched (BR-17)', () => {
  it('bench, row and squat at 4 sets each is balanced', () => {
    const days = ['2026-09-01', '2026-09-04', '2026-09-08', '2026-09-11', '2026-09-15'];
    const s = days.map(d => session(d, [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'ideal', 4) }, { id: 'lib_barbell_row', sets: sets(50, 8, 'ideal', 4) }, { id: 'lib_barbell_back_squat', sets: sets(100, 8, 'ideal', 4) }]));
    expect(trainingBalance(s, '2026-09-18')).toBeNull();
  });
  it('push with no pull is flagged', () => {
    const days = ['2026-09-01', '2026-09-04', '2026-09-08', '2026-09-11', '2026-09-15'];
    const s = days.map(d => session(d, [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'ideal', 4) }, { id: 'lib_barbell_back_squat', sets: sets(100, 8, 'ideal', 4) }]));
    expect(trainingBalance(s, '2026-09-18')?.pair).toBe('push_pull');
  });
});

describe('upper vs lower (QA-R3a-3, QA-R3a-4)', () => {
  // Two upper days and two lower days a week for three weeks: 24 upper and 24 lower sets a week.
  const weeks = ['2026-08-31', '2026-09-07', '2026-09-14'];
  const upperDay = (d: string) => session(d, [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'ideal', 3) }, { id: 'lib_barbell_row', sets: sets(50, 8, 'ideal', 3) }, { id: 'lib_barbell_overhead_press', sets: sets(40, 8, 'ideal', 3) }, { id: 'lib_lat_pulldown', sets: sets(50, 8, 'ideal', 3) }]);
  const lowerDay = (d: string) => session(d, [{ id: 'lib_barbell_back_squat', sets: sets(100, 5, 'ideal', 6) }, { id: 'lib_romanian_deadlift', sets: sets(80, 8, 'ideal', 3) }, { id: 'lib_leg_press', sets: sets(150, 10, 'ideal', 3) }]);
  const plus = (d: string, n: number) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  it('an even upper/lower split is balanced', () => {
    const s = weeks.flatMap(w => [upperDay(w), lowerDay(plus(w, 1)), upperDay(plus(w, 3)), lowerDay(plus(w, 4))]);
    expect(trainingBalance(s, '2026-09-19')).toBeNull();
  });
  it('upper work with almost no legs is still flagged, and so is the reverse', () => {
    const noLegs = weeks.flatMap(w => [upperDay(w), upperDay(plus(w, 3)), session(plus(w, 4), [{ id: 'lib_leg_press', sets: sets(150, 10, 'ideal', 2) }])]);
    expect(trainingBalance(noLegs, '2026-09-19')).toMatchObject({ pair: 'upper_lower', strong: 'Upper body' });
    const noUpper = weeks.flatMap(w => [lowerDay(w), lowerDay(plus(w, 3)), session(plus(w, 4), [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'ideal', 2) }, { id: 'lib_barbell_row', sets: sets(50, 8, 'ideal', 2) }])]);
    expect(trainingBalance(noUpper, '2026-09-19')).toMatchObject({ pair: 'upper_lower', strong: 'Lower body' });
  });
});

describe('upper/lower balance text (QA2-FC-8)', () => {
  it('a lower-body-heavy split explains what balanced looks like, so 1.3× reads right', async () => {
    const { trainingBalance } = await import('@/brain/balance');
    const upper = (d: string) => session(d, [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'ideal', 3) }, { id: 'lib_barbell_row', sets: sets(60, 8, 'ideal', 3) }, { id: 'lib_barbell_overhead_press', sets: sets(40, 8, 'ideal', 3) }, { id: 'lib_lat_pulldown', sets: sets(50, 10, 'ideal', 3) }]);
    const lower = (d: string) => session(d, [{ id: 'lib_barbell_back_squat', sets: sets(80, 6, 'ideal', 8) }, { id: 'lib_romanian_deadlift', sets: sets(70, 8, 'ideal', 4) }, { id: 'lib_leg_press', sets: sets(120, 10, 'ideal', 4) }]);
    const days = ['2026-09-01', '2026-09-02', '2026-09-04', '2026-09-05', '2026-09-08', '2026-09-09', '2026-09-11', '2026-09-12', '2026-09-15', '2026-09-16', '2026-09-18', '2026-09-19'];
    const sessions = days.map((d, i) => (i % 2 ? lower(d) : upper(d)));
    const b = trainingBalance(sessions, '2026-09-20');
    expect(b?.pair).toBe('upper_lower');
    expect(b?.weak).toBe('Upper body');
    expect(b?.context).toMatch(/1\.5× as much upper body work/);
  });
});
