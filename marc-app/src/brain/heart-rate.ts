import type { LoggedSet, Session } from '@/core/models';
import { LIBRARY } from '@/core/exercises';
import type { Insight } from './coach/rules';

/** Data sufficiency rules, not physiological thresholds or training targets. */
export const HEART_RATE_EVIDENCE = {
  maxAgeMs: 42 * 86_400_000,
  minimumCoveragePct: 70,
  minimumCapturedMs: 180_000,
  minimumSamples: 36,
  minimumBaselineSessions: 3,
  maximumRecentPoints: 8,
} as const;

export interface HeartRateSessionEvidence {
  sessionId: string;
  quality: 'eligible' | 'limited' | 'missing' | 'outdated' | 'invalid';
  eligible: boolean;
  reason: string;
  coveragePct?: number;
  averageBpm?: number;
  peakBpm?: number;
  sampleCount: number;
  capturedMs: number;
  durationMs: number;
}

export interface HeartRateRecentPoint {
  sessionId: string;
  day: string;
  splitName: string;
  averageBpm?: number;
  coveragePct?: number;
  meanEffort?: number;
  eligible: boolean;
  reason: string;
}

export interface HeartRateContext {
  state: 'warming-up' | 'limited' | 'ready';
  reason: string;
  recentCount: number;
  recordedCount: number;
  eligibleCount: number;
  latest?: Session;
  latestEvidence?: HeartRateSessionEvidence;
  /** Chronological points, including gaps where a workout has no usable reading. */
  recent: HeartRateRecentPoint[];
  baselineCount: number;
  baselineMedianBpm?: number;
  deltaBpm?: number;
  direction?: 'higher' | 'lower' | 'usual';
  effort: {
    direction: 'harder' | 'easier' | 'similar' | 'unknown';
    latestMean?: number;
    baselineMean?: number;
  };
  observation?: string;
  advice: string;
}

const modes = new Map(LIBRARY.map(exercise => [exercise.id, exercise.mode]));
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const positive = (n: unknown): n is number => finite(n) && n > 0;
const bpm = (n: unknown): n is number => finite(n) && n >= 20 && n <= 260;
const instant = (value: unknown) => typeof value === 'string' ? Date.parse(value) : NaN;
const round = (value: number) => Math.round(value * 10) / 10;
const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
};

