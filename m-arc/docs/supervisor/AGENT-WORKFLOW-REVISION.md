# Agent workflow revision (2026-09-29)

Owner decision, 2026-09-29 ~17:10 UTC: "Go. Apply all recommendations." Research: `shanraisshan/claude-code-best-practice` at bfcf0b5, via workflow wf_069aa46e-d8e. Seven agents took part: 4 readers, a proposer, a critic and a final pass.

## Owner decisions (binding)
- **A. Change 3 option (b): NO.** "Never edit another task's block" stays exactly as written. Change 3 keeps the clash check and option (a) only: the design avoids the change.
- **B. Change 9: YES to the fixed verdict format, NO to running `/code-review`** for now, to save tokens. Drop every `/code-review` line, the rollout step that runs it, and the Explore-block risk note tied to it.
- **C. Change 6: YES.** Move the rules into role files with the wording unchanged.
- **D. YES** to the new "Never" line in change 4 and the model-rule text in change 7.
- **Question timeout:** try it. Apply it if it works; if it doesn't, drop it or use the best working alternative. The result is in "Supervisor amendments".

## Supervisor amendments (verified against official docs, 2026-09-29)
1. **Change 1:** drop the SendMessage retry. Our cloud builders are not reachable by SendMessage (ListAgents shows none). The retry route is a new one-shot Routine. If the trigger service itself fails, the instruction goes on the PR as a comment, and the tick retries.
2. **Change 4:** `askUserQuestionTimeout` has scope **"User or managed"** (code.claude.com/docs/en/settings-reference), so a project `.claude/settings.json` cannot set it. The alternative is the env var `CLAUDE_AFK_TIMEOUT_MS`, which works per session and overrides the setting (code.claude.com/docs/en/env-vars), set through the project settings `env` block. It is used only if the supervisor's live test passes; see "Test result" below. `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` and `_MAX_AGE_MS` are documented in env-vars ("used in SDK mode"). Keep them: they cost nothing when unused.
3. **Change 7:** check every `permissions.deny` pattern against code.claude.com/docs/en/permissions before using it. Keep only documented syntax, and drop any rule whose syntax the docs don't show. Every kept rule is tested in a fresh session, which must start with no warning.
4. **Change 5:** check the hook contract (PreToolUse, exit 2 blocks, stderr goes to the agent) against code.claude.com/docs/en/hooks before merging.

## Test result: question auto-continue
- **Test (2026-09-29 17:21 UTC):** a throwaway cloud session on branch `claude/wf-test-afk`, with `CLAUDE_AFK_TIMEOUT_MS=60000` in the project settings `env` block, was asked to call AskUserQuestion.
- **Result:** the tool is **not available** in cloud sessions started by the supervisor. That session's tool list was Bash, Write, Edit, Read, Glob, Grep, Agent, NotebookEdit, WebFetch, WebSearch, TaskStop, SearchMcpRegistry, SuggestConnectors, ListConnectors and Artifact. The session refused the request as out of place.
- **So builders and reviewers can never freeze on a question,** and the timeout setting would do nothing. **Change 4's question-timeout part is dropped,** along with its new "Never" line and "blocked on timeout" line, which have nothing to guard. The resume variables stay: they are documented, and cost nothing when unused.
- **The real freezes we saw** were a builder waiting idle for a supervisor message that never arrived (a failed one-shot Routine). The alternative that fixes those is change 1 (tick stall repair, one retry per tick, the instruction also posted on the PR) plus change 2 (builders re-read the PR and their HANDOFF on wake).
- The test session is archived. The branch `claude/wf-test-afk` (test only, never to be merged) could not be deleted through the git proxy, so it stays as a record.

## The proposal as reviewed
# Proposal: what to take from claude-code-best-practice

This is a proposal only. Nothing has been edited yet. Approve it, or cross out any item, and the supervisor applies what's left.

## In short

