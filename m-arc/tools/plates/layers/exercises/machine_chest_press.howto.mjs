// How-to content for the machine chest press (lib_machine_chest_press): grip, posture close-ups, where to feel it.
// Shape: grip/GRIP-AND-FEEL-ARCHITECTURE.md 4.1-4.4 (HowTo, HandlingSpec, ZoomSpec, FeelSpec, SetupStep,
// PostureCheckpoint). Content: the verified card grip/research/machine_chest_press.json, with the corrections the
// architecture made in appendix A1 (feel line, rows 1-3, red-flag wording), then cut to the owner's "shorter, concept
// first" limits of 2026-09-30 (artifact/copy-lint.mjs). GENERAL.md wording is not used.
// Render check: node exercises/machine_chest_press.howto-render.mjs  ->  out/machine_chest_press-howto-*.png
//
// Additions to the architecture's types, used by the mockup only (marked "mockup" below):
//   ZoomSpec.callouts   one callout per crop ({ right, wrong }: text + the mark it names). The text is printed under
//                       "Right" / "Wrong" as on the hand zoom; the mark (guide) is drawn in the crop
//   ZoomSpec.crop.pose  the posture crops are built from still poses of the plate spec (see `stills`)
//   HandPose.thumb      'loose' (a thumb resting beside the handle, not round it): the hand renderer has it,
//                       the architecture's ThumbMode list does not yet
import plateSpec from './machine_chest_press.mjs';
// RED_FLAG (and any other shared safety copy) comes from the one shared module (plan S-2 condition 4); re-exported
// for the render scripts. DISCLAIMER is shown once per sheet by the page, from the same module.
import { RED_FLAG } from '../howto/shared.mjs';
export { RED_FLAG };

/* ---------------------------------------------------------------- sources (registry entries this sheet cites) --
 * `use` is the evidence label FOR THIS USE (architecture 3: a tag rates the source for this claim, not the paper).
 * `access` is what the card's verifier says it read; null = the card does not say, to be filled by the verifier. */
