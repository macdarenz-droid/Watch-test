// Geometry helpers: 3D vectors and rotations (world metres) and 2D SVG path builders (plate px).
// Shape builders return { d, poly } so the layout step can rasterise what is drawn.
export const R = Math.PI / 180;
export const f = n => +(+n).toFixed(2);
export const pt = p => `${f(p[0])} ${f(p[1])}`;

// ---- 3D ----
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = a => Math.hypot(a[0], a[1], a[2]);
export const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// 3x3 matrices as row arrays. M·v, M·N, transpose.
export const mv = (M, v) => [dot(M[0], v), dot(M[1], v), dot(M[2], v)];
export const mm = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
export const tr = M => [0, 1, 2].map(i => [M[0][i], M[1][i], M[2][i]]);
export const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
// rotX(+a): the up vector tips forward (+z). rotY(+a): forward (+z) turns toward +x. rotZ(+a): down (-y) swings toward +x.
export const rotX = a => { const c = Math.cos(a * R), s = Math.sin(a * R); return [[1, 0, 0], [0, c, -s], [0, s, c]]; };
export const rotY = a => { const c = Math.cos(a * R), s = Math.sin(a * R); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; };
export const rotZ = a => { const c = Math.cos(a * R), s = Math.sin(a * R); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; };
// Rotation about unit axis k by a degrees (Rodrigues), as a matrix.
export function axisAngle(k, a) {
  const [x, y, z] = norm(k), c = Math.cos(a * R), s = Math.sin(a * R), C = 1 - c;
  return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
}
// Signed angle (deg) from a to b about axis n (all 3D; a, b perpendicular-ish to n).
export const signedAngle = (a, b, n) => Math.atan2(dot(norm(n), cross(a, b)), dot(a, b)) / R;

// ---- 2D (plate px, y down) ----
export const d2 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// Closed / open Catmull-Rom through screen points -> cubic Bezier path (same as the reference plate).
export function spline(ps, closed = true) {
  const n = ps.length, g = i => closed ? ps[(i + n) % n] : ps[Math.max(0, Math.min(n - 1, i))];
  let d = `M${pt(ps[0])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${pt(p2)}`;
  }
  return d + (closed ? 'Z' : '');
}
export const circlePoly = (c, r, n = 16) => Array.from({ length: n }, (_, i) => [c[0] + r * Math.cos(i * 2 * Math.PI / n), c[1] + r * Math.sin(i * 2 * Math.PI / n)]);
export const circle = (c, r) => ({ d: `M${f(c[0] - r)} ${f(c[1])}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`, poly: circlePoly(c, r) });
export const hexPts = (c, r, rot = 0) => [0, 60, 120, 180, 240, 300].map(a => [c[0] + r * Math.cos((a + rot) * R), c[1] + r * Math.sin((a + rot) * R)]);
export const polygon = ps => ({ d: 'M' + ps.map(pt).join('L') + 'Z', poly: ps });
export const polyline = (ps, w = 1) => ({ d: 'M' + ps.map(pt).join('L'), line: ps, w });
export const smooth = (ps, closed = true) => ({ d: spline(ps, closed), poly: closed ? ps : undefined, line: closed ? undefined : ps, w: 1 });
// Rounded rectangle along a centre line A->B with half-thickness t, corner radius rc (px).
export function bar(A, B, t, rc = Math.min(t, 3)) {
  const L = d2(A, B) || 1e-6, u = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], n = [-u[1], u[0]];
  const c = (P, a, b) => [P[0] + u[0] * a + n[0] * b, P[1] + u[1] * a + n[1] * b];
  const r = Math.min(rc, t, L / 2);
  const ps = [c(A, r, t), c(B, -r, t), c(B, 0, t - r), c(B, 0, -t + r), c(B, -r, -t), c(A, r, -t), c(A, 0, -t + r), c(A, 0, t - r)];
  const d = `M${pt(ps[0])}L${pt(ps[1])}Q${pt(c(B, 0, t))} ${pt(ps[2])}L${pt(ps[3])}Q${pt(c(B, 0, -t))} ${pt(ps[4])}L${pt(ps[5])}Q${pt(c(A, 0, -t))} ${pt(ps[6])}L${pt(ps[7])}Q${pt(c(A, 0, t))} ${pt(ps[0])}Z`;
  return { d, poly: [c(A, 0, t), c(B, 0, t), c(B, 0, -t), c(A, 0, -t)] };
}
// Axis-aligned rounded rect by centre (px).
export const rrect = (cx, cy, w, h, rc = 2) => bar([cx - w / 2, cy], [cx + w / 2, cy], h / 2, rc);

// Limb radius profile: from rA (proximal) through the belly rM at m to rB (distal). t in [0, 1].
export const limbR = (rA, rM, rB, m) => t => t < m ? rA + (rM - rA) * Math.sin((t / m) * Math.PI / 2) : rM + (rB - rM) * (1 - Math.cos(((t - m) / (1 - m)) * Math.PI / 2));
// A tapered limb with a muscle belly, from joint A to joint B (screen px), radii in px (reference limb()).
export function limb(A, B, rA, rM, rB, m = 0.35) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1e-6, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const r = limbR(rA, rM, rB, m);
  const at = (t, s) => [A[0] + dx * t + nx * r(t) * s, A[1] + dy * t + ny * r(t) * s];
  const ts = [0, 0.12, m * 0.7, m, 0.55, 0.78, 1], ps = [];
  ts.forEach(t => ps.push(at(t, 1)));
  for (const a of [50, 90, 130]) { const c = Math.cos(a * R), s = Math.sin(a * R); ps.push([B[0] + (nx * c + ux * s) * rB, B[1] + (ny * c + uy * s) * rB]); }
  [...ts].reverse().forEach(t => ps.push(at(t, -1)));
  for (const a of [50, 90, 130]) { const c = Math.cos(a * R), s = Math.sin(a * R); ps.push([A[0] + (-nx * c - ux * s) * rA, A[1] + (-ny * c - uy * s) * rA]); }
  return { d: spline(ps), poly: ps };
}
// Point on a circle (centre c, radius r) where a line from external point P is tangent. side = +1/-1 picks the tangent.
export function tangentPoint(c, r, P, side = 1) {
  const dx = P[0] - c[0], dy = P[1] - c[1], D = Math.hypot(dx, dy);
  if (D <= r) return [c[0] + dx / D * r, c[1] + dy / D * r];
  const a = Math.atan2(dy, dx), b = Math.acos(r / D) * side;
  return [c[0] + r * Math.cos(a + b), c[1] + r * Math.sin(a + b)];
}
