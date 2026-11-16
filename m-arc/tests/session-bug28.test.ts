/**
 * BUG-28: finishing with 0 logged sets used to save nothing to `sessions` (the `exercises.length ? … : s.sessions`
 * guard already did that) but still returned a `FinishSummary` built around the empty session, which
 * `Train.tsx` rendered as "Session saved · 0 exercises · 0 sets" — and it cleared `todayOverride` regardless.
 * `finishSession` now behaves like `discardSession` in this case: returns `null` (so nothing is left to render
 * as "Session saved"), leaves `sessions` untouched, and keeps `todayOverride`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const remindersMock = vi.hoisted(() => ({ resyncReminders: vi.fn(async () => undefined) }));
vi.mock('@/slices/settings/reminders', () => remindersMock);

import { replaceState, state } from '@/core/store';
import { freshState, type Split } from '@/core/models';
import { commitSet, finishSession, setSet, skipEntry, startSession } from '@/slices/workout/session';

const split: Split = { id: 'sp', name: 'Push', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: 'lib_barbell_bench_press', sets: 2 }] };
const OVERRIDE = { day: '2026-09-22', splitId: 'sp', reason: 'sore', changes: [{ kind: 'remove' as const, exerciseId: 'lib_cable_fly' }] };
const T0 = Date.parse('2026-09-22T10:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});
afterEach(() => { vi.useRealTimers(); });

describe('BUG-28: finishing with 0 logged sets', () => {
  it('returns null, so nothing renders the "Session saved" screen', () => {
    replaceState({ ...freshState(), splits: [split] });
    startSession(split);
    expect(finishSession(false)).toBeNull();
  });

  it('leaves sessions unchanged', () => {
    replaceState({ ...freshState(), splits: [split], sessions: [] });
    startSession(split);
    finishSession(false);
    expect(state.value.sessions).toEqual([]);
  });

  it("keeps today's Escobar override instead of clearing it", () => {
    replaceState({ ...freshState(), splits: [split], escobar: { ...freshState().escobar, todayOverride: OVERRIDE } });
    startSession(split);
    finishSession(false);
    expect(state.value.escobar.todayOverride).toEqual(OVERRIDE);
  });

  it('ends the active session (Finish does not leave it stuck mid-workout)', () => {
    replaceState({ ...freshState(), splits: [split] });
    startSession(split);
    finishSession(false);
    expect(state.value.active).toBeNull();
  });

  it('a skipped-only session (every entry skipped, none logged) is the same empty finish', () => {
    replaceState({ ...freshState(), splits: [split], sessions: [] });
    startSession(split);
    skipEntry(0);
    expect(finishSession(false)).toBeNull();
    expect(state.value.sessions).toEqual([]);
  });
});

describe('BUG-28 control: a normal finish (>=1 logged set) is unchanged', () => {
  it('saves the session and clears a matching todayOverride, as before', () => {
    replaceState({ ...freshState(), splits: [split], sessions: [], escobar: { ...freshState().escobar, todayOverride: OVERRIDE } });
    startSession(split);
    setSet(0, 0, { kg: 60, reps: 8 });
    commitSet(0, 0);
    const r = finishSession(false);
    expect(r).not.toBeNull();
    expect(r!.session.exercises).toHaveLength(1);
    expect(state.value.sessions).toHaveLength(1);
    expect(state.value.escobar.todayOverride).toBeNull();
    expect(state.value.active).toBeNull();
  });
});
