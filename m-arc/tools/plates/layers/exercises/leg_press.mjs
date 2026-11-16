// Leg press, 45-degree plate-loaded sled, side view (figure faces the sled, screen right).
// View: side. Knee depth, the hips staying on the pad and the sled path along the 45-degree rails are all sagittal.
// Form sources:
//  ACE Exercise Library, Seated Leg Press (acefitness.org/resources/everyone/exercise-library/154/seated-leg-press/,
//   page opened 2026-09-30): "positioning your back and sacrum (tailbone) flat against the machine's backrest", heels flat,
//   "bend in your knees is at approximately 90 degrees", extend to "a relaxed, extended position", do not "hyperextend
//   (lock-out) your knees"; avoid "lifting your butt off the seat pad or rounding out your low back". (ACE says toes
//   forward for the seated press; the 45-deg sled sources below say toes slightly out: 15 deg used.)
//  NASM Exercise Library, Leg Press (nasm.org/exercise-library/leg-press; listed by search, page not opened).
//  Lopes et al. 2020, "Muscle Activation and Kinematic Analysis during the Inclined Leg Press Exercise in Young
//   Females", IJERPH 17(22):8698, doi 10.3390/ijerph17228698: range 0 -> 90 deg knee flexion, "90 deg knee flexion
//   position (shinbone parallel to the floor)".
//  M/ARC research lib_leg_press (PureGym, ISSA, GymPT): knees 15 deg short of lockout at the top, about 90 deg at the
//   bottom; glutes and lower back stay on the pad; faults: hard lockout, hips curling off the pad at the bottom.
//   PureGym 45-degree leg press: feet "shoulder-width apart on the footplate, with your toes pointed slightly outward".
// Not verified against a manufacturer drawing: the 30-deg back pad and the 15-deg footplate tilt below are inferred.
// Geometry decisions (numbers checked by the engine report, see the return notes):
//  Sled rails 45 deg. Footplate face tilted 15 deg more upright than square to the rails (many sleds have an angled
//   or curved plate); with a square plate the heels need 45 deg of dorsiflexion at 90 deg knee, which lifts them.
//  Back pad 30 deg above horizontal (pelvis tilt -60, neutral spine): at the bottom the hip is ~117 deg flexed with a
//   neutral pelvis, the edge of normal passive hip flexion (~120 deg), which is why deeper than 90 deg knee rolls the
//   pelvis off the pad.
//  Bottom: knee 90, shin 3 deg below horizontal (Lopes 2020: shin parallel to the floor). Top: knee ~15 (not locked).
import { legPressFace, landmarksOf } from '../engine/index.mjs';
const H = 1.75, R = Math.PI / 180;
const TILT = -60;                                        // pelvis/back recline: back pad 30 deg above horizontal
const HIP = [0, 0.50, 0];                                // hip-joint centre (seat of a 45-deg sled, hip ~50 cm up)
const PHI = 15;                                          // footplate tilt vs square to the rail
const OFF = 0.22;                                        // plate face 22 cm above the rail line (engine default look)
const SOLE_UP = 0.10;                                    // feet mid-plate: 10 cm above the face reference point
const FOOT_X = 0.17;                                     // feet about shoulder-width (sole centres 34 cm apart; biacromial ~39 cm at 175 cm)
const TOE_OUT = 15;                                      // toes slightly out, knees track the toes (PureGym, via lib_leg_press)
// toe direction on the plate, turned out by TOE_OUT about the plate normal (plate normal has no x part)
const toeOf = (up, sx) => { const o = TOE_OUT * R; return [sx * Math.sin(o), up[1] * Math.cos(o), up[2] * Math.cos(o)]; };

