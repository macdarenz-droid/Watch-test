/**
 * Backup files (R1.3): build one, and read any file a person may hand back — this version's
 * backup, a bare saved state, or the previous app's data. Restored states go through the same
 * deep repair as saved ones (`repairState`), and the repair count is reported.
 */
import { dayKey, daysBetween } from '@/core/dates';
import { repairState } from '@/core/store';
import type { AppState } from '@/core/models';
import { asLegacyRoot, convertLegacy } from '@/core/migrate';
import { normalizeEscobar, withLocalTrust } from '@/core/escobarState';
import { exportHeart, type HeartSeriesStore } from '@/core/heartStore';
import { exportAllEscobar } from '@/escobar/store';
import { APP_VERSION } from '@/core/version';
import { state } from '@/core/store';

export const BACKUP_SCHEMA = 2;
const ACTIVE_MAX_AGE_MS = 12 * 3_600_000;

export function buildBackup(now = new Date()) {
  return { app: 'M/ARC', version: APP_VERSION, schema: BACKUP_SCHEMA, exportedAt: now.toISOString(), state: state.value, escobar: exportAllEscobar(), heart: exportHeart() };
}

export type ParsedBackup =
  | { kind: 'v37'; state: AppState; escobar?: unknown; heart?: HeartSeriesStore; exportedAt?: string; dropped: number }
  | { kind: 'legacy'; state: AppState }
  | { error: string };

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const looksLikeState = (v: unknown): v is AppState => isObj(v) && v.version === 1 && Array.isArray(v.sessions);

const NOT_A_BACKUP = 'That file is not an M/ARC backup';

/** DATA-01 (AUD-4): any failure while reading the file is the normal invalid-file answer, never a throw. */
export function parseBackup(text: string, now = Date.now()): ParsedBackup {
  try { return readBackup(text, now); } catch { return { error: NOT_A_BACKUP }; }
}

function readBackup(text: string, now: number): ParsedBackup {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { error: NOT_A_BACKUP }; }
  const legacy = asLegacyRoot(parsed);
  if (legacy) return { kind: 'legacy', state: convertLegacy(legacy, new Date(now)) };
  const wrapped = isObj(parsed) && 'state' in parsed;
  const candidate = wrapped ? (parsed as { state: unknown }).state : parsed;
  if (!looksLikeState(candidate)) return { error: NOT_A_BACKUP };
  const { state: repaired, dropped } = repairState(candidate);
  const started = repaired.active ? Date.parse(repaired.active.startedAt) : NaN;
  const active = repaired.active && Number.isFinite(started) && now - started <= ACTIVE_MAX_AGE_MS ? repaired.active : null;
  const w = wrapped ? (parsed as Record<string, unknown>) : {};
  return {
    kind: 'v37',
    state: { ...repaired, active },
    ...('escobar' in w ? { escobar: w.escobar } : {}),
    ...(isObj(w.heart) ? { heart: w.heart as HeartSeriesStore } : {}),
    ...(typeof w.exportedAt === 'string' ? { exportedAt: w.exportedAt } : {}),
    dropped,
  };
}

/**
 * The state a restore writes: the file's data, with what belongs to this phone kept as it is.
 * Health Connect permission is this device's; so are the coach's on/off, sharing, server and
 * device identity (OBS-ENDPOINT, AUD-4).
 */
export function restoredState(next: AppState, current: AppState): AppState {
  return { ...next, health: { connected: false }, escobar: withLocalTrust(normalizeEscobar(next.escobar), normalizeEscobar(current.escobar)) };
}

/** QA-R6-1/7: whole local days since the last backup (the stamp is UTC; the day it fell on is local). */
export function backupAgeDays(lastBackupAt: string | undefined, today: string): number | null {
  if (!lastBackupAt || !Number.isFinite(Date.parse(lastBackupAt))) return null;
  return Math.max(0, daysBetween(dayKey(new Date(lastBackupAt)), today));
}
