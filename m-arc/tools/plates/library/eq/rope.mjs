// Composer `rope` (library plan 2.1, drawn with the LIB-25 `poly` primitive): a triceps rope on a cable, side or
// front view. A metal ferrule on the cable, two rope strands from it to the hands, each ending in a rubber stopper
// just below the fist (neutral grip, thumbs up).
// Returns up to ROPE_ITEMS items; wrap it with perItem() (parts.mjs) so each part gets its own key.
// Assumed sizes (typical commercial triceps rope; the spec names its source): strands about 28 mm thick, 30 cm from
// the ferrule to the stopper, stoppers about 4.6 cm across and 3.5 cm long, ferrule 3.2 cm across and 5 cm long.
// Each strand is one closed `poly` outline (curve: true): it tapers from the ferrule to the hand, sags slightly under
// its own weight between the ferrule and the fist, and ends in a clubbed stopper. The ferrule is a straight-edged
// `poly`. Every moving part carries `poly`, so the Mistake view outlines it (PQ-H9). The cable is a line in the
// correct plate, like the approved cable plates; `mistakeTwin` adds a thin `poly` twin of the cable only in the
// Mistake pose, so a cable that moves in the Mistake is drawn in its outline too.
import { sub, add, mul, norm } from './parts.mjs';

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// The world axis that points at the camera: x in side view, z in front view. Outlines are built in the plane across it.
const VIEW_AXIS = { side: [1, 0, 0], front: [0, 0, 1] };
// In-plane unit normal of direction u (u with its view-axis part removed, turned 90 deg), pointing down on screen.
function planeNormal(u, view) {
  const a = VIEW_AXIS[view], p = norm(sub(u, mul(a, dot(u, a))));
  const n = view === 'side' ? [0, -p[2], p[1]] : [-p[1], p[0], 0];
  return n[1] > 0 ? mul(n, -1) : n;
}

/**
 * p.pulley: world centre of the pulley the cable leaves; p.grips: { l, r } world grip centres (lm['grip.l'/'grip.r']);
 * p.strand: ferrule-to-stopper length; p.below: grip centre to stopper centre along the strand.
 */
export function ropeGeometry({ pulley, grips, strand = 0.30, below = 0.055, ferrule = null }) {
  const mid = mul(add(grips.l, grips.r), 0.5), dir = norm(sub(mid, pulley));            // cable line toward the hands
  const half = Math.hypot(...sub(grips.l, grips.r)) / 2;
  const reach = Math.sqrt(Math.max(0.01, (strand - below) ** 2 - half * half));          // ferrule to hand midpoint
  ferrule = ferrule ?? sub(mid, mul(dir, reach));   // override: a spec that must keep the ferrule clear of the body
  return { ferrule, dir, strands: ['l', 'r'].map(s => ({ side: s, from: ferrule, grip: grips[s], dir: norm(sub(grips[s], ferrule)) })) };
}

/** A strand outline (world points, closed): centre line ferrule -> stopper tip with a sag, half-width profile w(t). */
export function strandOutline({ from, grip, dir, below, thick, knob, knobLen, sag, view }) {
  const tip = add(grip, mul(dir, below + knobLen / 2)), L = Math.hypot(...sub(tip, from));
  const n = planeNormal(dir, view), club = knobLen / L;                              // n: in-plane, screen-down side
  const t0 = 1 - club;                                                                // where the stopper starts
  // half-width: 0.9 of the rope at the ferrule, full rope from 15 %, then the stopper, rounded at the tip
  const w = t => t < 0.15 ? thick / 2 * (0.9 + 0.1 * t / 0.15) : t < t0 - 0.02 ? thick / 2
    : t < t0 + 0.02 ? thick / 2 + (knob / 2 - thick / 2) * (t - (t0 - 0.02)) / 0.04 : knob / 2;
  // the sag is zero at both ends (held by the ferrule and the fist) and deepest at 40 % of the free length
  const free = Math.max(0.01, 1 - (below + knobLen) / L);
  const s = t => t >= free ? 0 : sag * Math.sin(Math.PI * t / free) * (1 - 0.3 * t / free);
  const c = t => add(add(from, mul(dir, L * t)), mul(n, s(t)));
  const ts = [0, 0.15, 0.3, 0.45, 0.6, free - 0.02, t0 - 0.02, t0 + 0.02, 0.97].filter((t, i, a) => t > (a[i - 1] ?? -1) && t < 1);
  const left = ts.map(t => add(c(t), mul(n, w(t)))), right = ts.map(t => sub(c(t), mul(n, w(t)))).reverse();
  const cap = [add(tip, mul(n, knob * 0.28)), add(tip, mul(dir, knob * 0.12)), sub(tip, mul(n, knob * 0.28))];   // domed stopper end
  return [...left, ...cap, ...right];
}

export function rope({ pulley, grips, strand = 0.30, below = 0.055, ferrule = null, thick = 0.028, knob = 0.046, knobLen = 0.035,
  sag = 0.006, view = 'side', z = 'mid', part = 'rope', mistakeTwin = false, ctx = null }) {
  const g = ropeGeometry({ pulley, grips, strand, below, ferrule });
  const out = [{ type: 'cable', from: pulley, to: g.ferrule, z: 'center', part }];
  // ferrule (over the strand roots): a metal sleeve on the cable axis, 5 cm long, 3.2 cm across, narrowing to the cable eye
  const fn = planeNormal(g.dir, view), fa = sub(g.ferrule, mul(g.dir, 0.035)), fb = add(g.ferrule, mul(g.dir, 0.015));
  for (const s of g.strands) out.push({ type: 'poly', curve: true, cls: 'eq-solid', z, part, pts: strandOutline({ ...s, below, thick, knob, knobLen, sag, view }) });
  out.push({ type: 'poly', cls: 'eq-solid', z, part, pts: [add(fa, mul(fn, 0.008)), add(fb, mul(fn, 0.016)), sub(fb, mul(fn, 0.016)), sub(fa, mul(fn, 0.008))] });
  if (mistakeTwin && ctx?.pose === 'mistake') {
    const cn = planeNormal(norm(sub(g.ferrule, pulley)), view), t = 0.002;
    out.push({ type: 'poly', cls: 'eq', z: 'center', part, pts: [add(pulley, mul(cn, t)), add(g.ferrule, mul(cn, t)), sub(g.ferrule, mul(cn, t)), sub(pulley, mul(cn, t))] });
  }
  return out;
}

export const ROPE_ITEMS = 5;
