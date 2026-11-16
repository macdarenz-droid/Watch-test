/** LT-3: the stored target (D-A4 a), the post-session verdict and the next-session rule of §4 (a). */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const remindersMock = vi.hoisted(() => ({ resyncReminders: vi.fn(async () => undefined) }));
vi.mock('@/slices/settings/reminders', () => remindersMock);

import { suggestNext } from '@/brain/progression';
import { exerciseHistory, restateOffPlan } from '@/brain/history';
import { planVerdictInsights, postSessionInsights } from '@/brain/coach/post';
import { repairState, replaceState, state, withTarget } from '@/core/store';
import { freshState, type LoggedSet, type Session, type Split } from '@/core/models';
import { active, commitSet, finishSession, setEntryTarget, setSet, startSession, substituteEntry } from '@/slices/workout/session';
import { findExercise } from '@/core/exercises';
import { session, sets } from './helpers';

const EX = 'lib_barbell_bench_press';
const today = '2026-09-28';
const withPlan = (s: Session, kg: number, reps: number): Session => ({ ...s, exercises: s.exercises.map(e => ({ ...e, target: { kg, reps } })) });
const day = (d: string, kg: number, reps: number, effort: LoggedSet['effort'], plan?: [number, number]) => {
  const s = session(d, [{ id: EX, sets: sets(kg, reps, effort) }]);
  return plan ? withPlan(s, plan[0], plan[1]) : s;
};

describe('LT3-A6: the next session per §4 (a)', () => {
  it('32 × 5 at max against a 27.5 × 8 plan → "27.5 kg for 8 to 9", not 32 as the base', () => {
    const s = suggestNext([day('2026-09-25', 32, 5, 'max', [27.5, 8])], EX, 'lean', today);
    expect(s.kg).toBe(27.5);
    expect(s.reps).toEqual([8, 9]);
    expect(s.repWindow).toEqual([8, 9]);
    expect(s.sets.every(x => x.kg === 27.5)).toBe(true);
    expect(s.reason).toBe('Last time was 32 kg against a 27.5 kg plan. Back on the plan: 27.5 kg for 8 to 9.');
  });
  it('an older session with no stored target keeps today\'s rule: 32 is the base', () => {
    expect(suggestNext([day('2026-09-25', 32, 5, 'max')], EX, 'lean', today).kg).toBe(32);
  });
  it('a session on the plan is not restated', () => {
    const s = suggestNext([day('2026-09-25', 27.5, 8, 'ideal', [27.5, 8])], EX, 'lean', today);
    expect([s.kg, s.reps]).toEqual([27.5, [9, 9]]);
  });
  it('a load chosen twice becomes the base when its own reps fall inside the window', () => {
    const two = [day('2026-09-22', 32, 8, 'ideal', [27.5, 8]), day('2026-09-25', 32, 8, 'ideal', [27.5, 8])];
    expect(suggestNext(two, EX, 'lean', today).kg).toBe(32);
    // With a rung inside the window (30 for 10 to 11) a single choice is restated, a second one is not.
    const rungs = [25, 27.5, 30, 32.5];
    expect(restateOffPlan(exerciseHistory(two.slice(1), EX), [6, 12], 2, rungs)?.kg).toBe(30);
    expect(restateOffPlan(exerciseHistory(two, EX), [6, 12], 2, rungs)).toBeNull();
  });
  it('a load chosen twice outside the window does not: the plan holds and the reason says so', () => {
    const s = suggestNext([day('2026-09-22', 32, 5, 'max', [27.5, 8]), day('2026-09-25', 32, 5, 'max', [27.5, 8])], EX, 'lean', today);
    expect(s.kg).toBe(27.5);
    expect(s.reason).toBe('32 kg twice now, but it is good for about 3 reps, outside your 6–12 range. The plan stays: 27.5 kg for 8 to 9.');
  });
  it('twice means the last two sessions: an older off-plan session between on-plan ones does not count', () => {
    const s = suggestNext([day('2026-09-19', 32, 5, 'max', [27.5, 8]), day('2026-09-22', 27.5, 8, 'ideal', [27.5, 8]), day('2026-09-25', 32, 5, 'max', [27.5, 8])], EX, 'lean', today);
    expect(s.kg).toBe(27.5);
    expect(s.reason).toMatch(/^Last time was 32 kg against a 27.5 kg plan/);
  });
  it('restates on the rung nearest the plan whose reps fall inside [lo, hi]', () => {
    // 32 × 8 ideal: 27.5 re-solves to 14 (over 12), so the nearest rung inside is 30, for 10 to 11.
    const hist = exerciseHistory([day('2026-09-25', 32, 8, 'ideal', [27.5, 8])], EX);
    expect(restateOffPlan(hist, [6, 12], 2, [25, 27.5, 30, 32.5])).toMatchObject({ kg: 30, repWindow: [10, 11] });
    expect(restateOffPlan(hist, [6, 12], 2, [])).toBeNull();
  });
  it('a restatement never raises the load on a hold day (review, fix round 1)', () => {
    // Last session under the plan: bench 50 × 10 ideal against a stored 55 × 8 target.
    const under = [day('2026-09-25', 50, 10, 'ideal', [55, 8])];
    for (const ctx of [{ readiness: { loadAdvice: 'no_increase' } as never }, { recoveryPct: 10 }]) {
      const s = suggestNext(under, EX, 'lean', today, 3, [], ctx);
      expect(s.kg).toBe(50);
      expect(s.reason).not.toMatch(/Back on the plan/);
    }
    // An ordinary day restates up to the plan; a restatement down (above the plan) holds on a hold day too.
    expect(suggestNext(under, EX, 'lean', today).kg).toBe(55);
    const above = suggestNext([day('2026-09-25', 32, 5, 'max', [27.5, 8])], EX, 'lean', today, 3, [], { readiness: { loadAdvice: 'no_increase' } as never });
    expect(above.kg).toBe(27.5);
  });
  it('a lighter week or a return week still wins over the restatement (earlier branches)', () => {
    const s = suggestNext([day('2026-09-25', 32, 5, 'max', [27.5, 8])], EX, 'lean', today, 3, [], { readiness: { loadAdvice: 'reduce', reason: 'Low' } as never });
    expect(s.cutSets).toBe(true);
  });
});

