// Hanging leg raise, side view. Straight legs from a still dead hang to at least hip height, pelvis curling up.
// Form: Catalyst Athletics exercise library (hang still, lift straight legs, curl the pelvis up as in a crunch so it is
// not only hip flexion; stall bars stop the swing, on a bar control the speed); ExRx Hanging Straight Leg-Hip Raise
// (the rectus abdominis works dynamically only when the lumbar spine flexes, i.e. the pelvis tilts posteriorly);
// M/ARC research lib_hanging_leg_raise.json (hip 0 -> 90, knees 0-10 deg; mistake "swing and short-change it").
// Balance: a still hang has the whole-body centre of mass straight under the bar, so every correct pose below is
// solved with its Winter (2009) segment-mass centre of mass on the bar's vertical; the mistake is swung off it.
import { landmarksOf, normPose, resolve, fk } from '../engine/index.mjs';
import { bodyShapes } from '../engine/body.mjs';

const H = 1.75;
const BAR = [0, 2.25, 0];                     // 32 mm bar, 2.25 m, ceiling mount (no wall for the swing to hit)
const GRIP_X = 0.24;                          // overhand grip, hands 48 cm apart (just outside the shoulders)
const ARM = (0.186 + 0.146 + 0.46 * 0.108) * H;   // glenohumeral centre to grip centre, arm straight (66.8 cm)
const hands = { l: { at: [GRIP_X, BAR[1], BAR[2]], pole: [0.5, 0, -1] }, r: { at: [-GRIP_X, BAR[1], BAR[2]], pole: [-0.5, 0, -1] } };

// Winter (2009) segment masses (fraction of body mass) and centre-of-mass positions (from the proximal end).
const mid = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function comZ(lm) {
  let m = 0, z = 0;
  const seg = (w, p) => { m += w; z += w * p[2]; };
  seg(0.081, lm.ear);                                                  // head and neck
  seg(0.497, mid(lm.shoulders, lm.hips, 0.5));                         // trunk (glenohumeral to greater trochanter)
  for (const s of ['l', 'r']) {
    seg(0.028, mid(lm[`shoulder.${s}`], lm[`elbow.${s}`], 0.436));
    seg(0.016, mid(lm[`elbow.${s}`], lm[`wrist.${s}`], 0.430));
    seg(0.006, lm[`grip.${s}`]);
    seg(0.100, mid(lm[`hip.${s}`], lm[`knee.${s}`], 0.433));
    seg(0.0465, mid(lm[`knee.${s}`], lm[`ankle.${s}`], 0.433));
    seg(0.0145, mid(lm[`heel.${s}`], lm[`toe.${s}`], 0.5));
  }
  return z / m;
}

// Place the body so the arms are straight to the bar (elbow ~5 deg) and the centre of mass sits `off` m in front of it.
function hang(angles, off = 0) {
  let root = [0, BAR[1] - 1.14, -0.02];
  for (let i = 0; i < 40; i++) {
    const pose = { ...angles, root: { at: root, tilt: angles.tilt }, reach: hands };
    const lm = landmarksOf(pose, H);
    const dz = BAR[2] + off - comZ(lm);
    const sh = lm['shoulder.r'], lat = GRIP_X - Math.abs(sh[0]);
    const need = Math.sqrt((ARM * 0.998) ** 2 - lat ** 2);             // sagittal shoulder-to-bar distance
    const sz = sh[2] + dz, dy = Math.sqrt(Math.max(0, need ** 2 - (BAR[2] - sz) ** 2));
    root = [0, root[1] + (BAR[1] - dy - sh[1]), root[2] + dz];
  }
  const { tilt, ...rest } = angles;
  return { ...rest, root: { at: root.map(v => +v.toFixed(4)), tilt }, reach: hands };
}

