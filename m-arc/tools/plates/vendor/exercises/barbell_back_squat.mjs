// Barbell back squat (high-bar), side view, figure facing screen right.
// View: side. Depth, the bar path over mid-foot, knee travel and trunk inclination are all sagittal.
// Form sources:
//  NSCA, Essentials of Strength Training and Conditioning, 4th ed. (Haff & Triplett 2016), ch. 15, Back squat:
//   high-bar above the posterior deltoids at the base of the neck, feet shoulder-width or wider, toes slightly out,
//   flat back, heels on the floor, knees aligned over the feet, descend until the thighs are parallel to the floor.
//  Glassbrook, Helms, Brown & Storey 2017, "A review of the biomechanical differences between the high-bar and
//   low-bar back-squat", JSCR 31(9):2618-2634 (pubmed 28570490): high bar = larger hip angle, smaller knee angle,
//   more upright torso than low bar.
//  Fry, Smith & Schilling 2003, "Effect of knee position on hip and knee torques during the barbell squat",
//   JSCR 17(4):629-633: stopping the knees behind the toes increases trunk lean; hip/low-back torque rose about 1070% while knee
//   torque fell 22% (oasis.library.unlv.edu/kns_fac_articles/69);
//   knees travelling past the toes is normal.
//  Myer et al. 2014, "The back squat: a proposed assessment of functional deficits and technical factors that limit
//   performance", Strength Cond J 36(6):4-27: bar over mid-foot, trunk about parallel to the tibia, heels down,
//   knees in line with the toes; faults include excessive forward trunk lean and hips rising first.
//  Schoenfeld 2010, "Squatting kinematics and kinetics and their application to exercise performance",
//   JSCR 24(12):3497-3506: parallel squat, neutral spine, heels flat.
//  Rippetoe, Starting Strength 3rd ed. (2011): the bar stays in a vertical line over the middle of the foot.
// Geometry decisions (confirmed by the engine report `angles`):
//  Mid-foot (sole landmark, halfway heel to toe) at world z = 0; mid-soles 38 cm apart (heels ~34 cm, about
//   shoulder width), toes out 20 deg, knees tracking the toes (IK pole = toe line).
//  Bar: 28 mm shaft on the upper trapezius, just under C7 (thorax point .850 H up, 10 cm behind the glenohumeral
//   line, 1.4 cm off the drawn back surface), 1.49 m high standing. Hands 72 cm apart, elbows pulled down under the
//   bar (147 deg; IK pole straight down, so at the bottom the elbow sits about 1 cm in front of the bar line and the
//   near arm reads as one slim shape along the trunk instead of a loop behind the back).
//  Drawing: the 45 cm plate is an outline BEHIND the body, the bar end a small solid dot in front, so the head, the
//   back line (trunk angle) and the hand on the bar stay readable. The start pose shows only the dashed trunk, near
//   leg and a dashed bar dot (startParts): a dashed start arm read as a stray loop.
//  Start: standing tall: knees 5 deg soft, trunk 8 deg forward (the body model puts the bar 10 cm behind the shoulder
//   joint, so a small lean is needed to hold it over mid-foot), ankle 7 deg.
//  End: hip-joint centre 2 cm below the knee centre (thighs just below parallel); thorax 40 deg from vertical =
//   pelvis 30 + lumbar 10 (near-neutral spine); knee 125 deg, hip 123 deg (femur vs pelvis), ankle 33 deg
//   dorsiflexion; knees 2.6 cm past the toes in the side view.
//  Every key pose (start, 2 via, end, mistake) solves the root so the bar sits exactly over mid-foot (mistake: 10 cm
//   forward) and the hands are IK-placed on the bar, so the traced bar path is vertical by construction.
import { landmarksOf } from '../engine/index.mjs';
const H = 1.75, R = Math.PI / 180;
const FOOT_X = 0.19, TOE_OUT = 20;                        // mid-sole lateral offset (heels ~34 cm apart), toe-out
const GRIP_X = 0.36;                                      // hand centre lateral offset on the bar
const BAR_T = [0, 0.850, -0.058];                         // bar centre in the standing thorax frame (H)

const toe = s => [s * Math.sin(TOE_OUT * R), 0, Math.cos(TOE_OUT * R)];
const feet = { l: { at: [FOOT_X, 0, 0], toe: toe(1) }, r: { at: [-FOOT_X, 0, 0], toe: toe(-1) } };