/** Validate the versioned recording evidence before using it in any comparison. */
export function heartRateSessionEvidence(session: Session, now: number): HeartRateSessionEvidence {
  const result: HeartRateSessionEvidence = {
    sessionId: session.id, quality: 'missing', eligible: false,
    reason: 'No heart-rate recording for this workout.', sampleCount: 0, capturedMs: 0, durationMs: 0,
  };
  const reject = (quality: HeartRateSessionEvidence['quality'], reason: string) => ({ ...result, quality, reason });
  const start = instant(session.startedAt), end = instant(session.endedAt);
  if (!finite(now) || !finite(start) || !finite(end) || end <= start || start > now || end > now ||
      !positive(session.durationSec) || session.durationSec * 1_000 > end - start + 1_000) {
    return reject('invalid', 'Workout timing is invalid or in the future.');
  }
  if (now - end > HEART_RATE_EVIDENCE.maxAgeMs) {
    return reject('outdated', 'This workout is older than the 42-day comparison window.');
  }
  const hr = session.heartRate;
  if (!hr) return result;
  if (hr.metricsVersion !== 2) {
    // Legacy summary values remain useful as labelled recorded facts even when
    // their time coverage cannot be trusted for comparisons.
    if (Number.isSafeInteger(hr.sampleCount) && hr.sampleCount > 0) {
      result.sampleCount = hr.sampleCount;
      if (bpm(hr.averageBpm)) result.averageBpm = hr.averageBpm;
      if (bpm(hr.recordedPeakBpm) && (result.averageBpm == null || hr.recordedPeakBpm >= result.averageBpm)) result.peakBpm = hr.recordedPeakBpm;
    }
    return reject('limited', 'This older recording has no verified time coverage. Record a new workout to build comparisons.');
  }
  const { sampleCount, capturedMs, durationMs, coveragePct, averageBpm, recordedPeakBpm, gapCount } = hr;
  if (!Number.isSafeInteger(sampleCount) || sampleCount < 0 ||
      !finite(capturedMs) || capturedMs < 0 || !positive(durationMs) ||
      !finite(coveragePct) || coveragePct < 0 || coveragePct > 100 ||
      capturedMs > durationMs || capturedMs > sampleCount * 5_000 ||
      Math.abs(durationMs - (end - start)) > 1_000 ||
      Math.abs(coveragePct - capturedMs / durationMs * 100) > 1 ||
      !Number.isSafeInteger(gapCount) || gapCount < 0) {
    return reject('invalid', 'Recording totals are inconsistent; they cannot support a comparison.');
  }
  if (sampleCount === 0 && capturedMs === 0) {
    return reject('missing', 'No heart-rate samples were recorded during this workout.');
  }
  const first = instant(hr.firstSampleAt), last = instant(hr.lastSampleAt);
  if (!bpm(averageBpm) || !bpm(recordedPeakBpm) || recordedPeakBpm < averageBpm ||
      !finite(first) || !finite(last) || first < start || last > end || last < first ||
      capturedMs > last - first + 5_000) {
    return reject('invalid', 'Recording values or sample times are inconsistent; they cannot support a comparison.');
  }
  Object.assign(result, { sampleCount, capturedMs, durationMs, coveragePct, averageBpm, peakBpm: recordedPeakBpm });
  if (capturedMs < HEART_RATE_EVIDENCE.minimumCapturedMs || sampleCount < HEART_RATE_EVIDENCE.minimumSamples) {
    return reject('limited', 'Record at least 3 minutes of heart rate before making comparisons.');
  }
  if (coveragePct < HEART_RATE_EVIDENCE.minimumCoveragePct) {
    return reject('limited', `Heart rate covered ${Math.round(coveragePct)}% of this workout; comparisons need at least 70%.`);
  }
  return { ...result, quality: 'eligible', eligible: true, reason: 'Enough recording coverage for a workout comparison.' };
}

function loggedSets(session: Session): LoggedSet[] {
  return Array.isArray(session.exercises) ? session.exercises.flatMap(e => e && Array.isArray(e.sets) ? e.sets.filter(Boolean) : []) : [];
}

function effortMean(session: Session): number | undefined {
  const all = loggedSets(session);
  const ratings = all.flatMap(set => set.effort === 'easy' ? [1] : set.effort === 'ideal' ? [2] : set.effort === 'max' ? [3] : []);
  if (ratings.length < 3 || ratings.length < all.length / 2) return undefined;
  return ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
}

interface Workload { signature: string; volume: number[] }

/** Historical bodyweight/resistance-mode snapshots are unavailable, so only known weighted work is matched. */
function workload(session: Session): Workload | undefined {
  if (!Array.isArray(session.exercises) || !session.exercises.length || !positive(session.durationSec)) return undefined;
  const rows: Array<{ signature: string; volume: number }> = [];
  for (const exercise of session.exercises) {
    if (!exercise || modes.get(exercise.exerciseId) !== 'weighted' || !Array.isArray(exercise.sets) || !exercise.sets.length) return undefined;
    if (exercise.sets.some(set => !set || !positive(set.kg) || !Number.isSafeInteger(set.reps) || !positive(set.reps) ||
      set.durationSec != null || set.distanceM != null)) return undefined;
    const volume = exercise.sets.reduce((sum, set) => sum + set.kg! * set.reps!, 0);
    if (!positive(volume)) return undefined;
    // Equal load multiset also requires equal set counts, preventing equal tonnage at unlike loads from matching.
    const loads = exercise.sets.map(set => set.kg!).sort((a, b) => a - b);
    rows.push({ signature: JSON.stringify([exercise.exerciseId, loads]), volume });
  }
  rows.sort((a, b) => a.signature.localeCompare(b.signature) || a.volume - b.volume);
  return { signature: JSON.stringify(rows.map(row => row.signature)), volume: rows.map(row => row.volume) };
}

