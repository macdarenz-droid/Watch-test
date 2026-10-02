# Logic audit · Progression, targets, loads and units (`progression`)

Rules judged: 55 · verdicts: {"correct": 32, "questionable": 13, "wrong": 7, "unverifiable": 3}. Part of `qa/LOGIC-AUDIT.md` (QA-L1, 2026-09-27).

## Findings

### PROGRESSION-F1 · Lighter-week sessions become the base for every later target: loads compound down inside the week and do not come back after
- Severity **high** · status **confirmed** · where `src/brain/progression.ts:161-162,218,224,241`
- What the code does: The lighter-week branch cuts the MOST RECENT session (last.topKg × 0.9, last set count × 0.6). Inside the week, that session is already a lighter one, so each session cuts again. After endDay, the normal rules start from the last (lighter) session's topKg.
- What is correct: The lighter week is ×0.9 load and ×0.6 sets of the pre-week level for all 7 days (COACHING-DECISIONS.md:227-229; PLAN:657 says loads as a share of the 'recent top'). Afterwards, targets resume from the pre-week level (BELL23: a deload lets intensity go up afterwards).
- Evidence: Probe C2-chain uses the app's default barbell profile. Pre-week 72.5 kg × 8 × 3 gives lighter-week targets '65x2', '57.5x1', '50x1'. The day after the week ends: 'hold 50 kg · 7 reps, Keep the load and add a rep'. S-compound (no profile): 65.5 × 2, then 59 × 1. S-postdeload: pre-week 72.5, after 2 lighter sessions 'hold 65'. The existing deload tests (tests/progression.test.ts:90-105) use only pre-week history.
- User impact: One lighter week can leave a lifter about 30% below their pre-week loads, and they then have to earn it back rep by rep over several weeks.
- Source: S1, S2, R10 (load/sets), M1 (targets)

### PROGRESSION-F2 · The plateau detector calls normally progressing lifts 'plateaued'
- Severity **high** · status **confirmed** · where `src/brain/trend.ts:131,177-201; used at src/brain/progression.ts:270,291, src/brain/deload.ts:243-249, src/brain/coach/rules.ts:196,213`
- What the code does: 'Flat' means the top-kg slope is under 1% per WEEK. There is no minimum time span, and it only needs 7 of the last 8 sessions. Flat top load with flat volume counts as 'plateaued'.
- What is correct: The project's own plateau rule BR-04 (COACHING-DECISIONS.md:410): under 1.5% TOTAL e1RM change over 8 weeks, with a minimum span. It is built as flatOver() (src/brain/coach/weeklyReview.ts:74-79) but used only by the plateau-lever rule (rules.ts:381-387). PLAN:643 puts intermediates at 0.5-1% per month.
- Evidence: Probe C2-br04: 8 weekly sessions, 100 → 105 kg, e1RM 133.3 → 143.5 (+7.6%). flatOver = false (BR-04: not flat), but plateauStatus = 'plateaued' (medium). The target becomes mode 'plateau': 'This lift has not moved for a while. Try a different rep range or one lighter week'. R-intermediate: two such lifts make deloadTrigger return suggest=true.
- User impact: Lifters who progress at a normal intermediate pace are told the lift has stalled and are offered a lighter week they do not need, which then triggers F1.
- Source: R29

### PROGRESSION-F3 · One heavy top set sets the load for every target set
- Severity **high** · status **confirmed** · where `src/brain/history.ts:32-34; src/brain/progression.ts:241-242,258-261,295-296`
- What the code does: topKg is the heaviest working set, and topReps is the reps at that load. Every target set is built from that one set.
- What is correct: Targets come from the straight working sets (the load most sets used) or set by set (ACSM09, NSCA-2for2 work on the working load).
- Evidence: Probe C2-single, strength goal: 100 × 1 at max plus 3 × 80 × 5 gives 'hold 100 kg · 2 reps' for all 4 sets. S-single, lean goal: 100 × 1 plus 3 × 80 × 8 gives every set 100 × 6. Two sessions with a max single give 'reduce 97.5: two sessions in a row under the rep range'.
- User impact: A lifter who did one heavy single, or a heavier first set, is told to do every set at that load for more reps, which they cannot do safely.
- Source: S5

