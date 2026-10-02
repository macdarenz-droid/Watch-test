# Logic audit · Coach brain: rules, cues, pre/live/post and weekly review (`coachrules`)

Rules judged: 48 · verdicts: {"correct": 20, "wrong": 19, "unverifiable": 1, "questionable": 8}. Part of `qa/LOGIC-AUDIT.md` (QA-L1, 2026-09-27).

## Findings

### COACHRULES-F1 · Normal progress is labelled 'flat' or 'stalled'
- Severity **high** · status **confirmed** · where `src/brain/trend.ts:32-33,78-101; src/brain/coach/weeklyReview.ts:249-256; src/brain/coach/rules.ts:191-224`
- What the code does: trend() calls any change under 1% a week 'flat' (trend.ts:32), which is about 4.3% a month. plateauStatus judges top load (trend.ts:90), not effort-adjusted e1RM, and ignores effort. The weekly e1RM note needs 7+ points (trend.ts:33, weeklyReview.ts:249). The plateau lever uses a different rule (BR-04: under 1.5% total over the window, weeklyReview.ts:74-79), so the app has two plateau definitions.
- What is correct: One plateau rule: the BR-04 one (under 1.5% total over 6-8 weeks, judged on e1RM). Weekly e1RM row per plan 6.13 (COACHING-PLAN.md:642): rising above +2.5% over 42 days, falling below -2.5%, from 4+ points. Decline only at the same or harder effort (plan 652). Trained lifters gain about 0.6-1.2% a month (LATELLA20).
- Evidence: probe.test.ts 'a lift rising 0.8%/week' passes: title 'Bench: flat', means 'The stimulus has stopped changing.'. checker.test.ts R6/R7: bench 100 -> 105 kg over 7 weeks (+5%) gives plateauStatus {status:'plateaued', confidence:'medium'} and the note '... has not moved over your last eight sessions.'
- User impact: Lifters who are progressing normally are told they have stalled and to change their training.
- Source: COACHRULES-R6, R7, R28, S2

### COACHRULES-F2 · Acute-load ratio alone drives red readiness, false copy, held loads and a deload offer
- Severity **high** · status **confirmed** · where `src/brain/readiness.ts:212-231; src/brain/coach/rules.ts:437-469,597-624; src/brain/deload.ts:70-71; src/brain/progression.ts:245-247`
- What the code does: With no check-in, no health data and nothing scheduled today, the only input is acute load (weight 0.05); it is renormalised to the whole score, so a ratio of about 1.5 or more gives score 0 (red). The red note says 'Several signals point the same way today.' (rules.ts:445) at priority 450. Red makes Train hold the load and drop a set (progression.ts:245-247), and 3 such days trigger a lighter-week offer (deload.ts:70-71). The Monday green note claims 'Sleep, resting heart rate and recovery are all lining up' (rules.ts:464) when none were logged. The `calibrating` and `confidence: 'low'` fields are ignored by the rule.
- What is correct: Plan Appendix B: 'renormalise on missing inputs; never zero; self-report leads (Saw 2016)'. No red or amber alert and no deload count unless a check-in or sleep input is present or 2+ inputs agree. With load alone, a low-confidence note at most. Copy names only inputs that exist. ACWR has no sound basis (IMPELL20; plan boundary 'ACWR as injury risk').
- Evidence: probe.test.ts: red from load alone says 'Several signals point the same way today.'; green Monday claims sleep and resting HR. checker.test.ts R23/R18: bench rising 2.5 kg every session (plateauStatus 'progressing'), readinessSeries bands ['red','red','red','red','green'], today {score:0, confidence:'low', calibrating:true}, deloadOffer = {suggest:true, reason:'Readiness has read red on three or more of the last five days.'}.
- User impact: A lifter who simply trains more often is told to back off, gets lower targets and is offered a lighter week, based on false claims about signals.
- Source: COACHRULES-R18, S13, R23(d), M4

### COACHRULES-F3 · Implausible sets (typos) feed records and next targets
- Severity **high** · status **confirmed** · where `src/brain/fidelity.ts:144-154 (only called by src/escobar/tools/read.ts:178); src/brain/prs.ts:59-78; src/brain/progression.ts; src/brain/history.ts`
- What the code does: flagsForSet() computes implausible_load/implausible_reps, but nothing stores the flags and no records, e1RM, trend or progression code reads them. Train only asks about kg/lb mix-ups at 2.2x or 0.45x (Train.tsx:812).
- What is correct: Plan 6.17.4 (COACHING-PLAN.md:841-842) and scenario 4: flagged sets are excluded from e1RM, trends and targets until confirmed; a record from a flagged set is held as unconfirmed. P1-R deferred the full matrix but did not decide that flagged sets count.
- Evidence: checker.test.ts M1: 1000 kg typo gets flag 'implausible_load', yet recordsInsight returns a 'heaviest' record with 'That is a genuine personal best...'. M1b: 130 kg typed for 100 (flagged) makes suggestNext return kg 130, target '130 kg · 6 reps', mode 'hold'.
- User impact: One typo becomes a 'personal best' and sets next session's load 30% too heavy.
- Source: COACHRULES-M1