- **Main gain: fewer silent stalls.** A builder that goes quiet is noticed within one hourly tick and replaced by the second. Ready cards get started from the live tracker, not from memory. A question that nobody answers no longer freezes a session.
- **Fewer wasted CI runs.** Guard failures get caught on the agent's own machine before the push, not after a CI run of about 20 minutes. Card collisions (like the pinned-test one) get caught while the card is being written, not halfway through the build.
- **A shorter AGENTS.md** (about 111 lines down to about 80). Step-by-step procedures move into role files ("skills"). A skill is a file of instructions that only the role using it loads.
- **What needs your yes.** Three items change a rule you set:
  - 3(b): a card may update another task's pinned test;
  - the CI-log wording in change 1;
  - which cards Sonnet builds (change 7).

  Change 6 also needs your yes, because it moves your dated rules (the wording stays the same). Change 4 adds one "Never" line. Everything else only adds. No test or check gets looser, and every "Never" and "Only the owner" line stays word for word.

---

## 1. What the repo recommends that we already do

- **Separate builder and reviewer.** The reviewer works in a fresh context and builders never approve their own work. The repo says a second, fresh look catches bugs the first one made.
- **Plan hard work before building,** with checks on each phase. That is our "understand → competing designs → judges → cards" step, plus the design-note check-in.
- **Strong model for judgement, lighter model for mechanical work,** with models named exactly.
- **Verification loops,** which the repo calls the biggest lever on quality. We have four CI gates, "fails before, passes after" tests, and proof that each new test catches a break.
- **A durable cloud Routine for the hourly tick.** `/loop` ends with its session and expires after a few days, so it can only ever be a helper.
- **Shared hooks checked into the repo.** Ours put the owner's rules in front of every prompt and after every start or compaction.
- **Auto mode switched on when a session starts,** not in a repo file (a repo file cannot switch it on).
- **One branch per card,** a file-ownership table and a `depends_on` field.
- **A limit on retries:** after two failed tries, stop and escalate.
- **The supervisor reacts to events, not polling,** and does small checks itself instead of starting new sessions.
- **AGENTS.md is under the repo's 200-line limit,** `CLAUDE.md` just imports it, and the test commands are listed.

---

## 2. Proposed changes, ranked by impact

### Change 1: a tick that works from live state and repairs stalls

- **Change:** each hourly tick follows a fixed checklist that reads the tracker, PRs and sessions fresh. It replaces stalled builders and starts every card whose dependencies are done.
- **Files:**
  - new `.claude/skills/supervisor/SKILL.md`: the "Supervisor" section of AGENTS.md, moved word for word, minus the safety lines that stay in AGENTS.md (change 6);
  - new `.claude/skills/supervisor/tick.md` and `.claude/skills/supervisor/gotchas.md`;
  - new `.claude/skills/ci-log/SKILL.md`, with `context: fork`, `background: false` and `model: sonnet` at the top;
  - the hourly Routine's prompt becomes "Run the tick in the supervisor skill."
