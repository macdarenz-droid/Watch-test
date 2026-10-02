// ENGINE TEST (not a real exercise card): the `poly` primitive (LIB-25). The _test_side seated row with a rope
// in place of the V-handle: a straight-edged ferrule and two curved, tapered strands with clubbed ends, all `poly`.
// The Mistake pose also lifts the hands, so the moving poly parts are outlined in the Mistake view (PQ-H9).
import base from './_test_side.mjs';

const PULLEY = [0, 0.33, 1.04];
const sub = (a, b) => a.map((v, i) => v - b[i]), add = (a, b) => a.map((v, i) => v + b[i]), mul = (a, k) => a.map(v => v * k);
const unit = a => mul(a, 1 / Math.hypot(...a));
const across = u => [0, -u[2], u[1]];                   // side view: in-plane normal of a direction in the y-z plane
function rope(g) {
  const dir = unit(sub(PULLEY, g)), fer = add(g, mul(dir, 0.22)), n = across(dir);
  const ferrule = [add(fer, mul(n, 0.008)), add(add(fer, mul(dir, 0.05)), mul(n, 0.005)), sub(add(fer, mul(dir, 0.05)), mul(n, 0.005)), sub(fer, mul(n, 0.008))];
  const strand = s => {                                 // from the ferrule to a stopper just past the fist, sagging 6 mm
    const tip = add(g, mul(dir, -0.07 + s * 0.004)), u = unit(sub(tip, fer)), m = across(u), L = Math.hypot(...sub(tip, fer));
    const c = (t, w) => add(add(fer, mul(u, L * t)), mul(m, w + 0.006 * Math.sin(Math.PI * Math.min(1, t / 0.75))));
    return [c(0, 0.012), c(0.4, 0.014), c(0.8, 0.014), c(0.9, 0.023), c(1, 0.013), c(1, -0.013), c(0.9, -0.023), c(0.8, -0.014), c(0.4, -0.014), c(0, -0.012)];
  };
  return [
    { type: 'poly', curve: true, pts: strand(1), cls: 'eq-solid', z: 'mid', part: 'handle' },
    { type: 'poly', curve: true, pts: strand(-1), cls: 'eq-solid', z: 'mid', part: 'handle' },
    { type: 'poly', pts: ferrule, cls: 'eq-solid', z: 'mid', part: 'handle' },
  ];
}

export default {
  ...base,
  id: '_test_poly', name: 'Engine test · poly',
  equipment: [
    ...base.equipment.slice(0, 3),
    (lm, ctx) => {
      const fer = g => add(g, mul(unit(sub(PULLEY, g)), 0.22));
      return [{ type: 'cableColumn', base: [0, 0, 1.25], pulley: { at: PULLEY, r: 0.045 }, to: fer(lm.grips), rest: fer(ctx.start.grips), wrap: -1, part: 'column' }];
    },
    lm => rope(lm.grips),
  ],
  mistake: {
    ...base.mistake,
    pose: { ...base.mistake.pose, reach: { l: { at: [0.075, 0.80, 0.21], pole: [0.2, -0.4, -1] }, r: { at: [-0.075, 0.80, 0.21], pole: [-0.2, -0.4, -1] } } },
  },
  alt: 'Engine test. Side view, seated on a bench, feet on a footplate, pulling a rope on a low cable to the stomach.',
};
