import { describe, it, expect } from 'vitest';
import { emptySchedule, type EquipmentProfile, type LoggedSet } from '@/core/models';
import { suggestNext, RETURN_CUT } from '@/brain/progression';
import { coachInsights } from '@/brain/coach/rules';
import { baseCoachExtras, session } from './helpers';

// ADAPT-3: a machine pec fly is an accessory; the strength_muscle goal gives it 8-12 reps.
const ex = 'lib_pec_fly';
const goal = 'strength_muscle';
const today = '2026-09-18';
const set = (reps: number, effort?: LoggedSet['effort'], kg = 40): LoggedSet => (effort ? { kg, reps, effort } : { kg, reps });
const at = (day: string, s: LoggedSet[]) => session(day, [{ id: ex, sets: s }]);
const next = (s: ReturnType<typeof at>[], day = today, equipment?: EquipmentProfile) => suggestNext(s, ex, goal, day, 3, [], equipment ? { equipment } : undefined);

describe('ADAPT-3 A-1: progress from reps when few sets are rated', () => {
  it('P1: 3×12 at 40 kg twice, 1 of 3 rated ideal, no rep drop → one standard step', () => {
    const s = next([at('2026-09-12', [set(12, 'ideal'), set(12), set(12)]), at('2026-09-15', [set(12, 'ideal'), set(12), set(12)])]);
    expect(s.mode).toBe('increase');
    expect(s.kg).toBe(42.5);
  });
  it('P1: no ratings at all, flat reps at the top twice → one step', () => {
    const s = next([at('2026-09-12', [set(12), set(12), set(12)]), at('2026-09-15', [set(12), set(12), set(12)])]);
    expect(s.mode).toBe('increase');
    expect(s.kg).toBe(42.5);
  });
  it('P1 bound: top once with few ratings never takes the fast track', () => {
    const days = ['2026-09-06', '2026-09-09', '2026-09-12'];
    const s = next([...days.map(d => at(d, [set(10), set(10), set(10)])), at('2026-09-15', [set(12, 'easy'), set(12, 'easy'), set(12, 'easy')])]);
    expect(s.mode).not.toBe('increase');
    expect(s.kg).toBe(40);
  });
  it('P2 (failure path): reps 12, 10, 8 → no increase, asks to rate', () => {
    const s = next([at('2026-09-12', [set(12, 'ideal'), set(10), set(8)]), at('2026-09-15', [set(12, 'ideal'), set(10), set(8)])]);
    expect(s.mode).toBe('confirm_effort');
    expect(s.kg).toBe(40);
  });
  it('P2 (failure path): 14, 13, 12 loses 2 reps, all at the top → no increase', () => {
    const s = next([at('2026-09-12', [set(14, 'ideal'), set(13), set(12)]), at('2026-09-15', [set(14, 'ideal'), set(13), set(12)])]);
    expect(s.mode).toBe('confirm_effort');
  });
  it('P2: one session at the top at a different load does not count', () => {
    const s = next([at('2026-09-12', [set(12, 'ideal', 37.5), set(12, undefined, 37.5), set(12, undefined, 37.5)]), at('2026-09-15', [set(12, 'ideal'), set(12), set(12)])]);
    expect(s.mode).toBe('confirm_effort');
  });
  it('P3: a max-rated set in the last session → no increase', () => {
    const s = next([at('2026-09-12', [set(12, 'ideal'), set(12), set(12)]), at('2026-09-15', [set(12), set(12), set(12, 'max')])]);
    expect(s.mode).not.toBe('increase');
    expect(s.kg).toBe(40);
  });
  it('safety: amber readiness still holds the load on a rep-earned step', () => {
    const h = [at('2026-09-12', [set(12, 'ideal'), set(12), set(12)]), at('2026-09-15', [set(12, 'ideal'), set(12), set(12)])];
    const s = suggestNext(h, ex, goal, today, 3, [], { readiness: { loadAdvice: 'no_increase' } });
    expect(s.mode).toBe('confirm');
    expect(s.kg).toBe(40);
  });
});

