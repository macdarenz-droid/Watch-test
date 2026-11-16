import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './capacitor';

let enabled = true;
let lastAt = 0;

export function setHapticsEnabled(v: boolean): void { enabled = v; }

async function run(fn: () => Promise<unknown>, fallbackMs: number): Promise<void> {
  if (!enabled) return;
  const now = Date.now();
  if (now - lastAt < 35) return;
  lastAt = now;
  try {
    if (isNative()) { await fn(); return; }
  } catch { /* fall through to the web API */ }
  try { navigator.vibrate?.(fallbackMs); } catch { /* not available */ }
}

export const haptic = {
  light: () => run(() => Haptics.impact({ style: ImpactStyle.Light }), 10),
  medium: () => run(() => Haptics.impact({ style: ImpactStyle.Medium }), 20),
  success: () => run(() => Haptics.notification({ type: NotificationType.Success }), 30),
  warning: () => run(() => Haptics.notification({ type: NotificationType.Warning }), 60),
};

/** Reports which feedback path this build has, for the Settings test button. */
export function hapticSupport(): 'native' | 'web' | 'none' {
  if (isNative()) return 'native';
  return typeof navigator !== 'undefined' && 'vibrate' in navigator ? 'web' : 'none';
}
