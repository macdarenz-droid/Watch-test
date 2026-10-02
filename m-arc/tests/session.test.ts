import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const remindersMock = vi.hoisted(() => ({ resyncReminders: vi.fn(async () => undefined) }));
vi.mock('@/slices/settings/reminders', () => remindersMock);

import { replaceState, state } from '@/core/store';
import { freshState, type AppState, type Session, type Split } from '@/core/models';
import {
  addSet, adjustRest, commitSet, commitSetById, discardSession, finishSession, insertEntry, insertSet, isCommitted, logPastSession, moveEntry, pauseSession,
  rebuildRecoveryModel, removeEntry, removeSet, resolveSessionTiming, setSet, skipEntry, startRest, startSession, stopRest, substituteEntry,
} from '@/slices/workout/session';
import { addExerciseToSplit, deleteSplit, insertExerciseInSplit, removeExerciseFromSplit } from '@/slices/workout/splits';
import { findExercise } from '@/core/exercises';
import { sessionAt, sets, baseCoachExtras } from './helpers';

const split: Split = { id: 'sp', name: 'Push', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: 'lib_barbell_bench_press', sets: 2 }, { exerciseId: 'lib_cable_fly', sets: 1 }] };
const T0 = Date.parse('2026-09-22T10:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  replaceState({ ...freshState(), splits: [split], preferences: { ...freshState().preferences, autoRest: true } });
});
afterEach(() => { vi.useRealTimers(); });

const a = () => state.value.active!;
const start = () => { startSession(split); return a(); };

describe('commit-once sets (UI-01)', () => {
  it('a second blur changes nothing: time, rest, fidelity and the rest timer stay', () => {
    start();
    setSet(0, 0, { kg: 60, reps: 8 });
    vi.advanceTimersByTime(30_000);
    expect(commitSet(0, 0)).toBe(true);
    const first = { ...a().entries[0]!.sets[0]! };
    const endsAt = a().rest!.endsAt;
    vi.advanceTimersByTime(20_000);
    expect(commitSet(0, 0)).toBe(true);
    const again = a().entries[0]!.sets[0]!;
    expect(again.at).toBe(first.at);
    expect(again.restSec).toBe(first.restSec);
    expect(again.fidelity).toBe(first.fidelity);
    expect(a().rest!.endsAt).toBe(endsAt);
  });
  it('a set left empty on blur gives up its commit, so its later real entry gets its own time and rest (QA2-FB-5)', () => {
    start();
    setSet(0, 0, { kg: 60, reps: 8 });
    vi.advanceTimersByTime(30_000);
    commitSet(0, 0);
    vi.advanceTimersByTime(30_000);
    setSet(1, 0, { kg: 20, reps: 10 }); // the wrong set, by mistake
    commitSet(1, 0);
    setSet(1, 0, { reps: undefined, kg: undefined });
    commitSet(1, 0); // the field loses focus with the set empty
    expect(a().entries[1]!.sets[0]!.at).toBeUndefined();
    stopRest();
    vi.advanceTimersByTime(180_000);
    setSet(1, 0, { kg: 20, reps: 10 }); // now for real
    commitSet(1, 0);
    const s = a().entries[1]!.sets[0]!;
    expect(Date.parse(s.at!)).toBe(Date.now());
    expect(s.restSec).toBe(210 - 10 * 3); // BUG-19: the set's own 10 reps (3 s each) are not rest
    expect(a().rest).toBeTruthy();
  });
  // QA-R2b-1 changed this contract: an emptied set is a draft but keeps its commit, so a
  // clear-and-retype correction neither moves its time nor restarts rest.
  it('emptying a committed set makes it a draft that keeps its time; refilling commits it again', () => {
    start();
    setSet(0, 0, { kg: 60, reps: 8 });
    vi.advanceTimersByTime(30_000);
    commitSet(0, 0);
    const first = a().entries[0]!.sets[0]!;
    setSet(1, 0, { kg: 20, reps: 10 });
    vi.advanceTimersByTime(120_000);
    commitSet(1, 0);
    const endsAt = a().rest!.endsAt;
    vi.advanceTimersByTime(45_000);
    setSet(0, 0, { reps: undefined });
    expect(a().entries[0]!.sets[0]!.status).toBe('draft');
    setSet(0, 0, { reps: 6 });
    commitSet(0, 0);
    const s = a().entries[0]!.sets[0]!;
    expect(s).toMatchObject({ reps: 6, status: 'committed', at: first.at, restSec: first.restSec, fidelity: first.fidelity });
    expect(a().rest!.endsAt).toBe(endsAt);
  });
  it('QA3-4: clearing and retyping an earlier set on blur keeps its time and rest', () => {
    start();
    setSet(0, 0, { kg: 60, reps: 8 });
    vi.advanceTimersByTime(30_000);
    commitSet(0, 0);
    const first = { ...a().entries[0]!.sets[0]! };
    vi.advanceTimersByTime(60_000);
    setSet(0, 1, { kg: 60, reps: 8 });
    commitSet(0, 1); // set 1 is now the most recently committed set
    const endsAt = a().rest!.endsAt;
    vi.advanceTimersByTime(20_000);
    // Correcting set 0 (the earlier one): clear it, then the field loses focus while empty.
    setSet(0, 0, { reps: undefined, kg: undefined });
    commitSet(0, 0);
    expect(a().entries[0]!.sets[0]!.at).toBe(first.at);
    expect(a().entries[0]!.sets[0]!.restSec).toBe(first.restSec);
    vi.advanceTimersByTime(5_000);
    setSet(0, 0, { kg: 60, reps: 6 });
    commitSet(0, 0);
    const s = a().entries[0]!.sets[0]!;
    expect(s.at).toBe(first.at);
    expect(s.restSec).toBe(first.restSec);
    expect(a().rest!.endsAt).toBe(endsAt);
  });
  it('addSet carries load and reps, never timing or effort', () => {
    start();
    setSet(1, 0, { kg: 60, reps: 8, effort: 'max' });
    commitSet(1, 0);
    addSet(1);
    const added = a().entries[1]!.sets.at(-1)!;
    expect(added).toMatchObject({ kg: 60, reps: 8 });
    for (const k of ['at', 'restSec', 'fidelity', 'heart', 'flags', 'effort', 'status'] as const) expect(added[k]).toBeUndefined();
    expect(added.id).toBeTruthy();
    expect(added.id).not.toBe(a().entries[1]!.sets[0]!.id);
  });
  it('F7: isCommitted follows the real commit, not just a filled-in draft', () => {
    start();
    setSet(0, 0, { kg: 60, reps: 8 });
    expect(isCommitted(a().entries[0]!.sets[0]!)).toBe(false);
    commitSet(0, 0);
    expect(isCommitted(a().entries[0]!.sets[0]!)).toBe(true);
  });
});

