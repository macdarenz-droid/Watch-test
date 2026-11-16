import { describe, expect, it } from 'vitest';
import { volumeBands, muscleVolumeStatus } from '@/brain/volume';
import { session, sets } from './helpers';

describe('volumeBands (F3.2)', () => {
  it('gives the New-level band with no offset', () => {
    expect(volumeBands(0, 'chest')).toEqual([4, 8]);
  });
  it('shifts the band up for side delts', () => {
    expect(volumeBands(0, 'side_delts')).toEqual([6, 10]);
  });
  it('shifts the band down for lower back', () => {
    expect(volumeBands(0, 'lower_back')).toEqual([2, 6]);
  });
  it('reuses the Advanced band past levelIndex 4', () => {
    expect(volumeBands(6, 'chest')).toEqual(volumeBands(4, 'chest'));
  });
});

describe('muscleVolumeStatus (F3.2)', () => {
  const today = '2026-09-18';
  it('is unknown for a muscle with no history at all', () => {
    const rows = muscleVolumeStatus([], today);
    expect(rows.find(r => r.muscle === 'chest')!.status).toBe('unknown');
  });
  // QA-R3a-5: a new lifter's first week has no full weeks behind it, so it is never 'under'.
  it('a new lifter\'s first week is not judged under', () => {
    const s = [session(today, [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'ideal', 2) }])];
    const row = muscleVolumeStatus(s, today).find(r => r.muscle === 'chest')!;
    expect(row.status).toBe('in');
    expect(row.thisWeekSets).toBe(2);
  });
  it('is over band with many sets this week for a new lifter', () => {
    const s = [session(today, [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'ideal', 12) }])];
    const row = muscleVolumeStatus(s, today).find(r => r.muscle === 'chest')!;
    expect(row.status).toBe('over');
  });
});

describe('muscleVolumeStatus judges completed weeks (BR-07)', () => {
  const bench = 'lib_barbell_bench_press';
  it('a Monday with nothing logged yet is not "under"', () => {
    const last = ['2026-09-08', '2026-09-10', '2026-09-01', '2026-09-03'].map(d => session(d, [{ id: bench, sets: sets(60, 8, 'ideal', 3) }]));
    const chest = muscleVolumeStatus(last, '2026-09-14').find(r => r.muscle === 'chest')!;
    expect(chest.thisWeekSets).toBe(0);
    expect(chest.lastWeekSets).toBe(6);
    expect(chest.status).toBe('in');
  });
  it('"under" needs two completed weeks below the band', () => {
    const one = [session('2026-09-08', [{ id: bench, sets: sets(60, 8, 'ideal', 2) }]), session('2026-09-01', [{ id: bench, sets: sets(60, 8, 'ideal', 6) }])];
    expect(muscleVolumeStatus(one, '2026-09-14').find(r => r.muscle === 'chest')!.status).toBe('in');
    // Two full weeks (3 sessions each, QA-R3a-1) with chest below the band.
    const legs = (day: string) => session(day, [{ id: 'lib_barbell_back_squat', sets: sets(100, 5, 'ideal', 3) }]);
    const two = [session('2026-09-08', [{ id: bench, sets: sets(60, 8, 'ideal', 2) }]), legs('2026-09-10'), legs('2026-09-12'), session('2026-09-01', [{ id: bench, sets: sets(60, 8, 'ideal', 2) }]), legs('2026-09-03'), legs('2026-09-05')];
    expect(muscleVolumeStatus(two, '2026-09-14').find(r => r.muscle === 'chest')!.status).toBe('under');
    // The same sets over part weeks (one session each) are not enough to say 'under'.
    const part = [session('2026-09-08', [{ id: bench, sets: sets(60, 8, 'ideal', 2) }]), session('2026-09-01', [{ id: bench, sets: sets(60, 8, 'ideal', 2) }])];
    expect(muscleVolumeStatus(part, '2026-09-14').find(r => r.muscle === 'chest')!.status).toBe('in');
  });
  it('the first week back after weeks off is not judged under (QA-R3a-1)', () => {
    const s = [session('2026-08-03', [{ id: bench, sets: sets(60, 8, 'ideal', 10) }]), session('2026-09-15', [{ id: bench, sets: sets(60, 8, 'ideal', 2) }]), session('2026-09-17', [{ id: bench, sets: sets(60, 8, 'ideal', 2) }])];
    expect(muscleVolumeStatus(s, '2026-09-18').find(r => r.muscle === 'chest')!.status).toBe('in');
  });
  it('nothing in four weeks is unknown', () => {
    expect(muscleVolumeStatus([], '2026-09-14').find(r => r.muscle === 'chest')!.status).toBe('unknown');
  });
});

describe('effectiveSetsByMuscle (BR-16)', () => {
  it('direct 1, secondary 0.5, stabiliser 0; easy optional', async () => {
    const { effectiveSetsByMuscle } = await import('@/brain/exposure');
    const s = [session('2026-09-15', [{ id: 'lib_barbell_bench_press', sets: [...sets(60, 8, 'easy', 2), ...sets(60, 8, 'ideal', 2)] }])];
    const all = effectiveSetsByMuscle(s, '2026-09-14', '2026-09-21');
    const hard = effectiveSetsByMuscle(s, '2026-09-14', '2026-09-21', [], { countEasy: false });
    expect(all.chest).toBe(4);
    expect(hard.chest).toBe(2);
    expect(all.triceps).toBe(2);
  });
});
