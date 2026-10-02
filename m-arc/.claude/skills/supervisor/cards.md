# Writing a card

## Hard cards (moved from AGENTS.md, 2026-09-29)

- Plan hard cards before building (owner, 2026-09-29). For complex work (animation production, simulation, anything with several possible designs), the supervisor first runs a phased plan: understand the problem, draft competing designs, have independent judges score them, then write the build cards. Builders on those cards write a short design note and post it on the PR as a progress check-in before bulk building; the supervisor reads it the next tick and re-guides or stops early. Small fixes stay simple, with no extra agents.

## Collision check before a card is `ready`

Before a card is `ready`:
1. List what the card changes. Search the shared add-only files (`scripts/screenshot-gate.mjs`, `tests/theme.test.ts`, `src/ui/styles.css`) and the `write_scope` of the other open cards for anything that pins or touches it.
2. If another task's block pins behaviour this card changes, name the block (task ID, file:line) in `read_first` and settle it now: the design avoids the change. Another task's block is never edited (AGENTS.md, file ownership). If the design cannot avoid it, the card stays `blocked`, with that block as its reason.

   A card with an unsettled collision is not `ready`.
3. Cards meant to run in parallel agree their shared names, data shapes and test IDs first, and write them into each card.
4. Cut work into vertical slices: each card is one small feature working end to end that can be checked on its own, not "the whole data layer first".
5. `model:` `claude-sonnet-5` only for mechanical cards (every step spelled out); `claude-opus-5-5` for everything else. The supervisor passes it when it starts the session.

Every card carries the fields listed in the builder skill, plus `model` (step 5).

A ruling during a build that changes drawn or pinned output repeats step 1 for that change before the builder goes on.
