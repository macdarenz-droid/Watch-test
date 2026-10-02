// Equipment primitives: clean technical outlines at real-world scale (metres, world frame of body.mjs).
// Every primitive: (params, cam) -> [{ cls, d, poly?, line?, z }], drawn in plate px.
//   z: 'back' (behind the whole figure) | 'center' (behind the near leg, in front of the far limbs: the body's mid-plane)
//      | 'mid' (in front of the trunk and near leg, behind the near arm) | 'front' (in front of everything).
//   cls: 'eq' structure | 'eq-solid' held/contact parts | 'eq-line' frame lines | 'eq-thin' detail lines
//        | 'eq-cable' | 'eq-pin' axle dots | 'disc'/'disc-core' (dumbbell, as the reference) | 'floorline'.
// Assumed dimensions (defaults, all overridable) are listed in SPEC.md, section "Equipment".
import { R, add, sub, mul, dot, norm, len, clamp, d2, circle, polygon, polyline, bar, hexPts, tangentPoint, pt, f } from './geom.mjs';

// View helpers: hv = world unit that runs left->right on screen; m = px per metre.
function viewKit(cam) {
  const side = cam.view === 'side';
  const hv = side ? [0, 0, cam.facing === 'left' ? -1 : 1] : [1, 0, 0];
  const P = cam.P, m = cam.pxm;
  // point offset on screen from a world point: du along screen-right (m), dy up (m)
  const O = (w, du = 0, dy = 0) => { const p = P(w); return [p[0] + du * m, p[1] - dy * m]; };
  return { side, hv, P, m, O };
}
const item = (cls, shp, z = 'back') => ({ cls, z, ...shp });

// ---- floor ----
export function floor({ from = -0.5, to = 0.5, y = 0 } = {}, cam) {
  const { side, P } = viewKit(cam);
  const w = v => Array.isArray(v) ? v : (side ? [0, y, v] : [v, y, 0]);
  const a = P(w(from)), b = P(w(to)), yy = f(a[1] + 0.5);
  return [{ cls: 'floorline', z: 'floor', d: `M${f(Math.min(a[0], b[0]))} ${yy}H${f(Math.max(a[0], b[0]))}`, line: [[a[0], yy], [b[0], yy]], w: 1 }];
}

// ---- dumbbell: hex head (reference: 12 cm across the corners), handle 13 cm, heads 7 cm long ----
export function dumbbell({ at, axis = null, head = 0.119, headLen = 0.07, handle = 0.13, z = 'front' } = {}, cam) {
  const { P, m } = viewKit(cam), G = P(at);
  const ax = axis ?? (cam.view === 'side' ? [1, 0, 0] : [0, 0, 1]);
  const A = P(add(at, mul(norm(ax), 0.1))), proj = d2(G, A) / (0.1 * m);
  if (proj < 0.35) {   // end-on: hex face
    return [item('disc', polygon(hexPts(G, head / 2 * m)), z), item('disc-core', circle(G, 0.0158 * m), z)];
  }
  const u = [(A[0] - G[0]) / d2(G, A), (A[1] - G[1]) / d2(G, A)], o = k => [G[0] + u[0] * k * m * proj, G[1] + u[1] * k * m * proj];
  const hh = head * 0.866 / 2 * m;   // side-on: height across the flats
  const out = [item('eq-solid', bar(o(-handle / 2 - 0.005), o(handle / 2 + 0.005), 0.016 * m, 1), z)];
  for (const s of [-1, 1]) out.push(item('disc', bar(o(s * handle / 2), o(s * (handle / 2 + headLen)), hh, 1.5), z));
  return out;
}

