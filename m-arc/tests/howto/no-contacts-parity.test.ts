// HT-4b (HT4b-A6): golden B's copy lint holds its own copy of the LR-23 patterns (the build runs it standalone). The
// single definition is tests/guards/no-contacts.ts (ESC-NC); this pins the two copies to the same .source and .flags.
import { describe, expect, it } from 'vitest';
import * as guard from '../guards/no-contacts';

const NAMES = ['CONTACT_RE', 'SOURCE_RE', 'SOURCE_CS_RE', 'SAFETY_LINE_RE'] as const;
type Patterns = Record<(typeof NAMES)[number], RegExp>;

/** The names whose .source or .flags differ between the two copies (or that one copy lacks). */
const drift = (a: Partial<Patterns>, b: Partial<Patterns>) =>
  NAMES.filter(n => !(a[n] instanceof RegExp) || !(b[n] instanceof RegExp) || a[n]!.source !== b[n]!.source || a[n]!.flags !== b[n]!.flags);

describe('HT4b-A6: copy-lint.mjs and tests/guards/no-contacts.ts hold identical LR-23 patterns', () => {
  it('all four patterns match in .source and .flags', async () => {
    const lint = await import(/* @vite-ignore */ new URL('../../tools/plates/layers/artifact/copy-lint.mjs', import.meta.url).href);
    expect(drift(lint, guard)).toEqual([]);
  });

  it('a one-character change to either copy fails', () => {
    const edited = (re: RegExp) => new RegExp(re.source.replace('999', '998'), re.flags);
    expect(drift({ ...guard, CONTACT_RE: edited(guard.CONTACT_RE) }, guard)).toEqual(['CONTACT_RE']);
    expect(drift(guard, { ...guard, SOURCE_CS_RE: new RegExp(guard.SOURCE_CS_RE.source, 'i') })).toEqual(['SOURCE_CS_RE']);
    expect(drift(guard, { ...guard, SAFETY_LINE_RE: undefined })).toEqual(['SAFETY_LINE_RE']);
  });
});
