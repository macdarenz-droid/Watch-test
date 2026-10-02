# Logic audit · Dates, time zones, weeks, sessions and live logging (`dates`)

Rules judged: 50 · verdicts: {"correct": 28, "questionable": 15, "wrong": 7}. Part of `qa/LOGIC-AUDIT.md` (QA-L1, 2026-09-27).

## Findings

### DATES-F1 · A forgotten Finish saves a 12-hour, timing-trusted live session
- Severity **high** · status **confirmed** · where `src/slices/workout/session.ts:445,454-465; src/brain/fidelity.ts:25-27; src/brain/recovery.ts:97,107-114,134,220; src/brain/coach/post.ts:107-122; src/escobar/tools/read.ts:175; src/core/dates.ts:85`
- What the code does: The end time is always the moment Finish is tapped. A long gap after the last set is not detected, and the session is not 'compressed', so it stays 'live' with timingTrusted true.
- What is correct: When the time from the last set to Finish is long, ask when the session ended, or end it at the last set plus a short margin (plan scenario 6: a gap is excluded only when the person confirms it).
- Evidence: checker2-session.test.ts 'M1': 3 sets over 10 min, Finish 12 h later -> { durationMin: 729, mode: 'live', trusted: true, load: 5103, loadIf10min: 70 }. 'M1 load ratio' (3 x 60-min sessions a week for 4 weeks, the last one left open): { normal: 1, forgot: 2.44, factorNormal: 1, factorForgot: 1.25 }. systemicFactor multiplies tau for every session in the following 7 days (recovery.ts:209,220). A Finish tapped the next morning also counts as that day's training under the 6 h rule (dates.ts:85).
- User impact: One forgotten Finish records a 12-hour workout and makes every recovery estimate about 25% slower for a week.
- Source: P1, W11

### DATES-F2 · Saved duration includes paused time; the finish sheet does not
- Severity **medium** · status **confirmed** · where `src/slices/workout/session.ts:123-126,455,465; src/slices/workout/Train.tsx:432,927-931,1047; src/brain/recovery.ts:97; src/brain/coach/post.ts:112-119; src/escobar/tools/read.ts:175`
- What the code does: The finish sheet shows elapsedSec, which leaves out pauses. The saved durationSec is end minus start, pauses included. That value feeds session-RPE load, the 'longer than usual' insight, the Escobar tool and the 'When did you train?' default median.
- What is correct: Store and show the pause-free training duration, or store both and use the active one for load and insights. Plan :807 defines durationSec as trainedEndAt minus trainedAt, but scenario 6 (:864) says a confirmed pause is left out.
- Evidence: session-probe.test.ts 'duration with a pause': a 60-min session with a 30-min pause gives elapsedSec 1800 on the sheet and a saved durationSec of 3600. recovery.ts:97 uses load = mean effort x durationSec/60, so the pause doubles this session's load. post.ts:119 then says 'Idle time between sets is the most common cause'.
- User impact: A paused workout is saved as twice as long as the sheet showed, which inflates training load and triggers 'longer than usual' feedback for time the person marked as a break.
- Source: P1, W11

### DATES-F3 · Pre-filled warm-ups count as 'live' sets and can make untrusted timing 'trusted'
- Severity **medium** · status **confirmed** · where `src/slices/workout/session.ts:450-456; src/brain/coach/post.ts:83-104,139-143`
- What the code does: workingSets includes warm-ups, and a set with no fidelity counts as 'live'. Warm-ups from 'Log warm-ups' are never committed, so they have no time. They raise liveShare and the compression threshold, and the rest insight then runs on 3-second catch-up gaps.
- What is correct: Leave warm-ups and never-committed sets out of liveShare and the working-set count (plan :821, :843: the rest rule needs at least 4 live sets on the exercise).
- Evidence: checker2-session.test.ts 'S6': 4 warm-ups, 3 live fly sets, then 4 bench sets logged 3 s apart -> liveShare 0.727, mode live, timingTrusted true; bench restSec [600, 3, 3, 3]; restAndDensityInsight gives 'Median rest 3s' and 'Median rest before sets was 3s, and reps on a main lift fell from 8 on the first set to 6 on the last.' The same logging without warm-ups gives timingTrusted false.
- User impact: The coach can tell someone they rested 3 seconds and should rest longer, based on how fast they typed, not on how they trained.
- Source: P1

