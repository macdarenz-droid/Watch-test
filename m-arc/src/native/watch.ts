/**
 * WatchBridge plugin wrapper (6.2, 6.3). Web fallback: isSupported() is
 * always false and the UI hides the connect controls, the same pattern
 * as haptics and health.
 */
import { signal } from '@preact/signals';
import { isNative } from './capacitor';

export type WatchState = 'unsupported' | 'permission' | 'idle' | 'scanning' | 'connecting' | 'connected' | 'reconnecting' | 'stopped' | 'paused';
export type Freshness = 'LIVE' | 'DELAYED' | 'STALE' | 'WAITING' | 'CHECK_FIT' | 'DISCONNECTED';
export interface WatchDevice { address: string; name: string; advertisesHeartRate: boolean; paired: boolean; rssi: number }
export interface WatchStatus { state: WatchState; freshness: Freshness; deviceName?: string; battery?: number; message: string }
export interface WatchMeasurement { bpm: number; contact: boolean | null; rrMs: number[]; energyKj: number | null; receivedAtEpochMs: number; receivedAtElapsedMs: number }

const UNSUPPORTED: WatchStatus = { state: 'unsupported', freshness: 'DISCONNECTED', message: 'Live heart rate needs the Android app' };

export const watchSupported = signal(false);
export const watchStatus = signal<WatchStatus>(UNSUPPORTED);
export const latestMeasurement = signal<WatchMeasurement | null>(null);
export const scannedDevices = signal<WatchDevice[]>([]);

interface ListenerHandle { remove: () => void }
interface WatchPlugin {
  isSupported(): Promise<{ supported: boolean }>;
  permissionState(): Promise<{ granted: boolean; needsLocation: boolean }>;
  requestPermissions(): Promise<{ granted: boolean }>;
  startScan(opts: { timeoutMs: number }): Promise<void>;
  stopScan(): Promise<void>;
  connect(opts: { address: string }): Promise<void>;
  disconnect(): Promise<void>;
  status(): Promise<WatchStatus>;
  diagnostics?(): Promise<{ text: string }>;
  // The legacy Capacitor.Plugins proxy returns a bare handle on some builds, a Promise on others.
  addListener(eventName: string, cb: (data: unknown) => void): Promise<ListenerHandle> | ListenerHandle;
}

function plugin(): WatchPlugin | null {
  const cap = (globalThis as { Capacitor?: { Plugins?: Record<string, WatchPlugin> } }).Capacitor;
  return cap?.Plugins?.WatchBridge ?? null;
}

let started = false;

/**
 * NAT-01: the native side works out freshness only when it emits, so a watch that stops sending
 * without disconnecting would stay LIVE. The app ages it itself, on the same 5 s / 15 s limits as
 * LiveSession.freshness: LIVE past 5 s with nothing new reads DELAYED, past 15 s STALE.
 */
export const FRESH = { liveMs: 5_000, delayedMs: 15_000, tickMs: 1_000 } as const;
let nativeStatus: WatchStatus = UNSUPPORTED;
/** App clock (ms) of the last sign the stream was fresh: a measurement, or a status that said LIVE. */
let freshAtMs = -1;

/** Pure: the freshness to show, given what the native side last said and how long the stream has been quiet. */
export function agedFreshness(native: Freshness, freshAt: number, nowMs: number): Freshness {
  if (native !== 'LIVE' && native !== 'DELAYED') return native;
  if (freshAt < 0) return native;
  const age = nowMs - freshAt;
  if (age > FRESH.delayedMs) return 'STALE';
  if (age > FRESH.liveMs) return 'DELAYED';
  return native;
}

/** The native status the shown one was last built from. */
let publishedFrom: WatchStatus | null = null;

function publishStatus(nowMs = Date.now()): void {
  const freshness = agedFreshness(nativeStatus.freshness, freshAtMs, nowMs);
  if (publishedFrom === nativeStatus && watchStatus.peek().freshness === freshness) return;
  publishedFrom = nativeStatus;
  watchStatus.value = freshness === nativeStatus.freshness ? nativeStatus : { ...nativeStatus, freshness };
}

