# Logic audit · Recovery, readiness, fatigue and heart (`recovery`)

Rules judged: 74 · verdicts: {"correct": 45, "questionable": 19, "wrong": 8, "unverifiable": 2}. Part of `qa/LOGIC-AUDIT.md` (QA-L1, 2026-09-27).

## Findings

### RECOVERY-F1 · A muscle that cannot reach 90% within 120 h shows 'under 1h' to go
- Severity **high** · status **confirmed** · where `src/brain/recovery.ts:258,345; src/slices/today/Today.tsx:130; src/core/dates.ts:244-245; src/slices/body/Body.tsx:368; src/brain/coach/rules.ts:132,162`
- What the code does: solveHours returns null when pct is still under 90 at the 120 h cap. hoursLeft then becomes 0 (recovery.ts:345), while pct is low and recovering is true. Today prints formatHours(0) = 'under 1h'. The Body tile says 'under 1h left' / 'Ready in under 1h'. The muscle panel says 'When soreness eases' even when the muscle is not sore. The scheduled-conflict rule filters on hoursLeft > hoursAhead (rules.ts:162), so it skips exactly the most fatigued muscle.
- What is correct: A 'more than 120 h' state (for example hoursLeft null or capped with a flag) that every consumer shows as '5+ days' and that the conflict rule treats as not ready. Plan 6.11 point 5 caps the window at 120 h; it never says zero.
- Evidence: cap-probe.test.ts (novice, 3 hard days in a row): {pct 0, recovering true, hoursLeft 0, readyInHours null, windowHours 120, fullInHours null}. checker2-probe S1: readyGroupFor(...) -> {tileText 'under 1h left', detailText 'Ready in under 1h'}.
- User impact: The most fatigued muscle is shown as about to be ready, and the coach does not warn about training it.
- Source: plan-611; probes cap-probe.test.ts, checker2-probe.test.ts

### RECOVERY-F2 · Steady training reads as an overload spike for accounts 14 to about 20 days old
- Severity **high** · status **confirmed** · where `src/brain/recovery.ts:107-115,133-134; src/brain/readiness.ts:212-213; src/brain/progression.ts:245-247; src/slices/body/Body.tsx:58`
- What the code does: Once the oldest session in the window is 14+ days back, chronic load is still divided by 28 (recovery.ts:111). For steady training the ratio is about 28 / (days covered), so it stays above 1.3 up to about 20 days of history. The inflated ratio sets the systemic factor to 1.25 (every muscle recovers 25% slower), gives load score 0, and can turn readiness red / 'reduce'. Progression then holds load and drops a set. The comment at recovery.ts:103-105 says the guard exists to stop this new-account spike, but it only covers days 0-13. Decision BR-03 sets only the 14-day/3-session gate, not the divisor.
- What is correct: Divide chronic load by the days actually covered (min(28, days since the first session in the window + 1)), or return null until 28 days exist.
- Evidence: recovery-probe.test.ts: the same session every 2 days for 14 days gives 'ratio 2 systemic 1.25' and readiness {score 0, band red, loadAdvice reduce, drivers []}. The same pattern over 28 days gives ratio28 1.1428.
- User impact: New users who train steadily are told to back off, lose planned load increases, and see every muscle as 25% slower to recover.
- Source: dec-r3, remplan, gabbett2016; probe recovery-probe.test.ts

### RECOVERY-F3 · 'Mark as fresh' is undone by the next session
- Severity **high** · status **confirmed** · where `src/brain/recovery.ts:307-310,319-323`
- What the code does: The fresh mark is used only while it is later than the muscle's last dose (recovery.ts:308). After any new session, every dose from before the mark comes back into the 7-day stack (line 322) and into fRef (line 319).
- What is correct: Per plan 6.11 point 7, the mark 'sets the residual to zero': doses at or before the latest mark must never stack again.
- Evidence: recovery-probe.test.ts: 2 heavy squat days, then a mark gives 'fresh 100'. After 1 easy set the muscle reads 'after 1 easy set 39', against 'easy set alone 79'.
- User impact: After overriding a muscle as fresh, a light session makes it read far less recovered than it is, so the user is steered away from training it.
- Source: plan-611; probe recovery-probe.test.ts

### RECOVERY-F4 · Calibration ratchets tauScale up from measurement noise and never decays
- Severity **high** · status **confirmed** · where `src/brain/recovery.ts:371-377,389-420; src/data/recovery.ts:70-76`
- What the code does: Any e1RM drop of 5% or more while predicted pct is 85 or more multiplies tauScale by 1.1. For a lifter training a muscle twice a week, predicted pct at the next session is about 90, so the up-step is always armed. The down-step needs predicted pct of 65 or less, which a twice-weekly lifter rarely reaches. There is no noise margin and no decay toward 1.0. The rule matches plan 6.11 point 8, but the plan's own App D.1 says changes below two typical errors (2-5%) are noise.
- What is correct: Require a drop beyond noise (for example 2 or more typical errors, or confirmed over 2 sessions), and let tauScale decay slowly toward 1.0 when there is no evidence.
- Evidence: checker2-noise.test.ts, flat true strength, 3x5 squat to max every 3.5 days for a year, 9 runs with per-session load noise SD of 2-3%: final tauScale 1.100-1.600, 1-5 up-steps and 0 down-steps in every run. checker2-probe R29 at 4% noise: tauScale [1.21, 1.464, 1.6, 1.6 ...], 'ups 5 downs 0', predicted pct before the next session still 90. Limit: lifters who keep getting stronger will see fewer drops.
- User impact: Over months, lifters who rate sets as Max are told each muscle needs up to 60% more rest than the model would otherwise say.
- Source: plan-611, plan-appD, grgic2020; probes checker2-noise.test.ts, checker2-probe.test.ts

