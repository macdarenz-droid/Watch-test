// HT-5: content.mjs generates HowToContent from the vendored golden-B *.howto.mjs for the 8 approved exercises;
// nobody types it a second time. Proves HT5-A1 (generated, not typed: every string === golden B, and a field the
// mapping drops fails field coverage), HT5-A2 (the content checks green on all 8) and HT5-A4 (HOWTO_HINTS,
// ids.ts's budget).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Source } from '../../src/howto/content-types';
import exercises from '../../src/data/exercises.json';
import { COVERAGE } from '../../src/howto/coverage';
import { checkC1 } from './checks/c1';
import { checkC2 } from './checks/c2';
import { checkC3 } from './checks/c3';
import { checkC4 } from './checks/c4';
import { checkC6 } from './checks/c6';
import { checkC7 } from './checks/c7';
import { checkC8 } from './checks/c8';
import { checkC16 } from './checks/c16';
import { checkC17 } from './checks/c17';
import { checkC19Copy, checkC19Files, checkC19Shared, filesUnder, type CopyField, type SourceName } from './checks/c19';

const url = (p: string) => new URL(`../../${p}`, import.meta.url).href;
/* eslint-disable @typescript-eslint/no-explicit-any */
let content: any;
const rows = JSON.parse(readFileSync('tools/plates/plates.json', 'utf8')) as Record<string, { slug: string }>;
const IDS = Object.keys(rows);

/** BuiltHowTo's content-only fields (module layout 2.3): what content.mjs actually persists into ht-<slug>.ts.
 *  `zooms` is narrowed to descriptors (checked separately below, HT-6/supervisor ruling on PR #116); `feel` is
 *  golden B too, but it is HT-8's own generated file, so it is excluded here. */
const BASE_KEYS = ['rev', 'extends', 'handling', 'contacts', 'setup', 'posture', 'chips', 'copy', 'mistakes', 'risks', 'riskFlags', 'redFlag', 'sources', 'research'] as const;
const DESCRIPTOR_KEYS = ['key', 'chip', 'chipCaption', 'heading', 'kind', 'feelRow'] as const;

// This suite never calls `generate.render()` with the real plugins: that runs plates.mjs's full L1 gallery rebuild
// (HT-4's own page-rebuild costs the same way), which belongs in the gate's `generate --check` (scripts/
// screenshot-gate.mjs), once, not in every `npm test` run (HT-7 report on PR #116; supervisor-reported timeout in
// CI). Everything below either loads the small, static vendored `*.howto.mjs` files directly (`loadContent`, no
// gallery involved) or reads the already-committed generated output, whose freshness the gate proves separately.
let all: { byId: Map<string, any>; sourcesById: Map<string, any> };

beforeAll(async () => {
  content = await import(/* @vite-ignore */ url('tools/plates/gen/content.mjs'));
  const byId = new Map<string, any>(), sourcesById = new Map<string, any>();
  for (const id of IDS) {
    const { content: c, sources } = await content.loadContent(id);
    byId.set(id, c);
    sourcesById.set(id, sources);
  }
  all = { byId, sourcesById };
});

/** Every id's full normalized content (used for the checks) plus its raw SOURCES, computed once in beforeAll. */
async function loadAll() {
  return all;
}