### COACHRULES-F4 · Weekly review reads the unfinished current week and rarely appears
- Severity **medium** · status **confirmed** · where `src/brain/coach/weeklyReview.ts:171-176; src/slices/coach/Coach.tsx:202-210`
- What the code does: The gate needs 5 distinct days OR 5 sessions in the week containing today. On Monday it is empty. A 4-day-a-week lifter never sees it; 5 sessions on 2 days pass.
- What is correct: Plan 6.12.5 (line 575), section 7 P2-C Done-when (line 887) and the P2-C dismissal decision: shown on the first open of a new week, reviewing the week that just ended.
- Evidence: probe.test.ts: Monday after a full Mon-Fri week -> false; 5 sessions on 2 days -> true. checker.test.ts R24/S1: Mon/Tue/Thu/Fri lifter gets false on all 8 days 2026-09-14..09-21.
- User impact: Most people training 3-4 days a week never get a weekly review, and others get one about a half-finished week.
- Source: COACHRULES-R24, S1

### COACHRULES-F5 · Autoregulation steps from the target, not the load lifted
- Severity **medium** · status **confirmed** · where `src/brain/coach/live.ts:29,51,73; src/slices/workout/Train.tsx:584-586`
- What the code does: The next load is targetKg plus or minus a step, whatever the first set's actual kg.
- What is correct: Plan 6.13 (line 620): 'load x 1.025' on the set just done ('That felt easy at 80. Try 82.5'). ACSM09 progresses from the load performed.
- Evidence: probe.test.ts: easy 80 kg x 8 with target 100 -> 'Try 102.5 kg for the next set.' (a 28% jump).
- User impact: Someone who started lighter than the target is told to jump far above what they just lifted.
- Source: COACHRULES-R38, S6

### COACHRULES-F6 · Autoregulation drop after a big miss is 2.5%, not 5%
- Severity **medium** · status **confirmed** · where `src/brain/coach/live.ts:29,61-81`
- What the code does: A max-effort miss reuses the 2.5% step: target 100 kg -> 97.5 kg.
- What is correct: Plan 6.13 (lines 577, 620): 'max and reps < target - 1 -> load x 0.95', 'Drop 5%'. No decision in COACHING-DECISIONS.md changes this (the step decision at line 101 covers only the 2.5 kg / 2.5% switch). HELMS18: about 2% per 0.5 RPE.
- Evidence: probe.test.ts: max 4 reps vs target 8 at 100 kg -> 'Drop to 97.5 kg and keep the rest at ideal effort.'
- User impact: After a clear miss the remaining sets stay too heavy.
- Source: COACHRULES-R38, S7

### COACHRULES-F7 · Autoregulation can suggest more load on a deload, amber or red day
- Severity **medium** · status **confirmed** · where `src/brain/coach/live.ts:12-22,50-59; src/slices/workout/Train.tsx:584-586; src/escobar/tools/read.ts:406`
- What the code does: autoregulationSuggestion has no deload or readiness input and neither caller filters, so an easy first set at a deload or held target gives 'room to add load'.
- What is correct: Plan 6.12.5 (line 577) 'suppressed on a back-off day'; 6.13 'Never says: an increase on a back-off day'; Appendix B amber = hold load. Deload sets are meant to feel easy (BELL23).
- Evidence: probe.test.ts: easy 60 x 8 at a 60 kg target -> title 'Bench: room to add load'. Code: Train.tsx:585 passes no deload/readiness.
- User impact: The coach undoes a lighter week or a hold day by telling the person to add load.
- Source: COACHRULES-R38, S8

### COACHRULES-F8 · Deload sessions read as decline and bring the lighter-week offer back
- Severity **medium** · status **confirmed** · where `src/brain/trend.ts:78-101; src/brain/deload.ts:42-49; src/brain/coach/rules.ts:191-207,621-624`
- What the code does: Deload sessions (loads x 0.9) stay in plateauStatus, so the day after endDay two main lifts read 'declining' and the offer fires again; progress.declining has no deload check either.
- What is correct: F3.3/P4: 'a week later the coach closes it and returns to normal targets'. Exclude deload-window sessions from trend and stall checks. COLEMAN24: needless deloads cost strength.
- Evidence: probe.test.ts 'deload offer right after a deload ends': deloadOffer on 2026-09-17 (deload ended 09-16) -> suggest true, reason contains 'plateaued or slipped'.
- User impact: People can be pushed into back-to-back lighter weeks and told their progress slipped because of the deload itself.
- Source: COACHRULES-S18, R6, R7

