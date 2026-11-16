// How-to content for the pull-up (architecture grip/GRIP-AND-FEEL-ARCHITECTURE.md 4.1-4.4, appendix A4).
// Source of every user-visible line: the verified card grip/research/pull_up.json (corrected card; GENERAL.md wording
// is superseded and not used). Edits against the card, each for a written rule:
//   - row "biceps" fix: "more of the work" -> "more work" (FeelRow limit: 30 words; the card's line has 31).
//   - row "pinch" fix: "and get it checked" dropped (C8: fixes never carry red-flag wording). The referral comes back
//     through the shared shoulder block (RED_FLAG_SHOULDER, NHS shoulder pain): the row carries redFlag: 'shoulder'.
//   - row "elbow" fix: "If it lasts, get it checked." dropped (C8, same reason); the row carries redFlag: 'elbow'
//     (RED_FLAG_ELBOW, NHS elbow and arm pain).
//   - row "wrist" fix: "If it still hurts after a few days off, get it checked." dropped (C8 and 30 words); the row
//     carries redFlag: true, so the shared NHS block shows under it instead. The card's "a few days" disagreed with
//     the NHS two weeks, the same conflict A1 resolved in favour of the shared block.
//   - posture details: the card's camera prefixes ("Front view:", "Back view:", "Side view ...:") are dropped from the
//     user copy; the camera is a drawing fact, not an instruction.
//   - thumb: the card calls thumbless "an option some coaches use"; the architecture's `hang` archetype (3.1) says
//     "wrapped, always" and C4 fails a hang exercise that offers `over`. So thumbless is shown on the thumb page as
//     information with its risk, never offered as an option.
//   - 2026-09-30, owner: "shorter, concept first". Every shown line is cut to the copy-lint.mjs limits; no new facts.
//     Dropped: mistake 'kip' (the Top zoom, the pinch row, the still-hang setup step and the neck risk keep it); rows
//     'biceps' (the feel line keeps "elbows to your ribs"), 'forearms' (the slip mistake and the Hand zoom keep it) and
//     'low-back' (the still-hang step); setup steps 'reach the bar' and 'grip' (the grip line says it). The Hand zoom's
//     feelRow pointed to 'forearms'; it now points to the kept wrist row, whose first cause is this zoom's Wrong picture
//     (same prompt as the hanging leg raise and the cable row). The wrist limit keeps only the end-the-set rule; the
//     false grip (wrist curled over the bar) stays on the thumb page.
// Point references use the plate engine's form ({ at, pose, off }), SPEC.md 3.
import plate from './pull_up.mjs';
import { handGeometry } from '../engine/hand.mjs';
import { landmarksOf } from '../engine/body.mjs';
// RED_FLAG (and any other shared safety copy) comes from the one shared module (plan S-2 condition 4); re-exported
// for the render scripts. DISCLAIMER is shown once per sheet by the page, from the same module.
import { RED_FLAG } from '../howto/shared.mjs';
export { RED_FLAG };

