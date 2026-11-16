# Technical Plate engine: exercise spec

One file per exercise: `plates2/exercises/<id>.mjs`, `export default { ...spec }`.
Render it: `node plates2/engine/render.mjs <id>` (options: `--selected <key>`, `--paper-selected <key>`,
`--mistake-selected <key>`, `--html` also keeps the HTML in `out/`). Output: `out/<id>-dark.png`, `out/<id>-paper.png`,
`out/<id>-mistake-dark.png` (390 px wide, device scale 2, sheet chrome of the reference) and a JSON report on stdout.
Runs are parallel-safe (own temp folder, own browser).

Debug helpers: `node engine/zoom.mjs <id> [mistake]` (the plate alone at 3x, `out/<id>-zoom.png`),
`node engine/gallery.mjs` (every equipment primitive posed with a body, `out/_gallery.png`).

The look is the reference plate (`ref-src/plate.mjs`): same SVG structure, same class names, its `PLATE_CSS`
unchanged, plus `ENGINE_CSS` (new classes only: `.far`, `.eq*`, `.m-pose`). Every colour is a theme token.

## 1. Units and axes

- World: metres. `x` = the figure's LEFT, `y` = up, `z` = the figure's FORWARD. Floor `y = 0`. The figure always
  faces `+z`; the camera decides how that shows.
- Sides: `l` = figure's left, `r` = figure's right. Front view: the figure's right is on the viewer's LEFT.
- Side view, `facing: 'right'` (default): the figure faces screen right, the near side is `r`, far side `l`.
  `facing: 'left'`: near side `l`.
- Camera default = reference: 256 px per 1.75 m body (146.29 px/m), world `x|z = 0` at plate x 179, floor at
  plate y 339. Plate is 358 x 358 px. Override with `camera: { pxPerM, x0, y0 }` or `camera: { fit: true | {left,
  right, top, bottom} margins, maxScale }` (fits start, ghosts, end and equipment, never larger than the reference
  unless `maxScale > 1`).
- Angles: degrees.

## 2. Body model

Winter (2009) proportions of H (default H = 1.75 m): upper arm .186, forearm .146, hand .108, thigh .245, shank .246,
foot .152, shoulder width .259, hip-joint centre (HJC) at .530, knee .285, ankle .039. Grip centre .46 of the hand
from the wrist. HJCs 17.5 cm apart. Glenohumeral centre .80 H. Spine bend pivot at .62 H, neck pivot at .855 H.
Side torso: chest depth 25 cm, waist 20 cm, buttock 24 cm, neck 11 cm; plumb line through ear, shoulder and HJC.
Seated: the buttock contact (`seat` landmark) is 9.1 cm under and 4.4 cm behind the HJC.

Drawing: tapered limbs with a muscle belly, round caps (shoulder, elbow, knee), fist circle, head with skull, jaw and
chin (front) or a feature-free profile (side). Front view: one merged silhouette (reference), except a limb that
points at the camera (knee or hand well in front of its root) is drawn over the torso with its own outline.
Side view: far limbs first in a lighter stroke (`.far`), then torso + head + near leg, then the near arm.

## 3. Poses (by joint angles)

```js
{
  root: { at: [x, y, z], tilt },   // HJC midpoint (m); tilt = pelvis tilt, + forward (anterior), - leaning back
  trunk: 0,                        // spine flexion relative to the pelvis, + forward
  neck: 0,                         // head flexion relative to the thorax, + chin down
  scap: { elev, pro },             // shoulder girdle offset in cm: elev + shrug, pro + protract / - retract
  shoulder: { elev, plane, rot },  // elev from hanging; plane 0 = abduction plane, 90 = flexion plane; rot + external
            // sugar: { flex } | { ext } | { abd } | { flex, abd } (the angles seen in the side and front view)
  elbow: 0, wrist: 0,              // flexion
  hip: { flex, abd, rot },         // or a number = flex
  knee: 0,                         // flexion
  ankle: 0,                        // + dorsiflexion (toes up), - plantarflexion
  reach: { at: [x,y,z], pole },    // IK: grip centre ON this point; pole = world direction the elbow points
  plant: { at, normal, toe, ref, pole },   // IK: sole ON a plane; at = contact point, normal = plane normal
            // (default up), toe = heel-to-toe hint (default forward), ref 'mid' | 'ball' | 'heel', pole = knee
            // direction (default = toe direction: the knee tracks the toes)
}
```

