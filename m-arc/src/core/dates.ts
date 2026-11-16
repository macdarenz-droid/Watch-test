import type { Session, Weekday } from './models';
import { WEEKDAYS } from './models';

const pad = (n: number) => String(n).padStart(2, '0');

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Local calendar day as YYYY-MM-DD. A day key passes through unchanged (new Date('2026-09-22') is UTC midnight). */
export function dayKey(value: Date | string | number = new Date()): string {
  if (typeof value === 'string' && DAY_KEY.test(value)) return value;
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

/** Local midnight (ms) per day key. Brain loops compare the same few hundred days many times. */
const dayMsCache = new Map<string, number>();
function dayMs(key: string): number {
  const hit = dayMsCache.get(key);
  if (hit !== undefined) return hit;
  const [y, m, d] = key.split('-').map(Number);
  const ms = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime();
  if (dayMsCache.size > 5000) dayMsCache.clear();
  dayMsCache.set(key, ms);
  return ms;
}

/** Forget cached local midnights: call after the time zone changes. */
export function resetDayCache(): void { dayMsCache.clear(); }

export function parseDay(key: string): Date {
  return new Date(dayMs(key));
}

export function addDays(key: string, n: number): string {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export interface MonthCell { key: string; other: boolean }

/** BUG-10: every month grid is a fixed 6 rows / 42 cells, never the raw 4-6 rows a month's own
 * days plus leading padding would give — a real calendar's own height changed as the user paged
 * between months (Aug 2026 needs 6 rows; Jul and Apr need 5). Leading cells (padding to the first
 * Monday) and trailing cells (padding out to 42) are both `other`; `month` is `YYYY-MM`. */
export function monthCells(month: string): MonthCell[] {
  const first = parseDay(`${month}-01`);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: MonthCell[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ key: addDays(`${month}-01`, i - startOffset), other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ key: `${month}-${String(d).padStart(2, '0')}`, other: false });
  const lastDayKey = `${month}-${String(daysInMonth).padStart(2, '0')}`;
  const trailing = 42 - cells.length;
  for (let j = 1; j <= trailing; j++) cells.push({ key: addDays(lastDayKey, j), other: true });
  return cells;
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
  return Math.round((dayMs(b) - dayMs(a)) / 86_400_000);
}

/**
 * QA8-4: sessions that count as "trained today" — dated today, or ended today within the last
 * 6 hours (started before midnight, finished just after). Read-only: never changes the stored
 * `day`, history or records. QA8-1, QA8-2, QA8-3 and `sessionsToday` all share this.
 */
export function trainedTodaySessions(sessions: Session[], today: string, now: number): Session[] {
  return sessions.filter(s => s.day === today || (dayKey(s.endedAt) === today && now - new Date(s.endedAt).getTime() <= 6 * 3600_000));
}

export function trainedToday(sessions: Session[], today: string, now: number): boolean {
  return trainedTodaySessions(sessions, today, now).length > 0;
}

export interface NextScheduled { splitId: string; weekday: Weekday; day: string }

/** The next scheduled split strictly after `today`, walking forward at most `maxDays`. Null when nothing is scheduled in that window (QA8-1, QA8-2). */
export function nextScheduled(schedule: Record<Weekday, string | null>, today: string, maxDays = 7): NextScheduled | null {
  for (let i = 1; i <= maxDays; i++) {
    const day = addDays(today, i);
    const weekday = weekdayOf(day);
    const splitId = schedule[weekday];
    if (splitId) return { splitId, weekday, day };
  }
  return null;
}

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
};

export function formatDay(key: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }): string {
  return parseDay(key).toLocaleDateString(undefined, opts);
}

/** A time of day in the person's locale, e.g. 17:30. (formatClock is a duration.) */
export function formatTimeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** A stored ISO time as the person's local day and time, e.g. "Tue, 22 Sep 17:30". */
export function formatLocalStamp(iso: string): string {
  return `${formatDay(dayKey(iso))} ${formatTimeOfDay(iso)}`;
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
}

/** "3h" / "1.5d" style durations for recovery copy. */
/** BUG-17 (RECOVERY-F1): a muscle still under 90 % at the model's 120 h window cap. */
export const BEYOND_CAP_TEXT = '5+ days';

