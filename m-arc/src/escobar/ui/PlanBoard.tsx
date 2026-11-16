/**
 * The plan whiteboard (owner's pick, idea 3): while Escobar builds a split or programme, a small
 * card fills in instead of a list of identical "Searching exercises…" lines. It shows what each
 * search found, then the draft days as soon as a draft exists (evaluate_plan or a proposal), and
 * the volume check's verdict. It is drawn only from this turn's stored tool calls and results.
 */
import { state } from '@/core/store';
import { findExercise } from '@/core/exercises';
import type { Activity } from '../loop';
import type { StoredMessage } from '../types';
import { ThinkingLine } from './Thinking';

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
type Use = { id: string; name: string; input: Record<string, unknown> };
type Draft = { name: string; exercises: Array<{ exerciseId: string; sets: number }> }[];

const PLAN_TOOLS = new Set(['evaluate_plan', 'propose_program', 'propose_split']);

/** Tool calls and results of the turn in progress (everything after the last message the person typed). */
export function currentTurn(messages: StoredMessage[]): { uses: Use[]; results: Map<string, { data: unknown; isError: boolean }> } {
  let start = messages.length;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.role === 'user' && !m.meta?.repair && !m.content.some(b => b.type === 'tool_result')) { start = i + 1; break; }
  }
  const uses: Use[] = [];
  const results = new Map<string, { data: unknown; isError: boolean }>();
  for (const m of messages.slice(start)) {
    if (m.role === 'assistant') for (const b of m.content) if (isObj(b) && b.type === 'tool_use') uses.push({ id: String(b.id), name: String(b.name), input: isObj(b.input) ? b.input : {} });
    if (m.role === 'user') for (const b of m.content) if (b.type === 'tool_result') {
      let data: unknown = null;
      try { data = (JSON.parse(b.content) as { data?: unknown }).data ?? null; } catch { /* error text */ }
      results.set(b.tool_use_id, { data, isError: !!b.is_error });
    }
  }
  return { uses, results };
}

/** True when this turn is building a plan: a draft or proposal, or several exercise searches. */
export function isPlanWork(uses: Use[], activity: Activity[]): boolean {
  if (uses.some(u => PLAN_TOOLS.has(u.name)) || activity.some(a => PLAN_TOOLS.has(a.name))) return true;
  return [...uses.map(u => u.name), ...activity.filter(a => !a.done).map(a => a.name)].filter(n => n === 'search_exercises').length >= 2;
}

const exName = (id: string): string => findExercise(id, state.value.customExercises)?.name ?? id.replace(/^lib_/, '').replace(/_/g, ' ');
const searchLabel = (i: Record<string, unknown>): string => String(i.pattern ?? i.muscle ?? i.query ?? i.equipment ?? 'exercise').replace(/_/g, ' ');

function latestDraft(uses: Use[]): Draft | null {
  for (let k = uses.length - 1; k >= 0; k--) {
    const u = uses[k]!;
    const d = isObj(u.input.draft) ? u.input.draft : null;
    if (d && Array.isArray(d.splits)) return (d.splits as Array<Record<string, unknown>>).map(s => ({ name: String(s.name ?? 'Day'), exercises: Array.isArray(s.exercises) ? (s.exercises as Draft[number]['exercises']) : [] }));
    if (u.name === 'propose_split' && Array.isArray(u.input.exercises)) return [{ name: String(u.input.name ?? 'New split'), exercises: u.input.exercises as Draft[number]['exercises'] }];
  }
  return null;
}

export function PlanBoard({ messages, activity }: { messages: StoredMessage[]; activity: Activity[] }) {
  const { uses, results } = currentTurn(messages);
  const searches = uses.filter(u => u.name === 'search_exercises');
  const found: Array<{ key: string; label: string; pick: string | null }> = searches.map(u => {
    const r = results.get(u.id);
    const list = r && isObj(r.data) && Array.isArray(r.data.exercises) ? (r.data.exercises as Array<{ name: string }>) : null;
    return { key: u.id, label: searchLabel(u.input), pick: r ? (list?.[0]?.name ?? '—') : null };
  });
  const pendingSearches = activity.filter(a => a.name === 'search_exercises' && !a.done && !searches.some(s => s.id === a.id)).length;
  const draft = latestDraft(uses);
  const lastEval = [...uses].reverse().find(u => u.name === 'evaluate_plan');
  const evalResult = lastEval ? results.get(lastEval.id) : undefined;
  const issues = evalResult && isObj(evalResult.data) && Array.isArray(evalResult.data.issues) ? (evalResult.data.issues as Array<{ severity: string; text: string }>) : [];
  const blocking = issues.filter(i => i.severity === 'block');
  const running = [...activity].reverse().find(a => !a.done);
  const title = draft ? `${draft.length} day${draft.length === 1 ? '' : 's'} · ${draft.map(d => d.name).join(' / ')}` : 'Picking exercises';

  return (
    <div class="plan-board" role="status" aria-live="polite">
      <div class="plan-board-head"><span class="eyebrow">Plan draft</span><b>{title}</b></div>
      {draft ? (
        <div class="plan-days">
          {draft.map((d, i) => (
            <div key={i} class="plan-day">
              <span class="plan-day-name">{d.name}</span>
              <span class="plan-day-list">{d.exercises.map(e => `${exName(e.exerciseId)} ×${e.sets}`).join(' · ') || '…'}</span>
            </div>
          ))}
        </div>
      ) : (
        <div class="plan-chips">
          {found.map(f => <span key={f.key} class={`plan-chip${f.pick ? '' : ' pending'}`}><span class="plan-chip-k">{f.label}</span>{f.pick ?? '…'}</span>)}
          {Array.from({ length: pendingSearches }, (_, i) => <span key={`p${i}`} class="plan-chip pending"><span class="plan-chip-k">searching</span>…</span>)}
          {!found.length && !pendingSearches && <span class="hint">Reading your plan and history…</span>}
        </div>
      )}
      {evalResult && (blocking.length
        ? <div class="plan-verdict warn">Adjusting: {blocking[0]!.text}</div>
        : <div class="plan-verdict ok">Weekly volume and recovery check out</div>)}
      {running ? <ThinkingLine label={running.label} /> : <ThinkingLine />}
    </div>
  );
}
