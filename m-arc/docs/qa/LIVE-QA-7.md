# Live QA round 7: O3 "Ready times" (PR #19)

Checked PR #19 at 18a6635 against main d1e63b1. One code reviewer and one UI skeptic worked from real DOM measurements at 320/360/390 px, in Paper and Silent Black, with and without reduced motion.

- **Logic:** the grouping edges are right: exactly 90%, lo = 0, midnight crossing, 23:59, a latest of exactly midnight, and DST both ways. Ring maths and colours match §6b. The minute tick updates numbers while the order stays frozen.
- **Checks:** vitest (1,109) passed, and readyTimes plus dates passed under UTC, Manila and New York. `npm run gate` passed. No horizontal scroll, rings are 40 px, tiles are 52 px, contrast is ≥ 3:1 in both themes, and no stored data changed. No test or gate assertion lost a line.

Fix these five, each with a test or gate probe that fails before and passes after, and put the id in the commit message.

## High

**QA7-1 · Tapping a tile never opens its detail strip.**
- **Cause:** styles.css:619 sets `.rt-detail-wrap { grid-template-rows: 0fr }`, but no rule sets `1fr` when it is open. Line 622 only fades the child in. The wrap stays 28 px from 50 ms to 3 s after the tap, in both motion modes. Rows 2 and 3 and the chevron are clipped, and the sliver overlaps the next group header.
- **Fix:** add `.rt-detail-wrap.open { grid-template-rows: 1fr; }` after line 619. Checked by injecting it: the wrap goes from 28 px to 90 px, and all three rows are fully in view.
- **Gate probe:** the current one only asserts `visible()`, which is why it passed. After a tap and one `--dur-base`, assert:
  - `.rt-detail-row3` and `.rt-detail-chevron` bottoms are ≤ the `.rt-detail-wrap` bottom;
  - the wrap is at least 80 px tall;
  - the next `.rt-group-head` top is ≥ the `.rt-detail` bottom.

## Medium

**QA7-2 · One long name drops the whole card to one column.**
- **Cause:** `.rt-tile-name` (styles.css:617) is nowrap with an ellipsis. So "Front shoulders" (124 px), "Rear shoulders" (119 px) and "Side shoulders" (117 px) overflow the 97 px (360) or 112 px (390) text slot, and the probe (Body.tsx:232-247) switches every group to one column. These are common muscles, so the 2-column design the owner picked rarely shows.
- **Decision (amends §6b "Tile"):** a name may wrap to 2 lines. 2 × 18 + 16 = 52 still fits the 52 px tile. Times stay nowrap. The one-column fallback now fires only for a single word or time that can't fit.
- **Fix:** styles.css:617 becomes `.rt-tile-name { font-size: 14px; line-height: 18px; font-weight: 600; color: var(--text); overflow: hidden; white-space: normal; overflow-wrap: normal; }` (drop `text-overflow` and `nowrap`). Keep `overflow: hidden` so an unbreakable word still counts as overflow. The probe must test both axes: `scrollWidth > clientWidth || scrollHeight > clientHeight + 1`, and the name box may be at most 36 px tall. Checked by injecting it: 2 columns at 360 and 390, the shoulder names wrap cleanly, tiles stay 52 px, and there is no horizontal scroll.
- **Gate probe:** seed a Front shoulders window, then at 360 px:
  - `.rt-line` has no `one-col`;
  - the tile has 2 columns;
  - the name has `scrollWidth ≤ clientWidth` and a height ≤ 36;
  - the tile is 52 px tall.

**QA7-3 · In one column, the caret points at empty space.**
- **Cause:** Body.tsx:274 passes the tile's pair index `ci`. `RtDetail` (Body.tsx:182) turns col 1 into `calc(50% + 28px)` even when every tile is full-width with its ring on the left. The caret sits 180 px from the ring centre.
- **Fix:** decide at render time, so a resize after opening is also right. Pass `oneColumn` into `RtDetail` and use `const caretLeft = full || oneColumn || col === 0 ? '28px' : 'calc(50% + 28px)';`. Checked by injecting it: the caret-to-ring gap goes from 180 px to 6 px.
- **Gate probe:** force one column (probe override or width 320 with a long time), open a tile that was second in its pair, and assert the caret centre is within 8 px of that tile's ring centre.

## Low

**QA7-4 · The scroll-keep timer and tile refs are never cleaned up.**
- **Cause:** `onTile` (Body.tsx:249-261) starts a `setTimeout(…, durFor('base') + 30)` with no cleanup, so leaving the screen within about 230 ms can scroll the next screen. The `tileRef` callback never deletes refs to removed tiles.
- **Fix:** `const scrollTimer = useRef<ReturnType<typeof setTimeout>>(); useEffect(() => () => clearTimeout(scrollTimer.current), []);`. In `onTile`, run `clearTimeout(scrollTimer.current); scrollTimer.current = setTimeout(…)`. Change the ref callback to `el => { if (el) tileRefs.current.set(m, el); else tileRefs.current.delete(m); }`.
- **Test:** a unit or gate check. Tap a tile, then switch the view within 100 ms; `window.scrollY` doesn't change after 400 ms.

