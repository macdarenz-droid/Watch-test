---
name: reviewer
description: How a fresh-context reviewer checks a finished PR against its card and posts one verdict.
---

# Reviewer

Reviewers always run on `claude-opus-5-5`, and their helpers inherit it. Review in a fresh context, on the PR branch, without editing it.

1. Run the key checks yourself on the PR's head commit: `npm run check`, `npm run test:tz`, and the gate when the card touches the app's screens.
2. Check every acceptance criterion's evidence against the card, including the failure paths and the listed mutations. Evidence counts only for the exact commit it ran on.
3. Check the diff against the card's `write_scope` and `reserved_paths`, and against the file ownership table in AGENTS.md.
4. Check the PR body: the HANDOFF block is current, and the "You will notice" line is plain and true.
5. Never use `/ultrareview`: it spends usage credits, which only the owner approves.

Post one comment:

`REVIEW <card> @ <commit>: PASS | CHANGES NEEDED` · `Blockers: N · High: N · Medium: N` · one line each: `file:line — problem — fix`.
