# Live QA round 13: b6 charts, I12 + O4 (PR #23)

Checked PR #23 at aabb2b0 (with main 4c9cf25 merged in) with three reviewers: code and privacy, UI measurements, and tests. A second agent tried to disprove every finding, and all 7 held up. A6 isn't built yet and isn't covered here.

**What passes:**
- vitest (1,155) and the build.
- Nothing was deleted from the gate or the tests.
- When the coach asks for fresh numbers with body sharing off, bodyweight lifts count as 0 kg, so no body-weight number is created.
- The I12 sparkline end dot is round, bars have no `[title]`, the current week uses the accent colour, and the coach sparkline stays 56 px.

Fix the items below. Each needs a test or gate probe that fails before and passes after, with the id in the commit message.

## High

**QA13-1 · Turning body sharing off doesn't remove effort numbers the coach already saw.**
- **Cause:** show.ts zeroes body-derived numbers only when the coach asks for fresh numbers. Old coach replies are stored and sent again on every later turn, and loop.ts's `scrub()` doesn't know about the new `effort` field. `BODY_KEYS` has no easy/ideal/max/unrated, and `deniedFor()` doesn't cover `show:lift_trend`.
- **Effect:** a +10 kg pull-up at 80 kg body weight (`ideal: 450`) keeps reaching the model after the user switches body sharing off.
- **Fix:** in `src/escobar/loop.ts` `scrub()`, change the body check to `if (!sharing.body && (BODY_KEYS.has(k) || (k === 'effort' && Array.isArray(x)))) continue;`. The `Array.isArray` limits it to lift_trend's per-day array and leaves session_summary's `effort` count object alone. This also strips old weighted-lift effort arrays when sharing is off, which is safe.
- **Test** (tests/escobar/privacy.test.ts): replay a stored `show`/`lift_trend` tool_result containing `effort: [{…, ideal: 450}]`. It must contain `450` with `{ body: true }` and must not contain it with `{ body: false }`. This fails today.

**QA13-2 · Carries and sleds show a total of 0.**
- **Cause:** `effortUsesSets()` (EffortBars.tsx:18) picks kg × reps for a conditioning exercise whenever any set has kg. But carries and sleds (`CARRY_OR_SLED_IDS`) are logged with kg and distance or time, and no reps, so every bar is 0 with a 2 px stub.
- **Fix:** `if (mode === 'conditioning') return !history.some(h => h.sets.some(s => (s.kg ?? 0) > 0 && (s.reps ?? 0) > 0));`.
- **Test:** 3 Farmer's Carry sessions with kg 32/36/40 and no reps. Assert that it counts sets and the totals aren't zero.

## Medium

**QA13-3 · The current-week volume bar is drawn about 26% too short.**
- **Cause:** in the fixed 72 px flex column, the value label above the bar takes its height from the bar. With the gate's own seed, a bar at `height:100%` measures 53.2 px instead of 72 px.
- **Fix:**
  - Move `<span class="volume-bar-value">` inside the bar's `<i>`.
  - `.volume-bars { padding-top: 18px }`.
  - Drop the `gap` from `.volume-bar-col`.
  - `.volume-bars i { position: relative }`.
  - `.volume-bar-value { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 2px }`.
- **Gate probe:** every bar's height in px equals its inline % of the bar area, ±1 px, including the current week.

**QA13-4 · The sparkline's lowest-value label sits 16–17 px below the lowest point.**
- **Cause:** label positions are percentages of the 96 px SVG, but they're applied inside `.sparkline-minmax` (`inset: 0`), which stretches to 113 px because the dates row is below the SVG.
- **Fix:** `.sparkline-minmax { position: absolute; top: 0; left: 0; right: 2px; pointer-events: none; }` plus an inline `height: ${height}px` on that div.
- **Gate probe:** the min and max label centres are within 3 px of the lowest and highest plotted points.

**QA13-5 · Effort bars with a total of 0 are only about 42 px tall to tap.**
- **Fix:** add `min-height: 44px` to `.effort-bar-col`.
- **Gate probe:** seed a bodyweight lift with no saved body weight (every total is 0). Every `.effort-bar-col` is at least 44 × 44 px.

**QA13-6 · "Not rated", and "Easy" in Paper, are too faint to see against the card.**
- **Measured (need 3:1):**
  - unrated (`--surface-3`): 1.12:1 in Silent Black, 1.18:1 in Paper;
  - easy (`--text-3`): 3.30:1 in Silent Black, 2.60:1 in Paper.
- **Cause:** the colours come from the spec (UI-POLISH-PLAN §6b O4, "easy `--text-3`, unrated `--surface-3`"). That was the spec's mistake, not the builder's. The spec is amended: the owner picked the chart, not these tokens.
- **Fix:**
  - easy: `var(--text-2)`.
  - unrated: a hatched fill with a solid outline, so it reads as "unknown" and can't be mistaken for easy: `background: repeating-linear-gradient(45deg, var(--text-3) 0 2px, transparent 2px 5px); box-shadow: inset 0 0 0 1px var(--text-2);`.
  - Use the same on the legend swatches.
  - Don't use two similar greys for easy and unrated.
- **Gate probe:** in both themes, easy's fill and unrated's outline colour are each at least 3:1 against `--surface-1`.

**QA13-7 · The owner's Leg Press acceptance numbers are never tested.**
- UI-POLISH-PLAN O4 says the owner's Leg Press sessions give totals 2,250 / 2,050 / 2,700 / 2,385, split as in the artifact. No test checks them.
- **Test:** add a test to tests/effortBars.test.ts with the reference sessions:

  | Day | Sets (kg × reps, effort) | Split |
  |---|---|---|
  | 08-25 | 40×15 E, 50×15 E, 60×15 I | easy 1350, ideal 900 |
  | 09-03 | 40×15 E, 50×15 I, 70×10 M | easy 600, ideal 750, max 700 |
  | 09-19 | 60×15 E, 60×15 I, 60×15 M | 900 each |
  | 09-26 | 60×15 E, 55×15 I, 55×12 I | easy 900, ideal 1485 |

  Assert those exact splits and the totals.

## Re-check at 50464d2: all seven fixed

An independent check in a throwaway worktree reverted each fix's src and style change on its own. Each test fails before and passes after:

| id | fix commit | before the fix | at 50464d2 |
|---|---|---|---|
| QA13-1 | 1614d22 | the replay still contains `450` with body sharing off | pass; session_summary's `effort` count object is kept |
| QA13-2 | ce2bb6f | `effortUsesSets(conditioning)` is false for kg with no reps | pass |
| QA13-3 | 783b6c7 | bar at 100% draws 53.2 px of 72 | pass |
| QA13-4 | 65ca776 | min label 16.3 px from the lowest point (3 px allowed) | pass |
| QA13-5 | 0d66adb | 3 tap targets 44 × 42.2 px | pass |
| QA13-6 | 50464d2 | easy is 2.6:1 in Paper; unrated has no outline | pass: easy fill and unrated outline are 5.01:1 in Paper and 5.86:1 in Silent Black; solid and hatched look clearly different |
| QA13-7 | aa7f9b1 | test only | pass: exact per-day splits and totals 2,250 / 2,050 / 2,700 / 2,385 |

- **No loosening:** tests and gate +261 / −0.
- **Before merge:** the branch still needs to merge main (b55986a), and A6 comes after item 2. It merges after items 2, 3 and 4.
