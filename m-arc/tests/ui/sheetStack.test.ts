import { describe, it, expect, beforeEach } from 'vitest';
import { closeTopSheet, markClosing, registerSheet, sheetStack, unregisterSheet } from '@/ui/sheetStack';

beforeEach(() => {
  sheetStack.value = [];
});

describe('closeTopSheet() skips a sheet already closing (QA11-7)', () => {
  it('reaches the sheet below one that is mid-exit instead of re-triggering it', () => {
    const closedA: string[] = [];
    const closedB: string[] = [];
    registerSheet('a', () => closedA.push('close'), () => closedA.push('requestClose'));
    registerSheet('b', () => closedB.push('close'), () => closedB.push('requestClose'));
    markClosing('b');

    const closed = closeTopSheet();

    expect(closed).toBe(true);
    expect(closedA).toEqual(['requestClose']);
    expect(closedB).toEqual([]);

    unregisterSheet('a');
    unregisterSheet('b');
  });
});
