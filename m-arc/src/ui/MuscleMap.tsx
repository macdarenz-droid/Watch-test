/**
 * Front and back body map, drawn from the body-muscles low-poly figure.
 * Each body part is an SVG path. Parts that belong to one of the 24 muscles
 * take a fill computed from theme tokens, so the map re-skins with the theme.
 * `values` is 0–100 per muscle; `mode` chooses the colour scale.
 */
import { BACK_PARTS, BACK_VIEWBOX, FRONT_PARTS, FRONT_VIEWBOX, type BodyPart } from '@/svg/bodyMuscles';
import { MUSCLE_BY_ID, type MuscleId } from '@/data/muscles';

export type MapMode = 'recovery' | 'emphasis' | 'roles';
type Role = 'primary' | 'secondary' | 'stabilizer';

export interface MuscleMapProps {
  values: Partial<Record<MuscleId, number>>;
  mode: MapMode;
  selected?: MuscleId | null;
  onSelect?: (m: MuscleId) => void;
  /** For role mode: which muscles are primary / secondary / stabiliser. */
  roles?: Partial<Record<MuscleId, Role>>;
  compact?: boolean;
}

/** Muscles that have no region of their own borrow a neighbour's. */
const ALIAS: Partial<Record<MuscleId, MuscleId>> = { brachialis: 'biceps', rotator_cuff: 'rear_delts' };

/** Fill colour for a value, using theme tokens through color-mix. */
export function fillFor(mode: MapMode, value: number | undefined, role?: Role): string | null {
  if (mode === 'roles') {
    if (role === 'primary') return 'var(--accent)';
    if (role === 'secondary') return 'color-mix(in srgb, var(--accent) 45%, var(--map-body))';
    if (role === 'stabilizer') return 'color-mix(in srgb, var(--accent) 22%, var(--map-body))';
    return null;
  }
  if (value == null) return null;
  if (mode === 'recovery') {
    if (value >= 100) return 'var(--positive)';
    if (value >= 50) return `color-mix(in srgb, var(--positive) ${Math.round(((value - 50) / 50) * 100)}%, var(--warning))`;
    return `color-mix(in srgb, var(--warning) ${Math.round((value / 50) * 100)}%, var(--negative))`;
  }
  const pct = Math.max(14, Math.min(100, Math.round(value)));
  return `color-mix(in srgb, var(--accent) ${pct}%, var(--map-body))`;
}

function resolve(props: MuscleMapProps, muscle: MuscleId): { fill: string | null; owner: MuscleId } {
  const own = props.mode === 'roles' ? props.roles?.[muscle] : props.values[muscle];
  if (own != null) return { fill: fillFor(props.mode, props.values[muscle], props.roles?.[muscle]), owner: muscle };
  return { fill: null, owner: muscle };
}

function Body({ view, props }: { view: 'front' | 'back'; props: MuscleMapProps }) {
  const parts: BodyPart[] = view === 'front' ? FRONT_PARTS : BACK_PARTS;
  // A muscle without its own region (e.g. brachialis) paints its alias only when the alias itself is idle.
  const aliasFill = new Map<MuscleId, string>();
  for (const [from, to] of Object.entries(ALIAS) as Array<[MuscleId, MuscleId]>) {
    const f = resolve(props, from).fill;
    if (f && !resolve(props, to).fill) aliasFill.set(to, f);
  }
  return (
    <svg viewBox={view === 'front' ? FRONT_VIEWBOX : BACK_VIEWBOX} role="img" aria-label={`${view} view`} class="body-map">
      {parts.map(p => {
        if (!p.muscle) return <path key={p.id} class="body-part" d={p.d} />;
        const fill = resolve(props, p.muscle).fill ?? aliasFill.get(p.muscle) ?? null;
        const v = props.values[p.muscle];
        return (
          <path
            key={p.id}
            class={`muscle ${fill ? 'lit' : ''} ${props.selected === p.muscle ? 'selected' : ''}`}
            d={p.d}
            style={fill ? { '--muscle-fill': fill } : undefined}
            onClick={() => props.onSelect?.(p.muscle!)}
          >
            <title>{MUSCLE_BY_ID[p.muscle].label}{v != null ? ` · ${Math.round(v)}%` : ''}</title>
          </path>
        );
      })}
    </svg>
  );
}

export function MuscleMap(props: MuscleMapProps) {
  return (
    <div class={`map-wrap ${props.compact ? 'compact' : ''}`}>
      <div><Body view="front" props={props} />{!props.compact && <div class="map-label">Front</div>}</div>
      <div><Body view="back" props={props} />{!props.compact && <div class="map-label">Back</div>}</div>
    </div>
  );
}

export function MapLegend({ mode }: { mode: MapMode }) {
  const sw = (bg: string | null) => ({ background: bg ?? 'var(--map-body)' });
  if (mode === 'recovery') {
    return <div class="legend"><span><i style={sw(fillFor('recovery', 100))} />Ready</span><span><i style={sw(fillFor('recovery', 70))} />Nearly</span><span><i style={sw(fillFor('recovery', 20))} />Recovering</span></div>;
  }
  if (mode === 'roles') {
    return <div class="legend"><span><i style={sw(fillFor('roles', 0, 'primary'))} />Main</span><span><i style={sw(fillFor('roles', 0, 'secondary'))} />Helps</span><span><i style={sw(fillFor('roles', 0, 'stabilizer'))} />Stabilises</span></div>;
  }
  return <div class="legend"><span><i style={sw(fillFor('emphasis', 100))} />Most worked</span><span><i style={sw(fillFor('emphasis', 35))} />Some</span><span><i style={sw(null)} />None</span></div>;
}