/** Exported for tests: the native status and measurement handlers, with the app clock reading. */
export function onNativeStatus(s: WatchStatus, nowMs = Date.now()): void {
  nativeStatus = s;
  if (s.freshness === 'LIVE') freshAtMs = nowMs;
  publishStatus(nowMs);
}
export function onNativeMeasurement(m: WatchMeasurement, nowMs = Date.now()): void {
  freshAtMs = nowMs;
  latestMeasurement.value = m;
  publishStatus(nowMs);
}
export function tickFreshness(nowMs = Date.now()): void { publishStatus(nowMs); }

/** Attach a listener without assuming addListener returns a Promise; never throws. */
function listen(p: WatchPlugin, eventName: string, cb: (data: unknown) => void): void {
  try {
    Promise.resolve(p.addListener(eventName, cb)).catch(() => undefined);
  } catch { /* plugin missing the method: live HR stays off, the app still boots */ }
}

/** Call once, from main.tsx. No-ops on the web or when the plugin isn't in this build. */
export function startWatchListeners(): void {
  if (started) return;
  started = true;
  const p = plugin();
  if (!isNative() || !p) return;
  Promise.resolve().then(() => p.isSupported()).then(r => {
    watchSupported.value = r.supported;
    if (!r.supported) { watchStatus.value = UNSUPPORTED; return; }
    return Promise.resolve(p.status()).then(s => { onNativeStatus(s); });
  }).catch(() => undefined);
  listen(p, 'watchStatus', data => { onNativeStatus(data as WatchStatus); });
  listen(p, 'watchMeasurement', data => { onNativeMeasurement(data as WatchMeasurement); });
  setInterval(() => tickFreshness(), FRESH.tickMs);
  // PL-13: one batched, throttled event with the whole list; the old per-device event stays for one release.
  listen(p, 'watchDevices', data => { scannedDevices.value = devicesFrom(data) ?? scannedDevices.value; });
  listen(p, 'watchDevice', data => {
    const d = data as WatchDevice;
    scannedDevices.value = [...scannedDevices.value.filter(x => x.address !== d.address), d];
  });
}

/** Reads a `watchDevices` payload; null when it isn't one. */
export function devicesFrom(data: unknown): WatchDevice[] | null {
  const list = (data as { devices?: unknown } | null)?.devices;
  if (!Array.isArray(list)) return null;
  return list.filter((d): d is WatchDevice => !!d && typeof (d as WatchDevice).address === 'string');
}

/** The service's status and connection log (UI-08); no addresses or heart-rate values. */
export async function watchDiagnostics(): Promise<string | null> {
  const p = plugin();
  if (!p?.diagnostics) return null;
  try { return (await p.diagnostics()).text; } catch { return null; }
}

/**
 * QA-R5a-2, QA-R5b-1, QA-R5b-6: Android 11 and older find Bluetooth devices through the Location
 * permission; only Android 12+ has "Nearby devices".
 */
export function watchPermissionHint(needsLocation: boolean): string {
  return needsLocation
    ? 'Allow Location in Android settings to find your watch, then scan again.'
    : 'Allow Nearby devices in Android settings to find your watch, then scan again.';
}

export async function watchPermissionState(): Promise<{ granted: boolean; needsLocation: boolean } | null> {
  const p = plugin();
  if (!p) return null;
  try { return await p.permissionState(); } catch { return null; }
}

export async function requestWatchPermissions(): Promise<boolean> {
  const p = plugin();
  if (!p) return false;
  try { return (await p.requestPermissions()).granted; } catch { return false; }
}

export async function scanForWatch(timeoutMs = 20_000): Promise<void> {
  const p = plugin();
  if (!p) return;
  scannedDevices.value = [];
  try { await p.startScan({ timeoutMs }); } catch { /* surfaced via watchStatus */ }
}

export async function stopWatchScan(): Promise<void> {
  const p = plugin();
  if (!p) return;
  try { await p.stopScan(); } catch { /* ignore */ }
}

export async function connectWatch(address: string): Promise<void> {
  const p = plugin();
  if (!p) return;
  try { await p.connect({ address }); } catch { /* surfaced via watchStatus */ }
}

export async function disconnectWatch(): Promise<void> {
  const p = plugin();
  if (!p) return;
  try { await p.disconnect(); } catch { /* ignore */ }
}