### DATES-F4 · Retro timing can land in the future; the past-session defaults already do
- Severity **medium** · status **confirmed** · where `src/slices/workout/Train.tsx:943,979-983; src/slices/workout/session.ts:495-497,522-523; src/brain/recovery.ts:152; src/slices/settings/reminders.ts:18`
- What the code does: 'When did you train?' Save checks only that the fields are filled. 'Log a past session' blocks only a future start, and its defaults (start = now, 60 min) end one hour in the future. Neither resolveSessionTiming nor logPastSession checks the time. Recovery anchors the dose at trainedEndAt.
- What is correct: Reject a start or end after now on both sheets, and default the past-session start to now minus the duration (plan :824 future_time; COACHING-DECISIONS.md:79-81 keeps only the default out of the future, for this same recovery reason).
- Evidence: session-probe: resolveSessionTiming accepted 2026-09-24T18:00 when now was 22 Sep. checker2 'S17' with the default values: { endedAt 11:00Z, now 10:00Z, chestPctNow: 100, recoveringNow: false, chestPctAfter61min: 0, recoveringAfter: true }. checker2-reminders 'S3': a session saved on future Mon 28 removes that day's reminder (queued ['2026-10-05', ...]).
- User impact: Logging a session you just finished with the default values shows those muscles as fully recovered for the next hour, and a future date also cancels that day's reminder.
- Source: P1, P3

### DATES-F5 · Rest seconds include the next set's own time and any pause
- Severity **medium** · status **confirmed** · where `src/slices/workout/session.ts:193-200; src/brain/coach/post.ts:88-93`
- What the code does: restSec is the gap between commits, capped at 600. That is the rest plus the duration of the set being logged, and paused time is not taken out. The first set after a pause becomes 'delayed' with restSec 600, and the rest median still uses it because post.ts:88 does not filter by fidelity.
- What is correct: Measure rest as the time between sets, and take paused time out of the gap. Plan :511 itself defines restSec as seconds since the previous commit, so changing this means changing the plan. Scenario 6 (:864) says rest metrics skip the gap.
- Evidence: session-probe 'duration with a pause': sets -> [['live', undefined], ['delayed', 600]], mode 'mixed'. With the 120 s strength threshold (post.ts:92), a real 105 s rest plus a 20 s set gives restSec 125, so the 'rest longer' tip does not fire.
- User impact: Rest advice runs on inflated rest times, so a person who rests too little may never get the 'rest longer' tip.
- Source: P1, W9, W10

### DATES-F6 · A workout in progress does not stop today's training reminder
- Severity **medium** · status **confirmed** · where `src/slices/workout/session.ts:106-121; src/slices/settings/reminders.ts:15-24`
- What the code does: startSession never resyncs reminders, and resyncReminders ignores state.active. Reminders are cleared only at Finish (QA8-3).
- What is correct: Cancel today's reminder on Start, and restore it if the session is discarded.
- Evidence: checker2-reminders 'S7': with a live session started Sat 17:00 and the reminder at 17:30, resync still queues ['2026-09-26', '2026-10-02'].
- User impact: Someone who starts at 17:00 gets 'Push is ready when you are' in the middle of their workout.
- Source: P4

### DATES-F7 · One missed scheduled day ends the streak
- Severity **medium** · status **confirmed** · where `src/brain/weekly.ts:96-111; src/slices/today/Today.tsx:55; src/escobar/tools/read.ts:138`
- What the code does: Walking back from today, the first past scheduled day with no session stops the count. 'Weeks on plan' with a free miss is not built.
- What is correct: Plan :217 and :647: never reset the streak to zero for one miss, and report weeks on plan with one free miss per 4 weeks.
- Evidence: checker2-session 'R50': Mon-Fri schedule, 4 weeks with one missed Tuesday -> { scheduledDaysTrained: 19, withMiss: 2, noMiss: 20 }. Only one 'weeks on plan' item exists in src: adherenceRate (weeklyReview.ts:91).
- User impact: After a month of consistent training, one missed day drops the flame on Today from about 20 to 2.
- Source: P2, W8

