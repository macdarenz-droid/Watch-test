# Logic audit · Data, storage, migrations, backup and the exercise catalogue (`data`)

Rules judged: 64 · verdicts: {"correct": 46, "questionable": 15, "wrong": 3}. Part of `qa/LOGIC-AUDIT.md` (QA-L1, 2026-09-27).

## Findings

### DATA-F1 · A restored file with a wrong-type list can crash the Today screen on every start
- Severity **medium** · status **confirmed** · where `src/core/store.ts:167-173; src/brain/coach/rules.ts:532-534; src/app/selectors.ts:64; src/slices/today/Today.tsx:35; src/slices/profile/profile.ts:13`
- What the code does: The repair only fills profileHistory, insightFeedback, onboarding.dismissedAt and recoveryModel with '?? []' / '?? {}'. A restored insightFeedback of {} is kept and saved. hiddenInsightIds loops over it with for..of and throws. Today is the default tab (router.ts:19) and reads insights at Today.tsx:35. A profileHistory of {} makes every profile edit throw (profile.ts:13 spreads it).
- What is correct: Array.isArray check, else [], for these lists and for dismissedAt; an object check, else {}, for the recoveryModel maps; drop non-object items, as the other lists already do.
- Evidence: checker2 C2: after parseBackup, Array.isArray is false for both lists; hiddenInsightIds -> 'TypeError: feedback is not iterable'; spreading profileHistory -> 'TypeError: ... is not iterable'; the next boot source is 'saved', so the backup fallback is never tried. The error card's only exit is a reset that clears all storage, the daily backup included (ErrorBoundary.tsx:22-26). The rule runner catches errors per rule (rules.ts:546), so profileHistory alone does not crash the screen.
- User impact: A damaged or hand-edited backup can lock the user out of the app until they wipe all their data.
- Source: DATA-S2, DATA-R17; D-QA (ST-11)

### DATA-F2 · Exercise search finds nothing for common plural words
- Severity **medium** · status **confirmed** · where `src/core/exercises.ts:219-241; src/slices/workout/ExercisePicker.tsx:41, 43`
- What the code does: searchExercises does no singular folding, although findByExactName strips a trailing s (exercises.ts:134-135). With no results the picker shows 'Nothing matches. You can create it below.' and fills the new-exercise name with the query.
- What is correct: Fold a trailing s on each word of the query, names and aliases before scoring.
- Evidence: probe S5 (re-run): no results for 'curls', 'bicep curls', 'squats', 'chin ups', 'pull downs' or 'dumbbell curls', while findExercise('squats') gives lib_barbell_back_squat and findExercise('chin ups') gives lib_chin_up.
- User impact: Users are pushed to create a duplicate of a library lift, which splits its history, records and progression.
- Source: DATA-S5, DATA-R60; S-IR

### DATA-F3 · Role comes from the movement pattern only, so accessories and jumps become main lifts
- Severity **medium** · status **confirmed** · where `src/core/exercises.ts:36-42, 68-71`
- What the code does: roleOf has no accessory exceptions. Face pull, upright row, band row, back extension, kettlebell swing, renegade row, bench dip, box jump and wall sit are 'main'. COACHING-DECISIONS:97 reuses roleOf but decides nothing about these moves.
- What is correct: A hand-checked accessory list that overrides the pattern (face pull, upright row, band moves, back extension, swings, plyometrics, holds).
- Evidence: research-role probe (re-run): every one of these gives role 'main' and a strength range of 1-5; face pull target '20 kg · 1–5 reps'. checker2 C14: box jump role main, setDamage 1.15 at 5 reps against 1 at 12.
- User impact: On the strength goal, face pulls and similar moves are coached at 1-5 heavy reps, and box jumps get heavy-lift recovery cost.
- Source: DATA-S14, DATA-R56; D-COACHPLAN (COACHING-PLAN:773 'and hand-checked'); S-NASM-FP

