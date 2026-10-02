// Seated machine chest press (selectorised, top-pivot lever arms, neutral vertical handles), side view, facing right.
// View: SIDE. What a coach judges is sagittal: handle height against the chest, the handle path straight forward,
// the back and shoulder blades staying on the pad, and the elbows stopping just short of lockout. The fault (the
// shoulders rolling forward off the pad and the elbows snapping locked) is a sagittal fault too.
// Form sources:
//  ACE Seated Chest Press (acefitness.org/resources/everyone/exercise-library/188/seated-chest-press/): "Adjust the seat
//   height so that the handles are level with your mid-chest (around nipple level) and the handles are positioned no
//   deeper than chest level"; back firmly on the backrest, feet firmly on the floor; "Depress and retract your scapulae
//   ... and attempt to hold this position throughout"; press "until your elbows are fully extended, but not locked";
//   the shoulder blades "should continue to make contact with the backrest"; frequent mistake: pressing "to a point
//   where the shoulder blades round themselves forward and move off the backrest".
//  Fees M, Decker T, Snyder-Mackler L, Axe MJ. Upper extremity weight-training modifications for the injured athlete.
//   Am J Sports Med 1998;26(5):732-42 (PubMed 9784824): keep shoulder abduction to about 45 deg in pressing and avoid
//   the hands (handles) travelling behind the chest line, to limit anterior capsule and AC-joint stress.
//  NSCA, Exercise Technique Manual for Resistance Training (3rd ed., 2016), vertical/seated chest press: handles in
//   line with the chest, five-point body contact, press to full (not forced) elbow extension, return under control.
//   (Book, not re-read online for this plate.)
//  M/ARC research lib_machine_chest_press.json (backup branch): elbow flexion 15..90 deg, torso lean -3..+3 deg,
//   mistake "Round and lock", tempo lift 1 / hold 0.3 / lower 1.5 / rest 0.5.
// Machine (typical commercial selectorised chest press): seat pad top 46 cm, back pad reclined 5 deg, lever arms
// hanging 1.0 m from a top pivot 1.89 m up, 5 cm in front of the start handle, so the handle path is a shallow
// rising arc (7.6 cm up over 43 cm of travel); vertical neutral handles 14 cm long; main upright 7.6 cm tube 36 cm
// behind the seat; handles 56 cm apart at the start converging to 44 cm.
import { rootOnSeat, landmarksOf, normPose, resolve, fk } from '../engine/index.mjs';
import { bodyShapes } from '../engine/body.mjs';

const H = 1.75;
const SEAT_TOP = 0.46;
const SEAT = [0, SEAT_TOP, 0];                         // buttock contact on the seat pad
const TILT = -5;                                       // back pad reclined 5 deg: pelvis and thorax lie back 5 deg
const feet = { l: { at: [0.10, 0, 0.47] }, r: { at: [-0.10, 0, 0.47] } };   // feet flat, hip width, knees ~90 deg
const GX0 = 0.28, GX1 = 0.22;                          // handle centres: 56 cm apart at the start, converging to 44 cm
const R = Math.PI / 180;

// Lever: top pivot 5 cm in front of the start handle, arm length L. Handle centre at swing angle phi (0 = hanging
// straight down). The handle path rises 7.6 cm over 43 cm of travel (about 10 deg, near square to the reclined pad).
const L = 1.0;
const START_Z = 0.20;                                  // start: handles 3 cm in front of the chest, never behind it
const PZ = 0.25;
const PHI0 = Math.asin((START_Z - PZ) / L) / R;        // -2.9 deg
const HANDLE_Y = 0.89;                                 // mid-chest (nipple line): 12.8 cm below the shoulder joint centre
const PY = HANDLE_Y + L * Math.cos(PHI0 * R);          // pivot 1.89 m up
const PIVOT = [0, PY, PZ];
const onArc = phi => [PZ + L * Math.sin(phi * R), PY - L * Math.cos(phi * R)];   // [z, y]
const PHI1 = 22.6;                                     // end: arms long, elbows 18 deg short of straight
const PHI_M = 30.9;                                    // mistake: shoulders roll forward, elbows lock; handle 13 cm further, level with the shoulder

