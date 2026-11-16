# Load-aware targets

Coaching logic that suggests only loads the user can pick up, re-solves the reps for the rung they will use, and adapts to what they actually lift. Owner's ask, 2026-09-27: "we don't suggest blindly; we suggest what's available and true for the user", covering the four goals. Code facts: `main` 40e635e. Builds on Plate Sense (`docs/ESCOBAR-ARCHITECTURE.md` §25, `src/brain/units.ts`) and replaces nothing. Design by the supervisor from three code maps, one architect draft and one adversarial critique (2026-09-27); decisions D-A2 and D-A3 in `docs/COACHING-DECISIONS.md`.

## 1. Problem and principle

Today the progression computes an ideal step (`loadStep` 1/2/2.5 kg by load band, capped at 10 % of the raw kg, `src/brain/progression.ts:48-52,328-330`) and only then snaps it, always one rung up for an increase (`units.ts:121`). With a user ladder 25/30/32.5/35 kg, "25 kg × 12 twice" becomes "30 kg · 6–12 reps": a 20 % jump, no in-app warning, reps never recomputed (only a text flag at `progression.ts:164` and an Escobar hint at `read.ts:227`). In a session, typing 32 kg instead of the plan changes nothing for sets 2–3 (`Train.tsx:690,705`), and next time 32 kg silently becomes the base (`history.ts:32-34`). Audit findings PROGRESSION-F15, F20, F21, F22, F25, COACHRULES-F5 and DATA-F7 describe the pieces.

**Principle: suggest only what the user can load, and adapt to what they actually use.** A target is a (load, reps) pair chosen from the gym's *load menu*; the reps are re-solved for that rung at the same estimated strength and the same effort. The second axis is the **goal** (`src/data/goals.ts`): it sets the rep window a rung may push into, the effort used in the re-solve, and the lever when the jump is too big.