// ---- pull-up bar: 32 mm bar, 1.07 m between the mounts, wall stub 30 cm ----
export function pullupBar({ at, width = 1.07, d = 0.032, stub = 0.30, mount = 'wall' } = {}, cam) {
  const { side, P, m, O } = viewKit(cam), c = P(at), out = [];
  if (side) {
    const back = cam.facing === 'left' ? 1 : -1;   // wall behind the figure
    if (mount === 'wall') {
      const e = [c[0] + back * stub * m, c[1]];
      out.push(item('eq', bar(c, e, 0.02 * m, 2)), item('eq', bar([e[0], e[1] - 0.12 * m], [e[0], e[1] + 0.12 * m], 0.012 * m, 1)));
    } else out.push(item('eq', bar(c, [c[0], c[1] - stub * m], 0.02 * m, 2)));
    out.push(item('eq-solid', circle(c, d / 2 * m)), item('eq-pin', circle(c, 0.6)));
  } else {
    const a = O(at, -width / 2 - 0.05), b = O(at, width / 2 + 0.05);
    out.push(item('eq-solid', bar(a, b, d / 2 * m, d / 2 * m)));
    for (const s of [-1, 1]) { const p = O(at, s * width / 2); out.push(item('eq', bar(p, [p[0], p[1] - (mount === 'wall' ? 0.08 : stub) * m], 0.02 * m, 2))); }
  }
  return out;
}

// ---- weight stack: 5 kg plates 2.5 cm thick, 22 cm wide, guide rods, the top `load` plates lifted ----
export function stack({ base, plates = 16, plateH = 0.025, w = 0.22, load = 6, lift = 0, rods = true, z = 'back' } = {}, cam) {
  const { O } = viewKit(cam), out = [];
  const b0 = O(base, 0, 0.06);   // bottom stop blocks
  out.push(item('eq', bar(O(base, -w / 2, 0.03), O(base, w / 2, 0.03), 0.03 * cam.pxm, 1), z));
  const stay = plates - load, lf = Math.max(0, lift);
  const block = (y0, n, cls) => {
    const tl = O(base, -w / 2, y0 + n * plateH), br = O(base, w / 2, y0);
    out.push(item(cls, polygon([[tl[0], tl[1]], [br[0], tl[1]], [br[0], br[1]], [tl[0], br[1]]]), z));
    const lines = [];
    for (let i = 1; i < n; i++) { const yy = O(base, 0, y0 + i * plateH)[1]; lines.push(`M${f(tl[0])} ${f(yy)}H${f(br[0])}`); }
    if (lines.length) out.push({ cls: 'eq-thin', z, d: lines.join('') });
  };
  if (rods) for (const s of [-0.3, 0.3]) { const a = O(base, s * w, 0.06), t = O(base, s * w, 0.06 + plates * plateH + 0.35); out.push({ cls: 'eq-thin', z, d: `M${pt(a)}L${pt(t)}`, line: [a, t], w: 1 }); }
  block(0.06, stay, 'eq');
  block(0.06 + stay * plateH + lf, load, 'eq');
  out.topY = 0.06 + plates * plateH + lf;   // world height of the stack top (for the cable)
  void b0;
  return out;
}

