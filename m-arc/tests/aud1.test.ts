/**
 * AUD-1 (codex audit SCI-01, SCI-02).
 * SCI-01: e1RM calibration learns only where kg is the lifted load; for an assisted exercise kg is
 * help, so less help read as a strength loss and slowed the lats' recovery.
 * SCI-02: the sleep part of readiness took the median of recorded sleep as the whole need, so
 * chronic 4 h nights scored 100/green. Need is now never under the 7 h adult floor.
 */
import { describe, it, expect } from 'vitest';
import { calibrateAfterSession, replayRecoveryModel } from '@/brain/recovery';
import { readiness, readinessWithInputs, SLEEP_NEED_FLOOR_MIN, type ReadinessInput } from '@/brain/readiness';
import CARDS from '@/data/knowledge.json';
import type { DailyHealth, Exercise, LoggedSet, Profile, Session } from '@/core/models';
import { freshRecoveryModel, session } from './helpers';

const profile: Profile = { name: 'N' };
const ASSISTED = 'lib_assisted_pull_up';
const PULL = 'lib_pull_up';
const maxSet = (kg: number, reps: number, n = 1): LoggedSet[] => Array.from({ length: n }, () => ({ kg, reps, effort: 'max' as const }));

describe('AUD-1 SCI-01: recovery calibration skips modes where kg is not the lifted load', () => {
  // The audit's reproduction (6 days apart, 60 -> 40 kg assist x 8 gave { tauScale: { lats: 1.1 } }),
  // and the inverse the audit names: more help the next day read as faster recovery.
  const cases: Array<[string, string, number, number, number]> = [
    ['less assistance (improvement)', '2026-09-25', 60, 40, 1],
    ['more assistance (regression)', '2026-09-30', 40, 60, 6],
  ];
  for (const [label, first, before, after, n] of cases) {
    it(`an assisted pull-up with ${label} teaches the model nothing, at finish and in replay`, () => {
      const a = session(first, [{ id: ASSISTED, sets: maxSet(before, 8, n) }]);
      const b = session('2026-10-01', [{ id: ASSISTED, sets: maxSet(after, 8, n) }]);
      expect(calibrateAfterSession([a], b, [], profile, [], freshRecoveryModel)).toEqual(freshRecoveryModel);
      expect(replayRecoveryModel([a, b], [], profile, [], () => true)).toEqual(freshRecoveryModel);
    });
  }

  it('a custom assisted exercise is skipped too', () => {
    const custom: Exercise[] = [{ id: 'c_assist', name: 'Band Chin', equipment: 'Band', primary: ['lats'], secondary: [], stabilizers: [], aliases: [], pattern: 'pull', defaultSets: 3, mode: 'assisted', role: 'accessory', custom: true }];
    const a = session('2026-09-25', [{ id: 'c_assist', sets: maxSet(30, 8) }]);
    const b = session('2026-10-01', [{ id: 'c_assist', sets: maxSet(15, 8) }]);
    expect(calibrateAfterSession([a], b, custom, profile, [], freshRecoveryModel)).toEqual(freshRecoveryModel);
  });

  it('a bodyweight pull-up with added kg is skipped (kg is only the added load)', () => {
    const a = session('2026-09-25', [{ id: PULL, sets: maxSet(20, 8) }]);
    const b = session('2026-10-01', [{ id: PULL, sets: maxSet(10, 8) }]);
    expect(calibrateAfterSession([a], b, [], profile, [], freshRecoveryModel)).toEqual(freshRecoveryModel);
  });

  it('a weighted lift with the same numbers still calibrates (kg is the load)', () => {
    const lift = 'lib_chest_supported_row';
    const a = session('2026-09-25', [{ id: lift, sets: maxSet(60, 8) }]);
    const b = session('2026-10-01', [{ id: lift, sets: maxSet(40, 8) }]);
    const m = calibrateAfterSession([a], b, [], profile, [], freshRecoveryModel);
    expect(Object.keys(m.observations).length).toBeGreaterThan(0);
  });

  it('a stored model with assisted observations still reads and replays (no shape change)', () => {
    const stored = { tauScale: { lats: 1.1 }, observations: { lats: 1 } };
    const a = session('2026-09-25', [{ id: PULL, sets: [{ reps: 8, effort: 'max' }] as Session['exercises'][0]['sets'] }]);
    const b = session('2026-10-01', [{ id: ASSISTED, sets: maxSet(40, 8) }]);
    const m = calibrateAfterSession([a], b, [], profile, [], stored);
    expect(m.observations).toEqual({ lats: 1 });
    // The trained lats still decay toward 1, as any session without evidence does.
    expect(m.tauScale.lats).toBeLessThan(1.1);
  });
});

