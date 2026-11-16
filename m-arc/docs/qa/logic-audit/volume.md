# Logic audit · Volume, trends, stats, history and body (`volume`)

Rules judged: 46 · verdicts: {"questionable": 16, "correct": 15, "wrong": 12, "unverifiable": 3}. Part of `qa/LOGIC-AUDIT.md` (QA-L1, 2026-09-27).

## Findings

### VOLUME-F1 · Slow real progress, or 17 days at one load, reads as a plateau: a 'stalled' note and a lighter-week offer
- Severity **high** · status **confirmed** · where `src/brain/trend.ts:32 (flat when under 1%/week), :79-80 (only a session count, no time span), :90-101; src/brain/deload.ts:42-47; src/brain/coach/rules.ts:209-222`
- What the code does: trend() calls anything under 1% a week 'flat'. plateauStatus needs 7 of the last 8 sessions but no minimum time span. +2.5 kg every 3 weeks (0.81%/week, +5% over the window) gives 'plateaued' at medium confidence. The coach then says 'has not moved over your last eight sessions' (false), and two such main lifts trigger the lighter-week offer. The same happens after 8 sessions in 17 days at one load.
- What is correct: Call a lift flat only under about 1.5% total change over 8 weeks (BR-04, DECISIONS:410) or ±2.5% over 42 days (PLAN:642), and only when the sessions span 42+ days, as the lever already does (PLATEAU_MIN_SPAN_DAYS, rules.ts:30). PLAN:642 and :659 list 'plateau from 2 flat weeks' and 'plateau at 3 weeks' as nevers. Trained lifters gain about 0.2% a week (LATELLA20).
- Evidence: checker2.test.ts C1: notes 'plateau:lib_barbell_bench_press | progress has stalled | has not moved over your last eight sessions', and deloadOffer {suggest:true, reason:'Two or more main lifts have plateaued...'}. researcher-check R1: 'topKg trend flat 0.0081 {plateaued, medium}'. Researcher R18 (8 sessions, 17 days): '{plateaued, medium}' x2 and deload suggest:true.
- User impact: A lifter who is steadily progressing is told their lift has stalled and is offered a lighter week.
- Source: Claims VOLUME-R16, R18, R20 (weighted part), M1. Sources: LATELLA20, KRAEMER-RATES, PLAN, DECISIONS, SCRATCH. Note: BR-04 is at DECISIONS:410, not :409.

### VOLUME-F2 · Holds and fixed-rep conditioning lifts always count as 'plateaued' toward the lighter-week offer
- Severity **medium** · status **confirmed** · where `src/brain/trend.ts:90-101 (the weighted branch uses topKg and a volume made of reps); src/brain/deload.ts:42-45 (counts 'plateaued' at any confidence); src/brain/coach/rules.ts:209-222`
- What the code does: A hold has topKg 0 and volume 0, so both trends are unknown and the result is always 'plateaued' (low). The lift can still improve, for example a wall sit gaining 10 s a week. lib_wall_sit, lib_box_jump and lib_jump_squat all have role 'main'. deloadTrigger counts the hold whatever its confidence, so a truly flat bench plus an improving wall sit gives the offer, while the bench alone does not. Box jumps and jump squats at fixed reps read 'plateaued' at MEDIUM confidence: both 'progress has stalled' notes appear and the offer fires.
- What is correct: For holds, judge by the longest hold (as liftTrend does). For conditioning with no load, return 'unknown' rather than 'plateaued'. Only count a lift toward the offer when its status is not low confidence.
- Evidence: volume-audit S4: plank +10 s/week gives {plateaued, low}, while liftTrend says up. checker2 C3: 'bench only {suggest:false}', 'with wall sit {suggest:true}'. C2: roles 'lib_box_jump:main:conditioning', 'lib_jump_squat:main:conditioning'; plateau {plateaued, medium} x2; deload suggest:true; notes 'lib_box_jump: progress has stalled', 'lib_jump_squat: progress has stalled'.
- User impact: An improving plank or wall sit, or plyometric work at fixed reps, can make the app offer a lighter week and say progress has stalled.
- Source: Claims VOLUME-S4, R20 (duration part). SCRATCH (d).

