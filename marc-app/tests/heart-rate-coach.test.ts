import { describe, expect, it } from 'vitest';
import type { HeartRateSummary, Session } from '@/core/models';
import { heartRateCoachInsights, heartRateContext, heartRateSessionEvidence } from '@/brain/heart-rate';

const now = Date.parse('2026-09-22T12:00:00.000Z');

function workout(day: string, pulse = 120, options: { durationSec?: number; effort?: 'easy' | 'ideal' | 'max' } = {}): Session {
  const durationSec = options.durationSec ?? 1800;
  const start = Date.parse(`${day}T09:00:00.000Z`);
  const end = start + durationSec * 1000;
  const capturedMs = durationSec * 900;
  return {
    id: `workout-${day}`, day, splitId: 'push', splitName: 'Push',
    startedAt: new Date(start).toISOString(), endedAt: new Date(end).toISOString(), durationSec,
    exercises: [{ exerciseId: 'lib_machine_chest_press', name: 'Chest press',
      sets: Array.from({ length: 3 }, () => ({ kg: 50, reps: 10, effort: options.effort ?? 'ideal' })) }],
    heartRate: {
      metricsVersion: 2, sampleCount: capturedMs / 1000, capturedMs,
      durationMs: durationSec * 1000, coveragePct: 90,
      averageBpm: pulse, recordedPeakBpm: pulse + 20, gapCount: 1,
      firstSampleAt: new Date(start).toISOString(), lastSampleAt: new Date(end - 1000).toISOString(),
    },
  };
}

const history = (latestPulse = 145) => [
  workout('2026-09-08', 118), workout('2026-09-12', 120), workout('2026-09-16', 122), workout('2026-09-21', latestPulse),
];