### DATA-F4 · Resistance-band exercises are treated as weighted
- Severity **medium** · status **confirmed** · where `src/core/exercises.ts:20-26; src/data/exercises.json (lib_resistance_band_row, lib_resistance_band_pull_apart)`
- What the code does: inferMode returns 'bodyweight' only for equipment exactly 'Bodyweight' or containing 'ab wheel'. 'Resistance Band' falls through to 'weighted'. The band row is also 'main' (pattern horizontal_pull).
- What is correct: Band equipment uses rep-based progression (bodyweight-style) or its own band mode.
- Evidence: research-role probe (re-run): a band row with 2 x 15 reps under the strength goal gives the target '0 kg · 1–5 reps'. The catalogue has 2 pure band moves plus lib_resisted_hip_flexion ('Cable / Resistance Band', covered by F13).
- User impact: Band users get a meaningless '0 kg · 1–5 reps' target instead of a rep goal.
- Source: DATA-S13, DATA-R55; D-F13 covers mixed-equipment moves only

### DATA-F5 · Conditioning sets count as muscle-building sets
- Severity **medium** · status **confirmed** · where `src/brain/exposure.ts:107-125`
- What the code does: effectiveSetsByMuscle does not filter by mode. Burpee has chest as its primary muscle, so each burpee set counts as one chest set. No owner decision in COACHING-DECISIONS covers this (BR-16 at :342-344 defines only the 1 / 0.5 / 0 weights).
- What is correct: Skip conditioning-mode sets, and probably duration holds, or count them separately.
- Evidence: checker2 C14: 3 burpee sets give {chest:3, quads:1.5, core:1.5}.
- User impact: Weekly chest volume looks higher than it is, which can hide under-training of a big-six muscle.
- Source: DATA-M3; S-PELLAND

### DATA-F6 · Hamstrings get secondary credit from squats, leg presses and lunges; adductors get none
- Severity **medium** · status **confirmed** · where `src/data/exercises.json (e.g. lib_barbell_back_squat, lib_leg_press, lib_hack_squat, lib_walking_lunge); src/data/muscles.ts:51`
- What the code does: 17 entries list hamstrings as secondary, including back, Smith, hack and pendulum squats, both leg presses, 3 lunges, the Bulgarian split squat and the step-up. An 'adductors' muscle id exists (muscles.ts:51), but none of these moves uses it.
- What is correct: Hamstrings as stabilizer (weight 0) or removed on squats, presses and lunges; adductors as secondary.
- Evidence: research-role probe (re-run): 4 squat sets and 3 leg-press sets give hamstrings 3.5 sets with no hamstring exercise. Hamstrings are one of the six 'big' muscles that get under-band warnings (COACHING-DECISIONS:344).
- User impact: A user who only squats and presses sees hamstring volume that is not real, so a hamstring under-training warning can stay silent.
- Source: DATA-R64; S-KUBO, S-EXRX-SQ, S-EXRX-LP (researcher sources, not re-fetched by me)

### DATA-F7 · An exercise's profile from another gym overrides this gym's own equipment setup
- Severity **medium** · status **confirmed** · where `src/brain/units.ts:44-57; src/slices/workout/units.ts:29-36, 39-49`
- What the code does: The order is: exercise here, then the exercise at any gym, then the equipment group here. setExerciseUnit writes a per-exercise profile on every unit flip. setEquipmentUnit ('Use lb for all Dumbbells here') clears per-exercise profiles only at the same gym (units.ts:46), so another gym's entry keeps winning.
- What is correct: Exercise here, then equipment group here, then the exercise at another gym, then the default.
- Evidence: checker2 C10: curl set to kg at gym A, Dumbbells set to lb at gym B; resolveProfile at gym B gives 'kg [2,4,6,8,10,12.5]'.
- User impact: At a second gym the app suggests dumbbell weights from the first gym's kg rack, which may not exist there.
- Source: DATA-R37; D-ESC (ESCOBAR-ARCHITECTURE:926 documents the order; not an owner decision in COACHING-DECISIONS)