### VOLUME-F3 · Assisted lifts: reaching zero assistance reads as a decline
- Severity **medium** · status **confirmed** · where `src/brain/trend.ts:18 (drops values of 0 and below), :48-51, :82-88; src/brain/coach/rules.ts:192-206`
- What the code does: Sessions with no help drop out of the help trend. The help then reads flat, so reps decide, and bodyweight-only reps are lower. Example: 10 kg of help for 8 reps, then no help for 4-6 reps. The History label says 'down' (Slipping), plateauStatus says 'declining' at medium confidence, and the coach says 'progress has slipped: stop short of max effort for a week'. lib_assisted_pull_up is a main lift, so this also counts toward the lighter-week offer.
- What is correct: Treat 0 help as the best help value, or trend the effective load (body weight x share - help) when body weight is known (F13).
- Evidence: volume-audit S3: liftTrend 'down', plateauStatus {declining, medium}. checker2 C12: role 'main', label 'down', note 'lib_assisted_pull_up: progress has slipped | Keep the load, stop short of max effort for a week...'.
- User impact: A user who no longer needs assistance, which is the goal of the exercise, is told their progress has slipped.
- Source: Claims VOLUME-R17 (zero-help part), R19, S2. Source F13; DECISIONS:409 (BR-06: less help is progress).

### VOLUME-F4 · The trend label on a weighted lift mixes e1RM with volume and ignores the line's window and comeback breaks
- Severity **medium** · status **confirmed** · where `src/slices/history/progressTrend.ts:12; src/brain/history.ts:46-47; src/brain/trend.ts:42-54 (no sinceLastBreak); src/slices/history/History.tsx:459,464,505`
- What the code does: Each point is bestE1rm (about 100) or, when every set is over 10 reps, volume (thousands). The regression covers the full history, while the line shows the last 12 sessions. Neither progressTrend nor liftTrend cuts at a break, although the comment at trend.ts:67 says it should. Moving from 60x12 to 80-87.5x8 gives 'Slipping' while the line rises. 24 rising sessions then 12 falling ones give 'Steady' (high confidence). A 5-week break followed by 80, 82.5, 85, 87.5 kg gives 'Slipping'.
- What is correct: One metric per series (e1RM from sets of 10 reps or fewer; skip sessions without one), over the same last-12 window as the line, after sinceLastBreak.
- Evidence: volume-audit S1: points [2160,2160,2160,2160,106.7,110,113.3,116.7], dir 'down', line rising. S2: 'full flat high, last12 down'. checker2 C9: 'progressTrend down, liftTrend down, plateau {unknown, low}'.
- User impact: The History card can say 'Slipping' while the user's lift is rising, or 'Steady' while it falls.
- Source: Claims VOLUME-R23, R17 (comeback part), S1, S3. Source PLAN:597,642.

### VOLUME-F5 · The progress sparkline plots mixed units, and its labels are raw kg (negative for assisted lifts)
- Severity **medium** · status **confirmed** · where `src/slices/history/progressTrend.ts:20-24; src/slices/history/History.tsx:505; src/ui/Sparkline.tsx:9,97,115-116`
- What the code does: progressValue uses bestE1rm, else topKg, else bestReps. Sessions whose sets are all over 10 reps plot raw load, and the others plot e1RM, so the line jumps from 60 to 106.7 on a change of rep range. Sparkline prints the raw values with fmt() and no conversion or unit. An lb user sees kg numbers, and an assisted lift shows labels such as '-20'. The readout above the line does convert (lastTopStats).
- What is correct: Plot the same single metric as the trend. Convert to the display unit and label it. Plot the help for assisted lifts on an inverted axis, or plot the effective load, and never show negative labels.
- Evidence: volume-audit S1 line: [60,60,60,60,106.7,110,113.3,116.7]. Code: Sparkline.tsx:9 `fmt = v => String(Math.round(v*10)/10)`, used at :97 (aria) and :115-116 (min/max). History.tsx:505 passes progressValue with no kgToDisplay.
- User impact: lb users read kg numbers on the chart with no unit, and the line can show a jump in strength that never happened.
- Source: Claims VOLUME-R24, R38, S5.

