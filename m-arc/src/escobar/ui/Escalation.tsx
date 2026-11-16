/** Escalation cards (§19): fixed app-owned copy, never model text. No contact, number or link (owner, LR-23). */
import { Button, Card } from '@/ui/primitives';
import { update } from '@/core/store';
import { addDays, todayKey } from '@/core/dates';
import { MAX_MEMORY_ITEMS } from '@/core/models';
import { showToast } from '@/app/toast';
import { IconInfo } from '@/ui/icons';

export type EscalationKind = 'pain' | 'medical' | 'crisis' | 'disordered_eating' | 'pain_mentioned';

export const ESCALATION_COPY: Record<'pain' | 'medical' | 'crisis' | 'disordered_eating', string> = {
  pain: 'Pain that’s sharp, spreading, numb, or lasting more than two days is a medical question, not a programming one. Stop the movement that causes it and see a physio or doctor.',
  medical: 'Chest pain, fainting, or dizziness during exercise needs medical attention. Stop the session and get emergency help now.',
  crisis: 'If things feel like too much, you don’t have to carry it alone. Talk to someone you trust, or a doctor. If you feel you might harm yourself, get emergency help now.',
  disordered_eating: 'This is worth talking through with someone who can help properly, like a doctor.',
};

function noteInjury(): void {
  const now = new Date().toISOString();
  const id = `mem_${Date.now().toString(36)}`;
  update(s => ({ ...s, escobar: { ...s.escobar, memory: [...s.escobar.memory, { id, kind: 'injury' as const, text: 'Reported pain; check before loading the area', source: 'user_said' as const, createdAt: now, updatedAt: now, expiresOn: addDays(todayKey(), 42) }].slice(-MAX_MEMORY_ITEMS) } }));
  showToast('Escobar will keep this in mind', 'Undo', () => update(s => ({ ...s, escobar: { ...s.escobar, memory: s.escobar.memory.filter(m => m.id !== id) } })));
}

export function Escalation({ kind }: { kind: EscalationKind }) {
  const k = kind === 'pain_mentioned' ? 'pain' : kind;
  const copy = ESCALATION_COPY[k];
  if (!copy) return null;
  return (
    <Card class="esc-escalation" role="note" data-escalation={k}>
      <IconInfo size={16} class="esc-escalation-head" />
      <p class="small">{copy}</p>
      {k === 'pain' && <Button size="sm" variant="quiet" onClick={noteInjury}>Remember this injury</Button>}
    </Card>
  );
}