### PROGRESSION-F4 · The lighter week's own sessions count as stall evidence, so a new lighter week is offered the day after one ends
- Severity **medium** · status **confirmed** · where `src/brain/coach/rules.ts:620-623; src/brain/deload.ts:237-249; src/brain/trend.ts:177-201`
- What the code does: The offer is blocked only while endDay >= today. From the next day, trigger (a) runs on history that includes the lighter sessions, whose lower top load reads as a stall.
- What is correct: Lighter-week sessions are left out of the stall evidence, and a new offer waits several weeks (BELL23, ROGERSON24: a deload about every 4-6 weeks). No source fixes the exact wait.
- Evidence: R-postdeload: on endDay+1, deloadTrigger returns suggest=true ('Two or more main lifts have plateaued...'). Counterfactual C2-postdeload: the same history with 2 normal sessions in place of the lighter ones gives 'progressing' and suggest=false. So the lighter sessions alone cause the new offer.
- User impact: Right after a lighter week, the coach can offer another one, caused only by the lighter week itself; accepting it deepens the load loss in F1.
- Source: R38 (a), R40, S23, M1 (offer)

### PROGRESSION-F5 · Lower loads after a lighter week read as 'declining', which blocks increases and has no end date
- Severity **medium** · status **confirmed** · where `src/brain/progression.ts:270-273 (runs before the clean-top rules at 274-289)`
- What the code does: 'Declining' (from the top-kg trend) returns mode 'plateau' at range[0]..range[0]+2 reps with 'stop short of max effort for a week'. It lasts as long as the trend stays down, with no time limit.
- What is correct: Decline is judged on e1RM at matched effort, without lighter-week or step-down sessions, and the easy period ends after about a week, as its own text says.
- Evidence: Probe C2-declining: 6 sessions at 100 × 8, 2 lighter sessions at 90, then two clean tops at 90 × 12. plateauStatus = 'declining'. Target: 'plateau 90 kg · 6–8 reps, Progress has slipped over recent sessions...'. There is no increase, and the rep target drops below the 12 just done.
- User impact: After a lighter week, a lifter who reaches the top of the range twice is told progress has slipped and gets fewer reps instead of more load.
- Source: R17

### PROGRESSION-F6 · Set cuts from a lighter week or red readiness never reach the Train screen's set rows
- Severity **medium** · status **confirmed** · where `src/slices/workout/session.ts:108-112 (blankSets(se.sets)); src/slices/workout/Train.tsx:690; src/slices/coach/Coach.tsx:267`
- What the code does: Session rows always use the split's planned set count. The suggestion's shorter set list only decides which target each row reuses (Train.tsx:690 uses next.sets[min(wj, len-1)]).
- What is correct: F3.3 (PLAN:196) cuts sets by 30-40%. The lighter-week card says 'Sets and load are reduced across your plan' (Coach.tsx:267).
- Evidence: Probe C2-rows: a lighter week is active and the split plans 3 sets. startSession creates 3 rows, while suggestNext gives 2 sets and 'Lighter week, day 2 of 7.'. The red-readiness 'one fewer set' (progression.ts:246-247) goes through the same path. Found by this checker; not in the researcher's list.
- User impact: During a lighter week, Train still lists every planned set, so only the load drops, not the sets the card promises.
- Source: checker 2 (new); affects R4, S6, R8, R10, R12