describe('HT5-A1: generated, not typed', () => {
  it('every content field ht-<slug>.ts holds is === the value content.mjs derived from the vendored golden-B file', async () => {
    const { byId } = await loadAll();
    for (const [id, c] of byId) {
      const mod = await import(/* @vite-ignore */ url(`src/howto/generated/ht-${rows[id]!.slug}.ts`));
      const built = mod.default;
      for (const k of BASE_KEYS) {
        if (c[k] === undefined) expect(built[k], `${id}.${k}`).toBeUndefined();
        else expect(built[k], `${id}.${k}`).toEqual(c[k]);
      }
      expect(built.feel, `${id}.feel must stay absent (HT-8's file)`).toBeUndefined();

      // zooms: the base chunk holds only the S0 chip-row descriptor per zoom, === golden B, golden-B order; the
      // rendered crop/hand strings stay out (HT-7's/HT-6's own lazy chunks).
      expect(built.zooms, `${id}.zooms`).toHaveLength(c.zooms.length);
      built.zooms.forEach((d: any, i: number) => {
        const z = c.zooms[i];
        expect(Object.keys(d).sort(), `${id}.zooms[${i}] keys`).toEqual(DESCRIPTOR_KEYS.filter(k => z[k] !== undefined).sort());
        for (const k of DESCRIPTOR_KEYS) if (z[k] !== undefined) expect(d[k], `${id}.zooms[${i}].${k}`).toEqual(z[k]);
      });
    }
  });

  it('the committed module holds the literal cue string a hand edit would change (freshness itself is `generate --check` in the gate, not a unit test: review finding, PR #116)', () => {
    const path = `src/howto/generated/ht-${rows['lib_machine_chest_press']!.slug}.ts`;
    const committed = readFileSync(path, 'utf8');
    expect(committed).toContain('Heel of palm, wrist straight.');
    const tampered = committed.replace('Heel of palm, wrist straight.', 'Something else entirely.');
    expect(tampered).not.toBe(committed);
  });

  it('a mapping that drops a golden-B field fails field coverage: baseFieldsText only emits known BuiltHowTo keys', () => {
    const withExtra = { rev: 1, bogus: 'nope' };
    const text = content.baseFieldsText(withExtra);
    expect(text).not.toContain('bogus');
    expect(text).toContain('rev: 1');
  });

  // Review finding (PR #116, Medium): the test above only shows an *unknown* key is dropped; nothing checked that
  // every key the 8 vendored files actually use is *mapped*. A field added to golden B with no home in BASE_KEYS
  // would silently vanish from the app. ALWAYS_OK mirrors the reviewer's own allowance ({schema, id, name, plate,
  // zooms, feel}); PAGE_ONLY_KEYS (content.mjs) is the named list for the rest (today: `openItems`, leg_press).
  const ALWAYS_OK = ['schema', 'id', 'name', 'plate', 'zooms', 'feel'];
  const knownKeys = () => new Set([...content.BASE_KEYS, ...ALWAYS_OK, ...content.PAGE_ONLY_KEYS]);

  it('every key the 8 vendored golden-B files use is in BASE_KEYS, {schema,id,name,plate,zooms,feel}, or PAGE_ONLY_KEYS', async () => {
    const known = knownKeys(), keys = new Set<string>();
    for (const id of IDS) {
      const mod = await import(/* @vite-ignore */ url(`tools/plates/layers/exercises/${id.slice(4)}.howto.mjs`));
      for (const k of Object.keys(mod.default)) keys.add(k);
    }
    const unmapped = [...keys].filter(k => !known.has(k));
    expect(unmapped, 'add the field to content.mjs\'s BASE_KEYS (persisted) or PAGE_ONLY_KEYS (page-only, named), and record it in COACHING-DECISIONS.md').toEqual([]);
  });

  it('reproduces the reviewer\'s mutation in memory: a new golden-B field with no home (e.g. leg_press + `warmup`) fails the check above', async () => {
    const known = knownKeys();
    const legPress = (await import(/* @vite-ignore */ url('tools/plates/layers/exercises/leg_press.howto.mjs'))).default;
    const mutatedKeys = Object.keys({ ...legPress, warmup: 'Two light sets first.' });
    const unmapped = mutatedKeys.filter(k => !known.has(k));
    expect(unmapped).toEqual(['warmup']);
  });
});

function sourcesRegistry(): Record<string, Source> {
  const text = readFileSync('docs/research/howto/sources.json', 'utf8').replace(/^\/\/[^\n]*\n/, '');
  return JSON.parse(text) as Record<string, Source>;
}

describe('HT5-A2: the content checks (C1-C4, C6-C8, C16, C17) pass on the generated content of all 8', () => {
  it('every source carries access and checked (no nulls) and every field cross-references clean', () => {
    const SOURCES = sourcesRegistry();
    for (const [sid, s] of Object.entries(SOURCES)) {
      expect(s.access, `sources.json ${sid}.access`).not.toBeNull();
      expect(s.checked, `sources.json ${sid}.checked`).not.toBeNull();
    }
  });

  it('C1, C2, C3, C4, C6, C7, C8, C16, C17: no findings', async () => {
    const SOURCES = sourcesRegistry();
    const { byId } = await loadAll();
    const knownIds = new Set(exercises.map(e => e.id));

    let bad: string[] = [];
    for (const [id, c] of byId) {
      const equipment = exercises.find(e => e.id === id)?.equipment ?? '';
      bad = bad.concat(checkC1(c, knownIds));
      bad = bad.concat(checkC2(c));
      bad = bad.concat(checkC3(c, equipment));
      bad = bad.concat(checkC4(c));
      bad = bad.concat(checkC7(c));
      bad = bad.concat(checkC8(c, SOURCES));
      bad = bad.concat(checkC16(c));
    }
    bad = bad.concat(checkC6(exercises.map(e => e.id), COVERAGE));
    bad = bad.concat(checkC17(['tools/plates/gen/content.mjs', 'src/howto'].map(p => new URL(`../../${p}`, import.meta.url).pathname)));

    expect(bad).toEqual([]);
  });
});

