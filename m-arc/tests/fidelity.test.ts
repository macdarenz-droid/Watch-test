import { describe, it, expect } from 'vitest';
import {
  classifySetFidelity, isCompressed, liveSessionLogging, retroSessionLogging, legacySessionLogging,
  implausibleLoad, implausibleReps, unitSuspect, futureTime, isDuplicateSession, flagsForSet,
} from '@/brain/fidelity';
import { session, sets } from './helpers';

describe('classifySetFidelity', () => {
  it('is live for the first set', () => { expect(classifySetFidelity(null, 1)).toBe('live'); });
  it('is live for a plausible rest gap', () => { expect(classifySetFidelity(90, 1)).toBe('live'); expect(classifySetFidelity(20, 1)).toBe('live'); expect(classifySetFidelity(720, 1)).toBe('live'); });
  it('is delayed when three or more commits land within 15s (a burst)', () => { expect(classifySetFidelity(90, 3)).toBe('delayed'); });
  it('is delayed when the gap is under 20s', () => { expect(classifySetFidelity(19, 1)).toBe('delayed'); });
  it('is delayed when the gap is over 12 minutes', () => { expect(classifySetFidelity(721, 1)).toBe('delayed'); });
});

describe('isCompressed', () => {
  it('flags a session logged far faster than its sets could take', () => { expect(isCompressed(20, 13 * 60, 0)).toBe(true); });
  it('does not flag a normal-paced session', () => { expect(isCompressed(9, 45 * 60, 0)).toBe(false); });
  it('flags a session that is mostly bursts even if not literally too fast', () => { expect(isCompressed(9, 45 * 60, 0.6)).toBe(true); });
});

describe('liveSessionLogging', () => {
  it('mode live with high live share and no compression', () => {
    const l = liveSessionLogging({ setFidelities: ['live', 'live', 'live', 'live'], startedAt: '2026-09-18T17:00:00.000Z', endedAt: '2026-09-18T18:00:00.000Z', loggedDurationSec: 3600, workingSetCount: 4 });
    expect(l.mode).toBe('live');
    expect(l.timingTrusted).toBe(true);
    expect(l.contentConfidence).toBe('high');
  });
  it('mode mixed with a partial live share', () => {
    const l = liveSessionLogging({ setFidelities: ['live', 'delayed'], startedAt: '2026-09-18T17:00:00.000Z', endedAt: '2026-09-18T18:00:00.000Z', loggedDurationSec: 3600, workingSetCount: 2 });
    expect(l.mode).toBe('mixed');
    expect(l.timingTrusted).toBe(false);
  });
  it('a compressed session becomes retro even though it started live', () => {
    const l = liveSessionLogging({ setFidelities: Array(20).fill('live'), startedAt: '2026-09-18T17:00:00.000Z', endedAt: '2026-09-18T17:12:00.000Z', loggedDurationSec: 12 * 60, workingSetCount: 20 });
    expect(l.mode).toBe('retro');
    expect(l.flags).toContain('compressed');
  });
  it('flags a session that crosses midnight', () => {
    // Local midnight: the crossing is judged on the person's calendar, not UTC's (ST-18).
    const l = liveSessionLogging({ setFidelities: ['live'], startedAt: new Date(2026, 8, 18, 23, 50).toISOString(), endedAt: new Date(2026, 8, 19, 0, 10).toISOString(), loggedDurationSec: 1200, workingSetCount: 1 });
    expect(l.flags).toContain('midnight_crossing');
  });
});

describe('retroSessionLogging and legacySessionLogging', () => {
  it('retro is never timing-trusted', () => {
    const l = retroSessionLogging('2026-09-18T17:00:00.000Z', '2026-09-18T18:00:00.000Z', 'user');
    expect(l.mode).toBe('retro');
    expect(l.timingTrusted).toBe(false);
    expect(l.timeSource).toBe('user');
  });
  it('legacy sessions have no live share and medium confidence', () => {
    const l = legacySessionLogging('2026-09-18T17:00:00.000Z', '2026-09-18T18:00:00.000Z');
    expect(l.mode).toBe('legacy');
    expect(l.liveShare).toBe(0);
    expect(l.contentConfidence).toBe('medium');
  });
});

