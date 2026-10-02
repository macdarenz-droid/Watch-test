// HT-4: HT4-A2 (content-types.ts compiles a real golden-B spec, mapped) and HT4-A3/A4 (C1-C4, C6-C8, C15-C17 pass on
// good content and fail, naming the rule, on their own bad fixture). Pure functions, node env, no DOM.
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import type { HowToContent, Source } from '../../src/howto/content-types';
import { COVERAGE } from '../../src/howto/coverage';
import exercises from '../../src/data/exercises.json';
import { checkC1 } from './checks/c1';
import { checkC2 } from './checks/c2';
import { checkC3 } from './checks/c3';
import { checkC4 } from './checks/c4';
import { checkC6 } from './checks/c6';
import { checkC7, LIMITS as c7LIMITS } from './checks/c7';
import { checkC8 } from './checks/c8';
import { checkC15, contentHash } from './checks/c15';
import { checkC16 } from './checks/c16';
import { checkC17 } from './checks/c17';
import {
  checkC19Copy, checkC19Feel, checkC19File, checkC19Files, checkC19Shared, filesUnder, type CopyField, type SourceName,
  RULE_CLASS, RULE_CONTACT, RULE_GEN_KEY, RULE_GEN_SOURCES, RULE_HREF, RULE_LABEL, RULE_LINK, RULE_NAME, RULE_SAFETY,
  RULE_SHOW_EVIDENCE, RULE_SOURCE, RULE_TARGET,
} from './checks/c19';
import { mutate as c19M1 } from './fixtures/bad/c19-m1-show-evidence';
import { mutate as c19M2 } from './fixtures/bad/c19-m2-knee-call-999';
import { pass as c19BackPass, m3 as c19M3 } from './fixtures/bad/c19-back-box';
import * as c19Copy from './fixtures/bad/c19-copy-fields';
import { mutate as c1Mutate } from './fixtures/bad/c1-bad-zoom-ref';
import { mutate as c1DanglingFault } from './fixtures/bad/c1-dangling-fault-ref';
import { mutate as c2PrimaryWatch } from './fixtures/bad/c2-primary-and-watch';
import { mutate as c2NoRegion } from './fixtures/bad/c2-no-region';
import { mutate as c2NoRegionInRow } from './fixtures/bad/c2-no-region-in-row';
import { mutate as c2UnknownId } from './fixtures/bad/c2-unknown-id';
import { mutate as c2BadPart } from './fixtures/bad/c2-bad-part';
import { mutate as c3Mutate } from './fixtures/bad/c3-missing-hand-zoom';
import { mutate as c4Mutate } from './fixtures/bad/c4-bad-thumb';
import { mutate as c6Mutate } from './fixtures/bad/c6-missing-id';
import { mutate as c7Mutate } from './fixtures/bad/c7-banned-phrase';
import { mutate as c7LabelTooLong } from './fixtures/bad/c7-label-too-long';
import { mutate as c7RedFlagTooLong } from './fixtures/bad/c7-red-flag-too-long';
import { mutate as c7FixNotAVerb } from './fixtures/bad/c7-fix-not-a-verb';
import { mutate as c7VisibleBudget } from './fixtures/bad/c7-visible-budget';
import { mutate as c8MissingClaim } from './fixtures/bad/c8-missing-claim';
import { mutate as c8Unreachable } from './fixtures/bad/c8-unreachable';
import { mutate as c8RedFlag } from './fixtures/bad/c8-red-flag-wording';
import { reviews as c15Reviews } from './fixtures/bad/c15-no-matching-review';
import { mutate as c16Mutate } from './fixtures/bad/c16-missing-alt';
import { mutate as c16ViewNoCamLabel } from './fixtures/bad/c16-view-no-camlabel';
import { mutate as c16MissingWrongCrop } from './fixtures/bad/c16-missing-wrong-crop';

/*
 * HT4-A2: this literal is machine_chest_press.howto.mjs's default export at the final compact-copy pin (b3a90af),
 * verbatim - every string below is copied from tools/plates/layers/exercises/machine_chest_press.howto.mjs, minus
 * `plate` (HowToContent has no plate field; plate identity is tools/plates/plates.json). This is the "one golden-B
 * spec, mapped" compile check: if content-types.ts's shape disagrees with what golden-B actually authors, this
 * literal fails to typecheck. It also happens to sit at every list cap (5 setup, 4 feel rows, 3 mistakes, 3 risks),
 * so it doubles as a realistic "at the cap" fixture for C7's list-length checks.
 */
const CL_WRIST = { tags: ['CONSENSUS', 'MECH', 'WEAK'], sources: ['ace-chest-press', 'barbell-logic-grip', 'weiss1995', 'nance2017'], note: 'Heel of palm and straight wrist: ACE plus coaching consensus.' } as const;
const CL_ACE = { tags: ['CONSENSUS'], sources: ['ace-chest-press'] } as const;
const CL_THUMB = { tags: ['CONSENSUS'], sources: ['ace-chest-press'] } as const;

