/**
 * BUG-24: a set BUG-18 holds as implausible reaches neither recovery calibration nor load
 * snapping. Driven through the store, so finishSession's own call site is what is checked.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const remindersMock = vi.hoisted(() => ({ resyncReminders: vi.fn(async () => undefined) }));
vi.mock('@/slices/settings/reminders', () => remindersMock);

import { replaceState, state } from '@/core/store';
import { freshState, type LoggedSet, type RecoveryModel, type Split } from '@/core/models';
import { addSet, commitSet, finishSession, rebuildRecoveryModel, setSet, startSession } from '@/slices/workout/session';
import { suggestNext } from '@/brain/progression';
import { defaultProfile } from '@/brain/units';
import { session } from './helpers';

const SQUAT = 'lib_barbell_back_squat';
const split: Split = { id: 'sq', name: 'Squat', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: SQUAT, sets: 3 }] };
const DAY = 86_400_000;
const T0 = Date.parse('2026-09-01T07:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  replaceState({ ...freshState(), splits: [split] });
});
afterEach(() => { vi.useRealTimers(); });

/** One live session at `at`: every set 5 reps at max effort, a minute and a half apart. */
function train(at: number, loads: number[]): void {
  vi.setSystemTime(at);
  startSession(split);
  for (let j = 3; j < loads.length; j++) addSet(0);
  loads.forEach((kg, j) => { vi.advanceTimersByTime(90_000); setSet(0, j, { kg, reps: 5, effort: 'max' } satisfies Partial<LoggedSet>); commitSet(0, j); });
  vi.advanceTimersByTime(60_000);
  finishSession(false);
}

/** The recovery model finishSession stores for these sessions, from a fresh state. */
function stored(plan: Array<[number, number[]]>): RecoveryModel {
  replaceState({ ...freshState(), splits: [split] });
  for (const [day, loads] of plan) train(T0 + day * DAY, loads);
  expect(state.value.sessions).toHaveLength(plan.length);
  return state.value.recoveryModel;
}

const rebuilt = (): RecoveryModel => rebuildRecoveryModel(state.value);

describe('BUG-24 A1: a held typo set never changes tauScale', () => {
  it('a typo in the session just finished: the model is the one without it, at finish and in a rebuild', () => {
    // 90 after 100 is a real drop (-10 %); the 130 is 30 % above the best load and never repeated.
    const clean = stored([[0, [100, 100, 100]], [3, [90, 90, 90]]]);
    expect(clean.tauScale.quads).toBeGreaterThan(1);
    const typo = stored([[0, [100, 100, 100]], [3, [90, 90, 90, 130]]]);
    expect(typo).toEqual(clean);
    expect(rebuilt()).toEqual(clean);
  });

  it('a typo in the previous session: the model is the one without it, at finish and in a rebuild', () => {
    // A first session has no best load to jump from, so the typo sits in the second.
    const clean = stored([[0, [100, 100, 100]], [3, [100, 100, 100]], [6, [100, 100, 100]]]);
    const typo = stored([[0, [100, 100, 100]], [3, [100, 100, 100, 130]], [6, [100, 100, 100]]]);
    expect(typo.tauScale.quads ?? 1).toBe(clean.tauScale.quads ?? 1);
    expect(typo).toEqual(clean);
    expect(rebuilt()).toEqual(clean);
  });

  it('a heavy set later repeated counts from then on, and the rebuild learns what finish did at each step', () => {
    // At the second finish the 130 is held; the third session repeats it, so it counts there.
    const model = stored([[0, [100, 100, 100]], [3, [90, 90, 90, 130]], [6, [130, 130, 130]]]);
    expect(rebuilt()).toEqual(model);
    // The second step learned the drop (the typo held), exactly as without the 130.
    const twoSteps = stored([[0, [100, 100, 100]], [3, [90, 90, 90]]]);
    expect(twoSteps.tauScale.quads).toBeGreaterThan(1);
  });
});

