// The zoom host (HT-6; plan 2.4 "Zooms", GA 2.2-2.3): the close-ups (S2 hand, S3 posture) open in the plate box's
// place. A line-for-line port of golden B's close-up script (tools/plates/layers/artifact/build-page.mjs, `JS`:
// show / openZoom / closeZoom / the pager), over HT-3's zoom slot API. Differences, each forced by the app:
// - the plate is reached only through the API: open = snapshot() + clearMistake() + setPlateHidden(true); close =
//   setPlateHidden(false) + restore(snapshot) (golden: prevMode + setMode);
// - golden's show() also hides the cue line; the frozen API has no call for it, so the host sets its `hidden`;
// - Trace and Mistake close an open close-up at once (golden calls closeZoom(true) first). HT-3's own handlers run
//   first (they sit on the buttons; this one listens on the block), so the host closes without undoing their result
//   and puts back the callout golden never cleared;
// - a close-up's markup (and its CSS, split off with it) loads on its first open (plan 2.5), so the first open waits for them;
// - durations are read with their unit (the minified app CSS writes seconds, golden B ms);
// - Android back closes the close-up before the sheet (`registerSheet('howto-zoom')`), and Escape does too;
// - clicks are delegated on the sheet panel for this card's controls; other sections ask through events.ts
//   (`ht:zoom-open`), and the close-ups' "This is usually why" and the feel chip tell Feel the same way.
import { useLayoutEffect } from 'preact/hooks';
import { registerSheet, unregisterSheet } from '@/ui/sheetStack';
import type { PlateApi, PlateSnapshot } from '../usePlateState';
import { usePlateApi } from '../PlateView';
import { emit, listen } from '../events';
import { ZOOM_KINDS, type ZoomKind } from './registry';

export const ZOOM_SHEET_ID = 'howto-zoom';

export interface ZoomHost {
  /** Opens close-up `key` (a second call with the open key closes it); `from` is the control that asked. */
  open(key: string, from?: HTMLElement | null): Promise<void>;
  close(instant?: boolean): void;
  readonly openKey: string | null;
  destroy(): void;
}

export interface ZoomSetup {
  /** The gallery chrome id (`lateral-raise`): the panel ids and the chunk key. */
  readonly chromeId: string;
  /** The kind of close-up `key`, or null when it has none. */
  readonly kindOf: (key: string) => ZoomKind | null;
}

const reduced = () => document.documentElement.getAttribute('data-motion') === 'reduce';
const rootCs = () => getComputedStyle(document.documentElement);
// golden B's tok() reads "240ms"; the app's built CSS is minified to ".24s" (www/assets/index-*.css), so the unit counts
/** A CSS time in ms: "240ms" -> 240, ".24s" / "0.24s" -> 240; NaN when it is not a time. */
export const durMs = (s: string) => { const m = s.trim().match(/^(-?\d*\.?\d+)(ms|s)?$/); return m ? +m[1]! * (m[2] === 's' ? 1000 : 1) : NaN; };
const tok = (name: string, dflt: number) => { const v = durMs(rootCs().getPropertyValue(name)); return isFinite(v) ? v : dflt; };
const ease = (name: string) => rootCs().getPropertyValue(name).trim() || 'ease';

