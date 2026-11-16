// HT6-A8 (critic fix 8): the push grip hint on the Train card. One `p.hint.muted`, whose text is only ever
// HOWTO_HINTS[ex.id] (generated from golden B's handling.cue by HT-5), behind `ex && !ex.custom &&`. Gate block HT-6
// shows it on screen once, and absent for a non-push How-to, a no-How-to exercise and a custom exercise.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOWTO_HINTS, HOWTO_IDS } from '@/howto/ids';
import { LOADERS } from '@/howto/generated';

const walk = (d: string): string[] => readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const TRAIN = readFileSync('src/slices/workout/Train.tsx', 'utf8');
/** The one hint line, as the plan writes it (2.4). */
export const HINT_LINE = /\{ex && !ex\.custom && hasHowTo\(ex\.id\) && HOWTO_HINTS\[ex\.id\] && <p class="hint muted">\{HOWTO_HINTS\[ex\.id\]\}<\/p>\}/;
/** Every problem of Train.tsx's hint wiring; [] when it is the plan's one line. */
export function hintProblems(src: string): string[] {
  const bad: string[] = [];
  const uses = src.split('\n').filter(l => l.includes('HOWTO_HINTS') && !/^import /.test(l.trim()));
  if (uses.length !== 1) bad.push(`HOWTO_HINTS used on ${uses.length} lines`);
  if (!HINT_LINE.test(src)) bad.push('the hint line is not `{ex && !ex.custom && hasHowTo(ex.id) && HOWTO_HINTS[ex.id] && <p class="hint muted">{HOWTO_HINTS[ex.id]}</p>}`');
  return bad;
}

describe('HT6-A8: the push hint', () => {
  it('HOWTO_HINTS holds golden B\'s cue for push exercises with an approved How-to, and nothing else', async () => {
    const keys = Object.keys(HOWTO_HINTS);
    expect(keys.length).toBeGreaterThan(0);
    for (const id of keys) expect(HOWTO_IDS as readonly string[]).toContain(id);
    for (const id of HOWTO_IDS) {
      const h = (await LOADERS[id]()).default as unknown as { handling?: { archetype: string; cue?: string } };
      if (h.handling?.archetype === 'push') expect(HOWTO_HINTS[id], id).toBe(h.handling.cue);
      else expect(HOWTO_HINTS[id], id).toBeUndefined();
    }
  });
  it('Train.tsx renders only HOWTO_HINTS[ex.id], behind ex && !ex.custom &&, in one p.hint.muted', () => {
    expect(hintProblems(TRAIN)).toEqual([]);
  });
  it('failure path: dropping !ex.custom, typing the text, or a second use fails', () => {
    expect(hintProblems(TRAIN.replace('ex && !ex.custom && hasHowTo(ex.id) && HOWTO_HINTS', 'ex && hasHowTo(ex.id) && HOWTO_HINTS'))).not.toEqual([]);
    expect(hintProblems(TRAIN.replace('<p class="hint muted">{HOWTO_HINTS[ex.id]}</p>', '<p class="hint muted">Heel of palm, wrist straight.</p>'))).not.toEqual([]);
    expect(hintProblems(`${TRAIN}\nconst x = HOWTO_HINTS;`)).not.toEqual([]);
  });
  it('no hint text is typed in any .tsx file', () => {
    const tsx = walk('src').filter(f => f.endsWith('.tsx')).map(f => [f, readFileSync(f, 'utf8')] as const);
    for (const t of Object.values(HOWTO_HINTS)) for (const [f, s] of tsx) expect(s.includes(t!), `${f} types "${t}"`).toBe(false);
  });
});