describe('BUG-24 A2: a held load is not a snap candidate', () => {
  const lat = 'lib_dumbbell_lateral_raise';
  const at = (kg: number, reps: number): LoggedSet => ({ kg, reps, effort: 'ideal' });
  const ctx = { equipment: defaultProfile('Dumbbells', 'kg'), loadFactor: 1.1 };

  it('a 7 kg set held as a rep typo does not make 7 kg loadable', () => {
    const hist = [session('2026-09-12', [{ id: lat, sets: [at(6.5, 13), at(6.5, 13), at(6.5, 12)] }]), session('2026-09-15', [{ id: lat, sets: [at(6.5, 13), at(6.5, 13), at(6.5, 12), at(7, 80)] }])];
    const n = suggestNext(hist, lat, 'lean', '2026-09-18', 3, [], ctx);
    // 6.5 x 1.1 = 7 kg: not on the rack and never really lifted, so it snaps to a real rung.
    expect(n.snappedFromKg).toBe(7);
    expect(n.kg).toBe(8);
  });

  it('control: the same 7 kg set with plausible reps is a real load and stays', () => {
    const hist = [session('2026-09-12', [{ id: lat, sets: [at(6.5, 13), at(6.5, 13), at(6.5, 12)] }]), session('2026-09-15', [{ id: lat, sets: [at(6.5, 13), at(6.5, 13), at(6.5, 12), at(7, 12)] }])];
    const n = suggestNext(hist, lat, 'lean', '2026-09-18', 3, [], ctx);
    expect(n.kg).toBe(7);
    expect(n.snappedFromKg).toBeUndefined();
  });
});

describe('BUG-24: the rebuild judges each step as exerciseHistory over its prefix would', () => {
  it('a session dated before one already judged is judged in day order', async () => {
    const { judgedPair, stepJudge } = await import('@/brain/recovery');
    const { sessionAt } = await import('./helpers');
    const t = (d: number) => new Date(Date.parse('2026-09-01T07:00:00Z') + d * DAY).toISOString();
    const five = (kg: number, n: number): LoggedSet[] => Array.from({ length: n }, () => ({ kg, reps: 5, effort: 'max' }));
    // Started last but dated between the two: its 150 is a jump from 100 (held), not from 130.
    const late = { ...sessionAt(t(6), t(6.05), [{ id: SQUAT, sets: five(150, 1) }]), day: t(3).slice(0, 10) };
    const sorted = [sessionAt(t(0), t(0.05), [{ id: SQUAT, sets: five(100, 3) }]), sessionAt(t(5), t(5.05), [{ id: SQUAT, sets: five(130, 3) }]), late];
    const want = judgedPair(sorted, late.id, SQUAT, []);
    expect(want.cur?.held).toHaveLength(1);
    const judge = stepJudge(sorted, []);
    judge(1, SQUAT);
    expect(judge(2, SQUAT)).toEqual(want);
  });

  it('stepJudge equals judgedPair on the prefix, for random histories with typos, repeats, warm-ups, drops and out-of-order days', async () => {
    const { judgedPair, stepJudge } = await import('@/brain/recovery');
    const { sessionAt } = await import('./helpers');
    let seed = 24;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const pick = <T,>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)]!;
    const IDS = [SQUAT, 'lib_dumbbell_lateral_raise', 'lib_pull_up'];
    for (let run = 0; run < 30; run++) {
      const t0 = Date.parse('2026-01-01T07:00:00Z');
      // Each lift's real load climbs, now and then by a jump that later sessions repeat (a held set confirmed).
      const level = new Map(IDS.map(id => [id, 20]));
      const list = Array.from({ length: 25 }, (_, i) => {
        // Now and then a session dated a day earlier than its start order says.
        const day = t0 + (i * 2 - (rnd() < 0.15 ? 3 : 0)) * DAY;
        const exs = IDS.filter(() => rnd() < 0.7).map(id => {
          level.set(id, level.get(id)! * (rnd() < 0.2 ? 1.3 : 1) + (rnd() < 0.3 ? 2.5 : 0));
          const base = level.get(id)! - (rnd() < 0.2 ? 5 : 0);
          const sets: LoggedSet[] = Array.from({ length: 1 + Math.floor(rnd() * 4) }, () => ({
            kg: rnd() < 0.15 ? base * pick([1.4, 2, 1.3]) : base,
            reps: rnd() < 0.1 ? pick([60, 80, 35]) : 5 + Math.floor(rnd() * 6),
            effort: pick(['max', 'ideal', 'easy'] as const),
            ...(rnd() < 0.1 ? { kind: pick(['warmup', 'drop', 'failure'] as const) } : {}),
          }));
          return { id, sets };
        });
        return sessionAt(new Date(day).toISOString(), new Date(day + 3_600_000).toISOString(), exs);
      });
      const sorted = [...list].sort((x, y) => x.startedAt.localeCompare(y.startedAt));
      const judge = stepJudge(sorted, []);
      sorted.forEach((sess, i) => {
        for (const id of IDS) expect(judge(i, id)).toEqual(judgedPair(sorted.slice(0, i + 1), sess.id, id, []));
      });
    }
  });
});