### DATA-F8 · Old-app import: the body card's default 'male' overrides the profile sex, and the body card's height is dropped
- Severity **medium** · status **confirmed** · where `src/core/migrate.ts:252-259`
- What the code does: The old app's bodyComp starts as {sex:'male', unit:'cm', ...} and is saved on any height, neck, waist or hip input or unit tap (v36 loadSaved/persist), while user.profile.sex defaults to null. migrate.ts:259 lets bodyComp.sex overwrite profile.sex. bodyComp.height is never used.
- What is correct: Use profile.sex first and bodyComp.sex only when it is missing. Use bodyComp.height (cm or in) only to fill a missing heightCm. Do not invent dated tape readings.
- Evidence: v36 source: loadSaved returns {sex:"male",...}; each input fires persist({[key]:value}); the profile default has sex:null. checker2 C11: profile.sex 'female' plus bodyComp {sex:'male', waist:'70'} imports as 'male'. profile.sex drives BMR (energy.ts:27, +5 vs -161 kcal) and the body-fat formula, and onboarding asks for sex only when it is missing (Onboarding.tsx:39).
- User impact: A woman who typed a tape value in the old app without tapping 'Female' is imported as male, with wrong calorie and body-fat maths and no prompt to fix it.
- Source: DATA-R45, DATA-S19; L-V36

### DATA-F9 · The app never asks for persistent storage
- Severity **medium** · status **confirmed** · where `src (whole tree), index.html`
- What the code does: The whole history lives in localStorage ('marc.state.v1' plus its backup). No navigator.storage.persist() call exists (grep of src and index.html finds nothing).
- What is correct: Call navigator.storage.persist() on the PWA and check the result. On Android, consider storage the OS does not reclaim for the history.
- Evidence: grep 'persist()|storage.persist|storage.estimate' in src and index.html: no match. Browser eviction of best-effort origins is from MDN. I could not verify whether an Android WebView (Capacitor 8.5, package.json:25) actually evicts localStorage under low space.
- User impact: Under storage pressure the browser may delete the entire training history without warning.
- Source: DATA-M1; S-MDN-QUOTA, S-MDN-PERSIST, S-CAP

### DATA-F10 · No warning or plan for the localStorage size limit
- Severity **medium** · status **confirmed** · where `src/core/store.ts:292-318; src/core/heartStore.ts:8, 31-32`
- What the code does: The state is stored twice (main key and daily backup). It shares the origin quota with 'marc.heart.v1' (up to 60 series; the doc estimates about 40 KB each) and the Escobar conversation key. Nothing measures usage, and history cannot be moved or trimmed. When full, persistNow sets saveError and the new data lives only in memory.
- What is correct: Measure usage, warn well before the quota, and move sessions to IndexedDB (with persist()) before the limit.
- Evidence: checker2 C17: one realistic 6-exercise x 4-set session is 6,104 JSON characters, so two copies fit about 409 sessions in 5M characters, before heart series and chat take their share. This is an estimate: how each browser counts the quota was not verified.
- User impact: After a few hundred workouts, saving starts to fail and new workouts are lost at the next restart.
- Source: DATA-M2; S-MDN-QUOTA; D-ESC (:253)

### DATA-F11 · The app cannot restore its own rescue file
- Severity **medium** · status **confirmed** · where `src/slices/settings/backup.ts:30-37; src/core/rescue.ts:8-15; src/core/store.ts:328; index.html:58`
- What the code does: Rescue files are {app, kind:'rescue', keys:{'marc.state.v1':'<json text>', ...}}. parseBackup looks only at a top-level 'state' key or a bare state, so it rejects them.
- What is correct: Recognise kind 'rescue', parse keys['marc.state.v1'] (or the .corrupt/.backup copies), and restore it through the same repair.
- Evidence: probe S11 (re-run): parseBackup(buildRescueJson(...)) gives {"error":"That file is not an M/ARC backup"}. After the error card's reset (ErrorBoundary.tsx:22-26 clears all storage), this file may be the only copy.
- User impact: After a crash and a reset, the user's saved rescue file cannot be loaded back without hand-editing JSON.
- Source: DATA-S9; D-REMPLAN (R1.2 makes the file only to keep data; R1.3 lists the formats restore accepts)

### DATA-F12 · Finishing a workout drops the note on an exercise that has no filled set
- Severity **medium** · status **confirmed** · where `src/slices/workout/session.ts:446-449 (also :520 for past-session logging)`
- What the code does: finishSession drops skipped entries and entries with no filled set, and their notes go with them.
- What is correct: Keep an exercise that has a note, even with zero sets, or move the note into the session note.
- Evidence: checker2 C6: an active session with Squat (1 set) and Leg Press (no filled set, note 'knee hurt, stopped') saves only [["Squat",1,null]].
- User impact: A note like 'knee hurt, stopped' on a skipped exercise is lost without any warning.
- Source: Found while checking DATA-S12

