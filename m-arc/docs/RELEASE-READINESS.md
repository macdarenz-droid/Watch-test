# Release readiness (owner item 10)

The owner approved this on 2026-09-26. It runs after item 9 and the fix loop for the 8/9 findings, and before the final APK message, so it checks the final build. Added on 2026-09-26 from the Agent Delivery Playbook: items 6–9 below, the release record, and the rule that the real-phone test blocks the store upload.

## Agents do
1. **Upgrade safety.**
   - Load data saved by the currently installed version (hotfix 721e997) into the final build: unit tests use fixtures exported from the old build, covering sessions, notes, settings, heart data and Escobar state.
   - Confirm nothing is lost or changed.
   - Confirm the release APK's signing certificate matches the pinned fingerprint. Verify only: never touch signing steps, keystores or the fingerprint.
2. **Coach server protection** (code in escobar-worker/; the owner deploys):
   - requests per install and per IP are limited, with a size cap;
   - a daily spending guard (a token budget counter): when the budget is used up, the coach returns a friendly "coach is resting, try later";
   - an uptime alert hook that reuses what exists (the `/health` endpoint plus a scheduled check that posts to Relay). A new alerting provider needs the owner's approval first.
3. **In the app:**
   - a training and AI disclaimer in onboarding and in the coach sheet ("not medical advice; the coach can be wrong");
   - a clear message when the coach is unreachable or resting;
   - a backup reminder when there's no backup in 30 days and at least 10 sessions are logged;
   - a privacy policy link in Settings (the owner supplies the URL);
   - the app version and "what's new" notes.
4. **Store paperwork drafts for the owner to review:**
   - listing text;
   - data-safety answers (what is sent, and when: coach data only when used, health only when shared, anonymous error reports only with consent);
   - permission reasons (health, notifications, watch);
   - release notes;
   - a privacy policy text draft.
5. **A real-phone test script:** a short checklist for the owner covering a cheap phone, a Huawei without Google services, two Android versions, swipe gestures, reminders, the watch, and installing over the old app.
6. **Online and offline behaviour table.** One row per feature that talks to anything outside the phone: the coach (Escobar), error reports, Health Connect, the watch, and backup export/import. Each row lists:
   - who owns the data;
   - what leaves the phone and when;
   - identity and permission;
   - how fresh the data is;
   - timeout and retry;
   - duplicate-request protection;
   - what the user sees when offline, when the server fails, and on reconnect;
   - cost and rate limits;
   - retention and deletion.

   Each row is checked against the code, not assumed. A gap becomes a fix in this item.
7. **Coach quality set.** 15–20 representative coach questions, including bad or empty input, privacy traps (asking for data the sharing switches block), and "coach resting/offline". For each question:
   - required answer properties (for example: no invented numbers, respects the sharing switches, a short plain answer);
   - latency;
   - cost per call.

   Run it before release and after any prompt or model change. A well-formed answer can still be wrong, so each answer is judged against its properties. Running it against the live Worker uses the owner's AI key (a few cents), so the owner approves that one run.
8. **Final regression on the exact release candidate.** The fix loop and items 1–7 above change code after the full QA (items 8 and 9). So, on the exact final commit and APK, run:
   - typecheck, all unit tests (three time zones) and the full gate;
   - a re-check of every 8/9 finding marked fixed;
   - the upgrade-safety tests.

   Any later change to code, config or stored-data shape means running the affected checks again. A passing result never carries over to a different build.
9. **Release record** (the section below): filled in and kept current by the supervisor.

## Release record
- **Candidate:** commit SHA, APK artifact link, version name/code, signing fingerprint verified (yes/no).
- **Checks on this exact candidate:** each with a link to its evidence (CI run, QA doc, device check). The real-phone test stays marked "not verified on a real phone" until the owner reports back.
- **Known risks:** each with its mitigation.
- **Rollout:** staged, if the store supports it. Health signals are watched after release: Worker `/health` uptime, the error-report daily summary, and store crash stats. The owner is alerted and responds.
- **Halt and recovery:**
  - App: an installed Android app cannot be rolled back, so a bad release is fixed by shipping a new version with a higher version code.
  - Worker: the owner redeploys the last good Worker version.
  - Saved data: a change to the saved-data shape ships only with a tested backup restore or a compatible forward fix. A feature switch cannot undo a destructive migration.

## Owner does (agents can't)
1. Back up the signing key and Huawei secrets offline, in 2 places. They are never committed; the repo is public.
2. Host the privacy policy (from the draft) and send the URL.
3. Set a spending cap on the AI provider key.
4. Deploy the Worker updates (items 7.5 and 10).
5. Run the real-phone test script, and optionally a 5–10 person closed beta for 1–2 weeks. **The store upload waits for this check.**
6. Store account and listing: approve screenshots, set the age rating and support email.
7. Approve the one coach quality-set run against the live Worker (a few cents on the AI key).

## Google Play (REL-2)
**The pipeline now proves** (`.github/workflows/play-bundle.yml`, artifact `MARC-PLAY-AAB-UNSIGNED`, on every push to `main`, on demand, and on PRs that change the pipeline). Use a Play bundle only from a commit whose M/ARC gate is green. Each check fails the run with its own message, and a self-test step shows every check catching a broken copy.
- An unsigned release App Bundle (`.aab`) is built the same way as the release APK.
- The bundle exists, and its manifest (read with bundletool `dump manifest`) is not debuggable.
- The package is `com.mrcdrnzz.dailytracker`, pinned in the checker; a changed `appId` in `capacitor.config.json` fails the job.
- versionCode is `major × 1,000,000 + run number` and versionName is `<package.json version>.<run number>`, the release-apk.yml rule. Both rise on every run.
- targetSdk is 36 or higher. From 31 August 2026, Play requires API level 36 (Android 16) for new apps and updates: https://developer.android.com/google/play/requirements/target-sdk
- Every 32-bit native library has a 64-bit variant.

