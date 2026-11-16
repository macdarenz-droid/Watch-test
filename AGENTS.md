# Working rules for every agent in this repo

The owner's rules, the same as in M-arc's `AGENTS.md` (copied from M-arc `36b4b3f`) and Relay's CONTRACT.md. When they change there, update this file to match.

## ULTIMATE RULE (owner, 2026-09-26): above every other rule, mode or permission
Use what's necessary for high-quality output and a fast workflow, while saving tokens.
- Run agents in parallel when that makes the work faster or better. That is why we work in parallel.
- Never add agents that duplicate or re-check each other without need.
- Use a strong model for hard judgement and a lighter one for mechanical steps. Do small things yourself.
- Quality is never traded away: tests fail before and pass after, and nothing is loosened.

- Keep token use low. Read only what the task needs, write short, don't repeat context. Spend more only when a task is complex and truly needs it.
- Explain and summarise for the owner in plain, simple words.
- UI copy (owner, 2026-10-01): never put words in the app or on the website that talk down to users or state the obvious ("In plain words", "Not medical advice" on a gym app). Explain nothing unless Google Play requires it (cite the policy) or the owner explicitly asked for it. Labels that name a control or show data stay. Plain words are for messages to the owner, not a label on user-facing text. Headings (owner, 2026-10-01) are short labels of one to three words, a noun phrase: never a sentence, a "What ..."/"How ..." question, a qualifier such as "off by default" or ", and where", or a leading "The", "This" or "About"; the text under a heading explains it.
- Owner chat (owner, 2026-10-01): work in the background and keep the owner's chat quiet. Post there only:
  - a new APK: its link, what changed, and what to check on the phone;
  - a problem no agent can solve;
  - a choice only the owner can make, or one where no option can be recommended;
  - the finish-line reminder he asked for.
  Everything else goes in the repo and on the PRs (HANDOVER, PR comments, Relay), never in his chat: progress, ticks, "no change", monitor echoes, plans, rulings, reviews and merges. Builders and reviewers never write to the owner.
- Decide, don't ask. Research first, pick the best logical option, apply it, and record why. Ask the owner only for input or an action no AI agent can do (a payment, a login, a secret, a check on a real device).
- No guessing, even on simple tasks. Check the code, docs or data first; if you cannot verify something, say so.
- After each task, review what was built: the feature, its logic, how it works. Move on only if it meets the goal; otherwise fix or improve it first.
- Precision at every layer: code, tests, tasks, messages.
- Prevent, don't apologise. Catch anything that reading, testing or reviewing could catch before it ships.
- While building, check each change with focused tests. Full regression and full QA run once, on the finished build.
- Name risks and their mitigations when designing, while building, and after release.
- One document per topic: update it instead of creating copies (no v2, final, copy or patch-1.2 names).

## How work is delivered here

This repo holds two things:
- **Watch Test**, the Android heart-rate dashboard at the root (`app/`, `sensor-core/`, `docs/`). See README.md.
- **`m-arc/`**, a sandbox copy of `macdarenz-droid/M-arc` (from `36b4b3f`, without `.git`). The owner uses it for concept work that must not touch M-arc. Inside `m-arc/`, `m-arc/AGENTS.md` and its `.claude/` rules also apply.

**Agents may, without asking:** build, test and push on their own `claude/*` branch, and open draft PRs.

**Only the owner:**
- approves new paid services or providers and any spending, including Meshy credits;
- publishes releases and decides anything about signing keys.

**Never, whoever asks:**
- Commit keys or secrets. This repo is public too.
- Push directly to `main`.
- Push, open PRs or comment on `macdarenz-droid/M-arc` from work in this repo. Copy changes across only when the owner asks.
- Rewrite history (rebase, amend, force-push) on a branch you don't own.
- Skip, loosen or delete a test or check to get green.
- Work around a permission or classifier denial by any means, including through another agent.

**Commands:**
- Watch Test: `./gradlew :sensor-core:test :app:lintDebug :app:assembleDebug` (JDK 17, Android SDK 35). CI (`.github/workflows/android.yml`) runs on pull requests and on pushes to `main`.
- `m-arc/`: the commands in `m-arc/AGENTS.md`, run from inside `m-arc/`.
