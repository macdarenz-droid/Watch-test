# Live QA round 10: UI polish b2b, the live card (PR #21)

Checked PR #21 at 6dba847 against main d1e63b1 with one code reviewer and one UI skeptic.

- **Passes:** I2, I3 (PulseLine no longer writes to `<html>`; breathe and shimmer are gone and the infinite-animation allow-list is tighter), I4, I5, A2, QA6-4 and QA6-5 match the spec. ErrorBoundary, Dock, Settings and PulseLine changes are all required by F10, I5 or I3. No stored-data change: the three new insert functions only, and migrate is untouched. The edited tests are tightened or like-for-like, and none is loosened.
- **Checks:** tsc, vitest (1,096) and the vite build passed.

F10's Undo can lose or misplace workout data. Fix the items below, each with a test or gate probe that fails before and passes after, and put the id in the commit message.

## High

**QA10-1 · Undo after 'Remove from this session' drops the note just typed.**
- **Cause:** Train.tsx:763-768 runs `closeMenu()`, which commits a pending "Note for today" draft to the store. It then captures `const e = entry`, the render-time prop, which doesn't have that note. Undo re-inserts `e`, so the note is gone. §6/F10 said to read `a.entries[index]`.
- **Repro:** type a note (onInput only) → Remove → Undo. `entries[i].note` is undefined.
- **Fix:** after `closeMenu()`, read from the store by id:
  ```tsx
  const a = active(); const at = a ? a.entries.findIndex(x => x.id === entry.id) : -1;
  if (!a || at < 0) return;
  const e = a.entries[at]!;
  removeEntry(at);
  showToast(`${e.name} removed`, 'Undo', () => insertEntry(a.id, at, e));
  ```
- **Test:** set a note draft → remove → undo. The entry deep-equals the store entry just before the remove, note included.

**QA10-2 · Undo is index-based and ignores which session it came from, so it can put data in the wrong place.** The toast outlives tab changes, discard and new sessions (App.tsx:94), and `insertEntry`/`insertSet` only check that some session is active (session.ts:73, 260, 298). This is my spec gap: F10 said to restore by index.
- **Repro A:** remove an exercise in session A → hold to discard → start session B → Undo. A's exercise appears in B.
- **Repro B:** Delete set on exercise 3 → reorder (Train.tsx:353 `moveEntry`) → Undo. The set lands in whichever exercise is now third.
- **Repro C:** remove a split exercise in the split editor → add it back from the picker → Undo. The split holds the same exercise twice; `addExerciseToSplit` normally refuses this.
- **Fix:** restore by identity, and do nothing when the target is gone.
  - session.ts `insertEntry(sessionId: string, at: number, entry)` does nothing unless `a.id === sessionId` and no entry already has `entry.id`.
  - session.ts `insertSet(sessionId: string, entryId: string, at: number, set)` does nothing unless `a.id === sessionId`, the entry with `entryId` exists, and no set in it already has `set.id`. It inserts into that entry, with `at` clamped.
  - splits.ts `insertExerciseInSplit` does nothing if the split is gone or already has `se.exerciseId`.
  - Update the three Train.tsx call sites (:747, :767, :785) to pass `active()!.id` and `entry.id`.
- **Tests (vitest, session.ts and splits.ts only):**
  - Repros A, B and C each leave state unchanged after Undo.
  - Pressing Undo twice inserts once.
  - The happy paths deep-equal the pre-remove state.

**QA10-3 · F10's acceptance checks were never added.** No test or gate probe mentions `HoldButton`, `insertEntry`, `insertSet` or `insertExerciseInSplit`. That's why QA10-1 and QA10-2 shipped. Add the F10 gate block from docs/UI-POLISH-PLAN.md (F10 Acceptance):
- remove exercise 2 → Undo → entries deep-equal;
- Remove last set → Undo → same id and position;
- delete set 2 of 3 → Undo → original order;
- split editor remove → Undo → same position and sets;
- Discard: a 300 ms hold does nothing, an 850 ms hold discards;
- keyboard: Enter shows 'Tap again to confirm', and Enter again confirms.

## Low

**QA10-4 · The reset button lost its warning.** ErrorBoundary.tsx:78-97 swapped `confirm('This deletes every workout on this device. Save a copy first if unsure. Continue?')` for the hold button, and nothing now says what will be deleted.
- **Fix:** put `<p class="hint">Deletes every workout on this device. Save a copy first if unsure.</p>` above the hold button. The error-boundary test asserts that text.

## UI skeptic

