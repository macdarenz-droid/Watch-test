// The plate state (HT-3): a line-for-line port of the approved gallery's page script
// (tools/plates/vendor/artifact/build-page.mjs, `JS`, the per-card part) plus the zoom slot API that HT-6 and HT-7
// call. It works on the golden markup PlateView inserts once; Preact never re-renders that markup.
// Differences from the gallery script, each forced by the app and nothing else:
// - the 2 mapped wrapper classes (`.plate` -> `.ht-plate`, `.plate-fit` -> `.ht-plate-fit`, plan 2.6);
// - the mistake figure is inserted on the first Mistake tap (plan 2.5), so its `--gd` and fit run then;
// - `destroy()` removes the listeners when the sheet closes.
import { useLayoutEffect, useState } from 'preact/hooks';
import type { RefObject } from 'preact';

export type PlateMode = 'normal' | 'mistake';

/** What `snapshot()` saves and `restore()` puts back: the mode, the selected callout and the selected tell. */
export interface PlateSnapshot {
  readonly mode: PlateMode;
  readonly callout: string;
  readonly tell: string;
}

/**
 * The zoom slot API (card HT3-A6), fixed by the HT-3 design note.
 * - `setPlateHidden(true)` ends a running Trace, sets `hidden` and `inert` on the plate box (`.ht-plate-fit`) and
 *   shows `slot` in its place; `setPlateHidden(false)` does the reverse. The figures stay mounted.
 * - `clearMistake()` leaves the plate in normal mode with the default (first) callout selected.
 * - `snapshot()` / `restore(s)` save and put back the mode, callout and tell.
 * - `slot` is the empty `div.ht-zoom-slot` right after the plate box, hidden while the plate shows.
 */
export interface PlateApi {
  setPlateHidden(hidden: boolean): void;
  clearMistake(): void;
  snapshot(): PlateSnapshot;
  restore(s: PlateSnapshot): void;
  readonly slot: HTMLElement;
}

export interface PlateController extends PlateApi {
  destroy(): void;
}

/** The gallery's X icon (build-page `I.x(18)`), byte for byte; plate-state.test checks it against the fixture. */
export const X_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.00" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

export interface PlateSetup {
  /** The gallery chrome id (`lateral-raise`), the prefix of `-trace` and `-mistake`. */
  readonly chromeId: string;
  /** The default callout and tell (the gallery's `data-sel-n` / `data-sel-m`). */
  readonly selN: string;
  readonly selM: string;
  /** Inserts the mistake figure after the normal one and returns it (first Mistake tap only). */
  readonly mountMistake: () => HTMLElement;
}

