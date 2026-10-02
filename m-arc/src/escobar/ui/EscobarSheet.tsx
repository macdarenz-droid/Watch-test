/**
 * The chat sheet (§4.2): its own `<dialog>` opened with showModal() so it stacks above any
 * open Sheet, with half / full detents, a header with status and menu, the thread, and the
 * composer. Loaded lazily from App.tsx the first time Escobar opens.
 */
import { dayKey } from '@/core/dates';
import { Fragment } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { state } from '@/core/store';
import { todayReadiness } from '@/app/selectors';
import { showPanel } from '@/app/router';
import { Button, Card, Row, Toggle } from '@/ui/primitives';
import { IconEscobar, IconMore, IconX, IconBack } from '@/ui/icons';
import { haptic } from '@/native/haptics';
import { track } from '@/ui/gesture';
import { durFor, EASE, reduced, springEase } from '@/ui/motion';
import { FULL_FRAC, HALF_FRAC, resolveEscobarRelease } from '../detent';
import { escobarUi, loopView, offlineReason, online, quotaResetAt, registerEscobarClose, unregisterEscobarClose } from '../state';
import * as S from '../session';
import { goTo } from '../palace/navigate';
import { Composer } from './Composer';
import { EscobarTurnView, UserBubble, AnswerText, turnsOf, toolResults, toolUsesOf, type Turn, type UserTurn } from './Message';
import { Escalation } from './Escalation';
import { starterChips } from './prompts';
import { ThinkingLine } from './Thinking';
import { PlanBoard, currentTurn, isPlanWork } from './PlanBoard';
import type { Conversation, ImageBlockRef } from '../types';
import type { SendInput, TurnResult } from '../loop';

export const EMPTY_LINE = 'Ask me anything.';

// I7: the exit animation lives here (it needs to measure and animate this component's own
// panel), but it registers into state.ts rather than keeping its own module-level hook — state.ts
// is always loaded (native/back.ts needs it for the hardware Back button), and this file is not
// (it's fetched lazily, the first time Escobar opens), so a caller reaching this export directly
// would otherwise pull the whole chat sheet into the main bundle just to close it.
export { requestEscobarClose } from '../state';

function statusText(): string {
  const v = loopView.value.status;
  if (v !== 'idle') return 'thinking…';
  if (quotaResetAt.value && quotaResetAt.value > Date.now()) return 'resting (daily limit reached)';
  if (online.value === false) return 'offline';
  return 'online';
}

export const REGION_LINE = "Escobar isn't available on this network right now. Try mobile data.";

function resultLine(r: TurnResult): string | null {
  switch (r.outcome) {
    case 'error':
      if (r.error?.code === 'quota') return 'Escobar is resting until tomorrow (daily limit reached).';
      if (r.error?.code === 'rate') return 'Too many messages at once. Try again in a minute.';
      // PL-20: the coach's provider refuses some network locations; this is not a setup problem.
      if (r.error?.code === 'upstream_region') return REGION_LINE;
      return r.error?.message || 'Escobar couldn’t answer. Try again.';
    case 'refusal': return 'Escobar can’t help with that one.';
    case 'step_limit': return 'That took too many steps. Try a narrower question.';
    case 'cut_off': return 'The answer was cut off. Ask again, a little narrower.';
    case 'aborted': return 'Stopped.';
    case 'timeout': return 'That took too long. Try again.';
    case 'backgrounded': return 'Paused when the app went to the background.';
    default: return null;
  }
}