// Build the bottom (end) position from the joint angles, then fit the rail through it.
const SHIN = -3;                                         // knee -> ankle, deg from horizontal
const TH = (SHIN + 90) * R, S = SHIN * R, LT = 0.245 * H, LS = 0.246 * H;
const kneeB = [0, HIP[1] + LT * Math.sin(TH), HIP[2] + LT * Math.cos(TH)];
const ankleB = [0, kneeB[1] + LS * Math.sin(S), kneeB[2] + LS * Math.cos(S)];
const LP0 = { rail: { from: [0, 0, 0], angle: 45 }, offset: OFF, plate: { tilt: PHI } };
const F0 = legPressFace(LP0, 0), N = F0.normal, UP = F0.up;
const soleB = [0, ankleB[1] - N[1] * 0.039 * H + UP[1] * 0.044 * H, ankleB[2] - N[2] * 0.039 * H + UP[2] * 0.044 * H];
const DIR = [0, Math.SQRT1_2, Math.SQRT1_2], NUP = [0, DIR[2], -DIR[1]];
const faceB = [0, soleB[1] - UP[1] * SOLE_UP, soleB[2] - UP[2] * SOLE_UP];
const BACK_T = 0.62;                                     // rail line starts 62 cm (along the rail) behind the bottom sled spot
const FROM = [0, faceB[1] - NUP[1] * OFF - DIR[1] * BACK_T, faceB[2] - NUP[2] * OFF - DIR[2] * BACK_T];
const LP = { rail: { from: FROM, angle: 45, length: 1.35 }, offset: OFF, plate: { tilt: PHI, h: 0.7 } };
// bottom 8 mm deeper than the sagittal build: the shoulder-width, toes-out legs open the knee ~1 deg, this brings it back to 90
const T_END = BACK_T - 0.008, T_START = BACK_T + 0.242; // sled travel: 25 cm between ~90 deg and ~15 deg knee

const feetAt = tv => {
  const fc = legPressFace(LP, tv), c = [0, fc.at[1] + fc.up[1] * SOLE_UP, fc.at[2] + fc.up[2] * SOLE_UP];
  return { l: { at: [FOOT_X, c[1], c[2]], normal: fc.normal, toe: toeOf(fc.up, 1) }, r: { at: [-FOOT_X, c[1], c[2]], normal: fc.normal, toe: toeOf(fc.up, -1) } };
};
// sled travel of any pose, read back from the foot (so ghosts and the mistake move the sled with the feet)
const travelOf = lm => {
  const s = lm['sole.r'], fc = legPressFace(LP, 0), p = [0, s[1] - fc.up[1] * SOLE_UP, s[2] - fc.up[2] * SOLE_UP];
  return (p[1] - fc.at[1]) * DIR[1] + (p[2] - fc.at[2]) * DIR[2];
};
// footplate outline (world) at a sled travel, same box as the engine's legPress45 plate (70 cm x 3.5 cm)
const plateOutline = tv => {
  const fc = legPressFace(LP, tv), t = 0.035, lo = -0.7 * 0.35, hi = 0.7 * 0.65;
  const P = (u, d) => [0, fc.at[1] + fc.up[1] * u - fc.normal[1] * d, fc.at[2] + fc.up[2] * u - fc.normal[2] * d];
  return [P(lo, 0), P(hi, 0), P(hi, t), P(lo, t), P(lo, 0)];
};
// hands on the side handles beside the hips
const HANDLE = [0.25, HIP[1] + 0.03, HIP[2] + 0.10];
const hands = { l: { at: HANDLE, pole: [1, 0.25, 0] }, r: { at: [-HANDLE[0], HANDLE[1], HANDLE[2]], pole: [-1, 0.25, 0] } };   // elbows out to the sides

const base = { root: { at: HIP, tilt: TILT }, trunk: 0, neck: 5, reach: hands };
const start = { ...base, plant: feetAt(T_START) };
const end = { ...base, plant: feetAt(T_END) };

