// How-to content for the seated cable row (architecture grip/GRIP-AND-FEEL-ARCHITECTURE.md 4.1-4.4, appendix A7).
// Source of every user-visible line: the verified card grip/research/seated_cable_row.json (corrected card, verifier
// pass 2026-09-30; GENERAL.md wording is superseded and not used).
// COPY COMPACTED 2026-09-30 (owner: "shorter and compact, teach the concept"; limits in artifact/copy-lint.mjs). Each
// section opens with the idea and why; the card's detail stays in the claims and sources. No new facts: every line is a
// cut of the card's own wording and keeps its claim. Lists cut to the caps:
//   - handling mistakes 4 -> 3: "Curling your wrists" dropped. The grip line and the wrist limit line right above it say
//     the same (hands are hooks, pull with the elbows; curling = the grip taking over); the hand zoom stays reachable
//     from setup step 3 and the wrist row.
//   - feel rows 7 -> 4: kept "traps" (shoulder and neck load), "low-back" (safety), "pinch" (shoulder red flag) and
//     "wrist" (red flag). Dropped "arms" (the feel line itself says "lead with your elbows", and the grip lines teach
//     the hooks), "rear" (elbows drifting out: the traps row and the shrug mistake keep elbows close) and "knees"
//     (setup step 4 keeps the knees soft). The Hand zoom's feel link pointed at "arms"; it now opens the "wrist" row,
//     whose "means" (wrists curling at the end of the pull) is the fault that zoom draws.
//   - setup 6 -> 5: card steps 4 (sit tall, knees soft) and 5 (slide the hips until the plates clear) merged; the
//     merged step carries both claims.
//   - The full fixes live in the traps and low-back rows; the shrug and rocking mistakes (always visible) are shorter
//     cues in the card's words, so the page never prints one sentence twice. To stay within 450 words after that:
//     the round mistake uses the card's cue, setup step 1 drops "to check your position", the wrist limit drops "or go
//     lighter" (the wrist row keeps it).
// Older notes kept: row "pinch" carries no red-flag wording (C8), the referral is the shared shoulder block
// (RED_FLAG_SHOULDER, redFlag: 'shoulder'); front_delts is not a watch muscle (a pinch is pain); posture details carry
// no source tags (C7).
// Point references use the plate engine's form ({ at, pose, off }), SPEC.md 3.
import plate from './seated_cable_row.mjs';
import { rootOnSeat } from '../engine/index.mjs';
// RED_FLAG (and any other shared safety copy) comes from the one shared module (plan S-2 condition 4); re-exported
// for the render scripts. DISCLAIMER is shown once per sheet by the page, from the same module.
import { RED_FLAG, RED_FLAG_SHOULDER } from '../howto/shared.mjs';
export { RED_FLAG, RED_FLAG_SHOULDER };