### DATES-F8 · Duplicate sessions are not detected
- Severity **medium** · status **confirmed** · where `src/brain/fidelity.ts:130-137`
- What the code does: isDuplicateSession exists, but nothing in src calls it (grep). The same workout saved twice counts twice.
- What is correct: Plan scenario 8 (:866) and :824: flag a same-day identical session, ask 'Keep both?', and leave it out of volume until answered.
- Evidence: checker2-session 'M2': the same past session saved twice -> sessions 2, week workouts 2, sets 4.
- User impact: A workout logged twice (live and again as a past session) doubles that day's workouts, volume and load.
- Source: P1

### DATES-F9 · Compressed sessions calibrate recovery on the logging time, and fixing the time does not update the model
- Severity **medium** · status **confirmed** · where `src/slices/workout/session.ts:45,482,498-512; src/brain/recovery.ts:390`
- What the code does: finishSession calibrates tau before 'When did you train?' is answered, so trainedAt is still the logging start. resolveSessionTiming does not recalibrate. A later rebuildRecoveryModel uses the resolved time and gets a different model.
- What is correct: Plan :851: tau calibration accepts live and delayed sets only, and a compressed session is mode retro (fidelity.ts:34). At least calibrate after the time is resolved. COACHING-DECISIONS.md:67 defers the matrix in general but assumes the model already uses the training time.
- Evidence: checker2-session 'R28', logged 48 h after training: { atFinish: { chest: 1.1 }, storedAfterResolve: { chest: 1.1 }, rebuilt: {} }. At 24 h and 36 h the two results matched.
- User impact: Logging a hard session two days late can wrongly slow chest recovery estimates by 10%, and the number then changes again whenever the model is rebuilt.
- Source: P1

### DATES-F10 · Set classifier differs from plan 6.17.2 in three cases
- Severity **low** · status **confirmed** · where `src/brain/fidelity.ts:17-22; src/slices/workout/session.ts:193-201`
- What the code does: (a) The first set is always 'live', even 5 s after Start. (b) In a catch-up burst, the first commit stays 'live'. (c) The under-20 s rule applies across exercises, so a superset pair logged together marks the second half 'delayed'.
- What is correct: Plan :814-815: the first set is live only after 30 s of timer, a burst makes the set and its neighbours untrusted, and the under-20 s rule applies to the same exercise only. COACHING-DECISIONS.md:63 removes only the background condition.
- Evidence: checker2-session 'R14': the first set 5 s after Start is 'live'; burst -> ['live', 'delayed', 'delayed']; superset -> fly sets ['delayed', 'delayed', 'delayed'], mode 'mixed', flags ['burst'], timingTrusted false.
- User impact: People who log superset pairs together never get rest or pacing insights, and a caught-up set can still start a rest timer and grab heart data.
- Source: P1, P3

### DATES-F11 · Session 'burst' share counts every delayed set, and 70/30 is both 'burst' and trusted
- Severity **low** · status **confirmed** · where `src/brain/fidelity.ts:50-55,66`
- What the code does: burstShare counts every delayed set, including long-gap ones. timingTrusted checks only mode live and liveShare of 0.7 or more, not the burst flag.
- What is correct: Plan :821 counts commits in bursts only. Plan :803: timingTrusted also needs no burst pattern.
- Evidence: checker2-session 'R15': 7 live and 3 delayed -> mode live, flags ['burst'], timingTrusted true. 4 live and 6 delayed from long gaps -> 'compressed', mode retro, with no burst at all.
- User impact: Rarely, a session gets flagged as logged after training, or trusted while flagged 'burst', against the plan's rules.
- Source: P1

### DATES-F12 · Retro and converted sessions do not mark their sets 'retro'
- Severity **low** · status **confirmed** · where `src/slices/workout/session.ts:498-511,518-536; src/slices/coach/Coach.tsx:311`
- What the code does: Past-session sets get no fidelity. After 'When did you train?', a converted session keeps its 'live'/'delayed' marks and logging-time 'at' values, which then fall after its new end time.
- What is correct: Plan :816 and :829: every set of these sessions is 'retro'.
- Evidence: checker2-session 'M3': the past-session set has fidelity undefined. The converted session runs 07:00Z-08:00Z but its sets are [['live', '10:01:00Z'], ['delayed', '10:01:02Z'], ...].
- User impact: The coach's 'Set timing: N% logged live' row counts sets from sessions the app itself judged as logged later.
- Source: P1

