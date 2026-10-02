// How-to content for the hanging leg raise (architecture grip/GRIP-AND-FEEL-ARCHITECTURE.md 4.1-4.4, appendix A5).
// Source of every user-visible line: the verified card grip/research/hanging_leg_raise.json (corrected card; GENERAL.md
// wording is superseded and not used).
// COPY COMPACTED 2026-09-30 (owner: "shorter and compact, teach the concept"; limits in artifact/copy-lint.mjs). Each
// section opens with the idea and why; the card's detail stays in the claims and sources. No new facts: every line is a
// cut of the card's own wording and keeps its claim. Lists cut to the caps:
//   - handling mistakes 4 -> 3: "Grip slipping, wrist curling" dropped. The wrist limit line right above it says the
//     same thing (curling = grip failing, end the set or use straps); the hand zoom stays reachable from setup step 3
//     and the wrist row.
//   - feel rows 7 -> 4: kept "hips" (the most common fault), "low-back" (safety), "traps" (shoulder safety, the
//     Shoulders zoom's link) and "wrist" (red flag). Dropped "forearms" (grip: covered by the grip lines and setup step
//     1), "thighs" (bent knees: covered by the hips row and setup step 5) and "nothing" (slow reps: covered by the swing
//     mistake). The Hand zoom's feel link pointed at "forearms"; it now opens the "wrist" row, whose "means" (the wrist
//     curling as the grip fails) is the fault that zoom draws.
//   - setup 7 -> 5: bar height dropped (obvious); straps (card step 3) merged into step 1 with ab slings and the
//     captain's chair; chalk merged into taking the bar; "wait until still" and "new to this? bent knees" merged. Merged
//     steps carry the union of their claims.
//   - The full shoulder fix lives in the traps row; the "Hanging loose" mistake (always visible) is a shorter cue in the
//     card's words, so the page never prints one sentence twice.
// Older notes kept: posture details are the card's "what right looks like" without camera prefixes or citations;
// posture label "Legs past hips" keeps the card's (Yessis) meaning without the 30-45 degree number.
// Point references use the plate engine's form ({ at, pose, off }), SPEC.md 3.
import plate from './hanging_leg_raise.mjs';
import { landmarksOf } from '../engine/index.mjs';
import { bladeOutlines } from './pull_up.howto.mjs';   // the shoulder blades from behind, shared with the pull-up
// RED_FLAG (and any other shared safety copy) comes from the one shared module (plan S-2 condition 4); re-exported
// for the render scripts. DISCLAIMER is shown once per sheet by the page, from the same module.
import { RED_FLAG } from '../howto/shared.mjs';
export { RED_FLAG };