function comparable(latest: Session, prior: Session, current: Workload, previous: Workload): boolean {
  if (latest.splitId !== prior.splitId || current.signature !== previous.signature) return false;
  if (Math.abs(prior.durationSec - latest.durationSec) > latest.durationSec * 0.25) return false;
  // Pulse includes pauses. Equal active durations must not hide unlike lengths
  // of rest or a long interruption in the elapsed recording window.
  const elapsed = instant(latest.endedAt) - instant(latest.startedAt);
  const previousElapsed = instant(prior.endedAt) - instant(prior.startedAt);
  if (Math.abs(previousElapsed - elapsed) > elapsed * 0.25) return false;
  return current.volume.every((volume, index) => Math.abs(previous.volume[index]! - volume) <= volume * 0.2);
}

function timeline(sessions: Session[], now: number): Session[] {
  const sorted = sessions.filter(session => {
    const start = instant(session.startedAt), end = instant(session.endedAt);
    return typeof session.id === 'string' && session.id.length > 0 && finite(start) && finite(end) && start < end && end <= now;
  }).sort((a, b) => instant(a.endedAt) - instant(b.endedAt));
  const seenIds = new Set<string>(), seenTimes = new Set<string>();
  // Keep only one copy of a workout; repeated imports must not manufacture baseline sessions.
  return sorted.reverse().filter(session => {
    const times = `${instant(session.startedAt)}:${instant(session.endedAt)}`;
    if (seenIds.has(session.id) || seenTimes.has(times)) return false;
    seenIds.add(session.id); seenTimes.add(times);
    return true;
  }).reverse();
}

