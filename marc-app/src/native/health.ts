/**
 * Android Health Connect, through the project's native plugin when the APK
 * includes it. On the web this is a no-op and the card says so.
 */
import type { HealthSnapshot } from '@/core/models';
import { isNative } from './capacitor';

interface HealthPlugin {
  isAvailable?: () => Promise<{ available?: boolean }>;
  requestPermissions?: () => Promise<unknown>;
  readToday?: () => Promise<{ sleepMinutes?: number; restingHeartRate?: number; steps?: number; activeCalories?: number }>;
}

function plugin(): HealthPlugin | null {
  const cap = (globalThis as { Capacitor?: { Plugins?: Record<string, HealthPlugin> } }).Capacitor;
  return cap?.Plugins?.HealthConnectNative ?? null;
}

export function healthAvailable(): boolean {
  return isNative() && !!plugin();
}

export async function readHealth(): Promise<HealthSnapshot> {
  const p = plugin();
  if (!p?.readToday) return { connected: false };
  try {
    await p.requestPermissions?.();
    const r = await p.readToday();
    return { connected: true, lastSync: new Date().toISOString(), sleepMinutes: r.sleepMinutes, restingHr: r.restingHeartRate, steps: r.steps, activeCalories: r.activeCalories };
  } catch {
    return { connected: false };
  }
}
