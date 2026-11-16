import { describe, it, expect } from 'vitest';
import { addDays, dayKey, daysBetween, weekStart, weekdayOf, formatClock, formatHours } from '@/core/dates';

describe('dates', () => {
  it('formats local day keys', () => {
    expect(dayKey(new Date(2026, 8, 18, 23, 59))).toBe('2026-09-18');
  });
  it('finds Monday as week start', () => {
    expect(weekStart('2026-09-18')).toBe('2026-09-14');
    expect(weekStart('2026-09-14')).toBe('2026-09-14');
    expect(weekStart('2026-09-13')).toBe('2026-09-07');
  });
  it('adds days across month ends', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(daysBetween('2026-08-31', '2026-09-30')).toBe(30);
    expect(weekdayOf('2026-09-18')).toBe('fri');
  });
  it('formats clocks and hours', () => {
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatHours(0.5)).toBe('under 1h');
    expect(formatHours(30)).toBe('1.5d');
    expect(formatHours(96)).toBe('4d');
  });
});