const GOOD_CONTENT = {
  schema: 1,
  id: 'lib_machine_chest_press',
  rev: 1,
  handling: {
    archetype: 'push',
    orientation: 'pronated',
    handle: 'machine-grip',
    loadAxis: 'along-forearm',
    handleChoice: { sore: 'Sore wrist? Use the vertical handles.', claim: { tags: ['DATA', 'CONSENSUS'], sources: ['muyor2023'] } },
    overBody: false,
    width: { text: 'Pick handles that put your hands just outside your shoulders at the start. Line each forearm up behind its handle.', claim: { tags: ['DATA', 'CONSENSUS'], sources: ['muyor2023'] } },
    thumb: { mode: 'wrapped', claim: CL_THUMB },
    contact: 'heel',
    wrist: { ext: [0, 10], dev: [-10, 10], limitText: 'Wrist bending back past about 15 to 20 degrees? Stop and go lighter.', claim: CL_WRIST },
    faults: ['fingers-bent-back'],
    gripLine: 'Push through the heel of your palm, so your wrist stays straight. A wrapped thumb stops the handle rolling into your fingers.',
    cue: 'Heel of palm, wrist straight.',
  },
  contacts: ['seat-back', 'standing-feet'],
  setup: [
    { kind: 'adjust', text: 'Set the seat so the handles meet mid-chest.', zoom: 'seat-height', claim: CL_ACE },
    { kind: 'adjust', text: 'Start the handles at your chest, never behind it.', claim: { tags: ['CONSENSUS'], sources: ['ace-chest-press', 'fees1998'] } },
    { kind: 'position', text: 'Sit right back, hips on the pad, feet flat.', claim: CL_ACE },
    { kind: 'grip', text: 'Handle in the heel of your palm, wrist straight.', zoom: 'hand', claim: CL_WRIST },
    { kind: 'brace', text: 'Set your shoulder blades down and back into the pad.', zoom: 'blades', claim: CL_ACE },
  ],
  posture: [
    { key: 'height', label: 'Handles mid-chest', detail: 'At the start the handles are at mid-chest height. They are level with the chest or just in front, never behind.', anchor: { at: 'grip.r', pose: 'start' }, zoom: 'seat-height', claim: CL_ACE },
    { key: 'blades', label: 'Blades on pad', detail: 'Upper back and shoulder blades stay on the pad to the end of each push. Normal small arch in the low back.', anchor: { at: 'backUpper', pose: 'end' }, zoom: 'blades', claim: CL_ACE },
  ],
  feel: {
    primary: [{ muscleId: 'chest', plain: 'Across the middle and lower chest, the big fan of muscle from the breastbone out to the armpit.' }],
    secondary: [{ muscleId: 'triceps', plain: 'The back of the upper arm, mostly near the end of the push.' }],
    watch: [{ muscleId: 'front_delts', plain: 'If the front of your shoulders burn more than your chest, your setup is usually off.' }],
    feelLine: 'You should feel this across the middle and lower chest. If your shoulders take over, check the seat height.',
    rows: [
      { key: 'front-shoulders', where: 'Front of the shoulders', at: { muscles: ['front_delts'] }, means: 'The handles sit too high, or your shoulders roll off the pad.', fix: 'Check the seat height first. On most machines, raise it.', zoom: 'seat-height', claim: CL_ACE },
      { key: 'wrist', where: 'Top or back of the wrist', at: { parts: ['hand-left', 'hand-right'] }, means: 'The handle has slid into your fingers, so your wrist bends back.', fix: 'Push from the heel of your palm. Go lighter until your wrist stays straight.', zoom: 'hand', redFlag: true, claim: CL_WRIST },
      { key: 'wrist-sore', where: 'Wrist sore before you start', at: { parts: ['hand-left', 'hand-right'] }, means: 'Pressing heavy on a sore wrist can make it worse.', fix: 'Use the vertical handles and go lighter. Stop the set if it hurts.', zoom: 'hand', redFlag: true, claim: { tags: ['CONSENSUS'], sources: ['nhs-wrist-pain'] } },
      { key: 'elbows', where: 'Elbows', at: { parts: ['elbow-left', 'elbow-right'] }, means: 'You snap your elbows straight at the end of each push.', fix: 'Stop just before the elbows lock and control the way back.', zoom: 'blades', redFlag: 'elbow', claim: { tags: ['CONSENSUS'], sources: ['ace-chest-press', 'nhs-elbow-pain'] } },
    ],
    libraryDiff: { add: ['upper_chest'], why: 'Muyor 2023: with neutral handles the upper (clavicular) chest works about as hard as the rest of the chest (about 30 % MVIC).' },
    claim: { tags: ['DATA', 'CONSENSUS'], sources: ['muyor2023', 'ace-chest-press'] },
  },
  zooms: [
    {
      key: 'hand', chip: 'Hand', chipCaption: 'Heel of palm', heading: 'Hand: right and wrong', kind: 'hand',
      hand: { wrong: ['fingers-bent-back'], camera: 'side', panelHeight: 150, note: 'Vertical handles: the same rule.', notes: { right: 'Heel of palm', wrong: 'Wrist bent back' } },
      caption: { right: 'Heel of your palm, thumb wrapped, wrist straight.', wrong: 'Handle in your fingers, wrist bent back, thumb loose.' },
      alt: { right: 'Horizontal handle, side view. The handle sits on the heel of the hand, thumb wrapped. Wrist straight, knuckles in line with the forearm. The push runs straight down the forearm.', wrong: 'Horizontal handle, side view. The handle has slid into the fingers, thumb loose. The wrist is bent far back. The push passes behind the wrist, bending it further.' },
      feelRow: 'wrist',
    },
    {
      key: 'seat-height', chip: 'Seat height', heading: 'Seat height: right and wrong', kind: 'posture',
      crop: { center: { at: 'shoulder.r', pose: 'start', off: [14, 0] }, sizePx: 108 },
      right: 'start', wrong: { still: 'seat-low' },
      callouts: { right: { text: 'Mid-chest', guide: 'handle-to-chest' }, wrong: { text: 'Seat too low', guide: 'handle-to-chest' } },
      caption: { right: 'Handles meet the middle of your chest.', wrong: 'Seat too low: handles up near your shoulders.' },
      alt: { right: 'Side view, start of the press. The handle is level with the middle of the chest, the elbow below the shoulder.', wrong: 'Side view, seat too low. The handle is level with the top of the chest, near the shoulder. The elbow is raised almost to handle height. Mid-chest sits well below.' },
      feelRow: 'front-shoulders',
    },
    {
      key: 'blades', chip: 'Blades', heading: 'Shoulder blades: right and wrong', kind: 'posture',
      crop: { center: { at: 'shoulder.r', pose: 'end', off: [44, 6] }, sizePx: 168 },
      right: 'end', wrong: { still: 'round-lock', over: 'end' },
      callouts: { right: { text: 'On the pad', guide: 'pad-contact' }, wrong: { text: 'Off the pad', guide: 'pad-gap' } },
      caption: { right: 'Shoulder blades on the pad, elbows slightly bent.', wrong: 'Shoulders roll off the pad, elbows locked.' },
      alt: { right: 'Side view, end of the press. Upper back and shoulder blades flat on the pad. Arms long, with a small bend at the elbow.', wrong: 'Side view, end of the press. The upper back rounds forward, about 4 cm off the pad. The elbows are locked straight.' },
      feelRow: 'elbows',
    },
  ],
  copy: {
    setupLine: 'Set the seat so the handles meet mid-chest. Sit right back, feet flat, shoulder blades on the pad.',
    mistakeLine: 'Never let your wrist fold back to finish a heavy rep. Drop the weight and push through the heel of your hand.',
    cueLine: 'Handles at mid-chest.',
  },
  // Verbatim from tools/plates/layers/howto/shared.mjs's RED_FLAG (the compact-copy pin, b3a90af) - machine_chest_press.howto.mjs
  // re-exports it unmodified (S-2 condition 4), never its own text. An earlier, pre-compact-copy wording here (28
  // vs. the old 38 words) silently over budget went undetected until C7's redFlagBoxWords check was wired up (High 5).
  redFlag: { name: 'Wrist pain', now: "Can't grip, wrist changed shape, or hand gone numb? Get it checked today.", doctor: "Tingling, keeps coming back, or no better after two weeks' rest? See a doctor.", claim: { tags: ['CONSENSUS'], sources: ['nhs-wrist-pain'] } },
  mistakes: [
    { key: 'wrist', title: 'Wrist bent back', zoom: 'hand', claim: CL_WRIST, fix: 'Handle on the heel of your palm. Still bending? Go lighter.' },
    { key: 'seat-low', title: 'Seat too low', zoom: 'seat-height', claim: CL_ACE, fix: 'Raise the seat so the handles meet mid-chest.' },
    { key: 'round-lock', title: 'Shoulders roll off, elbows lock', zoom: 'blades', claim: CL_ACE, fix: 'Stop before your elbows lock. Rolling forward to finish? Go lighter.' },
  ],
  risks: [
    { key: 'wrist', text: 'Pushing through a bent-back wrist squeezes the back of the wrist.', claim: { tags: ['MECH', 'WEAK'], sources: ['nance2017'] } },
    { key: 'shoulder', text: 'Handles behind your chest, elbows out, stretch the front of your shoulder under load.', claim: { tags: ['CONSENSUS'], sources: ['ace-chest-press', 'fees1998'] } },
    { key: 'elbow', text: 'Snapping your elbows straight under heavy weight loads the joints, not the muscles.', claim: { tags: ['CONSENSUS'], sources: ['ace-chest-press'] } },
  ],
  riskFlags: ['wrist', 'elbow'],
  sources: ['ace-chest-press', 'barbell-logic-grip', 'weiss1995', 'nance2017', 'fees1998', 'muyor2023', 'nhs-wrist-pain', 'nhs-elbow-pain'],
  research: { card: 'grip/research/machine_chest_press.json', rev: 1 },
} satisfies HowToContent;

