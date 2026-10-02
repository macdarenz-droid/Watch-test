import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './capacitor';

let enabled = true;
export function setHapticsEnabled(v: boolean): void { enabled = v; }

/** §3: one semantic name per event. toggle/threshold carry the new on/off state. */
type Kind = 'tick' | 'confirm' | 'reject' | 'toggle' | 'longPress' | 'dragStart' | 'drop' | 'threshold' | 'success' | 'alert';

// Per-class throttle (§3), replacing the old global 35ms: tick/threshold 40ms; confirm/reject/
// toggle/longPress/dragStart/drop 80ms; success at most once a second; alert never throttled.
const CLASS_MS: Record<Kind, number> = {
  tick: 40, threshold: 40,
  confirm: 80, reject: 80, toggle: 80, longPress: 80, dragStart: 80, drop: 80,
  success: 1000,
  alert: 0,
};
const lastAt: Partial<Record<Kind, number>> = {};

function throttled(kind: Kind): boolean {
  const ms = CLASS_MS[kind];
  if (!ms) return false;
  const now = Date.now();
  const prev = lastAt[kind] ?? 0;
  if (now - prev < ms) return true;
  lastAt[kind] = now;
  return false;
}

interface NativeUiPlugin {
  haptic(opts: { type: Kind; on?: boolean }): Promise<{ played: boolean } | void>;
  peak?(opts: { type: 'success' | 'alert' }): Promise<{ played: boolean } | void>;
}

function nativeUiPlugin(): NativeUiPlugin | null {
  const cap = (globalThis as { Capacitor?: { Plugins?: Record<string, NativeUiPlugin> } }).Capacitor;
  return cap?.Plugins?.NativeUi ?? null;
}

/** The A4 native plugin, when it exists in this build. Maps `type` (and `on` for toggle/threshold)
 * to the platform HapticFeedbackConstants / VibrationEffect on the native side (§3). A rejection
 * or a `{played:false}` reply (older API level, missing constant) falls through to Capacitor.
 * success/alert go through the plugin's `peak` composition method instead of `haptic`. */
async function viaNativeUi(kind: Kind, on?: boolean): Promise<boolean> {
  const p = nativeUiPlugin();
  if (!p) return false;
  try {
    if (kind === 'success' || kind === 'alert') {
      if (typeof p.peak !== 'function') return false;
      const r = await p.peak({ type: kind });
      return !(r && (r as { played?: boolean }).played === false);
    }
    const r = await p.haptic(on === undefined ? { type: kind } : { type: kind, on });
    return !(r && (r as { played?: boolean }).played === false);
  } catch { return false; }
}

async function capacitorFallback(kind: Kind): Promise<void> {
  switch (kind) {
    case 'tick': case 'toggle': case 'threshold':
      return; // never selection* (a 100ms buzz); these stay silent on this backend
    case 'confirm': case 'drop':
      await Haptics.impact({ style: ImpactStyle.Light }); return;
    case 'reject': case 'dragStart': case 'longPress':
      await Haptics.impact({ style: ImpactStyle.Medium }); return;
    case 'success':
      await Haptics.notification({ type: NotificationType.Success }); return;
    case 'alert':
      await Haptics.vibrate({ duration: 120 });
      await new Promise(r => setTimeout(r, 220));
      await Haptics.vibrate({ duration: 120 });
      return;
  }
}

function webFallback(kind: Kind): void {
  try {
    if (kind === 'confirm') navigator.vibrate?.(10);
    else if (kind === 'success') navigator.vibrate?.(20);
    else if (kind === 'alert') navigator.vibrate?.([120, 220, 120]);
  } catch { /* not available */ }
}

async function run(kind: Kind, on?: boolean): Promise<void> {
  if (!enabled) return;
  if (throttled(kind)) return;
  if (isNative()) {
    if (await viaNativeUi(kind, on)) return;
    try { await capacitorFallback(kind); return; } catch { /* fall through to the web API */ }
  }
  webFallback(kind);
}

export const haptic = {
  tick: () => run('tick'),
  confirm: () => run('confirm'),
  reject: () => run('reject'),
  toggle: (on: boolean) => run('toggle', on),
  longPress: () => run('longPress'),
  dragStart: () => run('dragStart'),
  drop: () => run('drop'),
  threshold: (on: boolean) => run('threshold', on),
  success: () => run('success'),
  alert: () => run('alert'),
  // Deprecated aliases, kept for one release so a branch mid-migration still compiles.
  light: () => run('confirm'),
  medium: () => run('dragStart'),
  warning: () => run('alert'),
};

/** Reports which feedback path this build has, for the Settings test button. */
export function hapticSupport(): 'native' | 'web' | 'none' {
  if (isNative()) return 'native';
  return typeof navigator !== 'undefined' && 'vibrate' in navigator ? 'web' : 'none';
}
