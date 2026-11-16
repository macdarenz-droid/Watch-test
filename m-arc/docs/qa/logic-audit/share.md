# Logic audit · Share cards, profile, onboarding, health and watch data (`share`)

Rules judged: 44 · verdicts: {"correct": 31, "questionable": 8, "wrong": 5}. Part of `qa/LOGIC-AUDIT.md` (QA-L1, 2026-09-27).

## Findings

### SHARE-F1 · Typed body weight has no plausible range, and calories use it raw
- Severity **medium** · status **confirmed** · where `src/core/parse.ts:7,26-29; src/slices/profile/Profile.tsx:88-92; src/slices/profile/Onboarding.tsx:66-67; src/slices/profile/profile.ts:47-56; src/brain/energy.ts:16-27`
- What the code does: Any value above 0 and up to 1000 kg (2200 lb) is saved as profile.bodyWeightKg. The first entry has nothing to compare against, so isWeightTypo returns false (onboarding.ts:73). energy.ts puts the raw value into Mifflin and Keytel. The F13 resolver (bodyweight.ts:31-33) and Escobar (escobar/tools/actions.ts:219) reject anything outside 30–300 kg. The F13 doc's risk 12 relies on that range, but only for volume (docs/F13-BODYWEIGHT-LOAD.md:446).
- What is correct: One plausible range at entry (the app already uses 30–300 kg), with a reject or confirm step for values outside it.
- Evidence: tests/qa-scratch/share/share-audit.test.ts, block 'body weight has no sane range', passes: logWeight(8) stores 8, bodyWeightResolver returns undefined, and bmrKcalPerDay gives 10*8+6.25*180-5*30+5 = 1060 kcal (about 1690 at 80 kg).
- User impact: If the first weight has a missing digit or is typed in the wrong unit, calorie numbers are off by hundreds of kcal a day, while bodyweight volume treats the same weight as missing.
- Source: F13, BIV, MIFFLIN, KEYTEL; merges R29, R37, S2

### SHARE-F2 · The onboarding and review form skips the 10% weight typo guard
- Severity **medium** · status **confirmed** · where `src/slices/profile/Onboarding.tsx:65-69`
- What the code does: save() calls logWeight(displayToKg(typed)) with no isWeightTypo check. Profile's weigh-in does check (Profile.tsx:91). If the weight cannot be parsed, it is dropped without a message and onDone() still marks onboarding complete.
- What is correct: Spec 6.14 (docs/COACHING-PLAN.md:696): 'A typo guard asks once when a new weight differs more than 10 % from the last.' Also: warn about a weight that cannot be parsed instead of dropping it.
- Evidence: Code trace: Onboarding.tsx:66 parseLoad, then :67 logWeight, then :68 onDone, with no branch to isWeightTypo. Compare Profile.tsx:91 `if (!confirming && isWeightTypo(kg, s.profile.bodyWeightKg))`.
- User impact: A 20% weight typo made on the 90-day 'Update' form is saved without a question and flows into calories and bodyweight volume.
- Source: PLAN614; S3

### SHARE-F3 · Saving the form with the weight untouched logs a new weigh-in, and in lb it also shifts the stored weight
- Severity **medium** · status **confirmed** · where `src/slices/profile/Onboarding.tsx:63,65-68; src/core/units.ts:13-23`
- What the code does: The form pre-fills String(kgToDisplay(kg, unit)) and save() always logs it. In kg, today gets a weigh-in with the old value. In lb, rounding to 0.1 lb moves the value: 80 kg becomes 80.014 kg, which writes a profileHistory change and fires a 'Weight updated' insight (rules.ts:332-358). The extra flat point today also distorts the BR-14 trend, because the 28-day window is anchored on the last entry (weeklyReview.ts:112-129).
- What is correct: Log a weigh-in only when the user changed the weight field (compare in the display unit), and run the typo guard first.
- Evidence: researcher.test.ts: lb round trip 80 -> 80.014, history entry {field:'bodyWeightKg', from:80, to:80.014, source:'onboarding'}. checker.test.ts M1: a real loss trend {pctPerWeek:-0.84} became {pctPerWeek:-0.49} after an untouched Save; the log grew from 15 to 16. Counterpoint: in kg, saving the shown weight can be read as 'still accurate', but the lb drift and the trend change are defects either way.
- User impact: Changing only the goal on the review form adds a weigh-in that never happened and roughly halves the weight-loss trend shown in the weekly review.
- Source: SCRATCH, PLAN614, DEC:418; M1

