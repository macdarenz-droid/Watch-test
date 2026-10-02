// Lat pulldown (wide overhand grip, bar to the upper chest), side view, figure faces the machine (screen right).
// View: SIDE. Everything a coach judges on this lift is sagittal: the bar path in front of the face to the upper
// chest (not behind the neck), the small braced lean-back, the elbows driven down and back, the thighs locked under
// the knee pad, and the fault (swinging the torso far back to heave the load). The front view would hide all of that
// and show only the grip width, which the cue text carries instead.
// Form sources:
//  ACE Seated Lat Pulldown (acefitness.org/resources/everyone/exercise-library/158/seated-lat-pulldown/): knees under
//   the pad, feet flat, wide overhand grip, arms extended overhead; depress and retract the scapulae and hold it; lean
//   back slightly (no more than 30 deg); pull the bar to the upper chest driving the elbows toward the sides.
//  NSCA, Exercise Technique Manual for Resistance Training (3rd ed., 2016), lat pulldown: pronated grip wider than
//   shoulder width, thighs under the pad, lean the torso back slightly, pull to the clavicles/upper chest, return to
//   full elbow extension; no body swing.
//  Andersen V et al. 2014, JSCR 28(4):1135-42: grip width 1x-2x bi-acromial; lat activation similar across widths
//   (the 1.5x "wide" grip is used here, as in the M/ARC research).
//  Signorile JF et al. 2002, JSCR 16(4):539-46 and Sperandei S et al. 2009, JSCR 23(7):2033-8: the wide grip to the
//   FRONT gives the best/equal lat activation; behind-the-neck brings no benefit and loads the shoulder in
//   abduction + external rotation (Durall CJ et al. 2001, Strength Cond J 23(5):10-18).
//  M/ARC research lib_lat_pulldown.json (backup branch): torso lean 0 to -15 deg, scapular depression 0-3 cm,
//   mistake "Lean and heave" (torso swings past the braced lean; shoulders creep up), grip ~1.5x shoulder width.
// Machine (selectorised lat pulldown, typical commercial sizes): seat pad top 46 cm, knee roller 11 cm on the thighs
// just behind the knees, head pulley 2.16 m above the bar, cable over the boom to a column pulley and down to a
// 16 x 5 kg stack (2.5 cm plates) in the column in front of the user. Bar: 1.22 m, straight 60 cm centre, ends
// dropped 12 cm, 28 mm; hands at +-34 cm (68 cm apart = 1.5x the 45 cm shoulder-joint width).
import { rootOnSeat, landmarksOf } from '../engine/index.mjs';

const H = 1.75;
const SEAT_TOP = 0.42;
const SEAT = [0, SEAT_TOP, 0];                         // buttock contact on the seat pad
const feet = { l: { at: [0.10, 0, 0.50] }, r: { at: [-0.10, 0, 0.50] } };   // feet flat, hip width, shins about vertical
const GX = 0.34;                                       // grip centres +-34 cm
const BAR_W = 1.22, BAR_STRAIGHT = 0.6, BAR_DROP = 0.12, BAR_R = 0.014;
const GRIP_DROP = BAR_DROP * (GX - BAR_STRAIGHT / 2) / (BAR_W / 2 - BAR_STRAIGHT / 2);   // grip sits this far below the bar centre
const HEAD = { z: 0.17, y: 2.08, r: 0.045 };           // head pulley on the boom, over the bar
const COL = { z0: 0.86, z1: 1.12, h: 2.16 };           // column uprights (front/back), height
const COLP = { r: 0.035 };                             // column top pulley
const STACK_Z = (COL.z0 + COL.z1) / 2;                 // stack centre; the cable drops onto it
COLP.z = STACK_Z - COLP.r; COLP.y = HEAD.y + HEAD.r - COLP.r;

// Bar centre on the cable line (bar hangs from the head pulley), touching the upper chest at the end.
const grips = (c, pole) => ({
  l: { at: [GX, c[1] - GRIP_DROP, c[2]], pole: [pole[0], pole[1], pole[2]] },
  r: { at: [-GX, c[1] - GRIP_DROP, c[2]], pole: [-pole[0], pole[1], pole[2]] },
});