**QA7-5 · The `readyWindow` guard drops the smaller bound when lo > hi.**
- **Cause:** dates.ts:156 clamps `earliest` down to `latest` without taking `min(lo, hi)`. `readyWindow(now, 50, 5)` builds the whole window from 50 h. recovery.ts always gives lo ≤ hi today, so this is defensive only.
- **Fix:** `const earliest = roundNearestHour(now + Math.min(lo, hi) * 3_600_000);`. `latest` already uses `Math.max(lo, hi)`; keep the clamp line.
- **Test:** `readyWindow(now, 50, 5)` equals `readyWindow(now, 5, 50)`.

## Re-check at 4a8200d: all five fixed

Each fix has its own commit: 878a43b, f9ec60a, 0c659ab, abfd623 and 4a8200d. Each new probe or test fails with only its src change reverted and passes when restored.

- QA7-1: the wrap measures 28 px before and 90 px after.
- QA7-2: 1 column before, 2 after.
- QA7-3: the caret sits 145 px from the ring before and 6 px after.
- QA7-4: scrollY moved 300 → 201 before and stays at 300 after.
- QA7-5: the swapped-bounds test fails before and passes after.

The gate and test diff since 18a6635 is +116 lines with no deletions. Re-measured at 320/360/390 px in both themes: 102/102 checks pass. tsc passed, and vitest passed (1,110). CI is green on 4a8200d: guard, source-gate (includes the gate) and android-gate. The local gate run stalled at the R5.5 service-worker step in the QA sandbox, as on untouched HEAD. CI's gate passed, so this is not a product issue.

## QA7-6 · High (found on main CI at bbf1fbf) · At some times of day the Ready-times card drops to one column at 360 px

- **What happened:** the main gate run at 08:10 UTC failed with "ready-times QA7-2 (Front shoulders): expected 2 columns, got 1". The same tree passed the PR gate at 07:48 UTC (2e232e9 and bbf1fbf have identical trees).
- **Cause:** the tile time text depends on the clock. Time strings reach 16 characters ("10 pm – midnight", "11 pm – midnight") whenever a muscle's window ends near midnight, and that can happen at any hour of the day. `.rt-tile-time` is nowrap, so a 16-character time overflows the 2-column text slot at 360 px (about 97 px), and the QA7-2 probe switches the whole card to one column. Users on 360 px phones see the layout flip with the time of day. The gate probe runs on the real clock, so it passes or fails by the hour.
- **Fix:**
  - In a 2-column tile, the time may break after the dash. Render it as `<span class="nw">10 pm</span> – <span class="nw">midnight</span>` with `.rt-tile-time { white-space: normal }` and `.rt-tile-time .nw { white-space: nowrap }`, capped at 2 lines. Tiles may grow past 52 px; every tile in a row stretches to match.
  - The one-column fallback now fires only when a single nowrap part (one time end or one name word) can't fit.
  - Full-span tiles and the detail strip stay on one line.
- **Gate:**
  - Pin the clock for every ready-times probe (Playwright `page.clock.install({ time })` or the gate's virtual clock) so results don't depend on when CI runs.
  - Add a sweep at 360 px with the Front shoulders seed, at 06:00, 11:30, 17:00, 21:45 and 23:30 local time. Assert 2 columns at every time, no clipped text (scrollWidth ≤ clientWidth), and no horizontal scroll.
- **Test:** a unit test that the longest `tileText` over a 24 h sweep is at most 16 characters, and that each part (before and after the dash) is at most 8 characters, so each part fits on one line.

## Re-check of QA7-6 at 0fc1de5 (PR #22): fixed

- **Review at 9d75ffe:** the code fix was right, but the gate had 3 gaps. The 52 px height check was deleted with nothing in its place, the time box was only checked on width, and nothing proved the sweep ever reached the midnight case. All 3 were fixed in 0fc1de5.
- **Independent check (throwaway worktree, sweep block copied verbatim):**

| pinned time | tile time | columns | tile height |
|---|---|---|---|
| 06:00 | 11 am – 1 pm | 2 | 52 |
| 11:30 | 4 – 7 pm | 2 | 52 |
| 17:00 | 10 pm – midnight | 2 | 68 |
| 21:45 | 3 – 5 am | 2 | 52 |
| 23:30 | 4 – 7 am | 2 | 52 |

- **Before the fix** (Body.tsx and styles.css reverted to bbf1fbf): exactly 2 errors, both at 17:00: "forced the card to one column" and "expected 2 columns, got 1". The other 4 points are unchanged.
- **No loosening:** the only assertion removed, the fixed 52 px height, is replaced by stricter checks:
  - the height is between 51 and 69 px (the CSS gives exactly 52 or 68);
  - the height is exactly 52 ±1 when the name and the time each fit on one line;
  - tile heights in a row match;
  - no horizontal or vertical clipping.

  tests/readyTimes.test.ts only gains lines. Every ready-times probe now runs on a pinned clock, so the result no longer depends on when CI runs.
- **Coder's run:** tsc clean, vitest passed (1,143), `npm run gate` PASS.
