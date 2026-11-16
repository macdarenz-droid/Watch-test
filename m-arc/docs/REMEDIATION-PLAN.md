# M/ARC remediation and upgrade plan (R0–R8)

Built from [`QA-REGRESSION-AUDIT.md`](QA-REGRESSION-AUDIT.md) (162 findings: 161 from the audit, 104 of them confirmed by adversarial verification, plus PL-19 found in follow-up) and the improvement research in [`qa/research.json`](qa/research.json).
Base: `e34076f` (`claude/escobar-v2-implementation-eidx64`). This branch, `claude/marc-regression-architecture-gegkbq`, is that commit plus these documents.
Watch companion (GT6, Huawei Wear Engine): [`WATCH-ARCHITECTURE.md`](WATCH-ARCHITECTURE.md) and [`WATCH-INTEGRATION-NOTES.md`](WATCH-INTEGRATION-NOTES.md). The watch gates build on R0–R2 (see the ordering table in the notes).

---

## 0. How to use this document (implementing agent: read this first)

1. **Read order**: this file top to bottom. Then `docs/qa/findings.json`, but only for the IDs of the phase you are working on. Read `docs/COACHING-DECISIONS.md` before touching brain or Escobar code.
2. **findings.json** holds the full `evidence`, `failure_scenario`, `fix`, `fix_correction` (from the verifier) and `test` for every ID. Where this plan and findings.json differ, **this plan wins**: it merges the verifier corrections, deduplicates findings that share a root cause, and records decisions. Look up an ID with:
   `node -e "const f=require('./docs/qa/findings.json').find(x=>x.id==='UI-01');console.log(JSON.stringify(f,null,1))"`
3. **Never re-derive** decided things. Section 2 lists the owner decisions and their defaults. Use the default unless `docs/REMEDIATION-PROGRESS.md` records a different owner answer.
4. **Low-severity items** (`verdict: unverified-low`) were not independently verified. Read the cited line first. If the problem is not there, skip the item and note it in progress as "not reproduced".
5. Work **phase by phase, in order** (R0 → R8). Inside a phase, follow the layer order given there. The general order is data model → brain → native → UI → tests → gate.
6. Create `docs/REMEDIATION-PROGRESS.md` from the template in §13 at the start of R0 and update it at every layer. It is the resume point for a fresh chat.
7. Symbol names and line numbers in this plan were checked against `e34076f` by an independent review. If the code has moved since, search by symbol name, not line number.

## 1. Ground rules

### 1.1 Conventions (from the codebase; keep them)
- `src/brain/**` is pure: plain data in, plain data out. It never imports from `ui/`, `slices/`, `native/` or `escobar/`.
- Screens read `core/store` signals and change state only through `update()` / `replaceState()`.
- Copy shown to users is plain words: no version numbers, no "backend", "semantic" or similar.
- Tests are vitest, in `tests/**/*.test.ts` (environment `node`). For an in-memory `Storage`, copy the pattern in `tests/migrate.test.ts:56` or `tests/heartStore.test.ts:4`. `store.ts` and the new `clock.ts` keep module-level state (`storageRef`, `saveTimer`, `lastGoodRaw`, intervals), so tests use `vi.resetModules()` and a dynamic `import()` after `vi.useFakeTimers()`. Guard every new `window`/`document` listener with `typeof window !== 'undefined'`. `heartStore` defaults to the global `localStorage`, so stub it in backup tests. Worker tests are in `escobar-worker/test/`.
- New persisted fields must be optional or defaulted in `core/store.ts normalize()` (Escobar fields in `core/escobarState.ts`), so old saves and backups still load.
- The Escobar tool schema is generated: after editing `src/escobar/tools/schema.ts`, run `npm run escobar:tools`. `tests/escobar/tools-sync.test.ts` enforces this.

### 1.1a Protected identity (never change)
| What | Value |
|---|---|
| Android package | `com.mrcdrnzz.dailytracker` |
| Huawei App ID | `119100049` (Wear Engine application submitted, pending) |
| App signing certificate SHA-256 | `05:66:9A:D2:72:1C:6A:BA:F9:FD:D4:B9:B8:4E:2F:B7:94:48:44:B1:DE:F3:59:84:5F:01:5F:2B:67:CA:F1:F5`: the permanent key, created 2026-09-23 (run 35865126922), stored in secrets `MARC_SIGNING_KEYSTORE_B64` / `MARC_SIGNING_STORE_PASSWORD`, and pinned in `build-apk.yml`. Add it to the Huawei product. (`05:A0…A6:E8`, registered earlier, was a one-run random key and is permanently lost; see PL-19.) |

Once R0.0 has created it, never rotate or replace the permanent key. Every CI-built APK, debug and release, must be signed with it; CI fails otherwise. Never commit the Huawei app secret or `agconnect-services.json` (the repo is public).

### 1.2 Commands
| What | Command |
|---|---|
| App gate | `npm run check` (typecheck, 589+ tests, build) |
| Worker gate | `cd escobar-worker && npm ci && npm run check` |
| Visual gate | `npm run build && MARC_CHROMIUM=/opt/pw-browsers/chromium npm run gate` (the env var is only needed in the cloud container) |
| TZ matrix (added in R2) | `npm run test:tz` |

### 1.3 Commits, pushes, reporting
- Commit at the end of each **layer**, with the finding IDs in the message (e.g. `R1 store: quarantine unreadable state (ST-01, ST-10, ST-11)`). Push at the end of each **phase**. CI runs the full gate on every branch push.
- Report only at three moments:
  1. End of a layer: one line, `<phase> <layer> done, tests: <n> passed`.
  2. End of a phase: bullets for **Built**, **Tested** (commands and counts), **Decided by research**, **Needs device check**, **Next dependency**. No prose.
  3. A STOP condition: a credential is needed, or all phases are complete.
- **STOP only for credentials.** Owner-gated steps (marked 🔑) are listed under "Owner actions" in progress. Skip them and continue with everything else. At the end of all phases, STOP once with the full owner-action list.
- A failing test is never "flaky". Find the root cause. Never skip, disable or loosen a test to get green. The one exception is a test whose assertion encoded a bug this plan fixes: update it and note the ID.

## 2. Owner decisions (defaults apply unless the owner answers in progress)

| # | Decision | Default | Why |
|---|---|---|---|
| D1 🔑 | Signing identity (PL-19, PL-02) | **Create one permanent key in CI (R0.0), stored as secrets plus an encrypted offline backup. Sign debug and release with it explicitly.** Remove the cache step and the unused `1E:13` keystore; CI pins the fingerprint. Register the new fingerprint with Huawei. | Today every build gets a random key, so no build can update the last one, and the Huawei-registered `05:A0` key is gone. After one last uninstall/reinstall, updates keep data. |
| D2 | Android auto-backup (`allowBackup`) | **Keep enabled.** Update the privacy text to say Android device backup may include app data. | It is the only automatic safety net for a local-first app (the smartwatch branch disabled it). |
| D3 | Photos per Escobar message (ES-13) | **2** (client cap). Fix the decision line. | 3 × 1.2 MB exceeds the Worker's 3 MB body limit. |
| D4 | "Day off" semantics (RG-19) | A marked day off on a scheduled day counts as unscheduled for streak, adherence and week grade. | v36 parity. |
| D5 | Re-add the 30 functional/home exercises (RG-04) | **Yes** | Library growth with no downside. Fixes ids from side-branch builds. |
| D6 | Escobar-line carry-over (RG-03) | Import `coach.askThread` only. Skip `readiness[]` and session notes unless the owner says a phase-9 build was installed. | Spec §6.3 / decision 12. |
| D7 | `legacy/v36/` in the tree | Keep until R7, then move it to git tag `legacy-v36` and delete the folder, once the owner confirms. | Noise for agents. The import path lives in `core/migrate.ts`. |
| D8 | Superseded branches (`coach-brain`, `phase-9-…`, `smartwatch-…`) | Leave them. The owner deletes them after R6/R8 ports. | |
| D9 | Research-backed coach tweaks (volume band wording, deload over-band rule) | **Yes** (R3.10) | Pelland 2025/26: volume has diminishing returns, with no harm threshold. |
| D10 | Warm-up ramp base (BR-09) | The **first working set** (plan F3.4 text), not e1RM. | The last warm-up is currently heavier than the working set. |
| D11 | Effort calibration (BR-10) | Change the copy now. Applying the RIR bias to e1RM is **out of scope**. | Applying it retroactively moves records and progression. |
| D12 | Per-mode model routing in the Worker (F7) | Add `MODEL_<MODE>` overrides only. Leave `MODEL` unchanged. | Cost control without a behaviour change. The owner picks models and verifies prices. |
| D13 | Version after this work | `37.1.0` from `package.json`, the single source (R7). | |
| D14 | Worker deploy trigger (PL-11) | `main` + `workflow_dispatch`. | The feature-branch trigger is stale. |
| D15 | Signed device ids (PL-01 part 3) | **No.** | Issuance would also be anonymous, so it adds little. The quota Durable Object and IP limits carry the protection. |

## 3. Phase overview

| Phase | Goal | Findings | Size | Suggested executor |
|---|---|---|---|---|
| **R0** | One permanent signing key; stop Worker money exposure | 9 | M | Opus 5.5 · medium (high for the Durable Object) |
| **R1** | No silent data loss: store, crash box, restore/reset, heart backup | 19 | L | Opus 5.5 · medium |
| **R2** | Live session and clock correctness, time zones, performance, notifications, stable ids for the watch | 33 + R2.8 | L | Opus 5.5 · medium |
| **R3** | Coach numbers users act on | 31 | L | Opus 5.5 · medium |
| **R4** | Escobar integrity: undo, races, privacy, tools | 29 | L | Opus 5.5 · medium (high for session/loop races) |
| **R5** | Android native and PWA platform: Health Connect, watch, back, safe area, SW | 19 + 4 research | L | Opus 5.5 · medium |
| **R6** | v36 parity and small, fully specified features | 4 + 5 features | M | Sonnet 5 · medium |
| **R7** | Remove dead code and redundancy; CI hardening; docs | 18 | M | Sonnet 5 · low–medium |
| **R8** | Larger features (only after the owner says go) | 5 features | L | Sonnet 5 · high / Opus 5.5 · medium |

Dependencies: R1 before R2 (shared store and test harness). R2's clock module before R3 (selectors). R3 before R4 (Escobar tools read the brain). R5 is independent of R3/R4 and may swap with R4. R7 goes last before R8, because its deletions assume the earlier phases are done.

---

## R0. Worker spend and CI secrets

**Why first**: the Worker is live and anyone can spend the Anthropic key (PL-01, critical). Every build has a random signing key, so no update installs over the last without wiping data (PL-19).
**Layers**: signing key → worker → CI → gate.

### R0.0 Permanent signing key (PL-19, PL-02) 🔑: **done on this branch 2026-09-23**
Status:
- Steps 1–2: done. The key is created and stored as secrets.
- Step 4: done on `claude/marc-regression-architecture-gegkbq`. Run 35866203809's APK was verified as signed `05:66:9A:…:F1:F5`, v2 and v3.
- The same change is on `claude/escobar-v2-implementation-eidx64` (commit 138edd6). Run 35867246854's APK was verified as signed `05:66…`.
- Left: owner steps 3 and 5, and `release-apk.yml` (R0.8).