- **Adds** (new `tick.md`; it points to SKILL.md for everything already written there):
  > Every tick, work from live state, never from memory or from the message that woke you:
  > 1. Read the tracker, the open PRs and every running builder's session status.
  > 2. Do the tracker sweep in SKILL.md. Also start every `ready` card whose `depends_on` are all done, in parallel when they are independent.
  > 3. A builder has stalled when all of these hold: its card is `running`; its session is idle; it has pushed and commented nothing since the last tick; and its HANDOFF "Waiting on" is nothing, or something that has already happened (the CI run finished, the supervisor already replied). If it is waiting on you, answer it this tick. For a stalled builder:
  >    - check whether your last one-shot message reached it (`list_triggers` with `include_completed: true`, then read that Routine's last run). If it failed, retry once now with SendMessage. Otherwise send one new message;
  >    - if it still has not moved at the next tick, archive it, then start a fresh builder from its HANDOFF.
  > 4. Subscribe to activity on every open PR, so a green check or a comment wakes you straight away.
  > 5. When a CI run fails, run `/ci-log`. Open the full log before any code change based on it.
  > 6. When something slipped through that a rule would have caught, add one line to `gotchas.md` naming the incident.
- **Adds** (supervisor `SKILL.md`):
  > On every wake (the tick, a PR event, `/loop`, an owner message), check that the hourly Routine is enabled and that its last run succeeded.
- **Adds** (`ci-log/SKILL.md`):
  > Return the job URL, the failing step's name and the exact error lines, quoted word for word with their log line numbers. Do not suggest a fix.
- **Owner rule wording:** "reads the failing CI log itself" becomes "reads the failing CI log itself, or its exact failing lines through /ci-log".
- **How it helps:** a quiet builder is noticed within one tick and replaced by the second, ready cards stop being missed, a green check wakes the supervisor straight away, and long CI logs stay out of its working memory.
- **Source:**
  - `videos/claude-matt-pocock-24-apr-26.md`: a loop re-reads the backlog on every run, so a missed run corrects itself;
  - `reports/llm-day-to-day-degradation.md`: keep a fallback path for outages;
  - `implementation/claude-scheduled-tasks-implementation.md` (3 days) and `README.md` line 319 (up to 7 days): `/loop` belongs to one session and expires;
  - `README.md` "Hot" list: cross-session messaging (SendMessage, ListAgents);
  - `best-practice/claude-commands.md`: `/autofix-pr` reacts to PR and CI events;
  - `tips/claude-thariq-tips-17-mar-26.md`: skills are folders, and a Gotchas section grows from real failures;
  - `best-practice/claude-skills.md`: `context: fork`, `background`, `model`;
  - `changelog/best-practice/*/verification-checklist.md`: add one rule for each new kind of incident.
- **Cost and risk:**
  - The tick reads a little more each hour, but `/ci-log` saves more than that.
  - Risk: a replacement builder and a late-waking original both push. Mitigation: archive the original first, and send at most one message per builder per tick.
  - Risk: a misread log leads to a wrong fix. Mitigation: the helper quotes exact lines, and the supervisor opens the full log before changing code.
  - Risk: SendMessage is not yet proven in our cloud sessions. A cloud session cannot reply, and a session in a different permission mode holds messages until they are approved. Mitigation: Routines stay the main route; SendMessage is only a retry, tested once on a live builder first.
  - **Approval:** the supervisor, except your yes on the CI-log wording.

### Change 2: builders keep a handoff note and re-read everything when they wake

- **Change:** builders follow a `builder` skill: today's builder rules, plus a rule for waking up and one HANDOFF block that they keep up to date.
- **Files:** new `.claude/skills/builder/SKILL.md` (the "Builders" section of AGENTS.md, moved word for word, minus the safety lines that stay in AGENTS.md) and `.claude/skills/builder/gotchas.md`.
- **Adds:**
  > On every start or wake, read your card, your PR, its CI and your HANDOFF block before doing anything. Never act on the wake-up message alone.
  > Subscribe to your own PR's activity, so a finished CI run wakes you.
  > Keep one HANDOFF section in the PR body. Before you pause, wait or stop, push your work and edit it in place:
  > `HANDOFF <card> @ <commit>` · one line per criterion: `[x] done: evidence` / `[~] in progress: what's left` / `[ ]` not started / `[-] failed: why` · `Next:` one line · `Waiting on:` nothing, a CI run or the supervisor · `Risk:` one line.
  > Post a new comment only when you stop for good or escalate.
  > Keep heavy reading (logs, big files) in a helper such as `/ci-log`, so only the answer enters your context.
  > The PR body also gets one line: `You will notice:` one plain sentence about what changes in the app, or "nothing visible".
- **How it helps:** a replacement builder picks up in minutes from one block, the supervisor reads a card's state in one line, and a stale wake-up message can no longer send a builder the wrong way.
- **Source:**
  - `tips/claude-thariq-tips-16-apr-26.md`: a handoff note written "for its future self", and a fresh context plus a short brief for a high-stakes next step;
  - `development-workflows/rpi/.claude/commands/rpi/implement.md`: fixed status markers so a restart resumes from what is written;
  - `videos/claude-dex-mlops-community-24-mar-26.md`: quality drops as the context fills up.
- **Cost and risk:**
  - One small edit to the PR body each time a builder pauses. That edit doesn't wake anyone.
  - Risk: a builder skips the note. Mitigation: the tick treats "idle with no HANDOFF" as stalled, and the reviewer checks the block.
  - **Approval:** the supervisor. Your self-check rules move without a word changed.

### Change 3: check each card for collisions before it becomes `ready`

- **Change:** before marking a card `ready`, the supervisor checks it against the shared add-only files and the other open cards, and writes down how each clash gets settled.
- **Files:** new `.claude/skills/supervisor/cards.md`. The "Plan hard cards" steps move here, and the card field list gains `model`.
- **Adds:**
  > Before a card is `ready`:
  > 1. List what the card changes. Search the shared add-only files (`scripts/screenshot-gate.mjs`, `tests/theme.test.ts`, `src/ui/styles.css`) and the `write_scope` of the other open cards for anything that pins or touches it.
  > 2. If another task's block pins behaviour this card changes, name the block (task ID, file:line) in `read_first` and settle it now. Either:
  >    - (a) the design avoids the change; or
  >    - (b) the card's acceptance includes updating that pinned value to the new spec, with an assertion at least as strict. The supervisor writes this into the card.
  >
  >    A card with an unsettled collision is not `ready`.
  > 3. Cards meant to run in parallel agree their shared names, data shapes and test IDs first, and write them into each card.
  > 4. Cut work into vertical slices: each card is one small feature working end to end that can be checked on its own, not "the whole data layer first".
  > 5. `model:` `claude-sonnet-5` only for mechanical cards (every step spelled out); `claude-opus-5-5` for everything else. The supervisor passes it when it starts the session.
- **How it helps:** a clash like the pinned-test one gets found and decided before any builder spends tokens, parallel cards stop colliding, and each card gets the right model.
- **Source:**
  - `development-workflows/rpi/.claude/agents/constitutional-validator.md`: check each item against the project's fixed rules before building;
  - `agent-teams/agent-teams-prompt.md`: parallel workers agree the data contract, then work independently;
  - `videos/claude-matt-pocock-24-apr-26.md`: vertical slices, and tasks with explicit blocking links;
  - `reports/llm-day-to-day-degradation.md`: name exact models.
- **Cost and risk:**
  - A few searches per card.
  - **Approval:** the supervisor for the check. You decide option (b), because it changes today's "never edit another task's block". If you say no, only (a) stays, and the check still stops the card before a builder starts.

### Change 4: two settings that stop sessions freezing

- **Change:** a question that nobody answers carries on after 10 minutes, and a turn cut off by a restart resumes by itself.
- **Files:** `.claude/settings.json` (next to the two existing owner-rules hooks, which stay), one new line in the AGENTS.md "Never" list, and one line in "How work is delivered".
- **Adds** (one `env` block, holding only these two variables):
  ```json
  "askUserQuestionTimeout": "10m",
  "env": {
    "CLAUDE_CODE_RESUME_INTERRUPTED_TURN": "1",
    "CLAUDE_CODE_RESUME_INTERRUPTED_TURN_MAX_AGE_MS": "7200000"
  }
  ```
  New "Never" line:
  > Never treat a question that timed out as approval for anything on the "Only the owner" list.

  New line in "How work is delivered":
  > When a question times out, set the item to `blocked` with the question as its reason. The supervisor puts it in its next message to the owner.
- **How it helps:** a session no longer waits forever on a question (today's default is "never"), and a turn cut off by a container restart carries on by itself if it is under 2 hours old, while owner-only questions still reach you.
- **Source:** `best-practice/claude-settings.md`: `askUserQuestionTimeout` defaults to "never" and is read only from project or local settings, so our shared file is the right place; `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` and its `_MAX_AGE_MS` limit.
- **Cost and risk:**
  - Risk: a real question to you gets lost. Mitigation: the item is set to `blocked` with the question written down, and owner-only items stay blocked.
  - I cannot prove the resume setting works in cloud containers, because we cannot stage an outage. It does nothing if unused, and the first real restart will be recorded in LOG.md. A resumed turn re-reads state first (change 2).
  - **Approval:** the supervisor for the settings. You OK the new "Never" line, which only adds a restriction.

### Change 5: run the Agent guard before every push, and refuse edits to the watch files

- **Change:** a hook (a script the app runs automatically, whatever the agent intends) runs the same guard CI runs before any `git push`. Three deny rules refuse edits to the watch agent's files.
- **Files:** `.claude/settings.json` (a `PreToolUse` hook with matcher `Bash`, plus three `permissions.deny` rules) and new `.claude/hooks/guard-before-push.sh`. **Nothing in `.github/` changes.** The hook calls the existing `.github/scripts/agent-guard.sh` as it is.
- **Adds:**
  - The push hook. The guard exits 1 and prints to stdout, and a hook blocks only on exit 2, so the wrapper converts the result:
    ```sh
    cmd=$(jq -r .tool_input.command)
    case "$cmd" in *'git push'*) ;; *) exit 0;; esac
    git fetch -q --no-tags origin main:refs/remotes/origin/main
    out=$(bash "$CLAUDE_PROJECT_DIR/.github/scripts/agent-guard.sh" 2>&1) || { echo "$out" >&2; exit 2; }
    ```
    - It also refuses, with exit 2, a push that targets `main` or `claude/escobar-v2-implementation-eidx64`, and any force-push (`--force`, `--force-with-lease`, `-f`). That is stricter than today's rule, which allows a force-push on your own branch; none of our flows need one.
    - This checkout is shallow. If `git merge-base` still fails after the fetch, the guard silently skips the watch-file check, so the hook reports that the check was skipped.
  - The deny rules:
    ```json
    "permissions": { "deny": [
      "Edit(native/wear/**)", "Edit(src/native/wearEngine.ts)", "Edit(src/slices/settings/WatchLab.tsx)"
    ] }
    ```
    This is exactly the guard's list of watch files.
- **How it helps:** a guard failure costs seconds instead of a red 20-minute CI run, and the tool itself (not just the written rules) keeps agents out of the watch files, protected branches and force-pushes.
- **Source:**
  - `README.md` Hooks tips: a PreToolUse hook, "/freeze blocks edits outside a directory";
  - `reports/why-harness-is-important.md`: written rules are advice, while tool-level blocks cannot be ignored;
  - `README.md` CLAUDE.md tips: put rules that must always hold into settings, not prose.
- **Cost and risk:**
  - The hook only sees `git push` run as a shell command, and the deny rules only cover file edits. A push through the GitHub tools, or an edit made with a shell command, gets past them, so the CI guard stays the final check, unchanged.
  - Risk: a buggy hook blocks every push. Mitigation: prove it on a scratch copy before merging (see Rollout).
  - It does not block `.github/**` or `package.json`, because cards and the supervisor legitimately add lines there with an OK.
  - **Approval:** the supervisor.

### Change 6: a shorter AGENTS.md

- **Change:** AGENTS.md keeps the rules every session needs. Step-by-step procedures move to role files. Rules for particular files move to files that load only when those files get touched.
- **Files:**
  - `AGENTS.md`;
  - new `.claude/rules/shared-files.md`: `paths:` for the three shared add-only files; how to add a block, and what to do when another task's block is in your way;
  - new `.claude/rules/owner-gated.md`: `paths:` for `escobar-worker/**`, `src/core/models.ts`, `src/core/store.ts`, `src/core/migrate.ts`, `.github/**`, `scripts/prepare-android.sh` and `native/patch_manifest.py`; what "the owner merges or approves" means there;
  - `docs/AGENT-RULES.md`: one sentence saying where the procedures now live;
  - the skill files from changes 1, 2, 3, 8 and 9.
- **Stays in AGENTS.md, word for word:** the ULTIMATE RULE and working rules, roles, "may without asking", auto mode, "Only the owner", "Never", the file-ownership table, the commands, and "If the Agent guard check fails, read docs/AGENT-RULES.md".
- **Safety lines, kept only in AGENTS.md and taken out of the moved text:** the merge gate (review passed, green on the latest `main`, checklist order); "a bug fix needs a test that fails before and passes after"; "never cut, narrow or skip a test"; "evidence is valid only for the exact commit"; and "merge `origin/main` with a merge commit, keep both sides" (`.gitattributes` refers to it).
- **Moves:** the Builders procedure to `builder/SKILL.md`, the Supervisor duties to `supervisor/SKILL.md`, and the hard-card steps to `supervisor/cards.md`. That takes AGENTS.md from about 111 lines to about 80.
- **New root line** (with file paths, so Codex can open them too, since it does not load skills):
  > **Procedures:** every builder, Claude or Codex, reads and follows `.claude/skills/builder/SKILL.md` before its first commit. Reviewers use `.claude/skills/reviewer/SKILL.md`, and the supervisor uses `.claude/skills/supervisor/SKILL.md`. Rules in `.claude/rules/` appear when you touch those files.
- **How it helps:** each session carries only its own role's steps, and the shared-file rules show up exactly when a builder opens those files, which is where the pinned-test kind of clash starts.
- **Source:**
  - `README.md` CLAUDE.md tips: stay under 200 lines, and `.claude/rules/*.md` with `paths:` load only when matching files get touched;
  - `best-practice/claude-memory.md`: instructions for one area load only when that area is used;
  - `videos/claude-dex-mlops-community-24-mar-26.md`: models follow a limited number of instructions reliably, so split by role or phase;
  - `videos/claude-boris-y-combinator-17-feb-26.md`: keep the shared file small;
  - `reports/claude-agent-command-skill.md`: a skill loads only when it is used.
- **Cost and risk:**
  - Risk: a builder never opens its file and misses the self-check. Mitigation: the root line names the file for every builder, Claude or Codex; every builder prompt starts with that path; the reviewer rejects PR bodies that are missing the required parts; and the safety lines stay in the root file.
  - I have not checked that Codex follows a linked file. The root line tells it to, and review still checks its PRs.
  - Path-rule loading is not yet confirmed in cloud sessions. We check it in one fresh session before relying on it.
  - **Approval:** you, because rules you dated move (the wording does not change).

### Change 7: enforce "never Haiku or Fable"

- **Change:** block Haiku and Fable helpers in settings, and write your model rule down.
- **Files:** `.claude/settings.json`; one line in AGENTS.md "How work is delivered"; `.claude/owner-rules.md` rule 1 gains "(Opus 5.5 / Sonnet 5; never Haiku or Fable)".
- **Adds** (no change to the default helper model):
  ```json
  "permissions": { "deny": [
    "Agent(model:*haiku*)", "Agent(model:*fable*)",
    "Agent(Explore)", "Agent(claude-code-guide)"
  ] }
  ```
  New AGENTS.md line, using your words:
  > Models: a strong model for hard judgement, `claude-opus-5-5` (planning, judging, reviewing, and any card that is not mechanical); a lighter one for mechanical steps, `claude-sonnet-5` (every step spelled out). Never Haiku or Fable. The built-in Explore and claude-code-guide helpers run on Haiku, so they are blocked. For a search, use a general-purpose helper that names `sonnet`. Helpers that name no model use the session's model.
- **How it helps:** your model rule lives only in the brief today (I checked the repo). This writes it down and makes the tool refuse Haiku and Fable helpers, so nobody can break it by accident with a quick search.
- **Source:**
  - `best-practice/claude-subagents.md`: Explore and claude-code-guide use `model: haiku`;
  - `best-practice/claude-settings.md` line 325: `Agent(name)` blocks a named helper, for example `Agent(Explore)`. Deny rules can match a tool's input with `*` wildcards, and deny beats allow.
- **Cost and risk:**
  - Each deny rule gets tested once, and the session must start with no warning.
  - The Explore block may break built-in review helpers. Mitigation: run `/code-review high` on one real PR after the rules land (Rollout step 3).
  - Mechanical helpers must name `sonnet` explicitly, as `/ci-log` does. The supervisor checks its workflow scripts for this.
  - **Approval:** you confirm the rule text. The supervisor does the rest.

### Change 8: the APK message builds its change list the same way every time

- **Change:** a fixed after-merge step that turns each PR's "You will notice" line into the change list sent with the APK.
- **Files:** new `.claude/skills/supervisor/ship-apk.md`; the builder skill's PR line (change 2); Relay `PROJECT_STATE.md` holds "last APK sent: <commit>".
- **Adds:**
  > After a merge, find that commit's green build. Confirm the step "Sign with the permanent key and verify the fingerprint" passed. Then send one message:
  > "New test build `<commit>`: <link>. What changed for you: • <'You will notice' line> (#PR) … Needs a check on your phone: <items or 'nothing'>."
  > Include every PR merged since the last APK you sent.
- **How it helps:** each line of the change list comes from the builder who made the change, nothing merged since the last APK gets left out, and the supervisor no longer re-reads diffs to write it.
- **Source:** `tips/claude-boris-13-tips-03-jan-26.md` item 7 and the `README.md` Commands tips: turn a workflow you repeat every day into one reusable command or skill.
- **Cost and risk:**
  - A vague line. Mitigation: the reviewer checks it is plain and true.
  - **Approval:** the supervisor.

### Change 9: one standard review

- **Change:** reviewers run the built-in `/code-review`, then check each acceptance criterion, then post a verdict in a fixed format. Reviewers always run on `claude-opus-5-5`, and their helpers inherit it.
- **Files:** new `.claude/skills/reviewer/SKILL.md`.
- **Adds:**
  > Run `/code-review` on the PR, at `high` for normal cards and `max` for hard cards. Never use `ultra` or `/ultrareview`: they spend usage credits, which only the owner approves. Then check every acceptance criterion's evidence against the card, and the HANDOFF and "You will notice" lines. Post one comment:
  > `REVIEW <card> @ <commit>: PASS | CHANGES NEEDED` · `Blockers: N · High: N · Medium: N` · one line each: `file:line — problem — fix`.
- **How it helps:** the supervisor decides from one line, and a broader bug hunt before merge means fewer fix-up PRs in the queue.
- **Source:**
  - `best-practice/claude-skills.md`: `code-review` with effort levels;
  - `development-workflows/rpi/.claude/agents/code-reviewer.md`: the verdict and severity-count format;
  - `videos/claude-matt-pocock-24-apr-26.md`: Sonnet builds, Opus reviews.
- **Cost and risk:**
  - `/code-review` at high effort uses several helpers, so each review costs more tokens. The supervisor compares the first 5 reviews with the old style and reports to you.
  - The Explore block (change 7) may affect it. It gets tested on one real PR first.
  - **Approval:** the supervisor.

---

## 3. Rejected ideas

| Idea from the repo | Why we should not adopt it |
|---|---|
| Agent Teams in tmux panes; local git worktrees | Desktop-terminal features. Our cloud sessions, one per `claude/*` branch, already keep work apart. |
| Switching auto mode on, or adding auto-mode "hard deny" rules, in the repo's settings | A repo file cannot switch auto mode on, and these rules are read only from user or managed settings. We already start sessions in auto mode; the hook and deny rules in change 5 do the enforcing. |
| Managed (organisation) settings; sandbox read/write bans | Need an organisation admin tier or per-machine files, which we don't have. The keystore never lives in the repo, and the guard enforces that. |
| A `CLAUDE.md` inside `native/wear/` or `escobar-worker/` | A file there breaks watch ownership (the guard fails), or ships through a Worker PR that deploys production. Change 6 uses `.claude/rules/` with `paths:` instead. |
| Small-PR target (about 118 lines, always squash-merged) | Our CI takes about the same time per PR whatever its size, and merges go one at a time, so more, smaller PRs would lengthen the queue. We keep "one coherent card, one PR", cut into vertical slices. |
| `/compact`, `/clear`, `/rewind` as a builder habit | Only a person can type these. Our agents run alone, so changes 1 and 2 use separate helpers, fresh sessions and HANDOFF notes instead. |
| A Stop hook that forces a session to keep going | It can loop and burn tokens, and it fires for every role. Changes 1, 2 and 4 cover idle builders. |
| `/goal` on the supervisor | It keeps the supervisor taking turns while it waits on CI, which costs tokens. The hourly tick plus PR events do the job. |
| `opusplan`; plan-mode interviews ("grill me") | Plan mode waits for a human tap, so an unattended session would stall, and interviews clash with "decide, don't ask". |
| Advisor (a Sonnet worker that asks Opus for advice) | Still in beta and not checked in cloud sessions. The card `model` field and the Opus reviewer already cover it. |
| The watch agent (Codex) reviewing plans | That changes its role and adds GPT spend, which is your decision. Our independent judges already score the designs. |
| Reviewer with `memory:` | Our reviewer is a separate cloud session. `gotchas.md` does the same without new saved files. |
| "Explanatory" output style, thinking shown | Clashes with plain words, lean tokens and no play-by-play. |
| Prototype 20–30 versions instead of writing specs | Clashes with "quality is never traded away" and with cards that have acceptance criteria. |
| One commit per file | Our commits carry the evidence (each new test proved by breaking the code it covers), so one commit per logical step fits better. |
| Automatic formatter after every edit | The project has no formatter, and adding one is a new dependency. CI never fails on style. |
| Context7 or other new MCP servers | A new outside service needs your OK, and none of them fixes a current problem. |
| `design` / `design-sync` | It converts a React design system; ours is Preact. The first sync can take hours, and nobody uses Claude Design here. |
| Push notifications when Claude finishes or needs input | Tied to Remote Control, and ours are cloud sessions. "Push when done" from every builder would be play-by-play. |
| `/fewer-permission-prompts` | Auto mode already removes most prompts. We can run it later if sessions still stop on prompts. |
| `--max-turns` / `--max-budget-usd` | Work only in print mode, which our sessions do not use. |
| Replacing Relay's tracker with Claude's Tasks files | Those are local files, and I can't confirm they sync between cloud containers. Relay stays the source of truth. |
| `CLAUDE.local.md` for owner rules | Nothing in our rules is secret, and every session must see them. |
| `<important if>` tags in AGENTS.md | A community formatting trick. The hard rules get tool-level enforcement instead (changes 5 and 7), which is stronger. |

---

## 4. Rollout

1. **You approve this proposal,** or cross items out. Nothing gets edited before that.
2. **PR 1: the rules move.** It covers change 6, the skill files for changes 1, 2, 3, 8 and 9, and the `docs/AGENT-RULES.md` pointer, on one `claude/*` docs branch. A fresh reviewer checks that:
   - every moved line appears exactly once, and the safety lines appear only in AGENTS.md;
   - every "Never" and "Only the owner" line is unchanged, apart from the one added "Never" line.
3. **PR 2: settings and hook** (changes 4, 5 and 7). Tests on a scratch copy, with no real bad push:
   - push hook: a guard failure blocks the push with exit 2 (not just a red message); a clean branch is allowed; a push to `main` or `claude/escobar-v2-implementation-eidx64` is refused, and so is a force-push; the "check skipped" note reaches the agent when merge-base fails;
   - each deny rule is tested once (Haiku, Fable, Explore, claude-code-guide, the three watch files), and the session starts with no warning;
   - then `/code-review high` on one real PR.
4. **After both merge:**
   - switch the hourly Routine's prompt to the tick;
   - start new builder and reviewer sessions with their role file;
   - in one throwaway session, confirm that the path rules load and that the 10-minute question timeout fires;
   - check once that a builder and the supervisor both get events when both subscribe to the same PR;
   - test SendMessage once on a live builder before using it as the retry route.
5. **Run one normal card through the new flow.** Record the pinned-test incident as the first line of `gotchas.md`.
6. **One-time check:** do all our sessions share one subscription usage limit? If so, some "outage" stalls may really be limit stalls (source: `reports/claude-usage-and-rate-limits.md`).

**Guard compatibility.** The Agent guard (`.github/workflows/agent-guard.yml` → `.github/scripts/agent-guard.sh`) never reads AGENTS.md or `.claude/`, and it passed on this head (exit code 0). It checks:
- the signing step names and the fingerprint in `build-apk.yml` and `release-apk.yml`;
- key files;
- that `claude/*` branches stay out of the watch files, and `codex/*` branches stay out of the remediation paths.

None of these changes touches those files. What must stay:
- `docs/AGENT-RULES.md` at that exact path (every guard message and `README.md` point to it);
- the AGENTS.md line "If the Agent guard check fails, read docs/AGENT-RULES.md";
- the watch-file row in the ownership table, matching the guard's path list;
- the "merge `origin/main` locally" line, which `.gitattributes` refers to;
- `CLAUDE.md` = `@AGENTS.md`;
- the two existing owner-rules hooks.

Relay's CONTRACT.md needs no change, because the working rules it mirrors stay as they are. Each change gets its own line in LOG.md.

---

**Review points not applied:** none. All 6 "must" and all 9 "should" fixes are in.