/** Binds the gallery script to one golden block (`card` = the `.ht-golden` element). */
export function createPlateController(card: HTMLElement, setup: PlateSetup): PlateController {
  const ex = setup.chromeId;
  const off: (() => void)[] = [];
  const on = (el: EventTarget, type: string, fn: () => void) => { el.addEventListener(type, fn); off.push(() => el.removeEventListener(type, fn)); };

  // ---- plate zoom: drawn at 358 px, scaled to the card ----
  const fit = (el: HTMLElement) => { const w = el.clientWidth; if (!w) return; const k = Math.min(1, w / 358); el.querySelectorAll<HTMLElement>('.ht-plate').forEach(p => { p.style.zoom = String(k); }); };
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(es => es.forEach(e => fit(e.target as HTMLElement))) : null;

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const fitEl = card.querySelector<HTMLElement>('.ht-plate-fit')!;
  if (ro) ro.observe(fitEl); fit(fitEl);
  const figN = card.querySelector<HTMLElement>('.ht-plate[data-mode="normal"]')!;
  let figM = card.querySelector<HTMLElement>('.ht-plate[data-mode="mistake"]');
  const cue = card.querySelector<HTMLElement>('.cue-line')!, tells = card.querySelector<HTMLElement>('.tells');
  const btnTrace = card.querySelector<HTMLElement>(`#${ex}-trace`)!, btnMis = card.querySelector<HTMLElement>(`#${ex}-mistake`);
  const slot = card.querySelector<HTMLElement>('.ht-zoom-slot')!;
  // ghosts appear when the traced path reaches them (engine: data-t; reference plate: data-th over 10..88 deg)
  const ghosts = (root: HTMLElement) => root.querySelectorAll<HTMLElement>('.ghost').forEach(g => {
    const t = g.dataset.t != null ? +g.dataset.t : g.dataset.th != null ? (+g.dataset.th - 10) / 78 : null;
    if (t != null && isFinite(t)) g.style.setProperty('--gd', (t * 2.4).toFixed(2) + 's');
  });
  ghosts(card);
  let mode: PlateMode = 'normal';
  const sel: Record<PlateMode, string> = { normal: setup.selN, mistake: setup.selM };
  const select = (fig: HTMLElement, key: string) => {
    const btns = [...fig.querySelectorAll<HTMLElement>('.plate-callout')];
    let text = '';
    btns.forEach(b => { const on = b.dataset.key === key; b.setAttribute('aria-pressed', String(on)); if (on) text = b.dataset.cue!; });
    if (fig === figN) {
      const svg = fig.querySelector('svg')!;
      const leaders = [...svg.querySelectorAll(':scope > path.leader:not(.m)')], anchors = [...svg.querySelectorAll(':scope > circle.anchor')];
      if (leaders.length === btns.length && anchors.length === btns.length) btns.forEach((b, i) => {
        const on = b.dataset.key === key;
        leaders[i]!.classList.toggle('on', on); anchors[i]!.classList.toggle('on', on); anchors[i]!.setAttribute('r', on ? '2.5' : '1.5');
      });
      svg.querySelectorAll<SVGElement>('[data-guide]').forEach(g => { g.style.display = g.dataset.guide === key ? '' : 'none'; });
      cue.className = 'cue-line';
      cue.textContent = text;
    } else {
      cue.className = 'cue-line tell';
      cue.innerHTML = X_ICON + '<span><span class="sr-only">Mistake: </span>' + esc(text) + '</span>';
    }
    sel[fig === figN ? 'normal' : 'mistake'] = key;
  };
  const bindCallouts = (fig: HTMLElement) => fig.querySelectorAll<HTMLElement>('.plate-callout').forEach(b => on(b, 'click', () => select(fig, b.dataset.key!)));
  const mistakeFig = () => {
    if (!figM) { figM = setup.mountMistake(); ghosts(figM); bindCallouts(figM); fit(fitEl); }
    return figM;
  };
  const setMode = (m: PlateMode) => {
    mode = m;
    figN.hidden = m !== 'normal';
    if (m === 'mistake' || figM) mistakeFig().hidden = m !== 'mistake';
    if (tells) tells.hidden = m !== 'mistake';
    if (btnMis) btnMis.setAttribute('aria-pressed', String(m === 'mistake'));
    select(m === 'normal' ? figN : mistakeFig(), sel[m]);
    fit(fitEl);
  };
  [figN, figM].filter((f): f is HTMLElement => !!f).forEach(bindCallouts);
  if (btnMis) on(btnMis, 'click', () => setMode(mode === 'mistake' ? 'normal' : 'mistake'));
  const tracePath = figN.querySelector('.trace');
  const endTrace = () => { figN.classList.remove('tracing'); btnTrace.setAttribute('aria-pressed', 'false'); };
  if (tracePath) on(tracePath, 'animationend', endTrace);
  on(btnTrace, 'click', () => {
    if (mode !== 'normal') setMode('normal');
    figN.classList.remove('tracing');
    void figN.getBoundingClientRect();
    if (document.documentElement.getAttribute('data-motion') === 'reduce' || !tracePath) { endTrace(); return; }   // reduced motion: the end state is already shown
    figN.classList.add('tracing');
    btnTrace.setAttribute('aria-pressed', 'true');
  });
  select(figN, sel.normal);

  // ---- the zoom slot API (HT3-A6) ----
  return {
    slot,
    setPlateHidden(hidden) {
      if (hidden) endTrace();   // a hidden figure's animations are cancelled, not ended: end the Trace first
      fitEl.hidden = hidden;
      fitEl.inert = hidden;
      slot.hidden = !hidden;
      if (!hidden) fit(fitEl);
    },
    clearMistake() {
      sel.normal = setup.selN;
      setMode('normal');
    },
    snapshot: () => ({ mode, callout: sel.normal, tell: sel.mistake }),
    restore(s) {
      if (s.mode === 'mistake') { select(figN, s.callout); sel.mistake = s.tell; }
      else { if (figM) select(figM, s.tell); else sel.mistake = s.tell; sel.normal = s.callout; }
      setMode(s.mode);
    },
    destroy() {
      off.forEach(f => f());
      ro?.disconnect();
    },
  };
}

/** Binds the controller once the golden block is in the DOM; null until then. */
export function usePlateState(ref: RefObject<HTMLElement>, setup: PlateSetup): PlateApi | null {
  const [api, setApi] = useState<PlateApi | null>(null);
  useLayoutEffect(() => {
    const c = createPlateController(ref.current!, setup);
    setApi(c);
    return () => c.destroy();
  }, []);
  return api;
}
