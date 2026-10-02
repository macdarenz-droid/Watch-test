import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-22T10:00:30Z')); vi.resetModules(); });
afterEach(() => { vi.useRealTimers(); vi.doUnmock('@/brain/recovery'); });

describe('the clock (R2.1)', () => {
  it('the ticker is reference-counted and each release counts once', async () => {
    const C = await import('@/app/clock');
    const r1 = C.acquireTicker();
    const r2 = C.acquireTicker();
    r1(); r1();
    expect(C.tickerRunning()).toBe(true);
    r2();
    expect(C.tickerRunning()).toBe(false);
  });
  it('thirty one-second ticks inside a minute evaluate recovery once', async () => {
    vi.setSystemTime(new Date('2026-09-22T10:00:00Z'));
    const calls = { n: 0 };
    vi.doMock('@/brain/recovery', async orig => {
      const real = await orig<typeof import('@/brain/recovery')>();
      return { ...real, recoveryStatus: (...a: Parameters<typeof real.recoveryStatus>) => { calls.n++; return real.recoveryStatus(...a); } };
    });
    const S = await import('@/app/selectors');
    const release = S.acquireTicker();
    void S.recovery.value;
    const before = calls.n;
    for (let i = 0; i < 30; i++) { vi.advanceTimersByTime(1000); void S.recovery.value; }
    expect(calls.n - before).toBe(0);
    vi.advanceTimersByTime(31_000);
    void S.recovery.value;
    expect(calls.n - before).toBe(1);
    release();
  });
  it('F6: acquireTicker syncs nowMs immediately, before the first 1s tick', async () => {
    const C = await import('@/app/clock');
    // A prior holder could leave nowMs stale; move the clock forward without advancing timers,
    // the way real time passes between an old ticker's last tick and a new mount's first render.
    vi.setSystemTime(new Date(Date.now() + 5000));
    const release = C.acquireTicker();
    expect(C.nowMs.value).toBe(Date.now());
    release();
  });
  it('with no ticker, the minute interval still moves minuteNow and today', async () => {
    const C = await import('@/app/clock');
    const m0 = C.minuteNow.value;
    vi.advanceTimersByTime(2 * 3_600_000);
    expect(C.minuteNow.value - m0).toBe(2 * 3_600_000);
    expect(C.tickerRunning()).toBe(false);
  });
  it('after a time zone change, day arithmetic is right once the clock refreshes', async () => {
    const saved = process.env.TZ;
    try {
      process.env.TZ = 'Asia/Manila';
      const C = await import('@/app/clock');
      const D = await import('@/core/dates');
      C.refreshClock();
      expect(D.addDays('2026-03-08', 1)).toBe('2026-03-09');
      process.env.TZ = 'America/New_York';
      C.refreshClock();
      expect(D.addDays('2026-03-08', 1)).toBe('2026-03-09');
      expect(D.addDays('2026-03-07', 1)).toBe('2026-03-08');
    } finally { process.env.TZ = saved; }
  });
});