/** One shared context for Coach, Today, and a history view evaluated at a selected workout's end. */
export function heartRateContext(sessions: Session[], now: number): HeartRateContext {
  const valid = finite(now) ? timeline(sessions, now) : [];
  const latest = valid[valid.length - 1];
  const recent = valid.filter(session => now - instant(session.endedAt) <= HEART_RATE_EVIDENCE.maxAgeMs);
  const evidence = new Map(recent.map(session => [session.id, heartRateSessionEvidence(session, now)]));
  const latestEvidence = latest ? heartRateSessionEvidence(latest, now) : undefined;
  const context: HeartRateContext = {
    state: 'warming-up', reason: 'Record a workout with heart rate to start building your baseline.',
    recentCount: recent.length,
    recordedCount: recent.filter(session => session.heartRate && session.heartRate.sampleCount > 0).length,
    eligibleCount: [...evidence.values()].filter(item => item.eligible).length,
    latest, latestEvidence,
    recent: recent.slice(-HEART_RATE_EVIDENCE.maximumRecentPoints).map(session => {
      const item = evidence.get(session.id)!;
      return {
        sessionId: session.id, day: session.day, splitName: session.splitName,
        averageBpm: item.averageBpm, coveragePct: item.coveragePct,
        meanEffort: effortMean(session), eligible: item.eligible, reason: item.reason,
      };
    }),
    baselineCount: 0, effort: { direction: 'unknown' },
    advice: 'Connect your sensor before training and rate your sets to build useful context.',
  };
  if (!latest || !latestEvidence) return context;
  if (!latestEvidence.eligible) {
    return { ...context, state: 'limited', reason: latestEvidence.reason,
      advice: latestEvidence.quality === 'limited' ? 'Check the sensor connection and fit, and record the next workout from start to finish.' : context.advice };
  }
  const currentWork = workload(latest);
  if (!currentWork) {
    return { ...context, state: 'limited',
      reason: 'Pulse is recorded, but this workout cannot be matched reliably with the available load data.',
      advice: 'Use the recording and your effort ratings as context. Comparisons currently need known weighted exercises with complete loads and reps.' };
  }
  const candidates = recent.filter(session => {
    if (session.id === latest.id || instant(session.endedAt) > instant(latest.startedAt) || !evidence.get(session.id)?.eligible) return false;
    const previous = workload(session);
    return previous != null && comparable(latest, session, currentWork, previous);
  });
  let precedingStart = instant(latest.startedAt);
  const baseline = candidates.reverse().filter(session => {
    if (instant(session.endedAt) > precedingStart) return false;
    precedingStart = instant(session.startedAt);
    return true;
  }).reverse();
  context.baselineCount = baseline.length;
  if (baseline.length < HEART_RATE_EVIDENCE.minimumBaselineSessions) {
    return { ...context,
      reason: `${baseline.length} of 3 prior comparable workouts recorded. Match the split, exercises, loads, set counts and a similar duration.`,
      advice: 'Keep recording your usual workouts and rate your effort; there is no need to repeat work just to fill this baseline.' };
  }
  const baselineMedianBpm = median(baseline.map(session => evidence.get(session.id)!.averageBpm!));
  const delta = latestEvidence.averageBpm! - baselineMedianBpm;
  const threshold = Math.max(8, baselineMedianBpm * 0.1);
  const direction = Math.abs(delta) < threshold ? 'usual' : delta > 0 ? 'higher' : 'lower';
  const latestMean = effortMean(latest);
  const baselineEfforts = baseline.map(effortMean);
  const baselineMean = baselineEfforts.every(finite) ? median(baselineEfforts as number[]) : undefined;
  const effortDirection = latestMean == null || baselineMean == null ? 'unknown'
    : Math.abs(latestMean - baselineMean) < 0.35 ? 'similar' : latestMean > baselineMean ? 'harder' : 'easier';
  const effortText = effortDirection === 'unknown' ? 'Effort ratings are too limited to compare.'
    : effortDirection === 'similar' ? 'Your logged effort ratings were similar.'
    : `Your logged effort ratings were ${effortDirection === 'harder' ? 'higher' : 'lower'}.`;
  const pulseText = direction === 'usual'
    ? `Average recorded pulse was ${Math.round(latestEvidence.averageBpm!)} bpm, close to your ${Math.round(baselineMedianBpm)} bpm median across ${baseline.length} comparable workouts.`
    : `Average recorded pulse was ${Math.round(Math.abs(delta))} bpm ${direction} than your ${Math.round(baselineMedianBpm)} bpm median across ${baseline.length} comparable workouts.`;
  return {
    ...context, state: 'ready', reason: 'Compared with recent workouts using the same exercises, recorded loads and set counts, with similar volume and duration.',
    baselineMedianBpm: round(baselineMedianBpm), deltaBpm: round(delta), direction,
    effort: { direction: effortDirection, latestMean, baselineMean },
    observation: `${pulseText} ${effortText}`,
    advice: direction === 'usual'
      ? 'Keep logging effort and rest lengths to make the next comparison more informative.'
      : 'Review your rest lengths, effort ratings and training conditions, then see whether this pattern repeats. Pulse alone does not explain the change or determine your next load.',
  };
}

/** Descriptive observations only: this data does not change progression or recovery rules. */
export function heartRateCoachInsights(sessions: Session[], now: number): Insight[] {
  const context = heartRateContext(sessions, now);
  if (!context.latest || (context.recordedCount === 0 && !context.latest.heartRate)) return [];
  const sessionId = context.latest.id;
  if (context.state !== 'ready') {
    return [{ id: `heart-rate:quality:${sessionId}`, category: 'heart-rate', priority: 70, sessionId,
      title: context.state === 'warming-up' ? 'Your pulse baseline is building' : 'Pulse comparison needs more context',
      noticed: context.reason,
      means: 'Coverage and comparable workouts determine whether the recording can support an observation.',
      action: context.advice }];
  }
  return [{ id: `heart-rate:comparison:${sessionId}`, category: 'heart-rate',
    priority: context.direction === 'usual' ? 80 : 130, sessionId,
    title: context.direction === 'usual' ? 'Pulse close to your usual range' : `Pulse ${context.direction} at similar recorded work`,
    noticed: context.observation!,
    means: 'This compares recorded sessions. It does not establish a change in fitness, recovery or readiness.',
    action: context.advice }];
}
