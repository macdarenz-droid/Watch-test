import { describe, it, expect } from 'vitest';
import { devicesFrom } from '@/native/watch';

describe('watchDevices batch (PL-13)', () => {
  it('reads the whole list from one event', () => {
    const d = { address: 'AA:BB', name: 'GT6', advertisesHeartRate: true, paired: false, rssi: -60 };
    expect(devicesFrom({ devices: [d, { ...d, address: 'CC:DD', name: 'Band' }] })!.map(x => x.name)).toEqual(['GT6', 'Band']);
    expect(devicesFrom({ devices: [] })).toEqual([]);
  });
  it('ignores anything that is not a batch', () => {
    expect(devicesFrom({ address: 'AA:BB' })).toBeNull();
    expect(devicesFrom(null)).toBeNull();
    expect(devicesFrom({ devices: [null, { name: 'no address' }] })).toEqual([]);
  });
});

describe('the watch permission hint (QA-R5a-2, QA-R5b-1, QA-R5b-6)', () => {
  it('names Location on Android 11 and older, Nearby devices on 12+', async () => {
    const { watchPermissionHint } = await import('@/native/watch');
    expect(watchPermissionHint(true)).toContain('Location');
    expect(watchPermissionHint(true)).not.toContain('Nearby devices');
    expect(watchPermissionHint(false)).toContain('Nearby devices');
  });
});
