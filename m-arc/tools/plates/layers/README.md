# Golden B: the How-to layer mockup (S-2 pin)

This folder is the approved layer mockup: grip and hand close-ups, posture close-ups, handling mistakes, the feel map with the target-muscle shimmer, setup, and risks with the owner's disclaimer last, for the 8 approved exercises. No sources, evidence labels or contacts are shown (owner decision LR-23, below). HT-4 vendors it verbatim into `tools/plates/layers/`, and the layer cards (HT-5 to HT-9) build against this commit. A later change to anything here is a golden-B update, never a silent edit.

Golden A (the approved plates) is `bc0f378:docs/howto/technical-plate/technical-plates.html`, sha256 `e2bea90c8312132b93a2ab0bc004cee6ef43edd22e8227720be3958f6b2dcf48`. That folder is untouched; golden B lives here so golden A stays byte-identical.

## Contents
- `artifact/build-page.mjs` and `artifact/howto-layers.mjs`: the layer page builder. `artifact/.gen/` is written at build time and is not pinned.
- `artifact/technical-plates.html`: the built page, sha256 `e7b8141368e59cf993f29555efce53bc06f36131d8e283c79e11a9f2614c928a` (2,320,561 bytes), the LR-23 update below. Earlier pins: 16a8edc (`47203008…`), then b3a90af (`5aab1aca…`, compact copy), then a7a0b74 (`f39137e190e3ff5921bbe658571228b6b2a53e6d27fcc95e0d5d2afaec9e1384`, 2,386,418 bytes, source records). Each is superseded by the one after it.
- `artifact/copy-lint.mjs`: the copy lint. The build runs it first and throws on any violation. Every limit is an exported constant, and so are the LR-23 patterns (`CONTACT_RE`, `SOURCE_RE`, `SOURCE_CS_RE`, `SAFETY_LINE_RE`).
- `artifact/fidelity-check.mjs`: proves the plates inside golden B equal golden A. Result: 104 byte fragments and 80 pixel regions (8 exercises × 5 themes × normal and Mistake), with 0 px difference.
- `artifact/shoot2.mjs`: the state check. It opens every layer state in all 5 themes.
- `engine/`: the golden-A engine files, unchanged, plus `hand.mjs`, `hand-pairs.mjs`, `hand-test.mjs`, `feelmap.mjs` and `bodymap-parts.mjs`.
- `exercises/`: the golden-A specs, unchanged, plus the `*.howto.mjs` content and the `*.howto-render.mjs` crops.
- `howto/`: `shared.mjs` (RED_FLAG, the knee, elbow and shoulder blocks, DISCLAIMER) and the posture crop renderers. `SHOW_EVIDENCE` is gone (LR-23), and the lint fails if it comes back.
- `ref-src/`: the S-1 lateral-raise source, which is golden A's lateral raise.

The file list is the build's own read closure: every file the build opened, traced at pin time, plus the two checks and `hand-pairs.mjs`/`hand-test.mjs`.

## How to rebuild and check
From this folder:
- `node artifact/build-page.mjs` rebuilds the page byte-identical to the pinned sha256.
- `node artifact/fidelity-check.mjs` needs `bc0f378` in the local git.
- `node artifact/shoot2.mjs` and `node engine/hand-test.mjs`.
- The copy lint runs inside the build; a failing spec stops `build-page.mjs` with one line per problem.

## S-2 entry conditions (plan 4.0): all met on 2026-09-30
1. **Only golden-A plates.**
   - The chest press callout override is removed, and "Heel of palm" is now the Hand chip caption.
   - The lateral raise takes its plate from `ref-src`.
   - Two specs had quietly drifted: pull-up "Shoulders down" and seated cable row "Squeeze blades". Both were restored from bc0f378.
   - The leg press "Knees cave" override is removed.
2. **Posture crops start from the golden-A specs.** The lateral raise crops are cut from the `ref-src` drawing.
3. **Appendix-A text** is applied.
4. **One shared module** holds RED_FLAG and DISCLAIMER, with the owner's line: "General guidance, not medical advice. If something hurts, stop and get it checked."
5. **Every section renders** for all 8 exercises in 5 themes (the `shoot2.mjs` state check).
6. **The shimmer pauses** when the map is scrolled out of view. This is behaviour only; the fidelity check shows 0 px change.

Owner decisions applied:
- The chest press uses horizontal handles, palms down. Its main Right/Wrong pair shows the wrist bent back with the handle in the fingers.
- No expert review, so evidence labels were shown. Superseded on 2026-09-30 by the owner's LR-23 decision below: no sources or evidence labels in the UI.
- Nothing opens by itself, and no new saved data.

