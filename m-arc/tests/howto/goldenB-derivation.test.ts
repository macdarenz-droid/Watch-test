// HT-4 (HT4-A5, critic fix 2): golden B holds only golden-A plates. Design note on PR #107 explains the three
// proofs and how the crop-key allowance was derived (empirically, from a real build, never assumed).
//
// 1. Source: each vendored `<slug>.howto.mjs` imports its plate from the golden-A source GOLDEN.json records, and
//    `plate` deep-equals that spec, with no callout override (lateral raise: byte-identical ref-src + same function
//    reference; no `exercises/dumbbell_lateral_raise.mjs` to import). Fast (file reads only) - proven below.
// 2. renderPlate capture: `engine/plate.mjs` is shimmed in a mirror (wraps `renderPlate`, records every call), then
//    `node artifact/build-page.mjs` runs for real. Every call's `opts` uses only {id, mistake, selected}. Grouped by
//    the call's own `spec.id` against golden-A: `tempo`/`alt` are byte-identical; `checks`/`callouts` are
//    byte-identical or empty; `poses` is never a blanket allowance (review fix, blocker 1) - every call's
//    poses.start/end must classify as 'golden' or one of 11 pinned, owner-approved exceptions
//    (goldenB.mjs's ENUMERATED_POSES doc comment has the derivation). Everything else left in the crop window is a
//    plate-engine drawing field (SPEC.md's schema, not GA's HowToContent). This spawns a real ~8-14s build, so the
//    live proof runs once in the HT-4 gate block (scripts/screenshot-gate.mjs), not on every `npm test` (review
//    fix, blocker 4) - the pure classification logic it depends on (`classifyPose`/`validateCalls`/
//    `protectedFieldProblems`, all in tools/plates/fidelity/goldenB.mjs) is unit-tested below with synthetic calls,
//    so a regression in the logic itself is still caught fast.
// 3. Fragment `===`: the built page's normalSvg/normalOverlay/mistakeSvg/mistakeOverlay/alt/mistakeAlt, sliced
//    straight from each card's `<figure class="plate">` blocks, sha256-match GOLDEN.json's golden-A fragments
//    exactly, for all 8 exercises. Also needs the live build - also in the HT-4 gate block.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import type { GoldenFile, GoldenPlateEntry } from '../../src/howto/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let layersMod: any;
async function loadLayers() {
  if (!layersMod) layersMod = await import(/* @vite-ignore */ new URL('../../tools/plates/layers.mjs', import.meta.url).href);
  return layersMod;
}

const LAYERS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tools', 'plates', 'layers');
const VENDOR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tools', 'plates', 'vendor');
const GOLDEN_JSON = join(dirname(fileURLToPath(import.meta.url)), 'golden', 'GOLDEN.json');

const golden: GoldenFile = JSON.parse(readFileSync(GOLDEN_JSON, 'utf8'));
const plateEntries = golden.entries.filter((e): e is GoldenPlateEntry => e.kind === 'plate');

interface RpCall { opts: { id: string; mistake?: boolean; selected?: string }; spec: Record<string, unknown> }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let gb: any;
/** `loadGoldenASpecs`/`protectedFieldProblems`/`classifyPose`/`validateCalls`/`ENUMERATED_POSES`/
 *  `captureRenderPlateCalls`/`fragmentProblems`: shared with the HT-4 gate block (review PR #107, blocker 1 and 4)
 *  so the pose-classification logic and the live-build code exist in exactly one place. */
async function loadGb() {
  if (!gb) gb = await import(/* @vite-ignore */ new URL('../../tools/plates/fidelity/goldenB.mjs', import.meta.url).href);
  return gb;
}