### RECOVERY-F5 · A second check-in on the same day wipes the first one's answers
- Severity **high** · status **confirmed** · where `src/slices/readiness/checkIn.ts:8; src/slices/workout/Train.tsx:873-876; src/app/App.tsx:68`
- What the code does: The sheet always starts with sleepQuality and mood undefined and soreness {} (Train.tsx:873-875), and always saves all three keys (line 876). saveCheckIn spreads the patch over the stored row, so undefined overwrites the earlier answers and the whole soreness map is replaced. The 'checkin' panel (App.tsx:68) can be opened again after a check-in exists.
- What is correct: Skip undefined keys and merge soreness per muscle, or pre-fill the sheet from today's row.
- Evidence: recovery-probe.test.ts: save {sleepQuality 4, mood 5, soreness {chest 2}}, then save {soreness {quads 4}} -> {sleepQuality undefined, mood undefined, soreness {quads 4}}.
- User impact: The user's own readiness answers are silently lost, which changes the readiness score and the soreness cap.
- Source: plan-64; probe recovery-probe.test.ts

### RECOVERY-F6 · Calibration treats weakness after a layoff as slow recovery
- Severity **medium** · status **confirmed** · where `src/brain/recovery.ts:404-412,248; src/slices/workout/session.ts:482`
- What the code does: The previous comparable session can be any age. After 7 days the predicted pct is always 100 (the floor at recovery.ts:248), so any 5% e1RM drop after a break steps tauScale up by 1.1 and counts an observation.
- What is correct: Calibrate only when the previous comparable session is within the model's 7-day window, where predicted pct is below the floor.
- Evidence: recovery-probe.test.ts: squat to max at 140 kg, then 120 kg after 35 days off -> {tauScale {quads 1.1}, observations {quads 1}}. I did not re-read Bosquet 2013. The logic stands without it: a drop after 5 weeks says nothing about a recovery time measured in hours.
- User impact: Coming back from a break makes the app say that muscle recovers 10% slower from then on.
- Source: plan-611, bosquet2013; probe recovery-probe.test.ts

### RECOVERY-F7 · A history edit or delete rebuilds a different tauScale than finish stored
- Severity **medium** · status **confirmed** · where `src/slices/workout/session.ts:32-38,50,52-66; src/slices/history/History.tsx:37; compare src/slices/workout/session.ts:482`
- What the code does: The rebuild gives each step only a 29-day or last-8-session window, and sets trainingSince to the 1st of the first session's month. finishSession used the full history. So fRef, novelty and training age differ, and the predicted pct can land on the other side of the 65/85 thresholds. QA-R2b-6 (session.ts:40-44) says the rebuild should learn from the same inputs as finish.
- What is correct: Give each replay step the same inputs finish had: the muscle's last 8 doses, full exposure counts and the real training start.
- Evidence: rebuild-probe.test.ts: predicted quads pct is 'full 44 window 78'. checker2-probe S11, same history: finish -> {tauScale {quads 0.92}, observations {quads 1}}, rebuildRecoveryModel -> {tauScale {}, observations {}}.
- User impact: Deleting or editing an unrelated session can silently erase or change what the app has learned about the user's recovery speed.
- Source: plan-611; probes rebuild-probe.test.ts, checker2-probe.test.ts

### RECOVERY-F8 · The readiness load score starts penalising at ratio 1.0, not 1.3
- Severity **medium** · status **confirmed** · where `src/brain/readiness.ts:212-213; compare src/brain/recovery.ts:134`
- What the code does: loadScore = clamp(1 - max(0, ratio - 1) / 0.5). A ratio of 1.2, inside Gabbett's low-risk 0.8-1.3 band, scores 0.6, and 1.5 scores 0. Decision P3 says this sub-score 'reuses the systemic factor's own ATL/CTL ratio-to-score mapping pattern', but the systemic factor starts only above 1.3 (recovery.ts:134). So the code does not match the decision either.
- What is correct: No penalty up to 1.3, falling to 0 at about 1.5 or more, on a corrected ratio (see F2).
- Evidence: checker2-probe R40: sessions every 4 days plus one extra this week -> ratio 1.333, readiness 33 / red / reduce / drivers []. By the formula, ratio 1.2 alone gives 60 = amber = no_increase.
- User impact: A normal small rise in training makes readiness amber or red, which blocks planned load increases.
- Source: gabbett2016, impellizzeri2020, dec-p3; probe checker2-probe.test.ts

### RECOVERY-F9 · Back-off advice comes from the band alone, so one input can say 'reduce'
- Severity **medium** · status **confirmed** · where `src/brain/readiness.ts:229-231`
- What the code does: loadAdvice depends only on the band (line 230). With 1 or 2 inputs present, one bad sub-score gives red / 'reduce'. Decision P3 says the plan's 'back-off only when 2+ inputs are worse than 1 SD' is approximated by the driver thresholds, but loadAdvice never reads the drivers. The missing hysteresis is a separate, explicit owner decision (P3) and is not questioned here.
- What is correct: 'reduce' only when 2 or more present inputs are past their driver thresholds; with fewer, at most 'no_increase'.
- Evidence: recovery-probe.test.ts S2 case, where load is the only input: {score 0, band red, loadAdvice reduce, drivers []}. checker2-probe R40: {33, red, reduce, drivers []}.
- User impact: The app tells the user to drop a set and hold load on the strength of a single signal.
- Source: plan-64, dec-p3, plan-appB; probes recovery-probe.test.ts, checker2-probe.test.ts