const today = '2026-10-01';
const day = (offset: number) => { const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - offset); return d.toISOString().slice(0, 10); };
const nights = (mins: Array<number | null>): DailyHealth[] =>
  mins.flatMap((m, i) => (m == null ? [] : [{ day: day(i), sleepMinutes: m, source: 'health_connect' as const, syncedAt: today }]));
const base: ReadinessInput = { today, now: Date.parse(`${today}T12:00:00Z`), healthDays: [], checkInHistory: [], recovery: [], custom: [], sessions: [] };
const score = (mins: Array<number | null>) => readiness({ ...base, healthDays: nights(mins) });

describe('AUD-1 SCI-02: sleep sufficiency floor in readiness', () => {
  it('the floor is the knowledge card minimum (7 h, AASM/SRS)', () => {
    const card = (CARDS as Array<{ id: string; numbers?: Array<{ value: number; unit: string }> }>).find(c => c.id === 'sleep_duration')!;
    expect(card.numbers![0]).toMatchObject({ value: 7, unit: 'h' });
    expect(SLEEP_NEED_FLOOR_MIN).toBe(card.numbers![0]!.value * 60);
  });

  it('14 nights of 4 h never read green, and sleep is named as low (audit reproduction)', () => {
    const { result, low } = readinessWithInputs({ ...base, healthDays: nights(Array(14).fill(240)) });
    expect(result!.band).not.toBe('green');
    expect(result!.score).toBe(45);
    expect(result!.loadAdvice).toBe('no_increase');
    expect(result!.drivers).toContain('Sleep: 4h last night (under 7h)'); // AUD-20: plain-fact driver text
    expect(low).toContain('sleep');
  });

  it('chronic 4 h stays below green with a good check-in beside it', () => {
    const r = readiness({ ...base, healthDays: nights(Array(14).fill(240)), checkIn: { day: today, sleepQuality: 3, mood: 3 } });
    expect(r!.band).not.toBe('green');
  });

  it('a steady 6.5 h sleeper is scaled down, not rewarded as full', () => {
    expect(score(Array(14).fill(390))!.score).toBe(91);
  });

  it('normal sleepers are unchanged: 8 h nights score 100', () => {
    expect(score(Array(14).fill(480))!.score).toBe(100);
  });

  it('one short night after 8 h nights scores as before (need = own 8 h)', () => {
    expect(score([240, ...Array(13).fill(480)])!.score).toBe(55);
  });

  it('a 6 h night after 8 h nights scores as before', () => {
    expect(score([360, ...Array(13).fill(480)])!.score).toBe(77);
  });

  it('missing nights: only two 5 h nights, none last night, reads the debt against 7 h', () => {
    expect(score([null, 300, 300])!.score).toBe(62);
  });

  it('missing nights: no sleep data gives no sleep part', () => {
    expect(readinessWithInputs({ ...base, healthDays: nights([null, null]) }).result).toBeNull();
  });

  it('recovery sleep after a short stretch reads full', () => {
    expect(score([540, 540, 540, ...Array(11).fill(300)])!.score).toBe(100);
  });
});
