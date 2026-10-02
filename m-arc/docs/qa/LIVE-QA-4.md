# Live QA round 4: share cards (PR #12 @ c6ebaf4) and watch commits (06369f0..64765b5)

Each finding was checked by a reviewer and then a skeptic that tried to refute it. Mediums were reproduced. Fix each one with a test that fails before and passes after, and put the id in the commit message.

## Share cards (PR #12)

What works: the numbers match Stats, kg/lb are followed, and the preview matches the exported PNG. Back/Escape close the sheet, and the share code loads as its own offline-cached chunk. Gate passes (palace 74/74).

### Medium

- **QA4-1 · Assisted exercises count the machine's help as weight lifted** (src/brain/weekly.ts:15 `workingTotals`; used at cardData.ts:110, 142, 162).
  - Symptom: Assisted Pull-Up 3×10 @40 adds 1,200 kg. More help gives a bigger "lifted" number and comparison.
  - Fix: `workingTotals(exercises, custom = [])` still counts the set but adds no volume when `modeOf(e.exerciseId, custom) === 'assisted'`. Pass `custom` from weekSummary, weeklyVolumeHistory and both cardData paths, so Stats and the card stay equal.
  - In workoutLines, for assisted exercises: top = the lowest-kg set, label `@40 assist`, and the line value = sets, not kg.
  - Tests: an assisted case in share-cards and one in weekly.
- **QA4-2 · Carries, sleds and loaded holds print `3×0 @32 … BW`** (cardData.ts:95-110).
  - Fix: when topReps is 0, build the detail from distance, then time, then reps (`3×40 m @32`, `3×60s @20`).
  - `lineValue` returns 'BW' only when no working set has kg > 0; otherwise '—'. Apply the same rule in periodLines.
  - Tests: a Farmer's Carry logged as kg + m with no reps, and a Sled Push logged with metres only.
- **QA4-3 · Save does nothing useful on Android 8–10**: storage permissions are not declared (src/native/share.ts:53-61, native/patch_manifest.py).
  - Fix: add `WRITE_EXTERNAL_STORAGE` and `READ_EXTERNAL_STORAGE`, both with `maxSdkVersion="29"`, and `android:requestLegacyExternalStorage="true"` on `<application>`, all in patch_manifest.py.
  - Test the patched manifest if a harness exists.
  - Don't edit the workflow signing steps.
- **QA4-4 · A second Save on the same day silently overwrites the first** (ShareSheet.tsx:108 file name; share.ts:57 writes in overwrite mode).
  - Example: two sessions on one day, or the same card saved again with a new photo.
  - Fix: make the saved name unique. Add HHMMSS, plus the session id for workout cards. The Share cache name can stay as it is.
- **QA4-5 · Photo/Save/Share buttons are off-screen when the sheet opens at 360 px width** (styles.css:418-434; the sheet is 790 px tall inside a 588 px panel).
  - Fix: `.share-actions { position: sticky; bottom: 0; z-index: 1; background: var(--surface-1); margin: 0 -16px; padding: 12px 16px 8px; }`
  - Check at 360×640 and 390×844, with safe-area insets 0, 24 and 48 px.

### Low

- **QA4-6 · Ramped sets** read as `3×5 @80` when only one set was at 80 (cardData.ts:106). Use `n×reps @load` only when every working set is identical; otherwise `3 sets, top 5@80`.
- **QA4-7 · A workout card shows PRs from another session on the same day** (cardData.ts:141). Carry `sessionId` on each record in allRecords and filter on `r.sessionId === s.id`.
- **QA4-8 · A warm-up-only session gets a shareable 0 sets / 0 kg card.**
  - Gate the Share button on working sets > 0.
  - In ShareSheet, treat `data.sets === 0` as empty.
  - Leave the Finish/History set counts as they are.
- **QA4-9 · A bodyweight-only workout headlines "0 KG LIFTED"** (cards.ts:138, 180).
  - When volume is 0, the poster and sticker show working sets ("sets done") instead.
  - The receipt drops the TOTAL LIFTED line.