/** Hours left to ready, or "5+ days" past the window cap. */
export function formatHoursLeft(r: { hoursLeft: number; beyondCap?: boolean }): string {
  return r.beyondCap ? BEYOND_CAP_TEXT : formatHours(r.hoursLeft);
}

export function formatHours(hours: number): string {
  if (hours < 1) return 'under 1h';
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  return days < 3 ? `${Math.round(days * 2) / 2}d` : `${Math.round(days)}d`;
}

// O3: recovery "ready times" grouped by day (Body.tsx). All local-time, so it stays correct
// under any TZ; nothing here reads the system's default locale except the day label, which
// callers get from formatDay.

/** Nearest hour, ties rounding up. */
function roundNearestHour(ms: number): Date {
  const d = new Date(ms);
  d.setSeconds(0, 0);
  if (d.getMinutes() >= 30) d.setHours(d.getHours() + 1);
  d.setMinutes(0);
  return d;
}

/** Next hour, unless already exactly on one. */
function ceilHour(ms: number): Date {
  const d = new Date(ms);
  if (d.getMinutes() > 0 || d.getSeconds() > 0 || d.getMilliseconds() > 0) d.setHours(d.getHours() + 1);
  d.setMinutes(0, 0, 0);
  return d;
}

/** 12-hour label parts. Midnight/noon carry an implied suffix so a range can tell whether it crosses one. */
function hourLabel12(d: Date): { text: string; suffix: 'am' | 'pm' } {
  const h = d.getHours();
  if (h === 0) return { text: 'midnight', suffix: 'am' };
  if (h === 12) return { text: 'noon', suffix: 'pm' };
  return { text: String(h % 12), suffix: h < 12 ? 'am' : 'pm' };
}

function hourLabelFull(d: Date): string {
  const a = hourLabel12(d);
  return a.text === 'midnight' || a.text === 'noon' ? a.text : `${a.text} ${a.suffix}`;
}

/** "2 – 5 pm" / "6 pm – midnight" / "9 pm – 3 am": the suffix on the first hour is dropped only when it matches the second. */
function hourRangeText(a: Date, b: Date): string {
  const lo = hourLabel12(a);
  const hi = hourLabel12(b);
  const hiStr = hourLabelFull(b);
  const loStr = lo.text === 'midnight' || lo.text === 'noon' ? lo.text : (lo.suffix === hi.suffix ? lo.text : `${lo.text} ${lo.suffix}`);
  return `${loStr} – ${hiStr}`;
}

export interface ReadyWindow {
  /** Calendar day of the rounded latest bound; a latest of exactly midnight belongs to the day before it. */
  groupDay: string;
  group: 'today' | 'tomorrow' | 'later';
  /** Hours-only ("2 – 5 pm") for today/tomorrow, days-only ("Mon – Tue") for later. */
  tileText: string;
  /** Always day + time, e.g. "Ready Sat 26, 7 – 8 am" or "Ready Sat 26, 9 pm – Sun 27, 3 am". */
  detailText: string;
  earliestMs: number;
  latestMs: number;
}

/**
 * A muscle's ready window (recovery.ts's `readyInHours`, hours from `now`) as a day group and
 * copy. `lo`/`hi` are hours from now; the earliest rounds to the nearest hour, the latest rounds up.
 */
export function readyWindow(now: number, lo: number, hi: number): ReadyWindow {
  const earliest = roundNearestHour(now + Math.min(lo, hi) * 3_600_000);
  const latest = ceilHour(now + Math.max(lo, hi) * 3_600_000);
  if (earliest.getTime() > latest.getTime()) earliest.setTime(latest.getTime());

  const latestIsMidnight = latest.getHours() === 0 && latest.getMinutes() === 0;
  const groupDay = latestIsMidnight ? addDays(dayKey(latest), -1) : dayKey(latest);
  const earliestDayKey = dayKey(earliest);

  const todayKey_ = dayKey(now);
  const tomorrowKey = addDays(todayKey_, 1);
  const group: ReadyWindow['group'] = groupDay === todayKey_ ? 'today' : groupDay === tomorrowKey ? 'tomorrow' : 'later';

  const tileText = group === 'later'
    ? (earliestDayKey === groupDay ? WEEKDAY_LABEL[weekdayOf(groupDay)] : `${WEEKDAY_LABEL[weekdayOf(earliestDayKey)]} – ${WEEKDAY_LABEL[weekdayOf(groupDay)]}`)
    : hourRangeText(earliest, latest);

  const detailText = earliestDayKey === groupDay
    ? `Ready ${formatDay(groupDay, { weekday: 'short', day: 'numeric' })}, ${hourRangeText(earliest, latest)}`
    : `Ready ${formatDay(earliestDayKey, { weekday: 'short', day: 'numeric' })}, ${hourLabelFull(earliest)} – ${formatDay(groupDay, { weekday: 'short', day: 'numeric' })}, ${hourLabelFull(latest)}`;

  return { groupDay, group, tileText, detailText, earliestMs: earliest.getTime(), latestMs: latest.getTime() };
}

