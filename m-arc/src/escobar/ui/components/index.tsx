/**
 * The closed `show` vocabulary (§4.4). Each component resolves its data locally through
 * `summarize` (the same object the model got back), so it never draws a model's number.
 * EV5 draws lift_trend; the rest render their summary as a compact card until EV6.
 */
import type { ComponentChildren } from 'preact';
import { useMemo } from 'preact/hooks';
import { state } from '@/core/store';
import { Card, Chip } from '@/ui/primitives';
import { Sparkline } from '@/ui/Sparkline';
import { EffortBars, type EffortPoint } from '@/ui/EffortBars';
import { makeCtx } from '../../tools/context';
import { summarize } from '../../tools/show';
import { stripCitationTags } from '../present';

type S = Record<string, unknown>;
const num = (v: unknown): string => (typeof v === 'number' ? String(Math.round(v * 10) / 10) : '—');

function LiftTrend({ s }: { s: S }) {
  const pts = (s.points as Array<{ day: string; value: number }>) ?? [];
  const effort = (s.effort as EffortPoint[]) ?? [];
  const unit = s.metric === 'volume' ? 'kg volume' : 'kg';
  const chip = s.plateau === 'plateaued' ? <Chip tone="warning">Stalled</Chip> : s.trend === 'up' ? <Chip tone="positive">Rising</Chip> : s.trend === 'down' ? <Chip tone="negative">Dipping</Chip> : <Chip>Steady</Chip>;
  return (
    <>
      <div class="row-between"><b class="small">{String(s.exercise)}</b>{pts.length > 1 && chip}</div>
      {pts.length > 1 ? <Sparkline points={pts.map(p => p.value)} /> : <div class="esc-comp-empty small muted">{String(s.empty ?? 'Not enough sessions to draw a line yet.')}</div>}
      {/* O4: the same effort split as History's chart, static (no tap) at Escobar's fixed height. */}
      {effort.length > 1 && <EffortBars points={effort} unit={String(s.effortUnit ?? 'kg')} tappable={false} />}
      <div class="esc-comp-stats small">
        <span><span class="muted">First</span> {num(s.first)}</span>
        <span><span class="muted">Last</span> {num(s.last)}</span>
        <span><span class="muted">Best</span> {num(s.best)} {unit}</span>
      </div>
    </>
  );
}

function Generic({ s }: { s: S }) {
  const rows = Object.entries(s).filter(([, v]) => typeof v === 'number' || typeof v === 'string').slice(0, 6);
  if (typeof s.empty === 'string') return <div class="esc-comp-empty small muted">{s.empty}</div>;
  return <div class="esc-comp-generic small">{rows.map(([k, v]) => <div key={k} class="row-between"><span class="muted">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span><span>{typeof v === 'number' ? num(v) : String(v).slice(0, 40)}</span></div>)}</div>;
}

export function ShowComponent({ component, params, caption, action }: { component: string; params: S; caption?: string; action?: ComponentChildren }) {
  const app = state.value;
  const key = JSON.stringify(params);
  // ES-28: summarising walks history; only redo it when the inputs change.
  const s = useMemo<S | null>(() => { try { return summarize(component, params, makeCtx(app)); } catch { return null; } }, [component, key, app]);
  return (
    <Card class="esc-comp" data-component={component}>
      {/* BUG-31: captions and pinned card titles are the model's own text; fact tags never show. */}
      {(caption || action) && <div class="row-between">{caption ? <div class="eyebrow">{stripCitationTags(caption)}</div> : <span />}{action}</div>}
      {!s ? <div class="esc-comp-empty small muted">Couldn’t draw that with the data on this phone.</div>
        : component === 'lift_trend' ? <LiftTrend s={s} /> : <Generic s={s} />}
    </Card>
  );
}