### PROGRESSION-F7 · The step-down is one small step, however far below the rep range the lifter is
- Severity **medium** · status **confirmed** · where `src/brain/progression.ts:258-268`
- What the code does: After two max-effort sessions below the range, the new load is topKg minus one loadStep (2.5 kg), whatever the size of the miss.
- What is correct: Size the drop from performance, for example with the plan's working-load formula load = e1RM/(1+(n+2)/30) (PLAN:610). That only works for sets of 10 reps or fewer, because PLAN:610 forbids targets from sets over 10 reps.
- Evidence: Probe C2-stepdown: 100 × 3 at max twice (range 6-12) gives 'reduce 97.5'. e1RM is 110, so the plan formula for 6 reps at ideal gives 86.8 kg. R-farabove: 60 × 20 twice gives only +2.5 kg (62.5). That is slow but safe, and e1RM cannot be used there.
- User impact: A lifter far below the range gets a load they will fail again, and needs many failed sessions to reach a workable weight.
- Source: R15 (size), M2

### PROGRESSION-F8 · 'Low-range step-down never fires on a 7.7% drop that then stays flat' does not show a wrong result
- Severity **low** · status **refuted** · where `src/brain/progression.ts:59-62,259-260`
- What the code does: Strength goal (range 1-5): 100 × 5 max, then 95 × 4 max twice, gives 'hold 95 kg · 5 reps'.
- What is correct: The claim wanted a step-down.
- Evidence: R-lowrange output: 'hold 95 kg · 5 reps'. 4 reps at max is inside the 1-5 range, so holding the load and building reps matches the rep-range logic. PLAN:774 ('down ≥ 5 % on two consecutive sessions') is ambiguous, and the code implements one valid reading of it. No wrong number is shown.
- User impact: None shown: the lifter holds a load they can already do for reps inside the range.
- Source: R15 (low-range part)

### PROGRESSION-F9 · A drop set or failure set at max blocks every increase; the growth goal's one-clean-top rule is missing; drop sets add target sets
- Severity **medium** · status **confirmed** · where `src/brain/history.ts:31,50; src/brain/progression.ts:162,274-276; src/data/goals.ts:44`
- What the code does: Any working set at max, drop sets included, sets hasMax, which rules out a clean top. The goal's rir window is not used. Increases need two clean tops for every goal. The set count includes drop sets.
- What is correct: Drop sets or a planned final failure set should not block the main load. PLAN:209: 'for growth allow increase after one clean top' (growth rir is 0-2, goals.ts:44).
- Evidence: R-dropmax: 3 × 60 × 12 ideal plus a drop set of 45 × 10 at max gives 'hold 60 kg · 12 reps, Last set was max effort' and 4 target sets at 60. Probe C2-growth: the same pattern on the growth goal also gives 'hold'. One growth clean top at 60 × 15 gives 'confirm', not 'increase'. S-drops: 2 drop sets give 5 sets, all at 60. Note: the F2 spec (REMEDIATION-PLAN.md:620, ARCHITECTURE.md:60) keeps drop sets out of records only, so keeping them in progression was specified; the blocking side effect is not discussed there. The extra set count shows up in Escobar's next-target tool (read.ts:223) but not in Train rows (see F6).
- User impact: A lifter who ends an exercise with a drop set to failure is never offered more load on their main sets.
- Source: R27, M4, R4, S6

### PROGRESSION-F10 · Red readiness is ignored for bodyweight, assisted and conditioning moves
- Severity **medium** · status **confirmed** · where `src/brain/progression.ts:231-239 (returns before the red check at 245-248)`
- What the code does: On a red day, bodyweight, assisted and conditioning moves still get '+1 rep' with every set.
- What is correct: PLAN:357 applies 'reduce → hold with minus one set' with no limit to weighted moves.
- Evidence: Probe C2-bwred on a red day: push-ups give 'reps 16 reps', 3 sets, 'Add one rep to your best set.'. Bench gives 'hold', 2 sets, 'Readiness is low today. Keep the load and drop a set.'.
- User impact: On a red-readiness day, bodyweight moves still tell the user to push for an extra rep.
- Source: R12 (red), M5 (red)

### PROGRESSION-F11 · A lighter week for bodyweight moves asks for the last best reps, labelled 'easy'
- Severity **medium** · status **confirmed** · where `src/brain/progression.ts:219-222`
- What the code does: The target is last.bestReps × 'easy', even when those reps were max effort. Only the set count is cut, and per F6 that cut does not reach Train.
- What is correct: A deload cuts reps per set and adds reps in reserve (ROGERSON24, BELL23).
- Evidence: S-bwdeload: push-ups last done at 20 reps, max effort. The lighter-week target is '20 reps · easy'.
- User impact: In a lighter week, push-ups ask for the user's max-effort rep count and call it easy, so the week is not lighter for these moves.
- Source: S14, R10 (bodyweight)