// ---- cable column: upright frame 2.1 m, pulley 9 cm, cable to the handle, stack inside the frame ----
// pulley.at: world centre; to: where the cable meets the handle; rest: that point in the start pose (sets the stack lift).
export function cableColumn({ base, height = 2.1, width = 0.34, pulley, to, rest = null, ratio = 1, wrap = 1, stack: st = {}, z = 'back' } = {}, cam) {
  const { P, m, O } = viewKit(cam), out = [];
  const pw = 0.05;
  for (const s of [-1, 1]) out.push(item('eq', bar(O(base, s * (width / 2 - pw / 2), 0), O(base, s * (width / 2 - pw / 2), height), pw / 2 * m, 1), z));
  out.push(item('eq', bar(O(base, -width / 2, height - 0.03), O(base, width / 2, height - 0.03), 0.03 * m, 1), z));
  out.push(item('eq', bar(O(base, -width / 2 - 0.06, 0.012), O(base, width / 2 + 0.06, 0.012), 0.012 * m, 1), z));
  const pr = pulley.r ?? 0.045, pc = P(pulley.at);
  const lift = rest ? (len(sub(to, pulley.at)) - len(sub(rest, pulley.at))) / ratio : 0;
  const stk = stack({ base, w: Math.min(0.22, width - 2 * pw - 0.02), lift, ...st, z }, cam);
  out.push(...stk);
  // cable: handle -> low pulley (tangent) -> up the column -> top pulley -> down to the stack top
  const H = P(to), tp = tangentPoint(pc, pr * m, H, wrap);
  const inner = [pc[0] + (P(base)[0] > pc[0] ? 1 : -1) * pr * m, pc[1]];
  const topP = O(base, 0, height - 0.09), topR = 0.035 * m;
  const stTop = O(base, 0, stk.topY);
  out.push({ cls: 'eq-cable', z: 'center', d: `M${pt(H)}L${pt(tp)}`, line: [H, tp], w: 1 });
  out.push({ cls: 'eq-cable', z, d: `M${pt(inner)}L${f(inner[0])} ${f(topP[1])}M${f(topP[0])} ${f(topP[1] + topR)}L${pt(stTop)}` });
  out.push(item('eq-solid', circle(pc, pr * m), z), item('eq-pin', circle(pc, 1), z));
  out.push(item('eq', circle(topP, topR), z), item('eq-pin', circle(topP, 1), z));
  return out;
}

// ---- lat-pulldown bar: 1.22 m, straight centre 60 cm, ends dropped 12 cm; cable to the high pulley ----
export function latBarPoint({ at, width = 1.22, straight = 0.6, drop = 0.12 }, u) {   // world point on the bar at lateral u (m)
  const a = Math.abs(u), s = Math.sign(u) || 1;
  const dy = a <= straight / 2 ? 0 : -drop * (a - straight / 2) / (width / 2 - straight / 2);
  return [at[0] + s * a, at[1] + dy, at[2]];
}
export function latBar({ at, width = 1.22, straight = 0.6, drop = 0.12, d = 0.028, cableTo = null, z = 'center' } = {}, cam) {
  const { side, P, m } = viewKit(cam), out = [];
  if (side) {
    out.push(item('eq-solid', circle(P(at), d / 2 * m), z));
    const e = P(latBarPoint({ at, width, straight, drop }, width / 2));
    if (Math.abs(e[1] - P(at)[1]) > 1) out.push(item('eq-solid', circle(e, d / 2 * m), 'back'));
  } else {
    const k = [-width / 2, -straight / 2, straight / 2, width / 2].map(u => P(latBarPoint({ at, width, straight, drop }, u)));
    for (let i = 0; i < 3; i++) out.push(item('eq-solid', bar(k[i], k[i + 1], d / 2 * m, d / 2 * m), z));
  }
  if (cableTo) { const a = P(at), b = P(cableTo); out.push({ cls: 'eq-cable', z: 'back', d: `M${pt(a)}L${pt(b)}`, line: [a, b], w: 1 }); }
  return out;
}

// ---- V-handle (close-grip row): parallel grips 15 cm apart, 22 cm from the grips to the cable ring ----
export function vHandle({ at, toward = [0, 0, 1], length = 0.22, sep = 0.15, z = 'mid' } = {}, cam) {
  const { side, P, m, O } = viewKit(cam), out = [], g = P(at), e = P(add(at, mul(norm(toward), length)));
  if (side) {
    out.push(item('eq-solid', bar(g, e, 0.014 * m, 2), z));
    out.push(item('eq-solid', bar([g[0], g[1] - 0.06 * m], [g[0], g[1] + 0.06 * m], 0.015 * m, 2), z));
    out.push(item('eq', circle(e, 0.02 * m), z));
  } else {
    for (const s of [-1, 1]) { const q = O(at, s * sep / 2); out.push(item('eq-solid', bar(q, e, 0.012 * m, 2), z), item('eq-solid', bar([q[0], q[1] - 0.06 * m], [q[0], q[1] + 0.06 * m], 0.015 * m, 2), z)); }
    out.push(item('eq', circle(e, 0.02 * m), z));
  }
  return out;
}