### DATES-F13 · Past-session logging and timing fixes do not resync reminders
- Severity **low** · status **confirmed** · where `src/slices/workout/session.ts:486 vs 493-541`
- What the code does: finishSession resyncs reminders, but logPastSession and resolveSessionTiming do not.
- What is correct: Resync on every path that adds a session or changes its day.
- Evidence: session-probe 'logPastSession does not resync reminders': resyncReminders is not called after logPastSession or resolveSessionTiming.
- User impact: After logging this morning's workout as a past session, tonight's reminder still fires unless the app is reopened first.
- Source: P4

### DATES-F14 · The 6-hour 'trained today' rule can drop the next day's reminder
- Severity **low** · status **confirmed** · where `src/slices/settings/reminders.ts:21; src/core/dates.ts:85`
- What the code does: A Fri 23:00-Sat 00:30 session makes Saturday 'done' until 06:30. A resync in that window, such as the one at Finish, cancels Saturday's reminder. A later resync adds it back. The display flip is intended (tests/dates.test.ts:72-73). LIVE-QA-8.md:48,56 asked for this helper in reminders.
- What is correct: Use the 6 h rule for the Today card only. Reminders should skip only days that have a session dated that day (plan :849: adherence uses the trainedAt day).
- Evidence: checker2-reminders 'S22': resync at Sat 00:40 queues ['2026-10-02', '2026-10-03'] (Sat 26 missing); at Sat 07:00 it queues ['2026-09-26', ...].
- User impact: After a late-night workout, the next day's scheduled reminder may never come.
- Source: P1, P4

### DATES-F15 · Finishing with no sets uses up today's Escobar change and shows 'Session saved'
- Severity **low** · status **confirmed** · where `src/slices/workout/session.ts:475-477; src/slices/workout/Train.tsx:438,1045`
- What the code does: The override is cleared whenever the split matches, even when nothing is saved. finishSession still returns a summary, so FinishScreen shows 'Session saved' (traced in code, not viewed on screen).
- What is correct: Treat an empty finish as a discard, which keeps the change, as the comment at :475 says.
- Evidence: session-probe 'a finish with no logged sets': exercises 0, sessions 0, todayOverride null.
- User impact: Tapping Finish before logging anything loses the coach's plan change for today and falsely says the session was saved.
- Source: 

### DATES-F16 · An empty reminder time schedules reminders at 00:30
- Severity **low** · status **confirmed** · where `src/native/notifications.ts:141,149; src/slices/settings/Settings.tsx:168; src/core/store.ts:158`
- What the code does: ''.split(':').map(Number) gives [0], so hh = 0 and mm falls back to 30. Neither Settings nor the store checks the value.
- What is correct: Validate HH:MM and fall back to 17:30.
- Evidence: reminders-probe 'a cleared time': the first reminder is at 00:30 on 2026-09-27. Reminders run only on Android (notifications.ts:133). Not verified: whether the Android WebView time picker can clear the field.
- User impact: If the time field is ever cleared, every training reminder arrives at half past midnight.
- Source: 

### DATES-F17 · Resuming after a rest that had run out fires 'Rest done' again at once
- Severity **low** · status **confirmed** · where `src/slices/workout/session.ts:136-137 (compare 334)`
- What the code does: Resume schedules the alert at now + held seconds with no future check, and the plugin fires a past 'at' immediately.
- What is correct: Schedule only when the held seconds are more than 0.
- Evidence: session-probe: pausedRemainingSec 0, and scheduleRestDone is called with Date.now(). Plugin LocalNotification.kt:104-108 (at <= now counts as triggered) and LocalNotificationManager.kt:215-233 (fires at once).
- User impact: A second 'Rest done' alert arrives right after tapping Resume.
- Source: C1