**Still needed, and who does it**
- Owner:
  - the Play developer account;
  - the Play App Signing choice;
  - the upload-key signing step (a separate PR after that choice; the bundle stays unsigned until then);
  - a closed test with 12 testers for 14 days;
  - GitHub Pages for the privacy policy (PR #93);
  - the store forms (content rating, target audience, data safety, app access).
- Agents:
  - the listing text, the data-safety drafts and the screenshots (branch `claude/play-store-cards`).

**Version-code risk:** play-bundle.yml and release-apk.yml count their runs separately. On 2026-09-30, release-apk.yml had never run and debug builds use versionCode 1, so every code above 37,000,000 is higher than anything a phone has seen. If the owner later sideloads many release APKs, a Play build could carry a lower code than one of them. That only matters if Play's app-signing key is the same key as the sideload key; with a different key, the two cannot update each other anyway.

## Google Play: signing keys (REL-3)

Owner decision, 2026-09-30 (REL-3): Google Play signs the app with your existing permanent key (SHA-256 `05:66:9A:…:F1:F5`), so Huawei and Play see the same app. CI signs what it uploads to Play with a separate, new upload key. If the upload key is ever lost, Google can reset it; the permanent key never leaves your control except in a copy encrypted for Google.

Because Play and your sideloaded APKs now share the same key, the REL-2 version-code risk above applies: a Play build installs over a sideloaded release APK only if its versionCode is higher, and the reverse is also true.

Two one-off jobs do the key work. You start each from your phone. GitHub only shows **Run workflow** for a job once its file is on `main`, so both work after the REL-3 PR has merged.

**How to start a job:** open the repo on GitHub → **Actions** → pick the job in the list → **Run workflow** → choose the branch under "Use workflow from" → green **Run workflow**. When the run shows a green tick, open it: the key facts are in the summary, and the files are under **Artifacts** at the bottom.

### 1. Create the upload key (job "Play - create upload key (one-off)")
- **First, make a short-lived token** so the job can save the key as secrets. The 7-day one from the permanent-key work should already be deleted.
  1. On GitHub: your photo → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
  2. Expiration: 7 days. Repository access: **Only select repositories** → this repo. Repository permissions: **Secrets: Read and write**. Generate, then copy the token.
  3. Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Name it `SECRETS_WRITE_TOKEN` and paste the token.
- The job also needs `KEY_EXPORT_PASSPHRASE`, which you already have. If either secret is missing, the job stops at its first step with a clear message and creates nothing.
- Run it once, on `main`. It stops if the upload key already exists, so it can never replace it.
- It stores the key as the secrets `MARC_UPLOAD_KEYSTORE_B64` and `MARC_UPLOAD_STORE_PASSWORD`.
- Download both artifacts:
  - `marc-upload-key-backup-ENCRYPTED`: your backup, locked with your `KEY_EXPORT_PASSPHRASE`. Keep it offline in 2 places, like the permanent key's backup.
  - `marc-upload-certificate`: the public certificate, `upload_certificate.pem`. You need it in step 3. It is not secret.
- Note the upload key's SHA-256 from the run summary.
- **Afterwards, clean up:**
  - delete the repo secret `SECRETS_WRITE_TOKEN` (repo → Settings → Secrets and variables → Actions);
  - delete the token itself (Settings → Developer settings → Fine-grained tokens → the token → Delete).

### 2. Get Google's encryption public key onto GitHub
1. Play Console → your app → **Test and release** → **App integrity** → **App signing**. For an app that already has a key: **Change app signing key**. Then pick the option to export and upload a key from a Java keystore, "Provide a copy of your app signing key" or similar. The exact labels may differ.
2. In that dialog, download **the encryption public key**. It is a small `.pem` file and it is public. Leave the dialog open, or come back to it later.
3. If your phone names it something else, rename it to `encryption_public_key.pem`.
4. GitHub → the repo → go into the folder `.github/play` (on `main`) → **Add file** → **Upload files** → choose the `.pem` → commit it.
   If the folder doesn't exist yet, open **Add file** on `main`, upload the file, and before committing type `.github/play/` in front of its name.

### 3. Hand the permanent key to Google (job "Play - export app signing key for Google (one-off)")
- Run it on the branch that has the `.pem` from step 2. If the file is missing, the job stops and says so.
- It first checks that the stored key is really `05:66:9A:…:F1:F5`. It stops if not, and nothing is exported.
- Download the artifact `marc-app-signing-key-for-google-ENCRYPTED`. It is kept for 1 day only.
- Your phone saves it as a zip that contains another zip. On Android, open **Files** → **Downloads** → tap the download → **Extract**. You get `marc-app-signing-key-for-google.zip`. Do not unzip that one.
- In the Play Console dialog from step 2, upload `marc-app-signing-key-for-google.zip`.
- **In the same dialog, also upload `upload_certificate.pem` from step 1** in the upload key certificate field. Play may mark this field optional, but you must fill it. Without it, Play treats the permanent key as the upload key and rejects every bundle CI signs with the upload key. Save.
- **Check:** App signing should now list two keys:
  - the app signing key, SHA-256 `05:66:9A:…:F1:F5`;
  - the upload key, with the SHA-256 from step 1's summary.
  If only one key shows, tell an agent before uploading any bundle.
- The zip is encrypted to Google, so only Google Play can open it. Delete it from your phone after the upload.

When Play shows the app signing key as `05:66:9A:…:F1:F5`, ask an agent to delete both one-off job files.
