// Body model: Winter (2009) segment proportions, pose by joint angles, forward kinematics in 3D,
// 2-bone IK helpers, pose interpolation and the drawn body shapes for a FRONT or SIDE view.
//
// World frame (metres): x = the figure's LEFT, y = up, z = the figure's FORWARD. Floor is y = 0.
// Sides: 'l' (figure's left, s = +1) and 'r' (figure's right, s = -1).
// Standing reference ("ref") coordinates are in body heights H, measured from the floor, standing upright.
//
// Sources: D. A. Winter, Biomechanics and Motor Control of Human Movement, 4th ed. (Wiley, 2009), ch. 4
// (segment lengths as fractions of H). Hip-joint centre at the greater-trochanter height (.530 H); ankle .039 H;
// foot length .152 H. Sagittal trunk depths from adult male anthropometry (chest ~25 cm, waist ~20 cm, buttock
// ~24 cm, neck ~11 cm at H 175 cm); plumb line through ear, glenohumeral centre and hip-joint centre in standing.
import {
  R, add, sub, mul, dot, cross, len, norm, lerp, lerp3, clamp, mv, mm, tr, rotX, rotY, rotZ, axisAngle, signedAngle,
  spline, limb, circle, circlePoly, limbR,
} from './geom.mjs';

export const WINTER = { upperArm: 0.186, forearm: 0.146, hand: 0.108, thigh: 0.245, shank: 0.246, foot: 0.152, footW: 0.055,
  shoulderW: 0.259, hipW: 0.191, shoulderH: 0.818, hipH: 0.530, kneeH: 0.285, ankleH: 0.039, chinH: 0.870 };
export const REF = {
  hjcY: WINTER.hipH, hjcX: 0.05,                  // hip-joint centres 17.5 cm apart at H 175 cm
  shX: WINTER.shoulderW / 2, shY: 0.80,           // glenohumeral centre just under the acromion (.818)
  lumbar: [0, 0.62, -0.04],                       // spine bend pivot (about L3), near the back
  neck: [0, 0.855, -0.02],                        // head/neck pivot (about C7)
  gripOff: 0.46 * WINTER.hand,                    // wrist to the centre of a closed grip
  heel: -0.032, toe: 0.120, ball: 0.080, mid: 0.044,   // foot, forward of the ankle joint (H)
};
// Limb radii in H: [proximal, belly, distal, belly position] (the reference plate's values).
export const RADII = { upper: [0.03, 0.031, 0.022, 0.3], fore: [0.023, 0.026, 0.015, 0.28], thigh: [0.048, 0.044, 0.027, 0.3], shank: [0.029, 0.033, 0.016, 0.3],
  shoulderCap: 0.03, elbowCap: 0.022, kneeCap: 0.028, fist: 0.02 };
export const SIDES = ['l', 'r'];
export const SGN = { l: 1, r: -1 };

// ---------- outlines (ref coordinates) ----------
const mirror = pts => [...pts, ...[...pts].reverse().map(([x, y]) => [-x, y])];
// Front head: skull, jaw angle and chin, so a neck shows under the jaw (reference judge fix 8).
const HEAD_HALF = [[0.026, 0.996], [0.040, 0.983], [0.046, 0.963], [0.046, 0.941], [0.043, 0.921], [0.038, 0.903], [0.030, 0.887], [0.019, 0.876], [0.007, 0.870]];
const HEAD_FRONT = [[0, 1.0], ...HEAD_HALF, ...[...HEAD_HALF].reverse().map(([x, y]) => [-x, y])];
// Side head (z forward, y): 19.3 cm long, flat face plane with brow and chin only (no nose, no features).
const HEAD_SIDE = [[0.0, 1.0], [0.032, 0.994], [0.052, 0.976], [0.060, 0.952], [0.061, 0.930], [0.060, 0.905], [0.056, 0.885], [0.047, 0.872],
  [0.027, 0.873], [0.010, 0.882], [-0.008, 0.897], [-0.038, 0.912], [-0.054, 0.934], [-0.056, 0.960], [-0.045, 0.984], [-0.022, 0.998]];
