# Agent rules: read this if the "Agent guard" check failed or warned

The guard (`.github/scripts/agent-guard.sh`) runs on every push. The general working rules, the file ownership table and the delivery process are in `AGENTS.md`. This page explains the guard's messages and how to fix them.

The step-by-step procedures for each role are in `.claude/skills/builder/SKILL.md`, `.claude/skills/reviewer/SKILL.md` and `.claude/skills/supervisor/SKILL.md`, and the rules for particular files are in `.claude/rules/`.

| Who | Branch | Owns |
|---|---|---|
| Supervisor (Claude, acting for the owner) | its own docs branch | the task board, the merge queue, CI files and these rules |
| Builders (Claude sessions, one per task) | `claude/*` | what their task card lists |
| Watch companion (GPT/Codex) | `codex/gt6-gate-a-watch-lab` (Gates A–E of `docs/WATCH-ARCHITECTURE.md`) | `native/wear/**`, `src/native/wearEngine.ts`, `src/slices/settings/WatchLab.tsx`, its Watch-lab row in `Settings.tsx`, and its lines in the CI workflows |

## Why you are being watched

1. **One signing key, registered with Huawei.** Every APK must be signed `05:66:9A:D2:72:1C:6A:BA:F9:FD:D4:B9:B8:4E:2F:B7:94:48:44:B1:DE:F3:59:84:5F:01:5F:2B:67:CA:F1:F5`.
   - Wear Engine (App ID `119100049`) accepts only that fingerprint, and an APK signed with any other key cannot update the owner's installed app.
   - Before 2026-09-23, every CI build used a random key and the registered one was lost (finding PL-19). The guard makes sure that never happens again.
2. **The repo is public.** Anything committed is public: keystores, `agconnect-services.json`, the Huawei app secret, tokens.
3. **Several agents edit the same CI files.** `build-apk.yml`, `release-apk.yml` and `native/patch_manifest.py` can carry several agents' lines, and a careless merge silently deletes someone else's work.
4. **`main` deploys production.** A push to `main` that touches `escobar-worker/**` deploys the live Escobar Worker. Changes reach `main` only through pull requests.
   - The supervisor merges app PRs after QA and green CI, under the owner's standing authority of 2026-09-26.
   - The owner merges any PR that touches `escobar-worker/**`.

## The rules, and how to fix a failure

| Guard message | Fix |
|---|---|
| **Signing step removed**, **Fingerprint changed**, **Release fingerprint changed** | Restore the steps "Decode the permanent signing key", "Sign with the permanent key and verify the fingerprint" and the `EXPECTED_SHA256` value exactly as on `origin/main`. Never rotate, regenerate or replace the key. |
| **Keystore committed**, **Key file committed** | Remove it (`git rm --cached`), add it to `.gitignore`, and tell the owner, because it is public now. Read keys only from secrets. |
| **Watch agent outside its files** | The watch branch must not change `escobar-worker/`, `src/escobar/`, `src/brain/` or the remediation and QA docs. Revert those paths to `origin/main`. If the watch genuinely needs a change there, write it down for the owner instead. |
| **Claude builder in watch files** | A `claude/*` branch must not change `native/wear/**`, `src/native/wearEngine.ts` or `WatchLab.tsx`. Revert those paths. |
| **Gate B files touched** (warning) | `session.ts`, `models.ts` and `store.ts` are allowed for Gate B only, built on the R2.8 identities already on `main` (`ActiveSession.id`, entry `id`, set `id`, set `status`). Do not create a second id scheme. |
| **Behind main** (warning) | `git fetch origin main && git merge origin/main`. Keep both sides of every conflict, and never drop the signing steps or another agent's CI lines. |

Also:
- Never push to `main` or `claude/escobar-v2-implementation-eidx64`.
- Never deploy the Worker yourself.
- Never skip or loosen a test or a guard check to get green.

## What the supervisor does

- It reviews every PR against these rules and `AGENTS.md` before merging, and it reacts to CI results on `main` and on open PRs. It also checks the live Worker's `/health`.
- A failed guard must be fixed in your next commit.
- If a push endangers the signing key, secrets or user data, or a rule is broken again, the supervisor stops that agent's session and reports to the owner.