const grips = (phi, gx, pole) => { const [z, y] = onArc(phi); return {
  l: { at: [gx, y, z], pole: [-pole[0], pole[1], pole[2]] }, r: { at: [-gx, y, z], pole } }; };
const gxAt = phi => GX0 + (GX1 - GX0) * Math.min(1, (phi - PHI0) / (PHI1 - PHI0));
const POLE_START = [-0.75, -0.55, -0.2];               // elbow out ~50 deg, down, a little behind the torso; forearm ~14 deg up to the handle
const POLE_END = [-0.8, -0.6, 0.0];

const base = { root: { at: rootOnSeat(SEAT, TILT, H), tilt: TILT }, trunk: 0, neck: 0,
  scap: { elev: -0.5, pro: -2 }, plant: feet };
const start = { ...base, reach: grips(PHI0, GX0, POLE_START) };
const end = { ...base, reach: grips(PHI1, GX1, POLE_END) };
const via = [1 / 3, 2 / 3].map(t => { const p = PHI0 + (PHI1 - PHI0) * t;   // keeps the handle on the arc
  return { ...base, reach: grips(p, gxAt(p), [-0.75 - 0.05 * t, -0.55 - 0.05 * t, -0.2 * (1 - t)]) }; });

// Back pad: tangent to the upper back and the buttock of the correct pose.
const lmS = landmarksOf(start, H);
const padU = [0, lmS.backUpper[1], lmS.backUpper[2]], padL = [0, lmS.buttock[1], lmS.buttock[2]];
const padDir = [0, padU[1] - padL[1], padU[2] - padL[2]];
const padN = (() => { const n = [0, -padDir[2], padDir[1]], k = Math.hypot(...n); return n.map(v => v / k); })();

// Mistake: "round and lock" (ACE; M/ARC research). Shoulder blades protract 5 cm and ride up 1.5 cm, the upper spine
// flexes 9 deg so the upper back leaves the pad (3.6 cm gap, see checks); the elbows go to a hard lockout (0 deg) and
// the handle travels 13 cm further along the lever arc, to shoulder height (not above it). Pelvis stays on the seat.
const mistakePose = { trunk: 9, scap: { elev: 1.5, pro: 5 }, reach: grips(PHI_M, GX1, POLE_END) };
// Gap dimension for the tell: from the pad face (foot of the normal) to the faulty upper back, with two 4 px ticks
// laid along the pad. 3.6 cm is the real size of the fault; the dimension makes it legible at 1x.
const lmM = landmarksOf({ ...end, ...mistakePose }, H);
const gapTo = lmM.backUpper, gapCm = (gapTo[1] - padU[1]) * padN[1] + (gapTo[2] - padU[2]) * padN[2];
const gapFrom = [0, gapTo[1] - padN[1] * gapCm, gapTo[2] - padN[2] * gapCm];
const padU1 = (() => { const k = Math.hypot(...padDir); return padDir.map(v => v / k); })(), TICK = 2 / 146.29;   // +-2 px
const tick = p => ({ kind: 'line', pts: [[0, p[1] - padU1[1] * TICK, p[2] - padU1[2] * TICK], [0, p[1] + padU1[1] * TICK, p[2] + padU1[2] * TICK]] });
const gapMid = [0, (gapFrom[1] + gapTo[1]) / 2, (gapFrom[2] + gapTo[2]) / 2];

// Engine workaround (reported): in side view the engine draws the whole start layer UNDER the end layer, so a start
// near arm that sits over the torso (as it does at the bottom of any press) is hidden by the end torso fill. Here the
// start near arm is redrawn as a dashed phantom outline (engineering convention for an alternate position) in the end
// layer at z 'mid': over the end torso, under the end near arm. Outline = union boundary of the engine's own arm
// shapes (shoulder cap, upper arm, elbow cap, forearm, fist), computed in metres and projected by the 'line' primitive.
const insidePoly = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
  const [xi, yi] = poly[i], [xj, yj] = poly[j];
  if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