### PROGRESSION-F12 · On amber days, the reason wrongly blames muscle recovery
- Severity **medium** · status **confirmed** · where `src/brain/progression.ts:285-286; src/brain/readiness.ts:71-86`
- What the code does: ReadinessResult has no 'reason' field. todayReadiness (src/app/selectors.ts:41) is a plain readiness() result, so the fallback 'Recovery is under 60% for this muscle' is always used.
- What is correct: The amber reason names readiness. The recovery text appears only when recoveryPct < 60.
- Evidence: Probe C2-coachsheet (Train-style call): amber readiness with recovery at 95 gives 'confirm 60 kg' and 'Recovery is under 60% for this muscle, so the load holds for now.'. S-amber gives the same. The tests pass a hand-made {reason}, which hides this.
- User impact: On amber days the user is told their muscle is under 60% recovered when it is not.
- Source: R21, S3

### PROGRESSION-F13 · The Coach insight sheet ignores readiness, recovery and today's load change
- Severity **medium** · status **confirmed** · where `src/slices/coach/Coach.tsx:142 vs src/slices/workout/Train.tsx:270 and src/escobar/tools/context.ts:97-104`
- What the code does: The sheet calls suggestNext with only deload and equipment.
- What is correct: context.ts:93-94 says every suggestNext caller must agree with the Train screen.
- Evidence: Probe C2-coachsheet, same history (two clean tops at 60 × 12): the Coach sheet's inputs give 'increase 62.5 kg'. Train's inputs on an amber day give 'confirm 60 kg'.
- User impact: The Coach tab can say 'add one step' while Train says 'hold' on the same day.
- Source: S11

### PROGRESSION-F14 · Changing only the effort label can create a Strength record
- Severity **medium** · status **confirmed** · where `src/brain/e1rm.ts:8,17-18; src/brain/prs.ts:69-70`
- What the code does: The e1RM adds 3 reps in reserve for 'easy', so an easy-rated set can beat an ideal-rated set with the same kg and reps by more than the 2.5% threshold.
- What is correct: PLAN:628: e1RM records only from sets of 10 reps or fewer at ideal or max; 'Never says: records from easy sets'.
- Evidence: S-effortPR: 100 × 5 ideal, then 100 × 5 easy, gives a 'strength' record (126.7 vs 123.3 = +2.7%).
- User impact: The app celebrates a strength record when nothing changed except the effort label.
- Source: R33, S10

### PROGRESSION-F15 · Default equipment profiles change loads for kettlebells, EZ bars, landmines and 2.5-step machines
- Severity **medium** · status **confirmed** · where `src/brain/units.ts:17-37; src/brain/coach/cues.ts:23-33; fallback at src/brain/units.ts:44-56`
- What the code does: Kettlebells use the dumbbell ladder. EZ bar and landmine are treated as a 20 kg barbell. Machines step by 5. Every app caller passes a resolved profile, and the defaults apply until the user sets their own.
- What is correct: Kettlebells use standard sizes (KB-STD: 8/12/16/20/24/28/32 kg). The EZ bar has its own bar weight. A landmine is not 'bar + 2 × plates'.
- Evidence: S-kb: a 16 kg kettlebell hold shows 15 kg. By the ladder, 24 → 25, 12 → 12.5, 28 → 27.5, 32 → 32.5. S-machine: 22.5 → 20. S-ez: the EZ-curl start of 10 kg (src/core/exercises.ts:270) shows 20 kg, and a logged 15 kg holds at 20. S-landmine: start 10 → 20.
- User impact: Until the user sets up their equipment, these moves show a different weight from the one they lifted or should start with, for example an EZ-curl start of 20 kg instead of 10.
- Source: R48, S4