### DATES-F18 · adjustRest can push totalSec above the 600 s cap
- Severity **low** · status **confirmed** · where `src/slices/workout/session.ts:346-348; src/slices/workout/Train.tsx:1102,1162`
- What the code does: totalSec uses the unclamped remaining time. The 5 s floor is not a defect: it is documented for UI-19 (REMEDIATION-PLAN.md:306).
- What is correct: Clamp totalSec to REST_MAX.
- Evidence: session-probe: two +15 taps at 595 s give totalSec > 600 while the rest ends in 600 s. Train.tsx:1162 shows 'Rest · ' + formatClock(totalSec).
- User impact: The rest banner can show 'Rest · 10:20' and a bar that starts part-filled when the rest is really 10:00.
- Source: P5

### DATES-F19 · Skip or Finish during a rest-alert schedule can leave the alert queued
- Severity **low** · status **confirmed** · where `src/native/notifications.ts:80-97,119-122`
- What the code does: scheduleRestDone waits for a permission check before cancel and schedule. A cancelRestDone sent in that time runs first, and the schedule still lands.
- What is correct: Serialise schedule and cancel calls, for example with a promise chain or a generation token.
- Evidence: reminders-probe 'rest alert cancel/schedule race': id 880001 is still pending. The window is one bridge round trip; this was not checked on a device.
- User impact: Rarely, a 'Rest done' alert arrives after the rest was skipped or the workout finished.
- Source: 

### DATES-F20 · Overlapping reminder syncs can add back a reminder for a day off
- Severity **low** · status **confirmed** · where `src/native/notifications.ts:135-163`
- What the code does: Each sync cancels and then schedules, with no lock. The last one to finish wins, not the latest state.
- What is correct: Serialise syncs or drop stale runs with a generation check.
- Evidence: reminders-probe 'overlapping reminder syncs': an older sync that finishes last re-adds 2026-09-26 after the newer one dropped it. This was not checked on a device.
- User impact: Rarely, 'Take today off' tapped right after opening the app still leaves today's reminder.
- Source: 

### DATES-F21 · Readiness text in the reminder can be out of date
- Severity **low** · status **confirmed** · where `src/slices/settings/reminders.ts:22-23; src/main.tsx:58-59; src/slices/workout/Train.tsx:876`
- What the code does: Today's text is fixed when a resync runs. On resume, the resync runs at the same time as the health sync. Saving a check-in and finishing a health sync never resync (the only callers are Coach.tsx:179,185, Settings.tsx:43, dayOff.ts:8, session.ts:486, main.tsx:58,64 and escobar/apply.ts:34).
- What is correct: Resync after a health sync finishes and after a check-in is saved.
- Evidence: Code trace. Not probed.
- User impact: The notification can show readiness from before today's sleep data or check-in arrived.
- Source: 

### DATES-F22 · The ready window can collapse to '3 – 3 pm' or read backwards at midnight
- Severity **low** · status **confirmed** · where `src/core/dates.ts:199-217; src/brain/recovery.ts:338`
- What the code does: Nothing handles earliest equal to latest. When latest is exactly midnight, the group day moves back a day without checking earliest's day.
- What is correct: Show one time when the two match, and never pick a group day before earliest's day.
- Evidence: dates-probe: tile 'midnight – midnight'; detail 'Ready Sun 27, midnight – Sat 26, midnight'; a 'later' tile reads 'Tue – Mon'; '3 – 3 pm'. The ±15% window (recovery.ts:338) is narrow for a muscle that is nearly ready.
- User impact: Recovery tiles can show confusing or backwards times for muscles that are almost ready.
- Source: 

### DATES-F23 · 'Full by 8 pm' has no day
- Severity **low** · status **confirmed** · where `src/core/dates.ts:249-252; src/slices/body/Body.tsx:167,239`
- What the code does: formatFullBy prints the hour only. Only the detail strip (formatFullAt) shows the day.
- What is correct: Add the day whenever the full time is not today.
- Evidence: checker2-session 'S20': at Wed 23:00 a chest that just became ready has fullInHours 20.9, and the tile reads 'Full by 8 pm', which is Thursday.
- User impact: The tile reads as today when full recovery is really tomorrow evening.
- Source: 