`npm run gate` passed. Measured at 320/360/390 px in Paper and Silent Black, with and without reduced motion. These pass:
- **I2:** the fold transitions and the chevron turns. Auto-advance lands at 68 px against a 56 px header.
- **I3:** no `exercise-*` animations, and the border differs between states.
- **I4:** the first set grid sits at 303 px at 360×740.
- **I5:** the textarea uses theme radii, the singulars are right, and Done is in view at 320×568.
- **A2:** the header stays sticky, and the hairline scaleX is exactly 2/17.
- **Reduced motion:** passes.

**QA10-5 · Medium · The hold-to-discard button is only 34 px tall.** Train.tsx:434 renders `<HoldButton size="sm" …>`, and `.btn-sm` is 34 px (styles.css:185). F10 didn't ask for `sm` here.
- **Fix:** add the existing F8 class, `<HoldButton size="sm" class="tap" …>`, so `.btn-sm.tap` becomes 44 px. HoldButton must pass `class` through. Checked by injection: 34 → 44 px.
- **Gate probe:** the Discard button is at least 44 px tall at 360.

**QA10-6 · Low · Exercise card headers show no press feedback.** I2 asks for "class `ex-head` with the F2 surface press", but styles.css has no `.ex-head` rule. On press the background stays transparent.
- **Fix:** reuse the `.theme-card` press (styles.css:167-171): `.ex-head { transition: background-color var(--dur-fast) var(--ease-standard); } .ex-head:active { background: color-mix(in srgb, var(--text) 8%, var(--surface-1)); transition: none; }`. Checked by injection.

**QA10-7 · Medium (also on main) · At 320 px the live screen scrolls sideways.** `scrollWidth` is 356 against `clientWidth` 320 in both themes. Cards are 301–340 px against 288, which clips the effort labels, the record badge and button edges.
- **Cause:** `.stack`/`.stack-sm` (styles.css:127-128) are grids with no `grid-template-columns`. The implicit auto column grows to the full width of nowrap `.ellipsis` names such as "Dumbbell Shoulder Press" (Train.tsx:639, 641), so the ellipsis never engages. The same rules are on main, so this isn't new in b2b, but it fails this batch's "no horizontal scroll" acceptance.
- **Fix:** `.stack, .stack-sm { grid-template-columns: minmax(0, 1fr); }`. Checked by injection: scrollWidth 356 → 320, cards 288 px, names end in an ellipsis.
- This changes every `.stack`, so the gate must also assert no horizontal scroll (`scrollWidth ≤ clientWidth`) at 320 px on Today, Train (live, with a long exercise name), Body, History and Settings, in both themes.

## Re-check at 4e6048e: all seven fixed

Each check fails with only its fix reverted and passes on HEAD:

| id | fix commit | check | before the fix | at HEAD |
|---|---|---|---|---|
| QA10-1 / QA10-2 | 15236d7 | vitest repros A, B and C, double Undo, happy paths; gate `f10-undo` for the note typed before Remove | each repro fails; the note comes back undefined | pass |
| QA10-3 | 958d745 | F10 gate block | keyboard Enter didn't arm 'Tap again to confirm' (`preventDefault` blocked the click) | pass |
| QA10-4 | d0242e9 | reset warning test | warning text missing | pass |
| QA10-5 | 8170487 | Discard button height | 34 px | 44 px |
| QA10-6 | 5869198 | `.ex-head:active` rule | missing | present |
| QA10-7 | ad198de, 4e6048e | live Train screen width at 320 px | scrollWidth 356 | 320 in both themes |

- **HoldButton:** 300 ms does nothing, 850 ms confirms once, keyboard tap-twice confirms, a keyboard hold confirms once, and both timers are cleared on unmount.
- **No loosening:** the tests and gate diff since 6dba847 is +779 / −4. The 4 deleted lines are a summary log line and import reformatting. The merge 46f6f8e keeps every O3/QA7 gate probe verbatim.
- **`.stack` widths at 320 px, compared with a main build:**
  - Today, Body, History and Coach stay at 288 px.
  - The live Train screen goes from 339.7 to 288 px, and Settings from 403.6 to 286 px. Both are overflows that already exist on main, now fixed.
  - Nothing that should be full width got narrower.
- **Checks:** tsc passed, vitest passed (1,120) and the build passed. CI is green on 4e6048e (guard, source-gate with the gate, android-gate). The local gate stalls at the R5.5 service-worker step in the QA sandbox, as before, so the QA10 probes were re-run standalone with the same fixtures and assertions.
