/**
 * The live workout. One active session at a time, stored in state so it
 * survives app restarts. All mutations go through `update` so they persist.
 */
import type { ActiveSession, AppState, Exercise, LoggedSet, PlannedTarget, RecoveryModel, Session, SessionLogging, Split, TodayOverride } from '@/core/models';
import { newId } from '@/core/models';
import { MAX_EXERCISE_NOTE, state, update, flushSave } from '@/core/store';
import { findExercise } from '@/core/exercises';
import { hasEntry, isWorkingSet } from '@/brain/exposure';
import { BURST_WINDOW_MS, LIVE_GAP_SEC, classifySetFidelity, liveSessionLogging, retroSessionLogging } from '@/brain/fidelity';
import { calibrateAfterSession, lastSummaryAlone, replayRecoveryModel } from '@/brain/recovery';
import { dayKey, todayKey } from '@/core/dates';
import { cancelRestDone, scheduleRestDone } from '@/native/notifications';
import { haptic } from '@/native/haptics';
import { backgroundHealthSync } from '@/slices/settings/health';
import { connectWatch } from '@/native/watch';
import { resyncReminders } from '@/slices/settings/reminders';
import { resetHeartCapture, discardHeartCapture, heartForSet, finishHeartCapture, preSetBpmFor } from './heart';

export const REST_MIN = 15, REST_MAX = 600;

/** Sessions oldest first by start (RG-05). Sort is stable, so equal starts keep their order. */
export const sortByStart = (sessions: Session[]): Session[] => [...sessions].sort((x, y) => x.startedAt.localeCompare(y.startedAt));

/**
 * QA-R2b-6: the sessions finishSession calibrated from, so a rebuild learns from the same ones:
 * everything finished in the app (live, mixed, compressed, and pre-logging 'legacy' saves), but
 * not a session typed in afterwards (retro without 'compressed').
 */
const calibratesAtFinish = (sess: Session): boolean => !sess.logging || sess.logging.mode !== 'retro' || sess.logging.flags.includes('compressed');

/**
 * UI-12: the recovery model is learned from live sessions in order. After history is edited or
 * a session deleted, rebuild it from scratch so it matches what is left (BUG-17: with the same
 * inputs finishSession had, see replayRecoveryModel).
 */
export function rebuildRecoveryModel(s: Pick<AppState, 'sessions' | 'customExercises' | 'profile' | 'healthDays'>): RecoveryModel {
  return replayRecoveryModel(sortByStart(s.sessions), s.customExercises, s.profile, s.healthDays, calibratesAtFinish);
}

export function active(): ActiveSession | null { return state.value.active; }

function patchActive(fn: (a: ActiveSession) => ActiveSession): void {
  update(s => (s.active ? { ...s, active: fn(s.active) } : s));
}

const draftSet = (from: Partial<LoggedSet> = {}): LoggedSet => ({ ...from, id: newId('set') });
const blankSets = (n: number): LoggedSet[] => Array.from({ length: n }, () => draftSet());
export const isCommitted = (set: LoggedSet): boolean => set.status === 'committed' || !!set.at;

/**
 * ES-02: the split as today's applied Escobar adjustment reshapes it (swap, remove, add, sets,
 * load). Only for today's override of this split; otherwise the split as saved.
 */
export function plannedExercises(split: Split, override: TodayOverride | null, today = todayKey()): Array<{ exerciseId: string; sets: number; loadFactor?: number }> {
  let list: Array<{ exerciseId: string; sets: number; loadFactor?: number }> = split.exercises.map(e => ({ ...e }));
  if (!override || override.day !== today || override.splitId !== split.id) return list;
  for (const c of override.changes) {
    // QA-R4a-10: a swap to an exercise already in the list just drops the one swapped out.
    // QA2-FD-9: a swap to itself changes nothing.
    if (c.kind === 'swap') { if (c.to === c.from) continue; list = list.some(e => e.exerciseId === c.to) ? list.filter(e => e.exerciseId !== c.from) : list.map(e => (e.exerciseId === c.from ? { ...e, exerciseId: c.to } : e)); }
    else if (c.kind === 'remove') list = list.filter(e => e.exerciseId !== c.exerciseId);
    else if (c.kind === 'add') { if (!list.some(e => e.exerciseId === c.exerciseId)) list.push({ exerciseId: c.exerciseId, sets: c.sets }); }
    else if (c.kind === 'sets') list = list.map(e => (e.exerciseId === c.exerciseId ? { ...e, sets: c.sets } : e));
    else if (c.kind === 'load') list = list.map(e => (e.exerciseId === c.exerciseId ? { ...e, loadFactor: c.factor } : e));
  }
  return list;
}

/** QA-R4a-5/9: the split as it will run today, for the "Before you start" brief. */
export function todaySplit(split: Split, override: TodayOverride | null, today = todayKey()): Omit<Split, 'exercises'> & { exercises: Array<{ exerciseId: string; sets: number; loadFactor?: number }> } {
  return { ...split, exercises: plannedExercises(split, override, today) };
}