describe('stable ids (R2.8)', () => {
  it('ids survive reorder and finish; the session keeps the live id', () => {
    const live = start();
    const ids = live.entries.map(e => [e.id, ...e.sets.map(s => s.id)]);
    expect(ids.flat().every(Boolean)).toBe(true);
    moveEntry(0, 1);
    expect(a().entries.map(e => e.id)).toEqual([ids[1]![0], ids[0]![0]]);
    setSet(1, 0, { kg: 60, reps: 8 });
    commitSet(1, 0);
    vi.advanceTimersByTime(40 * 60_000);
    const r = finishSession(false)!;
    expect(r.session.id).toBe(live.id);
    const set = r.session.exercises[0]!.sets[0]!;
    expect(set.id).toBe(ids[0]![1]);
    expect(set.status).toBeUndefined();
    expect(r.session.logging).toMatchObject({ trainedAt: live.startedAt });
  });
  it('a substitution creates a new entry id', () => {
    const before = start().entries[0]!.id;
    substituteEntry(0, findExercise('lib_dumbbell_shoulder_press')!);
    expect(a().entries[0]!.id).not.toBe(before);
  });
  it('commitSetById twice gives one commit', () => {
    start();
    const id = a().entries[0]!.sets[0]!.id!;
    setSet(0, 0, { kg: 60, reps: 8 });
    expect(commitSetById(id)).toBe(true);
    const at = a().entries[0]!.sets[0]!.at;
    vi.advanceTimersByTime(5_000);
    expect(commitSetById(id)).toBe(true);
    expect(a().entries[0]!.sets[0]!.at).toBe(at);
  });
  it('actionAt in the past drives the set time, rest and rest timer', () => {
    start();
    setSet(0, 0, { kg: 60, reps: 8 });
    vi.advanceTimersByTime(60_000);
    commitSet(0, 0);
    vi.advanceTimersByTime(240_000);
    setSet(0, 1, { kg: 60, reps: 8 });
    const actionAt = new Date(Date.now() - 120_000).toISOString();
    commitSetById(a().entries[0]!.sets[1]!.id!, { actionAt });
    const s = a().entries[0]!.sets[1]!;
    expect(s.at).toBe(actionAt);
    expect(s.restSec).toBe(120 - 8 * 3); // BUG-19: the set's own 8 reps (3 s each) are not rest
    expect(s.fidelity).toBe('live');
    expect(a().rest!.endsAt).toBe(Date.parse(actionAt) + state.value.preferences.restDefaultSec * 1000);
  });
  it('an old live session without ids gets ids, and no invented times', () => {
    replaceState({ ...freshState(), active: { splitId: 'sp', startedAt: new Date(T0).toISOString(), pausedMs: 0, entries: [{ exerciseId: 'x', name: 'X', sets: [{ kg: 10, reps: 5 }, {}], done: false, skipped: false }] } });
    const live = a();
    expect(live.id).toBeTruthy();
    expect(live.entries[0]!.id).toBeTruthy();
    expect(live.entries[0]!.sets.every(s => s.id && !s.at)).toBe(true);
  });
});

