import { signal, batch } from '@preact/signals';
import { navyBodyFat } from './bodyfat';
import { freshState, newId, type AppState, type LoggedSet, type Session, type Split, type Weekday } from './models';
import { convertLegacy, LEGACY_KEY, readLegacy } from './migrate';
import { legacySessionLogging } from './sessionLogging';
import { normalizeEscobar, normalizeUnits } from './escobarState';
import { backfillLegacyLbEntries, backfillLegacyLbSets } from './units';
import { dayKey } from './dates';
import { DEFAULT_GOAL, isGoalId } from '@/data/goals';
import { showToast } from '@/app/toast';

/** A session saved before `logging` existed gets a legacy backfill so every reader can rely on it being present. */
function withLogging(s: Session): Session {
  return s.logging ? s : { ...s, logging: legacySessionLogging(s.startedAt, s.endedAt) };
}

export const STATE_KEY = 'marc.state.v1';
export const BACKUP_KEY = 'marc.state.v1.backup';
/** The day (local YYYY-MM-DD) the backup restore point was last written (ST-10). */
export const BACKUP_DAY_KEY = 'marc.state.v1.backupDay';
/** Unreadable saved data kept aside at boot (ST-01). Only the user deletes these. */
export const CORRUPT_KEY = 'marc.state.v1.corrupt';
export const CORRUPT_BACKUP_KEY = 'marc.state.v1.backup.corrupt';