### DATA-F13 · CSV export loses a note when an exercise has no filled set
- Severity **low** · status **refuted** · where `src/slices/settings/exportCsv.ts:23, 27`
- What the code does: The CSV code would drop such a note, but the app never saves an exercise with no filled set: finishSession (session.ts:449) and past-session logging (session.ts:520) filter them out, and no writer found later empties a saved exercise. Only a foreign or restored file can reach this path.
- What is correct: No CSV change needed for app-made data. The real loss happens at finish (DATA-F12).
- Evidence: probe S10 reproduces the header-only output with a hand-made session. checker2 C6 shows the note is already gone at finish.
- User impact: None for data the app saved itself; the note is lost earlier, at finish.
- Source: DATA-S12

### DATA-F14 · Old-app lb import: the 'as typed' backfill runs on an empty list (dead code), but real old-app values still display correctly
- Severity **low** · status **confirmed** · where `src/core/migrate.ts:234-238 vs 262; src/core/units.ts:57-63; tests/migrate.test.ts:36`
- What the code does: backfillLegacyLbEntries runs on the fresh empty session list, and line 262 then assigns the real sessions unchanged. v36 stored lb input as kg rounded to 0.01 (inputToKg: Math.round(kg*100)/100), not 0.25 kg, so even a working backfill would do nothing: its round-trip check needs values on the 0.25 kg grid. The premise in REMEDIATION-PROGRESS:45 is wrong.
- What is correct: Remove the dead call or run it on the real sessions. Correct the doc premise, and use a real v36 value in migrate.test.ts.
- Evidence: probe S1: no 'entered' after convertLegacy, reload or restore. checker2 C1: the v36 value 102.06 kg (225 lb) stays unchanged after backfill and displays as 225 lb; 100 lb and 47.5 lb also display exactly.
- User impact: None visible today: genuine old-app lb loads still show as typed.
- Source: DATA-S1; L-V36; D-REMPROG:45

### DATA-F15 · Repair does not check set numbers or session duration
- Severity **low** · status **confirmed** · where `src/core/store.ts:64`
- What the code does: Only non-object sets are dropped. String, negative or huge kg/reps and a string session durationSec survive. Most set maths converts strings to numbers, but at least two sums join text: cardData.ts:197 (session duration) and escobar/tools/show.ts:71 (assisted reps).
- What is correct: Keep kg, reps, durationSec and distanceM only as finite numbers within the parse.ts ranges; turn numeric strings into numbers; drop anything else.
- Evidence: probe S3: {kg:'80'}, kg:-50, reps:1e9 and durationSec 'abc' survive with dropped 0. checker2 C3: kg 5000 becomes the 'heaviest' record (5000) and an e1RM record of 6166.7; summarizeSets converts '100' to 100. In node, 0 + ('3600'||0) gives '03600'.
- User impact: A foreign or hand-edited backup can plant absurd records and garbled share-card totals.
- Source: DATA-S3, DATA-R14; D-QA (ST-11)

### DATA-F16 · A repaired session with only a day gets a start on the next local day in UTC+12 to +14
- Severity **low** · status **confirmed** · where `src/core/store.ts:61-62 (compare src/core/migrate.ts:189)`
- What the code does: A missing startedAt becomes `${day}T12:00:00.000Z` (UTC noon). The migration uses local noon.
- What is correct: new Date(`${day}T12:00:00`).toISOString() (local noon).
- Evidence: Re-run S4 with TZ=Pacific/Auckland and TZ=Pacific/Kiritimati: start 2026-09-10T12:00:00.000Z has local day 2026-09-11, while the stored day is 2026-09-10.
- User impact: In damaged data from far-east time zones, anything that reads the start time places the session one day late.
- Source: DATA-S4, DATA-R13; S-MDN-DATE

### DATA-F17 · Exercise picker cuts results to 12 before removing exercises already in the split
- Severity **low** · status **confirmed** · where `src/slices/workout/ExercisePicker.tsx:17`
- What the code does: searchExercises applies its limit of 12 first, and excluded ids are removed afterwards.
- What is correct: Remove excluded ids first, then take the top 12.
- Evidence: checker2 C5: a split holding 5 of the top 'press' hits makes the picker show 7 results, although 20 other matches exist.
- User impact: Valid matches are hidden on broad searches, and a split holding the top hits can even show 'Nothing matches'.
- Source: DATA-S6, DATA-R61

