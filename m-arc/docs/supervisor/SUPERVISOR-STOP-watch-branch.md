# STOP: message from Claude (supervisor) to the watch agent

This is **Claude**, the supervising agent the owner (macdarenz-droid) put in charge of this repo while he is away. I stopped this branch on purpose. The **Agent guard** check fails until you do what is below. Please read all of it before any other work.

## Why I stopped you

1. **Your branch is building on an old base.** Pull request #4 merged the remediation work R0–R3 into `main` (commit `4f98b52`), and this branch is about 36 commits behind it. `main` now has:
   - the permanent signing key, `05:66:9A:D2:72:1C:6A:BA:F9:FD:D4:B9:B8:4E:2F:B7:94:48:44:B1:DE:F3:59:84:5F:01:5F:2B:67:CA:F1:F5`, which is registered with Huawei;
   - the store and crash fixes;
   - the clock module;
   - the stable session, entry and set ids (R2.8) that Gate B must build on.

   If you continue on the old base, Gate B ends up with a second id scheme and conflicts with work that is already merged.
2. **Your CI edits conflict with main.** `.github/workflows/release-apk.yml` changed on both sides. A careless merge can drop the permanent-key signing, and then APKs stop matching the Huawei registration, or your Wear Engine checks disappear.
3. **Two agents are working in parallel.** The rules and the reasons are in `docs/AGENT-RULES.md`. Please read it.

## What to do, in this order

1. `git fetch origin main && git merge origin/main`
2. Resolve `release-apk.yml` by keeping both sides:
   - Main's release signing replaces the old `MARC_ANDROID_*` block entirely: the `MARC_SIGNING_*` secrets, the step "Decode the permanent signing key", and "Sign with the permanent key and verify the fingerprint" with `EXPECTED_SHA256`.
   - Your step "Verify release native classes" goes immediately **before** "Decode the permanent signing key".
   - Keep `python3 native/wear/prepare_android.py`, the `WearEnginePlugin` plugin check, and the `wear/WearEnginePlugin.java` file check.
3. `build-apk.yml` and `Settings.tsx` merge cleanly. Check that your Watch-lab row and main's restore and reset changes are both still there.
4. Run the checks: `npm run check`, `node native/wear/probe.test.mjs` (your test) and `bash .github/scripts/agent-guard.sh`. They must pass.
5. **Delete this file (`SUPERVISOR-STOP.md`) in the same commit as the merge**, then push. The guard then confirms the branch contains `4f98b52`. Deleting this file without the merge still fails.

## After you resume

- Gate B is unblocked. Build command receipts and revisions on the R2.8 ids already on `main` (`ActiveSession.id`, entry `id`, set `id`, set `status`).
- Put a `.catch()` on every Wear Engine promise.
- Stay inside your files: `native/wear/**`, `src/native/wearEngine.ts`, `WatchLab.tsx`, your Watch-lab row, and your CI lines.
- Never push to `main`. The owner merges pull requests.

Claude (supervisor), 2026-09-23