## Decisions made at the pin (supervisor)
- **Review.** Two independent fresh-context verifiers checked golden B against the architecture and the verified research cards: one on fidelity and behaviour, one on design, copy and safety. A recheck followed the fixes. This counts as the S-2 review, so no third reviewer was added, since it would only repeat the same checks.
- **Referrals per joint.** The shoulder referral now applies to every shoulder-pinch row (pull-up, lat pulldown, lateral raise, seated cable row). Knee and elbow referral blocks were added from the NHS pages, checked live on 2026-09-30. Each warning box starts with its joint name ("Wrist pain", "Shoulder pain", "Knee pain" or "Elbow pain"), because a sheet can now show more than one box.
- **Squat row "Wrists, or the inside of your elbows".** It keeps the wrist referral only. The row's cause and fix are the bar position and the wrist, so the elbow is text-only there. Revisit only if HT-5's content checks disagree.
- **Chest press.** "About nipple height" and "(nipple line)" are removed. Appendix A kept them only if an expert reviewer wanted them, and the owner chose no expert review.
- **Mistake pill.** It works out its target before closing a close-up. The state check covers Mistake, then the wrist line, then Mistake.
- **`engine/feelmap-test.mjs` is left out.** It reads research from a scratch-only path. Its checks (contrast, text-only muscles, one spoken label) are covered by the page state check and by HT-4's C2.

## Compact-copy update (owner, 2026-09-30)
The owner approved this design and asked for shorter explanations: "Maybe make other explainations shorter and compact. Teach more on concept, not detailed explaination."

Only the words changed, plus the list caps below:
- The design, sections, drawings, interactions and plates are unchanged. The fidelity check is still 0 px against bc0f378.
- Each section opens with one line that states the idea and why it works, then a few short cues.
- Visible words per exercise went from 902-1,132 to 433-449.
- The copy-lint violations went from 851 to 0.

**The limits** (`artifact/copy-lint.mjs`, exported constants):

| Text | Limit |
|---|---|
| Any sentence | 15 words |
| Feel line | 20 words and 2 sentences, starts "You should feel this" |
| Feel row "where" | 6 words |
| Feel row "means" | 12 words and 1 sentence |
| Feel row "fix" | 15 words and 2 sentences, starts with a verb |
| Lead lines | 22 words and 2 sentences |
| Setup | 5 steps, 12 words each |
| Handling mistakes | 3 per exercise, label 5 words, fix 12 words |
| Feel rows | 4 per exercise, and every red-flag row kept |
| Captions | 10 words |
| Risks | 3 per exercise, 14 words each |
| Red-flag boxes | 30 words, every trigger kept |
| Source notes (research data, never shown, LR-23) | 12 words |
| Alt texts | 30 words |
| Callout labels | 1 to 3 words |
| Cues | 6 words |
| Visible words per exercise | 450 |

The GA 6.2 bans still apply in full. The owner's safety line must match exactly, and the red-flag rows and blocks are pinned.

**Checks:**
- Two independent verifiers reviewed the rewrite:
  - accuracy and safety against the research cards, with 15 findings;
  - the reader's view in a real browser at 390 px, with 17 findings.
- A refix pass fixed all of them, and a recheck passed.
- The supervisor re-ran the build and lint, the fidelity check (0 px), the state check (0 problems) and the hand test on the final page.

**Supervisor decisions at this pin:**
- **Every feel row and setup step shows.** With the caps, the old "Show 1 more" and "All 5 steps" buttons would have hidden a red-flag row in 7 of 8 exercises, plus the leg press dizziness stop and re-lock. The visible count now equals the cap (`FEEL_ROWS_MAX`, `SETUP_MAX_STEPS`), so no button appears. The collapse code stays for any longer list, which the lint forbids.
- **Two squat close-ups lost their "This is usually why" link.** Bar on back lost it when the neck row was cut to fit the 4-row cap. Depth lost it because pointing at the lower-back row read backwards. The close-ups themselves are unchanged.
- **Red-flag boxes use one pattern:** "<triggers>? Get it checked today." then "<triggers>? See a doctor." Each box keeps its NHS source (as data, never shown, LR-23) and joint name.

## Source-record update (supervisor, 2026-09-30)
Every source now carries `access` and `checked`, as HT5-A2 requires. Only the source records changed; the user copy and the drawings did not.
- **Filled after reading each source today.** 34 empty fields: 29 `checked` and 6 `access`. The PubMed records were read through NCBI E-utilities, because the PubMed web pages block automated readers.
- **Dropped.** `nsca-nfpt`: its site no longer exists (HTTP 503 "This Site is No Longer Active"). Each of the 3 squat claims that cited it keeps at least one live source.
- **Corrected.** `schulz`, `ace-leg-press` and `bells-of-steel` were marked unreachable, but all three opened today. They are now `access: full`, and "Not rechecked" is gone from their notes.
- **Checks.** Fidelity against bc0f378: 0 px. State check: 0 problems. The copy lint passes.

## Owner decision 2026-09-30 (LR-23): no sources, evidence labels or contacts in the UI
The owner: "Dont put any emergency or whatever contacts. Even the source remove it in app ui. If its not required by pkaystore dont put."