### DATA-F18 · A full storage deletes the restore point even when the retried save still fails
- Severity **low** · status **confirmed** · where `src/core/store.ts:302-305`
- What the code does: On a quota error the backup and its day stamp are removed, then the save is retried. If the retry fails, the function returns false with the backup already gone. Per the HTML spec, the main key keeps its last good value.
- What is correct: If the retry fails, write the old backup back (its space is free again).
- Evidence: probe S6 (re-run): saved false, backup present false, main key still holds the last good save ('A').
- User impact: The daily restore point is lost for nothing at the moment saving is already failing.
- Source: DATA-S7; S-HTML

### DATA-F19 · A saved today-plan change keeps any load factor or set count
- Severity **low** · status **confirmed** · where `src/core/escobarState.ts:44-46; src/escobar/tools/actions.ts:193-195; src/slices/workout/session.ts:88, 96`
- What the code does: The repair accepts any finite factor or sets value; only the Escobar tool enforces sets 1-6 and factor 0.5-1.1. plannedExercises applies the factor as-is, but only on the override's own day.
- What is correct: Apply the tool's bounds in the repair and drop out-of-range changes.
- Evidence: probe S7 (re-run): factor 10 and sets -3 are kept.
- User impact: A hand-edited backup restored the same day could scale today's target load tenfold.
- Source: DATA-S8, DATA-R31

### DATA-F20 · Start-up rejects a state that restore accepts and repairs
- Severity **low** · status **confirmed** · where `src/core/store.ts:27-29 vs src/slices/settings/backup.ts:28`
- What the code does: isState also requires a 'splits' array; looksLikeState does not, and the repair already rebuilds splits as [] (store.ts:48).
- What is correct: The same gate in both places (version 1 plus a sessions array), with the repair filling in splits.
- Evidence: probe S8 (re-run): the same state without splits restores as 'v37', while boot gives source 'fresh'.
- User impact: Only foreign files: at start-up, readable data is set aside and an older backup or an empty state is loaded.
- Source: DATA-S10, DATA-R2; D-REMPLAN

### DATA-F21 · CSV export does not guard against spreadsheet formulas
- Severity **low** · status **confirmed** · where `src/slices/settings/exportCsv.ts:9-13`
- What the code does: Cells starting with = + - @ are written as-is. Quoting (applied only for comma, quote or line break) does not stop a spreadsheet from running a formula.
- What is correct: Prefix dangerous leading characters (OWASP), noting that this changes the text on re-import.
- Evidence: probe S9 (re-run): split '=1+1' and note '+cmd' are written unquoted.
- User impact: Low: only the user's own text, but a spreadsheet may run it as a formula.
- Source: DATA-S11; S-OWASP

### DATA-F22 · Custom exercise: mode ignores the equipment, and duplicate names are allowed
- Severity **low** · status **confirmed** · where `src/slices/workout/ExercisePicker.tsx:15, 21; src/core/exercises.ts:259; src/slices/workout/splits.ts:81-83`
- What the code does: The picker always passes mode 'weighted', so inferMode never runs. saveCustomExercise replaces only by id, so a second custom with the same name is accepted.
- What is correct: Default the mode from the equipment until the user changes it (inferMode must also learn 'Band'), and warn when the folded name already exists.
- Evidence: checker2 C15: Bodyweight through the picker path gives 'weighted', the inferMode path gives 'bodyweight', and 'Band' gives 'weighted' either way.
- User impact: A bodyweight custom exercise is coached as 'add load' unless the user also changes the mode, and duplicates split history.
- Source: DATA-S15, DATA-R62

### DATA-F23 · The backup file name uses the UTC date
- Severity **low** · status **confirmed** · where `src/slices/settings/Settings.tsx:96 (vs backup.ts:52-56)`
- What the code does: The name is `marc-backup-${new Date().toISOString().slice(0,10)}`, a UTC date, while the backup age uses local days.
- What is correct: Use dayKey() (local date).
- Evidence: Code reading: toISOString is always UTC (MDN).
- User impact: Near midnight the file name shows a different day from the one the app reports.
- Source: DATA-S16; S-MDN-DATE