describe('plausibility flags', () => {
  it('implausibleLoad on a big jump or an absolute outlier', () => {
    expect(implausibleLoad(100, 70)).toBe(true); // +43%
    expect(implausibleLoad(80, 70)).toBe(false); // +14%
    expect(implausibleLoad(600, null)).toBe(true);
  });
  it('implausibleReps depends on whether the lift is heavy', () => {
    expect(implausibleReps(35, false)).toBe(false);
    expect(implausibleReps(51, false)).toBe(true);
    expect(implausibleReps(31, true)).toBe(true);
    expect(implausibleReps(25, true)).toBe(false);
  });
  it('unitSuspect at 2.2x and 0.45x the recent best', () => {
    expect(unitSuspect(154, 70)).toBe(true); // 70kg mistaken for lb -> 154
    expect(unitSuspect(31.8, 70)).toBe(true); // 70lb mistaken for kg-equivalent
    expect(unitSuspect(72, 70)).toBe(false);
  });
  it('futureTime catches a clock error or a bad edit', () => {
    expect(futureTime('2099-01-01T00:00:00.000Z', Date.now())).toBe(true);
    expect(futureTime('2020-01-01T00:00:00.000Z', Date.now())).toBe(false);
    expect(futureTime(undefined, Date.now())).toBe(false);
  });
  it('flagsForSet combines the checks for one set', () => {
    const flags = flagsForSet({ kg: 100, reps: 8 }, 70, false);
    expect(flags).toContain('implausible_load');
  });
});

describe('isDuplicateSession', () => {
  it('flags two sessions with the same day and identical sets', () => {
    const a = session('2026-09-18', [{ id: 'lib_barbell_bench_press', sets: sets(60, 8) }]);
    const b = session('2026-09-18', [{ id: 'lib_barbell_bench_press', sets: sets(60, 8) }]);
    expect(isDuplicateSession(a, b)).toBe(true);
  });
  it('does not flag different loads or different days', () => {
    const a = session('2026-09-18', [{ id: 'lib_barbell_bench_press', sets: sets(60, 8) }]);
    const b = session('2026-09-18', [{ id: 'lib_barbell_bench_press', sets: sets(62.5, 8) }]);
    const c = session('2026-09-19', [{ id: 'lib_barbell_bench_press', sets: sets(60, 8) }]);
    expect(isDuplicateSession(a, b)).toBe(false);
    expect(isDuplicateSession(a, c)).toBe(false);
  });
});

describe('warm-ups and drop sets (QA-R6-6, QA-R6-8, QA-R6-9)', () => {
  it('a light warm-up or drop set is never a kg/lb slip; a light working set still is', async () => {
    const { setUnitSuspect } = await import('@/brain/fidelity');
    expect(setUnitSuspect({ kg: 45, kind: 'warmup' }, 100)).toBe(false);
    expect(setUnitSuspect({ kg: 45, kind: 'drop' }, 100)).toBe(false);
    expect(setUnitSuspect({ kg: 45 }, 100)).toBe(true);
  });
  it("'Last:' hints line up with the working sets", async () => {
    const { workingIndex } = await import('@/brain/exposure');
    const rows = [{ kind: 'warmup' as const }, { kind: 'warmup' as const }, {}, {}, {}];
    expect(rows.map((_, j) => workingIndex(rows, j))).toEqual([null, null, 0, 1, 2]);
  });
});

describe('flagsForSet and warm-ups (QA2-FE-3, QA2-FE-4)', () => {
  it('a light warm-up or drop set is not flagged as a kg/lb slip; a light working set still is', () => {
    expect(flagsForSet({ kg: 45, reps: 8, kind: 'warmup' }, 100, false)).not.toContain('unit_suspect');
    expect(flagsForSet({ kg: 45, reps: 8, kind: 'drop' }, 100, false)).not.toContain('unit_suspect');
    expect(flagsForSet({ kg: 45, reps: 8 }, 100, false)).toContain('unit_suspect');
  });
});
