import { useMemo, useState } from 'preact/hooks';
import type { Session } from '@/core/models';
import type { HeartRateSample } from './types';
import { tracePoints } from './chart';

/** Never connect across missing data, and keep enough samples to expose short peaks. */
export function TraceChart({ samples, session }: { samples: HeartRateSample[]; session: Session }) {
  const start = Date.parse(session.startedAt), end = Date.parse(session.endedAt);
  const [index, setIndex] = useState(0);
  const points = useMemo(() => tracePoints(samples, start, end), [samples, start, end]);
  if (!points.length || !Number.isFinite(end - start) || end <= start) return null;
  const low = Math.floor((points.reduce((min, p) => Math.min(min, p.bpm), 260) - 5) / 10) * 10;
  const high = Math.ceil((points.reduce((max, p) => Math.max(max, p.bpm), 20) + 5) / 10) * 10;
  const x = (time: number) => 38 + (time - start) / (end - start) * 272;
  const y = (value: number) => 118 - (value - low) / Math.max(10, high - low) * 94;
  // Min/max within each horizontal pixel preserves peaks with bounded SVG size.
  const visible = new Set<number>([0, points.length - 1]);
  const bins = new Map<number, number[]>();
  points.forEach((p, i) => {
    const bin = Math.floor(x(p.receivedAtEpochMs));
    const group = bins.get(bin) ?? []; group.push(i); bins.set(bin, group);
    if (i && p.startsSegment) { visible.add(i - 1); visible.add(i); }
  });
  for (const group of bins.values()) {
    visible.add(group[0]!); visible.add(group.at(-1)!);
    visible.add(group.reduce((a, b) => points[a]!.bpm < points[b]!.bpm ? a : b));
    visible.add(group.reduce((a, b) => points[a]!.bpm > points[b]!.bpm ? a : b));
  }
  const chosen = [...visible].sort((a, b) => a - b);
  const path = chosen.map((i, j) => {
    const p = points[i]!;
    const gap = j === 0 || p.startsSegment;
    return `${gap ? 'M' : 'L'}${x(p.receivedAtEpochMs).toFixed(1)},${y(p.bpm).toFixed(1)}`;
  }).join(' ');
  const picked = points[Math.min(index, points.length - 1)]!;
  const minute = (time: number) => ((time - start) / 60_000).toFixed(1);
  const logged = session.exercises.flatMap(e => e.sets).flatMap(s => {
    const time = Date.parse(s.loggedAt || ''); return time >= start && time <= end ? [time] : [];
  });
  return (
    <div class="watch-trace" onClick={e => e.stopPropagation()}>
      <svg viewBox="0 0 336 150" role="img" aria-label="Workout heart rate in BPM over elapsed minutes, with breaks for missing signal">
        {[low, high].map(v => <g key={v}><line x1="36" x2="318" y1={y(v)} y2={y(v)} class="chart-grid" /><text x="30" y={y(v) + 4} text-anchor="end">{v}</text></g>)}
        <path d={path} fill="none" stroke="var(--accent)" stroke-width="2" />
        {logged.map((t, i) => <line key={i} x1={x(t)} x2={x(t)} y1="122" y2="128" stroke="var(--text-3)" />)}
        <circle cx={x(picked.receivedAtEpochMs)} cy={y(picked.bpm)} r="4" fill="var(--text)" />
        <text x="38" y="145">0 min</text><text x="314" y="145" text-anchor="end">{minute(end)} min</text>
      </svg>
      <label class="small">Explore recording
        <input type="range" min="0" max={points.length - 1} value={Math.min(index, points.length - 1)}
          onInput={e => setIndex(Number((e.target as HTMLInputElement).value))} aria-label="Explore workout heart rate" />
      </label>
      <p class="hint" aria-live="polite">{minute(picked.receivedAtEpochMs)} min · {picked.bpm} BPM{logged.length ? ' · Ticks show when sets were logged.' : ''}</p>
    </div>
  );
}