const CHECKED = '2026-09-30';
// `access` = what the card's researcher and verifier actually read (card sources list and evidence notes):
// PubMed entries -> 'abstract'; de Abreu Vasconcelos was read on the journal's article page (open access) -> 'full';
// Padovan 2025 narrow vs wide could not be opened (503), its numbers come from the Di Fonza review -> 'summary';
// Di Fonza read via PMC -> 'full'; Ronai 2019 abstract only (paywalled); the NSCA row text only via a study flashcard
// set -> kind 'secondary', access 'summary'.
export const SOURCES = {
  deabreu2023: { id: 'deabreu2023', cite: 'de Abreu Vasconcelos CMW, Lopes CR, Almeida VM, Krause Neto W, Soares E (2023) Effect of different grip position and shoulder-abduction angle on muscle strength and activation during the seated cable row. Int J Strength Cond 3(1)', url: 'https://doi.org/10.47206/ijsc.v3i1.190', kind: 'peer-reviewed', access: 'full', checked: CHECKED },
  padovan2025grip: { id: 'padovan2025grip', cite: 'Padovan R et al. (2025) High-density surface electromyography excitation of prime movers in the narrow vs. wide grip seated row exercise. J Hum Kinet', url: 'https://doi.org/10.5114/jhk/209550', kind: 'peer-reviewed', access: 'summary', checked: CHECKED },
  padovan2025scap: { id: 'padovan2025scap', cite: 'Padovan R et al. (2025) High-density surface electromyography excitation of prime movers across scapular positions in the seated row. J Funct Morphol Kinesiol 11(1):6', url: 'https://pubmed.ncbi.nlm.nih.gov/41562724/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  difonza2026: { id: 'difonza2026', cite: 'Di Fonza D et al. (2026) Electromyographic analysis of latissimus dorsi activation during common resistance training exercises: a narrative review. J Funct Morphol Kinesiol 11(3):315', url: 'https://pubmed.ncbi.nlm.nih.gov/42647355/', kind: 'peer-reviewed', access: 'full', checked: CHECKED },
  lehman2004: { id: 'lehman2004', cite: 'Lehman GJ et al. (2004) Variations in muscle activation levels during traditional latissimus dorsi weight training exercises: an experimental study. Dyn Med 3(1):4', url: 'https://pubmed.ncbi.nlm.nih.gov/15228624/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  fujita2020: { id: 'fujita2020', cite: 'Fujita RA et al. (2020) Mind-muscle connection: limited effect of verbal instructions on muscle activity in a seated row exercise. Percept Mot Skills 127(5):925-938', url: 'https://pubmed.ncbi.nlm.nih.gov/32448047/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  dosanjos2024: { id: 'dosanjos2024', cite: 'Dos Anjos FV et al. (2024) Assessing the feasibility of EMG biofeedback to reduce the upper trapezius muscle excitation during a seated row exercise. Appl Psychophysiol Biofeedback 49(4):577-587', url: 'https://pubmed.ncbi.nlm.nih.gov/39177899/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  saeterbakken2015: { id: 'saeterbakken2015', cite: 'Saeterbakken A et al. (2015) The effect of performing bi- and unilateral row exercises on core muscle activation. Int J Sports Med 36(11):900-5', url: 'https://pubmed.ncbi.nlm.nih.gov/26134664/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  fenwick2009: { id: 'fenwick2009', cite: 'Fenwick CM, Brown SH, McGill SM (2009) Comparison of different rowing exercises: trunk muscle activation and lumbar spine motion, load, and stiffness. J Strength Cond Res 23(2):350-8', url: 'https://pubmed.ncbi.nlm.nih.gov/19197209/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  callaghan2001: { id: 'callaghan2001', cite: 'Callaghan JP, McGill SM (2001) Intervertebral disc herniation: studies on a porcine model exposed to highly repetitive flexion/extension motion with compressive force. Clin Biomech 16(1):28-37', url: 'https://pubmed.ncbi.nlm.nih.gov/11114441/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  cronin2007: { id: 'cronin2007', cite: 'Cronin JB, Jones JV, Hagstrom JT (2007) Kinematics and kinetics of the seated row and implications for conditioning. J Strength Cond Res 21(4):1265-70', url: 'https://pubmed.ncbi.nlm.nih.gov/18076253/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  odriscoll1992: { id: 'odriscoll1992', cite: "O'Driscoll SW et al. (1992) The relationship between wrist position, grasp size, and grip strength. J Hand Surg Am 17(1):169-77", url: 'https://pubmed.ncbi.nlm.nih.gov/1538102/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  ronai2019: { id: 'ronai2019', cite: "Ronai P (2019) Do it right: the seated cable row exercise. ACSM's Health Fit J 23(4):32-37", url: 'https://digitalcommons.sacredheart.edu/pthms_exscifac/36', kind: 'coach', access: 'abstract', checked: CHECKED },
  'ace-seated-row': { id: 'ace-seated-row', cite: 'ACE, Seated Row (machine version with a chest pad; torso, elbow and wrist cues carried over)', url: 'https://www.acefitness.org/resources/everyone/exercise-library/168/seated-row/', kind: 'guideline', access: 'full', checked: CHECKED },
  'nsca-low-row': { id: 'nsca-low-row', cite: 'NSCA low-pulley seated row technique, via a study flashcard set (original NSCA text not free online)', url: 'https://brainscape.com/flashcards/exercise-techniques-3136125/packs/4953113', kind: 'secondary', access: 'summary', checked: CHECKED },
  'unmc-cable-row': { id: 'unmc-cable-row', cite: 'University of Nebraska Medical Center, Center for Healthy Living, cable row video transcript', url: 'https://www.unmc.edu/cfhl/_documents/cable_row_video_transcript.txt', kind: 'coach', access: 'full', checked: CHECKED },
  'baechle-earle': { id: 'baechle-earle', cite: 'Baechle TR, Earle RW, Weight Training: Steps to Success (NSCA editors), grip selection and location', url: 'https://us.humankinetics.com/blogs/excerpt/grip-selection-and-location', kind: 'guideline', access: 'full', checked: CHECKED },
  'nhs-wrist-pain': { id: 'nhs-wrist-pain', cite: 'NHS, Wrist pain', url: 'https://www.nhs.uk/conditions/hand-pain/wrist-pain/', kind: 'guideline', access: 'full', checked: CHECKED },   // RED_FLAG source (architecture 4.2)
  'nhs-shoulder-pain': { id: 'nhs-shoulder-pain', cite: 'NHS, Shoulder pain', url: 'https://www.nhs.uk/conditions/shoulder-pain/', kind: 'guideline', access: 'full', checked: CHECKED },   // RED_FLAG_SHOULDER source
};
/** "Where this comes from": one plain evidence label per source, from the card's sources and evidence notes. */
export const EVIDENCE_LABELS = {
  deabreu2023: { tag: 'DATA', text: 'This row, 21 people. Elbows in gave more force and lat work.' },
  padovan2025grip: { tag: 'DATA', text: 'Narrow grip worked the lats more than wide. Read via a review.' },
  padovan2025scap: { tag: 'DATA', text: 'Fixed or free shoulder blades gave about the same back work.' },
  difonza2026: { tag: 'WEAK', text: 'Review. Narrow grip and elbows in each favour the lats, untested together.' },
  lehman2004: { tag: 'DATA', text: 'Held positions. This row worked the mid back most. Squeezing added nothing.' },
  fujita2020: { tag: 'DATA', text: '20 beginners. Thinking about the back helped the first reps only.' },
  dosanjos2024: { tag: 'WEAK', text: '8 people, wide-grip row. Shoulder tops often overworked. Injury link untested.' },
  saeterbakken2015: { tag: 'DATA', text: 'Bent-over row worked the lower back more than the machine row.' },
  fenwick2009: { tag: 'MECH', text: 'Other rows only. The standing bent-over row loaded the spine most.' },
  callaghan2001: { tag: 'MECH', text: 'Pig spines bent under load. Shows disc damage. Gym risk not measured.' },
  cronin2007: { tag: 'DATA', text: '8 rowers. The hardest moment is the start of the pull.' },
  odriscoll1992: { tag: 'MECH', text: 'Grip gauge, not a row. Grip is weaker with the wrist curled.' },
  ronai2019: { tag: 'CONSENSUS', text: 'Coaching article, summary only. Feet on the plate give a stable base.' },
  'ace-seated-row': { tag: 'CONSENSUS', text: 'Machine row guide. Upright, elbows close, stop once they pass your sides.' },
  'nsca-low-row': { tag: 'CONSENSUS', text: 'Textbook summary. Upright torso, soft knees, handle to the belly.' },
  'unmc-cable-row': { tag: 'CONSENSUS', text: 'Coaching video. Feet hip width, chest tall, handle to the stomach.' },
  'baechle-earle': { tag: 'CONSENSUS', text: 'Textbook. Thumbs around the bar for every grip.' },
  'nhs-wrist-pain': { tag: 'CONSENSUS', text: 'When wrist pain needs a check.' },
  'nhs-shoulder-pain': { tag: 'CONSENSUS', text: 'When shoulder pain needs a check.' },
};

/** Shoulder red flag, same shape. Read on the NHS page 2026-09-30: urgent GP or 111 for "sudden or very bad shoulder
 *  pain", "you cannot move your arm", "the pain started after an injury or accident, like a fall" (among others); a GP
 *  if "getting worse or does not improve after 2 weeks" or "it's very difficult to move your arm or shoulder". */

const C = (tags, sources, note) => ({ tags, sources, ...(note ? { note } : {}) });

// ---- hand (architecture 3.1 `pull`, 4.2, 5.1) ----
// Neutral grip on the V-handle: palms face each other, so the wrist's forward-and-back bend happens in the horizontal
// plane. From the plate's side camera you would see the back of the hand and the bend would point at the camera, so
// the hand is drawn from above (radial view: the thumb side is up, toward the camera), printed "Seen from above" with
// the head glyph. Forward (toward the stack) is up the screen: forearm 180, as on the chest press. Unmirrored, the palm
// faces screen right, which is the lifter's left hand (its palm faces the midline); the right hand is its mirror.
// The V-handle's frame leaves each grip forward and toward the midline to the cable ring (grips 15 cm apart, ring
// 22 cm ahead: plate.mjs vHandle), about 20 degrees off straight ahead, so strut [0.35, -1].
// Wrist: 10 degrees back, the middle of the card's 0 to 20 target ("in a straight line with your forearm, or tipped
// back a little"). Handle: `v-handle` (A7), 30 mm drawing value. contactAt 1.0 = the base of the fingers (5.1), where
// the card puts it ("across the base of your fingers, just below the knuckles").
// `pull` is loadAxis 'across' (3.1.1): no push lever check. The drawn line is the lifter's pull, down the forearm.
const HANDLE = { profile: 'v-handle', axis: 'across', strut: [0.35, -1] };
const RIGHT_POSE = { view: 'radial', forearm: 180, wrist: { ext: 10, dev: 0 }, contactAt: 1.0, fingers: { curl: 1 }, thumb: 'wrapped', squeeze: 'firm',
  handle: HANDLE, load: { kind: 'pull' } };
// The one wrong hand (card zoom "hand" wrong, handlingMistakes #4, A7 "Hand (wrong: `fingertip-slip` with the wrist
// curled toward the belly)"): wrist curled forward 30 degrees (30 past the range's 0 end), the handle rolled out into
// the finger bends (contactAt 1.35), fist squeezed hard ("knuckles bunched tight from over-squeezing": 'max' draws
// the forearm tendons), bend arc at the wrist crease. The thumb stays wrapped: the card's fault is the curl and the
// slip, not the thumb, and a loose thumb would teach a second fault the card does not name.
const FAULT_CURLED_SLIP = {
  key: 'curled-slip', label: 'Curled, slipping',
  pose: { wrist: { ext: -30, dev: 0 }, contactAt: 1.35, squeeze: 'max', thumb: 'wrapped' },
  markers: ['lever-arc', 'slip-arrow', 'tendon'],
  alt: 'The wrist curls forward, palm turned toward the belly. The handle rolls toward the fingertips. The fist squeezes hard, forearm tendons standing out. The arms end up pulling.',
};

// ---- posture zoom poses (PoseOverride, 4.3), merged over the plate's own poses ----
// Wrist sets of the plate (seated_cable_row.mjs): grips 7.5 cm each side of the midline.
const SEP = 0.075;
const gripAt = (y, z, pole) => ({ l: { at: [SEP, y, z], pole }, r: { at: [-SEP, y, z], pole: [-pole[0], pole[1], pole[2]] } });
// Back line, wrong (card zoom "back line", left fault; handlingMistakes #2): at the front of the rep the lower back
// curls forward and the head chases the handle. A rounded lower back is the pelvis tucking under while the spine
// bends forward: pelvis 8 forward -> 8 back (on the same seat contact: rootOnSeat with the plate's SEAT point,
// seated_cable_row.mjs), spine flexion 44, so the thorax ends 36 forward against the right pose's 8, and the lumbar
// part behind the tucked pelvis bulges back past the straight guide. Head tipped up 10 against the thorax, shoulder
// blades spread 2 cm further. The shoulders travel about 10 cm forward and 6 cm down (HJC -> spine pivot 0.1575 m,
// pivot -> shoulder 0.315 m), plus 2 cm of blade, so the grip moves the same way and the arms stay straight. The finish fault of the same card zoom (throwing the torso
// back) is the plate's own Mistake layer ("Swinging back"), so it is not repeated here.
const SEAT = [0, 0.45, -0.044];   // = seated_cable_row.mjs SEAT (buttock contact on the bench), not exported there
const ROUNDED = { root: { at: rootOnSeat(SEAT, -8, 1.75), tilt: -8 }, trunk: 44, neck: -10, scap: { elev: 0, pro: 6 },
  reach: gripAt(0.665, 0.80, [0.25, -1, 0]) };   // z .80: inside the straight-arm reach (checked: no contact issue)
// Finish, wrong (card zoom "finish position", first fault; handlingMistakes #3): the handle dragged up to the chest,
// elbows high and out, shoulders shrugged. Handle 14 cm higher than the right finish (0.765 -> 0.905 m: the lower
// chest, about 11 cm under the shoulder joint at 1.01 m), elbows driven back and up, so seen from the side the upper
// arm rises toward level and the elbow sits well above the right pose's, behind the body. (Flaring out to the side
// points the elbow at the camera and vanishes in a side view, so the side crop shows the height, and the caption the
// rest.) Shoulder girdle up 3 cm. The torso does not move; the shrug changes the shoulder line, so the trunk outline is
// dashed with the arm, handle and cable.
const HIGH_PULL = { scap: { elev: 3, pro: 0 }, reach: gripAt(0.905, 0.21, [0.35, 0.45, -1]) };

/* ---------------------------------------------------------------- handling mistakes, risks (plan 2.4 items 4, 7) --
 * From the verified card's handlingMistakes (grip/research/seated_cable_row.json): the mistake, its fix and what it can hurt,
 * cut to the copy limits (artifact/copy-lint.mjs: at most 3 mistakes, title <= 5 words, fix <= 12; at most 3 risks,
 * <= 14 words; no citations in user copy, C7; no red-flag wording, C8: the shared RED_FLAG and DISCLAIMER come from
 * howto/shared.mjs). `zoom` = "Show me" target. The card's 4th mistake (curling the wrists) is the grip and limit lines. */
const MISTAKES = [
  { key: 'rock', title: 'Rocking your torso', zoom: 'back', claim: C(['CONSENSUS'], ['ace-seated-row']),
    fix: 'Pick a weight you can pull with a still torso.' },
  { key: 'round', title: 'Rounding your lower back', zoom: 'back', claim: C(['CONSENSUS', 'WEAK'], ['nsca-low-row', 'callaghan2001']),
    fix: 'Arms go long, back stays tall.' },
  { key: 'shrug', title: 'Shrugging and flaring elbows', zoom: 'finish', claim: C(['DATA', 'CONSENSUS'], ['deabreu2023', 'ace-seated-row']),
    fix: 'Shoulders down, elbows tucked to your ribs.' },
];
const RISKS = [
  { key: 'back', text: 'Rocking loads your lower back. Repeated rounding under load hurt discs in lab tests.',
    claim: C(['CONSENSUS', 'WEAK'], ['fenwick2009', 'callaghan2001'], 'Not measured for this row; Callaghan 2001 used pig spines.') },
  { key: 'shoulder', text: 'Shrugging loads your neck. Elbows too far back can pinch your shoulder.',
    claim: C(['DATA', 'CONSENSUS'], ['deabreu2023', 'dosanjos2024', 'ace-seated-row']) },
  { key: 'wrist', text: 'Curled wrists tire your forearms first and can make wrists sore over time.',
    claim: C(['DATA', 'CONSENSUS'], ['odriscoll1992'], 'The grip-strength part is measured; the soreness link is consensus.') },
];

export default {
  schema: 1,
  id: 'lib_seated_cable_row',
  rev: 1,
  plate,
  handling: {
    archetype: 'pull',
    orientation: 'neutral',
    handle: 'v-handle',                 // A7; the plate draws the same V-handle (grips 15 cm apart)
    loadAxis: 'across',                 // archetype default for `pull` (3.1.1): no push lever check
    overBody: false,
    width: { text: "Set by the handle: about a fist's width apart, in front of your middle. Let your hands sit the way it sets them, wrists straight.",
      claim: C(['DATA', 'WEAK'], ['deabreu2023', 'padovan2025grip', 'difonza2026'], 'Close grip and elbows in favour the lats (de Abreu Vasconcelos; Padovan via Di Fonza). Di Fonza: width and arm angle were never tested together, so the V-handle is a reasonable start, not a proven best.') },
    thumb: { mode: 'wrapped', options: [],
      claim: C(['CONSENSUS'], ['baechle-earle', 'nsca-low-row'], 'No study compares full and thumbless grips on a row. The NSCA row text asks for a closed grip; the NSCA editors teach the thumb round the bar. Thumb on top is not offered: unmeasured on a row, and a V-handle has little room for it (card).') },
    contact: 'finger-base',
    wrist: { ext: [0, 20], dev: [-10, 10],
      limitText: 'Curling wrists mean your grip is taking over. Finish the rep, then end the set.',
      claim: C(['DATA', 'CONSENSUS'], ['odriscoll1992'], "O'Driscoll 1992 (a dynamometer, applied by reasoning): grip strongest about 35 degrees back, weaker 10 to 15 degrees away. The 0 to 20 target and the end-the-set limit are consensus, not injury thresholds. A7 open: the lat pulldown card dropped its band.") },
    pose: RIGHT_POSE,
    faults: [FAULT_CURLED_SLIP],
    gripLine: 'Pull with your elbows, not your hands. Handle at the base of your fingers, thumbs wrapped, wrists straight.',
    cue: 'Hands are hooks. Pull with elbows.',   // `pull` archetype cue (3.1); the card's cue says the same
  },
  contacts: ['foot-platform'],          // A7: foot-platform in its pull form (legs brace, do not push); no chest pad
  setup: [
    { kind: 'load', text: 'Clip on the V-handle. Start light.',
      claim: C(['CONSENSUS'], ['nsca-low-row'], '"Lighter than you think" is card consensus.') },
    { kind: 'get-in', text: 'Sit facing the stack, feet flat on the plate.',
      claim: C(['CONSENSUS'], ['nsca-low-row', 'unmc-cable-row']) },
    { kind: 'grip', text: 'Bend your knees, not your back, to take the handle. Thumbs wrapped.', zoom: 'hand',
      claim: C(['CONSENSUS'], ['baechle-earle', 'nsca-low-row']) },
    // card steps 4 + 5
    { kind: 'position', text: 'Sit tall, knees soft. Push back until the weight clears the stack.',
      claim: C(['CONSENSUS'], ['nsca-low-row', 'unmc-cable-row'], 'Card consensus; the NSCA text asks for knees slightly flexed and kept there.') },
    { kind: 'brace', text: "Chest up, shoulders down before you pull. It's hardest at the start.", zoom: 'back',
      claim: C(['CONSENSUS', 'DATA'], ['nsca-low-row', 'unmc-cable-row', 'cronin2007'], 'Cronin 2007: peak force comes in the first part of the pull, so the back is set before it starts.') },
  ],
  posture: [
    { key: 'feet', label: 'Knees soft', detail: 'Whole foot on the plate, hip width apart, knees slightly bent all set. Your legs brace you and stay still.',
      anchor: { at: 'knee.r' }, claim: C(['CONSENSUS'], ['nsca-low-row', 'unmc-cable-row'], 'Foot on platform has no zoom (chip limit, see chips); the plate shows the soft knees and its Mistake layer the legs pushing.') },
    { key: 'torso', label: 'Torso still', detail: 'Torso close to vertical, chest up, lower back in its natural curve. The angle is the same at the start and finish of every rep. No rocking forward to reach or back to pull.',
      anchor: { at: 'backUpper' }, zoom: 'back', claim: C(['CONSENSUS'], ['ace-seated-row', 'nsca-low-row', 'unmc-cable-row']) },
    { key: 'finish', label: 'Handle to belly', detail: 'The handle finishes at the upper stomach. That is between your belly button and the bottom of your breastbone. The cable stays level or nearly level.',
      anchor: { at: 'grips' }, zoom: 'finish', claim: C(['CONSENSUS'], ['nsca-low-row', 'unmc-cable-row']) },
    { key: 'elbows', label: 'Elbows by ribs', detail: 'Elbows travel back low and close to the body and stop just behind the torso. Arms close to the body favour the lats and give the most force.',
      anchor: { at: 'elbow.r' }, zoom: 'finish', claim: C(['DATA', 'CONSENSUS'], ['deabreu2023', 'ace-seated-row'], 'Plate callout "Elbows back".') },
    { key: 'blades', label: 'Shoulders down', detail: 'Shoulders stay away from the ears all set. At the end of the pull your shoulder blades move toward each other. On the way forward they slide apart under control. Let them move. A hard extra squeeze adds nothing measurable.',
      anchor: { at: 'shoulderTop.r' }, claim: C(['CONSENSUS', 'DATA'], ['ace-seated-row', 'lehman2004', 'padovan2025scap'], 'The card\'s back-view "shoulder blades" zoom needs a back-view plate (5.2). The approved plate (golden A, owner rule) keeps its "Squeeze blades" callout unchanged; this checkpoint carries the verified wording (let the blades come back, no hard squeeze).') },
    { key: 'wrists', label: 'Wrists straight', detail: 'Back of the hand in line with the forearm the whole way. Handle at the base of the fingers, no curl at the end.',
      anchor: { at: 'grip.r' }, zoom: 'hand', claim: C(['DATA', 'CONSENSUS'], ['odriscoll1992']) },
  ],
  feel: {
    primary: [
      { muscleId: 'mid_back', plain: 'Between your shoulder blades. This is where it should land most at the end of each pull, as your shoulder blades come together.' },
      { muscleId: 'lats', plain: 'The sides of your back, from under your armpits down toward your waist. With elbows close to your body you should feel these working too.' },
    ],
    secondary: [
      { muscleId: 'rear_delts', plain: 'The backs of your shoulders. They help pull the arms back.' },
      { muscleId: 'biceps', plain: 'The front of your upper arms. They bend the elbows, so some work here is normal.' },
      { muscleId: 'brachialis', plain: 'Under the biceps, near the elbow. It helps bend the arm, a bit more with palms facing each other.' },   // text only (no drawn region)
      { muscleId: 'forearms', plain: 'Your forearms hold the handle. Some grip tiredness on heavy sets is normal.' },
    ],
    // "Should not take over": dashed outline ONLY while a row naming the muscle is open (S6), never at rest (5.3).
    // biceps and forearms are helpers AND watch on purpose (card): helper at rest, watch only while their row is open.
    watch: [
      { muscleId: 'upper_traps', plain: "The tops of your shoulders and sides of your neck. A burn here means you're shrugging." },
      { muscleId: 'lower_back', plain: "Your lower back holds you upright and may feel a bit tired. It should not ache. If it does, you're rocking or rounding." },
      { muscleId: 'biceps', plain: 'If your arms give out long before your back, your hands and arms are doing the pulling.' },
      { muscleId: 'forearms', plain: 'If your grip quits first, the handle is out in your fingertips or your wrists are curling.' },
    ],
    feelLine: 'You should feel this between your shoulder blades and down the sides of your back. Lead with your elbows.',
    rows: [
      { key: 'traps', where: 'Tops of your shoulders and neck', at: { muscles: ['upper_traps'] },
        means: "You're shrugging, or your elbows flare up.",
        fix: 'Keep shoulders down, elbows low and close. Pull to your belly.',
        zoom: 'finish', claim: C(['DATA', 'WEAK'], ['deabreu2023', 'dosanjos2024']) },
      { key: 'low-back', where: 'Your lower back', at: { muscles: ['lower_back'] },
        means: "You're rocking to move the weight, or rounding at the front.",
        fix: 'Go lighter and sit tall. Only your arms and shoulder blades move.',
        zoom: 'back', claim: C(['CONSENSUS', 'MECH'], ['ace-seated-row', 'nsca-low-row', 'fenwick2009', 'callaghan2001', 'saeterbakken2015', 'ronai2019'], 'No study measures spine load on the seated cable row; the lower-back warning is consensus. Fenwick measured other rows; Callaghan is pig spines (mechanism only).') },
      { key: 'pinch', where: 'Front of your shoulder pinches', at: {},   // pain, not a muscle taking over: no map mark (A7 fix)
        means: 'Your elbows go too far back and your shoulders roll forward.',
        fix: 'Stop once elbows pass your sides, chest up. If light weight still pinches, stop rowing.',
        zoom: 'finish', redFlag: 'shoulder', claim: C(['CONSENSUS'], ['ace-seated-row', 'nhs-shoulder-pain'], 'ACE: pull until the elbows pass the sides, do not let the shoulders round forward. The pinch explanation is consensus. The referral is the shared shoulder red flag (NHS), not the fix text (C8).') },
      { key: 'wrist', where: 'Your wrist', at: { parts: ['hand-left', 'hand-right', 'hand-back-left', 'hand-back-right'] },
        means: 'Wrists curling or bending to the little finger, or sore from pressing.',
        fix: "Keep your wrist straight. If it's sore, go lighter and stop if it hurts.",
        zoom: 'hand', redFlag: true, claim: C(['DATA', 'CONSENSUS'], ['odriscoll1992', 'nhs-wrist-pain']) },
    ],
    libraryDiff: { add: ['forearms', 'brachialis'],
      why: 'exercises.json lists mid_back primary and lats, biceps, rear_delts secondary. The card moves lats up to primary (close neutral handle and elbows in favour the lats: de Abreu Vasconcelos 2023, Padovan 2025 via Di Fonza 2026) and adds the forearms (grip) and the brachialis (anatomy, text only). Changing exercises.json is a supervisor decision.' },
    claim: C(['DATA', 'CONSENSUS'], ['deabreu2023', 'lehman2004', 'padovan2025grip', 'difonza2026'], 'EMG readings do not map one to one onto what a person feels. Lower trapezius is folded into mid_back and teres major into lats (no ids). Hamstrings exist as an id but only name the "pull behind your knees" row (a stretch, not shimmered).'),
  },
  zooms: [
    {
      key: 'hand', chip: 'Hand', heading: 'Hand: right and wrong', kind: 'hand',
      hand: {
        right: RIGHT_POSE,
        wrong: [FAULT_CURLED_SLIP],     // one page: the card names one hand fault, and no thumb option (see thumb.claim)
        camera: 'above',
      },
      rightNote: 'Base of fingers',
      caption: { right: 'Thumb wrapped, wrist straight.',
        wrong: 'Wrist curled, handle at the fingertips.' },
      alt: {
        right: 'One hand on the V-handle, seen from above. The handle lies across the base of the fingers, thumb wrapped. The back of the hand runs straight from the forearm.',
        wrong: FAULT_CURLED_SLIP.alt,
      },
      // was 'arms' (row cut to fit the 4-row cap, 2026-09-30); the wrist row's "means" is the fault drawn here
      feelRow: 'wrist',
      feelPrompt: 'Sore wrist? This is usually why.',
    },
    {
      key: 'back', chip: 'Back line', heading: 'Back line: right and wrong', kind: 'posture',
      // crop of the plate at the START pose (the front of the rep, where the rounding happens): head to seat
      crop: { center: { at: 'backMid', pose: 'start', off: [6, -14] }, sizePx: 156 },
      right: 'start',
      // only the torso and head are dashed ('trunk' = head + torso shapes): the arms, handle and cable move with the
      // shoulders but carry no fault, and dashing them crossed the solid arm and hid the back curve
      // trim: the belly outline dives under the thigh 6 cm below the navel and the mask left a small hook there
      wrong: { base: 'start', pose: ROUNDED, parts: ['trunk'], trim: [{ at: 'navel', pose: 'mistake', off: [0, 9], r: 6 }] },
      // zoom-only overlay (5.2): the straight guide along the back of the right pose, drawn in both crops, so the
      // rounded back shows as bulging away from it
      guides: [{ kind: 'spine', from: { at: 'sacrum', pose: 'start' }, to: { at: 'backUpper', pose: 'start' }, extend: [0.15, 0] }],
      callout: {
        right: { text: 'Back<br>straight', anchor: { at: 'backUpper', pose: 'start', off: [-3, 0] }, prefer: 'left' },   // the top end of the guide
        wrong: { text: 'Back<br>rounded', anchor: { at: 'lumbar', pose: 'mistake', off: [-3, 14] }, prefer: 'left' },   // on the dashed bulge, clear of the guide
      },
      caption: { right: 'Arms long, lower back in its normal curve.',
        wrong: 'Lower back rounded, head chasing the handle.' },
      alt: {
        right: 'Side view of the torso at the front of the rep. Arms straight, shoulder blades slid forward, torso upright. The lower back keeps its natural curve along a straight guide.',
        wrong: 'The lower back curls forward away from the guide line. The head pushes toward the handle. Drawn dashed over the right position.',
      },
      feelRow: 'low-back',
      feelPrompt: 'Lower back aching? This is usually why.',
    },
    {
      key: 'finish', chip: 'Finish', heading: 'Finish: right and wrong', kind: 'posture',
      // centred on the seat contact (fixed in both poses; the solid wrong crop's shoulders move with the shrug)
      crop: { center: { at: 'seat', off: [14.5, -69.7] }, sizePx: 140 },
      right: 'end',
      // solid: in a side view the high arm lies inside the torso silhouette, so a dashed overlay on the right pose is
      // masked away; the wrong crop draws the wrong pose alone (render script `wrong.solid`, as the lat pulldown path)
      wrong: { base: 'end', pose: HIGH_PULL, parts: ['arm.r', 'handle', 'column', 'trunk'], solid: true },
      callout: {
        right: { text: 'Handle<br>to belly', anchor: { at: 'grips', off: [0, 5] } },
        wrong: { text: 'Elbows<br>high', anchor: { at: 'elbow.r', pose: 'mistake', off: [0, -4] } },
      },
      caption: { right: 'Handle at upper belly, elbows just past ribs.',
        wrong: 'Handle at chest, elbows high, shoulders up.' },
      alt: {
        right: 'Side view at the end of the pull. The handle touches the upper belly with the cable level. Elbows are low and just past the ribs, chest up.',
        wrong: 'Side view at the end of the pull. The handle is dragged up to the chest, elbows high and out, shoulders shrugged.',   // wrong.solid: drawn alone, not dashed
      },
      feelRow: 'traps',
      feelPrompt: 'Tops of your shoulders? This is usually why.',
    },
  ],
  // Chip row = the zooms in order, then "Where to feel it" (always last, 2.1): 4 chips. A7 names four zoom chips
  // (Hand, Back line, Foot on platform, Finish position); with Feel always last that is 5, over the limit of 4.
  // "Foot on platform" is the one left out: the legs only brace here, the plate already shows the whole foot on the
  // plate with soft knees, and its Mistake layer shows the legs pushing. Its checkpoint ('feet') and setup step 4
  // (knees soft) keep the content. "Shoulder blades" (card zoom) is a back view the side plate cannot crop (5.2).
  chips: ['hand', 'back', 'finish', 'feel'],
  copy: {
    setupLine: 'Feet flat, knees soft, sit tall with the weight off the stack. Pull the handle to your belly, torso still.',
    mistakeLine: "Don't rock to move the weight. If you have to swing, it's too heavy.",
  },
  mistakes: MISTAKES,
  risks: RISKS,
  riskFlags: ['wrist', 'shoulder'],
  sources: Object.keys(SOURCES),
  research: { card: 'grip/research/seated_cable_row.json', rev: 1 },
};

// KNOWN GAPS (for the supervisor):
// - No "Wrist sore before you start" row: that row is for presses (A1); this is a `pull` exercise. The card's own
//   wrist row covers a sore wrist (lighter, stop if it hurts) and carries the shared RED_FLAG.
// - Shoulder red flag (RED_FLAG_SHOULDER, redFlag: 'shoulder') is local to this mockup: the shared object in
//   src/howto/archetypes.ts and the Row type (redFlag boolean -> key) are supervisor items. Every shoulder-pinch row
//   (pull-up, lat pulldown, lateral raise) now links to it as well.
// - Wrist band 0 to 20 (card) vs the lat pulldown's 0 to 25 (A7 open): align the two pull cards before the `pull`
//   archetype range is fixed.
// - Wrist bending toward the little finger (named in the card's limit and wrist row) has no drawing: hand.mjs draws
//   the radial view only, and a side bend needs the back-of-hand view. Text only.
// - Foot on platform and Shoulder blades have no zoom (chip limit; back view).