// Front torso half (reference torsoHalf); shrug raises the trapezius points (H).
const torsoHalf = shrug => [[0.028, 0.9], [0.029, 0.872], [0.038, 0.857 + shrug * 0.4], [0.064, 0.842 + shrug], [0.095, 0.831 + shrug], [0.122, 0.821 + shrug * 0.6],
  [0.14, 0.8], [0.13, 0.772], [0.117, 0.752], [0.11, 0.714], [0.097, 0.668], [0.087, 0.628], [0.089, 0.592], [0.097, 0.552], [0.097, 0.512],
  [0.082, 0.48], [0.042, 0.463], [0.0, 0.46]];
// Side torso (z forward, y), closed: back contour top->bottom, seat, front contour bottom->top.
// Chest depth .144 H (25 cm), waist .116 H, buttock .138 H, neck .064 H; thoracic kyphosis, lumbar lordosis, gluteal bulge.
const torsoSide = (shrug = 0) => [
  [-0.030, 0.905], [-0.036, 0.876], [-0.048, 0.851 + shrug * 0.5], [-0.062, 0.826 + shrug * 0.4], [-0.070, 0.790], [-0.072, 0.750], [-0.066, 0.700],
  [-0.056, 0.650], [-0.050, 0.615], [-0.058, 0.585], [-0.074, 0.552], [-0.080, 0.522], [-0.073, 0.496], [-0.052, 0.480],
  [-0.020, 0.475], [0.015, 0.476], [0.045, 0.487], [0.058, 0.520], [0.064, 0.570], [0.066, 0.620], [0.062, 0.670], [0.066, 0.710],
  [0.072, 0.745], [0.070, 0.785], [0.058, 0.820 + shrug * 0.3], [0.042, 0.842 + shrug * 0.3], [0.030, 0.860], [0.026, 0.885], [0.024, 0.905]];
// Feet in the foot frame (H, relative to the ankle joint). Side: heel to toe; front: toes toward the camera.
const FOOT_SIDE = [[-0.018, 0.022], [-0.029, 0.002], [-0.032, -0.020], [-0.024, -0.037], [0.000, -0.039], [0.080, -0.039], [0.112, -0.036],
  [0.120, -0.028], [0.113, -0.020], [0.080, -0.015], [0.040, -0.002], [0.018, 0.018]];
const FOOT_FRONT = [[-0.016, 0.016], [0.016, 0.016], [0.029, -0.019], [0.034, -0.035], [0.010, -0.039], [-0.020, -0.039], [-0.024, -0.019]];

// ---------- pose normalisation ----------
const isSided = v => v && typeof v === 'object' && !Array.isArray(v) && ('l' in v || 'r' in v);
const perSide = (v, def) => isSided(v) ? { l: v.l ?? def, r: v.r ?? def } : { l: v ?? def, r: v ?? def };
// Shoulder: { elev, plane, rot } (elevation from hanging; plane 0 = abduction, 90 = flexion; rot + = external)
// or sugar { flex } | { ext } | { abd } | { flex, abd } (both = the angles seen in the side and the front view).
function shoulderN(o) {
  if (o == null) o = {};
  if (typeof o === 'number') o = { flex: o };
  let elev = 0, plane = 0;
  if (o.elev != null) { elev = o.elev; plane = o.plane ?? 0; }
  else if (o.flex != null && o.abd != null) {
    const fl = o.flex * R, ab = o.abd * R, d = [Math.sin(ab) * Math.cos(fl), -Math.cos(ab) * Math.cos(fl), Math.sin(fl) * Math.cos(ab)];
    elev = Math.acos(clamp(-d[1] / len(d), -1, 1)) / R; plane = Math.atan2(d[2], d[0]) / R;
  } else if (o.flex != null) { elev = o.flex; plane = 90; }
  else if (o.ext != null) { elev = -o.ext; plane = 90; }
  else if (o.abd != null) { elev = o.abd; plane = 0; }
  return canonShoulder({ elev, plane, rot: o.rot ?? 0 });
}
// Keep one representation so interpolation never swings the arm through the side: extension = negative elevation in plane 90.
function canonShoulder(s) {
  let { elev, plane } = s;
  if (plane <= -60) { plane += 180; elev = -elev; }
  if (plane > 150) { plane -= 180; elev = -elev; }
  return { ...s, elev, plane };
}
const hipN = o => typeof o === 'number' ? { flex: o, abd: 0, rot: 0 } : { flex: o?.flex ?? 0, abd: o?.abd ?? 0, rot: o?.rot ?? 0 };
const scapN = o => typeof o === 'number' ? { elev: o, pro: 0 } : { elev: o?.elev ?? 0, pro: o?.pro ?? 0 };

