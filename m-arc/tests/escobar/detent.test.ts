import { describe, it, expect } from 'vitest';
import { FULL_FRAC, HALF_FRAC, resolveEscobarRelease } from '@/escobar/detent';

const VH = 844;
const hFull = FULL_FRAC * VH;
const hHalf = HALF_FRAC * VH;
const half = hFull - hHalf;

describe('resolveEscobarRelease (I7)', () => {
  it('a released drag close to full, at rest, stays full', () => {
    expect(resolveEscobarRelease(5, 0, VH).name).toBe('full');
  });
  it('a released drag close to half, at rest, settles at half', () => {
    expect(resolveEscobarRelease(half - 5, 0, VH).name).toBe('half');
  });
  it('a slow drag from full toward half, released well short of it, returns to full', () => {
    expect(resolveEscobarRelease(30, 0.05, VH).name).toBe('full');
  });
  it('a strong fling closes even from a short raw drag past half', () => {
    // Short of half's own offset by only 10px, but a strong flick projects it well past closed.
    expect(resolveEscobarRelease(half + 10, 2, VH).name).toBe('closed');
  });
  it('a slow drag most of the way to closed still closes (v=0, distance alone)', () => {
    expect(resolveEscobarRelease(hFull - 20, 0, VH).name).toBe('closed');
  });
  it('a modest, slow drag just past half stays at half — never closes by a small drift alone', () => {
    expect(resolveEscobarRelease(half + 20, 0.05, VH).name).toBe('half');
  });
});