### PROGRESSION-F16 · After any break over 28 days, the return target is 100% of the old load
- Severity **medium** · status **confirmed** · where `src/brain/progression.ts:40,210-212`
- What the code does: Re-entry repeats last.topKg for the full set count, with reps at the bottom of the range, whatever the length of the break.
- What is correct: Scale the return load down as the break gets longer (BOSQUET13: strength loss is significant from week 3 and grows with time). No source fixes the exact percentage. Not covered in COACHING-DECISIONS.
- Evidence: Probe C2-reentry: 180 days after 100 × 5 gives 'reentry 100 kg · 6–12 reps', 3 sets each of 100 × 6 ('Return session'). That is more reps than last time.
- User impact: After months off, the user is asked to lift their old load for at least as many reps as before, which risks a failed or unsafe first session back.
- Source: R9, M3

### PROGRESSION-F17 · Carries put the lighter week ahead of the return rule and skip the set cut
- Severity **low** · status **confirmed** · where `src/brain/progression.ts:196-207 vs 210-226`
- What the code does: The carry branch applies the lighter week before re-entry and keeps setCount. Weighted moves run re-entry first and cut sets.
- What is correct: The same priority for all modes (COACHING-DECISIONS.md:231: deload after reentry) and the ×0.6 set cut (PLAN:196).
- Evidence: S-order: a carry last done 79 days ago, during a lighter week, gets 29 kg. Bench in the same case gets 'reentry 60'. Probe C2-carrysets: a carry logged with 3 sets keeps 3 sets in the lighter week, while bench drops to 2. The set cut would not reach Train anyway (F6).
- User impact: Carries after a long break, or in a lighter week, follow different rules from other lifts; the effect is small.
- Source: R8, S8

### PROGRESSION-F18 · Duration holds skip the 28-day return rule
- Severity **low** · status **confirmed** · where `src/brain/progression.ts:174-178 (returns before 210)`
- What the code does: A plank last done months ago still gets '+5 s'.
- What is correct: Repeat after a gap, as carries do (progression.ts:200) and as header rule 2 says. Not documented as a decision.
- Evidence: S-duration: a plank last done 79 days ago gives 'duration', 45 s (40 + 5).
- User impact: After a long break, holds are pushed longer instead of repeated.
- Source: S7 (re-entry part)

### PROGRESSION-F19 · Duration holds skip the lighter week
- Severity **low** · status **owner-decision** · where `src/brain/progression.ts:174-178`
- What the code does: No lighter week for 'duration' mode.
- What is correct: The research questions it because every other mode is cut.
- Evidence: Explicit owner decision in COACHING-DECISIONS.md:231-233 ('never fires for duration mode'). S-duration confirms the behaviour.
- User impact: Planks keep progressing during a lighter week, as decided.
- Source: S7 (lighter-week part)

### PROGRESSION-F20 · Keep-the-load modes snap to the nearest equipment step
- Severity **low** · status **owner-decision** · where `src/brain/progression.ts:89,118; src/brain/units.ts:123-126`
- What the code does: Hold, confirm, reentry, plateau and start snap to the nearest step, with ties going lighter.
- What is correct: The research asks that a lifted load be kept exactly.
- Evidence: Explicit owner decision in COACHING-DECISIONS.md:317 ('nearest otherwise ... nearest is the honest reading of keep it'). It only changes a lifted load when that load is missing from the profile, which is the default-profile problem in F15.
- User impact: None beyond F15 once the profile matches the equipment.
- Source: R2

### PROGRESSION-F21 · Snapping up to the equipment breaks the 10% increase cap
- Severity **low** · status **owner-decision** · where `src/brain/progression.ts:43-44,281-282; src/brain/progression.ts:89,118`
- What the code does: The cap limits the raw step, then the snap goes up to the next rung.
- What is correct: ACSM09: increases of 2-10%.
- Evidence: S-share: a 20 kg machine → 22 raw → 25 kg (+25%). Snapping up for increases is an explicit owner decision in COACHING-DECISIONS.md:317. The code comment 'never more than 10%' (progression.ts:43) is then untrue.
- User impact: Light machine and dumbbell lifts can jump 20-25% in one step, with no warning.
- Source: S16

