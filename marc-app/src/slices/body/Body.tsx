import { useMemo, useState } from 'preact/hooks';
import { state, update } from '@/core/store';
import { recovery, today, unit } from '@/app/selectors';
import { Button, Card, Chip, Field, Row, Section, Segmented, Sheet, Stat } from '@/ui/primitives';
import { MapLegend, MuscleMap, type MapMode } from '@/ui/MuscleMap';
import { MUSCLES, MUSCLE_BY_ID, muscleLabel, type MuscleId } from '@/data/muscles';
import { formatDay, formatHours } from '@/core/dates';
import { trainingLevels, weeklyMuscleSets, LEVELS } from '@/brain/exposure';
import { navyBodyFat } from '@/brain/bodyfat';
import { LIBRARY } from '@/core/exercises';
import { exerciseHistory } from '@/brain/history';
import { formatLoad } from '@/core/units';

type View = 'recovery' | 'levels' | 'week';

export function Body() {
  const s = state.value;
  const [view, setView] = useState<View>('recovery');
  const [selected, setSelected] = useState<MuscleId | null>(null);
  const rec = recovery.value;
  const levels = useMemo(() => trainingLevels(s.sessions, s.customExercises), [s.sessions]);
  const weekSets = useMemo(() => weeklyMuscleSets(s.sessions, today.value, 1, s.customExercises)[0]?.sets ?? {}, [s.sessions, today.value]);
  const maxWeek = Math.max(1, ...Object.values(weekSets).map(v => v ?? 0));

  const values: Partial<Record<MuscleId, number>> = view === 'recovery'
    ? Object.fromEntries(rec.filter(r => r.lastTrainedAt).map(r => [r.muscle, r.pct]))
    : view === 'levels'
      ? Object.fromEntries(MUSCLES.map(m => [m.id, levels[m.id].levelIndex ? (levels[m.id].levelIndex / (LEVELS.length - 1)) * 100 : undefined]))
      : Object.fromEntries((Object.entries(weekSets) as Array<[MuscleId, number]>).map(([m, v]) => [m, (v / maxWeek) * 100]));
  const mode: MapMode = view === 'recovery' ? 'recovery' : 'emphasis';
  const recovering = rec.filter(r => r.recovering).sort((a, b) => a.pct - b.pct);
  const readyList = rec.filter(r => !r.recovering && r.lastTrainedAt);

  return (
    <div class="view">
      <div class="topbar"><div><div class="eyebrow">Body</div><h1>Muscle map</h1></div></div>
      <Segmented value={view} onChange={setView} options={[{ value: 'recovery', label: 'Recovery' }, { value: 'week', label: 'This week' }, { value: 'levels', label: 'Levels' }]} />
      <Card style={{ marginTop: 14 }}>
        <MuscleMap values={values} mode={mode} selected={selected} onSelect={m => setSelected(m)} />
        <div style={{ marginTop: 10 }}><MapLegend mode={mode} /></div>
        <p class="hint" style={{ marginTop: 8 }}>Tap a muscle for details. {view === 'recovery' ? 'Recovery time depends on how hard you trained it: about a day after easy work, up to three days after max effort.' : view === 'week' ? 'Shading follows effective sets this week.' : 'Levels are a relative measure of how much you have trained each muscle. Not a medical measurement.'}</p>
      </Card>

      {view === 'recovery' && (
        <>
          <Section title="Recovering" aside={<span class="small muted">{recovering.length}</span>}>
            <Card>
              {!recovering.length && <p class="small muted">{readyList.length ? 'Everything you have trained is ready to go.' : 'Nothing logged yet.'}</p>}
              <div class="list">{recovering.map(r => <Row key={r.muscle} onClick={() => setSelected(r.muscle)} trailing={<span class="hint num">{formatHours(r.hoursLeft)} left</span>}><div class="row-between small"><span>{muscleLabel(r.muscle)}</span><span class="muted">{r.pct}%</span></div><div class="bar" style={{ marginTop: 4 }}><i style={{ width: `${r.pct}%`, background: r.pct >= 75 ? 'var(--positive)' : r.pct >= 40 ? 'var(--warning)' : 'var(--negative)' }} /></div></Row>)}</div>
            </Card>
          </Section>
          <Section title="Fully recovered" aside={<span class="small muted">{readyList.length}</span>}>
            <Card><div class="wrap">{readyList.map(r => <Chip key={r.muscle} tone="positive" onClick={() => setSelected(r.muscle)}>{muscleLabel(r.muscle)}</Chip>)}{!readyList.length && <span class="small muted">Trained muscles show here once their recovery window has passed.</span>}</div></Card>
          </Section>
        </>
      )}

      {view === 'levels' && (
        <Section title="Training levels">
          <Card><div class="list">{MUSCLES.map(m => levels[m.id]).map((l, i) => ({ l, m: MUSCLES[i]! })).sort((a, b) => b.l.score - a.l.score).map(({ l, m }) => <Row key={m.id} onClick={() => setSelected(m.id)} trailing={<Chip tone={l.levelIndex >= 4 ? 'accent' : undefined}>{l.level}</Chip>}><span class="small">{m.label}</span></Row>)}</div></Card>
        </Section>
      )}

      {view === 'week' && (
        <Section title="Effective sets this week">
          <Card><div class="list">{(Object.entries(weekSets) as Array<[MuscleId, number]>).sort((a, b) => b[1] - a[1]).map(([m, v]) => <Row key={m} onClick={() => setSelected(m)} trailing={<span class="num small">{v}</span>}><span class="small">{muscleLabel(m)}</span></Row>)}{!Object.keys(weekSets).length && <p class="small muted">No sets logged this week yet.</p>}</div></Card>
        </Section>
      )}

      <BodyFat />
      {selected && <MuscleDetail muscle={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function MuscleDetail({ muscle, onClose }: { muscle: MuscleId; onClose: () => void }) {
  const s = state.value;
  const u = unit.value;
  const r = recovery.value.find(x => x.muscle === muscle)!;
  const info = MUSCLE_BY_ID[muscle];
  const levels = trainingLevels(s.sessions, s.customExercises)[muscle];
  const direct = [...s.customExercises, ...LIBRARY].filter(e => e.primary.includes(muscle));
  const logged = direct.map(e => ({ e, h: exerciseHistory(s.sessions, e.id, s.customExercises) })).filter(x => x.h.length).sort((a, b) => b.h[b.h.length - 1]!.day.localeCompare(a.h[a.h.length - 1]!.day));
  return (
    <Sheet title={info.label} onClose={onClose}>
      <div class="stack">
        <div class="grid-3">
          <Stat value={r.lastTrainedAt ? `${r.pct}%` : '—'} label="recovered" tone={r.recovering ? (r.pct < 40 ? 'negative' : 'warning') : 'positive'} />
          <Stat value={r.lastDay ? formatDay(r.lastDay) : 'never'} label="last trained" />
          <Stat value={levels.level} label="level" />
        </div>
        {r.recovering && <p class="small muted">About {formatHours(r.hoursLeft)} until fully recovered{r.personalized ? '. This window is widened from your own history.' : '.'}</p>}
        <div>
          <div class="eyebrow" style={{ marginBottom: 6 }}>Your exercises for this muscle</div>
          {!logged.length && <p class="small muted">Nothing logged for this muscle yet.</p>}
          <div class="list">{logged.slice(0, 6).map(({ e, h }) => { const last = h[h.length - 1]!; return <Row key={e.id} trailing={<span class="hint">{formatDay(last.day)}</span>}><div class="small">{e.name}</div><div class="hint">{last.topKg ? `${formatLoad(last.topKg, u)} × ${last.topReps}` : `${last.bestReps || last.bestDurationSec} ${last.bestDurationSec ? 's' : 'reps'}`} · {h.length} sessions</div></Row>; })}</div>
        </div>
        <div>
          <div class="eyebrow" style={{ marginBottom: 6 }}>Exercises that target it directly</div>
          <div class="wrap">{direct.slice(0, 10).map(e => <Chip key={e.id}>{e.name}</Chip>)}</div>
        </div>
      </div>
    </Sheet>
  );
}

function BodyFat() {
  const s = state.value;
  const [open, setOpen] = useState(false);
  const [sex, setSex] = useState<'male' | 'female'>(s.profile.sex ?? 'male');
  const [height, setHeight] = useState(String(s.profile.heightCm ?? ''));
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const last = s.body[s.body.length - 1];
  const result = navyBodyFat({ sex, heightCm: parseFloat(height), neckCm: parseFloat(neck), waistCm: parseFloat(waist), hipCm: parseFloat(hip) || undefined });
  const save = () => {
    if (result == null) return;
    update(x => ({ ...x, profile: { ...x.profile, sex, heightCm: parseFloat(height) || x.profile.heightCm }, body: [...x.body, { day: today.value, neckCm: parseFloat(neck), waistCm: parseFloat(waist), hipCm: parseFloat(hip) || undefined, bodyFatPct: result }] }));
    setOpen(false);
  };
  return (
    <Section title="Body fat estimate" aside={<Button variant="quiet" size="sm" onClick={() => setOpen(true)}>{last ? 'New reading' : 'Measure'}</Button>}>
      <Card>
        {last ? <div class="row-between"><Stat value={`${last.bodyFatPct}%`} label={`on ${formatDay(last.day)}`} />{s.body.length > 1 && <span class="small muted">{s.body.length} readings · first {s.body[0]!.bodyFatPct}%</span>}</div> : <p class="small muted">Tape-measure estimate using the US Navy method. Track the trend, not one reading.</p>}
      </Card>
      {open && (
        <Sheet title="Body fat estimate" onClose={() => setOpen(false)}>
          <div class="stack">
            <Segmented value={sex} onChange={setSex} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
            <div class="grid-2">
              <Field label="Height (cm)"><input type="number" value={height} onInput={e => setHeight((e.target as HTMLInputElement).value)} /></Field>
              <Field label="Neck (cm)"><input type="number" value={neck} onInput={e => setNeck((e.target as HTMLInputElement).value)} /></Field>
              <Field label="Waist (cm)"><input type="number" value={waist} onInput={e => setWaist((e.target as HTMLInputElement).value)} /></Field>
              {sex === 'female' && <Field label="Hip (cm)"><input type="number" value={hip} onInput={e => setHip((e.target as HTMLInputElement).value)} /></Field>}
            </div>
            <Card class="card-quiet"><Stat value={result != null ? `${result}%` : '—'} label="estimated body fat" /></Card>
            <p class="hint">Typically within 3 to 4 points of lab methods. Not a medical measurement.</p>
            <Button variant="primary" disabled={result == null} onClick={save}>Save reading</Button>
          </div>
        </Sheet>
      )}
    </Section>
  );
}
