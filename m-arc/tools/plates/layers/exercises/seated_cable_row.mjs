// Seated cable row (low pulley, V-handle), side view, figure faces the stack.
// View: side. Everything a coach checks (torso angle, elbow travel past the ribs, scapular protraction to retraction,
// the rock-back cheat) happens in the sagittal plane.
// Form sources:
//  ACE Seated Row (acefitness.org/resources/everyone/exercise-library/48/seated-row/): narrow handle, knees bent,
//   straight back; lift the chest and pull the elbows back close to the rib cage until the handle touches the front
//   of the stomach; pause 1 s; slowly straighten the arms.
//  NSCA, Essentials of Strength Training and Conditioning, 4th ed. (Haff & Triplett 2016), ch. 15, low-pulley seated
//   row: erect torso, knees slightly flexed, arms fully extended at the start; handle to the lower chest / upper
//   abdomen; torso stays erect, no rocking. (Book, not re-read online for this plate.)
//  Bodybuilding.com Seated Cable Rows and REP Fitness "How to do a seated cable low row": torso ~90 deg to the legs,
//   torso stationary, arms close to the sides until the hands reach the abdomen; do not swing or rock (low-back risk).
//  M/ARC research lib_seated_cable_row (ACE, Olaben, TZFIT): torso lean -5..+5 deg at the finish; no shrug; the
//   classic error is rocking the torso back to swing the weight.
import { rootOnSeat } from '../engine/index.mjs';
const H = 1.75;
const SEAT_TOP = 0.45;                                   // row-bench pad top: commercial low-row benches 43-48 cm
const SEAT = [0, SEAT_TOP, -0.044];                      // buttock contact (the HJC sits 4.4 cm in front of it)
const PLATE_ANGLE = 20;                                  // footrest face leans 20 deg away at the top
const FOOT_Y = 0.46, FOOT_Z = 0.925;                     // mid-sole contact: knees 29 deg bent at the reach, 21 at the finish
const N = [0, Math.sin(PLATE_ANGLE * Math.PI / 180), -Math.cos(PLATE_ANGLE * Math.PI / 180)];
const feet = { l: { at: [0.10, FOOT_Y, FOOT_Z], normal: N, toe: [0, 1, 0] }, r: { at: [-0.10, FOOT_Y, FOOT_Z], normal: N, toe: [0, 1, 0] } };
// Low pulley at the tower foot. z 1.17 puts its inner tangent (1.215) on the top pulley's near tangent (1.25 - 0.035),
// so the run up the tower is one straight, connected cable.
const PULLEY = [0, 0.44, 1.17];
const COLUMN = [0, 0, 1.25];                            // stack tower: pulley sits at its foot
const STACK = { plates: 12 };                            // 12 x 5 kg: the resting stack top (36 cm) stays clear under the low pulley
const SEP = 0.075;                                       // V-handle grips 15 cm apart (neutral grip)

const rootAt = tilt => rootOnSeat(SEAT, tilt, H);
const grip = (y, z, pole) => ({ l: { at: [SEP, y, z], pole: [pole[0], pole[1], pole[2]] }, r: { at: [-SEP, y, z], pole: [-pole[0], pole[1], pole[2]] } });

// Start: arms straight at the reach, torso 8 deg forward from the hips with a neutral spine (no rounding),
// shoulder blades spread forward 4 cm. Handle at 74 cm, level with the lower ribs of the upright end pose.
const START_G = [0.74, 0.715];
const start = { root: { at: rootAt(8), tilt: 8 }, trunk: 0, neck: 0, scap: { elev: 0, pro: 4 }, plant: feet,
  reach: grip(...START_G, [0.25, -1, 0]) };
// End: torso vertical, handle on the upper belly (fist 1 cm off the abdomen, below the lower ribs), elbows past the
// back of the torso and close to the sides, shoulder blades squeezed back 4 cm and kept down.
const END_G = [0.765, 0.175];
const end = { root: { at: rootAt(0), tilt: 0 }, trunk: 0, neck: 0, scap: { elev: -0.5, pro: -4 }, plant: feet,
  reach: grip(...END_G, [0.12, -0.35, -1]) };

// Mistake: the lifter heaves the weight by swinging back. Pelvis rolls back 7 deg and the low back arches 5 deg, so
// the thorax ends 12 deg past vertical (limit: -5..+5); the legs push, knees 21 -> 8 deg; shoulders ride up 2.5 cm.
// Hands still reach the belly. (A bigger pelvic roll locks the knee and drops the thigh into the pad with the feet
// at this footrest distance, so the lean comes partly from the lumbar arch, as it does in the real heave.)
const M_TILT = -7, M_TRUNK = -5;
const mistakePose = { root: { at: rootAt(M_TILT), tilt: M_TILT }, trunk: M_TRUNK, scap: { elev: 2.5, pro: -2 },
  reach: grip(0.80, 0.075, [0.12, -0.35, -1]) };