export function startSession(split: Split): void {
  if (state.value.active) return;
  const custom = state.value.customExercises;
  const entries: ActiveSession['entries'] = plannedExercises(split, state.value.escobar.todayOverride).map(se => {
    const ex = findExercise(se.exerciseId, custom);
    return { id: newId('e'), exerciseId: se.exerciseId, name: ex?.name ?? se.exerciseId, sets: blankSets(se.sets), done: false, skipped: false, ...(se.loadFactor != null ? { loadFactor: se.loadFactor } : {}) };
  });
  const startedAt = new Date().toISOString();
  update(s => ({ ...s, active: { id: newId('s'), splitId: split.id, startedAt, pausedMs: 0, entries, gymId: s.units.activeGymId } }));
  flushSave();
  resetHeartCapture();
  void haptic.confirm();
  void backgroundHealthSync();
  const w = state.value.preferences.watch;
  if (w.autoConnectOnSession && w.deviceAddress) void connectWatch(w.deviceAddress);
}

export function elapsedSec(a: ActiveSession, now = Date.now()): number {
  return Math.max(0, Math.round((now - new Date(a.startedAt).getTime() - pausedTotalMs(a, now)) / 1000));
}

/** Every millisecond this session has spent paused up to `now`, the running pause included. */
const pausedTotalMs = (a: ActiveSession, now: number): number => a.pausedMs + (a.pausedAt ? Math.max(0, now - a.pausedAt) : 0);

/**
 * BUG-19 (DATES-F5): the session's paused total at each set's commit, by set id, so a later gap
 * can take out only the pause that fell inside it. Kept in memory, not saved: after an app restart
 * a gap in a session that has paused is unknown, and plan scenario 6 then marks it delayed.
 */
const pausedAtCommit = new Map<string, number>();

/** Paused ms inside the gap since a commit, or null when it cannot be known (see pausedAtCommit). */
function pausedSince(a: ActiveSession, setId: string | undefined, sinceMs: number, now: number): number | null {
  const total = pausedTotalMs(a, now);
  if (total === 0) return 0;
  const before = setId != null ? pausedAtCommit.get(setId) : undefined;
  if (before == null) return null;
  return Math.max(0, Math.min(now - sinceMs, total - before));
}

/**
 * BUG-19 (DATES-F5): a set's own working time. A timed set says it; a rep set is 3 s a rep, the
 * self-selected pace (1.5 s up, 1.5 s down) in Hermes et al. 2020, PeerJ 8:e8697.
 */
export const SEC_PER_REP = 3;
export const setWorkSec = (set: Pick<LoggedSet, 'reps' | 'durationSec'>): number => set.durationSec ?? (set.reps ?? 0) * SEC_PER_REP;

/**
 * BUG-19 (DATES-F1): Finish more than this long after the last set was a forgotten Finish: the
 * plan's longest plausible gap between two live commits (LIVE_GAP_SEC, 6.17.2 :815).
 */
export const FORGOT_FINISH_SEC = LIVE_GAP_SEC[1];
/** ...and the session then ends this long after the last set: re-racking, a stretch, the walk out. */
export const FINISH_MARGIN_SEC = 5 * 60;

export interface FinishTiming { endedAtMs: number; durationSec: number; trimmed: boolean }

/**
 * BUG-19 (DATES-F1, DATES-F2): when the session ended and how long it trained, without pauses.
 * Finishing soon after the last set ends it now. Finishing long after ends it at the last set plus
 * FINISH_MARGIN_SEC, so a forgotten Finish never saves the hours in between. The finish sheet and
 * finishSession both read this, so the sheet shows what is saved.
 */
export function finishTiming(a: ActiveSession, now = Date.now()): FinishTiming {
  const full = elapsedSec(a, now);
  let last: { id?: string; ms: number } | undefined;
  for (const e of a.entries) for (const x of e.sets) {
    const ms = x.at ? Date.parse(x.at) : NaN;
    if (Number.isFinite(ms) && ms <= now && (!last || ms > last.ms)) last = { id: x.id, ms };
  }
  if (!last || now - last.ms <= FORGOT_FINISH_SEC * 1000) return { endedAtMs: now, durationSec: full, trimmed: false };
  const endedAtMs = last.ms + FINISH_MARGIN_SEC * 1000;
  // Paused before the last set: known from its commit, else at least what the gap cannot hold.
  const known = last.id != null ? pausedAtCommit.get(last.id) : undefined;
  const pausedBefore = pausedTotalMs(a, now) === 0 ? 0 : known ?? Math.max(0, pausedTotalMs(a, now) - (now - last.ms));
  const activeAtLast = Math.max(0, Math.round((last.ms - Date.parse(a.startedAt) - pausedBefore) / 1000));
  return { endedAtMs, durationSec: Math.min(full, activeAtLast + FINISH_MARGIN_SEC), trimmed: true };
}

