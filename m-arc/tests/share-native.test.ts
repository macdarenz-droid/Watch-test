/** F12 Save / Share (Capacitor mocked): QA4-11 native cache, QA4-12 web Share gesture, QA4-13 load failure. */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls: string[] = [];
const fs = vi.hoisted(() => ({
  rmdir: vi.fn(), writeFile: vi.fn(), getUri: vi.fn(), checkPermissions: vi.fn(), requestPermissions: vi.fn(),
}));
const share = vi.hoisted(() => ({ share: vi.fn() }));
vi.mock('@capacitor/filesystem', () => ({ Filesystem: fs, Directory: { Cache: 'CACHE', Documents: 'DOCUMENTS' } }));
vi.mock('@capacitor/share', () => ({ Share: share }));
const native = vi.hoisted(() => ({ on: true }));
vi.mock('@/native/capacitor', () => ({ isNative: () => native.on }));

import { saveImage, shareImage } from '@/native/share';
import { pngCache } from '@/slices/share/png';
import { shareLoadFailed } from '@/slices/share/lazy';
import { carouselScroll } from '@/slices/share/ShareSheet';
import { toast } from '@/app/toast';

const png = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' });

beforeEach(() => {
  calls.length = 0;
  fs.rmdir.mockImplementation(async (o: { path: string }) => { calls.push(`rmdir ${o.path}`); throw new Error('Folder does not exist.'); });
  fs.writeFile.mockImplementation(async (o: { path: string; directory: string; data: string }) => { calls.push(`write ${o.directory} ${o.path} ${o.data}`); });
  fs.getUri.mockImplementation(async (o: { path: string }) => ({ uri: `file:///cache/${o.path}` }));
  fs.checkPermissions.mockResolvedValue({ publicStorage: 'granted' });
  share.share.mockImplementation(async () => { calls.push('share'); });
});

describe('QA4-11: shared cards do not pile up in the cache', () => {
  it('Share clears Cache/MARC Share (errors ignored) before writing the new card', async () => {
    const r = await shareImage('card.png', png, 'My card');
    expect(r.outcome).toBe('shared');
    expect(fs.rmdir).toHaveBeenCalledWith({ path: 'MARC Share', directory: 'CACHE', recursive: true });
    expect(calls).toEqual(['rmdir MARC Share', 'write CACHE MARC Share/card.png iVBORw==', 'share']);
  });
  it("Save's share-sheet fallback clears it too; a direct Save leaves the cache alone", async () => {
    await saveImage('a.png', png);
    expect(calls).toEqual(['write DOCUMENTS M-ARC/a.png iVBORw==']);
    calls.length = 0;
    fs.writeFile.mockImplementationOnce(async () => { throw new Error('denied'); });
    await saveImage('b.png', png);
    expect(calls).toEqual(['rmdir MARC Share', 'write CACHE MARC Share/b.png iVBORw==', 'share']);
  });
});

describe('QA4-12: the web Share keeps its tap', () => {
  it('pngCache renders a card once and again only when the card changes; a failed render is retried', async () => {
    const render = vi.fn(async (svg: string) => new Blob([svg]));
    const cache = pngCache(render);
    const a1 = cache.get('<svg a/>', 1, 1), a2 = cache.get('<svg a/>', 1, 1);
    expect(a1).toBe(a2);
    await cache.get('<svg b/>', 1, 1);
    expect(render).toHaveBeenCalledTimes(2);
    const failing = pngCache(vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(new Blob(['ok'])));
    await expect(failing.get('<svg/>', 1, 1)).rejects.toThrow('x');
    await expect(failing.get('<svg/>', 1, 1)).resolves.toBeInstanceOf(Blob);
  });
  it('NotAllowedError keeps the card and asks for another tap instead of downloading', async () => {
    native.on = false;
    const webShare = vi.fn().mockRejectedValueOnce(Object.assign(new Error('no gesture'), { name: 'NotAllowedError' })).mockResolvedValueOnce(undefined);
    vi.stubGlobal('navigator', { share: webShare, canShare: () => true });
    try {
      expect(await shareImage('card.png', png, 'My card')).toEqual({ outcome: 'retry', message: 'Ready, tap Share again' });
      expect(await shareImage('card.png', png, 'My card')).toEqual({ outcome: 'shared', message: '' });
    } finally { vi.unstubAllGlobals(); native.on = true; }
  });
});

describe('QA4-13: a failed load of the share code offers Reload', () => {
  it('closes the sheet and shows a toast whose action reloads the app', () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    try {
      const onClose = vi.fn();
      shareLoadFailed(onClose);
      expect(onClose).toHaveBeenCalledOnce();
      expect(toast.value?.message).toBe('Could not load sharing.');
      expect(toast.value?.action).toBe('Reload');
      toast.value?.onAction?.();
      expect(reload).toHaveBeenCalledOnce();
    } finally { vi.unstubAllGlobals(); }
  });
});

describe('QA4-14: the carousel follows Reduce motion', () => {
  it("scrolls instantly when the person asked for reduced motion, smoothly otherwise", () => {
    const mm = (reduce: boolean) => vi.fn((q: string) => ({ matches: reduce && q === '(prefers-reduced-motion: reduce)' }));
    try {
      vi.stubGlobal('matchMedia', mm(true));
      expect(carouselScroll()).toBe('auto');
      vi.stubGlobal('matchMedia', mm(false));
      expect(carouselScroll()).toBe('smooth');
      vi.stubGlobal('matchMedia', undefined);
      expect(carouselScroll()).toBe('smooth');
    } finally { vi.unstubAllGlobals(); }
  });

  it('QA5-7: also scrolls instantly for the in-app Reduce motion toggle, with no OS setting', () => {
    try {
      vi.stubGlobal('document', { documentElement: { dataset: { motion: 'reduce' } } });
      vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
      expect(carouselScroll()).toBe('auto');
    } finally { vi.unstubAllGlobals(); }
  });
});
