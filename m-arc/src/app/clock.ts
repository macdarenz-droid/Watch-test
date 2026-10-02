/**
 * The app's one clock (R2.1). `today` and `minuteNow` refresh every minute, always; the 1 s
 * `nowMs` ticker runs only while something holds it (a live session, a rest). Minute-level
 * readers (recovery, coach) use `minuteNow`, so a 1 s tick does not re-run them.
 */
import { batch, signal } from '@preact/signals';
import { resetDayCache, todayKey } from '@/core/dates';

const floorMin = (ms: number): number => ms - (ms % 60_000);
function tzSignature(): string {
  let zone = '';
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''; } catch { /* no Intl */ }
  return `${zone}|${new Date().getTimezoneOffset()}`;
}

/** The current local day key. */
export const today = signal(todayKey());
/** Milliseconds, updated every second while the ticker is held. */
export const nowMs = signal(Date.now());
/** The current minute (ms, floored). */
export const minuteNow = signal(floorMin(Date.now()));

let tz = tzSignature();

/** Re-reads the clock now: on resume, and every minute. A time zone change clears the day cache first. */
export function refreshClock(now = Date.now()): void {
  const sig = tzSignature();
  if (sig !== tz) { tz = sig; resetDayCache(); }
  batch(() => {
    const k = todayKey();
    if (k !== today.value) today.value = k;
    nowMs.value = now;
    const m = floorMin(now);
    if (m !== minuteNow.value) minuteNow.value = m;
  });
}

setInterval(() => {
  const sig = tzSignature();
  if (sig !== tz) { tz = sig; resetDayCache(); }
  const now = Date.now();
  batch(() => {
    const k = todayKey();
    if (k !== today.value) today.value = k;
    const m = floorMin(now);
    if (m !== minuteNow.value) minuteNow.value = m;
  });
}, 60_000);

let holders = 0;
let ticker: ReturnType<typeof setInterval> | null = null;

/** Starts the 1 s ticker until every holder has released it. The release is idempotent. */
export function acquireTicker(): () => void {
  holders++;
  // F6: sync nowMs immediately, so a reader that mounts right after (the rest banner's first
  // frame) does not compute against whatever stale value the last holder left behind.
  batch(() => { nowMs.value = Date.now(); });
  if (!ticker) {
    ticker = setInterval(() => {
      const now = Date.now();
      batch(() => {
        nowMs.value = now;
        const m = floorMin(now);
        if (m !== minuteNow.value) minuteNow.value = m;
      });
    }, 1000);
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders = Math.max(0, holders - 1);
    if (holders === 0 && ticker) { clearInterval(ticker); ticker = null; }
  };
}

/** For tests: whether the 1 s ticker is running. */
export const tickerRunning = (): boolean => ticker !== null;
