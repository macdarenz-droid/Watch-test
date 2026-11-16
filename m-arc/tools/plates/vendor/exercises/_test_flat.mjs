// ENGINE TEST (not a real exercise card): the flat palm (LIB-26, spec `hand: 'flat'`). Side view, a high plank on
// flat palms: arms straight, the wrists extended so the palms lie on the floor, toes on the floor. The end pose rocks
// forward over the hands; the Mistake puts the hands too far forward (shoulders behind the wrists), so the moving flat palm
// is outlined in the Mistake view.
// Each pose is solved (Newton, finite differences) so the wrist sits at the forearm's distal radius above the floor
// (the palm's straight underside on the floor) and the toe tips on TOE_Z.
import { landmarksOf, RADII } from '../engine/index.mjs';

const H = 1.75;
const WRIST_Y = RADII.fore[2] * H;          // the flat palm's underside is RADII.fore[2] below the wrist
const TOE_Z = -1.0;

function solve(p0, make, res) {
  const keys = Object.keys(p0), p = { ...p0 }, f = q => res(landmarksOf(make(q), H));
  for (let it = 0; it < 30; it++) {
    const r = f(p); if (Math.hypot(...r) < 1e-9) break;
    const J = keys.map(k => f({ ...p, [k]: p[k] + 1e-6 }).map((v, i) => (v - r[i]) / 1e-6));
    const A = keys.map((_, i) => [...keys.map((_, j) => J[j][i]), -r[i]]);
    for (let c = 0; c < keys.length; c++) {
      let m = c; for (let i = c + 1; i < keys.length; i++) if (Math.abs(A[i][c]) > Math.abs(A[m][c])) m = i;
      [A[c], A[m]] = [A[m], A[c]];
      for (let i = 0; i < keys.length; i++) if (i !== c) { const k = A[i][c] / A[c][c]; for (let j = c; j <= keys.length; j++) A[i][j] -= k * A[c][j]; }
    }
    keys.forEach((k, i) => { p[k] += A[i][keys.length] / A[i][i]; });
  }
  return p;
}
// forward: the arm's angle ahead of plumb (deg); the wrist extends by 90 minus it, so the hand stays level
const plank = fwd => q => ({ root: { at: [0, q.y, q.z], tilt: q.tilt }, trunk: 0, neck: 0, shoulder: { flex: q.tilt + fwd }, elbow: 0, wrist: 90 - fwd, hip: 0, knee: 0, ankle: 0 });
const onFloor = lm => [lm['wrist.r'][1] - WRIST_Y, lm['toe.r'][1], lm['toe.r'][2] - TOE_Z];
const start = plank(0)(solve({ y: 0.4, z: -0.2, tilt: 75 }, plank(0), onFloor));
// end: the plank rocks forward over the hands (shoulders 10 deg ahead of the wrists), hands where they were
const W0 = landmarksOf(start, H)['wrist.r'];
const end = plank(-10)(solve({ y: 0.4, z: -0.15, tilt: 75 }, plank(-10), lm => [lm['wrist.r'][1] - WRIST_Y, lm['wrist.r'][2] - W0[2], lm['toe.r'][1]]));
const fault = plank(18)(solve({ y: 0.4, z: -0.2, tilt: 75 }, plank(18), onFloor));

export default {
  id: '_test_flat', name: 'Engine test · flat palm', view: 'side', facing: 'right', hand: 'flat',
  camera: { fit: true },
  poses: { start, end },
  equipment: [{ type: 'floor', from: -1.2, to: 0.5 }],
  checks: [
    { landmark: 'toe.l', plane: { point: [0, 0, 0], normal: [0, 1, 0] }, pose: 'all', tol: 0.5 },
    { landmark: 'wrist.r', plane: { point: [0, WRIST_Y, 0], normal: [0, 1, 0] }, pose: 'all', tol: 0.5 },
  ],
  callouts: [{ key: 'palms', text: 'Palms flat', anchor: 'wrist.r', cue: 'Hands flat under the shoulders.' }],
  mistake: {
    pose: { root: fault.root, shoulder: fault.shoulder, wrist: fault.wrist },
    guides: [{ kind: 'arrow', from: { at: 'wrist.r', off: [-14, -8] }, to: { at: 'wrist.r', off: [4, -8] } }],
    tells: [{ key: 'ahead', text: 'Hands ahead', anchor: 'grip.r', cue: 'The hands sit ahead of the shoulders.' }],
  },
  tempo: [{ phase: 'Rock', s: 1, move: true }, { phase: 'Return', s: 1, move: true }],
  alt: 'Engine test. Side view, a high plank on flat palms, rocking forward over the hands.',
};