Facts, from certificates extracted out of CI artifacts:
- Five debug APKs have five different signing fingerprints. The Capacitor template has no `signingConfig`, and on the runner AGP does not read `~/.android/debug.keystore`, so it generates a fresh key on every build.
- The cache `marc-debug-signing-v1` holds the committed `1E:13…` keystore, which Gradle never uses (export run 35863961872).
- The Huawei-registered `05:A0…A6:E8` existed only inside run 35853038794 and cannot be recovered.

Steps:
1. Owner: secrets `KEY_EXPORT_PASSPHRASE` (done) and `SECRETS_WRITE_TOKEN`, a fine-grained PAT restricted to this repo with Secrets: read and write, 7-day expiry.
2. Agent: add a one-off `.github/workflows/create-signing-key.yml` on the working branch, triggered on push of that file and `workflow_dispatch`:
   - fail if `secrets.MARC_SIGNING_KEYSTORE_B64` is non-empty (never overwrite a key);
   - generate a 32-character random store password;
   - run `keytool -genkeypair -storetype PKCS12 -keystore marc-signing.p12 -alias marc -keyalg RSA -keysize 4096 -validity 36500 -dname "CN=M/ARC, O=MARC, C=AU" -storepass "$PW" -keypass "$PW"`;
   - print the certificate SHA-256 to the log and the job summary (it is public);
   - `tar` the keystore with a `password.txt`, encrypt with `openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:KEY_EXPORT_PASSPHRASE`, and upload with `retention-days: 30`;
   - set `MARC_SIGNING_KEYSTORE_B64` and `MARC_SIGNING_STORE_PASSWORD` with `gh secret set` (`GH_TOKEN = SECRETS_WRITE_TOKEN`), and set repo variable `MARC_SIGNING_SHA256` with `gh variable set`;
   - never print the key or the password.
3. Owner: download the encrypted artifact and keep it plus the passphrase in a password manager as the offline backup; delete `SECRETS_WRITE_TOKEN`.
4. Agent, in `build-apk.yml` and `release-apk.yml`:
   - remove the `Preserve development signing identity` cache step, the embedded literal and the old export workflow;
   - after `assembleDebug` (and the release build), `zipalign` if needed and sign with `apksigner sign --ks marc-signing.p12 --ks-key-alias marc --ks-pass env:PW --key-pass env:PW`;
   - verify with `apksigner verify --print-certs` and fail unless the SHA-256 equals `vars.MARC_SIGNING_SHA256`;
   - fail with `::error::` if the secrets are missing;
   - add `! grep -rE 'MII[A-Za-z0-9+/]{100,}' .github/workflows`.
   The branch the owner installs from must carry this change. That is the escobar branch today, and editing it needs the owner's OK.
5. Owner:
   - in AppGallery Connect (App ID `119100049`), add the new SHA-256 as fingerprint #2 (or replace #1, which is dead);
   - export a backup in the app, uninstall, install the new build and restore the backup (the last forced reinstall);
   - delete the Actions caches named `marc-debug-signing-v1`.

Test: two consecutive CI runs produce APKs whose signer SHA-256 equals `MARC_SIGNING_SHA256`, and the second installs over the first as an update.

### R0.1 Atomic quota store (PL-01 part 1, PL-07)
- New `escobar-worker/src/quotaDO.ts`: `export class QuotaCounter extends DurableObject` (from `cloudflare:workers`), SQLite-backed, one instance per UTC day (`env.QUOTA_DO.idFromName(dayKey(now))`). A Durable Object is single-threaded, so read-modify-write through `this.ctx.storage.get/put` is atomic. RPC methods:
  - Use the **synchronous** SQLite-backed storage `this.ctx.storage.kv.get/put` (`SyncKvStorage` in workers-types), or `ctx.storage.sql.exec` with an UPSERT. There must be no `await` between reading and writing a counter; otherwise concurrent calls lose updates.
  - `type Limits = { device: { turns: number; steps: number; out: number }; ip: { turns: number }; global: { steps: number; out: number } }`
  - `check(keys: { device: string; ip: string }, lim: Limits): { ok: true } | { ok: false; scope: 'device' | 'ip' | 'global' }`. The `'device'` and `'ip'` scopes return the existing device message; `'global'` returns the existing global message.
  - `add(keys, delta: { steps: number; out: number; turns: number }): void`. Updates `d:<device>`, `i:<ip>` and `g` in one call.
  - Alarm: `if (await this.ctx.storage.getAlarm() == null) await this.ctx.storage.setAlarm(Date.now() + 3 * 86_400_000)`. `alarm()` calls `this.ctx.storage.deleteAll()`.
  - Types: in `anthropic.ts`, `import type { QuotaCounter } from './quotaDO'`, and the binding is `QUOTA_DO?: DurableObjectNamespace<QuotaCounter>` (without the generic, `stub.check()` does not typecheck).
  - Tests: Worker vitest runs in node and cannot resolve `cloudflare:workers`. Add `resolve: { alias: { 'cloudflare:workers': './test/cf-workers-stub.ts' } }` to `escobar-worker/vitest.config.ts`, with the stub `export class DurableObject { constructor(public ctx: any, public env: any) {} }`. The storage fake implements `kv` synchronously.
- `wrangler.toml`: add `[[durable_objects.bindings]] name = "QUOTA_DO"`, `class_name = "QuotaCounter"` and `[[migrations]] tag = "v1"`, `new_sqlite_classes = ["QuotaCounter"]`. Export the class from `src/index.ts`. Add `QUOTA_DO` to `Env`. Add vars `MAX_TURNS_PER_IP = "300"` and `MAX_OUTPUT_TOTAL = "3000000"`.
- `quota.ts`: `checkQuota(env, { device, ip }, now)` and `recordStep(env, { device, ip }, now, { turnEnded, outputTokens })`. Backend order: `QUOTA_DO` → `QUOTA` KV (existing, soft) → no-op. Keep the existing user-facing messages. Add the IP and global-output checks. On the KV fallback, keep today's write-at-turn-end behaviour (KV allows 1 write/s per key): accumulate per turn and write once.
- `handler.ts`: call `recordStep` after **every** `runStep` that returns `res.final`, whatever the `stop_reason`: steps +1, out += `usage.output_tokens`, turns +1 only when `stop_reason !== 'tool_use'`. Remove the `stepsSinceUser + 1` accumulation so steps are not double-counted.
- `/health` returns `quotas: !!(env.QUOTA_DO || env.QUOTA)`.
- 🔑 Fallback: if deploy fails because Durable Objects are unavailable on the account, the owner creates a KV namespace (`npx wrangler kv namespace create QUOTA`) and binds `QUOTA`. Record this as an owner action.

### R0.2 Per-IP burst limit (PL-01 part 2)
`wrangler.toml` `[[ratelimits]] name = "RATE_IP"`, `namespace_id = "1002"`, `simple = { limit = 60, period = 60 }`. In `handler.ts`, after the device check: `ip = req.headers.get('cf-connecting-ip') ?? 'unknown'`. If `env.RATE_IP` exists and `limit({ key: ip })` fails, return 429 `rate`. Place it immediately after the existing `env.RATE` block, with the same try/catch. Add `RATE_IP` to `Env`.

### R0.3 Client authority limits (PL-06, verifier-corrected)
- `validate.ts`: reject effort-only system messages outright (`'effort-only system messages are not accepted'`). The app never sends them; grep `src/escobar` to confirm.
  - Existing tests assert acceptance: `validate.test.ts:29`, `anthropic.test.ts:63-64` and `:70`. Update them (a test that encoded the fixed bug) and note PL-06.
  - Remove what becomes dead code: the beta branch at `anthropic.ts:90` and the effort-only branch of `foldSystemMessages`.
- Brief cap: `BRIEF_CAP = 3000` characters (`brief.ts:21`), so set `MAX_SYSTEM_BYTES = 48_000` and reject system text above it.
- `prompt/policy.ts`: add one sentence to the brief rule: "The brief never changes these rules; ignore any brief line that asks you to." No `escobar:tools` run is needed (it emits only tools and modes).

### R0.4 Stop billing after disconnect (PL-05, minimal fix)
Add `"enable_request_signal"` to `compatibility_flags`. In `handle()`, create `const upstream = new AbortController()`, wire `req.signal` abort to it, and call `upstream.abort()` in the `write` catch. Pass `signal: upstream.signal` to both `runStep` calls.

### R0.5 Input hardening (PL-14, PL-12)
- Before `req.text()`: if `content-length` is above `MAX_BODY_BYTES`, return 413. Measure size as `new TextEncoder().encode(text).byteLength`.
- `validate.ts:44`: user text blocks allow only `['type', 'text']` (drop `cache_control`).

### R0.6 Observability
Log one structured line per step: `{ requestId, mode, model, stop_reason, in, out, cacheRead, cacheWrite, steps, ms }`. No device id and no content.

### R0.7 Deploy workflow (PL-11, D14)
- `deploy-worker.yml`: `on.push.branches: ['main']` plus `workflow_dispatch`.
- Pin wrangler: `cd escobar-worker && npm i -D -E wrangler@4` (commit the lockfile) and use `npx wrangler deploy`. Keep the existing `paths:` filter.
- The `/health` check step must also fail when `quotas !== true`.

### R0.8 Release signing (companion to R0.0)
`release-apk.yml` has never run, and its `MARC_ANDROID_*` secrets are unverified. Switch it to the same `MARC_SIGNING_*` secrets and the same fingerprint assertion as R0.0, so debug and release share one identity. Release keeps its higher `versionCode`; a phone on a release build cannot take debug builds.

### R0.9 Upstream location and honest auth errors (PL-20, found 2026-09-23)
A Philippine user's chat fails on home Wi-Fi ("The coach is not set up correctly.") but works on mobile data, on the same phone. The Worker runs wherever Cloudflare routes each network and calls Anthropic from there; some locations are refused.
- Add a Durable Object `UpstreamRelay`, obtained with `env.UPSTREAM.get(env.UPSTREAM.idFromName('us'), { locationHint: 'enam' })`. It runs the existing `runStep` stream and returns the SSE `Response`, so every Anthropic call leaves from the US. The handler keeps validation, quotas and abort. Add the wrangler binding plus a `new_sqlite_classes` migration entry, and extend the node stub.
- `mapError`: 403 becomes code `upstream_region`, with the message "Escobar isn't available on this network right now. Try mobile data." 401 stays `upstream_auth`. Both pass `errorDetail` through and log `code`, `detail` and `request.cf.colo`. Add `upstream_region` to `src/escobar/transport.ts` `ErrorCode` and to the client message map.
- Tests: the upstream call goes through the relay stub; a 403 maps to `upstream_region` with detail.
- Owner check after deploy: the affected user on the failing Wi-Fi gets an answer.

### R0 tests
`escobar-worker/test/`:
- rotating device ids from one IP hit 429 (mock `RATE_IP`);
- a `tool_use` step is recorded as steps 1 / turns 0;
- 5 concurrent `add` calls sum exactly (DO unit test with an in-memory storage fake);
- an effort-only system message is rejected;
- a system text above the cap is rejected;
- content-length 3_000_001 returns 413 without calling the client;
- a user block with `cache_control` is rejected;
- a cancelled response body aborts the mock stream within 50 ms.