### DATA-F24 · Deleting a gym leaves the live session pointing at it
- Severity **low** · status **confirmed** · where `src/slices/workout/units.ts:90-98; src/slices/workout/Train.tsx:513; src/slices/workout/session.ts:468; src/brain/units.ts:55`
- What the code does: deleteGym re-points activeGymId but not state.active.gymId. The live session then resolves profiles with the deleted id: it falls back to the first gym's default ladders, not that gym's saved group profiles, and the finished session stores the deleted id.
- What is correct: Re-point active.gymId to the new active gym when its gym is deleted.
- Evidence: Code reading of the lines cited; brain/units.ts:194 already skips unknown gym ids when counting.
- User impact: Deleting a gym mid-workout switches suggestions to built-in default steps for the rest of that session.
- Source: DATA-S17

### DATA-F25 · Split exercises are not checked on repair
- Severity **low** · status **confirmed** · where `src/core/store.ts:82; src/core/exercises.ts:102-104; src/slices/workout/session.ts:86-87`
- What the code does: Only non-object split exercises are dropped. An item without exerciseId, or with sets 999, survives, and findExercise(undefined) throws.
- What is correct: Drop split exercises without a string exerciseId, and clamp sets to a whole number from 1 to 10 (as migrate.ts:212).
- Evidence: checker2 C8: [{sets:3},{exerciseId:'lib_barbell_back_squat',sets:999}] kept with dropped 0; plannedExercises gives sets [3, 999]; findExercise(undefined) gives 'TypeError: Cannot read properties of undefined (reading toLowerCase)'. Which screen would crash first was not traced.
- User impact: Foreign files only: a bad split can plan 999 sets or break screens that name its exercises.
- Source: DATA-R12; D-REMPLAN

### DATA-F26 · Preferences are not range-checked on repair
- Severity **low** · status **confirmed** · where `src/core/store.ts:153-159 (UI clamps 15-600 s at Settings.tsx:160; import at migrate.ts:241)`
- What the code does: restDefaultSec and the other preferences are merged over the defaults with no range check.
- What is correct: Clamp to valid ranges (rest 15-600 s) or fall back to the default.
- Evidence: checker2 C9: restDefaultSec -30 survives repair.
- User impact: Foreign files only: a nonsense rest length until the user taps -15/+15.
- Source: DATA-R21

### DATA-F27 · Repair accepts an http:// coach proxy URL that Settings would refuse
- Severity **low** · status **confirmed** · where `src/core/escobarState.ts:78 vs src/escobar/ui/SettingsSection.tsx:26`
- What the code does: The repair keeps any http(s) URL; the Settings field accepts only https://.
- What is correct: Accept https:// only, the same rule as the UI.
- Evidence: Code reading. capacitor.config.json sets no cleartext or mixed-content option (Capacitor 8.5), so plain http is probably blocked on both the PWA and Android. Not verified on a device.
- User impact: Very small: a hand-edited file could point the coach at a plain-http address, which the platform most likely blocks.
- Source: DATA-R29

### DATA-F28 · Bar weight is capped at 30 kg
- Severity **low** · status **confirmed** · where `src/core/escobarState.ts:126; src/escobar/tools/actions.ts:276`
- What the code does: Both the repair and the Escobar tool, the only way to set a bar weight (no UI input found), accept 5-30 kg.
- What is correct: Raise the upper bound to about 35-40 kg in both places.
- Evidence: Code reading. The catalogue has no specialty-bar exercise, so the case needs a custom exercise.
- User impact: A user with a bar heavier than 30 kg cannot get correct plate maths.
- Source: DATA-R33; S-ROGUE (researcher source, not re-fetched)

### DATA-F29 · Name lookup misses the hyphenated spelling 'pull-down'
- Severity **low** · status **confirmed** · where `src/core/exercises.ts:109-110`
- What the code does: The pulldown rule runs before punctuation is removed, so 'pull-down' becomes 'pull down' and never folds to 'pulldown'.
- What is correct: Match /pull[\s-]?down/ or turn hyphens into spaces first.
- Evidence: checker2 C12: findExercise('Lat Pull-Down') and findExerciseWithEquipment('Lat Pull-Down','Cable') give undefined, while 'lat pull down' gives lib_lat_pulldown. The v36 library uses 'Pulldown' (134 hits, no 'Pull-Down' exercise name), so the old-app import is not affected; typed custom names and Escobar lookups are.
- User impact: A lookup by the 'pull-down' spelling does not match the library lift.
- Source: DATA-R58

