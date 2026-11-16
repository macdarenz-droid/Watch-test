/**
 * Rest-complete alerts and training-day reminders.
 * The user's reminder preference is stored separately from whether Android
 * actually scheduled anything, so a permission hiccup never flips the toggle.
 */
import { LocalNotifications } from '@capacitor/local-notifications';
import { signal } from '@preact/signals';
import { isNative } from './capacitor';
import type { Reminders, Weekday } from '@/core/models';
import { addDays, parseDay, todayKey, weekdayOf } from '@/core/dates';

const REST_ID = 880001;
/** QA-R2c-4: the Settings test alert has its own id, so it never cancels a live rest's alert. */
const TEST_REST_ID = 880002;
const CHANNELS = {
  rest: { id: 'marc-rest-complete-v3', name: 'Rest complete', importance: 4, vibration: true },
  silent: { id: 'marc-training-silent', name: 'Training day (silent)', importance: 2, vibration: false },
  vibrate: { id: 'marc-training-vibrate', name: 'Training day (vibrate)', importance: 3, vibration: true },
  alert: { id: 'marc-training-alert', name: 'Training day (alert)', importance: 4, vibration: true },
} as const;

/**
 * Whether Android lets this app schedule exact alarms (UI-02, PL-09). Cached; refreshed on
 * resume. Plugin 8.3.x opens the "Alarms & reminders" screen on any exact schedule() it is not
 * allowed to make, so nothing here schedules exact unless this is already granted.
 */
let exactOk = false;
export const exactAlarmsAllowed = (): boolean => exactOk;

export async function refreshExactAlarm(): Promise<boolean> {
  if (!isNative()) { exactOk = false; return false; }
  try { exactOk = (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted'; } catch { exactOk = false; }
  return exactOk;
}

/** Settings → "Precise rest alerts": the one place that opens the system screen, on a tap. */
export async function requestExactAlarm(): Promise<boolean> {
  if (!isNative()) return false;
  try { await LocalNotifications.changeExactNotificationSetting(); } catch { /* not supported on this Android */ }
  return refreshExactAlarm();
}

let channelsReady = false;
async function ensureChannels(): Promise<void> {
  if (channelsReady || !isNative()) return;
  for (const c of Object.values(CHANNELS)) {
    try { await LocalNotifications.createChannel({ id: c.id, name: c.name, importance: c.importance, vibration: c.vibration }); } catch { /* older Android */ }
  }
  channelsReady = true;
}

/**
 * Whether notifications may be shown. Only a person's own tap (a Settings toggle) passes
 * `prompt: true`; launch and resume only check, so a refusal is never asked again on its own
 * (QA-R2a-2, QA-R6-13).
 */
export async function ensurePermission({ prompt = false }: { prompt?: boolean } = {}): Promise<boolean> {
  if (!isNative()) return false;
  try {
    let p = await LocalNotifications.checkPermissions();
    if (p.display !== 'granted' && prompt) p = await LocalNotifications.requestPermissions();
    return p.display === 'granted';
  } catch { return false; }
}

/**
 * QA3-1: true once a check finds notifications firmly denied, so the rest banner/Train can
 * point the person at Settings. A never-asked ('prompt') state is not denial.
 */
export const restAlertsDenied = signal(false);

/** Re-checks the OS permission without asking for it. Call on boot/resume, like refreshExactAlarm. */
export async function refreshRestPermission(): Promise<boolean> {
  if (!isNative()) { restAlertsDenied.value = false; return false; }
  try { restAlertsDenied.value = (await LocalNotifications.checkPermissions()).display === 'denied'; }
  catch { restAlertsDenied.value = false; }
  return restAlertsDenied.value;
}

export async function scheduleRestDone(atMs: number): Promise<void> {
  if (!isNative()) return;
  // QA2-FB-4: the plugin asks for permission itself on Android 13+; a rest timer never should.
  // QA3-1: only a firm refusal skips scheduling. A never-asked ('prompt') state still schedules,
  // so the plugin's own Android 13+ prompt gets a chance to ask, as it did before eefa356.
  if (await refreshRestPermission()) return;
  await ensureChannels();
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] });
    await LocalNotifications.schedule({
      notifications: [{
        id: REST_ID, title: 'Rest done', body: 'Next set.',
        schedule: { at: new Date(atMs), allowWhileIdle: true }, channelId: CHANNELS.rest.id, extra: { type: 'rest' },
        isExactNotification: exactOk,
      }],
    });
  } catch { /* best effort */ }
}

