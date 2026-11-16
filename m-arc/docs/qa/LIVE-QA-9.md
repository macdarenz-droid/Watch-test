# Live QA round 9: polish batch 2a (PR #18)

Checked PR #18 at 10c19c9 against main 721e997. A reviewer compared it to the spec and a skeptic drove a live workout in a real browser (360 and 390 px, Paper and Silent Black, reduced motion, bodyweight, assisted and timed sets).

- **Passes:**
  - F6, I1, A9, F7, A1, A8 and F9 all match their spec. That covers the rest banner over a real minute rollover, the next-set hint, logged-set styling, "log as planned", the keyboard chain and the PR badge.
  - Motion tokens only; reduced motion and haptics follow §3.
  - The hotfix note-draft logic in EntryCard is byte-identical to main.
  - No stored-data change.
  - Every removed test line was replaced by an equal or stronger check.
  - vitest (1,096) and both time zones pass.
- **Fails:** `npm run gate` exits 1 because of QA9-1.

## High

**QA9-1 · "See substitutes" misses its own F8 tap-target check** (the gate fails at 390 and 360 px). This blocks CI.
- **Where:** src/ui/styles.css:391-392 (`.link-btn::before { inset: -8px -4px }`); the button is at Train.tsx:577.
- **Cause:** the link is ~17 px tall, so half its height plus 8 px reaches 16.5 px. The gate probes ±21 px, the same reach as every other F8 control, and hits the next `.hint.muted`.
- **Fix:** change `.link-btn::before` to `inset: -14px -4px`, which gives a ≥44 px hit height. `.hint.muted` isn't interactive, so overlapping it is harmless. Check that the enlarged area doesn't cover another button in that card at 360 px. If it does, give the recovery-warning line `padding-block: 6px` and use `inset: -11px -4px`.
- **Test:** the existing gate block "F8 tap targets 390px/360px" must pass. Don't change the probe.

## Low

**QA9-2 · `.chip-btn::before` inset is wider than the spec** (styles.css:179). The code has `inset: -4px`; the spec says `inset: -4px 0`. Tight chip rows can then overlap hit areas sideways.
- **Fix:** change it to `inset: -4px 0`.

## Checked and not a bug
- At 360×780 the open card's Add set / Remove / Done row can start under the fixed bottom nav before you scroll. The page scrolls and `.app` reserves 140 px at the bottom, so the row is always reachable. That's normal scrolling, not an F8 miss.