export function pauseSession(): void {
  patchActive(a => (a.pausedAt ? a : { ...a, pausedAt: Date.now(), rest: a.rest ? { ...a.rest, pausedRemainingSec: Math.max(0, Math.round((a.rest.endsAt - Date.now()) / 1000)) } : undefined }));
  void cancelRestDone();
}

export function resumeSession(): void {
  patchActive(a => {
    if (!a.pausedAt) return a;
    const rest = a.rest?.pausedRemainingSec != null ? { ...a.rest, endsAt: Date.now() + a.rest.pausedRemainingSec * 1000, pausedRemainingSec: undefined } : a.rest;
    if (rest) void scheduleRestDone(rest.endsAt);
    return { ...a, pausedMs: a.pausedMs + (Date.now() - a.pausedAt), pausedAt: undefined, rest };
  });
}

/**
 * A committed set that is emptied is a draft while empty (it is not kept if left that way), but
 * it keeps its commit: correcting reps by clearing and retyping must not move its time or restart
 * rest (QA-R2b-1). Refilled, it is committed again with its original timing.
 */
function patched(set: LoggedSet, patch: Partial<LoggedSet>): LoggedSet {
  const next = { ...set, ...patch };
  if (isCommitted(set) && !hasEntry(next) && !('at' in patch)) return { ...next, status: 'draft' };
  if (set.status === 'draft' && next.at && hasEntry(next) && !('status' in patch)) return { ...next, status: 'committed' };
  return next;
}

export function setSetById(setId: string, patch: Partial<LoggedSet>): void {
  patchActive(a => ({ ...a, entries: a.entries.map(e => (e.sets.some(s => s.id === setId) ? { ...e, sets: e.sets.map(s => (s.id === setId ? patched(s, patch) : s)) } : e)) }));
}

export function setSet(entry: number, index: number, patch: Partial<LoggedSet>): void {
  patchActive(a => {
    const entries = a.entries.map((e, i) => i !== entry ? e : { ...e, sets: e.sets.map((s, j) => (j !== index ? s : patched(s, patch))) });
    return { ...a, entries };
  });
}

/** Every already-committed set's time and id, oldest first, used to judge the next commit's timing. */
function committedTimestamps(a: ActiveSession): Array<{ id?: string; t: number }> {
  return a.entries.flatMap(e => e.sets).filter(s => !!s.at).map(s => ({ id: s.id, t: new Date(s.at!).getTime() })).sort((x, y) => x.t - y.t);
}

/**
 * Commit a set once (UI-01): a second blur or tap on a committed set changes nothing. Starts the
 * rest timer only on a live commit. `actionAt` is when the person actually did it (a watch tap
 * relayed later): it drives fidelity and rest instead of the receipt time. Returns true if the set counts.
 */
export function commitSetById(setId: string, opts: { actionAt?: string } = {}): boolean {
  const a = active();
  const set = a?.entries.flatMap(e => e.sets).find(s => s.id === setId);
  // QA2-FB-5: a set left empty when its field loses focus gives up its commit, so a later real
  // entry gets its own time and rest instead of the mistaken one's.
  // QA3-4: only when it is the most recently committed set - a mistaken commit is always the
  // last one. Clearing and retyping an earlier set must not move its time or restart rest.
  if (a && set && !hasEntry(set) && set.at) {
    if (latestCommittedSetId(a) === setId) {
      setSetById(setId, { at: undefined, restSec: undefined, fidelity: undefined, heart: undefined, status: 'draft' });
    }
    return false;
  }
  // F2: a filled-in warm-up commits too (it gets its time), it just never starts auto-rest.
  if (!a || !set || !hasEntry(set)) return false;
  if (isCommitted(set)) return true;
  const action = opts.actionAt ? Date.parse(opts.actionAt) : NaN;
  const now = Number.isFinite(action) ? Math.min(action, Date.now()) : Date.now();
  const prior = committedTimestamps(a).filter(p => p.t <= now);
  const lastCommit = prior[prior.length - 1];
  const last = lastCommit?.t;
  // BUG-19 (DATES-F5): a Pause the person tapped is not rest, and not a late log either (plan
  // scenario 6). A gap whose pause is unknown is delayed and gets no rest.
  const paused = lastCommit ? pausedSince(a, lastCommit.id, lastCommit.t, now) : 0;
  const gapSec = last != null && paused != null ? Math.round((now - last - paused) / 1000) : null;
  const burstCount = prior.filter(p => now - p.t <= BURST_WINDOW_MS).length + 1;
  const fidelity = last != null && paused == null ? 'delayed' : classifySetFidelity(gapSec, burstCount);
  const startedAtMs = new Date(a.startedAt).getTime();
  const heart = fidelity === 'live' ? heartForSet(Math.max(0, Math.round(((last ?? startedAtMs) - startedAtMs) / 1000)), Math.round((now - startedAtMs) / 1000)) : undefined;
  // BUG-19 (DATES-F5): rest ends when this set starts, so its own working time comes off the gap.
  const restSec = gapSec != null ? Math.min(REST_MAX, Math.max(0, gapSec - setWorkSec(set))) : undefined;
  pausedAtCommit.set(setId, pausedTotalMs(a, now));
  setSetById(setId, { at: new Date(now).toISOString(), restSec, fidelity, heart, status: 'committed' });
  if (state.value.preferences.autoRest && fidelity === 'live' && set.kind !== 'warmup') {
    startRest(state.value.preferences.restDefaultSec, set.effort, preSetBpmFor(Math.max(0, Math.round(((last ?? startedAtMs) - startedAtMs) / 1000)), Math.round((now - startedAtMs) / 1000)), now);
    const entry = a.entries.find(e => e.sets.some(x => x.id === setId));
    if (entry) restStartedBy = { setId, exerciseId: entry.exerciseId };
  }
  void haptic.confirm();
  return true;
}