/** Normalise an authored pose into the full angle form (degrees; scapula offsets in cm). */
export function normPose(p, body) {
  const H = body.height;
  const root = p.root ?? {};
  const at = Array.isArray(root) ? root : (root.at ?? [0, REF.hjcY * H, 0]);
  const map = (v, fn, def) => { const q = perSide(v, def); return { l: fn(q.l), r: fn(q.r) }; };
  return {
    root: at, tilt: root.tilt ?? p.tilt ?? 0, trunk: p.trunk ?? 0, neck: p.neck ?? 0,
    scap: map(p.scap, scapN, 0), sh: map(p.shoulder, shoulderN, null),
    elbow: perSide(p.elbow, 0), wrist: perSide(p.wrist, 0),
    hip: map(p.hip, hipN, 0), knee: perSide(p.knee, 0), ankle: perSide(p.ankle, 0),
    reach: perSide(p.reach, null), plant: perSide(p.plant, null),
  };
}

// ---------- forward kinematics ----------
function upperArmFrame(s, sh) {
  const plane = sh.plane * R, p = [s * Math.cos(plane), 0, Math.sin(plane)], down = [0, -1, 0];
  let ax = cross(down, p); if (len(ax) < 1e-9) ax = [0, 0, 1];
  const R1 = axisAngle(ax, sh.elev), d = mv(R1, down);
  return mm(axisAngle(d, -s * sh.rot), R1);
}
const thighFrame = (s, h) => mm(mm(rotX(-h.flex), rotZ(s * h.abd)), rotY(s * h.rot));

