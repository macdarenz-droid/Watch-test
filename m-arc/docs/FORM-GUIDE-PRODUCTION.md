Paused 2026-09-29 by the owner; the code is removed from the app; backup branch claude/backup-fg-2026-09-29-main.

# Form-guide production line

Approved approach (owner, 2026-09-27): every exercise in the library gets what the Lateral Raise Lab delivers, produced by agents from one data file each and drawn by one shared rig. Reference: `docs/design/form-guide-lab/lateral-raise-lab.html` (PR #36, version 6) and its renders in `docs/design/form-guide-lab/reference/`: `rest-dark.png`, `rest-light.png`, `half-light.png`, `top-dark.png`, `close-top-dark.png` and `mistake-top-light.png` (the lab's own figure, front view, lateral raise only, 644 × 692 px; the owner's outside pictures are not committed, they are third-party art). They were missing on main until V1-00 copied them from commit 6c5a1a0 (sha256 in D-FG7). Side and back likeness are judged against the owner-approved turnaround sheet (`fg:render --sheet`, V1-05, back added by V1-22); if the PNGs stop matching the app's figure, that sheet becomes the primary likeness reference (D-FG7). Written by the supervisor from three code maps, one architect draft and one adversarial critique (22 corrections applied). Decisions D-R16 and D-R17 in `docs/COACHING-DECISIONS.md`. This supersedes `docs/FORM-GUIDE-ARCHITECTURE.md` and the app-lane plan in `docs/GUIDE-UPGRADE-ARCHITECTURE.md` §7.3 (GU-7a-4); what is kept from GU-7a is listed in §6.

## 1. Goal and standard

Every exercise must deliver, in the app, on a phone:

- [ ] Comic-anatomy figure painted from the theme tokens (`--accent` mixes for the body; the mistake figure tinted toward `--mistake`, D-FG1), never a literal colour, in all five themes (Silent Black, Paper, Ember, Emerald, Midnight).
- [ ] Whole-body motion from the data file: the working joints plus breath, balance sway, shoulder-blade rhythm, tremor in the hold, slow-down across reps.
- [ ] Muscles that shimmer with computed effort: target, helpers and keep-quiet muscles, band phase driven by the effort curve, every target muscle visible in the chosen view.
- [ ] The common mistake side by side, from a delta on the same data (its own tempo, extra joint offsets), with the differing numbers shown.
- [ ] Readouts: joint angle, hand speed, effort bars per muscle, load from the last logged set, phase bar.
- [ ] Key moments: four stills from the same model (start, mid-lift, top, mid-lower) plus, for machines, the setup moment (right and wrong setting side by side).
- [ ] Guides: angle arc and one tag outside the face keep-out, hand path trace.
- [ ] Reduced motion (Pictures), captions `aria-live="polite"`, 44 px controls.
- [ ] All automated checks green (§5).

**Judge rubric** (0–5 each; total ≥ 24/30 ships, any single mark < 3 blocks). The judge scores from the gate screenshots at 360 px width in Silent Black and Paper with the reference renders open:

| Criterion | What 5 means | Pass |
|---|---|---|
| Likeness | Reads as the same character and brush style as the reference renders; the silhouette still reads blacked-out | 4 |
| Anatomy | Proportions, joint centres and limb overlaps right in this view; no limb longer than its rig bone | 4 |
| Motion truth | Angles inside the cited ranges, tempo as specified, minimum-jerk, no snap at phase ends, secondary motion present (breath, sway, blade rhythm) | 4 |
| Muscle truth | Effort peaks where the load is highest, helpers lower, keep-quiet muscles flat in the correct rep and lit in the mistake | 4 |
| Machine truth | Pivot at the joint, seat and pads where the cited setup source puts them, moving parts follow the hand or foot, stack rises with load | 4 (n/a for free weights) |
| Legibility | At 360 px: working joint centred, tag legible, nothing clipped, both themes | 4 |

Frame rate is not a judge mark: it is measured on the owner's phone (an owner action, once per batch and at every rig change) and recorded in the log at the end of this document.

## 2. Content model

One exercise = one file `src/formguide/exercises/<libraryId>.ts` (the library id as it is in `exercises.json`, e.g. `lib_lat_pulldown`; the checker asserts `guide.id` equals the file name and exists in the library) exporting `ExerciseGuide`. Data only: no functions in exercise files; curves are numbers, `[start, end]` pairs or keyed splines, and anything that needs code lives in the rig.

```ts
type View = 'front' | 'side' | 'back';
type Kind = 'rep' | 'hold' | 'alternating' | 'locomotion' | 'ballistic';
type Order = 'lift_first' | 'lower_first';        // squat, bench, leg press, RDL, lunges, push-up, dip start by lowering
type Curve = number | [number, number] | { keys: [t: number, v: number][] };
// number = fixed; [a, b] = minimum-jerk between them over the moving phases in `order`; keys = minimum-jerk spline over the rep (t 0..1)
type Side = '_l' | '_r';                            // every joint channel is sided; `symmetric: true` writes one curve to both

interface ExerciseGuide {
  id: string;                                       // = library id
  kind: Kind; order: Order;                         // default from the pattern table; may be overridden with `why`
  view?: View; viewWhy?: string;                    // view is derived from rig/patterns.ts; an override needs a reason
  mirror?: boolean;                                 // left-facing side view
  camera: { full: ViewBoxId; zoom: ViewBoxId; subject: JointId };
  pose: 'standing' | 'seated' | 'lying_supine' | 'lying_prone' | 'kneeling' | 'hanging' | 'plank' | 'quadruped';
  equipment: { kind: PartId; grip?: string; attach: AttachmentId[]; loadFrom: 'lastSet' | 'bodyweight' | 'fixed'; kg?: number; release?: [t: number, t2: number] };
  machine?: { id: MachineId; settings: { seat?: number; pad?: number; pulley?: 'high' | 'mid' | 'low'; bench?: number; rail?: number };
              drive: { part: string; travel: [number, number]; chain: JointId[] }[] };   // the machine part's travel is the source; the limb chain is solved to it
  tempo: { lift: number; hold: number; lower: number; rest: number };   // s, sum 3–5; holds use { hold: seconds }
  symmetric?: boolean;
  joints: Partial<Record<JointChannel, Curve>>;     // degrees, or cm where the channel name ends in _cm (shrug_cm, scap_depress_cm)
  movement: { breathe: 'out on lift' | 'out on lower'; leanDeg?: number; tremorDeg?: number; slowdown?: number[]; bladeRhythm?: string };
  muscles: { target: MuscleId[]; helps: MuscleId[]; keepQuiet: MuscleId[];
             effort: Partial<Record<MuscleId, Curve>> | { model: 'torque'; chain: JointId[] } };
  cues: string[];                                   // ≤ 3, each ≤ 60 characters
  mistake: { name: string; tempo?: Tempo; joints: Partial<Record<JointChannel, Curve>>; muscles?: Partial<Record<MuscleId, Curve>>;
             tells: { text: string; joint: JointChannel }[]; setup?: { setting: keyof Settings; wrong: number; text: string } };
  sources: string[];
}
```

`research.json` (one per exercise, written by the researcher and never edited by the author) holds the cited numbers the checks read: the coaching ranges per joint, the effort peak point `peakAt`, the machine settings and their source. The rig holds the hard anatomical limits (`rig/ranges.ts`, AAOS) shared by every exercise.

Mistake joint curves are deltas added to the correct curve, so the two figures share a base and "mistake differs" is measurable on the joints the `tells` name. The correct figure must stay inside the coaching ranges; the mistake may leave them on the joints its tells name but must stay inside the AAOS limits.

Kinds: `rep` is the lab's lift → hold → lower → rest (or lower first); `hold` (plank, side plank, wall sit, hollow hold, dead bug, farmer's carry) has a duration, a tremor that grows, an effort plateau and a sag mistake; `alternating` (alternating curl, walking lunge, step-up, bird dog, mountain climbers) is two half-reps with sided channels; `locomotion` (sled push and pull, bear crawl, high knees, jumping jacks) is a stored gait cycle with sway; `ballistic` (box jump, jump squat, kettlebell swing, medicine-ball slam, wall ball, burpee) allows a flight or release phase with a landing check.

**Machine example, lat pulldown (abridged; front view per the pattern table):**

```ts
export const lib_lat_pulldown: ExerciseGuide = {
  id: 'lib_lat_pulldown', kind: 'rep', order: 'lift_first',
  camera: { full: 'seatedFront', zoom: 'upperFront', subject: 'shoulder_r' }, pose: 'seated',
  equipment: { kind: 'wide_bar', grip: 'overhand, 1.5x shoulders', attach: ['hand_l', 'hand_r'], loadFrom: 'lastSet' },
  machine: { id: 'lat_pulldown', settings: { seat: 0.45, pad: 0.62, pulley: 'high' },
    drive: [{ part: 'bar', travel: [0, 0.42], chain: ['shoulder_r', 'elbow_r', 'wrist_r'] }] },   // bar travel drives the arms (solved), the stack and the cable
  tempo: { lift: 1, hold: 0.5, lower: 2, rest: 0.5 }, symmetric: true,
  joints: { torso_lean: [0, -15], scap_depress_cm: [0, 3], hip_flex: 90, knee_flex: 90 },       // free joints only; the arm chain is solved to the bar
  movement: { breathe: 'out on lift', tremorDeg: 0.3, slowdown: [1, 1.06, 1.14], bladeRhythm: 'blades down and in through the pull' },
  muscles: { target: ['lats'], helps: ['biceps', 'mid_back', 'rear_delts'], keepQuiet: ['upper_traps', 'lower_back'], effort: { model: 'torque', chain: ['shoulder_r', 'elbow_r'] } },
  cues: ['Lean back no more than 20 degrees.', 'Elbows drive down to the hips.', 'Stop when the elbows stop moving.'],
  mistake: { name: 'Lean and heave', tempo: { lift: 0.6, hold: 0.1, lower: 0.8, rest: 2.5 },
    joints: { torso_lean: [0, -25], hip_flex: [0, -12], scap_depress_cm: [0, -3] },
    muscles: { lower_back: { keys: [[0, 0.1], [0.25, 0.9], [0.5, 0.2]] }, lats: { keys: [[0, 0], [0.25, 0.5], [0.5, 0]] } },
    tells: [{ text: 'Torso swings past 40 degrees.', joint: 'torso_lean' }, { text: 'The pull ends before the elbows do.', joint: 'scap_depress_cm' }],
    setup: { setting: 'pad', wrong: 0.75, text: 'Thigh pad too high: the hips lift off the seat.' } },
  sources: ['ACE lat pulldown page', 'AAOS ROM chart', 'Physiopedia scapulohumeral rhythm'],
};
```

**Free-weight example:** `lib_dumbbell_lateral_raise` is the lab's `SPEC` re-keyed: `kind: 'rep', order: 'lift_first', symmetric: true, joints: { shoulder_abd: [10, 88], elbow_flex: 14, elbow_lead: 8, knee_flex: 6 }, effort: { model: 'torque', chain: ['shoulder_r'] }`, mistake tempo 0.8/0.2/0.9/2.1 with deltas `knee_flex: [0, 14], torso_lean: [0, 10], shrug_cm: [0, 5], shoulder_abd: [0, 20], wrist_pron: [0, 40]` and tells on `knee_flex`, `shrug_cm` and `wrist_pron`. Custom exercises (pattern `other` or `custom`) get no file (§6).

## 3. The figure