### VOLUME-F6 · The Exercise progress card has no proper stats for holds and carries
- Severity **medium** · status **confirmed** · where `src/brain/bodyweight.ts:100-105 (lastTopStats); src/slices/history/progressTrend.ts:11-12,32; src/slices/history/History.tsx:460,478-479,507-508`
- What the code does: lastTopStats sends every mode except bodyweight and assisted to formatLoad(topKg) and topReps. A plank shows 'last top load 0 kg', 'reps at top 0', and the readout '0 kg × 0'. A carry shows 'x kg × 0'. Conditioning uses the e1RM/volume trend. A carry has no reps, so both are 0 and the label stays 'Early' forever while the line (topKg) rises. The hint says the trend uses a one-rep strength score.
- What is correct: Mode-specific stats: the best hold for duration, and load with distance or time for carries and sleds. A trend on that metric, with a hint that matches it.
- Evidence: volume-audit S5: lastTopStats(plank) = {load:'0 kg', reps:0}. S6: farmer's carry direction 'unknown' while the line is [30,35,...,65].
- User impact: Plank and carry users see '0 kg × 0' and a trend that never appears, however much they improve.
- Source: Claims VOLUME-R30, S6, S7. The rule location in R30 (bodyweight.ts:255-260) is wrong; the code is at bodyweight.ts:100-105.

### VOLUME-F7 · Two set counts give opposite volume advice for the same muscle in the same week
- Severity **medium** · status **confirmed** · where `src/brain/volume.ts:42 via src/brain/exposure.ts:108 (countEasy defaults to true); src/brain/coach/weeklyReview.ts:20-31,186-201; src/brain/coach/rules.ts:277-296`
- What the code does: The volume status counts easy sets and judges them against level bands. The weekly review counts only hard sets and judges them against fixed bands (under 4 is low). Take a new user in a 5-session week with 3 hard and 6 easy chest sets. The coach note says 'Chest: over your usual range, trim a set or two', and the weekly review says 'Chest is under its usual range, add one more hard set'.
- What is correct: One count and one band scale for every volume verdict: hard sets, easy excluded (PLAN:640 says never count easy sets; BR-16 at DECISIONS:412 defines hard sets).
- Evidence: checker2 C4: status {chest, over, thisWeekSets 9, band [4,8]}; coach 'Chest: over your usual range | Trim a set or two for chest next week.'; review 'Chest is under its usual range | ... Chest 3 ... hard sets this week. | Add one more hard set for chest...'.
- User impact: The Coach screen tells the same user to trim chest sets and to add chest sets in the same week.
- Source: Claims VOLUME-R6, M2. Sources PLAN, ROBINSON24, DECISIONS, PELLAND25.

### VOLUME-F8 · The band for new users calls a standard first week of 3x3 squats 'over' and advises trimming
- Severity **medium** · status **confirmed** · where `src/data/volume.ts:8-21; src/brain/volume.ts:11-15,53-55; src/brain/coach/rules.ts:277-296`
- What the code does: The New band is 4-8 sets. Three sessions of 3 squat sets give quads 9 sets, which reads 'over', and the coach says 'Quads has 9 effective sets this week already; your range is 4–8. Trim a set or two for quads next week.' The numbers come from the owner's plan (PLAN:195). The Elite/Master clamp is DECISIONS:239. The lower-back, side-delt and calf offsets have no cited source.
- What is correct: Keep the owner's bands, but do not give an 'over' note for normal novice volume, for example no 'over' below about 10 sets. Research shows a graded dose-response with no ceiling near 8 sets (SCHOENFELD17, PELLAND25), and ACSM novice programmes reach about 9 sets. Changing the numbers needs the owner, because PLAN:640 itself asks for a lower band top in the first year.
- Evidence: researcher-check R2: 'quads:over:9:4,8'. checker2 C11: 'Quads: over your usual range | Quads has 9 effective sets this week already; your range is 4–8. | Trim a set or two for quads next week.'
- User impact: A beginner following a standard programme is told in week 1 to cut sets they need.
- Source: Claim VOLUME-R2. Sources PLAN, DECISIONS, SCHOENFELD17, PELLAND25, ACSM09.