const startArmPhantom = (() => {
  const body = { height: H }, sk = fk(resolve(normPose(start, body), body).q, body);
  const cam = { view: 'side', facing: 'right', near: 'r', pxm: 1, P: w => [w[2], -w[1]] };
  const keys = ['shcap.r', 'upper.r', 'elbowcap.r', 'fore.r', 'fist.r'];
  const polys = bodyShapes(sk, cam).filter(sh => keys.includes(sh.key)).map(sh => sh.poly);
  const runs = [];
  polys.forEach((poly, k) => {
    let run = [];
    const flush = () => { if (run.length > 1) runs.push(run); run = []; };
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.002));
      for (let j = 0; j < n; j++) {
        const p = [a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n];
        if (polys.some((q, m) => m !== k && insidePoly(p, q))) flush(); else run.push(p);
      }
    }
    flush();
  });
  return runs.map(r => ({ type: 'line', pts: r.map(p => [0, -p[1], p[0]]), cls: 'eq-line m-line', z: 'front' }));
})();

// Lever and handle as outlines (metres, side view), matching the chestPress primitive's geometry: lever 5 cm wide from
// the pivot boss (r 4 cm) to the top of the 14 cm vertical handle (3.2 cm thick). Used for (a) the start position,
// drawn as a dashed phantom over the end arm, because the engine's start layer drops moving equipment and the end
// upper arm covers the top of the start handle; (b) the in-between ghosts, as open outlines (the engine's filled ghost
// levers left a dark raster band round the pivot in the dark theme).
const GRIP = 0.14, LEVER_R = 0.025, HANDLE_R = 0.016, BOSS_R = 0.04;
const W = ([z, y]) => [0, y, z];
const capsule = (a, b, r, n = 8) => {   // closed outline round segment a-b, [z, y]
  const au = Math.atan2(b[1] - a[1], b[0] - a[0]), pts = [];
  for (let i = 0; i <= n; i++) { const t = au + Math.PI / 2 - Math.PI * i / n; pts.push([b[0] + r * Math.cos(t), b[1] + r * Math.sin(t)]); }
  for (let i = 0; i <= n; i++) { const t = au - Math.PI / 2 - Math.PI * i / n; pts.push([a[0] + r * Math.cos(t), a[1] + r * Math.sin(t)]); }
  return [...pts, pts[0]].map(W);
};
const leverOutline = (grip, cls, z, part = null) => {
  const top = [grip[2], grip[1] + GRIP / 2], bot = [grip[2], grip[1] - GRIP / 2], pv = [PZ, PY];
  const d = [top[0] - pv[0], top[1] - pv[1]], k = Math.hypot(...d), u = [d[0] / k, d[1] / k], n = [-u[1], u[0]];
  const a = [pv[0] + u[0] * BOSS_R, pv[1] + u[1] * BOSS_R];
  const side = s => [[a[0] + n[0] * s, a[1] + n[1] * s], [top[0] + n[0] * s, top[1] + n[1] * s]].map(W);
  return [side(LEVER_R), side(-LEVER_R), capsule(bot, top, HANDLE_R)].map(pts => ({ type: 'line', pts, cls, z, part }));
};
const startGrip = landmarksOf(start, H)['grip.r'];

const POST = { z: -0.36, h: 1.95 };