### SHARE-F4 · Closing the 'Add my details' form counts as completing onboarding
- Severity **medium** · status **confirmed** · where `src/slices/profile/Onboarding.tsx:24,57,72; src/brain/onboarding.ts:64`
- What the code does: The form's Sheet onClose is onDone, which is finishForm, which calls completeOnboarding and sets completedAt. With completedAt set and the profile incomplete, shouldShowOnboarding returns null for ever.
- What is correct: Spec 6.14: 'Later always works', and missing fields are asked again after 14 days, up to 3 dismissals. Closing without Save should go through exit() (a dismissal). Only Save should complete onboarding.
- Evidence: checker.test.ts S11: after completeOnboarding() on an empty profile, 30 days later the result is null; after dismissOnboarding() (the Later path), 30 days later it is 'partial'.
- User impact: A user who opens the form and backs out is never asked for their details again, so calories and heart-rate zones stay locked without any reminder.
- Source: PLAN614; merges R35, S11

### SHARE-F5 · The onboarding sheet disappears mid-form when the last missing field is committed
- Severity **medium** · status **confirmed** · where `src/app/App.tsx:113; src/slices/profile/Onboarding.tsx:75-77; src/ui/primitives.tsx:356-363; src/app/selectors.ts:73-76`
- What the code does: App mounts the sheet only while onboardingTrigger is set, and its onClose is a no-op. Height and birth year commit on blur, and Sex commits on tap. If that commit completes the profile, the trigger becomes null and the sheet unmounts before Save: training-since and goal are skipped, and completeOnboarding never runs (no lastReviewAt). This needs a weight already stored, because the form writes weight only on Save; for example, weight from Profile, Escobar or an import. The same happens on 'watch' if the watch stops being connected mid-form, and on 'review' if a field is cleared (completedAt is set, so the result is null).
- What is correct: Keep the sheet mounted until its own close or Save.
- Evidence: share-audit.test.ts, first block, passes: trigger 'first', then setSex('female','onboarding'), then null; completedAt and lastReviewAt are undefined; shouldShowOnboarding 400 days later is null.
- User impact: The details form vanishes in the middle of editing, the goal and training-since questions are never reached, and the 90-day check never comes (see SHARE-F6).
- Source: PLAN614; S1, R36 (commit-as-you-edit)

### SHARE-F6 · A complete profile with no lastReviewAt never gets the 90-day 'Still accurate?' review
- Severity **medium** · status **confirmed** · where `src/brain/onboarding.ts:60-62; tests/onboarding.test.ts:35-37`
- What the code does: When the profile is complete and lastReviewAt is unset, the function returns null. lastReviewAt is written only by completeOnboarding and reviewOnboarding. So a profile completed on the Profile screen, through Escobar, or through SHARE-F5 is never reviewed. The existing test pins this ('quiet, not stuck reviewing'). The decisions doc has no owner decision on it (grep of docs/COACHING-DECISIONS.md).
- What is correct: Spec 6.14 (COACHING-PLAN.md:675): review 90 days after the last profile review. Anchor on lastReviewAt ?? completedAt ?? the newest profileHistory change to the 4 fields. The test at onboarding.test.ts:35 would need a spec-based update, not a loosening.
- Evidence: share-audit.test.ts first block: complete profile, no lastReviewAt, today+400 days gives null. Code: onboarding.ts:61 `if (!onboarding.lastReviewAt) return null;`.
- User impact: People who filled in their details outside the onboarding sheet are never asked to confirm them, so an outdated weight or height keeps feeding calorie estimates.
- Source: PLAN614; R33(a)

### SHARE-F7 · Health Connect files an old sleep session or resting heart rate under today, and readiness can count it twice
- Severity **medium** · status **confirmed** · where `native/HealthConnectNativePlugin.java:285-316; src/native/health.ts:52-69,109-111; src/slices/settings/health.ts:20-22; src/brain/readiness.ts:14-17,37-39,167-168; src/brain/heart.ts:79`
- What the code does: The plugin takes the newest sleep session and resting-HR record from the last 48 h. mapHealthSummary stores them under the end day. Readiness reads today's row as 'last night' (withinDays(d,today,1) means today only). The 3-night debt, the 14-night median and the 7-day resting-HR median can then contain the same reading on two days. sleepEndAt and latestHrAt are stored, but nothing reads them (grep finds them only in native/health.ts and models.ts).
- What is correct: File sleep under its sleepEndAt day and resting HR under its own time's day. Keep a reading only when it falls on the stored day.
- Evidence: share-audit.test.ts, health block, passes: sleepEndTime '2026-09-25T06:00:00Z' maps to day '2026-09-27' with sleepMinutes 450 and restingHr 55. Duplication across days follows from the code; it is not verified on a device.
- User impact: After a night with no recorded sleep, readiness scores yesterday's sleep as last night and can double-count it, which skews the train-or-rest advice.
- Source: PLANF21; merges S5, R43 (resting HR), R42 (48 h filed under end day)