// Start: still dead hang, legs straight down, toes relaxed. End: legs just above hip height, knees soft,
// pelvis tucked 25 deg (posterior), lumbar curled 15 deg, thorax 10 deg back of vertical: thigh to thorax 90 deg.
const A0 = { tilt: 0, trunk: 0, neck: 0, hip: 0, knee: 0, ankle: -25 };
const A1 = { tilt: -25, trunk: 15, neck: 12, hip: 80, knee: 5, ankle: -25 };
// Posterior pelvic tilt shown on the correct plate (with the 'curl' callout): an arc under the pelvis around the hip,
// turning the way the pelvis turns (tail tucks under, pubis comes forward and up), with an arrowhead.
const CURL = (() => {
  const r = 32, p = a => ({ at: 'hip.r', off: [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)] });
  const arc = Array.from({ length: 10 }, (_, k) => p(158 - 88 * k / 9));
  const tip = arc[9].off, tan = [Math.sin(70 * Math.PI / 180), -Math.cos(70 * Math.PI / 180)], n = [-tan[1], tan[0]];
  const wing = s => ({ at: 'hip.r', off: [tip[0] - tan[0] * 6 + s * n[0] * 4, tip[1] - tan[1] * 6 + s * n[1] * 4] });
  return [...arc, wing(1), arc[9], wing(-1)];
})();
const lerpA = t => Object.fromEntries(Object.keys(A0).map(k => [k, A0[k] + (A1[k] - A0[k]) * t]));
const start = hang(A0), end = hang(A1);
const via = [hang(lerpA(1 / 3)), hang(lerpA(2 / 3))];
// Mistake: body swung back behind the bar (centre of mass 22 cm off the bar line), knees bent, thighs short of
// hip height, pelvis tipped forward so the lower back arches (lumbar extension 12 deg).
const MISTAKE = hang({ tilt: -14, trunk: -12, neck: -5, hip: 56, knee: 92, ankle: -25 }, -0.2);
// The swung-back body's arms cross its neck and chest in this view, and the engine masks everything inside the dashed
// arms, so the dashed head read as detached. The head and trunk outline hidden under the arms is added back as
// hidden lines (mistake guides, same dashed mistake stroke): the engine's own body shapes on a 1000 px/m probe camera,
// sampled along the same Catmull-Rom spline it draws (as pull_up.mjs does for the hang), mapped back to world metres.
const cr = (ps, k = 8) => {
  const n = ps.length, g = i => ps[(i + n) % n], out = [];
  for (let i = 0; i < n; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let j = 0; j < k; j++) { const t = j / k, u = 1 - t;
      out.push([0, 1].map(d => u * u * u * p1[d] + 3 * u * u * t * c1[d] + 3 * u * t * t * c2[d] + t * t * t * p2[d])); }
  }
  return out;
};
const inside = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
  const [xi, yi] = poly[i], [xj, yj] = poly[j];
  if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
function hiddenTrunk(pose) {
  const body = { height: H }, probe = { view: 'side', near: 'r', pxm: 1000, P: w => [w[2] * 1000, -w[1] * 1000] };
  const shapes = bodyShapes(fk(resolve(normPose(pose, body), body).q, body), probe)
    .map(s => ({ key: s.key, pts: s.key.includes('cap') || s.key.startsWith('fist') ? s.poly : cr(s.poly) }));
  const isArm = k => /^(shcap|upper|elbowcap|fore|fist)\./.test(k);
  const arms = shapes.filter(s => isArm(s.key)).map(s => s.pts), trunk = shapes.filter(s => s.key === 'head' || s.key === 'torso');
  const runs = [];
  for (const s of trunk) {
    const other = trunk.filter(o => o !== s).map(o => o.pts);
    const vis = s.pts.map(p => arms.some(a => inside(p, a)) && !other.some(o => inside(p, o)));
    const n = s.pts.length, i0 = vis.indexOf(false);
    let run = [];
    for (let k = 1; k <= n; k++) { const i = (i0 + k) % n;
      if (vis[i]) run.push(s.pts[i]); else { if (run.length > 2) runs.push(run); run = []; } }
    if (run.length > 2) runs.push(run);
  }
  return runs.map(r => ({ kind: 'dashed', pts: r.map(([x, y]) => [0, -y / 1000, x / 1000]) }));
}
const MISTAKE_HIDDEN = hiddenTrunk(MISTAKE);