// Pads: back pad tangent to the upper back and the buttock (correct pose), seat pan under the pelvis.
const LM = landmarksOf(end, H);
const PAD_U = (() => { const d = [0, LM.backUpper[1] - LM.buttock[1], LM.backUpper[2] - LM.buttock[2]], l = Math.hypot(...d); return d.map(v => v / l); })();
const PAD_N = [0, -PAD_U[2], PAD_U[1]];                  // back-pad face normal, toward the lifter
const SEAT_RISE = 20;
// frame: back-pad post under the middle of the pad, seat post under the pan, base from the pad post to the rail foot
const PAD_MID = [0, LM.buttock[1] + PAD_U[1] * 0.30 - PAD_N[1] * 0.07, LM.buttock[2] + PAD_U[2] * 0.30 - PAD_N[2] * 0.07];
const PAD_POST = [0, PAD_MID[1], PAD_MID[2]];
const SEAT_POST = [0, LM.buttock[1] - 0.075, LM.buttock[2] + 0.12];
const BASE_Z0 = PAD_POST[2] - 0.10;                                    // seat pan rises 20 deg toward the sled (bucket seat)
// Mistake: butt wink. The sled goes past 90 deg; the pelvis rolls back 20 deg about the lumbar pivot (lumbar
// flexion 20 deg), the thorax stays on the pad, so the sacrum and buttock peel off it.
const M_ROLL = 25;
const lumbarRot = (() => {
  const L = LM.lumbar, t = -M_ROLL * R, v = [0, HIP[1] - L[1], HIP[2] - L[2]];   // rotate the HJC about the lumbar pivot
  const c = Math.cos(t), s = Math.sin(t);
  // rotX(+a) turns +y toward +z in this engine's convention for tilt (+ forward); a posterior roll is negative
  return [0, L[1] + v[1] * c - v[2] * s, L[2] + v[1] * s + v[2] * c];
})();
// ...and at that depth the ankles run out of bend: the heels peel off the plate, the foot pivots on the ball.
const HEEL_LIFT = 12;
const heelsUp = (tv, deg) => {
  const fc = legPressFace(LP, tv), a = deg * R, n = fc.normal, t = fc.up;
  const ball = [0, fc.at[1] + t[1] * (SOLE_UP + 0.036 * H), fc.at[2] + t[2] * (SOLE_UP + 0.036 * H)];   // ball 3.6% H ahead of mid-sole
  const t2 = t.map((v, i) => v * Math.cos(a) - n[i] * Math.sin(a)), n2 = n.map((v, i) => v * Math.cos(a) + t[i] * Math.sin(a));
  return { l: { at: [FOOT_X, ball[1], ball[2]], normal: n2, toe: toeOf(t2, 1), ref: 'ball' }, r: { at: [-FOOT_X, ball[1], ball[2]], normal: n2, toe: toeOf(t2, -1), ref: 'ball' } };
};
const mistakePose = { root: { at: lumbarRot, tilt: TILT - M_ROLL }, trunk: M_ROLL, plant: heelsUp(T_END, HEEL_LIFT) };   // same sled depth; the pelvis rolls toward the plate