Research anchors: ACSM 2009: raise the load 2–10 % (less for small muscles) once the rep goal is beaten by 1–2 reps in two sessions ([abstract](https://pubmed.ncbi.nlm.nih.gov/19204579/)). NSCA Essentials ch. 17, the 2-for-2 rule: add load when the last set beats the goal by 2 reps in two workouts; steps of 2.5–10 %, or in absolute terms 1–2 kg (2–5 lb) upper body and 2–4 kg (5–10 lb) lower body for less-trained lifters, 2–4+ kg and 4–7 kg for trained ones. Hypertrophy is similar across loads from about 30 % 1RM up, while heavy loads are needed for 1RM strength ([Schoenfeld 2017](https://journals.lww.com/nsca-jscr/fulltext/2017/12000/strength_and_hypertrophy_adaptations_between_low_.31.aspx), [Schoenfeld 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC7927075/)). Adding reps at a fixed load grows muscle as well as adding load ([Plotkin 2022](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9528903/)). Training to failure gives no hypertrophy advantage over stopping short ([Refalo 2023](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9935748/)); closer proximity to failure has a small effect on size and a negligible one on strength ([Robinson 2024](https://link.springer.com/article/10.1007/s40279-024-02069-2)). RIR-based prescription pairs a rep target with a reps-in-reserve target, and beginners judge RIR less accurately ([Helms 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/)). Bands build strength as well as weights ([Lopes 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6383082/)). Micro-loading has no controlled trial we could verify; it follows from the ACSM small-muscle rule (2 % of 20 kg is 0.4 kg). The in-session −5 % autoregulation step is the app's own rule (`COACHING-PLAN.md:620`), not a study.

## 2. The load menu

One function, `loadMenu(exerciseId, gymId, units, exercise, loggedKg)` in `src/brain/units.ts`, walks the precedence itself and returns `{ profile, rungsKg, unit, confidence: 'known' | 'learned' | 'assumed', source }`. `resolveProfile` (`units.ts:44-57`) and its tests stay untouched; Train and `read.ts` take the profile from the menu result.

Precedence:
1. Exercise profile at this gym with source `user`, `suspect_fix`, `escobar_scan` or `escobar_chat` → `known`.
2. Group profile at this gym with a non-default source → `known`.
3. Built-in default per equipment kind (`units.ts:17-37`), **united with the loads logged for this exercise at this gym** → `learned` when at least two such rungs exist, else `assumed`. A logged load counts as a rung only when it was logged in at least two sessions at this gym, is not flagged (`implausible_load`, `unit_suspect`, `models.ts:99`) and is in the profile's unit. Sessions without a `gymId` (before Plate Sense, `models.ts:176`) count only for the default gym.
4. Exercise profile at another gym (today ranked second, `units.ts:49-54`, DATA-F7) → used only for the unit, never for the rungs.

Rungs come from `loadableValues` (`units.ts:83-103`) of the chosen profile plus the learned loads. Menus are per gym; the strength estimate is not.

**Unknown menu (`assumed`).** The step is still snapped. When the snapped jump breaks the goal's cap (§3) the Train card asks once: "Which weight comes after 25 kg here?" with chips from the default ladder plus "Other". The answer is saved through `saveProfile` with `source: 'user'`, the first in-app profile writer (today only Escobar's `propose_equipment_profile` writes profiles, `apply.ts:196-202`; Settings › Gyms has no inputs). How the answer is stored: for a stack (step profile) `step = answer − current`; for a ladder, start from the resolved profile's ladder (or the default), drop the rungs strictly between `topKg` and the answer, add the answer, keep the rest. Never save a two-rung ladder: `loadableNear` clamps to a ladder's ends (`units.ts:121-122`) and a `[25, 30]` ladder would cap every future increase at 30 and every warm-up at 25. A dismissed chip is held for the run in a per-run signal (like `checkInDismissed`, `Train.tsx:76`) and may reappear at the next increase; a stored `askedAt` needs the owner's approval (§6). Escobar keeps scan and chat as the rich path; `get_equipment` returns the menu confidence so the coach asks instead of assuming.

## 3. The target rule

Inputs: `topKg`, the anchor set's reps `R` and effort (`rirObs` from `RIR_BY_EFFORT`, `e1rm.ts:8`; RIR 2 when unrated), the goal's range `[lo, hi]` by role, the goal's `[rirLo, rirHi]`, the menu. Anchor set: the median of the working sets at `topKg`, not the single best set (PROGRESSION-F3 partly: the load anchor stays `topKg`; the fatigue model stays deferred).

1. **No e1RM above 10 reps.** `effectiveOneRm` returns null above 10 reps (`e1rm.ts:11-17`) and the plan forbids targets from such sets (`COACHING-PLAN.md:610`), yet increases fire at the top of windows that go to 12, 15 or 20. So the re-solve uses the ratio form, where the estimate cancels and nothing is shown as a max:
   `r*(L, rir) = 30 × (topKg / L) × (1 + (R + rirObs) / 30) − 30 − rir`.
   For R ≤ 10 this equals the Epley re-solve `30 × (E / L − 1) − rir`. Above 10 reps the formula is rough (±15–20 %, Appendix D): show "about", widen the window by ±1 rep, and clamp it to `[lo, hi]`. This is the one sanctioned use of >10-rep sets, an exception to `PLAN:610` that needs the owner's sign-off (§6).
2. **Ideal step** as today → `rawKg` (`loadStep`, 10 % cap on the raw kg).
3. **Candidate rungs.** `up = loadableNear(topKg + 0.02, menu, 'up')`; if `up === topKg` there is nothing above on the menu: go to the lever list (step 6), never "earn" a rung that does not exist (PROGRESSION-F22; the `loadableNear` top-clamp at `units.ts:121`). `down = loadableNear(rawKg, menu, 'down')`.
4. **One effort convention.** Acceptance and earn are checked at `rirCheck = max(1, rirLo)` (lean 1, growth 1 not 0, strength_muscle 1, strength 1): a rung is accepted only if the goal's floor reps are reachable one rep short of failure, so the first session on a rung is never every set to failure (growth's `failureShareCap` 0.5 would fire against the coach's own target). The shown window uses `rirMid` (2 / 1 / 2 / 2): `[max(lo, floor(r*(L, rirMid))), min(hi, ceil(r*(L, rirMid)))]`. Effort words are the app's own ("close to max", "at Max effort").
5. **Accept the up rung** when both hold: `jump = (up − topKg) / topKg ≤ cap(goal)` (strength 10 %, strength_muscle 12.5 %, lean 15 %, growth 20 %: ACSM's 2–10 % is for load-only progression; here the rep window absorbs the rest, so the cap widens with the window) and `floor(r*(up, rirCheck)) ≥ max(lo, goal === 'strength' ? 3 : lo)`.
6. **Otherwise "earn the rung"**: keep `topKg`, target reps `earn = ceil(30 × (up × (1 + (floor + rirCheck) / 30) / topKg − 1) − rirObs)` with `floor` = `lo`, or 3 for strength, the reps at which the next rung lands on that floor at the same effort (D-LT2). Allowed up to `hi + 3` (lean, growth), `hi + 2` (strength_muscle), `hi + 1` (strength). Above that, or when no rung exists above, offer a **lever** in the goal's order (§5b): add-on plates only when `menu.addOns` is non-empty (else ask once "Do you have small add-on plates here?"), one extra set (strength: within `mainLiftWeeklySets` 3–10), pause or tempo reps, a harder variation via SubstituteSheet, or, for strength on a coarse rack, switching the lift to a barbell or machine.
7. **Step down** (two sessions under the range at max, as today) is sized from performance, not one small rung (PROGRESSION-F7): `L = E / (1 + (lo + rirMid) / 30)` snapped down on the menu, at least 5 % below `topKg`, never below the load planned before the failed increase. The 5 % floor applies only when a menu exists; with no menu the existing `half(topKg − loadStep)` stays. Reps are re-solved for the new rung.
8. **Wording.** Moved to a rung: "No smaller step here: use {rung} for {reps}" (name the raw step only when it is a real rung on the default ladder). Rung equals the raw step: "{rung} for {reps}". Earn: "Keep {load} and work up to {n} reps; then {rung} is ready." Lever: "{rung} is too big a jump for now (about {r} reps). Keep {load} and add a set, or {lever}."

Audit: F21 resolved (the cap is checked after the snap, step 5); F15 resolved (menu confidence plus the ask, §2); F22 resolved (step 3); F20 kept as BUG-11 (holds keep logged loads, ties go heavier); F3 partly and F7 as in the anchor and step 7; COACHRULES-F5 in §4; F25 (half() rounds nearest) unchanged.

Worked numbers (`r*` at `rirMid`; check at `rirCheck`):

| Case | Anchor | Rung | r* (check) | Verdict |
|---|---|---|---|---|
| DB 25 kg × 12 ideal, lean main 6–12, menu 25/30/32.5/35 | 25 × 12, RIR 2 | 30 (+20 %) | 4.7 (5.7) | Cap 15 % and 5 < 6 → earn = ceil(30 × (30 × 1.2333 / 25 − 1) − 2) = 13: "No smaller step here. Keep 25 kg and work up to 13 reps; then 30 kg for 6 is ready." |
| Same, growth main 6–15 at 25 × 15 | 25 × 15, RIR 1 | 30 (+20 %) | 8.2 (8.2) | Jump = cap, 8 ≥ 6 → accept: "No smaller step here: use 30 kg for about 8, close to max." (R > 10: "about", ±1) |
| Barbell 60 kg × 8 ideal, strength_muscle 4–8, 1.25 kg plates | 60 × 8, RIR 2 | 62.5 (+4.2 %) | 6.4 (7.4) | "62.5 kg for 6 to 7." Without 1.25s: 65 (+8.3 %) → 4.9 (5.9): "65 kg for 4 to 5." |
| Stack 40 kg × 15 ideal, lean accessory 8–15, step 5 | 40 × 15, RIR 2 | 45 (+12.5 %) | 9.8 (10.8) | "45 kg for about 9 to 10." |
| Kettlebell 16 kg × 12 ideal, lean main, 16/20/24 | 16 × 12, RIR 2 | 20 (+25 %) | 3.2 (4.2) | Over cap; earn = ceil(30 × (20 × 1.2333 / 16 − 1) − 2) = 15 = hi + 3 → earn: "No smaller step here. Keep 16 kg and work up to 15 reps; then 20 kg for 6 is ready." With a 20.5 kg next bell, earn = 16 > 15 → lever: "20.5 kg is too big a jump for now (about 2 reps). Keep 16 kg and add a set, or try a harder variation." (D-LT2) |
| DB 50 lb × 12 ideal, lean main, 5 lb steps | 22.68 kg × 12, RIR 2 | 24.95 kg = 55 lb (+10 %) | 8.0 (9.0) | "55 lb for about 8." (anchor over 10 reps, step 1; D-LT2). All maths in kg, shown via `kgToDisplay` (0.1 lb). |
| DB 30 kg × 5 ideal, strength main 1–5, 5 kg jumps | 30 × 5, RIR 2 | 35 (+16.7 %) | −0.3 (0.7) | Over cap and under 3; earn toward the 3-rep floor = ceil(30 × (35 × 1.1333 / 30 − 1) − 2) = 8 > hi + 1 = 6 → lever (add-ons are already rungs on the menu; D-LT2): "35 kg is too big a jump. Keep 30 kg and add a set, or move this lift to the barbell." |
| Increase at the top of the ladder (35 × 12, menu ends at 35) | 35 × 12 | none | — | Lever, never "earn 35": "Nothing heavier here: add a set, or a harder variation." |

## 4. Live adaptation

Targets today read only finished sessions (`Train.tsx:520`). New pure function `liveRetarget(sets, target, goal, role, menu)` in `src/brain/retarget.ts` runs after each committed set and **owns the placeholders for sets 2..n**; the autoregulation line (`src/brain/coach/live.ts`) is derived from its result, so there is one source of numbers. Seam: the `target` lookups at `Train.tsx:690` and `:705`.

- **Different load on set 1** (32 kg against a 27.5 plan): sets 2..n get load = the load used and reps = `floor(r*(32, rirMid))` from set 1's own reps and effort, clamped to `hi` and not raised to `lo` (5 at Max → about 3, so 32 × 3; D-LT3). Below `lo` the line says: "32 kg is above today's plan: about 3 clean reps. Back to 27.5 for 8, or stay at 32 for 3." The "back" load is always the planned rung. Never "add load" once `set1.kg > target.kg`: the easy branch of `autoregulationSuggestion` (`live.ts:50-60`) is skipped and replaced by "Keep 32 kg for the rest".
- **Different reps at the target load**: sets 2..n target `min(hi, repsDone)` when ideal, `repsDone − 1` when max, `min(hi, repsDone + 1)` when easy. When set 1 is easy at the target reps, `liveRetarget` wins over the "Try X" load line: reps first, load next session.
- **Autoregulation steps from the load lifted** (COACHRULES-F5): `step = firstSet.kg × 0.025` (`live.ts:29`), snapped on the menu, never the same rung (`live.ts:42-44`); when set 1 was above plan, the step-down base is the planned rung.
- **Post-session verdict** (`src/brain/coach/post.ts`): one line, "Planned 27.5 × 8, did 32 × 5: estimated strength up about 2 %" or "…below plan: the next target holds". Records unchanged (`prs.ts`).
- **Next session.** Finished sessions hold `Session.exercises[]` (`LoggedExercise`, `models.ts:108-114`), which has no planned target, so today `history.ts:32-34` makes 32 kg the base. Two options, the owner picks (§6): (a) approved: `LoggedExercise.target?: { kg, reps }` is stored at commit and the next target is restated on the rung nearest the planned line whose re-solved reps fall inside `[lo, hi]` (27.5 → r* 8.7 → "27.5 kg for 8 to 9", not "32 × 6"); a load the user chose twice in a row becomes the base only when its re-solved reps fall inside the goal's window, otherwise the app keeps steering to the planned line and says so; (b) not approved: the double-progression rule works on the session's strength estimate alone, as today. A new suggestion mode `earn` with `repWindow` lets a target above `range[1]` survive the clamp at `progression.ts:290,343`.

## 5. Other scenarios

- **Gym switch** (`units.activeGymId`, session `gymId`): menu rebuilt per gym, the strength estimate carries, the rung is re-solved: "At Gym B the next dumbbell is 30 kg: 30 for 6 to 7."
- **Machine with an unknown stack** (`assumed`, step 5): a jump over the cap triggers the one-time ask "What is the next pin after 40?" with chips 42.5 / 45 / Other; the answer becomes `step`.
- **lb users**: menu in lb, all maths in kg, the cap on kg; display via `kgToDisplay` (0.1 lb). Logged lb loads count only on lb profiles (BUG-11).
- **Bodyweight and assisted**: out of scope. Per the owner's F13 decision (`docs/F13-BODYWEIGHT-LOAD.md:25,31`) their targets stay reps-only (`progression.ts:279-287`); added-load moves (dip belt) use the plate menu like a barbell.
- **Readiness amber and red, deload**: amber blocks the up rung ("hold today"); red = `reduce`: same rung, one fewer set (`readiness.ts:230`, `progression.ts:293-296`). Deload ×0.9 (`src/data/deload.ts:4`): `half(25 × 0.9) = 22.5`, snapped down on the menu; when the down snap returns the same rung (ladder 25/30/…: nothing under 25), keep the load and cut reps or sets instead: "Lighter week: 25 kg, 2 sets, easy." Never re-snap up.
- **Substitution** (`src/brain/substitute.ts`): carry-over estimate = the replaced lift's strength estimate × a pattern ratio (a small table shipped in the app, sourced, built in LT-5; e.g. dumbbell bench ≈ 0.4 × barbell bench per hand), placed on the substitute's menu, confidence low: "Start around 22.5 kg for 8." Without a ratio, `startingLoadKg` as today.
- **Short on time**: no time input exists for a live session (`sessionMinutes` only in `plan.ts:29,144`). Not covered; if one is added, drop sets before load.
- **Muscle still recovering** (`recoveryPct < 60`): blocks the up rung as today; wording "Chest is at 45 %: 25 kg for 12, no jump today."

## 5b. Per goal

| Goal (main / accessory reps) | Rep window a rung may push into | Effort: check / shown | Cap | Lever order when too big | Poor weight variety | Example |
|---|---|---|---|---|---|---|
| lean 6–12 / 8–15, RIR 1–3 | down to `lo` | RIR 1 / 2 | 15 % | earn to `hi + 3` → extra set → harder variation | 5 kg dumbbell jumps: double progression to 15, then a variation; bands: reps and tempo | "No smaller step here. Keep 25 kg and work up to 13 reps; then 30 kg for 6 is ready." |
| growth 6–15 / 8–20, RIR 0–2 | down to `lo` | RIR 1 / 1 | 20 % | take the rung close to max → earn to `hi + 3` → extra set | one stack or bands: rep progression to 20, near failure but not to it (Refalo 2023) | "No smaller step here: use 30 kg for about 8, close to max." |
| strength_muscle 4–8 / 8–12, RIR 1–3 | down to `lo` | RIR 1 / 2 | 12.5 % | add-ons (1.25) → earn to `hi + 2` → extra set → pause reps | dumbbells only: cluster sets and pauses; bodyweight: a weighted variation | "62.5 kg for 6 to 7." |
| strength 1–5 / 6–12, RIR 1–3 | down to `lo`, never under 3 on set 1 | RIR 1 / 2 | 10 % | earn to `hi + 1` first (§3 step 6, D-LT2) → add-ons (ask once if unknown) → extra set (3–10 main sets a week) → pause or tempo → move the lift to a barbell or machine | a missing 2.5 kg step is the normal case; bands or bodyweight: recommend a loadable main lift | "35 kg is too big a jump. Keep 30 kg and add a set, or move this lift to the barbell." |

## 6. Data and code changes

- `src/brain/units.ts`: `loadMenu(...)` as in §2; `jumpPct(fromKg, toKg)`. `loadableNear`, `resolveProfile` unchanged.
- New `src/brain/retarget.ts` (pure): `repsAt(topKg, R, rirObs, loadKg, rir): number` (ratio form), `repsToEarn(topKg, R, rirObs, nextKg, lo, rirCheck): number`, `chooseRung(input: { topKg, R, rirObs, rawKg, menu, goal, role, priorPlannedKg }): { kg, repWindow: [number, number], kind: 'rung' | 'earn' | 'lever' | 'down', text }`, `liveRetarget(sets, target, goal, role, menu)`, `jumpCap(goal)`.
- `src/brain/progression.ts`: `snapToEquipment` calls `chooseRung` for `increase` and the step-down; `Suggestion` gains `repWindow?: [number, number]`, `menuConfidence?`, mode `earn`. Hold-type modes keep BUG-11 behaviour.
- `src/brain/coach/live.ts`: step from `firstSet.kg`; suppress "add load" above the plan; the line derives from `liveRetarget`.
- `src/brain/coach/post.ts`: the plan-vs-done line.
- `src/slices/workout/Train.tsx`: placeholders read `liveRetarget` (`:690`, `:705`); the one-time ask chip → `saveProfile(..., source: 'user')` with the merge rule of §2.
- `src/escobar/tools/read.ts`: `get_next_target` adds `repWindow`, `menuConfidence`; `get_equipment` adds `confidence`.
- **Saved data.** The mandatory path needs no new fields (`EquipmentProfile.ladder` / `step` with `source: 'user'` exist; `normalizeProfile` accepts them). **Owner decisions (2026-09-27, D-A4):** (a) `LoggedExercise.target?: { kg: number; reps: number }`, the target shown at commit, so the verdict and the next-session restatement never recompute it: **approved** (the one new saved field; `src/core/models.ts` change in LT-3, with a normalize rule that drops a malformed value); (b) `EquipmentProfile.askedAt?: string`: **not added**, the per-run dismissal signal is enough; (c) the `PLAN:610` exception for the ratio re-solve from >10-rep sets: **approved** (no max is ever shown). Migration: none for (a) beyond the normalize rule; older sessions have no target and use the double-progression rule.

## 7. Tests (fail before, pass after)

`tests/retarget.test.ts`: `repsAt(25, 12, 2, 30, 2) = 4.67`; `repsToEarn(25, 12, 2, 30, 6, 1) = 13`; `chooseRung` on the eight §3 rows; jump over the cap → `earn`; earn above the goal's allowance → `lever`; top of the ladder → `lever` (never the same rung); **empty menu** → raw kg with reps unchanged; **one rung** → hold at that rung, no increase; **user load below the menu** (3 kg logged twice on a ladder from 5) → rung 3 exists (learned); a load logged once, or flagged, is not a rung; **lb rounding** 50 → 55 lb gives 24.948 kg, shown "55 lb"; growth acceptance at RIR 1, never RIR 0; strength floor of 3 reps.
`tests/progression.test.ts`: the key scenario returns 25 kg × 13 (lean) and 30 kg × 8 (growth); step-down 120 kg on a 5 kg stack → 110 (115 is only 4.2 %) and 60 kg with 1.25 kg plates → 55 (57.5 is 4.2 %); the pinned no-equipment reduce (60 × 4 max twice → 57.5, `tests/progression.test.ts:34-40`) unchanged; all existing progression tests untouched.
`tests/live.test.ts`: set 1 at 32 kg suppresses "Try 34"; the autoreg step comes from 32, the step-down base from the planned rung; sets 2–3 placeholders 32 × 3; easy set 1 at target reps → reps +1 clamped to `hi`, no load line.
`tests/plate-sense.test.ts` (add-only): `loadMenu` precedence rows; logged loads at gym A never enter gym B's menu; a stack ask saves `step`, a ladder ask merges and never leaves a two-rung ladder.
Gate probe: Train shows the ask chip with an assumed menu and an over-cap jump; dismissing it hides it for the run.

## 8. Risks

- The ratio re-solve above 10 reps is rough (±15–20 %): "about", ±1 rep, window clamped to `[lo, hi]`.
- Repeated "earn" holds feel like stalling: after two earn sessions offer the rung close to max or a lever (Plotkin 2022 supports rep progression).
- A wrong menu from a bad ask answer: a `user` profile resets in Settings › Gyms; an Escobar scan overrides it; the merge rule keeps the default rungs around the answer.
- Users who vote heavier twice may train outside their goal window: the goal window wins and the verdict says so.
- Strength users pushed under 3 reps by a coarse rack: hard floor of 3 on set 1, add-ons first, then a better-equipped lift.
- Cross-gym leakage: menus are per gym; the strength estimate is not.
- Beginners rate RIR poorly (Helms 2016): the re-solve leans on the reps done and the load, and treats an unrated set as RIR 2.

## 9. Build plan (cards LT-1 to LT-5, in order; after BUG-14/15/16/18 land, since they touch the same progression path)

1. **LT-1 Load menu** (`units.ts`, `plate-sense.test.ts` add-only): `loadMenu` with precedence and confidence; logged loads at the same gym become rungs under the two-session rule. Acceptance: precedence tests; no change to existing snaps.
2. **LT-2 Rung choice and rep re-solve** (`retarget.ts`, `progression.ts`, `progression.test.ts`): `chooseRung`, cap per goal, earn and lever rules, sized step-down, wording, mode `earn`. Acceptance: the §3 rows; key scenario = 25 × 13 lean / 30 × 8 growth; every existing progression test passes.
3. **LT-3 Live retarget and autoregulation** (`retarget.ts`, `live.ts`, `Train.tsx`, `live.test.ts`): placeholders for sets 2..n, no "add load" above plan, step from the lifted load; the post-session verdict line (`post.ts`). Acceptance: the §4 trace; screenshot gate block LT-3. Includes the approved `LoggedExercise.target` field (D-A4) for the next-session part.
4. **LT-4 Ask once and Escobar** (`Train.tsx`, `src/slices/workout/units.ts`, `read.ts`, `tests/escobar`): the ask chip on assumed menus with the merge rule, `repWindow` / `confidence` in the tool JSON. Acceptance: the chip saves a `user` profile; tool schema tests.
5. **LT-5 Substitution estimate** (`substitute.ts`): the carry-over ratio table with sources. Acceptance: ratio table reviewed against its sources.