const toward = g => { const d = [PULLEY[0] - g[0], PULLEY[1] - g[1], PULLEY[2] - g[2]], L = Math.hypot(...d); return d.map(v => v / L); };
const ring = g => { const t = toward(g); return [g[0] + t[0] * 0.22, g[1] + t[1] * 0.22, g[2] + t[2] * 0.22]; };

export default {
  id: 'seated_cable_row', name: 'Seated Cable Row', view: 'side', facing: 'right',
  camera: { x0: 116, y0: 339 },                          // reference scale; figure shifted right for the left labels
  poses: { start, end },
  equipment: [
    { type: 'floor', from: -0.66, to: 1.50 },
    { type: 'bench', at: [0, SEAT_TOP, 0.02], len: 1.1 },
    { type: 'rowFootplate', at: [0, FOOT_Y, FOOT_Z], angle: PLATE_ANGLE },
    (lm, ctx) => {
      const g = lm.grips;
      const col = (to, rest) => ({ type: 'cableColumn', base: COLUMN, pulley: { at: PULLEY, r: 0.045 }, to, rest, wrap: -1, stack: STACK, part: 'column' });
      const out = [col(ring(g), ring(ctx.start.grips)), { type: 'vHandle', at: g, toward: toward(g), part: 'handle' }];
      // Start pose: the engine compares start items with themselves (plate.mjs sE), so a moving handle is never drawn
      // dashed at the start. A 1 mm twin with the same keys (drawn nowhere) makes the real start handle and its cable
      // count as moving, so they render with the dashed .pose-start rules. Remove once plate.mjs compares with the end pose.
      if (ctx.pose === 'start') {
        const g2 = [g[0], g[1] + 0.001, g[2]];
        out.push(col(ring(g2), ring(g2)), { type: 'vHandle', at: g2, toward: toward(g2), part: 'handle' });
      }
      return out;
    },
  ],
  checks: [
    { landmark: 'seat', plane: { point: SEAT, normal: [0, 1, 0] }, pose: 'all', tol: 0.5 },          // pelvis ON the bench
    { landmark: 'thighUnder.r', above: { point: SEAT, normal: [0, 1, 0] }, pose: 'all' },              // thigh not in the pad
  ],
  ghosts: { count: 3, parts: ['arm.r', 'handle'] },
  trace: { point: 'grip.r', trim: [10, 12] },
  measure: { vertex: 'shoulder.r', from: { at: 'elbow.r', pose: 'start' }, to: 'elbow.r', radius: 30, title: 'Shoulder', value: 'about 90°', expect: 87, box: { left: 10, top: 222 } },
  datum: [{ x: 'hip.r', from: 'hip.r', to: 118 }],
  callouts: [
    { key: 'tall', text: 'Chest tall', anchor: 'sternum', cue: 'Sit tall; no rocking, the torso finishes upright.' },
    { key: 'elbows', text: 'Elbows<br>back', anchor: 'elbow.r', box: { left: 10, top: 176 }, cue: 'Drive the elbows back past the ribs, close to the body.' },
    { key: 'squeeze', text: 'Squeeze<br>blades', anchor: 'shoulder.r', box: { left: 10, top: 122 }, cue: 'Finish by squeezing the shoulder blades together, down, not up.' },
  ],
  tempo: [{ phase: 'Pull', s: 1, move: true }, { phase: 'Hold', s: 1 }, { phase: 'Return', s: 2, move: true }, { phase: 'Rest', s: 0.5 }],
  mistake: {
    pose: mistakePose,
    guides: [
      { kind: 'arc-arrow', center: 'hip.r', r: 62, a0: -84, a1: -110 },
    ],
    tells: [
      { key: 'swing', text: 'Swinging<br>back', anchor: 'head', box: { left: 10, top: 86 }, cue: 'The torso swings back past upright to heave the weight.' },
      { key: 'legs', text: 'Legs<br>push', anchor: 'knee.r', box: { left: 196, top: 290 }, cue: 'The knees straighten to shove the body back.' },
    ],
  },
  alt: 'Seated cable row, side view. Seated on a row bench, feet on the footrest with knees slightly bent, the lifter pulls a V-handle from straight arms to the upper belly, elbows back past the ribs, torso upright.',
};
