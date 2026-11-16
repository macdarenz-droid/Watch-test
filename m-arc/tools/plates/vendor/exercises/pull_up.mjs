// Pull-up (strict, overhand), side view, figure faces a wall-mounted bar.
// View: side. The faults a coach stops a set for (kipping/swing, and a half rep with the chin short of the bar)
// and the "chest to the bar, elbows down and slightly forward" finish all happen in the sagittal plane.
// Grip width is not visible from the side, so the 'Shoulders down' cue and the alt text carry it (overhand, just wider
// than the shoulders).
// Form sources:
//  ACE Pull-ups (acefitness.org/resources/everyone/exercise-library/191/pull-ups/): palms away, full grip, head in line
//   with the trunk under the hands, depress and retract the scapulae, pull the elbows down to the sides, chin level
//   with the bar, lower until the arms are fully extended.
//  Snarr et al. 2017, J Hum Kinet 58:5-13 (PMC5548150): grip 1.5x bi-acromial width; rep ends when the chin reaches the
//   bar; the trunk angles back to clear the bar in the concentric phase.
//  Youdas et al. 2010, JSCR 24(12):3404-14; Dickie et al. 2017, J Electromyogr Kinesiol 32:30-36 (pronated grip).
//  Kipping vs strict: Williamson & Price 2021 (St Mary's), IJES 8(5) abstract (WKU): greater hip/knee angles and
//   velocities, lower lat/biceps activity in the kip.
//  Prinold & Bull 2016, J Sci Med Sport (PMID 26383875): scapular kinematics; high arm elevation at the bottom.
import { normPose, resolve, fk, landmarksOf } from '../engine/index.mjs';
import { bodyShapes } from '../engine/body.mjs';
const H = 1.75;
const BAR = [0, 2.25, 0];          // 32 mm bar centre, 2.25 m (rack / wall-mounted bars 2.2-2.4 m)
const BAR_R = 0.016, BAR_TOP = BAR[1] + BAR_R;
const GX = 0.31;                   // grip centre +-31 cm: 62 cm apart = 1.37x the 45 cm shoulder-joint width
const WALL = 0.55;                 // bar stands 55 cm off the wall (figure faces the wall). The wall face itself is left
                                   // out on purpose: the right-hand labels sit in that space; the wall plate marks it.

const grip = pole => ({ l: { at: [GX, BAR[1], BAR[2]], pole: [pole[0], pole[1], pole[2]] },
  r: { at: [-GX, BAR[1], BAR[2]], pole: [-pole[0], pole[1], pole[2]] } });

// Start: dead hang, elbows 8 deg (straight), shoulder elevation 168 deg, trunk vertical, COM under the bar.
const start = { root: { at: [0, 1.117, -0.02], tilt: 0 }, trunk: 0, neck: 0, scap: { elev: 0, pro: -1 },
  hip: 4, knee: 6, ankle: -22, reach: grip([0.5, 0, 0.3]) };
// End: chin 5.2 cm over the bar top (clearly over, not level with the fists), elbow flexion 146.5 deg (AAOS normal max
// 150); pelvis 4 deg back + trunk 6 deg back, hips 16 deg flexed: a near-upright body, COM 2.2 cm behind the grip line
// (segment-mass estimate), toes 39 cm in front of the bar (the kip mistake reaches 47 cm). Elbows out and down under
// the bar (elbow 4 cm in front of it, forearm 7 deg off vertical in this view). Chest 1.9 cm clear of the bar.
// Scapulae depressed and retracted.
const end = { root: { at: [0, 1.68, -0.025], tilt: -4 }, trunk: -6, neck: -14, scap: { elev: -3, pro: -3 },
  hip: 16, knee: 10, ankle: -22, reach: grip([0.3, -1, 0]) };

