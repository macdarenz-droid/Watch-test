// How-to content for the lat pulldown (architecture grip/GRIP-AND-FEEL-ARCHITECTURE.md 4.1-4.4, appendix A6).
// Source of every user-visible line: the verified card grip/research/lat_pulldown.json (corrected card, verifier pass
// 2026-09-30; GENERAL.md wording is superseded and not used). Edits against the card, each for a written rule:
//   - row "arms" fix: 46 words, 3 sentences -> 27 words, 2 sentences (FeelRow limit: 30 words, 2 sentences). Kept:
//     loosen the grip, elbows down, thumb on top if the forearms quit. Dropped: "set the bar at the base of your
//     fingers" (the row's "Show me the hand" shows it) and "Your arms will still help, and that's fine" (the row's
//     own "means" line already says some biceps work is normal).
//   - row "pinch" fix: "stop and get it checked" -> "stop doing pulldowns" (C8: fixes never carry red-flag wording). The
//     referral comes back through the shared shoulder block (RED_FLAG_SHOULDER, NHS): the row has redFlag: 'shoulder'.
//   - row "wrist" fix: 59 words -> 27. The card's last sentence (sharp pain, tingling, weak grip, swelling) is red-flag
//     wording (C8); the row carries redFlag: true, so the shared NHS block shows under it instead. The card's "a
//     couple of weeks" matches the NHS "two weeks". "move your hands onto or off the bar's bends" moved out of the row
//     (30 words) into the grip-width checkpoint and HandlingSpec.width, where the card also has it.
//   - posture details: the card's source tags ("(ACE)", "(Sperandei 2009; Kolber 2013)") are dropped from user copy;
//     they live in the claim and in "Where this comes from".
//   - feel: front_delts is NOT a watch muscle (A6 "fix before spec": a pinch is pain, not a muscle taking over). It is
//     a row with no map mark, as on the pull-up.
//   - 2026-09-30, owner: "shorter, concept first". Every shown line is cut to the copy-lint.mjs limits; no new facts.
//     Dropped: mistake 'too-far' (its risk line and the pinch row keep "stop when your elbows stop"); rows 'traps'
//     (the setup shoulders-down step and the plate's "Shoulders down" callout keep it) and 'row' (the swing mistake
//     and the lean step keep the small lean); setup steps 'pick the attachment' (handleChoice.sore says it) and 'sit
//     back down under the pad'. No zoom pointed to a dropped item. The Bar path Wrong alt no longer says "drawn
//     dashed": that crop is drawn solid, on its own (wrong.solid).
// Point references use the plate engine's form ({ at, pose, off }), SPEC.md 3.
import plate from './lat_pulldown.mjs';
import { landmarksOf, rootOnSeat } from '../engine/index.mjs';
// RED_FLAG (and any other shared safety copy) comes from the one shared module (plan S-2 condition 4); re-exported
// for the render scripts. DISCLAIMER is shown once per sheet by the page, from the same module.
import { RED_FLAG } from '../howto/shared.mjs';
export { RED_FLAG };

