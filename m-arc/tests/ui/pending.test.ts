import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showAfter } from '@/ui/pending';

describe('showAfter (I19)', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('never shows when the operation resolves before the delay', async () => {
    let resolveOp!: () => void;
    const op = new Promise<void>(r => { resolveOp = r; });
    const seen: boolean[] = [];
    const done = showAfter(op, { delay: 200, min: 400 }, v => seen.push(v));
    await vi.advanceTimersByTimeAsync(150);
    resolveOp();
    await vi.advanceTimersByTimeAsync(0);
    await done;
    expect(seen).toEqual([]);
  });

  it('once shown, stays visible for at least `min` total, even after the operation resolves', async () => {
    let resolveOp!: () => void;
    const op = new Promise<void>(r => { resolveOp = r; });
    const seen: boolean[] = [];
    const done = showAfter(op, { delay: 200, min: 400 }, v => seen.push(v));
    await vi.advanceTimersByTimeAsync(200);
    expect(seen).toEqual([true]);
    await vi.advanceTimersByTimeAsync(50); // op resolves at 250ms total
    resolveOp();
    await vi.advanceTimersByTimeAsync(0);
    expect(seen).toEqual([true]);
    await vi.advanceTimersByTimeAsync(349); // 399ms since shown
    expect(seen).toEqual([true]);
    await vi.advanceTimersByTimeAsync(1); // 400ms since shown
    expect(seen).toEqual([true, false]);
    await done;
  });
});
