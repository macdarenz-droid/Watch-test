import type { CheckIn, FreshMark, InsightFeedback, LoggedSet, Profile, RecoveryModel, Session, SessionLogging } from '@/core/models';
import { newId } from '@/core/models';

export function liveLogging(trainedAt: string, trainedEndAt: string): SessionLogging {
  return { mode: 'live', trainedAt, trainedEndAt, loggedAt: trainedEndAt, timeSource: 'timer', liveShare: 1, timingTrusted: true, contentConfidence: 'high', flags: [] };
}

export function session(day: string, exercises: Array<{ id: string; name?: string; sets: LoggedSet[] }>, splitId = 'split_push'): Session {
  return sessionAt(`${day}T17:00:00.000Z`, `${day}T18:00:00.000Z`, exercises, splitId);
}

/** Like `session()`, but with exact start/end instants, for recovery-model tests that need precise gaps. */
export function sessionAt(startedAt: string, endedAt: string, exercises: Array<{ id: string; name?: string; sets: LoggedSet[] }>, splitId = 'split_push'): Session {
  return {
    id: newId('s'),
    splitId,
    splitName: 'Push',
    day: startedAt.slice(0, 10),
    startedAt,
    endedAt,
    durationSec: Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000)),
    exercises: exercises.map(e => ({ exerciseId: e.id, name: e.name ?? e.id, sets: e.sets })),
    logging: liveLogging(startedAt, endedAt),
  };
}

/** Pass `null` for effort to leave it unrated. */
export const sets = (kg: number, reps: number, effort: LoggedSet['effort'] | null = 'ideal', n = 3): LoggedSet[] =>
  Array.from({ length: n }, () => (effort ? { kg, reps, effort } : { kg, reps }));

/** An established lifter with no profile facts set: keeps recovery priors neutral (1.0) in tests. */
export const establishedProfile: Profile = { name: 'Test', trainingSince: '2015-01' };
export const noCheckIns: CheckIn[] = [];
export const noFreshMarks: FreshMark[] = [];
export const freshRecoveryModel: RecoveryModel = { tauScale: {}, observations: {} };
export const noFeedback: InsightFeedback[] = [];

/** Every field CoachContext needs beyond sessions/splits/schedule/custom/today/now, defaulted for tests that don't care. */
export const baseCoachExtras = {
  profileHistory: [],
  profile: establishedProfile,
  healthDays: [],
  checkIns: noCheckIns,
  freshMarks: noFreshMarks,
  recoveryModel: freshRecoveryModel,
  deload: null,
  feedback: noFeedback,
};
