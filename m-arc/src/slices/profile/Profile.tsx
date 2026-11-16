import { usePalaceFocus } from '@/escobar/palace/focus';
import { useState } from 'preact/hooks';
import { state } from '@/core/store';
import { Button, Card, CommitNumber, Field, Row, Section, Segmented, Sheet } from '@/ui/primitives';
import { showToast } from '@/app/toast';
import { formatLocalStamp } from '@/core/dates';
import { displayToKg, formatLoad, kgToDisplay } from '@/core/units';
import { parseLoad } from '@/core/parse';
import { profileCompleteness, isWeightTypo } from '@/brain/onboarding';
import { GOAL_BY_ID } from '@/data/goals';
import { GoalSheet } from '@/slices/coach/Coach';
import { lastChangeAt, logWeight, setBirthYear, setHeight, setPlannedDays, setSex, setTrainingSince } from './profile';

/** BUG-8: honest hints — a saved value never reads "Not set" just because it has no history entry
 * (onboarding, an import, Health Connect or a backup restore skip `profileHistory`). */
export function statusHint(value: unknown, at: string | undefined): string {
  if (value == null) return 'Not set';
  return at ? `Updated ${formatLocalStamp(at)}` : 'Saved';
}

export function Profile({ onClose }: { onClose: () => void }) {
  const s = state.value;
  const c = profileCompleteness(s.profile);
  const [goalOpen, setGoalOpen] = useState(false);
  const goal = GOAL_BY_ID[s.goal];
  usePalaceFocus('profile.about');

  return (
    <Sheet title="Your profile" onClose={onClose}>
      <div class="stack">
        <Card class="card-quiet">
          <div class="eyebrow">{c.done} of {c.of} details</div>
        </Card>

        <Section title="Personal details" palace="profile.about">
          <Card class="stack-sm">
            <Field label="Birth year">
              <CommitNumber value={s.profile.birthYear} min={1900} max={new Date().getFullYear() - 10} integer onCommit={v => setBirthYear(v)} />
              <span class="hint">{statusHint(s.profile.birthYear, lastChangeAt(s.profileHistory, 'birthYear'))}</span>
            </Field>
            <Field label="Sex">
              <Segmented value={s.profile.sex} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} onChange={v => setSex(v)} />
              <span class="hint">{statusHint(s.profile.sex, lastChangeAt(s.profileHistory, 'sex'))}</span>
            </Field>
            <Field label="Height (cm)">
              <CommitNumber value={s.profile.heightCm} min={100} max={250} onCommit={v => setHeight(v)} />
              <span class="hint">{statusHint(s.profile.heightCm, lastChangeAt(s.profileHistory, 'heightCm'))}</span>
            </Field>
          </Card>
        </Section>

        <Section title="Body" palace="profile.weigh-in">
          <Card class="stack-sm">
            <WeighIn />
            <span class="hint">{statusHint(s.profile.bodyWeightKg, lastChangeAt(s.profileHistory, 'bodyWeightKg'))} · {s.weightLog.length} weigh-in{s.weightLog.length === 1 ? '' : 's'} logged</span>
          </Card>
        </Section>

        <Section title="Training" palace="profile.training" aside={<Button variant="quiet" size="sm" onClick={() => setGoalOpen(true)}>Change goal</Button>}>
          <Card class="stack-sm">
            <Row trailing={<span class="hint">{goal.name}</span>}><span class="small">Goal</span></Row>
            <Field label="Training since">
              <div class="row">
                <input type="month" value={s.profile.trainingSince ?? ''} onInput={e => setTrainingSince((e.target as HTMLInputElement).value || undefined)} />
                <Button variant="quiet" size="sm" onClick={() => setTrainingSince(new Date().toISOString().slice(0, 7))}>I'm new</Button>
              </div>
            </Field>
            <Field label="Planned days per week">
              <div class="row"><Button variant="quiet" size="sm" onClick={() => setPlannedDays(Math.max(1, (s.profile.plannedDays ?? 3) - 1))}>−</Button>{s.profile.plannedDays != null ? <b class="num small">{s.profile.plannedDays}</b> : <span class="small muted" data-testid="planned-days-unset">not set</span>}<Button variant="quiet" size="sm" onClick={() => setPlannedDays(Math.min(7, (s.profile.plannedDays ?? 3) + 1))}>+</Button></div>
            </Field>
          </Card>
        </Section>
      </div>
      {goalOpen && <GoalSheet onClose={() => setGoalOpen(false)} />}
    </Sheet>
  );
}

/** Body weight is typed and shown in the display unit and stored in kg (UI-18, RG-09). */
function WeighIn() {
  const s = state.value;
  const u = s.preferences.weightUnit;
  const [value, setValue] = useState(s.profile.bodyWeightKg != null ? String(kgToDisplay(s.profile.bodyWeightKg, u)) : '');
  const [confirming, setConfirming] = useState(false);

  const save = () => {
    const typed = parseLoad(value, u);
    if (typed == null || typed <= 0) return;
    const kg = displayToKg(typed, u);
    if (!confirming && isWeightTypo(kg, s.profile.bodyWeightKg)) { setConfirming(true); return; }
    logWeight(kg);
    setConfirming(false);
    showToast('Saved');
  };

  return (
    <Field label={`Body weight (${u})`}>
      <div class="row"><input type="text" inputMode="decimal" value={value} onInput={e => { setValue((e.target as HTMLInputElement).value); setConfirming(false); }} /><Button size="sm" onClick={save}>Weigh in</Button></div>
      {confirming && <Card class="card-quiet"><p class="small">That's a big jump from {formatLoad(s.profile.bodyWeightKg, u)}. Save anyway?</p><div class="row" style={{ marginTop: 8 }}><Button variant="quiet" size="sm" onClick={() => setConfirming(false)}>Cancel</Button><Button size="sm" onClick={save}>Save {value} {u}</Button></div></Card>}
    </Field>
  );
}
