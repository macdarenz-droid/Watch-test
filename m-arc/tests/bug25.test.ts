/**
 * BUG-25: when a history's day order and start order disagree (an imported or repaired backup, a
 * session saved in another time zone), the recovery rebuild must take the exercise's previous
 * session the way finish does: the last one by day, a tie going to the later start.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const remindersMock = vi.hoisted(() => ({ resyncReminders: vi.fn(async () => undefined) }));
vi.mock('@/slices/settings/reminders', () => remindersMock);

import { replaceState, state } from '@/core/store';
import { freshState, type LoggedSet, type Session, type Split } from '@/core/models';
import { commitSet, finishSession, rebuildRecoveryModel, setSet, startSession } from '@/slices/workout/session';
import { calibrateAfterSession, replayRecoveryModel } from '@/brain/recovery';
import type { RecoveryModel } from '@/core/models';
import { establishedProfile, sessionAt } from './helpers';

const SQUAT = 'lib_barbell_back_squat';
const split: Split = { id: 'sq', name: 'Squat', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: SQUAT, sets: 3 }] };
const DAY = 86_400_000;
const T0 = Date.parse('2026-09-10T07:00:00Z');
const iso = (ms: number) => new Date(ms).toISOString();
const five = (kg: number, effort: LoggedSet['effort'], n = 3): LoggedSet[] => Array.from({ length: n }, () => ({ kg, reps: 5, effort }));

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(T0); });
afterEach(() => { vi.useRealTimers(); });

/** One live squat session at `at`: three sets of 5 at max effort. */
function train(at: number, kg: number): void {
  vi.setSystemTime(at);
  startSession(split);
  for (let j = 0; j < 3; j++) { vi.advanceTimersByTime(90_000); setSet(0, j, { kg, reps: 5, effort: 'max' }); commitSet(0, j); }
  vi.advanceTimersByTime(60_000);
  finishSession(false);
}

/**
 * A: day 10, rated max, started first. B: started an hour after A but dated day 8 (day and start
 * order disagree), one easy set. Finish of C on day 13 takes A as squat's previous session (last
 * by day): 100 → 90 is a real drop three days on, so quads' tauScale rises.
 */
function history(): { a: Session; b: Session } {
  const a = sessionAt(iso(T0), iso(T0 + 3_600_000), [{ id: SQUAT, sets: five(100, 'max') }]);
  const bStart = T0 + 2 * 3_600_000;
  const b = { ...sessionAt(iso(bStart), iso(bStart + 1_800_000), [{ id: SQUAT, sets: five(40, 'easy', 1) }]), day: iso(T0 - 2 * DAY).slice(0, 10) };
  return { a, b };
}

describe('BUG-25: the rebuild takes the previous session in day order, as finish does', () => {
  it('a backdated session started later is not the previous session: finish and the rebuild learn the same model', () => {
    const { a, b } = history();
    replaceState({ ...freshState(), splits: [split], sessions: [a, b] });
    train(T0 + 3 * DAY, 90);
    expect(state.value.sessions.map(s => s.id).slice(0, 2)).toEqual([a.id, b.id]);
    const stored = state.value.recoveryModel;
    expect(stored.tauScale.quads).toBeGreaterThan(1);
    expect(rebuildRecoveryModel(state.value)).toEqual(stored);
  });

  it('control: with day and start order agreeing, B dated day 10 after A is the previous session and nothing is learned', () => {
    const { a, b } = history();
    replaceState({ ...freshState(), splits: [split], sessions: [a, { ...b, day: a.day }] });
    train(T0 + 3 * DAY, 90);
    expect(state.value.recoveryModel.tauScale.quads ?? 1).toBe(1);
    expect(rebuildRecoveryModel(state.value)).toEqual(state.value.recoveryModel);
  });

  it('random histories with out-of-order days: the rebuild equals finishing each session in start order', () => {
    let seed = 25;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    const efforts: LoggedSet['effort'][] = ['max', 'max', 'ideal', 'easy'];
    for (let run = 0; run < 30; run++) {
      const list: Session[] = [];
      for (let i = 0; i < 14; i++) {
        const start = T0 + i * 1.5 * DAY + rnd() * 3_600_000;
        const kg = 80 + Math.round(rnd() * 8) * 5;
        const s = sessionAt(iso(start), iso(start + 3_600_000), [{ id: SQUAT, sets: five(kg, efforts[Math.floor(rnd() * efforts.length)]!) }]);
        // Now and then dated up to three days before its start: day order and start order disagree.
        list.push(rnd() < 0.3 ? { ...s, day: iso(start - Math.ceil(rnd() * 3) * DAY).slice(0, 10) } : s);
      }
      let finished: RecoveryModel = { tauScale: {}, observations: {} };
      list.forEach((s, i) => { finished = calibrateAfterSession(list.slice(0, i), s, [], establishedProfile, [], finished); });
      expect(replayRecoveryModel(list, [], establishedProfile, [], () => true)).toEqual(finished);
    }
  });
});