### PROGRESSION-F22 · An 'increase' at the top of the equipment range shows the same load
- Severity **low** · status **confirmed** · where `src/brain/units.ts:121-122; src/brain/progression.ts:283`
- What the code does: Snapping up past the heaviest rung returns the top rung, while the mode and reason still say increase.
- What is correct: Say no heavier weight exists, or progress reps.
- Evidence: S-rack-top: a 60 kg dumbbell press (default rack top is 60) gives 'increase', 60 kg, 'Add one step'.
- User impact: The text says to add weight, but the number stays the same.
- Source: S9

### PROGRESSION-F23 · Only the best set has to reach the top of the range for an increase
- Severity **low** · status **confirmed** · where `src/brain/progression.ts:274-276; src/brain/history.ts:33-34`
- What the code does: cleanTop checks topReps (the best set at top kg) only.
- What is correct: NSCA-2for2 (secondary summary only) judges the last set; double progression usually needs all sets at the top.
- Evidence: S-besttop: 60 × 12/8/7 twice gives 'increase' with 'Top of the range two sessions running'. The other sets stay inside the 6-12 range, so this is lenient rather than unsafe.
- User impact: Load goes up earlier than standard rules allow, and the reason overstates what was done.
- Source: R18, S12

### PROGRESSION-F24 · 'Add a rep' is shown when the target is the same or fewer reps
- Severity **low** · status **confirmed** · where `src/brain/progression.ts:295-296`
- What the code does: The hold target clamps topReps+1 to the range top, but the reason text is fixed.
- What is correct: The reason matches the number.
- Evidence: S-holdtext: one unrated 60 × 15 (range 6-12) gives a target of 12 with 'Keep the load and add a rep'. Traced in the code: 12 at max gives a target of 12 with 'aim for one more clean rep'.
- User impact: The advice text contradicts the number shown.
- Source: R22, S13

### PROGRESSION-F25 · Load-factor and lighter-week cuts round to the nearest 0.5, not down
- Severity **low** · status **confirmed** · where `src/brain/progression.ts:52,131-136,224`
- What the code does: half() rounds to the nearest 0.5, although the comment at :131 says 'rounding down'.
- What is correct: A cut never rounds up.
- Evidence: Probe C2-factor: 72.5 × 0.9 gives 65.5 without a profile and 65 with the barbell default (forced down-snap). Every app caller passes a profile (Train.tsx:270,520,901; Coach.tsx:142; context.ts:98), so the app is not affected.
- User impact: No visible effect in the app today; only the code comment is wrong.
- Source: R24, S21

### PROGRESSION-F26 · Lighter-week triggers (b) and (c) count the unfinished current week
- Severity **low** · status **confirmed** · where `src/brain/deload.ts:252-253,260-263; src/brain/exposure.ts:127-132`
- What the code does: Week 0 is the current week from Monday. 'Volume rising' needs week 0 >= last week.
- What is correct: Rising volume is judged on completed weeks. Note that BR-07 (COACHING-DECISIONS.md:411) itself counts 'this or last week' as over the band, so (c) matches that rule.
- Evidence: S-week: on Monday 2026-09-14, week 0 = '2026-09-14'. Trigger (b) compares a partial week with full weeks, so it rarely fires early in the week (a missed offer, not a safety risk). The full trigger result by weekday was not probed.
- User impact: Whether some lighter-week offers appear depends on the day of the week.
- Source: R38 (b,c), R39, S15

