import { signal } from '@preact/signals';
import { isNative } from './capacitor';

interface NativeUiPlugin { keepAwake(opts: { on: boolean }): Promise<void> }

function nativeUiPlugin(): NativeUiPlugin | null {
  const cap = (globalThis as { Capacitor?: { Plugins?: Record<string, NativeUiPlugin> } }).Capacitor;
  return cap?.Plugins?.NativeUi ?? null;
}

let webLock: WakeLockSentinel | null = null;
let wantOn = false;
let visBound = false;

async function acquireWebLock(): Promise<void> {
  try { webLock = (await navigator.wakeLock?.request('screen')) ?? null; }
  catch { webLock = null; }
}

async function releaseWebLock(): Promise<void> {
  try { await webLock?.release(); } catch { /* already released */ }
  webLock = null;
}

function onVisibility(): void {
  if (document.visibilityState === 'visible' && wantOn) void acquireWebLock();
}

/** A4: keeps the screen on during a live workout. Native routes through the NativeUi plugin's
 * window flag; web uses the Screen Wake Lock API (support in Android System WebView unverified;
 * the APK is covered by the native path), re-acquired on visibilitychange since the OS releases
 * a wake lock whenever the tab is hidden. */
export async function keepAwake(on: boolean): Promise<void> {
  wantOn = on;
  if (isNative()) {
    try { await nativeUiPlugin()?.keepAwake({ on }); } catch { /* older build, or web disguised as native in a test */ }
    return;
  }
  if (typeof document === 'undefined') return;
  if (!visBound) { document.addEventListener('visibilitychange', onVisibility); visBound = true; }
  if (on) await acquireWebLock(); else await releaseWebLock();
}

const PREF_KEY = 'marc.keepAwake';

function readPref(): boolean {
  try { const v = localStorage.getItem(PREF_KEY); return v === null ? true : v === '1'; } catch { return true; }
}

/** Settings › Feedback › "Keep screen on during workouts". Default on. */
export const keepAwakePref = signal<boolean>(readPref());

export function setKeepAwakePref(v: boolean): void {
  try { localStorage.setItem(PREF_KEY, v ? '1' : '0'); } catch { /* storage unavailable */ }
  keepAwakePref.value = v;
}
