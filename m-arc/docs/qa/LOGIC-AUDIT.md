# Whole-app logic audit (QA-L1), 2026-09-27

Base: main 5f282d7 at audit start (the checker's probes ran on it). Method: for each of 8 areas a checker mapped what the code does, a researcher said what is correct (sources cited), each cross-checked the other, then a completeness critic looked for what was missed. Findings only; nothing was fixed. 25 agents, about 4.9M tokens, 2 h 15 min.

| Area | Rules judged | Correct | Questionable | Wrong | Unverifiable | Findings (high / medium / low) |
|---|---|---|---|---|---|---|
| Progression, targets, loads and units (`progression`) | 55 | 32 | 13 | 7 | 3 | 30 (3 / 12 / 15) |
| Recovery, readiness, fatigue and heart (`recovery`) | 74 | 45 | 19 | 8 | 2 | 39 (5 / 16 / 18) |
| Volume, trends, stats, history and body (`volume`) | 46 | 15 | 16 | 12 | 3 | 25 (1 / 10 / 14) |
| Dates, time zones, weeks, sessions and live logging (`dates`) | 50 | 28 | 15 | 7 | 0 | 30 (1 / 8 / 21) |
| Data, storage, migrations, backup and the exercise catalogue (`data`) | 64 | 46 | 15 | 3 | 0 | 30 (0 / 12 / 18) |
| Coach brain: rules, cues, pre/live/post and weekly review (`coachrules`) | 48 | 20 | 8 | 19 | 1 | 36 (3 / 20 / 13) |
| Escobar coach tools, context and the Worker (`escobar`) | 74 | 44 | 26 | 4 | 0 | 31 (2 / 12 / 17) |
| Share cards, profile, onboarding, health and watch data (`share`) | 44 | 31 | 8 | 5 | 0 | 19 (0 / 12 / 7) |
| **All** | 455 | 261 | 120 | 65 | 9 | 240 (15 / 102 / 123) |

Status values: confirmed = both agents agree it is wrong; refuted = raised, then shown not wrong; owner-decision = works as coded but the rule itself needs the owner's call.

## High findings (the ones that change what the user is told)

- **PROGRESSION-F1** Lighter-week sessions become the base for every later target: loads compound down inside the week and do not come back after — `src/brain/progression.ts:161-162,218,224,241`. One lighter week can leave a lifter about 30% below their pre-week loads, and they then have to earn it back rep by rep over several weeks.
- **PROGRESSION-F2** The plateau detector calls normally progressing lifts 'plateaued' — `src/brain/trend.ts:131,177-201; used at src/brain/progression.ts:270,291, src/brain/deload.ts:243-249, src/brain/coach/r`. Lifters who progress at a normal intermediate pace are told the lift has stalled and are offered a lighter week they do not need, which then triggers F1.
- **PROGRESSION-F3** One heavy top set sets the load for every target set — `src/brain/history.ts:32-34; src/brain/progression.ts:241-242,258-261,295-296`. A lifter who did one heavy single, or a heavier first set, is told to do every set at that load for more reps, which they cannot do safely.
- **RECOVERY-F1** A muscle that cannot reach 90% within 120 h shows 'under 1h' to go — `src/brain/recovery.ts:258,345; src/slices/today/Today.tsx:130; src/core/dates.ts:244-245; src/slices/body/Body.tsx:368; `. The most fatigued muscle is shown as about to be ready, and the coach does not warn about training it.
- **RECOVERY-F2** Steady training reads as an overload spike for accounts 14 to about 20 days old — `src/brain/recovery.ts:107-115,133-134; src/brain/readiness.ts:212-213; src/brain/progression.ts:245-247; src/slices/body`. New users who train steadily are told to back off, lose planned load increases, and see every muscle as 25% slower to recover.
- **RECOVERY-F3** 'Mark as fresh' is undone by the next session — `src/brain/recovery.ts:307-310,319-323`. After overriding a muscle as fresh, a light session makes it read far less recovered than it is, so the user is steered away from training it.
- **RECOVERY-F4** Calibration ratchets tauScale up from measurement noise and never decays — `src/brain/recovery.ts:371-377,389-420; src/data/recovery.ts:70-76`. Over months, lifters who rate sets as Max are told each muscle needs up to 60% more rest than the model would otherwise say.
- **RECOVERY-F5** A second check-in on the same day wipes the first one's answers — `src/slices/readiness/checkIn.ts:8; src/slices/workout/Train.tsx:873-876; src/app/App.tsx:68`. The user's own readiness answers are silently lost, which changes the readiness score and the soreness cap.
- **VOLUME-F1** Slow real progress, or 17 days at one load, reads as a plateau: a 'stalled' note and a lighter-week offer — `src/brain/trend.ts:32 (flat when under 1%/week), :79-80 (only a session count, no time span), :90-101; src/brain/deload.`. A lifter who is steadily progressing is told their lift has stalled and is offered a lighter week.
- **DATES-F1** A forgotten Finish saves a 12-hour, timing-trusted live session — `src/slices/workout/session.ts:445,454-465; src/brain/fidelity.ts:25-27; src/brain/recovery.ts:97,107-114,134,220; src/br`. One forgotten Finish records a 12-hour workout and makes every recovery estimate about 25% slower for a week.
- **COACHRULES-F1** Normal progress is labelled 'flat' or 'stalled' — `src/brain/trend.ts:32-33,78-101; src/brain/coach/weeklyReview.ts:249-256; src/brain/coach/rules.ts:191-224`. Lifters who are progressing normally are told they have stalled and to change their training.
- **COACHRULES-F2** Acute-load ratio alone drives red readiness, false copy, held loads and a deload offer — `src/brain/readiness.ts:212-231; src/brain/coach/rules.ts:437-469,597-624; src/brain/deload.ts:70-71; src/brain/progressi`. A lifter who simply trains more often is told to back off, gets lower targets and is offered a lighter week, based on false claims about signals.
- **COACHRULES-F3** Implausible sets (typos) feed records and next targets — `src/brain/fidelity.ts:144-154 (only called by src/escobar/tools/read.ts:178); src/brain/prs.ts:59-78; src/brain/progress`. One typo becomes a 'personal best' and sets next session's load 30% too heavy.
- **ESCOBAR-F1** Body weight and heart data reach the model through coach-note text when sharing is off — `src/brain/coach/rules.ts:356,484,510; src/brain/coach/weeklyReview.ts:344; src/escobar/context/brief.ts:101; src/escobar`. A person who kept body and health sharing off still has their weight and heart data sent to the AI service.
- **ESCOBAR-F2** Minor flag misses 17-year-olds whose birthday is still to come this year — `src/brain/recovery.ts:79-81; src/escobar/context/brief.ts:105,128`. Some 17-year-olds can get maximal-effort programming that the safety rules forbid for minors.

## Medium findings

- **PROGRESSION-F4** The lighter week's own sessions count as stall evidence, so a new lighter week is offered the day after one ends (confirmed)
- **PROGRESSION-F5** Lower loads after a lighter week read as 'declining', which blocks increases and has no end date (confirmed)
- **PROGRESSION-F6** Set cuts from a lighter week or red readiness never reach the Train screen's set rows (confirmed)
- **PROGRESSION-F7** The step-down is one small step, however far below the rep range the lifter is (confirmed)
- **PROGRESSION-F9** A drop set or failure set at max blocks every increase; the growth goal's one-clean-top rule is missing; drop sets add target sets (confirmed)
- **PROGRESSION-F10** Red readiness is ignored for bodyweight, assisted and conditioning moves (confirmed)
- **PROGRESSION-F11** A lighter week for bodyweight moves asks for the last best reps, labelled 'easy' (confirmed)
- **PROGRESSION-F12** On amber days, the reason wrongly blames muscle recovery (confirmed)
- **PROGRESSION-F13** The Coach insight sheet ignores readiness, recovery and today's load change (confirmed)
- **PROGRESSION-F14** Changing only the effort label can create a Strength record (confirmed)
- **PROGRESSION-F15** Default equipment profiles change loads for kettlebells, EZ bars, landmines and 2.5-step machines (confirmed)
- **PROGRESSION-F16** After any break over 28 days, the return target is 100% of the old load (confirmed)
- **RECOVERY-F6** Calibration treats weakness after a layoff as slow recovery (confirmed)
- **RECOVERY-F7** A history edit or delete rebuilds a different tauScale than finish stored (confirmed)
- **RECOVERY-F8** The readiness load score starts penalising at ratio 1.0, not 1.3 (confirmed)
- **RECOVERY-F9** Back-off advice comes from the band alone, so one input can say 'reduce' (confirmed)
- **RECOVERY-F10** Load can turn readiness red with no reason, or with a false 'several signals' reason (confirmed)
- **RECOVERY-F11** A flat check-in history hides a bad day (confirmed)
- **RECOVERY-F12** The sleep sub-score has no 7 h floor, and its debt scale is much softer than the plan's (confirmed)
- **RECOVERY-F13** 'Last night' is the single latest sleep session, not the night's total (confirmed)
- **RECOVERY-F14** The resting-HR readiness delta is diluted and lags (confirmed)
- **RECOVERY-F15** One bad night can slow every muscle (confirmed)
- **RECOVERY-F16** Recovery 'at' a past time uses later sessions (confirmed)
- **RECOVERY-F17** HRR60 and rest-start HR are never recorded, so the heart.drift rule is dead (confirmed)
- **RECOVERY-F18** The 'pre-set' heart rate for rest is really the end-of-set heart rate (confirmed)
- **RECOVERY-F19** A slow real live session is labelled 'compressed' and treated as retro (confirmed)
- **RECOVERY-F20** Soreness and 'Mark as fresh' never feed calibration (confirmed)
- **RECOVERY-F38** Heart-guided rest can end a main lift's rest at 90 s, before the user's timer (owner-decision)
- **VOLUME-F2** Holds and fixed-rep conditioning lifts always count as 'plateaued' toward the lighter-week offer (confirmed)
- **VOLUME-F3** Assisted lifts: reaching zero assistance reads as a decline (confirmed)
- **VOLUME-F4** The trend label on a weighted lift mixes e1RM with volume and ignores the line's window and comeback breaks (confirmed)
- **VOLUME-F5** The progress sparkline plots mixed units, and its labels are raw kg (negative for assisted lifts) (confirmed)
- **VOLUME-F6** The Exercise progress card has no proper stats for holds and carries (confirmed)
- **VOLUME-F7** Two set counts give opposite volume advice for the same muscle in the same week (confirmed)
- **VOLUME-F8** The band for new users calls a standard first week of 3x3 squats 'over' and advises trimming (confirmed)
- **VOLUME-F9** 'Under' can never fire for people who train fewer than 3 times a week, and warm-up-only sessions count toward a full week (confirmed)
- **VOLUME-F10** Training level reaches 'Advanced' in about 15 weeks and never decays, which lifts the band (confirmed)
- **VOLUME-F11** The 'Best' hint for an assisted exercise shows the session with the MOST assistance (confirmed)
- **DATES-F2** Saved duration includes paused time; the finish sheet does not (confirmed)
- **DATES-F3** Pre-filled warm-ups count as 'live' sets and can make untrusted timing 'trusted' (confirmed)
- **DATES-F4** Retro timing can land in the future; the past-session defaults already do (confirmed)
- **DATES-F5** Rest seconds include the next set's own time and any pause (confirmed)
- **DATES-F6** A workout in progress does not stop today's training reminder (confirmed)
- **DATES-F7** One missed scheduled day ends the streak (confirmed)
- **DATES-F8** Duplicate sessions are not detected (confirmed)
- **DATES-F9** Compressed sessions calibrate recovery on the logging time, and fixing the time does not update the model (confirmed)
- **DATA-F1** A restored file with a wrong-type list can crash the Today screen on every start (confirmed)
- **DATA-F2** Exercise search finds nothing for common plural words (confirmed)
- **DATA-F3** Role comes from the movement pattern only, so accessories and jumps become main lifts (confirmed)
- **DATA-F4** Resistance-band exercises are treated as weighted (confirmed)
- **DATA-F5** Conditioning sets count as muscle-building sets (confirmed)
- **DATA-F6** Hamstrings get secondary credit from squats, leg presses and lunges; adductors get none (confirmed)
- **DATA-F7** An exercise's profile from another gym overrides this gym's own equipment setup (confirmed)
- **DATA-F8** Old-app import: the body card's default 'male' overrides the profile sex, and the body card's height is dropped (confirmed)
- **DATA-F9** The app never asks for persistent storage (confirmed)
- **DATA-F10** No warning or plan for the localStorage size limit (confirmed)
- **DATA-F11** The app cannot restore its own rescue file (confirmed)
- **DATA-F12** Finishing a workout drops the note on an exercise that has no filled set (confirmed)
- **COACHRULES-F4** Weekly review reads the unfinished current week and rarely appears (confirmed)
- **COACHRULES-F5** Autoregulation steps from the target, not the load lifted (confirmed)
- **COACHRULES-F6** Autoregulation drop after a big miss is 2.5%, not 5% (confirmed)
- **COACHRULES-F7** Autoregulation can suggest more load on a deload, amber or red day (confirmed)
- **COACHRULES-F8** Deload sessions read as decline and bring the lighter-week offer back (confirmed)
- **COACHRULES-F9** Any recovery note hides all lift notes on that muscle, even when snoozed (confirmed)
- **COACHRULES-F10** 'Push is done for today' when Push was not done (confirmed)
- **COACHRULES-F11** Snoozing a mild readiness note also hides a later red one (confirmed)
- **COACHRULES-F12** Plateau lever reads effort from other exercises and lacks sleep and weight levers (confirmed)
- **COACHRULES-F13** Adherence counts days before the person started as missed (confirmed)
- **COACHRULES-F14** Frequency note claims all sets were in one session when they were not (confirmed)
- **COACHRULES-F15** Weight trend is shown however old the weigh-ins are (confirmed)
- **COACHRULES-F16** Weekly 'under its usual range' flags a partial week, secondary-only muscles, not the lowest (confirmed)
- **COACHRULES-F17** Pace note can only ever say 'faster than typical' (confirmed)
- **COACHRULES-F18** Pre-session brief drops the 60+ note and warm-up on full-body days (confirmed)
- **COACHRULES-F19** e1RM 'new record' counts easy-rated sets (confirmed)
- **COACHRULES-F20** Rest advice pools rests across lifts; strength_muscle judged at 90 s (confirmed)
- **COACHRULES-F21** Effort drift 'harder at the same load' fires while load rises (confirmed)
- **COACHRULES-F22** Re-entry repeats the last load after any gap length (confirmed)
- **COACHRULES-F23** Deload trigger fires on any one condition, with no history minimum or novice exclusion (owner-decision)
- **ESCOBAR-F3** Day-bound proposals applied the next day land on the wrong day (confirmed)
- **ESCOBAR-F4** Assisted lifts: 'best', top set and e1RM use assistance kg (confirmed)
- **ESCOBAR-F5** calculate e1rm adds 2 reps in reserve when effort is missing, and does not say so (confirmed)
- **ESCOBAR-F6** get_live_session times are wrong while the session is paused (confirmed)
- **ESCOBAR-F7** Recovery 'at' times are echoed in UTC without a Z, and past times are accepted (confirmed)
- **ESCOBAR-F8** Spending guards let requests through when they fail (confirmed)
- **ESCOBAR-F9** No daily budget for input tokens (confirmed)
- **ESCOBAR-F10** Knowledge cards: protein_timing contradicts its source; some statement numbers can never be verified (confirmed)
- **ESCOBAR-F11** get_session flags normal sets as implausible after a light day, and flags assisted and bodyweight sets (confirmed)
- **ESCOBAR-F12** Heart zones in get_heart_session may not match the zones the session was bucketed with (confirmed)
- **ESCOBAR-F13** BMI for under-18s is given with adult cut-offs only (confirmed)
- **ESCOBAR-F14** lift_trend e1RM chart mixes in top kg for sets over 10 reps (confirmed)
- **SHARE-F1** Typed body weight has no plausible range, and calories use it raw (confirmed)
- **SHARE-F2** The onboarding and review form skips the 10% weight typo guard (confirmed)
- **SHARE-F3** Saving the form with the weight untouched logs a new weigh-in, and in lb it also shifts the stored weight (confirmed)
- **SHARE-F4** Closing the 'Add my details' form counts as completing onboarding (confirmed)
- **SHARE-F5** The onboarding sheet disappears mid-form when the last missing field is committed (confirmed)
- **SHARE-F6** A complete profile with no lastReviewAt never gets the 90-day 'Still accurate?' review (confirmed)
- **SHARE-F7** Health Connect files an old sleep session or resting heart rate under today, and readiness can count it twice (confirmed)
- **SHARE-F8** Sleep minutes are the in-bed span of the newest session, not the total sleep of the main night (confirmed)
- **SHARE-F9** One Connect tap can show two permission dialogs (confirmed)
- **SHARE-F10** The 400-entry weight-log cap silently changes old sessions' body weight and card volume (confirmed)
- **SHARE-F11** Adult-only formulas are applied from age 10 (confirmed)
- **SHARE-F12** The onboarding form shows 'Male' selected when sex was never saved (confirmed)

## Owner decisions (works as coded; the rule needs your call)

- **PROGRESSION-F19** Duration holds skip the lighter week: No lighter week for 'duration' mode.
- **PROGRESSION-F20** Keep-the-load modes snap to the nearest equipment step: Hold, confirm, reentry, plateau and start snap to the nearest step, with ties going lighter.
- **PROGRESSION-F21** Snapping up to the equipment breaks the 10% increase cap: The cap limits the raw step, then the snap goes up to the next rung.
- **RECOVERY-F38** Heart-guided rest can end a main lift's rest at 90 s, before the user's timer: done = timeDone || heartReady. The minimums are 60/90/120 s (plan 6.4 and App B). Decision P2 applies them to every set, and F1.2 makes the timer only a ceiling. Also, F1.2 says 'whichever is higher' but 6.4 says min; the code follows 6.4.
- **RECOVERY-F39** Effort mismatch compares peaks across different exercises: It flags easy sets whose peak is 90% or more of the highest peak among all rated sets in the session. Decision P2 explicitly chose 'the session's own hardest rated set'. Separately, the set window starts at the previous commit (session.ts:199), and plan App A.1 says wrist HR lags 5-15 s, so a set's 
- **COACHRULES-F23** Deload trigger fires on any one condition, with no history minimum or novice exclusion: Any one of (a) 2 lifts plateaued/declining by plateauStatus, (b) drift + rising volume, (c) over band + stall, (d) 3 of 5 red days fires the offer; no 4-week history minimum or training-age check.
- **COACHRULES-F24** Heart effort-mismatch and drift rules follow F1.3/F1.4, not Appendix B: Drift: 3+ sets at the same kg, peak rise >= 8 bpm/set, last HRR60 below first; advice 'trim an accessory or two'. Mismatch: one easy set at >= 90% of session peak among 5+ rated sets.

## Not audited (gaps the critic found)

- Client cost estimate and price table never read — `src/escobar/state.ts:56-93 (PRICES, estimateCost), used at src/escobar/loop.ts:476, src/escobar/session.ts:179, src/escobar/ui/SettingsSecti`. Why it matters: This is the owner's view of AI spending. A wrong price or token formula gives a wrong spend figure, and no area checked it.
- Escobar loop body not audited: the outbound payload builder, the automatic retry and the repair round — `src/escobar/loop.ts:354 (toRequestMessages with the sharing flag), 357-396 (retry on upstream_busy/timeout), 431-508 (grounding repair). The`. Why it matters: Privacy: this code decides what leaves the phone when sharing is off, and ESCOBAR-F1 already shows leaks. Cost: each retry or repair is another paid call.
- The grounding and safety checker was read only in part — `src/escobar/verify.ts (only lines 120-140 read): checkGrounding, safetySignals, parseDirectives`. Why it matters: It is the only guard that the numbers in the coach's answer come from tool facts. Unit and rounding matching in it is unchecked.
- Escobar session: memory writes, transport choice and usage totals — `src/escobar/session.ts (only 150-175 read); devMode() picks the mock transport at 86-92`. Why it matters: Stored memory (injuries) is saved user data. If devMode can be on in a release build, users get mock answers. Usage and cost add up here.
- How the conversation store is cleaned and saved — `src/escobar/store.ts: sanitizeStore / saveStore. The data area read only export/restore/clear, and escobar did not read it`. Why it matters: This covers conversation and memory integrity after a restore and when storage is full. It interacts with the localStorage limit (DATA-F10).
- Photo capture and image store never read — `src/native/photo.ts (pickAndCompressPhoto), src/escobar/images.ts`. Why it matters: This covers photo size and image-token cost, and whether metadata such as location is stripped before a photo goes to the paid API (privacy).
- SSE transport and error mapping never read — `src/escobar/transport.ts (parseSse 29-76, httpTransport 77-108, checkHealth 109+)`. Why it matters: A parse error can drop or duplicate answer text or tool events. The error codes it returns decide whether loop.ts retries, which costs money.
- In-app navigation targets and panel params — `src/escobar/palace/registry.ts, src/escobar/palace/navigate.ts:36 (resolvePanelParams), src/app/router.ts:41 (validatePanelParams)`. Why it matters: find_in_app scoring and deep-link params are unaudited. An unknown exercise or session id could open the wrong panel or an empty one.
- Plan-mode routing regex and starter prompts — `src/escobar/ui/prompts.ts:16-17 (PLAN_REQUEST), 27-71 (starterChips, dockPromptFor, contextRefFor)`. Why it matters: The regex picks plan mode, which changes the tool set and the cost. The chips read readiness.
- Proposal Apply/Undo UI path — `src/escobar/ui/Message.tsx:100-130 (UNDO_WINDOW_MS timer, act apply/dismiss/undo), src/escobar/ui/PlanBoard.tsx`. Why it matters: apply.ts was audited, but not which proposal the UI applies, or undo timing across app restarts.
- Split management beyond create and saveCustomExercise — `src/slices/workout/splits.ts:20-83 (addTemplates, deleteSplit 32-39, setFocus, addExerciseToSplit, MAX_SPLITS); deleteSplit is also called f`. Why it matters: deleteSplit clears the schedule but its effect on an active session's splitId and on reminders was not checked. Escobar can call it.
- Train screen split editor and in-session sheets only skimmed — `src/slices/workout/Train.tsx:293-346 (CreateSplit, SplitEditor), 811-919 (SuspectChip, SubstituteSheet, CheckInSheet, PreSessionSheet)`. Why it matters: SuspectChip is the typo guard for implausible sets (COACHRULES-F3 shows typos reach records). SubstituteSheet swaps exercises mid-session, which affects history and targets.
- Coach screen: schedule editor, goal change and insight feedback — `src/slices/coach/Coach.tsx:1-138 and 144-200 (feedbackTap 'snoozed' at 66, applyGoalRest at 130, schedule writes at 179-185)`. Why it matters: The schedule drives the streak, week grade, reminders and adherence. A goal change drives rep ranges and rest. Only lines 139-143 and 201-230 were read.
- App reset and rescue from the error screen — `src/app/ErrorBoundary.tsx:13-31 (saveRescueCopy, resetAppData)`. Why it matters: Unaudited: what reset wipes (localStorage and IndexedDB: heart series, Escobar conversations) and what the rescue copy holds. Risk of data loss.
- Muscle map colour thresholds — `src/ui/MuscleMap.tsx:27-79 (fillFor)`. Why it matters: It turns recovery % into 'ready' or 'not ready' colours. It may disagree with the 90% rule used in the text (see RECOVERY-F1).
- Warm-up load maths: no area reports checking it — `src/brain/coach/pre.ts:39 (roundToStep(loadForReps(...))), 57-60 (warmupOffer, shared by the brief, Train and Escobar)`. Why it matters: coachrules read pre.ts, but no rule or finding covers the warm-up numbers. The progression area explicitly left pre.ts out.
- The balance numbers and the balance.imbalance rule were never checked together — `src/brain/balance.ts (read by recovery, no findings); src/brain/coach/rules.ts:226-229 (read by coachrules, which did not read balance.ts)`. Why it matters: The ratio, severity and context shown to the user in the imbalance note are unaudited end to end.
- Backup success is recorded whatever the export outcome — `src/native/share.ts:7 (exportText) not read; src/slices/settings/Settings.tsx:98-99 sets lastBackupAt after exportText`. Why it matters: If exportText resolves on a cancelled or failed save, the backup reminder is silenced with no backup made. Unverified.
- Remaining Settings rows and the watch settings sheet — `src/slices/settings/Settings.tsx:145-241 (unit switch 157, rest default 160), src/slices/settings/Watch.tsx, src/slices/settings/HealthDiagn`. Why it matters: The unit switch and the rest-default bounds are only partly checked. Watch.tsx writes preferences.watch (it is not a watch-agent-owned file).
- App update reload and back button during a live workout — `src/app/swUpdate.ts, src/main.tsx:70-84 ('App updated' reload), src/native/back.ts:13 (handleBack)`. Why it matters: A reload or a back press while a number field is still being edited could drop the typed value. Unverified, low priority.
- Escobar loadFactor stacked on an active lighter week — `Listed as not covered by progression; related to DATA-F19 (a saved today-plan keeps its load factor)`. Why it matters: Two cuts could multiply and give a far-too-light target. Still unverified.
- History merge by exercise name — `src/brain/history.ts:85 with findByName in src/core/exercises.ts`. Why it matters: The volume area flagged it and no area checked it. Fuzzy name matching could merge two different exercises into one history, which corrupts targets, records and trends.
- Findings not cross-checked against recorded owner decisions — `docs/COACHING-DECISIONS.md sections P0, P0-P, P1-R, P1 and Escobar v2 (coachrules read only P2-C to P4 and R3; progression cited no decision`. Why it matters: Some 'confirmed' findings may be decided behaviour. The documented privacy and cost rules were not checked against the code.
- Bodyweight-load spec never read — `docs/F13-BODYWEIGHT-LOAD.md (469 lines)`. Why it matters: The bodyweight and assisted findings (PROGRESSION-F10, F11, F30; VOLUME-F3, F16; ESCOBAR-F4) were judged without the spec that defines the intended rules.
- No dedupe against earlier QA work — `docs/qa/findings.json, docs/qa/LIVE-QA*.md, docs/qa/FIX-GUIDE.md, docs/QA-REGRESSION-AUDIT.md, docs/REMEDIATION-PROGRESS.md, docs/ERROR-REPO`. Why it matters: Findings may repeat known, accepted or in-progress issues, or reopen fixed ones without saying so.
- Unverified numbers against sources — `Recovery and readiness thresholds (0.35 reserve, +12 bpm, tau priors); src/data/knowledge.json card numbers (checked from memory); Navy body`. Why it matters: The no-guessing rule: these numbers are shown to the user as advice or fact and were not checked against primary sources.
- Content checked by script only — `src/data/coachCues.json (422 cue texts), src/data/exercises.json (per-entry muscles and patterns)`. Why it matters: The cue wording is advice. The muscle lists drive volume and recovery. Neither was reviewed entry by entry.
- No full test run on the audited commit — `npm test, npm run test:tz, escobar-worker tests (no node_modules), tests/escobar/tools-sync.test.ts (worker tools.generated.json vs schema.t`. Why it matters: The baseline pass or fail on 5f282d7 is unknown, and so is which existing tests lock in the wrong behaviour the findings describe.
- Device-only checks outstanding — `native/HealthConnectNativePlugin.java (partly read; which night's sleep a row is filed under), Android time-picker clearing (DATES-S4), Capa`. Why it matters: These need a real phone. Their findings rest on code reading only.
- Flow: one lift's next target across every surface — `suggestNext is called at Train.tsx:270, 520, 901; Coach.tsx:142; escobar/tools/show.ts:178; read.ts:218, 402, 455, with different planned-se`. Why it matters: The same lift on the same day may show different loads or sets in Train, Coach, the pre-session brief and Escobar's get_next_target. PROGRESSION-F13 covers only the Coach sheet.
- Flow: a session crossing midnight or a week boundary — `Session.day is fixed at save from trainedAt (src/core/models.ts:167); trainedTodaySessions uses endedAt (src/core/dates.ts:84-86); recovery `. Why it matters: A Sunday 23:30-00:40 session was not followed through weekly volume, week grade, deload triggers, weekly review, streak, share period cards and CSV. It may count in different weeks on different screens.
- Flow: one lb user's set end to end — `parseLoad/enteredLoad (core/parse.ts, core/units.ts, ui/primitives.tsx:6-7) -> stored kg -> progression step and equipment snap -> Train, Hi`. Why it matters: Each area checked one piece. Rounding drift or mixed units on any single surface is still possible.
- Flow: editing or deleting a past session — `src/slices/history/History.tsx:28 (deleteSeries) -> records, targets, recovery calibration (RECOVERY-F7), weekly review, Escobar memory, led`. Why it matters: Derived state and Escobar references may go stale after an edit or delete.
- Flow: Escobar proposal -> apply -> next start-up repair — `src/escobar/apply.ts -> store -> src/core/migrate.ts repair (DATA-F20, F25, F26 show gaps in repair)`. Why it matters: Data written by an applied proposal was never checked against the start-up repair rules, so it could be silently changed or rejected on the next launch.
- Flow: custom exercises through the brain — `Every findExercise / lookup call that omits customExercises (VOLUME-F23 found some memos that omit it)`. Why it matters: No census of call sites exists. A custom lift may be missing from volume, recovery, progression mode, share cards or Escobar answers.
- Flow: backup restore -> derived stores — `src/slices/settings/Settings.tsx:23, 119-133 (restoreHeart, applyRestore) -> recovery calibration state, Escobar store, reminder resync`. Why it matters: The restore path was audited, but not what happens next. Reminders and the calibration model may stay stale after a restore.
- Flow: one red-readiness day across all surfaces — `readiness -> load factor -> Train targets -> autoregulation -> Today card -> pre brief -> reminder text -> Escobar (pieces: PROGRESSION-F10/`. Why it matters: No single-day trace checks that every surface gives the same advice.
- Flow: heart data from watch or Health Connect to its outputs — `src/native/watch.ts / src/native/health.ts -> src/core/heartStore.ts -> rest timer, calories (src/brain/energy.ts) -> share card and get_hea`. Why it matters: Unfiltered samples (RECOVERY-F29) and partial coverage (RECOVERY-F30) were not followed into the share-card calories or the Escobar output.
- Flow: profile change to every derived number — `Profile/Onboarding (src/slices/profile/*) -> energy, HR zones, volume bands, rep ranges, Escobar minor flag and BMI, profileHistory`. Why it matters: A changed age, sex, weight or goal was not traced to every number that depends on it. SHARE-F19 shows cleared fields are not recorded.

Per-area detail (every finding with what the code does, what is correct, evidence and sources): `docs/qa/logic-audit/<area>.md` (the same files are in Relay as `qa/LOGIC-AUDIT.md`).
