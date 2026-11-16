/**
 * AUD-10: live workout, finish and past logging (audit UI-01, UI-05, UI-06).
 * The UI-only criteria (past-session hold/carry fields, the time sheet staying open, keyboard
 * substitutes, input names and keyboard reorder) are probed in the gate's "AUD-10" block.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const remindersMock = vi.hoisted(() => ({ resyncReminders: vi.fn(async () => undefined) }));
vi.mock('@/slices/settings/reminders', () => remindersMock);

import { replaceState, state } from '@/core/store';
import { freshState, type Split } from '@/core/models';
import { findExercise } from '@/core/exercises';
import { commitSet, finishCounts, finishSession, logPastSession, resolveSessionTiming, setSet, skipEntry, startSession } from '@/slices/workout/session';
import { addGym, profileFor, setExerciseUnit } from '@/slices/workout/units';
import { entryTarget, liveUnitActions, previewTargets } from '@/slices/workout/Train';
import { today } from '@/app/clock';
import { session, sets } from '../helpers';

const BENCH = 'lib_barbell_bench_press';
const FLY = 'lib_cable_fly';
const split: Split = { id: 'sp', name: 'Push', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: BENCH, sets: 3 }, { exerciseId: FLY, sets: 2 }] };
const T0 = Date.parse('2026-09-22T10:00:00.000Z');

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(T0); replaceState({ ...freshState(), splits: [split], sessions: [] }); });
afterEach(() => { vi.useRealTimers(); });

describe('AUD-10 UI-01: Skip today keeps the sets already logged', () => {
  it('commit 60 x 8, Skip today, Finish: the set is saved and the counters match the saved session', () => {
    startSession(split);
    setSet(0, 0, { kg: 60, reps: 8 }); commitSet(0, 0);
    setSet(0, 1, { kg: 60, reps: 6 }); // typed, never logged: skipped with the rest
    skipEntry(0);
    const counts = finishCounts(state.value.active!);
    const r = finishSession(false);
    expect(r).not.toBeNull();
    const bench = r!.session.exercises.find(e => e.exerciseId === BENCH)!;
    expect(bench.sets.map(s => [s.kg, s.reps])).toEqual([[60, 8]]);
    expect(state.value.sessions).toHaveLength(1);
    const saved = state.value.sessions[0]!.exercises;
    expect(counts).toEqual({ exercises: saved.length, sets: saved.reduce((n, e) => n + e.sets.length, 0) });
    expect(counts).toEqual({ exercises: 1, sets: 1 });
  });

  it('the counters leave out a skipped exercise with nothing logged, like the save', () => {
    startSession(split);
    setSet(0, 0, { kg: 60, reps: 8 }); commitSet(0, 0);
    setSet(1, 0, { kg: 20, reps: 12 }); // typed on the fly, then the fly is skipped
    skipEntry(1);
    expect(finishCounts(state.value.active!)).toEqual({ exercises: 1, sets: 1 });
    expect(finishSession(false)!.session.exercises.map(e => e.exerciseId)).toEqual([BENCH]);
  });
});

describe('AUD-10 UI-05: a completed workout cannot start in the future', () => {
  const finishOne = () => {
    startSession(split);
    setSet(0, 0, { kg: 60, reps: 8 }); commitSet(0, 0);
    return finishSession(false)!.session;
  };

  it('resolveSessionTiming with a future start returns false and leaves the session as saved', () => {
    const saved = finishOne();
    expect(resolveSessionTiming(saved.id, '2027-01-01T10:00', 60, 'user')).toBe(false);
    expect(state.value.sessions[0]).toEqual(saved);
  });

  it('a past start still resolves (control)', () => {
    const saved = finishOne();
    expect(resolveSessionTiming(saved.id, '2026-09-21T17:00', 60, 'user')).toBe(true);
    expect(state.value.sessions[0]!.day).toBe('2026-09-21');
  });

  it('logPastSession refuses a future start too', () => {
    expect(logPastSession({ splitId: 'sp', trainedAtLocal: '2027-01-01T10:00', durationMin: 60, entries: [{ exerciseId: BENCH, name: 'Bench', sets: [{ kg: 60, reps: 8 }] }] })).toBeNull();
    expect(state.value.sessions).toEqual([]);
  });
});

describe('AUD-10 UI-06: live kg/lb taps change the session gym', () => {
  it('with gym B made active during gym A session, a kg -> lb flip changes A, not B', () => {
    const gymA = state.value.units.activeGymId;
    startSession(split);
    const gymB = addGym('Other gym', 'kg')!; // adding a gym makes it active, as Make active does
    // Each gym has its own saved kg profile (the audit's repro).
    setExerciseUnit(BENCH, 'kg', 'user', gymA);
    setExerciseUnit(BENCH, 'kg', 'user', gymB);
    expect(state.value.units.activeGymId).toBe(gymB);
    expect(state.value.active!.gymId).toBe(gymA);
    const saved = (gym: string) => state.value.units.byExercise[gym]?.[BENCH]?.unit;
    const ex = findExercise(BENCH, [])!;
    const live = liveUnitActions(BENCH, ex, profileFor(BENCH, gymA).unit);
    live.flip();
    expect([saved(gymA), saved(gymB)]).toEqual(['lb', 'kg']);
    live.fixUnit('kg');
    expect([saved(gymA), saved(gymB)]).toEqual(['kg', 'kg']);
    liveUnitActions(BENCH, ex, 'kg').flipGroup();
    expect(Object.values(state.value.units.byEquipment[gymA] ?? {}).map(p => p?.unit)).toEqual(['lb']);
    expect(state.value.units.byEquipment[gymB] ?? {}).toEqual({});
  });
});

describe('AUD-10 add-on (UI-12): Train previews and the live card build one target', () => {
  it('an Escobar-swapped exercise, same day: preview target === live target, and both carry the swap over', () => {
    const DB = 'lib_dumbbell_bench_press';
    const day = '2026-09-22';
    const one: Split = { id: 'sp', name: 'Push', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: BENCH, sets: 3 }] };
    replaceState({
      ...freshState(), splits: [one],
      sessions: [session('2026-09-18', [{ id: BENCH, sets: sets(80, 8, 'ideal', 3) }], 'sp'), session('2026-09-15', [{ id: BENCH, sets: sets(77.5, 8, 'ideal', 3) }], 'sp')],
      escobar: { ...freshState().escobar, todayOverride: { day, splitId: 'sp', reason: 'x', changes: [{ kind: 'swap' as const, from: BENCH, to: DB }] } },
    });
    today.value = day;
    const rows = previewTargets(state.value, one);
    expect(rows.map(r => r.se.exerciseId)).toEqual([DB]);
    const preview = rows[0]!.next;
    startSession(one);
    const live = entryTarget(state.value, state.value.active!.entries[0]!);
    expect(preview).toEqual(live);
    // The bench history carries over (LT-6, about 32.5 kg a hand), not the first-time load the
    // dumbbell press gets alone (2 kg, "Start light").
    expect(preview.kg).toBeGreaterThan(20);
  });
});