/** First enable (§20): what is sent, where, what is not, and the two sharing toggles. */
export function Explainer({ onDone }: { onDone?: () => void }) {
  const cur = state.value.escobar.sharing;
  const [health, setHealth] = useState(cur.health);
  const [body, setBody] = useState(cur.body);
  return (
    <div class="esc-explainer stack">
      <p>Escobar is an AI coach. When you ask him something, this is what leaves your phone:</p>
      <ul class="small">
        <li>A short summary of today (readiness, recovery, this week).</li>
        <li>The parts of your history he asks for to answer, and your messages and photos.</li>
        <li>It goes through your M/ARC server to Anthropic, the model provider.</li>
      </ul>
      <div class="list">
        <Row trailing={<Toggle checked={health} onChange={setHealth} label="Share health data" />}><span class="small">Share health data</span><div class="hint">Sleep, resting heart rate, heart rate during sessions.</div></Row>
        <Row trailing={<Toggle checked={body} onChange={setBody} label="Share body data" />}><span class="small">Share body data</span><div class="hint">Weight and body measurements.</div></Row>
      </div>
      <Button variant="primary" block onClick={() => { S.setEscobarEnabled(true, { health, body }); onDone?.(); }}>Turn on Escobar</Button>
    </div>
  );
}

function PastConversations({ onBack }: { onBack: () => void }) {
  const list = [...S.storeSig.value.conversations].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return (
    <div class="stack-sm">
      <button type="button" class="esc-link small" onClick={onBack}><IconBack size={16} /> Back</button>
      {!list.length && <p class="small muted">No conversations yet.</p>}
      {list.map(c => (
        <button type="button" key={c.id} class="esc-past" onClick={() => { S.selectConversation(c.id); onBack(); }}>
          <b class="small">{c.title || 'New conversation'}</b><span class="hint">{dayKey(new Date(c.updatedAt))}</span>
        </button>
      ))}
    </div>
  );
}

const bubbleOf = (i: SendInput): UserTurn['msg'] => ({ role: 'user', content: [{ type: 'text', text: i.text }, ...(i.images ?? [])], ...(i.contextRefs?.length ? { meta: { contextRefs: i.contextRefs } } : {}) });

/** BUG-32: the kinds of escalate card an Escobar turn draws (EscobarTurnView's rule: a result that is not an error). */
function escalatedKinds(conv: Conversation, indexes: number[]): Set<string> {
  const results = toolResults(conv.messages, indexes);
  const kinds = new Set<string>();
  for (const i of indexes) {
    const m = conv.messages[i];
    if (m?.role !== 'assistant') continue;
    for (const u of toolUsesOf(m.content)) {
      const r = results.get(u.id);
      if (u.name === 'escalate' && r && !r.isError) kinds.add(String(u.input.kind));
    }
  }
  return kinds;
}