const SOURCES: Record<string, Source> = {
  'ace-chest-press': { id: 'ace-chest-press', cite: 'ACE Exercise Library, Seated Chest Press', url: 'https://www.acefitness.org/resources/everyone/exercise-library/188/seated-chest-press/', kind: 'guideline', access: 'full', checked: null },
  'barbell-logic-grip': { id: 'barbell-logic-grip', cite: 'Barbell Logic, Bench Press Grip Tips', url: 'https://barbell-logic.com/bench-press-grip-tips/', kind: 'coach', access: null as unknown as Source['access'], checked: null },
  weiss1995: { id: 'weiss1995', cite: 'Weiss ND et al. 1995', url: 'https://pubmed.ncbi.nlm.nih.gov/7593079/', kind: 'peer-reviewed', access: 'abstract', checked: null },
  nance2017: { id: 'nance2017', cite: 'Nance EM et al. 2017', url: 'https://pubmed.ncbi.nlm.nih.gov/29085728/', kind: 'peer-reviewed', access: 'abstract', checked: null },
  muyor2023: { id: 'muyor2023', cite: 'Muyor JM et al. 2023', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10203828/', kind: 'peer-reviewed', access: 'full', checked: null },
  fees1998: { id: 'fees1998', cite: 'Fees M et al. 1998', url: 'https://pubmed.ncbi.nlm.nih.gov/9784824/', kind: 'peer-reviewed', access: null as unknown as Source['access'], checked: null },
  'nhs-wrist-pain': { id: 'nhs-wrist-pain', cite: 'NHS, Wrist pain', url: 'https://www.nhs.uk/conditions/hand-pain/wrist-pain/', kind: 'guideline', access: 'full', checked: '2026-09-30' },
  'nhs-elbow-pain': { id: 'nhs-elbow-pain', cite: 'NHS, Elbow and arm pain', url: 'https://www.nhs.uk/symptoms/elbow-and-arm-pain/', kind: 'guideline', access: 'full', checked: '2026-09-30' },
  'unreachable-source': { id: 'unreachable-source', cite: 'A source nobody could open', url: 'https://example.com/404', kind: 'secondary', access: 'unreachable', checked: '2026-09-30' },
};

const KNOWN_IDS = new Set(Object.keys(COVERAGE));

describe('HT4-A2: content-types.ts compiles a real golden-B spec (machine_chest_press, mapped)', () => {
  it('the good fixture passes every check clean (the literal above compiled, this proves it also behaves)', () => {
    expect(checkC1(GOOD_CONTENT, KNOWN_IDS)).toEqual([]);
    expect(checkC2(GOOD_CONTENT)).toEqual([]);
    expect(checkC3(GOOD_CONTENT, 'Machine')).toEqual([]);
    expect(checkC4(GOOD_CONTENT)).toEqual([]);
    expect(checkC7(GOOD_CONTENT)).toEqual([]);
    expect(checkC8(GOOD_CONTENT, SOURCES)).toEqual([]);
    expect(checkC16(GOOD_CONTENT)).toEqual([]);
  });
});

describe('HT4-A3/A4: C1-C4, C6-C8, C15-C17, each proven by a bad fixture naming the rule', () => {
  it('C1 fails on a zoom reference to a key that does not exist', () => {
    const bad = checkC1(c1Mutate(GOOD_CONTENT), KNOWN_IDS);
    expect(bad.length).toBeGreaterThan(0);
    expect(bad.every(m => m.startsWith('C1:'))).toBe(true);
  });

  it('C1 fails when a hand zoom\'s hand.wrong references a fault key not in handling.faults', () => {
    const bad = checkC1(c1DanglingFault(GOOD_CONTENT), KNOWN_IDS);
    expect(bad.some(m => m.includes('not-a-real-fault') && m.includes('not in handling.faults'))).toBe(true);
  });

  it('C2 fails when a muscle is both primary and watch', () => {
    const bad = checkC2(c2PrimaryWatch(GOOD_CONTENT));
    expect(bad.some(m => m.includes('both primary and watch'))).toBe(true);
  });

  it('C2 fails when a NO_REGION id (brachialis) is used in feel.primary', () => {
    const bad = checkC2(c2NoRegion(GOOD_CONTENT));
    expect(bad.some(m => m.includes('feel.primary') && m.includes('no drawn region'))).toBe(true);
  });

  it('D-HT4-C2: a NO_REGION id (brachialis) passes as text-only in feel.secondary and feel.watch', () => {
    const withSecondary = { ...GOOD_CONTENT, feel: { ...GOOD_CONTENT.feel, secondary: [...GOOD_CONTENT.feel.secondary, { muscleId: 'brachialis' as const, plain: 'Text only, no drawn region.' }] } };
    expect(checkC2(withSecondary)).toEqual([]);
    const withWatch = { ...GOOD_CONTENT, feel: { ...GOOD_CONTENT.feel, watch: [...GOOD_CONTENT.feel.watch, { muscleId: 'rotator_cuff' as const, plain: 'Text only, no drawn region.' }] } };
    expect(checkC2(withWatch)).toEqual([]);
  });

  it('D-HT4-C2: a NO_REGION id still fails as a feel.rows[].at.muscles highlight (needs a real region to shimmer)', () => {
    const bad = checkC2(c2NoRegionInRow(GOOD_CONTENT));
    expect(bad.some(m => m.includes('has no drawn region to highlight'))).toBe(true);
  });

  it('D-HT4-C2: an unknown muscle id fails', () => {
    const bad = checkC2(c2UnknownId(GOOD_CONTENT));
    expect(bad.some(m => m.includes('not_a_real_muscle') && m.includes('is not isMuscleId'))).toBe(true);
  });

  it('C2 fails when a part id is not in bodyMuscles.ts', () => {
    const bad = checkC2(c2BadPart(GOOD_CONTENT));
    expect(bad.some(m => m.includes('is not in bodyMuscles.ts'))).toBe(true);
  });

  it('C3 fails when handling needs a hand zoom and none exists', () => {
    const bad = checkC3(c3Mutate(GOOD_CONTENT), 'Machine');
    expect(bad.every(m => m.startsWith('C3:'))).toBe(true);
    expect(bad.length).toBeGreaterThan(0);
  });

  it('C4 fails when overBody needs a wrapped or over thumb and gets neither', () => {
    const bad = checkC4(c4Mutate(GOOD_CONTENT));
    expect(bad).toEqual([expect.stringContaining('C4:')]);
  });

  it('C6 fails when an exercises.json id has no coverage entry', () => {
    const ids = exercises.map(e => e.id);
    const bad = checkC6(ids, c6Mutate(COVERAGE));
    expect(bad).toEqual(['C6: "lib_pallof_press" has no HowTo and no archetype stub']);
  });
  it('C6 passes on the real 153-id coverage table', () => {
    const ids = exercises.map(e => e.id);
    expect(checkC6(ids, COVERAGE)).toEqual([]);
  });

  it('C7 fails on a banned phrase in user copy', () => {
    const bad = checkC7(c7Mutate(GOOD_CONTENT));
    expect(bad.some(m => m.includes('contains "engage"'))).toBe(true);
    expect(bad.some(m => m.includes('contains "maximise"'))).toBe(true);
  });

  it('C7 fails when a label field (a zoom chip) is over labelMaxWords', () => {
    const bad = checkC7(c7LabelTooLong(GOOD_CONTENT));
    expect(bad.some(m => m.includes('chip') && m.includes('at most 3'))).toBe(true);
  });

  it('C7 fails when the redFlag box is over redFlagBoxWords', () => {
    const bad = checkC7(c7RedFlagTooLong(GOOD_CONTENT));
    expect(bad.some(m => m.startsWith('C7: redFlag:') && m.includes('at most 30'))).toBe(true);
  });

  it('C7 fails when a feel-row fix does not start with an imperative verb', () => {
    const bad = checkC7(c7FixNotAVerb(GOOD_CONTENT));
    expect(bad.some(m => m.includes('must start with a verb'))).toBe(true);
  });

  it('C7 fails when the visible-word budget (450) is exceeded', () => {
    const bad = checkC7(c7VisibleBudget(GOOD_CONTENT));
    expect(bad.some(m => m.startsWith('C7: visible words') && m.includes('at most 450'))).toBe(true);
  });

  it('LIMITS matches copy-lint.mjs\'s own exported constants exactly (transcribed from tools/plates/layers/artifact/copy-lint.mjs, not imported - c7.ts stays self-contained per the supervisor)', () => {
    expect(c7LIMITS).toEqual({
      anySentenceWords: 15, feelLineWords: 20, feelLineSentences: 2, rowWhereWords: 6, rowMeansWords: 12,
      rowMeansSentences: 1, rowFixWords: 15, rowFixSentences: 2, leadLineWords: 22, leadLineSentences: 2,
      setupStepWords: 12, setupMaxSteps: 5, mistakesMax: 3, mistakeLabelWords: 5, mistakeFixWords: 12,
      feelRowsMax: 4, captionWords: 10, risksMax: 3, riskWords: 14, redFlagBoxWords: 30, sourceNoteWords: 12,
      altWords: 30, labelMinWords: 1, labelMaxWords: 3, cueWords: 6, visibleWordsMax: 450,
    });
  });

  it('C8 fails when a rule has no Claim', () => {
    const bad = checkC8(c8MissingClaim(GOOD_CONTENT), SOURCES);
    expect(bad.some(m => m.includes('no Claim'))).toBe(true);
  });
  it('C8 fails when a claim\'s only source is unreachable', () => {
    const bad = checkC8(c8Unreachable(GOOD_CONTENT), SOURCES);
    expect(bad.some(m => m.includes('every source is unreachable'))).toBe(true);
  });
  it('C8 fails when a fix carries its own red-flag wording', () => {
    const bad = checkC8(c8RedFlag(GOOD_CONTENT), SOURCES);
    expect(bad.some(m => m.includes('red-flag wording'))).toBe(true);
  });

  it('C15 stub passes while reviews.json is empty', () => {
    expect(checkC15(GOOD_CONTENT, {}, { schema: 1, entries: [] })).toEqual([]);
  });
  it('C15 fails once reviews.json holds entries but none matches the current hash', () => {
    const bad = checkC15(GOOD_CONTENT, {}, c15Reviews);
    expect(bad.length).toBe(1);
    expect(bad[0]).toContain('C15:');
  });
  it('C15 passes once reviews.json carries the exact current hash', () => {
    const hash = contentHash(GOOD_CONTENT, {});
    const bad = checkC15(GOOD_CONTENT, {}, { schema: 1, entries: [{ scope: GOOD_CONTENT.id, hash, coach: 'j.doe', date: '2026-01-01' }] });
    expect(bad).toEqual([]);
  });

  it('C16 fails when a zoom is missing alt.wrong', () => {
    const bad = checkC16(c16Mutate(GOOD_CONTENT));
    expect(bad.some(m => m.includes('no alt.wrong'))).toBe(true);
  });

  it('C16 fails when a posture zoom sets view but no camLabel', () => {
    const bad = checkC16(c16ViewNoCamLabel(GOOD_CONTENT));
    expect(bad.some(m => m.includes('needs its own camLabel'))).toBe(true);
  });

  it('C16 fails when a posture zoom has no wrong crop defined', () => {
    const bad = checkC16(c16MissingWrongCrop(GOOD_CONTENT));
    expect(bad.some(m => m.includes('no wrong crop defined'))).toBe(true);
  });

  it('C17 fails on the fixture that calls fetch(), and only on the known C17 fixtures in the same folder', () => {
    const bad = checkC17([new URL('.', import.meta.url).pathname + 'fixtures/bad']);
    const knownC17Bad = [
      'c17-network.ts', 'c17-xmlns-other-url.ts', 'c17-xmlns-outside-attr.ts', 'c17-xmlns-other-host.ts',
      'c17-xmlns-escaped-other-host.ts', 'c17-xmlns-not-whole-attr.ts',
      // HT-4b: the new C17 fixtures, and the C19 fixtures that hold a URL (C17 rightly fails them too)
      'c17-cite-url.ts', 'c17-xmlns-escaped-https.ts', 'c17-xmlns-prefixed-name.ts', 'c19-m7-link.ts', 'c19-gen-escaped-attrs.ts',
    ];
    expect(bad.every(m => knownC17Bad.some(f => m.includes(f)))).toBe(true);
    expect(bad.some(m => m.includes('c17-network.ts') && m.includes('fetch'))).toBe(true);
  });

  it('D-HT4-C17: the SVG/xlink xmlns attributes are allowed exactly, never a bare occurrence of the same URL', () => {
    const bad = checkC17([new URL('.', import.meta.url).pathname + 'fixtures/bad']);
    // c17-xmlns-other-url.ts: the xmlns attribute itself never fails, only the unrelated URL beside it.
    const otherUrlBad = bad.filter(m => m.includes('c17-xmlns-other-url.ts'));
    expect(otherUrlBad.some(m => m.includes('example.com/not-a-citation'))).toBe(true);
    expect(otherUrlBad.every(m => !m.includes('w3.org/2000/svg'))).toBe(true);
    // c17-xmlns-outside-attr.ts: the same URL outside a well-formed xmlns attribute (here, inside href=) still fails.
    expect(bad.some(m => m.includes('c17-xmlns-outside-attr.ts') && m.includes('w3.org/2000/svg'))).toBe(true);
    // c17-xmlns-other-host.ts: xmlns pointing at a different host still fails.
    expect(bad.some(m => m.includes('c17-xmlns-other-host.ts') && m.includes('example.com/not-the-real-namespace'))).toBe(true);
  });

  it('round-3 review fix (low 2): the xmlns allowance is anchored as a whole attribute - data-xmlns= still fails, and the escaped form still passes/fails correctly', () => {
    const bad = checkC17([new URL('.', import.meta.url).pathname + 'fixtures/bad']);
    // c17-xmlns-not-whole-attr.ts: data-xmlns="..." is not the whole xmlns attribute - still fails.
    expect(bad.some(m => m.includes('c17-xmlns-not-whole-attr.ts') && m.includes('w3.org/2000/svg'))).toBe(true);
    // The escaped form of the real namespace passes; the escaped form on a different host still fails.
    const good = mkdtempSync(join(tmpdir(), 'c17-good-anchor-'));
    try {
      writeFileSync(join(good, 'ok.ts'), 'export const a = \'{"svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\"></svg>"}\';');
      expect(checkC17([good])).toEqual([]);
      writeFileSync(join(good, 'bad.ts'), 'export const b = \'{"svg":"<svg xmlns=\\"https://example.com/x\\"></svg>"}\';');
      const escapedOtherHost = checkC17([good]);
      expect(escapedOtherHost.some(m => m.includes('example.com/x'))).toBe(true);
    } finally {
      rmSync(good, { recursive: true, force: true });
    }
  });

  it('D-HT4-C17 escaped-quote follow-up (HT-7): the escaped-quote xmlns form (src/howto/generated/*.ts\'s own JSON-string encoding) is allowed exactly, and still fails when it points at a different host', () => {
    const bad = checkC17([new URL('.', import.meta.url).pathname + 'fixtures/bad']);
    // c17-xmlns-escaped-other-host.ts: the escaped-quote form pointing at a different host still fails (4th mutation).
    expect(bad.some(m => m.includes('c17-xmlns-escaped-other-host.ts') && m.includes('example.com/not-the-real-namespace'))).toBe(true);
    // The escaped-quote form of the real SVG/xlink namespaces, on their own, passes clean.
    const good = mkdtempSync(join(tmpdir(), 'c17-good-escaped-'));
    try {
      writeFileSync(join(good, 'ok.ts'), 'export const a = \'{"svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" xmlns:xlink=\\"http://www.w3.org/1999/xlink\\"></svg>"}\';');
      expect(checkC17([good])).toEqual([]);
    } finally {
      rmSync(good, { recursive: true, force: true });
    }
  });

  it('D-HT4-C17: the exact allowed xmlns/xlink attribute forms pass clean, on their own, in either quote style', () => {
    const good = mkdtempSync(join(tmpdir(), 'c17-good-'));
    try {
      writeFileSync(join(good, 'ok.ts'), [
        'export const a = \'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>\';',
        "export const b = \"<svg xmlns='http://www.w3.org/2000/svg'></svg>\";",
      ].join('\n'));
      expect(checkC17([good])).toEqual([]);
    } finally {
      rmSync(good, { recursive: true, force: true });
    }
  });
});

describe('HT4b-A3: C17 final form (D-LR23-7): no URL at all, only the SVG/xlink namespace attributes are exempt', () => {
  const BAD = new URL('.', import.meta.url).pathname + 'fixtures/bad';

  it('checkC17 takes no allowedUrls parameter', () => {
    expect(checkC17.length).toBe(1);
  });

  it('a source citation URL fails, with the final failure text', () => {
    const bad = checkC17([BAD]);
    expect(bad.some(m => /^C17: .*c17-cite-url\.ts: URL "https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/7598007\/" is not allowed$/.test(m))).toBe(true);
  });

  it('an escaped xmlns=\\"https://example.com/x\\" fails, reported without the trailing backslash (round-4 review)', () => {
    const bad = checkC17([BAD]).filter(m => m.includes('c17-xmlns-escaped-https.ts'));
    expect(bad).toEqual([expect.stringMatching(/: URL "https:\/\/example\.com\/x" is not allowed$/)]);
  });

  it('fooxmlns= is not the whole xmlns attribute, so its SVG namespace URL fails (round-4 review)', () => {
    const bad = checkC17([BAD]);
    expect(bad.some(m => m.includes('c17-xmlns-prefixed-name.ts') && m.includes('w3.org/2000/svg'))).toBe(true);
  });

  it('the escaped SVG namespace attribute passes', () => {
    const good = mkdtempSync(join(tmpdir(), 'c17-b-good-'));
    try {
      writeFileSync(join(good, 'ok.ts'), 'export const a = \'{"svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\"></svg>"}\';');
      expect(checkC17([good])).toEqual([]);
    } finally {
      rmSync(good, { recursive: true, force: true });
    }
  });
});

describe('HT4-A4: the checks are pure, no DOM, and cheap', () => {
  it('none of the checks touch a global DOM (jsdom/document/window)', () => {
    expect(typeof document).toBe('undefined');
    expect(typeof window).toBe('undefined');
  });
});

// Review fix (blocker 2, PR #107): the card asks every real content file to pass every check, not just the one
// copied-verbatim fixture above. src/howto/content/**/*.ts holds 0 files today (no exercise has been authored yet -
// that is later cards' job), so this only proves the wiring now; it starts failing the moment the first real file
// disagrees with a check, instead of that drift going unnoticed until it ships.
describe('HT4-A2/A3: every real content file under src/howto/content passes every check (0 files today - this is the guard for the first one)', () => {
  it('C1-C4, C7, C8, C15, C16 all return [] for every src/howto/content/**/*.ts default export', async () => {
    const walk = (dir: string): string[] => {
      let entries;
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return []; }
      return entries.flatMap(e => {
        const p = join(dir, e.name);
        return e.isDirectory() ? walk(p) : /\.ts$/.test(e.name) ? [p] : [];
      });
    };
    const CONTENT_DIR = join(new URL('.', import.meta.url).pathname, '..', '..', 'src', 'howto', 'content');
    const files = walk(CONTENT_DIR);
    const EQUIPMENT_BY_ID = new Map((exercises as Array<{ id: string; equipment: string }>).map(e => [e.id, e.equipment]));
    const reviewsFile = JSON.parse(
      readFileSync(join(new URL('.', import.meta.url).pathname, '..', '..', 'docs', 'research', 'howto', 'reviews.json'), 'utf8'),
    );
    for (const f of files) {
      const mod = await import(/* @vite-ignore */ pathToFileURL(f).href);
      const content = mod.default as HowToContent;
      const bad: string[] = [
        ...checkC1(content, KNOWN_IDS),
        ...checkC2(content),
        ...checkC3(content, EQUIPMENT_BY_ID.get(content.id) ?? ''),
        ...checkC4(content),
        ...checkC7(content),
        ...checkC8(content, SOURCES),
        ...checkC15(content, {}, reviewsFile),
        ...checkC16(content),
      ];
      expect(bad, `${f}: ${JSON.stringify(bad)}`).toEqual([]);
    }
  });

  it('C17: no network call and no URL (only the SVG/xlink namespace attributes), anywhere in src/howto or src/slices/howto', () => {
    const root = join(new URL('.', import.meta.url).pathname, '..', '..');
    expect(checkC17([join(root, 'src', 'howto'), join(root, 'src', 'slices', 'howto')])).toEqual([]);
  });
});