/** Skeleton in world metres. q: normalised pose (angles). */
export function fk(q, body) {
  const H = body.height, k = v => mul(v, H);
  const Rp = rotX(q.tilt), Rt = mm(Rp, rotX(q.trunk)), Rh = mm(Rt, rotX(q.neck));
  const hjc = [0, REF.hjcY, 0];
  const pelvis = r => add(q.root, mv(Rp, k(sub(r, hjc))));
  const Lw = pelvis(REF.lumbar);
  const thorax = r => add(Lw, mv(Rt, k(sub(r, REF.lumbar))));
  const Nw = thorax(REF.neck);
  const head = r => add(Nw, mv(Rh, k(sub(r, REF.neck))));
  // skinning for the one-piece torso outline: pelvis below .60, thorax .66-.845, head above .875, linear blends between
  const skin = r => {
    const y = r[1];
    if (y <= 0.60) return pelvis(r);
    if (y < 0.66) return lerp3(pelvis(r), thorax(r), (y - 0.60) / 0.06);
    if (y <= 0.845) return thorax(r);
    if (y < 0.875) return lerp3(thorax(r), head(r), (y - 0.845) / 0.03);
    return head(r);
  };
  const S = {}, E = {}, Wr = {}, G = {}, Hp = {}, K = {}, A = {}, fr = { ua: {}, fa: {}, hd: {}, th: {}, sk: {}, ft: {} };
  for (const side of SIDES) {
    const s = SGN[side], sc = q.scap[side];
    S[side] = add(thorax([s * REF.shX, REF.shY, 0]), mv(Rt, [0, sc.elev / 100, sc.pro / 100]));
    const Ua = mm(Rt, upperArmFrame(s, q.sh[side])), Fa = mm(Ua, rotX(-q.elbow[side])), Hd = mm(Fa, rotX(-q.wrist[side]));
    E[side] = add(S[side], mv(Ua, [0, -WINTER.upperArm * H, 0]));
    Wr[side] = add(E[side], mv(Fa, [0, -WINTER.forearm * H, 0]));
    G[side] = add(Wr[side], mv(Hd, [0, -REF.gripOff * H, 0]));
    Hp[side] = pelvis([s * REF.hjcX, REF.hjcY, 0]);
    const Th = mm(Rp, thighFrame(s, q.hip[side])), Sk = mm(Th, rotX(q.knee[side])), Ft = mm(Sk, rotX(-q.ankle[side]));
    K[side] = add(Hp[side], mv(Th, [0, -WINTER.thigh * H, 0]));
    A[side] = add(K[side], mv(Sk, [0, -WINTER.shank * H, 0]));
    Object.assign(fr.ua, { [side]: Ua }); fr.fa[side] = Fa; fr.hd[side] = Hd; fr.th[side] = Th; fr.sk[side] = Sk; fr.ft[side] = Ft;
  }
  const foot = (side, r) => add(A[side], mv(fr.ft[side], k(r)));   // r = foot-local (x lateral*s applied by caller, y, z)
  return { q, H, Rp, Rt, Rh, pelvis, thorax, head, skin, L: Lw, N: Nw, S, E, W: Wr, G, hip: Hp, K, A, fr, foot };
}

/** Named landmarks (world metres). Side-specific names end in .l / .r. */
export function landmarks(sk) {
  const out = {}, { H } = sk;
  for (const side of SIDES) {
    const s = SGN[side], t = sk.fr.th[side];
    const thR = limbR(...RADII.thigh);
    Object.assign(out, {
      [`shoulder.${side}`]: sk.S[side], [`shoulderTop.${side}`]: add(sk.S[side], mv(sk.Rt, [0, RADII.shoulderCap * H, 0])), [`elbow.${side}`]: sk.E[side], [`wrist.${side}`]: sk.W[side], [`grip.${side}`]: sk.G[side],
      [`hip.${side}`]: sk.hip[side], [`knee.${side}`]: sk.K[side], [`ankle.${side}`]: sk.A[side],
      [`heel.${side}`]: sk.foot(side, [0, -WINTER.ankleH, REF.heel + 0.008]), [`ball.${side}`]: sk.foot(side, [0, -WINTER.ankleH, REF.ball]),
      [`toe.${side}`]: sk.foot(side, [0, -0.028, REF.toe]), [`sole.${side}`]: sk.foot(side, [0, -WINTER.ankleH, REF.mid]),
      // thigh surfaces: top just above the knee (thigh/knee pads), underside at mid-thigh (seat edge)
      [`thighTop.${side}`]: add(add(sk.hip[side], mv(t, [0, -WINTER.thigh * H * 0.82, 0])), mv(t, [0, 0, thR(0.82) * H])),
      [`thighUnder.${side}`]: add(add(sk.hip[side], mv(t, [0, -WINTER.thigh * H * 0.5, 0])), mv(t, [0, 0, -thR(0.5) * H])),
    });
  }
  const mid = (a, b) => lerp3(a, b, 0.5);
  Object.assign(out, {
    hips: sk.q.root, lumbar: sk.L, neck: sk.N, shoulders: mid(sk.S.l, sk.S.r), grips: mid(sk.G.l, sk.G.r),
    head: sk.head([0, 1.0, 0]), ear: sk.head([0, 0.93, -0.005]), chin: sk.head([0, 0.872, 0.047]),
    chest: sk.thorax([0, 0.745, 0.072]), sternum: sk.thorax([0, 0.80, 0.07]), navel: sk.pelvis([0, 0.62, 0.066]),
    backUpper: sk.thorax([0, 0.75, -0.072]), backMid: sk.thorax([0, 0.68, -0.062]), sacrum: sk.pelvis([0, 0.585, -0.058]),
    buttock: sk.pelvis([0, 0.522, -0.080]), seat: sk.pelvis([0, 0.478, -0.025]),
    trap: { l: sk.thorax([0.078, 0.834, 0]), r: sk.thorax([-0.078, 0.834, 0]) },
  });
  out['trap.l'] = out.trap.l; out['trap.r'] = out.trap.r; delete out.trap;
  return out;
}