describe('history order and edits (RG-05, UI-11, UI-12)', () => {
  const past = (day: string): Session => sessionAt(`${day}T10:00:00.000Z`, `${day}T11:00:00.000Z`, [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'max') }]);
  it('resolveSessionTiming moves a session into its sorted place', () => {
    const [s1, s2, s3] = [past('2026-09-10'), past('2026-09-12'), past('2026-09-14')];
    replaceState({ ...freshState(), sessions: [s1, s2, s3] });
    resolveSessionTiming(s3.id, '2026-09-11T09:00', 60, 'user');
    expect(state.value.sessions.map(s => s.id)).toEqual([s1.id, s3.id, s2.id]);
  });
  it('a cleared day or time leaves the session as saved (QA-R2c-2, QA-R2d-2)', () => {
    const s1 = past('2026-09-10');
    replaceState({ ...freshState(), sessions: [s1] });
    for (const at of ['T17:00', '2026-09-10T']) {
      expect(() => resolveSessionTiming(s1.id, at, 60, 'schedule')).not.toThrow();
      expect(state.value.sessions[0]!.startedAt).toBe(s1.startedAt);
    }
  });
  it('logPastSession inserts in sorted order', () => {
    const [s1, s2] = [past('2026-09-10'), past('2026-09-14')];
    replaceState({ ...freshState(), splits: [split], sessions: [s1, s2] });
    const r = logPastSession({ splitId: 'sp', trainedAtLocal: '2026-09-12T10:00', durationMin: 45, entries: [{ exerciseId: 'lib_barbell_bench_press', name: 'Bench', sets: [{ kg: 60, reps: 8 }] }] })!;
    expect(state.value.sessions.map(s => s.id)).toEqual([s1.id, r.session.id, s2.id]);
  });
  it('deleting the split of a live session keeps the session', () => {
    start();
    deleteSplit('sp');
    expect(state.value.active).not.toBeNull();
    setSet(0, 0, { kg: 60, reps: 8 });
    commitSet(0, 0);
    expect(finishSession(false)!.session.splitName).toBe('Workout');
  });
  it('the rebuilt recovery model depends only on the sessions left, not their order', () => {
    const list = Array.from({ length: 12 }, (_, i) => past(`2026-08-${String(10 + i * 2).padStart(2, '0')}`));
    const base = { customExercises: [], profile: baseCoachExtras.profile, healthDays: [] };
    const without = list.filter((_, i) => i !== 5);
    expect(rebuildRecoveryModel({ ...base, sessions: [...without].reverse() })).toEqual(rebuildRecoveryModel({ ...base, sessions: without }));
    expect(rebuildRecoveryModel({ ...base, sessions: [] })).toEqual({ tauScale: {}, observations: {} });
  });
});

describe('rest while paused (UI-19)', () => {
  it('adjustRest while paused changes the held time and schedules nothing', () => {
    start();
    startRest(90);
    pauseSession();
    const held = a().rest!.pausedRemainingSec!;
    adjustRest(15);
    expect(a().rest!.pausedRemainingSec).toBe(held + 15);
    adjustRest(-1000);
    expect(a().rest!.pausedRemainingSec).toBe(5);
  });
  it('startRest while paused holds the full rest', () => {
    start();
    pauseSession();
    startRest(120);
    expect(a().rest!.pausedRemainingSec).toBe(120);
  });
});

export type { AppState };

import { logWarmups, setEntryNote, setExerciseNote } from '@/slices/workout/session';
describe('warm-ups, set kinds and notes (F1, F2)', () => {
  it('2 warm-ups + 3 working sets: 5 stored, 3 counted, warm-ups never start rest', () => {
    const three: Split = { ...split, exercises: [{ exerciseId: 'lib_barbell_bench_press', sets: 3 }] };
    replaceState({ ...state.value, splits: [three] });
    startSession(three);
    logWarmups(0, [{ kg: 40, reps: 8 }, { kg: 60, reps: 5 }]);
    logWarmups(0, [{ kg: 40, reps: 8 }]); // once only
    expect(a().entries[0]!.sets.map(x => x.kind ?? 'working')).toEqual(['warmup', 'warmup', 'working', 'working', 'working']);
    vi.advanceTimersByTime(60_000);
    expect(commitSet(0, 0)).toBe(true);
    expect(a().rest).toBeFalsy();
    for (let j = 2; j < 5; j++) { setSet(0, j, { kg: 80, reps: 5 }); vi.advanceTimersByTime(90_000); commitSet(0, j); }
    vi.advanceTimersByTime(60_000);
    commitSet(0, 1);
    const r = finishSession(false, { note: '  good day ' })!;
    const stored = r.session.exercises[0]!.sets;
    expect(stored).toHaveLength(5);
    expect(stored.filter(x => x.kind !== 'warmup')).toHaveLength(3);
    expect(r.session.note).toBe('good day');
  });

  it('a set to failure is stored with max effort; notes carry into history', () => {
    start();
    setSet(0, 0, { kg: 60, reps: 8, kind: 'failure', effort: 'max' });
    commitSet(0, 0);
    setEntryNote(0, 'elbows in');
    setExerciseNote('lib_barbell_bench_press', 'Bench 3, grip ring');
    const r = finishSession(false)!;
    expect(r.session.exercises[0]).toMatchObject({ note: 'elbows in', sets: [{ kind: 'failure', effort: 'max' }] });
    expect(state.value.exerciseNotes.lib_barbell_bench_press).toBe('Bench 3, grip ring');
    setExerciseNote('lib_barbell_bench_press', '   ');
    expect(state.value.exerciseNotes).toEqual({});
  });
});