const CHECKED = '2026-09-30';
// `access`: the card's verifier pass (evidenceNotes, 2026-09-30) re-read the PubMed abstracts of the peer-reviewed
// papers and opened the coach, ACE and textbook pages. So papers are 'abstract', web pages 'full'.
export const SOURCES = {
  mcgill2015: { id: 'mcgill2015', cite: 'McGill S, Andersen J, Cannon J (2015) Muscle activity and spine load during anterior chain whole body linkage exercises: the body saw, hanging leg raise and walkout from a push-up. J Sports Sci 33(4):419-26', url: 'https://pubmed.ncbi.nlm.nih.gov/25111163/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  escamilla2006: { id: 'escamilla2006', cite: 'Escamilla RF et al. (2006) Electromyographic analysis of traditional and nontraditional abdominal exercises: implications for rehabilitation and training. Phys Ther 86(5):656-71', url: 'https://pubmed.ncbi.nlm.nih.gov/16649890/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  axler1997: { id: 'axler1997', cite: 'Axler CT, McGill SM (1997) Low back loads over a variety of abdominal exercises: searching for the safest abdominal challenge. Med Sci Sports Exerc 29(6):804-11', url: 'https://pubmed.ncbi.nlm.nih.gov/9219209/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  workman2008: { id: 'workman2008', cite: 'Workman JC, Docherty D, Parfrey KC, Behm DG (2008) Influence of pelvis position on the activation of abdominal and hip flexor muscles. J Strength Cond Res 22(5):1563-9', url: 'https://pubmed.ncbi.nlm.nih.gov/18714231/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  andersson1997: { id: 'andersson1997', cite: 'Andersson EA, Nilsson J, Ma Z, Thorstensson A (1997) Abdominal and hip flexor muscle activation during various training exercises. Eur J Appl Physiol 75(2):115-23', url: 'https://pubmed.ncbi.nlm.nih.gov/9118976/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  juker1998: { id: 'juker1998', cite: 'Juker D, McGill S, Kropf P, Steffen T (1998) Quantitative intramuscular myoelectric activity of lumbar portions of psoas and the abdominal wall during a wide variety of tasks. Med Sci Sports Exerc 30(2):301-10', url: 'https://pubmed.ncbi.nlm.nih.gov/9502361/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  jukic2021: { id: 'jukic2021', cite: 'Jukic I et al. (2021) Ergogenic effects of lifting straps on movement velocity, grip strength, perceived exertion and grip security during the deadlift exercise. Physiol Behav 229:113283', url: 'https://pubmed.ncbi.nlm.nih.gov/33306977/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  valerio2021: { id: 'valerio2021', cite: 'Valerio DF et al. (2021) The effects of lifting straps in maximum strength, number of repetitions and muscle activation during lat pull-down. Sports Biomech 20(7):858-65', url: 'https://pubmed.ncbi.nlm.nih.gov/31198105/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  martins2026: { id: 'martins2026', cite: 'Martins R et al. (2026) Are lifting straps a game changer for resistance training or an overrated tool? Int J Sports Physiol Perform 21(3):342-9', url: 'https://pubmed.ncbi.nlm.nih.gov/41569827/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  odriscoll1992: { id: 'odriscoll1992', cite: "O'Driscoll SW et al. (1992) The relationship between wrist position, grasp size, and grip strength. J Hand Surg Am 17(1):169-77", url: 'https://pubmed.ncbi.nlm.nih.gov/1538102/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  prinold2016: { id: 'prinold2016', cite: 'Prinold JA, Bull AM (2016) Scapula kinematics of pull-up techniques: avoiding impingement risk with training changes. J Sci Med Sport 19(8):629-35', url: 'https://pubmed.ncbi.nlm.nih.gov/26383875/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  kolber2010: { id: 'kolber2010', cite: 'Kolber MJ et al. (2010) Shoulder injuries attributed to resistance training: a brief review. J Strength Cond Res 24(6):1696-704', url: 'https://pubmed.ncbi.nlm.nih.gov/20508476/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  'ace-abs': { id: 'ace-abs', cite: 'ACE-sponsored study (Francis, San Diego State University): best and worst abdominal exercises (press release)', url: 'https://www.acefitness.org/about-ace/press-room/press-releases/246/american-council-on-exercise-ace-sponsored-study-reveals-best-and-worst-abdominal-exercises/', kind: 'guideline', access: 'full', checked: CHECKED },
  'catalyst-hlr': { id: 'catalyst-hlr', cite: 'Catalyst Athletics, Hanging Leg Raise', url: 'https://catalystathletics.com/exercise/45/Hanging-Leg-Raise/', kind: 'coach', access: 'full', checked: CHECKED },
  'catalyst-scap': { id: 'catalyst-scap', cite: 'Catalyst Athletics, Scap Pull-Up', url: 'https://catalystathletics.com/exercise/918/Scap-Pull-Up/', kind: 'coach', access: 'full', checked: CHECKED },
  'yessis-hlr': { id: 'yessis-hlr', cite: 'Yessis M, Hanging Leg Raise', url: 'https://doctoryessis.com/2013/01/01/hanging-leg-raise/', kind: 'coach', access: 'full', checked: CHECKED },
  'strengthlog-hlr': { id: 'strengthlog-hlr', cite: 'StrengthLog, Hanging Leg Raise', url: 'https://www.strengthlog.com/hanging-leg-raise/', kind: 'coach', access: 'full', checked: CHECKED },
  'baechle-earle': { id: 'baechle-earle', cite: 'Baechle TR, Earle RW, Weight Training: Steps to Success (NSCA editors), grip selection and location', url: 'https://us.humankinetics.com/blogs/excerpt/grip-selection-and-location', kind: 'guideline', access: 'full', checked: CHECKED },
  'wiki-leg-raise': { id: 'wiki-leg-raise', cite: 'Leg raise, Wikipedia', url: 'https://en.wikipedia.org/wiki/Leg_raise', kind: 'secondary', access: 'full', checked: CHECKED },
  'nhs-wrist-pain': { id: 'nhs-wrist-pain', cite: 'NHS, Wrist pain', url: 'https://www.nhs.uk/conditions/hand-pain/wrist-pain/', kind: 'guideline', access: 'full', checked: CHECKED },   // RED_FLAG source (architecture 4.2)
};
// The card's last source ("Project research: GENERAL.md and pull_up.json") is internal, not a citation, so it is not in
// the registry. It is kept as `research.related`.

/** "Where this comes from": one plain evidence label per source, from the card's evidence notes (shown with the cite). */
export const EVIDENCE_LABELS = {
  mcgill2015: { tag: 'DATA', text: '14 men. Among the hardest stomach exercises tested, with real spine load.' },
  escamilla2006: { tag: 'DATA', text: 'Knee raise in slings ranked near the top for the whole stomach.' },
  axler1997: { tag: 'DATA', text: '12 stomach exercises. None worked the stomach hardest while sparing the back.' },
  workman2008: { tag: 'MECH', text: 'Lying leg lift. Tipping the pelvis back worked the stomach harder.' },
  andersson1997: { tag: 'DATA', text: 'Lying leg lifts. Lifting both legs works the hip muscles hard.' },
  juker1998: { tag: 'DATA', text: 'The deep hip muscle works most when you lift the thigh.' },
  jukic2021: { tag: 'DATA', text: 'Deadlift study. Straps cut grip fatigue. Not studied on a bar hang.' },
  valerio2021: { tag: 'DATA', text: 'Pulldown study. Straps changed nothing for reps or back muscles.' },
  martins2026: { tag: 'WEAK', text: 'Review. Straps help grip and top strength. No steady effect on pulls.' },
  odriscoll1992: { tag: 'DATA', text: 'Hand gauge. Grip is strongest with the wrist tipped back, weaker curled.' },
  prinold2016: { tag: 'MECH', text: 'Pull-up study. Arms overhead leave the shoulder less room. Hang not studied.' },
  kolber2010: { tag: 'CONSENSUS', text: 'Review of lifting injuries. The shoulder is among the most often hurt.' },
  'ace-abs': { tag: 'WEAK', text: 'Press release, not peer reviewed. The captain\'s chair ranked near the top.' },
  'catalyst-hlr': { tag: 'CONSENSUS', text: 'Coaching guide. No swinging, curl the pelvis, bend the knees if needed.' },
  'catalyst-scap': { tag: 'CONSENSUS', text: 'Coaching guide. Pulling the shoulder blades down from a hang.' },
  'yessis-hlr': { tag: 'WEAK', text: 'Expert opinion. Hips lift first, then the stomach curls as thighs rise.' },
  'strengthlog-hlr': { tag: 'CONSENSUS', text: 'Coaching guide. No swinging, lower slowly, bent-knee version for beginners.' },
  'baechle-earle': { tag: 'CONSENSUS', text: 'Textbook. Thumbs around the bar for every grip.' },
  'wiki-leg-raise': { tag: 'WEAK', text: 'Encyclopedia page. The pelvis tilts back when the stomach does the lifting.' },
  'nhs-wrist-pain': { tag: 'CONSENSUS', text: 'When wrist pain needs a check.' },
};


const C = (tags, sources, note) => ({ tags, sources, ...(note ? { note } : {}) });

// ---- hand (architecture 3.1 `hang`, 4.2, 5.1) ----
// Overhand on a bar across the body, seen from the side (the plate's camera): the bar is end-on and the thumb side of
// the hand faces the camera ('radial' view). The load is body weight hanging from the hand, down the forearm.
// Right: bar across the base of the fingers (contactAt 1.0 = finger base), fingers closed over the top, thumb wrapped
// under, wrist 10 degrees back. The card: "straight in line with the forearm, or tipped back a little, knuckles
// pointing at the ceiling"; 10 is inside the card's target and the `hang` range 0 to 35 (O'Driscoll 1992).
const RIGHT_POSE = { view: 'radial', forearm: 180, wrist: { ext: 10, dev: 0 }, contactAt: 1.0, fingers: { curl: 1 }, thumb: 'wrapped', squeeze: 'firm',
  handle: { profile: 'bar-32', axis: 'across' }, load: { kind: 'gravity' } };
// Main wrong hand (card zoom "hand" wrong, handlingMistakes #4): the grip failing. Bar rolled out toward the fingertips
// (contactAt 1.4 of 1.6), fingers peeling open, thumb loose on top, and the wrist CURLED FORWARD (flexion). -30 is
// 30 degrees outside the right range (faultMargin): it reads as clearly curled. A drawing value, not a threshold (3.1.1).
const FAULT_CURL_SLIP = {
  key: 'curl-slip', label: 'Slipping out',
  pose: { wrist: { ext: -30, dev: 0 }, contactAt: 1.4, fingers: { curl: 1, open: 0.4 }, thumb: 'over' },
  markers: ['slip-arrow', 'lever-arc'],
  alt: 'The bar has rolled toward the fingertips and the wrist curls forward. The thumb rests loose on top and the fingers peel open. The grip is about to fail.',
};
// Thumb page (5.1, `hang`): the card's two options. Full grip is the default and the only one offered (C4); thumbless is
// information. Only the thumb differs between the two drawings, so they compare directly; the card's "opening late in
// the set on a sweaty bar" is in the alt text and the main wrong hand (fingers peeling), not drawn here, because a
// half-open hand at this size read as a broken drawing.
export const THUMB_PAGE = [
  { mode: 'wrapped', title: 'Full grip', note: 'Every set', default: true,
    pose: RIGHT_POSE, alt: 'Full grip: the thumb wraps under the bar to meet the index finger. Use it every set.' },
  { mode: 'over', title: 'Thumbless', note: 'Nothing to gain here',
    pose: { ...RIGHT_POSE, thumb: 'over' },
    alt: 'Thumbless: the thumb lies on top beside the fingers. Late in a long set on a sweaty bar the hand can open. Nothing to gain here.' },
];

// ---- posture zoom poses ----
// The plate solves every hang with the whole-body centre of mass under the bar (a still hang). The plate module keeps
// its `hang()` solver private, so the same solver is repeated here (same bar, grip, arm length and Winter 2009 segment
// masses as exercises/hanging_leg_raise.mjs) to build balanced full poses for the zoom-only positions.
const H = 1.75, BAR = [0, 2.25, 0], GRIP_X = 0.24, ARM = (0.186 + 0.146 + 0.46 * 0.108) * H;
const hands = { l: { at: [GRIP_X, BAR[1], BAR[2]], pole: [0.5, 0, -1] }, r: { at: [-GRIP_X, BAR[1], BAR[2]], pole: [-0.5, 0, -1] } };
const mid = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function comZ(lm) {
  let m = 0, z = 0;
  const seg = (w, p) => { m += w; z += w * p[2]; };
  seg(0.081, lm.ear); seg(0.497, mid(lm.shoulders, lm.hips, 0.5));
  for (const s of ['l', 'r']) {
    seg(0.028, mid(lm[`shoulder.${s}`], lm[`elbow.${s}`], 0.436)); seg(0.016, mid(lm[`elbow.${s}`], lm[`wrist.${s}`], 0.430));
    seg(0.006, lm[`grip.${s}`]); seg(0.100, mid(lm[`hip.${s}`], lm[`knee.${s}`], 0.433));
    seg(0.0465, mid(lm[`knee.${s}`], lm[`ankle.${s}`], 0.433)); seg(0.0145, mid(lm[`heel.${s}`], lm[`toe.${s}`], 0.5));
  }
  return z / m;
}
function hang(angles, off = 0) {
  let root = [0, BAR[1] - 1.14, -0.02];
  for (let i = 0; i < 40; i++) {
    const lm = landmarksOf({ ...angles, root: { at: root, tilt: angles.tilt }, reach: hands }, H);
    const dz = BAR[2] + off - comZ(lm), sh = lm['shoulder.r'], lat = GRIP_X - Math.abs(sh[0]);
    const need = Math.sqrt((ARM * 0.998) ** 2 - lat ** 2), sz = sh[2] + dz, dy = Math.sqrt(Math.max(0, need ** 2 - (BAR[2] - sz) ** 2));
    root = [0, root[1] + (BAR[1] - dy - sh[1]), root[2] + dz];
  }
  const { tilt, ...rest } = angles;
  return { ...rest, root: { at: root.map(v => +v.toFixed(4)), tilt }, reach: hands };
}
// Pelvis curl, wrong: thighs at hip height (thigh 90 deg from vertical = hip flex - tilt), pelvis still tipped
// forward 12 deg, lower back arched 10 deg (trunk -10), knees soft as in the right top. Balanced under the bar.
// The arch is split between lumbar and pelvis: at trunk -15 / tilt 15 the back outline met the buttock in a sharp V.
// Right top = the plate's end pose (tilt -25, lumbar curled 15, thighs 105 deg: just above hip height).
export const PELVIS_WRONG = hang({ tilt: 12, trunk: -10, neck: 5, hip: 102, knee: 5, ankle: -25 });
// Shoulders: dead hang (the plate's start angles) with the shoulder girdle set down, or shrugged up (cm, SPEC.md 3).
// With straight arms the shoulders hang a fixed arm length under the bar, so a shrug shows as the trunk and head
// sinking between the arms; setting the shoulders down lifts them.
const A0 = { tilt: 0, trunk: 0, neck: 0, hip: 0, knee: 0, ankle: -25 };
export const ACTIVE_HANG = hang({ ...A0, scap: { elev: -3, pro: -1 } });
export const SHRUG_HANG = hang({ ...A0, scap: { elev: 8, pro: 1 }, neck: 10 });

/* ---------------------------------------------------------------- handling mistakes, risks (plan 2.4 items 4, 7) --
 * From the verified card's handlingMistakes (grip/research/hanging_leg_raise.json): the mistake, its fix and what it can hurt,
 * cut to the copy limits (artifact/copy-lint.mjs: at most 3 mistakes, title <= 5 words, fix <= 12; at most 3 risks,
 * <= 14 words; no citations in user copy, C7; no red-flag wording, C8: the shared RED_FLAG and DISCLAIMER come from
 * howto/shared.mjs). `zoom` = "Show me" target. The card's 4th mistake (grip slipping) is the wrist limit line. */
const MISTAKES = [
  { key: 'swing', title: 'Swinging your legs up', claim: C(['CONSENSUS'], ['catalyst-hlr', 'yessis-hlr', 'strengthlog-hlr']),
    fix: 'Start each rep still and lower slower than you lift.' },
  { key: 'legs-only', title: 'Lifting only your legs', zoom: 'pelvis', claim: C(['CONSENSUS', 'WEAK'], ['catalyst-hlr', 'workman2008']),
    fix: 'As your thighs pass hip height, curl your hips toward your ribs.' },
  { key: 'sunk', title: 'Hanging loose, shoulders sunk', zoom: 'shoulders', claim: C(['MECH', 'CONSENSUS'], ['prinold2016', 'catalyst-scap']),
    fix: 'Set your shoulders a little down before the first rep.' },
];
const RISKS = [
  { key: 'swing', text: 'Swinging jerks your weight through your hands and shoulders and arches your lower back.',
    claim: C(['CONSENSUS'], ['catalyst-hlr', 'yessis-hlr'], 'The injury link is consensus, not measured.') },
  { key: 'spine', text: 'Skipping the hip curl pulls on your lower spine, which matters with back pain.',
    claim: C(['DATA'], ['mcgill2015'], 'McGill 2015: about 3000 N of spine compression in the straight-leg hanging raise.') },
  { key: 'shoulder', text: 'Dropping into a loose hang loads your shoulder, which has little room overhead.',
    claim: C(['MECH', 'CONSENSUS'], ['prinold2016', 'kolber2010']) },
];

export default {
  schema: 1,
  id: 'lib_hanging_leg_raise',
  rev: 1,
  plate,
  handling: {
    archetype: 'hang',
    orientation: 'pronated',
    handle: 'bar-32',                  // A5; the plate draws the same 32 mm bar
    loadAxis: 'across',                // `hang` default (3.1.1): no push lever check
    overBody: false,
    width: { text: 'About shoulder width, so your arms hang straight down.',
      claim: C(['CONSENSUS'], ['catalyst-hlr', 'strengthlog-hlr'], 'Consensus only. No study compares grip widths for leg raises.') },
    thumb: { mode: 'wrapped', claim: C(['CONSENSUS'], ['baechle-earle'], 'No study has measured thumb position on this exercise. Thumbless is shown on the thumb page as information only (C4).') },
    contact: 'finger-base',
    wrist: { ext: [0, 35], dev: [-10, 10], limitText: 'A curling wrist means your grip is failing. End the set or use straps.',
      claim: C(['DATA', 'CONSENSUS'], ['odriscoll1992'], "O'Driscoll 1992 (hand gauge, not a bar): grip strongest near 35 degrees back, curling the wrist cuts grip. The target and the limit in a hang are consensus.") },
    pose: RIGHT_POSE,
    faults: [FAULT_CURL_SLIP],
    gripLine: "Bar at the base of your fingers, thumb wrapped, so your hand won't peel open.",
    cue: 'Hook the fingers, wrap the thumb.',
    // Grip-free options (card grip.type): lifting straps, ab slings, captain's chair. Text only in v1 (setup step 1,
    // the wrist limit line, rows "low-back" and "wrist"); the straps zoom needs a strap drawing (A5 open).
    alternatives: ['lifting-straps', 'ab-slings', 'captains-chair'],
  },
  contacts: ['hang-support'],
  setup: [
    // card steps 1 + 3 (the grip-free options, before you step up)
    { kind: 'adjust', text: "Weak grip? Use straps. Sore wrist? Ab slings or a captain's chair.",
      claim: C(['CONSENSUS', 'DATA'], ['catalyst-hlr', 'escamilla2006', 'ace-abs', 'jukic2021', 'valerio2021', 'martins2026'], 'Ab slings appear in Escamilla 2006 as used, not compared. The captain\'s chair ranking is a press release. Straps cut grip fatigue in deadlifts, no effect in pulldowns. Not studied on this exercise.') },
    { kind: 'get-in', text: "Step up from a box, and check it's clear of your legs.",
      claim: C(['CONSENSUS', 'MECH'], ['yessis-hlr', 'prinold2016'], 'Stepping up instead of jumping into the hang is consensus.') },
    // card steps 3 (chalk) + 4
    { kind: 'grip', text: 'Chalk up. Bar at shoulder width, palms away, thumb wrapped.', zoom: 'hand',
      claim: C(['CONSENSUS'], ['baechle-earle']) },
    { kind: 'position', text: 'Hang with straight arms, shoulders pulled a little down from your ears.', zoom: 'shoulders',
      claim: C(['CONSENSUS', 'MECH'], ['catalyst-scap', 'prinold2016']) },
    // card steps 6 + 7
    { kind: 'brace', text: 'Wait until you hang still. New to this? Start with bent knees.',
      claim: C(['CONSENSUS'], ['catalyst-hlr', 'yessis-hlr', 'strengthlog-hlr']) },
  ],
  posture: [
    { key: 'hang', label: 'Active hang', detail: 'Arms straight, shoulder blades pulled slightly down, a clear gap between ears and shoulders.',
      anchor: { at: 'shoulderTop.r', pose: 'start' }, zoom: 'shoulders', claim: C(['CONSENSUS', 'MECH'], ['catalyst-scap', 'prinold2016']) },
    { key: 'still', label: 'Still body', detail: 'At the start you hang still in a line under the bar. Legs together, a touch in front.',
      anchor: { at: 'hip.r', pose: 'start' }, claim: C(['CONSENSUS'], ['catalyst-hlr', 'yessis-hlr', 'strengthlog-hlr'], 'Shown by the plate Mistake layer (swing), not a zoom.') },
    { key: 'curl', label: 'Pelvis curls up', detail: 'At the top your lower back rounds gently and your tailbone tips up. Your belt line rises toward your ribs.',
      anchor: { at: 'sacrum' }, zoom: 'pelvis', claim: C(['MECH', 'CONSENSUS'], ['workman2008', 'catalyst-hlr', 'wiki-leg-raise'], 'Workman 2008 is a lying leg lift, not a bar, so the support is indirect.') },
    { key: 'height', label: 'Legs past hips', detail: 'Your thighs reach hip height or higher (knees to chest on the bent-knee version). Early in the lift it is mostly the front of your hips. Your pelvis curls as the legs rise higher.',
      anchor: { at: 'knee.r' }, claim: C(['WEAK'], ['yessis-hlr'], 'The 30 to 45 degree point is one biomechanist\'s expert opinion, not data.') },
    { key: 'chest', label: 'Chest stays quiet', detail: 'Your upper body stays under the bar while your legs rise. You do not lean far back to counter the legs, and your arms stay straight.',
      anchor: { at: 'backUpper' }, claim: C(['CONSENSUS'], ['catalyst-hlr', 'yessis-hlr']) },
    { key: 'lower', label: 'Slow way down', detail: 'Your legs come down under control and stop just in front of your body. They do not swing behind you.',
      anchor: { at: 'ankle.r', pose: 'start' }, claim: C(['CONSENSUS'], ['strengthlog-hlr', 'catalyst-hlr']) },
  ],
  feel: {
    primary: [{ muscleId: 'abs', plain: 'Down the front of your stomach, from the ribs to below your belly button, tightening hard as your hips curl up at the top. Most people feel it most below the belly button.' }],
    secondary: [
      { muscleId: 'obliques', plain: 'The sides of your waist, working to keep you from twisting and to help the curl.' },
      { muscleId: 'hip_flexors', plain: 'The front of your hips, where the legs meet the body. They lift your legs, so some work here is normal.' },
      { muscleId: 'lats', plain: 'Some tension down the sides of your back, holding your upper body still under the bar.' },
      { muscleId: 'forearms', plain: 'Your grip, holding your whole body up. Some burn is normal on long sets.' },
    ],
    // "Should not take over": dashed outline ONLY while a row naming the muscle is open (S6), never at rest (5.3).
    // hip_flexors and forearms are helpers AND watch on purpose (card): some work is normal, taking over is the fault.
    watch: [
      { muscleId: 'hip_flexors', plain: 'If the front of your hips is all you feel, you are lifting your legs without curling your pelvis.' },
      { muscleId: 'lower_back', plain: 'Your lower back should not ache or pinch. If it does, it is arching instead of rounding.' },
      { muscleId: 'forearms', plain: 'If your grip gives out before your stomach is tired, the set ends too early. Use straps or ab slings.' },
      { muscleId: 'upper_traps', plain: "The tops of your shoulders and your neck shouldn't ache or feel pulled. If they do, you're hanging loose with your shoulders sunk up by your ears." },
    ],
    feelLine: 'You should feel this down your stomach, most as your hips curl up.',
    rows: [
      { key: 'hips', where: 'Front of the hips only', at: { muscles: ['hip_flexors'] },
        means: "Your pelvis isn't curling, so your hip muscles do the lifting.",
        fix: 'Bend your knees and curl your hips up toward your ribs.',
        zoom: 'pelvis', claim: C(['DATA', 'MECH', 'CONSENSUS'], ['andersson1997', 'juker1998', 'workman2008', 'catalyst-hlr']) },
      { key: 'low-back', where: 'Lower back', at: { muscles: ['lower_back'] },
        means: "You're swinging, or your back arches as your legs move.",
        fix: "Start still and lower slowly, or use a captain's chair. Stop if it hurts.",
        zoom: 'pelvis', claim: C(['DATA', 'CONSENSUS'], ['mcgill2015', 'axler1997', 'catalyst-hlr', 'strengthlog-hlr'], 'Spine load is measured (McGill 2015). The link from swinging to back pain is consensus.') },
      { key: 'traps', where: 'Tops of your shoulders and neck', at: { muscles: ['upper_traps'] },
        means: "You're hanging loose, so your shoulders have sunk up to your ears.",
        fix: 'Pull your shoulders a little down from your ears. Hold them there.',
        zoom: 'shoulders', claim: C(['CONSENSUS', 'MECH'], ['catalyst-scap', 'prinold2016']) },
      { key: 'wrist', where: 'Your wrist', at: { parts: ['hand-left', 'hand-right', 'hand-back-left', 'hand-back-right'] },
        means: 'Your wrist curls as grip fails, or an old injury gets stretched.',
        fix: "Keep your wrist level. If it's sore, use ab slings and stop if it hurts.",
        zoom: 'hand', redFlag: true, claim: C(['DATA', 'CONSENSUS'], ['odriscoll1992', 'nhs-wrist-pain']) },
    ],
    libraryDiff: { add: ['obliques', 'lats', 'forearms'], why: 'The card adds the obliques (88 percent of max in McGill 2015, high in Escamilla 2006), the lats (Escamilla 2006) and the forearms (the grip holds the whole body) as helpers. exercises.json lists abs primary and hip_flexors secondary.' },
    claim: C(['DATA', 'CONSENSUS'], ['mcgill2015', 'escamilla2006', 'andersson1997', 'juker1998'], '"Below the belly button" is a common feel cue, not a measured lower-ab bias: EMG shows the whole rectus abdominis working hard. Muscle readings do not map one to one onto what a person feels.'),
  },
  zooms: [
    {
      key: 'hand', chip: 'Hand', heading: 'Hand: right and wrong', kind: 'hand',
      hand: {
        right: RIGHT_POSE,
        wrong: [FAULT_CURL_SLIP],
        camera: 'side',
        thumbPage: THUMB_PAGE.map(t => t.mode),
      },
      caption: { right: 'Base of the fingers, thumb wrapped, wrist level.',
        wrong: 'Bar at the fingertips, wrist curled.' },
      alt: {
        right: 'Seen from the side, hanging. The bar sits across the base of the fingers, fingers closed over it. The thumb wraps under, and the wrist is level with the forearm.',
        wrong: FAULT_CURL_SLIP.alt,
      },
      // was 'forearms' (row cut to fit the 4-row cap, 2026-09-30); the wrist row's "means" is the fault drawn here
      feelRow: 'wrist',
      feelPrompt: 'Sore wrist? This is usually why.',
    },
    {
      key: 'pelvis', chip: 'Pelvis curl', heading: 'Pelvis curl: right and wrong', kind: 'posture',
      // crop of the plate at the top of the rep: trunk, pelvis and thighs (plate px, same camera as the plate)
      crop: { center: { at: 'hip.r', off: [-6, 20] }, sizePx: 130 },   // trunk, pelvis bowl and thigh; the arm stub out of frame
      right: 'end',
      wrong: { base: 'end', pose: PELVIS_WRONG },
      wrongAlone: true,                // the wrong crop draws the wrong pose alone and solid (see the render script)
      // zoom-only overlay (5.2): a dashed vertical through the hip joint and a "bowl" line along the pelvis, tipped
      // by the pose's pelvis tilt, so right (tipped back) and wrong (tipped forward) read against the same vertical
      pelvisGuide: true,
      callout: {
        right: { text: 'Pelvis<br>curls up', anchor: { at: 'sacrum', off: [-1, 1] } },
        wrong: { text: 'Back<br>arches', anchor: { at: 'lumbar', off: [-2, 0] } },
      },
      caption: { right: 'Pelvis curls up, lower back gently rounded.',
        wrong: 'Legs up, pelvis tipped forward, back arched.' },
      alt: {
        right: 'Side view of the trunk and hips at the top. The pelvis tips back and up, and the lower back rounds gently. The thighs are just above hip height.',
        wrong: 'The same top position with the legs at hip height. The pelvis is still tipped forward and the lower back is arched.',
      },
      feelRow: 'hips',
      feelPrompt: 'Only your hips? This is usually why.',
    },
    {
      key: 'shoulders', chip: 'Shoulders', heading: 'Shoulders: right and wrong', kind: 'posture',
      // Back view, the pull-up's "Seen from behind" drawing (exercises/pull_up.howto.mjs, same technique and wording):
      // from the side the near arm hides the head, ears and shoulder tops, so a side crop cannot show the shrug. This
      // is the plate's own hang drawn from behind with the engine's front-view outline (symmetric, no face), same
      // scale as the plate, printed "Seen from behind" (C16). Both crops solid: Right the active hang, Wrong the
      // shrug; the blades outlined on both (bladeOutlines, shared with the pull-up).
      view: 'back', camLabel: 'Seen from behind',
      equipment: [{ type: 'pullupBar', at: [0, 2.25, 0], mount: 'ceiling', stub: 0.08 }],
      outlines: bladeOutlines,
      crop: { center: { at: 'shoulders', pose: 'right', off: [0, 18] }, sizePx: 148 },
      right: { base: 'start', pose: ACTIVE_HANG },
      wrong: { base: 'start', pose: SHRUG_HANG, solid: true },
      // a level at the top of the head in the right hang (both crops), an arrow down to the sunk head, and a neutral
      // level on the ribcage at each crop's own lower blade corners
      guides: [{ kind: 'level', at: { at: 'head', pose: 'right' } }, { kind: 'level', at: 'ribLevel', tone: 'neutral' },
        { kind: 'drop', from: { at: 'head', pose: 'right' }, to: { at: 'head' } }],
      callout: {
        right: { text: 'Blades<br>down', anchor: { at: 'bladeLow.l' } },
        wrong: { text: 'Blades<br>high', anchor: { at: 'bladeLow.l' } },
      },
      caption: { right: 'Shoulders pulled down, clear gap to the ears.',
        wrong: 'Shoulders at the ears, head sunk.' },
      alt: {
        right: 'Seen from behind, hanging with straight arms. The shoulder blades are pulled down, with a clear gap between the ears and shoulders.',
        wrong: 'Seen from behind, the same hang shrugged. The shoulders are up at the ears and the head sinks between the arms. The shoulder blades ride high.',
      },
      feelRow: 'traps',
      feelPrompt: 'Tops of your shoulders? This is usually why.',
    },
  ],
  // Chip row = the zooms in order, then "Where to feel it" (always last, 2.1): 4 chips. A5 names four zooms plus
  // Feel; the 4-chip cap (2.1) drops one. Straps is the one dropped: it needs a strap drawing the hand renderer does
  // not have (A5 open item), and its content is in text (setup step 1, the wrist limit line, the wrist row).
  // "Body line" (swinging) is the plate's own Mistake layer; "thumb" is page 2 of the Hand zoom (5.1).
  chips: ['hand', 'pelvis', 'shoulders', 'feel'],
  copy: {
    setupLine: "Step up to the bar instead of jumping. Hang with shoulders a little down, and wait until you're still.",
    mistakeLine: "Don't swing your legs up. If you need a kick, bend your knees and lift slowly.",
  },
  mistakes: MISTAKES,
  risks: RISKS,
  sources: Object.keys(SOURCES),
  research: { card: 'grip/research/hanging_leg_raise.json', rev: 1, related: ['grip/research/GENERAL.md (G9)', 'grip/research/pull_up.json'] },
};

// KNOWN GAPS (for the supervisor):
// - No "Wrist sore before you start" row: that row is for presses (A1); this is a `hang` exercise. The card's own
//   wrist row covers a sore wrist (ab slings, stop if it hurts) and carries the shared RED_FLAG.
// - Straps zoom not drawn (4-chip cap, and no strap / sling / captain's chair drawing in the engine).
// - The Shoulders zoom is a side crop; the card asks for a back view with the shoulder blades outlined (the gap between
//   the ears and the shoulders). The plate is a side view and posture zooms are crops of it (5.2), and from the side
//   the near arm hides the neck and ears, so the zoom compares the head height against a level line instead.
// - Body map regions: the app's src/svg/bodyMuscles.ts (body-muscles by Ivan Vulovic, Apache-2.0) mislabels the stomach:
//   `abs-upper-left/right` sit on the flanks and two of the three `obliques-*` blocks sit on the upper six-pack. The
//   render script howto/render-hanging_leg_raise.mjs applies a documented correction in its own process (REGION_FIX:
//   the central obliques blocks paint as abs, the side block and abs-upper-* as obliques), so Main is the central column
//   from the ribs to below the navel and Also working is the flanks. Engine files are unchanged. FOLLOW-UPS: move the
//   correction into engine/bodymap-parts.mjs (shared, supervisor's OK) and fix the labels in the app's bodyMuscles.ts.
// - The wrist row marks the whole hands (the map has hand-* parts, no wrist part). The render adds a "Where it hurts"
//   legend entry and a TalkBack sentence ("the wrist, marked on the hands"); the engine legend has no pain entry yet.
// - The Pelvis curl and Shoulders wrong crops draw the wrong pose alone and solid (`wrongAlone`), a departure from the
//   dashed-over convention: dashed over the right pose, the two figures crossed each other and read as noise. The
//   Shoulders crops share one frame (centred on the right pose) so the head drop reads against the level line.
// - The card's zoom "pelvis curl" asks the hip flexors to shimmer on the wrong crop. Crops carry no map; the feel link
//   under the zoom opens the "Front of the hips only" row instead.