/**
 * Settings → "Test rest alert": a rest alert in 5 s on its own id. False when notifications are
 * not allowed or the schedule failed, so the toast never promises an alert that cannot come
 * (QA-R2c-1). A tap, so it may ask for permission.
 */
export async function testRestAlert(inMs = 5000): Promise<boolean> {
  if (!(await ensurePermission({ prompt: true }))) return false;
  await ensureChannels();
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: TEST_REST_ID, title: 'Rest done', body: 'Test',
        schedule: { at: new Date(Date.now() + inMs), allowWhileIdle: true }, channelId: CHANNELS.rest.id, extra: { type: 'rest' },
        isExactNotification: exactOk,
      }],
    });
    return true;
  } catch { return false; }
}

export async function cancelRestDone(): Promise<void> {
  if (!isNative()) return;
  try { await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] }); } catch { /* ignore */ }
}

export interface ReminderHealth { status: string; queued: number; ok: boolean }

/**
 * Re-sync training reminders for the next 8 weeks from the schedule.
 * Returns a plain-words status; never changes the user's preference.
 * `todayReadinessSummary` (F3.8) replaces today's body only: a day further out cannot know its
 * own readiness yet, since that depends on health data that has not happened.
 */
export async function syncTrainingReminders(reminders: Reminders, schedule: Record<Weekday, string | null>, splitName: (id: string) => string, completedDays: Set<string>, todayReadinessSummary?: string | null, { prompt = false }: { prompt?: boolean } = {}): Promise<ReminderHealth> {
  if (!isNative()) return { status: 'Reminders need the Android app.', queued: 0, ok: false };
  await ensureChannels();
  let pending: Array<{ id: number }> = [];
  try { pending = (await LocalNotifications.getPending()).notifications.filter(n => n.id >= 730000 && n.id < 820000); } catch { /* ignore */ }
  if (pending.length) { try { await LocalNotifications.cancel({ notifications: pending.map(p => ({ id: p.id })) }); } catch { /* ignore */ } }
  if (!reminders.enabled) return { status: 'Off', queued: 0, ok: true };
  const granted = await ensurePermission({ prompt });
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
    const body = reminders.readinessSummary && day === today && todayReadinessSummary ? todayReadinessSummary : `${splitName(splitId)} is ready when you are.`;
    list.push({
      id: 730000 + (((y ?? 0) * 372 + (m ?? 0) * 31 + (d ?? 0)) % 90000),
      title: 'Training day', body,
      schedule: { at, allowWhileIdle: true }, channelId: CHANNELS[reminders.style].id, extra: { type: 'training', day, splitId },
      // A reminder a few minutes late is fine; never trigger the exact-alarm settings screen for it.
      isExactNotification: false,
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

/** Taps report the notification's `extra.type` ('rest', 'training', 'backup'), so each can open its own place. */
export function onNotificationTap(handler: (type: string | undefined) => void): void {
  if (!isNative()) return;
  try {
    Promise.resolve(LocalNotifications.addListener('localNotificationActionPerformed', a => handler((a?.notification?.extra as { type?: string } | undefined)?.type))).catch(() => undefined);
  } catch { /* tapping a reminder just opens the app */ }
}

/** F5: outside 730000–820000, which syncTrainingReminders clears. */
export const BACKUP_REMINDER_ID = 880101;

/**
 * QA2-FB-3, QA2-FB-6: whether the weekly backup reminder is actually scheduled, so Settings can say
 * when the switch reads on but notifications are off. Null until the first sync.
 */
export const backupReminderScheduled = signal<boolean | null>(null);

/** F5: a weekly, inexact "save a backup" note on Sundays at 19:00; cancelled when off. Returns whether it is scheduled. */
export async function syncBackupReminder(on: boolean, { prompt = false }: { prompt?: boolean } = {}): Promise<boolean> {
  if (!isNative()) return false;
  try { await LocalNotifications.cancel({ notifications: [{ id: BACKUP_REMINDER_ID }] }); } catch { /* none pending */ }
  if (!on || !(await ensurePermission({ prompt }))) { backupReminderScheduled.value = false; return false; }
  await ensureChannels();
  try {
    await LocalNotifications.schedule({ notifications: [{
      id: BACKUP_REMINDER_ID, title: 'Save a backup of your training', body: '', // COPY-1: the title says it all
      schedule: { on: { weekday: 1, hour: 19, minute: 0 }, allowWhileIdle: false }, channelId: CHANNELS.silent.id, extra: { type: 'backup' },
      isExactNotification: false,
    }] });
    backupReminderScheduled.value = true;
    return true;
  } catch { backupReminderScheduled.value = false; return false; }
}