describe('conditioning inputs (UI-20)', () => {
  it("a farmer's carry stores its distance", () => {
    const carry: Split = { ...split, id: 'sp2', exercises: [{ exerciseId: 'lib_farmer_s_carry', sets: 1 }] };
    replaceState({ ...state.value, splits: [carry] });
    startSession(carry);
    setSet(0, 0, { kg: 32, distanceM: 40, durationSec: 35 });
    expect(commitSet(0, 0)).toBe(true);
    expect(finishSession(false)!.session.exercises[0]!.sets[0]).toMatchObject({ kg: 32, distanceM: 40, durationSec: 35 });
  });
});

describe('recovery calibration sees what the app showed (QA-R2b-3, QA-R2b-5, QA-R2b-6)', () => {
  const benchSplit: Split = { id: 'bp', name: 'Bench', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: 'lib_barbell_bench_press', sets: 3 }] };
  const mk = (i: number, startMs: number, kg: number): Session => { const st = new Date(startMs).toISOString(); return { id: `h${i}`, splitId: 'bp', splitName: 'Bench', day: st.slice(0, 10), startedAt: st, endedAt: new Date(startMs + 3_600_000).toISOString(), durationSec: 3600, exercises: [{ exerciseId: 'lib_barbell_bench_press', name: 'Bench', sets: [{ kg, reps: 5, effort: 'ideal' }, { kg, reps: 5, effort: 'ideal' }, { kg, reps: 5, effort: 'max' }] }], logging: { mode: 'live', flags: [] } as never }; };
  // Bench every 60 h for most of a year: the full history says chest is 91 % recovered, the old 7-day window said 81 %.
  const history = (): { sessions: Session[]; next: number } => { const sessions: Session[] = []; let t = Date.parse('2025-09-01T10:00:00Z'); for (let i = 0; i < 150; i++) { sessions.push(mk(i, t, 100)); t += 60 * 3_600_000; } return { sessions, next: t }; };

  it('a 7 % drop at a well-recovered chest slows chest recovery (finish uses the whole history)', () => {
    const { sessions, next } = history();
    vi.setSystemTime(next);
    replaceState({ ...freshState(), splits: [benchSplit], sessions });
    startSession(benchSplit);
    for (let j = 0; j < 3; j++) { setSet(0, j, { kg: 93, reps: 5, effort: 'max' }); vi.advanceTimersByTime(120_000); commitSet(0, j); }
    finishSession(false);
    expect(state.value.recoveryModel.tauScale.chest).toBeCloseTo(1.1);
  });

  it('a rebuild learns the same, and keeps what a compressed (retro) finish learned', () => {
    const { sessions, next } = history();
    const drop = { ...mk(999, next, 93), exercises: [{ exerciseId: 'lib_barbell_bench_press', name: 'Bench', sets: [{ kg: 93, reps: 5, effort: 'max' as const }] }] };
    const base = { customExercises: [], profile: freshState().profile, healthDays: [] };
    expect(rebuildRecoveryModel({ ...base, sessions: [...sessions, drop] }).tauScale.chest).toBeCloseTo(1.1);
    const compressed = { ...drop, logging: { mode: 'retro', flags: ['compressed'] } as never };
    expect(rebuildRecoveryModel({ ...base, sessions: [...sessions, compressed] }).tauScale.chest).toBeCloseTo(1.1);
    const typedLater = { ...drop, logging: { mode: 'retro', flags: [] } as never };
    expect(rebuildRecoveryModel({ ...base, sessions: [...sessions, typedLater] }).tauScale.chest).toBeUndefined();
  });
});

import { recovery, todayReadiness } from '@/app/selectors';
describe('typing into a live set does not recompute recovery (QA-R2d-1)', () => {
  it('recovery and readiness keep their identity across set edits', () => {
    start();
    const r0 = recovery.value, t0 = todayReadiness.value;
    setSet(0, 0, { kg: 60 });
    setSet(0, 0, { reps: 8 });
    expect(recovery.value).toBe(r0);
    expect(todayReadiness.value).toBe(t0);
    commitSet(0, 0);
    expect(recovery.value).toBe(r0);
  });
});

import { addExerciseToSession, changedFromPlan } from '@/slices/workout/session';
describe('a one-day Escobar change is not a template change (QA-R4a-4)', () => {
  it('skipping an exercise for today does not ask to save the split; adding one yourself does', () => {
    replaceState({ ...state.value, escobar: { ...state.value.escobar, todayOverride: { day: '2026-09-22', splitId: 'sp', reason: 'sore', changes: [{ kind: 'remove', exerciseId: 'lib_cable_fly' }] } } });
    start();
    expect(a().entries.map(e => e.exerciseId)).toEqual(['lib_barbell_bench_press']);
    expect(changedFromPlan(a(), split)).toBe(false);
    setSet(0, 0, { kg: 60, reps: 8 }); commitSet(0, 0);
    expect(finishSession(false)!.changedTemplate).toBe(false);
    replaceState({ ...state.value, splits: [split] });
    start();
    addExerciseToSession(findExercise('lib_dumbbell_lateral_raise')!);
    expect(changedFromPlan(a(), split)).toBe(true);
  });
});

