import { describe, it, expect } from 'vitest';
import { nextHideState, SCROLL_SLOP, END_SLACK, type HideState } from '@/ui/hideOnScroll';

// BUG-22: the Escobar dock hides while the page scrolls down and comes back on scroll-up,
// at the top and at the end of the page.
const view = 844;
const max = 2000;
const run = (ys: number[], start: HideState = { hidden: false, anchor: 0 }, m = max) =>
  ys.reduce((st, y) => nextHideState(st, { y, max: m, view }), start);

describe('nextHideState (BUG-22)', () => {
  it('hides after scrolling down past the slop', () => {
    expect(run([4, SCROLL_SLOP - 1]).hidden).toBe(false);
    expect(run([4, 20, 60]).hidden).toBe(true);
  });
  it('shows again after scrolling up past the slop from the lowest point', () => {
    const down = run([100, 400, 600]);
    expect(down.hidden).toBe(true);
    expect(run([600 - SCROLL_SLOP + 1], down).hidden).toBe(true);
    expect(run([590], down).hidden).toBe(false);
  });
  it('measures the turn from where the direction changed, not from the first sample', () => {
    const up = run([100, 400, 600, 300]);
    expect(up.hidden).toBe(false);
    expect(run([300 + SCROLL_SLOP], up).hidden).toBe(true);
  });
  it('shows at the end of the page even while scrolling down', () => {
    expect(run([100, 400, max - END_SLACK]).hidden).toBe(false);
    expect(run([100, 400, max]).hidden).toBe(false);
  });
  it('shows at the top and when the page does not scroll', () => {
    expect(run([0], { hidden: true, anchor: 300 }).hidden).toBe(false);
    expect(run([-30], { hidden: true, anchor: 300 }).hidden).toBe(false);
    expect(run([50], { hidden: true, anchor: 0 }, 0).hidden).toBe(false);
  });
  it('treats a jump longer than the viewport (tab restore, scrollTo) as no gesture', () => {
    expect(run([1200]).hidden).toBe(false);
    expect(run([100], { hidden: true, anchor: 1200 }).hidden).toBe(true);
  });
  it('ignores jitter below the slop in either direction', () => {
    const shown = run([104, 101, 106, 103], { hidden: false, anchor: 100 });
    expect(shown.hidden).toBe(false);
    const hid = run([496, 499, 494, 497], { hidden: true, anchor: 500 });
    expect(hid.hidden).toBe(true);
  });
});
