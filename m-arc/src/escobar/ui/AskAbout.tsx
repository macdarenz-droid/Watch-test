/** "Ask about this" (§4.1): a quiet persona button that opens the sheet with a context chip. */
import { state } from '@/core/store';
import { IconEscobar } from '@/ui/icons';
import { askAbout } from './open';
import type { ContextRef } from '../types';

/** `label` renders it as a real labelled button (O2's "Ask Escobar") instead of the default icon-only look. */
export function AskAbout({ refTo, label, class: cls = '' }: { refTo: ContextRef; label?: string; class?: string }) {
  if (!state.value.escobar.enabled) return null;
  return (
    <button type="button" class={`btn btn-quiet ${label ? '' : 'btn-icon'} esc-ask ${cls}`} aria-label={label ? undefined : `Ask Escobar about ${refTo.label}`} title="Ask Escobar about this" onClick={e => { e.stopPropagation(); askAbout(refTo); }}>
      <IconEscobar size={18} />{label}
    </button>
  );
}