/** Binds the host to one sheet: `api` is the golden block's zoom slot API. */
export function createZoomHost(api: PlateApi, setup: ZoomSetup): ZoomHost {
  const { slot } = api, ex = setup.chromeId;
  const card = slot.closest<HTMLElement>('.ht-golden')!;
  const root = slot.closest<HTMLElement>('.sheet-panel') ?? card.parentElement!;
  const dialog = slot.closest('dialog');
  const fitEl = card.querySelector<HTMLElement>('.ht-plate-fit')!, cue = card.querySelector<HTMLElement>('.cue-line')!;
  const btnTrace = card.querySelector<HTMLElement>(`#${ex}-trace`), btnMis = card.querySelector<HTMLElement>(`#${ex}-mistake`);
  const off: (() => void)[] = [];
  const on = <K extends keyof HTMLElementEventMap>(el: EventTarget, type: K, fn: (e: HTMLElementEventMap[K]) => void, capture = false) => {
    el.addEventListener(type, fn as EventListener, capture); off.push(() => el.removeEventListener(type, fn as EventListener, capture));
  };

  let openKey: string | null = null, opener: HTMLElement | null = null, snap: PlateSnapshot | null = null, anim: Animation | null = null;
  let registered = false, ticket = 0;
  const panels = () => [...slot.querySelectorAll<HTMLElement>(':scope > .zx')];
  const panelOf = (k: string) => panels().find(p => p.dataset.zoom === k);
  const chips = () => [...root.querySelectorAll<HTMLElement>('.zx-chip[data-zoom]')];
  const show = (k: string | null) => {
    panels().forEach(p => { p.hidden = p.dataset.zoom !== k; });
    api.setPlateHidden(!!k); cue.hidden = !!k;
    chips().forEach(c => c.setAttribute('aria-pressed', String(c.dataset.zoom === k)));
  };
  const setRegistered = (r: boolean) => {
    if (r === registered) return;
    registered = r;
    if (r) registerSheet(ZOOM_SHEET_ID, () => close(true), () => close(false));
    else unregisterSheet(ZOOM_SHEET_ID);
  };
  /** The panel for `k`, inserted from its chunk on first open; null when it has none. */
  async function load(k: string): Promise<HTMLElement | null> {
    const have = panelOf(k);
    if (have) return have;
    const kind = setup.kindOf(k), loader = kind ? ZOOM_KINDS[kind] : undefined;
    if (!loader) return null;
    const chunk = await loader(ex, k);
    if (panelOf(k)) return panelOf(k)!;
    // The HTML is our own generated golden-B content (src/howto/generated, hash-locked), never user input.
    slot.insertAdjacentHTML('beforeend', chunk.panel);
    const p = panelOf(k)!;
    p.hidden = true;
    return p;
  }

  // Golden setMode(): the Mistake view's "Also check your wrist" line shows only while Mistake is on.
  const also = root.querySelector<HTMLElement>('.ht-also');
  const syncAlso = () => { if (also && btnMis) also.hidden = btnMis.getAttribute('aria-pressed') !== 'true'; };

  /**
   * HT-7 (D-HT7-L3-text-9, F1): while the zoom-in runs, a close-up's SVG text is laid out with
   * `text-rendering: geometricPrecision`; on finish or cancel that is removed and the layout flushed, so the text's
   * font at rest is first made at the final scale. Without it, Chromium could keep a font made mid-zoom for the whole
   * tab (the squat's "Bony bump" read 0.16 % narrower in about 1 open in 7).
   */
  function textAtRest(panel: HTMLElement, a: Animation) {
    const texts = panel.querySelectorAll<SVGElement>('svg text');
    texts.forEach(t => { t.style.textRendering = 'geometricPrecision'; });
    const rest = () => { texts.forEach(t => { t.style.textRendering = ''; }); void panel.getBoundingClientRect(); };
    a.finished.then(rest, rest);
  }

  async function open(k: string, from?: HTMLElement | null) {
    if (openKey === k) { close(false); return; }            // a second tap closes it
    const t = ++ticket;
    const panel = await load(k);
    if (!panel || t !== ticket) return;
    const swap = openKey !== null;
    if (anim) { anim.cancel(); anim = null; }
    // golden openZoom leaves Mistake first (setMode('normal')), so the wrist line is gone before the chip is measured
    if (!swap) { snap = api.snapshot(); api.clearMistake(); syncAlso(); }
    opener = from || null; openKey = k;
    setRegistered(true);
    show(k);
    panel.querySelectorAll<HTMLElement>('.zx-page').forEach((pg, i) => { pg.hidden = i !== 0; });
    // an opener outside the plate and the chip row ("Show me" further down) brings the close-up into view and it
    // grows from its own top; otherwise it grows out of the tapped callout or chip (2.3)
    const far = !!(from && !fitEl.contains(from) && !slot.contains(from) && !from.closest('.zx-chips'));
    const h = panel.querySelector<HTMLElement>('.zx-h')!;
    h.focus({ preventScroll: true });
    const r = h.getBoundingClientRect();
    if (far || r.top < 8 || r.top > innerHeight * 0.55) panel.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
    if (!reduced()) {
      if (swap) anim = panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: tok('--dur-fast', 150), easing: ease('--ease-standard') });
      else {
        const pr = panel.getBoundingClientRect(), fr = (from || panel).getBoundingClientRect();
        panel.style.transformOrigin = far ? '50% 0' : (fr.left + fr.width / 2 - pr.left).toFixed(0) + 'px ' + (fr.top + fr.height / 2 - pr.top).toFixed(0) + 'px';
        anim = panel.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: tok('--dur-enter', 240), easing: ease('--ease-enter') });
        textAtRest(panel, anim);
      }
      anim.onfinish = () => { anim = null; };
    }
  }

  /** `keep`: the plate state was just set by Trace or Mistake; keep it and put back only the callout. */
  function close(instant = false, keep = false) {
    ticket++;
    if (openKey === null) return;
    const panel = panelOf(openKey)!, back = opener, s = snap;
    if (anim) { anim.cancel(); anim = null; }
    const done = () => {
      anim = null; openKey = null; opener = null; snap = null;
      show(null);
      setRegistered(false);
      if (s) api.restore(keep ? { ...api.snapshot(), callout: s.callout } : s);
      if (!instant && back && document.contains(back)) back.focus();
    };
    if (instant || reduced()) { done(); return; }
    anim = panel.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: tok('--dur-exit', 160), easing: ease('--ease-exit') });
    anim.onfinish = done;
  }

  // Trace and Mistake: after HT-3's handlers (bubble on the block), close at once and keep what they set.
  on(card, 'click', e => {
    const b = (e.target as Element).closest('button');
    if (openKey !== null && b && (b === btnTrace || b === btnMis)) close(true, true);
  });
  // The controls golden B binds, delegated on the sheet panel.
  on(root, 'click', e => {
    const t = e.target as Element;
    const feel = t.closest<HTMLElement>('.zx-chip[data-feel]');
    if (feel) { emit(feel, 'ht:feel-chip', {}); return; }
    const chip = t.closest<HTMLElement>('.zx-chip[data-zoom], .ht-also-btn');
    if (chip) { void open(chip.dataset.zoom!, chip); return; }
    const hm = t.closest<HTMLElement>('.hm-show');   // this card's "Show me" (the handling mistakes); others emit their own
    if (hm) { emit(hm, 'ht:zoom-open', { key: hm.dataset.zoom!, opener: hm }); return; }
    const p = t.closest<HTMLElement>('.zx');
    if (!p || !slot.contains(p)) return;
    if (t.closest('.zx-close')) { close(false); return; }
    const pb = t.closest<HTMLElement>('.pager-btn');
    if (pb) {
      const i = +pb.dataset.page!;
      p.querySelectorAll<HTMLElement>('.zx-page').forEach((pg, j) => { pg.hidden = j !== i; });
      const nb = p.querySelector<HTMLElement>('.zx-page[data-page="' + i + '"] .pager-btn[data-page="' + i + '"]');
      if (nb) nb.focus({ preventScroll: true });
      return;
    }
    const fr = t.closest<HTMLElement>('[data-feelrow]');
    if (fr) emit(fr, 'ht:feel-row', { row: fr.dataset.feelrow! });
  });
  // "Show me" from any section (events.ts): golden B opens the close-up, or brings the open one into view.
  off.push(listen(dialog ?? root, 'ht:zoom-open', ({ key: k, opener: from }) => {
    if (openKey !== k) void open(k, from);
    else { const p = panelOf(k)!; p.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); p.querySelector<HTMLElement>('.zx-h')!.focus({ preventScroll: true }); }
  }));
  if (also && btnMis && typeof MutationObserver !== 'undefined') {
    const mo = new MutationObserver(syncAlso);
    mo.observe(btnMis, { attributes: true, attributeFilter: ['aria-pressed'] });
    off.push(() => mo.disconnect());
    syncAlso();
  }
  // Golden B: Escape closes the open close-up. In the app it would cancel the dialog, so it is taken first.
  if (dialog) on(dialog, 'keydown', e => { if (e.key === 'Escape' && openKey !== null) { e.preventDefault(); e.stopPropagation(); close(false); } }, true);

  return {
    open, close: (instant = false) => close(instant),
    get openKey() { return openKey; },
    destroy() { ticket++; if (anim) anim.cancel(); setRegistered(false); off.forEach(f => f()); },
  };
}

const hosts = new WeakMap<PlateApi, ZoomHost>();
/** The sheet's zoom host (null until the golden block and the Look closer section are bound). */
export const zoomHostOf = (api: PlateApi | null) => (api ? hosts.get(api) ?? null : null);
export const useZoomHost = () => zoomHostOf(usePlateApi());

/** Binds one zoom host per sheet while mounted (rendered by the Look closer section). */
export function ZoomHostBinding({ setup }: { setup: ZoomSetup }) {
  const api = usePlateApi();
  useLayoutEffect(() => {
    if (!api) return;
    const h = createZoomHost(api, setup);
    hosts.set(api, h);
    return () => { h.destroy(); hosts.delete(api); };
  }, [api]);
  return null;
}
