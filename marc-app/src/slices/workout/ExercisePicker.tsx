import { useState } from 'preact/hooks';
import { Button, Chip, Field, Sheet } from '@/ui/primitives';
import { makeCustomExercise, searchExercises } from '@/core/exercises';
import type { Exercise, ResistanceMode } from '@/core/models';
import { MUSCLES, muscleLabel } from '@/data/muscles';
import { state } from '@/core/store';
import { saveCustomExercise } from './splits';

export function ExercisePicker({ onPick, onClose, exclude = [] }: { onPick: (ex: Exercise) => void; onClose: () => void; exclude?: string[] }) {
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState(false);
  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState('Machine');
  const [primary, setPrimary] = useState<string[]>([]);
  const [mode, setMode] = useState<ResistanceMode>('weighted');
  const results = searchExercises(q, state.value.customExercises).filter(e => !exclude.includes(e.id));

  const create = () => {
    if (!name.trim() || !primary.length) return;
    const ex = makeCustomExercise({ name, equipment, primary, mode });
    saveCustomExercise(ex);
    onPick(ex);
  };

  return (
    <Sheet title={custom ? 'New exercise' : 'Add exercise'} onClose={onClose}>
      {!custom ? (
        <div class="stack">
          <input autofocus placeholder="Search, e.g. chest press, lat pulldown" value={q} onInput={e => setQ((e.target as HTMLInputElement).value)} />
          <div class="list">
            {results.map(e => (
              <div key={e.id} class="list-row pressable" onClick={() => onPick(e)}>
                <div class="grow">
                  <div>{e.name}</div>
                  <div class="hint">{e.equipment} · {e.primary.map(muscleLabel).join(', ') || 'custom'}</div>
                </div>
                <span class="chip">Add</span>
              </div>
            ))}
            {!results.length && <p class="muted small" style={{ padding: '12px 0' }}>Nothing matches. You can create it below.</p>}
          </div>
          <Button variant="quiet" onClick={() => { setCustom(true); setName(q); }}>Create a custom exercise</Button>
        </div>
      ) : (
        <div class="stack">
          <Field label="Name"><input value={name} onInput={e => setName((e.target as HTMLInputElement).value)} placeholder="e.g. Cable Y-raise" /></Field>
          <Field label="Equipment">
            <select value={equipment} onChange={e => setEquipment((e.target as HTMLSelectElement).value)}>
              {['Machine', 'Cable', 'Dumbbells', 'Barbell', 'Smith Machine', 'Bodyweight', 'Kettlebell', 'Band', 'Other'].map(x => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="How resistance works" hint="Decides what progress means for this exercise.">
            <select value={mode} onChange={e => setMode((e.target as HTMLSelectElement).value as ResistanceMode)}>
              <option value="weighted">Weighted: more load is progress</option>
              <option value="bodyweight">Bodyweight: more reps is progress</option>
              <option value="assisted">Assisted: less help is progress</option>
              <option value="duration">Timed hold: longer is progress</option>
              <option value="conditioning">Carry or sled: further or longer at the same load</option>
            </select>
          </Field>
          <Field label="Main muscles (pick one or two)">
            <div class="wrap">
              {MUSCLES.map(m => <Chip key={m.id} pressed={primary.includes(m.id)} onClick={() => setPrimary(p => (p.includes(m.id) ? p.filter(x => x !== m.id) : [...p, m.id].slice(-2)))}>{m.label}</Chip>)}
            </div>
          </Field>
          <div class="row"><Button variant="quiet" onClick={() => setCustom(false)}>Back</Button><Button variant="primary" class="grow" disabled={!name.trim() || !primary.length} onClick={create}>Create and add</Button></div>
        </div>
      )}
    </Sheet>
  );
}