const withoutTarget = <T extends { target?: unknown }>({ target: _t, ...rest }: T): Omit<T, 'target'> => rest;

/** LT-3 (D-A4 a): keeps set 1's target as shown at its commit, once per entry, so the verdict and the next session never recompute it. */
export function setEntryTarget(entryId: string | undefined, target: PlannedTarget): void {
  if (!entryId || !(target.kg > 0) || !(target.reps > 0)) return;
  patchActive(a => (a.entries.some(e => e.id === entryId && !e.target) ? { ...a, entries: a.entries.map(e => (e.id === entryId ? { ...e, target: { kg: target.kg, reps: target.reps } } : e)) } : a));
}

export function commitSet(entry: number, index: number): boolean {
  const set = active()?.entries[entry]?.sets[index];
  if (!set) return false;
  if (!set.id) setSet(entry, index, { id: newId('set') });
  return commitSetById(active()!.entries[entry]!.sets[index]!.id!);
}

/** The latest committed set in the session, if any (UI-31). */
export function latestCommittedSetId(a: ActiveSession): string | undefined {
  let best: { id?: string; at: string } | undefined;
  for (const e of a.entries) for (const s of e.sets) if (s.at && (!best || s.at > best.at)) best = { id: s.id, at: s.at };
  return best?.id;
}

/** UI-31: rating the effort of the set just done updates the running rest's heart target. */
export function setRestEffort(effort: LoggedSet['effort']): void {
  patchActive(a => (a.rest ? { ...a, rest: { ...a.rest, effort } } : a));
}

/** The next set carries the load and reps forward, never the previous set's timing or effort (UI-01). */
export function addSet(entry: number): void {
  patchActive(a => ({ ...a, entries: a.entries.map((e, i) => {
    if (i !== entry) return e;
    const last = e.sets[e.sets.length - 1];
    const carry: Partial<LoggedSet> = last ? { kg: last.kg, entered: last.entered, reps: last.reps, durationSec: last.durationSec, distanceM: last.distanceM } : {};
    for (const k of Object.keys(carry) as Array<keyof LoggedSet>) if (carry[k] === undefined) delete carry[k];
    return { ...e, sets: [...e.sets, draftSet(carry)] };
  }) }));
}

/** F2 "Log warm-ups": puts the ramp in front of the working sets, once. They are logged, never counted. */
export function logWarmups(entry: number, sets: Array<Pick<LoggedSet, 'kg' | 'entered' | 'reps'>>): void {
  patchActive(a => ({ ...a, entries: a.entries.map((e, i) => (i !== entry || e.sets.some(x => x.kind === 'warmup') ? e : { ...e, sets: [...sets.map(w => draftSet({ ...w, kind: 'warmup' })), ...e.sets] })) }));
}

/** F1: today's note for one exercise. */
export function setEntryNote(entry: number, note: string): void {
  patchActive(a => ({ ...a, entries: a.entries.map((e, i) => (i !== entry ? e : { ...e, note: note.slice(0, 500) || undefined })) }));
}

/** F1: the sticky setup note (seat height, grip) shown every time this exercise comes up. */
export function setExerciseNote(exerciseId: string, note: string): void {
  const text = note.trim().slice(0, MAX_EXERCISE_NOTE);
  update(s => {
    const { [exerciseId]: _old, ...rest } = s.exerciseNotes;
    return { ...s, exerciseNotes: text ? { ...rest, [exerciseId]: text } : rest };
  });
}

export function removeSet(entry: number, index: number): void {
  patchActive(a => ({ ...a, entries: a.entries.map((e, i) => (i !== entry || e.sets.length <= 1 ? e : { ...e, sets: e.sets.filter((_, j) => j !== index) })) }));
}

/** F10/QA10-2: Undo for "Remove last set"/"Delete set" — restores the exact set object (id
 * included), so a heart-capture or fidelity link made to it survives. Identity-checked, not
 * index-based: a no-op unless this is still the same session, the entry is still there, and no
 * set with this id is already present (a stale toast, or a second Undo tap). `at` is clamped to
 * the entry's current length. */