export default {
  id: 'leg_press', name: 'Leg Press (45°)', view: 'side', facing: 'right',
  camera: { fit: { left: 10, right: 10, top: 40, bottom: 18 }, maxScale: 1 },
  poses: { start, end },
  equipment: [
    { type: 'floor', from: -0.80, to: 1.30 },
    { type: 'box', at: [0, 0.02, (BASE_Z0 + FROM[2] - 0.03) / 2], w: FROM[2] - 0.03 - BASE_Z0, h: 0.04 },     // frame rail on the floor, up to the sled's own base bar
    { type: 'box', at: [0, PAD_POST[1] / 2 + 0.02, PAD_POST[2]], w: 0.05, h: PAD_POST[1] - 0.04 },            // back-pad post
    { type: 'box', at: [0, SEAT_POST[1] / 2 + 0.02, SEAT_POST[2]], w: 0.05, h: SEAT_POST[1] - 0.04 },         // seat post
    { type: 'line', cls: 'eq', pts: [HANDLE, [0, HANDLE[1] - 0.10, HANDLE[2] - 0.02]], z: 'back' },         // handle arm
    { type: 'backPad', surface: [LM.backUpper, LM.buttock], len: 0.95, below: 0.02, post: false },
    // seat pan: under the pelvis, square to the back pad, carrying the buttock
    { type: 'backPad', at: [0, LM.buttock[1] - 0.004, LM.buttock[2]], angle: 90 + SEAT_RISE, len: 0.34, below: 0.30, post: false },
    (lm, ctx) => [
      { type: 'legPress45', ...LP, travel: travelOf(lm), part: 'sled' },
      // Engine workaround: the start layer never draws moving equipment (plate.mjs compares the start eq with itself),
      // so the start footplate is added to the end pose as a thin outline.
      ...(ctx.pose === 'end' ? [{ type: 'line', cls: 'eq-thin', pts: plateOutline(T_START), z: 'back' }] : []),
    ],
    { type: 'pulley', at: HANDLE, r: 0.018, z: 'mid' },
  ],
  checks: [
    { landmark: 'buttock', plane: { point: LM.buttock, normal: PAD_N }, pose: 'end', tol: 1 },
    { landmark: 'backUpper', plane: { point: LM.backUpper, normal: PAD_N }, pose: 'all', tol: 1 },
    { landmark: 'buttock', above: { point: [0, LM.buttock[1] - 0.004, LM.buttock[2]], normal: [0, Math.cos(SEAT_RISE * R), -Math.sin(SEAT_RISE * R)] }, pose: 'all' },   // not inside the seat pan
    { landmark: 'thighUnder.r', above: { point: [0, LM.buttock[1] - 0.004, LM.buttock[2]], normal: [0, Math.cos(SEAT_RISE * R), -Math.sin(SEAT_RISE * R)] }, pose: 'all' },
  ],
  ghosts: { count: 3, parts: ['leg.r'] },
  trace: { point: 'heel.r', trim: [6, 8] },
  measure: { vertex: 'knee.r', from: 'hip.r', to: 'ankle.r', radius: 26, title: 'Knee', value: 'about 90° bend', expect: 90, prefer: 'below' },
  callouts: [
    { key: 'back', text: 'Hips<br>down', anchor: 'sacrum', box: { left: 10, top: 284 }, cue: 'Keep the hips and low back pressed into the pad the whole time.' },
    { key: 'soft', text: 'Soft knees', anchor: { at: 'knee.r', pose: 'start' }, cue: 'Press until the legs are almost straight; never snap the knees locked.' },
    { key: 'heels', text: 'Heels down', anchor: { at: 'heel.r', pose: 'end' }, box: { left: 238, top: 118 }, cue: 'Push through the whole foot; the heels stay flat on the plate.' },
  ],
  tempo: [{ phase: 'Lower', s: 2, move: true }, { phase: 'Pause', s: 0.5 }, { phase: 'Press', s: 1, move: true }, { phase: 'Rest', s: 0.5 }],
  mistake: {
    pose: mistakePose,
    parts: ['torso', 'leg.r', 'leg.l'],
    guides: [
      { kind: 'arrow', from: { at: 'buttock', pose: 'end' }, to: { at: 'buttock', pose: 'mistake', off: [3, -6] } },
      // the faulty back contour: backMid stays on the pad, the sacrum and buttock peel off it (6.4 and 7.9 cm)
      { kind: 'line', smooth: true, pts: [{ at: 'backMid', pose: 'mistake' }, { at: 'sacrum', pose: 'mistake' }, { at: 'buttock', pose: 'mistake' }] },
    ],
    tells: [
      // one fault, posterior pelvic tilt at the bottom (ACE: "avoid lifting your butt off the seat pad or rounding out your low back";
      // ISSA: lowering the sled too far lifts the buttocks and lower back off the pad)
      { key: 'lift', text: 'Hips<br>lift off', anchor: { at: 'sacrum', pose: 'mistake' }, box: { left: 10, top: 284 }, cue: 'Too deep; the hips and low back peel off the pad.' },
      // a separate fault, frontal plane so not drawn in this side view (ISSA: "Knees Collapse Inwards")
      { key: 'cave', text: 'Knees cave', anchor: 'knee.r', cue: 'The knees fall in toward each other.' },
      { key: 'heels', text: 'Heels lift', anchor: 'heel.r', cue: 'The heels peel off the plate.' },
    ],
  },
  alt: 'Leg press on a 45 degree sled, side view. Reclined against the back pad, feet mid-plate, the sled lowers along the rails until the knees reach about 90 degrees, with the hips staying on the pad, then presses back to almost straight legs.',
};
