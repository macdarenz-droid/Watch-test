import { useEffect, useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren, JSX } from 'preact';
import { IconX } from './icons';
import { markClosing, openSheetCount, registerSheet, sheetStack, unregisterSheet } from './sheetStack';
import { durFor, EASE, reduced, springEase } from './motion';
import { approxIn, enteredLoad, setLoadIn } from '@/core/units';
import { parseLoad } from '@/core/parse';
import type { LoadUnit } from '@/core/models';
import { haptic } from '@/native/haptics';
import { FLING_PX_PER_MS, HOLD_CONFIRM_MS, isVerticalDrag, LONG_PRESS_MS, rubber, SCROLL_LOCK_MS, SHEET_CLOSE_FRACTION, TOAST_FLING_PX_PER_MS, TOAST_SWIPE_PX, track } from '@/ui/gesture';

type Div = JSX.HTMLAttributes<HTMLDivElement>;

export function Card({ children, class: cls = '', className = '', onClick, ...rest }: { children?: ComponentChildren } & Div) {
  // AUD-12: a Card with onClick acts like a button from the keyboard too — but only when it has
  // no interactive descendant of its own (Train.tsx's exercise card, History.tsx's session card),
  // so a role=button Card never ends up wrapping a real button or another role=button element.
  const ref = useRef<HTMLDivElement>(null);
  const warned = useRef(false);
  const [keyable, setKeyable] = useState(false);
  useLayoutEffect(() => {
    if (!onClick) { setKeyable(false); return; }
    const blocked = !!ref.current?.querySelector('button, [role="button"], a[href], input, select, textarea, [tabindex]');
    setKeyable(!blocked);
    // AUD-12 (supervisor, 2026-10-01): dev-only, so a nested control added later doesn't silently
    // ship without a separate keyboard path — see Coach.tsx's insight card for the fix shape.
    if (blocked && import.meta.env.DEV && !warned.current) {
      warned.current = true;
      console.warn('Card: onClick is set but a nested interactive element keeps it mouse-only; add a separate control (e.g. a labelled button) for keyboard access.');
    }
  });
  const onKeyDown = keyable
    ? (e: KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault();
          onClick!(e as unknown as Parameters<NonNullable<typeof onClick>>[0]);
        }
      }
    : undefined;
  return (
    <div ref={ref} class={`card ${cls} ${className}`} onClick={onClick} onKeyDown={onKeyDown} role={keyable ? 'button' : undefined} tabIndex={keyable ? 0 : undefined} {...rest}>
      {children}
    </div>
  );
}

export function Button({ children, variant = 'default', size, block, class: cls = '', ...rest }: {
  children?: ComponentChildren; variant?: 'default' | 'primary' | 'solid' | 'quiet' | 'danger'; size?: 'sm'; block?: boolean;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" class={`btn ${variant !== 'default' ? `btn-${variant}` : ''} ${size ? `btn-${size}` : ''} ${block ? 'btn-block' : ''} ${cls}`} {...rest}>{children}</button>;
}

export function Chip({ children, tone, pressed, onClick, class: cls = '' }: { children?: ComponentChildren; tone?: 'accent' | 'positive' | 'warning' | 'negative' | 'info'; pressed?: boolean; onClick?: () => void; class?: string }) {
  const classes = `chip ${tone ? `chip-${tone}` : ''} ${onClick ? 'chip-btn' : ''} ${cls}`;
  return onClick
    ? <button type="button" class={classes} aria-pressed={pressed} onClick={onClick}>{children}</button>
    : <span class={classes}>{children}</span>;
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T | undefined; options: Array<{ value: T; label: string }>; onChange: (v: T) => void }) {
  // I10: a raised thumb glides under the chosen option instead of it getting its own background.
  // BUG-8: `value` can be undefined (e.g. Profile's Sex control before it's ever been set) — no
  // option is pressed then, and the thumb has nowhere to sit, so it's hidden rather than parked
  // at index 0.
  const i = options.findIndex(o => o.value === value);
  return (
    <div class="seg" role="tablist">
      {i >= 0 && <span class="seg-thumb" aria-hidden="true" style={{ width: `calc((100% - 6px) / ${options.length})`, transform: `translateX(${i * 100}%)` }} />}
      {options.map(o => <button type="button" role="tab" key={o.value} aria-selected={o.value === value} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>)}
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-disabled={disabled} disabled={disabled} aria-label={label} class="toggle" onClick={() => { void haptic.toggle(!checked); onChange(!checked); }} />;
}

export function Stat({ value, label, tone }: { value: ComponentChildren; label: string; tone?: 'positive' | 'warning' | 'negative' }) {
  return <div class="stat"><b class={`num ${tone ? `${tone}-text` : ''}`}>{value}</b><span>{label}</span></div>;
}

export function Row({ children, trailing, onClick, class: cls = '', palace }: { children?: ComponentChildren; trailing?: ComponentChildren; onClick?: () => void; class?: string; palace?: string }) {
  // UI-30: a pressable row works from the keyboard too.
  const onKeyDown = onClick ? (e: KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onClick(); } } : undefined;
  return <div class={`list-row ${onClick ? 'pressable' : ''} ${cls}`} data-palace={palace} onClick={onClick} onKeyDown={onKeyDown} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}><div class="grow">{children}</div>{trailing}</div>;
}