type Storagelike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function isState(v: unknown): v is AppState {
  return !!v && typeof v === 'object' && (v as AppState).version === 1 && Array.isArray((v as AppState).sessions) && Array.isArray((v as AppState).splits);
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Keeps only the object elements of a list; counts what it drops. */
function objects<T>(list: unknown, counter: { dropped: number }): T[] {
  if (!Array.isArray(list)) return [];
  const out = list.filter(isObj) as T[];
  counter.dropped += list.length - out.length;
  return out;
}

/** Keeps the object elements of a list that pass `ok`; counts what it drops. */
function valid<T>(list: unknown, counter: { dropped: number }, ok: (v: Record<string, unknown>) => boolean): T[] {
  const kept = objects<Record<string, unknown>>(list, counter);
  const out = kept.filter(ok);
  counter.dropped += kept.length - out.length;
  return out as T[];
}

const str = (v: unknown): v is string => typeof v === 'string';
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const VERDICTS = ['helpful', 'snoozed'];

/** DATA-01 (AUD-4): a live session with a start and a list of entries, or none. Entries need an exercise. */
function repairActive(a: unknown, c: { dropped: number }): AppState['active'] {
  if (a == null) return null;
  if (!isObj(a) || !str(a.startedAt) || !Array.isArray(a.entries)) { c.dropped++; return null; }
  const entries = valid<Record<string, unknown>>(a.entries, c, e => str(e.exerciseId))
    .map(e => ({ ...e, name: str(e.name) ? e.name : '', sets: objects<LoggedSet>(e.sets, c) }));
  return { ...a, splitId: str(a.splitId) ? a.splitId : '', pausedMs: finite(a.pausedMs) ? a.pausedMs : 0, entries } as unknown as AppState['active'];
}

/**
 * Deep repair of a saved or restored state (ST-11): drops non-object list elements, gives
 * sessions an id and lists, drops splits without an id, clears schedule days that point at no
 * split, and sorts sessions by start. Repairs instead of rejecting, and reports what it dropped.
 */
export function repairState(raw: AppState): { state: AppState; dropped: number } {
  const c = { dropped: 0 };
  const splitsIn = objects<Split>(raw.splits, c);
  const splits = splitsIn.filter(sp => typeof sp.id === 'string');
  c.dropped += splitsIn.length - splits.length;
  const splitIds = new Set(splits.map(sp => sp.id));
  const sessionsIn = objects<Session>(raw.sessions, c);
  // QA-R1-2/3: a session needs a start time; its day comes from it when missing. Without either it is dropped.
  const sessions = sessionsIn.flatMap(ses => {
    const start = typeof ses.startedAt === 'string' && Number.isFinite(Date.parse(ses.startedAt)) ? ses.startedAt : null;
    const day = typeof ses.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ses.day) ? ses.day : start ? dayKey(new Date(start)) : null;
    if (!day) return [];
    return [{
      ...ses,
      day,
      startedAt: start ?? `${day}T12:00:00.000Z`,
      endedAt: typeof ses.endedAt === 'string' && Number.isFinite(Date.parse(ses.endedAt)) ? ses.endedAt : (start ?? `${day}T12:00:00.000Z`),
      id: typeof ses.id === 'string' ? ses.id : newId('s'),
      exercises: valid<Session['exercises'][number]>(ses.exercises, c, e => str(e.exerciseId)).map(e => withTarget({ ...e, sets: objects<Session['exercises'][number]['sets'][number]>(e.sets, c) })),
    }];
  });
  c.dropped += sessionsIn.length - sessions.length;
  sessions.sort((a, b) => (a.startedAt ?? '') < (b.startedAt ?? '') ? -1 : (a.startedAt ?? '') > (b.startedAt ?? '') ? 1 : 0);
  const schedule = { ...(isObj(raw.schedule) ? raw.schedule : {}) } as Record<Weekday, string | null>;
  for (const d of Object.keys(schedule) as Weekday[]) { const v = schedule[d]; schedule[d] = typeof v === 'string' && splitIds.has(v) ? v : null; }
  // DATA-01 (AUD-4): every list is a list, and each element has the fields its readers key on.
  const lists = {
    body: valid<AppState['body'][number]>(raw.body, c, b => str(b.day)),
    healthDays: valid<AppState['healthDays'][number]>(raw.healthDays, c, d => str(d.day)),
    weightLog: valid<AppState['weightLog'][number]>(raw.weightLog, c, w => str(w.day) && finite(w.kg)),
    checkIns: valid<AppState['checkIns'][number]>(raw.checkIns, c, ci => str(ci.day)),
    freshMarks: valid<AppState['freshMarks'][number]>(raw.freshMarks, c, f => str(f.muscle) && str(f.at)),
    customExercises: valid<AppState['customExercises'][number]>(raw.customExercises, c, e => str(e.id) && str(e.name)),
    profileHistory: valid<AppState['profileHistory'][number]>(raw.profileHistory, c, h => str(h.at) && str(h.field)),
    insightFeedback: valid<AppState['insightFeedback'][number]>(raw.insightFeedback, c, f => str(f.id) && str(f.day) && VERDICTS.includes(f.verdict as string)),
  };
  const obj = <K extends keyof AppState>(k: K): AppState[K] | undefined => (isObj(raw[k]) ? raw[k] : undefined);
  const onboarding = obj('onboarding');
  const recoveryModel = obj('recoveryModel');
  const deload = obj('deload');
  const repaired: AppState = {
    ...raw,
    goal: isGoalId(raw.goal) ? raw.goal : DEFAULT_GOAL,
    splits: splits.map(sp => ({ ...sp, name: typeof sp.name === 'string' ? sp.name : 'Workout', exercises: valid<Split['exercises'][number]>(sp.exercises, c, e => str(e.exerciseId)) })),
    sessions,
    schedule,
    ...lists,
    profile: obj('profile') as AppState['profile'],
    preferences: obj('preferences') as AppState['preferences'],
    health: obj('health') as AppState['health'],
    onboarding: (onboarding ? { ...onboarding, dismissedAt: Array.isArray(onboarding.dismissedAt) ? onboarding.dismissedAt.filter(str) : [] } : undefined) as AppState['onboarding'],
    recoveryModel: { tauScale: isObj(recoveryModel?.tauScale) ? recoveryModel.tauScale : {}, observations: isObj(recoveryModel?.observations) ? recoveryModel.observations : {} },
    deload: deload && str(deload.startDay) && str(deload.endDay) && finite(deload.setFactor) && finite(deload.loadFactor) ? deload : null,
    active: repairActive(raw.active, c),
  };
  let out = fill(repaired);
  // RG-02 / QA-R1-4: an lb user's history from before per-set units displays exactly as typed. Done
  // here, where the raw state is still visible, so boot and restore both backfill it.
  const savedBeforeUnits = !Object.prototype.hasOwnProperty.call(raw, 'units');
  if (savedBeforeUnits && raw.preferences?.weightUnit === 'lb') {
    out = { ...out, sessions: backfillLegacyLbEntries(out.sessions), active: out.active && Array.isArray(out.active.entries) ? { ...out.active, entries: out.active.entries.map(e => ({ ...e, sets: backfillLegacyLbSets(e.sets ?? []) })) } : out.active };
  }
  return { state: out, dropped: c.dropped };
}

/** Fill in fields added after a state was first saved, after a deep repair. */
function normalize(s: AppState): AppState {
  return repairState(s).state;
}

/** R2.8: a loaded live session gets ids where it has none. Times are never invented. */
/**
 * QA-R2d-4: the previous version's '+ Set' copied the whole last set, commit time, rest, heart
 * and id included. A live set with the same commit time (or id) as the set before it is such a
 * copy: it keeps the typed values and loses what only its commit can set.
 */