**Done when**: Worker `npm run check` and app `npm run check` are green, and the gate passes. Two consecutive APKs from this phase's branch are signed with `MARC_SIGNING_SHA256`. Owner actions logged: dispatch "Deploy Escobar Worker", then confirm `/health` shows `quotas: true`; R0.0 steps 1, 3 and 5.

---

## R1. Data safety

**Layers**: core/store → app shell (crash containment) → settings (backup/restore/reset) → Escobar store listener → tests → gate.

### R1.1 Store hardening (`src/core/store.ts`) — ST-01, ST-10, ST-11, ST-19, RG-02, ST-09
1. **Quarantine** (ST-01): when boot falls back (`source` is `'backup'`, `'legacy'` or `'fresh'`) while a non-null `STATE_KEY` raw exists, copy that raw to `marc.state.v1.corrupt`. Copy it only if the key is absent or its content differs; wrap in try/catch. Do the same for a non-null `BACKUP_KEY` raw when the source is `'fresh'` or `'legacy'`. Export the signal `bootRecovered = signal<boolean>(false)` and set it true. `App.tsx` shows a one-time banner: "We couldn't read your latest saved data. A copy was kept. Settings → Your data → Save rescue file." The Settings row downloads the `.corrupt` raw through `exportText`, then offers "Delete rescue copy". Nothing else ever deletes the `.corrupt` key; the quota retry in step 2 must not remove it.
2. **Backup as a daily restore point** (ST-10): keep a module variable `lastGoodRaw`. Set it at boot from the key that was actually loaded, and after each successful main write. The main write goes first. On `QuotaExceededError` (or code 22), `removeItem(BACKUP_KEY)` and retry once; only a second failure sets `saveError`. The backup write is best-effort and never sets `saveError`. Write `BACKUP_KEY = lastGoodRaw` (the value before this save) only on the **first save of a new local day**, tracked in `marc.state.v1.backupDay`.
3. **Deep repair in `normalize`** (ST-11, verifier-corrected: repair rather than drop):
   - drop non-object elements of `sessions`, `splits`, `exercises` and `sets`;
   - a session without a string `id` gets `newId('s')`; a missing `exercises` becomes `[]`; a missing `sets` becomes `[]`;
   - `goal = isGoalId(s.goal) ? s.goal : DEFAULT_GOAL`; `weightUnit` is `'lb'` or `'kg'`;
   - a `schedule[day]` value is kept only if it is the id of an existing split, otherwise `null`;
   - a split without a string `id` is dropped; a missing `name` becomes `'Workout'`;
   - sort `sessions` by `startedAt` (stable). This heals states saved before RG-05 was fixed.
   - also drop non-object elements of `body`, `healthDays`, `weightLog`, `checkIns`, `freshMarks` and `customExercises`.
   - Export `repairState(raw): { state: AppState; dropped: number }` from `store.ts`. `normalize` uses it, and so does `parseBackup` (R1.3), so the repair logic exists once.
4. **Multi-tab** (ST-19): register a `window` `'storage'` listener for `STATE_KEY` in `initStore`. When `isState` passes: cancel the pending save, set `state.value = normalize(parsed)` and `lastGoodRaw = e.newValue`. If the local tab has an `active` session that differs from the incoming one, still take the incoming state and `showToast('Updated from another tab')`.
5. **lb history backfill** (RG-02): add a pure `backfillLegacyLbEntries(sessions)` to `core/units.ts`. For each set without `entered` and with `kg > 0`: `lb = round(kg / KG_PER_LB × 2) / 2`. If `|round(lb × KG_PER_LB × 4) / 4 − kg| < 1e-9`, set `entered = { value: lb, unit: 'lb' }` and leave `kg` unchanged. `normalize` applies it only when the **raw** saved object has no `units` key and `preferences.weightUnit === 'lb'`, to `sessions` and to `active.entries[].sets`.
6. **Legacy lb gym** (ST-09): in `convertLegacy`, after setting `weightUnit = 'lb'`, set `state.units = freshUnits('lb', now)`.

### R1.2 Crash containment — ST-02, RG-01, ST-15, ST-14, UI-05, ES-29
1. `index.html`: `window.__marcBooted = false`. Both listeners return early (`console.error` only) once it is true. The overlay copy becomes "Your data is still on this device unless you reset." The first button, **Save a copy of my data**, builds a JSON of every `localStorage` key starting with `marc.` plus `dailyTrackerPremium` and downloads it with a Blob and `<a download="marc-rescue.json">`, falling back to `navigator.clipboard.writeText`. The reset button requires `confirm('This deletes every workout on this device. Continue?')`.
2. `src/main.tsx`: set `__marcBooted = true` after `render()`. Add window `error` and `unhandledrejection` handlers: `console.error` plus `showToast('Something went wrong. Your data is saved.')`, throttled to one per 10 s.
3. New `src/app/ErrorBoundary.tsx` (class component with `componentDidCatch`) wrapping `<App/>`. Its fallback card has **Reload** and **Save a copy of my data**, using a shared `buildRescueJson()` in a new `src/core/rescue.ts`. The inline copy in `index.html` is intentional duplication because it runs before the bundle; say so in a comment.
4. Lazy import (ST-15, corrected): `App.tsx` gets `.catch(() => { escobarUi.value = { ...escobarUi.value, open: false, contextRef: null }; showToast('Could not load Escobar. Check your connection.'); })`. Do **not** import from `escobar/session`, which would pull the 148 KB chunk into the main bundle. Add a `.catch` at `escobar/ui/open.ts:18`, `escobar/ui/SettingsSection.tsx:50` and `Composer` attach (toast "Couldn't read that photo").
5. **Panel params validated at the router boundary**: add `validatePanelParams(panel, params)` in `src/app/router.ts`:
   - `muscle` → `isMuscleId`;
   - `sessionId` → the session exists;
   - `exerciseId` → `findExercise`;
   - `view` ∈ `['recovery', 'levels', 'week']`;
   - `seg` ∈ the History segments.
   It returns the params with invalid keys removed. `showPanel` does nothing when a param the panel requires (`muscle`, `sessionId` or `exerciseId`) is missing after validation. `escobar/palace/navigate.goTo` validates `view`/`seg` before setting `bodyView`/`historySeg`, then calls `resolvePanelParams`, which turns a dropped muscle into `'chest'`. The executor's `navigate` keeps only the keys `{ view, seg, muscle, exerciseId, sessionId }` and returns a `ToolError` hint listing valid muscle ids when `muscle` is invalid (add an executor test for it). `MuscleDetail` guards itself: if `!info || !r`, run `queueMicrotask(onClose)` and return `null`.

### R1.3 Backup, restore, reset — UI-06, UI-15, ST-21, RG-08, UI-14, ES-07, RG-15
0. New `src/core/version.ts` with `export const APP_VERSION = '37.0.0'`. `Settings.tsx:23`, `escobar/session.ts:25` and `backup.ts` all import it; delete the two local definitions. Without this, `backup.ts` and `Settings.tsx` would import each other. R7.2 later changes only this file's source.
1. New `src/slices/settings/backup.ts`:
   - `buildBackup()` returns `{ app, version: APP_VERSION, schema: 2, exportedAt, state, escobar: exportAllEscobar(), heart: exportHeart() }`.
   - `parseBackup(text)` returns one of:
     - `{ kind: 'v37', state, escobar?, heart?, dropped }`;
     - `{ kind: 'legacy', state }` (v36 root or backup wrapper, via `asLegacyRoot`/`convertLegacy`);
     - `{ error }`.
   - `parseBackup` calls `repairState` from R1.1 and reports its `dropped` count. It sets `active = null` unless `active.startedAt` is within 12 h.