### PROGRESSION-F27 · The legacy lb backfill cannot recover the typed value for about 9% of half-lb loads
- Severity **low** · status **confirmed** · where `src/core/units.ts:57-64; src/core/store.ts:90-93; src/core/migrate.ts:234-238`
- What the code does: It tags every quarter-kg value with the nearest half-lb value.
- What is correct: The typed value, or no tag when it is ambiguous.
- Evidence: Probe C2-backfill: 130 of 1,399 half-lb values (1-700 lb) come back different, e.g. 2.5→3, 8→8.5, 13.5→13, 19→18.5. S-backfill: every quarter-kg value up to 300 gets tagged. The tag is the same 0.5-lb rounding the pre-units display used (QA-REGRESSION-AUDIT.md:85), so users see what the old app showed. Leaving values untagged would show 0.1-lb conversions (2.8 for 2.5), which are not the typed values either. The old storage formula cannot be checked because git history is shallow.
- User impact: Some old lb loads show 0.5 lb off what was typed; display only, stored kg is unchanged.
- Source: R54, S18

### PROGRESSION-F28 · Plan balance flags are checked after rounding to 0.1
- Severity **low** · status **confirmed** · where `src/brain/plan.ts:48,115-124`
- What the code does: r1() rounds the ratio before the >= 2 and <= 0.33 checks.
- What is correct: The thresholds as stated.
- Evidence: Probe C2-balance: push:pull 1.96 is flagged push_heavy, and upper:lower 0.34 is flagged lower_heavy.
- User impact: The plan checker warns on plans just inside its stated limits.
- Source: S19

### PROGRESSION-F29 · The rule order in the progression.ts header does not match the code
- Severity **low** · status **confirmed** · where `src/brain/progression.ts:3-11 vs 245-296`
- What the code does: The header puts 'trend down' after the top-of-range rules. The code checks it first (270-273). The header also leaves out readiness, recovery, lighter week, duration and carries.
- What is correct: The header matches the code.
- Evidence: Read directly from the code.
- User impact: None directly; it misleads reviewers.
- Source: S22

### PROGRESSION-F30 · Assisted moves never reduce the assistance, and their reps have no cap
- Severity **low** · status **confirmed** · where `src/brain/progression.ts:231-238`
- What the code does: The target is +1 rep every session, with kg null (the assistance is not shown).
- What is correct: BR-06 (COACHING-DECISIONS.md:409) counts less assistance as progress. F13 (F13-BODYWEIGHT-LOAD.md:25) left assisted targets unchanged within its scope.
- Evidence: Probe C2-assisted: starting from 12 reps, targets climb 13, 14 ... 18 reps, always with kg=null.
- User impact: Assisted pull-ups only ever ask for more reps and never suggest less help.
- Source: R12 (assisted), M5 (assisted)

## Not covered

- src/brain/volume.ts (volumeBands values used by plan.ts and deload.ts) was not read.
- src/brain/readiness.ts: only the result shape and loadAdvice mapping (70-80, 230-239) were read; the scoring was not.
- src/brain/recovery.ts / recoveryPctFor were not read (the input to RECOVERY_HOLD_PCT).
- src/brain/coach/pre.ts (warm-ups and targets via loadForReps/roundToStep) was not read.
- src/brain/exposure.ts effectiveSetsByMuscle and trainingLevels were read only in part.
- src/core/exercises.ts findByName fuzzy matching (lines 143-197) was not read fully.
- The Escobar tool callers (read.ts, show.ts, calc.ts) were read only at their call sites.
- Whether Escobar can set a loadFactor during an active lighter week, which would stack two factors, is unverified.
- Scratch probes are in /home/user/marc-main/tests/qa-scratch/progression/probe.test.ts (19 tests, all pass on 5f282d7).

## Sources