function uncopiedSets(sets: LoggedSet[]): LoggedSet[] {
  return sets.map((set, i) => {
    const prev = sets[i - 1];
    if (!prev || !isObj(set) || !isObj(prev)) return set;
    const copied = (set.at != null && set.at === prev.at) || (set.id != null && set.id === prev.id);
    if (!copied) return set;
    const { at: _at, restSec: _r, fidelity: _f, heart: _h, status: _s, id: _id, ...kept } = set;
    return kept;
  });
}

function withActiveIds(a: AppState['active']): AppState['active'] {
  if (!a || !Array.isArray(a.entries)) return a ?? null;
  return {
    ...a,
    id: a.id ?? newId('s'),
    entries: a.entries.map(e => withTarget({ ...e, id: e.id ?? newId('e'), sets: uncopiedSets(Array.isArray(e.sets) ? e.sets : []).map(set => (set.id ? set : { ...set, id: newId('set') })) })),
  };
}

/** LT-3 (D-A4 a): a planned target is kept only as a positive, finite kg and a positive whole number of reps. */
export function withTarget<T extends { target?: unknown }>(e: T): T {
  if (e.target === undefined) return e;
  const t = e.target as { kg?: unknown; reps?: unknown } | null;
  const ok = !!t && typeof t === 'object' && typeof t.kg === 'number' && Number.isFinite(t.kg) && t.kg > 0 && typeof t.reps === 'number' && Number.isInteger(t.reps) && t.reps > 0;
  if (ok) return { ...e, target: { kg: t!.kg as number, reps: t!.reps as number } };
  const { target: _drop, ...rest } = e;
  return rest as T;
}

export const MAX_DAYS_OFF = 400;
export const MAX_EXERCISE_NOTE = 200;
function cleanNotes(v: unknown): Record<string, string> {
  if (!isObj(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, n] of Object.entries(v)) if (typeof n === 'string' && n.trim()) out[k] = n.trim().slice(0, MAX_EXERCISE_NOTE);
  return out;
}

/**
 * QA-R3a-10: readings saved before BR-01 used the inch-converted formula and read about six
 * points low. Their tape numbers are stored, so they are recomputed once, with the profile's
 * sex and height, and marked. A reading that cannot be recomputed keeps its number.
 */
function healBodyReadings(body: AppState['body'], profile: Partial<AppState['profile']> | undefined): AppState['body'] {
  const sex = profile?.sex, heightCm = profile?.heightCm;
  return body.map(b => {
    if (b.formula === 'navy-cm' || (sex !== 'male' && sex !== 'female') || heightCm == null) return b;
    const pct = navyBodyFat({ sex, heightCm, neckCm: b.neckCm, waistCm: b.waistCm, hipCm: b.hipCm });
    return pct == null ? b : { ...b, bodyFatPct: pct, formula: 'navy-cm' };
  });
}