// ---- row footplate: 30 cm tall, 2.5 cm thick, top tilted `angle` deg away from the user; strut to the floor ----
// The user faces +z (world forward), so the plate face looks back (-z) toward the user.
export const footplateFace = ({ at, angle = 20 }) => ({ at, normal: [0, Math.sin(angle * R), -Math.cos(angle * R)] });
export function rowFootplate({ at, angle = 20, h = 0.30, t = 0.025, below = 0.12, z = 'back' } = {}, cam) {
  const { P, m } = viewKit(cam), { normal: n } = footplateFace({ at, angle });
  const upv = [0, Math.cos(angle * R), Math.sin(angle * R)];   // along the face, pointing up (top leans away)
  const c = add(at, mul(n, -t / 2));
  const a = P(add(c, mul(upv, -below))), b = P(add(c, mul(upv, h - below)));
  const out = [item('eq', bar(a, b, t / 2 * m, 1.5), z)];
  const back = add(c, mul(n, -t / 2)), mid = P(add(back, mul(upv, h * 0.25 - below)));
  const foot = P([back[0], 0.012, back[2] + 0.16]);
  out.push(item('eq', bar(mid, foot, 0.018 * m, 1), z));
  out.push(item('eq', bar([foot[0] - 0.08 * m, foot[1]], [foot[0] + 0.08 * m, foot[1]], 0.012 * m, 1), z));
  return out;
}

// ---- flat bench: pad top at `at` (y = 0.43 m standard), 1.2 m long, 29 cm wide, 6 cm pad, T-legs ----
export function bench({ at, len: L = 1.2, width = 0.29, pad = 0.06, axis = 'z', legs = true, legInset = 0.12, z = 'back' } = {}, cam) {
  const { side, P, m, O } = viewKit(cam), out = [];
  const along = (side && axis === 'z') || (!side && axis === 'x');
  const half = (along ? L : width) / 2;
  const top = at[1];
  const a = O(at, -half, -pad / 2), b = O(at, half, -pad / 2);
  out.push(item('eq', bar(a, b, pad / 2 * m, Math.min(4, pad / 2 * m)), z));
  if (!legs) return out;
  const beamY = top - pad - 0.025;
  if (along) {
    out.push(item('eq', bar(O([at[0], beamY, at[2]], -half + legInset - 0.03), O([at[0], beamY, at[2]], half - legInset + 0.03), 0.025 * m, 1), z));
    for (const s of [-1, 1]) {
      const x = s * (half - legInset);
      out.push(item('eq', bar(O([at[0], beamY, at[2]], x), O([at[0], 0.03, at[2]], x), 0.025 * m, 1), z));
      out.push(item('eq', bar(O([at[0], 0.015, at[2]], x - 0.05), O([at[0], 0.015, at[2]], x + 0.05), 0.015 * m, 1), z));
    }
  } else {
    out.push(item('eq', bar(O([at[0], beamY + 0.01, at[2]], 0), O([at[0], 0.03, at[2]], 0), 0.03 * m, 1), z));
    out.push(item('eq', bar(O([at[0], 0.015, at[2]], -0.22), O([at[0], 0.015, at[2]], 0.22), 0.015 * m, 1), z));
  }
  return out;
}
// ---- machine seat: 40 cm pad on a centre post ----
export const seat = (p = {}, cam) => bench({ len: 0.4, width: 0.36, pad: 0.07, legInset: 0.2, ...p, legs: false }, cam)
  .concat(p.post === false ? [] : (() => { const { O, m } = viewKit(cam); const t = (p.at[1]) - (p.pad ?? 0.07) - 0.01;
    return [item('eq', bar(O([p.at[0], t, p.at[2]]), O([p.at[0], 0.03, p.at[2]]), 0.03 * m, 1), p.z ?? 'back'), item('eq', bar(O([p.at[0], 0.015, p.at[2]], -0.22), O([p.at[0], 0.015, p.at[2]], 0.22), 0.015 * m, 1), p.z ?? 'back')]; })());

