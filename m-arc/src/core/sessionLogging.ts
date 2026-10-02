/** Session logging for data that predates it (RG-12): core code needs it without importing the brain. */
import type { SessionLogging } from './models';

/** For a session that predates this field (an already-saved session, or a legacy v36 import). */
export function legacySessionLogging(startedAt: string, endedAt: string): SessionLogging {
  return {
    mode: 'legacy',
    trainedAt: startedAt,
    trainedEndAt: endedAt || startedAt,
    loggedAt: endedAt || startedAt,
    timeSource: 'default',
    liveShare: 0,
    timingTrusted: false,
    contentConfidence: 'medium',
    flags: ['legacy'],
  };
}