// Bar spot on the back: affine combination of three thorax landmarks (neck pivot, backUpper, sternum) whose
// standing-frame coordinates are known, so it moves rigidly with the thorax.
const REFP = { neck: [0.855, -0.02], backUpper: [0.75, -0.072], sternum: [0.80, 0.07] };
const W = (() => {
  const [a, b, c] = [REFP.neck, REFP.backUpper, REFP.sternum];
  // solve w_a a + w_b b + w_c c = T, w_a + w_b + w_c = 1 (2D: y, z)
  const M = [[a[0] - c[0], b[0] - c[0]], [a[1] - c[1], b[1] - c[1]]], v = [BAR_T[1] - c[0], BAR_T[2] - c[1]];
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const wa = (v[0] * M[1][1] - M[0][1] * v[1]) / det, wb = (M[0][0] * v[1] - v[0] * M[1][0]) / det;
  return { neck: wa, backUpper: wb, sternum: 1 - wa - wb };
})();
const barOf = lm => [0, 1, 2].map(i => W.neck * lm.neck[i] + W.backUpper * lm.backUpper[i] + W.sternum * lm.sternum[i]).map((v, i) => i === 0 ? 0 : v);

const hands = bar => ({
  l: { at: [GRIP_X, bar[1], bar[2]], pole: [0.35, -1, 0] },
  r: { at: [-GRIP_X, bar[1], bar[2]], pole: [-0.35, -1, 0] },
});
// Key pose from hip height (m), thorax inclination (deg from vertical), bar z (m, 0 = over mid-foot), neck, and the
// part of the inclination taken by lumbar flexion (spine, deg; the rest is pelvis tilt).
function key(hipY, incl, barZ = 0, neck = 0, spine = 0, extra = {}) {
  const pose = { root: { at: [0, hipY, 0], tilt: incl - spine }, trunk: spine, neck, plant: feet, ...extra };
  const b = barOf(landmarksOf(pose, H));
  pose.root.at = [0, hipY, barZ - b[2]];
  return { ...pose, reach: hands([0, b[1], barZ]) };
}

// Standing: knees ~5 deg soft. With nearly straight legs the knee plane sits 6 deg inside the toe line so the
// flat foot keeps its 20 deg toe-out (engine IK couples foot yaw to the knee plane).
const pole = (s, a) => [s * Math.sin(a * R), 0, Math.cos(a * R)];
const feetStart = { l: { ...feet.l, pole: pole(1, 14) }, r: { ...feet.r, pole: pole(-1, 14) } };
const start = key(0.918, 8, 0, 0, 0, { plant: feetStart });
// knee z (m) 0.139 -> 0.144 -> 0.150 at the bottom: the knees travel forward steadily, never back.
const via = [key(0.80, 18, 0, -3, 3), key(0.62, 35, 0, -7, 7)];
const end = key(0.41, 40, 0, -8, 10);
// Mistake: good-morning squat out of the hole. The hips rise first and sit back (hip 11 cm higher), the chest drops
// to ~62 deg from vertical and the bar drifts ~10 cm forward of mid-foot (feet stay flat).
const mistakeFull = key(0.52, 62, 0.10, -14, 18);
const mistakePose = { root: mistakeFull.root, trunk: mistakeFull.trunk, neck: mistakeFull.neck, reach: mistakeFull.reach };
// Knee flexion arc: from the shank line extended past the knee to the thigh.
const LE = landmarksOf(end, H);
const SHANK_EXT = [LE['knee.r'][2] - LE['ankle.r'][2], LE['knee.r'][1] - LE['ankle.r'][1]];
// Drawn reference ray: the shin extended 25 cm past the knee (about 37 px, well past the 22 px arc).
const SHANK_LEN = Math.hypot(...SHANK_EXT);
const EXT = [LE['knee.r'][0], LE['knee.r'][1] + 0.25 * SHANK_EXT[1] / SHANK_LEN, LE['knee.r'][2] + 0.25 * SHANK_EXT[0] / SHANK_LEN];