// ---- back pad: face through `at` (or tangent to surface [upper, lower]), 60 cm long, 7 cm thick ----
export function backPad({ at, angle = 0, surface = null, len: L = 0.6, t = 0.07, below = 0.2, post = true, width = 0.3, z = 'back' } = {}, cam) {
  const { side, P, m } = viewKit(cam), out = [];
  let u, c;
  if (surface) { u = norm(sub(surface[0], surface[1])); c = surface[1]; below = below ?? 0.1; }
  else { u = [0, Math.cos(angle * R), -Math.sin(angle * R)]; c = at; }
  const n = norm([0, -u[2], u[1]]);   // pad face normal, toward the user (forward)
  const back = mul(n, -t / 2);
  const a = P(add(add(c, back), mul(u, -below))), b = P(add(add(c, back), mul(u, L - below)));
  if (side) out.push(item('eq', bar(a, b, t / 2 * m, Math.min(4, t / 2 * m)), z));
  else { const mid = add(c, mul(u, L / 2 - below)); const pc = P(mid), h = Math.abs(a[1] - b[1]) / 2 + 2; out.push(item('eq', bar([pc[0] - width / 2 * m, pc[1]], [pc[0] + width / 2 * m, pc[1]], h, 3), z)); }
  if (post && side) {
    const pm = add(add(c, mul(n, -t)), mul(u, L / 2 - below - 0.1)), fp = P(pm), fl = P([pm[0], 0.03, pm[2] - n[2] * 0.08]);
    out.push(item('eq', bar(fp, fl, 0.022 * m, 1), z));
  }
  return out;
}

// ---- knee / thigh roller pad: 11 cm roller touching `at` from the `normal` side, post to `postTo` ----
export function kneePad({ at, r = 0.055, normal = [0, 1, 0], postTo = null, z = 'front' } = {}, cam) {
  const { P, m } = viewKit(cam), c = add(at, mul(norm(normal), r)), pc = P(c), out = [];
  if (postTo) out.push(item('eq', bar(pc, P(postTo), 0.02 * m, 1), z));
  out.push(item('eq', circle(pc, r * m), z), item('eq-pin', circle(pc, 1), z));
  return out;
}

