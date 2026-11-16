import { state, update } from '@/core/store';
import { healthAvailable, lastHealthError, syncHealth } from '@/native/health';

/** Reads today's Health Connect summary and folds it into healthDays. `prompt` only from the Settings buttons. */
let lastBackground = 0;
/** Cold start, resume and session start (PL-04): only once connected, never a dialog, at most every 10 min. */
export function backgroundHealthSync(now = Date.now()): Promise<boolean> {
  if (!state.peek().health.connected || now - lastBackground < 10 * 60_000) return Promise.resolve(false);
  lastBackground = now;
  return syncAndStoreHealth({ prompt: false });
}

export async function syncAndStoreHealth({ prompt = false }: { prompt?: boolean } = {}): Promise<boolean> {
  if (!healthAvailable()) return false;
  const day = await syncHealth({ prompt });
  if (!day) return false;
  update(s => {
    // QA-R5a-1: a later sync where a read failed (or came back empty) keeps what an earlier sync
    // that day already had, instead of replacing the whole day.
    const before = s.healthDays.find(d => d.day === day.day);
    const merged = before ? { ...before, ...Object.fromEntries(Object.entries(day).filter(([, v]) => v !== undefined)) } as typeof day : day;
    const healthDays = [...s.healthDays.filter(d => d.day !== day.day), merged].sort((a, b) => a.day.localeCompare(b.day)).slice(-180);
    return {
      ...s,
      healthDays,
      health: { connected: true, lastSync: merged.syncedAt, sleepMinutes: merged.sleepMinutes, restingHr: merged.restingHr, steps: merged.steps, activeCalories: merged.activeCalories },
    };
  });
  // Something was saved; a partial failure still shows its Details row.
  return !lastHealthError;
}