// End body (without arms) first, to put the bar on its upper chest.
const endBody = { root: { at: rootOnSeat(SEAT, -10), tilt: -10 }, trunk: -3, neck: -6, scap: { elev: -2, pro: -3 }, plant: feet };
const lmE = landmarksOf({ ...endBody, shoulder: { flex: 0 } }, H);
const chestPt = (lm, t) => lm.sternum.map((v, i) => v + (lm.chest[i] - v) * t);   // t along sternal notch -> chest
const up = chestPt(lmE, 0.35);
const END_BAR = [0, up[1], up[2] + BAR_R + 0.004];     // 28 mm bar just touching the upper chest
// Lean construction (end pose, side-view plane), measured at the hip joint as an engineering plate would: a plumb
// line up from the hip joint and the trunk axis (hip joint -> shoulder joint), both drawn over the figure as short
// construction rays, the arc between them. Leaving the mistake plate (ctx.mistake) so no orphan lines stay there.
const HIP_E = [0, lmE['hip.r'][1], lmE['hip.r'][2]];
const TRUNK_E = [0, lmE['shoulder.r'][1], lmE['shoulder.r'][2]];
const TU = (() => { const d = [0, TRUNK_E[1] - HIP_E[1], TRUNK_E[2] - HIP_E[2]], L = Math.hypot(...d); return d.map(v => v / L); })();
const RAY = 0.33;                                      // construction rays 33 cm long (about 48 px), past the 40 px arc
const LEAN_UP = [0, HIP_E[1] + RAY, HIP_E[2]], LEAN_AX = HIP_E.map((v, i) => v + TU[i] * RAY);
// start bar on the same cable line, arms straight overhead
const cableDir = (() => { const d = [0, HEAD.y - END_BAR[1], HEAD.z - END_BAR[2]], L = Math.hypot(...d); return d.map(v => v / L); })();
const START_Y = 1.647;
const START_BAR = [0, START_Y, END_BAR[2] + cableDir[2] / cableDir[1] * (START_Y - END_BAR[1])];

const start = { root: { at: rootOnSeat(SEAT, -3), tilt: -3 }, trunk: 0, neck: 0, scap: { elev: 0, pro: 0 }, plant: feet,
  reach: grips(START_BAR, [1, 0.1, 0.25]) };
// elbow pole: mostly down and a little back, so the elbows finish under the bar (elbow x +-0.375 m vs grip +-0.34 m,
// forearms ~7 deg off vertical seen from the front), elbow flexion 144 deg, shoulder plane negative (elbows behind the trunk)
const end = { ...endBody, reach: grips(END_BAR, [0.2, -1, -0.45]) };

// Mistake: lean and heave. The torso swings ~40 deg back, the shoulders shrug, the bar lands low on the chest.
const misBody = { root: { at: rootOnSeat(SEAT, -28), tilt: -28 }, trunk: -10, neck: -4, scap: { elev: 3, pro: 0 }, plant: feet };
const lmM = landmarksOf({ ...misBody, shoulder: { flex: 0 } }, H);
const mp = chestPt(lmM, 0.9);
const MIS_BAR = [0, mp[1], mp[2] + BAR_R + 0.004];

// Knee pad: roller on the thigh top just behind the knee (end pose), stays put.
const PAD_AT = lmE['thighTop.r'];
const PAD = { at: [0, PAD_AT[1], PAD_AT[2]], r: 0.055 };

// cable from the bar centre to its tangent on the back of the head pulley (side-view plane y/z)
function headTangent(b) {
  const dz = b[2] - HEAD.z, dy = b[1] - HEAD.y, D = Math.hypot(dz, dy), a0 = Math.atan2(dy, dz), al = Math.acos(HEAD.r / D);
  const c = [a0 + al, a0 - al].map(a => [0, HEAD.y + HEAD.r * Math.sin(a), HEAD.z + HEAD.r * Math.cos(a)]);
  return c[0][2] < c[1][2] ? c[0] : c[1];
}
const barOf = lm => [0, lm.grips[1] + GRIP_DROP, lm.grips[2]];
const cableLen = b => Math.hypot(b[1] - HEAD.y, b[2] - HEAD.z);
const LIFT0 = 0.03;                                    // the stack is lifted 3 cm at the start (tension on)