### VOLUME-F9 · 'Under' can never fire for people who train fewer than 3 times a week, and warm-up-only sessions count toward a full week
- Severity **medium** · status **confirmed** · where `src/brain/volume.ts:9,46-47,55`
- What the code does: A past week is 'full' only with 3+ sessions of any kind. On a 2-day plan, chest at 2 sets a week against a 4-8 band stays 'in' forever, and Escobar receives status 'in'. Sessions that hold only warm-ups count toward the 3: one real session plus two warm-up-only sessions turns 'in' into 'under'. The 3-session rule is written in PLAN:640 (not in DECISIONS), and plannedThisWeek exists (weekly.ts:87).
- What is correct: Count only sessions with working sets (hasWorkingSets). Treat a week as full when it reaches the user's planned count (3 with no plan), which needs owner sign-off because PLAN:640 says 3.
- Evidence: volume-audit S10: {chest, status 'in', lastWeekSets 2, band [4,8]}. checker2 C6: 'chest status without warm-up sessions in, with under'.
- User impact: Someone on a normal 2-day programme is never told a muscle is well under its range.
- Source: Claims VOLUME-R1, S11. Sources PLAN, ACSM09.

### VOLUME-F10 · Training level reaches 'Advanced' in about 15 weeks and never decays, which lifts the band
- Severity **medium** · status **confirmed** · where `src/brain/exposure.ts:10,136-155; src/brain/volume.ts:43,52`
- What the code does: Level is an all-time score with no date limit. 12 bench sets a week (chest is the only primary) reaches 180, 'Advanced', in 15 weeks. After that, 10 sets a week over two full weeks read 'under' against 12-20. After a 6-month break the band stays 12-20, so 6 sets on return read 'under'. The thresholds cite no source. ACSM puts advanced at years of training, not weeks.
- What is correct: Calibrate levels to training time, or add a time floor per level. Discount the level after a long break (the app already has COMEBACK_GAP_DAYS for lifts).
- Evidence: checker2 C5: chest after 15 weeks {score 180, level 'Advanced'}; status {under, lastWeekSets 10, band [12,20]}; comeback status {under, lastWeekSets 6, band [12,20]}.
- User impact: After a few months, or on return from a long break, the user is labelled Advanced and told to add sets they may not be ready for.
- Source: Claims VOLUME-R7, R3. Sources ACSM09, SCHOENFELD17.

### VOLUME-F11 · The 'Best' hint for an assisted exercise shows the session with the MOST assistance
- Severity **medium** · status **confirmed** · where `src/slices/body/Body.tsx:335-340`
- What the code does: bestEverHint picks the highest topKg. For assisted moves topKg is the machine's help, so 'Best 40 kg assist × 8' is the easiest session. trend.ts:48-51 and lastTopStats (bodyweight.ts:100-105) both treat less help as better.
- What is correct: For assisted moves, pick the least help (or the highest effective load).
- Evidence: Code trace: Body.tsx:338 `b.topKg > a.topKg ... ? b : a`, then :339 modeLoadText({kg: best.topKg}, mode) gives '<kg> assist'. No mode branch.
- User impact: The muscle panel shows the user's weakest assisted session as their best.
- Source: Claims VOLUME-R43, S8. Source DECISIONS:409 (BR-06).

### VOLUME-F12 · 'medianSets' is the upper-middle value, not the median
- Severity **low** · status **confirmed** · where `src/brain/volume.ts:17-21,51,57; src/escobar/tools/read.ts:282`
- What the code does: With 4 weekly values it returns s[2]. Weeks of 1, 2, 3 and 4 sets give 3 instead of 2.5, and the value includes the unfinished current week. Escobar receives it as medianSets. The status ignoring the median is not a defect: BR-07 (DECISIONS:411) judges on the band alone.
- What is correct: (s[1]+s[2])/2, over completed weeks (NIST-MEDIAN).
- Evidence: checker2 C7: {thisWeekSets 4, lastWeekSets 3, medianSets 3} for weeks 1,2,3,4.
- User impact: Escobar is given a 'median' that is higher than the real one.
- Source: Claims VOLUME-R5, S14. Sources NIST-MEDIAN, DECISIONS.