import { plannedExercises, todaySplit } from '@/slices/workout/session';
describe("the brief uses today's plan change (QA-R4a-5, QA-R4a-9)", () => {
  it('drops a removed exercise and carries the load change', () => {
    const o = { day: '2026-09-22', splitId: 'sp', reason: 'sore', changes: [{ kind: 'remove' as const, exerciseId: 'lib_cable_fly' }, { kind: 'load' as const, exerciseId: 'lib_barbell_bench_press', factor: 0.9 }] };
    const t = todaySplit(split, o, '2026-09-22');
    expect(t.exercises).toEqual([{ exerciseId: 'lib_barbell_bench_press', sets: 2, loadFactor: 0.9 }]);
    expect(todaySplit(split, o, '2026-09-23').exercises).toEqual(split.exercises);
  });
});
describe('a swap to an exercise already in the split (QA-R4a-10)', () => {
  it('leaves one entry, not two', () => {
    const o = { day: '2026-09-22', splitId: 'sp', reason: 'x', changes: [{ kind: 'swap' as const, from: 'lib_barbell_bench_press', to: 'lib_cable_fly' }] };
    expect(plannedExercises(split, o, '2026-09-22').map(e => e.exerciseId)).toEqual(['lib_cable_fly']);
  });
});

describe("Save for future leaves out Escobar's one-day change (QA2-FD-2, QA2-FD-7, QA2-FD-9)", () => {
  it('a skip for today stays out of the saved split; the exercise the person added is saved', () => {
    replaceState({ ...state.value, splits: [split], escobar: { ...state.value.escobar, todayOverride: { day: '2026-09-22', splitId: 'sp', reason: 'sore', changes: [{ kind: 'remove', exerciseId: 'lib_cable_fly' }] } } });
    start();
    addExerciseToSession(findExercise('lib_dumbbell_lateral_raise')!);
    setSet(0, 0, { kg: 60, reps: 8 }); commitSet(0, 0);
    finishSession(true);
    expect(state.value.splits[0]!.exercises.map(e => e.exerciseId)).toEqual(['lib_barbell_bench_press', 'lib_cable_fly', 'lib_dumbbell_lateral_raise']);
  });
  it('a swap to itself is no change', () => {
    const o = { day: '2026-09-22', splitId: 'sp', reason: 'x', changes: [{ kind: 'swap' as const, from: 'lib_barbell_bench_press', to: 'lib_barbell_bench_press' }] };
    expect(plannedExercises(split, o, '2026-09-22').map(e => e.exerciseId)).toEqual(split.exercises.map(e => e.exerciseId));
  });
  it("QA3-6: a one-day set-count change from Escobar is not saved; the split keeps its own count", () => {
    replaceState({ ...state.value, splits: [split], escobar: { ...state.value.escobar, todayOverride: { day: '2026-09-22', splitId: 'sp', reason: 'x', changes: [{ kind: 'sets' as const, exerciseId: 'lib_barbell_bench_press', sets: 4 }] } } });
    start();
    expect(a().entries[0]!.sets.length).toBe(4); // today's override applied live
    for (let j = 0; j < 4; j++) { setSet(0, j, { kg: 60, reps: 8 }); commitSet(0, j); }
    setSet(1, 0, { kg: 20, reps: 10 });
    commitSet(1, 0);
    finishSession(true);
    const bench = state.value.splits[0]!.exercises.find(e => e.exerciseId === 'lib_barbell_bench_press')!;
    expect(bench.sets).toBe(2); // the split's own count, not today's 4
  });
  it("QA3-6b: adding sets yourself beyond Escobar's one-day bump still saves what you did", () => {
    replaceState({ ...state.value, splits: [split], escobar: { ...state.value.escobar, todayOverride: { day: '2026-09-22', splitId: 'sp', reason: 'x', changes: [{ kind: 'sets' as const, exerciseId: 'lib_barbell_bench_press', sets: 4 }] } } });
    start();
    expect(a().entries[0]!.sets.length).toBe(4); // today's override applied live
    addSet(0);
    addSet(0);
    expect(a().entries[0]!.sets.length).toBe(6); // the person's own two extra sets
    for (let j = 0; j < 6; j++) { setSet(0, j, { kg: 60, reps: 8 }); commitSet(0, j); }
    setSet(1, 0, { kg: 20, reps: 10 });
    commitSet(1, 0);
    finishSession(true);
    const bench = state.value.splits[0]!.exercises.find(e => e.exerciseId === 'lib_barbell_bench_press')!;
    expect(bench.sets).toBe(6); // what was actually done, not the split's original 2
  });
  it('QA3-7: a split exercise Escobar removed today is restored after its nearest present neighbour', () => {
    const wide: Split = {
      id: 'sp', name: 'Push', color: '#fff', focus: [], createdAt: '',
      exercises: [
        { exerciseId: 'lib_barbell_bench_press', sets: 2 }, // A
        { exerciseId: 'lib_cable_fly', sets: 1 }, // B - the person skips it today
        { exerciseId: 'lib_dumbbell_lateral_raise', sets: 1 }, // C
        { exerciseId: 'lib_dumbbell_shoulder_press', sets: 1 }, // D - Escobar removes it today
        { exerciseId: 'lib_triceps_pushdown', sets: 1 }, // E
      ],
    };
    replaceState({
      ...state.value, splits: [wide],
      escobar: { ...state.value.escobar, todayOverride: { day: '2026-09-22', splitId: 'sp', reason: 'x', changes: [{ kind: 'remove' as const, exerciseId: 'lib_dumbbell_shoulder_press' }] } },
    });
    startSession(wide); // entries: A, B, C, E (D excluded by the override, never even an entry)
    skipEntry(1); // the person's own skip of B, not Escobar's
    setSet(0, 0, { kg: 60, reps: 8 }); commitSet(0, 0);
    setSet(0, 1, { kg: 60, reps: 8 }); commitSet(0, 1);
    setSet(2, 0, { kg: 20, reps: 12 }); commitSet(2, 0);
    setSet(3, 0, { kg: 20, reps: 10 }); commitSet(3, 0);
    finishSession(true);
    expect(state.value.splits[0]!.exercises.map(e => e.exerciseId)).toEqual([
      'lib_barbell_bench_press', 'lib_dumbbell_lateral_raise', 'lib_dumbbell_shoulder_press', 'lib_triceps_pushdown',
    ]);
  });
  it("QA3-8: substituting Escobar's one-day swap replaces the original slot, not adds a fifth exercise", () => {
    replaceState({
      ...state.value, splits: [split],
      escobar: { ...state.value.escobar, todayOverride: { day: '2026-09-22', splitId: 'sp', reason: 'x', changes: [{ kind: 'swap' as const, from: 'lib_barbell_bench_press', to: 'lib_dumbbell_bench_press' }] } },
    });
    start(); // entries: DB bench (today's swap target), cable fly
    expect(a().entries[0]!.exerciseId).toBe('lib_dumbbell_bench_press');
    substituteEntry(0, findExercise('lib_incline_barbell_bench_press')!); // the person's own further swap
    setSet(0, 0, { kg: 40, reps: 8 }); commitSet(0, 0);
    setSet(1, 0, { kg: 20, reps: 10 }); commitSet(1, 0);
    finishSession(true);
    expect(state.value.splits[0]!.exercises.map(e => e.exerciseId)).toEqual([
      'lib_incline_barbell_bench_press', 'lib_cable_fly',
    ]);
  });
  it('QA3-7b: a removed exercise restores after a substituted swap, not before it', () => {
    const three: Split = {
      id: 'sp', name: 'Push', color: '#fff', focus: [], createdAt: '',
      exercises: [
        { exerciseId: 'lib_barbell_bench_press', sets: 2 }, // bench - swapped to DB bench today
        { exerciseId: 'lib_dumbbell_shoulder_press', sets: 1 }, // removed today
        { exerciseId: 'lib_cable_fly', sets: 1 }, // fly
      ],
    };
    replaceState({
      ...state.value, splits: [three],
      escobar: {
        ...state.value.escobar, todayOverride: {
          day: '2026-09-22', splitId: 'sp', reason: 'x',
          changes: [{ kind: 'swap' as const, from: 'lib_barbell_bench_press', to: 'lib_dumbbell_bench_press' }, { kind: 'remove' as const, exerciseId: 'lib_dumbbell_shoulder_press' }],
        },
      },
    });
    startSession(three); // entries: DB bench, fly (shoulder press removed, never an entry)
    substituteEntry(0, findExercise('lib_incline_barbell_bench_press')!); // the person's own further swap
    setSet(0, 0, { kg: 40, reps: 8 }); commitSet(0, 0);
    setSet(1, 0, { kg: 20, reps: 10 }); commitSet(1, 0);
    finishSession(true);
    expect(state.value.splits[0]!.exercises.map(e => e.exerciseId)).toEqual([
      'lib_incline_barbell_bench_press', 'lib_dumbbell_shoulder_press', 'lib_cable_fly',
    ]);
  });
});