export default {
  id: 'lat_pulldown', name: 'Lat Pulldown', view: 'side', facing: 'right',
  camera: { fit: true },
  poses: { start, end },
  equipment: [
    { type: 'floor', from: -0.5, to: 1.3 },
    // frame: column uprights, boom to the head pulley, base rail
    // base rail, split where the feet stand (heel z 0.38, toe z 0.63) so the soles read as ON the floor
    ...[[-0.22, 0.30], [0.66, COL.z1]].map(([a, b]) => ({ type: 'box', at: [0, 0.022, (a + b) / 2], w: b - a, h: 0.044, rc: 1, z: 'center' })),
    { type: 'box', at: [0, COL.h + 0.03, (HEAD.z - 0.08 + COL.z1 + 0.03) / 2], w: COL.z1 + 0.03 - HEAD.z + 0.08, h: 0.06, rc: 1.5 },   // boom
    { type: 'line', cls: 'eq', pts: [[0, COL.h, HEAD.z], [0, HEAD.y, HEAD.z]] },       // head pulley hanger
    { type: 'line', cls: 'eq', pts: [[0, COL.h, COLP.z], [0, COLP.y, COLP.z]] },       // column pulley hanger
    ...[COL.z0, COL.z1].map(z => ({ type: 'box', at: [0, COL.h / 2, z], w: 0.05, h: COL.h, rc: 1 })),
    { type: 'seat', at: [0, SEAT_TOP, 0.02], len: 0.42 },
    // knee pad: post up the body mid-plane (behind the near leg), roller over the thighs
    { type: 'kneePad', at: PAD.at, r: PAD.r, normal: [0, 1, 0], postTo: [0, 0.26, 0.03], z: 'center' },
    { type: 'kneePad', at: PAD.at, r: PAD.r, normal: [0, 1, 0], z: 'front' },
    { type: 'pulley', at: [0, HEAD.y, HEAD.z], r: HEAD.r },
    { type: 'pulley', at: [0, COLP.y, COLP.z], r: COLP.r },
    { type: 'cable', from: [0, HEAD.y + HEAD.r, HEAD.z], to: [0, COLP.y + COLP.r, COLP.z], z: 'back' },
    // stack and its cable (own entry: the engine keys items by entry index + type, so the two cables must not share one)
    (lm, ctx) => {
      const lift = LIFT0 + cableLen(barOf(lm)) - cableLen(barOf(ctx.start));
      return [
        { type: 'stack', base: [0, 0, STACK_Z], plates: 16, load: 8, w: 0.16, lift, rods: false, part: 'stack' },
        { type: 'cable', from: [0, COLP.y, STACK_Z], to: [0, 0.06 + 16 * 0.025 + lift, STACK_Z], z: 'back', part: 'stack' },
      ];
    },
    // bar: centre section end-on (circle) + the near dropped end, which in side view is a vertical run straight down from
    // the fist to the end cap. It is nearer the camera than the forearm, so it is drawn in front (drop 0 on the latBar
    // stops the primitive drawing that end as a lone ring behind the body).
    (lm) => {
      const b = barOf(lm), top = b[1] - 0.03, bot = b[1] - BAR_DROP - BAR_R;
      return [
        { type: 'latBar', at: b, width: BAR_W, straight: BAR_STRAIGHT, drop: 0, z: 'mid', part: 'bar' },
        { type: 'box', at: [0, (top + bot) / 2, b[2]], w: 2 * BAR_R, h: top - bot, rc: 9, cls: 'eq-solid', z: 'front', part: 'bar' },
        { type: 'cable', from: b, to: headTangent(b), z: 'mid', part: 'bar' },
      ];
    },
    // lean construction rays (correct plate only): dashed plumb line up from the hip joint and the trunk axis, over the figure
    (lm, ctx) => (ctx.pose === 'end' && !ctx.mistake ? [
      { type: 'line', cls: 'eq-line datum', pts: [HIP_E, LEAN_UP], z: 'front' },
      { type: 'line', cls: 'eq-line', pts: [HIP_E, LEAN_AX], z: 'front' },
    ] : null),
    ...[-0.05, 0.05].map(o => ({ type: 'line', cls: 'eq-thin', pts: [[0, 0.06, STACK_Z + o], [0, 1.95, STACK_Z + o]] })),   // guide rods
  ],
  checks: [
    { landmark: 'seat', plane: { point: SEAT, normal: [0, 1, 0] }, pose: 'all', tol: 0.5 },                  // pelvis ON the seat
    { landmark: 'thighTop.r', plane: { point: PAD.at, normal: [0, 1, 0] }, pose: 'all', tol: 1 },           // thigh under the roller
    { landmark: 'thighUnder.r', above: { point: SEAT, normal: [0, 1, 0] }, pose: 'all' },
  ],
  ghosts: { count: 3, parts: ['arm.r', 'bar'] },
  trace: { point: 'grip.r', trim: [10, 12] },
  // Arc = torso lean. The wide-grip arm action is mostly frontal-plane adduction, so any shoulder arc in this side
  // view is a projection artefact (the start-to-end upper-arm sweep draws as 176 deg); the lean is the true sagittal number.
  // Drawn at the hip joint between the plumb line (up) and the trunk axis (to the shoulder joint): 15.7 deg (tilt -10, trunk -3).
  measure: { vertex: 'hip.r', from: 'up', to: 'shoulder.r', radius: 40, title: 'Lean back', value: 'about 15°', expect: 15, box: { left: 16, top: 198 } },
  callouts: [
    { key: 'chest', text: 'Bar to<br>chest', anchor: 'sternum', box: { left: 150, top: 164 }, cue: 'Lean back slightly and pull the bar past the face to the top of the chest.' },
    { key: 'elbows', text: 'Elbows<br>down', anchor: 'elbow.r', box: { left: 10, top: 244 }, cue: 'Drive the elbows down and back to the sides.' },
    { key: 'down', text: 'Shoulders<br>down', anchor: 'shoulderTop.r', box: { left: 10, top: 148 }, cue: 'Keep the shoulders pulled down, away from the ears.' },
  ],
  tempo: [{ phase: 'Pull', s: 1, move: true }, { phase: 'Hold', s: 0.5 }, { phase: 'Return', s: 2, move: true }, { phase: 'Rest', s: 0.5 }],
  mistake: {
    pose: { ...misBody, reach: grips(MIS_BAR, [0.9, -1, -0.3]) },
    parts: ['torso', 'head', 'arm.r', 'bar'],   // far arm left out: in side view it doubles the near arm's outline
    guides: [
      // the cable to the bar the faulty hands hold (the engine masks the bar itself under the fist)
      { kind: 'dashed', pts: [MIS_BAR, headTangent(MIS_BAR)] },
      // the swing: from the correct upper back to the faulty one, above the shoulders, under the shrug arrow
      { kind: 'arc-arrow', center: 'hip.r', r: 70, a0: -113, a1: -140 },
      { kind: 'arrow', from: { at: 'shoulderTop.r', off: [0, -3] }, to: { at: 'shoulderTop.r', off: [0, -17] } },
    ],
    tells: [
      { key: 'swing', text: 'Swing<br>back', anchor: 'backUpper', box: { left: 8, top: 211 }, cue: 'The torso swings far back to heave the weight down.' },
      { key: 'shrug', text: 'Shrug', anchor: { at: 'shoulderTop.r', off: [0, -19] }, box: { left: 8, top: 140 }, cue: 'The shoulders creep up toward the ears.' },
    ],
  },
  alt: 'Lat pulldown, side view. Seated with the thighs under the knee pad, the wide bar is pulled from straight arms overhead down in front of the face to the upper chest, with a slight lean back.',
};