export function insertSet(sessionId: string, entryId: string, at: number, set: LoggedSet): void {
  patchActive(a => {
    if (a.id !== sessionId) return a;
    const i = a.entries.findIndex(e => e.id === entryId);
    if (i < 0 || a.entries[i]!.sets.some(x => x.id === set.id)) return a;
    const clamped = Math.max(0, Math.min(at, a.entries[i]!.sets.length));
    return { ...a, entries: a.entries.map((e, j) => (j !== i ? e : { ...e, sets: [...e.sets.slice(0, clamped), set, ...e.sets.slice(clamped)] })) };
  });
}

export function markDone(entry: number, done = true): void {
  patchActive(a => ({ ...a, entries: a.entries.map((e, i) => (i !== entry ? e : { ...e, done, skipped: false })) }));
  if (done) void haptic.confirm(); else void haptic.tick();
}

export function skipEntry(entry: number, skipped = true): void {
  patchActive(a => ({ ...a, entries: a.entries.map((e, i) => (i !== entry ? e : { ...e, skipped, done: false })) }));
}

export function addExerciseToSession(ex: Exercise, sets = ex.defaultSets): void {
  patchActive(a => (a.entries.some(e => e.exerciseId === ex.id) ? a : { ...a, entries: [...a.entries, { id: newId('e'), exerciseId: ex.id, name: ex.name, sets: blankSets(sets), done: false, skipped: false }] }));
}

/** Reorder the live session: hold an exercise and drag it up or down. */
export function moveEntry(from: number, to: number): void {
  patchActive(a => {
    if (from === to || from < 0 || to < 0 || from >= a.entries.length || to >= a.entries.length) return a;
    const entries = [...a.entries];
    const [item] = entries.splice(from, 1);
    entries.splice(to, 0, item!);
    return { ...a, entries };
  });
}

export function removeEntryById(entryId: string): void {
  patchActive(a => ({ ...a, entries: a.entries.filter(e => e.id !== entryId) }));
}

export function removeEntry(entry: number): void {
  patchActive(a => ({ ...a, entries: a.entries.filter((_, i) => i !== entry) }));
}

/** F10/QA10-2: Undo for "Remove from this session" — restores the exact entry object (id
 * included), at its original position, clamped to the current entry count. Identity-checked: a
 * no-op unless this is still the same session and no entry with this id is already present (a
 * stale toast — the session ended and a new one started — or a second Undo tap). */
export function insertEntry(sessionId: string, at: number, entry: ActiveSession['entries'][number]): void {
  patchActive(a => {
    if (a.id !== sessionId || a.entries.some(e => e.id === entry.id)) return a;
    const i = Math.max(0, Math.min(at, a.entries.length));
    return { ...a, entries: [...a.entries.slice(0, i), entry, ...a.entries.slice(i)] };
  });
}

/** F3.7: swap this entry for a substitute, e.g. a recovering muscle or a balance nudge. Blank sets: a different exercise's numbers would not mean the same thing. */
export function substituteEntry(entry: number, ex: Exercise): void {
  // QA3-8b: keeps the slot's original planned exerciseId (through any earlier substitution too),
  // so templateFromSession can find it by lineage even after a reorder or another substitution.
  // LT-3: the stored target belongs to the replaced lift, so it goes with it.
  patchActive(a => ({ ...a, entries: a.entries.map((e, i) => (i !== entry ? e : { ...withoutTarget(e), id: newId('e'), exerciseId: ex.id, name: ex.name, sets: blankSets(e.sets.length), plannedId: e.plannedId ?? e.exerciseId })) }));
}

export function startRest(sec: number, effort?: LoggedSet['effort'], preSetBpm?: number, from = Date.now()): void {
  const total = Math.max(REST_MIN, Math.min(REST_MAX, sec));
  const endsAt = from + total * 1000;
  restStartedBy = null;
  // Paused: hold the full rest until resume (UI-19); resume schedules it.
  if (active()?.pausedAt) {
    patchActive(a => ({ ...a, rest: { endsAt, totalSec: total, effort, preSetBpm, pausedRemainingSec: total } }));
    return;
  }
  patchActive(a => ({ ...a, rest: { endsAt, totalSec: total, effort, preSetBpm } }));
  if (endsAt > Date.now()) void scheduleRestDone(endsAt);
}

/**
 * BUG-21 (D-A1 point 4, review r2): the set whose commit started the running rest, kept in memory
 * only (never in RestState or storage). After an app restart it is gone, and the timer is the floor.
 */
let restStartedBy: { setId: string; exerciseId: string } | null = null;

/**
 * BUG-21 (D-A1 point 4): the user's timer is the floor for this rest unless the set that started it
 * is known (restStartedBy), still there, still a committed live working set of the same exercise,
 * and that exercise is an accessory. Deleting the set, marking it a warm-up, removing its exercise
 * or substituting it, a restart, or an unknown exercise all keep the timer as the floor.
 */