### VOLUME-F13 · Warm-up-only sessions count as workouts, and the session card counts warm-ups as sets
- Severity **low** · status **confirmed** · where `src/brain/weekly.ts:56,60; src/slices/history/History.tsx:74,174; src/slices/workout/session.ts:448 (finish keeps any filled set, warm-ups included)`
- What the code does: A session with only warm-ups is saved and counts toward workouts and the week grade. One real session plus two warm-up-only sessions reads 'Strong week' with 1 set. The session card sums every set, warm-ups included, while Stats counts working sets. The streak (weekly.ts:97) counts only working sets.
- What is correct: Count only sessions with working sets (hasWorkingSets). Show working sets on the card, or 'N sets + M warm-ups'.
- Evidence: checker2 C6: weekSummary {workouts 3, sets 1, grade 'Strong week'}.
- User impact: Screens disagree on workout and set counts, and a week of warm-ups can be graded 'Strong'.
- Source: Claims VOLUME-R10, R32, S20.

### VOLUME-F14 · The week-grade note is fixed text and wrong for high targets
- Severity **low** · status **confirmed** · where `src/brain/weekly.ts:66; shown at src/slices/coach/Coach.tsx:54`
- What the code does: With a target of 6 and 2 workouts, it says 'One or two more sessions makes this a full week' when 4 more are needed.
- What is correct: Work the count out from the target minus workouts.
- Evidence: volume-audit S8: {title 'Building momentum', note 'One or two more sessions makes this a full week.'} for target 6 and 2 workouts.
- User impact: A user planning 5-6 sessions is told they are closer to a full week than they are.
- Source: Claims VOLUME-R11, S12. DECISIONS:418 (BR-22).

### VOLUME-F15 · With no schedule, every rest day breaks the streak, days off included
- Severity **low** · status **confirmed** · where `src/brain/weekly.ts:96-111 (the break at :107); shown at src/slices/today/Today.tsx:55`
- What the code does: Without a schedule, any untrained past day ends the streak. Someone training Mon, Wed and Fri for 4 weeks has a streak of 1 on Friday. A logged day off also breaks it, which contradicts the comment at :103.
- What is correct: With no schedule, count the streak in weeks, or allow rest days. A day off never breaks it (PLAN:647 lists a reset for one miss as a never).
- Evidence: checker2 C8: streak 1 for Mon/Wed/Fri over 4 weeks. volume-audit S9: Mon trained, Tue off, Wed trained gives 1.
- User impact: The Today streak chip never grows for someone training 3 days a week without a schedule.
- Source: Claims VOLUME-R13, S13. Sources ACSM09, PLAN.

### VOLUME-F16 · The effort bars count 0 for loaded bodyweight sets that week volume counts
- Severity **low** · status **confirmed** · where `src/ui/EffortBars.tsx:26-39; src/slices/history/History.tsx:465-468; src/brain/weekly.ts:24-26`
- What the code does: For bodyweight and assisted moves, effortSplit uses only bwAt, and null counts as 0. With no body weight saved, or for a custom bodyweight move with no share, a pull-up at +20 kg for 3x5 adds 300 kg to week volume but 0 to the bars. The comment says the bars follow 'the same rule Stats uses'.
- What is correct: Use workingTotals' fallback: added kg x reps when the effective load is unknown (for non-assisted moves).
- Evidence: volume-audit S7: workingTotals {sets 3, volumeKg 300}; effortSplit {easy 0, ideal 0, max 0, unrated 0}.
- User impact: The effort chart for weighted pull-ups or dips can be empty while Stats shows the work.
- Source: Claims VOLUME-R36, S10. Source F13.

### VOLUME-F17 · Effort-bar totals add a 't' suffix next to the kg or lb unit
- Severity **low** · status **confirmed** · where `src/ui/EffortBars.tsx:52,83,96`
- What the code does: fmtTotal writes '12.3t' for 10000 or more, and the hint then appends the unit: 'Most work: 12.3t kg'. For lb users the value is thousands of pounds but carries the tonnes suffix: '12.3t lb'. Stats and the weekly chart use 't' or 'k lb' correctly (History.tsx:412,486).
- What is correct: '12.3 t' for kg and '12.3k lb' for lb, with no double unit.
- Evidence: Code trace: EffortBars.tsx:52 `${...}t`; :96 `{fmtTotal(...)} {isSets ? 'sets' : unit}`; History.tsx passes unit u and lb-converted values.
- User impact: lb users see pounds labelled as tonnes.
- Source: Claims VOLUME-R37, S9.