describe("QA3-8b: the swap-target substitution is found by lineage, not array position", () => {
  const swapBenchOverride = { day: '2026-09-22', splitId: 'sp', reason: 'x', changes: [{ kind: 'swap' as const, from: 'lib_barbell_bench_press', to: 'lib_dumbbell_bench_press' }] };
  it('reordering the live entries (moveEntry) still keeps the swapped-away bench on save', () => {
    replaceState({ ...state.value, splits: [split], escobar: { ...state.value.escobar, todayOverride: swapBenchOverride } });
    start(); // entries: DB bench, fly
    moveEntry(1, 0); // fly to the top; no substitution happened
    setSet(0, 0, { kg: 20, reps: 10 }); commitSet(0, 0);
    setSet(1, 0, { kg: 40, reps: 8 }); commitSet(1, 0);
    finishSession(true);
    expect(state.value.splits[0]!.exercises.map(e => e.exerciseId)).toEqual(['lib_barbell_bench_press', 'lib_cable_fly']);
  });
  it('removing an earlier entry (removeEntry) still keeps the swapped-away bench on save', () => {
    const three: Split = {
      id: 'sp', name: 'Push', color: '#fff', focus: [], createdAt: '',
      exercises: [{ exerciseId: 'lib_cable_fly', sets: 1 }, { exerciseId: 'lib_barbell_bench_press', sets: 2 }, { exerciseId: 'lib_dumbbell_lateral_raise', sets: 1 }],
    };
    replaceState({ ...state.value, splits: [three], escobar: { ...state.value.escobar, todayOverride: swapBenchOverride } });
    startSession(three); // entries: fly, DB bench, lateral raise
    removeEntry(0); // drop fly
    setSet(0, 0, { kg: 40, reps: 8 }); commitSet(0, 0);
    setSet(1, 0, { kg: 20, reps: 12 }); commitSet(1, 0);
    finishSession(true);
    expect(state.value.splits[0]!.exercises.map(e => e.exerciseId)).toEqual(['lib_barbell_bench_press', 'lib_dumbbell_lateral_raise']);
  });
  it('substituting the swap target back to the original exercise keeps just that one entry', () => {
    replaceState({ ...state.value, splits: [split], escobar: { ...state.value.escobar, todayOverride: swapBenchOverride } });
    start(); // entries: DB bench, fly
    substituteEntry(0, findExercise('lib_barbell_bench_press')!); // back to plain bench
    setSet(0, 0, { kg: 60, reps: 8 }); commitSet(0, 0);
    setSet(1, 0, { kg: 20, reps: 10 }); commitSet(1, 0);
    finishSession(true);
    expect(state.value.splits[0]!.exercises.map(e => e.exerciseId)).toEqual(['lib_barbell_bench_press', 'lib_cable_fly']);
  });
  it('a swap to an exercise already in the split (QA-R4a-10) still restores bench on its own', () => {
    const withDbBench: Split = {
      id: 'sp', name: 'Push', color: '#fff', focus: [], createdAt: '',
      exercises: [{ exerciseId: 'lib_barbell_bench_press', sets: 2 }, { exerciseId: 'lib_dumbbell_bench_press', sets: 2 }, { exerciseId: 'lib_cable_fly', sets: 1 }],
    };
    replaceState({ ...state.value, splits: [withDbBench], escobar: { ...state.value.escobar, todayOverride: swapBenchOverride } });
    startSession(withDbBench); // entries: DB bench, fly (bench was dropped: the split already had DB bench, QA-R4a-10)
    substituteEntry(0, findExercise('lib_incline_barbell_bench_press')!);
    setSet(0, 0, { kg: 40, reps: 8 }); commitSet(0, 0);
    setSet(1, 0, { kg: 20, reps: 10 }); commitSet(1, 0);
    finishSession(true);
    expect(state.value.splits[0]!.exercises.map(e => e.exerciseId)).toEqual([
      'lib_barbell_bench_press', 'lib_incline_barbell_bench_press', 'lib_cable_fly',
    ]);
  });
});