### COACHRULES-F9 · Any recovery note hides all lift notes on that muscle, even when snoozed
- Severity **medium** · status **confirmed** · where `src/brain/coach/rules.ts:542-560`
- What the code does: runInsightRules drops every insight with an exerciseId whose primary muscles include any recovery-note muscle, before feedback is applied. A soft (74%) conflict hides plateau and plateau-lever notes; snoozing the conflict keeps them hidden.
- What is correct: Plan 6.12.5 order is 'priority, dedupe by target, drop snoozed'; this is suppression of different advice, not a dedupe. At most hide short-term notes (effort or heart drift) for a firm (<60%) note, worked out after feedback.
- Evidence: checker.test.ts R21/S20: without a schedule, bench has ['plateau-lever:...','plateau:...']; with Push scheduled, conflict 'Push today, but chest is only 74% recovered' (priority 340) and zero bench insights; with the conflict snoozed, coachInsights still has no bench insight.
- User impact: An 8-week plateau warning disappears because the muscle is slightly tired today, and stays gone for 7 days after a snooze.
- Source: COACHRULES-R21, S20

### COACHRULES-F10 · 'Push is done for today' when Push was not done
- Severity **medium** · status **confirmed** · where `src/brain/coach/rules.ts:150-177`
- What the code does: The done-today branch also fires when the worst muscle's last training day is today (rules.ts:151), whichever split trained it.
- What is correct: Say 'done today' only when that split's session was logged today; otherwise name the other session and keep the conflict advice.
- Evidence: probe.test.ts: only an 'upper' session (fly) today, Push (bench) scheduled -> noticed 'Push is done for today.'
- User impact: The app states something false and hides the warning that today's planned muscles are already tired.
- Source: COACHRULES-R4, S16

### COACHRULES-F11 · Snoozing a mild readiness note also hides a later red one
- Severity **medium** · status **confirmed** · where `src/brain/coach/rules.ts:444,454,463,527-529 (also constant ids 'gap' 306, 'effort-missing' 323)`
- What the code does: All readiness bands share id 'readiness-today'; one 'Not now' hides every band for 7 days.
- What is correct: Band-specific ids, or never let a snooze hide a more severe band (COACH-FB decision keys feedback by id).
- Evidence: probe.test.ts: snooze of 'readiness-today' on 09-21 -> rankInsights([red], hidden) on 09-23 returns [].
- User impact: A top-priority red alert can be silently hidden by an earlier snooze of a harmless note.
- Source: COACHRULES-S17

### COACHRULES-F12 · Plateau lever reads effort from other exercises and lacks sleep and weight levers
- Severity **medium** · status **confirmed** · where `src/brain/coach/rules.ts:390-402`
- What the code does: failureShare runs on whole sessions (all exercises). Only three levers exist (sets, max share, stale); the plan's weight-trend and sleep levers are absent.
- What is correct: Plan Ad hoc row (COACHING-PLAN.md:659): failure share > 50% with 10+ sets for the lift; levers in order sets, effort, weight trend <= -1 kg, sleep < 6.5 h, stale; show one. BR-04 window and flat test are fine.
- Evidence: probe.test.ts: bench all ideal (bench-only failureShare = 0), max lateral raises in the same sessions -> lever 'Effort has been mostly max for a while...'.
- User impact: The coach tells someone to ease off a lift they never took to failure.
- Source: COACHRULES-R16, S14

### COACHRULES-F13 · Adherence counts days before the person started as missed
- Severity **medium** · status **confirmed** · where `src/brain/coach/weeklyReview.ts:91-104,289-299`
- What the code does: The current schedule is applied to all 28 days with no minimum history.
- What is correct: Plan 6.13 adherence row (line 647): minimum 'a declared plan and 2 weeks'; start the window at the first session or schedule start. BR-15 (today excluded until it has a session) is fine.
- Evidence: probe.test.ts: new user, all 5 planned days of week 1 done -> adherenceRate 0.25 and note 'Fewer planned sessions than usual'.
- User impact: A new user with a perfect first week is told they have a scheduling problem.
- Source: COACHRULES-R31, S4

### COACHRULES-F14 · Frequency note claims all sets were in one session when they were not
- Severity **medium** · status **confirmed** · where `src/brain/coach/weeklyReview.ts:34-49,204-221`
- What the code does: Frequency counts sessions with 2+ primary sets, but the quoted total includes secondary 0.5 credit and 1-set sessions. It fires after one week, and the strength threshold (8) applies to every muscle.
- What is correct: Plan 6.13 (line 641): freq = 1 and 12+ sets for 2 weeks; strength goal only for the goal lift with 8+ sets. Quote only that session's primary sets. SCHOEN19: frequency matters little at equal volume.
- Evidence: probe.test.ts: 12 squat sets Mon + 1 leg-press set Wed -> 'All 13 quads sets this week were in a single session.' checker.test.ts R26: strength goal, 8 curl sets on one day -> 'weekly:frequency:biceps'.
- User impact: The note states a false fact and nudges people to reshuffle training after one normal week.
- Source: COACHRULES-R26, S5

