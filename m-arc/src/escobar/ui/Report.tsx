/**
 * ESC-REPORT: the Report control under a finished coach reply. ReportAnswer has no hooks,
 * ReportControl holds the state and focus, and ReportView only draws (so every state can be
 * checked by calling it as a plain function).
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Ref } from 'preact';
import { REASONS, REASON_LABEL, initialState, reduce, reportBody, reportKey, reportLabelId, reportText, submitReport } from '../report';
import type { Reason, ReportEvent, ReportState } from '../report';
import type { Conversation } from '../types';

export const REPORT_COPY = {
  button: 'Report',
  buttonLabel: 'Report this reply',
  question: 'Reason',
  cancel: 'Cancel',
  sending: 'Sending…',
  sent: 'Reported. Thank you.',
  failed: 'Couldn’t send. Check your connection and try again.',
  limited: 'Too many reports from this network. Try again in an hour.',
} as const;

export interface ReportViewProps {
  state: ReportState;
  labelId: string;
  onToggle?: () => void;
  onPick?: (r: Reason) => void;
  onCancel?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  reportRef?: Ref<HTMLButtonElement>;
  firstRef?: Ref<HTMLButtonElement>;
  statusRef?: Ref<HTMLParagraphElement>;
}

export function ReportView({ state, labelId, onToggle, onPick, onCancel, onKeyDown, reportRef, firstRef, statusRef }: ReportViewProps) {
  if (state === 'sent') return <div class="esc-report"><p ref={statusRef} class="hint" role="status" tabIndex={-1}>{REPORT_COPY.sent}</p></div>;
  const open = state !== 'idle';
  const busy = state === 'sending';
  return (
    <div class="esc-report">
      <button ref={reportRef} type="button" class="esc-report-btn small" aria-label={REPORT_COPY.buttonLabel} aria-expanded={open ? 'true' : 'false'} onClick={onToggle}>{REPORT_COPY.button}</button>
      {open && (
        <div role="group" aria-labelledby={labelId} class="esc-report-group" onKeyDown={onKeyDown}>
          <p id={labelId} class="small">{REPORT_COPY.question}</p>
          {REASONS.map((r, i) => <button ref={i === 0 ? firstRef : undefined} type="button" key={r} class="chip chip-btn" disabled={busy} onClick={() => onPick?.(r)}>{REASON_LABEL[r]}</button>)}
          <button type="button" class="btn btn-quiet btn-sm" disabled={busy} onClick={onCancel}>{REPORT_COPY.cancel}</button>
          {busy && <p class="hint" role="status">{REPORT_COPY.sending}</p>}
          {state === 'failed' && <p class="hint" role="alert">{REPORT_COPY.failed}</p>}
          {state === 'limited' && <p class="hint" role="alert">{REPORT_COPY.limited}</p>}
        </div>
      )}
    </div>
  );
}

export function ReportControl({ conv, indexes, text, reportKeyValue }: { conv: Conversation; indexes: number[]; text: string; reportKeyValue: string }) {
  const [state, setState] = useState<ReportState>(() => initialState(reportKeyValue));
  const prev = useRef(state);
  const reportRef = useRef<HTMLButtonElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  useEffect(() => {
    const was = prev.current;
    prev.current = state;
    if (was === state) return;
    if (state === 'open' && was === 'idle') firstRef.current?.focus();
    else if (state === 'idle') reportRef.current?.focus();
    else if (state === 'sent') statusRef.current?.focus();
  }, [state]);
  const send = (e: ReportEvent) => setState(s => reduce(s, e));
  const pick = (reason: Reason) => {
    if (state === 'sending') return;
    send({ type: 'pick' });
    void submitReport(reportKeyValue, reportBody(reason, text)).then(r => { if (r !== 'busy' && alive.current) send({ type: 'result', result: r }); });
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    send({ type: 'cancel' });
  };
  return (
    <ReportView state={state} labelId={reportLabelId(conv, indexes)} reportRef={reportRef} firstRef={firstRef} statusRef={statusRef}
      onToggle={() => send({ type: state === 'idle' ? 'open' : 'cancel' })} onPick={pick} onCancel={() => send({ type: 'cancel' })} onKeyDown={onKeyDown} />
  );
}

/** Nothing for a reply with no reportable text; otherwise one control, remounted when the text changes. */
export function ReportAnswer({ conv, indexes }: { conv: Conversation; indexes: number[] }) {
  const text = reportText(conv, indexes);
  if (!text.trim()) return null;
  const key = reportKey(conv, text);
  return <ReportControl key={key} conv={conv} indexes={indexes} text={text} reportKeyValue={key} />;
}
