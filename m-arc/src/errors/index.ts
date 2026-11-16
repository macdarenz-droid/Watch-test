/**
 * 7.5: the app-side half of docs/ERROR-REPORTS.md. `reportError` is the one call every trigger
 * site makes; everything else here is wiring called once from main.tsx. A failure anywhere in
 * this module must never reach the app, so every public function swallows its own errors.
 */
import { APP_VERSION } from '@/core/version';
import { bootRecovered, bootSource, saveError, state } from '@/core/store';
import { openPanel, tab } from '@/app/router';
import { isNative } from '@/native/capacitor';
import { ESCOBAR_PROXY_URL } from '@/escobar/state';
import { buildReport } from './scrub';
import { getInstallId, resetInstallId } from './installId';
import { clearNextAttempt, clearQueue, enqueue } from './queue';
import { trySend } from './sender';
import type { ReportKind } from './types';

export type { ReportKind } from './types';
export { errorReportsAskTrigger, shouldAskErrorReports } from './ask';

function currentRoute(): string {
  try { return openPanel.value?.id ?? tab.value; } catch { return 'unknown'; }
}

function consentGiven(): boolean {
  try { return state.value.preferences.errorReports === true; } catch { return false; }
}

/** Never in a test run or under an automated browser (the gate): nothing leaves those. */
export function automated(): boolean {
  try { if (import.meta.env.MODE === 'test') return true; } catch { /* no env */ }
  try { return typeof navigator !== 'undefined' && navigator.webdriver === true; } catch { return false; }
}

/** The one door out: consent on, and not a test or the gate. (Online is checked by trySend.) */
export function sendingAllowed(): boolean {
  return consentGiven() && !automated();
}

function flush(): void {
  if (sendingAllowed()) void trySend({ workerBase: ESCOBAR_PROXY_URL, fetchImpl: fetch });
}

/** Only an Error's own name, message and stack are read. Anything else thrown or rejected (a
 * string, an object, a session) could be user content, so only its type is reported. */
export function describeError(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) return { name: err.name || 'Error', message: typeof err.message === 'string' ? err.message : '', stack: typeof err.stack === 'string' ? err.stack : undefined };
  return { name: 'NonError', message: `non-Error ${err === null ? 'null' : typeof err} thrown` };
}

/** Convenience for the boundary/onerror/unhandledrejection/store-save/boot/backup trigger sites:
 * an arbitrary caught value in, an allowlisted report out. */
export function reportCaught(kind: ReportKind, err: unknown): void {
  const { name, message, stack } = describeError(err);
  reportError(kind, name, message, stack);
}

/** Builds, queues and (best-effort) sends one report. A no-op while consent is off. */
export function reportError(kind: ReportKind, name: string, rawMessage: string, stack?: string): void {
  try {
    if (!consentGiven()) return;
    const report = buildReport({
      installId: getInstallId(),
      app: APP_VERSION,
      platform: isNative() ? 'android' : 'web',
      route: currentRoute(),
      kind,
      name,
      rawMessage,
      stack,
    });
    enqueue(report);
    flush();
  } catch { /* never throw into the app */ }
}

/** Settings switch turned off: no report is sent while off, and anything already queued goes. */
export function clearErrorReportQueue(): void {
  try { clearQueue(); } catch { /* storage unavailable */ }
}

/** "Delete everything": a fresh install id and an empty queue, same as a new install. */
export function resetErrorReporting(): void {
  try { resetInstallId(); clearQueue(); } catch { /* storage unavailable */ }
}

let poller: ReturnType<typeof setInterval> | null = null;
let saveErrorUnsub: (() => void) | null = null;
let onlineHandler: (() => void) | null = null;

/** Called once at boot: flushes anything left over from last session, then keeps trying every
 * 30s (trySend itself is a no-op outside its backoff window) and immediately on reconnect. */
export function initErrorReporting(): void {
  try {
    let lastSaveError: string | null = null;
    // Called again (a re-init), it replaces its listener instead of adding a second one.
    if (saveErrorUnsub) saveErrorUnsub();
    saveErrorUnsub = saveError.subscribe(v => {
      // A fixed message: the save error's own text is never read into a report.
      if (v && v !== lastSaveError) reportError('store-save', 'SaveFailed', 'save failed');
      lastSaveError = v;
    });

    // A load or migration failure this boot (unreadable save quarantined, or restored from backup).
    if (bootRecovered.value || bootSource.value === 'backup') reportError('boot', 'LoadRecovered', bootRecovered.value ? 'saved data unreadable; quarantined' : 'saved data unreadable; restored from backup');

    flush();
    if (poller) clearInterval(poller);
    poller = setInterval(flush, 30_000);

    if (typeof window !== 'undefined') {
      if (onlineHandler) window.removeEventListener('online', onlineHandler);
      // Connectivity just changed, so any offline-caused backoff no longer applies.
      onlineHandler = () => { clearNextAttempt(); flush(); };
      window.addEventListener('online', onlineHandler);
    }
  } catch { /* never throw into the app */ }
}