describe('LT3-A5: the post-session verdict line', () => {
  const s = (kg: number, reps: number, effort: LoggedSet['effort']) => withPlan(session('2026-09-25', [{ id: EX, name: 'Bench', sets: sets(kg, reps, effort) }]), 27.5, 8);
  it('above the plan: estimated strength up about 2 %', () => {
    const [v] = planVerdictInsights(s(32, 5, 'max'), 'lean');
    expect(v!.noticed).toBe('Planned 27.5 × 8, did 32 × 5: estimated strength up about 2 %.');
  });
  it('below the plan: the next target holds', () => {
    expect(planVerdictInsights(s(27.5, 5, 'ideal'), 'lean')[0]!.noticed).toBe('Planned 27.5 × 8, did 27.5 × 5: below plan, the next target holds.');
  });
  it('no line on plan, or without a stored target', () => {
    expect(planVerdictInsights(s(27.5, 8, 'ideal'), 'lean')).toEqual([]);
    expect(planVerdictInsights(session('2026-09-25', [{ id: EX, sets: sets(32, 5, 'max') }]), 'lean')).toEqual([]);
  });
  it('it reaches the debrief, and records are unchanged by it', () => {
    const ins = postSessionInsights({ session: s(32, 5, 'max'), priorSessions: [], custom: [], isStrengthGoal: false, goal: 'lean' });
    expect(ins.some(i => i.id.startsWith('post:verdict:'))).toBe(true);
    const plain = session('2026-09-25', [{ id: EX, name: 'Bench', sets: sets(32, 5, 'max') }]);
    const records = (x: Session) => postSessionInsights({ session: x, priorSessions: [], custom: [], isStrengthGoal: false }, 20).filter(i => i.id.includes(':record:')).map(i => i.noticed);
    expect(records(withPlan(plain, 27.5, 8))).toEqual(records(plain));
  });
});