/** How many Sheets are open, so floating things (the Escobar dock) can hide under them. Derived from the sheet stack. */
export const openSheets = openSheetCount;

export function Sheet({ title, onClose, children, palace, eyebrow, class: cls }: { title: string; onClose: () => void; children?: ComponentChildren; palace?: string; eyebrow?: string; class?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const close = useRef(onClose);
  close.current = onClose;
  const closingRef = useRef(false);
  const requestCloseRef = useRef<() => void>(() => close.current());
  // I6: a sheet opened while another is already open dims nothing further (its own backdrop is
  // transparent) — the bottom sheet keeps the one real scrim. Decided once, before this sheet
  // registers itself, from whatever is already on the stack.
  const [nested] = useState(() => sheetStack.value.length > 0);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    // QA5-1: a child that already asks for focus (e.g. a form's first field) wins over the
    // panel's own autofocus, which exists only so a sheet with no such child still gets focus.
    const panel = d.querySelector<HTMLElement>('.sheet-panel')!;
    if (panel.querySelector('[autofocus]')) panel.removeAttribute('autofocus');
    if (!d.open) d.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closingRef.current = false;
    // I6: the panel slides down and the scrim fades before the sheet actually unmounts — every
    // close path (X, backdrop, Back, onCancel) routes through this instead of calling onClose
    // straight away. A second call while already closing is a no-op (one exit, ever).
    requestCloseRef.current = () => {
      if (closingRef.current) return;
      closingRef.current = true;
      d.classList.add('closing');
      markClosing(id);
      const p = d.querySelector<HTMLElement>('.sheet-panel');
      if (!p || !p.animate) { close.current(); return; }
      const r = reduced();
      const anim = p.animate(
        [{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${r ? 0 : p.offsetHeight}px)`, opacity: r ? 0 : 1 }],
        { duration: durFor('sheetExit'), easing: EASE.exit, fill: 'forwards' },
      );
      anim.finished.then(() => close.current()).catch(() => close.current());
    };
    // R5.3: Back (Android or browser) closes the top sheet through its own exit animation.
    registerSheet(id, () => close.current(), () => requestCloseRef.current());

    // A3: pull the sheet down by its handle/title, or by its content once scrolled to the top,
    // to dismiss it. Follows the finger 1:1 (rubber-banded above 0), the scrim lightens with it,
    // and release either finishes the close (past a quarter of the panel, or a fast flick) or
    // springs back. No haptic (this isn't a threshold-arm gesture like A5's swipe-to-delete).
    const applyFollow = (y: number) => {
      panel.style.transform = `translateY(${y >= 0 ? y : -rubber(-y)}px)`;
      const h = panel.offsetHeight || 1;
      d.style.setProperty('--scrim-o', String(Math.max(0, 1 - Math.max(0, y) / h)));
    };
    const clearFollow = () => { panel.style.transform = ''; d.style.removeProperty('--scrim-o'); };
    const finishDrag = (y: number, v: number) => {
      const h = panel.offsetHeight || 1;
      const shouldClose = y > 0 && (v >= FLING_PX_PER_MS || y >= SHEET_CLOSE_FRACTION * h);
      if (!shouldClose) {
        const anim = panel.animate([{ transform: `translateY(${y}px)` }, { transform: 'translateY(0)' }], { duration: durFor('spring'), easing: springEase() });
        // QA11-5: clearFollow() already removes --scrim-o once the panel settles back to rest
        // (anim.finished above). Removing it here too, immediately on release, snapped the
        // backdrop straight to full opacity while the panel was still visibly mid-spring-back.
        anim.finished.then(clearFollow).catch(clearFollow);
        return;
      }
      if (closingRef.current) return;
      closingRef.current = true;
      d.classList.add('closing');
      markClosing(id);
      const ms = Math.min(Math.max((h - y) / Math.max(v, 0.001), 120), durFor('sheetExit'));
      const anim = panel.animate([{ transform: `translateY(${y}px)` }, { transform: `translateY(${h}px)` }], { duration: ms, easing: EASE.exit, fill: 'forwards' });
      anim.finished.then(() => close.current()).catch(() => close.current());
    };
    // Reduced motion: no live follow (a continuously-moving finger can't sensibly crossfade); the
    // release still decides by the same distance/velocity threshold, closing via the ordinary
    // (crossfade) requestClose, or leaving the panel exactly where it already was (untouched).
    const onDragMove = (y: number) => { if (!reduced()) applyFollow(y); };
    const onDragEnd = (y: number, v: number) => {
      if (reduced()) { if (y > 0 && (v >= FLING_PX_PER_MS || y >= SHEET_CLOSE_FRACTION * (panel.offsetHeight || 1))) requestCloseRef.current(); return; }
      finishDrag(y, v);
    };
    const onDragCancel = () => { if (!reduced()) clearFollow(); };

    const top = d.querySelector<HTMLElement>('.sheet-top');
    const untrack = top ? track(top, {
      axis: 'y', capture: 'down',
      canStart: e => !(e.target as HTMLElement).closest('button'),
      onMove: onDragMove, onEnd: onDragEnd, onCancel: onDragCancel,
    }) : () => {};

    // Body drag: only the sheet's own content, scrolled to its very top, dragging down starts
    // it — otherwise native scroll (or text selection) proceeds untouched. Decided on the first
    // touchmove of each touch only. Uses raw Touch events (not track()) so it can defer to native
    // scroll conditionally instead of capturing the pointer up front.
    let lastScrollAt = 0;
    let bodyTouchId: number | null = null;
    let bodyDragging = false;
    let bodyStartY = 0;
    let bodyStartX = 0;
    let bodySamples: { t: number; y: number }[] = [];
    const onPanelScroll = () => { lastScrollAt = Date.now(); top?.classList.toggle('scrolled', panel.scrollTop > 0); };
    const velocityOf = (now: number, y: number) => {
      const first = bodySamples[0];
      if (!first || now - first.t <= 0) return 0;
      return (y - first.y) / (now - first.t);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (bodyTouchId != null || (e.target as HTMLElement).closest('.sheet-top')) return;
      // A nested sheet's own listener already claims a touch inside it — without this, the
      // bubbled event would also reach this (outer) sheet, which has no reason to think it's
      // scrolled and would wrongly grab (and preventDefault) the inner sheet's own scroll/drag.
      if ((e.target as HTMLElement).closest('.sheet-panel') !== panel) return;
      const t = e.touches[0];
      if (!t) return;
      bodyTouchId = t.identifier; bodyStartY = t.clientY; bodyStartX = t.clientX; bodyDragging = false; bodySamples = [{ t: performance.now(), y: t.clientY }];
    };
    const onTouchMove = (e: TouchEvent) => {
      if (bodyTouchId == null) return;
      const t = [...e.touches].find(x => x.identifier === bodyTouchId);
      if (!t) return;
      const dy = t.clientY - bodyStartY;
      if (!bodyDragging) {
        const dx = t.clientX - bodyStartX;
        const target = e.target as HTMLElement;
        const isFormEl = !!target.closest('input, textarea, select, [contenteditable]');
        const sel = typeof getSelection === 'function' ? getSelection() : null;
        const hasSelection = !!sel && sel.toString().length > 0;
        // QA11-4: without a vertical-dominance check, a horizontal scroller (or a diagonal touch)
        // at the panel's own scrollTop 0 got taken over as a close-drag.
        if (panel.scrollTop <= 0 && isVerticalDrag(dy, dx) && !isFormEl && !hasSelection && Date.now() - lastScrollAt >= SCROLL_LOCK_MS) bodyDragging = true;
        else { bodyTouchId = null; return; }
      }
      e.preventDefault();
      bodySamples.push({ t: performance.now(), y: t.clientY });
      while (bodySamples.length > 2 && bodySamples[0]!.t < performance.now() - 200) bodySamples.shift();
      onDragMove(dy);
    };
    const endBodyDrag = (e: TouchEvent) => {
      if (bodyTouchId == null) return;
      const t = [...e.changedTouches].find(x => x.identifier === bodyTouchId);
      bodyTouchId = null;
      if (!bodyDragging) return;
      bodyDragging = false;
      const dy = t ? t.clientY - bodyStartY : 0;
      onDragEnd(dy, velocityOf(performance.now(), t ? t.clientY : bodyStartY));
    };
    const onTouchCancel = () => { if (bodyDragging) onDragCancel(); bodyTouchId = null; bodyDragging = false; };
    panel.addEventListener('scroll', onPanelScroll, { passive: true });
    panel.addEventListener('touchstart', onTouchStart, { passive: true });
    panel.addEventListener('touchmove', onTouchMove, { passive: false });
    panel.addEventListener('touchend', endBodyDrag, { passive: true });
    panel.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      unregisterSheet(id); document.body.style.overflow = prev; if (d.open) d.close();
      untrack();
      panel.removeEventListener('scroll', onPanelScroll);
      panel.removeEventListener('touchstart', onTouchStart);
      panel.removeEventListener('touchmove', onTouchMove);
      panel.removeEventListener('touchend', endBodyDrag);
      panel.removeEventListener('touchcancel', onTouchCancel);
    };
  }, []);
  const requestClose = () => requestCloseRef.current();
  return (
    <dialog ref={ref} class={`sheet ${nested ? 'nested' : ''}${cls ? ` ${cls}` : ''}`} aria-labelledby={id} onCancel={e => { e.preventDefault(); requestClose(); }} onClick={e => { if (e.target === e.currentTarget) requestClose(); }}>
      <div class="sheet-panel" data-palace={palace} tabIndex={-1} autofocus>
        <div class="sheet-top">
          <div class="sheet-grab" />
          <div class="sheet-head"><h2 id={id}>{eyebrow && <span class="eyebrow sheet-eyebrow">{eyebrow}</span>}{title}</h2><button type="button" class="btn btn-quiet btn-icon" aria-label="Close" onClick={requestClose}><IconX /></button></div>
        </div>
        {children}
      </div>
    </dialog>
  );
}

/**
 * F13: a swiped-away toast never runs its Undo (only a tap on the button does) — leave() is the
 * one path that ever tears this down without it, whether the timer, a swipe, or (soon) something
 * else calls it.
 */
export function Toast({ message, action, onAction, onDismiss }: { message: string; action?: string; onAction?: () => void; onDismiss: () => void }) {
  // The parent passes a new onDismiss each render; keep it in a ref so the timer is not reset (UI-28).
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remaining = useRef(action ? 5000 : 3000);
  const runningSince = useRef(0);
  // A toast is replaced (a new `key`, a fresh instance) rather than updated in place, so an exit
  // timer or WAAPI animation started by THIS instance must never call dismiss() once it's gone —
  // `dismiss.current()` closes over the module-level `toast` signal, so a late call from a
  // superseded instance would null out whatever toast has shown since (App.tsx's Toast usage).
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  const safeDismiss = () => { if (mountedRef.current) dismiss.current(); };

  const leave = () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    setTimeout(safeDismiss, durFor('exit'));
  };
  const clearTimer = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  const startTimer = (ms: number) => { clearTimer(); runningSince.current = Date.now(); timer.current = setTimeout(leave, ms); };
  const pauseTimer = () => {
    if (!timer.current) return;
    remaining.current = Math.max(0, remaining.current - (Date.now() - runningSince.current));
    clearTimer();
  };
  const resumeTimer = () => { if (!leavingRef.current && !timer.current) startTimer(remaining.current); };

  useEffect(() => {
    remaining.current = action ? 5000 : 3000;
    startTimer(remaining.current);
    const onVis = () => { if (document.hidden) pauseTimer(); else resumeTimer(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearTimer(); document.removeEventListener('visibilitychange', onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, action]);

  // Swipe away: horizontal either way, or straight down (never up — that reads as "toward the
  // content behind it", not a dismiss). Two trackers on the same element; whichever axis the
  // gesture actually locks onto is the one that ever calls onMove/onEnd, the other aborts itself
  // past slop (track()'s own axis-ratio check).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const untracks: Array<() => void> = [];
    const finish = (dist: number, dir: 'x' | 'y') => {
      if (leavingRef.current) return;
      // Reduced motion (or no WAAPI): the ordinary crossfade exit, same as the timeout's own —
      // a live slide isn't shown either way, so there's nothing left to continue mid-gesture.
      if (!el.animate || reduced()) { leave(); return; }
      leavingRef.current = true;
      setLeaving(true);
      const push = dist + Math.sign(dist || 1) * 300;
      const from = dir === 'x' ? `translateX(${dist}px)` : `translateY(${dist}px)`;
      const to = dir === 'x' ? `translateX(${push}px)` : `translateY(${push}px)`;
      const anim = el.animate([{ transform: from, opacity: 1 }, { transform: to, opacity: 0 }], { duration: durFor('exit'), easing: EASE.exit, fill: 'forwards' });
      anim.finished.then(safeDismiss).catch(safeDismiss);
    };
    const springBack = () => {
      if (!el.animate) { el.style.transform = ''; resumeTimer(); return; }
      const anim = el.animate([{ transform: el.style.transform || 'none' }, { transform: 'none' }], { duration: durFor('spring'), easing: springEase() });
      anim.finished.then(() => { el.style.transform = ''; resumeTimer(); }).catch(() => { el.style.transform = ''; resumeTimer(); });
    };
    untracks.push(track(el, {
      axis: 'x', capture: 'afterSlop',
      onMove: d => { if (!leavingRef.current && !reduced()) el.style.transform = `translateX(${d}px)`; },
      onEnd: (d, v) => {
        if (leavingRef.current) return;
        if (Math.abs(d) >= TOAST_SWIPE_PX || Math.abs(v) >= TOAST_FLING_PX_PER_MS) finish(d, 'x'); else springBack();
      },
      onCancel: () => { if (!leavingRef.current) springBack(); },
    }));
    untracks.push(track(el, {
      axis: 'y', capture: 'afterSlop',
      onMove: d => { if (!leavingRef.current && !reduced() && d > 0) el.style.transform = `translateY(${d}px)`; },
      onEnd: (d, v) => {
        if (leavingRef.current) return;
        if (d <= 0) { resumeTimer(); return; }
        if (d >= TOAST_SWIPE_PX || v >= TOAST_FLING_PX_PER_MS) finish(d, 'y'); else springBack();
      },
      onCancel: () => { if (!leavingRef.current) springBack(); },
    }));
    return () => untracks.forEach(u => u());
  }, []);

  // QA11-3: pause/resume live on the toast's own pointer lifecycle, independent of track() —
  // track() only calls onEnd/onCancel once a gesture has crossed slop, so a plain tap (pointerdown
  // then pointerup with no real movement) used to pause the countdown via track()'s onStart and
  // never resume it, since neither tracker had anything to end. A tap always fires pointerdown and
  // pointerup regardless, so this always un-pauses.
  const onPointerDown = () => { if (!leavingRef.current) pauseTimer(); };
  const onPointerUp = () => { if (!leavingRef.current) resumeTimer(); };
  return (
    <div class={`toast ${leaving ? 'leaving' : ''}`} ref={ref} role="status" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      <span>{message}</span>
      {action && <button type="button" onClick={() => { onAction?.(); leave(); }}>{action}</button>}
    </div>
  );
}

/**
 * A number typed as text and committed on blur or Enter (UI-22): half-typed values ("19" on the
 * way to "1990") are never saved. Out-of-range input reverts to the saved value.
 */
export function CommitNumber({ value, min, max, integer, onCommit, ...rest }: { value: number | undefined; min: number; max: number; integer?: boolean; onCommit: (v: number | undefined) => void } & Omit<JSX.HTMLAttributes<HTMLInputElement>, 'value' | 'min' | 'max'>) {
  const shown = value != null ? String(value) : '';
  const [text, setText] = useState(shown);
  const focused = useRef(false);
  if (!focused.current && text !== shown) setText(shown);
  const commit = () => {
    focused.current = false;
    const t = text.trim().replace(',', '.');
    if (!t) { if (value != null) onCommit(undefined); return; }
    const v = Number(t);
    if (!Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) { void haptic.reject(); setText(shown); return; }
    if (v !== value) onCommit(v);
  };
  return <input {...rest} type="text" inputMode={integer ? 'numeric' : 'decimal'} value={text} onFocus={() => { focused.current = true; }} onInput={e => setText((e.target as HTMLInputElement).value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />;
}

/**
 * F10: a destructive action that fills in as you hold it, instead of a grey system confirm() —
 * so it's undoable-by-intent (you can let go before it fires) rather than a modal to dismiss.
 * Twin for TalkBack/keyboard-without-hold: a tap arms "Tap again to confirm" for 3s, a second
 * tap within that window confirms. No app-state imports beyond haptics — this also backs the
 * error boundary, which must render after a crash regardless of app state.
 */
export function HoldButton({ label, onConfirm, ms = HOLD_CONFIRM_MS, size, class: cls = '' }: {
  label: string; onConfirm: () => void; ms?: number; size?: 'sm'; class?: string;
}) {
  const [holding, setHolding] = useState(false);
  const [armed, setArmed] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdCompleted = useRef(false);
  const armedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); if (armedTimer.current) clearTimeout(armedTimer.current); }, []);

  const startHold = () => {
    if (holdTimer.current) return;
    holdCompleted.current = false;
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      holdCompleted.current = true;
      setHolding(false);
      try { void haptic.confirm(); } catch { /* haptics unavailable */ }
      onConfirm();
    }, ms);
  };
  const cancelHold = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    setHolding(false);
  };
  /** A tap too short to complete the hold: TalkBack's synthesized click (detail 0), or a real
   * keyboard tap of Enter/Space (keydown's preventDefault below stops the browser's own click for
   * those, so this is the only path for them) — arms "Tap again to confirm" for 3s; a second tap
   * within that window confirms. */
  const armTap = () => {
    if (armedTimer.current) { clearTimeout(armedTimer.current); armedTimer.current = null; }
    if (armed) {
      setArmed(false);
      try { void haptic.confirm(); } catch { /* haptics unavailable */ }
      onConfirm();
    } else {
      setArmed(true);
      armedTimer.current = setTimeout(() => setArmed(false), 3000);
    }
  };

  return (
    <button
      type="button"
      class={`btn btn-danger hold ${holding ? 'holding' : ''} ${size ? `btn-${size}` : ''} ${cls}`}
      style={{ '--hold-ms': `${ms}ms` }}
      aria-label={armed ? 'Tap again to confirm' : `${label}, press and hold`}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } }}
      onKeyUp={e => {
        if (e.key !== ' ' && e.key !== 'Enter') return;
        // A full hold already confirmed via the timer; nothing else to do on release.
        if (holdCompleted.current) { holdCompleted.current = false; return; }
        cancelHold();
        armTap();
      }}
      onClick={e => {
        // A synthesized activation (TalkBack) carries no pointer, so detail is 0. A real keyboard
        // tap is handled by onKeyUp instead (preventDefault in onKeyDown stops its own click).
        if (e.detail !== 0) return;
        armTap();
      }}
    >{armed ? 'Tap again to confirm' : label}</button>
  );
}

export function Empty({ icon, title, children, action, align = 'start' }: { icon?: ComponentChildren; title: string; children?: ComponentChildren; action?: ComponentChildren; align?: 'start' | 'center' }) {
  return (
    <div class={`empty${align === 'center' ? '' : ' align-start'}`}>
      {icon && <span class="empty-glyph">{icon}</span>}
      <h3>{title}</h3>
      {children && <p class="small">{children}</p>}
      {action}
    </div>
  );
}

export function Section({ title, aside, children, palace }: { title: string; aside?: ComponentChildren; children?: ComponentChildren; palace?: string }) {
  return <section class="section" data-palace={palace}><div class="section-title"><h2>{title}</h2>{aside}</div>{children}</section>;
}

export function Field({ label, children, hint }: { label: string; children?: ComponentChildren; hint?: string }) {
  return <label class="stack-sm"><span class="small muted">{label}</span>{children}{hint && <span class="hint">{hint}</span>}</label>;
}

/**
 * A weight input that keeps decimals while typing. A plain controlled `<input value={kgToDisplay(kg)}>`
 * reformats on every keystroke, so "23." collapses back to "23" before a "5" can follow it — the
 * displayed text only re-syncs from the committed kg while the field is not focused.
 */
export interface WeightChange { kg: number; entered: { value: number; unit: LoadUnit } }

/**
 * Plate Sense (§25.5): the entry unit is per exercise and gym, flipped with the pill at the
 * input's right edge (long-press for the whole equipment group). What was typed is kept
 * verbatim in `entered`, so 35 lb stays 35 lb. When the entry unit differs from the display
 * unit, a second reading sits under the input.
 */
export function WeightInput({ kg, entered, entryUnit, displayUnit, placeholder, ariaLabel, onChange, onUnitFlip, onUnitLongPress, setField, onFieldKeyDown }: {
  kg: number | undefined;
  entered?: { value: number; unit: LoadUnit };
  entryUnit: LoadUnit;
  displayUnit?: LoadUnit;
  placeholder?: string;
  ariaLabel?: string;
  onChange: (v: WeightChange | undefined) => void;
  onUnitFlip?: () => void;
  onUnitLongPress?: () => void;
  /** A8: this is a live set's kg field — tags it for the Enter/Next keyboard flow and selects its
   * text on focus, so tapping a filled field lets typing replace it instead of appending. */
  setField?: boolean;
  onFieldKeyDown?: (e: KeyboardEvent) => void;
}) {
  const shown = kg != null ? setLoadIn({ kg, entered }, entryUnit) : undefined;
  const display = shown != null ? String(shown) : '';
  const [text, setText] = useState(display);
  const focused = useRef(false);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);
  const long = useRef(false);
  if (!focused.current && text !== display) setText(display);
  const other = displayUnit && displayUnit !== entryUnit && kg != null && kg > 0 ? approxIn(kg, displayUnit) : null;
  // I11: one long-press timing everywhere, not this control's own 550ms.
  const startPress = () => { long.current = false; if (onUnitLongPress) press.current = setTimeout(() => { long.current = true; void haptic.longPress(); onUnitLongPress(); }, LONG_PRESS_MS); };
  const endPress = () => { if (press.current) { clearTimeout(press.current); press.current = null; } };
  return (
    <span class="weight-input">
      <input
        type="text" inputMode="decimal" autoComplete="off" placeholder={placeholder} value={text} aria-label={ariaLabel ?? `Load in ${entryUnit}`}
        {...(setField ? { 'data-set-field': 'kg', enterKeyHint: 'next' as const, onKeyDown: onFieldKeyDown } : {})}
        onFocus={e => { focused.current = true; if (setField) (e.target as HTMLInputElement).select(); }}
        onBlur={() => { focused.current = false; setText(display); }}
        onInput={e => {
          const raw = (e.target as HTMLInputElement).value;
          setText(raw);
          const v = parseLoad(raw, entryUnit);
          onChange(v != null ? enteredLoad(v, entryUnit) : undefined);
        }}
      />
      {onUnitFlip ? (
        <button
          type="button" class="unit-pill" aria-label={`Entry unit ${entryUnit}. Tap to switch to ${entryUnit === 'kg' ? 'lb' : 'kg'}`}
          onPointerDown={startPress} onPointerUp={endPress} onPointerLeave={endPress} onPointerCancel={endPress}
          onContextMenu={e => e.preventDefault()}
          onClick={() => { if (long.current) { long.current = false; return; } onUnitFlip(); }}
        >{entryUnit}</button>
      ) : null}
      {displayUnit && displayUnit !== entryUnit && <span class="weight-approx">{other ?? ' '}</span>}
    </span>
  );
}
