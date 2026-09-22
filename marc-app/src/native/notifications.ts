/**
 * Rest-complete alerts and training-day reminders.
 * The user's reminder preference is stored separately from whether Android
 * actually scheduled anything, so a permission hiccup never flips the toggle.
 */
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from './capacitor';
import type { Reminders, Weekday } from '@/core/models';
import { addDays, parseDay, todayKey, weekdayOf } from '@/core/dates';

const REST_ID = 880001;
const CHANNELS = {
  rest: { id: 'marc-rest-complete-v3', name: 'Rest complete', importance: 4, vibration: true },
  silent: { id: 'marc-training-silent', name: 'Training day (silent)', importance: 2, vibration: false },
  vibrate: { id: 'marc-training-vibrate', name: 'Training day (vibrate)', importance: 3, vibration: true },
  alert: { id: 'marc-training-alert', name: 'Training day (alert)', importance: 4, vibration: true },
} as const;

let channelsReady = false;
async function ensureChannels(): Promise<void> {
  if (channelsReady || !isNative()) return;
  for (const c of Object.values(CHANNELS)) {
    try { await LocalNotifications.createChannel({ id: c.id, name: c.name, importance: c.importance, vibration: c.vibration }); } catch { /* older Android */ }
  }
  channelsReady = true;
}

export async function ensurePermission(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    let p = await LocalNotifications.checkPermissions();
    if (p.display !== 'granted') p = await LocalNotifications.requestPermissions();
    return p.display === 'granted';
  } catch { return false; }
}

export async function scheduleRestDone(atMs: number): Promise<void> {
  if (!isNative()) return;
  await ensureChannels();
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] });
    await LocalNotifications.schedule({
      notifications: [{
        id: REST_ID, title: 'Rest done', body: 'Back to it. Your next set is ready.',
        schedule: { at: new Date(atMs), allowWhileIdle: true }, channelId: CHANNELS.rest.id, extra: { type: 'rest' },
      }],
    });
  } catch { /* best effort */ }
}

export async function cancelRestDone(): Promise<void> {
  if (!isNative()) return;
  try { await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] }); } catch { /* ignore */ }
}

export interface ReminderHealth { status: string; queued: number; ok: boolean }

/**
 * Re-sync training reminders for the next 8 weeks from the schedule.
 * Returns a plain-words status; never changes the user's preference.
 */
export async function syncTrainingReminders(reminders: Reminders, schedule: Record<Weekday, string | null>, splitName: (id: string) => string, completedDays: Set<string>): Promise<ReminderHealth> {
  if (!isNative()) return { status: 'Reminders need the Android app.', queued: 0, ok: false };
  await ensureChannels();
  let pending: Array<{ id: number }> = [];
  try { pending = (await LocalNotifications.getPending()).notifications.filter(n => n.id >= 730000 && n.id < 820000); } catch { /* ignore */ }
  if (pending.length) { try { await LocalNotifications.cancel({ notifications: pending.map(p => ({ id: p.id })) }); } catch { /* ignore */ } }
  if (!reminders.enabled) return { status: 'Off', queued: 0, ok: true };
  const granted = await ensurePermission();
  if (!granted) return { status: 'On, but Android has not allowed notifications yet.', queued: 0, ok: false };
  const [hh, mm] = reminders.time.split(':').map(Number);
  const list: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];
  const today = todayKey();
  for (let i = 0; i < 56; i++) {
    const day = addDays(today, i);
    const splitId = schedule[weekdayOf(day)];
    if (!splitId || completedDays.has(day)) continue;
    const at = parseDay(day);
    at.setHours(hh ?? 17, mm ?? 30, 0, 0);
    if (at.getTime() <= Date.now()) continue;
    const [y, m, d] = day.split('-').map(Number);
    list.push({
      id: 730000 + (((y ?? 0) * 372 + (m ?? 0) * 31 + (d ?? 0)) % 90000),
      title: 'Training day', body: `${splitName(splitId)} is ready when you are.`,
      schedule: { at, allowWhileIdle: true }, channelId: CHANNELS[reminders.style].id, extra: { type: 'training', day, splitId },
    });
  }
  if (!list.length) return { status: 'On. No upcoming scheduled days.', queued: 0, ok: true };
  try {
    await LocalNotifications.schedule({ notifications: list });
    const after = (await LocalNotifications.getPending()).notifications.filter(n => n.id >= 730000 && n.id < 820000).length;
    return { status: `On. ${after} of ${list.length} reminders queued.`, queued: after, ok: after > 0 };
  } catch {
    return { status: 'On, but scheduling failed. Try again after reopening the app.', queued: 0, ok: false };
  }
}

export function onNotificationTap(handler: () => void): void {
  if (!isNative()) return;
  LocalNotifications.addListener('localNotificationActionPerformed', handler).catch(() => undefined);
}
