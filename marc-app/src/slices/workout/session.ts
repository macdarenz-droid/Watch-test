/**
 * The live workout. One active session at a time, stored in state so it
 * survives app restarts. All mutations go through `update` so they persist.
 */
import type { ActiveSession, Exercise, LoggedSet, Session, Split } from '@/core/models';
import { newId } from '@/core/models';
import { state, update, flushSave } from '@/core/store';
import { findExercise } from '@/core/exercises';
import { isWorkingSet } from '@/brain/exposure';
import { dayKey } from '@/core/dates';
import { cancelRestDone, scheduleRestDone } from '@/native/notifications';
import { haptic } from '@/native/haptics';
import { beginHeartRateSession, discardHeartRateSession, finishHeartRateSession } from '@/heart-rate/store';

export const REST_MIN = 15, REST_MAX = 600, REST_STEP = 15;

export function active(): ActiveSession | null { return state.value.active; }

function patchActive(fn: (a: ActiveSession) => ActiveSession): void {
  update(s => (s.active ? { ...s, active: fn(s.active) } : s));
}

export function startSession(split: Split): void {
  if (state.value.active) return;
  const sessionId = newId('s');
  const startedAt = new Date().toISOString();
  const custom = state.value.customExercises;
  const entries: ActiveSession['entries'] = split.exercises.map(se => {
    const ex = findExercise(se.exerciseId, custom);
    return { id: newId('entry'), exerciseId: se.exerciseId, name: ex?.name ?? se.exerciseId, sets: Array.from({ length: se.sets }, () => ({ id: newId('set') })), done: false, skipped: false };
  });
  update(s => ({ ...s, active: { id: sessionId, splitId: split.id, startedAt, pausedMs: 0, entries } }));
  flushSave();
  void beginHeartRateSession(sessionId, startedAt);
  void haptic.medium();
}

export function elapsedSec(a: ActiveSession, now = Date.now()): number {
  const paused = a.pausedMs + (a.pausedAt ? now - a.pausedAt : 0);
  return Math.max(0, Math.round((now - new Date(a.startedAt).getTime() - paused) / 1000));
}

export function pauseSession(): void {
  patchActive(a => (a.pausedAt ? a : { ...a, pausedAt: Date.now(), rest: a.rest ? { ...a.rest, pausedRemainingSec: Math.max(0, Math.round((a.rest.endsAt - Date.now()) / 1000)) } : undefined }));
  void cancelRestDone();
}

export function resumeSession(): void {
  patchActive(a => {
    if (!a.pausedAt) return a;
    const rest = a.rest?.pausedRemainingSec != null ? { endsAt: Date.now() + a.rest.pausedRemainingSec * 1000, totalSec: a.rest.totalSec } : a.rest;
    if (rest) void scheduleRestDone(rest.endsAt);
    return { ...a, pausedMs: a.pausedMs + (Date.now() - a.pausedAt), pausedAt: undefined, rest };
  });
}

export function setSet(entry: number, index: number, patch: Partial<LoggedSet>): void {
  patchActive(a => {
    const entries = a.entries.map((e, i) => i !== entry ? e : { ...e, sets: e.sets.map((s, j) => (j !== index ? s : { ...s, ...patch })) });
    return { ...a, entries };
  });
}

/** Commit a set. Starts the rest timer when auto-rest is on. Returns true if the set counts. */
export function commitSet(entry: number, index: number): boolean {
  const a = active();
  const set = a?.entries[entry]?.sets[index];
  if (!a || !set || !isWorkingSet(set)) return false;
  if (!set.loggedAt) {
    patchActive(current => ({
      ...current,
      entries: current.entries.map((item, i) => i !== entry ? item : {
        ...item,
        sets: item.sets.map((value, j) => j !== index ? value : { ...value, loggedAt: new Date().toISOString() }),
      }),
    }));
  }
  if (state.value.preferences.autoRest) startRest(state.value.preferences.restDefaultSec);
  void haptic.light();
  return true;
}

export function addSet(entry: number): void {
  patchActive(a => ({ ...a, entries: a.entries.map((e, i) => {
    if (i !== entry) return e;
    const previous = e.sets[e.sets.length - 1];
    const next: LoggedSet = {
      id: newId('set'),
      kg: previous?.kg,
      reps: previous?.reps,
      durationSec: previous?.durationSec,
      distanceM: previous?.distanceM,
    };
    return { ...e, sets: [...e.sets, next] };
  }) }));
}

export function removeSet(entry: number, index: number): void {
  patchActive(a => ({ ...a, entries: a.entries.map((e, i) => (i !== entry || e.sets.length <= 1 ? e : { ...e, sets: e.sets.filter((_, j) => j !== index) })) }));
}

