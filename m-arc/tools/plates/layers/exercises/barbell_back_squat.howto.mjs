// How-to content for the barbell back squat (lib_barbell_back_squat, high-bar): grip, posture close-ups, where to feel it.
// Shape: grip/GRIP-AND-FEEL-ARCHITECTURE.md 4.1-4.4 (HowTo, HandlingSpec, ZoomSpec, FeelSpec, SetupStep,
// PostureCheckpoint). Content: the verified card grip/research/barbell_back_squat.json, with the corrections the
// architecture made in appendix A3 (33-word feel line, core text only, lower back watch only while its row is open).
// Card fields that mixed copy and citations are split: the copy stays here, the citation goes to the Claim.
// Row copy trimmed to the 30-word lint (6.2); the wrist row's own red-flag sentence is replaced by the shared RED_FLAG,
// which now names swelling (the card's "swelling, numbness or a weak grip", checked against the NHS page).
// GENERAL.md wording is not used.
// 2026-09-30 owner request (shorter, concept first): all user copy rewritten to artifact/copy-lint.mjs limits; lists cut
// to the caps (see the notes above MISTAKES, rows and setup). Claims, sources, ids and zoom keys unchanged.
// Render check: node exercises/barbell_back_squat.howto-render.mjs  ->  out/barbell_back_squat-howto-*.png
//
// Additions to the architecture's types, used by the mockup only (marked "mockup" below), as in the chest press file:
//   ZoomSpec.callouts   one callout per crop ({ right, wrong }: text + the mark it names)
//   ZoomSpec.hand.notes the 1-3 word notes over each hand half
//   ZoomSpec.hand.inset.when  the one line printed beside the inset
//   ZoomSpec.hand.inset.drawPose  the pose the inset is drawn with when the engine cannot draw `pose` yet
//   ZoomSpec.hand.inset.crop  the inset shows the fist and wrist only, cropped from a larger render (hand-frame mm)
//   ZoomSpec.hand.loadLine    per half: 'force' (the engine's arrow) or 'guide' (no arrow, no tick; the dashed forearm
//                             line and the contact dot stay). See the note above RIGHT_POSE.
//   FeelSpec.textOnly   muscles named in the text list but never painted (core: the map draws it on the serratus, 5.3)
//   stills[*].bar       world position of the bar for a still whose bar is not where the plate spec puts it
import plateSpec from './barbell_back_squat.mjs';
// RED_FLAG (and any other shared safety copy) comes from the one shared module (plan S-2 condition 4); re-exported
// for the render scripts. DISCLAIMER is shown once per sheet by the page, from the same module.
import { RED_FLAG } from '../howto/shared.mjs';
export { RED_FLAG };

/* ---------------------------------------------------------------- sources (registry entries this sheet cites) --
 * `use` is the evidence label FOR THIS USE (architecture 3). `access` is what the card's verifier read. */