export function restTimerIsFloor(a: ActiveSession, custom: Exercise[]): boolean {
  const rec = restStartedBy;
  if (!a.rest || !rec) return true;
  const entry = a.entries.find(e => e.sets.some(x => x.id === rec.setId));
  const set = entry?.sets.find(x => x.id === rec.setId);
  if (!entry || !set || entry.exerciseId !== rec.exerciseId) return true;
  if (!isCommitted(set) || set.kind === 'warmup' || (set.fidelity ?? 'live') !== 'live') return true;
  return findExercise(entry.exerciseId, custom)?.role !== 'accessory';
}

/**
 * BUG-21 (D-A1 point 4, App A.1): heart rate may end an accessory's rest early, never a main
 * lift's. When the timer is the floor (restTimerIsFloor), the rest ends when it runs out.
 */
export function restDone(timeDone: boolean, heartReady: boolean, timerIsFloor: boolean): boolean {
  return timeDone || (heartReady && !timerIsFloor);
}

export function adjustRest(deltaSec: number): void {
  const a = active();
  if (!a?.rest) return;
  if (a.pausedAt) {
    const cur = a.rest.pausedRemainingSec ?? Math.max(0, Math.round((a.rest.endsAt - a.pausedAt) / 1000));
    const next = Math.max(5, Math.min(REST_MAX, cur + deltaSec));
    patchActive(x => ({ ...x, rest: x.rest ? { ...x.rest, pausedRemainingSec: next, totalSec: Math.max(x.rest.totalSec, next) } : x.rest }));
    return;
  }
  const remaining = Math.max(0, (a.rest.endsAt - Date.now()) / 1000) + deltaSec;
  const endsAt = Date.now() + Math.max(5, Math.min(REST_MAX, remaining)) * 1000;
  patchActive(x => ({ ...x, rest: x.rest ? { ...x.rest, endsAt, totalSec: Math.max(x.rest.totalSec, Math.round(remaining)) } : x.rest }));
  void scheduleRestDone(endsAt);
}

export function stopRest(): void {
  patchActive(a => ({ ...a, rest: undefined }));
  restStartedBy = null;
  void cancelRestDone();
}

export function restRemainingSec(a: ActiveSession, now = Date.now()): number | null {
  if (!a.rest) return null;
  if (a.pausedAt && a.rest.pausedRemainingSec != null) return a.rest.pausedRemainingSec;
  return Math.max(0, Math.round((a.rest.endsAt - now) / 1000));
}

export interface FinishSummary { session: Session; changedTemplate: boolean }

/**
 * QA-R4a-4: the person changed the exercises themselves, compared with what was planned for
 * today (the split as today's Escobar adjustment shaped it). A one-day swap or skip from Escobar
 * is not a change worth saving to the split.
 */
export function changedFromPlan(a: ActiveSession, split: Split | undefined, override = state.value.escobar.todayOverride): boolean {
  if (!split) return false;
  const planned = plannedExercises(split, override, dayKey(new Date(a.startedAt))).map(e => e.exerciseId).join('|');
  return planned !== a.entries.filter(e => !e.skipped).map(e => e.exerciseId).join('|');
}

/**
 * QA2-FD-2, QA2-FD-7: "Save for future" keeps the person's own changes and leaves out Escobar's
 * one-day ones. An exercise only Escobar brought in today (an add or a swap's target) is not
 * saved; one Escobar took out today (a remove or a swap's source) stays at its place in the split.
 */
