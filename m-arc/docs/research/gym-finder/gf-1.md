## Gym Finder integration map: fitting it into origin/main `f1e514a` without breaking anything

### 1. Integration points

| # | Point | Files | Change |
|---|---|---|---|
| 1 | Route | `src/app/router.ts:28-31` (`PanelId`, `PANEL_IDS`) | Modifying: add `'gym-finder'` (2 lines) |
| 2 | Mount | `src/app/App.tsx:59-79` (`Panels` switch) | Modifying, supervisor-owned: one `case` that renders a lazy wrapper. Keeps the five tabs (`router.ts:8-15`) |
| 3 | Lazy chunk | New `src/slices/gymfinder/lazy.tsx`, copying `src/slices/howto/lazy.tsx:13-21` (dynamic `import()`, toast with Reload on failure) | Additive |
| 4 | Styles | Feature CSS imported inside the chunk, as `HowToSheet.tsx:11-12` does, so Vite emits its own CSS chunk | Additive. No edit to `src/ui/styles.css` |
| 5 | Entry button | Train "Where are you training?" sheet `Train.tsx:182-220` (its "Add a gym" button is at `:208`, disabled at 8 gyms), and/or Settings row `Settings.tsx:168` / `Gyms.tsx:22-55` | Modifying hot files (see §5) |
| 6 | Link, choose and train | `src/slices/workout/units.ts:91-102` (`setActiveGym`, `addGym` returns null at the cap); `session.ts:75-83` (`startSession` returns if a workout is live and stamps `gymId` from `activeGymId`) | Reuse, plus one additive `linkGymPlace()` helper. No new session API |
| 7 | **Gym guess overwrites the user's choice** | `Train.tsx:163` (module-level `gymInferred = false`), `:251-256` (on first Train mount, `inferGym` calls `setActiveGym(guess)`) | **Must modify.** If the finder sets the gym before Train first mounts in this app session, the guess silently switches it back. Record an "explicit choice" flag that skips the guess, with a test that fails before the fix and passes after |
| 8 | Escobar navigation | `src/escobar/palace/registry.ts` (gym entries at `:47`, `:103`) | Additive entry. The app sends the manifest (`src/escobar/context/manifest.ts:1-5`), so the Worker does not change |
| 9 | Escobar actions | `propose_gym` already exists (`schema.ts:171`; `actions.ts:360-366` checks the 8-gym cap and duplicate names) | None for v1 |
| 10 | Saved data | `models.ts:51`, `escobarState.ts:145-162` | Modifying, needs owner approval (§3) |
| 11 | Theme | None if map colours come from existing tokens via `color-mix()` in the feature CSS | The proposal's new geographic aliases (`THEME-INTEGRATION.md:22-26`) would change the required `ThemeTokens` (`themes.ts:10-51`) in all 5 themes plus `tests/theme.test.ts` |
| 12 | Device location | `native/patch_manifest.py`, `MainActivity.java:9-12`, `scripts/prepare-android.sh:21-23`, `package.json` | Only if "near me" uses device GPS (§4) |
| 13 | Disclosures | `docs/PRIVACY-POLICY.md:15,35`, `docs/PLAY-SUBMISSION.md:34-44,84-101` | Modifying |

The proposal's own integration list (`FEATURES-AND-LOGIC.md:65`) misses points 2, 7 and 8.

### 2. The existing gym model

- What it stores: `Gym { id, name, defaultUnit, createdAt }` (`models.ts:51`). `UnitsState { gyms (at least 1, at most 8), activeGymId, byExercise, byEquipment }` (`models.ts:54-60`). `MAX_GYMS = 8`, `DEFAULT_GYM_ID = 'gym_default'` (`:62-63`).
- Sessions: each session records its gym in `Session.gymId` (`:181`); a live workout's is `ActiveSession.gymId` (`:221`). Train uses `s.active?.gymId ?? activeGymId()` (`Train.tsx:587-592`), so changing the active gym mid-workout does not relabel that workout.
- Delete: `deleteGym` removes the gym and its equipment profiles, and keeps the last gym (`units.ts:115-124`).
- Gym guess: `inferGym` uses the last 56 days, same weekday, ±2 h (`brain/units.ts:297-320`).
- **Unknown gym fields are stripped on every load.** `normalizeUnits` rebuilds each gym from 4 fields (`escobarState.ts:153`), de-duplicates ids and caps at 8 (`:149-152`).

