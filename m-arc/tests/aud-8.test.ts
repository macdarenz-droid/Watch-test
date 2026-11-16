/**
 * AUD-8: targets and records across modes (codex audit SCI-04, SCI-05, SCI-08, UI-12).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';

const remindersMock = vi.hoisted(() => ({ resyncReminders: vi.fn(async () => undefined) }));
vi.mock('@/slices/settings/reminders', () => remindersMock);
// UI-12: a red-readiness day, as the audit's repro used, without building the health inputs for one.
vi.mock('@/app/selectors', async orig => ({ ...(await orig<typeof import('@/app/selectors')>()), todayReadiness: { value: { loadAdvice: 'reduce' } } }));

import { suggestNext } from '@/brain/progression';
import { liftTrend, plateauStatus } from '@/brain/trend';
import { recordsFor } from '@/brain/prs';
import { exerciseHistory, summarizeSets } from '@/brain/history';
import { defaultProfile } from '@/brain/units';
import { replaceState, state } from '@/core/store';
import { freshState, type LoggedSet, type Split } from '@/core/models';
import { addDays, weekdayOf } from '@/core/dates';
import { startSession } from '@/slices/workout/session';
import { insightTarget } from '@/slices/coach/Coach';
import { activeDeload, todayReadiness, recovery, today as todaySignal } from '@/app/selectors';
import { recoveryPctFor } from '@/brain/recovery';
import { loadMenu, loggedLoads } from '@/brain/units';
import { profileFor } from '@/slices/workout/units';
import { findExercise } from '@/core/exercises';
import { session, sets } from './helpers';

const today = '2026-09-18';
const red = { readiness: { loadAdvice: 'reduce' as const }, recoveryPct: 10 };

describe('AUD-8 SCI-04: a red-readiness day adds nothing and drops a set in every mode', () => {
  const cases: Array<[string, LoggedSet[], (s: ReturnType<typeof suggestNext>) => number | null]> = [
    ['lib_pull_up', sets(0, 8).map(x => ({ reps: x.reps, effort: x.effort })), s => s.reps?.[1] ?? null],
    ['lib_assisted_pull_up', sets(30, 8), s => s.reps?.[1] ?? null],
    ['lib_plank', [1, 2, 3].map(() => ({ durationSec: 30, effort: 'ideal' as const })), s => s.sets[0]?.durationSec ?? null],
    ['lib_farmer_s_carry', [1, 2, 3].map(() => ({ kg: 20, distanceM: 20, effort: 'ideal' as const })), s => Number(/(\d+) m$/.exec(s.target)?.[1] ?? NaN)],
  ];
  for (const [id, logged, measure] of cases) {
    it(`${id}: holds its last number with one fewer set`, () => {
      const last = session('2026-09-16', [{ id, sets: logged }]);
      const normal = suggestNext([last], id, 'lean', today, 3, []);
      const s = suggestNext([last], id, 'lean', today, 3, [], red);
      const before = id === 'lib_plank' ? 30 : id === 'lib_farmer_s_carry' ? 20 : 8;
      expect(measure(normal)).toBeGreaterThan(before);
      expect(measure(s)).toBe(before);
      expect(s.sets).toHaveLength(2);
      expect(s.cutSets).toBe(true);
    });
  }
  it('bench, the reference: one fewer set at the same load', () => {
    const s = suggestNext([session('2026-09-16', [{ id: 'lib_barbell_bench_press', sets: sets(60, 8) }])], 'lib_barbell_bench_press', 'lean', today, 3, [], red);
    expect(s.sets).toHaveLength(2);
    expect(s.kg).toBe(60);
  });
  it('a timed hold after a long break repeats its time', () => {
    const s = suggestNext([session('2026-07-01', [{ id: 'lib_plank', sets: [{ durationSec: 30, effort: 'ideal' }] }])], 'lib_plank', 'lean', today);
    expect(s.sets[0]?.durationSec).toBe(30);
    expect(s.confidence).toBe('low');
  });
});

describe('AUD-8 SCI-05: assisted progress and rep records at matched help', () => {
  const ASSIST = 'lib_assisted_pull_up';
  it('a hard set falling from 40 to 26 kg of help trends up, whatever the back-off sets did', () => {
    const days = ['2026-07-24', '2026-07-31', '2026-08-07', '2026-08-14', '2026-08-21', '2026-08-28', '2026-09-04', '2026-09-11'];
    const sessions = days.map((d, i) => session(d, [{ id: ASSIST, sets: [{ kg: 40 - 2 * i, reps: 8, effort: 'ideal' }, { kg: 50 + 2 * i, reps: 8, effort: 'ideal' }] }]));
    const hist = exerciseHistory(sessions, ASSIST);
    expect(liftTrend(hist, 'assisted').direction).toBe('up');
    expect(plateauStatus(hist, 'assisted', today).status).toBe('progressing');
  });
  it('more reps with more help is no rep record', () => {
    const prior = exerciseHistory([session('2026-09-10', [{ id: ASSIST, sets: [{ kg: 20, reps: 8, effort: 'ideal' }] }])], ASSIST);
    const cur = summarizeSets('c', today, [{ kg: 60, reps: 9, effort: 'ideal' }]);
    expect(recordsFor(cur, prior, 'assisted', ASSIST, 'Assisted pull-up').some(r => r.kind === 'best_reps')).toBe(false);
  });
  it('more reps at the same or less help is still a rep record', () => {
    const prior = exerciseHistory([session('2026-09-10', [{ id: ASSIST, sets: [{ kg: 20, reps: 8, effort: 'ideal' }] }])], ASSIST);
    const cur = summarizeSets('c', today, [{ kg: 20, reps: 9, effort: 'ideal' }, { reps: 9, effort: 'ideal' }]);
    expect(recordsFor(cur, prior, 'assisted', ASSIST, 'Assisted pull-up').find(r => r.kind === 'best_reps')?.value).toBe(9);
  });
  it('a bodyweight rep record ignores sets with more added load before', () => {
    const prior = exerciseHistory([session('2026-09-10', [{ id: 'lib_pull_up', sets: [{ kg: 20, reps: 5, effort: 'ideal' }] }])], 'lib_pull_up');
    const lighter = summarizeSets('c', today, [{ reps: 6, effort: 'ideal' }]);
    expect(recordsFor(lighter, prior, 'bodyweight', 'lib_pull_up', 'Pull-up').some(r => r.kind === 'best_reps')).toBe(false);
  });
});

describe('AUD-8 SCI-08: a substitute starts from the replaced lift\'s e1RM, on the menu\'s rungs', () => {
  const db = defaultProfile('Dumbbells', 'kg');
  const start = (reps: number, rungs?: number[]) => suggestNext([session('2026-09-15', [{ id: 'lib_barbell_bench_press', sets: sets(60, reps) }])], 'lib_dumbbell_bench_press', 'lean', today, 3, [], {
    equipment: db, replacedExerciseId: 'lib_barbell_bench_press',
    ...(rungs ? { menu: { profile: db, rungsKg: rungs, unit: 'kg' as const, confidence: 'learned' as const, source: 'default' as const } } : {}),
  });
  it('60 kg x 3 and 60 kg x 10 give different targets', () => {
    const a = start(3), b = start(10);
    expect(a.mode).toBe('start');
    expect(b.mode).toBe('start');
    expect([a.kg, a.reps?.[0]]).not.toEqual([b.kg, b.reps?.[0]]);
    expect(b.kg!).toBeGreaterThan(a.kg!);
  });
  it('the start lands on a learned rung the profile ladder does not have', () => {
    const s = start(8, [20, 23, 26, 29]);
    expect(s.kg).toBe(26);
  });
  it('a red-readiness day keeps that learned rung', () => {
    const s = suggestNext([session('2026-09-15', [{ id: 'lib_barbell_bench_press', sets: sets(60, 8) }])], 'lib_dumbbell_bench_press', 'lean', today, 3, [], {
      ...red, equipment: db, replacedExerciseId: 'lib_barbell_bench_press', menu: { profile: db, rungsKg: [20, 23, 26, 29], unit: 'kg', confidence: 'learned', source: 'default' },
    });
    expect(s.kg).toBe(26);
  });
});

describe('AUD-8 UI-12: the insight target equals the live target', () => {
  const BENCH = 'lib_barbell_bench_press';
  const split: Split = { id: 'push', name: 'Push', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: BENCH, sets: 3 }] };
  beforeEach(() => {
    const day = todaySignal.value;
    const s = freshState();
    replaceState({ ...s, splits: [split], schedule: { ...s.schedule, [weekdayOf(day)]: 'push' }, sessions: [session(addDays(day, -6), [{ id: BENCH, sets: sets(60, 12) }]), session(addDays(day, -3), [{ id: BENCH, sets: sets(60, 12) }])] });
  });

  it('on a red-readiness day both read 60 kg for two sets', () => {
    const coach = insightTarget(state.value, BENCH);
    startSession(split);
    const s = state.value;
    const entry = s.active!.entries[0]!;
    const gymId = s.active!.gymId ?? s.units.activeGymId;
    // Train.tsx EntryCard's context, input for input.
    const live = suggestNext(s.sessions, BENCH, s.goal, todaySignal.value, entry.sets.filter(x => x.kind !== 'warmup').length || 1, s.customExercises, {
      readiness: todayReadiness.value, recoveryPct: recoveryPctFor(BENCH, s.customExercises, recovery.value), deload: activeDeload.value, lastDeload: s.deload,
      equipment: profileFor(BENCH, gymId), menu: loadMenu(BENCH, gymId, s.units, findExercise(BENCH), loggedLoads(s.sessions, BENCH, s.customExercises)),
    });
    expect(live.kg).toBe(60);
    expect(live.sets).toHaveLength(2);
    expect({ target: coach.target, kg: coach.kg, sets: coach.sets }).toEqual({ target: live.target, kg: live.kg, sets: live.sets });
    expect(insightTarget(state.value, BENCH)).toEqual(live);
    // The context the insight used before AUD-8 (lighter week and equipment only) gave a heavier day.
    const before = suggestNext(s.sessions, BENCH, s.goal, todaySignal.value, 3, s.customExercises, { deload: activeDeload.value, lastDeload: s.deload, equipment: profileFor(BENCH) });
    expect([before.kg, before.sets.length]).toEqual([62.5, 3]);
  });
  it('each day of the schedule sheet names its select', () => {
    const src = readFileSync('src/slices/coach/Coach.tsx', 'utf8');
    expect(src).toMatch(/<select class="grow" aria-label=\{WEEKDAY_LABEL\[d\]\}/);
  });
});