Any per-side field takes one value for both sides or `{ l, r }`. IK writes angles, so the report always lists the
real joint angles. Interpolation (`lerpPose`, `poseAt`): angles are interpolated; an IK target present in both key
poses is interpolated and re-solved at every sample, so hands stay on a moving handle and feet stay on the plate.
`poses.via: [pose, ...]` adds key poses between start and end (evenly spaced in t) for curved paths.

Helpers (`import { ... } from '../engine/index.mjs'`):
`rootOnSeat(point, tilt, H)` root that puts the `seat` landmark on a surface point;
`landmarksOf(pose, H)` resolved landmarks (use them to put a pad against the back);
`footplateFace({ at, angle })`, `legPressFace(legPress, travel)` contact point + normal for `plant`;
`latBarPoint(bar, u)` a point on the lat bar at lateral offset u for `reach`.

### Landmarks (world, per pose)
`shoulder|shoulderTop|elbow|wrist|grip|hip|knee|ankle|heel|ball|toe|sole|thighTop|thighUnder|trap .l/.r`,
`hips` (root), `lumbar`, `neck`, `shoulders`, `grips` (midpoints), `head` (vertex), `ear`, `chin`, `chest`,
`sternum`, `navel`, `backUpper`, `backMid`, `sacrum`, `buttock`, `seat`.

### Point references (anchors, guides, datum ends)
`'elbow.l'` (end pose) | `'start:elbow.l'` | `[x, y]` plate px | `[x, y, z]` world |
`{ at: 'elbow.l', pose: 'start'|'end'|'mistake', off: [dx, dy] px }` | `{ along: [a, b], t, off }` (a + (b - a) t).

## 4. Spec fields

