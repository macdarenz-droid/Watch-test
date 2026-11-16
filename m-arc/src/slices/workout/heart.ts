/**
 * Live-only heart capture for the active session (6.3). Keeps an in-memory
 * ring that survives tab switches but not restarts — the series before a
 * restart is lost, which is stated in the UI, not hidden. Nothing here
 * touches AppState directly except the one write at finish/discard.
 */
import { effect } from '@preact/signals';
import { latestMeasurement, watchStatus } from '@/native/watch';
import { state } from '@/core/store';
import { today } from '@/app/selectors';
import { downsampleToBuckets, preSetBpmFromWindow, setHeartFromWindow, sessionHeartSummary, hrMax, restingHr, bestObservedHrMax } from '@/brain/heart';
import { sessionEnergy } from '@/brain/energy';
import { storeSeries, exportHeart } from '@/core/heartStore';
import type { Session, SetHeart } from '@/core/models';

interface RawSample { tSec: number; bpm: number; contact: boolean | null }
let rawSamples: RawSample[] = [];
/** The last measurement recorded: the plugin can re-deliver one, and a re-run effect sees the same one again. */
let lastReceivedAt = -1;

export function resetHeartCapture(): void {
  rawSamples = [];
  lastReceivedAt = -1;
}

export function discardHeartCapture(): void { rawSamples = []; lastReceivedAt = -1; }

let capturing = false;

/** Call once, from main.tsx. Records a sample only while a session is active. */
export function startHeartCapture(): void {
  if (capturing) return;
  capturing = true;
  effect(() => {
    const m = latestMeasurement.value;
    // Only the measurement drives this effect; the session is read without subscribing (UI-21).
    const a = state.peek().active;
    if (!m || !a || m.receivedAtEpochMs === lastReceivedAt) return;
    // NAT-02: a paused session records nothing, so paused time adds no samples, zones or energy.
    if (a.pausedAt) return;
    // The time base is the session's own start, so a restart mid-session keeps the same clock.
    const tSec = Math.round((m.receivedAtEpochMs - Date.parse(a.startedAt)) / 1000);
    if (!Number.isFinite(tSec) || tSec < 0) return;
    lastReceivedAt = m.receivedAtEpochMs;
    rawSamples.push({ tSec, bpm: m.bpm, contact: m.contact });
  });
}

/**
 * The last n contact=true bpm readings, oldest first, for restTarget()'s "3 consecutive settled samples".
 * NAT-01: during a rest, only readings from that rest count, so an old low reading never ends it.
 */
export function recentLiveBpms(n = 3): number[] {
  const fromSec = currentRestStartSec();
  return rawSamples.filter(s => s.contact !== false && (fromSec == null || s.tSec >= fromSec)).slice(-n).map(s => s.bpm);
}

/** Seconds into the session when the current rest began: the later of the last set's commit and the rest's own start. */
function currentRestStartSec(): number | null {
  const a = state.peek().active;
  if (!a?.rest) return null;
  const start = Date.parse(a.startedAt);
  let from = a.rest.endsAt - a.rest.totalSec * 1000;
  for (const e of a.entries) for (const x of e.sets) {
    const at = x.at ? Date.parse(x.at) : NaN;
    if (Number.isFinite(at) && at > from) from = at;
  }
  return Number.isFinite(start) ? (from - start) / 1000 : null;
}

/**
 * RECOVERY-F18: the heart rate before the set that was just committed (the trough of the rest
 * before it), for heart-guided rest. Not the bpm at the commit, which is the end-of-set peak.
 * Undefined without enough signal in that window: the rest target then uses its reserve term alone.
 */
export function preSetBpmFor(fromSec: number, toSec: number): number | undefined {
  return preSetBpmFromWindow(downsampleToBuckets(rawSamples), fromSec, toSec) ?? undefined;
}

/** setStartSec/setEndSec: seconds since the session started (see resetHeartCapture). */
export function heartForSet(setStartSec: number, setEndSec: number): SetHeart | undefined {
  if (!rawSamples.length) return undefined;
  const series = downsampleToBuckets(rawSamples);
  return setHeartFromWindow(series, setStartSec, setEndSec) ?? undefined;
}

/** Computes the session's heart summary and stores its series. Returns the session unchanged when nothing was captured. */
export function finishHeartCapture(session: Session): Session {
  if (!rawSamples.length) return session;
  // BUG-19: a forgotten Finish ends the session at its last set plus a margin, so the samples
  // recorded after that end (the watch still on the wrist for hours) are not this session's.
  const endSec = (Date.parse(session.endedAt) - Date.parse(session.startedAt)) / 1000;
  const series = downsampleToBuckets(Number.isFinite(endSec) ? rawSamples.filter(x => x.tSec <= endSec) : rawSamples);
  storeSeries(session.id, series);
  if (!series.length) return session;
  const s = state.value;
  const restBpm = restingHr(s.healthDays, s.profile, today.value);
  const priorAndThis = s.sessions.some(x => x.id === session.id) ? s.sessions : [...s.sessions, session];
  const observed = bestObservedHrMax(priorAndThis.map(x => ({ id: x.id, endedAt: x.endedAt })), { ...exportHeart(), [session.id]: series });
  const maxBpm = hrMax(s.profile, observed).bpm;
  const quality = Math.min(1, series.length / Math.max(1, Math.ceil(session.durationSec / 5)));
  const energy = sessionEnergy({ series, profile: s.profile, today: today.value, quality, activeSec: session.durationSec }) ?? undefined;
  const sets = session.exercises.flatMap(e => e.sets);
  const summary = sessionHeartSummary({ series, sessionSec: session.durationSec, hrMaxBpm: maxBpm, restingHrBpm: restBpm, sets, energy });
  if (!summary) return session;
  return { ...session, heart: { ...summary, source: 'ble', deviceName: watchStatus.value.deviceName } };
}