### RECOVERY-F10 · Load can turn readiness red with no reason, or with a false 'several signals' reason
- Severity **medium** · status **confirmed** · where `src/brain/readiness.ts:212-213,239; src/brain/coach/rules.ts:445`
- What the code does: The load sub-score never adds a driver. When it causes a red band, drivers is [] and the coach falls back to 'Several signals point the same way today.', even when there is only one signal.
- What is correct: Add a driver when the load score is low (for example 'training load jumped this week'), and never claim several signals when there is one.
- Evidence: recovery-probe.test.ts: red / reduce with drivers []. rules.ts:445 then uses the 'Several signals...' fallback.
- User impact: The user gets 'back off' advice with no reason, or with a reason that is not true.
- Source: plan-64; probe recovery-probe.test.ts

### RECOVERY-F11 · A flat check-in history hides a bad day
- Severity **medium** · status **confirmed** · where `src/brain/readiness.ts:54-59,143-153`
- What the code does: zScore returns 0 when the history SD is 0 (line 57), so today's answer scores a neutral 0.5 whatever it is. Decision P3 covers only the 3-value minimum and the raw fallback for missing history, not zero spread.
- What is correct: When SD is 0 or tiny, use a minimum SD (for example 0.5 rating points) or the raw-scale fallback.
- Evidence: recovery-probe.test.ts: mood always 3 in history -> 'const-hist mood1 50 mood3 50'. With no history, mood 1 -> 'no-history mood1 0'.
- User impact: Users who usually give the same rating never have a bad day counted.
- Source: dec-p3; probe recovery-probe.test.ts

