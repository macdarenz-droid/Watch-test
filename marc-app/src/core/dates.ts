import type { Weekday } from './models';
import { WEEKDAYS } from './models';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(value: Date | string | number = new Date()): string {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(key: string, n: number): string {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export function weekdayOf(key: string): Weekday {
  return WEEKDAYS[parseDay(key).getDay()] as Weekday;
}

/** Monday of the week containing `key`. */
export function weekStart(key: string): string {
  const d = parseDay(key);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return dayKey(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86_400_000);
}

export function hoursSince(iso: string, now = Date.now()): number {
  return (now - new Date(iso).getTime()) / 3_600_000;
}

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
};

export function formatDay(key: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }): string {
  return parseDay(key).toLocaleDateString(undefined, opts);
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
}

/** "3h" / "1.5d" style durations for recovery copy. */
export function formatHours(hours: number): string {
  if (hours < 1) return 'under 1h';
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  return days < 3 ? `${Math.round(days * 2) / 2}d` : `${Math.round(days)}d`;
}