### DATA-F30 · A backup from a newer app version restores with no warning
- Severity **low** · status **confirmed** · where `src/slices/settings/backup.ts:30-50`
- What the code does: parseBackup never reads 'schema' or 'version'. Unknown top-level fields are kept, but the field-by-field repairs (for example normalizeEscobar) drop unknown keys.
- What is correct: Warn before replacing data when the file's schema is above BACKUP_SCHEMA.
- Evidence: checker2 C16: schema 99 / version 99.0.0 restores as 'v37'; the top-level futureField is kept; an unknown Escobar key is dropped.
- User impact: Restoring into an older install can silently drop newer settings.
- Source: DATA-M4; D-RR (RELEASE-READINESS:61)

## Not covered

- src/data/exercises.json (2810 lines) was checked by script (ids, names, aliases, muscles, sets, modes, roles, missing ids), not read line by line; the anatomy and pattern choice of each entry was not judged by eye.
- src/slices/settings/Settings.tsx read only at lines 1-145 (backup, restore, reset, CSV and rescue logic); the rest is UI rows.
- src/escobar/store.ts: sanitizeStore / saveStore (what a restore does to conversations) not read; that is the Escobar area.
- src/brain/units.ts: defaultProfile not read (used by the unit flips in slices/workout/units.ts).
- src/data/muscles.ts classifyMuscleText and src/data/goals.ts isGoalId were not read in full.
- Scratch probe files kept (throwaway): tests/qa-scratch/data/catalogue.test.ts, probe.test.ts, rescue.test.ts. No repository file was changed. No agents were spawned, so there were none to archive.

## Sources