How to link a found gym without a breaking change: add an optional field, for example `place?: { provider: 'osm' | …; id: string; label?: string }`, to `Gym`. Extend `normalizeUnits` to validate and keep it. Without that change the field is dropped on reload and on restore.

- Why on the gym record: `deleteGym` then removes the link automatically, so no orphans.
- Downgrade: an older APK drops the field quietly. Nothing breaks; the link is lost.
- Alternative: a top-level map would survive older builds, because `fill` spreads `...s` (`store.ts:161-165`), but older builds could leave orphan links. Not recommended.
- Gyms the user only browses must not use any of the 8 slots. Keep them out of `AppState`.

### 3. Saved-data impact

- New saved data (v1): only `Gym.place`. Search results, the selected pin and the map camera stay in memory only.
- What not to store:
  - Coordinates. Google allows lat/lng caching for 30 days only (`RESEARCH.md` "Provider choice").
  - Visit history.
  - Reminder flags. These wait for the native phase.
- Version: no bump. The loader and backup reader both require `version === 1` (`store.ts:28`, `backup.ts:28`); bumping it would make new backups unreadable on older builds. `BACKUP_SCHEMA = 2` (`backup.ts:15`) can stay.
- Backup: `buildBackup` writes `state.value` whole (`backup.ts:19`), so the link travels with no change.
- Restore: `parseBackup → repairState → normalize → normalizeUnits` (`backup.ts:30-50`), so the link survives only if `normalizeUnits` keeps it.
- Restore rules (AUD-4 #154, not merged): it adds `restoredState()` and `withLocalTrust()`, which keep this phone's coach on/off, sharing, server and device id. Any later per-device flag (for example arrival reminders) must follow that pattern so a restore never turns it on.
- Reset: "Reset everything" (`Settings.tsx:248`, `store.ts:369`) replaces the whole state, so links are wiped.
- Coach brief: `brief.ts:125` sends the active gym's name every turn while Escobar is on. A name filled in from a listing (such as "Anytime Fitness Makati Ave") reveals a location. Keep `place` out of the brief and let the user edit the name.
- Owner approval: a new kind of saved data (AGENTS.md ownership table: `models.ts`, `store.ts`, migrations).

### 4. Network, native, Worker and dependency impact

**Network and CSP**
- `index.html` has no CSP and there is no `_headers` file (grep found none), so map tiles or a places API need no CSP edit.
- The service worker handles same-origin GETs only (`public/sw.js:43`), so tiles are never cached offline. Offline mode must show a list-only or error state.
- `public/sw.js` is also being changed by AUD-5 #148.

**Device location**
- None today. `ACCESS_FINE_LOCATION` is capped at `maxSdkVersion 30` (`patch_manifest.py:45`) for old Bluetooth scanning.
- Trap: the PL-16 loop (`patch_manifest.py:52-64`) forces that cap even on an entry a plugin added. A geolocation plugin's fine-location permission could end up capped, so location would be missing on Android 12+. This is not verified against the merged manifest and needs a merged-manifest check.
- Safer route: an uncapped `ACCESS_COARSE_LOCATION` (enough for "near me"). Better still for v1: a typed area search, with no permission at all.
- No `@capacitor/geolocation` in `package.json:24-35`. Whether WebView `navigator.geolocation` works without it is not verified.
- Ownership: `patch_manifest.py` and `prepare-android.sh` are supervisor-owned.

**Dependencies**
- No map library is present (`package.json:24-35`). Any new dependency needs the supervisor's OK.
- The prototype loads D3 7.9.0 from a CDN (`source.html:189`). That cannot ship as-is: the app vendors its dependencies, and the README says not to paste the prototype into `src/`.

**Worker**
- Today it has `/v2/turn`, `/health` and `/errors*` (`handler.ts:97-100`, `index.ts:11`). There is no places or pricing route.
- Any proxy (to hide a Places key) or the price-scraping pipeline (`DATA-SOURCES.md:19-36`) is new code under `escobar-worker/**`. Merging it to main deploys it (`deploy-worker.yml:10`), so it is owner-merge only. It also brings a new secret (owner), a new paid provider and spending (owner), and new data sent (owner).
- **A new Escobar tool also touches the Worker.** `npm run escobar:tools` rewrites `escobar-worker/src/tools.generated.json`, and `tests/escobar/tools-sync.test.ts:8` enforces the sync.

**Coach policy conflict**
- The Worker prompt bans links and phone numbers and naming sources in coach replies (`prompt/policy.ts:27`, LR-23).
- That conflicts with the proposal's GF-11 ("Escobar … cites business facts", `QA.md:23`). Gym phone numbers, links and price sources must appear only in the app's own fixed listing card, never in Escobar text.

**Disclosures**
- `PRIVACY-POLICY.md:15` says "the app does not use your location", and its third-party list (`:35`) names only Cloudflare and Anthropic.
- The Data safety table (`PLAY-SUBMISSION.md:34-44`) has no Location row.
- A tile or places provider receives the user's IP plus the area or viewport, so it must be listed as a new third party. That is owner approval plus a policy deploy (K7 in the handover).
- Background arrival reminders would add Play's background-location declaration (`RESEARCH.md` "Platform scope").

### 5. Collision map (branch tips vs merge-base; the 3 refs that failed to fetch at first were re-fetched)

| Branch / PR | Gym Finder files it touches |
|---|---|
| AUD-10 #157, AUD-11 #159, AUD-12 #156, COPY-1 #137 (AUD-10/11/12 carry COPY-1 text) | `Train.tsx`, `Gyms.tsx`, `Settings.tsx`, `palace/registry.ts`, `native/notifications.ts`, `screenshot-gate.mjs`, `PLAY-SUBMISSION.md`; AUD-10 also `session.ts`, `styles.css` |
| AUD-4 #154 | `store.ts`, `escobarState.ts`, `migrate.ts`, `backup.ts`, `Settings.tsx` |
| AUD-5 #148 | `public/sw.js` |
| HT-6 #112, HT-8 #111, HT-9 #113 | `Train.tsx`, `screenshot-gate.mjs`, `tests/howto/budgets.json` |
| HT-7 #119 | `Train.tsx`, `screenshot-gate.mjs` |
| HT-5 #116 | `screenshot-gate.mjs`, `budgets.json` |
| BUG-34 #142 | `index.html`, gate |
| ESC-REPORT #130 | `styles.css`, gate |
| codex watch branch (last commit 09-25; agents never merge it) | `App.tsx`, `main.tsx`, `store.ts`, `session.ts`, `Settings.tsx`, `patch_manifest.py`, `prepare-android.sh`, gate |

- Clean: AUD-1, AUD-2, AUD-6, AUD-7, AUD-8, AUD-9, BUG-35, LIB-8.
- Hottest files: `Train.tsx` (9 branches), `screenshot-gate.mjs` (12), `Settings.tsx` and `Gyms.tsx` (5), `store.ts` and `backup.ts`.
- Parked work the proposal depends on: improvement audit #149 findings ENG-01, UI-R06, IMP-E04 and IMP-N01 (`improvement-audit.md:47,59,63,65`: wrong-gym loads, deleting a live workout's gym, stale suggestions writing into a deleted gym, notification races). `RESEARCH.md` "Regular gyms" says these "must precede automation".
- Status: #158 is parked by the owner behind the HT-to-M1 and 32-item audit finish line (`HANDOVER.md` §8.0).

### 6. Bundle size and performance

- Every lazy chunk is precached when the PWA installs (`scripts/sw-version.mjs:1-2,6`). A map chunk therefore costs every PWA user, and it ships inside every APK through `www/`.
- Sizes measured today from jsDelivr (raw / gzip):

| Library | JS | CSS |
|---|---|---|
| MapLibre GL 5 | 1,056,837 / 275,098 B | 70,024 / 10,059 B |
| Leaflet 1.9.4 | 147,552 / 42,356 B | 14,806 / 3,534 B |
| D3 7.9.0 (full) | 279,706 / 92,370 B | — |
| d3-geo 3 | 36,329 / 13,077 B | — |

- For scale, the whole How-to sheet budget is 6,954 B raw (`tests/howto/budgets.json`).
- The size of main's `index-*.js` was **not measured** in this pass (there was no fresh build).
- Budgets:
  - The gate only enforces size limits on How-to chunks (`screenshot-gate.mjs:6042-6060`).
  - A Gym Finder chunk needs its own entry: measured size plus 10 %, with `setBy` and a reason.
  - Raising a budget has needed the owner's yes when the classifier refused (`HANDOVER.md` §8.6 item 2).
  - `budgets.json` is How-to-scoped, so where a Gym Finder budget lives is the supervisor's call.
- Timing budgets: `tests/perf/budgets.test.ts` (MARC_PERF=1). A finder must not add work to app start (`main.tsx:23-34`).

### 7. Test and gate patterns to follow

- **Unit tests** (vitest, `tests/*.test.ts`, `tests/escobar/`, `tests/native/`). Required:
  - `normalizeUnits` keeps a valid `place` and drops a bad one;
  - backup round trip keeps the link (pattern: `tests/backup.test.ts`);
  - the cap of 8 gyms is honoured;
  - "Train here" while a workout is live does not change `active.gymId`;
  - the gym-guess override from §1 point 7, failing before the fix and passing after;
  - stale-request handling for searches (version ids, `FEATURES-AND-LOGIC.md:41`).
- **Time zones**: `npm run test:tz` runs New York and Manila (`package.json:22`). "Open now" and overnight hours must use the gym's local time zone.
- **Gate**: `screenshot-gate.mjs` has 6,376 lines. Blocks are add-only and named by task id (AGENTS.md). Themes are hard-coded at `:110`; follow the `for (const theme of themes)` blocks (for example `:1908`) at 390 and 360 px.
  - Existing checks the finder will hit: WCAG contrast I14 (`:295`), radii I17 (`:543-582`), no horizontal scroll at 320 px QA10-7 (`:4193`), 44 px touch targets F8 (`:3288`), the dock overlap check BUG-22 (`:5266`).
  - Network must be stubbed. The gate runs without live keys, the same way the Escobar mock does (`:1908-1912`).
- **Themes**: `tests/theme.test.ts:6,14` expects exactly 5 themes. First-paint and splash colours are duplicated in `index.html:18-22,39,128-136`. Adding a sixth theme is a separate card.
- **Agent guard**: builders must not touch `native/wear/**`, `src/native/wearEngine.ts` or `WatchLab.tsx` (`.github/scripts/agent-guard.sh:43-44`).
- **LR-23 guard**: `tests/guards/no-contacts.ts` covers coach text and How-to content, not a listing card. Confirm with the owner that gym phone numbers and links in an app card fall outside LR-23. Not verified.
- **Evidence**: map each `QA.md` GF-01..14 row to a test, a gate block or a device check on the exact commit. Arrival reminders (GF-09/10) need real-device evidence.

### Supervisor-relevant risks, ranked
1. The proposal is at least 4 projects in one: map UI, places provider, price-scraping backend, and background location. Only the map UI plus gym linking is app-only.
2. The price pipeline (scraping and OCR of official sites and social accounts) is a new paid backend with legal exposure under platform terms, and it is outside the Worker's job as a coach relay.
3. Cheapest valuable v1: keyless "Find gyms near me" that opens the user's maps app, plus a typed area list, plus the `Gym.place` link. That needs no permission, no dependency, no Worker change and no Data safety change. Whether that handoff needs no key or approval was not re-verified.
4. Start only after the finish line and after #149's four gym findings merge.