describe('QA3-7c: the wrong spot again after the person\'s own swap (not an Escobar one)', () => {
  it('the person substitutes bench directly (no Escobar swap on it); shoulder press restores after the substitute', () => {
    const three: Split = {
      id: 'sp', name: 'Push', color: '#fff', focus: [], createdAt: '',
      exercises: [
        { exerciseId: 'lib_barbell_bench_press', sets: 2 },
        { exerciseId: 'lib_dumbbell_shoulder_press', sets: 1 }, // removed today
        { exerciseId: 'lib_cable_fly', sets: 1 },
      ],
    };
    replaceState({
      ...state.value, splits: [three],
      escobar: { ...state.value.escobar, todayOverride: { day: '2026-09-22', splitId: 'sp', reason: 'x', changes: [{ kind: 'remove' as const, exerciseId: 'lib_dumbbell_shoulder_press' }] } },
    });
    startSession(three); // entries: bench, fly (shoulder press removed, never an entry)
    substituteEntry(0, findExercise('lib_incline_barbell_bench_press')!); // the person's own swap, not Escobar's
    setSet(0, 0, { kg: 40, reps: 8 }); commitSet(0, 0);
    setSet(1, 0, { kg: 20, reps: 10 }); commitSet(1, 0);
    finishSession(true);
    expect(state.value.splits[0]!.exercises.map(e => e.exerciseId)).toEqual([
      'lib_incline_barbell_bench_press', 'lib_dumbbell_shoulder_press', 'lib_cable_fly',
    ]);
  });
  it("Escobar swaps bench; the person separately swaps row for pulldown", () => {
    const three: Split = {
      id: 'sp', name: 'Push', color: '#fff', focus: [], createdAt: '',
      exercises: [
        { exerciseId: 'lib_barbell_row', sets: 2 },
        { exerciseId: 'lib_barbell_bench_press', sets: 2 }, // swapped to DB bench today
        { exerciseId: 'lib_cable_fly', sets: 1 },
      ],
    };
    replaceState({
      ...state.value, splits: [three],
      escobar: { ...state.value.escobar, todayOverride: { day: '2026-09-22', splitId: 'sp', reason: 'x', changes: [{ kind: 'swap' as const, from: 'lib_barbell_bench_press', to: 'lib_dumbbell_bench_press' }] } },
    });
    startSession(three); // entries: row, DB bench, fly
    substituteEntry(0, findExercise('lib_lat_pulldown')!); // the person's own swap of row, unrelated to Escobar's
    setSet(0, 0, { kg: 40, reps: 10 }); commitSet(0, 0);
    setSet(1, 0, { kg: 20, reps: 8 }); commitSet(1, 0);
    setSet(2, 0, { kg: 15, reps: 12 }); commitSet(2, 0);
    finishSession(true);
    expect(state.value.splits[0]!.exercises.map(e => e.exerciseId)).toEqual([
      'lib_lat_pulldown', 'lib_barbell_bench_press', 'lib_cable_fly',
    ]);
  });
});

