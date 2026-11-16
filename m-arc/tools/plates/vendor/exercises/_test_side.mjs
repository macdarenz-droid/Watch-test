// ENGINE TEST (not a real exercise card): side view, seated on a bench, both hands on a cable V-handle.
// Modelled on a seated cable row so contacts can be checked: pelvis ON the bench, feet ON the footplate,
// hands ON the handle, cable straight from the handle to the low pulley.
// Form: ACE Seated Row (https://www.acefitness.org/resources/everyone/exercise-library/48/seated-row/): sit tall,
// knees slightly bent, pull the handle to the stomach with the elbows close to the ribs, squeeze the shoulder blades.
// Mistake: M/ARC research lib_seated_cable_row.json (Olaben: rocking the torso; TZFIT: shoulders creep up).
import { rootOnSeat, footplateFace } from '../engine/index.mjs';
const H = 1.75;
const BENCH_TOP = 0.42;                                   // seated-row bench pad top (m)
const SEAT = [0, BENCH_TOP, -0.044];                      // buttock contact on the pad, under the hip-joint centre
const PLATE = { at: [0.11, 0.30, 0.87], angle: 20 };      // footplate contact (mid-sole), top leaning 20 deg away
const PLATE_R = { ...PLATE, at: [-0.11, 0.30, 0.87] };
const N = footplateFace(PLATE).normal;                   // face normal, toward the user
const feet = { l: { at: PLATE.at, normal: N, toe: [0, 1, 0] }, r: { at: PLATE_R.at, normal: N, toe: [0, 1, 0] } };
const PULLEY = [0, 0.33, 1.04];
const grip = (y, z) => ({ l: { at: [0.075, y, z], pole: [0.3, -1, -0.2] }, r: { at: [-0.075, y, z], pole: [-0.3, -1, -0.2] } });
const START_G = [0.72, 0.665], END_G = [0.72, 0.17];
const start = { root: { at: rootOnSeat(SEAT, 4), tilt: 4 }, trunk: 2, scap: { pro: 3 }, plant: feet, reach: grip(...START_G) };
const end = { root: { at: rootOnSeat(SEAT, 0), tilt: 0 }, trunk: 0, scap: { pro: -3 }, plant: feet,
  reach: { l: { at: [0.075, ...END_G], pole: [0.2, -0.4, -1] }, r: { at: [-0.075, ...END_G], pole: [-0.2, -0.4, -1] } } };
const toward = g => { const d = [PULLEY[0] - g[0], PULLEY[1] - g[1], PULLEY[2] - g[2]], L = Math.hypot(...d); return d.map(v => v / L); };
const attach = g => { const t = toward(g); return [g[0] + t[0] * 0.22, g[1] + t[1] * 0.22, g[2] + t[2] * 0.22]; };
export default {
  id: '_test_side', name: 'Engine test · side', view: 'side', facing: 'right',
  camera: { x0: 96, y0: 339 },
  poses: { start, end },
  equipment: [
    { type: 'floor', from: -0.62, to: 1.5 },
    { type: 'bench', at: [0, BENCH_TOP, 0.05], len: 1.2 },
    { type: 'rowFootplate', ...PLATE, at: [0, PLATE.at[1], PLATE.at[2]] },
    (lm, ctx) => {
      const g = lm.grips, a = attach(g), rest = attach(ctx.start.grips);
      return [
        { type: 'cableColumn', base: [0, 0, 1.25], pulley: { at: PULLEY, r: 0.045 }, to: a, rest, wrap: -1, part: 'column' },
        { type: 'vHandle', at: g, toward: toward(g), part: 'handle' },
      ];
    },
  ],
  checks: [
    { landmark: 'seat', plane: { point: SEAT, normal: [0, 1, 0] }, pose: 'all', tol: 0.5 },          // pelvis ON the bench
    { landmark: 'thighUnder.r', above: { point: SEAT, normal: [0, 1, 0] }, pose: 'all' },              // thigh never inside the bench
  ],
  ghosts: { count: 3, parts: ['arm.r', 'handle'] },
  trace: { point: 'grip.r', trim: [10, 12] },
  measure: { vertex: 'shoulder.r', from: { at: 'elbow.r', pose: 'start' }, to: 'elbow.r', title: 'Shoulder', value: 'reach to squeeze' },
  datum: [{ x: 'hip.r', from: 'hip.r', to: 60 }],
  callouts: [
    { key: 'tall', text: 'Chest tall', anchor: 'sternum', cue: 'Sit tall. The torso stays still and upright.' },
    { key: 'elbows', text: 'Elbows back', anchor: 'elbow.r', cue: 'Drive the elbows back, close to the ribs.' },
    { key: 'down', text: 'Shoulders down', anchor: 'shoulderTop.r', cue: 'Squeeze the shoulder blades; keep them away from the ears.' },
  ],
  tempo: [{ phase: 'Pull', s: 1, move: true }, { phase: 'Hold', s: 0.5 }, { phase: 'Return', s: 2, move: true }, { phase: 'Rest', s: 0.5 }],
  mistake: {
    pose: { root: { at: rootOnSeat(SEAT, -12), tilt: -12 }, scap: { elev: 4, pro: -1 } },
    guides: [
      { kind: 'arc-arrow', center: 'hip.r', r: 58, a0: -80, a1: -104 },
      { kind: 'arrow', from: { at: 'shoulderTop.r', off: [0, -3] }, to: { at: 'shoulderTop.r', off: [0, -17] } },
    ],
    tells: [
      { key: 'rock', text: 'Rocking back', anchor: 'backUpper', cue: 'The torso rocks back to finish the pull.' },
      { key: 'shrug', text: 'Shrug', anchor: { at: 'shoulderTop.r', off: [0, -19] }, cue: 'The shoulders creep up toward the ears.' },
    ],
  },
  alt: 'Engine test. Side view, seated on a bench, feet on a footplate, pulling a V-handle on a low cable to the stomach.',
};
