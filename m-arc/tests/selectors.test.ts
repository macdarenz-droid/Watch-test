import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dayKey } from '@/core/dates';
import { sessionAt } from './helpers';

// Local wall-clock instants (not UTC 'Z' strings), so this passes under any TZ npm run test:tz picks.
const local = (y: number, m: number, d: number, h: number, mi: number): Date => new Date(y, m - 1, d, h, mi);
// Like finishSession() (dayKey(trainedAt)), not the helper's UTC-slice shortcut: the stored day
// must be the local start day for these to test the midnight-crossing branch, not the plain one.
const crossingMidnight = () => { const started = local(2026, 9, 25, 23, 30); return { ...sessionAt(started.toISOString(), local(2026, 9, 26, 0, 40).toISOString(), []), day: dayKey(started) }; };

beforeEach(() => { vi.useFakeTimers(); vi.resetModules(); });
afterEach(() => { vi.useRealTimers(); });

describe('sessionsToday (QA8-4)', () => {
  it('includes a session that started before midnight and ended today, checked within 6 hours of ending', async () => {
    vi.setSystemTime(local(2026, 9, 26, 5, 30));
    const { replaceState } = await import('@/core/store');
    const { freshState } = await import('@/core/models');
    const S = await import('@/app/selectors');
    const s = crossingMidnight();
    replaceState({ ...freshState(), sessions: [s] });
    expect(S.sessionsToday.value.map(x => x.id)).toEqual([s.id]);
    // the stored day is unchanged: the session still counts as Fri in History
    expect(s.day).toBe('2026-09-25');
  });

  it('drops out again once more than 6 hours have passed since it ended', async () => {
    vi.setSystemTime(local(2026, 9, 26, 18, 0));
    const { replaceState } = await import('@/core/store');
    const { freshState } = await import('@/core/models');
    const S = await import('@/app/selectors');
    const s = crossingMidnight();
    replaceState({ ...freshState(), sessions: [s] });
    expect(S.sessionsToday.value).toEqual([]);
  });

  it('still includes a plain same-day session regardless of time elapsed', async () => {
    vi.setSystemTime(local(2026, 9, 26, 20, 0));
    const { replaceState } = await import('@/core/store');
    const { freshState } = await import('@/core/models');
    const S = await import('@/app/selectors');
    const s = sessionAt(local(2026, 9, 26, 8, 0).toISOString(), local(2026, 9, 26, 9, 0).toISOString(), []);
    replaceState({ ...freshState(), sessions: [s] });
    expect(S.sessionsToday.value.map(x => x.id)).toEqual([s.id]);
  });
});