### SHARE-F8 · Sleep minutes are the in-bed span of the newest session, not the total sleep of the main night
- Severity **medium** · status **confirmed** · where `native/HealthConnectNativePlugin.java:298-306`
- What the code does: For each SleepSessionRecord it computes minutes = end - start and keeps the one with the latest end. A nap after the night replaces the night. Awake stages inside the session are counted as sleep. Readiness gives sleep a weight of 0.25 (readiness.ts:62).
- What is correct: Choose the main overnight session and subtract AWAKE, AWAKE_IN_BED and OUT_OF_BED stages, or use SLEEP_DURATION_TOTAL over the night window.
- Evidence: Code trace, Java:300-305: `mins = ChronoUnit.MINUTES.between(r.getStartTime(), r.getEndTime())`, kept when `r.getEndTime().isAfter(sleepEnd)`. Whether source apps write naps or awake stages is not device-verified (the Health Connect sleep docs list both).
- User impact: An afternoon nap can replace the night's sleep, and time spent awake in bed counts as sleep, so readiness and recovery advice rest on the wrong sleep number.
- Source: HCSLEEP, TST, PLANF21; merges M2, R43 (sleep)

### SHARE-F9 · One Connect tap can show two permission dialogs
- Severity **medium** · status **confirmed** · where `src/native/health.ts:94-106`
- What the code does: When nothing is granted, the prompt path calls requestPermissions and reads again. If the user grants only some types, the asked-once block sees a new missing set and calls requestPermissions again straight away.
- What is correct: At most one dialog per tap: remember the missing set after the first request as well. The owner decision (COACHING-DECISIONS.md:401) says the app 'asks once for newly missing permissions'.
- Evidence: checker.test.ts S14, with a mocked plugin (answers: none granted, then partial): prints 'permission dialogs in one tap: 2'. Whether Android then stops showing the dialog for those types is not device-verified.
- User impact: A user who deliberately left some health types off is asked again at once, and a second 'no' can stop Android from ever showing that dialog again.
- Source: DEC:401, ANDPERM, HCPERM; merges S14, R42

### SHARE-F10 · The 400-entry weight-log cap silently changes old sessions' body weight and card volume
- Severity **medium** · status **confirmed** · where `src/slices/profile/profile.ts:53; src/brain/bodyweight.ts (bodyWeightOn uses the nearest weigh-in)`
- What the code does: logWeight keeps only the last 400 weigh-ins. When the oldest drops off, sessions from that time resolve to the nearest weigh-in that is left, which is a later one. That changes F13 bodyweight and assisted volume on Year and All-time cards. The F13 doc names the cap only as a performance bound (F13-BODYWEIGHT-LOAD.md:442). It accepts retroactive changes only when body weight first appears (risk 3, :437).
- What is correct: Thin old entries (for example one per week) instead of dropping them, or keep the entries F13 needs.
- Evidence: share-audit.test.ts, cap block, passes: the first day resolves to 100 kg before the 401st weigh-in and to 70 kg after it; the log stays at 400.
- User impact: Someone who weighs in daily sees past bodyweight-exercise volume and all-time totals change after about 13 months with no new training.
- Source: PLAN513, F13; merges S6, R29 (cap)

### SHARE-F11 · Adult-only formulas are applied from age 10
- Severity **medium** · status **confirmed** · where `src/slices/profile/Onboarding.tsx:76; src/slices/profile/Profile.tsx:39; src/brain/energy.ts:9-27; src/brain/heart.ts:23-24`
- What the code does: The birth year's maximum is this year − 10. energy.ts and heart.ts have no age floor, so Mifflin, Keytel and Tanaka run for children aged 10–17.
- What is correct: Withhold or label calorie and heart-rate-zone estimates below 18. Per the cited sources, Mifflin was derived at 19–78 y, Keytel at 18–45 y, and Tanaka in healthy adults; I did not re-read the papers myself.
- Evidence: checker.test.ts M3: bmrKcalPerDay with birthYear = this year − 10, 35 kg, 140 cm, male prints 'BMR at age 10: 1180' (not null).
- User impact: A teenager or child gets calorie and heart-rate-zone numbers from formulas never validated for their age.
- Source: MIFFLIN, KEYTEL, TANAKA; merges M3, R36 (age)