export function templateFromSession(a: ActiveSession, split: Split, override: TodayOverride | null = state.value.escobar.todayOverride): Split['exercises'] {
  const today = dayKey(new Date(a.startedAt));
  const planned = new Set(plannedExercises(split, override, today).map(e => e.exerciseId));
  const inSplit = new Set(split.exercises.map(e => e.exerciseId));
  const done = a.entries.filter(e => !e.skipped);
  const doneIds = new Set(done.map(e => e.exerciseId));
  // QA3-6: today's one-day set-count change from Escobar is not saved either; the exercise keeps
  // the split's own count, not however many sets today's override made the live entry start with.
  // QA3-6b: only when the live count still matches the override exactly. Adding (or removing) sets
  // yourself beyond that one-day bump is your own change, and saves what you actually did.
  const overriddenSets = new Map<string, number>();
  if (override && override.day === today && override.splitId === split.id) {
    for (const c of override.changes) if (c.kind === 'sets') overriddenSets.set(c.exerciseId, c.sets);
  }
  const splitSetsById = new Map(split.exercises.map(se => [se.exerciseId, se.sets]));
  // QA3-8: a swap's target that the person substituted away during the session (not Escobar's
  // target as-is) replaces the swapped-away exercise at its own split slot; it is not an addition,
  // and the swapped-away exercise is not restored alongside it.
  // QA3-8b: found by lineage (plannedId), not by array position - a reorder (moveEntry) or an
  // earlier removeEntry shifts indices, so looking a swap target up by its position in the
  // planned order could land on a different, unrelated entry and invent a false substitution.
  const substituteForFrom = new Map<string, { exerciseId: string; sets: number }>();
  if (override && override.day === today && override.splitId === split.id) {
    for (const c of override.changes) {
      if (c.kind !== 'swap' || c.to === c.from || inSplit.has(c.to)) continue;
      const live = done.find(e => e.plannedId === c.to && e.exerciseId !== c.to);
      if (live && live.exerciseId !== c.from) {
        substituteForFrom.set(c.from, { exerciseId: live.exerciseId, sets: Math.max(1, live.sets.filter(x => x.kind !== 'warmup').length) });
      }
    }
  }
  const substitutedIds = new Set([...substituteForFrom.values()].map(v => v.exerciseId));
  const out = done
    .filter(e => (inSplit.has(e.exerciseId) || !planned.has(e.exerciseId)) && !substitutedIds.has(e.exerciseId))
    .map(e => {
      const liveCount = Math.max(1, e.sets.filter(x => x.kind !== 'warmup').length);
      const overridden = overriddenSets.get(e.exerciseId);
      return { exerciseId: e.exerciseId, sets: overridden === liveCount ? splitSetsById.get(e.exerciseId) ?? liveCount : liveCount };
    });
  // QA3-7: `out` is shorter than `split.exercises` once a person's own skips drop out of it, so an
  // Escobar-removed exercise's own split index no longer lines up with a position in `out`.
  // Insert it right after its nearest preceding split neighbour that made it into `out`.
  split.exercises.forEach((se, i) => {
    if (planned.has(se.exerciseId) || doneIds.has(se.exerciseId)) return;
    let insertAt = 0;
    for (let j = i - 1; j >= 0; j--) {
      // QA3-7b: a preceding neighbour that was itself a substituted swap never appears under its
      // own id in `out` - only its substitute does (QA3-8). Match either.
      // QA3-7c: or the person's own substitute for it (substituteEntry keeps plannedId = the split id).
      const nid = split.exercises[j]!.exerciseId;
      const pos = out.findIndex(o => o.exerciseId === nid || o.exerciseId === substituteForFrom.get(nid)?.exerciseId || done.some(e => e.exerciseId === o.exerciseId && e.plannedId === nid));
      if (pos !== -1) { insertAt = pos + 1; break; }
    }
    const sub = substituteForFrom.get(se.exerciseId);
    out.splice(insertAt, 0, sub ? { ...sub } : { ...se });
  });
  return out;
}

/**
 * AUD-10 (UI-01): the exercises Finish saves, and the Finish sheet counts from the same list.
 * Sets that were never filled are dropped. "Skip today" skips what is left: an entry skipped
 * after some sets were logged keeps those logged sets.
 */
export function savedExercises(a: ActiveSession): Session['exercises'] {
  return a.entries
    .map(e => ({ exerciseId: e.exerciseId, name: e.name, sets: e.sets.filter(set => hasEntry(set) && (!e.skipped || isCommitted(set))).map(({ status: _status, ...set }) => set), ...(e.note?.trim() ? { note: e.note.trim().slice(0, 500) } : {}), ...(e.target ? { target: e.target } : {}) }))
    .filter(e => e.sets.length);
}

/** AUD-10 (UI-01): the Finish sheet's exercise and set counts, read from what Finish will save. */
export function finishCounts(a: ActiveSession): { exercises: number; sets: number } {
  const working = savedExercises(a).map(e => e.sets.filter(isWorkingSet).length).filter(n => n > 0);
  return { exercises: working.length, sets: working.reduce((n, k) => n + k, 0) };
}

/** AUD-10 (UI-05): a completed workout cannot start after now. Both timing paths use this. */
export function startsInFuture(trainedAtLocal: string, nowMs = Date.now()): boolean {
  return new Date(trainedAtLocal).getTime() > nowMs;
}

