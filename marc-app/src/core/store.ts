import { signal, computed, batch } from '@preact/signals';
import { freshState, newId, type AppState, type ActiveSession } from './models';
import { convertLegacy, readLegacy } from './migrate';

export const STATE_KEY = 'marc.state.v1';
const BACKUP_KEY = 'marc.state.v1.backup';

type Storagelike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function isState(v: unknown): v is AppState {
  return !!v && typeof v === 'object' && (v as AppState).version === 1 && Array.isArray((v as AppState).sessions) && Array.isArray((v as AppState).splits);
}

/** Fill in fields added after a state was first saved. */
function normalize(s: AppState): AppState {
  const fresh = freshState();
  const active: ActiveSession | null = s.active ? {
    ...s.active,
    id: s.active.id || newId('s'),
    entries: (s.active.entries ?? []).map(entry => ({
      ...entry,
      id: entry.id || newId('entry'),
      sets: (entry.sets ?? []).map(set => ({ ...set, id: set.id || newId('set') })),
    })),
  } : null;
  return {
    ...fresh,
    ...s,
    profile: { ...fresh.profile, ...s.profile },
    preferences: { ...fresh.preferences, ...s.preferences, reminders: { ...fresh.preferences.reminders, ...s.preferences?.reminders } },
    schedule: { ...fresh.schedule, ...s.schedule },
    health: { ...fresh.health, ...s.health },
    splits: (s.splits ?? []).map(sp => ({ ...sp, focus: sp.focus ?? [], exercises: sp.exercises ?? [] })),
    body: s.body ?? [],
    customExercises: s.customExercises ?? [],
    active,
  };
}

export function loadState(storage: Storagelike = localStorage): { state: AppState; source: 'saved' | 'backup' | 'legacy' | 'fresh' } {
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
  const saved = tryKey(STATE_KEY);
  if (saved) return { state: saved, source: 'saved' };
  const backup = tryKey(BACKUP_KEY);
  if (backup) return { state: backup, source: 'backup' };
  const legacy = readLegacy(storage);
  if (legacy?.workouts) return { state: convertLegacy(legacy), source: 'legacy' };
  return { state: freshState(), source: 'fresh' };
}

export const state = signal<AppState>(freshState());
export const bootSource = signal<'saved' | 'backup' | 'legacy' | 'fresh'>('fresh');
export const saveError = signal<string | null>(null);

let storageRef: Storagelike | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function initStore(storage: Storagelike = localStorage): void {
  storageRef = storage;
  const loaded = loadState(storage);
  batch(() => {
    state.value = loaded.state;
    bootSource.value = loaded.source;
  });
  if (loaded.source !== 'saved') persistNow();
}

export function persistNow(): boolean {
  if (!storageRef) return false;
  try {
    const raw = JSON.stringify(state.value);
    const previous = storageRef.getItem(STATE_KEY);
    storageRef.setItem(STATE_KEY, raw);
    if (previous && previous !== raw) storageRef.setItem(BACKUP_KEY, previous);
    saveError.value = null;
    return true;
  } catch (err) {
    saveError.value = 'Could not save. Free some storage space and try again.';
    console.warn('save failed', err);
    return false;
  }
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

export function flushSave(): void {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  persistNow();
}

export const sessions = computed(() => state.value.sessions);
export const splits = computed(() => state.value.splits);
export const preferences = computed(() => state.value.preferences);
export const customExercises = computed(() => state.value.customExercises);
export const allExercisesLookup = computed(() => state.value.customExercises);