function fill(s: AppState): AppState {
  const fresh = freshState();
  const weightUnit = s.preferences?.weightUnit === 'lb' ? 'lb' : 'kg';
  return {
    ...fresh,
    ...s,
    profile: { ...fresh.profile, ...s.profile },
    preferences: { ...fresh.preferences, ...s.preferences, weightUnit, reminders: { ...fresh.preferences.reminders, ...s.preferences?.reminders }, watch: { ...fresh.preferences.watch, ...s.preferences?.watch }, rest: { ...fresh.preferences.rest, ...s.preferences?.rest } },
    schedule: { ...fresh.schedule, ...s.schedule },
    health: { ...fresh.health, ...s.health, ...(s.health?.activeCalories != null && s.health.activeCalories > 20_000 ? { activeCalories: Math.round(s.health.activeCalories / 1000) } : {}) },
    splits: (s.splits ?? []).map(sp => ({ ...sp, focus: sp.focus ?? [], exercises: sp.exercises ?? [] })),
    body: healBodyReadings(s.body ?? [], s.profile),
    customExercises: s.customExercises ?? [],
    // VX-01: heal activeCalories stored as small calories by builds before the fix.
    healthDays: (s.healthDays ?? []).map(d => (d.activeCalories != null && d.activeCalories > 20_000 ? { ...d, activeCalories: Math.round(d.activeCalories / 1000) } : d)),
    weightLog: s.weightLog ?? [],
    profileHistory: s.profileHistory ?? [],
    onboarding: { ...fresh.onboarding, ...s.onboarding, dismissedAt: s.onboarding?.dismissedAt ?? [] },
    checkIns: s.checkIns ?? [],
    recoveryModel: { tauScale: s.recoveryModel?.tauScale ?? {}, observations: s.recoveryModel?.observations ?? {} },
    freshMarks: s.freshMarks ?? [],
    deload: s.deload ?? null,
    insightFeedback: s.insightFeedback ?? [],
    sessions: (s.sessions ?? []).map(withLogging),
    escobar: normalizeEscobar(s.escobar),
    units: normalizeUnits(s.units, weightUnit),
    active: withActiveIds(s.active),
    daysOff: Array.isArray(s.daysOff) ? [...new Set(s.daysOff.filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort().slice(-MAX_DAYS_OFF) : [],
    exerciseNotes: cleanNotes(s.exerciseNotes),
  };
}

export type BootSource = 'saved' | 'backup' | 'legacy' | 'fresh';

export function loadState(storage: Storagelike = localStorage): { state: AppState; source: BootSource; raw: string | null } {
  const tryKey = (key: string): AppState | null => {
    try {
      const raw = storage.getItem(key);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isState(parsed) ? normalize(parsed) : null;
    } catch {
      return null;
    }
  };
  const raw = (key: string): string | null => { try { return storage.getItem(key); } catch { return null; } };
  const saved = tryKey(STATE_KEY);
  if (saved) return { state: saved, source: 'saved', raw: raw(STATE_KEY) };
  const backup = tryKey(BACKUP_KEY);
  if (backup) return { state: backup, source: 'backup', raw: raw(BACKUP_KEY) };
  const legacy = readLegacy(storage);
  if (legacy?.workouts) return { state: convertLegacy(legacy), source: 'legacy', raw: null };
  return { state: freshState(), source: 'fresh', raw: null };
}

export const state = signal<AppState>(freshState());
export const bootSource = signal<BootSource>('fresh');
export const saveError = signal<string | null>(null);
/** True when boot could not read the latest saved data and kept a copy aside (ST-01). */
export const bootRecovered = signal<boolean>(false);

let storageRef: Storagelike | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
/** The raw JSON last loaded or written successfully: tomorrow's restore point (ST-10). */
let lastGoodRaw: string | null = null;
let storageListener: ((e: StorageEvent) => void) | null = null;

/**
 * Keeps an unreadable raw aside once; never overwrites an identical copy. With storage full
 * (QA-R1-1) it moves the raw instead: `from` is removed first, freeing exactly the room the copy
 * needs. `from` is about to be overwritten anyway.
 */
function quarantine(storage: Storagelike, key: string, raw: string, from: string): boolean {
  try {
    if (storage.getItem(key) !== raw) storage.setItem(key, raw);
    return true;
  } catch (err) {
    try {
      storage.removeItem(from);
      storage.setItem(key, raw);
      return true;
    } catch (moveErr) {
      // Put it back where it was rather than lose it.
      try { storage.setItem(from, raw); } catch { /* nothing more to do */ }
      console.warn('could not keep a copy of unreadable data', err, moveErr);
      return false;
    }
  }
}

export function initStore(storage: Storagelike = localStorage): void {
  storageRef = storage;
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  const loaded = loadState(storage);
  let recovered = false;
  if (loaded.source !== 'saved') {
    let mainRaw: string | null = null;
    let backupRaw: string | null = null;
    try { mainRaw = storage.getItem(STATE_KEY); backupRaw = storage.getItem(BACKUP_KEY); } catch { /* unreadable storage */ }
    if (mainRaw != null && quarantine(storage, CORRUPT_KEY, mainRaw, STATE_KEY)) recovered = true;
    if (backupRaw != null && (loaded.source === 'fresh' || loaded.source === 'legacy') && quarantine(storage, CORRUPT_BACKUP_KEY, backupRaw, BACKUP_KEY)) recovered = true;
  }
  lastGoodRaw = loaded.raw;
  batch(() => {
    state.value = loaded.state;
    bootSource.value = loaded.source;
    bootRecovered.value = recovered;
  });
  if (loaded.source !== 'saved') persistNow();
  listenToOtherTabs();
}

/** ST-19: another tab saved; take its state instead of overwriting it later. */
function listenToOtherTabs(): void {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
  if (storageListener) window.removeEventListener('storage', storageListener);
  storageListener = (e: StorageEvent) => {
    // DATA-02 (AUD-4): another tab cleared storage (the crash screen's reset) or removed the state.
    // This tab drops what it holds, so its next save writes what storage now gives, not the old data.
    if (e.key === null || (e.key === STATE_KEY && e.newValue === null)) {
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
      lastGoodRaw = null;
      if (storageRef) state.value = loadState(storageRef).state;
      return;
    }
    if (e.key !== STATE_KEY || !e.newValue) return;
    let parsed: unknown;
    try { parsed = JSON.parse(e.newValue); } catch { return; }
    if (!isState(parsed)) return;
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    const localActive = state.value.active;
    const incoming = normalize(parsed);
    state.value = incoming;
    lastGoodRaw = e.newValue;
    if (localActive && localActive.startedAt !== incoming.active?.startedAt) showToast('Updated from another tab');
  };
  window.addEventListener('storage', storageListener);
}

const isQuotaError = (err: unknown): boolean => {
  const e = err as { name?: string; code?: number } | null;
  return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
};

/**
 * Main write first. On a full storage, the app's own backup copy goes first and the write is
 * retried once. The backup is a daily restore point: the state as it was before the first save
 * of each local day. It is best-effort and never reports an error.
 */
export function persistNow(): boolean {
  if (!storageRef) return false;
  const storage = storageRef;
  let raw: string;
  try { raw = JSON.stringify(state.value); } catch (err) { saveError.value = 'Could not save. Free some storage space and try again.'; console.warn('save failed', err); return false; }
  const before = lastGoodRaw;
  let freedSpace = false;
  try {
    storage.setItem(STATE_KEY, raw);
  } catch (err) {
    if (isQuotaError(err)) {
      try { storage.removeItem(BACKUP_KEY); storage.removeItem(BACKUP_DAY_KEY); storage.setItem(STATE_KEY, raw); freedSpace = true; } catch (retryErr) { console.warn('save failed', retryErr); }
    } else console.warn('save failed', err);
    if (!freedSpace) { saveError.value = 'Could not save. Free some storage space and try again.'; return false; }
  }
  lastGoodRaw = raw;
  saveError.value = null;
  try {
    const today = dayKey();
    // Right after the backup was dropped for space, don't fill that space again on this save.
    if (!freedSpace && before && before !== raw && storage.getItem(BACKUP_DAY_KEY) !== today) {
      storage.setItem(BACKUP_KEY, before);
      storage.setItem(BACKUP_DAY_KEY, today);
    }
  } catch (err) { console.warn('backup write skipped', err); }
  return true;
}

/** The kept-aside unreadable data, for the rescue file (ST-01). */
/**
 * What the Settings rescue row saves. QA-R1-5: when both copies were kept aside, the file holds
 * both (in the crash screen's rescue format), so deleting the rescue copy never loses one.
 */
export function rescueRaw(storage: Storagelike = storageRef ?? localStorage): string | null {
  try {
    const main = storage.getItem(CORRUPT_KEY), backup = storage.getItem(CORRUPT_BACKUP_KEY);
    if (main != null && backup != null) return JSON.stringify({ app: 'M/ARC', kind: 'rescue', savedAt: new Date().toISOString(), keys: { [CORRUPT_KEY]: main, [CORRUPT_BACKUP_KEY]: backup } });
    return main ?? backup;
  } catch { return null; }
}

export function deleteRescueCopy(storage: Storagelike = storageRef ?? localStorage): void {
  try { storage.removeItem(CORRUPT_KEY); storage.removeItem(CORRUPT_BACKUP_KEY); } catch { /* nothing to delete */ }
  bootRecovered.value = false;
}

function persistSoon(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveTimer = null; persistNow(); }, 250);
}

/** Apply a change to the state. The updater must return a new object (spread). */
export function update(fn: (s: AppState) => AppState): void {
  state.value = fn(state.value);
  persistSoon();
}

export function replaceState(next: AppState): void {
  state.value = normalize(next);
  persistNow();
}

/**
 * QA-R1-7: Reset everything. The daily restore point goes too, so the wiped history cannot come
 * back from it. BUG-29: the legacy import key goes too, so it cannot fall back in and bring the
 * wiped old history back if the main and backup copies are ever both unreadable (loadState, below).
 */
export function resetState(next: AppState): void {
  lastGoodRaw = null;
  try { storageRef?.removeItem(BACKUP_KEY); storageRef?.removeItem(BACKUP_DAY_KEY); storageRef?.removeItem(LEGACY_KEY); } catch { /* nothing to delete */ }
  replaceState(next);
}

export function flushSave(): void {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  persistNow();
}

/**
 * QA2-FB-1: the error card's reset wipes storage and reloads. No save may follow, not even the
 * one on unload (pagehide, visibilitychange), or the state that crashed is written straight back.
 */
export function stopSaving(): void {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  storageRef = null;
}