export const SOURCES = {
  'ace-back-squat': { cite: 'ACE Exercise Library, Back Squat', url: 'https://www.acefitness.org/resources/everyone/exercise-library/11/back-squat/',
    kind: 'guideline', access: 'full', checked: '2026-09-30', use: 'CONSENSUS', note: 'Coaching guide. Grip, rack height and depth.' },
  'hk-squat': { cite: 'Broussal-Derval A. Squat technique. Human Kinetics, 2019', url: 'https://us.humankinetics.com/blogs/strength-conditioning-fitness/squat-technique',
    kind: 'guideline', access: 'full', checked: '2026-09-30', use: 'CONSENSUS', note: 'Teaches an extended wrist, elbows down. Barbell Logic warns against over-bending.' },
  'nsca-summary': { cite: 'NSCA Essentials of Strength Training and Conditioning, exercise technique chapter (study summary)', url: 'https://www.ptpioneer.com/personal-training/certifications/nsca-cscs/cscs-chapter-15/',
    kind: 'secondary', access: 'summary', checked: '2026-09-30', use: 'CONSENSUS', note: 'Summary: closed grip, safety bars set right, exhale past the hardest part.' },
  'barbell-logic-squat-grip': { cite: 'Reynolds M. Elbow Pain While Squatting? Fix Your Squat Grip. Barbell Logic', url: 'https://barbell-logic.com/?p=4521',
    kind: 'coach', access: 'full', checked: '2026-09-30', use: 'CONSENSUS', note: 'Low-bar coach source, no data.' },
  schulz: { cite: 'Schulz DS. Low Bar Squat Wrist Pain: Reasons and Solutions. Torokhtiy', url: 'https://store.torokhtiy.com/blogs/guides/low-bar-squat-wrist-pain',
    kind: 'coach', access: 'full', checked: '2026-09-30', use: 'WEAK', note: 'Coaching blog. Never the only source here.' },
  glassbrook2017: { cite: 'Glassbrook DJ et al. Biomechanical differences between the high-bar and low-bar back-squat. J Strength Cond Res 2017;31(9):2618-2634', url: 'https://pubmed.ncbi.nlm.nih.gov/28570490/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'DATA', note: 'Review. High-bar and low-bar squats compared.' },
  wretenberg1996: { cite: 'Wretenberg P, Feng Y, Arborelius UP. High- and low-bar squatting techniques during weight-training. Med Sci Sports Exerc 1996;28(2):218-24', url: 'https://pubmed.ncbi.nlm.nih.gov/8775157/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'DATA', note: 'Lifting study. High-bar and low-bar squats compared.' },
  caterisano2002: { cite: 'Caterisano A et al. The effect of back squat depth on the EMG activity of 4 superficial hip and thigh muscles. J Strength Cond Res 2002;16(3):428-32', url: 'https://pubmed.ncbi.nlm.nih.gov/12173958/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'DATA', note: 'Muscle study, 10 people. Squat depth compared.' },
  kubo2019: { cite: 'Kubo K, Ikebukuro T, Yata H. Effects of squat training with different depths on lower limb muscle volumes. Eur J Appl Physiol 2019;119(9):1933-1942', url: 'https://pubmed.ncbi.nlm.nih.gov/31230110/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'DATA', note: 'MRI scans, 17 people. Squat depth and muscle growth.' },
  bloomquist2013: { cite: 'Bloomquist K et al. Effect of range of motion in heavy load squatting on muscle and tendon adaptations. Eur J Appl Physiol 2013;113(8):2133-42', url: 'https://pubmed.ncbi.nlm.nih.gov/23604798/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'DATA', note: '17 people. Deep and shallow squat training compared.' },
  paoli2009: { cite: 'Paoli A, Marcolin G, Petrone N. Stance width and thigh muscle EMG during the back squat. J Strength Cond Res 2009;23(1):246-50', url: 'https://pubmed.ncbi.nlm.nih.gov/19130646/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'WEAK', note: '6 people. Only the glutes worked more with a wide stance.' },
  clark2012: { cite: 'Clark DR, Lambert MI, Hunter AM. Muscle activation in the loaded free barbell squat: a brief review. J Strength Cond Res 2012;26(4):1169-78', url: 'https://pubmed.ncbi.nlm.nih.gov/22373894/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'DATA', note: 'Stance width made no clear difference to the muscles.' },
  escamilla2001: { cite: 'Escamilla RF et al. A three-dimensional biomechanical analysis of the squat during varying stance widths. Med Sci Sports Exerc 2001;33(6):984-98', url: 'https://pubmed.ncbi.nlm.nih.gov/11404665/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'MECH', note: 'Wider stance raised the load on hips and knees. No muscle readings.' },
  contreras2015: { cite: 'Contreras B et al. Gluteus maximus, biceps femoris and vastus lateralis EMG in the back squat and barbell hip thrust. J Appl Biomech 2015', url: 'https://pubmed.ncbi.nlm.nih.gov/26214739/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'DATA', note: 'Hamstrings worked only a little in the squat.' },
  fry2003: { cite: 'Fry AC, Smith JC, Schilling BK. Effect of knee position on hip and knee torques during the barbell squat. J Strength Cond Res 2003;17(4):629-33', url: 'https://pubmed.ncbi.nlm.nih.gov/14636100/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'DATA', note: '7 people. Knees past the toes kept hip load lower.' },
  hackett2013: { cite: 'Hackett DA, Chow CM. The Valsalva maneuver: its effect on intra-abdominal pressure and safety issues during resistance exercise. J Strength Cond Res 2013;27(8):2338-45', url: 'https://pubmed.ncbi.nlm.nih.gov/23222073/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'MECH', note: 'Review. Holding your breath raises pressure in your trunk.' },
  lander1992: { cite: 'Lander JE, Hundley JR, Simonton RL. The effectiveness of weight-belts during multiple repetitions of the squat exercise. Med Sci Sports Exerc 1992;24(5):603-9', url: 'https://pubmed.ncbi.nlm.nih.gov/1533266/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'MECH', note: 'Belt study, 5 people.' },
  kerr2010: { cite: 'Kerr ZY et al. Epidemiology of weight training-related injuries presenting to US emergency departments, 1990 to 2007. Am J Sports Med 2010;38(4):765-71', url: 'https://pubmed.ncbi.nlm.nih.gov/20139328/',
    kind: 'peer-reviewed', access: 'abstract', checked: '2026-09-30', use: 'DATA', note: 'For safety pins: dropped weights were the most common cause of injury.' },
  'nhs-wrist-pain': { cite: 'NHS, Wrist pain', url: 'https://www.nhs.uk/conditions/hand-pain/wrist-pain/',
    kind: 'guideline', access: 'full', checked: '2026-09-30', use: 'CONSENSUS', note: 'When wrist pain needs a check.' },
  'nhs-knee-pain': { cite: 'NHS, Knee pain', url: 'https://www.nhs.uk/symptoms/knee-pain/',   // RED_FLAG_KNEE source
    kind: 'guideline', access: 'full', checked: '2026-09-30', use: 'CONSENSUS', note: 'When knee pain needs a check.' },
};
// Could not open (card): NSCA site (403), Starting Strength (403), powerliftingtechnique.com (403), ExRx. No claim rests on them.

const C = (tags, sources, note) => ({ tags, sources, ...(note ? { note } : {}) });
const CL = {
  grip: C(['CONSENSUS'], ['ace-back-squat', 'hk-squat', 'barbell-logic-squat-grip'],
    'Everything about the hands is coaching consensus. No study measures wrist or elbow load in the back squat.'),
  wrist: C(['CONSENSUS'], ['barbell-logic-squat-grip', 'hk-squat', 'schulz'],
    'Sources disagree: Human Kinetics teaches an extended wrist, Barbell Logic warns against over-extension. The card allows 0-15 deg and draws the line where the wrist starts carrying load. The 0-15 deg number is a coaching estimate.'),
  thumb: C(['CONSENSUS'], ['nsca-summary', 'barbell-logic-squat-grip'],
    'NSCA teaches the closed grip (the only source for it). Barbell Logic teaches thumb-over with the bar in the heel of the palm. The bar sits on the back, so the thumb has no safety job here.'),
  width: C(['CONSENSUS'], ['ace-back-squat', 'hk-squat', 'barbell-logic-squat-grip'], 'No study sets an ideal width.'),
  rack: C(['CONSENSUS'], ['ace-back-squat', 'hk-squat']),
  safety: C(['CONSENSUS', 'DATA'], ['nsca-summary', 'kerr2010'], 'Pin height is consensus; Kerr 2010 gives the context (dropped weights were the most common injury mechanism).'),
  barSpot: C(['CONSENSUS'], ['hk-squat'], 'Bar on muscle, not bone, is consensus.'),
  brace: C(['MECH', 'CONSENSUS'], ['hackett2013', 'lander1992', 'nsca-summary'], 'A held breath raises trunk pressure (Hackett 2013); the high-blood-pressure caution is consensus.'),
  feet: C(['CONSENSUS', 'DATA'], ['hk-squat', 'ace-back-squat', 'fry2003'], 'Knee tracking and heels down are consensus; knees past the toes kept hip torque low (Fry 2003, n=7).'),
  midfoot: C(['CONSENSUS', 'MECH'], ['glassbrook2017'], 'Glassbrook 2017 says the centre of mass stays over the base of support; it does not name the mid-foot. The mid-foot line is consensus.'),
  back: C(['CONSENSUS', 'DATA'], ['hk-squat', 'glassbrook2017', 'fry2003']),
  depth: C(['DATA', 'CONSENSUS'], ['ace-back-squat', 'kubo2019', 'bloomquist2013', 'caterisano2002'],
    'Full squats grew the glutes and inner thighs more than half squats (Kubo 2019); deep squats grew the front thigh more (Bloomquist 2013); glute share rises with depth (Caterisano 2002).'),
  stance: C(['WEAK', 'DATA', 'MECH'], ['paoli2009', 'clark2012', 'escamilla2001'], 'Kept soft ("may"): Paoli 2009 n=6; Clark 2012 found no significant change with stance width.'),
  feel: C(['DATA', 'CONSENSUS'], ['caterisano2002', 'kubo2019', 'contreras2015', 'glassbrook2017', 'wretenberg1996'],
    'Quads and glutes main (Caterisano 2002, Kubo 2019). Hamstrings only a little (Contreras 2015). High-bar leans on the quads more than low-bar (Glassbrook 2017), but the difference is small and mixed (Wretenberg 1996).'),
  consensus: C(['CONSENSUS'], ['ace-back-squat'], 'Coaching consensus (card).'),
};


/* ------------------------------------------------------------------------------------------------ hand ---------- */
// Seen from the side, looking along the bar (the plate's own camera; the lifter faces screen right, so the palm faces
// right and the back of the hand faces left). Forearm roughly vertical under the bar (180 = pointing up the screen).
// Right: the card's handContact and wrist target, the owner's photo 2 read onto the squat: bar low in the palm on the
// heel of the hand, knuckles, wrist and forearm in one nearly straight line (8 deg, inside 0-15), thumb wrapped,
// fingers closed lightly (they pin the bar, they don't hold it up).
// Wrong: the card's "waiter's tray" (A3 fault `waiter-tray`), the owner's photo 1 read onto the squat: bar up in the
// finger bends, hand folded back under it 42 deg ("40 degrees or more" in the card), bend arc at the wrist. The thumb is
// kept wrapped: the card names only the bar position and the wrist bend, so those are the only two differences.
// Bar height in the palm. engine/hand.mjs:117-122 draws contactAt c at (0.5 + 0.5 c) of the palm length, because a
// pulled handle lies diagonally across the palm. A squat bar pressed into the heel lies nearly straight across it, so
// the card's "low in the palm, across the heel" is 0.35-0.45 of the palm length: contactAt -0.1 draws the bar centre at
// 0.45 (35 mm above the wrist crease, its lower edge 21 mm above it), with the fingers closed over it and the wrapped
// thumb's tip on the index finger's middle segment, below the top of the fist. -0.1 is a drawing value for the current
// engine mapping, not "below the crease": OPEN (engine owner) map on-body and push grips straight across, then set 0.3.
// Load line. The architecture's "on-body = along-forearm" (3.1.1) is for the lever check only (the Wrong hand really
// does carry the bar through the wrist: 4.6 cm). The Right hand must not show a force arrow down the arm: the card's
// correct zoom says the load goes into the upper back and stays off the arm, and the caption under the picture says
// "Your back holds the bar." So the Right half and the inset use loadLine 'guide' (below); the lever is still computed.
// OPEN (engine owner): a per-half load line option in renderHandPair/renderHand; the render script strips the Right
// half's arrow and tick until then.
const RIGHT_POSE = {
  view: 'radial', forearm: 180, wrist: { ext: 8, dev: 0 }, contactAt: -0.1, fingers: { curl: 1 }, thumb: 'wrapped',
  squeeze: 'light', handle: { profile: 'bar-28', axis: 'across', diameterMm: 28 }, load: { kind: 'on-body' },
};
const WAITER_TRAY = {
  key: 'waiter-tray', label: 'Bar in fingers',
  pose: { wrist: { ext: 42, dev: 0 }, contactAt: 1.05, fingers: { curl: 0.92 } },
  // 'load-through-wrist' is left off on purpose: the renderer already draws the load line for along-forearm loads
  // (4.6 cm on the back-of-hand side, printed), and a second red arrow through the wrist centre read as two loads.
  markers: ['lever-arc'],
  alt: 'Bar up in the fingers, hand bent back under it like a tray. The wrist bends about 40 degrees. The weight passes on the back-of-hand side, bending it further.',
};
const THUMB_OVER = { thumb: 'beside' };   // thumb over the bar, on the same side as the fingers (card: allowed option)
// How the inset draws it (mockup). engine/hand.mjs's 'beside' mode aims the tip at the index finger's first segment but
// keeps the thumb's full length, so the tip overshoots 26 mm past the top of the fist and reads as a thumbs-up. Until
// the engine shortens that reach (OPEN, engine owner), the inset uses the wrap solver with the thumb metacarpal set to
// 15 deg: the thumb then goes round the TOP of the bar (the fingers' side) instead of under it, lies along the index
// finger, and its tip rests in front of the bar next to the index finger's middle segment, 30 mm below the top of the
// fist. The render script redraws the bar's outline dashed over the thumb (hidden edge), so the bar stays readable.
// The data stays `beside`; only the drawing differs.
const THUMB_OVER_DRAW = { thumb: 'wrapped', thumbMC: 15 };

/* --------------------------------------------------------------------------------------- posture stills --------- */
// Still poses for the posture crops, built from the plate spec's own poses. Only the bar-on-neck still is new: the
// same standing pose with the bar moved up onto the base of the neck and the elbows pushed up and back.
const H = 1.75, GRIP_X = 0.36;
const barAt = pose => {   // the plate IK-places both hands on the bar, so the bar centre is the grip midpoint (y, z)
  const g = pose.reach.r.at; return [0, g[1], g[2]];
};
const hands = (bar, pole) => ({
  l: { at: [GRIP_X, bar[1], bar[2]], pole: [-pole[0], pole[1], pole[2]] },
  r: { at: [-GRIP_X, bar[1], bar[2]], pole },
});
const START_BAR = barAt(plateSpec.poses.start);
// Bar on the neck (card zoom bar_on_back, wrong): 4.5 cm higher and 2 cm further forward, onto the base of the neck.
// Elbows flared up and back (card): IK pole turned from "down" to "back and a little down".
const NECK_BAR = [0, START_BAR[1] + 0.045, START_BAR[2] + 0.02];
export const stills = {
  start: { pose: plateSpec.poses.start, bar: START_BAR },
  end: { pose: plateSpec.poses.end, bar: barAt(plateSpec.poses.end) },
  // Stopping short (card zoom depth, first wrong version): the plate's own second via pose, hip 21 cm above the end.
  short: { pose: plateSpec.poses.via[1], bar: barAt(plateSpec.poses.via[1]) },
  'bar-neck': { pose: { ...plateSpec.poses.start, reach: hands(NECK_BAR, [-0.45, -0.75, -0.6]) }, bar: NECK_BAR },
};

/* ------------------------------------------------------------------------------------------------ zooms --------- */
// Chip order (architecture 2.1): Hand first (on-body: the load goes through the hands when it's wrong), then the
// posture zooms, then "Where to feel it", which the sheet adds for every exercise with a FeelSpec. So at most 3 here.
// A3 names 4 (Hand, Bar on back, Feet and knees, Depth). "Feet and knees" is dropped from the chips: its picture is a
// front view of the legs, and a posture zoom must be a crop of the plate on screen (5.2), which is a side view. Knees
// and heels are already two of the plate's three callouts, and the row "Front or inside of the knees" carries the text.
// OPEN (supervisor / owner): knees caving in is the card's most common squat fault, and this departs from A3's chip
// list. Either allow one front-view still for squats (a single exception, recorded here and in A3) or confirm the drop
// in A3 so every squat variant applies the same rule. Until then the chip stays off.
const zooms = [
  {
    key: 'hand', chip: 'Hand', heading: 'Hand: right and wrong', kind: 'hand',
    hand: {
      right: RIGHT_POSE,
      wrong: [WAITER_TRAY],
      camera: 'side',
      inset: { label: 'Option: thumb over the bar', pose: THUMB_OVER, drawPose: THUMB_OVER_DRAW, camera: 'side',   // drawPose: mockup
        crop: { u: [-42, 96], v: [-66, 40] },   // mockup: fist, wrist and the start of the forearm, hand-frame mm
        when: 'If a wrapped thumb bends your wrist back.' },   // mockup: printed beside the inset, under its label
      loadLine: { right: 'guide', wrong: 'force', inset: 'guide' },   // mockup (see the note above RIGHT_POSE)
      notes: { right: 'Heel of palm', wrong: 'Bar in fingers' },   // mockup
    },
    caption: {
      right: 'Bar low in your palm, wrist straight.',
      wrong: 'In your fingers, hand bent back like a tray.',
    },
    alt: {
      right: 'Bar low on the heel of the hand, fingers closed lightly, thumb wrapped. Knuckles, wrist and forearm in a nearly straight line, forearm upright.',
      wrong: WAITER_TRAY.alt,
    },
    feelRow: 'wrist',
  },
  {
    key: 'bar-on-back', chip: 'Bar on back', heading: 'Bar on back: right and wrong', kind: 'posture',
    crop: { center: { landmark: 'neck', pose: 'start', dx: -4, dy: 8 }, sizePx: 84 },
    right: 'start',
    wrong: { still: 'bar-neck' },
    callouts: {   // mockup: one label per crop
      right: { text: 'On the muscle', guide: 'bar-shelf' },
      wrong: { text: 'On neck bone', guide: 'bar-bone' },
    },
    caption: {
      right: 'On your upper traps, below the bony bump.',
      wrong: 'On the bony bump at your neck.',
    },
    alt: {
      right: 'Side view of the neck and upper back, standing. The bar rests on the upper traps, just below the bony bump. Elbows point down.',
      wrong: 'Side view of the neck and upper back. The bar sits higher, on the bony bump at the base of the neck. Elbows pushed up and back.',
    },
    // feelRow removed 2026-09-30: its row ("Back of your neck") was cut to fit the 4-row cap. The neck fault stays in
    // this close-up and in setup step 2.
  },
  {
    key: 'depth', chip: 'Depth', heading: 'Depth: right and wrong', kind: 'posture',
    crop: { center: { landmark: 'hip.r', pose: 'end', dx: 30, dy: -12 }, sizePx: 116 },
    right: 'end',
    wrong: { still: 'short' },
    callouts: {
      right: { text: 'Deep enough', guide: 'knee-line' },
      wrong: { text: 'Too short', guide: 'knee-line' },
    },
    caption: {
      right: 'Hip crease at or below the top of your knee.',
      wrong: 'Hip stops well above your knee.',
    },
    alt: {
      right: 'Side view of the hip and knee at the bottom. The hip crease sits just below a dotted line from the top of the knee. Heels down.',
      wrong: 'Side view at the bottom of a short squat. The hip crease stays well above the dotted line from the top of the knee.',
    },
    // feelRow removed 2026-09-30: its row ("Only the front of your thighs") was cut to fit the 4-row cap. Not pointed at
    // the lower-back row: that row's causes (hips rising first, a soft brace, rounding at the bottom) are not what this
    // Wrong picture (a squat that stops too high) shows, and this crop cannot draw the back rounding.
  },
];
// Text only (card zooms not drawn): "Feet and knees" (front view, see above) and "Bar over mid-foot" (already the
// plate's datum line and first callout). The card's second wrong depth (lower back tucking under at the very bottom)
// stays in the depth checkpoint text: the plate engine's lumbar flexion at this scale is too small to read in a crop.

/* ------------------------------------------------------------------------------------------------ feel ---------- */
const WRIST_PARTS = ['hand-back-left', 'hand-back-right'];      // A3: the back of the hands, never the forearm muscles
// A3 also names elbow-left/right for the inside-elbow half of this row. Left off: in bodyMuscles.ts those paths sit
// on the OUTER side of the elbow in the front view (checked in the render), so tinting them would point at the wrong
// side. The inside of the elbow has no drawn region yet; the row's words carry it.
const feel = {
  primary: [
    { muscleId: 'quads', plain: 'The front of your thighs. They straighten your knees and do most of the work.' },
    { muscleId: 'glutes', plain: 'Your glutes, more and more as you go deeper. You should feel them working hard at the bottom and on the way up.' },
  ],
  secondary: [
    { muscleId: 'adductors', plain: 'Your inner thighs, near the bottom of a deep squat. They help drive you up out of the bottom.' },
    { muscleId: 'lower_back', plain: 'The muscles along your lower spine hold your back flat. A steady tightness there is normal.' },
    { muscleId: 'hamstrings', plain: 'The back of your thighs, only a little. They steady the hips but do little of the lifting.' },
  ],
  textOnly: [   // mockup: named in the text, never painted (the map draws `core` on the serratus, 5.3, C2)
    { muscleId: 'core', plain: 'Your trunk works like a tight belt.' },
  ],
  // Shown only while a row naming the muscle is open (S6). lower_back is a helper at rest and a watch muscle only
  // while its row is open (A3). forearms and upper_traps are named in no row's `at` (A3 marks the wrist row on the
  // hand parts), so they stay in the text of the watch list.
  watch: [
    { muscleId: 'lower_back', plain: 'Your lower back keeps your spine still while your legs lift. If it aches more than your thighs, your hips are rising first or your back is rounding.' },
    { muscleId: 'forearms', plain: 'Your forearms and wrists should do almost nothing. If they ache, your hands are holding the bar up.' },
    { muscleId: 'upper_traps', plain: 'The bar sits on your upper traps, so you\'ll feel pressure there. Sharp pain on the bony bump at the base of your neck means the bar is too high.' },
  ],
  // Owner 2026-09-30 (shorter, concept first): 20 words, 2 sentences. The inner thighs stay on the map as helpers.
  feelLine: 'You should feel this in the front of your thighs and glutes. If your lower back does more, go lighter.',
  // 4 rows (owner cap). Kept: the three red-flag rows (wrist, knees, wrist-sore) and the lower back, the most serious
  // fault (the plate's Mistake layer). Cut 2026-09-30: "Back of your neck" (the bar-on-back close-up and setup step 2
  // still teach it) and "Only the front of your thighs" (the depth close-up still shows stopping short).
  rows: [
    { key: 'wrist', where: 'Wrists or inner elbows', at: { parts: WRIST_PARTS },   // elbows: text only (see the note above WRIST_PARTS)
      means: 'Your hands are holding the bar up, not your back.',
      fix: 'Pull your elbows down. Move your hands until your wrists sit straight.',
      zoom: 'hand', redFlag: true, claim: CL.wrist },
    { key: 'lower-back', where: 'Lower back more than thighs', at: { muscles: ['lower_back'] },
      means: 'Hips rising first, a soft brace, or rounding at the bottom.',
      fix: 'Brace, lift chest and hips together, and stop before your back rounds.',
      claim: C(['DATA', 'MECH', 'CONSENSUS'], ['fry2003', 'hackett2013', 'hk-squat'], 'The plate\'s Mistake layer shows this fault (hips rise first).') },
    { key: 'knees', where: 'Front or inside of knees', at: { parts: ['knee-left', 'knee-right'] },
      means: 'Knees caving in, heels lifting, or bouncing at the bottom.',
      fix: 'Push your knees out over your toes, heels down, and lower with control.',
      redFlag: 'knee', claim: { ...CL.feet, sources: [...CL.feet.sources, 'nhs-knee-pain'] } },   // referral: the shared knee block (C8)
    // behind "More"
    // Not a press, so the architecture does not require this row; it is here because the card gives a sore-wrist
    // option (thumb over the bar) and the owner is squatting on a sore wrist. Both lines are the card's: "wrapping the
    // thumbs can over-bend the wrist and cause wrist pain" (grip.thumb, Barbell Logic) and its sore-wrist sentence.
    { key: 'wrist-sore', where: 'Wrist sore before you start', at: { parts: WRIST_PARTS },
      means: 'A wrapped thumb can bend your wrist back, adding pain.',
      fix: 'Try your thumb over the bar. Keep whichever holds your wrist straighter.',
      zoom: 'hand', redFlag: true,
      claim: C(['CONSENSUS'], ['barbell-logic-squat-grip', 'nhs-wrist-pain'], 'Thumb-over for a sore wrist and the over-bend reason: card (Barbell Logic). Red-flag block: NHS.') },
  ],
  libraryDiff: { add: ['adductors', 'lower_back'], why: 'Library: primary quads, secondary glutes and hamstrings. Card: glutes are main too (Caterisano 2002, Kubo 2019), inner thighs grow with depth (Kubo 2019), the lower back holds the spine flat; hamstrings stay a helper, "only a little" (Contreras 2015).' },
  claim: CL.feel,
};

/* ------------------------------------------------------------------------------------------------ plate ---------- */
// The existing plate, unchanged: on-body is not `push`, so no callout has to be the grip (2.1). The hand hotspot is
// added by the build on the `grip` landmark; the two posture zooms get hotspots from their checkpoints.
const plate = plateSpec;

/* ------------------------------------------------------------------------------------------------ the HowTo ------ */
/* ---------------------------------------------------------------- handling mistakes, risks (plan 2.4 items 4, 7) --
 * From the verified card's handlingMistakes (grip/research/barbell_back_squat.json): the mistake, its fix and what it can hurt,
 * cut to the copy limits (owner 2026-09-30: title <= 5 words, fix <= 12, risk <= 14; no citations in user copy, C7;
 * no red-flag wording, C8: the shared RED_FLAG and DISCLAIMER come from howto/shared.mjs). `zoom` = "Show me" target. */
// Owner 2026-09-30 (shorter, concept first): at most 3 mistakes and 3 risks. The full fix lives in the matching feel row;
// the mistake line (always visible) is a short cue in the card's words, so the page never prints one sentence twice.
// Cut: the "neck" mistake (bar on the neck bones; the bar-on-back close-up and setup step 2 still teach it), the "knees"
// risk (the knees mistake, the knees row and the knee red-flag box beside the risks still carry it) and the "wrists"
// risk ("Propping the bar with your hands loads your wrists and elbows": the wrist row says the same, "Wrists or inner
// elbows" / "Your hands are holding the bar up", on the same source; cut to keep the sheet at 450 words after the
// mistake cues were added).
const MISTAKES = [
  { key: 'hands', title: 'Hands holding the bar up', zoom: 'hand', claim: C(['CONSENSUS'], ['barbell-logic-squat-grip']),
    fix: 'Elbows down, so your back holds the bar.' },
  { key: 'knees', title: 'Knees caving or heels lifting', claim: C(['CONSENSUS'], ['hk-squat']),
    fix: 'Knees out over toes, heels down. Still caving? Go lighter.' },
  { key: 'hips', title: 'Hips shoot up, back rounds', zoom: 'depth', claim: C(['DATA', 'CONSENSUS'], ['fry2003', 'hackett2013']),
    fix: 'Brace. Chest and hips rise together.' },
];
const RISKS = [
  { key: 'back', text: 'Hips shooting up or a rounding back loads your lower back far more.',
    claim: C(['DATA', 'CONSENSUS'], ['fry2003'], 'Fry 2003, 7 lifters, a related lab set-up.') },
  { key: 'breath', text: 'High blood pressure? Don\'t hold your breath long. Breathe out as you stand.',
    claim: C(['CONSENSUS'], ['hackett2013'], 'Card fix text (mistake 4); Hackett 2013 is about bracing, not blood pressure.') },
];

export default {
  schema: 1,
  id: 'lib_barbell_back_squat',
  rev: 1,
  plate,
  handling: {
    archetype: 'on-body',
    orientation: 'pronated',
    handle: 'bar-28',
    loadAxis: 'along-forearm',
    overBody: false,   // the bar sits on the back and a missed rep lands on the safety pins, not on the face or neck
    width: { text: 'A little wider than your shoulders. Go as narrow as is comfortable, so your forearms stay near upright. Use the rings on the bar to place your hands the same every set.', claim: CL.width },
    thumb: { mode: 'wrapped', options: [{ mode: 'beside', when: 'If wrapping bends your wrist back, rest your thumb over the bar.' }], claim: CL.thumb },
    contact: 'heel',
    wrist: { ext: [0, 15], dev: [-10, 10], limitText: 'Wrist folding back or taking weight? Your hands are holding the bar up.', claim: CL.wrist },
    pose: RIGHT_POSE,
    faults: [WAITER_TRAY],
    // Owner 2026-09-30: concept first. Grip width moved to width.text (the app shows it); the hand close-up shows the rest.
    gripLine: 'Your back holds the bar. Your hands just pin it, in the heel of your palm.',
    cue: 'Your back holds the bar.',   // archetype cue (3.1), 6-word cue cap
  },
  contacts: ['standing-feet'],
  // Owner 2026-09-30: at most 5 steps of at most 12 words. Kept: collars and the safety pins (one step), the bar on
  // muscle, the brace, the stance and what to do when stuck. Cut: rack height and loading, the grip (the Grip section
  // above covers it), and the breathing and re-racking step (the breath risk line keeps the breathing). setupLine keeps
  // the rack height.
  setup: [
    { kind: 'safety', text: 'Collars on, pins just below your lowest squat to catch a miss.',
      claim: C(['CONSENSUS', 'DATA'], ['nsca-summary', 'kerr2010', 'ace-back-squat'], 'Pins: CL.safety. Collars: card setup step 3 (coaching consensus).') },
    { kind: 'position', text: 'Squeeze your shoulder blades so the bar rests on muscle.', zoom: 'bar-on-back', claim: CL.barSpot },
    { kind: 'brace', text: 'Breathe into your belly, brace, and stand the bar up.', claim: CL.brace },
    { kind: 'position', text: 'Step back, feet hip to shoulder width, toes out a little.', claim: CL.feet },
    { kind: 'safety', text: 'Stuck? Lower the bar onto the pins. Don\'t throw it.', claim: C(['CONSENSUS'], ['nsca-summary'], 'Coaching consensus (card).') },
  ],
  posture: [
    { key: 'bar', label: 'Bar on traps', detail: 'The bar sits on the upper traps, just below the bony bump. It is centred and never on the neck bones.',
      anchor: { landmark: 'backUpper', pose: 'start' }, zoom: 'bar-on-back', claim: CL.barSpot },
    { key: 'hands', label: 'Wrists straight', detail: 'Hands even, a little wider than the shoulders, forearms roughly upright, elbows down. Knuckles to forearm in a nearly straight line.',
      anchor: { landmark: 'grip.r', pose: 'start' }, zoom: 'hand', claim: CL.grip },
    { key: 'midfoot', label: 'Bar over mid-foot', detail: 'From the side, the bar stays over the middle of the foot, top to bottom.',
      anchor: { landmark: 'grip.r', pose: 'start' }, claim: CL.midfoot },
    { key: 'feet', label: 'Knees follow toes', detail: 'Feet hip to shoulder width, toes out a little, heels down. Each knee points where its foot points and may pass the toes.',
      anchor: { landmark: 'knee.r', pose: 'end' }, claim: CL.feet },
    { key: 'back', label: 'Back flat', detail: 'The body leans forward but the back stays flat from hips to neck. Eyes ahead, neck in line.',
      anchor: { landmark: 'backMid', pose: 'end' }, claim: CL.back },
    { key: 'depth', label: 'Hip at knee', detail: 'At the bottom, the hip crease is at or below the top of the knee. If your lower back tucks under, stop a little higher.',
      anchor: { landmark: 'hip.r', pose: 'end' }, zoom: 'depth', claim: CL.depth },
  ],
  feel,
  zooms,
  copy: {
    setupLine: 'Set the bar at armpit height and the pins just below your lowest squat. Bar on your upper traps, then stand up.',
    mistakeLine: 'If wrists or elbows ache after squats, your hands held the bar up. Let your back hold it.',
    gripLine: 'Your back holds the bar. Your hands just pin it, in the heel of your palm.',
  },
  redFlag: RED_FLAG,
  mistakes: MISTAKES,
  risks: RISKS,
  riskFlags: ['wrist', 'knee'],
  sources: Object.keys(SOURCES),
  research: { card: 'grip/research/barbell_back_squat.json', rev: 1 },
};