export function Thread({ onChip }: { onChip: (t: string) => void }) {
  const conv = S.activeConversation.value;
  const view = loopView.value;
  const busy = view.status !== 'idle';
  const pending = S.pendingUser.value;
  const last = S.lastTurn.value;
  const turns = conv ? turnsOf(conv.messages) : [];
  const showPending = pending && (!conv || conv.messages.length <= pending.at);
  const r = todayReadiness.value;
  const lastEscobar = turns.length - 1;
  const planWork = busy && isPlanWork(currentTurn(conv?.messages ?? []).uses, view.activity);
  // BUG-32: each pre-screen card sits right under the message that raised it, in memory only.
  const cards = S.safetyCards.value;
  const committed = conv?.messages.length ?? 0;
  const card = (c: S.SafetyCard) => <Escalation key={`${c.orphan ? 'gone' : 'card'}-${c.kind}-${c.at}`} kind={c.kind} />;
  // One card, not two: a reply that draws the same card replaces the pre-screen one.
  const cardsUnder = (at: number, reply: Turn | undefined) => {
    const shown = conv && reply?.kind === 'escobar' ? escalatedKinds(conv, reply.indexes) : null;
    return cards.filter(c => !c.orphan && c.at === at && !shown?.has(c.kind)).map(card);
  };
  // An unsent message that a later send replaced has left the thread; its card keeps that place.
  const orphansIn = (after: number, upTo: number) => cards.filter(c => c.orphan && c.at > after && c.at <= upTo).map(card);
  let lastUser = -1;

  if (!turns.length && !showPending && !last) {
    return (
      <div class="esc-empty">
        <IconEscobar size={40} />
        <p>{EMPTY_LINE}</p>
        <div class="esc-chips">{starterChips(state.value, r).map(c => <button type="button" key={c} class="chip chip-btn" onClick={() => onChip(c)}>{c}</button>)}</div>
      </div>
    );
  }
  return (
    <div class="esc-thread-inner">
      {turns.map((t, i) => {
        if (t.kind !== 'user') return <EscobarTurnView key={t.indexes[0]} conv={conv!} indexes={t.indexes} live={busy && i === lastEscobar} last={i === lastEscobar} onChip={onChip} />;
        const before = orphansIn(lastUser, t.index);
        lastUser = t.index;
        return <Fragment key={t.index}>{before}<UserBubble msg={t.msg} />{cardsUnder(t.index, turns[i + 1])}</Fragment>;
      })}
      {orphansIn(lastUser, Infinity)}
      {showPending && pending && <UserBubble msg={bubbleOf(pending.input)} />}
      {!busy && last?.notSent && <UserBubble msg={bubbleOf(last.input)} />}
      {cards.filter(c => !c.orphan && c.at >= committed).map(card)}
      {busy && (
        <div class="esc-turn esc-live" aria-live="polite">
          {planWork ? <PlanBoard messages={conv?.messages ?? []} activity={view.activity} /> : (
            <>
              {view.activity.map(a => <div key={a.id} class={`esc-activity${a.done ? ' done' : ''}`}><span class="esc-spin" aria-hidden="true" />{a.label}</div>)}
              {view.status === 'thinking' && !view.text && <ThinkingLine />}
            </>
          )}
          {view.status === 'verifying' && <ThinkingLine label="Checking the numbers…" />}
          {view.text && <AnswerText text={view.text} ledger={conv?.ledger ?? []} streaming />}
        </div>
      )}
      {!busy && last?.notSent && last.outcome !== 'offline' && (
        <div class="esc-notsent small"><span class="muted">Not sent</span> · <button type="button" class="esc-link" onClick={() => void S.send(last.input)}>Retry</button></div>
      )}
      {!busy && last?.local && (
        <Card class="esc-local">
          <p class="small">{last.local.text}</p>
          {last.local.entries.map(e => <Button key={e.id} size="sm" variant="quiet" onClick={() => { S.escobarToHalf(); void goTo(e.target); }}>{e.title}</Button>)}
        </Card>
      )}
      {!busy && last && resultLine(last) && <div class="esc-result small muted" role="status">{resultLine(last)}</div>}
    </div>
  );
}

