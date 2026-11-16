// HT-4 L0-B (HT4-A1): the vendored How-to layer mockup (golden B, tools/plates/layers/) is verbatim from the
// LR-23 pin (6b86baa, HT-4b; supersedes a7a0b74, the source-records pin, then b3a90af and the first pin 16a8edc, all
// kept in pageApproval.history) and rebuilds byte-identical.
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const MOD_URL = new URL('../../tools/plates/layers.mjs', import.meta.url).href;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let m: any;
const tmps: string[] = [];
const copyLayers = () => { const d = m.makeMirror(); tmps.push(d); return d; };
const flipByte = (file: string, at = 100) => {
  const b = readFileSync(file);
  b[at] = b[at] === 0x20 ? 0x21 : 0x20;
  writeFileSync(file, b);
};

describe('HT4-A1 layer vendor lock (L0-B)', () => {
  beforeAll(async () => { m = await import(/* @vite-ignore */ MOD_URL); });
  afterAll(() => { for (const d of tmps) m.cleanupMirror(d); });

  it('every vendored file matches its MANIFEST sha256 and git blob against the golden-B pin', () => {
    expect(m.verifyLayers()).toEqual([]);
  });

  it('the MANIFEST lists exactly the golden-B read closure: README, artifact (incl. copy-lint), engine, exercises, howto, ref-src', () => {
    const paths = Object.keys(m.readManifest().files).sort();
    expect(paths).toContain('README.md');
    expect(paths).toContain('artifact/build-page.mjs');
    expect(paths).toContain('artifact/copy-lint.mjs');
    expect(paths).toContain('engine/plate.mjs');
    expect(paths).toContain('exercises/machine_chest_press.howto.mjs');
    expect(paths).toContain('howto/shared.mjs');
    expect(paths).toContain('ref-src/plate.mjs');
    expect(paths.length).toBe(49);
    // No engine re-draw for the lateral raise: golden B takes its plate from ref-src (S-2 condition 1).
    expect(paths).not.toContain('exercises/dumbbell_lateral_raise.mjs');
  });

  // The live rebuild (spawns node artifact/build-page.mjs, ~8-14s) runs once in the HT-4 gate block
  // (scripts/screenshot-gate.mjs), not here (review fix, blocker 4: npm test stays fast). See the gate block for
  // "rebuilding the vendored layer page gives the pinned pageSha256".

  it('fails and names the file on a 1-byte change to engine/plate.mjs', () => {
    const d = copyLayers();
    flipByte(join(d, 'engine/plate.mjs'));
    const bad: string[] = m.verifyLayers(d);
    expect(bad.some((p: string) => p.startsWith('engine/plate.mjs: sha256'))).toBe(true);
    expect(bad.every((p: string) => p.startsWith('engine/plate.mjs'))).toBe(true);
  });

  it('fails and names the file on a 1-byte change to a howto.mjs content file', () => {
    const d = copyLayers();
    flipByte(join(d, 'exercises/machine_chest_press.howto.mjs'), 200);
    const bad: string[] = m.verifyLayers(d);
    expect(bad.some((p: string) => p.startsWith('exercises/machine_chest_press.howto.mjs: sha256'))).toBe(true);
  });

  it('fails on a missing or an extra vendored file', () => {
    const d = copyLayers();
    rmSync(join(d, 'howto/shared.mjs'));
    writeFileSync(join(d, 'howto/extra.mjs'), 'export default {};\n');
    expect(m.verifyLayers(d)).toEqual(['howto/shared.mjs: missing', 'howto/extra.mjs: not in MANIFEST']);
  });

  it('fails on a MANIFEST entry pointing at a different commit than the S-2 pin', () => {
    const d = copyLayers();
    const manifest = m.readManifest(d);
    manifest.files['engine/plate.mjs'].source = 'bc0f378:docs/howto/golden-b/engine/plate.mjs';
    writeFileSync(join(d, 'MANIFEST.json'), JSON.stringify(manifest));
    expect(m.verifyLayers(d, manifest).some((p: string) => p.includes(`is not the ${m.GOLDEN_B_REF} pin`))).toBe(true);
  });

  // Supervisor, PR #107 (the same condition HT-2 had, #105): the per-file check alone cannot catch a file and its
  // own MANIFEST entry being edited together and staying consistent with each other.
  it('the sorted path:sha256 list of MANIFEST.json, plus pageApproval, hashes to its pinned literal', () => {
    expect(m.sha256(m.manifestPinList())).toBe('c9b3eb6838508fe8c3d518294debe15ec97c93ea781b55bc214aa3ccc9eb2606');
  });

  it('fails when a vendored file and its own MANIFEST sha256 entry change together (consistently)', () => {
    const d = copyLayers();
    const manifest = m.readManifest(d);
    const file = join(d, 'engine/plate.mjs');
    const edited = Buffer.concat([readFileSync(file), Buffer.from('\n// edited\n')]);
    writeFileSync(file, edited);
    const gitBlob = createHash('sha1').update(`blob ${edited.length}\0`).update(edited).digest('hex');
    manifest.files['engine/plate.mjs'] = { ...manifest.files['engine/plate.mjs'], sha256: m.sha256(edited), gitBlob };
    writeFileSync(join(d, 'MANIFEST.json'), JSON.stringify(manifest));
    // the per-file check alone is fooled (both sides agree, source pin untouched)...
    expect(m.verifyLayers(d, manifest)).toEqual([]);
    // ...but the literal pin over the whole manifest is not
    expect(m.sha256(m.manifestPinList(manifest))).not.toBe('c9b3eb6838508fe8c3d518294debe15ec97c93ea781b55bc214aa3ccc9eb2606');
  });
});