const CHECKED = '2026-09-30';
// `access`: the card records what was read for Di Fonza 2026 (abstract only) and lists what was not reached. It does
// not record per-source access for the rest, so PubMed-linked papers are set to 'abstract' (the floor the verifier
// certainly read); coach and manufacturer pages are 'full' because the card quotes their wording.
export const SOURCES = {
  youdas2010: { id: 'youdas2010', cite: 'Youdas JW et al. (2010) Surface EMG activation patterns and elbow joint motion during a pull-up, chin-up, or Perfect-Pullup rotational exercise. J Strength Cond Res 24(12):3404-14', url: 'https://pubmed.ncbi.nlm.nih.gov/21068680/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  dickie2017: { id: 'dickie2017', cite: 'Dickie JA et al. (2017) Electromyographic analysis of muscle activation during pull-up variations. J Electromyogr Kinesiol 32:30-36', url: 'https://pubmed.ncbi.nlm.nih.gov/28011412/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  snarr2017: { id: 'snarr2017', cite: 'Snarr RL et al. (2017) Electromyographical comparison of a traditional, suspension device, and towel pull-up. J Hum Kinet 58:5-13', url: 'https://pubmed.ncbi.nlm.nih.gov/28828073/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  prinold2016: { id: 'prinold2016', cite: 'Prinold JA, Bull AM (2016) Scapula kinematics of pull-up techniques: avoiding impingement risk with training changes. J Sci Med Sport 19(8):629-35', url: 'https://pubmed.ncbi.nlm.nih.gov/26383875/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  urbanczyk2020: { id: 'urbanczyk2020', cite: 'Urbanczyk CA et al. (2020) Avoiding high-risk rotator cuff loading: muscle force during three pull-up techniques. Scand J Med Sci Sports 30(11):2205-14', url: 'https://pubmed.ncbi.nlm.nih.gov/32715526/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  difonza2026: { id: 'difonza2026', cite: 'Di Fonza D et al. (2026) EMG analysis of latissimus dorsi activation during common resistance training exercises: a narrative review. J Funct Morphol Kinesiol 11(3):315', url: 'https://pubmed.ncbi.nlm.nih.gov/42647355/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  kolber2010: { id: 'kolber2010', cite: 'Kolber MJ et al. (2010) Shoulder injuries attributed to resistance training: a brief review. J Strength Cond Res 24(6):1696-704', url: 'https://pubmed.ncbi.nlm.nih.gov/20508476/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  odriscoll1992: { id: 'odriscoll1992', cite: "O'Driscoll SW et al. (1992) The relationship between wrist position, grasp size, and grip strength. J Hand Surg Am 17(1):169-77", url: 'https://pubmed.ncbi.nlm.nih.gov/1538102/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  oranchuk2022: { id: 'oranchuk2022', cite: 'Oranchuk DJ et al. (2022) Improved power clean performance with the hook-grip is not due to altered force-time or horizontal bar-path characteristics. J Sports Sci 40(2):226-35', url: 'https://pubmed.ncbi.nlm.nih.gov/34592911/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  'catalyst-pullup': { id: 'catalyst-pullup', cite: 'Catalyst Athletics, Pull-up', url: 'https://www.catalystathletics.com/exercise/39/Pull-up/', kind: 'coach', access: 'full', checked: CHECKED },
  'catalyst-scap': { id: 'catalyst-scap', cite: 'Catalyst Athletics, Scap Pull-Up', url: 'https://catalystathletics.com/exercise/918/Scap-Pull-Up/', kind: 'coach', access: 'full', checked: CHECKED },
  'catalyst-neutral': { id: 'catalyst-neutral', cite: 'Catalyst Athletics, Neutral Grip Pull-Up', url: 'https://catalystathletics.com/exercise/864/Neutral-Grip-Pull-Up', kind: 'coach', access: 'full', checked: CHECKED },
  'nasm-chinup': { id: 'nasm-chinup', cite: 'NASM, Chin-ups vs pull-ups (H. Cherry)', url: 'https://www.nasm.org/resource-center/blog/training/chin-ups-vs-pull-ups-the-difference-the-benefits-muscles-worked', kind: 'guideline', access: 'full', checked: CHECKED },
  'baechle-earle': { id: 'baechle-earle', cite: 'Baechle TR, Earle RW, Weight Training: Steps to Success (NSCA editors), grip selection and location', url: 'https://us.humankinetics.com/blogs/excerpt/grip-selection-and-location', kind: 'guideline', access: 'full', checked: CHECKED },
  'wiki-hook-grip': { id: 'wiki-hook-grip', cite: 'Hook grip, Wikipedia', url: 'https://en.wikipedia.org/wiki/Hook_grip', kind: 'secondary', access: 'full', checked: CHECKED },
  'wiki-muscle-up': { id: 'wiki-muscle-up', cite: 'Muscle-up (false grip), Wikipedia', url: 'https://en.wikipedia.org/wiki/Muscle-up', kind: 'secondary', access: 'full', checked: CHECKED },
  'rogue-false-grip': { id: 'rogue-false-grip', cite: 'Rogue Fitness, False Grips', url: 'https://www.rogueapo.com/false-grips', kind: 'manufacturer', access: 'full', checked: CHECKED },
  'bullbar-calluses': { id: 'bullbar-calluses', cite: 'Bullbar Fit, How to grip the bar without getting calluses', url: 'https://bullbarfit.com/blogs/q-as/what-is-the-correct-way-to-grip-the-bar-to-avoid-calluses', kind: 'manufacturer', access: 'full', checked: CHECKED },
  'nhs-wrist-pain': { id: 'nhs-wrist-pain', cite: 'NHS, Wrist pain', url: 'https://www.nhs.uk/conditions/hand-pain/wrist-pain/', kind: 'guideline', access: 'full', checked: CHECKED },   // RED_FLAG source (architecture 4.2)
  'nhs-shoulder-pain': { id: 'nhs-shoulder-pain', cite: 'NHS, Shoulder pain', url: 'https://www.nhs.uk/conditions/shoulder-pain/', kind: 'guideline', access: 'full', checked: CHECKED },   // RED_FLAG_SHOULDER source
  'nhs-elbow-pain': { id: 'nhs-elbow-pain', cite: 'NHS, Elbow and arm pain', url: 'https://www.nhs.uk/symptoms/elbow-and-arm-pain/', kind: 'guideline', access: 'full', checked: CHECKED },   // RED_FLAG_ELBOW source
};
/** "Where this comes from": one plain evidence label per source, from the card's evidence notes (shown with the cite). */
export const EVIDENCE_LABELS = {
  youdas2010: { tag: 'DATA', text: 'Muscle study. Lats work most. Biceps work more with palms facing you.' },
  dickie2017: { tag: 'DATA', text: 'Muscle study. Four hand positions worked the muscles alike. Not about width.' },
  snarr2017: { tag: 'DATA', text: 'Grip 1.5 times shoulder width. Towel or strap: same lat work.' },
  prinold2016: { tag: 'MECH', text: '11 people. Wide grips put shoulders in pinch-prone positions. No injury data.' },
  urbanczyk2020: { tag: 'WEAK', text: 'Computer model, 11 men. Wide grips gave the lats a bit more.' },
  difonza2026: { tag: 'WEAK', text: 'Review, summary only. Pull-up grips look similar for the lats.' },
  kolber2010: { tag: 'CONSENSUS', text: 'Review of weight-training shoulder injuries. Poor technique is a named risk.' },
  odriscoll1992: { tag: 'DATA', text: 'Grip study. Strongest with the wrist a little back, weaker other ways.' },
  oranchuk2022: { tag: 'WEAK', text: 'Power clean study. Hook grip helped timing, not force. Not needed here.' },
  'catalyst-pullup': { tag: 'CONSENSUS', text: 'Coaching guide. Hands just outside the shoulders, head level, full lowering.' },
  'catalyst-scap': { tag: 'CONSENSUS', text: 'Coaching guide. Setting the shoulder blades before the pull.' },
  'catalyst-neutral': { tag: 'CONSENSUS', text: 'Coaching guide. Neutral handles are often easier on the elbows.' },
  'nasm-chinup': { tag: 'CONSENSUS', text: 'Coaching guide. No kipping or neck craning. Beginners: assisted or lowering-only reps.' },
  'baechle-earle': { tag: 'CONSENSUS', text: 'Textbook. Thumbs around the bar for every grip.' },
  'wiki-hook-grip': { tag: 'WEAK', text: 'Encyclopedia page. What the hook grip is and where it is used.' },
  'wiki-muscle-up': { tag: 'WEAK', text: 'Encyclopedia page. What the gymnastics false grip is.' },
  'rogue-false-grip': { tag: 'CONSENSUS', text: 'Equipment maker coaching. The gymnastics false grip is for rings.' },
  'bullbar-calluses': { tag: 'WEAK', text: 'Equipment blog. Bar deep in the palm pinches skin and tears calluses.' },
  'nhs-wrist-pain': { tag: 'CONSENSUS', text: 'When wrist pain needs a check.' },
  'nhs-shoulder-pain': { tag: 'CONSENSUS', text: 'When shoulder pain needs a check.' },
  'nhs-elbow-pain': { tag: 'CONSENSUS', text: 'When elbow pain needs a check.' },
};


const C = (tags, sources, note) => ({ tags, sources, ...(note ? { note } : {}) });

// ---- hand (architecture 3.1 `hang`, 4.2, 5.1) ----
// Overhand on a bar that runs across the body: seen from the side (the plate's camera), the camera looks along the
// bar, so the bar is end-on and the thumb side of the hand faces the camera ('radial' view). The lifter faces right
// as on the plate, so the palm faces right and the fingers close over the top of the bar toward the back of the hand.
// The load is body weight hanging from the hand: it runs down the forearm, away from the bar.
// Wrist: 15 degrees back. The card: "level with the forearm or tipped back a little"; O'Driscoll 1992: people chose
// about 35 degrees for their strongest grip. So 15 is inside the card's target and the archetype range 0 to 35.
// Forearm angle: in a free hang the body hangs from the bar, so the bar sits straight above the elbow. `hangForearm`
// tilts the forearm until the line from the bar centre to the elbow (forearm 0.146 H, Winter 2009, as the plate) is
// vertical on screen: about 1 degree for the right hand, about 9 degrees for the hand hinging back. So no drawing
// shows the bar off to one side of a vertical forearm, which a hanging hand cannot do.
// No load line: the pull-up's loadAxis is 'across' (3.1.1), and 5.1 draws the force line only for 'along-forearm'
// loads. The renderer drops h-load, h-load-head, h-contact and h-tick from every hang drawing; the dashed forearm
// datum and the bend arc stay.
const FOREARM_MM = 0.146 * 1750;
const mergeHand = (a, b) => ({ ...a, ...b, wrist: { ...a.wrist, ...(b.wrist ?? {}) }, fingers: { ...a.fingers, ...(b.fingers ?? {}) } });
const hangForearm = pose => { const g = handGeometry(pose), c = g.toF(g.circle.c);
  return +(180 - Math.atan2(c[1], c[0] + FOREARM_MM) * 180 / Math.PI).toFixed(1); };
const withHang = pose => ({ ...pose, forearm: hangForearm(pose) });
const BASE_POSE = { view: 'radial', forearm: 180, wrist: { ext: 15, dev: 0 }, contactAt: 1.0, fingers: { curl: 1 }, thumb: 'wrapped', squeeze: 'firm',
  handle: { profile: 'bar-32', axis: 'across' }, load: { kind: 'gravity' } };
const RIGHT_POSE = withHang(BASE_POSE);
// Main wrong hand (card zoom "hand", left fault; the card's handlingMistakes #4): bar slid out past the finger bends
// (contactAt 1.45 of 1.6 = tips), fingers peeling open, thumb loose on top, the hand hinging far back. 50 degrees is
// 15 past the archetype's 35 limit, so the drawn angle reads as "far back" and not as the strong 35 degree grip the
// card describes as normal. The number is a drawing value (3.1.1: drawing checks, not injury thresholds). The forearm
// hangs under the bar (hangForearm), so the picture shows a hand peeling off a bar, not a press bending the wrist.
const FAULT_FINGERTIP = {
  key: 'fingertip-slip', label: 'Slipping out',
  pose: { wrist: { ext: 50, dev: 0 }, contactAt: 1.45, fingers: { curl: 1, open: 0.45 }, thumb: 'over' },
  markers: ['slip-arrow', 'lever-arc'],
  alt: 'Bar slid out to the fingertips, fingers peeling open, thumb loose on top. The hand hinges far back. The grip is about to fail.',
};
FAULT_FINGERTIP.pose.forearm = hangForearm(mergeHand(BASE_POSE, FAULT_FINGERTIP.pose));
// Second wrong hand, page 2 (card zoom "hand", right fault): bar jammed deep in the middle of the palm; the skin at
// the base of the fingers bunches into a ridge. Wrist as in the right hand, so only the contact differs. The fingers
// wrap the bar wherever it sits, so the fist is shorter and the bar can look no deeper; the renderer draws a faint
// finger-base line (`fingerBase`) at the same place in both halves, so the bar sits on it in Right and clearly below it
// in Wrong, with the ridge between the two.
const FAULT_PALM_DEEP = {
  key: 'palm-deep', label: 'Deep in palm',
  pose: { contactAt: 0.3, thumb: 'wrapped' },
  markers: ['skin-ridge'],
  fingerBase: true,
  alt: 'Bar jammed deep in the middle of the palm, below the finger base. The skin at the finger base bunches into a pinching ridge, where calluses tear.',
};
FAULT_PALM_DEEP.pose.forearm = hangForearm(mergeHand(BASE_POSE, FAULT_PALM_DEEP.pose));
// Thumb page (5.1, `hang` only): four labelled options, drawn with the same hand. Full grip is the default.
// `risk`: drawn in mistake styling with its markers (the card's thumb zoom "wrong": thumbless opening late in a set).
// `thumbOverBar`: the thumb is drawn over the bar section and under the index finger (hook grip, 5.1: the thumb is the
// clearest thing in the picture).
export const THUMB_PAGE = [
  { mode: 'wrapped', title: 'Full grip', note: 'Use this', default: true,
    pose: RIGHT_POSE, alt: 'Full grip: thumb wrapped under the bar to meet the index finger. Use this.' },
  // `thumbless-opening` (3.1 hang faults): fingers partly open, the bar rolling out toward the tips.
  { mode: 'over', title: 'Thumbless', note: 'Can open late in a set', risk: true, markers: ['slip-arrow'],
    pose: withHang(mergeHand(BASE_POSE, { thumb: 'over', fingers: { open: 0.3 } })),
    alt: 'Thumbless: the thumb lies on top with the fingers. Late in a set on a sweaty bar, the fingers peel open. The bar rolls out.' },
  { mode: 'hook', title: 'Hook', note: 'Heavy barbell pulls only', thumbOverBar: { tipAngle: -45 },
    pose: { ...RIGHT_POSE, thumb: 'hook' }, alt: 'Hook grip: the thumb wraps round the bar first. The index and middle fingers close over it, pinning it. For heavy barbell pulls only, not pull-ups.' },
  // Gymnastics false grip: the wrist flexed about 75 degrees and hooked over the bar, which sits on the heel of the
  // hand; the forearm hangs under the bar (hangForearm). The note carries the card's "skip with a sore wrist".
  { mode: 'false-grip', title: 'Gymnastics false grip', note: 'Rings only. Skip with a sore wrist.', risk: true,
    pose: withHang(mergeHand(BASE_POSE, { wrist: { ext: -75, dev: 0 }, contactAt: 0.2, thumb: 'over' })),
    alt: 'Gymnastics false grip: the wrist curls forward over the bar. The bar sits on the heel of the hand. For muscle-ups on rings only. Skip it with a sore wrist.' },
];

// ---- posture zoom poses (PoseOverride, 4.3), merged over the plate's own start or end pose ----
// Hang, seen from the side. The hands stay on the bar (the plate's reach IK), so moving the shoulder girdle moves the
// body: setting the shoulders down (elev -) lifts the trunk a few cm with straight arms, a shrug (elev +) lets it sink
// and the head drops between the arms. Values in cm (SPEC.md 2: scap offsets in cm).
// With straight arms the shoulder joints hang a fixed arm length under the bar, so a shrug shows as the trunk and head
// sinking between the arms (the ears close to the shoulders), and setting the shoulders down lifts them.
const ACTIVE_HANG = { root: { at: [0, 1.117 + 0.03, -0.02], tilt: 0 }, scap: { elev: -3, pro: -1 } };
const SHRUG_HANG = { root: { at: [0, 1.117 - 0.07, -0.02], tilt: 0 }, scap: { elev: 8, pro: 1 }, neck: 10 };
// Shoulder blades seen from behind, for the Shoulders zoom (the card's "shoulder blades" zoom: back view of the torso
// in the hang, blades outlined). Drawing values in cm from each side's shoulder joint centre S: [toward the spine, up].
// A scapula is about 15 to 16 cm from its upper to its lower corner; with the arms overhead in the hang it is turned
// upward, so its lower corner swings out toward the armpit. The blades ride on the shoulder joints, which hang a fixed
// arm length under the bar, so in the shrug they stay put while the ribcage, neck and head sink under them: seen from
// behind, the blades sit high on the back and the ears drop to the shoulders.
const BLADE = [[13, 2], [5, 3.2], [0.5, 4], [1, -1], [3, -6], [7.5, -13.5], [11.5, -8], [13.8, -2.5]];
const BLADE_SPINE = [[13.6, -1.5], [1, 3.6]];   // the ridge of the blade, from its inner edge to the shoulder tip
const RIB_D = (() => { const lm = landmarksOf({ ...plate.poses.start, ...ACTIVE_HANG }); return lm['shoulder.l'][1] + BLADE[5][1] / 100 - lm.backMid[1]; })();
export function bladeOutlines(lm) {
  const lines = [], points = {};
  for (const sd of ['l', 'r']) {
    const S = lm[`shoulder.${sd}`], sg = Math.sign(S[0]);
    const w = ([m, up]) => [S[0] - sg * m / 100, S[1] + up / 100, S[2] - 0.08];
    lines.push({ pts: [...BLADE, BLADE[0]].map(w), kind: 'outline' }, { pts: BLADE_SPINE.map(w), kind: 'ridge' });
    points[`bladeLow.${sd}`] = w(BLADE[5]);        // the lower corner
    points[`bladeTop.${sd}`] = w(BLADE[0]);        // the upper inner corner
  }
  // a fixed level on the ribcage (it moves with the chest): where the lower blade corners sit in the right hang
  points.ribLevel = [0, lm.backMid[1] + RIB_D, lm.backMid[2]];
  return { lines, points };
}
// Top, craning: the chin reaches forward and up for the bar and the shoulders roll forward. The engine's neck is one
// pivot, and tipping the head back about it moves the chin backward, so the forward reach comes from the upper body:
// the shoulder blades slide 7 cm forward and 3 cm up (rolled forward), the trunk leans back less (-4 against the
// right top's -6) and the head tips back 20 degrees. The body stops 4.5 cm lower than the right top, so the chin only
// just gets over the bar: the chin does the reaching, not the chest. Checked: chin 2.4 cm ahead of the right chin and
// 2.3 cm over the bar top, shoulder tops 12 cm ahead, head and chest 2.3 px (about 2 cm) clear of the bar.
const CRANE = { root: { at: [0, 1.68 - 0.045, -0.03], tilt: -2 }, trunk: -4, neck: -20, scap: { elev: 3, pro: 7 } };

/* ---------------------------------------------------------------- handling mistakes, risks (plan 2.4 items 4, 7) --
 * From the verified card's handlingMistakes (grip/research/pull_up.json): the mistake, its fix and what it can hurt,
 * cut to the copy limits (copy-lint.mjs: at most 3 mistakes, title <= 5 words, fix <= 12; at most 3 risks, <= 14 words; no citations in user copy, C7;
 * no red-flag wording, C8: the shared RED_FLAG and DISCLAIMER come from howto/shared.mjs). `zoom` = "Show me" target. */
const MISTAKES = [
  { key: 'drop', title: 'Bouncing at the bottom', zoom: 'shoulders', claim: C(['MECH', 'CONSENSUS'], ['prinold2016', 'catalyst-scap']),
    fix: 'Lower slowly to straight arms.' },   // 'shoulders down, then pull' is setup step 5 and the traps row
  { key: 'wide', title: 'Grip too wide', claim: C(['MECH', 'WEAK'], ['prinold2016', 'urbanczyk2020', 'difonza2026']),
    fix: 'Hands just outside your shoulders.' },
  { key: 'slip', title: 'Bar slipping to fingertips', zoom: 'hand', claim: C(['DATA', 'WEAK'], ['odriscoll1992', 'bullbar-calluses']),
    fix: 'Set the bar where your fingers start.' },
];
const RISKS = [
  { key: 'bottom', text: 'Dropping into the bottom jerks your weight through the shoulder.',
    claim: C(['MECH', 'CONSENSUS'], ['prinold2016', 'kolber2010'], 'The link to bouncing is coaching consensus.') },
  { key: 'wide', text: 'Wide grips are linked to shoulder pinching.',
    claim: C(['MECH'], ['prinold2016'], 'The authors link the movement pattern to impingement risk; injuries were not measured.') },
  { key: 'neck', text: 'Chin reaching strains your neck. Fingertip grips can slip off.',
    claim: C(['CONSENSUS', 'DATA'], ['nasm-chinup', 'catalyst-pullup', 'odriscoll1992']) },
];

export default {
  schema: 1,
  id: 'lib_pull_up',
  rev: 1,
  plate,
  handling: {
    archetype: 'hang',
    orientation: 'pronated',
    handle: 'bar-32',                  // A4; the plate draws the same 32 mm bar
    loadAxis: 'across',                // archetype default for `hang` (3.1.1): no push lever check
    overBody: false,
    width: { text: 'Hands just outside your shoulders, about 1.5 times shoulder width. Halfway up, seen from the front, your forearms are near vertical.',
      claim: C(['CONSENSUS', 'DATA', 'MECH'], ['catalyst-pullup', 'snarr2017', 'prinold2016', 'urbanczyk2020', 'difonza2026'], 'Width data is thin and mixed: Urbanczyk 2020 is modelling only, Di Fonza 2026 abstract only. The default rests on shoulder safety (Prinold and Bull 2016, mechanism) and coach consensus.') },
    thumb: { mode: 'wrapped', claim: C(['CONSENSUS'], ['baechle-earle', 'catalyst-pullup'], 'No study has measured thumb position on a pull-up. Thumbless, hook and gymnastics false grip are shown on the thumb page as information only (C4).') },
    contact: 'finger-base',
    wrist: { ext: [0, 35], dev: [-10, 10], limitText: 'Bar sliding to your fingertips? End the set.',
      claim: C(['DATA', 'CONSENSUS'], ['odriscoll1992', 'rogue-false-grip'], "O'Driscoll 1992: self-chosen grip about 35 degrees back, 10 to 15 degrees away from it weakens grip. Both limits are coaching consensus; no study has set wrist limits in a hang.") },
    pose: RIGHT_POSE,
    faults: [FAULT_FINGERTIP, FAULT_PALM_DEEP],
    gripLine: 'Hook the bar where your fingers start, like carrying a bag. Wrap your thumb: you hang from the bar.',
    cue: 'Hook it, then wrap your thumb.',   // `hang` archetype cue (3.1) and the card's cue
  },
  contacts: ['hang-support'],
  setup: [
    { kind: 'safety', text: 'Bar fixed and dry? Chalk sweaty hands.',
      claim: C(['CONSENSUS', 'WEAK'], ['catalyst-pullup', 'bullbar-calluses']) },
    { kind: 'load', text: "Can't do a few clean reps? Use a band or assisted machine.",
      claim: C(['CONSENSUS', 'MECH'], ['nasm-chinup', 'prinold2016'], "'A few clean reps' as the threshold is consensus. Prinold and Bull suggest assisted pull-ups for weaker people.") },
    { kind: 'position', text: 'Hands just outside your shoulders, palms away.',
      claim: C(['CONSENSUS', 'MECH'], ['catalyst-pullup', 'prinold2016']) },
    { kind: 'position', text: 'Hang still, legs together.',
      claim: C(['CONSENSUS'], ['catalyst-pullup', 'nasm-chinup']) },
    { kind: 'brace', text: 'Arms straight, shoulders down. Then pull.', zoom: 'shoulders',
      claim: C(['CONSENSUS'], ['catalyst-scap', 'nasm-chinup']) },
  ],
  posture: [
    { key: 'width', label: 'Grip width', detail: 'Overhand grip, forearms close to vertical halfway up, when the elbows reach shoulder height. Elbows point down and a little forward, in line with the forearms.',
      anchor: { at: 'grip.r' }, claim: C(['CONSENSUS', 'MECH'], ['catalyst-pullup', 'prinold2016'], 'Front view: text checkpoint. The plate is a side view, where width does not show (5.2).') },
    { key: 'hang', label: 'Active hang', detail: 'Arms fully straight, shoulder blades pulled slightly down. A clear gap between ears and shoulders.',
      anchor: { at: 'shoulderTop.r', pose: 'start' }, zoom: 'shoulders', claim: C(['CONSENSUS', 'MECH'], ['catalyst-scap', 'prinold2016']) },
    { key: 'still', label: 'Body still', detail: 'Legs together and a little in front, ribs down, glutes lightly squeezed. A gentle straight line from shoulders to feet. No swinging and no deep arch in the lower back.',
      anchor: { at: 'hip.r' }, claim: C(['CONSENSUS'], ['nasm-chinup', 'catalyst-pullup'], 'Shown by the plate Mistake layer (kick and swing), not a zoom.') },
    { key: 'elbows', label: 'Elbows down', detail: 'In mid-pull the elbows travel down and slightly back toward the sides of the ribs. They point at the floor.',
      anchor: { at: 'elbow.r', off: [2, 5] }, claim: C(['CONSENSUS'], ['catalyst-pullup']) },
    { key: 'top', label: 'Chin over bar', detail: 'At the top the chin clears the bar and the upper chest rises toward it. The head stays level, neck long. The chin does not crane forward to reach the bar.',
      anchor: { at: 'chin' }, zoom: 'top', claim: C(['CONSENSUS'], ['catalyst-pullup', 'nasm-chinup']) },
    { key: 'lower', label: 'Full lowering', detail: 'At the bottom the elbows are fully straight again, lowered under control. Shoulders set before the next pull.',
      anchor: { at: 'elbow.r', pose: 'start' }, claim: C(['CONSENSUS', 'MECH'], ['catalyst-pullup', 'prinold2016', 'kolber2010']) },
  ],
  feel: {
    primary: [{ muscleId: 'lats', plain: 'The sides of your back, under your armpits and down toward your lower ribs. This is the muscle pulling your elbows down to your sides.' }],
    secondary: [
      { muscleId: 'biceps', plain: 'The front of your upper arms, working hard near the top of the rep. More so if your palms face you.' },
      { muscleId: 'mid_back', plain: 'Between and just below your shoulder blades, especially at the start when you pull your shoulders down.' },
      { muscleId: 'forearms', plain: "Your grip. Some forearm burn is normal because you're holding your whole body up." },
      { muscleId: 'abs', plain: 'A light brace in the stomach that keeps your legs from swinging.' },
    ],
    // "Should not take over": dashed outline ONLY while a row naming the muscle is open (S6), never at rest (5.3).
    watch: [
      { muscleId: 'upper_traps', plain: 'The tops of your shoulders and the sides of your neck. If they burn, you are shrugging up toward your ears.' },
      { muscleId: 'lower_back', plain: 'Your lower back should not ache. If it does, you are arching and kicking.' },
    ],
    feelLine: 'You should feel this in the sides of your back. Drive your elbows to your ribs.',
    rows: [
      { key: 'traps', where: 'Tops of your shoulders', at: { muscles: ['upper_traps'] },
        means: "You're shrugging toward your ears.",
        fix: 'Set your shoulders down before your arms bend.',
        zoom: 'shoulders', claim: C(['CONSENSUS', 'DATA'], ['catalyst-scap', 'youdas2010']) },
      { key: 'pinch', where: 'Front of your shoulder pinches', at: {},   // pain, not a muscle taking over: no map mark (card)
        means: 'Grip too wide, or your chin reaching for the bar.',
        fix: 'Bring your hands in, head level. If it keeps hurting, stop pull-ups.',
        zoom: 'top', redFlag: 'shoulder', claim: C(['MECH', 'CONSENSUS'], ['prinold2016', 'catalyst-pullup', 'nhs-shoulder-pain'], 'Prinold and Bull: movement data linked to impingement risk, not injury counts. The referral is the shared shoulder red flag (NHS), not the fix text (C8).') },
      { key: 'elbow', where: 'Inside or outside the elbow', at: { parts: ['elbow-left', 'elbow-right'] },
        means: 'Too many sets, or a grip your elbows dislike.',
        fix: 'Try neutral handles or a shoulder-width grip, and fewer sets.',
        redFlag: 'elbow', claim: C(['CONSENSUS'], ['catalyst-neutral', 'nhs-elbow-pain']) },
      { key: 'wrist', where: 'Your wrist', at: { parts: ['hand-left', 'hand-right', 'hand-back-left', 'hand-back-right'] },
        means: 'Bar in your fingertips, wrist curled, or an old injury.',
        fix: "Keep your wrist level. If it's sore, use neutral handles and stop if it hurts.",
        zoom: 'hand', redFlag: true, claim: C(['CONSENSUS', 'DATA'], ['odriscoll1992', 'rogue-false-grip', 'catalyst-neutral', 'nhs-wrist-pain']) },
    ],
    libraryDiff: { add: ['forearms', 'abs'], why: 'The card adds the forearms (grip holds the whole body) and the abs (a light brace against swinging) as helpers. exercises.json lists lats primary and biceps, mid_back secondary.' },
    claim: C(['DATA', 'CONSENSUS'], ['youdas2010', 'dickie2017', 'snarr2017'], 'EMG readings do not map one to one onto what a person feels. The lower trapezius has no id and is folded into mid_back; rotator_cuff and brachialis have no drawn region, so they do not shimmer.'),
  },
  zooms: [
    {
      key: 'hand', chip: 'Hand', heading: 'Hand: right and wrong', kind: 'hand',
      hand: {
        right: RIGHT_POSE,
        wrong: [FAULT_FINGERTIP, FAULT_PALM_DEEP],     // the second one pages (4.3)
        camera: 'side',
        thumbPage: THUMB_PAGE.map(t => t.mode),
      },
      caption: { right: 'Bar where fingers start, thumb wrapped.',
        wrong: 'Bar at the fingertips, fingers opening.' },
      captionPage2: { right: 'Bar where fingers start, thumb wrapped.',
        wrong: 'Bar deep in the palm, skin pinched.' },
      alt: {
        right: 'Seen from the side, hanging. Bar where the fingers start, fingers over the top, thumb wrapped under. Wrist tipped back a little. Body weight hangs straight down the forearm.',
        wrong: FAULT_FINGERTIP.alt,
        wrong2: FAULT_PALM_DEEP.alt,
      },
      feelRow: 'wrist',
      feelPrompt: 'Sore wrist? This is usually why.',
    },
    {
      key: 'shoulders', chip: 'Shoulders', heading: 'Shoulders: right and wrong', kind: 'posture',
      // Back view (the card's "shoulder blades" zoom). From the side the near arm hides the head, ears and shoulder
      // tops, so the checkpoint cannot be seen on a crop of the side plate (5.2). This is the plate's own pose drawn
      // from behind with the engine's front-view outline (the hang is symmetric and the outline has no face, so it
      // is the back view), same scale as the plate, printed "Seen from behind" (C16). Both crops are drawn solid:
      // Right the active hang, Wrong the shrug; the blades are outlined on both.
      view: 'back', camLabel: 'Seen from behind',
      equipment: [{ type: 'pullupBar', at: [0, 2.25, 0], mount: 'ceiling', stub: 0.08 }],
      outlines: bladeOutlines,
      crop: { center: { at: 'shoulders', off: [0, 18] }, sizePx: 148 },
      right: { base: 'start', pose: ACTIVE_HANG },
      wrong: { base: 'start', pose: SHRUG_HANG, solid: true },
      // a level line at the top of the head in the right hang (both crops) and an arrow down to the sunk head
      // plus a neutral level on the ribcage at the right hang's lower blade corners (`own`: each crop's own pose), so
      // in Wrong the ribcage has sunk under the blades and they sit high on the back
      guides: [{ kind: 'level', at: 'head' }, { kind: 'level', at: 'ribLevel', own: true, tone: 'neutral' },
        { kind: 'drop', from: { at: 'head', off: [0, 0] }, to: { at: 'head', pose: 'mistake', off: [0, 0] } }],
      callout: {
        right: { text: 'Blades<br>down', anchor: { at: 'bladeLow.l' } },
        wrong: { text: 'Blades<br>high', anchor: { at: 'bladeLow.l', pose: 'mistake' } },
      },
      caption: { right: 'Shoulders down, clear gap to the ears.',
        wrong: 'Shoulders shrugged to the ears.' },
      alt: {
        right: 'Seen from behind, hanging with straight arms. Shoulder blades pulled down, a clear gap between ears and shoulders.',
        wrong: 'Seen from behind, the same hang shrugged. Shoulders up at the ears, head sunk between the arms, shoulder blades riding high.',
      },
      feelRow: 'traps',
      feelPrompt: 'Shoulder tops burning? This is usually why.',
    },
    {
      key: 'top', chip: 'Top', heading: 'Top position: right and wrong', kind: 'posture',
      crop: { center: { at: 'chin', off: [2, 10] }, sizePx: 112 },
      right: 'end',
      wrong: { base: 'end', pose: CRANE, parts: ['trunk', 'arm.r', 'arm.l'] },
      // a short forward-and-up arrow off the dashed chin (the reach), drawn by the plate's mistake guides
      // and the rolled-forward shoulder as a dashed shoulder cap (renderer overlay, wrong crop only)
      guides: [{ kind: 'arrow', from: { at: 'chin', pose: 'mistake', off: [2, -5] }, to: { at: 'chin', pose: 'mistake', off: [9, -11] } },
        { kind: 'cap', at: 'shoulder.r', top: 'shoulderTop.r' }],
      callout: {
        right: { text: 'Head level', anchor: { at: 'chin', off: [2, 0] } },
        // anchored on the dashed face just above the chin, ahead of the solid face
        wrong: { text: 'Chin reaching', anchor: { at: 'chin', pose: 'mistake', off: [0.5, -3] } },
      },
      caption: { right: 'Chin over the bar, head level.',
        wrong: 'Chin craning forward, shoulders rolled.' },
      alt: {
        right: 'Side view at the top. Chin just over the bar, head level, neck long. Chest lifted toward the bar, elbows down by the ribs.',
        wrong: 'The chin cranes up and forward over the bar, shoulders rolled forward. Drawn dashed over the right position.',
      },
      feelRow: 'pinch',
      feelPrompt: 'Shoulder pinching? This is usually why.',
    },
  ],
  // Chip row = the zooms in order, then "Where to feel it" (always last, 2.1). 4 chips. The card's other zooms:
  // "grip width" is a front view the side plate cannot crop (text checkpoint 'width'); "body line" is the plate's
  // own Mistake layer (kick and swing); "thumb" is page 3 of the Hand zoom (5.1).
  chips: ['hand', 'shoulders', 'top', 'feel'],
  copy: {
    setupLine: 'Hang still on straight arms, legs together. Pull your shoulders down, then start.',
    mistakeLine: "Don't bounce out of the bottom. Lower all the way, shoulders down, then pull.",
  },
  mistakes: MISTAKES,
  risks: RISKS,
  riskFlags: ['wrist', 'shoulder', 'elbow'],
  sources: Object.keys(SOURCES),
  research: { card: 'grip/research/pull_up.json', rev: 1 },
};

// Open gaps shown to the owner (plain words). The review page builder can list these under the pull-up.
export const OPEN_GAPS = [
  { key: 'shoulders-back-view', rows: [],
    text: 'The Shoulders close-up is drawn from behind, not cut out of the side plate: from the side the arm hides the head and the shoulder tops. The architecture (5.2) says a posture close-up is a crop of the plate, so this needs a yes: it opens with a crossfade, like the hand close-up, not a zoom into the plate.' },
];

// KNOWN GAPS (for the supervisor):
// - No "Wrist sore before you start" row: that row is for presses (A1); this is a `hang` exercise. The card's own
//   wrist row covers a sore wrist (neutral handles or the assisted machine) and carries the shared RED_FLAG.
// - The shoulder pinch and elbow rows link to the shared NHS shoulder and elbow blocks (howto/shared.mjs), which
//   Risks shows next to the wrist one (riskFlags). Closed 2026-09-30 (golden-B review).
// - The Shoulders zoom is a back view (card: "back view of the torso in the hang, with the shoulder blades
//   outlined"), not a crop of the side plate as 5.2 defines posture zooms; the S0 -> S3 transition must then be the
//   hand zoom's crossfade, not the plate scale. Listed in OPEN_GAPS for a decision.
// - Shoulder blades are drawn by the zoom (bladeOutlines), not by the engine: drawing values, not a scapula model.
// - Grip width has no zoom: the plate is a side view. It needs a front-view pull-up plate (the engine can draw front
//   views) and a card-level decision that a second plate is allowed as a zoom source.
// - The card's mistakeLine (drop and bounce) is not what the plate's Mistake layer draws (kick and swing, chin short);
//   the Shoulders zoom's Wrong crop carries the shrugged, slack hang instead.