### SHARE-F12 · The onboarding form shows 'Male' selected when sex was never saved
- Severity **medium** · status **confirmed** · where `src/slices/profile/Onboarding.tsx:77; src/ui/primitives.tsx:36-40`
- What the code does: The control gets `s.profile.sex ?? 'male'`, so Male shows as pressed while profile.sex is undefined. Only a tap saves it. If the user trusts the display and taps Save, sex stays unset, the profile stays incomplete, and completeOnboarding still runs (SHARE-F4 path), so the sheet never asks again.
- What is correct: Pass s.profile.sex (undefined), as the BUG-8 fix does on Profile (Profile.tsx:43).
- Evidence: Code trace: Segmented marks aria-pressed when o.value === value (primitives.tsx:40); Profile.tsx:43 passes the raw value. BUG-8 test: tests/profile-status.test.ts:31-43.
- User impact: The user believes they set their sex, but calories stay locked and nothing asks again.
- Source: PLAN614; S4

### SHARE-F13 · Onboarding timers and 'I'm new' use UTC dates, not local ones
- Severity **low** · status **confirmed** · where `src/brain/onboarding.ts:57,62,68; src/slices/profile/profile.ts:85,90,94; src/slices/profile/Profile.tsx:66; src/slices/profile/Onboarding.tsx:79`
- What the code does: dismissedAt and lastReviewAt are UTC ISO strings. The code cuts them to their UTC date and compares that with the local today key. 'I'm new' stores new Date().toISOString().slice(0,7), which is the UTC month.
- What is correct: Use local days everywhere: dayKey(iso) for the comparisons and dayKey(new Date()).slice(0,7) for 'I'm new' (src/core/dates.ts:9-17).
- Evidence: TZ=Pacific/Auckland at 01:30 on 1 Oct: 'NZ local month 2026-10, I'm new stores 2026-09'; the dismissal stored as 2026-09-30T12:30Z re-asks after 13 local days ('local days passed 13 -> partial'). TZ=America/New_York at 20:00 on 30 Sep: 'NY local month 2026-09, I'm new stores 2026-10'.
- User impact: Near midnight or a month boundary, 'I'm new' can record the wrong month and the reminders can come a day early or late.
- Source: MDNISO; merges S10, R33(b), R38

### SHARE-F14 · Period cards count warm-up-only sessions as Sessions
- Severity **low** · status **confirmed** · where `src/slices/share/cardData.ts:190,195,198; src/brain/weekly.ts:56-60`
- What the code does: inRange is not filtered with hasWorkingSets, so a warm-up-only session (finishSession keeps it: session.ts:446-449,478) adds 1 to Sessions and can set timePartial. weekSummary.workouts counts the same way, and tests/share-cards.test.ts:73-76 ties the Week card to it.
- What is correct: Count only sessions with working sets, in both cardData and weekSummary, so the two stay equal (QA4-8 treats a warm-up-only session as nothing to share, REMEDIATION-PROGRESS.md:681).
- Evidence: share-audit.test.ts, card counts block, passes: one real session plus one warm-up-only session gives Sessions = 2.
- User impact: A shared week card can claim one more session than the user actually trained.
- Source: QA4, F12; merges R3, S7

### SHARE-F15 · The '×N' on a period line counts exercise entries, not sessions
- Severity **low** · status **confirmed** · where `src/slices/share/cardData.ts:143-149,154`
- What the code does: row.count++ runs for every logged-exercise entry, so a lift logged twice in one session reads '×2'. The CardLine doc (cardData.ts:28) and the test (tests/share-cards.test.ts:68, expects ×inRange.length) mean sessions. The test passes only because its fixture has one bench entry per session.
- What is correct: Count distinct session ids per exercise.
- Evidence: share-audit.test.ts, card counts block, passes: one session with bench logged twice gives sessions 1 and lines[0].detail '×2'.
- User impact: The card can say a lift was done in more sessions than it was.
- Source: TESTLINE; merges R17, S8