### COACHRULES-F15 · Weight trend is shown however old the weigh-ins are
- Severity **medium** · status **confirmed** · where `src/brain/coach/weeklyReview.ts:112-119,336-350`
- What the code does: The 28-day window is anchored on the last weigh-in, not today; evidence n is the whole log size (line 348). Fit method and goal ranges are fine (BR-14, HELMS14, IRAKI19).
- What is correct: Window ends today; show a rate only when the latest weigh-in is recent and 7+ entries span 14+ days (plan line 648 also says 3 weeks for a rate).
- Evidence: probe.test.ts: 8 weigh-ins from February 2026 still produce 'weekly:weight-trend' on 2026-09-18.
- User impact: Months-old weight data is presented as this week's trend and can prompt a food change.
- Source: COACHRULES-R33, S12

### COACHRULES-F16 · Weekly 'under its usual range' flags a partial week, secondary-only muscles, not the lowest
- Severity **medium** · status **confirmed** · where `src/brain/coach/weeklyReview.ts:185-202`
- What the code does: It counts the current week so far, includes muscles with only secondary 0.5 credit, picks the low muscle with the most sets, and calls a fixed band 'usual range'.
- What is correct: Plan 6.13 (line 640): a full week with 3+ sessions; 'low' only after 2 weeks. Name the lowest muscle that is primary in the person's splits (as programming.volume does per P4). Bands themselves fit SCHOEN17/PELLAND25.
- Evidence: checker.test.ts R25/S22: Wednesday, bench x4, squat x4, bench x4 + curl x1 -> 'weekly:volume:hamstrings' (hamstrings 2, secondary only) while Biceps 1 is lower.
- User impact: Mid-week the coach tells people to add sets for a muscle they never target, while missing the one that is actually lowest.
- Source: COACHRULES-R25, S22

### COACHRULES-F17 · Pace note can only ever say 'faster than typical'
- Severity **medium** · status **confirmed** · where `src/brain/coach/weeklyReview.ts:260-273; src/brain/trend.ts:32`
- What the code does: The note needs direction 'up' (>= 1%/week = 4.33%/month), above every band top (4, 1, 0.5), so 'typical' and 'slower' can never appear.
- What is correct: Compare the corrected monthly slope (see F1) with the band; say faster or slower only when the uncertainty range falls outside it (plan line 643). Bands are plausible (LATELLA20, STEELE23).
- Evidence: probe.test.ts: rising 1.1%/week at training ages 6, 24 and 60 months -> always 'Bench: faster than typical for your training age'.
- User impact: Every rising lift is called faster than typical, whatever the training age.
- Source: COACHRULES-R29, S3

### COACHRULES-F18 · Pre-session brief drops the 60+ note and warm-up on full-body days
- Severity **medium** · status **confirmed** · where `src/brain/coach/pre.ts:101-134 (age at pre.ts:104); src/slices/workout/Train.tsx:894,904`
- What the code does: Each main lift adds a load target at priority 260 and the brief keeps 3, so with 3 main lifts the warm-up (120) and masters note (110) are cut. Age is current calendar year minus birth year via new Date(), not `today` (minor: up to a year early).
- What is correct: Plan 6.12.5 (line 573) lists warm-up in every brief; the masters note is meant to show each session start (pre.ts:88). Cap load targets so both always fit. FRAGALA19 guidance for 60+.
- Evidence: probe.test.ts: split bench+squat+OHP, age 65 -> no 'pre:masters' and no 'pre:warmup' in the output.
- User impact: Older lifters lose their age-specific guidance and everyone loses the warm-up exactly on full-body days.
- Source: COACHRULES-R35, S11, S25

### COACHRULES-F19 · e1RM 'new record' counts easy-rated sets
- Severity **medium** · status **confirmed** · where `src/brain/prs.ts:69-70; src/brain/e1rm.ts:8,15-18; src/brain/coach/post.ts:14-37`
- What the code does: The strength record uses bestE1rm from any effort; easy adds 3 reps in reserve, so the same load rated easy beats the ideal one. The retro part of the claim is refuted: plan 6.17.4 allows records at every fidelity, but it wants them marked 'logged later', and no copy does that (grep finds no 'logged later' in records).
- What is correct: Plan 6.13 records row (line 628): e1RM record only from <= 10 reps at ideal or max, > 2.5% over prior best; 'Never says: records from easy sets'. STEELE17: novices misjudge reps left by 4-5.
- Evidence: probe.test.ts: prior 100x5 ideal, now 100x5 easy -> a ':strength' record; retro 110x5 also gives records (allowed by plan).
- User impact: People are told they set a 'genuine personal best' for lifting the same weight and calling it easy.
- Source: COACHRULES-R39, S15