### VOLUME-F18 · The volume average and the week-on-week muscle change compare unlike periods
- Severity **low** · status **confirmed** · where `src/slices/history/History.tsx:411-413,488-489`
- What the code does: The average covers all 12 weeks, including empty weeks before the first session and the unfinished current week. The muscle change compares this unfinished week with last week's full total and shows a warning colour when it is lower.
- What is correct: Average completed weeks from the first trained week. Compare against last week up to the same weekday, or show no direction until the week ends.
- Evidence: Code trace: :413 `values.reduce(...)/values.length` over 12 weeks; :489 `v >= prev ? 'positive-text' : 'warning-text'`, where v is this week so far.
- User impact: A new user's average is pulled down, and every Monday shows a red 'decline'.
- Source: Claims VOLUME-R26, R28, S18.

### VOLUME-F19 · The Body 'This week' list shows zero bars, never shows 'under', and hides its empty message
- Severity **low** · status **confirmed** · where `src/slices/body/Body.tsx:39,88,93`
- What the code does: Rows are muscles with any sets in 4 weeks, so a Monday lists every muscle at 0 while 'No sets logged this week yet.' is hidden. Bars below the band are the same green as in-band bars, and the computed 'under' status is never shown.
- What is correct: Mark 'under' differently. Hide zero rows, or show the empty message when this week has nothing.
- Evidence: Code trace: :39 filter(status !== 'unknown'); :88 warning only if > band[1], else positive; :93 message only when the list is empty.
- User impact: Being under the range looks the same as being in it, and a new week shows a list of empty bars.
- Source: Claims VOLUME-R40, S16.

### VOLUME-F20 · The session editor turns out-of-range reps or time into 0, and save then deletes the set
- Severity **low** · status **confirmed** · where `src/slices/history/History.tsx:285,306-307,314; src/core/parse.ts:31-32`
- What the code does: More than 100 reps or more than 3600 s becomes 0 (the field shows 0), and save drops the set through hasEntry. It is not fully silent: the field shows 0 and a hint says 'Sets with 0 reps are removed on save' (:314). Train uses the same parsers (Train.tsx:702,706), so values above these limits cannot be logged anywhere.
- What is correct: Reject out-of-range input visibly and keep the old value, or raise the limits. Never drop a set on a typo.
- Evidence: Code trace: :307 `reps: parseReps(v) ?? 0`; parse.ts:31 integerIn(1,100); :285 `sets.filter(hasEntry)`.
- User impact: A typo while editing (for example '1000' for '10') can delete a logged set.
- Source: Claims VOLUME-R33, S15.

### VOLUME-F21 · Per-session 'volume' adds kg×reps and plain reps together
- Severity **low** · status **confirmed** · where `src/brain/history.ts:46; used by src/brain/trend.ts:91 and src/slices/history/progressTrend.ts:12`
- What the code does: A loaded set adds kg×reps and an unloaded set adds its reps, so a session that mixes the two sums different units. This feeds the plateau volume trend and the weighted trend fallback.
- What is correct: Volume load = kg × reps only (MCBRIDE09). Track unloaded reps separately.
- Evidence: Code trace: history.ts:46 `(kg > 0 ? kg*reps : reps)`.
- User impact: The plateau and trend checks can move because the mix of loaded and unloaded sets changed, not because the lifting did.
- Source: Claims VOLUME-R21, S21. Source MCBRIDE09.

### VOLUME-F22 · Saving a body-fat reading stores a stray hip value and shifts the height
- Severity **low** · status **confirmed** · where `src/slices/body/Body.tsx:452,457,468`
- What the code does: A hip typed before switching to Male is still saved as hipCm; the male formula ignores it. For inch users, the profile height is rewritten from the rounded inch field: 180 cm shows as 70.9 in and is saved as 180.1 cm, even when the user did not edit it.
- What is correct: Save hip for women only, and write height only when the user changed it.
- Evidence: checker2 C10: shown 70.9, saved 180.1. Code: :468 `hipCm: Number.isFinite(cm(hip)) ? ...` with no sex check.
- User impact: The profile height drifts slightly and male readings carry an unused hip value.
- Source: Claims VOLUME-R46, S19. Source NAVY-DOD (DECISIONS:405 BR-01 matches cm storage).

