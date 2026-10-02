import { describe, it, expect } from 'vitest';
import { CSV_HEADER, csvField, sessionsToCsv } from '@/slices/settings/exportCsv';
import { trainingStreak, plannedThisWeek } from '@/brain/weekly';
import { adherenceRate } from '@/brain/coach/weeklyReview';
import { findExercise } from '@/core/exercises';
import { repairState } from '@/core/store';
import { emptySchedule, freshState } from '@/core/models';
import { session, sets } from './helpers';

describe('CSV export (RG-17)', () => {
  it('writes exact rows with entered lb values, kinds, notes and RFC 4180 quoting', () => {
    const s = { ...session('2026-09-20', [{ id: 'lib_barbell_bench_press', name: 'Bench, flat', sets: [{ kg: 20.412, entered: { value: 45, unit: 'lb' as const }, reps: 10, kind: 'warmup' as const }, { kg: 61.235, entered: { value: 135, unit: 'lb' as const }, reps: 8, effort: 'ideal' as const }, { reps: 0 }] }]), splitName: 'Push "A"', note: 'felt strong' };
    s.exercises[0]!.note = 'elbows in';
    const csv = sessionsToCsv([s], 'lb');
    expect(csv.split('\r\n')).toEqual([
      CSV_HEADER,
      '2026-09-20,"Push ""A""","Bench, flat",1,45,lb,10,,warmup,,,elbows in',
      '2026-09-20,"Push ""A""","Bench, flat",2,135,lb,8,ideal,,,,',
      '2026-09-20,"Push ""A""",,,,,,,,,,felt strong',
      '',
    ]);
  });
  it('filters by day and quotes line breaks', () => {
    const a = session('2026-06-01', [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'ideal', 1) }]);
    const b = session('2026-09-01', [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'ideal', 1) }]);
    expect(sessionsToCsv([a, b], 'kg', '2026-08-01').split('\r\n').filter(Boolean)).toHaveLength(2);
    expect(csvField('a\nb')).toBe('"a\nb"');
    expect(csvField(undefined)).toBe('');
  });
});

describe('days off (RG-19, D4)', () => {
  const schedule = { ...emptySchedule(), mon: 'sp', wed: 'sp', fri: 'sp' };
  // 2026-09-14 Mon, 16 Wed, 18 Fri, 21 Mon, 23 Wed.
  const trained = ['2026-09-14', '2026-09-16', '2026-09-18', '2026-09-23'].map(d => session(d, [{ id: 'lib_barbell_bench_press', sets: sets(60, 8) }]));
  it('a scheduled day taken off keeps the streak', () => {
    expect(trainingStreak(trained, schedule, '2026-09-23')).toBe(1);
    expect(trainingStreak(trained, schedule, '2026-09-23', ['2026-09-21'])).toBe(4);
  });
  it('adherence and this week\'s target leave it out', () => {
    expect(adherenceRate(trained, schedule, '2026-09-23', 10)).toBeCloseTo(4 / 5);
    expect(adherenceRate(trained, schedule, '2026-09-23', 10, ['2026-09-21'])).toBe(1);
    expect(plannedThisWeek(schedule, [], '2026-09-23')).toBe(3);
    expect(plannedThisWeek(schedule, ['2026-09-21'], '2026-09-23')).toBe(2);
  });
  it('normalize keeps valid, unique, sorted days and caps at 400', () => {
    const many = Array.from({ length: 450 }, (_, i) => new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10));
    const out = repairState({ ...freshState(), daysOff: ['bad', '2026-09-21', '2026-09-21', 3 as never, ...many] as never }).state;
    expect(out.daysOff).toHaveLength(400);
    expect(out.daysOff).toEqual([...out.daysOff].sort());
    expect(out.daysOff.includes('bad')).toBe(false);
    expect(repairState({ ...freshState(), daysOff: undefined as never }).state.daysOff).toEqual([]);
  });
});

describe('exercise library (RG-04, D5)', () => {
  it('every phase-9 id resolves with the expected mode', () => {
    const conditioning = ['lib_burpee', 'lib_mountain_climbers', 'lib_jumping_jacks', 'lib_high_knees', 'lib_jump_rope', 'lib_box_jump', 'lib_battle_ropes', 'lib_medicine_ball_slam', 'lib_wall_ball', 'lib_bear_crawl', 'lib_jump_squat', 'lib_sled_push', 'lib_sled_pull', 'lib_farmer_s_carry'];
    for (const id of conditioning) expect(findExercise(id)?.mode, id).toBe('conditioning');
    for (const id of ['lib_plank', 'lib_side_plank', 'lib_wall_sit', 'lib_hollow_body_hold']) expect(findExercise(id)?.mode, id).toBe('duration');
    for (const id of ['lib_kettlebell_swing', 'lib_renegade_row', 'lib_resistance_band_row', 'lib_pike_push_up', 'lib_inverted_row', 'lib_bird_dog']) expect(findExercise(id)?.id, id).toBe(id);
    expect(findExercise('lib_pistol_squat')?.mode).toBe('bodyweight');
  });
});

describe('notes normalize (F1)', () => {
  it('keeps trimmed string notes up to 200 characters', () => {
    const out = repairState({ ...freshState(), exerciseNotes: { a: '  seat 4 ', b: 5, c: '', d: 'x'.repeat(300) } as never }).state;
    expect(out.exerciseNotes).toEqual({ a: 'seat 4', d: 'x'.repeat(200) });
  });
});

import { weekSummary } from '@/brain/weekly';
import * as R from '@/escobar/tools/read';
import { ctxOf } from './escobar/fixtures';
describe('a week whose planned days are all off (QA-R6-4, QA-R6-10, QA-R6-12)', () => {
  const satOnly = { ...emptySchedule(), sat: 'sp' };
  const wed = [session('2026-09-23', [{ id: 'lib_barbell_bench_press', sets: sets(60, 8) }])];
  it('keeps a Strong week when the only planned day is taken off after training', () => {
    expect(weekSummary(wed, '2026-09-26', [], plannedThisWeek(satOnly, [], '2026-09-26')).grade.title).toBe('Strong week');
    expect(weekSummary(wed, '2026-09-26', [], plannedThisWeek(satOnly, ['2026-09-26'], '2026-09-26')).grade.title).toBe('Strong week');
  });
  it('no schedule at all still aims for 3', () => {
    expect(plannedThisWeek(emptySchedule(), [], '2026-09-26')).toBeNull();
    expect(weekSummary(wed, '2026-09-26', [], null).grade.title).toBe('Started');
  });
  it("Escobar's overview leaves days off out of planned", () => {
    const st = { ...freshState(), schedule: { ...emptySchedule(), mon: 'sp', wed: 'sp', fri: 'sp' }, daysOff: ['2026-09-23'] };
    const o = R.getOverview({}, { ...ctxOf(st as never), today: '2026-09-22' }) as { week: { planned: number } };
    expect(o.week.planned).toBe(2);
  });
});