- **QA4-10 · Period "Time" undercounts when legacy sessions have no duration** (cardData.ts:167). If any session in range has no duration, show `14 h 5 m+`.
- **QA4-11 · Shared PNGs, including the photo, pile up in the cache** (share.ts:36-38). Before writing, rmdir `Cache/MARC Share` recursively and ignore errors.
- **QA4-12 · PWA Share can fall back to a download**, because the PNG render uses up the tap's user activation (ShareSheet.tsx:115).
  - Pre-render the PNG into a ref in an effect on [svgs, current, format].
  - On NotAllowedError, keep the blob and say "Ready, tap Share again".
- **QA4-13 · A failed chunk load keeps failing until restart** (lazy.tsx:11). Show `showToast('Could not load sharing.', 'Reload', () => location.reload())`.
- **QA4-14 · The carousel scroll ignores Reduce motion** (ShareSheet.tsx:95). Use `behavior: 'auto'` when `prefers-reduced-motion: reduce`.
- **QA4-15 · Tap targets are under 44 px** (styles.css:426, 432).
  - `.share-dots button` 44×44 with the 6 px dot unchanged, and `.share-dots { gap: 0 }`.
  - `.share-size button { min-height: 44px }`.

## Watch commits (codex/gt6-gate-a-watch-lab)

Passed. Nobody can get stuck unable to log a set. No new permissions are needed. CI claims are true: 912 tests in 3 time zones, APK signed 05:66…F1:F5. Fix these before handover is enabled:

- **QA4-W1 · The heart journal is never deleted, survives Reset app data, and sits in Android Auto Backup** (WorkoutCommandStore.java:33, 437; store.ts resetState).
  - Delete the rows once a handover is settled or exported.
  - Add a native wipe to the Reset path.
  - Exclude marc_watch_workout_v1.db from backup.
- **QA4-W2 · Heart capture fails silently** (WorkoutHeartRecorder.java:42, 106, 123; JS ignores `heartCapture`).
  - Log the exception class only.
  - Show "Watch heart rate isn't being saved for this workout".
- **QA4-W3 · One SQLite open/commit/close per BLE packet** (WorkoutHeartRecorder.java:153-161).
  - Keep one store open.
  - Write in batches every 5–10 s.
  - Flush on ownership read and on stop.
- **QA4-W4 · Heart samples are dropped while ownership is 'checking'** (heart.ts:48, up to 12 s).
  - Keep capturing and discard only if ownership resolves to native.
  - Or record the gap in GATE-B.md.
- **QA4-W5 · CI doesn't prove the Java test classes ran** (build-apk.yml:140-143).
  - Parse the test-results XML.
  - Require both classes with tests > 0 and no failures, errors or skips.

## Re-check of the QA3 fixes (PR #13 @ 616e369)

Fixed as specified: QA3-1, QA3-4, QA3-5, QA3-9, QA3-10. The seven below were reproduced by a skeptic at 616e369. Each fix was run in a worktree and the full suite passes. Add every listed test, and put the id in the commit message (e.g. "QA3-2b: …").

- **QA3-2b · The gear check broke exact library matches and split customs** (src/core/exercises.ts:202; src/core/migrate.ts:108).
  - Lost library matches: 'Straight-Bar Triceps Pushdown', 'bar pushdown', 'straight bar pressdown' and 'landmine t bar row' no longer resolve to their library entries.
  - Split customs: 'DB Skull Crusher' and 'Dumbbell Skull Crusher' now become two customs instead of one.
  - Still merging: the legacy key 'Cable Hammer Curl|Cable' still merges into lib_hammer_curl.
  - Fix:
    - exercises.ts:202 → `if (found) return findExerciseExact(name, custom) === found || gearAgrees(name, found.equipment) ? found : undefined;`
    - migrate.ts: import findExerciseExact; at :108 resolve `byKey` with `findExerciseExact(...)`, not `findExercise`.
  - Tests:
    - `findExerciseWithEquipment('bar pushdown','Cable')?.id === 'lib_straight_bar_triceps_pushdown'`
    - The two skull-crusher rows (type '') give 1 custom.
    - Key 'Cable Hammer Curl|Cable' does not map to lib_hammer_curl.
