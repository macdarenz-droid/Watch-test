# Live QA round 3: the low-item fixes on main (QA2-FA-5 … QA2-FE-8)

Checked on the finished build at `origin/main` (b047fd5). Each area had a reviewer and a skeptic, and the problems below were confirmed by runs. **24 of 32 are fully fixed**, including the Worker deploy fix (0927f3c). Full suites are green at head.

Fix in this order. Each fix gets a test that fails before and passes after, with the id in the commit message. Evidence (file:line at b047fd5) is in each item.

## Medium

**QA3-1 · Rest-done alerts never go off for a new Android 13+ user (from eefa356).**
- `scheduleRestDone` returns early unless `ensurePermission()` succeeds (src/native/notifications.ts:69). Without `prompt:true`, a never-asked state ('prompt') gives false, so nothing is scheduled and nothing asks.
- Nothing in the normal flow asks: onboarding, launch and Train never do. Only Settings taps and Escobar Apply do.
- **Fix:** skip scheduling only when the state is `denied`. For `prompt`, call `schedule()` and let plugin 8.3.1 ask once, as before eefa356. Keep the no-settings-screen rule from UI-02: exact alarms are still only used when granted.
- When the state is `denied`, show a one-line hint on the rest banner or Train ("Rest alerts are off — Settings → Precise rest alerts").

**QA3-2 · Old-app import merges different lifts (from 3cc159d).** The gear-word set (src/core/exercises.ts:157) takes every word of every equipment string and drops it from `movementWords`. `findExerciseWithEquipment` calls `findExercise` before checking equipment (:169).
- Results at head: 'Dumbbell Skull Crusher' merges into the EZ-bar Skull Crusher, 'Cable Hammer Curl' into the dumbbell Hammer Curl, 'Kettlebell Sumo Deadlift' into the barbell one, and 'Smith Machine Romanian Deadlift' into Romanian Deadlift.
- Multi-word equipment ('Leg Press', 'Dip Station', 'Jump Rope', 'Medicine Ball', 'Resistance Band') also removes 'leg', 'press', 'dip', 'jump', 'rope', 'ball' and 'band' as movement words. As a result, 'Leg Press Hack Squat' now resolves to Hack Squat, which reintroduces QA-R3b-3.
- **Fix:** make the gear words a fixed list (barbell, dumbbell(s), cable, machine, ez, bar, kettlebell, smith, trap). Accept a match only when the name's gear word agrees with the library item's equipment. If it differs, create a custom exercise, as before 3cc159d. Add the four names above and 'Leg Press Hack Squat' as tests.

**QA3-3 · A trap-bar farmer's carry target is capped at the dumbbell rack (from 576d3fd).**
- The equipment 'Dumbbells / Trap Bar' reads as Dumbbells, whose ladder tops out at 60 kg / 150 lb. The new snap (src/brain/progression.ts:118) turns 100 kg × 40 m into '60 kg · 45 m'.
- **Fix:** for conditioning targets, never snap across the ladder's range. Above its top, keep the logged load.
- Also snap *down* when a lighter-week or Escobar load factor below 1 applies. `SNAP_DIRECTION` (:88) doesn't list distance/duration, so a lighter-week carry snaps back up to last time's load. This is QA3-11.

## Low

- **QA3-4 · Retyping an earlier set restarts rest and moves its time** (src/slices/workout/session.ts:179). This happens when the person clears reps, taps another box, then retypes: the empty-blur branch drops the commit, so QA-R2b-1 comes back through a blur.
  - **Fix:** drop the commit on an empty blur only when this set is the most recently committed one; a mistaken commit is the last one. For earlier sets, keep `at` and `restSec`.
- **QA3-5 · QA2-FC-5 remainder.** `get_overview` leastRecovered (src/escobar/tools/read.ts:114) and show `recovery_map` (src/escobar/tools/show.ts:91) still send pct 60 and hoursLeft 0 for a muscle held back by soreness, with no sore flag.
  - **Fix:** add `soreToday` there, send `hoursLeft: null` when sore-only, and explain `soreToday` in the get_recovery tool description (schema.ts:132).
- **QA3-6 · QA2-FD-2/FD-7 remainder.** "Save for future" still saves Escobar's one-day set-count change: `templateFromSession` takes the count from the entry (session.ts:354).
  - **Fix:** for entries whose count came from today's override, save the split's count.
- **QA3-7 · A skipped exercise is restored at the wrong position** (session.ts:356 uses the old index in a shorter list).
  - **Fix:** insert it after its nearest preceding split neighbour that is present.
- **QA3-8 · Replacing Escobar's one-day swap adds an exercise.** Scenario: bench is swapped to DB bench, then substituted to incline, and the save gives 4 exercises.
  - **Fix:** a substitution of a planned-swap entry replaces the original split exercise; don't restore it.
- **QA3-9 · QA2-FD-4 remainder.** With health sharing off, the replay scrub (src/escobar/loop.ts:119-121) doesn't drop a personal `hrMax`, and live `explain_method` does (methods.ts:200).
  - **Fix:** mirror that rule: drop `hrMax` and 'personal hrMax' facts unless the source is age.
- **QA3-10 · QA2-FE-3 remainder.** Escobar's `session_summary` counts warm-ups: `sets: ex.sets.length` (show.ts:122), and the effort tally (:127) does too.
  - **Fix:** count working sets only. Also add a test for `getSessions`' working-set count (read.ts:158), which no test covers.
- **QA3-11:** see QA3-3, the lighter-week and Escobar-cut direction.
- **QA3-12 · A timed carry or sled logged with reps gets a rep goal** (progression.ts:148 decides by "reps logged").
  - **Fix:** decide by the exercise's mode (conditioning carry or sled), not by which fields were filled.

Not an action: QA2-FE-1's root, which is reading a finished past day's totals, stays an owner decision as recorded in REMEDIATION-PROGRESS.md:592. The narrower fix (totalsAsOf) holds.