// The hang sits straight under the top position, so the filled end figure hides the start head, trunk and arm.
// Redraw them as hidden lines (dashed, no fill, the drafting convention) over the end figure: the outline of their
// union, only where the end figure covers it (elsewhere the engine's dashed start pose already shows). The near arm is
// nearest the camera, so its outline is drawn whole (it is only cut by itself) and it hides the head and trunk lines
// behind it: the straight start arm reads from the fist down to the start shoulder. The shapes are
// the engine's own body shapes, sampled along the same Catmull-Rom spline it draws, on a 1000 px/m probe camera and
// mapped back to world metres for the 'line' primitive.
const STYLE_HANG = 'eq-cable m-line';
const cr = (ps, k = 8) => {                       // dense closed Catmull-Rom samples (same curve as geom.spline)
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
function hangOutline() {
  const body = { height: H }, probe = { view: 'side', near: 'r', pxm: 1000, P: w => [w[2] * 1000, -w[1] * 1000] };
  const shapesOf = pose => bodyShapes(fk(resolve(normPose(pose, body), body).q, body), probe)
    .map(s => ({ key: s.key, pts: s.key.includes('cap') || s.key.startsWith('fist') ? s.poly : cr(s.poly) }));
  const keep = ['head', 'torso', 'upper.r', 'fore.r', 'fist.r'];
  const hang = shapesOf(start).filter(s => keep.includes(s.key)).map(s => ({ ...s, pts: s.key.startsWith('fist') ? cr(s.pts, 4) : s.pts }));
  const cover = shapesOf(end).map(s => s.pts);
  const items = [];
  for (const s of hang) {
    const isArm = k => /^(upper|fore|fist)\./.test(k);
    const others = hang.filter(o => o !== s && (!isArm(s.key) || isArm(o.key))).map(o => o.pts);
    const vis = s.pts.map(p => !others.some(o => inside(p, o)) && cover.some(c => inside(p, c)));
    const n = s.pts.length, i0 = vis.indexOf(false);
    if (i0 < 0) { items.push([...s.pts, s.pts[0]]); continue; }
    let run = [];
    for (let k = 1; k <= n; k++) { const i = (i0 + k) % n;
      if (vis[i]) run.push(s.pts[i]); else { if (run.length > 2) items.push(run); run = []; } }
    if (run.length > 2) items.push(run);
  }
  return items.map(r => ({ type: 'line', pts: r.map(([x, y]) => [0, -y / 1000, x / 1000]), cls: STYLE_HANG, z: 'front', part: 'hang' }));
}
const HANG = hangOutline();
// Elbow flexion (the one angle convention on every plate: bend from straight). Reference ray: the upper arm extended
// 22 cm past the elbow; the arc runs from it to the forearm.
const LE = landmarksOf(end, H);
const UA = [LE['elbow.r'][2] - LE['shoulder.r'][2], LE['elbow.r'][1] - LE['shoulder.r'][1]], UAL = Math.hypot(...UA);
const UA_EXT = [LE['elbow.r'][0], LE['elbow.r'][1] + 0.22 * UA[1] / UAL, LE['elbow.r'][2] + 0.22 * UA[0] / UAL];

export default {
  id: 'pull_up', name: 'Pull-up', view: 'side', facing: 'right',
  camera: { fit: true },
  poses: { start, end },
  equipment: [
    { type: 'box', at: [0, BAR[1], WALL / 2], w: WALL, h: 0.035, rc: 1.5 },           // bracket arm to the wall
    { type: 'box', at: [0, BAR[1], WALL + 0.012], w: 0.024, h: 0.26, rc: 1 },         // wall plate
    { type: 'pullupBar', at: BAR, mount: 'ceiling', stub: 0.0001 },                   // the 32 mm bar, end-on
    (lm, ctx) => (ctx.pose === 'end' ? HANG : null),                               // hang head, trunk and arm as hidden lines
  ],
  checks: [
    { landmark: 'chin', above: { point: [0, BAR_TOP + 0.045, 0], normal: [0, 1, 0] }, pose: 'end' },    // chin clearly over: >= 4.5 cm above the bar top
    { landmark: 'chin', above: { point: [0, BAR[1] - BAR_R, 0], normal: [0, -1, 0] }, pose: 'mistake' },  // half rep: chin under it
  ],
  ghosts: { count: 2, parts: ['trunk', 'leg.l', 'leg.r'] },
  trace: { point: 'chin', trim: [18, 8] },
  measure: { vertex: 'elbow.r', from: { dir: UA }, to: 'grip.r', radius: 20, title: 'Elbow', value: 'about 145° bend', expect: 146.5, box: { left: 238, top: 94 } },
  datum: [{ y: BAR_TOP, from: 20, to: 'chin' }, { x: 0, from: 0, to: 0, line: ['elbow.r', UA_EXT], mistake: false }],
  callouts: [
    { key: 'chin', text: 'Chin over bar', anchor: 'chin', cue: 'From straight arms, pull until the chin clears the bar, chest toward it.' },
    { key: 'elbows', text: 'Elbows down', anchor: { at: 'elbow.r', off: [2, 5] }, cue: 'Drive the elbows down to the ribs, slightly forward.', box: { left: 196, top: 140 } },
    { key: 'down', text: 'Shoulders down', anchor: 'shoulderTop.r', box: { left: 2, top: 71 }, cue: 'Keep the shoulders pulled down, away from the ears, all the way up.' },
  ],
  tempo: [{ phase: 'Pull', s: 1, move: true }, { phase: 'Hold', s: 0.5 }, { phase: 'Lower', s: 2, move: true }, { phase: 'Rest', s: 0.5 }],
  mistake: {
    pose: { root: { at: [0, 1.56, -0.04], tilt: -15 }, trunk: -4, hip: 55, knee: 80, reach: grip([0.25, -1, 0.1]) },
    guides: [
      { kind: 'arc-arrow', center: 'hip.r', r: 50, a0: 70, a1: 10 },
    ],
    tells: [
      { key: 'kick', text: 'Leg kick', anchor: 'knee.r', cue: 'The legs kick to swing the body up.' },
      { key: 'short', text: 'Chin short', anchor: 'chin', box: { left: 10, top: 89 }, cue: 'The chin stops under the bar: a half rep.' },
    ],
  },
  alt: 'Pull-up, side view. Overhand grip just wider than the shoulders. From a straight-arm hang under a bar, the body rises until the chin clears the bar, elbows driven down.',
};
