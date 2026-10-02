import { useState } from 'preact/hooks';
import { state } from '@/core/store';
import { Button, Card, CommitNumber, Field, Segmented, Sheet } from '@/ui/primitives';
import { profileCompleteness, type OnboardingTrigger } from '@/brain/onboarding';
import { GOALS, type GoalId } from '@/data/goals';
import { changeGoal, completeOnboarding, dismissOnboarding, logWeight, markWatchPrompted, reviewOnboarding, setBirthYear, setHeight, setSex, setTrainingSince } from './profile';
import { displayToKg, formatLoad, kgToDisplay } from '@/core/units';
import { parseLoad } from '@/core/parse';

/** The "help the coach know you" sheet: shown for a fresh/partial profile, a 90-day review, or a first watch connection. */
export function OnboardingSheet({ trigger, onClose }: { trigger: OnboardingTrigger; onClose: () => void }) {
  const [step, setStep] = useState<'intro' | 'form'>('intro');
  const s = state.value;
  const c = profileCompleteness(s.profile);

  // Closing the sheet always records something, so it never reopens on the very next render:
  // a review postpones the next check 90 days, a watch prompt only ever fires once, anything
  // else counts as a "Later" dismissal.
  const exit = () => {
    if (trigger === 'review') reviewOnboarding();
    else { if (trigger === 'watch') markWatchPrompted(); dismissOnboarding(); }
    onClose();
  };
  const finishForm = () => { if (trigger === 'watch') markWatchPrompted(); completeOnboarding(); onClose(); };

  if (trigger === 'review' && step === 'intro') {
    return (
      <Sheet title="Body weight" onClose={exit}>
        <div class="stack">
          <p class="small muted">Still {formatLoad(s.profile.bodyWeightKg, s.preferences.weightUnit)}?</p>
          <div class="row"><Button variant="quiet" onClick={exit}>Skip</Button><Button variant="primary" class="grow" onClick={() => setStep('form')}>Update</Button></div>
          <Button variant="quiet" size="sm" onClick={exit}>Looks right</Button>
        </div>
      </Sheet>
    );
  }

  if (step === 'intro') {
    const missing = [!c.weight && 'weight', !c.height && 'height', !c.age && 'birth year', !c.sex && 'sex'].filter(Boolean) as string[];
    return (
      <Sheet title="Your details" onClose={exit}>
        <div class="stack">
          {trigger !== 'watch' && trigger !== 'first' && <p class="small muted">Missing: {missing.join(', ')}.</p>}
          <div class="row"><Button variant="quiet" onClick={exit}>Later</Button><Button variant="primary" class="grow" onClick={() => setStep('form')}>Add my details</Button></div>
        </div>
      </Sheet>
    );
  }

  return <OnboardingForm onDone={finishForm} />;
}

function OnboardingForm({ onDone }: { onDone: () => void }) {
  const s = state.value;
  const u = s.preferences.weightUnit;
  const [weight, setWeight] = useState(s.profile.bodyWeightKg != null ? String(kgToDisplay(s.profile.bodyWeightKg, u)) : '');

  const save = () => {
    const typed = parseLoad(weight, u);
    if (typed != null && typed > 0) logWeight(displayToKg(typed, u), 'onboarding');
    onDone();
  };

  return (
    <Sheet title="Your details" onClose={onDone}>
      <div class="stack">
        <Field label={`Body weight (${u})`}><input type="text" inputMode="decimal" autofocus value={weight} onInput={e => setWeight((e.target as HTMLInputElement).value)} /></Field>
        <Field label="Height (cm)"><CommitNumber value={s.profile.heightCm} min={100} max={250} onCommit={v => setHeight(v, 'onboarding')} /></Field>
        <Field label="Birth year"><CommitNumber value={s.profile.birthYear} min={1900} max={new Date().getFullYear() - 10} integer onCommit={v => setBirthYear(v, 'onboarding')} /></Field>
        <Field label="Sex"><Segmented value={s.profile.sex} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} onChange={v => setSex(v, 'onboarding')} /></Field>
        <Field label="Training since">
          <div class="row"><input type="month" value={s.profile.trainingSince ?? ''} onInput={e => setTrainingSince((e.target as HTMLInputElement).value || undefined, 'onboarding')} /><Button variant="quiet" size="sm" onClick={() => setTrainingSince(new Date().toISOString().slice(0, 7), 'onboarding')}>I'm new</Button></div>
        </Field>
        <Field label="Training goal">
          <div class="stack-sm">
            {GOALS.map(g => (
              <Card key={g.id} class="card-press" style={{ borderColor: g.id === s.goal ? 'var(--accent)' : undefined }} onClick={() => changeGoal(g.id as GoalId, 'onboarding')}>
                <b class="small">{g.name}</b><div class="hint">{g.tagline}</div>
              </Card>
            ))}
          </div>
        </Field>
        <Button variant="primary" block onClick={save}>Save</Button>
      </div>
    </Sheet>
  );
}