### COACHRULES-F20 · Rest advice pools rests across lifts; strength_muscle judged at 90 s
- Severity **medium** · status **confirmed** · where `src/brain/coach/post.ts:83-104; src/slices/workout/Train.tsx:1038; src/escobar/tools/read.ts:172`
- What the code does: The median rest is pooled over all main lifts (post.ts:88) while the rep drop is per lift (post.ts:91), contradicting its own BR-20 comment. isStrengthGoal is goal === 'strength' only, so strength_muscle (4-8 reps, 120 s default, goals.ts:49) uses 90 s.
- What is correct: Per lift: its own median rest and its own drop. 120 s for strength goals (plan line 777 'rest adequacy threshold by goal (120 s for strength goals)'). GRGIC17, ACSM09: longer rests for heavy work.
- Evidence: probe.test.ts: squat rested 180 s and fell 12 -> 8, bench/OHP rested 60 s -> 'Median rest 60s ... reps on a main lift fell from 12 on the first set to 8 on the last'.
- User impact: People are told short rests caused a drop that happened after long rests.
- Source: COACHRULES-R41, S9, S24

### COACHRULES-F21 · Effort drift 'harder at the same load' fires while load rises
- Severity **medium** · status **confirmed** · where `src/brain/effort.ts:12-25; src/brain/coach/rules.ts:240-250; src/brain/deload.ts:52-55`
- What the code does: effortDrift pools ratings at any load; the note says 'Harder sets at the same load can be a sign you need more recovery.' It also feeds deload condition (b).
- What is correct: Compare effort at matched load (or relative to e1RM) and say 'same load' only when it was. HELMS18; STEELE17 (rating error about ±3 reps).
- Evidence: checker.test.ts R9: bench 100 -> 112.5 kg over 6 sessions, ideal then max -> note means 'Harder sets at the same load can be a sign you need more recovery.'
- User impact: Normal progression (heavier load feels harder) is read as a recovery problem.
- Source: COACHRULES-R9

### COACHRULES-F22 · Re-entry repeats the last load after any gap length
- Severity **medium** · status **confirmed** · where `src/brain/progression.ts:210-212; src/brain/coach/rules.ts:307-310`
- What the code does: From 29 days off, suggestNext returns the last top load, the same after 1 month or 1 year; the 'Welcome back' note says 'Repeat your last loads once'. The plan endorses 're-entry after 28 days' (COACHING-PLAN.md:754) but says nothing on scaling by gap or age.
- What is correct: Lower the first load as the gap (and age over 65) grows; max-force loss is significant from about week 3 and pronounced beyond 16 weeks (BOSQUET13).
- Evidence: checker.test.ts M2: last session 2025-09-20 (368 days) and 2026-08-24 (30 days) both give {mode:'reentry', kg:100}.
- User impact: After a long break the first session target can be much heavier than the person can now lift.
- Source: COACHRULES-M2, R12

### COACHRULES-F23 · Deload trigger fires on any one condition, with no history minimum or novice exclusion
- Severity **medium** · status **owner-decision** · where `src/brain/deload.ts:36-75; src/brain/coach/rules.ts:597-624`
- What the code does: Any one of (a) 2 lifts plateaued/declining by plateauStatus, (b) drift + rising volume, (c) over band + stall, (d) 3 of 5 red days fires the offer; no 4-week history minimum or training-age check.
- What is correct: Research: deload only for real fatigue or performance loss, reactive (COLEMAN24, BELL23); plan 6.13 row (line 652): 2+ markers, 4 weeks of history, never for a novice on linear progress. This is the owner's F3.3 'any one of' rule (COACHING-PLAN.md:196), adopted in P4 (COACHING-DECISIONS.md P4). The bugs feeding it are real and listed separately (F1, F2, F8).
- Evidence: deload.ts:47,66,71 are independent returns. checker.test.ts R23: a lifter whose bench rises every session (plateauStatus 'progressing') still gets an offer via (d).
- User impact: Lighter weeks can be offered to people who are still progressing, costing strength.
- Source: COACHRULES-R23, M4

### COACHRULES-F24 · Heart effort-mismatch and drift rules follow F1.3/F1.4, not Appendix B
- Severity **low** · status **owner-decision** · where `src/brain/heart.ts:226-256; src/brain/coach/rules.ts:471-520`
- What the code does: Drift: 3+ sets at the same kg, peak rise >= 8 bpm/set, last HRR60 below first; advice 'trim an accessory or two'. Mismatch: one easy set at >= 90% of session peak among 5+ rated sets.
- What is correct: The code matches the owner's plan F1.3/F1.4 text exactly (COACHING-PLAN.md:179-180) and P2 decisions. Appendix B's 'Drift and fatigue' row (6+ sets, 20+ min, pre-set HR, 'hydration and longer rest, not load cuts') is a different metric, and the plan boundary forbids 'HR as set intensity' (line 667). The owner should pick one.
- Evidence: Code read plus plan lines 179-180 vs Appendix B drift row; the fidelity gap is F25.
- User impact: A 3-set heart-rate rise can lead to accessory cuts where the plan's own research row advises only longer rest.
- Source: COACHRULES-R19

### COACHRULES-F25 · Per-set heart rules ignore set fidelity
- Severity **low** · status **confirmed** · where `src/brain/coach/rules.ts:471-520`
- What the code does: heart.effort-mismatch and heart.drift never check set fidelity.
- What is correct: Plan 6.17.4 (COACHING-PLAN.md:846): per-set heart data (peak, HRR60, effort-mismatch, drift) live sets only.
- Evidence: checker.test.ts R19: three sets with fidelity 'retro' and rising peaks -> heart-drift alert 'Finish this lift, then trim an accessory or two...'.
- User impact: Heart notes can be based on heart windows that do not belong to the sets.
- Source: COACHRULES-R19 (checker)