/** Turn the active session into history. Sets that were never filled are dropped. */
export function finishSession(saveTemplate: boolean, opts: { note?: string } = {}): FinishSummary | null {
  const a = active();
  if (!a) return null;
  const split = state.value.splits.find(s => s.id === a.splitId);
  const nowMs = Date.now();
  const timing = finishTiming(a, nowMs);
  const exercises = savedExercises(a);
  // BUG-28: nothing logged, so there is nothing to save. End the session exactly like a discard
  // (history untouched, today's Escobar override kept) instead of saving an empty session.
  if (!exercises.length) { discardSession(); return null; }
  // BUG-19 (DATES-F3): only working sets that were committed carry timing evidence. A pre-filled
  // warm-up or a set that was typed but never committed has no time of its own.
  const workingSets = exercises.flatMap(e => e.sets).filter(s => s.kind !== 'warmup' && !!s.at);
  const logging = liveSessionLogging({
    setFidelities: workingSets.map(s => s.fidelity ?? 'live'),
    commitMs: workingSets.map(s => Date.parse(s.at!)),
    startedAt: a.startedAt,
    endedAt: new Date(timing.endedAtMs).toISOString(),
    loggedAt: new Date(nowMs).toISOString(),
    loggedDurationSec: timing.durationSec,
    workingSetCount: workingSets.length,
  });
  restStartedBy = null;
  const session: Session = finishHeartCapture({
    id: a.id ?? newId('s'),
    splitId: a.splitId,
    splitName: split?.name ?? 'Workout',
    day: dayKey(logging.trainedAt),
    startedAt: logging.trainedAt,
    endedAt: logging.trainedEndAt,
    // BUG-19 (DATES-F2): the training time the finish sheet showed, pauses left out.
    durationSec: timing.durationSec,
    exercises,
    logging,
    gymId: a.gymId ?? state.value.units.activeGymId,
    ...(opts.note?.trim() ? { note: opts.note.trim().slice(0, 1000) } : {}),
  });
  const changedTemplate = changedFromPlan(a, split);
  update(s => ({
    ...s,
    active: null,
    // ES-02: today's adjustment is used up by finishing this split (a discarded session keeps it).
    escobar: s.escobar.todayOverride?.splitId === a.splitId ? { ...s.escobar, todayOverride: null } : s.escobar,
    sessions: exercises.length ? sortByStart([...s.sessions, session]) : s.sessions,
    splits: saveTemplate && split
      ? s.splits.map(sp => (sp.id !== split.id ? sp : { ...sp, exercises: templateFromSession(a, split, s.escobar.todayOverride) }))
      : s.splits,
    // QA-R2b-5: the prediction at finish sees the whole history, like the number the app showed.
    recoveryModel: exercises.length ? calibrateAfterSession(sortByStart(s.sessions), session, s.customExercises, s.profile, s.healthDays, s.recoveryModel, id => lastSummaryAlone(s.sessions, id, s.customExercises)) : s.recoveryModel,
  }));
  flushSave();
  pausedAtCommit.clear();
  // QA8-3: a reminder scheduled before this session started may still be queued for today.
  void resyncReminders();
  void cancelRestDone();
  void haptic.success();
  return { session, changedTemplate };
}

/** The finish sheet calls this after "when did you train?" resolves a compressed session's real timing. */
export function resolveSessionTiming(sessionId: string, trainedAtLocal: string, durationMin: number, timeSource: SessionLogging['timeSource']): boolean {
  // QA-R2c-2: a cleared day or time leaves the session as it was saved at finish.
  if (!Number.isFinite(new Date(trainedAtLocal).getTime()) || !Number.isFinite(durationMin) || durationMin <= 0) return false;
  if (startsInFuture(trainedAtLocal)) return false;
  const trainedAt = new Date(trainedAtLocal).toISOString();
  const trainedEndAt = new Date(new Date(trainedAtLocal).getTime() + durationMin * 60_000).toISOString();
  update(s => ({
    ...s,
    sessions: sortByStart(s.sessions.map(sess => {
      if (sess.id !== sessionId) return sess;
      const flags = dayKey(trainedAt) !== dayKey(sess.logging.loggedAt) ? [...new Set([...sess.logging.flags, 'midnight_crossing'])] : sess.logging.flags;
      return {
        ...sess,
        day: dayKey(trainedAt),
        startedAt: trainedAt,
        endedAt: trainedEndAt,
        durationSec: durationMin * 60,
        logging: { ...sess.logging, trainedAt, trainedEndAt, timeSource, flags },
      };
    })),
  }));
  flushSave();
  return true;
}

/** "Log a past session": no timer, no rest banner. Every set is retro. */
export function logPastSession(input: { splitId: string; trainedAtLocal: string; durationMin: number; entries: Array<{ exerciseId: string; name: string; sets: LoggedSet[] }> }): FinishSummary | null {
  const split = state.value.splits.find(s => s.id === input.splitId);
  const exercises = input.entries.map(e => ({ exerciseId: e.exerciseId, name: e.name, sets: e.sets.filter(hasEntry) })).filter(e => e.sets.length);
  if (!exercises.length || startsInFuture(input.trainedAtLocal)) return null;
  const trainedAt = new Date(input.trainedAtLocal).toISOString();
  const trainedEndAt = new Date(new Date(input.trainedAtLocal).getTime() + input.durationMin * 60_000).toISOString();
  const logging = retroSessionLogging(trainedAt, trainedEndAt, 'user');
  const session: Session = {
    id: newId('s'),
    splitId: input.splitId,
    splitName: split?.name ?? 'Workout',
    day: dayKey(trainedAt),
    startedAt: trainedAt,
    endedAt: trainedEndAt,
    durationSec: input.durationMin * 60,
    exercises,
    logging,
    gymId: state.value.units.activeGymId,
  };
  update(s => ({ ...s, sessions: sortByStart([...s.sessions, session]) }));
  flushSave();
  void haptic.confirm();
  return { session, changedTemplate: false };
}

export function discardSession(): void {
  update(s => ({ ...s, active: null }));
  pausedAtCommit.clear();
  flushSave();
  void cancelRestDone();
  discardHeartCapture();
  restStartedBy = null;
}