// HT-4b (HT4b-A4/A5): C19, no sources or contacts in the How-to UI (owner decision LR-23). Before HT-5 there is no
// generated archetypes.ts/ht-*.ts copy yet, so (a) and (b) run on golden B itself: the vendored howto/shared.mjs and
// the 8 *.howto.mjs sheets, with copy-lint's own copyFields list and registry names. HT5-A2 points them at the
// generated files.
describe('HT4b-A4/A5: C19 no sources or contacts, each rule proven by a bad fixture naming it', () => {
  const LAYERS = new URL('../../tools/plates/layers/', import.meta.url);
  const BAD = new URL('.', import.meta.url).pathname + 'fixtures/bad';
  const SHEET_IDS = [
    'barbell_back_squat', 'dumbbell_lateral_raise', 'hanging_leg_raise', 'lat_pulldown',
    'leg_press', 'machine_chest_press', 'pull_up', 'seated_cable_row',
  ];
  type Sheet = c19Copy.Sheet & { SOURCES?: Record<string, { cite: string }> };
  let shared: Record<string, unknown>;
  let sheets: Record<string, Sheet>;
  let lint: {
    copyFields: (M: unknown) => CopyField[];
    sourceNamePatterns: (modules: unknown[]) => SourceName[];
  };
  let names: SourceName[];
  const chest = () => sheets.machine_chest_press!;
  const copyOf = (M: unknown, label = 'machine_chest_press') => checkC19Copy(lint.copyFields(M), label, names);

  beforeAll(async () => {
    shared = { ...(await import(/* @vite-ignore */ new URL('howto/shared.mjs', LAYERS).href)) };
    lint = await import(/* @vite-ignore */ new URL('artifact/copy-lint.mjs', LAYERS).href);
    const files = readdirSync(new URL('exercises/', LAYERS)).filter(f => f.endsWith('.howto.mjs')).sort();
    sheets = {};
    for (const f of files) sheets[f.replace('.howto.mjs', '')] = await import(/* @vite-ignore */ new URL(`exercises/${f}`, LAYERS).href);
    names = lint.sourceNamePatterns(Object.values(sheets));
  });

  it('(a)/(b) never pass on nothing: exactly the 8 sheets, a shared module with red-flag boxes, registry names found', () => {
    expect(Object.keys(sheets)).toEqual(SHEET_IDS);
    expect(Object.keys(shared).filter(k => k.startsWith('RED_FLAG')).length).toBeGreaterThanOrEqual(4);
    expect(names.map(([n]) => n)).toEqual(expect.arrayContaining(['Muyor', 'Calatayud', 'NHS']));
    expect(checkC19Shared({}, 'empty')).toEqual(expect.arrayContaining([expect.stringContaining('no RED_FLAG box'), expect.stringContaining('DISCLAIMER is missing')]));
    expect(checkC19Copy([], 'empty')).toEqual(['C19: empty: no copy field to check']);
    expect(checkC19Files([])).toEqual(['C19: no How-to file to check']);
  });

  it('(a) golden B\'s shared module passes: no SHOW_EVIDENCE, clean red-flag boxes and disclaimer', () => {
    expect(checkC19Shared(shared, 'shared', names)).toEqual([]);
  });

  it('(b) every copy field of all 8 sheets passes (source notes excepted)', () => {
    for (const id of SHEET_IDS) {
      const fields = lint.copyFields(sheets[id]);
      expect(fields.some(f => f.kind === 'sourceNote'), `${id} has research notes to skip`).toBe(true);
      expect(checkC19Copy(fields, id, names), id).toEqual([]);
    }
  });

  it('(c) every file under src/howto and src/slices/howto passes', () => {
    const root = join(new URL('.', import.meta.url).pathname, '..', '..');
    const files = filesUnder([join(root, 'src', 'howto'), join(root, 'src', 'slices', 'howto')]);
    expect(files.some(f => f.includes(`${join('src', 'howto', 'generated')}`))).toBe(true);
    expect(checkC19Files(files)).toEqual([]);
  });

  it('(d) every generated feel-*.ts passes (one per approved exercise, HT-8)', () => {
    const root = join(new URL('.', import.meta.url).pathname, '..', '..');
    const feel = filesUnder([join(root, 'src', 'howto', 'generated')]).filter(f => /(^|[\\/])feel-[^\\/]*\.ts$/.test(f));
    expect(feel).toHaveLength(8);
    for (const f of feel) expect(checkC19Feel(f, names), f).toEqual([]);
  });

  it('M1: SHOW_EVIDENCE = true fails', () => {
    expect(checkC19Shared(c19M1(shared), 'shared', names)).toEqual([`C19: shared: ${RULE_SHOW_EVIDENCE}`]);
  });

  it('M2: "…? Call 999." in RED_FLAG_KNEE.now fails (contact and safety line)', () => {
    const bad = checkC19Shared(c19M2(shared as never), 'shared', names);
    expect(bad).toContain(`C19: shared: RED_FLAG_KNEE.now: ${RULE_CONTACT}: "999"`);
    expect(bad).toContain(`C19: shared: RED_FLAG_KNEE.now: ${RULE_SAFETY}: "Call"`);
  });

  it('M3: "Go to A&E." in a back box fails; the pass fixture "Get emergency help now." passes (D-LR23-1)', () => {
    expect(checkC19Shared(c19M3(shared), 'shared', names)).toEqual([`C19: shared: RED_FLAG_BACK.now: ${RULE_CONTACT}: "A&E"`]);
    expect(checkC19Shared(c19BackPass(shared), 'shared', names)).toEqual([]);
  });

  const COPY_CASES: Array<[string, (M: Sheet) => Sheet, string, string]> = [
    ['M4 "(Muyor 2023)" in a feel fix', c19Copy.m4, RULE_SOURCE, '"(Muyor 2023)"'],
    ['M5 "+44 20 7946 0000" in a risk line', c19Copy.m5, RULE_CONTACT, '"+44 20 7946 0000"'],
    ['M6 "www.nhs.uk" in a setup line', c19Copy.m6, RULE_CONTACT, '"www."'],
    ['M9 "help@example.org" in a mistake fix', c19Copy.m9, RULE_CONTACT, '"help@example.org"'],
    ['"Weiss 1995" in a setup line', c19Copy.weiss1995, RULE_SOURCE, '"Weiss 1995"'],
    ['"NSCA teaches" in a setup line', c19Copy.nsca, RULE_SOURCE, '"NSCA"'],
    ['"text HOME to 741741" in a setup line', c19Copy.textHome, RULE_CONTACT, '"text HOME to"'],
    ['"ring 13 11 14" in a setup line', c19Copy.ring131114, RULE_CONTACT, '"13 11 14"'],
    ['a registry first-author surname ("Calatayud") in a setup line', c19Copy.registrySurname, RULE_NAME, '"Calatayud"'],
  ];
  for (const [name, mutate, rule, match] of COPY_CASES) {
    it(`${name} fails, naming the rule`, () => {
      const bad = copyOf(mutate(chest()));
      expect(bad.length, JSON.stringify(bad)).toBeGreaterThan(0);
      expect(bad.some(m => m.includes(`: ${rule}: ${match}`)), JSON.stringify(bad)).toBe(true);
    });
  }

  it('the registry-surname fixture is caught only by the data-driven name check', () => {
    expect(checkC19Copy(lint.copyFields(c19Copy.registrySurname(chest())), 'machine_chest_press')).toEqual([]);
  });

  const FILE_CASES: Array<[string, boolean, string, string]> = [
    ['c19-m7-link.ts', false, RULE_LINK, '"<a href='],
    ['c19-m7-link.ts', false, RULE_TARGET, '"target='],
    ['c19-m7-link.ts', false, RULE_HREF, 'href="https://pubmed'],
    ['c19-m8-evidence-label.ts', false, RULE_CLASS, '"ev"'],
    ['c19-m8-evidence-label.ts', false, RULE_CLASS, '"ev-data"'],
    ['c19-m8-evidence-label.ts', false, RULE_LABEL, '>Measured<'],
    ['c19-src-cite-class.ts', false, RULE_CLASS, '"src-cite"'],
    ['c19-gen-escaped-attrs.ts', true, RULE_CLASS, '"srcs"'],
    ['c19-gen-escaped-attrs.ts', true, RULE_HREF, 'xlink:href=\\"https://example.com/x\\"'],
    ['c19-gen-url-key.ts', true, RULE_GEN_KEY, '"url"'],
    ['c19-gen-cite-key.ts', true, RULE_GEN_KEY, '"cite"'],
    ['c19-gen-sources-export.ts', true, RULE_GEN_SOURCES, 'export const sources'],
  ];
  for (const [file, generated, rule, match] of FILE_CASES) {
    it(`(c) ${file} fails on ${rule}`, () => {
      const bad = checkC19File(join(BAD, file), generated);
      expect(bad.some(m => m.includes(`: ${rule}: `) && m.includes(match)), JSON.stringify(bad)).toBe(true);
    });
  }

  it('(c) a file named sources.ts under src/howto/generated fails', () => {
    const dir = mkdtempSync(join(tmpdir(), 'c19-gen-'));
    try {
      writeFileSync(join(dir, 'sources.ts'), 'export default [];\n');
      expect(checkC19File(join(dir, 'sources.ts'), true)).toEqual([`C19: ${join(dir, 'sources.ts')}: ${RULE_GEN_SOURCES}: "sources.ts"`]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('(c) a local SVG <use href="#…">, escaped or not, passes; url/cite keys only fail under src/howto/generated', () => {
    const dir = mkdtempSync(join(tmpdir(), 'c19-ok-'));
    try {
      const f = join(dir, 'ok.ts');
      writeFileSync(f, 'export const a = \'<use href="#a"/><use xlink:href=\\"#b\\"/>\'; export const d = { url: 1, cite: 2 };\n');
      expect(checkC19File(f, false)).toEqual([]);
      expect(checkC19File(f, true).length).toBe(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('(c) over the whole bad-fixture folder: every C19 file fixture fails, and nothing else but the one C17 fixture that holds an <a>', () => {
    const files = readdirSync(BAD).map(f => join(BAD, f));
    const bad = checkC19Files(files, f => /c19-gen-/.test(f));
    const failing = [...new Set(bad.map(m => (m.split(': ')[1] ?? '').split(/[\\/]/).pop()))].sort();
    expect(failing).toEqual([
      'c17-xmlns-outside-attr.ts', 'c19-gen-cite-key.ts', 'c19-gen-escaped-attrs.ts', 'c19-gen-sources-export.ts',
      'c19-gen-url-key.ts', 'c19-m7-link.ts', 'c19-m8-evidence-label.ts', 'c19-src-cite-class.ts',
    ]);
  });

  it('(d) pre-rendered feel HTML fails on contact wording in its text and source wording in an aria-label', () => {
    const bad = checkC19Feel(join(BAD, 'c19-feel-prerendered.ts'), names);
    expect(bad.some(m => m.includes(`${RULE_CONTACT}: "999"`))).toBe(true);
    expect(bad.some(m => m.includes(`${RULE_SOURCE}: "Muyor 2023"`))).toBe(true);
  });
});
