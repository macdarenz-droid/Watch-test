// COPY-2 (owner, 2026-10-01; D-COPY2-*): headings are short labels of one to three words, a noun
// phrase; never a sentence, a question, a qualifier or a leading "What", "How", "The", "This" or
// "About". The start sheet's check cards carry no explaining lines.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mastersDefaults, preSessionInsights } from '@/brain/coach/pre';
import type { Session, Split } from '@/core/models';

const read = (f: string) => readFileSync(f, 'utf8');

/** Out of scope: the How-to sheet (golden B) and the watch agent's file. */
const SKIP = [/^src\/howto\//, /^src\/slices\/howto\//, /src\/slices\/settings\/WatchLab\.tsx$/];
function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return tsxFiles(p);
    return p.endsWith('.tsx') && !SKIP.some(r => r.test(p)) ? [p] : [];
  });
}

/** Static heading text: Section, Sheet and Empty titles (plain or ternary literals), eyebrows, h1-h4 and <b> card titles. */
function headings(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(/<(?:Section|Sheet|Empty)\b[^>]*?\btitle=(?:"([^"]*)"|\{([^}]*)\})/g)) {
    if (m[1] != null) out.push(m[1]);
    else for (const l of m[2]!.matchAll(/'([^']*)'/g)) out.push(l[1]!);
  }
  for (const m of src.matchAll(/class="eyebrow[^"]*"[^>]*>([^<{]+)</g)) out.push(m[1]!);
  for (const m of src.matchAll(/<h[1-4][^>]*>([^<{]+)<\/h[1-4]>/g)) out.push(m[1]!);
  for (const m of src.matchAll(/<b(?: class="[^"]*")?>([^<{]+)<\/b>/g)) out.push(m[1]!);
  return out.map(s => s.trim()).filter(Boolean);
}

function breaksRule(h: string): string | null {
  if (/[?.!]$/.test(h)) return 'a sentence or question';
  if (/^(What|How|The|This|About)\b/.test(h)) return 'a leading What/How/The/This/About';
  if (h.split(/\s+/).length > 3) return 'more than three words';
  return null;
}

describe('COPY-2: every static heading in the app is a short label', () => {
  it('finds headings to check (never passes on nothing)', () => {
    const all = tsxFiles('src').flatMap(f => headings(read(f)));
    expect(all.length).toBeGreaterThan(60);
  });
  it('no Section, Sheet, Empty, eyebrow, h1-h4 or card title breaks the heading rule', () => {
    const bad = tsxFiles('src').flatMap(f => headings(read(f)).map(h => [f, h, breaksRule(h)] as const)).filter(x => x[2]);
    expect(bad.map(([f, h, why]) => `${f}: "${h}" (${why})`)).toEqual([]);
  });
});

/** Each rename, old → new. The old text is gone from the file and the new one is there. */
const RENAMES: Array<[string, string, string]> = [
  ['src/brain/coach/pre.ts', "title: 'A note for your age group'", "title: 'Lifters 60+'"],
  ['src/slices/history/History.tsx', 'title="Your finished workouts land here."', 'title="No sessions"'],
  ['src/slices/coach/Coach.tsx', '<h1>What to do next</h1>', '<h1>Next steps</h1>'],
  ['src/slices/coach/Coach.tsx', '>This week in one line<', '>Week summary<'],
  ['src/slices/coach/Coach.tsx', "'Worth knowing' : 'Coach tip'", "'Coach fact' : 'Coach tip'"],
  ['src/slices/coach/Coach.tsx', 'title="What the coach can see"', 'title="Coach data"'],
  ['src/slices/profile/Profile.tsx', '{c.done} of {c.of} details for the coach<', '{c.done} of {c.of} details<'],
  ['src/slices/profile/Profile.tsx', 'title="About you"', 'title="Personal details"'],
  ['src/slices/profile/Onboarding.tsx', 'title="Still accurate?"', 'title="Body weight"'],
  ['src/slices/profile/Onboarding.tsx', 'title="Help the coach know you"', 'title="Your details"'],
  ['src/slices/profile/Onboarding.tsx', '<Sheet title="Add my details"', '<Sheet title="Your details"'],
  ['src/slices/body/Body.tsx', 'title="Fully recovered"', 'title="Recovered muscles"'],
  ['src/slices/body/Body.tsx', 'title="Effective sets this week"', 'title="Effective sets"'],
  ['src/slices/today/Today.tsx', '<h2>{split.name} can wait</h2>', '<h2>{split.name}</h2>'],
  ['src/slices/today/Today.tsx', "'Set up your first workout'", "'First workout'"],
  ['src/slices/workout/Train.tsx', 'title="Where are you training?"', 'title="Gym"'],
  ['src/slices/workout/Train.tsx', 'title="No workouts yet"', 'title="No workouts"'],
  ['src/slices/workout/Train.tsx', "'Finish session?'", "'Finish session'"],
  ['src/slices/workout/Train.tsx', 'title="When did you train?"', 'title="Session time"'],
  ['src/slices/workout/Train.tsx', '<Section title="Worth knowing">', '<Section title="Coach fact">'],
  ['src/slices/workout/Train.tsx', 'title="Muscles worked today"', 'title="Muscles worked"'],
  ['src/app/ErrorBoundary.tsx', '<b>Something went wrong on this screen</b>', '<b>Screen error</b>'],
  ['src/escobar/ui/PlanBoard.tsx', '>Building your plan<', '>Plan draft<'],
  ['src/escobar/ui/MemoryScreen.tsx', 'title="What Escobar knows"', 'title="Memory"'],
  ['src/escobar/ui/Hall.tsx', '>What Escobar knows<', '>Memory<'],
  ['src/escobar/ui/SettingsSection.tsx', '>What Escobar knows<', '>Memory<'],
  ['src/escobar/ui/EscobarSheet.tsx', '>What Escobar knows<', '>Memory<'],
  ['src/slices/today/Today.tsx', '<Section title="This week"', '<Section title="Current week"'],
  ['src/slices/history/History.tsx', '<div class="eyebrow">This week</div>', '<div class="eyebrow">Current week</div>'],
  ['src/slices/workout/Train.tsx', "`Before you start ${split.name}`", "title={checkIn ? 'Quick check-in' : split.name}"],
];

describe('COPY-2: renamed headings', () => {
  it.each(RENAMES)('%s: %s → %s', (file, old, now) => {
    const src = read(file);
    expect(src).not.toContain(old);
    expect(src).toContain(now);
  });
  it('the coach map names each renamed place by its new heading', () => {
    const reg = read('src/escobar/palace/registry.ts');
    for (const [id, title] of [['body.full', 'Recovered muscles'], ['body.week-volume', 'Effective sets'], ['coach.week-line', 'Week summary'], ['coach.sees', 'Coach data'], ['panel.memory', 'Memory'], ['profile.about', 'Personal details'], ['today.week', 'Current week'], ['history.week', 'Current week']]) {
      expect(reg).toContain(`e('${id}', '${title}',`);
    }
    expect(reg).not.toMatch(/What the coach can see|What Escobar knows|About you|Worth knowing|This week in one line|Fully recovered|Effective sets this week|'This week'|This week in numbers/);
  });
});

describe('COPY-2: the start sheet check cards carry no explaining line', () => {
  const bench = 'barbell_bench_press';
  const split: Split = { id: 'split_push', name: 'Push', color: '#fff', exercises: [{ exerciseId: bench, sets: 3 }], focus: [], createdAt: '2026-01-01' };
  const sessions = ['2026-09-01', '2026-09-05', '2026-09-09', '2026-09-13'].map((day, i) => ({
    id: `s${i}`, splitId: 'split_push', splitName: 'Push', day, startedAt: `${day}T10:00:00.000Z`, durationSec: 3600,
    logging: { mode: 'live' }, exercises: [{ exerciseId: bench, sets: [1, 2, 3].map(() => ({ kg: 60 + i, reps: 8, effort: 'ideal', done: true })) }],
  })) as unknown as Session[];
  const out = preSessionInsights({ sessions, custom: [], today: '2026-09-18', split, profile: { name: 'Test' }, age: null, targetFor: () => ({ kg: 62.5, target: '62.5 kg × 8' }) });
  it('the target load card shows the target only', () => {
    const t = out.find(i => i.id === `pre:load-target:${bench}`)!;
    expect(t.means).toBe('');
    expect(t.noticed).toBe('');
    expect(t.action).toBe('Start around 62.5 kg × 8.');
  });
  it('the warm-up card shows the ramp only', () => {
    const w = out.find(i => i.id === `pre:warmup:${bench}`)!;
    expect(w.means).toBe('');
    expect(w.noticed).toBe('');
    expect(w.action).toMatch(/^32.5 x 8, 45 x 5, 52.5 x 2/);
  });
  it('the 60+ card keeps its guidelines under a short title', () => {
    const m = mastersDefaults(61)!;
    expect(m.title).toBe('Lifters 60+');
    expect(m.means).toMatch(/^2 to 3 sessions a week/);
  });
});

describe('COPY-2: the start sheet renders no empty explaining line', () => {
  it('the brief card shows means only when there is one', () => {
    const src = read('src/slices/workout/Train.tsx');
    const body = src.slice(src.indexOf('function PreSessionBody'), src.indexOf('function', src.indexOf('function PreSessionBody') + 10));
    expect(body).toContain('{i.means && <p class="small muted" style={{ marginTop: 4 }}>{i.means}</p>}');
    expect(body).not.toMatch(/^\s*<p class="small muted" style=\{\{ marginTop: 4 \}\}>\{i\.means\}<\/p>$/m);
  });
});