| Field | Meaning |
|---|---|
| `id`, `name` | file id; sheet title |
| `view` | `'front'` or `'side'`; `facing` (side view) `'right'` / `'left'`; `viewLabel` overrides "Side view" |
| `body` | `{ height }` in m (default 1.75) |
| `camera` | see 1 |
| `poses` | `{ start, end, via? }` |
| `equipment` | list of `{ type, ...params, z?, part? }` or `(lm, ctx) => item | item[]` (called per pose; `lm` = that pose's landmarks, `ctx.pose` = 'start' / 'ghost0..' / 'end' / 'mistake', `ctx.start` = start landmarks, `ctx.mistake` = true while the mistake plate is drawn, e.g. to leave out a construction line that belongs to the correct plate only). Items identical in start and end are drawn once; moving items are drawn dashed at the start, in the ghosts and solid at the end |
| `startParts` | optional list of parts (`'trunk'`, `'arm.r'`, `'leg.l'`, ...) or shape keys: only these are drawn in the dashed start pose (default: every moving part) |
| `ghosts` | `{ count = 3, parts?: ['arm.r', 'leg.l', 'trunk', <equipment part>], opacity: [.12, .36] }` |
| `trace` | `{ point: landmark, trim: [startPx, endPx], samples }`: path of one point, accent, arrowhead, `pathLength=1` |
| `measure` | `{ vertex, from, to, radius = 28, title, value, expect?, box?, prefer? }`. Rays: landmark (end pose), `{ at, pose: 'start' }` (sweep from the start pose), `'up'|'down'|'forward'|'back'`, `{ dir: [dx, dy] }`. The report gives the drawn angle; `expect` flags a > 2 deg mismatch |
| `datum` | list of `{ y: landmark or world m, from, to }` (horizontal) or `{ x, from, to }` (vertical) or `{ line: [p, q] }`; ends in px or landmarks; `mistake: false` leaves a datum off the mistake plate (e.g. the reference ray of the measured angle, which the mistake plate does not draw) |
| `marks` | landmarks that get a joint circle (default: shoulders + elbows in front view; near shoulder, elbow, hip, knee in side view) |
| `armsFront` | front view: always draw the arms over the torso |
| `hand` | `'flat'` (both hands) or `{ l, r }`: an open hand, palm flat, instead of the fist. One outline from the wrist to the fingertips, joined to the forearm (no gap); its palm side (screen-down) is straight at the forearm's distal radius (`RADII.fore[2]`), so a wrist placed that far above a surface lays the palm flat on it (`exercises/_test_flat.mjs`). Unset: the fist |
| `callouts` | up to 3 `{ key, text (1-3 words, `<br>` for 2 lines), anchor, cue (one sentence), box?: { left, top } (button px), prefer?: 'left'|'right'|'above'|'below', guide?: [points] (accent dashed line when selected) }` |
| `tempo` | `[{ phase, s, move? }]`, phase names that suit the lift (e.g. Pull / Hold / Return / Rest) |
| `mistake` | `{ pose (partial, merged over poses.end), parts?, guides, tells }`. The faulty pose is drawn as a dashed `--mistake` outline of only what differs from the correct end pose. `guides`: `{ kind: 'arrow', from, to }`, `{ kind: 'line' | 'dashed', pts, smooth? }`, `{ kind: 'arc-arrow', center, r, a0, a1 }` (screen degrees, 0 = right, -90 = up). `tells`: 1-3 `{ key, text, anchor, cue }` |
| `checks` | contact checks per pose: `{ landmark, at: point }`, `{ landmark, plane: { point, normal } }` (distance, `tol` cm, default 1), `{ landmark, above: { point, normal } }` (clearance); `pose: 'all' | 'start' | 'end' | 'mistake'` |
| `alt` | screen-reader description of the plate |

Labels without `box` are placed automatically: every candidate position on a 2 px grid, never over anything drawn
(figure, ghosts, equipment, trace, arc, datum), 8 px from the plate edge and 8 px from other labels; the cost is
leader length + 60 per 2 px cell of figure the leader crosses + 600 per crossed leader + a soft clearance term.
Leaders follow the reference: diagonal to a bend 10 px before the text then horizontal, or vertical to 4 px off
the text. Pick anchors on the silhouette edge on the open side (e.g. `shoulderTop`, `sternum`, `backUpper`).
Fix a label by hand with `box` when the automatic spot is not the one a designer would pick.

## 5. Equipment primitives (defaults, metres)

| type | params | assumed real size |
|---|---|---|
| `floor` | `from`, `to` (world z in side view, x in front) | line at y 0 |
| `dumbbell` | `at` (grip), `axis` (handle direction; end-on shows the hex) | hex head 11.9 cm across corners (reference), heads 7 cm long, handle 13 cm |
| `pullupBar` | `at`, `width`, `d`, `stub`, `mount: 'wall'|'ceiling'` | 32 mm bar, 1.07 m between mounts, 30 cm stub |
| `cableColumn` | `base`, `height`, `width`, `pulley: { at, r }`, `to` (cable end at the handle), `rest` (that point at the start: sets the stack lift), `ratio`, `wrap` (±1 tangent side), `stack: {...}` | 2.1 m upright, 34 cm frame, 9 cm pulley, 7 cm top pulley |
| `stack` | `base`, `plates`, `plateH`, `w`, `load` (plates lifted), `lift` | 5 kg plates 2.5 cm thick, 22 cm wide, guide rods |
| `latBar` | `at` (centre), `width`, `straight`, `drop`, `d`, `cableTo`; `latBarPoint(bar, u)` for grips | 1.22 m bar, straight 60 cm centre, ends drop 12 cm, 28 mm |
| `vHandle` | `at` (grip centre), `toward` (unit, to the cable), `length`, `sep` | grips 15 cm apart, 22 cm to the cable ring |
| `rowFootplate` | `at` (sole contact), `angle` (top leans away), `h`, `t`, `below`; `footplateFace()` | 30 cm tall, 2.5 cm thick |
| `bench` | `at` (top-surface centre), `len`, `width`, `pad`, `axis: 'z'|'x'`, `legs` | 1.2 m x 29 cm, 6 cm pad, top 42-45 cm (IPF bench rules) |
| `seat` | `at`, `len`, `width`, `pad`, `post` | 40 x 36 cm pad, 7 cm, centre post |
| `backPad` | `at` + `angle` (from vertical, + reclined) or `surface: [upper, lower]` (tangent to two back landmarks), `len`, `t`, `below`, `post` | 60 cm x 7 cm |
| `kneePad` | `at` (contact on the thigh), `r`, `normal`, `postTo` | 11 cm roller |
| `legPress45` | `rail: { from, angle, length }`, `offset`, `plate: { h, t, tilt }`, `seat: { at, angle, len }`, `back`, `travel` (m along the rail); `legPressFace(lp, travel)` | 45 deg rails 1.5 m, 70 cm plate, face 22 cm above the rail line |
| `chestPress` | `pivot`, `handle`, `grip`, `gripAxis`, `frameTo` | neutral grip 14 cm, lever 5 cm, pivot 8 cm |
| `barbell` | `at`, `plateD`, `plates` (thicknesses per side), `barLen`, `collar`, `shaftD`, `sleeveD` | IWF men's bar: 2.2 m, 28 mm shaft, 50 mm sleeves, collars 1.31 m apart; 450 mm plates. Side view: the near plate is an outline over the figure |
| `rackUpright` | `at`, `h`, `w`, `hook` (J-hook height), `span` (front view) | 76 mm (3 in) tube, 2.3 m, 7 cm J-hook |
| `cable`, `pulley`, `box`, `line` | generic parts | |
| `poly` | `pts` (world points, at least 3), `curve` (closed smooth curve instead of straight edges), `cls` (default `eq`) | a closed filled outline for parts `box` and `line` cannot close, e.g. a rope or an angled sled; throws on fewer than 3 points, on a point that is not 3 finite numbers, and on points enclosing no area (all coincide or lie on one line). Moving poly parts are outlined in the Mistake view |

Every item accepts `z`: `'back'` (behind the figure), `'center'` (body mid-plane: behind the near leg, in front of
the far limbs; cables), `'mid'` (in front of the trunk and near leg, behind the near arm; handles held in both
hands), `'front'`; and `part` (a name `ghosts.parts` / `mistake.parts` can select).

## 6. Report (stdout JSON)

`renders[]` per PNG: `browserIssues` (measured text boxes vs plate edge 8 px, each other, anything drawn, key
joints; font loaded; no horizontal scroll; sheet fits) and `engineIssues` (same checks on estimated boxes, plus IK
contact misses > 0.5 cm, `checks` failures, measure mismatch). Also `contacts` (IK error per hand/foot and pose),
`checks`, `measure.drawnDeg`, `angles` (the resolved joint angles of start, end and mistake: use them to confirm
the cited ranges), `camera`. `ok: true` when every list is empty.

## 7. Worked example (`exercises/_test_side.mjs`, engine test, not a card)

```js
import { rootOnSeat, footplateFace } from '../engine/index.mjs';
const H = 1.75;
const BENCH_TOP = 0.42;                                   // bench pad top (m)
const SEAT = [0, BENCH_TOP, -0.044];                      // buttock contact on the pad
const PLATE = { at: [0.11, 0.30, 0.87], angle: 20 };      // footplate contact (mid-sole), top leaning 20 deg away
const PLATE_R = { ...PLATE, at: [-0.11, 0.30, 0.87] };
const N = footplateFace(PLATE).normal;                    // face normal, toward the user
const feet = { l: { at: PLATE.at, normal: N, toe: [0, 1, 0] }, r: { at: PLATE_R.at, normal: N, toe: [0, 1, 0] } };
const PULLEY = [0, 0.33, 1.04];
const grip = (y, z) => ({ l: { at: [0.075, y, z], pole: [0.3, -1, -0.2] }, r: { at: [-0.075, y, z], pole: [-0.3, -1, -0.2] } });
const START_G = [0.72, 0.665], END_G = [0.72, 0.17];
const start = { root: { at: rootOnSeat(SEAT, 4), tilt: 4 }, trunk: 2, scap: { pro: 3 }, plant: feet, reach: grip(...START_G) };
const end = { root: { at: rootOnSeat(SEAT, 0), tilt: 0 }, trunk: 0, scap: { pro: -3 }, plant: feet,
  reach: { l: { at: [0.075, ...END_G], pole: [0.2, -0.4, -1] }, r: { at: [-0.075, ...END_G], pole: [-0.2, -0.4, -1] } } };
const toward = g => { const d = [PULLEY[0] - g[0], PULLEY[1] - g[1], PULLEY[2] - g[2]], L = Math.hypot(...d); return d.map(v => v / L); };
const attach = g => { const t = toward(g); return [g[0] + t[0] * 0.22, g[1] + t[1] * 0.22, g[2] + t[2] * 0.22]; };
export default {
  id: '_test_side', name: 'Engine test · side', view: 'side', facing: 'right',
  camera: { x0: 96, y0: 339 },                            // reference scale, world z 0 at plate x 96
  poses: { start, end },
  equipment: [
    { type: 'floor', from: -0.62, to: 1.5 },
    { type: 'bench', at: [0, BENCH_TOP, 0.05], len: 1.2 },
    { type: 'rowFootplate', ...PLATE, at: [0, PLATE.at[1], PLATE.at[2]] },
    (lm, ctx) => {                                        // per pose: handle in the hands, cable to the pulley
      const g = lm.grips, a = attach(g), rest = attach(ctx.start.grips);
      return [
        { type: 'cableColumn', base: [0, 0, 1.25], pulley: { at: PULLEY, r: 0.045 }, to: a, rest, wrap: -1, part: 'column' },
        { type: 'vHandle', at: g, toward: toward(g), part: 'handle' },
      ];
    },
  ],
  checks: [
    { landmark: 'seat', plane: { point: SEAT, normal: [0, 1, 0] }, pose: 'all', tol: 0.5 },   // pelvis ON the bench
    { landmark: 'thighUnder.r', above: { point: SEAT, normal: [0, 1, 0] }, pose: 'all' },       // thigh never inside it
  ],
  ghosts: { count: 3, parts: ['arm.r', 'handle'] },
  trace: { point: 'grip.r', trim: [10, 12] },
  measure: { vertex: 'shoulder.r', from: { at: 'elbow.r', pose: 'start' }, to: 'elbow.r', title: 'Shoulder', value: 'reach to squeeze' },
  datum: [{ x: 'hip.r', from: 'hip.r', to: 60 }],        // vertical through the hip: the torso stays upright
  callouts: [
    { key: 'tall', text: 'Chest tall', anchor: 'sternum', cue: 'Sit tall. The torso stays still and upright.' },
    { key: 'elbows', text: 'Elbows back', anchor: 'elbow.r', cue: 'Drive the elbows back, close to the ribs.' },
    { key: 'down', text: 'Shoulders down', anchor: 'shoulderTop.r', cue: 'Squeeze the shoulder blades; keep them away from the ears.' },
  ],
  tempo: [{ phase: 'Pull', s: 1, move: true }, { phase: 'Hold', s: 0.5 }, { phase: 'Return', s: 2, move: true }, { phase: 'Rest', s: 0.5 }],
  mistake: {
    pose: { root: { at: rootOnSeat(SEAT, -12), tilt: -12 }, scap: { elev: 4, pro: -1 } },   // rocks back, shrugs
    guides: [
      { kind: 'arc-arrow', center: 'hip.r', r: 58, a0: -80, a1: -104 },
      { kind: 'arrow', from: { at: 'shoulderTop.r', off: [0, -3] }, to: { at: 'shoulderTop.r', off: [0, -17] } },
    ],
    tells: [
      { key: 'rock', text: 'Rocking back', anchor: 'backUpper', cue: 'The torso rocks back to finish the pull.' },
      { key: 'shrug', text: 'Shrug', anchor: { at: 'shoulderTop.r', off: [0, -19] }, cue: 'The shoulders creep up toward the ears.' },
    ],
  },
  alt: 'Engine test. Side view, seated on a bench, feet on a footplate, pulling a V-handle on a low cable to the stomach.',
};
```

Workflow that caught real errors while building this example: render, read `contacts` (a hand or foot target out
of reach shows as cm off), read `checks` (the first mistake pose put the thigh 1.1 cm inside the bench), read
`angles` against the cited ranges, then look at the PNGs.

## 8. Known limitations

- No whole-body yaw or lateral trunk lean; the figure always faces +z. Front view of a trunk flexed forward is a
  foreshortened frontal outline, not a true 3D silhouette.
- One set of limb radii (a lean average male); no hands with fingers (a fist circle), no face (by design).
- Knee plane comes from the IK pole; if a `plant` pole is set far from the toe direction the foot can twist off
  the plane (the contact report shows it). Foot inversion/eversion is not modelled.
- Hip-joint centre and seat offset are fixed; soft-tissue compression on a seat is not modelled.
- Equipment is drawn per view as 2D profiles (no general 3D solids); `legPress45` has no front-view drawing;
  bars with angled sleeves, EZ bars, ropes and machines not listed need `box`/`line` parts or a new primitive.
- Automatic labels are good, not perfect: for anchors boxed in by the figure they can pick a long leader; set `box`
  or `prefer`. Text widths are measured Inter 600 11 px; other fonts need `engine/measure-chars.mjs` re-run.
- Occlusion inside one group is a union silhouette (reference look); a limb crossing another limb of the same group
  loses the line between them.