export interface ReadyGroupInfo {
  group: 'today' | 'tomorrow' | 'later' | 'sore';
  groupDay: string | null;
  tileText: string;
  detailText: string;
  earliestMs: number;
  latestMs: number;
}

/**
 * The O3 recovery-list group and copy for one recovering muscle: a real window, a sore muscle
 * with no window ("Sore today"), or a recovering muscle with no window that isn't sore (dropped
 * into Later with its plain hours-left estimate).
 */
export function readyGroupFor(now: number, r: { readyInHours: [number, number] | null; hoursLeft: number; soreToday?: boolean; beyondCap?: boolean }): ReadyGroupInfo {
  if (r.readyInHours) {
    const w = readyWindow(now, r.readyInHours[0], r.readyInHours[1]);
    return { group: w.group, groupDay: w.groupDay, tileText: w.tileText, detailText: w.detailText, earliestMs: w.earliestMs, latestMs: w.latestMs };
  }
  if (r.beyondCap) {
    return { group: 'later', groupDay: null, tileText: BEYOND_CAP_TEXT, detailText: `Ready in ${BEYOND_CAP_TEXT}`, earliestMs: now + r.hoursLeft * 3_600_000, latestMs: Number.POSITIVE_INFINITY };
  }
  if (r.soreToday) {
    return { group: 'sore', groupDay: null, tileText: 'Not today', detailText: 'Ready when soreness eases', earliestMs: now, latestMs: Number.POSITIVE_INFINITY };
  }
  const atMs = now + Math.max(0, r.hoursLeft) * 3_600_000;
  return { group: 'later', groupDay: null, tileText: `${formatHours(r.hoursLeft)} left`, detailText: `Ready in ${formatHours(r.hoursLeft)}`, earliestMs: atMs, latestMs: atMs };
}

/** "Full by 5 pm" for an already-ready muscle, or "Ready" once there is no further full time to show. */
export function formatFullBy(now: number, fullInHours: number | null): string {
  if (fullInHours == null) return 'Ready';
  return `Full by ${hourLabelFull(ceilHour(now + fullInHours * 3_600_000))}`;
}

/** "Sat 26, 6 pm": day + time, for the ready-times detail strip's "Full …" line. */
export function formatFullAt(now: number, fullInHours: number): string {
  const at = ceilHour(now + fullInHours * 3_600_000);
  return `${formatDay(dayKey(at), { weekday: 'short', day: 'numeric' })}, ${hourLabelFull(at)}`;
}

// O2: the muscle-panel timeline's Ready/Full columns are day-only (no times), unlike O3's
// hour-based readyWindow above.

/** The calendar day `hours` from `now`, as "Today" or `formatDay`'s weekday+day form. */
export function dayOrToday(now: number, hours: number): string {
  const key = dayKey(now + hours * 3_600_000);
  return key === dayKey(now) ? 'Today' : formatDay(key, { weekday: 'short', day: 'numeric' });
}

/**
 * The O2 muscle panel's "Ready" column: a day-only window from `readyInHours` ("Mon 28 – Tue 29",
 * or a single day when lo and hi land on the same day), or null for a null window (the caller
 * supplies its own fallback text, since that depends on why there's no window).
 */
export function readyDayWindow(now: number, window: [number, number] | null): string | null {
  if (!window) return null;
  const lo = Math.min(window[0], window[1]);
  const hi = Math.max(window[0], window[1]);
  const loKey = dayKey(now + lo * 3_600_000);
  const hiKey = dayKey(now + hi * 3_600_000);
  return loKey === hiKey ? dayOrToday(now, lo) : `${dayOrToday(now, lo)} – ${dayOrToday(now, hi)}`;
}