What changed (docs/howto/LR23-PLAN.md section 7, as amended by D-LR23-1 and D-LR23-8):
- **Gone from the page:** each sheet's Sources section (the list, its outside links, the evidence badges and the key paragraph), `SHOW_EVIDENCE`, the header's "with their sources" (the header now ends "…, follow the setup steps, and see when to stop."), and the footer's sources list and "Winter 2009" note. The footer now reads "Drawings are computed by our own code from joint angles." The body-map licence credit stays: it is a licence notice, not a source.
- **Moved:** the owner's disclaimer, word for word, is now the node right after "Risks and when to stop", once per sheet and last.
- **Unchanged:** the plates (0 px), the design and interactions, all user copy, the red-flag boxes and their NHS sources as data, the 19 "When to get it checked" buttons, and every source record and evidence label in the exercise files (data, never shown).
- **The lint** (`artifact/copy-lint.mjs`) now holds the four final patterns of D-LR23-1, the D-LR23-1 literals byte for byte; card ESC-NC creates `tests/guards/no-contacts.ts` on main, and HT-4b's parity test pins the two. Every shown or app copy field, except the source notes, must pass `CONTACT_RE`, `SOURCE_RE` and `SOURCE_CS_RE`, and must not name any registry source's first author or organisation. The red-flag boxes and the disclaimer get the same checks, and the boxes also `SAFETY_LINE_RE`. `SHOW_EVIDENCE` in the shared module fails the build. No copy field hit a pattern, so no copy was reworded.
- **The state check** (`artifact/shoot2.mjs`) now fails on any link, source element or evidence label word inside a card, on contact or source wording anywhere in a card's text (hidden text, aria-label, title and alt included), and when the disclaimer is not the card's last node after the last red-flag box. The "sources open" state and its screenshot are gone.

**Checks** on this commit:
- `node artifact/build-page.mjs`: copy lint 0 problems; page sha256 `e7b8141368e59cf993f29555efce53bc06f36131d8e283c79e11a9f2614c928a`, 2,320,561 bytes.
- `node artifact/fidelity-check.mjs` against bc0f378: PASSED, 104 byte fragments and 80 pixel regions (8 exercises × 5 themes × normal and Mistake), 0 px difference.
- `node artifact/shoot2.mjs`: 0 problems in 5 themes (40 of each section state, 80 posture zooms, 160 feel rows open, 40 reduced motion).
- `node engine/hand-test.mjs`: passes (`ok: true`).
- Lint mutations. Each one fails the build with the rule shown, and was then restored (the page rebuilt to the same sha256):
  - SHOW_EVIDENCE = true: fails (dumbbell_lateral_raise  shared.SHOW_EVIDENCE  [sources and evidence labels are never shown (owner 2026-09-30, LR-23)]  true)
  - "Call 999" in RED_FLAG_KNEE.now: fails (shared  shared.RED_FLAG_KNEE.now  [no contact or emergency wording (LR-23)]  "999")
  - "Go to A&E." in RED_FLAG_KNEE.now: fails (shared  shared.RED_FLAG_KNEE.now  [no contact or emergency wording (LR-23)]  "A&E")
  - "(Muyor 2023)" in a setup line: fails (pull_up  setup[0]  [no source or evidence wording (LR-23)]  "(Muyor 2023)")
  - "Weiss 1995" in a setup line: fails (pull_up  setup[0]  [no source or evidence wording (LR-23)]  "Weiss 1995")
  - "NSCA teaches" in a setup line: fails (pull_up  setup[0]  [no source or evidence wording (LR-23)]  "NSCA")
  - "text HOME to 741741" in a setup line: fails (pull_up  setup[0]  [no contact or emergency wording (LR-23)]  "text HOME to")
  - "ring 13 11 14" in a setup line: fails (pull_up  setup[0]  [no contact or emergency wording (LR-23)]  "13 11 14")
  - "Youdas" (a registry first author) in a setup line: fails (pull_up  setup[0]  [names a registry source (LR-23)]  "Youdas")
  - "Catalyst Athletics" (a registry organisation) in a setup line: fails (pull_up  setup[0]  [names a registry source (LR-23)]  "Catalyst Athletics")

**Decision at this update (builder LR23-DOCS, recorded here because the plan is silent):** the plan's header text "…and follow the setup steps." is one line shorter at 390 px (157.5 px against 180 px). That moved every plate down the page by a fraction of a pixel, and the fidelity check then found about 43,000 to 59,000 differing px per plate: the plates were the same, only rasterised half a pixel lower. The check is not loosened. The header instead reads "…see where you should feel it, follow the setup steps, and see when to stop.", which keeps the same 180 px height and names the Risks section that is really there; the fidelity check is back to 0 px.

**Approval:** the owner has not viewed this page yet. HT-4b re-pins it with `approvedBy: 'supervisor'` (D-LR23-2); it switches to 'owner' only after the owner views it on pilot A.