### DATES-F24 · formatHours shows '24h' for 23.5 to 23.99 hours
- Severity **low** · status **confirmed** · where `src/core/dates.ts:133-136`
- What the code does: The < 24 check runs before rounding.
- What is correct: Round first, then choose the unit.
- Evidence: dates-probe: formatHours(23.6) = '24h', formatHours(24) = '1d'.
- User impact: A small wording inconsistency on the 'N left' recovery text.
- Source: 

### DATES-F25 · The week grade note gives the wrong number of sessions left
- Severity **low** · status **confirmed** · where `src/brain/weekly.ts:66`
- What the code does: The note is fixed text: 'One or two more sessions makes this a full week.'
- What is correct: Base the note on target minus done.
- Evidence: dates-probe: target 5 with 2 done gives that note, but 3 more are needed.
- User impact: The weekly advice understates how many sessions are left.
- Source: 

### DATES-F26 · The week grade compares sessions with planned days
- Severity **low** · status **confirmed** · where `src/brain/weekly.ts:56-65,87-94`
- What the code does: The target counts planned days, but progress counts sessions, so two sessions on one day count twice.
- What is correct: Count training days against planned days (plan :647: planned vs done).
- Evidence: checker2-session 'R49': 2 planned days (Mon, Thu) and 2 sessions on Monday -> target 2, workouts 2, activeDays ['2026-09-21'], grade 'Strong week'.
- User impact: 'You hit your planned sessions' can show when a planned day is still to do.
- Source: P2

### DATES-F27 · Set and workout counts differ between screens when warm-ups are logged
- Severity **low** · status **confirmed** · where `src/slices/workout/Train.tsx:434,1036; src/slices/today/Today.tsx:73; src/brain/weekly.ts:60,97`
- What the code does: The finish sheet counts working sets. The finish screen and the Today card count warm-ups too. A warm-up-only session counts as a weekly workout but not for the streak.
- What is correct: Use one set definition (working sets) everywhere.
- Evidence: Code trace. Not probed.
- User impact: The same workout shows different set counts a second apart.
- Source: 

### DATES-F28 · Skipping the check-in hides it until the app restarts, not just for the day
- Severity **low** · status **confirmed** · where `src/slices/workout/Train.tsx:75-76,116,876,886`
- What the code does: Both Skip and Save set a module flag that never resets. The comment at :865 and COACHING-PROGRESS.md:179 say 'once per day'. The check-in panel is still reachable from elsewhere (App.tsx:68).
- What is correct: Key the dismissal to today's date.
- Evidence: Code trace. Not probed.
- User impact: If the app stays open past midnight, the next day's workout never offers the check-in before Start.
- Source: 

### DATES-F29 · 'When did you train?' Skip always saves timeSource 'schedule'
- Severity **low** · status **confirmed** · where `src/slices/workout/Train.tsx:934,954,962`
- What the code does: Skip and close save 'schedule' even when the guess was the 17:00 fallback or 'ended just now'. Nothing in src reads timeSource today (grep).
- What is correct: Plan :828: save 'default' when the guess was not the schedule time.
- Evidence: Code trace. Not probed.
- User impact: No visible effect yet, but the stored label is wrong for any future 'times approximate' feature.
- Source: P1

### DATES-F30 · Travel across time zones: no stored zone, and reminders keep the old wall time until the app is reopened
- Severity **low** · status **confirmed** · where `src/core/models.ts (no offset or zone field); src/slices/workout/session.ts:113,454; src/native/notifications.ts:148-156; plugin AndroidManifest.xml:11-12; src/main.tsx:55-58`
- What the code does: Times are stored as UTC 'Z' strings only. Reminders are fixed instants. The plugin restores alarms on boot but has no time-zone-change receiver, so re-anchoring happens only on the next app resume.
- What is correct: Plan scenario 12 (:870): store the offset, note a zone change in History, and re-anchor reminders when the zone changes.
- Evidence: Code trace and grep: no TIMEZONE_CHANGED in the plugin; models.ts has no offset or zone field.
- User impact: After a flight, reminders fire at the old zone's time until the app is opened, and History shows past times in the current zone.
- Source: P1, C1

