import { describe, it, expect } from 'vitest';
import { readyDayWindow, dayOrToday, formatDay } from '@/core/dates';

const DAY_OPTS = { weekday: 'short', day: 'numeric' } as const;

describe('readyDayWindow (O2 muscle panel)', () => {
  it('same day: lo and hi both land on today', () => {
    const now = new Date(2026, 8, 27, 9, 0, 0).getTime(); // Sun 27 Sep, 9am
    expect(readyDayWindow(now, [2, 8])).toBe('Today'); // 11am .. 5pm, both today
  });

  it('across midnight: lo and hi land on different calendar days', () => {
    const now = new Date(2026, 8, 27, 20, 0, 0).getTime(); // Sun 27 Sep, 8pm
    expect(readyDayWindow(now, [1, 10])).toBe(`Today – ${formatDay('2026-09-28', DAY_OPTS)}`); // 9pm today .. 6am tomorrow
  });

  it('lo today and hi tomorrow', () => {
    const now = new Date(2026, 8, 27, 9, 0, 0).getTime(); // Sun 27 Sep, 9am
    expect(readyDayWindow(now, [2, 30])).toBe(`Today – ${formatDay('2026-09-28', DAY_OPTS)}`); // 11am today .. 3pm tomorrow
  });

  it('null window returns null', () => {
    expect(readyDayWindow(Date.now(), null)).toBeNull();
  });
});

describe('dayOrToday', () => {
  it('reads "Today" for hours landing on the same calendar day', () => {
    const now = new Date(2026, 8, 27, 9, 0, 0).getTime();
    expect(dayOrToday(now, 3)).toBe('Today');
  });

  it('formats a future day otherwise', () => {
    const now = new Date(2026, 8, 27, 9, 0, 0).getTime();
    expect(dayOrToday(now, 30)).toBe(formatDay('2026-09-28', DAY_OPTS));
  });
});
