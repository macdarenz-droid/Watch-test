// ENGINE TEST (not a real exercise card): standing front view with dumbbells. Re-draws the approved reference
// plate (Dumbbell Lateral Raise) through the generic engine, so the look can be compared 1:1 with ref-src.
// Form: ACE Lateral Raise (https://www.acefitness.org/resources/everyone/exercise-library/26/lateral-raise/):
// raise until the arms are level with the shoulders, slight elbow bend, elbows lead, shoulders down.
// Mistake tells: M/ARC research lib_dumbbell_lateral_raise.json (ACE; PMC7503819 thumbs-down study).
const H = 1.75, ROOT = [0, 0.530 * H - 0.002, 0];
const feet = { l: { at: [0.062 * H, 0, 0.044 * H] }, r: { at: [-0.062 * H, 0, 0.044 * H] } };
const start = { root: { at: ROOT }, plant: feet, shoulder: { abd: 10, rot: 0 }, elbow: 14 };
const end = { root: { at: ROOT }, plant: feet, shoulder: { abd: 88, rot: -34 }, elbow: 14 };   // rot -34 + elbow 14 = forearm 8 deg below the upper arm (elbows lead)
export default {
  id: '_test_front', name: 'Engine test · front', view: 'front',
  poses: { start, end },
  equipment: [
    { type: 'floor', from: -0.51, to: 0.51 },
    lm => [{ type: 'dumbbell', at: lm['grip.l'], part: 'arm.l' }, { type: 'dumbbell', at: lm['grip.r'], part: 'arm.r' }],
  ],
  ghosts: { count: 4, parts: ['arm.r'] },
  trace: { point: 'grip.r', trim: [12, 17] },
  measure: { vertex: 'shoulder.l', from: { at: 'elbow.l', pose: 'start' }, to: 'elbow.l', title: 'Shoulder', value: 'up to 90°', expect: 78 },
  datum: [{ y: 'shoulder.r', from: 12, to: 'shoulder.r' }],
  callouts: [
    { key: 'shrug', text: 'No shrug', anchor: 'trap.l', cue: 'The upper traps stay quiet. No shrug.' },
    { key: 'elbows', text: 'Elbows lead', anchor: { at: 'elbow.l', off: [0, -5.4] }, cue: 'The elbows lead, the hands follow.',
      guide: ['elbow.l', { along: ['shoulder.l', 'elbow.l'], t: 2.2 }] },
    { key: 'stop', text: 'Stop at<br>shoulder height', anchor: { at: 'shoulder.r', off: [-110, 0] }, cue: 'Stop when the arms are level with the shoulders.', prefer: 'above' },
  ],
  tempo: [{ phase: 'Lift', s: 1, move: true }, { phase: 'Hold', s: 0.5 }, { phase: 'Lower', s: 2, move: true }, { phase: 'Rest', s: 0.5 }],
  mistake: {
    pose: { scap: { elev: 5 }, shoulder: { abd: 88, rot: -75 } },   // dip is shown by its arrow only
    parts: ['torso', 'arm.r'],
    guides: [
      { kind: 'arrow', from: { at: 'trap.l', off: [6, -4] }, to: { at: 'trap.l', off: [6, -19] } },
      { kind: 'arrow', from: { at: 'knee.l', off: [14, -14] }, to: { at: 'knee.l', off: [14, 8] } },
      { kind: 'arc-arrow', center: 'grip.r', r: 15, a0: -25, a1: -160 },
    ],
    tells: [
      { key: 'shrug', text: 'Shrug', anchor: { at: 'trap.l', off: [6, -20] }, cue: 'The shoulders shrug toward the ears.' },
      { key: 'dip', text: 'Dip', anchor: { at: 'knee.l', off: [18, -2] }, cue: 'The knees dip to swing it up.' },
      { key: 'thumbs', text: 'Thumbs<br>down', anchor: { at: 'grip.r', off: [0, -17] }, cue: 'Thumbs turn down at the top.' },
    ],
  },
  alt: 'Engine test. Standing front view, dumbbell raised out to the side from the thighs to shoulder height.',
};