### COACHRULES-F26 · 'Still recovering' names the first muscle in list order, not the worst
- Severity **low** · status **confirmed** · where `src/brain/coach/rules.ts:124-126; src/brain/recovery.ts:304`
- What the code does: Filter then slice(0,1) in MUSCLE_IDS order; no sort by %.
- What is correct: Among personalised muscles under 60%, show the lowest %.
- Evidence: checker.test.ts R2/S21: chest 52%, quads 46% (both personalised) -> only 'recovery:chest'.
- User impact: The least-recovered muscle may go unmentioned.
- Source: COACHRULES-R2, S21

### COACHRULES-F27 · Failure-share note counts isolation sets, one week, ignores goal cap
- Severity **low** · status **confirmed** · where `src/brain/coach/weeklyReview.ts:51-56,223-235; src/data/goals.ts:27,40-55`
- What the code does: Share of max sets over all exercises in the current week, fixed 0.5. failureShareCap, heavyShareMin and mainLiftWeeklySets are read nowhere outside goals.ts (grep).
- What is correct: Plan 6.13 (line 645): > 50% on compounds for 2 weeks, or > 70% with a strength goal; plan line 777: use failureShareCap. ROBINSON24: failure adds little.
- Evidence: checker.test.ts R27: 12 max-rated lateral raise sets in one week -> 'About 100% of sets were max effort'.
- User impact: Max effort on isolation work, where the plan says it belongs, is flagged as a problem.
- Source: COACHRULES-R27, S19

### COACHRULES-F28 · Rep-mix note skips strength_muscle and reads a partial week
- Severity **low** · status **confirmed** · where `src/brain/coach/weeklyReview.ts:133-149,312-334`
- What the code does: Strength uses a fixed 15% heavy-share floor; strength_muscle is never checked (heavyShareMin 0.25 unused); the current partial week is used.
- What is correct: Plan 6.13 (line 644): a full week vs the prior 4-week mix; plan line 777: heavyShareMin per goal.
- Evidence: checker.test.ts R32: 18 main-lift sets at 8 reps -> 'weekly:rep-mix' for strength, nothing for strength_muscle.
- User impact: Strength-and-muscle lifters never hear that they have no heavy sets.
- Source: COACHRULES-R32, S19

### COACHRULES-F29 · Fallback load target uses the last session and fixed 8 reps
- Severity **low** · status **confirmed** · where `src/brain/coach/pre.ts:33-49,125; src/brain/e1rm.ts:28-30 (the claim's 'e1rm.ts:248-256' does not exist)`
- What the code does: Load = last session's e1RM / (1 + 10/30); the '< 3' gate is dead because trend() needs 4 points; reps fixed at 8 for every goal. Only runs when Train's targetFor has no kg (Train.tsx:898-902), so rarely reached; not verified exhaustively.
- What is correct: Plan 6.13 (lines 597, 610): e1RM trend = median of last 3 sessions, minimum 3 sessions, goal reps. HOPKINS00: one session is within typical error.
- Evidence: probe.test.ts: 3 sessions -> null; 4th session outlier 130 kg -> 'trending toward about 160 kg' after three at 123.
- User impact: When this path runs, one heavy outlier sets the day's target.
- Source: COACHRULES-R36, S10

### COACHRULES-F30 · Effort-mix tip fires on a single session
- Severity **low** · status **confirmed** · where `src/brain/coach/post.ts:39-75`
- What the code does: One session with > 50% max or > 60% easy gives a tip; 50% easy / 0% ideal / 50% max is 'a healthy spread'.
- What is correct: Plan 6.13 (line 629): flag > 50% max only across 2 sessions of a split, > 60% easy across a week.
- Evidence: checker.test.ts R40: 2 easy + 2 max sets -> 'Effort mix: 50% easy, 0% ideal, 50% max', means starts 'A healthy spread'.
- User impact: A one-off session triggers advice, and an extreme mix is praised.
- Source: COACHRULES-R40, S27

### COACHRULES-F31 · Duration drift baseline includes untrusted-timing sessions
- Severity **low** · status **confirmed** · where `src/brain/coach/post.ts:106-123,136-139`
- What the code does: Only the current session's timingTrusted is checked; the median of prior same-split sessions includes retro ones.
- What is correct: Plan 6.17.4 (line 845): only timingTrusted sessions enter personal medians.
- Evidence: checker.test.ts R42: 5 prior retro sessions at 30 min (timingTrusted false) -> live 60-min session '60 min, longer than usual'.
- User impact: A normal session can be called unusually long.
- Source: COACHRULES-R42, S23

