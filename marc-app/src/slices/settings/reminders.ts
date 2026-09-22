import { signal } from '@preact/signals';
import { state } from '@/core/store';
import { syncTrainingReminders, type ReminderHealth } from '@/native/notifications';

export const reminderHealth = signal<ReminderHealth>({ status: 'Not checked yet', queued: 0, ok: true });

/** Re-schedule reminders from the current preference and schedule. Safe to call often. */
export async function resyncReminders(): Promise<void> {
  const s = state.value;
  const completed = new Set(s.sessions.map(x => x.day));
  reminderHealth.value = await syncTrainingReminders(s.preferences.reminders, s.schedule, id => s.splits.find(sp => sp.id === id)?.name ?? 'Training', completed);
}