export function EscobarSheet() {
  const ui = escobarUi.value;
  const ref = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const grabRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const [menu, setMenu] = useState(false);
  const [past, setPast] = useState(false);
  const enabled = state.value.escobar.enabled;
  const view = loopView.value;
  const busy = view.status !== 'idle';

  const closingRef = useRef(false);
  const requestCloseRef = useRef<() => void>(() => S.closeEscobar());
  const requestClose = () => requestCloseRef.current();
  // I7: shared with the generic FLIP effect below, so a drag's own settle animation can mark its
  // detent change as already accounted for (see `settle()`) instead of leaving a stale "before"
  // rect for that effect to (wrongly) re-animate against once the state write it triggers commits.
  const detentRef = useRef(ui.detent);
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const d = ref.current;
    const p = panelRef.current;
    if (!d || !p) return;
    if (!d.open) d.showModal();
    S.prepare();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closingRef.current = false;

    // I7: the panel slides down and the scrim fades before the sheet actually unmounts — same
    // shape as an ordinary Sheet's requestClose (I6). Every close path (X, backdrop, menu,
    // onCancel, Back) routes through this instead of calling S.closeEscobar() straight away.
    requestCloseRef.current = () => {
      if (closingRef.current) return;
      closingRef.current = true;
      d.classList.add('closing');
      if (!p.animate) { S.closeEscobar(); return; }
      const r = reduced();
      const anim = p.animate(
        [{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${r ? 0 : p.offsetHeight}px)`, opacity: r ? 0 : 1 }],
        { duration: durFor('sheetExit'), easing: EASE.exit, fill: 'forwards' },
      );
      anim.finished.then(() => S.closeEscobar()).catch(() => S.closeEscobar());
    };
    registerEscobarClose(() => requestCloseRef.current());

    // A3/I7: drag the grab zone (or double-tap it) between half, full and closed. During the drag
    // the panel is forced to full height (94dvh) and follows the finger via translateY — a fixed
    // height avoids animating the CSS height property (janky); the resting half/full sizes are
    // plain CSS on `.esc-panel`, swapped back in only once the release animation lands exactly on
    // one of them (a FLIP: measuring the pre/post rect below handles every OTHER detent change —
    // a double-tap, the composer taking focus, escobarToHalf() elsewhere — the same way).
    let dragStartOffset = 0;
    const untrack = track(grabRef.current!, {
      axis: 'y',
      capture: 'down',
      canStart: e => !(e.target as HTMLElement).closest('button'),
      onStart: () => {
        dragStartOffset = escobarUi.value.detent === 'half' ? (FULL_FRAC - HALF_FRAC) * window.innerHeight : 0;
        p.style.height = `${FULL_FRAC * window.innerHeight}px`;
        p.style.transform = `translateY(${dragStartOffset}px)`;
      },
      onMove: dy => {
        const hFull = FULL_FRAC * window.innerHeight;
        p.style.transform = `translateY(${Math.min(hFull, Math.max(0, dragStartOffset + dy))}px)`;
      },
      onEnd: (dy, v) => {
        const vh = window.innerHeight;
        const hFull = FULL_FRAC * vh;
        const offset = Math.min(hFull, Math.max(0, dragStartOffset + dy));
        if (Math.abs(dy) < 1 && Math.abs(v) < 0.01) { p.style.transform = dragStartOffset ? `translateY(${dragStartOffset}px)` : ''; p.style.height = ''; return; }
        const nearest = resolveEscobarRelease(offset, v, vh);
        const dur = Math.abs(nearest.pos - offset) < 200 ? durFor('spring') : durFor('bounce');
        if (nearest.name === 'closed') {
          if (closingRef.current) return;
          closingRef.current = true;
          d.classList.add('closing');
          const anim = p.animate([{ transform: `translateY(${offset}px)` }, { transform: `translateY(${hFull}px)` }], { duration: dur, easing: EASE.exit, fill: 'forwards' });
          anim.finished.then(() => S.closeEscobar()).catch(() => S.closeEscobar());
          return;
        }
        const anim = p.animate([{ transform: `translateY(${offset}px)` }, { transform: `translateY(${nearest.pos}px)` }], { duration: dur, easing: springEase() });
        const settle = () => {
          p.style.transform = ''; p.style.height = '';
          // Mark this transition as already handled before writing the signal, so the render it
          // triggers finds detentRef already equal to the new value and the generic FLIP effect
          // below (which would otherwise compare against a rect from well before this drag) skips.
          detentRef.current = nearest.name as 'half' | 'full';
          rectRef.current = p.getBoundingClientRect();
          if (escobarUi.value.detent !== nearest.name) { escobarUi.value = { ...escobarUi.value, detent: nearest.name as 'half' | 'full' }; void haptic.tick(); }
        };
        anim.finished.then(settle).catch(settle);
      },
      onCancel: () => { p.style.transform = ''; p.style.height = ''; },
    });

    return () => { unregisterEscobarClose(); untrack(); document.body.style.overflow = prev; if (d.open) d.close(); };
  }, []);

  // I7: any OTHER detent change (double-tap, the composer taking focus, escobarToHalf()
  // elsewhere) swaps the half/full CSS class instantly — this FLIPs the resulting jump into a
  // running animation instead, by measuring the panel's position from just before the render
  // that changed it to just after.
  useLayoutEffect(() => {
    const p = panelRef.current;
    if (p && detentRef.current !== ui.detent && rectRef.current && !reduced()) {
      const before = rectRef.current;
      const after = p.getBoundingClientRect();
      const dy = before.top - after.top;
      if (Math.abs(dy) >= 1) {
        p.animate(
          [{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }],
          { duration: Math.abs(dy) < 200 ? durFor('spring') : durFor('bounce'), easing: springEase() },
        );
      }
    }
    detentRef.current = ui.detent;
    rectRef.current = p ? p.getBoundingClientRect() : null;
  });

  // Follow the stream only if the person was already at the bottom (§4.2).
  useEffect(() => {
    const t = threadRef.current;
    if (t && atBottom.current) t.scrollTop = t.scrollHeight;
  });

  const send = (text: string, images: ImageBlockRef[] = []) => {
    if (!text && !images.length) return;
    const ref0 = escobarUi.value.contextRef;
    escobarUi.value = { ...escobarUi.value, contextRef: null, draft: '' };
    atBottom.current = true;
    void S.send({ text: text || 'What do you see in this photo?', ...(images.length ? { images } : {}), ...(ref0 ? { contextRefs: [ref0] } : {}) });
  };

  const notice = online.value === false ? `Escobar is offline.${offlineReason.value ? ` ${offlineReason.value}` : ''}` : quotaResetAt.value && quotaResetAt.value > Date.now() ? 'Escobar is resting until tomorrow (daily limit reached).' : undefined;
  const mode = ui.mode === 'live' ? ' · live' : ui.mode === 'plan' ? ' · planning' : '';

  return (
    <dialog ref={ref} class={`esc-sheet esc-${ui.detent}`} aria-labelledby="esc-title" onCancel={e => { e.preventDefault(); requestClose(); }} onClick={e => { if (e.target === e.currentTarget) requestClose(); }}>
      <div class="esc-panel" data-palace="escobar.sheet" ref={panelRef}>
        <div class="esc-grab-zone" ref={grabRef} onDblClick={() => { escobarUi.value = { ...escobarUi.value, detent: ui.detent === 'full' ? 'half' : 'full' }; }}><div class="sheet-grab" /></div>
        <header class="esc-head">
          <IconEscobar size={26} thinking={busy} />
          <div class="esc-head-text"><h2 id="esc-title">Escobar</h2><span class="hint" role="status">{statusText()}{mode}</span></div>
          <button type="button" class="btn btn-quiet btn-icon" aria-label="Escobar menu" aria-expanded={menu} onClick={() => setMenu(m => !m)}><IconMore /></button>
          <button type="button" class="btn btn-quiet btn-icon" aria-label="Close" onClick={requestClose}><IconX /></button>
          {menu && (
            <div class="esc-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setMenu(false); setPast(false); S.startNewConversation(); }}>New conversation</button>
              <button type="button" role="menuitem" onClick={() => { setMenu(false); setPast(true); }}>Past conversations</button>
              <button type="button" role="menuitem" onClick={() => { setMenu(false); S.escobarToHalf(); showPanel('memory'); }}>Memory</button>
              <button type="button" role="menuitem" onClick={() => { setMenu(false); requestClose(); void goTo('settings.escobar'); }}>Coach settings</button>
            </div>
          )}
        </header>
        <div class="esc-thread" ref={threadRef} onScroll={e => { const t = e.currentTarget; atBottom.current = t.scrollHeight - t.scrollTop - t.clientHeight < 40; }}>
          {!enabled ? <Explainer /> : past ? <PastConversations onBack={() => setPast(false)} /> : <Thread onChip={t => send(t)} />}
        </div>
        {enabled && !past && (
          <Composer
            busy={busy}
            draft={ui.draft}
            contextRef={ui.contextRef}
            notice={notice}
            suggestions={ui.mode === 'live' ? [] : starterChips(state.value, todayReadiness.value)}
            placeholder={ui.mode === 'live' ? 'Quick question mid-session…' : 'Ask Escobar…'}
            onSend={send}
            onStop={() => S.stop()}
            onClearRef={() => { escobarUi.value = { ...escobarUi.value, contextRef: null }; }}
            onFocus={() => { if (escobarUi.value.detent !== 'full') escobarUi.value = { ...escobarUi.value, detent: 'full' }; }}
          />
        )}
      </div>
    </dialog>
  );
}

export default EscobarSheet;
