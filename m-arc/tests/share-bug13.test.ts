/** BUG-13: why the gate's share-fit check failed on a local Monday. The Week card starts on Monday,
 * so a Sunday workout is last week: on Monday the card is empty and Save / Share are disabled on
 * purpose. The gate now pins its clock to the seeded workout's evening; these pin the app side. */
import { describe, it, expect } from 'vitest';
import { session, sets } from './helpers';
import { cardData, isEmptyCard } from '@/slices/share/cardData';

const BENCH = 'lib_barbell_bench_press';
const sunday = session('2026-09-27', [{ id: BENCH, name: 'Barbell Bench Press', sets: sets(60, 5) }]);
const week = (today: string) => cardData({ sessions: [sunday], custom: [], unit: 'kg', today, period: 'week' });

describe('BUG-13: the Week card around a week boundary', () => {
  it('on the workout day itself (the pinned gate clock) the card has sets to share', () => {
    expect(isEmptyCard(week('2026-09-27'))).toBe(false);
  });
  it('on the next Monday the week is empty, so Save / Share are rightly disabled', () => {
    expect(isEmptyCard(week('2026-09-28'))).toBe(true);
  });
});
