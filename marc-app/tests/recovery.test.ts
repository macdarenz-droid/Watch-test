import { describe, it, expect } from 'vitest';
import { baseWindowHours, recoveryStatus, recoveryTier } from '@/brain/recovery';
import { session, sets } from './helpers';

describe('recovery', () => {
  it('window is 24h easy, 48h ideal, 72h max', () => {
    expect(baseWindowHours(0.9)).toBe(24);
    expect(baseWindowHours(1)).toBe(48);
    expect(baseWindowHours(1.1)).toBe(72);
  });
  it('reports percent recovered and hours left', () => {
    const s = session('2026-09-17', [{ id: 'lib_machine_chest_press', sets: sets(50, 8, 'ideal') }]);
    const now = new Date('2026-09-18T18:00:00.000Z').getTime(); // 24h after end
    const chest = recoveryStatus([s], [], now).find(r => r.muscle === 'chest')!;
    expect(chest.windowHours).toBe(48);
    expect(chest.pct).toBe(50);
    expect(Math.round(chest.hoursLeft)).toBe(24);
    expect(chest.recovering).toBe(true);
    const quads = recoveryStatus([s], [], now).find(r => r.muscle === 'quads')!;
    expect(quads.pct).toBe(100);
    expect(quads.lastTrainedAt).toBeNull();
  });
  it('tiers', () => {
    expect(recoveryTier(100)).toBe('ready');
    expect(recoveryTier(80)).toBe('high');
    expect(recoveryTier(50)).toBe('mid');
    expect(recoveryTier(10)).toBe('low');
  });
});
