import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { track } from '@/ui/gesture';

/** track() needs a DOM element (addEventListener/setPointerCapture) and a couple of browser
 * globals (document, requestAnimationFrame) that don't exist in vitest's node environment
 * (project convention: no jsdom). A minimal fake of just what track() touches, stubbed for the
 * duration of each test, is enough to drive it with plain event-like objects. */
function fakeElement() {
  const listeners: Record<string, ((e: unknown) => void)[]> = {};
  return {
    addEventListener: (t: string, fn: (e: unknown) => void) => { (listeners[t] ??= []).push(fn); },
    removeEventListener: (t: string, fn: (e: unknown) => void) => { listeners[t] = (listeners[t] ?? []).filter(f => f !== fn); },
    setPointerCapture: () => { /* no-op */ },
    dispatch(type: string, ev: unknown) { for (const fn of [...(listeners[type] ?? [])]) fn(ev); },
  };
}

beforeEach(() => {
  vi.stubGlobal('document', { addEventListener: () => {}, removeEventListener: () => {}, hidden: false });
  vi.stubGlobal('window', { innerWidth: 400 });
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { fn(); return 0; });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});
afterEach(() => vi.unstubAllGlobals());

describe('track() wrong-axis abort (QA11-2)', () => {
  it('a horizontal move locks the x-tracker but never calls onCancel on a y-tracker sharing the element', () => {
    const el = fakeElement();
    const xCalls: string[] = [];
    const yCalls: string[] = [];
    track(el as unknown as HTMLElement, { axis: 'x', capture: 'afterSlop', onMove: () => xCalls.push('move'), onEnd: () => xCalls.push('end'), onCancel: () => xCalls.push('cancel') });
    track(el as unknown as HTMLElement, { axis: 'y', capture: 'afterSlop', onMove: () => yCalls.push('move'), onEnd: () => yCalls.push('end'), onCancel: () => yCalls.push('cancel') });

    // Start well away from EDGE_IGNORE_PX (32px) so the x-tracker's own edge guard doesn't block it.
    el.dispatch('pointerdown', { isPrimary: true, pointerId: 1, clientX: 100, clientY: 100 });
    // 12px horizontal, 1px vertical: well past slop, clearly dominant on x.
    el.dispatch('pointermove', { isPrimary: true, pointerId: 1, clientX: 112, clientY: 101 });
    el.dispatch('pointerup', { isPrimary: true, pointerId: 1, clientX: 112, clientY: 101 });

    expect(xCalls).toContain('move');
    expect(xCalls).toContain('end');
    expect(yCalls).not.toContain('cancel');
    expect(yCalls).not.toContain('move');
    expect(yCalls).not.toContain('end');
  });
});