### VOLUME-F23 · Some memos leave out customExercises (little practical effect)
- Severity **low** · status **confirmed** · where `src/slices/body/Body.tsx:35-36; src/slices/history/History.tsx:450`
- What the code does: The levels, week-set and records memos depend on sessions only, while volumeStatus (Body.tsx:39) includes customExercises. The claimed trigger, editing a custom exercise, does not exist: the picker only creates new ones with new ids (ExercisePicker.tsx:19-23). The only path I found is Escobar's undo, which removes a just-added custom exercise (escobar/apply.ts:179).
- What is correct: Add s.customExercises to these dependency lists.
- Evidence: Code trace: Body.tsx:35 `[s.sessions]`; :36 `[s.sessions, today.value]`; History.tsx:450 `[s.sessions, u]`.
- User impact: Rarely, levels or records could show stale values until the next session is logged.
- Source: Claim VOLUME-S17.

### VOLUME-F24 · The body-fat form does not say where to measure
- Severity **low** · status **confirmed** · where `src/slices/body/Body.tsx:482-488`
- What the code does: The labels are just 'Neck', 'Waist' and 'Hip' with the unit. There is no site guidance (men's waist at the navel; women's waist at the narrowest point and hip at the widest). Part of the claim is refuted: the form already says 'Typically within 3 to 4 points of lab methods' (:488), and the card says 'Track the trend, not one reading'. The result is shown to 0.1% (bodyfat.ts:19).
- What is correct: Add a one-line site guide per field, as the Hodgdon-Beckett sites require (NAVY-DOD).
- Evidence: Code trace: Body.tsx:483-485 field labels; :488 accuracy hint.
- User impact: Measuring at the wrong height can shift the estimate by several points.
- Source: Claim VOLUME-M3. Source NAVY-DOD.

### VOLUME-F25 · No check for a sudden jump in a muscle's weekly sets
- Severity **low** · status **confirmed** · where `src/brain (absent)`
- What the code does: Nothing flags a muscle's weekly sets above 1.5x its 4-week mean. The only 'spike' matches in src/brain are unrelated (heart.ts:55, recovery.ts:105). acuteChronicRatio (recovery.ts:107) tracks whole-body session load, not per-muscle sets.
- What is correct: Flag weekly hard sets per muscle above 1.5x the 4-week mean (PLAN:640).
- Evidence: grep of src/brain for 'spike|1.5 *|* 1.5' finds only heart.ts:55, readiness.ts:171 and recovery.ts:105, none of them per muscle.
- User impact: A sudden jump in volume for a muscle gets no warning, although the plan asks for one.
- Source: Claim VOLUME-M4. Source PLAN.

## Not covered

- src/brain/recovery.ts and the ready-time helpers in src/core/dates.ts past line 140 (readyGroupFor, readyDayWindow, formatFullBy, dayOrToday). Body.tsx calls them, but they belong to the recovery area. Body rules R41, R42 and R44 only record how Body uses their outputs.
- src/core/exercises.ts findByName/normalizeName: fuzzy name matching not read in full, so I have not checked whether exerciseHistory's name-based merge (history.ts:85) can merge different exercises.
- src/brain/prs.ts: read, but record rules were not audited in depth (only the list ordering and count in History).
- Gesture and animation code in History.tsx and Sparkline.tsx: skimmed only for the index maths; no logic audit.
- ShareSheet and share cards: not read.
- Navy formula constants: compared against the commonly published metric form, not re-fetched from the primary source in this session.

## Sources

