import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { isNative } from '@/native/capacitor';
import type { HeartRateDevice, HeartRateSample, HeartRateStatus, HeartRateTrace } from './types';
import type { HeartRateSummary } from '@/core/models';

interface HeartRateNativePlugin {
  getStatus(): Promise<HeartRateStatus>;
  requestSensorPermissions(): Promise<{ granted: boolean }>;
  startScan(): Promise<{ started: boolean }>;
  stopScan(): Promise<void>;
  listDevices(): Promise<{ devices: HeartRateDevice[] }>;
  connect(options: { deviceId: string }): Promise<void>;
  reconnectRemembered(): Promise<{ started: boolean }>;
  disconnect(): Promise<void>;
  beginSession(options: { sessionId: string; startedAtEpochMs: number }): Promise<void>;
  finishSession(options: { sessionId: string; endedAtEpochMs: number }): Promise<{ summary: HeartRateSummary }>;
  discardSession(options: { sessionId: string }): Promise<void>;
  deleteSession(options: { sessionId: string }): Promise<void>;
  getSessionTrace(options: { sessionId: string }): Promise<HeartRateTrace>;
  getSessionSummary(options: { sessionId: string; startedAtEpochMs: number; endedAtEpochMs: number }): Promise<{ summary: HeartRateSummary }>;
  exportAll(): Promise<{ version: 1; traces: HeartRateTrace[] }>;
  importAll(options: { payload: { version: 1; traces: HeartRateTrace[]; replace?: boolean } }): Promise<{ imported: number }>;
  resetAll(): Promise<void>;
  addListener(eventName: 'heartRateSample', listener: (sample: HeartRateSample) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'heartRateStatus', listener: (status: HeartRateStatus) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'heartRateDevices', listener: (event: { devices: HeartRateDevice[] }) => void): Promise<PluginListenerHandle>;
}

const plugin = registerPlugin<HeartRateNativePlugin>('HeartRateNative');

export function heartRateNativeAvailable(): boolean { return isNative(); }
export function heartRateNative(): HeartRateNativePlugin | null { return heartRateNativeAvailable() ? plugin : null; }