// ---------- IK ----------
/** 2-bone IK: root, target, lengths, pole (world direction the middle joint bulges toward). Returns { mid, end, err }. */
export function twoBone(root, target, L1, L2, pole) {
  const v = sub(target, root), D0 = len(v), u = norm(v);
  const D = clamp(D0, Math.abs(L1 - L2) + 1e-6, L1 + L2 - 1e-6);
  const a = (L1 * L1 - L2 * L2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  let w = sub(pole, mul(u, dot(pole, u)));
  if (len(w) < 1e-9) w = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [0, 0, 1];
  w = norm(sub(w, mul(u, dot(w, u))));
  const mid = add(add(root, mul(u, a)), mul(w, h)), end = add(root, mul(u, D));
  return { mid, end, err: Math.abs(D0 - D) };
}

// Solve hand-on-point for one side: sets shoulder elev/plane/rot and elbow. Wrist angle is kept.
function solveReach(q, body, side, c) {
  const H = body.height, s = SGN[side], sk = fk(q, body), S = sk.S[side];
  const w = q.wrist[side] * R, L1 = WINTER.upperArm * H, Lf = WINTER.forearm * H, g = REF.gripOff * H;
  const L2 = Math.hypot(Lf + g * Math.cos(w), g * Math.sin(w)), beta = Math.atan2(g * Math.sin(w), Lf + g * Math.cos(w)) / R;
  const pole = c.pole ?? [s * 0.5, -1, -0.3];
  const { mid: E, err } = twoBone(S, c.at, L1, L2, pole);
  const RtT = tr(sk.Rt), d = norm(mv(RtT, sub(E, S))), eg = norm(mv(RtT, sub(c.at, E)));
  // forearm = E->G direction turned back by beta inside the bend plane
  let bendN = cross(d, eg); if (len(bendN) < 1e-9) bendN = [s, 0, 0];
  const fa = mv(axisAngle(bendN, -beta), eg);
  const elev = Math.acos(clamp(-d[1], -1, 1)) / R;
  const prev = q.sh[side];
  let plane = elev > 0.5 ? Math.atan2(d[2], s * d[0]) / R : prev.plane;
  let sh = canonShoulder({ elev, plane, rot: 0 });
  const elbow = Math.acos(clamp(dot(d, fa), -1, 1)) / R;
  let rot = prev.rot;
  if (elbow > 0.5) {
    const A0 = upperArmFrame(s, { ...sh, rot: 0 }), b0 = mv(A0, [0, 0, 1]), dd = mv(A0, [0, -1, 0]);
    const b = norm(sub(fa, mul(dd, dot(fa, dd))));
    rot = -s * signedAngle(b0, b, dd);
  }
  q.sh[side] = { ...sh, rot }; q.elbow[side] = elbow;
  return err;
}
// Solve sole-on-plane for one side: c = { at, normal = up, toe = forward, ref: 'mid'|'ball'|'heel', pole = forward }.
function solvePlant(q, body, side, c) {
  const H = body.height, s = SGN[side], n = norm(c.normal ?? [0, 1, 0]);
  let hint = c.toe ?? [0, 0, 1], t = sub(hint, mul(n, dot(hint, n)));
  if (len(t) < 0.2) { hint = [0, 1, 0]; t = sub(hint, mul(n, dot(hint, n))); }
  t = norm(t);
  const zr = { mid: REF.mid, ball: REF.ball, heel: REF.heel + 0.008 }[c.ref ?? 'mid'] * H;
  const ankle = sub(add(c.at, mul(n, WINTER.ankleH * H)), mul(t, zr));
  const sk = fk(q, body), Hp = sk.hip[side];
  const { mid: Kn, end, err } = twoBone(Hp, ankle, WINTER.thigh * H, WINTER.shank * H, c.pole ?? t);   // default: the knee tracks the toes
  const RpT = tr(sk.Rp), d = norm(mv(RpT, sub(Kn, Hp))), sh = norm(mv(RpT, sub(end, Kn)));
  const flex = Math.atan2(d[2], -d[1]) / R, abd = Math.asin(clamp(s * d[0], -1, 1)) / R;
  const knee = Math.acos(clamp(dot(d, sh), -1, 1)) / R;
  let rot = q.hip[side].rot;
  if (knee > 0.5) {
    const T0 = thighFrame(s, { flex, abd, rot: 0 }), b0 = mv(T0, [0, 0, -1]), dd = mv(T0, [0, -1, 0]);
    const b = norm(sub(sh, mul(dd, dot(sh, dd))));
    rot = -s * signedAngle(b0, b, dd);
  }
  q.hip[side] = { flex, abd, rot }; q.knee[side] = knee;
  const sk2 = fk(q, body), tl = mv(tr(sk2.fr.sk[side]), t);
  q.ankle[side] = Math.atan2(tl[1], tl[2]) / R;
  return err;
}

/** Resolve IK constraints (reach, plant) into angles. Returns { q, contacts: [{ side, kind, errCm }] }. */
export function resolve(q, body) {
  q = structuredClone(q);
  const contacts = [];
  for (const side of SIDES) if (q.plant[side]) contacts.push({ side, kind: 'foot', errCm: +(solvePlant(q, body, side, q.plant[side]) * 100).toFixed(1) });
  for (const side of SIDES) if (q.reach[side]) contacts.push({ side, kind: 'hand', errCm: +(solveReach(q, body, side, q.reach[side]) * 100).toFixed(1) });
  // verify by forward kinematics (the drawn hand/foot must sit on the target)
  const sk = fk(q, body);
  for (const c of contacts) {
    if (c.kind === 'hand') c.errCm = +(len(sub(sk.G[c.side], q.reach[c.side].at)) * 100).toFixed(1);
    else { const lm = landmarks(sk), ref = q.plant[c.side].ref ?? 'mid', key = { mid: 'sole', ball: 'ball', heel: 'heel' }[ref];
      c.errCm = +(len(sub(lm[`${key}.${c.side}`], q.plant[c.side].at)) * 100).toFixed(1); }
  }
  return { q, contacts };
}

// ---------- interpolation ----------
function lerpDeep(a, b, t) {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, t);
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => lerpDeep(x, b[i], t));
  if (a && b && typeof a === 'object' && typeof b === 'object') { const o = {}; for (const k of Object.keys(a)) o[k] = k in b ? lerpDeep(a[k], b[k], t) : a[k]; return o; }
  return t < 0.5 ? a : b;
}
/** Interpolate two normalised poses. IK targets present in both are interpolated and re-solved; otherwise angles are. */
export function lerpPose(a, b, t, body) {
  const ra = resolve(a, body).q, rb = resolve(b, body).q, out = lerpDeep({ ...ra, reach: { l: null, r: null }, plant: { l: null, r: null } }, { ...rb, reach: { l: null, r: null }, plant: { l: null, r: null } }, t);
  for (const k of ['reach', 'plant']) for (const side of SIDES) if (a[k][side] && b[k][side]) out[k][side] = lerpDeep(a[k][side], b[k][side], t);
  return out;
}
/** Pose at t in [0, 1] along keyframes [start, ...via, end] (evenly spaced), resolved. */
export function poseAt(keys, t, body) {
  const n = keys.length - 1, x = clamp(t, 0, 1) * n, i = Math.min(n - 1, Math.floor(x));
  return resolve(lerpPose(keys[i], keys[i + 1], x - i, body), body);
}

