/**
 * BUG-18 x BUG-17 (A6), review round 4: what finishSession stores equals what a rebuild learns,
 * driven through the store, when an earlier session holds a typo set.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const remindersMock = vi.hoisted(() => ({ resyncReminders: vi.fn(async () => undefined) }));
vi.mock('@/slices/settings/reminders', () => remindersMock);

import { replaceState, state } from '@/core/store';
import { freshState, type LoggedSet, type Split } from '@/core/models';
import { addSet, commitSet, finishSession, rebuildRecoveryModel, setSet, startSession } from '@/slices/workout/session';

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

describe('BUG-18 x BUG-17: finishSession and the rebuild agree with a held typo', () => {
  it('the stored recovery model equals the rebuilt one', () => {
    train(T0, [100, 100, 100]);
    train(T0 + 3 * DAY, [100, 100, 100, 150]);
    train(T0 + 6 * DAY, [100, 100, 100]);
    expect(state.value.sessions).toHaveLength(3);
    expect(state.value.sessions[1]!.exercises[0]!.sets).toHaveLength(4);
    expect(state.value.recoveryModel).toEqual(rebuildRecoveryModel(state.value));
  });
});
