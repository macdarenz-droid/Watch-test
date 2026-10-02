import { describe, it, expect } from 'vitest';
import { liftTrend, plateauStatus, trend } from '@/brain/trend';
import { exerciseHistory } from '@/brain/history';
import { session } from './helpers';

const assisted = 'lib_assisted_pull_up';
const days = ['2026-08-01', '2026-08-04', '2026-08-08', '2026-08-11', '2026-08-15', '2026-08-18', '2026-08-22', '2026-08-25'];
const hist = (kg: (i: number) => number, reps: (i: number) => number) =>
  exerciseHistory(days.map((d, i) => session(d, [{ id: assisted, sets: [{ kg: kg(i), reps: reps(i), effort: 'ideal' }] }])), assisted);

describe('plateauStatus for assisted work (BR-06)', () => {
  it('less assistance is progress, more is decline', () => {
    expect(plateauStatus(hist(i => 40 - i * 2.5, () => 8), 'assisted').status).toBe('progressing');
    expect(plateauStatus(hist(i => 20 + i * 2.5, () => 8), 'assisted').status).toBe('declining');
  });
  it('with the assistance flat, more reps is progress', () => {
    expect(plateauStatus(hist(() => 30, i => 5 + i), 'assisted').status).toBe('progressing');
    // BUG-14 (VOLUME-F1, BR-04): these 8 sessions span 24 days, under the 42-day minimum, so no plateau yet.
    expect(plateauStatus(hist(() => 30, () => 8), 'assisted').status).toBe('unknown');
  });
  it('weighted work is unchanged: more load is progress', () => {
    expect(plateauStatus(hist(i => 40 + i * 2.5, () => 8)).status).toBe('progressing');
  });
});

describe('liftTrend for assisted work (QA2-FC-4)', () => {
  it('more reps at the same assistance is up, as plateauStatus says', () => {
    const reps = [3, 3, 4, 4, 5, 5, 6, 6];
    const h = hist(() => 20, i => reps[i]!);
    expect(plateauStatus(h, 'assisted').status).toBe('progressing');
    expect(liftTrend(h, 'assisted').direction).toBe('up');
    expect(liftTrend(hist(() => 20, i => 8 - Math.floor(i / 2)), 'assisted').direction).toBe('down');
  });
  it('less assistance is up and more is down, whatever the reps do', () => {
    expect(liftTrend(hist(i => 40 - i * 2.5, () => 8), 'assisted').direction).toBe('up');
    expect(liftTrend(hist(i => 40 - i * 2.5, i => 8 - Math.floor(i / 3)), 'assisted').direction).toBe('up');
    const more = liftTrend(hist(i => 20 + i * 2.5, () => 8), 'assisted');
    expect(more.direction).toBe('down');
    expect(more.slopePerWeek).toBeLessThan(0);
  });
  it('same assistance and same reps is flat', () => {
    expect(liftTrend(hist(() => 30, () => 8), 'assisted').direction).toBe('flat');
  });
});

describe('trend', () => {
  it('needs four points and reports relative weekly slope', () => {
    expect(trend([{ day: '2026-08-01', value: 100 }]).direction).toBe('unknown');
    const t = trend([0, 7, 14, 21].map(d => ({ day: `2026-08-${String(1 + d).padStart(2, '0')}`, value: 100 + d / 7 * 2 })));
    expect(t.direction).toBe('up');
    expect(t.slopePerWeek).toBeGreaterThan(0.01);
  });
});