- **ACSM09** ACSM Position Stand: Progression models in resistance training for healthy adults (Med Sci Sports Exerc 2009;41(3):687-708). Abstract read via Europe PMC: 2-10% load increase when the current load can be done for 1-2 reps over the target; novice 8-12 RM; advanced 1-12 RM with emphasis on 1-6 RM; hypertrophy rest 1-2 min; advanced strength rest 3-5 min — https://pubmed.ncbi.nlm.nih.gov/19204579/
- **NSCA-2for2** NSCA Essentials (Baechle & Earle) '2-for-2 rule': add load when the LAST set beats the rep goal by 2 in two workouts in a row. Secondary summary only; the textbook was not opened — https://www.ptpioneer.com/personal-training/certifications/nsca-cscs/cscs-chapter-17/
- **REYNOLDS06** Reynolds, Gordon, Robergs 2006, JSCR 20(3):584-592: 1RM prediction is best from 5RM and worse at 10 and 20 reps — https://pubmed.ncbi.nlm.nih.gov/16937972/
- **LESUER97** LeSuer et al. 1997, JSCR: accuracy of 1RM prediction equations (Epley about 3% error on squat); Mayhew 2008 follow-up: more accurate under 10 reps — https://journals.lww.com/nsca-jscr/abstract/1997/11000/the_accuracy_of_prediction_equations_for.1.aspx
- **BELL23** Bell et al. 2023, Sports Med Open 9:87, Delphi consensus on deloading: about 7 days every 4-6 weeks; cut sets and reps; intensity can stay or drop; deload lets training intensity go up afterwards — https://pmc.ncbi.nlm.nih.gov/articles/PMC10511399/
- **ROGERSON24** Rogerson et al. 2024, Sports Med Open, deloading survey (n=246): deload 6.4±1.7 days every 5.6±2.3 weeks; fewer reps per set and fewer sets, lighter loads, more reps in reserve — https://pubmed.ncbi.nlm.nih.gov/38499934/
- **BOSQUET13** Bosquet et al. 2013, Scand J Med Sci Sports, meta-analysis on stopping training: max-strength loss is significant from week 3 and grows with the length of the break — https://pubmed.ncbi.nlm.nih.gov/23347054/
- **HELMS16** Helms, Cronin, Storey, Zourdos 2016, Strength Cond J 38(4):42-49: RIR-based RPE scale (RPE 10 = 0 RIR); beginners judge RIR less accurately — https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/
- **KB-STD** Competition kettlebell standard sizes (IUKL/IKFF/GSU): 8, 12, 16, 20, 24, 28, 32 kg — https://en.wikipedia.org/wiki/Kettlebell_lifting
- **LB-DEF** International yard and pound agreement (1959): 1 lb = exactly 0.45359237 kg — https://en.wikipedia.org/wiki/International_yard_and_pound
- **DOC-PLAN** docs/COACHING-PLAN.md: :196 F3.3 deload; :209 GOAL.rir in the increase rule and one clean top for growth; :357 progression order; :597 e1RM; :598 RIR bias; :610 working-load target load = e1RM/(1+(n+2)/30); :620 in-session autoregulation -5%; :628 records 'from ≤10 reps at ideal or max'; :643 progress by training age; :659 plateau ±1.5% over 8 weeks; :774 low-range step-down — /home/user/marc-main/docs/COACHING-PLAN.md
- **DOC-DEC** docs/COACHING-DECISIONS.md: :45 templates; :227-229 deload 0.6/0.9; :231-233 duration skips deload; :235 closes itself; :317 snap direction; :342-346 EV2 plan evaluator; :408 active lifts; :410 BR-04 plateau 1.5% over 8 weeks; :415 BR-08/09; :416 D11 bias not applied to e1RM; :418 BR-24 plates — /home/user/marc-main/docs/COACHING-DECISIONS.md
- **DOC-F13** docs/F13-BODYWEIGHT-LOAD.md: owner-approved; bodyweight moves still progress by reps; targets and records unchanged; share table with sources — /home/user/marc-main/docs/F13-BODYWEIGHT-LOAD.md
- **DOC-ESC** docs/ESCOBAR-ARCHITECTURE.md §8.3 (lines 346-362): plan evaluator, session minutes = Σ sets × (rest + 45 s), recovery conflict under 48 h — /home/user/marc-main/docs/ESCOBAR-ARCHITECTURE.md
- **PROBE-R** Researcher probes on 5f282d7 (8 tests, all pass): R-postdeload, R-intermediate, R-dropmax, R-lowrange, R-farabove, R-farbelow, R-bwred/R-assisted, R-dupids — /home/user/marc-main/tests/qa-scratch/progression/research-probe.test.ts