describe('finishSession resyncs reminders (QA8-3)', () => {
  it('calls resyncReminders once, so a stale same-day reminder gets cancelled', () => {
    start();
    setSet(0, 0, { kg: 60, reps: 8 });
    commitSet(0, 0);
    remindersMock.resyncReminders.mockClear();
    finishSession(false);
    expect(remindersMock.resyncReminders).toHaveBeenCalledTimes(1);
  });
});

describe('F10/QA10-2: Undo restores by identity, not index', () => {
  it('happy path: insertEntry restores the exact removed entry at its position', () => {
    const before = structuredClone(start().entries);
    const removed = a().entries[0]!;
    removeEntry(0);
    insertEntry(a().id!, 0, removed);
    expect(a().entries).toEqual(before);
  });

  it('Repro A: Undo is a no-op once the session has moved on (discard + a new session)', () => {
    start();
    const removed = a().entries[0]!;
    const sessionAId = a().id!;
    removeEntry(0);
    discardSession();
    startSession(split); // session B
    const beforeB = structuredClone(a().entries);
    insertEntry(sessionAId, 0, removed);
    expect(a().entries).toEqual(beforeB);
    expect(a().entries.some(e => e.id === removed.id)).toBe(false);
  });

  it('a second Undo tap (duplicate entry id) is a no-op', () => {
    start();
    const removed = a().entries[0]!;
    removeEntry(0);
    const sessionId = a().id!;
    insertEntry(sessionId, 0, removed);
    insertEntry(sessionId, 0, removed);
    expect(a().entries.filter(e => e.id === removed.id).length).toBe(1);
  });

  it('happy path: insertSet restores the exact removed set at its position', () => {
    start();
    setSet(0, 0, { kg: 60, reps: 8 }); commitSet(0, 0); // give the entry a real committed set too
    const before = structuredClone(a().entries[0]!.sets);
    const entryId = a().entries[0]!.id!;
    const removed = a().entries[0]!.sets[0]!;
    removeSet(0, 0);
    insertSet(a().id!, entryId, 0, removed);
    expect(a().entries[0]!.sets).toEqual(before);
  });

  it('Repro B: Undo targets the set\'s own entry by id, not whichever entry now sits at that index after a reorder', () => {
    start(); // entries: bench (0, 2 sets), fly (1, 1 set)
    const benchId = a().entries[0]!.id!;
    const removed = a().entries[0]!.sets[0]!;
    removeSet(0, 0); // bench: 1 set left
    moveEntry(0, 1); // reorder: fly is now first, bench is now second
    insertSet(a().id!, benchId, 0, removed);
    const bench = a().entries.find(e => e.id === benchId)!;
    const fly = a().entries.find(e => e.id !== benchId)!;
    expect(bench.sets.some(s => s.id === removed.id)).toBe(true);
    expect(fly.sets.some(s => s.id === removed.id)).toBe(false);
  });

  it('insertSet is a no-op once the entry itself is gone', () => {
    start();
    const entryId = a().entries[0]!.id!;
    const removed = a().entries[0]!.sets[0]!;
    removeSet(0, 0);
    removeEntry(0);
    const beforeEntries = structuredClone(a().entries);
    insertSet(a().id!, entryId, 0, removed);
    expect(a().entries).toEqual(beforeEntries);
  });

  it('a second Undo tap (duplicate set id) is a no-op', () => {
    start();
    const entryId = a().entries[0]!.id!;
    const removed = a().entries[0]!.sets[0]!;
    removeSet(0, 0);
    const sessionId = a().id!;
    insertSet(sessionId, entryId, 0, removed);
    insertSet(sessionId, entryId, 0, removed);
    const entry = a().entries.find(e => e.id === entryId)!;
    expect(entry.sets.filter(s => s.id === removed.id).length).toBe(1);
  });

  it('happy path: insertExerciseInSplit restores the exact removed exercise at its position', () => {
    const before = structuredClone(state.value.splits[0]!.exercises);
    const se = before[0]!;
    removeExerciseFromSplit(split.id, se.exerciseId);
    insertExerciseInSplit(split.id, 0, se);
    expect(state.value.splits[0]!.exercises).toEqual(before);
  });

  it("Repro C: insertExerciseInSplit is a no-op once the exercise is already back (added from the picker)", () => {
    const se = state.value.splits[0]!.exercises[0]!;
    removeExerciseFromSplit(split.id, se.exerciseId);
    addExerciseToSplit(split.id, findExercise(se.exerciseId)!); // re-added from the picker, a fresh call
    const beforeUndo = structuredClone(state.value.splits[0]!.exercises);
    insertExerciseInSplit(split.id, 0, se); // a stale Undo tap
    expect(state.value.splits[0]!.exercises).toEqual(beforeUndo);
    expect(state.value.splits[0]!.exercises.filter(x => x.exerciseId === se.exerciseId).length).toBe(1);
  });

  it('insertExerciseInSplit is a no-op once the split itself is gone', () => {
    const se = state.value.splits[0]!.exercises[0]!;
    removeExerciseFromSplit(split.id, se.exerciseId);
    deleteSplit(split.id);
    insertExerciseInSplit(split.id, 0, se);
    expect(state.value.splits.find(s => s.id === split.id)).toBeUndefined();
  });
});