### SHARE-F16 · Share cards leave out the year across New Year and on old workouts
- Severity **low** · status **confirmed** · where `src/slices/share/cardData.ts:94-97,174,176; src/core/dates.ts:109; src/slices/history/History.tsx:260`
- What the code does: The quarter sub prints only to's year ('1 Nov – 15 Jan 2026'). The week sub has no year. A workout card for any past session (History.tsx:260 allows sharing one) shows 'd MMM' and 'weekday d MMM', because formatDay's default has no year.
- What is correct: Print the start year when it differs from the end year (or use formatRange), and add the year to a workout card when it is not the current year.
- Evidence: share-audit.test.ts, quarter test, passes: from '2025-11-01', sub matches /2026$/ and does not contain 2025.
- User impact: A shared image can put November in the wrong year or leave the year of an old workout unclear.
- Source: MDNRANGE; merges R8, R9, S13

### SHARE-F17 · 'PRs' counts record kinds, so one improved lift reads as 2–3 PRs
- Severity **low** · status **confirmed** · where `src/slices/share/cards.ts:106-107,199,237; src/brain/prs.ts:65-76`
- What the code does: One session can give 'heaviest', 'strength' (e1RM more than 2.5% higher) and 'reps_at_load' for the same lift, and every card shows records.length. Stats counts the same way (weekly.ts:71, recordsInWeek). No spec or owner decision in docs/COACHING-DECISIONS.md, F12 or QA4 says which is meant.
- What is correct: The owner should decide: count kinds, as now, or count lifts with a record. There is no standard (Hevy tracks record kinds separately).
- Evidence: share-audit.test.ts, PR test, passes: bench 100x5 then 110x5 gives record kinds ['heaviest','strength'], so the card shows PRs 2.
- User impact: A public card can say '2 PRs' or '3 PRs' for one heavier set.
- Source: HEVY; S9

### SHARE-F18 · The partial-profile message always says heart-rate zones are blocked
- Severity **low** · status **confirmed** · where `src/slices/profile/Onboarding.tsx:48`
- What the code does: Whatever is missing, the text says 'Without them the coach cannot show calories or heart-rate zones.' Zones need only the birth year (heart.ts:23-24) plus resting HR (heart.ts:144), and height is needed only for calories (energy.ts:16-19). missingProfileSummary (onboarding.ts:37-43) already names the right unlocks for each field.
- What is correct: Build the sentence from what is actually missing. The spec's example (COACHING-PLAN.md:681) uses this wording for the one case where it is true.
- Evidence: Code trace, as cited. With only height missing, zones stay available but the sheet says they are not.
- User impact: Someone missing only their height is told heart-rate zones are unavailable when they are available.
- Source: TANAKA; S12

### SHARE-F19 · Clearing a profile field is not recorded in profileHistory
- Severity **low** · status **confirmed** · where `src/slices/profile/profile.ts:11-14; src/ui/primitives.tsx:359`
- What the code does: recordChange returns early when `to == null`, so CommitNumber's clear (onCommit(undefined)) changes the profile without leaving any history entry. Spec 6.15 wants a history that can rebuild the profile for any day, but no replay (profileAt) exists yet (src/brain/profile.ts is absent). Today's readers are statusHint (Profile.tsx:16-19), the insight rule (rules.ts:335, weight and goal only) and the Escobar context (escobar/tools/context.ts:83).
- What is correct: Record a clear as {to: null}.
- Evidence: checker.test.ts R28: setHeight(180), then setHeight(undefined), prints 'height now undefined, history grew by 0'.
- User impact: The history shows the deleted value as still current, and Escobar, which reads that history, sees the same.
- Source: PLAN615; R28

## Not covered