describe('ADAPT-3 A-9: step down without "max" ratings', () => {
  it('P4a: top reps 6 then 5, 2 of 3 rated ideal, last set unrated → one step down', () => {
    const s = next([at('2026-09-12', [set(6, 'ideal'), set(6, 'ideal'), set(6)]), at('2026-09-15', [set(5, 'ideal'), set(5, 'ideal'), set(5)])]);
    expect(s.mode).toBe('reduce');
    expect(s.kg).toBe(37.5);
    expect(s.reason).not.toMatch(/max effort/);
  });
  it('P4b: 1 of 3 rated (coverage under 0.5) → one step down, not "rate your sets"', () => {
    const s = next([at('2026-09-12', [set(6, 'ideal'), set(6), set(6)]), at('2026-09-15', [set(5, 'ideal'), set(5), set(5)])]);
    expect(s.mode).toBe('reduce');
    expect(s.kg).toBe(37.5);
  });
  it('P4: "max" alone stays sufficient', () => {
    const s = next([at('2026-09-12', [set(6, 'ideal'), set(6, 'ideal'), set(6, 'max')]), at('2026-09-15', [set(5, 'ideal'), set(5, 'ideal'), set(5, 'max')])]);
    expect(s.mode).toBe('reduce');
    expect(s.reason).toMatch(/max effort/);
  });
  it('P5 (failure path): under the range on one session only → no step down', () => {
    const s = next([at('2026-09-12', [set(8, 'ideal'), set(8, 'ideal'), set(8)]), at('2026-09-15', [set(5, 'ideal'), set(5, 'ideal'), set(5)])]);
    expect(s.mode).not.toBe('reduce');
    expect(s.kg).toBe(40);
  });
  it('P5 (failure path): an "easy"-rated last set → no step down', () => {
    const s = next([at('2026-09-12', [set(6, 'ideal'), set(6, 'ideal'), set(6, 'easy')]), at('2026-09-15', [set(5, 'ideal'), set(5, 'ideal'), set(5, 'easy')])]);
    expect(s.mode).not.toBe('reduce');
  });
  it('P5 (failure path): an "easy"-rated earlier set with the last set unrated → no step down', () => {
    const s = next([at('2026-09-12', [set(6, 'easy'), set(6, 'ideal'), set(6)]), at('2026-09-15', [set(5, 'easy'), set(5, 'ideal'), set(5)])]);
    expect(s.mode).not.toBe('reduce');
  });
  it('P5 (failure path): every set rated "ideal" under the range, no max → no step down', () => {
    const s = next([at('2026-09-12', [set(6, 'ideal'), set(6, 'ideal'), set(6, 'ideal')]), at('2026-09-15', [set(5, 'ideal'), set(5, 'ideal'), set(5, 'ideal')])]);
    expect(s.mode).not.toBe('reduce');
  });
});

describe('ADAPT-3 A-4: return after a break', () => {
  const two = (a: string, b: string) => [at(a, [set(12, 'ideal'), set(12, 'ideal'), set(12, 'ideal')]), at(b, [set(12, 'ideal'), set(12, 'ideal'), set(12, 'ideal')])];
  it('P6: 2 × 40×12, then 26 days off → 40 kg, no increase', () => {
    const s = next(two('2026-08-20', '2026-08-23'));
    expect(s.mode).toBe('reentry');
    expect(s.kg).toBe(40);
  });
  it('P6 boundary: 13 days off still increases, 14 days holds', () => {
    expect(next(two('2026-09-01', '2026-09-05')).mode).toBe('increase');
    expect(next(two('2026-09-01', '2026-09-04')).mode).toBe('reentry');
  });
  it('P7: 156 days off → 36 kg, the 10 % cut beyond 8 weeks', () => {
    expect(RETURN_CUT).toBe(0.1);
    const s = next(two('2026-04-12', '2026-04-15'));
    expect(s.mode).toBe('reentry');
    expect(s.kg).toBe(36);
    expect(s.sets.every(x => x.kg === 36)).toBe(true);
    expect(s.reason).toMatch(/156 days.*10% lighter/);
  });
  it('P7 boundary: 56 days off → the old load; 57 days → the cut', () => {
    expect(next(two('2026-07-20', '2026-07-24')).kg).toBe(40);
    expect(next(two('2026-07-20', '2026-07-23')).kg).toBe(36);
  });
  it('P7: with equipment, the cut snaps to the nearest rung below, never back up', () => {
    const ladder = { unit: 'kg', ladder: [30, 37.5, 40], source: 'user', updatedAt: '' } as unknown as EquipmentProfile;
    const s = next(two('2026-04-12', '2026-04-15'), today, ladder);
    expect(s.kg).toBe(30);
    // No cut (26 days): the logged 40 kg stays.
    expect(next(two('2026-08-20', '2026-08-23'), today, ladder).kg).toBe(40);
  });
});

describe('ADAPT-3 E-8: "rate your sets" only when the reps are ambiguous', () => {
  const days = ['2026-09-10', '2026-09-13', '2026-09-16'];
  const ctx = (reps: number[], g?: typeof goal) => ({
    sessions: days.map(d => at(d, reps.map((r, i) => set(r, i === 0 ? 'ideal' : undefined)))),
    splits: [], schedule: emptySchedule(), custom: [], today, now: Date.parse(`${today}T12:00:00Z`), ...baseCoachExtras, ...(g ? { goal: g } : {}),
  });
  const ids = (c: ReturnType<typeof ctx>) => coachInsights(c, 50).map(i => i.id);
  it('P8: not for a lift the rep rule already decided', () => {
    expect(ids(ctx([12, 12, 12], goal))).not.toContain('effort-missing');
  });
  it('P8 (failure path): still fires when the reps are ambiguous (12, 10, 8)', () => {
    expect(ids(ctx([12, 10, 8], goal))).toContain('effort-missing');
  });
  it('P8 (failure path): with no goal known, only a lift decided under every goal is left out', () => {
    expect(ids(ctx([12, 12, 12]))).toContain('effort-missing');
  });
});