describe('D-A4 (a): the target is stored at commit and kept when the session finishes', () => {
  const split: Split = { id: 'b', name: 'Bench', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: EX, sets: 3 }] };
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(Date.parse('2026-09-25T07:00:00Z')); replaceState({ ...freshState(), splits: [split] }); });
  afterEach(() => { vi.useRealTimers(); });
  it('setEntryTarget keeps the first target only, and finishSession saves it on the exercise', () => {
    startSession(split);
    setSet(0, 0, { kg: 32, reps: 5, effort: 'max' });
    commitSet(0, 0);
    const id = active()!.entries[0]!.id;
    setEntryTarget(id, { kg: 27.5, reps: 8 });
    setEntryTarget(id, { kg: 30, reps: 6 });
    expect(active()!.entries[0]!.target).toEqual({ kg: 27.5, reps: 8 });
    vi.advanceTimersByTime(120_000);
    finishSession(false);
    expect(state.value.sessions.at(-1)!.exercises[0]!.target).toEqual({ kg: 27.5, reps: 8 });
  });
  it('a substitution drops the replaced lift\'s target, so the new lift stores its own', () => {
    startSession(split);
    setSet(0, 0, { kg: 32, reps: 5, effort: 'max' });
    commitSet(0, 0);
    setEntryTarget(active()!.entries[0]!.id, { kg: 27.5, reps: 8 });
    substituteEntry(0, findExercise('lib_dumbbell_bench_press')!);
    expect(active()!.entries[0]!.target).toBeUndefined();
    setEntryTarget(active()!.entries[0]!.id, { kg: 22.5, reps: 10 });
    expect(active()!.entries[0]!.target).toEqual({ kg: 22.5, reps: 10 });
  });
  it('repairState drops a malformed target on an active entry and keeps a valid one', () => {
    const entry = (id: string, target: unknown) => ({ id, exerciseId: EX, name: 'Bench', sets: [], done: false, skipped: false, target });
    const raw = { ...freshState(), active: { id: 'a1', splitId: 'b', startedAt: '2026-09-25T07:00:00.000Z', pausedMs: 0, entries: [entry('e1', { kg: 'x', reps: 8 }), entry('e2', { kg: 27.5, reps: 8 })] } };
    const entries = repairState(raw as never).state.active!.entries;
    expect('target' in entries[0]!).toBe(false);
    expect(entries[1]!.target).toEqual({ kg: 27.5, reps: 8 });
  });
  it('the normalize rule drops a malformed target and keeps a valid one', () => {
    expect(withTarget({ target: { kg: 27.5, reps: 8 } })).toEqual({ target: { kg: 27.5, reps: 8 } });
    for (const bad of [null, 'x', { kg: '27.5', reps: 8 }, { kg: 27.5, reps: 8.5 }, { kg: -1, reps: 8 }, { kg: 27.5 }, { kg: Infinity, reps: 8 }]) {
      expect(withTarget({ target: bad })).toEqual({});
    }
    const s = day('2026-09-25', 32, 5, 'max');
    const bad = { ...s, exercises: s.exercises.map(e => ({ ...e, target: { kg: 'no' } })) };
    const good = withPlan(day('2026-09-26', 32, 5, 'max'), 27.5, 8);
    const out = repairState({ ...freshState(), sessions: [bad, good] as never }).state.sessions;
    expect('target' in out[0]!.exercises[0]!).toBe(false);
    expect(out[1]!.exercises[0]!.target).toEqual({ kg: 27.5, reps: 8 });
  });
});
