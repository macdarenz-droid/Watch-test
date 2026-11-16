/** A4: keeps the screen on during a live workout. Native routes through the NativeUi plugin;
 * web falls back to the Screen Wake Lock API. Every path no-ops without throwing. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const native = vi.hoisted(() => ({ on: true }));
vi.mock('@/native/capacitor', () => ({ isNative: () => native.on }));

type NativeUiKeepAwake = (o: { on: boolean }) => Promise<void>;
function setNativeUi(fn?: NativeUiKeepAwake): void {
  (globalThis as { Capacitor?: { Plugins?: { NativeUi?: { keepAwake: NativeUiKeepAwake } } } }).Capacitor =
    fn ? { Plugins: { NativeUi: { keepAwake: fn } } } : undefined;
}

beforeEach(() => {
  vi.resetModules();
  native.on = true;
  setNativeUi(undefined);
  try { localStorage.clear(); } catch { /* jsdom-less node env: no localStorage */ }
});
afterEach(() => {
  (globalThis as { Capacitor?: unknown }).Capacitor = undefined;
});

describe('keepAwake on native', () => {
  it('on(true) calls NativeUi.keepAwake({on:true}), on(false) calls it with {on:false}', async () => {
    const fn = vi.fn<NativeUiKeepAwake>(async () => {});
    setNativeUi(fn);
    const { keepAwake } = await import('@/native/keepAwake');
    await keepAwake(true);
    expect(fn).toHaveBeenCalledWith({ on: true });
    await keepAwake(false);
    expect(fn).toHaveBeenCalledWith({ on: false });
  });

  it('a missing or throwing plugin does not throw', async () => {
    const { keepAwake } = await import('@/native/keepAwake');
    await expect(keepAwake(true)).resolves.toBeUndefined();
    const throwing = vi.fn<NativeUiKeepAwake>(async () => { throw new Error('no such plugin method'); });
    setNativeUi(throwing);
    await expect(keepAwake(true)).resolves.toBeUndefined();
  });
});

describe('keepAwake on web', () => {
  it('does not throw when navigator.wakeLock is unavailable', async () => {
    native.on = false;
    const { keepAwake } = await import('@/native/keepAwake');
    await expect(keepAwake(true)).resolves.toBeUndefined();
    await expect(keepAwake(false)).resolves.toBeUndefined();
  });
});

describe('keepAwakePref', () => {
  it('defaults to true (no stored preference), and setKeepAwakePref updates it without throwing', async () => {
    const { keepAwakePref, setKeepAwakePref } = await import('@/native/keepAwake');
    expect(keepAwakePref.value).toBe(true);
    expect(() => setKeepAwakePref(false)).not.toThrow();
    expect(keepAwakePref.value).toBe(false);
    setKeepAwakePref(true);
    expect(keepAwakePref.value).toBe(true);
  });
});