- src/native/share.ts (saveImage/shareImage outcome values): not read; I relied only on the outcomes ShareSheet checks.
- src/native/photo.ts (pickAndCompressPhoto): not read.
- src/slices/settings/Settings.tsx: only the Health row call site (line 197) was read. The Watch-lab row belongs to the watch agent and was not reviewed.
- native/watch/** and the WatchBridge Java/Kotlin: not read (watch-agent owned). watch.ts was read in full.
- native/HealthConnectNativePlugin.java: only the permission and readSummary parts were read, not the whole file.
- Visual layout in cards.ts (clip widths, font sizing) was not judged, as the brief asked.

## Sources

- **PLAN614** M/ARC plan 6.14 Onboarding sheet and profile dashboard — /home/user/marc-main/docs/COACHING-PLAN.md:671-698
- **PLAN615** M/ARC plan 6.15 Profile history — /home/user/marc-main/docs/COACHING-PLAN.md:700-712
- **PLAN513** M/ARC plan data gaps table: weightLog cap 400, HC WeightRecord — /home/user/marc-main/docs/COACHING-PLAN.md:513
- **PLANF21** M/ARC plan F2.1 readiness: sleep last night vs 14-day median — /home/user/marc-main/docs/COACHING-PLAN.md:186
- **DEC** Owner decisions: goal default lean (37), watch trigger once (162), HC permission ask-once (401), weight trend BR-14 (418) — /home/user/marc-main/docs/COACHING-DECISIONS.md:37,162,401,418
- **F12** F12 share cards design notes — /home/user/marc-main/docs/REMEDIATION-PROGRESS.md:605-670
- **QA4** Live QA round 4 share-card fixes QA4-1..15 — /home/user/marc-main/docs/REMEDIATION-PROGRESS.md:671-688; docs/qa/LIVE-QA-4.md
- **F13** F13 body weight as load (range 30-300 kg, risks 3-4) — /home/user/marc-main/docs/F13-BODYWEIGHT-LOAD.md; src/brain/bodyweight.ts:31-33
- **TESTLINE** Share card test: period line detail equals number of sessions — /home/user/marc-main/tests/share-cards.test.ts:68; src/slices/share/cardData.ts:29
- **SCRATCH** Researcher scratch test: untouched review-form Save logs a weigh-in; lb round trip 80 -> 80.014 kg plus history entry — /home/user/marc-main/tests/qa-scratch/share/researcher.test.ts
- **ISO** ISO 8601 week date: weeks start Monday — https://en.wikipedia.org/wiki/ISO_week_date
- **MDNISO** MDN Date.prototype.toISOString: timezone is always UTC — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
- **MDNRANGE** MDN Intl.DateTimeFormat.formatRange (en-GB gives '1 Nov 2025 – 15 Jan 2026', checked in node) — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/formatRange
- **MCBRIDE** McBride et al. 2009, Comparison of methods to quantify volume during resistance exercise, J Strength Cond Res (volume load = reps x external load; MDSVL adds body mass) — PMID 19130641
- **ACSM** ACSM 2009 position stand, Progression models in resistance training (novice 2-3 d/wk, intermediate 3-4) — PMID 19204579
- **MIFFLIN** Mifflin et al. 1990, AJCN: REE equation, 498 subjects aged 19-78 y — PMID 2305711
- **TANAKA** Tanaka et al. 2001, JACC: HRmax = 208 - 0.7 x age in healthy adults, age alone — PMID 11153730
- **KEYTEL** Keytel et al. 2005, J Sports Sci: HR-based energy expenditure, age 18-45 y, body mass 47-120 kg — PMID 15966347
- **BIV** Cleaning of anthropometric data from PCORnet EHR, JAMIA Open 2022: adult BIV weight <=20 or >500 kg, height <=50 or >244 cm — https://academic.oup.com/jamiaopen/article/5/4/ooac089/6794261
- **AOU** Guide et al. 2024, J Biomed Inform (All of Us): weight error flag at 15 kg between consecutive values within 180 days — https://pmc.ncbi.nlm.nih.gov/articles/PMC11973958/
- **NOHOW** Turicchi et al. 2020, PLoS One: within-week weight fluctuation 0.35%, Christmas gain 1.35% — PMID 32353079
- **HCAGG** Android Health Connect: aggregate reads dedupe Activity and Sleep types by app priority — https://developer.android.com/health-and-fitness/guides/health-connect/develop/aggregate-data
- **HCSLEEP** Android Health Connect sleep sessions: nightly session or daytime nap; stages AWAKE, AWAKE_IN_BED, OUT_OF_BED, LIGHT, DEEP, REM — https://developer.android.com/health-and-fitness/health-connect/features/sleep-sessions
- **TST** Total sleep time excludes wake after sleep onset (Sleep Foundation WASO; UPenn PSG basics) — https://www.sleepfoundation.org/sleep-studies/wakefulness-after-sleep-onset
- **HCPERM** Android Health Connect permissions UI: after Cancel twice, users must re-enable in Health Connect settings — https://developer.android.com/health-and-fitness/health-connect/ui/permissions
- **ANDPERM** Android runtime permissions: Deny more than once means the dialog no longer shows — https://developer.android.com/training/permissions/requesting
- **BT** Android Bluetooth permissions: Nearby devices on 12+, ACCESS_FINE_LOCATION for scans on 11 and lower — https://developer.android.com/develop/connectivity/bluetooth/bt-permissions
- **HEVY** Hevy live PR: record types tracked independently (heaviest, 1RM, best set volume, reps, duration) — https://www.hevyapp.com/features/live-pr/