export const SOURCES = {
  'ace-chest-press': { cite: 'ACE Exercise Library, Seated Chest Press', url: 'https://www.acefitness.org/resources/everyone/exercise-library/188/seated-chest-press/',
    kind: 'guideline', access: 'full', checked: '2026-09-30', use: 'CONSENSUS', note: 'Coaching guide. Seat height, full grip, start at the chest.' },
  muyor2023: { cite: 'Muyor JM, Rodriguez-Ridao D, Oliva-Lozano JM. Muscle activity, horizontal bench press vs seated chest press, several grips. J Hum Kinet 2023;87:23-34', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10203828/',
    kind: 'peer-reviewed', access: 'full', checked: '2026-09-30', use: 'DATA', note: 'Muscle study. Handle type made no chest difference.' },
  weiss1995: { cite: 'Weiss ND et al. Position of the wrist associated with the lowest carpal-tunnel pressure. J Bone Joint Surg Am 1995;77(11):1695-9', url: 'https://pubmed.ncbi.nlm.nih.gov/7593079/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'MECH/WEAK', note: 'Nerve-pressure study, not lifting.' },
  nance2017: { cite: 'Nance EM et al. Dorsal wrist pain in the extended wrist-loading position: an MRI study. J Wrist Surg 2017;6(4):276-279', url: 'https://pubmed.ncbi.nlm.nih.gov/29085728/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'WEAK', note: 'Push-ups, planks and yoga, not presses. A link in patients, not cause.' },
  fees1998: { cite: 'Fees M, Decker T, Snyder-Mackler L, Axe MJ. Upper extremity weight-training modifications for the injured athlete. Am J Sports Med 1998;26(5):732-42', url: 'https://pubmed.ncbi.nlm.nih.gov/9784824/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'CONSENSUS', note: 'Expert article on training around injuries, not a trial.' },
  snyder2012: { cite: 'Snyder BJ, Fry WR. Effect of verbal instruction on muscle activity during the bench press. J Strength Cond Res 2012;26(9):2394-400', url: 'https://pubmed.ncbi.nlm.nih.gov/22076100/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'WEAK', note: 'Bench press, not the machine. Backs the chest-focus cue on lighter sets.' },
  calatayud2016: { cite: 'Calatayud J et al. Importance of mind-muscle connection during progressive resistance training. Eur J Appl Physiol 2016;116(3):527-33', url: 'https://pubmed.ncbi.nlm.nih.gov/26700744/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'WEAK', note: 'Bench press. The focus effect held on light to moderate weights only.' },
  'barbell-logic-grip': { cite: 'Barbell Logic, Bench Press Grip Tips', url: 'https://barbell-logic.com/bench-press-grip-tips/',
    kind: 'coach', access: 'full', checked: '2026-09-30', use: 'CONSENSUS', note: 'Written for the barbell bench. Heel-of-palm placement.' },
  'nhs-wrist-pain': { cite: 'NHS, Wrist pain', url: 'https://www.nhs.uk/conditions/hand-pain/wrist-pain/',
    kind: 'guideline', access: 'full', checked: '2026-09-30', use: 'CONSENSUS', note: 'When wrist pain needs a check.' },
  'nhs-elbow-pain': { cite: 'NHS, Elbow and arm pain', url: 'https://www.nhs.uk/symptoms/elbow-and-arm-pain/',   // RED_FLAG_ELBOW source
    kind: 'guideline', access: 'full', checked: '2026-09-30', use: 'CONSENSUS', note: 'When elbow pain needs a check.' },
};
// Left out on purpose (card evidence notes): Palmer and Werner 1984 (the "80 % through the radius" figure is not in
// its abstract), Mayo Clinic dorsal wrist impingement (403 to the verifier).

const C = (tags, sources, note) => ({ tags, sources, ...(note ? { note } : {}) });
const CL = {
  ace: C(['CONSENSUS'], ['ace-chest-press']),
  wrist: C(['CONSENSUS', 'MECH', 'WEAK'], ['ace-chest-press', 'barbell-logic-grip', 'weiss1995', 'nance2017'],
    'Heel of palm and straight wrist: ACE plus coaching consensus. 0-10 deg target leans on Weiss 1995 (nerve pressure, not lifting). The 15-20 deg limit is coaching consensus. Nance 2017 is association only.'),
  thumb: C(['CONSENSUS'], ['ace-chest-press'], 'ACE: full grip, thumbs around the handles. The "stops the handle rolling into the fingers" mechanism is consensus.'),
  handles: C(['DATA', 'CONSENSUS'], ['muyor2023'], 'No chest difference between handle types (Muyor 2023); choosing vertical for a sore wrist is consensus.'),
  seat: C(['CONSENSUS'], ['ace-chest-press'], 'No study measures seat height on this machine; ACE setup plus consensus.'),
  depth: C(['CONSENSUS'], ['ace-chest-press', 'fees1998']),
  feel: C(['DATA', 'CONSENSUS'], ['muyor2023', 'ace-chest-press'], 'The feel target is coaching, not EMG: front delts are about as active as the chest in Muyor 2023.'),
  cue: C(['WEAK'], ['snyder2012', 'calatayud2016'], 'Bench-press studies; framed for lighter sets.'),
  consensus: C(['CONSENSUS'], [], 'Coaching consensus (card).'),
  nhs: C(['CONSENSUS'], ['nhs-wrist-pain']),
};


/* ------------------------------------------------------------------------------------------------ hand ---------- */
// Right: the owner's photo 2 (wrist straight, knuckles in line with the forearm, handle in the heel of the palm).
// Wrong: the owner's photo 1 (wrist bent back ~35 deg, crease on the back of the wrist, handle in the finger bends,
// thumb loose). Owner decision 2026-09-30: his chest press used the HORIZONTAL handles (palms down), so the main
// close-up is the horizontal handle seen from the side (forearm pointing forward, as on the plate), where the wrist's
// back-and-forward bend lies flat on the screen. The vertical handle is a one-line note only.
const RIGHT_POSE = {
  view: 'radial', forearm: 90, wrist: { ext: 8, dev: 0 }, contactAt: 0.3, fingers: { curl: 1 }, thumb: 'wrapped',
  squeeze: 'firm', handle: { profile: 'press-horizontal', axis: 'across', diameterMm: 32 }, load: { kind: 'push' },
};
const BENT_BACK = {
  key: 'fingers-bent-back', label: 'Wrist bent back',
  pose: { wrist: { ext: 35, dev: 0 }, contactAt: 1.05, fingers: { curl: 0.92 }, thumb: 'loose' },
  markers: ['lever-arc'],
  alt: 'Horizontal handle, side view. The handle has slid into the fingers, thumb loose. The wrist is bent far back. The push passes behind the wrist, bending it further.',
};

/* --------------------------------------------------------------------------------------- posture stills --------- */
// Still poses for the posture crops, built from the plate spec's own poses (no new geometry). `seatDrop` lowers the
// seat, the back pad and the body together; the lever, the handles and the feet stay where they are.
const elbowUp = (reach, pole) => ({ r: { ...reach.r, pole }, l: { ...reach.l, pole: [-pole[0], pole[1], pole[2]] } });
export const stills = {
  start: { pose: plateSpec.poses.start },
  end: { pose: plateSpec.poses.end },
  // Seat too low (card mistake 2): 12 cm lower. The handles then start at shoulder-joint height, up at the collarbones
  // (render report: handle 12 cm above mid-chest). The card's wrong picture has "the elbow up near shoulder height":
  // the elbow pole turns out and up so the elbow sits 3 cm under the handle and the forearm runs almost level to it
  // (8 deg up in side view, render report). The plate's start pole would hang the elbow low with the forearm climbing
  // at about 40 deg, which reads as pushing upward, a different fault.
  'seat-low': { pose: { ...plateSpec.poses.start, reach: elbowUp(plateSpec.poses.start.reach, [-0.9, -0.1, -0.3]) }, seatDrop: 0.12 },
  // "Round and lock" (card mistake 3, the plate's own mistake pose): drawn solid in the Blades wrong crop.
  'round-lock': { pose: { ...plateSpec.poses.end, ...plateSpec.mistake.pose } },
};

/* ------------------------------------------------------------------------------------------------ zooms --------- */
const zooms = [
  {
    key: 'hand', chip: 'Hand', chipCaption: 'Heel of palm', heading: 'Hand: right and wrong', kind: 'hand',
    hand: {
      right: RIGHT_POSE,
      wrong: [BENT_BACK],
      // Owner decision 2026-09-30 (he used the horizontal handles): the horizontal handle, seen from the side, is the
      // main pair; the vertical handle is only the one-line note below. One page (push).
      camera: 'side',
      panelHeight: 150,
      note: 'Vertical handles: the same rule.',
      notes: { right: 'Heel of palm', wrong: 'Wrist bent back' },   // mockup: the 1-3 word notes over each half
    },
    caption: {
      right: 'Heel of your palm, thumb wrapped, wrist straight.',
      wrong: 'Handle in your fingers, wrist bent back, thumb loose.',
    },
    alt: {
      right: 'Horizontal handle, side view. The handle sits on the heel of the hand, thumb wrapped. Wrist straight, knuckles in line with the forearm. The push runs straight down the forearm.',
      wrong: BENT_BACK.alt,
    },
    feelRow: 'wrist',
  },
  {
    key: 'seat-height', chip: 'Seat height', heading: 'Seat height: right and wrong', kind: 'posture',
    crop: { center: { landmark: 'shoulder.r', pose: 'start', dx: 14, dy: 0 }, sizePx: 108 },
    right: 'start',
    wrong: { still: 'seat-low' },
    callouts: {   // mockup: one label per crop
      right: { text: 'Mid-chest', guide: 'handle-to-chest' },
      wrong: { text: 'Seat too low', guide: 'handle-to-chest' },   // names the fault, as the caption and card mistake 2 do
    },
    caption: {
      right: 'Handles meet the middle of your chest.',
      wrong: 'Seat too low: handles up near your shoulders.',
    },
    alt: {
      right: 'Side view, start of the press. The handle is level with the middle of the chest, the elbow below the shoulder.',
      wrong: 'Side view, seat too low. The handle is level with the top of the chest, near the shoulder. The elbow is raised almost to handle height. Mid-chest sits well below.',
    },
    feelRow: 'front-shoulders',
  },
  {
    key: 'blades', chip: 'Blades', heading: 'Shoulder blades: right and wrong', kind: 'posture',
    // wide enough for the pad, the shoulder, the elbow and the handle, so the locked elbow shows too
    // (dx 34 / size 150 cut the Wrong crop's dashed lever arm at the right edge: widened so it leaves at the top, as the
    // right crop's lever does)
    crop: { center: { landmark: 'shoulder.r', pose: 'end', dx: 44, dy: 6 }, sizePx: 168 },
    right: 'end',
    wrong: { still: 'round-lock', over: 'end' },   // mockup: the mistake pose dashed over the right pose
    callouts: {
      right: { text: 'On the pad', guide: 'pad-contact' },
      wrong: { text: 'Off the pad', guide: 'pad-gap' },
    },
    caption: {
      right: 'Shoulder blades on the pad, elbows slightly bent.',
      wrong: 'Shoulders roll off the pad, elbows locked.',
    },
    alt: {
      right: 'Side view, end of the press. Upper back and shoulder blades flat on the pad. Arms long, with a small bend at the elbow.',
      wrong: 'Side view, end of the press. The upper back rounds forward, about 4 cm off the pad. The elbows are locked straight.',
    },
    feelRow: 'elbows',
  },
];
// The fourth chip, "Where to feel it", is added by the sheet for every exercise with a FeelSpec (2.1), so at most 3
// ZoomSpecs here. "Start depth" is a top-down view the engine cannot draw yet: it stays a text checkpoint.

/* ------------------------------------------------------------------------------------------------ feel ---------- */
const HANDS = ['hand-left', 'hand-right', 'hand-back-left', 'hand-back-right'];
const feel = {
  primary: [{ muscleId: 'chest', plain: 'Across the middle and lower chest, the big fan of muscle from the breastbone out to the armpit.' }],
  secondary: [
    { muscleId: 'upper_chest', plain: 'The top of the chest, just under the collarbone, works too.' },
    { muscleId: 'triceps', plain: 'The back of the upper arm, mostly near the end of the push.' },
    { muscleId: 'front_delts', plain: 'The front of your shoulders help push, but they should not be where you feel it most.' },
  ],
  watch: [
    { muscleId: 'front_delts', plain: 'If the front of your shoulders burn more than your chest, your setup is usually off.' },
    { muscleId: 'upper_traps', plain: 'The tops of the shoulders and the neck should stay quiet. Shrugging means you have lost your shoulder position.' },
    { muscleId: 'forearms', plain: 'You will feel your grip working, but your wrist and forearm should never ache. An aching wrist usually means it is bending back.' },
  ],
  feelLine: 'You should feel this across the middle and lower chest. If your shoulders take over, check the seat height.',
  rows: [
    // Known map limit (C2, misleading region): bodyMuscles.ts draws front_delts as a thin strip along the collarbone,
    // not on the shoulder cap, so this row's dashed outline sits on the collarbone. Fix belongs in the shared map path
    // (engine/bodymap-parts.mjs shoulder-front-left/right, from wt-arch src/svg/bodyMuscles.ts); no per-exercise workaround.
    { key: 'front-shoulders', where: 'Front of the shoulders', at: { muscles: ['front_delts'] },
      means: 'The handles sit too high, or your shoulders roll off the pad.',
      fix: 'Check the seat height first. On most machines, raise it.',
      zoom: 'seat-height', claim: CL.seat },
    { key: 'wrist', where: 'Top or back of the wrist', at: { parts: HANDS },
      means: 'The handle has slid into your fingers, so your wrist bends back.',
      fix: 'Push from the heel of your palm. Go lighter until your wrist stays straight.',
      zoom: 'hand', redFlag: true, claim: CL.wrist },
    { key: 'wrist-sore', where: 'Wrist sore before you start', at: { parts: HANDS },
      means: 'Pressing heavy on a sore wrist can make it worse.',
      fix: 'Use the vertical handles and go lighter. Stop the set if it hurts.',
      zoom: 'hand', redFlag: true,
      claim: C(['CONSENSUS'], ['nhs-wrist-pain'], 'NHS self-care: do not lift heavy things with wrist pain. Handle choice is consensus (card).') },
    // behind "More". Owner 2026-09-30 ("shorter"): at most 4 rows. Kept: the three red-flag rows and the seat row (the
    // Seat height close-up links to it). Dropped: neck (shrug), triceps (short reps) and lower back (arching): no red
    // flag, no close-up, and the setup steps still cover shoulders down and sitting right back.
    { key: 'elbows', where: 'Elbows', at: { parts: ['elbow-left', 'elbow-right'] },
      means: 'You snap your elbows straight at the end of each push.',
      fix: 'Stop just before the elbows lock and control the way back.',
      zoom: 'blades', redFlag: 'elbow', claim: C(['CONSENSUS'], ['ace-chest-press', 'nhs-elbow-pain'], 'ACE: extended but not locked. "Hard lockout loads the elbow" is consensus. The referral is the shared elbow red flag (NHS), not the fix text (C8).') },
  ],
  libraryDiff: { add: ['upper_chest'], why: 'Muyor 2023: with neutral handles the upper (clavicular) chest works about as hard as the rest of the chest (about 30 % MVIC).' },
  claim: CL.feel,
};

/* ------------------------------------------------------------------------------------------------ plate ---------- */
// The approved golden-A plate, unchanged (owner rule; plan 2.4 and S-2 condition 1): "Elbows 45°" and the approved
// callouts stay, and Mistake keeps the approved body mistake ("round and lock"). The grip ("Heel of palm") is the Hand
// chip's caption and the hand close-up, outside the plate block.
const plate = plateSpec;

/* ------------------------------------------------------------------------------------------------ the HowTo ------ */
/* ---------------------------------------------------------------- handling mistakes, risks (plan 2.4 items 4, 7) --
 * From the verified card's handlingMistakes (grip/research/machine_chest_press.json): the mistake, its fix and what it can hurt,
 * cut to the owner's compact limits of 2026-09-30 (artifact/copy-lint.mjs; no citations in user copy, C7;
 * no red-flag wording, C8: the shared RED_FLAG and DISCLAIMER come from howto/shared.mjs). `zoom` = "Show me" target. */
const MISTAKES = [
  { key: 'wrist', title: 'Wrist bent back', zoom: 'hand', claim: CL.wrist,
    fix: 'Handle on the heel of your palm. Still bending? Go lighter.' },
  { key: 'seat-low', title: 'Seat too low', zoom: 'seat-height', claim: CL.seat,
    fix: 'Raise the seat so the handles meet mid-chest.' },
  { key: 'round-lock', title: 'Shoulders roll off, elbows lock', zoom: 'blades', claim: CL.ace,
    fix: 'Stop before your elbows lock. Rolling forward to finish? Go lighter.' },
];
// Owner 2026-09-30: at most 3. Dropped 'deep' (handles starting behind the chest, no close-up): setup step 2 and the
// shoulder risk line still say it, with the same claim (CL.depth).
const RISKS = [
  { key: 'wrist', text: 'Pushing through a bent-back wrist squeezes the back of the wrist.',
    claim: C(['MECH', 'WEAK'], ['nance2017'], 'Nance 2017: an MRI study of people with this pain; association, not cause.') },
  { key: 'shoulder', text: 'Handles behind your chest, elbows out, stretch the front of your shoulder under load.', claim: CL.depth },
  { key: 'elbow', text: 'Snapping your elbows straight under heavy weight loads the joints, not the muscles.', claim: C(['CONSENSUS'], ['ace-chest-press']) },
];

export default {
  schema: 1,
  id: 'lib_machine_chest_press',
  rev: 1,
  plate,
  handling: {
    archetype: 'push',
    orientation: 'pronated',   // owner 2026-09-30: horizontal handles, palms down (A1 main pair and inset swapped)
    handle: 'machine-grip',
    loadAxis: 'along-forearm',
    handleChoice: { sore: 'Sore wrist? Use the vertical handles.', claim: CL.handles },
    overBody: false,
    width: { text: 'Pick handles that put your hands just outside your shoulders at the start. Line each forearm up behind its handle.', claim: C(['DATA', 'CONSENSUS'], ['muyor2023']) },
    thumb: { mode: 'wrapped', claim: CL.thumb },
    contact: 'heel',
    wrist: { ext: [0, 10], dev: [-10, 10], limitText: 'Wrist bending back past about 15 to 20 degrees? Stop and go lighter.', claim: CL.wrist },
    pose: RIGHT_POSE,
    faults: [BENT_BACK],
    gripLine: 'Push through the heel of your palm, so your wrist stays straight. A wrapped thumb stops the handle rolling into your fingers.',
    cue: 'Heel of palm, wrist straight.',   // the workout hint line (2.1, outside the sheet)
  },
  contacts: ['seat-back', 'standing-feet'],
  // Owner 2026-09-30: at most 5 steps. Dropped: handle choice (the Grip section's "Sore wrist? Use the vertical
  // handles." keeps it), pick the weight (the grip line and wrist limit say when it is too heavy) and the foot bar (no
  // verified source yet).
  setup: [
    { kind: 'adjust', text: 'Set the seat so the handles meet mid-chest.', zoom: 'seat-height', claim: CL.seat },
    { kind: 'adjust', text: 'Start the handles at your chest, never behind it.', claim: CL.depth },
    { kind: 'position', text: 'Sit right back, hips on the pad, feet flat.', claim: CL.ace },
    { kind: 'grip', text: 'Handle in the heel of your palm, wrist straight.', zoom: 'hand', claim: CL.wrist },
    { kind: 'brace', text: 'Set your shoulder blades down and back into the pad.', zoom: 'blades', claim: CL.ace },
  ],
  // Not written yet, because no verified source: "get in", "push the pin all the way in", "get out" (3.4, C8).
  posture: [
    { key: 'height', label: 'Handles mid-chest', detail: 'At the start the handles are at mid-chest height. They are level with the chest or just in front, never behind.',
      anchor: { landmark: 'grip.r', pose: 'start' }, zoom: 'seat-height', claim: CL.seat },
    { key: 'blades', label: 'Blades on pad', detail: 'Upper back and shoulder blades stay on the pad to the end of each push. Normal small arch in the low back.',
      anchor: { landmark: 'backUpper', pose: 'end' }, zoom: 'blades', claim: CL.ace },
    { key: 'wrist', label: 'Straight wrist', detail: 'Knuckles, wrist and forearm form one straight line. The forearm points the way the handle moves. The handle sits in the heel of the palm.',
      anchor: { landmark: 'grip.r', pose: 'end' }, zoom: 'hand', claim: CL.wrist },
    { key: 'elbows', label: 'Elbows behind handles', detail: 'Each elbow sits about level with its handle and right behind it, below shoulder height. The forearm points straight along the push. From above, horizontal handles put the elbows roughly 45 to 60 degrees out. With vertical handles they sit closer to the body. They never flare straight out level with the shoulders.',
      anchor: { landmark: 'elbow.r', pose: 'start' }, claim: C(['CONSENSUS'], ['ace-chest-press', 'fees1998']) },
    { key: 'feet', label: 'Sit right back', detail: 'Both feet flat on the floor. Hips pushed back into the seat and back pad, no bridging.',
      anchor: { landmark: 'ankle.r', pose: 'end' }, claim: CL.ace },
    { key: 'soft', label: 'Soft elbows', detail: 'At the end, the arms are long with a small bend left in the elbows. The shoulder blades are still on the pad.',
      anchor: { landmark: 'elbow.r', pose: 'end' }, zoom: 'blades', claim: CL.ace },
    // "Start depth" (handles no deeper than the chest, seen from above): text only until the engine has a top view.
  ],
  feel,
  zooms,
  copy: {
    setupLine: 'Set the seat so the handles meet mid-chest. Sit right back, feet flat, shoulder blades on the pad.',
    mistakeLine: 'Never let your wrist fold back to finish a heavy rep. Drop the weight and push through the heel of your hand.',
    cueLine: 'Handles at mid-chest.',
  },
  redFlag: RED_FLAG,
  mistakes: MISTAKES,
  risks: RISKS,
  riskFlags: ['wrist', 'elbow'],
  sources: Object.keys(SOURCES),
  research: { card: 'grip/research/machine_chest_press.json', rev: 1 },
};