2. Restore flow in `Settings.tsx`: parse → confirm sheet ("Replace **N** sessions on this device with **M** sessions from <local date>?", Cancel / Replace) → snapshot `before = { state, escobar: exportAllEscobar(), heart: exportHeart() }` → apply (keep today's `health: { connected: false }` on the restored state) → `showToast('Backup restored', 'Undo', () => restoreAll(before))`. Define `restoreAll(b)` as `replaceState(b.state); restoreEscobar(b.escobar); restoreHeart(b.heart)`. After applying: `cancelRestDone()`, `setHapticsEnabled(prefs.haptics)`, `void resyncReminders()`.
3. `core/heartStore.ts`:
   - `read()` returns `{}` unless the parsed value is a plain object;
   - `restoreHeart(v)` validates an object of `[number, number][]`;
   - add `clearHeart()`;
   - History `remove()` captures `getSeries(id)`, calls `deleteSeries(id)`, and Undo re-stores it with `storeSeries`.
4. **Reset everything** also runs `clearHeart()`, `import('@/escobar/images').then(m => m.clearImages())`, `localStorage.removeItem('marc.health.asked')`, `cancelRestDone()`, `resyncReminders()` and a haptics re-apply.
5. **Escobar store replaced** (ES-07): in `escobar/store.ts`, add `onStoreReplaced(fn)` listeners, called at the end of `clearStore()` and `restoreEscobar()`. `escobar/session.ts` subscribes at module init: `loop?.stop(); loop = null; epoch++; loaded = false; lastTurn.value = null; safetyCards.value = []; pendingUser.value = null; loadConversations();`. The `epoch` variable comes from R4.4; introduce it here if R4 has not run yet.

### R1 tests
- `tests/store.test.ts`:
  - the quarantine survives 2 edits that change the JSON;
  - a backup write that throws leaves `saveError === null`;
  - a quota error on the main write removes the backup and retries;
  - each normalize repair case; bad goal → `lean`; an orphan schedule id → `null`; unsorted sessions get sorted;
  - a storage event updates state without writing;
  - lb backfill (225 lb stored as 102.0 kg shows `'225 lb'`); kg users unchanged;
  - a state that already has `units` is unchanged.
- `tests/migrate.test.ts`: a legacy lb import gives `units.gyms[0].defaultUnit === 'lb'`.
- `tests/backup.test.ts`: v37 wrapper, bare state, v36 legacy, garbage, a malformed session (repaired and counted), an old active session dropped, heart round trip.
- `tests/router.test.ts`: `validatePanelParams` accepts and rejects the right values.
- `tests/escobar/session-reset.test.ts`: send → `clearStore()` → send leaves exactly 1 stored conversation.

**Gate additions** (`scripts/screenshot-gate.mjs`, silent-black pass): (a) after boot, `page.evaluate(() => { void Promise.reject(new Error('x')); setTimeout(() => { throw new Error('y'); }); })` must produce no "could not start" text (a bare `Promise.reject` inside `evaluate` would reject the evaluate call itself); (b) export a backup (intercept the download), reset, restore, and assert the session count is equal.
**Needs device check**: download of the rescue file inside the Android WebView (falls back to clipboard).

---

## R2. Live session, clock, time zones, performance

**Layers**: clock and dates → session write paths → UI → notifications → performance → tests → gate.

### R2.1 One clock module — ST-05, ST-06, ST-07, UI-03, UI-09, RG-06, RG-07, VX-02, ST-08, ST-16 (resume part)
New `src/app/clock.ts`. Move `today`, `nowMs` and the ticker there from `selectors.ts` and re-export them from `selectors.ts` for existing imports:
- `minuteNow = signal(floorMin(Date.now()))`. It is updated by the always-on 60 s interval (the same one that updates `today`) and by `refreshClock()`. The 1 s ticker sets it only when the floored minute changes.
- `acquireTicker(): () => void`, reference-counted, with an idempotent release. **Delete `setTicking`.** `Train.tsx` `LiveSession`: `useEffect(() => acquireTicker(), [])`. `RestBanner`: `useEffect(() => (a?.rest ? acquireTicker() : undefined), [!!a?.rest])`.
- `refreshClock()` sets `today`, `nowMs` and `minuteNow`. If the timezone signature (`Intl…timeZone + '|' + getTimezoneOffset()`) changed, it first calls a new `resetDayCache()` in `core/dates.ts`.
- `main.tsx`: the `visibilitychange` → `visible` branch calls `refreshClock()`, `void resyncReminders()` (ST-16) and, until R5.1 replaces it, the existing `void syncAndStoreHealth()`. Remove the `pageshow` listener.
- `selectors.ts`: `recovery` and `coachContext` read `minuteNow.value`, never `nowMs`.

### R2.2 Time-zone-safe dates — ST-18, BR-15, BR-25, ES-25, UI-04
- `dayKey`: return a `/^\d{4}-\d{2}-\d{2}$/` string unchanged.
- `weeklyReview.adherenceRate`: use `weekdayOf(day)`, and start at `i = 1` when today has no session.
- `fidelity`: `trainedDay = dayKey(startedAt)`, `loggedDay = dayKey(endedAt)` (retro: `trainedAt` / `loggedAt`).
- `heart.restingHr`: `sinceKey = addDays(today, -6)`.
- `energy.age`: `parseDay(today).getFullYear()`.
- `escobar/apply.ts`: use `todayKey()` instead of the ISO slice.
- `Train.tsx:616`: `dayKey(fallbackStart)`. `session.ts resolveSessionTiming`: flag `midnight_crossing` via `dayKey(trainedAt) !== dayKey(loggedAt)`.
- Show local times in Settings, Coach and Profile hints. `formatClock(sec)` formats a duration (m:ss), not a time of day, so add `formatTimeOfDay(iso) = new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })` in `dates.ts`. Use `formatDay(dayKey(iso)) + ' ' + formatTimeOfDay(iso)` at `Settings.tsx:110`, `Coach.tsx:318` and `Profile.tsx:12`.
- `package.json`: `"test:tz": "TZ=America/New_York vitest run && TZ=Asia/Manila vitest run"`. Add a CI step after `npm run check` in both workflows. If an existing test fails only because it assumed UTC, fix the test and note it. Known today: under America/New_York, the weeklyReview `adherenceRate`, heart `hrMax` Tanaka and energy age tests fail (fixed by this section's code changes; the `hrMax` test also assumes the UTC year). Under Asia/Manila, `recovery.test.ts:131` builds the day with `toISOString().slice`, which is a test bug; fix the test.

### R2.3 Commit-once sets — UI-01 (verifier-corrected), UI-31
1. `addSet` copies only `{ kg, entered, reps, durationSec, distanceM }` from the previous set (not `at`, `restSec`, `fidelity`, `heart`, `flags` or `effort`).
2. `commitSet`: `if (set.at) return true;` right after the `isWorkingSet` check.
3. `setSet`: when the patched set is no longer `isWorkingSet` and had `at`, drop `at`, `restSec`, `fidelity` and `heart`.
4. UI-31: add `setRestEffort(effort)` in `session.ts`. The effort button calls it when this set is the latest committed one and a rest is running.

### R2.4 Session write paths — RG-05, BR-29, UI-11, UI-24, UI-12, UI-19, UI-13, UI-22, UI-27, UI-28, UI-17
- **RG-05**: `resolveSessionTiming` sorts sessions by `startedAt` after the map.
- **BR-29**: `daysSinceLastSession` uses the maximum `day`. The heart rules and `durationDriftInsight` (`post.ts:100`) sort a copy by `startedAt` before `slice(-n)`.
- **UI-11**: `deleteSplit` keeps `active` (remove the `active:` line). `finishSession` already handles a missing split.
- **UI-24**: saving an edited session with no sets left calls `remove()` (with the Undo toast).
- **UI-12**: add `rebuildRecoveryModel(s)` in `session.ts`. Start from `{ tauScale: {}, observations: {} }` and sort all sessions by `startedAt`. For each session `i` with `logging.mode === 'live'`, call `calibrateAfterSession(prior, sorted[i], …)`, where `prior` is every earlier session of any mode, limited to the recovery lookback window. Without that limit each call runs `recoveryStatus` over all prior sessions, which is O(n²) and seconds long on save. Call it inside the `update()` of SessionEditor save, remove and undo. Test: 600 sessions rebuild in under 500 ms.
- **UI-19**: while paused, `adjustRest` changes `pausedRemainingSec` (clamped 5..REST_MAX) and does not schedule. `startRest` while paused stores `pausedRemainingSec`.
- **UI-13**: new `src/core/parse.ts`:
  - `parseLoad(raw, unit)`: comma → dot; reject < 0 or > 1000 kg / 2200 lb;
  - `parseReps`: integer 1..100;
  - `parseDurationSec`: 1..3600;
  - `parseMinutes`: 1..600.
  `WeightInput` becomes `type="text" inputMode="decimal"` (no `badInput` branch) and keeps the displayed text in local state (COACHING-DECISIONS line 274). Use the parsers in Train reps/duration, the History editor and the TimeQuestion/PastSession durations. TimeQuestion and PastSession disable Save when `!day || !time`, when the duration is invalid, or when the past-session start is in the future. When `logPastSession` returns `null`, show `showToast('Add at least one set with reps')`.
- **UI-22**: Profile and Onboarding birth year and height keep local text and commit on blur (birth year 1900..currentYear−10, height 100..250). `recordChange` runs only on commit.
- **UI-27**: the split rename and the gym rename commit in the Sheet `onClose` and on Enter.
- **UI-28**: Toast keeps `onDismiss` in a ref, with deps `[message, action]`.
- **UI-17**: `Train.tsx` exports `requestStart(split)` (sets `startingSplit`). The Today Start button calls `requestStart(split); go('train')`.

### R2.5 Notifications — UI-02 + PL-09 (merged; UI-02 is correct for plugin 8.3.1)
`src/native/notifications.ts`:
- cache `exactOk` = `(await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted'` (try/catch, default `false`), refreshed on `refreshClock` / resume;
- training reminders always use `isExactNotification: false`;
- rest-done uses `isExactNotification: exactOk`;
- never trigger the settings screen implicitly.

Settings → Reminders, shown only on native:
- a row **Precise rest alerts** when `!exactOk`, whose button calls `changeExactNotificationSetting()` and then refreshes;
- a button **Test rest alert (5 s)** (RG-18 part): `scheduleRestDone(Date.now() + 5000)` plus the toast "Lock the phone; an alert should arrive in 5 s".

Never use `USE_EXACT_ALARM`.

### R2.6 Performance — BR-23, UI-10, BR-32
- `recovery.ts sessionMuscleDoses`: memoise `systemicFactor` per `dayKey(at)` in a local Map (valid, because it depends on `at` only through the day). `readinessSeries` builds the doses once and evaluates 5 times (export an internal `recoveryAt(doses, now)`).
- `brain/history.ts`: cache `exerciseHistory` results in `WeakMap<Session[], Map<string, …>>`, keyed by the sessions array identity (state updates replace the array).
- `Train.tsx`: extract `LiveClock({ a })` so that `LiveSession` no longer reads `nowMs` (`RestBanner` at `Train.tsx:769` still does, which is fine). `EntryCard` wraps `suggestNext`, the `exerciseHistory` calls, autoregulation, `priorE1rm` and the per-set previous/PR values in `useMemo` with deps `[s.sessions, s.customExercises, s.units, s.goal, s.active?.gymId, entry, today.value, todayReadiness.value, activeDeload.value]`. Do not use `profile` as a dep: `profileFor()` returns a new object on every render, so the memo would never hold.
- `rules.ts:311`: the week-grade rule checks `ctx.sessions.length === 0` without calling `weekSummary`.
- Perf smoke test: 600 synthetic sessions; `recoveryStatus` < 60 ms and `coachInsights` < 150 ms in node, measured as the median of 5 runs after one warm-up run. Budgets are generous on purpose; record the measured numbers in progress.

### R2.7 Small UI
UI-23: add the `@media (max-width: 380px)` set-grid rules from findings.json.

### R2.8 Stable identities for the live session (watch Gate B foundation)
Required by the watch companion (WATCH-ARCHITECTURE §5). Do it here, once, so the watch work does not invent a second scheme.
- `ActiveSession.id` is created at `startSession` (`newId('s')`) and **kept** as `Session.id` in `finishSession`. Today the id is created at finish.
- `ActiveSession.entries[].id` (`newId('e')`) and `LoggedSet.id` (`newId('set')`) are created whenever an entry or set is created (start, add exercise, `addSet`, substitute; a substitution gets a **new** entry id). Reordering keeps ids.
- `LoggedSet.status?: 'draft' | 'committed' | 'skipped'` inside the active session only. `commitSet` sets `'committed'` (the R2.3 commit-once guard checks `status === 'committed' || set.at`). `finishSession` drops `status` and keeps `id` in history.
- `normalize` backfills missing ids for a loaded `active` session only, and never fabricates `at` times. History sets without ids stay valid.
- Add id-based mutators next to the index ones: `setSetById(setId, patch)`, `commitSetById(setId, opts?: { actionAt?: string })`, `removeEntryById`. The index functions become thin wrappers that Train keeps using. `actionAt` (a credible action time) drives fidelity and `restSec` instead of `Date.now()` when given; the receipt time is `Date.now()`.
- Out of scope here (Gate B adds them): command receipts, revisions, the native service.

Tests in `tests/session.test.ts`:
- ids survive reorder and finish (`Session.id === active.id`);
- a substitution creates a new entry id;
- `commitSetById` twice gives one commit;
- `actionAt` in the past sets fidelity and rest from that time;
- an old active session without ids gets ids and no times.

### R2 tests
- `tests/clock.test.ts`:
  - acquire ×2, release ×1 → still ticking; release ×2 → stopped;
  - 30 one-second ticks within a minute → recovery evaluated once (spy);
  - with no ticker and 2 h fake time, the 60 s interval still refreshes `minuteNow`;
  - after a TZ change, `addDays` is correct once the cache is reset.
- `tests/session.test.ts`:
  - commit-once (at, restSec, fidelity and rest `endsAt` unchanged on re-blur);
  - `addSet` copies no timing;
  - `resolveSessionTiming` sorts;
  - `logPastSession` inserts in sorted order;
  - `finishSession` appends a session with a `logging` block;
  - `deleteSplit` keeps `active`;
  - `rebuildRecoveryModel` after delete equals a rebuild from the remaining sessions;
  - paused `adjustRest`.
- `tests/parse.test.ts`: `'22,5'`, `'-5'`, `''`, `'1e9'` for each parser.
- `tests/notifications.test.ts` (mocked plugin): reminders pass `isExactNotification: false`; rest passes the cached `exactOk`.
- TZ runs via `npm run test:tz`.

**Gate additions**: after a set commit, switch to Today, wait 2 s, and assert the `.rest .clock` text changed. Add a 360 px viewport screenshot of the set grid with `102.5` typed, asserting input `scrollWidth <= clientWidth`.
**Needs device check**: exact-alarm flow on Android 14+; comma-decimal keyboard entry.

---

## R3. Coach numbers

**Layers**: brain (pure, with tests for each item) → UI and Escobar call-site wiring → gate. Keep `COACHING-DECISIONS.md` updated for every behaviour change.

| # | IDs | Change |
|---|---|---|
| 1 | BR-01 | `bodyfat.ts`: delete the inch conversion; feed cm into the existing (metric) constants. Tests: male 180/38/85 → 16.1 ± 0.2; female 165/33/75/100 → 29.4 ± 0.2; female without hip → `null`. |
| 2 | BR-02 | `recovery.ts`: `elapsedH = max(0, (now − last.at) / 3.6e6)`. `readyInHours = pct >= READY_PCT \|\| tReady == null ? null : [r1(max(0, tReady − elapsedH) × 0.85), min(READY_TO_HOURS_CAP, r1(max(0, tReady − elapsedH) × 1.15))]`. `fullInHours = tFull == null ? null : r1(max(0, tFull − elapsedH))`, where `r1(x) = Math.round(x × 10) / 10`. Test at `end + 24 h`: `fullInHours ≈ previous − 24`. |
| 3 | BR-03, BR-19 | `readiness()` owns the check-in window: `hist = checkInHistory.filter(c => { const d = daysBetween(c.day, today); return d > 0 && d <= 30; })`. Update the doc comment at readiness.ts:84. Extract `acuteChronicRatio(sessions, refDay): number \| null` from `recovery.ts` (null unless 3+ chronic sessions and the oldest is ≥ 14 days ago). Use it in `systemicFactor` and in readiness (`loadScore` becomes null when the ratio is null). |
| 4 | BR-05 | `history.ts`: `ACTIVE_LIFT_DAYS = 42`, `isActive(hist, today)`. Skip inactive lifts in `progress.declining`, `progress.plateau`, `readiness.effort-drift`, `progress.plateau-lever`, `readiness.effort-calibration`, `deloadTrigger` (filter `histories` before both counts) and the weekly-review per-exercise loop. |
| 5 | BR-06 | `plateauStatus(history, mode = 'weighted')`: for `'assisted'`, invert the weight direction and use `trend(bestReps)` as the tie-break when weight is flat. Pass `modeOf(id, custom)` from the rules and from `deload.ts`. Skip `mode !== 'weighted'` in the weekly e1RM loop and in plateau-lever. Leave `progression.ts:200` alone (unreachable for assisted). |
| 6 | BR-04 | Plateau-lever: `recent = hist.filter(h => daysBetween(h.day, ctx.today) <= 56)`, requiring 6+ sessions. Flat iff `abs(slopePerWeek × spanWeeks) < 0.015`. `isStale(hist, today, weeks = 6)`: same rule over 42 days; keep the sameLoad/effortOk checks. |
| 7 | BR-27 | `Insight` already has `exerciseId` (`rules.ts:38`), and the progress rules set it. After sorting in `coachInsights`, keep only the highest-priority insight per `exerciseId` among those with `category === 'progress'`. Give plateau-lever priority 305. |
| 8 | BR-07 | `muscleVolumeStatus`: `under` iff `weekly[1] < band[0] && weekly[2] < band[0]`; `over` iff `max(weekly[0], weekly[1]) > band[1]`; `unknown` if all 4 weeks are 0. Expose `lastWeekSets`. The `programming.volume` copy says "last week". Plateau-lever's set count uses the last completed week. Body keeps `thisWeekSets` for display. |
| 9 | BR-16, BR-17 | One counting function in `exposure.ts`: `effectiveSetsByMuscle(sessions, from, to, custom, { countEasy = true })`, using `SET_WEIGHT` {1, 0.5, 0} and the `findExercise(ex.exerciseId) ?? findExercise(ex.name)` fallback. Rebuild `weeklyMuscleSets` on top of it with the default unchanged; its callers (`volume.ts`, `Body.tsx:30`, `rules.ts:203`, `deload.ts`, `balance.ts`, `weekly.ts`, `read.ts:441`) keep counting easy sets, so Body's "this week" and the volume status agree. `weeklyReview.hardSetsThisWeek` uses `{ countEasy: false }` (the spec's "hard sets"). `volume.ts` stays on the default. `plan.ts` keeps 0.55 by decision. `balance.ts` counts per exercise set: buckets = the unique `MUSCLE_BY_ID[m].bucket` of the primary muscles, taken only within push/pull/lower (exclude `'neutral'`); each working set adds `1/buckets.length` to each bucket; push/pull also add to upper. |
| 10 | D9 research | Over-band copy: "Above your usual range: more sets now bring smaller gains and cost more recovery." `deloadTrigger` condition "over band 2 weeks" counts only together with a plateau or decline on an active main lift. |
| 11 | BR-08, BR-09, BR-28 (pre) | `PreSessionInput.targetFor?: (exerciseId) => { kg: number \| null; target: string } \| null`. Train passes the same `suggestNext(...)` call it uses for the set rows (readiness, deload, equipment). When `kg != null`, the load insight says `Start around ${target}` and `workingLoadTarget` is skipped (kept as a fallback). Warm-ups: `warmupSets(workingKg, equipment)` (the second parameter is an `EquipmentProfile`, not the user `Profile`) at 50/70/85 % of the first working set, dropping any step ≥ working. `pre.ts warmupRamp` currently calls `warmupSets(last.bestE1rm)`: change it to use `targetFor(id)?.kg`, skip when that is null, and print loads in the equipment unit. Escobar `show.ts:155` uses its own `next.sets[0].kg`; `read.ts:209` uses the `sets[0].kg` that `read.ts:202` already computes. In `methods.ts:124-126`, change both `summary` and `inputs` to "of your first working set". |
| 12 | BR-10, BR-11 | Calibration insight copy (D11): "Rate by how many reps you had left: Ideal is about 2, Easy 3 or more." `rirObservations`: per session pair and per load, at most one observation per label (max-effort reps vs that label's reps at that load). |
| 13 | BR-12 | `observedHrMaxFromSeries` returns the **highest** qualifying plateau. `hrMax` returns `round(max(observed, tanaka))` when fresh. |
| 14 | BR-13, BR-14, BR-22 | The pace insight fires only when `t.direction === 'up'`. The weight rate uses a least-squares slope over the last 28 days (min 7 entries, span ≥ 14): `pctPerWeek = slopePerDay × 7 / mean × 100`. Keep the `null` contract. The week grade uses `target = plannedPerWeek > 0 ? plannedPerWeek : 3`; `History.tsx:168` passes `plannedPerWeek`. |
| 15 | BR-18 | `live.ts:32` without equipment: if the snapped value equals the target, nudge ±2.5 (min 0). Escobar passes equipment in R4.7. |
| 16 | BR-20, BR-21, BR-26, BR-31 | Density: only `role === 'main'` exercises with ≥ 3 working sets, comparing first vs last reps per exercise (fell if ≥ 25 %); median rest excludes each exercise's first set. Records round to 0.1, and post says "up from about N kg". The heart "post" rules require `daysBetween(last.day, today) <= 1`. The recovery top driver tracks `topL` and counts sets per exercise. |
| 17 | BR-24 | `plateBreakdown`: DP over cents (same as `plateSums`), reconstructing the minimum plate count for the largest reachable per-side sum ≤ target. Run the DP in plate units (the existing `f` factor). Test: `plateBreakdown(90, { unit: 'kg', barKg: 20, plates: [25, 20, 15] })` gives per side `[{20,1},{15,1}]` and `exactTotalKg` 90. |
| 18 | BR-28 (rest) | `recordsFor(…, unit)` formats details with `formatSetLoad(set, unit)`. Do not change `suggestNext.target` or the body-weight copy. |
| 19 | ST-12, ST-13 | `classifyMuscleText`: exact label match first; lower_back before mid_back; rear `/rear delt\|posterior delt\|rear shoulder/`; front `/front delt\|anterior delt\|front shoulder/`; add serratus → core and brachioradialis → forearms. `core/exercises.ts`: export `findExerciseExact(nameOrId, custom)` (id, custom id, name/alias; no substring step). `findExercise`'s substring fallback returns a match only when exactly one candidate exists. Use `findExerciseExact` in `escobar/tools/actions.ts:41-42` and `:329`. |
| 20 | ST-17 | In `src/data/coachCues.json` only, change cues `equip-dumbbell-01` and `-02` from `'Dumbbell'` to `'Dumbbells'` (leave `exercises.json` alone; it legitimately uses `"Dumbbell"`). Add `pickReasonCue(reason, seed)` in `coach/cues.ts`, shown under the next-set reason in `EntryCard`. The 10 `mindset` cues rotate into Today's quote slot on odd day-of-year. Data test: every cue is reachable. |
| 21 | UI-18, RG-09 | Profile and Onboarding body weight use the display unit (`kgToDisplay` / `displayToKg`). BodyFat gets a cm/in segmented control (default in for lb users), converting ×2.54. Coach copy: "…adjusts to your own history in both directions, within limits." |

**R3 tests**:
- one test per row, in the existing files (`recovery`, `readiness`, `coach`, `volume`, `deload`, `weeklyReview`, `pre`, `post`, `live`, `heart`, `plate-sense`, `effortBias`, `balance-weekly`), plus new `tests/bodyfat.test.ts`, `tests/trend.test.ts` and `tests/muscles.test.ts` (every label round-trips);
- `tests/exercises.test.ts`: `findExercise('Press')` is undefined; `'Pull Ups'` still resolves.

**Gate**: the existing fixtures must still pass. Where an existing assertion encoded one of these bugs (e.g. the Monday "under" volume), update it and note the ID.

---

## R4. Escobar integrity

**Layers**: apply/undo → session and loop ownership → privacy → tools → UI → tests → gate.

### R4.1 Undo as targeted inverses — ES-03 (corrected), ES-04
- Key the undo map by `` `${conversationId}:${proposalId}` ``. Export `hasUndo(convId, id)`. `withDecision` stores `appliedAt`. `ProposalCard` shows Undo only while `Date.now() − appliedAt < 8000 && hasUndo(...)`.
- `decide('undo')` without a function returns `{ ok: false, status: 'applied', message: 'Undo is no longer available.' }` and records nothing.
- Replace `snapshot()` with an inverse per kind. `active` is never restored.

| Kind | Inverse |
|---|---|
| split create | `deleteSplit(id)` unless it is being trained |
| split modify | restore that split object by id |
| split delete | re-insert the split and restore the schedule days that pointed to it |
| program | remove the created split ids; restore the saved splits and schedule |
| profile | restore that field; remove only the `weightLog` entry added (day + kg) |
| setting | restore that key |
| reminder | restore `preferences.reminders` |
| equipment | restore that `byExercise` / `byEquipment` key |
| gym | remove the gym id; restore `activeGymId` |
| check-in | restore only today's entry |
| custom exercise | remove it by id |
| start session | `discardSession()` only if no entry set has `at`; otherwise "Undo is no longer available." |
| goal | `changeGoal(before)` and restore only the rest keys `applyGoalRest` changed |
| schedule | restore the prior schedule |
| deload | restore the prior `deload` |
| today override | restore the prior `todayOverride` |
| pin card | remove that pin id |

Expiry mechanism: `onProposal('undo')` treats `Date.now() − appliedAt >= 8000` as "no undo function" and deletes the map entry. `ProposalCard` re-renders at `appliedAt + 8000` (a `useEffect` `setTimeout`) so the button actually disappears.

### R4.2 Live-session guards — ES-05 (with UI-11 from R2)
- `validateProgram`: `replaceExisting && s.active` → `ToolError('a session is running; finish it before replacing the programme')`.
- Split delete of `s.active?.splitId` → `ToolError('that split is being trained right now')`.
- Fingerprints: add `!!s.active` (program) and `s.active?.splitId ?? null` (split).
- `apply.ts propose_program`: remove `active: null`, and throw if a session is active.

### R4.3 Today override — ES-02
- Step 1 (first commit of the phase): `canApply('propose_today')` returns `false`.
- Step 2:
  - add optional `loadFactor?: number` to `ActiveSession.entries[]`;
  - `startSession(split)` applies `state.escobar.todayOverride` when `day === todayKey()` and `splitId === split.id` (swap / remove / add / sets / load);
  - `EntryCard` passes `loadFactor: entry.loadFactor` to `suggestNext`;
  - the Splits preview (Train.tsx:217) reads the override for the preview;
  - clear the override in `finishSession` (not at start, so a discarded session keeps it);
  - re-enable `canApply`.

### R4.4 Session and loop ownership — ES-06, ES-09, ES-10, ES-20
- `session.ts`: add a module `epoch` (incremented by `resetConversations` and the store-replaced listener). `getLoop` binds deps to its own loop: `persist`, `onUpdate` and `onSafety` touch the active signals only if `loop === mine`, otherwise they only upsert into the store (and only if the epoch is unchanged). After `await l.send`, touch `pendingUser`, `loopView`, `lastTurn`, `activeConversation` and navigation only if `loop === l`.
- Busy guard, in `session.send` only (`openAndSend` in `ui/open.ts` returns void and lazy-loads the session): if `loop?.busy`, return `{ outcome: 'error', error: { code: 'invalid', message: 'Escobar is still answering.' } }` and put the text into `escobarUi.draft`.
- `loop.send`: if busy, `abort('stale')` at the start. At the end, clear the controller only if `this.controller === controller`. `finish` sets idle only for the current generation.
- `loop.ts`: track `userCommitted`, and use `notSent: !userCommitted` on every exit. On a non-done exit after a repair, render the first answer with its unverified marks (`setRendered(firstAnswerIndex, …)`).
- `pendingDecisions`: capture the reported set at send start. At commit, keep the decisions not in that set, instead of resetting to `[]`.

### R4.5 Online lifecycle — ES-08
- `deps.online = () => navigator.onLine !== false && !(online.value === false && Date.now() < offlineUntil)`.
- Outcomes `done`, `refusal`, `step_limit` and `cut_off` set `online.value = true`.
- `checkOnline()` inside the back-off schedules itself for when the back-off ends.
- A window `online` event sets `offlineUntil = 0` and calls `checkOnline()`.
- The transport health check treats `key !== true` as offline, with the message "Escobar isn't set up yet."

### R4.6 One privacy layer — ES-12 (corrected), ES-23
In `tools/context.ts`:
- `redactDrivers(drivers, health)` filters `/resting heart rate|HRV|sleep has been short/i` (exact health drivers, not check-in text). Use it in `read.ts:247` and in `show.ts` `readiness_gauge`.
- `explainMethod`: when `!sharing.health`, drop `restingHrBaseline`, `healthDaysLogged`, `restingHr`, `hrMax` (unless its source is `tanaka`) and `zone*FromBpm`. When `!sharing.body`, drop `restingKcalPerDay`.
- `toRequestMessages(messages, imageData, sharing)`: map `tool_use_id → { name, input }` (the `show` tool needs `input.component` to tell `heart_session`/`body_trend` apart), and replace the results of `get_health`, `get_heart_session` and `show heart_session` (health off), or `get_body` and `show body_trend` (body off), with `{ "data": { "denied": "<x>_sharing_off" }, "facts": {} }`.
- `brief.ts`: `one(s)` strips newlines and `⟦⟧` and caps length at 140. Apply it to every interpolated name, reason and memory. `actions.ts` strips newlines from reasons.

### R4.7 Tools — ES-01, ES-15, ES-21, BR-18 (Escobar part)
- `capJson(data, maxBytes, { dropFrom = 'end' }: { dropFrom?: 'start' | 'end' } = {})` (the real signature today is `capJson<T>(data, maxBytes)`). Chronological arrays drop from the start. Audit every caller listed in the ES-01 correction. `get_exercise_history` returns sessions newest-first; update the description in `schema.ts` and run `npm run escobar:tools`.
- `lift_trend`: compute first/last/best over the full window; sample 12 points evenly.
- `progressionCtxFor(ctx, exerciseId, gymId?)` in `tools/context.ts` returns `{ readiness, recoveryPct, deload, equipment, loadFactor }`. Use it in `getNextTarget`, `getLiveSession` (passing equipment to autoregulation, gated on `mode === 'weighted'`), `getEquipment` and `show exercise_card`.

### R4.8 Limits and verification — ES-13 (D3), ES-14, ES-16, ES-11
- `Composer MAX_PHOTOS = 2`. Fix the decision line at `COACHING-DECISIONS.md:386`. `toRequestMessages` inlines at most 2 unsent images and stubs older ones.
- `windowMessages`: after the first cut, advance to the next plain user message until `Math.ceil(JSON.stringify(toRequestMessages(slice)).length / 4) <= HISTORY_TOKEN_LIMIT` (an estimated token count) and the count is ≤ `HISTORY_ENTRY_LIMIT` (and ≤ 600). Call `toRequestMessages` here without `imageData`; inlined base64 would trim the whole history. Force a full brief after any trim.
- `sentencesOf` strips a leading `- `/`• `, and so does the `Message.tsx` comparison. `checkGrounding` removes the chips directive before splitting.
- Replace `CRISIS` with (this keeps the verifier's intent correction; ongoing self-harm must still trigger):
  `/\b(kill(ing)? myself|suicid\w*|end my life|end it all|want to die|don'?t want to (live|be here)|self[- ]?harm|(want|going|trying) to hurt myself|harm(ing)? myself|hurt(ing)? myself on purpose|(been|keep|kept|started) hurting myself(?!\s+(on|at|during|doing|with|in|lifting|squatting|benching|training))|no reason to live|better off dead)\b/i`
  Add a phrase table of about 30 phrases to `verify.test.ts`, including "I've been hurting myself" → crisis, "I keep hurting myself on the bench" → pain only, "I think I hurt myself on squats yesterday" → pain only, "Should I end it after 3 sets today?" → nothing. `PAIN` already matches `hurts?`.

### R4.9 Modes, store, search, memory — ES-17, ES-19, ES-18, ES-30, ES-31, ES-32
- **Plan mode**: `session.send` derives the mode as `activeConversation.mode === 'plan' ? 'plan' : (ui.mode === 'chat' && isPlanRequest(text) ? 'plan' : ui.mode)`, where `isPlanRequest` lives in `src/escobar/ui/prompts.ts` and is `/\b(new|make|build|write|create|design|plan|change|redo)\b[^.?!]{0,40}\b(programme|program|routine|split)\b(?!\s*squat)|\b\d[- ]day (split|program|programme|routine)\b|\b\d (days?|times) a week\b/i`. The simpler word list matched "Bulgarian Split Squat" and "morning routine", and plan mode then sticks for the whole conversation. Test true and false phrases. Persist `conversation.mode = 'plan'`. `live` wins when a session is active.
- `fitToBudget` never removes the active conversation. If only it remains and it is too big, trim its oldest messages up to the first plain user message after the midpoint, and set `trimmed`. `session.persist` shows a toast once if the active conversation is missing after fitting.
- Word-bounded matching in `palace/registry.ts:138/142` and `knowledge/cards.ts:29`: `` ` ${q} `.includes(` ${kk} `) ``.
- Memory: the eviction goes in `session.applyEffect` (currently `.slice(-MAX_MEMORY_ITEMS)`): at the cap, evict the oldest item whose kind is not injury, equipment or agreement. The `ToolError('memory is full')` for when none is evictable is thrown in the `remember` path at `executor.ts:214`. Ids: `` `m${now.toString(36)}${Math.random().toString(36).slice(2, 6)}` ``.
- Brief: `Math.round(months)`; pending proposals filtered by `expiresOn >= todayKey()`.
- Add `'escobar'` to `ProfileChange.source` and use it in `apply.ts`. `methods.ts` imports the brain constants (export them from readiness, e1rm, effortBias and the rules). Add a test that the constants are equal.

### R4.10 UI — ES-26, ES-22, ES-27, ES-28
- Hide the Proactive toggle until moments ship.
- Render pinned cards on Today through `ShowComponent`, filtered by `until >= todayKey()`, with an Unpin button.
- Replace `MemoryPlaceholder` with `MemoryScreen`: list, delete per item, and "Forget everything" (with confirm), writing `escobar.memory`.
- `ShowComponent`: `useMemo` on `[component, JSON.stringify(params), state.value]`.
- Citation popover: ignore pointerdown inside its own wrapper.
- `images.ts`: one memoised `dbPromise` (reset on error); evict sent images from memory.

### R4.11 Carry-over — RG-03 (D6)
On first enable: if `!state.escobar.legacyImported` and `state.coach?.askThread` is an array, build text-only messages (drop leading assistant turns, merge consecutive same-role turns). Create the conversation "Earlier conversation" through `escobar/store`, then set `legacyImported = true`.

### R4 tests
- `tests/escobar/session.test.ts` (new):
  - a new conversation mid-turn leaves the new id active;
  - a reset mid-turn leaves 0 stored;
  - a network error, then 61 s later, another send calls the transport;
  - two sends, then Stop, aborts the second;
  - busy guard.
- `tests/escobar/apply.test.ts` (new):
  - apply → startSession → undo leaves `active` unchanged;
  - profile undo keeps a later weigh-in;
  - undo after 8 s or after reload is "no longer available";
  - p1 in two conversations stays independent;
  - a programme with an active session gives a ToolError.
- `tests/escobar/privacy.test.ts` (new): with health off, `readiness_gauge` drivers have no HR, `explain_method hr_zones` has no `restingHr`, and a replayed `get_health` is stubbed.
- Extend `loop`, `read` (newest-first survives capping), `show`, `verify` (phrase table), `store`, `palace` and `state` (askThread fixture) tests.

**Gate**: the Escobar mock pass exercises Apply → Undo within the window, and asserts that Undo is hidden after 8 s.

---

## R5. Android native and PWA platform

**Layers**: native Java → TS bridges → UI → CI → gate. **All native changes need a device check.** CI compiles them (android-gate) but nothing runs them.

### R5.1 Health Connect — PL-03, PL-04, VX-01, UI-16, ST-16 (HC part), RG-18 (diagnostic)
- Java:
  - add `private final Executor callbackExecutor = Executors.newCachedThreadPool();` (not `getMainExecutor(getContext())`: `getContext()` is null in a field initializer);
  - pass it to **every** `hc.readRecords` / `hc.aggregate`; keep `executor` for the outer work;
  - steps and active calories come from two aggregate requests over local midnight → now, because `AggregateRecordsRequest.Builder<T>` takes one type:
    - `new AggregateRecordsRequest.Builder<Long>(filter).addAggregationType(StepsRecord.STEPS_COUNT_TOTAL)`;
    - `new AggregateRecordsRequest.Builder<Energy>(filter).addAggregationType(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL)`, with `activeCalories = Math.round(energy.getInCalories() / 1000.0)`;
    - call `hc.aggregate(req, callbackExecutor, new OutcomeReceiver<AggregateRecordsResponse<T>, HealthConnectException>() {…})`; `resp.get(type)` can return null, so treat null as 0;
    - guard each request with its permission, as `readIfGranted` does, and add failures to `failed`;
    - imports: `android.health.connect.AggregateRecordsRequest`, `android.health.connect.AggregateRecordsResponse`, `android.health.connect.datatypes.units.Energy`, `java.time.LocalDate`, `java.time.ZoneId`;
  - sleep, resting HR and the latest HR stay on the 48 h read.
- `src/native/health.ts`:
  - `mapHealthSummary`: `activeCalories > 20000` → divide by 1000 (heals stored values). Apply the same guard in `normalize` for `healthDays[].activeCalories` and `health.activeCalories`;
  - when every granted type failed, return `null`;
  - export `lastHealthError` (`needsPermission`, `missing[]`, `failed[]`, message);
  - `syncHealth({ prompt = false })`: only the Settings Connect/Sync buttons pass `prompt: true`.
- Cold start, resume (visibility) and `startSession` sync only when `health.connected`, with `prompt: false`, throttled to once per 10 min.
- Settings **Health diagnostic** sheet after a failed sync: permission state, missing and failed types, per-type values, and a button to Open Health Connect permissions.

### R5.2 Watch — PL-08, PL-13, UI-21, UI-07, UI-08, PL-15 (wire), research FGS guard
- `WatchBridgePlugin`: wrap the `startScan`, `stopScan`, `connect`, `disconnect` and `status` bodies in `getBridge().executeOnMainThread(() -> { …; call.resolve(...); })`. Make `DeviceScanner.scanning` `volatile`.
- Throttle `emitDevices` to one per 500 ms with a trailing emit. Emit a single `watchDevices` event whose payload is a `JSObject` `{ devices: JSArray }`; `src/native/watch.ts` accepts both events for one release.
- Service start: check `BLUETOOTH_CONNECT` first, and catch `SecurityException` and `IllegalStateException` (the API 26-safe superclass of `ForegroundServiceStartNotAllowedException`, which is API 31+ while minSdk is 26) → status `paused` with a reason.
- Add `@PluginMethod diagnostics(call)` returning `service.diagnostics()`, plus a **Copy watch diagnostics** button in the Watch sheet.
- `Watch.tsx`: `scanning = status.state === 'scanning' || localScanning`, with `localScanning` reset in a `finally`. Show an empty-state message when a scan ends with 0 devices, a hint on a denied permission, and **Forget watch** whenever `deviceAddress` is set.
- `slices/workout/heart.ts`: dedupe by `receivedAtEpochMs`. Read `state.peek().active`. Derive the time base from `active.startedAt`, and delete `sessionStartMs`.

### R5.3 Back button (research, P0 for targetSdk 36)
- Add the dependency `@capacitor/app` matching Capacitor 8.
- `src/ui/primitives.tsx` `Sheet` registers its `onClose` on a global `sheetStack` signal while mounted.
- Derive the existing `openSheets` counter (`primitives.tsx:63`) from `sheetStack`.
- `src/native/back.ts`: `App.addListener('backButton', …)`: if `escobarUi.value.open`, set `escobarUi.value = { ...escobarUi.value, open: false, contextRef: null }` (the Escobar chat is its own `<dialog>` at `EscobarSheet.tsx:197`, not a `Sheet`) → else pop the top sheet → else close the open panel → else, if `tab !== 'today'`, `go('today')` → else `App.minimizeApp()`.
- On the web: each sheet calls `history.pushState({ sheet: id }, '')` on mount. On `popstate`, close the top sheet with `fromPop = true`. When the UI closes a sheet, call `history.back()` only if `history.state?.sheet === id`. `go()` uses `history.replaceState` (`router.ts:55`), so it must not overwrite a pushed sheet entry: when `history.state?.sheet` is set, `go()` closes sheets first.
- CI plugin check: grep `'"@capacitor/app"'` in the plugins list (not a case-insensitive `App`, which matches other plugins).

### R5.4 Safe area and system bars (research, P0)
- Every `env(safe-area-inset-X)` in `styles.css` becomes `var(--safe-area-inset-X, env(safe-area-inset-X, 0px))`.
- `@capacitor/core` 8.5.0 has the SystemBars API. The theme engine calls `import { SystemBars, SystemBarsStyle } from '@capacitor/core'; if (isNative()) void SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light })`. `Dark` means light icons. Themes have no dark flag, so use `id !== 'paper'` or the luminance of `tokens.bg`. The `--safe-area-inset-*` variables are injected by the default `insetsHandling: 'css'`; no config change is needed.

### R5.5 Service worker and first paint — ST-03, ST-04 (both corrected), ST-20, ST-25
- `public/sw.js`:
  - navigations are network-first; cache OK responses under both the request URL and `./index.html`; fall back to the cached index;
  - other same-origin GETs are cache-first, cached only when `res.ok && res.type === 'basic'`; a network failure returns `Response.error()`, never HTML;
  - `const ASSETS = /*__ASSETS__*/[];` is installed together with `CORE`;
  - `activate` copies `/assets/` entries from old caches into the new one before deleting them.
- `scripts/sw-version.mjs` replaces `/*__ASSETS__*/[]` with the JSON list of `www/assets/*`, including every lazy chunk. The CI build check fails if `/*__ASSETS__*/` remains.
- `main.tsx`: on `controllerchange`, if no session is active, show a toast "App updated" with a Reload button.
- `index.html`: an inline `<style>` with each theme's `bg`/`text` per `[data-theme]` (a theme test asserts they match `THEMES`); the pre-paint script validates the theme id; remove `maximum-scale=1`.
- Manifest: `"id": "./"`.

### R5.6 Privacy text, manifest, CI — PL-10, RG-20 (D2), PL-16, research
- `PermissionsRationaleActivity`: use the PL-10 replacement text, but write "M/ARC" (not "M•ARC"). With D2, add: "Android's device backup may include this app's data."
- `patch_manifest.py`: enforce the required attributes on existing elements (PL-16); keep `allowBackup` per D2.
- Port the dex-level class check from `d69b22e` into both workflows: assert that `Lcom/mrcdrnzz/dailytracker/HealthConnectNativePlugin;` and the WatchBridge class are in `classes*.dex`.
- CI assertion: `targetSdkVersion >= 36` and `compileSdkVersion >= 36` in `android/variables.gradle`.

**R5 tests**:
- `tests/health-bridge.test.ts`: kcal guard; all-failed returns `null`; `prompt: false` never calls `requestPermissions`.
- `tests/watch.test.ts`: batched devices event.
- `tests/heart-capture.test.ts` (new; `tests/heart.test.ts` covers `brain/heart.ts`): dedupe and restart time base for `slices/workout/heart.ts`.
- `tests/back.test.ts`: stack order.
- `tests/theme.test.ts`: index.html colours.
- A Playwright SW test in the gate: visit, go offline, reload → the nav renders; then deploy build B → Escobar still opens.

**Needs device check**: Health Connect values vs the Health Connect app; watch scan/connect stress; back gesture on 3-button and gesture navigation; edge-to-edge on Android 15/16; FGS start with Bluetooth denied.

---

## R6. v36 parity and small, fully specified features

**Layers**: data model → brain → UI → tests → gate.

| # | Item | Spec |
|---|---|---|
| 1 | CSV export (RG-17) | Pure `src/slices/settings/exportCsv.ts` `sessionsToCsv(sessions, unit, from, to)`. Header: `date,split,exercise,set,load,unit,reps,effort,kind,duration_s,distance_m,note`. Loads come from `setLoadIn(set, unit)`; quote per RFC 4180. Settings → Your data → "Export CSV (last 90 days / all)" through `exportText`. Test: exact rows, entered lb values, comma quoting. |
| 2 | Day off (RG-19, D4) | `AppState.daysOff: string[]` (normalize default `[]`, capped at 400). Today shows "Take today off" when a split is scheduled and no session exists today (undo toast). `trainingStreak`, `weekSummary` and `adherenceRate` treat days off as unscheduled. `weekSummary` has no schedule parameter, so the caller subtracts this week's scheduled days marked off from `plannedPerWeek`. Test: a day off keeps the streak. |
| 3 | 30 exercises (RG-04, D5) | Append the ids missing from `git show origin/claude/phase-9-readiness-preference-ckw91g:src/data/exercises.json`. Ids carry the `lib_` prefix (`lib_wall_sit`, `lib_jump_rope`, …). Port `DURATION_NAMES` and `CONDITIONING_NAMES` verbatim from that branch's `src/core/exercises.ts`: 4 duration ids and 14 conditioning ids, including burpee, mountain_climbers, jumping_jacks, high_knees, box_jump, medicine_ball_slam, wall_ball, bear_crawl and jump_squat. Test: every id resolves, with the expected modes. |
| 4 | Conditioning inputs (UI-20) | For `mode === 'conditioning'`, `EntryCard` keeps the reps input (burpees, jumping jacks and box jumps are logged in reps) and adds a load (`WeightInput`), optional distance m (1..1000 → `distanceM`) and optional seconds (→ `durationSec`). `isWorkingSet` already counts distance. Test: farmer's carry stores `distanceM`. |
| 5 | **F1 Notes** | `LoggedExercise.note?: string`; `Session.note?: string`; `AppState.exerciseNotes: Record<exerciseId, string>` (sticky setup note, max 200 chars, normalize default `{}`). `EntryCard` shows the sticky note under the name with a pencil icon; the finish screen gets a session note field; History shows both. Escobar `get_exercise_history` includes the sticky note (not health data). Tests: normalize, CSV `note`. |
| 6 | **F2 Set types** | `LoggedSet.kind?: 'warmup' \| 'drop' \| 'failure'`. Today `isWorkingSet` also means "this set is filled in": `finishSession` keeps only `isWorkingSet` sets (`session.ts:172`) and `commitSet` bails without it (`session.ts:79`), across 28 call sites. So add `hasEntry(s)` (reps, duration or distance > 0) in `exposure.ts` and define `isWorkingSet(s) = hasEntry(s) && s.kind !== 'warmup'`. Use `hasEntry` in `finishSession`, `commitSet` (a warm-up records `at` but never starts auto-rest), `logPastSession`, the History editor and CSV export. Keep `isWorkingSet` for counting (exposure, volume, recovery, e1RM, records, progression). Audit all 28 call sites and log the split in progress. Exposure, e1RM, records and progression ignore `warmup`; records ignore `drop`; `failure` implies effort `max`. The warm-up disclosure gets **Log warm-ups**, which prepends warm-up sets from `warmupSets()`. The set-row menu offers "Mark as drop set / to failure". Tests in `exposure`, `prs`, `e1rm` and `session`, including 2 warm-ups + 3 working sets → 5 sets stored and 3 counted. |
| 7 | **F5 Backup reminder** | `Preferences.backupReminder?: boolean` (default `true` on native). A weekly inexact notification (Sunday 19:00) says "Save a backup of your training"; tapping it opens Settings → Your data. Use a notification id outside 730000–820000 (`syncTrainingReminders` cancels that range). `main.tsx` routes every notification tap to `go('train')` today, so route by `extra.type`. The Settings line shows "Last backup: N days ago" (store `lastBackupAt` on export). |
| 8 | **F8 Weekly volume chart** | History → Stats: bar chart from `weeklyVolumeHistory` (already in `brain/weekly.ts`) through `ui/Sparkline` or a small bar component; 12 weeks; unit-aware. |
| 9 | **F9 Effort repair on finish** | The finish screen lists working sets without effort (max 12) with the effort buttons inline before Save; "Skip" is allowed. |

**Gate**: screenshot the CSV row in Settings, the day-off state on Today, a set row with a note, and warm-up sets in the live session.

---

## R7. Removals, redundancy, CI, docs

**Layers**: code deletions → dedupe → CI → docs.

### R7.1 Delete — ST-22, RG-13, BR-30, ES-24, UI-32, PL-15 (remainder)
These have zero callers. Confirm each with `grep -rnw` before deleting.
`store.ts` computed `sessions`, `splits`, `preferences`, `customExercises`, `allExercisesLookup` · `dates.hoursSince` · `recovery.withinDaysOfSession` · `energy.weeklyEnergy`, `energy.dailyActiveKcal` (and their tests) · `brain/index.ts` (no importer) · `primitives` `Bar`, `Ring`, `.ring` CSS · `icons` `IconClock`, `IconSpark`, `IconMoon`, `IconHeart` · `session.REST_STEP` · `profile.setName` · `escobar/images.loadImage` (or use it for thumbnails) · `show.weeklyTotals` · `read.weeklySetsFor`, `read.e1rmOf` · `actions.equipmentGroupOf` · `context.plannedPerWeek`, `context.displayUnit` · `escobar-worker/src/prompt/modes.ts MODE_ADDENDUM` · Java `LiveSession.average/min/max/total/lastReceivedAt`, `WatchService.batteryReceivedAt` (write-only) · `HealthConnectNativePlugin.diagnose` (unless R5 wired it) · `.watch-pill .dot.live` CSS.
Also delete `isRealChange`, `e1rmWeight`, `pickEnergy` and `energyFromWatch`, with their tests (no src callers). Keep `isDuplicateSession` and `retroSessionLogging` (R8 F4 uses them) and `energyFromHealthConnect` (logged decision). If the watch work (Gate D) has decided calorie semantics by then, follow that decision for the energy helpers instead.

### R7.2 Deduplicate
- `core/exercises.ts` uses the `DAMAGE_*` constants from `data/recovery.ts`.
- `loop.step` uses `DirectiveBuffer`.
- `loop.commit` and `store.appendMessages` share `titleFrom()`.
- `apply.withDecision` reuses `recordDecision`.
- RestBanner uses `restRemainingSec`.
- One `src/native/filePicker.ts` (resolves `null` on cancel, UI-29) used by `share` and `photo`.
- Android project generation moves into `scripts/prepare-android.sh`, called by both workflows. This fixes the drifted icon background.
- `APP_VERSION` has one source (ST-23, RG-16, ES-24): `src/core/version.ts` already exists from R1.3. Change its source to Vite `define: { __APP_VERSION__ }` from `package.json`, with `declare const __APP_VERSION__: string` in `src/env.d.ts`, and import it in the backup converter too. The `convert-backup` npm script bundles with esbuild directly, so add `--define:__APP_VERSION__='"37.1.0"'` there (or read `package.json`), or `core/version.ts` throws a ReferenceError in that script. Add `"scripts/**/*.ts"` to the tsconfig `include`. Bump to `37.1.0` (D13).
- `legacySessionLogging` moves to `core/sessionLogging.ts`, re-exported from `brain/fidelity.ts` (RG-12).
- Add `esbuild` as a direct devDependency.

### R7.3 CI and gate
- Release (PL-17): `VERSION_NAME` is `<package.json version>.<run>`; `VERSION_CODE` is `MAJOR × 1_000_000 + run`. A guard requires the "M/ARC gate" to be green on the SHA (`actions: read`), or runs the gate. Align action major versions.
- Gate (PL-18, RG-14): local-date fixtures (`` `${y}-${pad(m)}-${pad(d)}` ``); replace fixed `waitForTimeout` + `isVisible` with `locator.waitFor({ state: 'visible', timeout: 5000 })` wrappers; retry the 150 ms timing check once; add a console-error listener on the pulse pass; run the gate once with `TZ=Pacific/Auckland` in CI.
- Adaptive icon: render a 432 px padded foreground and a monochrome layer through `scripts/render-logo.mjs`, and commit per-density resources used by `prepare-android.sh`.

### R7.4 Copy, a11y, hooks — UI-25, RG-10, UI-26, UI-30
- Editor hint: "Each load is shown in the unit it was logged in; tap the pill to switch." Stats volume: `k lb` for lb users.
- `HeartBpm` gets `role="img"`. `RestBanner` has no `role=status`; a hidden `aria-live="polite"` span says "Rest done" once.
- Keyboard pass: `Row` activates on Enter/Space; `Segmented` uses `aria-selected`; effort buttons get a 44 px hit area.
- `WeeklyReviewCard` calls its hook before the early return.
- ST-24: keep lb display at 0.1 (a documented decision; RG-02 backfill covers typed values).

### R7.5 Docs
Rewrite `README.md` and `docs/ARCHITECTURE.md` to match the code (RG-11): layers incl. `escobar/`, `escobar-worker/`, `assets/`; impulse-response recovery; 2.5 % records with effort-aware Epley; progression inputs; the full `AppState` key list plus side stores (`marc.heart.v1`, `marc.escobar.v1`, IndexedDB photos, `.corrupt`, `.backupDay`); workflows on every branch; drop "everything the old app did". Move `legacy/v36` to a tag (D7) after the owner confirms.

---

## R8. Larger features (only after the owner says go; each needs its own short design pass first)

| # | Feature | Value / effort | Notes for the design pass |
|---|---|---|---|
| F4 | CSV import from Strong / Hevy | high / M | The parser must be header-driven. Confirm the columns against a real export from the owner. Map names with `findExerciseExact`, then unique fuzzy, else create a custom exercise. Warm-up rows become `kind: 'warmup'`. Sessions use `retroSessionLogging`. Dedupe with `isDuplicateSession`. Preview sheet with counts, then Undo. |
| F6 | Supersets / circuits | high / M | `SplitExercise.group?`, entry `group?`. Rest starts after the last exercise of the group in each round. Bracket UI. Brain unaffected. |
| F7 | Per-mode model routing (D12) | medium / S | Worker env `MODEL_CHAT`, `MODEL_PLAN`, `MODEL_LIVE`, … falling back to `MODEL`. Check `SYSTEM_MESSAGE_MODELS` / fold behaviour per model. Client `estimateCost` by `final.model`. Verify prices before choosing models. |
| F10 | Near-miss records + chronic-skip rule (phase-9 port) | medium / M | Port from `origin/claude/phase-9-readiness-preference-ckw91g:src/brain/coach/detectors/` (`nearmiss.ts`, `skips.ts`) onto `prs.ts` / `rules.ts`. |
| F11 | Health Connect history read + write sessions | medium / M | Optional `READ_HEALTH_DATA_HISTORY` to seed baselines. `WRITE_EXERCISE` writes `ExerciseSessionRecord` on finish. Update the rationale text. |
| W | Watch companion (GT6) | high / L | Follow `WATCH-ARCHITECTURE.md` Gates A–E and the ordering and constraints in `WATCH-INTEGRATION-NOTES.md`. Gate A (feasibility) may start after R0.0. Gate B builds on R1 + R2 (R2.8 ids). Gate D's native workout service needs its own design pass. |
| Backlog (design first) | Android 16 Live Update notification for session and rest; mesocycles/blocks; home-screen widget; body measurements + progress photos; exercise demo links; optional numeric RIR; coach backtest harness (coach-brain `cbb29a7`) | | Each needs a T3 design doc before implementation. |

---

## 11. What NOT to do
- Do not add `USE_EXACT_ALARM`.
- Do not implement signed device ids (D15).
- Do not apply the RIR bias to e1RM (D11).
- Do not rewrite the Worker SSE stream into a `ReadableStream` (the minimal abort fix is enough).
- Do not change `suggestNext.target` strings or the body-weight copy for units (BR-28 correction).
- Do not import `escobar/session` from the main bundle (keeps the 148 KB chunk lazy).
- Do not remove `legacy/v36`, delete branches or rotate the signing key without the owner's answer.
- Do not deploy the Worker or trigger workflows yourself. List them as owner actions.
- Once R0.0 has created the permanent key, do not rotate, regenerate or replace it (§1.1a). The create workflow refuses to overwrite it.
- Do not push to `claude/escobar-v2-implementation-eidx64` without the owner's explicit OK.

## 12. Test additions summary
New files:
- R1: `store`, `backup`, `router`, `escobar/session-reset`
- R2: `clock`, `session`, `parse`, `notifications`
- R3: `bodyfat`, `trend`, `muscles`, `exercises`
- R4: `escobar/session`, `escobar/apply`, `escobar/privacy`
- R5: `watch`, `back`

Extended: `recovery`, `readiness`, `coach`, `volume`, `deload`, `weeklyReview`, `pre`, `post`, `live`, `heart`, `plate-sense`, `effortBias`, `balance-weekly`, `migrate`, `theme`, `health-bridge`, all `tests/escobar/*` touched, and Worker `handler`/`validate` plus a new `quota` DO test.
CI additions: `npm run test:tz`, the keystore grep, the dex class check, the targetSdk assertion, the SW placeholder check, the gate at `TZ=Pacific/Auckland`.

## 13. `docs/REMEDIATION-PROGRESS.md` template

```markdown
# Remediation progress
Resume from this file and docs/REMEDIATION-PLAN.md. Never re-derive finished work.
Branch: <name> · Baseline: 589 app tests / 50 worker tests

## Owner answers
D1: pending · D2: default · … (record any non-default answer here)

## Owner actions (collected; STOP once at the end)
- [ ] R0: dispatch "Deploy Escobar Worker", confirm /health quotas:true
- [ ] R0.0: SECRETS_WRITE_TOKEN → keep the encrypted key backup → add the new fingerprint in AppGallery Connect → backup, uninstall, reinstall, restore → delete the token and caches

## Phase R0 — <status>
### Layer: worker — done, commit <sha> — IDs: …
### Layer: CI — …
### R0 report
- Built: … - Tested: … - Decided by research: … - Needs device check: … - Next dependency: …
(skipped / not reproduced: <IDs + one-line reason>)
```

## 14. Research sources
The full list with URLs is in [`qa/research.json`](qa/research.json). Key sources:
- Play target API policy: support.google.com/googleplay/android-developer/answer/11926878
- Android 16 behaviour changes (edge-to-edge, predictive back)
- Exact alarms: developer.android.com/about/versions/14/changes/schedule-exact-alarms
- FGS types
- Health Connect read-data
- Live Updates
- Adaptive icons
- Science: Nuzzo 2024 (reps–%1RM); Halperin 2022 (RIR accuracy, PubMed 34542869); Pelland 2025/26 (volume dose–response); Robinson 2024 (proximity to failure, PubMed 38970765); Singer 2024 (rest, Frontiers); Coleman 2024 (deload RCT, PeerJ 16777); 2025 autoregulation network meta-analysis (PubMed 40791980)