describe('HT4-A1: the layer page approval and its committed fixture', () => {
  // Not a tests/howto/golden/GOLDEN.json entry: that file is a declared input of HT-2's generator
  // (tools/plates/gen/plates.mjs hashes it into every generated file's inputsSha256), so any edit to its `entries`
  // array - even a purely additive one - stales HT-2's already-committed generated output and breaks
  // `generate --check` (found by running the gate; see PR #107, supervisor comment 5907029772). The approval
  // instead lives in HT-4's own MANIFEST.json, which nothing outside tools/plates/layers.mjs reads.
  const FIXTURE = new URL('golden/howto-layers.html', import.meta.url);

  it('the fixture is committed and its sha256 matches pageApproval.current and PAGE_SHA256', async () => {
    if (!m) m = await import(/* @vite-ignore */ MOD_URL);
    const { current, history } = m.readManifest().pageApproval;
    expect(current, 'MANIFEST.json should hold a pageApproval.current').toBeDefined();
    expect(current.ref).toBe(m.GOLDEN_B_REF);
    // HT-4b: the owner approved the LR-23 re-pin in the HT-4b session (2026-09-30).
    expect(current.approvedBy).toBe('owner');
    // HT-4b review fix: each record names the one it retired, and the retired one heads history.
    expect(current.supersedes).toBe(history[0].ref);
    expect(Array.isArray(history)).toBe(true);
    const fixture = readFileSync(FIXTURE);
    expect(m.sha256(fixture)).toBe(current.pageSha256);
    expect(m.sha256(fixture)).toBe(m.PAGE_SHA256);
    expect(fixture.length).toBe(current.bytes);
  });

  it('history holds the three retired approvals (a7a0b74, b3a90af, then 16a8edc) in order, and hashes to its pinned literal', () => {
    const { history } = m.readManifest().pageApproval;
    expect(history).toEqual([
      {
        ref: 'a7a0b74', supersedes: 'b3a90af', approvedBy: 'supervisor', date: '2026-09-30',
        why: 'source records only (HT5-A2); owner-approved design unchanged',
        pageSha256: 'f39137e190e3ff5921bbe658571228b6b2a53e6d27fcc95e0d5d2afaec9e1384', bytes: 2386418,
      },
      {
        ref: 'b3a90af', approvedBy: 'owner', date: '2026-09-30',
        why: 'owner approved the layer design and asked for compact concept-first copy',
        pageSha256: '5aab1aca9bc231cc8868f366648d0d536b879d6c7d4d1adf220da99b66098deb', bytes: 2386760,
      },
      {
        ref: '16a8edc', approvedBy: 'owner', date: '2026-09-30',
        why: 'The approved How-to layer mockup (golden B, S-2 pin), vendored verbatim into tools/plates/layers/ (HT-4). Holds only the golden-A plates (HT4-A5). Superseded by the compact-copy update.',
        pageSha256: '472030088f32673bb68dac0f937f1a6fa7dd10c82eb42f88b2f0c4a66a149c4a', bytes: 2451995,
      },
    ]);
    expect(m.historyPin(history)).toBe('5432626725ac8afb8554bf3b2d063698bd8e6f55aba8e63ff40286c3c0d77dae');
  });

  it('fails (the pinned literal changes) if an already-retired entry is edited after the fact', () => {
    const { history } = m.readManifest().pageApproval;
    const tampered = [{ ...history[0], why: 'tampered after the fact' }, ...history.slice(1)];
    expect(m.historyPin(tampered)).not.toBe(m.historyPin(history));
  });

  it('does not touch tests/howto/golden/GOLDEN.json (HT-2\'s generator input)', () => {
    const golden = JSON.parse(readFileSync(new URL('golden/GOLDEN.json', import.meta.url), 'utf8'));
    expect(golden.entries.some((e: { kind: string }) => e.kind === 'layers')).toBe(false);
  });
});

describe('HT4-A1 vendored layers stay outside src', () => {
  it('the layers folder is under tools/plates, not src', async () => {
    if (!m) m = await import(/* @vite-ignore */ MOD_URL);
    expect(m.LAYERS.endsWith(join('tools', 'plates', 'layers'))).toBe(true);
  });
});
