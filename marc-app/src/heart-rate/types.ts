import type { HeartRateSummary } from '@/core/models';

export type HeartRateFreshness = 'unavailable' | 'connecting' | 'live' | 'delayed' | 'lost';

export interface HeartRateSample {
  bpm: number;
  receivedAtEpochMs: number;
  receivedAtElapsedMs: number;
  contactDetected?: boolean;
  energyKj?: number;
  rrMillis?: number[];
  source: 'ble-heart-rate';
}

export interface HeartRateDevice {
  id: string;
  name: string;
  heartRateAdvertised: boolean;
  bonded: boolean;
}

export interface HeartRateStatus {
  available: boolean;
  state: HeartRateFreshness;
  title: string;
  detail: string;
  deviceName?: string;
  rememberedDevice?: boolean;
  scanning?: boolean;
  batteryPct?: number;
}

export interface HeartRateTrace {
  sessionId: string;
  version: 1;
  startedAtEpochMs?: number;
  endedAtEpochMs?: number;
  samples: HeartRateSample[];
  summary: HeartRateSummary;
}