export default {
  id: 'hanging_leg_raise', name: 'Hanging Leg Raise', view: 'side', facing: 'right',
  camera: { fit: { left: 14, right: 14, top: 22, bottom: 12 } },
  poses: { start, via, end },
  equipment: [
    { type: 'floor', from: -0.75, to: 1.15 },
    { type: 'pullupBar', at: BAR, stub: 0.25, mount: 'ceiling', z: 'back' },
    { type: 'line', pts: [[0, BAR[1] + 0.25, -0.20], [0, BAR[1] + 0.25, 0.20]] },            // ceiling the post hangs from
    // the bar end-on (32 mm) drawn over the fist, so the hand reads as wrapped around a bar, not a knob
    { type: 'line', cls: 'eq-solid', z: 'front', pts: Array.from({ length: 25 }, (_, k) => [0, BAR[1] + 0.016 * Math.sin(k * Math.PI / 12), BAR[2] + 0.016 * Math.cos(k * Math.PI / 12)]) },
  ],
  checks: [
    { landmark: 'grip.r', at: hands.r.at, pose: 'all', tol: 0.5 },
    { landmark: 'grip.l', at: hands.l.at, pose: 'all', tol: 0.5 },
    { landmark: 'toe.r', above: { point: [0, 0.05, 0], normal: [0, 1, 0] }, pose: 'all' },   // feet clear of the floor
  ],
  ghosts: { count: 3, parts: ['leg.r', 'trunk'] },
  trace: { point: 'ankle.r', trim: [10, 12] },
  measure: { vertex: 'hip.r', from: 'shoulder.r', to: 'knee.r', title: 'Hip', value: '90° to trunk', expect: 90, box: { left: 176, top: 128 } },
  datum: [{ y: 'hip.r', from: 'hip.r', to: 'toe.r' }],
  callouts: [
    { key: 'curl', text: 'Pelvis<br>curls up', anchor: 'sacrum', box: { left: 17, top: 174 }, guide: CURL, cue: 'At the top, curl the pelvis up toward the ribs so the abs finish the lift.' },
    { key: 'legs', text: 'Legs straight', anchor: { at: 'ankle.r', off: [0, -6] }, box: { left: 214, top: 90 }, cue: 'Keep the knees straight or only slightly soft all the way up.' },
    { key: 'still', text: 'No swing', anchor: 'backUpper', cue: 'Hang still; lift slowly and lower under control, no swing.' },
  ],
  tempo: [{ phase: 'Lift', s: 1.5, move: true }, { phase: 'Hold', s: 0.5 }, { phase: 'Lower', s: 2, move: true }, { phase: 'Rest', s: 1 }],
  mistake: {
    pose: MISTAKE,
    guides: [
      { kind: 'arc-arrow', center: 'grips', r: 100, a0: 118, a1: 140 },
      { kind: 'arrow', from: { at: 'lumbar', off: [-20, 0] }, to: { at: 'lumbar', off: [-7, 0] } },
      ...MISTAKE_HIDDEN,                                   // neck and chest hidden under the swung arms
    ],
    tells: [
      { key: 'swing', text: 'Swing', anchor: { at: 'grips', off: [-70, 71] }, cue: 'The body swings to fling the legs.' },
      { key: 'knees', text: 'Knees only', anchor: { at: 'knee.r', off: [-4, 8] }, box: { left: 26, top: 232 }, cue: 'Knees bend; thighs stop short.' },
      { key: 'arch', text: 'Back arches', anchor: 'sacrum', box: { left: 4, top: 170 }, cue: 'The low back arches, no curl.' },
    ],
  },
  alt: 'Side view. Hanging from a bar with straight arms. Straight legs rise from a still dead hang to just above hip height, the pelvis curling up, body not swinging.',
};