describe('HT4-A5: golden B holds only golden-A plates (fast proofs; the live-build proofs run in the HT-4 gate block)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let goldenASpecs: Record<string, any>;

  beforeAll(async () => {
    const mod = await loadGb();
    goldenASpecs = await mod.loadGoldenASpecs();
  }, 15000);

  it('1. each of the 7 non-ref-src howto.mjs re-exports its plate spec unmodified from golden-A, no callout override', () => {
    for (const p of plateEntries) {
      if (p.src === 'ref-src') continue;
      const exId = p.slug.replace(/-/g, '_');
      const howto = readFileSync(join(LAYERS, 'exercises', `${exId}.howto.mjs`), 'utf8');
      // Two patterns in golden B, both zero-override re-exports: `import plate from './<id>.mjs'` used directly, or
      // `import plateSpec from './<id>.mjs'; const plate = plateSpec;`.
      const directImport = new RegExp(`import plate from '\\./${exId}\\.mjs'`).test(howto);
      const aliasedImport = new RegExp(`import plateSpec from '\\./${exId}\\.mjs'`).test(howto) && /const plate = plateSpec;/.test(howto);
      expect(directImport || aliasedImport, `${exId}.howto.mjs should re-export its plate from './${exId}.mjs' unmodified`).toBe(true);
    }
  });

  it('1b. golden B\'s own exercises/*.mjs are byte-identical to golden-A\'s vendored specs (no drift, S-2 fixed it)', () => {
    for (const p of plateEntries) {
      if (p.src === 'ref-src') continue;
      const layersFile = readFileSync(join(LAYERS, p.src), 'utf8');
      const vendorFile = readFileSync(join(VENDOR, p.src), 'utf8');
      expect(layersFile, `${p.src} should be byte-identical to the golden-A vendor copy`).toBe(vendorFile);
    }
  });

  it('1c. lateral raise: golden B\'s ref-src/plate.mjs is byte-identical to the golden-A vendor pin, and re-exported unwrapped', () => {
    const layersRef = readFileSync(join(LAYERS, 'ref-src', 'plate.mjs'), 'utf8');
    const vendorRef = readFileSync(join(VENDOR, 'ref-src', 'plate.mjs'), 'utf8');
    expect(layersRef).toBe(vendorRef);
    const howto = readFileSync(join(LAYERS, 'exercises', 'dumbbell_lateral_raise.howto.mjs'), 'utf8');
    expect(howto).toMatch(/import \{ plate as refPlate \} from '\.\.\/ref-src\/plate\.mjs'/);
    expect(howto).toMatch(/render:\s*refPlate/);
  });

  it('failure path: there is no exercises/dumbbell_lateral_raise.mjs to import (golden B takes its plate from ref-src)', () => {
    expect(existsSync(join(LAYERS, 'exercises', 'dumbbell_lateral_raise.mjs'))).toBe(false);
  });

  it('Medium 4 (round-2 review fix): the lateral raise\'s Wrong-crop parameters (abd, hideInside) are pinned against the vendored howto.mjs', async () => {
    const mod = await loadGb();
    expect(await mod.validateLateralRaiseCrops(LAYERS)).toEqual([]);
  });

  it('failure path: a changed abd value on the lateral raise\'s top-height Wrong crop fails', async () => {
    const mod = await loadGb();
    const layers = await loadLayers();
    const mirror = layers.makeMirror();
    try {
      const file = join(mirror, 'exercises', 'dumbbell_lateral_raise.howto.mjs');
      const text = readFileSync(file, 'utf8');
      expect(text).toContain('wrong: { abd: 118, hideInside:');
      writeFileSync(file, text.replace('wrong: { abd: 118, hideInside:', 'wrong: { abd: 999, hideInside:'));
      const bad = await mod.validateLateralRaiseCrops(mirror);
      expect(bad.some((m: string) => m.includes('top-height') && m.includes('999'))).toBe(true);
    } finally {
      rmSync(mirror, { recursive: true, force: true });
    }
  });

  it('failure path: reintroducing the chest-press callout override fails (a real, non-empty, differing callouts array)', async () => {
    const mod = await loadGb();
    const goldenA = goldenASpecs.machine_chest_press!;
    const fakeCall: RpCall = { opts: { id: 'machine-chest-press-n' }, spec: { ...goldenA, callouts: [{ key: 'fake', text: 'reintroduced override' }] } };
    const bad = mod.protectedFieldProblems('machine_chest_press', fakeCall, goldenA);
    expect(bad.some((m: string) => m.includes('callouts'))).toBe(true);
  });

  it('failure path: a crop spec with a moved joint that also edits tempo fails (poses alone is not an excuse to touch tempo)', async () => {
    const mod = await loadGb();
    const goldenA = goldenASpecs.barbell_back_squat!;
    const fakeCall: RpCall = { opts: { id: 'depth-r' }, spec: { ...goldenA, poses: {}, tempo: [{ phase: 'Invented', s: 1 }] } };
    const bad = mod.protectedFieldProblems('barbell_back_squat', fakeCall, goldenA);
    expect(bad.some((m: string) => m.includes('tempo'))).toBe(true);
  });

  it('failure path: a plain moved joint fails on its own, with no other field touched (blocker 1: no blanket "poses can vary")', async () => {
    const mod = await loadGb();
    const goldenA = goldenASpecs.barbell_back_squat!;
    const movedJoint = { ...(goldenA.poses as { start: object }).start, trunk: 999 };
    const bad = mod.validateCalls(
      [{ opts: { id: 'depth-r' }, spec: { ...goldenA, id: 'barbell_back_squat', poses: { start: movedJoint, end: movedJoint } } }],
      goldenASpecs,
    );
    expect(bad.length).toBeGreaterThan(0);
    expect(bad.every((m: string) => m.includes('barbell_back_squat|depth-r'))).toBe(true);
  });

  it('failure path: classifyPose never widens to accept an unpinned pose near (but not equal to) an enumerated exception', async () => {
    const mod = await loadGb();
    const goldenA = goldenASpecs.pull_up!;
    const near = { ...mod.ENUMERATED_POSES['pull_up|shoulders-right'], trunk: 1 };
    const verdict = mod.classifyPose('pull_up', 'shoulders-right', near, goldenA);
    expect(verdict).not.toBe('golden');
    expect(verdict).not.toBe('enumerated');
  });

  it('classifyPose accepts every one of the 11 poses.start/end pinned poses against its own golden-A spec (the exceptions really are pinned, not vacuous)', async () => {
    const mod = await loadGb();
    const POSES_START_END_KEYS = [
      'barbell_back_squat|bar-on-back-w', 'barbell_back_squat|depth-w', 'pull_up|shoulders-right', 'pull_up|shoulders-wrong',
      'hanging_leg_raise|pelvis-wrong', 'hanging_leg_raise|shoulders-right', 'hanging_leg_raise|shoulders-wrong',
      'lat_pulldown|path-wrong', 'seated_cable_row|finish-wrong', 'leg_press|foot-w', 'machine_chest_press|seat-height-w',
    ];
    expect(POSES_START_END_KEYS.length).toBe(11);
    for (const key of POSES_START_END_KEYS) {
      const [exId, optsId] = key.split('|') as [string, string];
      const goldenA = goldenASpecs[exId];
      expect(goldenA, `goldenASpecs should have an entry for ${exId}`).toBeDefined();
      expect(mod.classifyPose(exId, optsId, mod.ENUMERATED_POSES[key], goldenA)).toBe('enumerated');
    }
  });

  it('round-2 review fix (blocker 2): classifyMistakePose accepts every one of the 3 pinned non-solid Wrong-crop mistake poses', async () => {
    const mod = await loadGb();
    const MISTAKE_POSE_KEYS = ['pull_up|top-wrong', 'lat_pulldown|pad-wrong', 'seated_cable_row|back-wrong'];
    expect(MISTAKE_POSE_KEYS.length).toBe(3);
    expect(Object.keys(mod.ENUMERATED_POSES).length).toBe(11);
    expect(Object.keys(mod.ENUMERATED_MISTAKE_POSES).length).toBe(3);
    for (const key of MISTAKE_POSE_KEYS) {
      const [exId, optsId] = key.split('|') as [string, string];
      const goldenA = goldenASpecs[exId];
      expect(goldenA, `goldenASpecs should have an entry for ${exId}`).toBeDefined();
      expect(mod.classifyMistakePose(exId, optsId, mod.ENUMERATED_MISTAKE_POSES[key], goldenA)).toBe('enumerated');
    }
  });

  it('round-2 review fix (blocker 2): every call\'s spec.mistake.pose classifies as golden-A or a pinned exception (the reviewer\'s exact reproduction: a moved joint in a non-solid Wrong crop)', async () => {
    const mod = await loadGb();
    const goldenA = goldenASpecs.pull_up!;
    const movedNeck = { ...mod.ENUMERATED_MISTAKE_POSES['pull_up|top-wrong'], neck: 45 };
    const bad = mod.validateCalls(
      [{ opts: { id: 'top-wrong' }, spec: { ...goldenA, id: 'pull_up', mistake: { pose: movedNeck } } }],
      goldenASpecs,
    );
    expect(bad.length).toBeGreaterThan(0);
    expect(bad.every((m: string) => m.includes('pull_up|top-wrong'))).toBe(true);
  });

  it('round-3 review fix (blocker 1): an enumerated solid Wrong crop redrawn as golden-A\'s own poses.start still fails (never falls back to the golden-A check for an enumerated key)', async () => {
    const mod = await loadGb();
    const goldenA = goldenASpecs.pull_up!;
    // pull_up|shoulders-wrong is enumerated (a solid Wrong crop). Its captured pose must never be accepted just
    // because it happens to equal golden-A's own start - only its own pin (the reviewer's mutation D).
    const verdict = mod.classifyPose('pull_up', 'shoulders-wrong', goldenA.poses.start, goldenA);
    expect(verdict).not.toBe('golden');
    expect(verdict).not.toBe('enumerated');
  });

  it('round-3 review fix (blocker 1): an enumerated Right crop flattened to golden-A\'s bare start pose still fails (the reviewer\'s mutation C)', async () => {
    const mod = await loadGb();
    const goldenA = goldenASpecs.pull_up!;
    // pull_up|shoulders-right is enumerated (ACTIVE_HANG). golden-A's own start is a different pose (no scap/hip
    // override) - accepting it here would mean the enumerated pin is not really enforced.
    const verdict = mod.classifyPose('pull_up', 'shoulders-right', goldenA.poses.start, goldenA);
    expect(verdict).not.toBe('golden');
    expect(verdict).not.toBe('enumerated');
  });

  it('round-3 review fix (blocker 1): an enumerated mistake pose set to golden-A\'s own mistake pose still fails', async () => {
    const mod = await loadGb();
    const goldenA = goldenASpecs.seated_cable_row!;
    // seated_cable_row|back-wrong is an enumerated mistake pose, distinct from golden-A's own general mistake.
    const goldenMistake = { ...(goldenA.poses as { end: object }).end, ...(goldenA.mistake as { pose: object }).pose };
    const verdict = mod.classifyMistakePose('seated_cable_row', 'back-wrong', goldenMistake, goldenA);
    expect(verdict).not.toBe('golden');
    expect(verdict).not.toBe('enumerated');
  });

  it('round-2 review fix (blocker 2): protectedFieldProblems no longer treats `mistake` as a whole-field blanket allowance - a call with no mistake field at all is unaffected, but mistake.pose is never silently skipped', async () => {
    const mod = await loadGb();
    expect(mod.CROP_WINDOW_FIELDS.has('mistake')).toBe(false);
  });

  it('sanity: 8 plate entries, 7 with a vendored exercises/*.mjs plus the lateral raise from ref-src', () => {
    expect(plateEntries.length).toBe(8);
    expect(plateEntries.filter(p => p.src === 'ref-src').length).toBe(1);
  });
});