describe('HT5-A2/LR-23: C19, no sources or contacts, on the generated output', () => {
  it('(a) archetypes.ts passes: no SHOW_EVIDENCE, clean red-flag boxes and disclaimer', async () => {
    const lint = await import(/* @vite-ignore */ url('tools/plates/layers/artifact/copy-lint.mjs'));
    const rawModules = await Promise.all(IDS.map(id => import(/* @vite-ignore */ url(`tools/plates/layers/exercises/${id.slice(4)}.howto.mjs`))));
    const names: SourceName[] = lint.sourceNamePatterns(rawModules);
    const archetypes = { ...(await import('../../src/howto/archetypes')) };
    expect(checkC19Shared(archetypes, 'archetypes', names)).toEqual([]);
  });

  it('(b) every copy field of all 8 generated contents passes (source notes excepted)', async () => {
    const lint = await import(/* @vite-ignore */ url('tools/plates/layers/artifact/copy-lint.mjs'));
    const rawModules = await Promise.all(IDS.map(id => import(/* @vite-ignore */ url(`tools/plates/layers/exercises/${id.slice(4)}.howto.mjs`))));
    const names: SourceName[] = lint.sourceNamePatterns(rawModules);
    const { byId } = await loadAll();
    for (const [id, c] of byId) {
      const fields: CopyField[] = lint.copyFields(c);
      expect(checkC19Copy(fields, id, names), id).toEqual([]);
    }
  });

  it('(c) every file under src/howto passes', () => {
    const root = join(new URL('.', import.meta.url).pathname, '..', '..');
    const files = filesUnder([join(root, 'src', 'howto')]);
    expect(files.some(f => f.includes(join('src', 'howto', 'generated')))).toBe(true);
    expect(checkC19Files(files)).toEqual([]);
  });
});

describe('HT5-A4: HOWTO_HINTS (critic fix 8)', () => {
  it('holds golden B\'s handling.cue for push-archetype exercises with an approved plate, and nothing else', async () => {
    const { HOWTO_HINTS, HOWTO_IDS } = await import('../../src/howto/ids');
    const { byId } = await loadAll();
    const wantKeys = [...byId.entries()].filter(([, c]) => c.handling?.archetype === 'push').map(([id]) => id);
    expect(Object.keys(HOWTO_HINTS).sort()).toEqual(wantKeys.sort());
    for (const id of wantKeys) expect(HOWTO_HINTS[id as keyof typeof HOWTO_HINTS]).toBe(byId.get(id)!.handling.cue);
    for (const id of HOWTO_IDS) if (!wantKeys.includes(id)) expect(HOWTO_HINTS[id]).toBeUndefined();
  });

  it('ids.ts stays <= 2,048 B with the hints counted', () => {
    expect(readFileSync('src/howto/ids.ts', 'utf8').length).toBeLessThanOrEqual(2048);
  });
});

describe('HT5-A5: archetypes.ts is generated from golden B\'s shared module, byte for byte', () => {
  it('the four red-flag blocks and the disclaimer match tools/plates/layers/howto/shared.mjs exactly', async () => {
    const shared = await import(/* @vite-ignore */ url('tools/plates/layers/howto/shared.mjs'));
    const archetypes = await import('../../src/howto/archetypes');
    expect(archetypes.RED_FLAG).toEqual(shared.RED_FLAG);
    expect(archetypes.RED_FLAG_SHOULDER).toEqual(shared.RED_FLAG_SHOULDER);
    expect(archetypes.RED_FLAG_KNEE).toEqual(shared.RED_FLAG_KNEE);
    expect(archetypes.RED_FLAG_ELBOW).toEqual(shared.RED_FLAG_ELBOW);
    expect(archetypes.DISCLAIMER).toBe(shared.DISCLAIMER);
    expect(archetypes.DISCLAIMER).toBe('General guidance, not medical advice. If something hurts, stop and get it checked.');
  });

  it('never exports SHOW_EVIDENCE (LR-23: no evidence labels in the UI)', async () => {
    const archetypes = await import('../../src/howto/archetypes');
    expect('SHOW_EVIDENCE' in archetypes).toBe(false);
  });

  it('no content row carries its own red-flag wording (C8 already proves this per row; this proves redFlag is always the shared block)', async () => {
    const { byId } = await loadAll();
    for (const [id, c] of byId) expect(c.redFlag.name, id).toBe('Wrist pain');
  });
});