### COACHRULES-F32 · Gap note says 'A week without training' for 8-27 days
- Severity **low** · status **confirmed** · where `src/brain/coach/rules.ts:307-309`
- What the code does: The 'noticed' line is fixed for gaps of 7-27 days; the means line ('Zero does not [keep progress]') overstates short-gap loss.
- What is correct: Use the real day count; BOSQUET13: little loss before about week 3.
- Evidence: checker.test.ts R12/S28: 20-day gap -> title '20 days since your last session', noticed 'A week without training.'
- User impact: The note contradicts its own title.
- Source: COACHRULES-S28, R12

### COACHRULES-F33 · Pre-session brief has no readiness or 'muscles not ready' line
- Severity **low** · status **confirmed** · where `src/brain/coach/pre.ts:101-134; src/slices/workout/Train.tsx:904-917`
- What the code does: The brief builds only the 60+ note, load targets and one warm-up. Targets already include readiness (Train.tsx:901) and Train warns per exercise under 60% (Train.tsx:657), so impact is limited.
- What is correct: Plan 6.12.5 (line 573) and 6.13 pre rows (607-608): readiness and drivers, and primary muscles under 90%, before load targets.
- Evidence: Code read: preSessionInsights pushes only mastersDefaults, load targets and warmupRamp.
- User impact: The brief does not say why today's targets were held or which muscles are still tired.
- Source: COACHRULES-M3

### COACHRULES-F34 · Deload readiness history scores today at 23:59
- Severity **low** · status **confirmed** · where `src/brain/coach/rules.ts:602-605`
- What the code does: Index 0 uses today 23:59:59, not ctx.now, so today's band for condition (d) can differ from the band on screen.
- What is correct: Use ctx.now for index 0.
- Evidence: Code read only; not probed.
- User impact: The deload count can use a different 'today' reading than the one shown.
- Source: COACHRULES-S26

### COACHRULES-F35 · Autoregulation 'noticed' prints raw stored kg (latent)
- Severity **low** · status **confirmed** · where `src/brain/coach/live.ts:55`
- What the code does: firstSet.kg is printed with 'kg'; only .action is rendered today (Train.tsx:656, read.ts:406).
- What is correct: Display unit and rounding, as other notes do (BR-28).
- Evidence: probe.test.ts: lb user who typed 135 lb -> 'That felt easy at 61.235 kg for 8.'
- User impact: None today; wrong unit and precision once the line is shown.
- Source: COACHRULES-S29

### COACHRULES-F36 · Unknown goal id in profile history drops the weight note too
- Severity **low** · status **confirmed** · where `src/brain/coach/rules.ts:338-346,545-547; src/slices/profile/profile.ts:11-13`
- What the code does: GOAL_BY_ID[c.to] is unchecked; an unknown id throws and the try/catch drops the whole rule. Not verified that stored data can hold an unknown id (store.ts:167 does not validate entries). The null-weight part is refuted: recordChange skips to == null (profile.ts:12).
- What is correct: Skip or guard an unknown goal id per entry.
- Evidence: checker.test.ts S30: goal 'growth' -> 2 profile-changed notes; goal 'bulk' -> [].
- User impact: A bad stored record could hide a valid weight-change note.
- Source: COACHRULES-S30

## Not covered

- Scratch probes: /home/user/marc-main/tests/qa-scratch/coachrules/probe.test.ts (23 tests, all pass on 5f282d7). Each test passes only when the suspected behaviour is present. No repository file was edited.
- src/brain/balance.ts (trainingBalance) not read. The balance.imbalance numbers (ratio, severity, context) are unaudited.
- src/brain/readiness.ts read only at lines 62-66 and 150-248. Baselines, z-scores, rawFallback, the check-in window and the isDoneToday/next logic were not fully audited.
- src/brain/recovery.ts read only partly (recoveryAt, pctAt, solveHours, acuteChronicRatio, sessionRpeLoad). The dose and tau model and the meaning of 'personalized' calibration were not audited.
- src/brain/heart.ts: only effortMismatch and intraSessionDrift were read.
- src/brain/prs.ts: only recordsFor was read (withoutDrops, repsAtLoadMap and formatRecordValue were not).
- src/brain/progression.ts: only its mode values were read, to check reasonKeyFor; suggestNext targets (used by the brief and autoregulation) were not audited.
- src/brain/units.ts: only loadableNear was read (loadableValues was not).
- docs/COACHING-PLAN.md: read only lines 570-580 and 591-670 (catalogue) and Appendices B and D. docs/COACHING-DECISIONS.md: read only P2-C, P2, P3, P4 and Remediation R3; P0, P0-P, P1-R, P1 and the Escobar sections were not read.
- coachCues.json: the wording of the 422 cues was not reviewed one by one. Only ids, kinds, targeting fields, references and numbers were checked.
- sparks.ts: the quote attributions (e.g. the Confucius and Epictetus wording) were not checked against primary sources; no web lookup was done.
- UI and Escobar callers were checked only at the call sites listed in filesRead.

## Sources

