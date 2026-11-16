# Supervisor scripts

Small shell watchers the supervisor runs in the background, plus one conflict helper. Each script has a header that says what it does, how to call it and what it prints.

**Rules for all of them**
- They call `api.github.com` for `macdarenz-droid/M-arc` with `curl`. They need the agent proxy's GitHub auth, which the session provides. No token is stored in any file here. Never add one: the repo is public.
- They need `bash`, `curl` and `python3`.
- Run `monitor.sh` with the Monitor tool (`timeout_ms: 1800000`), so each line it prints wakes the supervisor. It ends after 30 minutes: re-arm it every tick with `SINCE` backdated 1–3 minutes.
- Start the other watchers with the Bash tool, `run_in_background: true` and `timeout: 7200000` (2 hours). The default of 30 minutes kills them while CI is still queued.
- A background run that exits wakes the supervisor. `branch-watch.sh` never exits on its own, so read its output file.
- Commit SHAs passed to a script are full 40-character SHAs (`git rev-parse`).

| Script | Use it when | Call | Prints |
|---|---|---|---|
| `monitor.sh` | Any PR is open. Always keep one running. | `SINCE=<UTC time> ./monitor.sh` | `#<pr> comment: <first line>` for each new builder or reviewer comment; `title: <pr> <title>` for each title change. Skips comments that start with `**Supervisor` or `**Paused`, and the PR numbers in `SKIP` (edit that list: parked PRs are in it; take #149 out when the improvement audit starts). Reads issue comments only; formal PR reviews come through `subscribe_pr_activity`. |
| `ci-watch.sh` | A PR head or a merge-train head is waiting for CI. | `./ci-watch.sh LABEL:<sha> [LABEL:<sha> ...]` | `CI <label> <sha7>: guard=... source-gate=... visual-gate-tz=... android-gate=...` once per commit when every check run is complete. Exits when all are done. It waits until all four (`guard`, `source-gate`, `visual-gate-tz`, `android-gate`) exist and every check run it sees is complete. A skipped `android-gate` (after a red gate) still counts as a check run. Add `ht10-gate` to `req` when HT-10's job lands. |
| `apk-watch.sh` | An app-changing merge landed on `main`. | `./apk-watch.sh <sha>` | One line: run id, status, conclusion, the result of the "Sign with the permanent key and verify the fingerprint" step, and the `MARC-DEBUG-APK` artifact id. Link for the owner: `https://github.com/macdarenz-droid/M-arc/actions/runs/<run>/artifacts/<id>`. |
| `deploy-watch.sh` | The owner merged an `escobar-worker/**` change. | `./deploy-watch.sh <sha>` | The "Deploy Escobar Worker" conclusion, then the live `/health` body and the HTTP code of `POST /reports {}`. Gives up after about 60 minutes. |
| `branch-watch.sh` | Research or drawing branches are being pushed. | `./branch-watch.sh` | `push <branch> <sha7>` for each new push. The branch list is a snapshot of 2026-09-30: edit it first. |
| `resolve_gate.py` | A merge conflicts in `scripts/screenshot-gate.mjs` only because two branches each appended a gate block at the same spot. The markers read `<<<<<<< HEAD` and `>>>>>>> <any label>` (`origin/main` in a catch-up, the PR's SHA in a train). | `python3 docs/supervisor/scripts/resolve_gate.py` from the repo root, in the conflicted worktree. Then, before you commit the merge, `python3 docs/supervisor/scripts/resolve_gate.py --check HEAD <other side>` (`<other side>`: the PR's head SHA in a train, `origin/main` in a catch-up). | Resolve prints nothing. It rewrites the file in place: the `HEAD` block, then the shared closing lines (up to the first line that is exactly `}`), then the other block, then the rest. It leaves a conflict on the final `Screenshot gate PASS:` summary line for hand resolution and exits 1 while any conflict is left. `--check` prints `OK` (exit 0) or each bad removed line and `FAIL` (exit 1). |

**Checks after `resolve_gate.py`** (add-only rule from `AGENTS.md`, "shared, add-only" files): for each side, `git diff <side> -- scripts/screenshot-gate.mjs | grep '^-'` must print nothing, and `node --check scripts/screenshot-gate.mjs` must pass. If either fails, do not commit the resolution: drop that PR from the train.

**Exception: the final `Screenshot gate PASS:` summary line.** Cards that add a gate block often add a phrase to this one line (HT-1..HT-4 and AUD-20 did), so it can change on both sides. If git reports a conflict there, resolve it by hand into one line that holds every phrase from both sides: main's line first, then the PR's new phrase. Never keep two summary lines. Whether git merged it cleanly or not, against each side the only allowed `^-` line is that side's old summary line, and each of its phrases must appear in the new line: `resolve_gate.py --check HEAD <other side>` checks exactly this. Name it in the train PR body. Any other removed line drops the PR from the train. Train 6 (#170) is the clean case: against BUG-36's side the one `^-` line is its old summary line, which lacks main's AUD-20 phrase; `--check` prints `OK`.

**Not scripted:** cancelling standalone CI runs on a PR head that a merge train supersedes. The supervisor does that directly.

How these fit the whole routine: `docs/supervisor/HANDOVER.md` (merge trains, ticks, APK delivery) and `.claude/skills/supervisor/` (`tick.md`, `ship-apk.md`).