describe('workout pulse evidence', () => {
  it('compares recent like-for-like workouts against a median with descriptive effort context', () => {
    const sessions = history();
    sessions[3]!.exercises[0]!.sets.forEach(set => { set.effort = 'max'; });
    const result = heartRateContext(sessions, now);
    expect(result).toMatchObject({ state: 'ready', baselineCount: 3, baselineMedianBpm: 120,
      deltaBpm: 25, direction: 'higher', eligibleCount: 4, recentCount: 4,
      effort: { direction: 'harder', latestMean: 3, baselineMean: 2 } });
    expect(result.observation).toContain('effort ratings were higher');
    expect(result.advice).toContain('Pulse alone does not explain');
    const insights = heartRateCoachInsights(sessions, now);
    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({ category: 'heart-rate', sessionId: sessions[3]!.id });
    expect(insights[0]!.action).not.toMatch(/increase|decrease|add a rep|reduce.*load/i);
  });

  it('requires three prior eligible sessions, without treating missing evidence as low pulse', () => {
    const sessions = history();
    delete sessions[0]!.heartRate;
    const result = heartRateContext(sessions, now);
    expect(result).toMatchObject({ state: 'warming-up', baselineCount: 2, recordedCount: 3 });
    expect(result.direction).toBeUndefined();
    expect(result.recent[0]).toMatchObject({ eligible: false });
    expect(result.recent[0]!.averageBpm).toBeUndefined();
  });

  it('does not surface an old comparison when the latest workout has a poor recording', () => {
    const sessions = [...history(), workout('2026-09-22', 150)];
    const hr = sessions[4]!.heartRate!;
    Object.assign(hr, { capturedMs: 720_000, coveragePct: 40, sampleCount: 720 });
    const result = heartRateContext(sessions, now);
    expect(result.state).toBe('limited');
    expect(result.latest!.id).toBe(sessions[4]!.id);
    expect(result.reason).toContain('covered 40%');
    expect(result.direction).toBeUndefined();
  });

  it('handles new users, older unverified summaries and outdated workouts explicitly', () => {
    expect(heartRateContext([], now)).toMatchObject({ state: 'warming-up', recentCount: 0, eligibleCount: 0 });
    expect(heartRateCoachInsights([], now)).toEqual([]);
    const oldSummary = workout('2026-09-21');
    delete oldSummary.heartRate!.metricsVersion;
    expect(heartRateSessionEvidence(oldSummary, now)).toMatchObject({ quality: 'limited', eligible: false });
    expect(heartRateContext([workout('2026-07-01')], now)).toMatchObject({ state: 'limited', recentCount: 0 });
    expect(heartRateSessionEvidence(workout('2026-07-01'), now).quality).toBe('outdated');
  });

  it('preserves plausible legacy recorded values without inventing verified coverage', () => {
    const session = workout('2026-09-21');
    delete session.heartRate!.metricsVersion;
    const evidence = heartRateSessionEvidence(session, now);
    expect(evidence).toMatchObject({ quality: 'limited', eligible: false, averageBpm: 120, peakBpm: 140 });
    expect(evidence.coveragePct).toBeUndefined();
    session.heartRate!.averageBpm = NaN;
    session.heartRate!.recordedPeakBpm = Infinity;
    const invalid = heartRateSessionEvidence(session, now);
    expect(invalid.averageBpm).toBeUndefined();
    expect(invalid.peakBpm).toBeUndefined();
  });

  it('requires sufficient time and packet evidence even with high coverage', () => {
    const short = workout('2026-09-21', 120, { durationSec: 120 });
    expect(heartRateSessionEvidence(short, now)).toMatchObject({ quality: 'limited', eligible: false });
    const inflated = workout('2026-09-21');
    inflated.heartRate!.sampleCount = 1;
    expect(heartRateSessionEvidence(inflated, now).quality).toBe('invalid');
  });

  it.each([
    { averageBpm: NaN }, { averageBpm: Infinity }, { averageBpm: -30 }, { averageBpm: 900 },
    { recordedPeakBpm: 119 }, { coveragePct: 101 }, { coveragePct: 85 },
    { capturedMs: Infinity }, { capturedMs: -1 }, { capturedMs: 1_900_000 },
    { durationMs: 1 }, { durationMs: NaN }, { durationMs: -1 },
    { sampleCount: 1.5 }, { sampleCount: -1 }, { sampleCount: Infinity }, { gapCount: -1 },
    { firstSampleAt: 'invalid' }, { lastSampleAt: '2026-09-24T12:00:00.000Z' },
  ] satisfies Partial<HeartRateSummary>[] )('rejects inconsistent imported summaries: %j', invalid => {
    const session = workout('2026-09-21');
    Object.assign(session.heartRate!, invalid);
    expect(heartRateSessionEvidence(session, now)).toMatchObject({ quality: 'invalid', eligible: false });
    const result = heartRateContext([...history().slice(0, 3), session], now);
    expect(result.state).toBe('limited');
    expect(result.direction).toBeUndefined();
  });

  it('keeps future sessions out of historical evidence and chart points', () => {
    const sessions = [workout('2026-09-04'), ...history()];
    const atPreviousWorkout = Date.parse(sessions[3]!.endedAt) + 1;
    const result = heartRateContext(sessions, atPreviousWorkout);
    expect(result.latest!.day).toBe('2026-09-16');
    expect(result).toMatchObject({ state: 'ready', baselineCount: 3, direction: 'usual' });
    expect(result.recent.some(point => point.day === '2026-09-21')).toBe(false);
    expect(heartRateSessionEvidence(sessions[4]!, atPreviousWorkout).quality).toBe('invalid');
  });

  it('filters stale baselines and requires strictly preceding, non-overlapping workouts', () => {
    const sessions = history();
    sessions[0] = workout('2026-07-01');
    expect(heartRateContext(sessions, now)).toMatchObject({ state: 'warming-up', baselineCount: 2 });
    const duplicate = structuredClone(sessions[1]!);
    duplicate.id = 'duplicate-import';
    const result = heartRateContext([...sessions, duplicate], now);
    expect(result.baselineCount).toBe(2);
    expect(result.recentCount).toBe(3);
  });

  it('rejects different exercises, splits, loads, sets, volume or duration as controls', () => {
    const mutations: Array<(session: Session) => void> = [
      session => { session.splitId = 'legs'; },
      session => { session.exercises[0]!.exerciseId = 'lib_dumbbell_bench_press'; },
      session => { session.exercises[0]!.sets.forEach(set => { set.kg = 60; set.reps = 8; }); },
      session => { session.exercises[0]!.sets.push({ kg: 50, reps: 10 }); },
      session => { session.exercises[0]!.sets.forEach(set => { set.reps = 15; }); },
      session => { session.durationSec = 900; },
    ];
    for (const mutate of mutations) {
      const sessions = history();
      mutate(sessions[0]!);
      expect(heartRateContext(sessions, now)).toMatchObject({ state: 'warming-up', baselineCount: 2 });
    }
  });

  it('admits small volume and duration differences at the same recorded loads', () => {
    const sessions = history();
    sessions[0] = workout('2026-09-08', 118, { durationSec: 2000 });
    sessions[0]!.exercises[0]!.sets.forEach(set => { set.reps = 11; });
    expect(heartRateContext(sessions, now)).toMatchObject({ state: 'ready', baselineCount: 3 });
  });

  it('does not match equal active training time with a much longer elapsed recording due to pauses', () => {
    const sessions = history();
    sessions[0] = workout('2026-09-08', 118, { durationSec: 3600 });
    sessions[0]!.durationSec = 1800;
    expect(heartRateSessionEvidence(sessions[0]!, now).eligible).toBe(true);
    expect(heartRateContext(sessions, now)).toMatchObject({ state: 'warming-up', baselineCount: 2 });
  });

  it('does not equate external load with total work for bodyweight or unknown custom exercises', () => {
    for (const exerciseId of ['lib_push_up', 'custom_weighted_pushup']) {
      const sessions = history();
      sessions.forEach(session => { session.exercises[0]!.exerciseId = exerciseId; });
      expect(heartRateContext(sessions, now)).toMatchObject({ state: 'limited', baselineCount: 0, eligibleCount: 4 });
    }
  });

  it('uses a median and a meaningful difference threshold instead of interpreting small fluctuations', () => {
    const sessions = history(127);
    sessions[2]!.heartRate!.averageBpm = 190;
    sessions[2]!.heartRate!.recordedPeakBpm = 210;
    expect(heartRateContext(sessions, now)).toMatchObject({ baselineMedianBpm: 120, direction: 'usual', deltaBpm: 7 });
    expect(heartRateContext(history(108), now)).toMatchObject({ direction: 'lower', deltaBpm: -12 });
    expect(heartRateContext(history(132), now)).toMatchObject({ direction: 'higher', deltaBpm: 12 });
  });

  it('keeps opposing or absent effort ratings explicit without claiming fitness or recovery improvements', () => {
    const sessions = history(145);
    sessions[3]!.exercises[0]!.sets.forEach(set => { set.effort = 'easy'; });
    expect(heartRateContext(sessions, now)).toMatchObject({ direction: 'higher', effort: { direction: 'easier' } });
    expect(heartRateContext(sessions, now).observation).toContain('effort ratings were lower.');
    sessions[1]!.exercises[0]!.sets.forEach(set => { delete set.effort; });
    expect(heartRateContext(sessions, now).effort.direction).toBe('unknown');
    expect(heartRateCoachInsights(sessions, now)[0]!.means).toContain('does not establish a change in fitness');
  });

  it('keeps recent charts chronological and bounded, with missing recordings shown as gaps', () => {
    const sessions = Array.from({ length: 10 }, (_, index) => workout(`2026-09-${String(index + 10).padStart(2, '0')}`));
    delete sessions[7]!.heartRate;
    const result = heartRateContext([...sessions].reverse(), now);
    expect(result.recent).toHaveLength(8);
    expect(result.recent[0]!.day).toBe('2026-09-12');
    expect(result.recent[7]!.day).toBe('2026-09-19');
    expect(result.recent[5]).toMatchObject({ eligible: false, meanEffort: 2 });
    expect(result.recent[5]!.averageBpm).toBeUndefined();
  });

  it('is deterministic and does not mutate sessions, exercises, sets or summaries', () => {
    const sessions = history();
    const before = JSON.stringify(sessions);
    function freeze(value: object): void {
      Object.values(value).forEach(child => { if (child && typeof child === 'object') freeze(child); });
      Object.freeze(value);
    }
    freeze(sessions);
    const first = heartRateContext(sessions, now);
    const second = heartRateContext(sessions, now);
    expect(second).toEqual(first);
    expect(JSON.stringify(sessions)).toBe(before);
  });
});