// The plate is drawn as an outline BEHIND the body (z back), so the head, back line and hand stay readable; the bar
// end (50 mm sleeve) is drawn on top as a small solid dot so the bar position still reads.
const barItem = lm => [
  { type: 'barbell', at: barOf(lm), plates: [0.045], part: 'bar', z: 'back' },
  { type: 'pulley', at: barOf(lm), r: 0.025, part: 'bar', z: 'front' },
];
// Start bar dot, dashed. Engine workaround (as in leg_press): the start layer never draws moving equipment, so the
// 50 mm sleeve at the start is added to the end pose as a dashed outline.
const START_BAR = barOf(landmarksOf(start, H));
const START_DOT = Array.from({ length: 17 }, (_, k) => [0, START_BAR[1] + 0.025 * Math.sin(k * Math.PI / 8), START_BAR[2] + 0.025 * Math.cos(k * Math.PI / 8)]);

export default {
  id: 'barbell_back_squat', name: 'Barbell Back Squat', view: 'side', facing: 'right',
  camera: { x0: 196, y0: 339 },
  poses: { start, via, end },
  equipment: [
    { type: 'floor', from: -0.75, to: 0.75 },
    lm => barItem(lm),
    (lm, ctx) => (ctx.pose === 'end' ? { type: 'line', cls: 'eq-cable m-line', pts: START_DOT, z: 'front', part: 'startbar' } : null),
  ],
  checks: [
    { landmark: 'heel.r', plane: { point: [0, 0, 0], normal: [0, 1, 0] }, pose: 'all', tol: 0.5 },
    { landmark: 'ball.r', plane: { point: [0, 0, 0], normal: [0, 1, 0] }, pose: 'all', tol: 0.5 },
  ],
  startParts: ['trunk', 'leg.r'],
  ghosts: { count: 2, parts: ['trunk', 'leg.r'] },
  trace: { point: 'grip.r', trim: [10, 12] },
  measure: { vertex: 'knee.r', from: { dir: SHANK_EXT }, to: 'hip.r', radius: 22, title: 'Knee', value: 'about 125° bend', expect: 125, box: { left: 250, top: 222 } },
  // Mid-foot plumb line: runs past the floor so a stub marks mid-foot under the sole; plus the extended shin.
  datum: [{ x: [0, 0, 0], from: 349, to: 60 }, { x: 0, from: 0, to: 0, line: ['knee.r', EXT], mistake: false }],
  callouts: [
    { key: 'bar', text: 'Bar over<br>mid-foot', anchor: 'start:grip.r', cue: 'The bar travels straight down and up over the middle of the foot.' },
    { key: 'knees', text: 'Knees over<br>toes', anchor: 'knee.r', box: { left: 252, top: 290 }, cue: 'Let the knees travel forward and out, in line with the toes.' },
    { key: 'heels', text: 'Heels down', anchor: 'heel.r', cue: 'Keep the whole foot flat; the heels never lift.' },
  ],
  tempo: [{ phase: 'Lower', s: 2, move: true }, { phase: 'Drive up', s: 1, move: true }, { phase: 'Brace', s: 1 }],
  mistake: {
    pose: mistakePose,
    guides: [
      { kind: 'arrow', from: { at: 'grip.r', pose: 'end' }, to: { at: 'grip.r', pose: 'mistake' } },
      // plumb line from the faulty bar to the floor: it lands over the toes, not mid-foot
      { kind: 'dashed', pts: [{ at: 'grip.r', pose: 'mistake', off: [0, 6] }, [0, 0, 0.10]] },
    ],
    tells: [
      { key: 'hips', text: 'Hips rise<br>first', anchor: 'buttock', cue: 'The hips come up before the shoulders.' },
      { key: 'chest', text: 'Chest drops', anchor: 'sternum', box: { left: 236, top: 218 }, cue: 'The chest falls and the trunk tips forward.' },
      { key: 'drift', text: 'Bar drifts<br>forward', anchor: { along: [{ at: 'grip.r', pose: 'mistake' }, [0, 0, 0.10]], t: 0.35 }, box: { left: 256, top: 262 }, cue: 'The bar moves out over the toes.' },
    ],
  },
  alt: 'High-bar barbell back squat, side view. The bar rests on the upper back over the middle of the foot. The lifter sits down until the thighs are about parallel, knees travelling forward over the toes, heels flat, trunk leaning about 40 degrees, and the bar moves in a straight vertical line.',
};