export function markDone(entry: number, done = true): void {
  patchActive(a => ({ ...a, entries: a.entries.map((e, i) => (i !== entry ? e : { ...e, done, skipped: false })) }));
  if (done) void haptic.success();
}

export function skipEntry(entry: number, skipped = true): void {
  patchActive(a => ({ ...a, entries: a.entries.map((e, i) => (i !== entry ? e : { ...e, skipped, done: false })) }));
}

export function addExerciseToSession(ex: Exercise, sets = ex.defaultSets): void {
  patchActive(a => (a.entries.some(e => e.exerciseId === ex.id) ? a : { ...a, entries: [...a.entries, { id: newId('entry'), exerciseId: ex.id, name: ex.name, sets: Array.from({ length: sets }, () => ({ id: newId('set') })), done: false, skipped: false }] }));
}

export function removeEntry(entry: number): void {
  patchActive(a => ({ ...a, entries: a.entries.filter((_, i) => i !== entry) }));
}

export function startRest(sec: number): void {
  const total = Math.max(REST_MIN, Math.min(REST_MAX, sec));
  const endsAt = Date.now() + total * 1000;
  patchActive(a => ({ ...a, rest: { endsAt, totalSec: total } }));
  void scheduleRestDone(endsAt);
}

export function adjustRest(deltaSec: number): void {
  const a = active();
  if (!a?.rest) return;
  const remaining = Math.max(0, (a.rest.endsAt - Date.now()) / 1000) + deltaSec;
  const endsAt = Date.now() + Math.max(5, Math.min(REST_MAX, remaining)) * 1000;
  patchActive(x => ({ ...x, rest: x.rest ? { ...x.rest, endsAt, totalSec: Math.max(x.rest.totalSec, Math.round(remaining)) } : x.rest }));
  void scheduleRestDone(endsAt);
}

export function stopRest(): void {
  patchActive(a => ({ ...a, rest: undefined }));
  void cancelRestDone();
}

export function restRemainingSec(a: ActiveSession, now = Date.now()): number | null {
  if (!a.rest) return null;
  if (a.pausedAt && a.rest.pausedRemainingSec != null) return a.rest.pausedRemainingSec;
  return Math.max(0, Math.round((a.rest.endsAt - now) / 1000));
}

export interface FinishSummary { session: Session; changedTemplate: boolean }

/** Turn the active session into history. Sets that were never filled are dropped. */
export function finishSession(saveTemplate: boolean): FinishSummary | null {
  const a = active();
  if (!a) return null;
  const split = state.value.splits.find(s => s.id === a.splitId);
  const now = new Date();
  const exercises = a.entries
    .filter(e => !e.skipped)
    .map(e => ({ exerciseId: e.exerciseId, name: e.name, sets: e.sets.filter(isWorkingSet) }))
    .filter(e => e.sets.length);
  const session: Session = {
    id: a.id,
    splitId: a.splitId,
    splitName: split?.name ?? 'Workout',
    day: dayKey(now),
    startedAt: a.startedAt,
    endedAt: now.toISOString(),
    durationSec: elapsedSec(a, now.getTime()),
    exercises,
  };
  const templateIds = (split?.exercises ?? []).map(e => e.exerciseId).join('|');
  const sessionIds = a.entries.filter(e => !e.skipped).map(e => e.exerciseId).join('|');
  const changedTemplate = !!split && templateIds !== sessionIds;
  update(s => ({
    ...s,
    active: null,
    sessions: exercises.length ? [...s.sessions, session].sort((x, y) => x.startedAt.localeCompare(y.startedAt)) : s.sessions,
    splits: saveTemplate && split
      ? s.splits.map(sp => (sp.id !== split.id ? sp : { ...sp, exercises: a.entries.filter(e => !e.skipped).map(e => ({ exerciseId: e.exerciseId, sets: Math.max(1, e.sets.length) })) }))
      : s.splits,
  }));
  flushSave();
  void finishHeartRateSession(session.id, session.endedAt).then(summary => {
    if (!summary) return;
    update(current => ({ ...current, sessions: current.sessions.map(value => value.id === session.id ? { ...value, heartRate: summary } : value) }));
    flushSave();
  }).catch(() => undefined);
  void cancelRestDone();
  void haptic.success();
  return { session, changedTemplate };
}

export function discardSession(): void {
  const sessionId = state.value.active?.id;
  update(s => ({ ...s, active: null }));
  flushSave();
  if (sessionId) void discardHeartRateSession(sessionId);
  void cancelRestDone();
}