- **QA3-3b · Above the rack, lb users see odd numbers** (progression.ts:99, :161). A 225 lb trap-bar carry shows '224.9 lb · 45 m'.
  - Fix at :161: `const kg = last.topKg > 0 ? (ctx?.deload ? half(last.topKg * ctx.deload.loadFactor) : ctx?.equipment ? last.topKg : half(last.topKg)) : null;`
  - Fix at :99: replace the early return with a restatement in the profile unit: `if (conditioning && s.kg > loadableTopKg(profile) + 0.01) { const value = kgToDisplay(s.kg, profile.unit); return { ...s, unit: profile.unit, value, target: s.target.replace(`${s.kg} kg`, `${value} ${profile.unit}`) }; }` (import kgToDisplay from '@/core/units').
  - Test: 225 lb carry, defaultProfile('Dumbbells','lb') → '225 lb · 45 m', value 225.
- **QA3-11b · Carries now always snap down, even in a normal week** (progression.ts:91).
  - Examples: 32 kg becomes 30 kg next to 'same load', and an Escobar ×1.05 increase is lost.
  - Fix:
    - :91 → remove `distance: 'down', duration: 'down'`.
    - snapToEquipment gets a `force?: 'up' | 'down'` parameter, with `const dir = force ?? SNAP_DIRECTION[s.mode] ?? 'nearest'`.
    - In suggestNext, force 'down' only when `ctx.deload` or `0 < ctx.loadFactor < 1`. Never force 'up'.
  - Tests:
    - 75 lb carry on the lb ladder → 75.
    - 32 kg carry → 32.5.
    - 30 kg carry with loadFactor 1.05 → 32.5.
    - DB bench 25 kg with loadFactor 0.95 → 22.5.
    - Lighter-week 32 kg → 27.5 still passes.
- **QA3-6b · Save-for-future overwrites sets the person added themselves** (session.ts:358-384). Split 1 set, Escobar sets 3, the person adds 2 (5 done): it saves 1.
  - Fix: `overriddenSets = new Map<string, number>()` (the last 'sets' change wins). Save the split's count only when `overriddenSets.get(id) === liveCount`; otherwise save liveCount.
  - Test: split 2, override 4, addSet twice → saves 6.
- **QA3-7b · The restore position is wrong when combined with a substitution** (session.ts:392).
  - Fix: in the backward search also match `substituteForFrom.get(nid)?.exerciseId`.
  - Test: split [bench, DB shoulder press, fly]; swap bench→DB bench; remove shoulder press; substitute DB bench→incline → [incline, DB shoulder press, fly].
- **QA3-8b · Saving can drop the swapped-away lift from the split** (session.ts:367-377 matches by index). Split [bench, fly], swap bench→DB bench, drag fly to the top, Save: bench is lost.
  - Fix: match by lineage, not by index.
    - models.ts:213: add optional `plannedId?: string` to the active entry.
    - substituteEntry sets `plannedId: e.plannedId ?? e.exerciseId`.
    - Replace the index lookup with: for each swap (skip `c.to === c.from` or `inSplit.has(c.to)`): `const live = done.find(e => e.plannedId === c.to && e.exerciseId !== c.to); if (live && live.exerciseId !== c.from) substituteForFrom.set(c.from, { exerciseId: live.exerciseId, sets: Math.max(1, live.sets.filter(x => x.kind !== 'warmup').length) });`
  - Tests (each after swap bench→DB bench):
    - moveEntry(1,0) keeps bench.
    - Split [fly, bench, lateral] + removeEntry(0) → [bench, lateral].
    - substituteEntry(0, bench) → [bench, fly].
    - Split [bench, DB bench, fly] + sub DB→incline → [bench, incline, fly].
    - The existing QA3-8 test still expects [incline, fly].
- **QA3-12b · Targets read '1 reps' again for custom carries and some library conditioning moves** (progression.ts:158 gates on 3 hard-coded ids, not on mode).
  - Fix: `const carryOrSled = CARRY_OR_SLED_IDS.has(exerciseId) || (!!meta?.custom && mode === 'conditioning'); if (mode === 'conditioning' && (carryOrSled ? last.bestDistanceM > 0 || last.bestDurationSec > 0 : last.bestDistanceM > 0 || (last.bestDurationSec > 0 && !(last.bestReps > 0)))) {`
  - Tests:
    - Custom 'Yoke Walk' 100 kg × 20 m → '100 kg · 25 m'.
    - 100 kg × 30 s → '100 kg · 35s'.
    - 100 kg × 30 s + 8 reps → a duration goal.
    - lib_battle_ropes 30 s → '35s'.
    - lib_bear_crawl 20 m → '25 m'.