- **PELLAND25** Pelland et al., The Resistance Training Dose Response: meta-regressions of weekly volume and frequency (Sports Med 2026;56:481-505, PMID 41343037). Fractional counting (indirect sets = 0.5) had the strongest evidence; hypertrophy and strength rise with volume with diminishing returns. — https://pubmed.ncbi.nlm.nih.gov/41343037/
- **SCHOENFELD17** Schoenfeld, Ogborn, Krieger 2017, dose-response of weekly sets and muscle mass (J Sports Sci 35:1073-82, PMID 27433992). Graded dose-response, each extra weekly set adds about 0.37% gain; 10+ sets per muscle vs <5 and 5-9. — https://pubmed.ncbi.nlm.nih.gov/27433992/
- **ROBINSON24** Robinson et al. 2024, proximity to failure dose-response (Sports Med 54:2209-31, PMID 38970765). Hypertrophy improves as sets end closer to failure; strength gains similar across a wide RIR range. — https://pubmed.ncbi.nlm.nih.gov/38970765/
- **MCBRIDE09** McBride et al. 2009, methods to quantify resistance-exercise volume (JSCR 23:106-10, PMID 19130641). Volume load = reps x external load; an alternative includes body mass minus shank mass; the methods give different values. — https://pubmed.ncbi.nlm.nih.gov/19130641/
- **LATELLA20** Latella et al. 2020, 15-year analysis of 1,897 powerlifters (JSCR 34:2412-8, PMID 32865942). Men gained about 0.15 kg a day on a 513 kg total, roughly 0.2% a week. — https://pubmed.ncbi.nlm.nih.gov/32865942/
- **ACSM09** ACSM Position Stand 2009, Progression Models in Resistance Training (MSSE 41:687-708), read through the IDEA Health summary. Novices: 1-3 sets per exercise, 2-3 total-body days a week. Intermediate is about 6 months of training; advanced is years. I could not parse the original PDF. — https://www.ideafit.com/progression-models-in-resistance-training-for-healthy-adults/
- **KRAEMER-RATES** Strength gain by training status (40% untrained, 20% moderately trained, 16% trained, 10% advanced, 2% elite, over 4 weeks to 2 years), as quoted in 'Resistance Training for Health and Performance'. I have only the search-engine summary, not a verbatim read. — https://instituteofmotion.com/wp-content/uploads/2019/01/Resistance_Training_for_Health_and_Perfo.pdf
- **NAVY-DOD** Circumference-based body fat revisited (USMC survey, PMC9008774). Gives the DoD Hodgdon-Beckett inch equations and the sites: men neck and abdomen at the navel; women neck, waist at the narrowest point, hip at the greatest buttock protrusion. My numeric check: the app's metric constants match the inch form within 0.3 points on 6 test cases. — https://pmc.ncbi.nlm.nih.gov/articles/PMC9008774/
- **NIST-MEDIAN** NIST/SEMATECH e-Handbook, measures of location. For an even N the median is the mean of the two middle values. — https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm
- **PLAN** docs/COACHING-PLAN.md at 5f282d7. F3.2 at :195; volume.ts spec at :344-347; e1RM at :597; the 'sets per muscle vs band' row at :640 (hard sets, never count easy sets, warm-ups or stabilisers, a full week is 3+ sessions, spike at >1.5x the 4-week mean); e1RM trend row at :642 (>+/-2.5% over 42 days, 4+ points over 4+ weeks); adherence row at :647; plateau row at :659 ('plateau at 3 weeks' is a never). — /home/user/marc-main/docs/COACHING-PLAN.md
- **DECISIONS** docs/COACHING-DECISIONS.md at 5f282d7. Level clamp :239-241; volume insight scope :243-244; secondary 0.55 vs 0.5 :342; BR-01 Navy in cm :405; BR-04 plateau lever (8 weeks, 1.5% total change) :409; BR-07 volume status :411; BR-16 one set count :412; D9 :414; BR-22 week grade :416. — /home/user/marc-main/docs/COACHING-DECISIONS.md
- **F13** docs/F13-BODYWEIGHT-LOAD.md. R1 formula and R2 share table (Ebben 2011 and others); body weight is never used for weighted, duration or conditioning; carry volume is out of scope (:452). — /home/user/marc-main/docs/F13-BODYWEIGHT-LOAD.md
- **SCRATCH** Researcher proof file (4 tests pass). (a) Bench and squat at +2.5 kg every 3 weeks (0.81%/wk) read 'plateaued' (medium) and deloadTrigger suggests a lighter week. (b) A new user's first week of 3x3 squat sets gives quads 'over' (9 against 4-8). (c) 8 sessions in 17 days at one load give 'plateaued' and a deload suggestion. (d) lib_wall_sit (duration) has role 'main'. — /home/user/marc-main/tests/qa-scratch/volume/researcher-check.test.ts