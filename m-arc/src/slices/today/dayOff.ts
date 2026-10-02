/** RG-19 (D4): taking a scheduled day off, with Undo. */
import { MAX_DAYS_OFF, update } from '@/core/store';
import { showToast } from '@/app/toast';
import { resyncReminders } from '@/slices/settings/reminders';

export function setDayOff(day: string, off: boolean, toast = true): void {
  update(s => ({ ...s, daysOff: off ? [...new Set([...s.daysOff, day])].sort().slice(-MAX_DAYS_OFF) : s.daysOff.filter(d => d !== day) }));
  void resyncReminders();
  if (toast && off) showToast('Today is a day off', 'Undo', () => setDayOff(day, false, false));
}