## Re-check of the watch fixes (@ 8fc26d8)

QA4-W3, W4 and W5 are fixed. Signing and the pinned fingerprint are untouched. Reset can't wipe a live watch workout.

W1 and W2 have two gaps. Neither can happen while handover is disabled. Re-check both when handover is switched on:
- 'Delete once settled/exported' only reaches cancelled handovers.
- A mid-workout write failure shows its notice only at the next app start.

## Re-check of the share-card fixes (PR #12 @ 2c0bb73)

14 of 15 are fixed. QA4-1 is partly fixed: History, Stats, the volume chart, and Escobar's get_volume, week_summary and brief all now agree with the card.

- **QA4-1b · Escobar's compare_periods still counts assistance as volume**
  - Where: src/escobar/tools/show.ts:176-177.
  - Repro: Assisted Pull-Up 3×10 @40 plus Bench 3×5 @60 gives 2100 in compare_periods, but 900 everywhere else.
  - Fix:
    - Replace the loop with `const { sets, volumeKg: vol } = workingTotals(inP.flatMap(x => x.exercises).filter(e => !exercise || e.exerciseId === exercise), s.customExercises);`
    - Import `workingTotals` from '@/brain/weekly'.
    - Drop the unused `isWorkingSet` import (:25).
  - Test: compare_periods volume for that week === `weeklyVolumeHistory([s], TODAY, 1)[0].volumeKg` (900).
  - Also, both low:
    - (a) show.ts:63 lift_trend 'volume': for an assisted exercise, use the sum of reps.
    - (b) cardData.ts:119-123: for assisted exercises, pick the top from all working sets sorted by kg ascending. When top.kg is 0, omit the '@… assist' load.

## Re-check of the QA3 b-fixes (PR #13 @ 7bd7487)

Fixed: QA3-2b, 6b, 8b (including stored sessions without plannedId), 11b and 12b. The original QA3-2, 3, 11 and 12 scenarios still pass, and the show.ts merge keeps both sides. Two small follow-ups:

- **QA3-7c (a regression vs main) · The wrong spot again after the person's own swap** (session.ts:402).
  - Examples:
    - Split [bench, DB shoulder press, fly]. Escobar removes shoulder press, and the person swaps bench for incline. It saves [shoulder press, incline, fly].
    - Split [row, bench, fly]. Escobar swaps bench, and the person swaps row for pulldown. It saves [bench, pulldown, fly].
  - Fix: `const pos = out.findIndex(o => o.exerciseId === nid || o.exerciseId === substituteForFrom.get(nid)?.exerciseId || done.some(e => e.exerciseId === o.exerciseId && e.plannedId === nid));` with the comment "QA3-7c: or the person's own substitute for it (substituteEntry keeps plannedId = the split id)."
  - Tests: both examples above, expecting [incline, DB shoulder press, fly] and [pulldown, bench, fly].
- **QA3-3c · Above the rack, lb users still see odd numbers in a lighter week or under an Escobar factor.** A 225 lb carry gives 202.8 / 213.8 / 235.9 lb. (Main capped these at 150 lb, so this is not a regression.)
  - Fix: add a 5th parameter `scaled = false` to snapToEquipment.
  - In suggestNext: `const scaled = !!ctx.deload || (ctx.loadFactor != null && ctx.loadFactor > 0 && ctx.loadFactor !== 1);`, passed as the 5th argument.
  - In the above-the-rack branch, before `const value`: `if (scaled && profile.unit === 'lb') { const p = loadableNear(s.kg, { unit: 'lb', step: 5, source: 'default', updatedAt: '' }, force ?? 'nearest'); return { ...s, kg: p.kg, unit: p.unit, value: p.value, target: s.target.replace(`${s.kg} kg`, `${p.value} lb`), sets: s.sets.map(x => (x.kg == null ? x : { ...x, kg: p.kg })) }; }`
  - The lb-only guard leaves kg users unchanged.
  - Tests with a 225 lb carry (kg 102.058, entered 225 lb, 40 m):
    - lighter week 0.9 → '200 lb · 40 m';
    - loadFactor 0.95 → '210 lb · 45 m';
    - loadFactor 1.05 → '235 lb · 45 m'.