// ---- 45-degree leg press: rails at `angle` rising forward (+z), sled + footplate (70 cm face), seat and back pad ----
// rail.from: world point at the low end of the rail line. The plate face centre rides `offset` above the rail line.
export const railDir = lp => { const a = (lp.rail?.angle ?? 45) * R; return [0, Math.sin(a), Math.cos(a)]; };
export function legPressFace(lp, travel) {   // world centre of the plate face, its normal (toward the user) and its up
  const dir = railDir(lp), nUp = [0, dir[2], -dir[1]], off = lp.offset ?? 0.2, tilt = (lp.plate?.tilt ?? 0) * R;
  const at = add(add(lp.rail.from, mul(dir, travel)), mul(nUp, off));
  const n = norm(add(mul(dir, -Math.cos(tilt)), mul(nUp, Math.sin(tilt))));
  return { at, normal: n, up: norm(add(mul(nUp, Math.cos(tilt)), mul(dir, Math.sin(tilt)))) };
}
export function legPress45(lp = {}, cam) {
  const { P, m } = viewKit(cam), out = [];
  const dir = railDir(lp), L = lp.rail?.length ?? 1.5, from = lp.rail.from, to = add(from, mul(dir, L)), nUp = [0, dir[2], -dir[1]];
  for (const o of [0, -0.04]) { const a = P(add(from, mul(nUp, o))), b = P(add(to, mul(nUp, o))); out.push({ cls: 'eq-line', z: 'back', d: `M${pt(a)}L${pt(b)}`, line: [a, b], w: 1 }); }
  const lowF = P([from[0], 0.02, from[2]]), topF = P([to[0], 0.02, to[2]]);
  out.push(item('eq', bar(P(add(to, mul(nUp, -0.06))), topF, 0.03 * m, 1)), item('eq', bar(P(add(from, mul(nUp, -0.06))), lowF, 0.03 * m, 1)));
  const x0 = lp.seat ? P([0, 0, lp.seat.at[2] - 0.3])[0] : lowF[0];
  out.push(item('eq', bar([Math.min(x0, topF[0]) - 0.04 * m, lowF[1]], [Math.max(x0, topF[0]) + 0.04 * m, lowF[1]], 0.02 * m, 1)));
  // sled + plate (moves with `travel`, metres along the rail)
  const tv = lp.travel ?? 0, fc = legPressFace(lp, tv), ph = lp.plate?.h ?? 0.7, pth = lp.plate?.t ?? 0.035;
  const c = add(fc.at, mul(fc.normal, -pth / 2));
  const pa = P(add(c, mul(fc.up, -ph * 0.35))), pb = P(add(c, mul(fc.up, ph * 0.65)));
  const railPt = add(from, mul(dir, tv));
  out.push(item('eq', bar(P(add(railPt, mul(dir, -0.05))), P(add(railPt, mul(dir, 0.40))), 0.04 * m, 2), 'back'));
  out.push(item('eq', bar(P(add(railPt, mul(nUp, 0.03))), P(add(fc.at, mul(fc.normal, -pth))), 0.03 * m, 1), 'back'));
  out.push(item('eq-solid', bar(pa, pb, pth / 2 * m, 1.5), 'back'));
  // seat (front edge higher by seat.angle) and back pad, static
  if (lp.seat) {
    const sl = lp.seat.len ?? 0.45;
    out.push(...backPad({ at: lp.seat.at, angle: 90 + (lp.seat.angle ?? 0), len: sl, below: sl / 2, t: 0.07, post: false }, cam));
    const s0 = P([lp.seat.at[0], lp.seat.at[1] - 0.09, lp.seat.at[2]]);
    out.push(item('eq', bar(s0, [s0[0], lowF[1]], 0.03 * m, 1)));
  }
  if (lp.back) out.push(...backPad({ post: false, ...lp.back }, cam));
  return out;
}

// ---- chest-press handle on a pivot arm: neutral grip 14 cm, lever 5 cm thick, pivot 8 cm ----
export function chestPress({ pivot, handle, grip = 0.14, gripAxis = [0, 1, 0], frameTo = null, z = 'mid' } = {}, cam) {
  const { P, m } = viewKit(cam), pv = P(pivot), h = P(handle), out = [];
  if (frameTo) out.push(item('eq', bar(pv, P(frameTo), 0.035 * m, 1), 'back'));
  const g0 = P(add(handle, mul(norm(gripAxis), -grip / 2))), g1 = P(add(handle, mul(norm(gripAxis), grip / 2)));
  const gproj = d2(g0, g1);
  const lever = gproj > 3 ? g1 : h;   // the lever meets the top of a neutral grip
  out.push(item('eq', bar(pv, lever, 0.025 * m, 2), z));
  out.push(item('eq-solid', gproj > 3 ? bar(g0, g1, 0.016 * m, 0.016 * m) : circle(h, 0.016 * m), z));
  out.push(item('eq', circle(pv, 0.04 * m), z), item('eq-pin', circle(pv, 1.2), z));
  return out;
}