### RECOVERY-F12 · The sleep sub-score has no 7 h floor, and its debt scale is much softer than the plan's
- Severity **medium** · status **confirmed** · where `src/brain/readiness.ts:164-177`
- What the code does: need = the user's own 14-day median, with no floor. Debt is scored as 1 - debt / (1.5 x need), where plan App B uses / 3 h. Decision P3 records only renormalising the 60/25 split, not these two changes.
- What is correct: need = max(7 h, personal typical) per AASM/SRS. s_debt = clamp(1 - debt / 3 h) per App B, or a recorded decision for the change.
- Evidence: checker2-probe: 14 nights of 5.5 h -> score 100, green. 3 nights of 6 h against an 8 h need -> 68, green (App B's formula gives about 53, amber).
- User impact: Chronic short sleepers and people in sleep debt are told they are fully ready.
- Source: aasm2015, plan-appB, dec-p3; probe checker2-probe.test.ts

### RECOVERY-F13 · 'Last night' is the single latest sleep session, not the night's total
- Severity **medium** · status **confirmed** · where `native/HealthConnectNativePlugin.java:300-305; src/native/health.ts:109-111`
- What the code does: The native read keeps only the latest-ending SleepSessionRecord from the last 48 h and discards the rest. That value is filed under the sync day.
- What is correct: Sum the sessions of the main overnight sleep that ends on the wake day (optionally leaving naps out).
- Evidence: Code read: the loop replaces sleepMinutes whenever r.getEndTime() is later (lines 300-305). Not run on a device.
- User impact: A nap after a full night can be read as last night's sleep, dragging down the sleep score and the systemic sleep factor.
- Source: plan-appA; code read

### RECOVERY-F14 · The resting-HR readiness delta is diluted and lags
- Severity **medium** · status **confirmed** · where `src/brain/readiness.ts:37-38,43-44,192-197`
- What the code does: delta = 7-day mean - 28-day mean, where the 28-day window contains the same 7 days. A +5 bpm week gives a delta of 3.75 and no driver. A sudden +8 bpm today barely moves it.
- What is correct: delta = today's resting HR - the baseline mean, with today excluded (plan App B: today - 7-day mean; +5 is the common flag).
- Evidence: checker2-probe R38: +5 bpm for 7 days after 3 flat weeks -> score 63, drivers []. Today +8 only -> 91, drivers [].
- User impact: Early signs of illness or overreaching are largely missed by readiness.
- Source: plan-appB, plan-appA, buchheit2014; probe checker2-probe.test.ts

### RECOVERY-F15 · One bad night can slow every muscle
- Severity **medium** · status **confirmed** · where `src/brain/recovery.ts:117,123-124`
- What the code does: The sleep factor uses the mean of however many nights exist in 7 days, with no minimum count. One short night as the only data, or one extreme night among good ones, gives x1.1.
- What is correct: Require 4 or more of 7 nights, and a multi-night deficit. Plan F2.4 and 6.11 say a single bad night changes nothing, and the code's own comment at line 117 says so too.
- Evidence: recovery-probe.test.ts: a single 300-min night -> systemicFactor 1.1. By arithmetic, six 7 h nights plus one 2 h night average 6.29 h, which is under 6.5.
- User impact: New Health Connect users, or anyone after one very short night, see every muscle's ready time pushed back about 10%.
- Source: plan-f, plan-611, dattilo2020; probe recovery-probe.test.ts

### RECOVERY-F16 · Recovery 'at' a past time uses later sessions
- Severity **medium** · status **confirmed** · where `src/brain/recovery.ts:305-310; src/escobar/tools/context.ts:35-38; src/escobar/tools/read.ts:229-236`
- What the code does: recoveryAt takes the last dose in the whole list, and the latest fresh mark, without filtering by `now`. The coach's get_recovery accepts any past `at` and passes all sessions.
- What is correct: Filter doses and fresh marks to at or before `now` before picking last and fresh.
- Evidence: recovery-probe.test.ts, evaluated 2 days before the latest session: lastTrainedAt = the later session, pct 82, hoursLeft 31.3, readyInHours [26.6, 36].
- User impact: The coach gets a wrong last-trained time and wrong ready times when it asks about the past.
- Source: probe recovery-probe.test.ts

### RECOVERY-F17 · HRR60 and rest-start HR are never recorded, so the heart.drift rule is dead
- Severity **medium** · status **confirmed** · where `src/slices/workout/session.ts:199; src/slices/workout/heart.ts:62-66; src/brain/heart.ts:117-124,148-149,253-255; src/slices/workout/Train.tsx:1055`
- What the code does: heartForSet is called only at commit, with setEnd = now, so no sample from 55-65 s after the set can exist yet, and nothing recomputes it later. hrr60Median is always empty (the finish card shows a dash), and intraSessionDrift can never report drifting. The formula would also be wrong if it ran: end bpm - median (not peak - median), with no 'peak >= RHR + 0.6 x reserve' gate.
- What is correct: Complete each set's heart data after 65 s (at the next commit or at finish), using peak - median(55-65 s) with the plan's intensity and quality gates (plan 6.4, App B, F1.1, F1.4).
- Evidence: recovery-probe.test.ts: heartForSet(60,121) -> {peakBpm 160, endBpm 160, restStartBpm undefined, hrr60 undefined}; intraSessionDrift(...) -> drifting false.
- User impact: A promised HR recovery number and the in-session fatigue warning never appear.
- Source: plan-f, plan-64, plan-appB, cole1999; probe recovery-probe.test.ts

### RECOVERY-F18 · The 'pre-set' heart rate for rest is really the end-of-set heart rate
- Severity **medium** · status **confirmed** · where `src/slices/workout/session.ts:201; src/slices/workout/heart.ts:48-54; src/brain/heart.ts:184-186`
- What the code does: startRest receives latestLiveBpm() at the moment the set is committed, which is the end-of-set HR. So min(preSet + 12, resting + 0.35 x reserve) almost always takes the reserve term, and the +12 term does nothing.
- What is correct: Record preSetBpm when the set starts (first input, or the end of the previous rest).
- Evidence: checker2-probe R63 (resting 60, max 190): restReadyBpm(150 end-of-set) -> 106. With a true pre-set of 85 -> 97.
- User impact: Heart-guided rest ends at a higher heart rate than intended for well-rested users, so rests are shorter.
- Source: plan-64, plan-f; probe checker2-probe.test.ts

### RECOVERY-F19 · A slow real live session is labelled 'compressed' and treated as retro
- Severity **medium** · status **confirmed** · where `src/brain/fidelity.ts:20-21,25-27,50; src/slices/workout/Train.tsx:438; src/brain/coach/post.ts:139-144`
- What the code does: 'burstShare' is really the share of all delayed sets, including gaps over 12 min, and 60% or more makes the session compressed. That turns it into mode retro, opens the 'when did you train?' sheet (Train.tsx:438) and drops the rest/density and duration insights (post.ts:143-144). Decision P1-R makes long gaps 'delayed' per set, but it does not say they count toward 'compressed'.
- What is correct: Per plan 6.17.2, count only burst commits (3+ within 15 s) toward the 60% compressed rule.
- Evidence: cap-probe.test.ts: 5 sets with 13-min gaps -> mode 'retro', flags ['compressed'], timingTrusted false.
- User impact: A genuine slow session asks the user when they trained, and loses its timing-based coaching.
- Source: plan-617, dec-p1r; probe cap-probe.test.ts

### RECOVERY-F20 · Soreness and 'Mark as fresh' never feed calibration
- Severity **medium** · status **confirmed** · where `src/brain/recovery.ts:389-420`
- What the code does: calibrateAfterSession learns only from max-to-max e1RM. Plan 6.11 point 7 says a soreness of 4-5 at the next session is a 'tau too short' observation and Mark as fresh is logged as an observation. Neither is used, and no decision records skipping them (grep of COACHING-DECISIONS.md).
- What is correct: Soreness 4-5 at the next session counts as 'tau too short'; Mark as fresh counts as 'tau too long'.
- Evidence: Code read: no checkIns or freshMarks input in calibrateAfterSession; its predicted() call passes checkIns: [] and freshMarks: [] (line 393).
- User impact: The user's own feedback never teaches the model, which matters most for people who rarely rate Max and for bodyweight work.
- Source: plan-611; code read

### RECOVERY-F21 · Calibration needs Max on both sessions and looks up exercises by id only
- Severity **low** · status **confirmed** · where `src/brain/recovery.ts:399-405; compare src/brain/recovery.ts:158`
- What the code does: Only exercises with a max-rated set in both this and the previous session calibrate. Ideal-rated work and bodyweight reps never do. Calibration finds exercises by id only, while doses also fall back to the name.
- What is correct: Matched effort including ideal (effort-adjusted e1RM, plan 6.4) and reps at the same load for bodyweight (plan 6.11 point 8), with the same id-or-name lookup as the dose path.
- Evidence: Code read: recovery.ts:403,405 check hasMax; line 399 is findExercise(ex.exerciseId) with no name fallback.
- User impact: Most users' recovery times never personalise, and renamed or legacy entries are skipped.
- Source: plan-611, plan-64; code read

### RECOVERY-F22 · The '6 hard sets' diminishing counts every touch and depends on exercise order
- Severity **low** · status **confirmed** · where `src/brain/recovery.ts:177-179`
- What the code does: Every working set that touches the muscle, in any role and at any effort, moves the counter, and the 0.7 applies from the 7th touch. So the same sets done in a different order give a different dose.
- What is correct: Plan 6.11: 0.7 only 'beyond the sixth hard set for the same muscle'. Count hard sets (not easy) where the muscle is primary, or weight by role.
- Evidence: checker2-probe R8: 6 easy squats + 3 max leg extensions -> quads dose 8.658. Leg extensions first -> 9.887.
- User impact: Direct hard work is discounted after easy or indirect sets, so recovery times depend on exercise order.
- Source: plan-611; probe checker2-probe.test.ts

### RECOVERY-F23 · The heavy-main bump makes a 3-5 rep set cost almost as much as an 8-rep set
- Severity **low** · status **confirmed** · where `src/core/exercises.ts:67-70; src/data/recovery.ts:10-14,31; src/brain/recovery.ts:174`
- What the code does: A main lift at 1-5 reps gets damage max(base, 1.15), and 0.8 x 1.15 = 0.92 against 1.0 for 6-10 reps. Correction to the claim: the 1.15 value is stated in plan 6.11 point 1, not uncited. But the plan's own App C.1-C.2 says heavy low-rep work short of failure recovers within about a day.
- What is correct: A plan change: drop the bump, or apply it only to max-effort sets.
- Evidence: checker2-probe R4: v*x for 3 reps 0.92, 5 reps 0.92, 8 reps 1.
- User impact: Heavy strength sessions are shown as needing about as long to recover as moderate-rep sessions.
- Source: plan-611, plan-appC, dec-p1r; probe checker2-probe.test.ts

### RECOVERY-F24 · Layoff novelty resets to the full 1.3 after only 28 days
- Severity **low** · status **confirmed** · where `src/brain/recovery.ts:180-182; src/data/recovery.ts:23-26`
- What the code does: A muscle not dosed for 28+ days gets the same 1.3 as a first-ever exposure. This matches plan 6.11 point 1 ('28+ days (repeated-bout effect)'). It is not in COACHING-DECISIONS.
- What is correct: A layoff threshold in months, or a factor that grows with the gap, keeping 1.3 for a never-trained muscle.
- Evidence: Nosaka 2001 abstract (Europe PMC, verified): the repeated-bout effect 'lasts at least 6 months but is lost between 9 and 12 months' (untrained male students, elbow flexors).
- User impact: A lifter back after a month away is shown as needing much longer to recover than they do.
- Source: nosaka2001, plan-611; abstract read

### RECOVERY-F25 · Muscle recovery priors rank hamstrings above arms and give small muscles a speed-up
- Severity **low** · status **confirmed** · where `src/data/muscles.ts:29-54`
- What the code does: Hamstrings and adductors are 1.2; biceps, triceps and brachialis are 1.1; calves, forearms, abs and core are 0.8. These match the plan 6.11 list exactly, but the plan's App C.5 says small-muscle fast recovery 'has no controlled support'.
- What is correct: Arms at or above hamstrings, both above quads, and no small-muscle discount (plan change).
- Evidence: Chen 2011 abstract (Europe PMC, verified): elbow flexors and extensors changed more than knee flexors, with no difference between the two arm muscles; knee flexors changed more than knee extensors (sedentary men).
- User impact: Arm recovery times are slightly short and calf/abs times slightly short, until calibration corrects them.
- Source: chen2011, plan-appC, plan-611; abstract read

### RECOVERY-F26 · A falling resting HR also slows recovery
- Severity **low** · status **confirmed** · where `src/brain/recovery.ts:130; compare src/brain/readiness.ts:195`
- What the code does: Math.abs means a 7-day resting HR 0.5 SD below baseline also gives x1.1. The plan's word 'outside' allows both directions. Readiness scores a drop as good, so the two parts disagree.
- What is correct: Only a rise above baseline slows recovery.
- Evidence: recovery-probe.test.ts: resting HR about 60 falling to 55 -> systemicFactor 1.1.
- User impact: Getting fitter can make the app say the user recovers 10% slower.
- Source: buchheit2014, plan-appC, plan-611; probe recovery-probe.test.ts

### RECOVERY-F27 · Soreness counts twice in readiness
- Severity **low** · status **confirmed** · where `src/brain/readiness.ts:138-151,181-183; src/brain/recovery.ts:326-328; src/app/selectors.ts:39`
- What the code does: Today's soreness of 4-5 lowers the check-in part (weight 0.35) and also caps those muscles at 60%, which feeds the recovery part (0.15). Both uses are in the plan (6.4 and 6.11 point 7), so this is a design interaction.
- What is correct: Leave soreness out of one of the two, for example remove the capped muscles' soreness from the check-in part.
- Evidence: Code read: selectors.ts:39 builds recovery with checkIns, and readiness then uses both.
- User impact: A sore day pushes readiness down more than the weights intend.
- Source: plan-64, plan-611, nosaka2002; code read

### RECOVERY-F28 · The HRV z-score uses a 7-day SD from as few as 2 values
- Severity **low** · status **confirmed** · where `src/brain/readiness.ts:40,48,199-208`
- What the code does: z = (today - 7-day mean) / 7-day SD, with 2+ values and today inside its own baseline. The comment says '>=14 values'. It is dormant: nothing writes lnRmssd (grep: only read.ts:363 reads it).
- What is correct: Per App B: SD over 60 days with at least 14 values, and at least 7 valid days.
- Evidence: Code read, readiness.ts:48 and :204. grep finds no writer of DailyHealth.lnRmssd.
- User impact: None today; once HRV data arrives, early readings would swing the score.
- Source: plan-appB, plews2013, plan-64; code read

### RECOVERY-F29 · Heart samples are not range- or jump-filtered
- Severity **low** · status **confirmed** · where `src/brain/heart.ts:37-45; native/watch/core/LiveSession.java:23`
- What the code does: Only contact === false and bpm <= 0 are dropped. There is no 30-220 bpm range and no jump limit of 15 bpm, in the app or in the native parser. Keeping unknown (null) contact is correct per App B. The comment 'contact=true only' is stale.
- What is correct: Drop samples outside 30-220 bpm and jumps over 15 bpm (plan 6.4 signalQuality).
- Evidence: Code read. observedHrMaxFromSeries needs a plateau, so a lone spike does not reach hrMax, but it does reach maxBpm, zones and kcal.
- User impact: An optical glitch can show a false max bpm and inflate zone time and calories.
- Source: plan-64, plan-appB; code read

### RECOVERY-F30 · Calorie estimate is biased low at partial coverage and skips time outside the samples
- Severity **low** · status **confirmed** · where `src/brain/energy.ts:61-69`
- What the code does: At quality 0.5-0.8, gross counts only the covered buckets, but resting kcal is subtracted over the whole first-to-last span. At any quality, time before the first and after the last sample is never filled.
- What is correct: Subtract resting kcal only over the minutes integrated. At quality 0.8 or more, fill all uncovered session time at the median rate (plan 6.10).
- Evidence: checker2-probe: 60% coverage over 60 min -> active 304, against 333 for the covered 36 min (full coverage 555). Watch joins 10 min late (quality 0.83) -> minutes 50, active 462.
- User impact: Session calories read about 10-17% low in these cases.
- Source: plan-610; probe checker2-probe.test.ts

### RECOVERY-F31 · Heart series stored for sessions that are never saved
- Severity **low** · status **confirmed** · where `src/slices/workout/heart.ts:70-73; src/slices/workout/session.ts:458,476; src/core/heartStore.ts:40-46`
- What the code does: storeSeries runs before the empty-series check, and before finishSession drops a session with no exercises. Orphan or empty entries take slots in the 60-series LRU cap.
- What is correct: Store only for a saved session with at least 1 bucket (plan 6.3).
- Evidence: Code read. Not probed: the test environment is 'node' with no localStorage.
- User impact: Real sessions' heart traces can be evicted early.
- Source: plan-63; code read

### RECOVERY-F32 · The coach's zones and HRmax ignore the observed max
- Severity **low** · status **confirmed** · where `src/escobar/tools/read.ts:373-381; src/escobar/knowledge/methods.ts:137-141`
- What the code does: The coach tools call hrMax(profile, null), so they report Tanaka, while methods.ts:137 tells the coach 'else your highest observed', and the session's zoneSec used the observed max. The rest-banner use of hrMax(profile) is an explicit owner decision (P2) and is not questioned.
- What is correct: The coach tools use bestObservedHrMax, like the finish path.
- Evidence: checker2-probe S15 (born 1990, observed 196): {bpm 196, source 'observed'} against the coach path {bpm 183, source 'tanaka'}.
- User impact: The coach quotes zone boundaries about 10 bpm off from the ones the session used.
- Source: dec-p1p2; probe checker2-probe.test.ts

### RECOVERY-F33 · hrMax says 'observed' when the value is the age formula
- Severity **low** · status **confirmed** · where `src/brain/heart.ts:28,30`
- What the code does: max(observed, Tanaka) is always labelled 'observed', even when Tanaka wins.
- What is correct: Label the source of whichever value wins (BR-12 keeps the higher value).
- Evidence: recovery-probe.test.ts: born 1996, observed 160 -> {bpm 187, source 'observed'}.
- User impact: The user and the coach are told a formula value was measured.
- Source: dec-r3, plan-64; probe recovery-probe.test.ts

### RECOVERY-F34 · The coach's drift reading mixes exercises
- Severity **low** · status **confirmed** · where `src/escobar/tools/read.ts:374-375; src/brain/heart.ts:242-247`
- What the code does: get_heart_session runs intraSessionDrift over every set of every exercise, but the function's contract is one exercise at one load (rules.ts:497-505 does filter). drifting is always false today (F17), but bpmRisePerSet is still reported.
- What is correct: Filter by exercise and load, as rules.ts does.
- Evidence: Code read.
- User impact: The coach sees a meaningless 'bpm rise per set' number.
- Source: plan-f; code read

### RECOVERY-F35 · 'Median' takes the upper-middle value for even counts
- Severity **low** · status **confirmed** · where `src/brain/recovery.ts:232; src/brain/readiness.ts:22; src/brain/heart.ts:48,81,149`
- What the code does: sorted[floor(n/2)] picks the higher middle value. For fRef with 2 doses, that is the larger dose, so pct reads higher.
- What is correct: The mean of the two middle values.
- Evidence: Code read.
- User impact: Small upward bias in recovery % and in the sleep need.
- Source: code read

### RECOVERY-F36 · The whole-body slowdown line gives no reason
- Severity **low** · status **confirmed** · where `src/slices/body/Body.tsx:48,58`
- What the code does: It shows only 'recovering about N% slower than usual this week'. Plan 6.11 surfaces show the cause ('sleep 6.1 h average').
- What is correct: Name the driver (sleep, resting HR or training load).
- Evidence: Code read. With F2, a steady new user sees '25% slower' with no cause.
- User impact: The user cannot tell why, or what to change.
- Source: plan-611; code read

### RECOVERY-F37 · No perceived-recovery question in the check-in
- Severity **low** · status **confirmed** · where `src/slices/workout/Train.tsx:865-876`
- What the code does: The check-in asks sleep quality, mood and soreness only. This matches F2.2, but the plan's App C.11 says soreness is a poor marker and perceived recovery is a good one.
- What is correct: Add one Perceived-Recovery-Status style rating, weighted above soreness (plan change).
- Evidence: Code read.
- User impact: Readiness leans on the weaker self-report signal.
- Source: laurent2011, nosaka2002, plan-appC; code read

### RECOVERY-F38 · Heart-guided rest can end a main lift's rest at 90 s, before the user's timer
- Severity **medium** · status **owner-decision** · where `src/brain/heart.ts:174-178,205-211; src/slices/workout/Train.tsx:1156`
- What the code does: done = timeDone || heartReady. The minimums are 60/90/120 s (plan 6.4 and App B). Decision P2 applies them to every set, and F1.2 makes the timer only a ceiling. Also, F1.2 says 'whichever is higher' but 6.4 says min; the code follows 6.4.
- What is correct: Research: for main lifts, HR should only extend rest, never go below about 2-3 min (App A.1 says the same).
- Evidence: Code read. Grgic 2018 and ACSM 2009 were not re-read by me; plan App A.1 states 'meta-analyses favour >= 2 min rests for strength, so HR should extend rest, never shorten it'.
- User impact: Strength sets can start after too short a rest in heart mode.
- Source: dec-p1p2, plan-64, plan-appA, plan-f, acsm2009, grgic2018; code read

### RECOVERY-F39 · Effort mismatch compares peaks across different exercises
- Severity **low** · status **owner-decision** · where `src/brain/heart.ts:226-235`
- What the code does: It flags easy sets whose peak is 90% or more of the highest peak among all rated sets in the session. Decision P2 explicitly chose 'the session's own hardest rated set'. Separately, the set window starts at the previous commit (session.ts:199), and plan App A.1 says wrist HR lags 5-15 s, so a set's peak may include the previous set's tail. The size of this effect is not verified on a device.
- What is correct: Research (App A.11): compare only within the same exercise or similar muscle mass.
- Evidence: checker2-probe R65: an easy leg set at 150 bpm against max curls at 130-132 -> {mismatched 1, rated 5, examplePct 100}.
- User impact: An honest 'easy' rating on a big-muscle exercise gets flagged as under-rated.
- Source: dec-p1p2, plan-appA, plan-f; probe checker2-probe.test.ts

## Not covered

- All 12 area files were read in full. No logic file in the area was skipped.
- Not verified: which night Health Connect sleep is filed under (the native side). readiness.ts:167 treats today's row as 'last night'. native/health.ts:52-68 takes the day from its caller, and I did not trace that caller.
- The places that display these values (Body.tsx, Today.tsx, the Escobar tools, coach rules) were only spot-checked where cited, not fully audited.
- Formula constants were checked against docs/COACHING-PLAN.md and the published formulas they name (Mifflin-St Jeor, Keytel 2005, Tanaka, Karvonen), which they match. The plan's heuristic thresholds (for example 0.35 reserve, +12 bpm, the tau priors) were not re-checked against the literature.
- The full test suite was not run. Only the scratch probes in tests/qa-scratch/recovery/ were run (3 files, 15 tests, all pass, which shows each suspected behaviour is present).
- No agents were spawned, so there is nothing to archive.

## Sources

- **plan-611** COACHING-PLAN 6.11 Muscle recovery model v2 — /home/user/marc-main/docs/COACHING-PLAN.md:452-501
- **plan-64** COACHING-PLAN 6.4 Brain additions (heart, readiness) — /home/user/marc-main/docs/COACHING-PLAN.md:325-368
- **plan-63** COACHING-PLAN 6.3 Live heart stream and storage — /home/user/marc-main/docs/COACHING-PLAN.md:319-323
- **plan-610** COACHING-PLAN 6.10 Energy — /home/user/marc-main/docs/COACHING-PLAN.md:423-450
- **plan-617** COACHING-PLAN 6.17.2 Fidelity classifier — /home/user/marc-main/docs/COACHING-PLAN.md:810-823
- **plan-f** COACHING-PLAN section 4, F1.1-F1.6 and F2.1-F2.5 — /home/user/marc-main/docs/COACHING-PLAN.md:175-190
- **plan-appA** COACHING-PLAN Appendix A (research behind features) — /home/user/marc-main/docs/COACHING-PLAN.md:935-954
- **plan-appB** COACHING-PLAN Appendix B (formulas and thresholds) — /home/user/marc-main/docs/COACHING-PLAN.md:956-978
- **plan-appC** COACHING-PLAN Appendix C (research behind recovery model) — /home/user/marc-main/docs/COACHING-PLAN.md:980-996
- **plan-appD** COACHING-PLAN Appendix D.1 (e1RM error) — /home/user/marc-main/docs/COACHING-PLAN.md:1000-1001
- **dec-p1r** COACHING-DECISIONS P1-R: damage list, fidelity gaps, load-ratio guard — /home/user/marc-main/docs/COACHING-DECISIONS.md:55-81
- **dec-p1p2** COACHING-DECISIONS P1/P2: nullable resting HR, observed max, minRest, effort mismatch, rest hrMax — /home/user/marc-main/docs/COACHING-DECISIONS.md:142-178
- **dec-p3** COACHING-DECISIONS P3 readiness: approximations, raw fallback, no hysteresis, back-off, target muscles — /home/user/marc-main/docs/COACHING-DECISIONS.md:194-215
- **dec-342** COACHING-DECISIONS: secondary role 0.55 — /home/user/marc-main/docs/COACHING-DECISIONS.md:342
- **dec-r3** COACHING-DECISIONS Remediation R3 (BR-02, BR-03/19, BR-12, BR-16, BR-17, BR-31) — /home/user/marc-main/docs/COACHING-DECISIONS.md:405-415
- **remplan** REMEDIATION-PLAN R3 rows (BR-02, BR-03, BR-12) — /home/user/marc-main/docs/REMEDIATION-PLAN.md:388-402
- **tanaka** Tanaka, Monahan, Seals 2001. Age-predicted maximal heart rate revisited. JACC — https://www.jacc.org/doi/abs/10.1016/s0735-1097(00)01054-8
- **keytel** Keytel et al. 2005. Prediction of energy expenditure from heart rate monitoring during submaximal exercise — https://pubmed.ncbi.nlm.nih.gov/15966347/
- **mifflin** Mifflin, St Jeor et al. 1990. A new predictive equation for resting energy expenditure. AJCN — https://ajcn.nutrition.org/article/S0002-9165(23)16698-6/fulltext
- **acsm2009** ACSM 2009 position stand. Progression models in resistance training for healthy adults — https://tourniquets.org/wp-content/uploads/PDFs/ACSM-Progression-models-in-resistance-training-for-healthy-adults-2009.pdf
- **garber2011** Garber et al. 2011 ACSM position stand (intensity classes by %HRR) — https://pubmed.ncbi.nlm.nih.gov/21694556/
- **grgic2018** Grgic et al. 2018. Effects of rest interval duration on muscular strength: systematic review — https://pubmed.ncbi.nlm.nih.gov/28933024/
- **hrrest** Heart-rate-determined rest intervals in hypertrophy-type resistance training — https://www.researchgate.net/publication/307726380_Heart_Rate_Determined_Rest_Intervals_In_Hypertrophy-Type_Resistance_Training
- **cole1999** Cole et al. 1999. Heart-rate recovery immediately after exercise as a predictor of mortality. NEJM — https://www.nejm.org/doi/full/10.1056/NEJM199910283411804
- **gabbett2016** Gabbett 2016. The training-injury prevention paradox (ACWR 0.8-1.3, spikes >1.5). BJSM — https://pubmed.ncbi.nlm.nih.gov/26758673/
- **acwr-coupling** Windt and Gabbett 2018 / Lolli 2019 on mathematical coupling in ACWR — https://www.researchgate.net/publication/325409606_Is_it_all_for_naught_What_does_mathematical_coupling_mean_for_acutechronic_workload_ratios
- **impellizzeri2020** Impellizzeri et al. 2020. Acute:Chronic Workload Ratio: conceptual issues and fundamental pitfalls — https://www.researchgate.net/publication/341936245_AcuteChronic_Workload_Ratio_Conceptual_Issues_and_Fundamental_Pitfalls
- **srpe** Haddad et al. 2017. Session-RPE method (Foster 2001: RPE x minutes) review — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5673663/
- **aasm2015** Watson et al. 2015. AASM/SRS consensus: adults need 7 or more hours of sleep — https://pubmed.ncbi.nlm.nih.gov/26039963/
- **dattilo2020** Dattilo et al. 2020. Sleep deprivation did not delay strength recovery after damaging exercise — https://pubmed.ncbi.nlm.nih.gov/31469710/
- **nosaka2001** Nosaka et al. 2001. How long does the repeated-bout protective effect last? (at least 6 months, lost by 9-12) — https://pubmed.ncbi.nlm.nih.gov/11528337/
- **nosaka2002** Nosaka, Newton, Sacco 2002. DOMS does not reflect the magnitude of muscle damage — https://pubmed.ncbi.nlm.nih.gov/12453160/
- **bosquet2013** Bosquet et al. 2013. Training cessation meta-analysis (strength loss significant from week 3) — https://pubmed.ncbi.nlm.nih.gov/23347054/
- **chen2011** Chen et al. 2011. Eccentric muscle damage among four limb muscles (elbow > knee; knee extensors least) — https://link.springer.com/article/10.1007/s00421-010-1648-7
- **moran2017** Moran-Navarro et al. 2017. Recovery after training to failure vs not — https://link.springer.com/article/10.1007/s00421-017-3725-7
- **plews2013** Plews et al. 2013. Training adaptation and HRV (7-day rolling lnRMSSD) — https://pubmed.ncbi.nlm.nih.gov/23852425/
- **buchheit2014** Buchheit 2014. Monitoring training status with HR measures — https://pmc.ncbi.nlm.nih.gov/articles/PMC3936188/
- **pelland** Pelland et al. Resistance training dose response (fractional set counting) — https://pubmed.ncbi.nlm.nih.gov/41343037/
- **laurent2011** Laurent et al. 2011. Perceived Recovery Status scale — https://journals.lww.com/nsca-jscr/fulltext/2011/03000/a_practical_approach_to_monitoring_recovery_.7.aspx
- **grgic2020** Grgic et al. 2020. Test-retest reliability of 1RM (median CV 4.2%) — https://vuir.vu.edu.au/41955/1/s40798-020-00260-z.pdf