export default {
  id: 'machine_chest_press', name: 'Machine Chest Press', view: 'side', facing: 'right',
  camera: { x0: 150, y0: 339 },
  poses: { start, end, via },
  equipment: [
    { type: 'floor', from: -0.62, to: 1.05 },
    { type: 'rackUpright', at: [0, 0, POST.z], h: POST.h },
    { type: 'seat', at: [0, SEAT_TOP, 0.10], len: 0.40 },
    { type: 'backPad', surface: [padU, padL], len: 0.62, below: 0.06, post: false },
    { type: 'line', pts: [[0, padL[1] + 0.22, padL[2] - 0.07], [0, padL[1] + 0.22, POST.z + 0.038]], cls: 'eq-line' },   // pad bracket
    (lm, ctx) => (ctx.pose === 'end' ? [...startArmPhantom, ...leverOutline(startGrip, 'eq-line m-line', 'front')]
      : ctx.pose.startsWith('ghost') ? leverOutline(lm['grip.r'], 'eq-line', 'mid', 'handle') : null),
    lm => ({ type: 'chestPress', pivot: PIVOT, handle: lm['grip.r'], grip: 0.14, gripAxis: [0, 1, 0],
      frameTo: [0, PY, POST.z], part: 'lever' }),   // not ghosted: see leverOutline
  ],
  checks: [
    { landmark: 'seat', plane: { point: SEAT, normal: [0, 1, 0] }, pose: 'all', tol: 0.5 },          // pelvis ON the seat
    { landmark: 'backUpper', plane: { point: padU, normal: padN }, pose: 'start', tol: 1 },         // back ON the pad
    { landmark: 'backUpper', plane: { point: padU, normal: padN }, pose: 'end', tol: 1 },
    { landmark: 'backUpper', above: { point: padU, normal: padN }, pose: 'mistake' },               // gap shown in report
    { landmark: 'buttock', plane: { point: padL, normal: padN }, pose: 'all', tol: 1 },
    { landmark: 'sole.r', plane: { point: [0, 0, 0], normal: [0, 1, 0] }, pose: 'all', tol: 0.5 },  // feet ON the floor
  ],
  ghosts: { count: 3, parts: ['handle'] },   // lever + handle only: arm ghosts sat under the end arm as a smudge
  trace: { point: 'grip.r', trim: [12, 12] },
  measure: { vertex: 'elbow.r', from: 'shoulder.r', to: 'wrist.r', radius: 18, title: 'Elbow', value: 'soft, not locked' },
  callouts: [
    { key: 'height', text: 'Handles<br>mid-chest', anchor: 'start:grip.r', cue: 'Set the seat so the handles line up with the middle of the chest.' },
    { key: 'blades', text: 'Blades<br>on pad', anchor: 'backUpper', cue: 'Keep the shoulder blades back and down, pressed into the pad.' },
    { key: 'elbows', text: 'Elbows<br>45°', anchor: 'start:elbow.r', box: { left: 29, top: 232 }, cue: 'Keep the elbows about 45 degrees out from the sides, below the shoulders.' },
  ],
  tempo: [{ phase: 'Press', s: 1, move: true }, { phase: 'Hold', s: 0.3 }, { phase: 'Return', s: 1.5, move: true }, { phase: 'Rest', s: 0.5 }],
  mistake: {
    pose: mistakePose,
    guides: [
      { kind: 'arc-arrow', center: 'hips', r: 80, a0: -104, a1: -84 },   // above the shoulder joint mark
      { kind: 'line', pts: [gapFrom, gapTo] }, tick(gapFrom), tick(gapTo),   // pad-to-back gap dimension
    ],
    tells: [
      { key: 'round', text: 'Off<br>the pad', anchor: gapMid, box: { left: 17, top: 196 }, cue: 'The shoulders roll forward and the upper back leaves the pad.' },
      { key: 'lock', text: 'Locked<br>elbows', anchor: 'elbow.r', cue: 'The elbows snap straight at the end of the press.' },
    ],
  },
  alt: 'Machine chest press, side view. Seated with the back flat on a slightly reclined pad and feet flat on the floor, the lifter presses vertical handles on a top-pivot lever arm from mid-chest height straight forward until the arms are long, elbows soft, shoulder blades kept on the pad.',
};