- **S-HTML** HTML Standard, Web Storage: setItem throws QuotaExceededError when the value cannot be stored (map unchanged); storage events fire in other documents — https://html.spec.whatwg.org/multipage/webstorage.html
- **S-MDN-QUOTA** MDN: Storage quotas and eviction criteria (5 MiB localStorage per origin, best-effort LRU eviction, persist()) — https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- **S-MDN-PERSIST** MDN: StorageManager.persist() — https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
- **S-MDN-DOMEX** MDN: DOMException, QuotaExceededError legacy code 22 — https://developer.mozilla.org/en-US/docs/Web/API/DOMException
- **S-FF1014** Firefox quota error NS_ERROR_DOM_QUOTA_REACHED, code 1014 (secondary source) — https://mmazzarolo.com/blog/2022-06-25-local-storage-status/
- **S-CAP** Capacitor storage guide: the OS will reclaim WebView local storage when the device is low on space — https://capacitorjs.com/docs/guides/storage
- **S-RFC4180** RFC 4180, section 2 (CSV format) — https://www.rfc-editor.org/rfc/rfc4180
- **S-OWASP** OWASP: CSV Injection (dangerous leading characters and mitigations) — https://community.owasp.org/attacks/CSV_Injection
- **S-MDN-DATE** MDN: Date time string format (date-only is UTC, date-time without offset is local, Z is UTC) — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format
- **S-NIST** NIST SP 811 Appendix B: 1 lb (avoirdupois) = 0.453 592 37 kg exactly — https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors
- **S-NAVY-METRIC** US Navy (Hodgdon-Beckett) metric body-fat equations, 495/D - 450 — https://www.calculator.net/body-fat-calculator.html
- **S-NAVY-INCH** Circumference-based body fat revisited (quotes Hodgdon & Beckett 1984 inch equations) — https://pmc.ncbi.nlm.nih.gov/articles/PMC9008774/
- **S-KUBO** Kubo, Ikebukuro, Yata 2019, Eur J Appl Physiol 119:1933-42: 10 weeks of squats did not change hamstring volume; adductors and gluteus maximus grew — https://link.springer.com/article/10.1007/s00421-019-04181-y
- **S-EXRX-SQ** ExRx Barbell Squat: target quadriceps; synergists gluteus maximus, adductor magnus, soleus; hamstrings are dynamic stabilizers (from a search summary, because the page returned 403) — https://exrx.net/WeightExercises/Quadriceps/BBSquat
- **S-EXRX-LP** ExRx leg press variants: target quadriceps; synergists gluteus maximus, adductor magnus, soleus; hamstrings are dynamic stabilizers (from a search summary, because the page returned 403) — https://exrx.net/WeightExercises/Quadriceps/LVLyingLegPressH
- **S-PELLAND** Pelland et al. 2025, Sports Med: resistance-training dose response; 'fractional' counting (indirect set = 0.5) fits hypertrophy best — https://link.springer.com/article/10.1007/s40279-025-02344-w
- **S-NASM-FP** NASM exercise library: Face Pull, 3 sets of 12-15 reps; posterior deltoid and rhomboids — https://www.nasm.org/resource-center/exercise-library/face-pull
- **S-IR** Manning, Raghavan, Schutze, Introduction to Information Retrieval: stemming and lemmatization (normalising inflections raises recall) — https://nlp.stanford.edu/IR-book/html/htmledition/stemming-and-lemmatization-1.html
- **S-FOWLER** Fowler/Sadalage, Evolutionary Database Design (versioned migrations that also move existing data) — https://martinfowler.com/articles/evodb.html
- **S-ROGUE** Rogue SB-1 safety squat bar, 70 lb (31.75 kg) — https://www.roguefitness.com/sb-1-rogue-safety-squat-bar
- **D-ARCH** Project: docs/ARCHITECTURE.md storage table and repair notes — /home/user/marc-main/docs/ARCHITECTURE.md:36-54
- **D-REMPLAN** Project: REMEDIATION-PLAN R1.1 store hardening, R1.2 rescue, R1.3 backup/restore, RG-17 CSV — /home/user/marc-main/docs/REMEDIATION-PLAN.md:205-250, 615
- **D-REMPROG** Project: REMEDIATION-PROGRESS (line 45: legacy lb backfill decision; QA-R1-x, QA-R3a-10, QA-R6-1 notes) — /home/user/marc-main/docs/REMEDIATION-PROGRESS.md:40-66, 250-330
- **D-QA** Project: QA-REGRESSION-AUDIT (ST-01, ST-10, ST-11, ST-19, RG-02, VX-01, BR-01) — /home/user/marc-main/docs/QA-REGRESSION-AUDIT.md:85, 181-197
- **D-COACHPLAN** Project: COACHING-PLAN: role is derived from the pattern list 'and hand-checked' — /home/user/marc-main/docs/COACHING-PLAN.md:773
- **D-DECISIONS** Project: COACHING-DECISIONS (damage list decision :59-60; set counting :342-344, :412) — /home/user/marc-main/docs/COACHING-DECISIONS.md
- **D-F13** Project: F13-BODYWEIGHT-LOAD: mixed-equipment moves stay weighted (owner-approved design) — /home/user/marc-main/docs/F13-BODYWEIGHT-LOAD.md:440, 452
- **D-ESC** Project: ESCOBAR-ARCHITECTURE: WebView localStorage is about 5 MB and state is written twice (:253); resolveProfile order (:926) — /home/user/marc-main/docs/ESCOBAR-ARCHITECTURE.md:253, 926
- **D-RR** Project: RELEASE-READINESS: a saved-data shape change ships only with a tested backup restore — /home/user/marc-main/docs/RELEASE-READINESS.md:61
- **L-V36** Old app source: inputToKg stores typed lb as kg rounded to 0.01; bodyComp default {sex:'male', unit:'cm', ...} saved on any input — /home/user/marc-main/legacy/v36/index.html (offsets ~6421400 inputToKg; ~6510720 loadSaved/persist)
- **P-PROBE** Checker's probes, re-run by me (S1-S10 outputs confirmed; S4 re-run under TZ=Pacific/Auckland) — /home/user/marc-main/tests/qa-scratch/data/probe.test.ts
- **P-ROLE** My probe: roles and rep ranges under the strength goal, band and face-pull targets, weekly sets from squats, leg press and burpees — /home/user/marc-main/tests/qa-scratch/data/research-role.test.ts