// ---------- drawn shapes ----------
/**
 * Body shapes for one pose, in plate px. cam: { view: 'front'|'side', P(world)->[x,y] px, pxm, near: 'l'|'r' }.
 * Returns [{ key, group, d, poly }]. group: 'body' | 'arms' (front) or 'far' | 'trunk' | 'near' (side).
 */
export function bodyShapes(sk, cam, opts = {}) {
  const H = sk.H, px = r => r * H * cam.pxm, P = cam.P, out = [];
  const side = cam.view === 'side';
  // front view: a limb that points toward the camera (knee or hand well in front of its root joint) is drawn as
  // its own group over the torso, so its outline shows; everything else merges into one silhouette (reference look)
  const ahead = { arm: {}, leg: {} };
  for (const sd of SIDES) {
    ahead.arm[sd] = opts.armsFront || (sk.G[sd][2] - sk.S[sd][2] > 0.12 && sk.G[sd][1] < sk.S[sd][1] + 0.25) || sk.E[sd][2] - sk.S[sd][2] > 0.12;
    ahead.leg[sd] = sk.K[sd][2] - sk.hip[sd][2] > 0.12;
  }
  const grp = (part, s) => {
    if (!side) return ahead[part][s] ? (part === 'arm' ? 'arms' : 'legs') : 'body';
    if (s !== cam.near) return 'far';
    return part === 'arm' ? 'near' : 'trunk';
  };
  const push = (key, group, shp) => out.push({ key, group, ...shp });
  // head + torso
  const headPts = side ? HEAD_SIDE.map(([z, y]) => [0, y, z]) : HEAD_FRONT.map(([x, y]) => [x, y, 0]);
  push('head', side ? 'trunk' : 'body', { d: spline(headPts.map(r => P(sk.head(r)))), poly: headPts.map(r => P(sk.head(r))) });
  let torso;
  if (side) {
    const sh = (sk.q.scap.l.elev + sk.q.scap.r.elev) / 2 / 100 / H;
    torso = torsoSide(sh).map(([z, y]) => [0, y, z]);
  } else {
    const hl = torsoHalf(sk.q.scap.l.elev / 100 / H).slice(0, -1), hr = torsoHalf(sk.q.scap.r.elev / 100 / H).slice(0, -1);
    torso = [...hl.map(([x, y]) => [x, y, 0]), ...[...hr].reverse().map(([x, y]) => [-x, y, 0])];
  }
  const tp = torso.map(r => P(sk.skin(r)));
  push('torso', side ? 'trunk' : 'body', { d: spline(tp), poly: tp });
  for (const sd of SIDES) {
    const s = SGN[sd];
    const Hp = P(sk.hip[sd]), K = P(sk.K[sd]), A = P(sk.A[sd]);
    const [ta, tm, tb, tmm] = RADII.thigh, [sa, sm, sb, smm] = RADII.shank;
    push(`thigh.${sd}`, grp('leg', sd), limb(Hp, K, px(ta), px(tm), px(tb), tmm));
    push(`kneecap.${sd}`, grp('leg', sd), circle(K, px(RADII.kneeCap)));
    push(`shank.${sd}`, grp('leg', sd), limb(K, A, px(sa), px(sm), px(sb), smm));
    const fpts = (side ? FOOT_SIDE.map(([z, y]) => [0, y, z]) : FOOT_FRONT.map(([u, y]) => [s * u, y, REF.mid])).map(r => P(sk.foot(sd, r)));
    push(`foot.${sd}`, grp('leg', sd), { d: spline(fpts), poly: fpts });
    const S = P(sk.S[sd]), E = P(sk.E[sd]), W = P(sk.W[sd]), G = P(sk.G[sd]);
    const [ua, um, ub, umm] = RADII.upper, [fa, fm, fb, fmm] = RADII.fore;
    push(`shcap.${sd}`, grp('arm', sd), circle(S, px(RADII.shoulderCap)));
    push(`upper.${sd}`, grp('arm', sd), limb(S, E, px(ua), px(um), px(ub), umm));
    push(`elbowcap.${sd}`, grp('arm', sd), circle(E, px(RADII.elbowCap)));
    push(`fore.${sd}`, grp('arm', sd), limb(E, W, px(fa), px(fm), px(fb), fmm));
    if ((typeof opts.hand === 'object' ? opts.hand?.[sd] : opts.hand) === 'flat') push(`palm.${sd}`, grp('arm', sd), flatPalm(W, P(add(sk.W[sd], mul(sub(sk.G[sd], sk.W[sd]), WINTER.hand / REF.gripOff))), px));
    else push(`fist.${sd}`, grp('arm', sd), circle(G, px(RADII.fist)));
  }
  return out;
}
export const GROUP_ORDER = { front: ['body', 'legs', 'arms'], side: ['far', 'trunk', 'near'] };
// Open hand, palm flat (LIB-26; opts.hand 'flat' or { l, r }): wrist W to fingertips T (plate px), one closed outline
// that starts on the forearm's distal circle (RADII.fore[2]), so it joins the forearm in the arm's union with no gap.
// The palm side (toward screen-down) runs straight from the wrist to the knuckles at the forearm's distal radius, so a
// hand laid on a surface touches it along one line; the fingers taper up to the tips. The back of the hand drops from
// the wrist to the knuckles. Thickness in H: about 0.021 across the palm, 0.013 at the finger roots (3.7 / 2.3 cm at
// 175 cm). Pointing at the camera (T within 3 cm of W on screen), it reads as the forearm's end-on circle.
export function flatPalm(W, T, px) {
  const r0 = px(RADII.fore[2]), L = Math.hypot(T[0] - W[0], T[1] - W[1]);
  if (L < px(0.03 / 1.75)) return circle(W, r0);
  const u = [(T[0] - W[0]) / L, (T[1] - W[1]) / L];
  let n = [-u[1], u[0]]; if (n[1] > 0) n = [-n[0], -n[1]];              // n: the back of the hand (screen-up side)
  const at = (t, h) => [W[0] + u[0] * L * t + n[0] * h, W[1] + u[1] * L * t + n[1] * h];
  const back = [[0, r0], [0.25, px(0.006)], [0.55, px(0.003)], [0.8, px(0.001)], [0.96, -px(0.004)]];
  const palm = [[0.96, -px(0.009)], [0.8, -px(0.012)], [0.55, -r0], [0.25, -r0], [0, -r0]];
  const ps = [...back.map(([t, h]) => at(t, h)), at(1, -px(0.0065)), ...palm.map(([t, h]) => at(t, h)), at(-0.35 * r0 / L, 0)];
  return { d: spline(ps), poly: ps };
}

// ---------- authoring helpers ----------
/** Root (hip-joint centre midpoint) that puts the 'seat' landmark (buttock contact) on `point`, for a pelvis tilt. */
export function rootOnSeat(point, tilt = 0, height = 1.75) {
  const off = mv(rotX(tilt), mul(sub([0, 0.478, -0.025], [0, REF.hjcY, 0]), height));
  return sub(point, off);
}
/** Resolve an authored pose and return its landmarks (world metres), e.g. to place a pad against the back. */
export function landmarksOf(pose, height = 1.75) {
  const body = { height }, r = resolve(normPose(pose, body), body);
  return landmarks(fk(r.q, body));
}