**Rig.** One skeleton, three drawn part sets. Joints (17): `pelvis` (root), `spine`, `chest`, `neck`, `head`; per side `shoulder`, `elbow`, `wrist`, `hip`, `knee`, `ankle`. Named channels on top of joints: `torso_lean`, `shrug_cm`, `scap_depress_cm`, `elbow_lead`, `wrist_pron`, `breath`, `sway`, `layer`. Nesting: pelvis → spine → chest → neck → head; chest → shoulder → upper arm → forearm → hand → equipment; pelvis → thigh → shin → foot. Each joint is a `<g class="j-<name>">` with its own `transform-origin`; only `transform` and `opacity` animate. `rig/ik.ts` (ported from GU-7a's solve, with its own tests) solves a two-bone arm or leg chain to an equipment path when a machine or cable drives the movement.

**Views.** Front (seed: the lab's torso, head, hip band and `ARM()`), side, back. A side view is drawn once and mirrored with `scale(-1, 1)` for the other facing. Three-quarter view: not drawn; no pattern needs it and it would cost a fourth part set with hand-drawn foreshortening. The view is derived from the pattern by `rig/patterns.ts` (all 33 patterns, from the library census: side for pushes, pulls, hinges, squats, lunges, curls, extensions, leg machines; front for abduction, pulldowns, shrugs, crossover, carries, jumps, presses on machines drawn front; back for horizontal abduction and rear-delt work); an exercise may override it only with `viewWhy`. A machine is drawn in the view its exercises use, never the other way round. **Channels each view can draw** (D-FG7 (l), from the frame code; a research tell or a mistake may use only these in its view, and V1-07's perturbation test keeps the list true). Front (`frontFrame`, `rig/pose.ts:51-120` on main): `shoulder_abd`, `elbow_lead`, `shrug_cm` and `scap_depress_cm` (the shoulder rise), `hip_abd`, `knee_flex`, `hip_flex` (seated only: it fore-shortens the thigh; standing does not draw it), `torso_lean` (trunk fore-shortening and head drop), `breath`, `sway` (today about the floor point between the feet in every pose; D-FG7 (c) changes this), and `wrist_pron` only as the turn of held equipment. Not drawn in front: `shoulder_flex`, `elbow_flex`, `ankle_flex`, `layer`. Side (`sideFrame`, FG-6 `rig/pose.ts:191-260`): `shoulder_flex`, `elbow_flex`, `hip_flex`, `knee_flex`, `ankle_flex`, `torso_lean`, `shrug_cm` and `scap_depress_cm`, `breath`, and `sway` for standing only (FG-6 `pose.ts:221`). Not drawn in side: `shoulder_abd`, `elbow_lead`, `hip_abd`, `wrist_pron` (0 uses in `figureSide.ts`), `layer`. Back: not drawn yet (V1-22). No view has a spine-flexion, scapular-retraction or pelvic-tilt channel (`rig/joints.ts:28-45`), so no mistake may rely on one.

**Layering when limbs cross the body.** Two pre-ordered arm groups per view (`arms-behind`, `arms-front`); the keyed `layer` channel toggles opacity between them at the pose where the crossing happens (rows: forearms move in front of the chest at the end of the pull; side view: the near arm is always in front). No `<g>` re-ordering at runtime.

**Poses.** `pose` selects the leg part set and the floor anchor: standing, seated, supine, prone, kneeling, hanging, plank, quadruped. Each pose is a stored start-angle set; the exercise file overrides only what moves.

**Attachment points** (per view, in rig units): `hand_l/r`, `foot_l/r`, `shoulder_l/r` (bar on the back, hack pads), `back` (chest pad, backrest), `hip` (hip-thrust pad), `knee_l/r` (seated calf pad), `ankle_l/r` (leg-curl and extension pads, ankle strap). Equipment is nested in the hand group as the lab does; machine pads are fixed and the body meets them, checked by `handsOnHandle` / `bodyOnPad`.

**Muscle overlays by view** (shimmer band + tint, one pair per muscle). Front: front_delts, side_delts, upper_traps, biceps, forearms, upper_chest, chest, lats (side wall), abs, core, obliques, hip_flexors, quads, adductors. Side: side_delts, front_delts, rear_delts, upper_traps, mid_back (rhomboid band under the blade), lats, chest, upper_chest, triceps, biceps, forearms, abs, core, obliques, lower_back, hip_flexors, glutes, quads, hamstrings, calves. Back: upper_traps, mid_back, lats, rear_delts, triceps, forearms, lower_back, abductors, glutes, hamstrings, calves, adductors (the adductor magnus, inner back of the thigh). Aliases stay as in the app: brachialis → biceps, rotator_cuff → rear_delts. The `targetVisible` check fails any file whose target muscle has no overlay in its view; recomputed in FG-3 over the library's primary muscles: the pattern table alone hides 4 targets on 3 exercises (cable external rotation: rotator_cuff in front; sumo deadlift: adductors in side; hip abduction: glutes and abductors in front), so those three files override the view to back with a `viewWhy` (`check/overlays.ts` `CENSUS_VIEW_OVERRIDES`, D-FG3), and then the count is zero. Follow-up after PR #37: `muscles.ts:51` (abductors view `front` vs the back SVG) → `back`.

**Colour.** The lab's painter (`bodyPal`, `cel`, `band`) moves into `src/formguide/rig/paint.ts` and reads only tokens. The figure tokens the lab introduced (`--pants`, `--pants-hi`, `--pants-sh`, `--ink`, `--iron`, `--iron-hi`, `--iron-sh`, `--eye`, `--floor`, `--guide`, `--target`, `--help`, `--quiet`) are added to every theme in `src/theme/themes.ts` by FG-1 (called out in its PR; `tests/theme.test.ts` parses that file), and the muscle band base reuses `--map-body` / `--map-line` where it fits. Mixes use CSS `color-mix(in srgb, var(--accent), white 30%)` in `stop-color` and `fill` when the app's minimum Android WebView is 111 or newer (FG-1 confirms the floor); otherwise one whitelisted `paint.ts` mixer that takes only token names and numeric white or black. Either way no hex, `rgb()` or `hsl()` literal in `src/formguide/**` (PR #38's theme-test block, extended by FG-1). The mistake tint and the band colours are derived in one place.

**Budgets.** Transforms on inner SVG groups are not composited in Chromium and WebView: the whole SVG repaints every frame, so the budget is a repaint budget, not a compositor one. Batch 0 measures the worst case (compare mode with a machine, Silent Black) on the owner's phone before any budget is final. Until measured: figure target 220 paths per view, hard cap 260; machine ≤ 80; bench or free-weight part ≤ 25; at most two live figures and one machine in the DOM; moments are static images, never live figures. Documented fallbacks if the phone drops under 30 fps: flat cel fills instead of the 16 gradients, fewer brush lines, or the non-moving parts rasterised to one `<image>`. Sizes: form-guide chunk ≤ 150 KB gzip total, a figure view ≤ 10 KB gzip source (the lab's front figure is 7.6 KB with no separate hip, knee, ankle, wrist, neck or spine groups; the jointed figure is measured in FG-1 and the number recorded here), an exercise file ≤ 2 KB gzip (level 9, the `.ts` source; the lateral raise is 1.43 KB).

## 4. Equipment and machines

**Parts library** `src/formguide/parts/`: dumbbell, kettlebell, barbell with plates (plate count from the load, plate sizes from the user's profile or 20 kg default), EZ bar, trap bar, straight bar, wide bar, V-handle, rope, D-handle, band with a fixed anchor, ankle strap, ab wheel, medicine ball (with `release`), jump rope, battle rope, loose plate, bench (flat, incline, decline as one part with an angle), box or step, wall, rack, sled, dip station, pull-up bar, landmine, farmer's handles. Each part: one `<g>` in the comic style (dark iron `--iron*` with one highlight edge), an anchor point, and an optional moving sub-part.

**Machine primitives** (four): pivoting lever (`rotate` about a fixed pivot), sliding carriage (`translate` along a rail angle), cable over pulley (one line endpoint follows the hand; the wrap is a fixed arc at the pulley), rising stack (`translateY` = handle travel × gain; plate count from the load). Every machine is these primitives plus a fixed frame, seat and pads. **Drive rule** (revised 2026-09-29, D-FG7 (b)): the dominant joint is the driver, keyed as one minimum-jerk curve; one secondary channel is solved (`rig/ik.ts`, the view's chain) to keep the hand or foot on the machine part's path; the part's travel follows the body, always as a projection onto its one-dimensional path (an arc about the pivot, a line along the rail, the cable line from the pulley), never a free 2-D point. The author writes the driver, the torso and the free joints. `handsOnHandle` (0.5) and `machinePivot` (0.05) keep their limits and what they measure. The earlier rule (the part's travel drives, the limb is solved to it) failed smoothness (c) in the planning runs (3.46-12.7× against the 3× limit, on a generic arm); V1-04 A0 re-measures both on the real rig, and a geometry that still fails is left out of V1 with no check changed. The same rule holds for leg press, hack squat, Smith and pendulum (feet or shoulders fixed to the moving part).

**Machine library** (28 drawings, 60 exercises; view in brackets, equal to the view of its exercises):

- Seated chest press (side): machine_chest_press, incline_machine_press.
- Pec deck / reverse fly: pec_fly (front), rear_delt_fly (back, arms reversed; `patterns.ts:20` gives horizontal abduction the back view, and the front overlay list has no `rear_delts`, `overlays.ts:8`).
- Shoulder press machine (side, with vertical_push): shoulder_press.
- Lateral raise machine (front): machine_lateral_raise.
- Assisted pull-up (front): assisted_pull_up. Dip station (side): weighted_dip.
- Chest-supported row (side): chest_supported_row. T-bar row (side): t_bar_row.
- Pullover machine (side): machine_pullover.
- Leg extension (side); seated leg curl (side); lying leg curl (side, prone); standing leg curl (side).
- 45° leg press (side): leg_press, leg_press_calf_raise. Horizontal leg press (side).
- Hack squat (side). Pendulum squat (side).
- Hip abduction (back) / hip adduction (front), pads out vs in.
- Seated calf (side). Standing calf (side).
- Ab crunch machine (side). 45° back extension (side). Preacher curl (side). Hip thrust bench (side).
- Lat pulldown station (front; grip zoom for the four grips): lat_pulldown, close_grip_pulldown, underhand_lat_pulldown, single_arm_lat_pulldown, straight_arm_pulldown.
- Seated row station (side): seated_cable_row.
- Dual adjustable pulley (pulley height high, mid or low as a setting; drawn front and side): 21 cable exercises (high 9, mid 4, low 8).
- Smith rack (side; bench or seat added by pose): 5 Smith exercises.

**"More when machines are added" means:** (1) a setup moment before rep one: seat height, pad position and pulley height drawn as adjustable parts with the right setting highlighted and a one-line rule ("pivot level with your knee"), shown as a right-and-wrong pair when the file has `mistake.setup`; (2) the load on the stack or the plates from the last logged set (read-only, no new saved data); (3) the cable path highlighted with a dash-offset flow during the lift; (4) the machine's pivot marked and checked to sit within 0.05 units of the joint; (5) the machine's own mistake in the rep (lean past 30°, hips off the seat) as a delta like any other.

## 5. The production line

**Roles** (one agent each, never more than 5 running):

- Researcher (light model): for one exercise returns `research.json`: joint channels with start and end degrees and cited coaching limits, tempo and order, target, helper and quiet muscles with the effort peak point, one mistake with two visible tells and the joint each tell names, machine settings, each with a source (ACE exercise library, AAOS range charts, NSCA Essentials, Physiopedia, an EMG review; a manufacturer manual for a machine setting when no ACE page exists, flagged `unverified_on_machine` for the owner's gym checklist). ≤ 300 words.
- Motion author (strong model): writes the exercise file from `research.json`, the rig's joint list and one sibling file of the same pattern; runs `npm run fg:check <id>` and returns the file with the output. Never edits `research.json`.
- Artist (strong model, only when the library lacks a part, machine or view): draws it in the reference style from the seed parts and the reference renders; returns the part file and renders in Silent Black and Paper.
- Checker (light model): runs `fg:check`, `fg:render` and the phone gate; returns pass or fail per check with the failing numbers.
- Judge (strong model, fresh context): scores the renders against the rubric with the reference renders open; returns the six marks with one sentence of evidence each, no fixes. Runs in a researcher slot between batches, so the cap of 5 holds.
- Supervisor (this session): the human-level pass on 1 in 5 exercises, every new machine and every new view; owns the batch board; records the owner's frame-rate result per batch.

**Per-exercise steps:** research → author → check → (fix, at most two tries on the same failure, then escalate to the supervisor with the evidence) → judge → merge. Author and checker run in one session when the exercise needs no new art.

**Prompt skeletons:**

- Researcher: "Exercise `<id>` (`<name>`, `<equipment>`, pattern `<pattern>`, kind `<kind>`, primary `<...>`). Fill `research.json`: joint channels with start and end degrees and cited coaching limits; tempo and order; muscles with when effort peaks; one common mistake with two visible tells and the joint each names; machine settings if any. Cite a source for every number."
- Author: "Write `src/formguide/exercises/<id>.ts` as `ExerciseGuide` from `research.json`. Use only channels in `rig/joints.ts`, parts in `parts/index.ts` and machines in `machines/index.ts`. Mistake joints are deltas. For a machine, write the part's travel and the free joints; the arm or leg chain is solved. Run `npm run fg:check <id>` and paste the output."
- Judge: "Open `renders/<id>/*.png` and `docs/design/form-guide-lab/reference/*.png`. Score each rubric row 0–5 with one sentence of evidence. Do not suggest fixes."

**Automated checks** (`tests/formguide/checks.test.ts`, every exercise file; each check has a seeded bad file it fails on):

| Check | Rule |
|---|---|
| smoothness | smooth-check (a)–(d) on the correct figure, with phase windows derived from the file's `tempo` and `order` (never fixed 1/0.5/2/0.5 s): end speeds ≤ 1 % of the phase's top speed, velocity change ≤ 8 % and ≤ 4° per 1/120 s, acceleration jump at stops ≤ 3× the median |
| stops | `stopsFor(tempo)` gives 100 even intervals across each moving phase (D-FG2: 203 stops for a 4 s rep with both moving phases) and no stop inside a hold or rest; a rep sums to 3–5 s and has both moving phases |
| jointRanges | correct figure inside the `research.json` coaching ranges and the AAOS limits at 481 samples |
| mistakeSane | mistake figure inside the AAOS limits, no NaN, nothing clipped, and a delta ≥ 5° or 20 % of range on every joint a tell names |
| mistakeDiffers | peak hand or foot speed differs by ≥ 15 %, or the file is `kind: 'hold'` and the sag delta is present |
| setupDiffers | when `mistake.setup` exists, the setup moment renders the wrong and right setting and they differ |
| handsOnHandle / bodyOnPad | hand-to-anchor gap < 0.5 units at all samples; fixed pads drift < 0.01 |
| feetPlanted | feet on the floor or footplate in standing and seated poses; `ballistic` kinds may leave it during the flight phase and must land within 0.5 units |
| targetVisible | every `muscles.target` id has an overlay in the file's view |
| muscleTiming | target effort peaks within 0.1 of the researcher's `peakAt`, falls in the lower, steps ≤ 0.02 per 1/120 s; keep-quiet muscles < 0.2 in the correct rep and higher in the mistake |
| secondaryMotion | breath amplitude > 0; sway amplitude inside [0.2°, 1.5°]; blade rhythm present when the shoulder rises above 30° |
| pathBudget | paths per figure, machine and part within §3 |
| sizeBudget | exercise file ≤ 2 KB gzip (level 9, the `.ts` source); chunk ≤ 150 KB gzip |
| themes | renders in all five themes with no literal colour; nothing clipped (bounding box inside the viewBox) at t = 0, 0.125, 0.25, 0.625; the moment snapshots are non-blank in every theme |
| everyPoseRenders | the four moments plus the setup moment produce non-empty SVG |
| noFilters | no `filter`, mask, or animated `d` or fill |
| machinePivot | lever pivot within 0.05 units of the bound joint; carriage and cable endpoints on their path within 0.5 units |
| idMatch | `guide.id` = file name and exists in `exercises.json` |
| hash | deterministic snapshot of the stops per channel |

**Batching:** by equipment family and view, so one artist's new parts serve the whole batch. Five agents: 1 artist (when needed) + 2 researchers + 2 author-checkers; the judge takes a researcher slot after every 10 exercises. Per batch the supervisor posts the token estimate before starting and the actual after; the owner can stop between batches.

**Cost estimate** (from the lab: 1.2M tokens for the figure redraw, 0.3M for a design pass; a data-only exercise is text): research 15k, author + check 40k, fixes 20k, judge 15k ≈ 90k tokens and about 25 min of wall time per data-only exercise. New machine drawing ≈ 250k (artist) + judge. New figure view ≈ 1.0M (side), 0.8M (back). Library: 153 × 90k ≈ 13.8M, 28 machines × 0.25M ≈ 7.0M, two views ≈ 1.8M, rig and checks ≈ 1.5M: about 24M tokens over seven batches of about 22 exercises, roughly 3.5M and 2–3 days each at 5 agents. If the budget is cut, the back view and the 30 uncued bodyweight and conditioning exercises drop first.

## 6. App integration

Keep from GU-7a: the player sheet, the host row in `Train.tsx`, `lazy.tsx` failure rule, `registry.ts` (keyed by library ids), `controller.ts` (one-bubble rule, zoom and muscle exclusive), the `waapi.ts` handle, `muscleInfo` and `muscleNotes` (PR #37), the gate blocks and the theme lint (PR #38). PRs #37 and #38 merge before FG-4 (listed as `depends_on`). PR #40 (the low-poly rig solved from the 3D demo) is closed unmerged: FG-1 and FG-2 port its solve, stop spacing and `Truth`/`Channel` types with their own tests, so no test is deleted to make room. Replaced: `parts.ts`, the low-poly `paint.ts`, `solve3` as the drawing source, the three `scenes/*.ts`. `api.ts` takes an `ExerciseGuide`; `RIG_CSS` is scoped under `.form-guide`.

Rendering: `registry` maps exercise id → `import('./exercises/<id>')` (one lazy chunk per exercise; the rig chunk is shared). `sampleGuide(guide)` produces the stops per channel → WAAPI keyframes on the joint groups; slow-down across reps is sampled as one keyframe set per rep (three sets, chained), so the kept `waapi.ts` needs no per-frame code. Effort curves drive band `dashoffset` and tint opacity. Shimmer uses the app's `MuscleId` directly. Load readout: the last logged set from the store (read only); bodyweight uses the F13 load. Mistake toggle: an `aria-pressed` chip; the second figure is mounted only when on. Key moments: static snapshots rendered by the snapshot generator, which resolves the tokens with `getComputedStyle` at capture time and inlines the resolved colours into the data URI (an SVG inside `<img>` cannot read the page's custom properties), regenerates on a `data-theme` change and caches per theme. Reduced motion → Pictures; captions `aria-live="polite"`; the SVG is `aria-hidden` with a text summary. Offline: everything is in the bundle. Custom exercises: the muscle map plus the equipment part chosen from the equipment string, no animation.

Ownership (AGENTS.md): the supervisor adds the `fg:check` and `fg:render` scripts to `package.json` and approves any dependency (prefer the gate's Chromium for renders; no new package expected); FG-1 owns the token additions in `src/theme/themes.ts` and the form-guide block in `src/ui/styles.css`, both called out in its PR; CI additions are add-only; the reference renders are committed by the supervisor from the lab.

## 7. Production order

0. **Batch 0, the rig** (FG-1 to FG-4): rig joints, painter port, checks, player wiring on the lateral raise; the owner's phone measurement of the worst case. Ships behind the existing GU-7a host row.

**Version 1 cut (owner, 2026-09-28).** Version 1 ships the form guide for the owner's own two splits first: 15 exercises. The other 138 follow in the batches below, after the release or in parallel if the budget allows. These 15 need FG-4, FG-5, FG-6 (side view), FG-7 (cables and the pulldown) and the machine parts below. They are built first, as **Batch V1**, before the numbered batches below:
- Free weights and bodyweight (4): `lib_dumbbell_lateral_raise` (done in FG-2), `lib_dumbbell_biceps_curl`, `lib_romanian_deadlift` (barbell), `lib_hanging_leg_raise`.
- Cable (3): `lib_seated_cable_row`, `lib_single_arm_triceps_pushdown`, `lib_lat_pulldown`.
- Machines (8): `lib_machine_chest_press`, `lib_incline_machine_press`, `lib_rear_delt_fly`, `lib_shoulder_press`, `lib_leg_press`, `lib_seated_leg_curl`, `lib_leg_extension`, `lib_seated_calf_raise`.
The numbered batches below then skip whatever Batch V1 already built. Version 1 also builds the back view (V1-22, for the rear delt fly), a real hanging pose (the hanging leg raise, V1-11) and the sway rule: sway turns about the support (standing about the sole, seated front with the trunk about the hips, back-pad supports head and neck only, hanging about the grip; D-FG7 (c)). The Version 1 cards and their order are in §10.

1. **Batch 1, side view, benches and free weights** (FG-5, FG-6, then exercises): the free-weight starter-template exercises: bench presses, rows, RDL, deadlift, squat, lunges, overhead press, curls (13 of the 24 template exercises).
2. **Batch 2, the template machines**: leg press, leg extension, seated leg curl, standing calf, machine chest press, chest-supported row, seated row station, lat pulldown station (the remaining 11 template exercises finish here).
3. **Batch 3, the dual pulley** (FG-7 first): 21 cable exercises plus the remaining pulldowns (27).
4. **Batch 4, upper-body machines and Smith**: pec deck, shoulder press machine, lateral raise machine, assisted pull-up, pullover, preacher, ab crunch, Smith (about 18).
5. **Batch 5, front-view free weights and the rest of the leg machines**: lateral and front raises, shrugs, hip abduction and adduction, calves, hack and pendulum, back extension, hip thrust (about 22).
6. **Batch 6, back view, bodyweight and conditioning**: the `hold`, `alternating`, `locomotion` and `ballistic` kinds, the 30 exercises without coach cues last (about 40).

Definition of done per batch: every exercise file passes all checks; judge total ≥ 24 with no mark < 3; the supervisor sampled 1 in 5 and every new part; gate screenshots in Silent Black and Paper at phone width attached to the PR; chunk size recorded; the owner's frame-rate result recorded; PR merged with `main`.

## 8. Risks and mitigations

- Style drift between agents: only the artist role draws; parts are seeded from the lab; the judge compares with the committed reference renders; a silhouette check is in the judge prompt.
- Anatomical errors: ranges are cited by the researcher and checked by tests the author cannot edit; the judge marks anatomy separately.
- Machines drawn wrong: a cited setup source per machine (ACE, NSCA or a manufacturer manual, flagged when unverified); `machinePivot`; the owner sees every new machine before the batch merges and checks flagged settings in a real gym when convenient.
- Phone performance: measured on the owner's phone in batch 0 and per batch; two live figures max, moments as images, transform and opacity only, `noFilters`, and the documented fallbacks.
- Token cost: light models for research and checking; data-only exercises; the artist only when a part is missing; batch by family; the owner can stop between batches.
- GU-7a overlap: #37 and #38 merge as they are; #40 is closed and ported; no two rigs coexist.
- Views that never get drawn: the side view is batch 1 with the bench press; the back view is built in Version 1 (V1-22, merged late) for the rear delt fly, and the other horizontal-abduction exercises use it after. Fallback (D-FG7 (d)): after two failed likeness rounds the rear delt fly uses the side view with `viewWhy` (the side list has `rear_delts`, `overlays.ts:9`) and a judge motion-truth mark ≥ 4; otherwise it is left out of V1. The front view is never the fallback: its list has no `rear_delts` (`overlays.ts:8`).
- Checks an author can game: `peakAt` and ranges come from the researcher's file; `mistakeDiffers` needs the delta on the named joints; `secondaryMotion` is measured, not judged.

## 9. Cards

**FG-1 Rig and painter.** `src/formguide/rig/{joints,patterns,ranges,pose,paint,ik,figureFront}.ts` from the lab's figure code and GU-7a's solve; 17 joint groups; standing and seated poses; front view; figure tokens in every theme; the styles block. Acceptance: A1 the front figure renders in all five themes with no literal colour (theme-test block FG-1); A2 path count recorded, ≤ 260; A3 the lab's four moments reproduce within 1 px on the hand position; A4 `applyPose` uses transforms and opacity only; A5 `ik.ts` solves the lab's arm to the dumbbell path within 0.5 units, with its own tests; A6 the WebView floor for `color-mix` is confirmed and the paint path chosen accordingly.

**FG-2 ExerciseGuide schema and sampler.** `src/formguide/model.ts`, `sampleGuide()`, `stopsFor(tempo)`, the lateral raise file, `research.json` for it. Acceptance: A1 the type compiles and `lib_dumbbell_lateral_raise.ts` matches the lab's numbers (hash snapshot); A2 the stops per channel sample in ≤ 20 ms; A3 the mistake deltas produce the lab's mistake figure; A4 a `lower_first` file and a `hold` file sample with the right phase windows.

**FG-3 Checks.** `tests/formguide/checks.test.ts` with every §5 check, `npm run fg:check` (scripts added by the supervisor). Acceptance: A1 each check fails on its seeded bad file and passes on the lateral raise; A2 the output names the failing numbers; A3 `targetVisible` recount over the library with the §3 lists is zero hidden targets.

**FG-4 Player wiring.** Replace GU-7a's scene source with `ExerciseGuide`; lazy chunk per exercise; mistake toggle; moments as token-resolved snapshots per theme; load from the last set; per-rep keyframe sets. Depends on PRs #37 and #38 merged. Acceptance: A1 the lateral raise plays in the Train sheet; A2 the main chunk grows by 0 KB of form-guide code and the chunk is ≤ 150 KB gzip; A3 reduced motion shows Pictures; A4 gate screenshots in Silent Black and Paper at phone width; A5 snapshots non-blank in all five themes; A6 the owner's frame-rate measurement of compare mode is recorded.

**FG-5 Parts library, free weights.** Dumbbell (from the lab), barbell with plates, EZ bar, kettlebell, bench with angle, rack, box, loose plate. Acceptance: A1 each part ≤ 25 paths, token-only; A2 plate count follows the load; A3 anchors exist for hand, back, shoulder, foot.

**FG-6 Side view figure.** The side part set, supine and prone poses, the mirror rule, the arm layering groups, the side muscle overlays. Acceptance: A1 ≤ 260 paths (number recorded); A2 bench press and squat stills render without clipping; A3 every muscle in the side list has an overlay; A4 judge likeness ≥ 4 against the reference renders.

**FG-7 Cable station and lat pulldown.** Machine primitives, the dual pulley (front and side), the pulldown station, `lib_lat_pulldown.ts` and `lib_single_arm_triceps_pushdown.ts` (the V1 id, §7) with the drive rule. Acceptance: A1 the cable endpoint follows the hand within 0.5 units with the arm solved to it; A2 the stack rises with the load; A3 the setup moment shows the thigh pad and pulley height right and wrong; A4 `machinePivot` passes. For Version 1 this card is carried by V1-09, V1-15 and V1-17 (§10.5).

**FG-8 Batch 1 exercises.** The free-weight template exercises FG-1 to FG-6 can draw, by the researcher, author, checker and judge line. Acceptance: A1 every file passes `fg:check`; A2 judge ≥ 24 each; A3 the supervisor's sample of 3 accepted; A4 per-exercise token use recorded below. The Version 1 cards (V1-00 to V1-24, plus the FG-6 finish) are in §10.5 and come before FG-8's batches.

## 10. Version 1 plan (2026-09-29)

Supervisor-approved plan from the planning workflow of 2026-09-29 (Approach C, contact solver plus key poses, chosen by two independent judges), folded in by V1-00. Its decisions are D-FG7 (a) to (l) in `docs/COACHING-DECISIONS.md`; "D-FG7 (x)" below means that entry. The plan was written from `origin/main` at 1afc7ab. `doc:N` is line N of this file as of 1afc7ab: V1-00 edited §1 to §9 in place, so those line numbers still hold, and the Log now follows this section. "FG-6 `pose.ts`" means `src/formguide/rig/pose.ts` on PR #66 (head c613b8d). Anything marked **unverified** could not be checked when the plan was written.

### 10.1 Chosen approach and why

**Approach C (contact solver plus key poses), with grafts.** Both judges picked it:

| | Judge 1 | Judge 2 |
|---|---|---|
| A, hand-keyed | 29 | 30 |
| B, templates | 40 | 38 |
| **C, solver-hybrid** | **41** | **41** |

Why C won:
- The author writes what a coach would say ("hands on the handle", "bar over mid-foot") plus a few key poses. The solver keeps contacts true by construction. The defects reviewers kept finding by eye (bar behind the foot, hands off the handle) become impossible or get caught by a check.
- The solve happens in one place, the sampler's evaluator (`sample.ts:176-207`). So the hash, every check and the WAAPI keyframes all read the same angles. Judge 2 listed every call site: `check/index.ts:71,89,169,187,225,267,385,391,507`, `effort.ts:43,48`, `guideView.ts:71,95`.
- It fixes a real defect. On main, front seated sway turns the pelvis about the floor (`rig/pose.ts:61`, verified), which moves a thigh pad.
- It scales to the other ~138 exercises. The doc lists 28 machine drawings used by 60 exercises (doc:120-140).

**Fatal flaws the judges found, and what this plan does about each:**
1. **Driving the limb from the machine part's travel fails smoothness (c).** This is A's FG-7a and C's V1-13 and V1-18 as written, and it is also the documented rule (`model.ts:56`, doc:120). The (c) limit is 3× (`check/smooth.ts:8`, verified). The judges' scratch runs gave 3.46-12.7× for travel-driven solving and 2.08-2.89× when a joint drives. Both runs used a generic 110/120 arm, not our rig, so this is **unverified on the real rig**.
   → **Fix:** the dominant joint is the driver, as one minimum-jerk curve. One secondary channel is solved to keep the hand or foot on the part's path. The part's travel follows the body. V1-04 re-measures this on the real arms as its first check-in, before any machine work. If a geometry still fails, that exercise stays out of V1 and the decision is logged. No check changes.
2. **B's fix changes what (c) measures.** AGENTS.md forbids that ("skip, loosen or delete a test or guard check"). → Rejected.
3. **A's "merge switched off" is false for the chest press.** Its id is already in `GUIDE_IDS` (`registry.ts:3`), and `playerFor` plays any file in `exercises/` (`FormGuidePlayer.tsx:25-26,34-41`). → The chest-press file lands only in the same slot as the GU-7a stub retirement (V1-20 then V1-21).
4. **`hashes.json` is one line** (`check/hashes.json:1`, imported at `check/node.ts:8`). Parallel lanes would conflict on every merge. → One hash file per exercise (V1-01).
5. **`wrist_pron` is not drawn in the side view.** It is read only by the front frame (FG-6 `pose.ts:79`) and appears 0 times in `figureSide.ts` (both verified). → Research tells may only use channels the view can draw (D-FG7 (l), V1-02). If the curl needs a grip turn, it is shown by crossfading the dumbbell drawing (V1-06).
6. **Side seated poses draw no sway.** They rotate by sway only when standing (FG-6 `pose.ts:221`, verified). Yet `secondaryMotion` reads the sway channel value, not the drawing (`check/index.ts:387-397`). So a still figure passes. → New add-only check `swayDrawn` (V1-11).

### 10.2 Grafted ideas

| From | Idea | Where |
|---|---|---|
| B (V1-T1) | Measure the drive against (c) on the real front and side arms, and the leg press, before any machine card | V1-04 A0, the check-in gate |
| B (V1-R1) | Research validator: tells only on channels the view can draw, ranges inside AAOS, proven on seeded bad JSON | V1-02 |
| B (V1-Q2) | Mistake-sync probe (the 280 ms bug, COACHING-DECISIONS.md:597), plus a seeded broken timeline that proves the probe fails | V1-08 |
| B | A sweep of at least 50 parameter sets per contact type (reach, backrest, pulley height) | V1-04 A11 |
| B | Stricter `secondaryMotion` coverage (drawn sway) | V1-11 `swayDrawn` |
| A and B | One hash file per exercise; pre-seeded slot files for machines and handles | V1-01, V1-09 |
| A | Only the supervisor edits `registry.ts` and `player.test.ts:216`; ids switch on only after they pass | D-FG7 (g), V1-24 |
| A | Technique tests per exercise in `tests/formguide/v1/<id>.test.ts`, each proven by a reviewer mutation | every exercise card |
| A (FG-7a A8) | First phone frame-rate reading with an 80-path stand-in machine, before any machine art | V1-09 → DC0 |
| A (FG-6 A5) | A test that fails when `S_BACK` is removed | FG-6 finish |
| Judge 2 | Iterate `solveFrontArm` to a fixed point. It takes the shoulder rise from the old `shoulder_abd` (`pose.ts:124`, verified), so one pass leaves an error | V1-04 A10 |
| Planner | The played-smoothness probe runs (a), (b), (d) and seam checks, **not (c)**. WAAPI plays straight lines between stops, and that spiked 120 Hz acceleration about 5× in the demo (commit 5c0e884). (c) stays proven on the sampled data by fg:check | V1-08 |
| Planner | Split the front muscle overlays (lats, needed by the pulldown) from the long back-view card, so the pulldown is not blocked | V1-12 / V1-22 |
| Planner | Judge pass bar for V1: every applicable row at or above its Pass column (4, doc:22-27). This is stricter than the ship line (total ≥24/30, no mark below 3, doc:19) | exercise definition of done |

### 10.3 Card defaults (every card uses these unless it says otherwise)

- **base:** `origin/main` at dispatch (1afc7ab or later). Branch `claude/v1-NN-<slug>`. Open a draft PR after the first push. Merge `origin/main` (merge commit) before review. A card that starts before its dependencies merge branches from main and merges them in before review.
- **reserved_paths (R\*):**
  - watch agent files: `native/wear/**`, `src/native/wearEngine.ts`, `src/slices/settings/WatchLab.tsx`, the Watch-lab row in `Settings.tsx`, and the watch agent's CI lines;
  - `escobar-worker/**`, `.github/**`, and all signing, `EXPECTED_SHA256` and keystore handling;
  - `package-lock.json`, and `package.json` except a card's named script line;
  - `src/core/models.ts`, `src/core/store.ts`, migrations;
  - `src/app/App.tsx`, `src/main.tsx`;
  - `src/formguide/registry.ts` and the exact list at `tests/formguide/player.test.ts:216` (supervisor only);
  - `src/formguide/research/*.json` (research cards only);
  - another task's blocks in `scripts/screenshot-gate.mjs` and `tests/theme.test.ts`;
  - every path in another open card's write_scope.
- **design_reference (D\*):**
  - doc §1 standard and rubric (doc:9-27), §4 rig and machines (doc:100-141), §5 checks;
  - D-FG1 to D-FG6 plus D-FG7;
  - `docs/design/form-guide-lab/reference/*.png` (after V1-00);
  - the owner-approved turnaround sheet (after V1-05 and V1-06).
- **connectivity (C\*):** offline at runtime. No network calls, no Escobar Worker, no new stored or sent data, no new dependency. Playwright and esbuild are already devDependencies (`package.json:41-42`). Renders use the local Chromium via `MARC_CHROMIUM=/opt/pw-browsers/chromium`.
- **verification (V\*):**
  - While building: focused tests only (`npm test -- tests/formguide/<file>`, `npm run fg:check <id>`).
  - Before review: `npm run check`. If the card touches the player or gate, also `MARC_CHROMIUM=/opt/pw-browsers/chromium npm run gate`.
  - Every fail-before test shows its red run on the base commit in the PR.
  - Full regression runs only in V1-24.
- **check-in (all cards):** a PR comment headed `CHECK-IN V1-NN`, plus a Relay message, at the point the card names. It contains the design choice, the measured numbers and 1-2 renders. Bulk work waits for the supervisor's `go` or `re-guide` in that thread. Until then the builder works only on scaffolding and tests the check-in cannot change.
- **risk_and_recovery (default):**
  - No limit is ever changed.
  - After two failed tries of the same approach with no new evidence, stop and tell the supervisor.
  - Recovery is a plain revert commit of the PR.
- **return (T\*):** a PR body with:
  - the head commit and changed paths;
  - evidence per criterion (test name, gate probe or render path);
  - the mutation list (what was broken and which test failed);
  - measured numbers (ms, bytes, (c) ratios, path counts);
  - what needs a real phone;
  - open risks and tokens used.

**Exercise definition of done (DoD), used by every exercise card:**
1. `research/<id>.json` was merged earlier by the research card. `git diff` shows the exercise PR does not touch it.
2. `npm run fg:check <id>` passes all checks: the 20 in `index.ts`, plus V1-07's, plus V1-11's `swayDrawn`, at unchanged limits. The hash is in `check/hashes/<id>.txt`. The file is ≤2 KB gzip.
3. 2 to 4 technique tests in `tests/formguide/v1/<id>.test.ts`. Each fails when the reviewer breaks the key it guards.
4. `npm run fg:render <id>` output in the PR:
   - the 4 moments, the mistake, compare mode, and the setup pair for machines;
   - a filmstrip, and a `--debug` view with contact markers;
   - all at 360 and 390 px in Silent Black and Paper, plus a 5-theme strip.
5. A fresh-context judge gives every applicable rubric row ≥4 (doc:22-27), against the reference PNGs and the owner sheet.
6. The supervisor looks at every V1 exercise and every new machine (stricter than the doc's 1 in 5, doc:153). The owner sees each new machine's stills before merge (doc:222).
7. The id is switched on by the supervisor after the judge passes, and V1-08's gate block then plays it.

### 10.4 Lanes and concurrency

At most **5 agents at once** (doc:146), reviewers and judges included. Judges use a freed slot (doc:187).

Lanes:
- **S** supervisor
- **A** solver and checks (strong model)
- **B** rig and views (strong)
- **C** tools and gate (light, then medium)
- **D** player and machine core (strong)
- **E** research (light)
- **F1, F2, F3** exercise and art (strong)

| Wave | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Slot 5 |
|---|---|---|---|---|---|
| 1 (day 1-2) | FG-6 finish (B) | V1-04 (A) | V1-01 → V1-05 (C) | V1-02 → V1-03 (E) | V1-09 early build (D) |
| 2 (FG-6 merged, ~day 2-4) | V1-06 (B) | V1-04 → V1-07 (A) | V1-05 → V1-08 (C) | V1-09 (D) | V1-03 / reviews (E) |
| 3 (~day 5-7) | V1-11 → V1-12 (B) | V1-07 → V1-10 → V1-15 (A → F3) | V1-13 (F1) | V1-19 early build (D) | V1-14 (F2) |
| 4 (~day 7-10) | V1-22 (B) | V1-15 → V1-18 (F3) | V1-13 → V1-17 (F1) | V1-19 (D) | V1-16 (F2) |
| 5 (~day 10-12) | V1-22 finish (B) | V1-21 (F3) | V1-23 (F1) | reviews and judges | reviews and judges |

Supervisor work (V1-00, V1-20, V1-24, switch-on PRs) runs alongside the slots.

**Shared-file order.** Each file has one writer at a time, merged in this order:
- `check/index.ts`: V1-01 → V1-04 → V1-07 → V1-11
- `check/view.ts`: V1-04 → V1-06 → V1-11
- `model.ts`: V1-04 → V1-06
- `guideView.ts`: V1-04 → V1-06 → V1-09
- `ExercisePlayer.tsx`: V1-06 → V1-09 → V1-19
- `rig/pose.ts`: FG-6 → V1-06 → V1-11 → V1-22
- `player/scene.ts`: V1-05 → V1-09
- `effort.ts`: V1-04 → V1-10

`COACHING-DECISIONS.md` takes one appended D-FG entry per card; keep both sides on merge.

**Owner checklist, merge order.** Builds may run ahead; merges may not:
1. V1-00
2. V1-01
3. FG-6
4. V1-02
5. V1-03
6. V1-04
7. V1-05
8. V1-06
9. V1-07
10. V1-08
11. V1-09 (then DC0)
12. V1-10
13. V1-11
14. V1-12
15. V1-13
16. V1-14 (then DC1)
17. V1-15
18. V1-16
19. V1-17
20. V1-18
21. V1-19
22. V1-20
23. V1-21
24. V1-22
25. V1-23
26. V1-24

The back view (V1-22) is placed late on purpose, so its long art work never blocks the rest.

### 10.5 Cards in dispatch order

#### V1-00: Decisions, references, stub fix (S)
- **outcome:**
  - D-FG7 entries (a) to (l).
  - `docs/design/form-guide-lab/**` copied from 6c5a1a0.
  - Doc fixes: doc:3 now points at real files; doc:125 says back; doc:226 fallback; doc:243 uses the single-arm id; §7 V1 list adds the back view, hanging pose and sway rule; §9 lists the V1 cards; doc:120 gets the revised drive rule.
  - `lib_lat_pulldown` removed from `GUIDE_IDS`.
  - The drawable-channel list (l) published.
  - The owner checklist numbered as in §10.4.
  - One non-blocking message to the owner with the quick questions (§10.6).
  - The OK for V1-05 to add the `fg:render` script line.
- **base:** default. **depends_on:** none.
- **read_first:** doc:1-30, 100-141, 197-249; `registry.ts`; `player.test.ts:212-218`; `patterns.ts`; `overlays.ts`; main `pose.ts:51-130`; FG-6 `pose.ts:191-290`.
- **write_scope:** `docs/COACHING-DECISIONS.md` (D-FG7), `docs/FORM-GUIDE-PRODUCTION.md`, `docs/design/form-guide-lab/**`, `src/formguide/registry.ts`, `tests/formguide/player.test.ts` (the exact list plus 1 new test).
- **reserved_paths:** R\*, except the registry pair.
- **acceptance:**
  - A1: `git ls-tree origin/main docs/design/form-guide-lab/` lists the HTML and 6 PNGs, with sha256 equal to 6c5a1a0 (listed in the PR).
  - A2: new test "every `GUIDE_IDS` id has an exercise file or is the stub's id (`stubGuide.ts:33`)". Fails before (lat pulldown), passes after.
  - A3: `hasGuide('lib_lat_pulldown')` is false; the exact list is updated in the same commit.
  - A4: doc:125 agrees with `patterns.ts:20`; doc:243 agrees with doc:205.
  - A5: each D-FG7 item has a reason and a fallback.
  - F1: the GU-7a gate block stays green.
- **design_reference:** D\*. **connectivity:** C\*.
- **verification:** `npm test -- tests/formguide/player.test.ts`; CI gate green.
- **check_in:** none (supervisor).
- **risk_and_recovery:** the PNGs may not match today's FG-1 (unverified). If they differ, note it in D-FG7, and the owner-approved sheet becomes the primary likeness reference.
- **return:** T\*.

#### FG-6: finish PR #66 (B, existing builder)
- **outcome:** the scope does not widen. At planning (2026-09-29) PR #66 was open, not a draft, at head `c613b8d` with CI 4 of 4 green (android-gate, source-gate, visual-gate-tz and guard, finished 2026-09-28 23:43 UTC), its head did not contain current main, and its PR body still described the old head 2e31ca4; whether review r2 happened is **unverified**. Steps:
  1. V1-00 merges the references first.
  2. The FG-6 builder, on its own branch:
     - merges `origin/main` with a merge commit;
     - adds a test that fails when `S_BACK` is removed (the PR #66 review found removing it failed nothing);
     - changes the "check bites" test so it breaks code, not a string;
     - updates the PR body to the new head.
  3. A fresh reviewer runs r2: the r1 fixes (ANSUR ±0.08, overlap ≥400 units²) plus **A4 likeness judged against the reference PNGs, now on main**.
  4. The supervisor merges when every check is green on a head containing the latest main.
  5. The one `view.ts` wiring line the PR asks for goes to **V1-06**, not into FG-6.
- **base:** `origin/claude/fg-6-side-figure` @ c613b8d, merged with `origin/main`.
- **depends_on:** V1-00 (references for A4).
- **read_first:** the PR #66 review r1 comments; FG-6 D-FG6 (`COACHING-DECISIONS.md:497ff` on the branch).
- **write_scope:** as the PR (15 files), plus `tests/formguide/side.test.ts` (the new `S_BACK` test).
- **reserved_paths:** R\*, plus `check/view.ts` (goes to V1-06).
- **acceptance:**
  - doc:241 A1 to A4, with A4 re-judged against the PNGs.
  - A5: removing `S_BACK` fails a test.
  - A6: the "check bites" test breaks code, not a string.
  - F1: green on a head containing the latest main.
- **design_reference:** D\*. **connectivity:** C\*. **verification:** V\*.
- **check_in:** none (already in review).
- **risk_and_recovery:** a merge conflict with main is unlikely, since main changed only AGENTS.md. If r2 fails likeness, the builder fixes proportions and the ANSUR test stays at ±0.08.
- **return:** T\*.

#### V1-01: Hash file per exercise (C, light)
- **outcome:** `src/formguide/check/hashes/<id>.txt` replaces `hashes.json`. `check/node.ts:8,31` reads the folder. The message at `index.ts:513` names the new path. Fixture `fx.hash` keeps working.
- **base:** default. **depends_on:** none.
- **read_first:** `check/node.ts`, `check/index.ts:504-516`, `scripts/fg-check.mjs`.
- **write_scope:** `src/formguide/check/{node.ts,hashes/**}`, `src/formguide/check/index.ts` (line 513 only), deletion of `hashes.json`, `tests/formguide/hashes.test.ts`.
- **reserved_paths:** R\*.
- **acceptance:**
  - A1: the lateral raise hash is `c1ac61634cd68bd4` from its `.txt` file, and all 20 checks pass.
  - A2: a file with no hash fails `hash`, and the message names `check/hashes/<id>.txt`. This fails before, because the message names `hashes.json`.
  - A3: no import of `hashes.json` remains (grep test).
  - A4: every seeded bad fixture gives the same failing checks as on main (snapshot).
  - A5: `fg:check` wall time is within ±0.3 s of 2.8 s (the Understand measurement).
- **design_reference:** D-FG3. **connectivity:** C\*. **verification:** V\*.
- **check_in:** none (mechanical).
- **risk_and_recovery:** the esbuild bundle may inline JSON differently than a folder read. The node-only fs read is covered by A1 through `npm run fg:check`.
- **return:** T\*.

#### V1-02: Research, free weights, cables and rear delt (E, light)
- **outcome:** research JSON for `lib_dumbbell_biceps_curl`, `lib_romanian_deadlift`, `lib_hanging_leg_raise`, `lib_seated_cable_row`, `lib_single_arm_triceps_pushdown`, `lib_lat_pulldown` and `lib_rear_delt_fly`.
  - Each holds ranges, tempo, order, muscles with `peakAt`, and one drawable mistake with at least 2 tells.
  - Each holds the contact facts, with sources: bar over mid-foot, curl grip, row handle line, pulldown grip width, hanging swing.
  - Plus `tests/formguide/research.test.ts`, the validator.
- **base:** default. **depends_on:** V1-00 (triceps id, view, channel list).
- **read_first:** doc:148 (researcher prompt); `model.ts:93-103`; `rig/ranges.ts:12-22`; D-FG7 (l).
- **write_scope:** `src/formguide/research/{7 ids}.json`, `tests/formguide/research.test.ts`, `tests/formguide/fixtures/research-bad/**`.
- **reserved_paths:** R\*, plus `exercises/**`.
- **acceptance:**
  - A1: the validator rejects seeded bad JSON: a missing source, 1 tell, a side tell on `wrist_pron`, and a range outside AAOS. The reviewer removes the channel rule and a test fails.
  - A2: every number has a source.
  - A3: ≤300 words each (doc:148).
  - A4: the RDL mistake is drawable (bar drifts from the legs or knees bend), not spinal rounding.
- **design_reference:** doc:148, D-FG7 (l). **connectivity:** web sources while authoring only. **verification:** V\*.
- **check_in:** after the first file (the curl), before the other 6.
- **risk_and_recovery:** a source may be thin. Flag it, and never invent a number.
- **return:** T\*, plus sources per file.

#### V1-03: Research, machines (E, light)
- **outcome:** research JSON for `lib_machine_chest_press`, `lib_incline_machine_press`, `lib_shoulder_press`, `lib_leg_press`, `lib_seated_leg_curl`, `lib_leg_extension` and `lib_seated_calf_raise`.
  - Machine settings are cited, or flagged `unverified_on_machine` (`model.ts:101`).
  - Presses and the leg press get soft-lockout end ranges, with sources.
- **base, depends_on, read_first:** as V1-02, plus doc:120-141 and doc:222.
- **write_scope:** those 7 JSON files.
- **reserved_paths:** R\*.
- **acceptance:**
  - A1: all pass the V1-02 validator.
  - A2: every setting has a source or the flag.
  - A3: press end ranges stop short of full extension, with a source.
- **design_reference, connectivity, verification:** as V1-02.
- **check_in:** after the chest press file.
- **risk_and_recovery:** gym models vary. Flag the settings; the owner checks them at the gym.
- **return:** T\*.

#### V1-04: Solver core (A, strong)
- **outcome:** new `src/formguide/solve/`.
  - Opt-in `contacts`, `balance`, `mistake.release` and `mistake.travel`.
  - `follow` drive parts, as a one-dimensional path projection.
  - An `effort.force` field.
  - `poseAt` and `sampleGuide` take an optional Rig. When a file declares contacts, each stop is solved after the curves, deltas and sway.
  - Derived travel is returned beside the channels and hashed only when present.
  - Files without contacts take the old path byte for byte.
  - The Rig gets a `chain`: the front chain wraps `solveFrontArm` in a fixed-point loop.
  - Tests use two fixture machines, one travel-driven and one follow, for comparison.
- **base:** default. **depends_on:** V1-00, V1-01. The side measurements in A0 wait for FG-6 on main.
- **read_first:** `sample.ts:99-219`, `check/index.ts:60-110,265-321,504-516`, `check/effort.ts`, `rig/ik.ts`, `pose.ts:121-130`, FG-6 `pose.ts:266-290`, both judges' fatal flaws.
- **write_scope:**
  - `src/formguide/solve/**` (new);
  - `model.ts` (add-only fields, plus the drive-rule comment at `model.ts:56`, D-FG7 (b));
  - `sample.ts`;
  - `check/machines.ts` (type only);
  - `check/index.ts` (call sites and `eachSample` travel source only);
  - `check/effort.ts:43,48` only;
  - `check/view.ts` (Rig type, front chain);
  - `player/guideView.ts:71,95` only;
  - `tests/formguide/{solve,driveSmooth}.test.ts`, `tests/formguide/fixtures/solve/**`, `tests/formguide/fixtures/bad/handsOnHandle.follow/**`.
- **reserved_paths:** R\*, plus `rig/pose.ts` (wrap it, don't edit it).
- **acceptance:**
  - **A0 (gate):** `driveSmooth.test.ts` records, on the **real** front arm and the FG-6 side arm and leg, the (c) ratio and contact gap for each geometry: horizontal press, ~35° incline, overhead press, front pulldown, and the 45° sled. It compares (i) travel-driven solving at every stop with (ii) the joint driver plus one solved channel, and asserts the numbers. A geometry is buildable only if (ii) gives (c) ≤3 and gap <0.5.
  - A1: the lateral raise hash `c1ac61634cd68bd4` is unchanged, and every bad fixture's failing set equals main's.
  - A2: on the front two-hand bar fixture, contacts hold ≤1e-6 at every stop of every rep and the mistake. `handsOnHandle`, `bodyOnPad` and `machinePivot` pass at unchanged limits. Fails before: on main the sampler never reads contacts or drives.
  - A3: an unreachable target throws, naming the contact, u and the distance. By contrast, FG-6's `solveSideArm` silently straightens (FG-6 `pose.ts:276`).
  - A4: the bend sign never flips within a rep.
  - A5: a file that keys a channel a contact solves is rejected.
  - A6: contacts with no rig throw. `runChecks` and the player path run on the fixture with no throw, proving every call site is threaded.
  - A7: 3 reps plus the mistake solve in ≤50 ms under `MARC_PERF=1`; the number is recorded.
  - A8: released contacts are not enforced in the mistake.
  - A9: seeded bad file `handsOnHandle.follow` (a follow path missing the hand by 1 unit) fails `handsOnHandle`.
  - A10: the fixed-point `solveFrontArm` residual is ≤1e-6. Fails before: the one-pass residual on a raised-arm fixture is above 1e-6.
  - A11: a sweep of at least 50 contact parameter sets inside declared bounds passes smoothness, `jointRanges` and the anchor checks.
- **design_reference:** doc:120 (revised by D-FG7 (b)); D-FG2 and D-FG3. **connectivity:** C\*.
- **verification:** V\*, plus `npm run fg:check lib_dumbbell_lateral_raise`.
- **check_in:** after A0's numbers and the schema sketch, before threading call sites.
- **risk_and_recovery:**
  - If A0 fails for a geometry, that exercise is marked "left out" in D-FG7 and no check changes.
  - Import cycle: FG-6's `sideGuideRig` imports `poseAt`. The rig is passed as an argument, and `sample.ts` never imports rig code.
- **return:** T\*, plus the A0 table.

#### V1-05: `fg:render` and `sceneOf` (C, medium)
- **outcome:** `scripts/fg-render.mjs` plus `src/formguide/check/render.ts`, bundled with esbuild like `fg:check` (`package.json:21`).
  - A pure `sceneOf()` in `player/scene.ts` is used by both the renders and the player.
  - Output goes to `renders/<id>/`: the 4 moments, the mistake, compare mode, the setup pair, and a 12-frame filmstrip per rep, at 360 and 390 px in all 5 themes.
  - `--debug` adds contact markers, pivots and the centre-of-mass line.
  - `--sheet` renders the front, side and back figure at rest.
  - It reports the tremor's pixel movement for D-FG7 (i).
  - Adds the script line in `package.json` (OK given in D-FG7) and `renders/` to `.gitignore`.
- **base:** default. **depends_on:** V1-00. Contact markers need V1-04. Side output works once V1-06 lands.
- **read_first:** `snapshot.ts`, `guideView.ts`, `scripts/fg-check.mjs`, `screenshot-gate.mjs:100-120`.
- **write_scope:** `scripts/fg-render.mjs`, `src/formguide/check/render.ts`, `src/formguide/player/scene.ts`, `tests/formguide/render.test.ts`, `package.json` (1 script line), `.gitignore` (1 line).
- **reserved_paths:** R\* (except the named script line).
- **acceptance:**
  - A1: the lateral raise renders 5 themes × 2 widths, all non-blank (pixel variance >0) and byte-identical across two runs.
  - A2: the player and the renders call the same `sceneOf` (spy test).
  - A3: an id with no rig exits 1 with the rig's reason.
  - A4: ≤60 s per exercise, recorded.
  - A5: `package-lock.json` is unchanged.
  - A6: the debug marker sits on the solved hand within 1 px (after V1-04).
- **design_reference:** doc:151, 161, 197. **connectivity:** local Chromium only. **verification:** V\*.
- **check_in:** after the first lateral-raise contact sheet.
- **risk_and_recovery:** fonts could make PNGs non-deterministic. Pin the Chromium path and the font stack; if they still differ, compare by pixel variance and record why.
- **return:** T\*, plus sample renders.

#### V1-06: Side-view wiring, cameras, hand-held parts (B, strong)
- **outcome:**
  - `rigFor` returns FG-6's side rig; the `view.ts:38` branch goes.
  - A back slot points at a stub `figureBack.ts` that gives the reason "back view not drawn yet (V1-22)".
  - The side chain: `solveSideArm`, plus a new `solveSideLeg` that throws when a target is unreachable.
  - `markupOf` draws side markup (the throw at `guideView.ts:147` goes).
  - The camera label follows the view (`ExercisePlayer.tsx:159`).
  - The side hand draws the dumbbell and the end-on barbell (`FIGURE_PARTS`, `view.ts:25`). If the curl research specifies a grip turn, the side dumbbell's drawings crossfade with `wrist_pron` (opacity only).
  - New `VIEWBOXES`, at `standingFront`'s scale: `standingSide`, `seatedSide`, `lyingSide`, `hangingSide` (bar at 2.3 m, COACHING-DECISIONS.md:489), `ankleSide`, `gripFront` and `backFull`.
  - The FG-6 prone fixture moves to `lyingSide`. FG-6 reported prone at -87.3 against a -88 edge; not re-measured.
- **base:** default. **depends_on:** FG-6 and V1-04 merged.
- **read_first:** `check/view.ts`, `guideView.ts:20-28,140-150`, `ExercisePlayer.tsx:150-165`, FG-6 `pose.ts:164-300`, `figureSide.ts`.
- **write_scope:**
  - `check/view.ts`;
  - `rig/figureBack.ts` (stub);
  - `rig/figureSide.ts` (hand-part slot);
  - `rig/pose.ts` (`solveSideLeg`);
  - `model.ts` (VIEWBOXES);
  - `guideView.ts` (`markupOf`);
  - `ExercisePlayer.tsx` (label line);
  - `tests/formguide/fixtures/side/**` (camera field only);
  - `tests/formguide/sideWiring.test.ts`.
- **reserved_paths:** R\*.
- **acceptance:**
  - A1: FG-6's side fixtures pass every check through the real `rigFor`, with no `vi.mock`. Fails before: "no side view figure yet".
  - A2: a side file mounts in vitest and shows "Side view". Fails before: the throw at `guideView.ts:147`.
  - A3: `solveSideLeg` is accurate to ≤1e-6 with a natural knee bend, and throws when unreachable.
  - A4: every camera holds its pose's figure ≥1 unit inside, at rest and at range ends, in both facings.
  - A5: the lateral raise frames and markup are byte-identical.
  - A6: the side dumbbell and barbell are ≤25 paths, token-only, and pass `themes`.
  - F1: a back file fails with the stub's reason, not a crash.
- **design_reference:** D-FG6. **connectivity:** C\*. **verification:** V\* plus the gate.
- **check_in:** after the cameras and rest stills, before the hand parts.
- **risk_and_recovery:** a machine may not fit a camera. The camera set is extended by this lane only.
- **return:** T\*.

#### V1-07: New add-only checks (A, strong)
- **outcome:** each new check has its own seeded bad folder (the folder rule, `checks.test.ts:39-40`):
  - `contactsHeld`;
  - `matchesResearch`: tempo, kind, order, muscles and tells equal research, and ≤3 cues of ≤60 characters;
  - `framing`: ≥1 unit margin for both figures across load 0, the part's maximum and lb units, both facings, compare, zoom, every rep and the mistake;
  - `contrast`: text ≥4.5:1, marks ≥3:1 and the figure against the page ≥3:1, in 5 themes, with a minimum text height at 360 px;
  - `balance`: standing files keep the centre of mass over the foot base, using de Leva 1996 segment masses (cited in the code);
  - `targetDrawn`: `fg-t-<muscle>` is present in the drawn markup;
  - `travelRange`: follow travel stays within the research machine range.
  - Also a perturbation test that the D-FG7 (l) channel list matches the rigs.
- **base:** default. **depends_on:** V1-04 and V1-06 merged.
- **read_first:** `check/index.ts` in full, `tests/formguide/fixtures/bad/base.ts`, `tests/formguide/figure.test.ts:61-75`.
- **write_scope:** `src/formguide/check/{contacts,research,framing,contrast,balance,drawn}.ts` (new); `check/index.ts` (new entries only); `tests/formguide/fixtures/bad/<new>/**`; `tests/formguide/checksV1.test.ts`.
- **reserved_paths:** R\*, plus the 20 existing checks' code and fixtures.
- **acceptance:**
  - A1: each check fails its bad file with numbers, and passes the lateral raise.
  - A2: a 12 kg dumbbell clip reproduction fails `framing` (COACHING-DECISIONS.md:489).
  - A3: the PR #58 "20 KG" ink-on-black label fails `contrast`.
  - A4: a front file targeting `lats` fails `targetDrawn` (the front figure draws tint only for side_delts, front_delts and upper_traps), while `targetVisible` passes it.
  - A5: `git diff` shows no `LIMITS` change.
  - A6: `fg:check` stays ≤5 s per file.
- **design_reference:** WCAG 2.2 1.4.3 and 1.4.11. **connectivity:** C\*. **verification:** V\*.
- **check_in:** after the lateral raise is measured on all new checks, before writing the bad files.
- **risk_and_recovery:** the lateral raise may fail `framing` or `contrast`, or the figure may miss 3:1 against the page in some theme (unverified). Stop and report; the drawing or file is fixed, never the limit.
- **return:** T\*.

#### V1-08: Generic form-guide gate block and probes (C, medium)
- **outcome:** one add-only block, **FG-V1**, in `screenshot-gate.mjs`. For every `GUIDE_IDS` id with a file, it:
  - opens the Train sheet and takes screenshots (play, compare, Pictures, setup) at 360 and 390 px in Silent Black and Paper;
  - probe 1, played smoothness: seeks WAAPI at 1/120 s, reads the drawn transforms, and runs (a), (b), (d) plus rep-seam jumps (not (c), see §10.2);
  - probe 2: target area visible at peak effort (ported from demo commit fbaa35d);
  - probe 3: mistake figure within 1 frame of the correct one;
  - probe 4: contrast on the live page;
  - probe 5: chunk gzip sizes (≤150 KB total; 0 B of form-guide code in the main chunk, the FG-4 probes at 5627 and 5635);
  - probe 6: a frame-interval proxy under 4× CPU throttle in compare mode, recorded only.
- **base:** default. **depends_on:** V1-05 and V1-06.
- **read_first:** `screenshot-gate.mjs:5095-5130,5613-5796`; `guideView.ts:63-91`; `waapi.ts`.
- **write_scope:** `scripts/screenshot-gate.mjs` (the FG-V1 block only).
- **reserved_paths:** R\*, plus every other gate block.
- **acceptance:**
  - A1: the lateral raise passes and writes all screenshots.
  - A2: a seeded broken timeline fails probe 1.
  - A3: hiding the `side_delts` tint fails probe 2.
  - A4: a 280 ms mistake offset fails probe 3.
  - A5: `git diff` of the gate file shows added lines only.
  - A6: gate wall time recorded (it runs twice in CI).
- **design_reference:** doc:19 (360 px). **connectivity:** local Chromium. **verification:** the gate locally and in CI.
- **check_in:** after probes 1 and 2 run on the lateral raise.
- **risk_and_recovery:** CI flakiness. Probe 6 has no pass mark until DC0 exists.
- **return:** T\*.

#### V1-09: Machines in the player, stand-in machine, frame-rate readout (D, strong)
- **outcome:**
  - `src/formguide/machines/index.ts` holds `MACHINES` with 10 null slots (re-exported by `check/machines.ts`, today `MACHINES = {}` at `:29`).
  - Handle slots `wide_bar`, `v_handle` and `d_handle` in `parts/`.
  - Transform-only primitives: lever `rotate`, carriage `translate`, cable scale-and-rotate from the pulley, stack `translateY` with the plate count from the load.
  - A machine layer driven by the sampled travel.
  - A setup moment (right and wrong) before rep 1 and in Pictures.
  - A long-press on the stage opens a panel: the median and p95 frame time of the last play, and a "stress" toggle that mounts an 80-path stand-in machine behind the lateral raise in compare mode. It stores nothing.
- **base:** default (early build allowed). **depends_on:** V1-04, V1-05 and V1-06 merged.
- **read_first:** doc:118-141; `check/machines.ts`; `ExercisePlayer.tsx`; `snapshot.ts`.
- **write_scope:**
  - `src/formguide/machines/**` (index, primitives, stubs);
  - `check/machines.ts` (re-export);
  - `player/{machineView,fps}.ts` (new), `player/scene.ts`;
  - `guideView.ts` (1 call);
  - `ExercisePlayer.tsx`;
  - `parts/index.ts` (3 slots), `parts/handles/*.ts` (stubs);
  - `src/ui/styles.css` (block V1-09);
  - `tests/formguide/machines.test.ts`; `tests/theme.test.ts` (block V1-09).
- **reserved_paths:** R\*.
- **acceptance:**
  - A1: the fixture machine plays with transforms and opacity only (`noFilters`), with the anchor within 0.5 of the solved hand at every keyframe.
  - A2: the stack rises with the load and shows 0 plates at 0 kg.
  - A3: `setupDiffers` passes.
  - A4: machine ≤80 paths.
  - A5: the lateral raise mounts no machine layer, and FG-4's block stays green.
  - A6: the panel is hidden without a long-press and writes nothing to the store or localStorage (test).
  - A7: a file naming an unbuilt machine fails with "machine <id> is drawn by <card>".
- **design_reference:** doc:114, 120. **connectivity:** C\*. **verification:** V\* plus the gate.
- **check_in:** after the stand-in plays in compare mode in the dev build.
- **risk_and_recovery:** the debug panel adds bytes. Record the chunk size; the supervisor may strip the panel before release.
- **return:** T\*, plus **the APK for DC0**.

#### V1-10: Effort for cables and machines (A, strong)
- **outcome:** `force: 'contact'`: the moment arm comes from the contact's force line (hand to pulley; lever tangent). Today the torque model uses only the horizontal, gravity arm (`effort.ts:47-50`).
- **base:** default. **depends_on:** V1-04.
- **read_first:** `check/effort.ts`, `index.ts:348-382`.
- **write_scope:** `check/effort.ts`, `tests/formguide/effort.test.ts`.
- **reserved_paths:** R\*.
- **acceptance:**
  - A1: gravity files are unchanged (lateral raise hash and note).
  - A2: with an overhead pulley, the peak sits where the cable is most perpendicular to the forearm. Fails under gravity, passes under contact.
  - A3: a machine with no force line fails with "no contact force".
- **design_reference:** doc §3 effort. **connectivity:** C\*. **verification:** V\*.
- **check_in:** after A2's fixture numbers.
- **risk_and_recovery:** if the model disagrees with research `peakAt`, `muscleTiming` stays unchanged and the file supplies explicit effort curves.
- **return:** T\*.

#### V1-11: Supports, sway about the support, hanging and reclined, joint sweep (B, strong)
- **outcome:**
  - Support options: seat, back pad, grip, floor, lying. Pads come from `MachineDrawing.pads`; `rigFor` gains a machine argument.
  - Sway follows D-FG7 (c). This replaces the pelvis turn about the floor for front seated (`pose.ts:61`).
  - The side hanging pose, and the reclined support.
  - A joint sweep: every joint in 5° steps across AAOS (`ranges.ts:12-22`), in every pose and in front and side views, with neighbours overlapping ≥400 units².
  - ANSUR ±0.08 across views.
  - The add-only `swayDrawn` check: sway must move the drawn head by at least what 0.2° about the file's support gives.
- **base:** default. **depends_on:** V1-06 and V1-07.
- **read_first:** main `pose.ts:51-70`, FG-6 `pose.ts:191-230`, FG-6 overlap and ANSUR tests.
- **write_scope:** `rig/pose.ts` (supports, sway, hanging); `rig/figureSide.ts` (hanging legs only if needed); `check/view.ts` (machine argument); `check/index.ts` (`swayDrawn` entry); `tests/formguide/fixtures/bad/swayDrawn/**`; `tests/formguide/{supports,jointSweep}.test.ts`.
- **reserved_paths:** R\*.
- **acceptance:**
  - A1: standing frames are byte-identical and the lateral raise hash is unchanged.
  - A2: front seated thigh-pad drift is <0.01 over 481 samples. Fails before, because of `pose.ts:61`.
  - A3: hanging keeps the hand on the bar grip ≤1e-6 and swings about it, with feet off the floor.
  - A4: the reclined back drifts <0.01 at backrest angles of 20-60°.
  - A5: no gap in the sweep. The reviewer shrinks the hip block and it fails.
  - A6: `swayDrawn` fails a seated side fixture on FG-6 code (sway drawn only when standing, FG-6 `pose.ts:221`) and passes after.
  - A7: `secondaryMotion` and its [0.2°, 1.5°] band are unchanged.
- **design_reference:** D-FG7 (c) and (f). **connectivity:** C\*. **verification:** V\*.
- **check_in:** after seated and hanging stills and sweep numbers, before the reclined support.
- **risk_and_recovery:** if the reclined support fails, add a `reclined` pose and record it.
- **return:** T\*.

#### V1-12: Front overlays (B, strong)
- **outcome:** the front figure draws tint and band for `lats`, `biceps` and `forearms`.
- **base:** default. **depends_on:** V1-11.
- **read_first:** `rig/figureFront.ts`, `overlays.ts:8`.
- **write_scope:** `rig/figureFront.ts` (overlay groups only); `tests/theme.test.ts` (block V1-12).
- **reserved_paths:** R\*.
- **acceptance:**
  - A1: `targetDrawn` passes for a `lats` front fixture (fails before).
  - A2: the front figure stays ≤260 paths, count recorded (202-204 today; target 220, doc:114).
  - A3: the lateral raise markup changes only by the added groups, and its hash is unchanged.
  - A4: 5 themes, no literal colours.
- **design_reference:** D\*. **connectivity:** C\*. **verification:** V\*.
- **check_in:** after the lats render at 360 px.
- **risk_and_recovery:** a path budget overrun. Simplify the band paths; the cap stays.
- **return:** T\*.

#### V1-13: Curl, RDL, hanging leg raise (F1, strong)
- **outcome:**
  - **Curl:** `elbow_flex` is the driver; `shoulder_flex` stays in a tight research range; both arms together; the grip per research (crossfade only if needed). Mistake: swing (`torso_lean` and `shoulder_flex` tells).
  - **RDL:** `hip_flex` keys with soft knees; the bar holds a line contact through mid-foot; `balance` solves `ankle_flex`; the near arm covers the near leg (D-FG6); plates come from the load (D-FG5). Mistake: releases the line.
  - **Hanging leg raise:** grip support; `hip_flex` and `knee_flex` keys. Mistake: swing plus faster tempo. No load label (COACHING-DECISIONS.md:600; `load.ts:28`).
- **base:** default. **depends_on:** V1-02, V1-04, V1-05, V1-06, V1-07; V1-11 for the hanging leg raise.
- **read_first:** DoD; the 3 research files; `lib_dumbbell_lateral_raise.ts`.
- **write_scope:** `exercises/{3 ids}.ts`, `check/hashes/{3 ids}.txt`, `tests/formguide/v1/{3 ids}.test.ts`.
- **reserved_paths:** R\*, plus `research/**`.
- **acceptance:**
  - DoD 1-6.
  - A7: curl upper-arm drift stays within research.
  - A8: the RDL bar stays ≤0.5 from the mid-foot line, and the mistake leaves it by >5.
  - A9: hanging-leg-raise hands stay on the bar ≤0.5; the pelvis swing is small in the correct rep and large in the mistake.
  - F1: the reviewer shifts the RDL line 1 unit and `contactsHeld` or `balance` fails.
- **design_reference:** D\*. **connectivity:** C\*. **verification:** `fg:check` and `fg:render` for each.
- **check_in:** after the curl is keyed and rendered, before RDL and the hanging leg raise.
- **risk_and_recovery:** hand keys in the 2 KB cap. Measure the first file; the cap stays.
- **return:** T\*, plus judge sheets.

#### V1-14: 45° leg press (F2, strong)
- **outcome:**
  - The `leg_press_45` drawing: sled carriage on a 45° rail, plates from the load, reclined seat and back pad.
  - `knee_flex` is the min-jerk driver; `hip_flex` is solved so the feet stay on the sled along the rail; ankle foot-flat is solved; the sled follows the feet.
  - Soft lockout. Setup moment: backrest angle, right and wrong.
  - Mistake: hips roll off the pad at the bottom, drawn via the release plus `torso_lean`, since there is no pelvic-tilt channel.
- **base:** default. **depends_on:** V1-03, V1-04 (A0 buildable for the sled), V1-07, V1-09, V1-10, V1-11.
- **read_first:** DoD; doc:120, 132.
- **write_scope:** `machines/leg_press_45.ts`, `exercises/lib_leg_press.ts`, its hash and v1 test.
- **reserved_paths:** R\*.
- **acceptance:**
  - DoD.
  - A7: `bodyOnPad` drift <0.01 and feet within 0.5 of the sled on every correct sample.
  - A8: plates follow the load (0 at 0 kg).
  - A9: ≥1 unit framing margin in compare mode.
  - A10: machine ≤80 paths.
  - F1: a sled off its rail fails `machinePivot`.
- **design_reference:** D\*. **connectivity:** C\*. **verification:** as V1-13.
- **check_in:** after the drawing at rest, the setup pair and the path count, before keying.
- **risk_and_recovery:** the heaviest drawing; its merge triggers **DC1**. If the file exceeds 2 KB, report early.
- **return:** T\*, plus **the APK for DC1**.

#### V1-15: Side cables: dual pulley, row station, pushdown, row (F3, strong)
- **outcome:**
  - Drawings: the dual pulley (side, high/mid/low; later reused by 21 cable exercises, doc:139), the row station, `d_handle` and `v_handle`.
  - **Pushdown:** the near arm works (the mirror rule); `elbow_flex` is the driver; `shoulder_flex` is tight; the cable follows the hand; the stack rises with the change in cable length. Mistake: elbow drifts plus trunk lean.
  - **Row:** seat support; the feet are on the plate via a contact solving hip and knee (overriding the seated 90/90, `pose.ts:12`); both arm joints are keyed min-jerk; the cable follows. Mistake: torso rocks.
- **base:** default. **depends_on:** V1-02, V1-04, V1-07, V1-09, V1-10, V1-11.
- **read_first:** DoD; doc:138-139.
- **write_scope:** `machines/{dual_pulley,row_station}.ts`, `parts/handles/{d_handle,v_handle}.ts`, `exercises/{lib_single_arm_triceps_pushdown,lib_seated_cable_row}.ts`, their hashes and v1 tests.
- **reserved_paths:** R\*.
- **acceptance:**
  - DoD.
  - A7: the cable end is within 0.5 of the hand at every keyframe, and the stack is monotone with cable length.
  - A8: setup pulley height, right and wrong.
  - A9: parts ≤25 paths, machines ≤80.
  - F1: the reviewer moves the pulley 10 units and the effort peak shifts.
- **design_reference:** D\*. **connectivity:** C\*. **verification:** as V1-13.
- **check_in:** after the pulley stills, before the station and handles.
- **risk_and_recovery:** the pulley is reused widely, so the supervisor gives it a full look.
- **return:** T\*.

#### V1-16: Leg extension, seated leg curl, seated calf (F2, strong)
- **outcome:**
  - **Leg extension and leg curl:** levers pivot on the knee with an ankle pad (plus a thigh pad for the curl). `knee_flex` is the driver and the lever follows the shin. Setup: knee in line with the pivot, right and wrong (doc:142).
  - **Calf:** `ankle_flex` is the driver; the forefoot is fixed on the platform edge; the knee pad follows the knee; the `ankleSide` zoom is used.
  - Mistakes: hips lift plus a fast drop; for the calf, bouncing or partial range.
- **base:** default. **depends_on:** V1-03, V1-04, V1-07, V1-09, V1-10, V1-11.
- **read_first:** DoD; doc:108, 131, 135, 141-142.
- **write_scope:** `machines/{leg_extension,leg_curl_seated,calf_seated}.ts`, `exercises/{3 ids}.ts`, their hashes and v1 tests.
- **reserved_paths:** R\*.
- **acceptance:**
  - DoD.
  - A7: `machinePivot` ≤0.05 on every correct sample.
  - A8: calf knee pad ≤0.5 from the knee; forefoot drift <0.01.
  - A9: at 360 px the ankle's travel spans ≥40 CSS px in the zoom.
  - F1: moving the pivot 1 unit fails.
- **design_reference:** D\*. **connectivity:** C\*. **verification:** as V1-13.
- **check_in:** after the leg extension drawing and one rendered rep.
- **risk_and_recovery:** the calf's pivot may not bind to a joint (unverified); report at the check-in.
- **return:** T\*.

#### V1-17: Lat pulldown, front view (F1, strong)
- **outcome:**
  - The pulldown station (front, thigh pad, cable to stack) and the `wide_bar` part.
  - Seated front pose with the knees under the pad (static contact).
  - `shoulder_abd` is the min-jerk driver; `elbow_lead` is solved to keep the hands on the bar's vertical line at the research grip width; the bar follows; the `gripFront` zoom is used.
  - Mistake: lean back (`torso_lean`; the trunk shortens by cos, `pose.ts:67`) plus partial range.
- **base:** default. **depends_on:** V1-02, V1-04 (A0 buildable for the pulldown), V1-07, V1-09, V1-11, V1-12.
- **read_first:** DoD; doc:73-94, 137.
- **write_scope:** `machines/pulldown_station.ts`, `parts/handles/wide_bar.ts`, `exercises/lib_lat_pulldown.ts`, its hash and v1 test.
- **reserved_paths:** R\*.
- **acceptance:**
  - DoD.
  - A7: thigh pad drift <0.01 with sway on.
  - A8: lats visible at peak (V1-08 probe 2).
  - A9: the bar stays in the camera in compare mode.
  - A10: the supervisor re-adds the id only after the judge passes.
- **design_reference:** D\*. **connectivity:** C\*. **verification:** as V1-13.
- **check_in:** after the station drawing and one rendered rep.
- **risk_and_recovery:** a lean-back mistake may read poorly in the front view; the judge's legibility mark decides. Fallback: pick another drawable tell.
- **return:** T\*.

#### V1-18: Seated press machines, incline press, shoulder press (F3, strong)
- **outcome:**
  - Drawings: `chest_press` (side, with seat and backrest settings; the builder records whether the incline is a setting or its own drawing, per doc:124) and `shoulder_press`.
  - `elbow_flex` is the min-jerk driver; `shoulder_flex` is solved to the handle path; the handle follows; back pad and seat are the supports.
  - Machine presses start with the push (`lift_first`) with a stated why (`patterns.ts:14-15`).
  - The shoulder press gets `bladeRhythm` text (`index.ts:398`).
  - Setup: seat height, right and wrong.
  - Finishes `lib_incline_machine_press` and `lib_shoulder_press`. The chest-press file waits on the branch for V1-21.
- **base:** default. **depends_on:** V1-03, V1-04 (A0 buildable for each press), V1-07, V1-09, V1-10, V1-11.
- **read_first:** DoD; doc:124-126.
- **write_scope:** `machines/{chest_press,shoulder_press}.ts`, `exercises/{lib_incline_machine_press,lib_shoulder_press}.ts`, their hashes and v1 tests.
- **reserved_paths:** R\*, plus `exercises/lib_machine_chest_press.ts` until V1-21.
- **acceptance:**
  - DoD.
  - A7: `handsOnHandle` <0.5 and back-pad drift <0.01 on every correct sample.
  - A8: no elbow reaches 0° in the correct figure, and (c) passes at the turn.
  - A9: `upper_chest` visible in the incline press (`overlays.ts:9`).
- **design_reference:** D\*. **connectivity:** C\*. **verification:** as V1-13.
- **check_in:** after the chest-press drawing, the setup pair and one keyed incline rep.
- **risk_and_recovery:** if a press geometry fails A0 on the real rig, that exercise is left out. No check change.
- **return:** T\*.

#### V1-19: Player standard (§1) and GU-7a parity (D, strong)
- **outcome:** the §1 items the player lacks (doc:13-16):
  - readouts: joint angle, hand speed, effort bars, phase bar;
  - an angle arc and one tag outside the face keep-out;
  - a hand-path trace;
  - muscle hotspots with the one-bubble rule (`controller.ts`).
  - Plus a parity gate block that maps every GU-7a assertion to a real guide.
- **base:** default (early build allowed). **depends_on:** V1-09.
- **read_first:** `ExercisePlayer.tsx:144-219`; `controller.ts`; `screenshot-gate.mjs:5322-5611`.
- **write_scope:** `player/{readouts,guides,hotspots}.ts`, `ExercisePlayer.tsx`, `src/ui/styles.css` (block V1-19), `tests/formguide/playerV1.test.ts`, `scripts/screenshot-gate.mjs` (V1-19 block).
- **reserved_paths:** R\*, plus the GU-7a block.
- **acceptance:**
  - A1: readouts match `poseAt` within 1°, and effort within 2%, at 10 sampled times.
  - A2: the tag never overlaps the head at any stop of any merged V1 file; a seeded overlap fails.
  - A3: hotspot targets ≥44 px at 360 px.
  - A4: a table maps each GU-7a assertion to a passing V1-19 assertion.
  - A5: 0 B of form-guide code in the main chunk (FG-4 method).
  - A6: reduced motion still shows Pictures.
  - F1: a guide with no muscles shows no hotspots and does not crash.
- **design_reference:** doc:9-17. **connectivity:** C\*. **verification:** V\* plus the gate.
- **check_in:** after readouts and the tag on the lateral raise.
- **risk_and_recovery:** chunk growth. Record it; lazy-split if needed.
- **return:** T\*.

#### V1-20: Retire the GU-7a stub (S)
- **outcome:** the supervisor removes `stubGuide.ts`, the stub path in `FormGuidePlayer.tsx` and the GU-7a gate block, replaced by the V1-19 parity block. The decision is recorded and the owner is told in plain words.
- **base:** default. **depends_on:** V1-19 merged; V1-21 ready at the same head.
- **read_first:** the V1-19 parity table.
- **write_scope:** `player/stubGuide.ts`, `FormGuidePlayer.tsx`, the GU-7a gate block, the stub tests, D-FG entry, and the V1-00 test tightened to "has a file".
- **reserved_paths:** R\*.
- **acceptance:**
  - A1: every GU-7a assertion is mapped and passing.
  - A2: no `GUIDE_IDS` id plays a stub.
  - A3: the gate is green twice on the merged head.
- **design_reference, connectivity, verification:** defaults, plus the gate.
- **check_in:** none.
- **risk_and_recovery:** a gap in the mapping means the stub stays.
- **return:** T\*.

#### V1-21: Machine chest press file (F3, strong)
- **outcome:** `lib_machine_chest_press.ts` from V1-18 merges right after V1-20.
- **base:** default. **depends_on:** V1-18, V1-20.
- **read_first, write_scope:** that exercise file, its hash and v1 test.
- **reserved_paths:** R\*.
- **acceptance:**
  - DoD, plus V1-18 A7 and A8.
  - A9: the Train sheet mounts `ExercisePlayer` (V1-08 screenshots).
- **design_reference, connectivity, verification:** defaults.
- **check_in:** none.
- **risk_and_recovery:** revert V1-20 and V1-21 together.
- **return:** T\*.

#### V1-22: Back view (B, strong; starts early, merges late)
- **outcome:**
  - The back figure drawn from FG-1's silhouette, with the back overlay list (`overlays.ts:11`).
  - Arm foreshortening.
  - Back frame and chain.
  - Adds the back to the turnaround sheet.
- **base:** default. **depends_on:** V1-06 (slot, `backFull`), V1-05 (`--sheet`), and the owner's sheet approval before overlays and foreshortening.
- **read_first:** doc:100-110; `figureFront.ts`; `pose.ts:51-70`.
- **write_scope:** `rig/figureBack.ts`, `rig/back.ts` (new), `rig/pose.ts` (back frame only), `tests/formguide/back.test.ts`, `tests/theme.test.ts` (block V1-22).
- **reserved_paths:** R\*.
- **acceptance:**
  - A1: ≤260 paths, count recorded.
  - A2: 5 themes, token-only.
  - A3: `targetDrawn` passes for every back-list muscle.
  - A4: ANSUR ±0.08 against the front.
  - A5: the sweep has no gap.
  - A6: judge likeness ≥4 against the sheet.
  - A7: front and side markup unchanged.
  - F1: an arm at 90° flexion is drawn shortened, never longer than its bone.
- **design_reference:** D\*. **connectivity:** C\*. **verification:** V\*.
- **check_in:** the back figure at rest on the sheet, plus **how horizontal abduction maps to existing channels**. The channel list has only `shoulder_abd` and `shoulder_flex` (`joints.ts:31-34`), so a new channel would be a supervisor decision.
- **risk_and_recovery:** two failed likeness rounds trigger the D-FG7 (d) fallback. Cost is about 0.8M tokens (doc:189, estimate).
- **return:** T\*.

#### V1-23: Rear delt fly (F1, strong)
- **outcome:**
  - The reverse-fly machine in the back view: handles on carriages, chest pad hidden.
  - Arms at shoulder height; the handles follow the hands; foreshortened.
  - Mistake: shrug (`shrug_cm` tells) plus bent elbows.
- **base:** default. **depends_on:** V1-02, V1-07, V1-09, V1-22.
- **read_first, write_scope:** `machines/pec_deck.ts`, `exercises/lib_rear_delt_fly.ts`, its hash and v1 test.
- **reserved_paths:** R\*.
- **acceptance:**
  - DoD.
  - A7: `rear_delts` and `mid_back` visible at the squeeze.
  - A8: handles ≤0.5 from their paths.
  - A9: traps light up in the mistake.
  - F1: if V1-22 falls back, the side view is used with `viewWhy`, or the exercise is left out.
- **design_reference, connectivity, verification:** as V1-13.
- **check_in:** after the machine drawing.
- **risk_and_recovery:** last in line. It can be dropped from V1 without blocking the release.
- **return:** T\*.

#### V1-24: Switch-on and release candidate (S)
- **outcome:**
  - After each exercise passes the judge, a small supervisor PR adds its ids to `registry.ts:3` and `player.test.ts:216`.
  - At the end: full regression (`npm run check`, `test:tz`, the gate twice in CI) on the exact release-candidate commit.
  - The APK is sent after the fingerprint step passes.
  - A contact sheet of all 15.
  - The doc Log (after §10) records fps, token use per card and chunk sizes, and the §1 checkboxes are ticked with evidence.
- **base:** default. **depends_on:** all cards merged or explicitly left out.
- **write_scope:** `registry.ts`, `player.test.ts` (list), `docs/FORM-GUIDE-PRODUCTION.md` (Log and §1).
- **reserved_paths:** R\*.
- **acceptance:**
  - A1: only DoD-passing ids are on; any left out are named with the reason.
  - A2: regression green on the release-candidate commit.
  - A3: DC2 recorded, with a median ≥30 fps (doc:114). Otherwise a fallback card is opened and all 15 are re-checked and re-rendered.
- **design_reference, connectivity, verification:** defaults.
- **check_in:** none.
- **risk_and_recovery:** any change after the release candidate reruns A2.
- **return:** T\*.

### 10.6 Owner device checks (medium priority)

1. **DC0** after V1-09. Install the APK, open the Dumbbell Lateral Raise in Silent Black, tap "How to do it", long-press the demo, turn Stress on, use compare mode, play 12 s, and read the median and p95. This also closes the still-open FG-4 A6.
2. **DC1** after V1-14: the same steps on the leg press.
3. **DC2** on the release-candidate APK: all switched-on guides, both themes, readable in real light, plus compare-mode fps on the leg press.
4. **Approve the turnaround sheet**: front and side after V1-06, then the back after V1-22's check-in.
5. **Look at each new machine's stills** before it merges (doc:222).
6. **When convenient:** gym-check the settings flagged `unverified_on_machine`.
7. **Quick answers, not blocking:**
   - single-arm or two-arm pushdown?
   - curl both arms together or alternating, and does the palm turn?
   - V-handle row?
   - 45° or horizontal leg press?
   - which chest, incline and shoulder press machines, and is there a seated calf machine?
   - is the rear delt fly done on a reverse pec deck?
8. Publishing the release stays with the owner.

**Cost (estimate, not measured).** Doc:189 rates give 14 × 90k + 10 machines × 250k + back 0.8M ≈ 4.6M tokens. The foundation cards add more; the designs guessed 7-10M in total. The supervisor posts the estimate before starting, and the owner can stop between waves (doc:187).

**Unverified:**
- PR #66 review r2.
- Whether the PNGs match today's FG-1.
- The judges' (c) numbers on the real rig (V1-04 A0 checks this).
- Whether the lateral raise passes `framing` and `contrast`.
- The horizontal-abduction mapping in the back view.
- Solve time on the phone.
- Machine models at the owner's gym.
- The screenshot-gate line numbers come from the Understand read of 9a37b56. They were not re-read, but that file has not changed since.

## Log

- 2026-09-27: document written; no measurements yet. Frame-rate results and per-batch token use are appended here.
