# Live QA round 14: b6 A6 scrub charts (PR #23)

Checked at 93a42cc with two sonnet reviewers (code and tests; real CDP touch at 360 and 390 px). One sonnet skeptic re-checked each finding.

**Passes:**
- Every A6 acceptance item has a gate probe that fails without the change.
- Reuses `track()`; no new gesture helper.
- The haptic tick fires once per point.
- The readout format matches the spec, with values matching the seeded data point by point.
- A vertical drag still scrolls the page.
- Nothing overflows at 360 px.
- The readout contrast passes in all 5 themes.
- Reduced motion works.
- The Escobar sparkline is untouched (56 px, not scrubbable).
- Gate changes are additive only: launchGone went only into b6's own blocks.
- check and test:tz pass (1,183 tests).

## QA14-1 · Medium: letting go snaps the readout back instead of fading
- **Spec:** A6 says so twice: "letting go fades back to the latest value" and "Release: readout crossfades back over var(--dur-fast)".
- **Actual:** `.chart-readout` (styles.css:419) has no transition. On release, `setScrubIndex(null)` / `setVolScrub(null)` swap the text in one frame, and opacity stays 1. The guide line and dot disappear at once too.
- **Why the gate misses it:** it only checks the value returns within 300 ms, which an instant snap passes.
- **Fix:**
  - On release, crossfade the readout from the scrubbed value to the latest value over `var(--dur-fast) var(--ease-standard)`: for example, two keyed spans, the old one fading out and the new one fading in.
  - Fade the guide line and dot out over the same token.
  - Under reduced motion, swap instantly.
- **Test:** extend the `// A6:` gate block. Right after release (full motion), the readout or guide must be mid-transition: opacity strictly between 0 and 1 on some frame within `--dur-fast`, or a running animation. Under `reducedMotion:'reduce'` the swap stays instant. The test must fail at 93a42cc.
