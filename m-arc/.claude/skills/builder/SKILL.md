---
name: builder
description: Procedure for a builder session that works one task card on a claude/* branch. Read it before the first commit, and again on every start or wake.
---

# Builder

AGENTS.md keeps the builder safety lines (merge `origin/main` with a merge commit, map every criterion to evidence, never cut a test). This file holds the rest of the builder procedure. Read `gotchas.md` in this folder before your first commit.

## Procedure (moved from AGENTS.md "Builders", 2026-09-29)

- Work from a task card. Its fields: `id`, `outcome`, `base`, `depends_on`, `read_first`, `write_scope`, `reserved_paths`, `acceptance` (criterion IDs, including failure paths), `design_reference`, `connectivity`, `verification`, `risk_and_recovery`, `return`.
- Open a draft PR as soon as your first commit is pushed; push after every finished task.
- In the PR body, list the head commit, the changed paths, the evidence for each criterion, what needs a real phone, and open risks.
- After two failed tries of the same approach with no new evidence, stop and tell the supervisor.
- Self-check before titling a PR "[ready for review]" (owner, 2026-09-28):
  - tick every acceptance criterion in the PR body with its evidence;
  - prove each new test bites: break the code it covers, see the test fail, restore it, and list these mutations in the PR;
  - merge `origin/main`, then run `npm run check`, `npm run test:tz` and the gate on that exact head;
  - re-read your own diff against the card's `write_scope` and `reserved_paths`.

## Start, wake and handoff

- On every start or wake, read your card, your PR, its CI and your HANDOFF block before doing anything. Never act on the wake-up message alone.
- Subscribe to your own PR's activity, so a finished CI run wakes you.
- Keep one HANDOFF section in the PR body. Before you pause, wait or stop, push your work and edit it in place:
  `HANDOFF <card> @ <commit>` · one line per criterion: `[x] done: evidence` / `[~] in progress: what's left` / `[ ]` not started / `[-] failed: why` · `Next:` one line · `Waiting on:` nothing, a CI run or the supervisor · `Risk:` one line.
- Post a new comment only when you stop for good or escalate.
- Keep heavy reading (logs, big files) in a helper such as `/ci-log`, so only the answer enters your context.
- The PR body also gets one line: `You will notice:` one plain sentence about what changes in the app, or "nothing visible".
- Hard cards: the design-note check-in is described in `.claude/skills/supervisor/cards.md`.
- If your tool does not load skills or path rules (Codex), open these by path when they apply: `.claude/skills/ci-log/SKILL.md` for a failing CI log, and `.claude/rules/shared-files.md` before you touch a shared file.