// ---- barbell: 20 kg bar 2.2 m, 28 mm shaft, inner collars at +-0.655 m, 450 mm plates ----
export function barbell({ at, plateD = 0.45, plates = [0.045], barLen = 2.2, collar = 0.655, shaftD = 0.028, sleeveD = 0.05, z = 'front' } = {}, cam) {
  const { side, P, m, O } = viewKit(cam), c = P(at), out = [];
  if (side) {
    // the near plate is drawn as an outline over the figure (x-ray), so the hands and legs behind it stay readable
    out.push(item('eq-line', { d: circle(c, plateD / 2 * m).d, line: circle(c, plateD / 2 * m).poly.concat([circle(c, plateD / 2 * m).poly[0]]) }, 'front'), item('eq-thin', { d: circle(c, plateD / 2 * m * 0.82).d }, 'front'));
    out.push(item('eq-solid', circle(c, sleeveD / 2 * m), z), item('eq-pin', circle(c, 1), z));
    return out;
  }
  out.push(item('eq-solid', bar(O(at, -collar), O(at, collar), shaftD / 2 * m, 1), z));
  for (const s of [-1, 1]) {
    out.push(item('eq-solid', bar(O(at, s * collar), O(at, s * barLen / 2), sleeveD / 2 * m, 1), z));
    out.push(item('eq-solid', bar(O(at, s * (collar - 0.01)), O(at, s * (collar + 0.02)), 0.04 * m, 1), z));
    let x = collar + 0.025;
    for (const tp of plates) { out.push(item('eq', bar(O(at, s * x), O(at, s * (x + tp)), plateD / 2 * m, 2), z)); x += tp; }
  }
  return out;
}

// ---- squat-rack upright: 7.6 cm (3 in) square tube, 2.3 m, J-hook at `hook` height ----
export function rackUpright({ at, h = 2.3, w = 0.076, hook = null, span = 1.2, z = 'back' } = {}, cam) {
  const { side, P, m, O } = viewKit(cam), out = [];
  const xs = side ? [0] : [-span / 2 - w / 2, span / 2 + w / 2];
  for (const x of xs) {
    const b = O(at, x, 0), t = O(at, x, h);
    out.push(item('eq', bar(b, t, w / 2 * m, 1), z));
    const holes = [];
    for (let y = 0.3; y < h - 0.1; y += 0.05) { const p = O(at, x, y); holes.push(`M${f(p[0] - 0.6)} ${f(p[1])}h1.2`); }
    out.push({ cls: 'eq-thin', z, d: holes.join('') });
    if (hook != null) {
      const fw = side ? (cam.facing === 'left' ? -1 : 1) : 0, s = side ? fw : Math.sign(x) * -1;
      const a = O(at, x + s * w / 2, hook), k = [a[0] + s * 0.07 * m, a[1]];
      out.push(item('eq', polygon([a, k, [k[0], k[1] - 0.05 * m], [k[0] - s * 0.015 * m, k[1] - 0.05 * m], [k[0] - s * 0.015 * m, k[1] - 0.015 * m], [a[0], a[1] - 0.015 * m]]), z));
    }
  }
  return out;
}

// ---- generic helpers ----
export function cable({ from, to, z = 'center' } = {}, cam) { const { P } = viewKit(cam), a = P(from), b = P(to); return [{ cls: 'eq-cable', z, d: `M${pt(a)}L${pt(b)}`, line: [a, b], w: 1 }]; }
export function pulley({ at, r = 0.045, z = 'back' } = {}, cam) { const { P, m } = viewKit(cam), c = P(at); return [item('eq-solid', circle(c, r * m), z), item('eq-pin', circle(c, 1), z)]; }
export function box({ at, w = 0.1, h = 0.1, rc = 2, cls = 'eq', z = 'back' } = {}, cam) { const { O, m } = viewKit(cam); return [item(cls, bar(O(at, -w / 2), O(at, w / 2), h / 2 * m, rc), z)]; }
export function line({ pts, cls = 'eq-line', z = 'back' } = {}, cam) { const { P } = viewKit(cam), ps = pts.map(P); return [{ cls, z, ...polyline(ps) }]; }

export const PRIMITIVES = { floor, dumbbell, pullupBar, stack, cableColumn, latBar, vHandle, rowFootplate, bench, seat, backPad, kneePad, legPress45, chestPress, barbell, rackUpright, cable, pulley, box, line };