- **PLAN** M/ARC COACHING-PLAN.md: 6.12.5 cadences, 6.13 insight catalogue, 6.17.4 fidelity matrix, Appendix B and D — /home/user/marc-main/docs/COACHING-PLAN.md:570-667,835-862,956-1019
- **DEC** M/ARC COACHING-DECISIONS.md: P2-C, P3, P4, COACH-FB, Remediation R3 — /home/user/marc-main/docs/COACHING-DECISIONS.md:83-270,404-424
- **REM** M/ARC REMEDIATION-PLAN.md: owner decisions D9-D11 and R3 work items (BR-04..BR-27) — /home/user/marc-main/docs/REMEDIATION-PLAN.md:56-71,389-404
- **ACSM09** ACSM Position Stand 2009, Progression models in resistance training (2-10% load increase when 1-2 reps over target; 3-5 min rest for heavy loading, 1-2 min for hypertrophy) — https://pubmed.ncbi.nlm.nih.gov/19204579/
- **ACSM26** ACSM 2026 resistance training guidelines update (MSSE 58(4)): about 10 sets per muscle per week, failure not needed — https://acsm.org/resistance-training-guidelines-update-2026/
- **HELMS18** Helms et al. 2018, RPE vs %1RM loading: load changed 2% per 0.5 RPE off target — https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2018.00247/full
- **STEELE17** Steele et al. 2017 PeerJ: lifters underpredict reps to failure (SEM 2.6-3.4; novices by 4-5 reps) — https://peerj.com/articles/4105/
- **REYNOLDS06** Reynolds et al. 2006 JSCR: 1RM prediction accurate only from sets of 10 reps or fewer — https://pubmed.ncbi.nlm.nih.gov/16937972/
- **HOPKINS00** Hopkins 2000 Sports Med: typical error for judging individual change — https://pubmed.ncbi.nlm.nih.gov/10907753/
- **LATELLA20** Latella et al. 2020 JSCR: 15-year powerlifter strength gains (about 0.1-0.2 kg/day on ~513 kg totals, about 0.6-1.2%/month) — https://pubmed.ncbi.nlm.nih.gov/32865942/
- **STEELE23** Steele et al. 2023 RQES: long-term strength time course (fast early gains, then flattening) — https://www.tandfonline.com/doi/abs/10.1080/02701367.2022.2070592
- **SCHOEN17** Schoenfeld et al. 2017: weekly volume dose-response (+0.37% growth per weekly set; <5 vs 10+ sets) — https://pubmed.ncbi.nlm.nih.gov/27433992/
- **PELLAND25** Pelland et al. 2025/26 Sports Med: volume and frequency dose-response, fractional 0.5 counting, diminishing returns — https://pubmed.ncbi.nlm.nih.gov/41343037/
- **SCHOEN19** Schoenfeld et al. 2019: training frequency does not change hypertrophy when volume is equated — https://pubmed.ncbi.nlm.nih.gov/30558493/
- **ROBINSON24** Robinson et al. 2024 Sports Med: hypertrophy rises toward failure with diminishing returns; strength unaffected by RIR — https://link.springer.com/article/10.1007/s40279-024-02069-2
- **GRGIC17** Grgic et al. 2017: longer rests may benefit trained lifters; short and long rests similar for novices — https://pubmed.ncbi.nlm.nih.gov/28641044/
- **SINGER24** Singer et al. 2024 Bayesian meta-analysis on inter-set rest and hypertrophy — https://pubmed.ncbi.nlm.nih.gov/39205815/
- **BOSQUET13** Bosquet et al. 2013 meta-analysis: max-force loss significant from week 3 of cessation, grows with time (pronounced >16 weeks), larger over 65 — https://pubmed.ncbi.nlm.nih.gov/23347054/
- **COLEMAN24** Coleman et al. 2024 PeerJ RCT: a planned 1-week deload lowered strength gains, no hypertrophy benefit — https://pubmed.ncbi.nlm.nih.gov/38274324/
- **BELL23** Bell et al. 2023 Sports Med Open, deloading Delphi consensus: deload = reduced stress to relieve fatigue; can be autoregulated — https://pmc.ncbi.nlm.nih.gov/articles/PMC10511399/
- **SAW16** Saw et al. 2016 BJSM: subjective self-report tracks training load better than objective markers — https://pubmed.ncbi.nlm.nih.gov/26423706/
- **IMPELL20** Impellizzeri et al. 2020 IJSPP: acute:chronic workload ratio has no sound basis for training decisions — https://pubmed.ncbi.nlm.nih.gov/32502973/
- **HELMS14** Helms et al. 2014 JISSN: lose 0.5-1% of body weight per week to keep muscle — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4033492/
- **IRAKI19** Iraki et al. 2019: gain 0.25-0.5% of body weight per week (novice/intermediate) — https://pubmed.ncbi.nlm.nih.gov/31247944/
- **FRAGALA19** Fragala et al. 2019 NSCA position statement, older adults: 2-3 days/week, 2-3 sets, about 2 min rest — https://journals.lww.com/nsca-jscr/fulltext/2019/08000/resistance_training_for_older_adults__position.1.aspx