const CHECKED = '2026-09-30';
// `access`: the card's evidence notes say the verifier re-read the abstracts through NCBI E-utilities and re-read the
// ACE page. So PubMed papers are 'abstract' and ACE is 'full'. Baechle and Earle: the card quotes the excerpt page.
export const SOURCES = {
  signorile2002: { id: 'signorile2002', cite: 'Signorile JF, Zink AJ, Szwed SP (2002) A comparative electromyographical investigation of muscle utilization patterns using various hand positions during the lat pull-down. J Strength Cond Res 16(4):539-46', url: 'https://pubmed.ncbi.nlm.nih.gov/12423182/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  lusk2010: { id: 'lusk2010', cite: 'Lusk SJ, Hale BD, Russell DM (2010) Grip width and forearm orientation effects on muscle activity during the lat pull-down. J Strength Cond Res 24(7):1895-900', url: 'https://pubmed.ncbi.nlm.nih.gov/20543740/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  andersen2014: { id: 'andersen2014', cite: 'Andersen V et al. (2014) Effects of grip width on muscle strength and activation in the lat pull-down. J Strength Cond Res 28(4):1135-42', url: 'https://pubmed.ncbi.nlm.nih.gov/24662157/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  sperandei2009: { id: 'sperandei2009', cite: 'Sperandei S et al. (2009) Electromyographic analysis of three different types of lat pull-down. J Strength Cond Res 23(7):2033-8', url: 'https://pubmed.ncbi.nlm.nih.gov/19855327/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  padovan2024: { id: 'padovan2024', cite: 'Padovan R et al. (2024) High-density electromyography excitation in front vs. back lat pull-down prime movers. J Hum Kinet 91:47-60', url: 'https://pubmed.ncbi.nlm.nih.gov/38689585/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  snyder2009: { id: 'snyder2009', cite: 'Snyder BJ, Leech JR (2009) Voluntary increase in latissimus dorsi muscle activity during the lat pull-down following expert instruction. J Strength Cond Res 23(8):2204-9', url: 'https://pubmed.ncbi.nlm.nih.gov/19826307/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  lehman2004: { id: 'lehman2004', cite: 'Lehman GJ et al. (2004) Variations in muscle activation levels during traditional latissimus dorsi weight training exercises: an experimental study. Dyn Med 3(1):4', url: 'https://pubmed.ncbi.nlm.nih.gov/15228624/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  buonsenso2025: { id: 'buonsenso2025', cite: 'Buonsenso A et al. (2025) Electromyographic analysis of back muscle activation during lat pulldown exercise: effects of grip variations and forearm orientation. J Funct Morphol Kinesiol 10(3):345', url: 'https://pubmed.ncbi.nlm.nih.gov/40981044/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  difonza2026: { id: 'difonza2026', cite: 'Di Fonza D et al. (2026) Electromyographic analysis of latissimus dorsi activation during common resistance training exercises: a narrative review. J Funct Morphol Kinesiol 11(3):315', url: 'https://pubmed.ncbi.nlm.nih.gov/42647355/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  doma2013: { id: 'doma2013', cite: 'Doma K, Deakin GB, Ness KF (2013) Kinematic and electromyographic comparisons between chin-ups and lat-pull down exercises. Sports Biomech 12(3):302-13', url: 'https://pubmed.ncbi.nlm.nih.gov/24245055/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  kolber2013: { id: 'kolber2013', cite: 'Kolber MJ, Corrao M, Hanney WJ (2013) Characteristics of anterior shoulder instability and hyperlaxity in the weight-training population. J Strength Cond Res 27(5):1333-9', url: 'https://pubmed.ncbi.nlm.nih.gov/22836608/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  kolber2010: { id: 'kolber2010', cite: 'Kolber MJ et al. (2010) Shoulder injuries attributed to resistance training: a brief review. J Strength Cond Res 24(6):1696-704', url: 'https://pubmed.ncbi.nlm.nih.gov/20508476/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  odriscoll1992: { id: 'odriscoll1992', cite: "O'Driscoll SW et al. (1992) The relationship between wrist position, grasp size, and grip strength. J Hand Surg Am 17(1):169-77", url: 'https://pubmed.ncbi.nlm.nih.gov/1538102/', kind: 'peer-reviewed', access: 'abstract', checked: CHECKED },
  'ace-lat-pulldown': { id: 'ace-lat-pulldown', cite: 'ACE, Seated Lat Pulldown', url: 'https://www.acefitness.org/resources/everyone/exercise-library/158/seated-lat-pulldown/', kind: 'guideline', access: 'full', checked: CHECKED },
  'baechle-earle': { id: 'baechle-earle', cite: 'Baechle TR, Earle RW, Weight Training: Steps to Success (NSCA editors), grip selection and location', url: 'https://us.humankinetics.com/blogs/excerpt/grip-selection-and-location', kind: 'guideline', access: 'full', checked: CHECKED },
  'nhs-wrist-pain': { id: 'nhs-wrist-pain', cite: 'NHS, Wrist pain', url: 'https://www.nhs.uk/conditions/hand-pain/wrist-pain/', kind: 'guideline', access: 'full', checked: CHECKED },   // RED_FLAG source (architecture 4.2)
  'nhs-shoulder-pain': { id: 'nhs-shoulder-pain', cite: 'NHS, Shoulder pain', url: 'https://www.nhs.uk/conditions/shoulder-pain/', kind: 'guideline', access: 'full', checked: CHECKED },   // RED_FLAG_SHOULDER source
};
/** "Where this comes from": one plain evidence label per source, from the card's evidence notes (shown with the cite). */
export const EVIDENCE_LABELS = {
  signorile2002: { tag: 'DATA', text: 'Muscle study, 10 people. Front pulls beat behind the neck for lats.' },
  lusk2010: { tag: 'DATA', text: 'Muscle study, 12 people. Overhand beat underhand for lats. Biceps barely changed.' },
  andersen2014: { tag: 'DATA', text: '15 people. Grip widths worked lats alike. The widest lifted less.' },
  sperandei2009: { tag: 'DATA', text: 'Muscle study, 24 people. Behind the neck gave no lat benefit.' },
  padovan2024: { tag: 'DATA', text: 'Muscle study, 14 trained men. Front pulls worked the main muscles more.' },
  snyder2009: { tag: 'DATA', text: '8 beginners. Thinking about the back raised lat work. Biceps still helped.' },
  lehman2004: { tag: 'DATA', text: 'Held positions only. Wide-grip pulldowns had among the best back-to-biceps ratios.' },
  buonsenso2025: { tag: 'DATA', text: '40 trained men. Grip made no lat difference. Leaning raised rear-shoulder work.' },
  difonza2026: { tag: 'WEAK', text: 'Review. Front pulls most often linked to more lat work. Width: mixed.' },
  doma2013: { tag: 'DATA', text: 'Muscle study. Lats and biceps were the busiest muscles.' },
  kolber2013: { tag: 'WEAK', text: 'Lifter survey. Behind-the-neck lifters had looser front shoulders. A link, not proof.' },
  kolber2010: { tag: 'CONSENSUS', text: 'Review of weight-training shoulder injuries. Poor technique is a named risk.' },
  odriscoll1992: { tag: 'MECH', text: 'Grip study, not a pulldown. Wrist back is strongest, curled is weakest.' },
  'ace-lat-pulldown': { tag: 'CONSENSUS', text: 'Coaching guide. Firm pad, small lean, stop when the elbows stop.' },
  'baechle-earle': { tag: 'CONSENSUS', text: 'Textbook. Thumbs around the bar for every grip.' },
  'nhs-wrist-pain': { tag: 'CONSENSUS', text: 'When wrist pain needs a check.' },
  'nhs-shoulder-pain': { tag: 'CONSENSUS', text: 'When shoulder pain needs a check.' },
};


const C = (tags, sources, note) => ({ tags, sources, ...(note ? { note } : {}) });

// ---- hand (architecture 3.1 `pull`, 4.2, 5.1) ----
// Overhand on the wide bar, arms up. Seen from the side (the plate's camera) the camera looks along the bar, so the
// bar is end-on and the thumb side of the hand faces the camera ('radial' view). The lifter faces right as on the
// plate, so the palm faces right (toward the machine) and the fingers close over the top of the bar. forearm 180 =
// the forearm points up the screen from the elbow to the hand. The stack pulls the bar up; the lifter pulls down, so
// the drawn line runs from the bar down the forearm. `pull` is loadAxis 'across' (3.1.1): no lever check.
// Wrist: 10 degrees back. The card: "in line with your forearm, or tipped back a little ... never curled forward";
// archetype range 0 to 25 (O'Driscoll 1992 found grip strongest at 25 to 35 back). 10 is inside both.
// Handle: A6 names `bar-28` (the plate draws a 28 mm bar). contactAt 1.0 = the base of the fingers (5.1).
const RIGHT_POSE = { view: 'radial', forearm: 180, wrist: { ext: 10, dev: 0 }, contactAt: 1.0, fingers: { curl: 1 }, thumb: 'wrapped', squeeze: 'firm',
  handle: { profile: 'bar-28', axis: 'across' }, load: { kind: 'pull' } };
// Main wrong hand (card zoom "hand" wrong; handlingMistakes #2; archetype fault `curled-squeeze`): wrist curled
// forward 30 degrees (30 past the range's 0 end), fist squeezed hard with the forearm tendons standing out, a bend arc
// at the wrist. Curling pulls the bar a little deeper into the hand (card evidence notes), so contactAt 0.8.
const FAULT_CURLED = {
  key: 'curled-squeeze', label: 'Curled, squeezed',
  pose: { wrist: { ext: -30, dev: 0 }, contactAt: 0.8, squeeze: 'max', thumb: 'wrapped' },
  markers: ['lever-arc', 'tendon'],
  alt: 'Wrist curled forward, knuckles tipping back toward the face. Fist squeezed hard, forearm tendons standing out. The forearms and biceps end up doing the pulling.',
};
// Second wrong hand, page 2 (card zoom "hand": the grip-fatigue inset; archetype fault `fingertip-slip`): the bar has
// slid out to the fingertips, fingers half open, the hand pulled back by the bar. The card: "finish the rep and end
// the set". Thumb 'loose' (resting on the bar, not closed round it), NOT 'over': thumb-on-top is a valid option on
// this exercise (thumb page), so the fault must not look like it. Wrist 40 back = 15 past the range's 25 end.
const FAULT_SLIP = {
  key: 'fingertip-slip', label: 'Slipping out',   // the subtag names the fault; "finish the rep and end the set" stays in the caption
  pose: { wrist: { ext: 40, dev: 0 }, contactAt: 1.45, fingers: { curl: 1, open: 0.45 }, thumb: 'loose' },
  markers: ['slip-arrow'],
  alt: 'Bar slid out to the fingertips, fingers half open, thumb loose, the hand pulled back. The grip is failing: finish the rep and end the set.',
};
// Thumb page (5.1, `pull`): the card's two options, same hand. Full grip is the default; thumb on top is a comfort
// option when the forearms give out first (consensus only; no study measured thumb position on a pulldown).
export const THUMB_PAGE = [
  { mode: 'wrapped', title: 'Full grip', note: 'Use this', default: true,
    pose: RIGHT_POSE, alt: 'Full grip: thumb wrapped under the bar to meet the index finger. Use this.' },
  { mode: 'over', title: 'Thumb on top', note: 'If your forearms tire first',
    pose: { ...RIGHT_POSE, thumb: 'over' }, alt: 'Thumb on top: the thumb lies on the bar next to the index finger. Wrist still straight. An option if your forearms give out before your back.' },
];

// ---- posture zoom poses (PoseOverride, 4.3), merged over the plate's own end pose ----
// Knee pad, wrong (card zoom "knee pad"): pad set 6 cm too high, a gap over the thighs, and the hips lifting off the
// seat as the bar comes down. The right pose sits on the seat (plate check), so lifting the hip-joint centre 6 cm (as far as the raised pad allows)
// shows the buttock leaving the seat under a pad that no longer holds it. Feet stay planted (the plate's plant IK).
export const PAD_HIGH_DY = 0.06;   // metres; the wrong crop draws the roller this much higher
const END = plate.poses.end;
const LM_END = landmarksOf(END);
const PAD_GAP = [0, LM_END['thighTop.r'][1] + PAD_HIGH_DY - 0.055, LM_END['thighTop.r'][2]];   // underside of the raised roller (r 5.5 cm)
const HIPS_UP = { root: { at: [END.root.at[0], END.root.at[1] + 0.06, END.root.at[2]] } };
// Bar path, wrong (card zoom "lean and bar path", left fault; handlingMistakes #1): the bar pulled down behind the
// neck. To get the bar behind the head the lifter has to duck under the cable: the torso tips forward a little (pelvis
// and spine +4 each, instead of the right pose's lean back) and the head is pushed forward and down (neck +32). The bar
// ends at the nape, 3.5 cm above and 5 cm behind the neck landmark. Checked numerically: the cable from the head pulley
// to that bar passes 5 cm behind the back of the skull (ear z - 9.5 cm) at ear height, so it does not cut the head.
// Grip x keeps the plate's width; the elbows point down and out (pole), as they must with the hands behind the head.
// The card's second fault (leaning past 45 degrees and swinging) is the plate's own Mistake layer ("Swing back").
const GRIP_DROP = 0.12 * (0.34 - 0.3) / (0.61 - 0.3);   // = the plate's grip drop on the bent ends (lat_pulldown.mjs)
const DUCK = { root: { at: rootOnSeat([0, 0.42, 0], 4), tilt: 4 }, trunk: 4, neck: 32, scap: { elev: 1, pro: -1 } };
const NECK_W = landmarksOf({ ...END, ...DUCK, reach: undefined })['neck'];
export const BEHIND_BAR = [0, NECK_W[1] + 0.035, NECK_W[2] - 0.05];   // bar centre, world m
const behind = side => ({ at: [END.reach[side].at[0], BEHIND_BAR[1] - GRIP_DROP, BEHIND_BAR[2]], pole: [side === 'l' ? 0.6 : -0.6, -1, -0.1] });
const BEHIND_NECK = { ...DUCK, reach: { l: behind('l'), r: behind('r') } };

/* ---------------------------------------------------------------- handling mistakes, risks (plan 2.4 items 4, 7) --
 * From the verified card's handlingMistakes (grip/research/lat_pulldown.json): the mistake, its fix and what it can hurt,
 * cut to the copy limits (copy-lint.mjs: at most 3 mistakes, title <= 5 words, fix <= 12; at most 3 risks, <= 14 words; no citations in user copy, C7;
 * no red-flag wording, C8: the shared RED_FLAG and DISCLAIMER come from howto/shared.mjs). `zoom` = "Show me" target. */
const MISTAKES = [
  { key: 'behind', title: 'Pulling behind your neck', zoom: 'path', claim: C(['DATA'], ['kolber2013', 'signorile2002', 'sperandei2009']),
    fix: 'Pull in front of your face, to your upper chest.' },
  { key: 'curl', title: 'Curling wrists, squeezing hard', zoom: 'hand', claim: C(['DATA', 'CONSENSUS'], ['odriscoll1992']),
    fix: 'Straighten your wrist. Grip only as hard as needed.' },
  { key: 'swing', title: 'Leaning back and swinging', zoom: 'pad', claim: C(['CONSENSUS'], ['ace-lat-pulldown']),
    fix: 'Hold a small lean still and go lighter.' },
];
const RISKS = [
  { key: 'behind', text: 'Behind-the-neck pulling is linked to a looser front shoulder.',
    claim: C(['DATA'], ['kolber2013'], 'Association, not proof of cause.') },
  { key: 'swing', text: 'Rocking uses your lower back and jerks your shoulders.', claim: C(['CONSENSUS'], ['ace-lat-pulldown']) },
  { key: 'too-far', text: 'Pulling past where your elbows stop stresses the shoulder joint.', claim: C(['CONSENSUS'], ['ace-lat-pulldown']) },
];

export default {
  schema: 1,
  id: 'lib_lat_pulldown',
  rev: 1,
  plate,
  handling: {
    archetype: 'pull',
    orientation: 'pronated',
    handle: 'bar-28',                  // A6; the plate draws the same 28 mm bar with bent ends
    loadAxis: 'across',                // archetype default for `pull` (3.1.1): no push lever check
    overBody: false,
    handleChoice: { sore: 'Sore wrist? Use the neutral-grip handles.',
      claim: C(['CONSENSUS', 'DATA'], ['buonsenso2025'], 'The card: with a sore wrist, use the neutral handles, go lighter, stop if it hurts (consensus). Buonsenso 2025: no lat difference between grips, so the swap costs nothing.') },
    width: { text: "About 1.5 times shoulder width, often on or just inside the bar's bends. At the bottom your forearms are close to vertical. If a wrist bends hard sideways, move your hands onto or off the bends.",
      claim: C(['DATA', 'MECH'], ['andersen2014', 'lusk2010', 'difonza2026'], "Width barely changes lat activity (Lusk, Andersen, Di Fonza); the widest grip costs a little strength (Andersen). The bent ends keeping the wrist straight is mechanical reasoning only (card).") },
    thumb: { mode: 'wrapped', options: [{ mode: 'over', when: 'If your forearms give out before your back' }],
      claim: C(['CONSENSUS'], ['baechle-earle'], 'No study has measured thumb position on a pulldown. Full grip follows the NSCA editors; thumb on top is coaching consensus. A pulldown bar cannot fall on the lifter, so thumb on top is a comfort choice only (C4 allows `over` for `pull`).') },
    contact: 'finger-base',
    wrist: { ext: [0, 25], dev: [-10, 10], limitText: 'Wrist curling, or bar slipping to your fingertips? Finish the rep and end the set.',
      claim: C(['DATA', 'CONSENSUS'], ['odriscoll1992'], "O'Driscoll 1992 (a dynamometer, applied by reasoning): grip strongest 25 to 35 degrees back, weakest curled. The near-straight target and the end-the-set limit are consensus, not injury thresholds.") },
    pose: RIGHT_POSE,
    faults: [FAULT_CURLED, FAULT_SLIP],
    gripLine: 'Hook the bar at the base of your fingers, wrist straight. Pull with your elbows so your back does more.',
    cue: 'Hands are hooks. Elbows pull.',   // `pull` archetype cue (3.1); the card's cue is the same idea
  },
  contacts: ['seat-back', 'brace-pad'],
  setup: [
    { kind: 'adjust', text: "Snug the knee pad so you can't lift off.", zoom: 'pad',
      claim: C(['CONSENSUS'], ['ace-lat-pulldown']) },
    { kind: 'safety', text: 'Push the pin fully in. Start light.',
      claim: C(['CONSENSUS'], ['ace-lat-pulldown'], 'Pin and "start lighter": card consensus; ACE covers the setup, not the pin wording.') },
    { kind: 'grip', text: 'Hands about 1.5 times shoulder width, palms away, thumb wrapped.', zoom: 'hand',
      claim: C(['CONSENSUS', 'DATA'], ['baechle-earle', 'andersen2014']) },
    { kind: 'position', text: 'Lean back slightly, about 30 degrees at most.', zoom: 'path',
      claim: C(['CONSENSUS'], ['ace-lat-pulldown']) },
    { kind: 'brace', text: 'Shoulders down, away from your ears. Then pull.',
      claim: C(['CONSENSUS'], ['ace-lat-pulldown']) },
  ],
  posture: [
    { key: 'pad', label: 'Thighs under pad', detail: 'Pad firm on the tops of the thighs, just above the knees, feet flat. Hips stay on the seat all set.',
      anchor: { at: 'thighTop.r' }, zoom: 'pad', claim: C(['CONSENSUS'], ['ace-lat-pulldown']) },
    { key: 'lean', label: 'Slight lean back', detail: 'Torso tipped back a little from the hips, no more than about 30 degrees. Chest up, lower back in its normal curve. The lean stays the same every rep, with no extra lean as you pull.',
      anchor: { at: 'backUpper' }, claim: C(['CONSENSUS', 'DATA'], ['ace-lat-pulldown', 'buonsenso2025'], 'Shown by the plate: the measured lean (about 15 degrees) and the Mistake layer (swing back).') },
    { key: 'shoulders', label: 'Shoulders down', detail: 'At the top, arms straight, the shoulders first draw down and slightly back. Then the elbows bend.',
      anchor: { at: 'shoulderTop.r', pose: 'start' }, claim: C(['CONSENSUS'], ['ace-lat-pulldown'], 'Already a plate callout ("Shoulders down"); the card\'s back-view "shoulder blades" zoom needs a back-view plate.') },
    { key: 'path', label: 'Bar in front', detail: 'The bar travels past your chin to the top of your chest. Never behind the head.',
      anchor: { at: 'chin' }, zoom: 'path', claim: C(['DATA', 'WEAK'], ['sperandei2009', 'signorile2002', 'padovan2024', 'kolber2013']) },
    { key: 'elbows', label: 'Elbows down', detail: 'At the bottom the elbows point at the floor, beside the ribs. Forearms near vertical under the bar. Stop when the elbows stop going down and start going back. The bar need not touch your chest.',
      anchor: { at: 'elbow.r' }, claim: C(['CONSENSUS'], ['ace-lat-pulldown'], 'Plate callout "Elbows down". The shoulders rolling forward past that point is reasoning (card).') },
    { key: 'wrists', label: 'Wrists straight', detail: 'Back of the hand in line with the forearm, or tipped back a little. Bar at the base of the fingers, no curl.',
      anchor: { at: 'grip.r' }, zoom: 'hand', claim: C(['DATA', 'CONSENSUS'], ['odriscoll1992']) },
    { key: 'width', label: 'Grip width', detail: "Hands about 1.5 times shoulder width, on or just inside the bar's bends. At the bottom, forearms close to vertical, wrists straight side to side.",
      anchor: { at: 'grip.r' }, claim: C(['DATA', 'MECH'], ['andersen2014', 'lusk2010'], 'Front view: text checkpoint. The plate is a side view, where width does not show (5.2).') },
  ],
  feel: {
    primary: [{ muscleId: 'lats', plain: 'The sides of your back, under your armpits and down toward your lower ribs. This is the muscle pulling your elbows down to your sides.' }],
    secondary: [
      { muscleId: 'mid_back', plain: 'Between your shoulder blades, as they draw down and together at the bottom.' },
      { muscleId: 'biceps', plain: 'The front of your upper arms. They help bend the elbows; some work here is normal.' },
      { muscleId: 'rear_delts', plain: 'The backs of your shoulders. They help, a bit more if you lean back further.' },
      { muscleId: 'brachialis', plain: 'Under the biceps, near the elbow. It helps bend the arm.' },   // text only (no drawn region)
      { muscleId: 'forearms', plain: 'Your forearms hold the bar. Some grip fatigue is normal on heavy sets.' },
    ],
    // "Should not take over": dashed outline ONLY while a row naming the muscle is open (S6), never at rest (5.3).
    // biceps and forearms are helpers AND watch on purpose (card rendering notes; A6): watch only while their row is open.
    watch: [
      { muscleId: 'biceps', plain: 'If your arms are tired long before your back, your arms are doing the pulling.' },
      { muscleId: 'forearms', plain: 'If your grip gives out first, the bar is sitting badly in your hand or you are squeezing too hard.' },
      { muscleId: 'upper_traps', plain: "The tops of your shoulders and the sides of your neck. A burn here means you're shrugging." },
      { muscleId: 'lower_back', plain: "Your lower back should not ache. If it does, you're swinging." },
    ],
    feelLine: 'You should feel this in the sides of your back, under your armpits. Drive your elbows down.',
    rows: [
      { key: 'arms', where: 'Mostly your biceps and forearms', at: { muscles: ['biceps', 'forearms'] },
        means: "You're gripping hard with curled wrists.",
        fix: 'Loosen your grip and drive your elbows down.',
        zoom: 'hand', claim: C(['DATA', 'CONSENSUS'], ['odriscoll1992', 'snyder2009', 'lusk2010', 'lehman2004'], 'Snyder and Leech 2009: a back-focus cue raised lat activity and left the biceps unchanged, so the copy asks for more back, not no arms.') },
      { key: 'low-back', where: 'Your lower back', at: { muscles: ['lower_back'] },
        means: "You're rocking, or the knee pad is loose.",
        fix: 'Snug the pad, hold a small lean, go lighter.',
        zoom: 'pad', claim: C(['CONSENSUS'], ['ace-lat-pulldown'], 'No study measures lower-back load on the pulldown; the swinging warning is consensus.') },
      { key: 'pinch', where: 'Front of your shoulder pinches', at: {},   // pain, not a muscle taking over: no map mark (A6 fix)
        means: 'Bar behind your head, or pulling too far.',
        fix: 'Pull in front and stop when your elbows stop. If it still pinches, stop pulldowns.',
        zoom: 'path', redFlag: 'shoulder', claim: C(['WEAK', 'CONSENSUS'], ['kolber2013', 'ace-lat-pulldown', 'kolber2010', 'nhs-shoulder-pain'], 'Kolber 2013 is one association study. ACE: further pulling stresses the shoulder joint. The referral is the shared shoulder red flag (NHS), not the fix text (C8).') },
      { key: 'wrist', where: 'Your wrist', at: { parts: ['hand-left', 'hand-right', 'hand-back-left', 'hand-back-right'] },
        means: "It's curling forward, bending sideways, or already sore from pressing.",
        fix: "Keep your wrist straight. If it's sore, use neutral handles and stop if it hurts.",
        zoom: 'hand', redFlag: true, claim: C(['DATA', 'CONSENSUS'], ['odriscoll1992', 'nhs-wrist-pain']) },
    ],
    libraryDiff: { add: ['rear_delts', 'forearms', 'brachialis'], why: 'The card adds the rear delts (more with a lean, Buonsenso 2025), the forearms (grip) and the brachialis (anatomy, text only) as helpers. exercises.json lists lats primary and biceps, mid_back secondary.' },
    claim: C(['DATA', 'CONSENSUS'], ['signorile2002', 'lusk2010', 'doma2013', 'snyder2009'], 'EMG readings do not map one to one onto what a person feels. Teres major is folded into lats and lower trapezius into mid_back (no ids). The chest is measurably active but left off the map on purpose (card).'),
  },
  zooms: [
    {
      key: 'hand', chip: 'Hand', heading: 'Hand: right and wrong', kind: 'hand',
      hand: {
        right: RIGHT_POSE,
        wrong: [FAULT_CURLED, FAULT_SLIP],             // the second one pages (4.3)
        camera: 'side',
        thumbPage: THUMB_PAGE.map(t => t.mode),
      },
      rightNote: 'Base of fingers',
      caption: { right: 'Bar at the finger base, wrist straight.',
        wrong: 'Wrist curled forward, fist squeezed hard.' },
      captionPage2: { right: 'Bar at the finger base, wrist straight.',
        wrong: 'Bar at the fingertips: end the set.' },
      alt: {
        right: 'Seen from the side, arms overhead. Bar at the base of the fingers, thumb wrapped under. Back of the hand in line with the forearm, knuckles up.',
        wrong: FAULT_CURLED.alt,
        wrong2: FAULT_SLIP.alt,
      },
      feelRow: 'arms',
      feelPrompt: 'Mostly biceps and forearms? This is usually why.',
    },
    {
      key: 'pad', chip: 'Knee pad', heading: 'Knee pad: right and wrong', kind: 'posture',
      // crop of the plate at the end pose: thighs, roller, seat and hips (plate px, same camera as the plate)
      crop: { center: { at: 'thighTop.r', off: [-8, 12] }, sizePx: 140 },   // 8 px toward the knee, 4 up: room above the raised roller for the Wrong label, clear of the machine's column
      right: 'end',
      wrong: { base: 'end', pose: HIPS_UP, parts: ['trunk', 'leg.r', 'leg.l'], equipment: { kneePad: { dy: PAD_HIGH_DY } } },
      // zoom-only overlay (5.2): an arrow up from the seat contact to where it is in the wrong pose (hips lifting)
      guides: [{ kind: 'drop', from: { at: 'seat', off: [14, 0] }, to: { at: 'seat', pose: 'mistake', off: [14, 0] } }],
      callout: {
        right: { text: 'Pad<br>on thighs', anchor: { at: 'thighTop.r', off: [0, -1] } },
        wrong: { text: 'Pad<br>too high', anchor: { at: PAD_GAP, off: [0, 1] }, prefer: 'right' },
      },
      caption: { right: 'Pad firm on the thighs, hips down.',
        wrong: 'Pad too high, hips lifting.' },
      alt: {
        right: 'Side view of the thighs, knee pad and seat. The pad presses on the tops of the thighs, just above the knees. Feet flat, hips down on the seat.',
        wrong: 'The pad set too high, with a gap above the thighs. The hips lift off the seat as the bar comes down. Drawn dashed over the right position.',
      },
      feelRow: 'low-back',
      feelPrompt: 'Lower back aching? This is usually why.',
    },
    {
      key: 'path', chip: 'Bar path', heading: 'Bar path: right and wrong', kind: 'posture',
      crop: { center: { at: 'ear', off: [30, 14] }, centerWrong: { at: 'ear', off: [-22, 14] }, sizePx: 132 },   // right: room in front of the face for its label; wrong: the head is further forward, room behind it for the label
      right: 'end',
      wrong: { base: 'end', pose: BEHIND_NECK, solid: true },   // drawn alone: arm and bar cross the head (render note)
      // zoom-only overlay (5.2): the last 20 cm of the bar's path. Right: down the cable line in front of the face to
      // the upper chest. Wrong: down behind the back of the head to the nape.
      guides: [
        { kind: 'path', role: 'right', pts: [[0, 1.25, 0.098], [0, 1.01, 0.077]] },
        { kind: 'path', role: 'wrong', pts: [[0, BEHIND_BAR[1] + 0.23, BEHIND_BAR[2] - 0.03], [0, BEHIND_BAR[1] + 0.03, BEHIND_BAR[2] - 0.02]] },
      ],
      callout: {
        right: { text: 'In front', anchor: { at: 'grips', off: [0, -4] }, prefer: 'right' },   // label in front of the face, leader clear of the arm
        wrong: { text: 'Behind<br>the neck', anchor: { at: 'grips', pose: 'mistake', off: [0, -4] }, prefer: 'left' },
      },
      caption: { right: 'Bar past the chin to the chest.',
        wrong: 'Bar behind the neck, head pushed forward.' },
      alt: {
        right: 'Side view at the bottom: slight lean back, chest up. The bar came down in front of the face to the upper chest. Elbows down by the ribs.',
        wrong: 'The bar pulled down behind the neck, head pushed forward and down.',   // drawn solid, on its own (wrong.solid)
      },
      feelRow: 'pinch',
      feelPrompt: 'Shoulder pinching? This is usually why.',
    },
  ],
  // Chip row = the zooms in order, then "Where to feel it" (always last, 2.1). 4 chips. A6 names four zoom chips
  // (Hand, Grip width, Knee pad, Lean and bar path); with Feel always last that is 5, over the limit of 4.
  // "Grip width" is the one left out: it is a front view the side plate cannot crop (5.2), so it is the text
  // checkpoint 'width' and HandlingSpec.width. "Shoulder blades" is already a plate callout (A6); "bottom position"
  // is the plate's "Elbows down" callout.
  chips: ['hand', 'pad', 'path', 'feel'],
  copy: {
    setupLine: 'Snug the knee pad on your thighs. Lean back a little, shoulders down, then pull to your chest.',
    mistakeLine: 'Pull to the front, never behind your neck. That puts your shoulders in a bad spot for no gain.',
  },
  mistakes: MISTAKES,
  risks: RISKS,
  riskFlags: ['wrist', 'shoulder'],
  sources: Object.keys(SOURCES),
  research: { card: 'grip/research/lat_pulldown.json', rev: 1 },
};

// KNOWN GAPS (for the supervisor):
// - No "Wrist sore before you start" row: that row is for presses (A1); this is a `pull` exercise. The card's own
//   wrist row covers a sore wrist (neutral handles, lighter, stop if it hurts) and carries the shared RED_FLAG; the
//   hand zoom also prints handleChoice ("Sore wrist? Use the neutral-grip handles.").
// - The shoulder pinch row links to the shared NHS shoulder block (redFlag: 'shoulder'), shown in Risks next to the
//   wrist one. Care wording stays out of the fix line. Closed 2026-09-30 (golden-B review).
// - Grip width has no zoom (front view). It needs a front-view pulldown plate.
// - The card's mistakeLine (behind the neck) is not what the plate's Mistake layer draws (swing back and shrug); the
//   Bar path zoom's Wrong crop carries behind the neck instead.