## Not covered

- src/slices/workout/Train.tsx lines 293-346 (CreateSplit, SplitEditor) and 811-919 (SuspectChip, SubstituteSheet, CheckInSheet, PreSessionSheet) were only skimmed for date logic; their unit, progression and editor logic belongs to other areas
- src/slices/workout/heart.ts (heartForSet, finishHeartCapture) was not read; the heart window timing is taken from its call site only
- src/brain/weekly.ts: weeklyMuscleSets, recordsInWeek and weeklyVolumeHistory were not read
- src/brain/recovery.ts calibrateAfterSession was read only via grep (it uses trainedAt); the model impact in DATES-S18 is not proven
- Device-only checks not possible here: whether the Android WebView time picker can clear the field (DATES-S4), and real Capacitor bridge timing for the races (DATES-S10, DATES-S11)
- Scratch probes: /home/user/marc-main/tests/qa-scratch/dates/{dates-probe,session-probe,reminders-probe}.test.ts (16 tests, all pass under the default TZ, America/New_York and Asia/Manila)

## Sources

- **P1** Project plan 6.17 Logging fidelity (classifier, flows, gating matrix, scenarios 6, 7, 8, 12) — /home/user/marc-main/docs/COACHING-PLAN.md:784-878 (restSec definition at :511)
- **P2** Project plan: streak must never reset to zero for one miss; weeks on plan; adherence row — /home/user/marc-main/docs/COACHING-PLAN.md:217, :647
- **P3** Owner decisions: fidelity ignores foreground/background; 'when did you train' default never in the future; Monday week key — /home/user/marc-main/docs/COACHING-DECISIONS.md:63-65, :79-81, :117
- **P4** LIVE-QA-8: QA8-3 (resync at finish) and QA8-4 (6 h trained-today rule, display only) — /home/user/marc-main/docs/qa/LIVE-QA-8.md:45-58
- **P5** Remediation plan: D4 day off = unscheduled; UI-19 rest while paused; daysOff cap 400 — /home/user/marc-main/docs/REMEDIATION-PLAN.md:63, :306, :616
- **W1** MDN Date: date-only strings parse as UTC, date-time strings as local; DST gaps move forward — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format
- **W2** ISO 8601 week date: weeks run Monday to Sunday — https://en.wikipedia.org/wiki/ISO_week_date
- **W3** Android Developers: Schedule alarms (inexact alarms within one hour on Android 12+, Doze, exact alarms for alarm/timer apps) — https://developer.android.com/develop/background-work/services/alarms/schedule
- **W4** Android 14: SCHEDULE_EXACT_ALARM denied by default; degrade gracefully — https://developer.android.com/about/versions/14/changes/schedule-exact-alarms
- **W5** Android Developers: notification runtime permission, ask in context from a user action — https://developer.android.com/develop/ui/views/notifications/notification-permission
- **W6** MDN setTimeout: timers throttled in background tabs (1 s minimum; Chrome intensive throttling once per minute) — https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
- **W7** MDN Screen Wake Lock API: lock released when hidden, re-acquire on visibilitychange — https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- **W8** Lally et al. 2010, How are habits formed (EJSP): missing one opportunity did not materially affect habit formation — https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674
- **W9** ACSM position stand 2009, Progression models in resistance training (rest 2-3 min or more for heavy core lifts) — https://pubmed.ncbi.nlm.nih.gov/19204579/
- **W10** de Salles et al. 2009, Rest interval between sets in strength training, Sports Med 39:765-777 — https://pubmed.ncbi.nlm.nih.gov/19691365/
- **W11** Foster et al. 2001, session-RPE load = RPE x training session duration (min) — https://pubmed.ncbi.nlm.nih.gov/11708692/
- **C1** Capacitor local-notifications 8.3.1 source: stale 'at' fires immediately; exact only if permitted; Weekday.Sunday = 1; boot restore, no time zone handling — /home/user/marc-main/node_modules/@capacitor/local-notifications/android/src/main/kotlin/com/capacitorjs/plugins/localnotifications/LocalNotificationManager.kt:315-378; node_modules/@capacitor/local-notifications/dist/esm/definitions.d.ts:1232-1240