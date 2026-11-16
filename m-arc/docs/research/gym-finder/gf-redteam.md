# Red team: Gym Finder draft plan

## Findings, ranked

### Blockers

**B1. The R2 hosting plan cannot ship as written, and "$0/month" is not true.**
- Cloudflare says `r2.dev` URLs are "rate-limited and should only be used for development purposes". Cache, WAF and access controls work only on a custom domain, and that domain "must have been added as a zone in the same account" (https://developers.cloudflare.com/r2/buckets/public-buckets/).
- The owner has no Cloudflare zone. The app only uses `marc-coach.mmarcdarenz.workers.dev` and `macdarenz-droid.github.io` (grep of `src`).
- Turning on R2 asks for a payment method, and charges above the free tier have no hard cap. This comes from secondary sources and is not checked against Cloudflare's own page.
- The repo is public, so the bucket URL will be public too. A PH+AU basemap anyone can reuse as a free tile host turns into tile requests charged to the owner's card.
- **Fix:**
  - GF-0 must cover: buying a domain (spending), the card on file, a WAF rate rule and a billing alert.
  - The catalogue (a few hundred KB gzipped; measure it in GF-1) ships inside `www/` or on the GitHub Pages site the owner already uses. That removes CORS, ETag and outage states.
  - The basemap decision becomes one of three: owner-funded domain plus WAF, OpenFreeMap with the owner's yes, or no map in v1.

**B2. Map attribution breaks LR-23, and GF-0 does not ask about it.**
- MapLibre 5.24's default attribution inserts `<a href="https://maplibre.org/" target="_blank">MapLibre</a>` (`src/ui/control/attribution_control.ts:25`) plus each source's own links.
- OSMF guidance says "OpenStreetMap" should be "a link to openstreetmap.org/copyright" (https://osmfoundation.org/wiki/Licence/Attribution_Guidelines).
- LR-23 bans links and sources unless Google Play requires them (`docs/COACHING-DECISIONS.md:1170-1172`). Map attribution is required by the data licence, not by Play.
- In the Capacitor WebView, any tap on an anchor leaves the app. `Bridge.launchIntent` fires `ACTION_VIEW` for any other host (`@capacitor/android@8.5.0 Bridge.java:408-418`).
- GF-0 asks only about the "listing card".
- **Fix:**
  - Add an explicit owner ruling on map and data attribution to GF-0.
  - Build with `attributionControl:false` and a plain-text "© OpenStreetMap" next to the map, with no anchor, or as the owner rules.
  - Add a guard that no `<a>` renders inside `src/slices/gymfinder/**`.

### High

**H1. v1 does not beat Google Maps at anything, and the plan never tests the cheap baseline.**
- v1 has no near-me, no phone, no website, no prices, no photos and no ratings.
- Overture has no opening hours (https://docs.overturemaps.org/guides/places/), so with Overture as first choice, "hours if the source has them" means never.
- "Area" search is plain text matching on address strings. Common names such as "BGC", "Ortigas" or "CBD" will not match without a gazetteer.
- Two of the plan's own background reports (gf-1 risk 3, gf-0 §5) flag this as several projects in one or name a keyless handoff to the phone's maps app as the cheapest v1. The plan dropped that option without saying why.
- **Fix:**
  - Add a v0 card: "Find a gym" opens the user's maps app with `geo:0,0?q=gym`. The maps app does the near-me search with its own location permission, so this app needs no permission, no new dependency and no new data. Whether it searches near the user still needs a check on a device, including Huawei/Petal Maps.
  - Linking stays a manual step.
  - GF-1's go/no-go must show that the catalogue plus map beats this baseline on a lifter's real questions: near me, open now, day pass, kg or lb plates.

**H2. Linked gyms will silently lose their link.**
- Overture docs: "A name change can change a place … identifier". In June 2025 every ID changed when Overture moved to UUIDs (https://docs.overturemaps.org/gers/stability). OSM IDs also change, for example when a node becomes a way.
- `Gym.place.id` will dangle after a monthly rebuild.
- **Fix:**
  - Design a "not in list" state with a relink action.
  - The builder emits an ID bridge using the GERS changelog.
  - Test a fixture where the linked ID disappears.
  - Version the file path (`/v1/PH.json.gz`), so older apps never parse a newer schema.

**H3. If the WebView's renderer runs out of memory, the whole app dies, even mid-workout.**
- Capacitor 8.5's `onRenderProcessGone` returns false unless a listener handles it (`BridgeWebViewClient.java:92-103`). `native/` has no such listener (grep).
- The app's minimum is Android 8 (`prepare-android.sh:13`, minSdk 26). MapLibre is about 1.06 MB minified and runs WebGL inside the app's WebView on low-end phones.
- The finder can be opened from the Train sheet while a workout is live.
- **Fix:**
  - Show the list only (no map) while a workout is live, or when WebGL is missing or `navigator.deviceMemory` ≤ 2.
  - Handle `webglcontextlost`.
  - Add a recorded check on a 2 GB, Android 8 phone to GF-4's evidence.
  - Raise the native listener with the supervisor.

**H4. GF-6's "processed on the phone only" is wrong.**
- Capacitor's WebView geolocation prompt asks for both COARSE and FINE (`BridgeWebChromeClient.java:249`). FINE is declared for Android 11 and older (`patch_manifest.py:45`).
- On Android 8–11, users therefore get a precise-location prompt. If they already granted location for the watch Bluetooth scan, they get no prompt at all, so location is used without any in-context notice. That contradicts the privacy policy's "the app does not use your location" (`PRIVACY-POLICY.md:15`).
- Centring the map on the user makes the tile range requests reveal their approximate area to the owner's bucket.
- **Fix:**
  - Near-me only sorts the list by distance and never auto-centres the map, or else it is declared in the policy and Data safety.
  - Use a native coarse-only request.
  - Show a disclosure before the request on every Android version.

### Medium

- **M1. The service-worker exclusion is pointless and breaks a deliberate rule (ST-04).**
  - The service worker never registers on native (`main.tsx:74`, `!isNative()`). No workflow hosts the web app (`.github/workflows`).
  - `sw-version.mjs` precaches every asset on purpose ("lazy chunks included … ST-04").
  - `sw.js:43` ignores other origins, so the catalogue is never precached anyway.
  - The APK carries the map chunk regardless.
  - **Fix:** drop the `sw-version.mjs` edit, state the APK size growth, and add a gate check that no MapLibre code lands in `index-*.js`. Today only How-to chunks have size budgets (`screenshot-gate.mjs:6042-6060`).
- **M2. More new dependencies and hosted files than the plan lists.**
  - PMTiles loading needs the `pmtiles` package. The basemap style needs `@protomaps/basemaps` or hand-written layers.
  - Map labels need hosted glyph files (Noto, OFL licence) and sprites.
  - The catalogue builder needs DuckDB in CI.
  - **Fix:** list all of them in GF-0 for the supervisor's dependency OK.
- **M3. The scheduled catalogue upload has no safety net.** A bad Overture release would be published to every user automatically.
  - **Fix:**
    - Before upload, check a minimum count, a maximum change from last month and the schema.
    - Require a manual approval step (protected environment) before upload.
    - The app keeps the last good copy.
    - GF-1 also measures precision (closed or duplicate gyms from Meta-sourced listings) and sets a confidence threshold.
- **M4. Contact details can hide inside names and addresses.**
  - **Fix:** the builder drops every phone, website and social field and scrubs names and addresses with a pattern check. Extend `tests/guards/no-contacts.ts` to the catalogue and its test fixture.
- **M5. A listing name sends the user's location to the coach.**
  - `brief.ts:125` sends the active gym's name every turn. A name prefilled from a listing ("Anytime Fitness Makati Ave") puts a neighbourhood into every coach request by default.
  - Names are also cut at 28 characters (`escobarState.ts:153`).
  - **Fix:** prefill only the chain name and let the user edit it before saving, or get the owner's yes for this as sent data.
- **M6. Linking a gym switches the active gym as a side effect.**
  - `addGym` sets `activeGymId` to the new gym (`units.ts:100`), so linking also switches gyms.
  - It also skips the "Mostly kg or lb here?" question.
  - **Fix:** add a link helper that leaves the active gym alone, and ask the unit.
- **M7. The privacy policy changes in v1, not only in GF-6.** The policy lists Cloudflare only as the coach server (`:35`). The finder makes requests (IP, which country file, which map area) even with the coach off. Publishing the updated policy is an owner step.
- **M8. A dependency is missing from the plan.** AUD-4 #154 is not listed, yet the plan relies on its `restoredState`. `git grep restoredState origin/main` finds nothing. AUD-4 also touches `store.ts`, `escobarState.ts` and `backup.ts`.
- **M9. "Nothing else saved" is not true.**
  - The IndexedDB catalogue cache and the chosen country persist.
  - "Reset workout data" calls `resetState` only. IndexedDB is wiped only by `resetAppData`, from the error screen (`ErrorBoundary.tsx:23-26`).
  - **Fix:** derive the country each time, wipe the cache on reset, and document both.
- **M10. There is no feature-flag system to build on.**
  - grep finds no flag mechanism in `src`.
  - A palace entry added in GF-3 would show a hidden panel in in-app search and to the coach.
  - **Fix:** use a build-time constant (not saved state) that also hides the palace entry and the entry buttons, plus a gate probe that a flag-off build has no entry points. Or add the palace entry only in GF-5.

### Low

- **L1. "Directions" is the wrong label.** A `geo:` link works without a plugin (checked in `Bridge.launchIntent`), but:
  - it does nothing, silently, when no maps app is installed (the error is swallowed, `:415-417`) and on the web;
  - `geo:lat,lon` only centres the map, with no pin and no route.
  - **Fix:** use `geo:0,0?q=lat,lon(Name)`, label it "Open in Maps" or similar, and hide it on the web.
- **L2. Gate details.**
  - MapLibre's default zoom buttons are 29 px, which fails the gate's 44 px touch-target check (F8).
  - Map labels drawn on the canvas escape the contrast check (I14).
  - The PMTiles fixture needs 206 range responses.
  - WebGL itself is fine: checked on headless Chromium 141 here (WebGL2 true, no extra flags).
- **L3. Licences.**
  - Overture Places is not one licence: CDLA-Permissive-2.0, Apache-2.0 for the Foursquare data (its NOTICE.txt must go with any republished file) and CC0 (https://docs.overturemaps.org/attribution/).
  - Do not enrich with OSM data; ODbL share-alike would follow.
  - MapLibre's BSD-3 licence needs a notice file. None exists in `public/`; put one in the APK, not in the UI.
- **L4. Card IDs clash.** GF-0..7 collide with the proposal's acceptance rows GF-01..14 (`QA.md:11-26`). Rename the cards and record which QA rows are in or out of v1 (GF-03, 04, 09, 10 and 11 are out).
- **L5. The plan names "Where are you training?" (`Train.tsx:188`) as an entry point.** That heading itself breaks the 2026-10-01 heading rule, so coordinate with COPY-1.
- **L6. Hours, if they come back later.** Each gym needs its own time zone (Australia has three, and DST in some states only), and `test:tz` would need Sydney and Perth runs.
- **L7. With no analytics, v1 has no success test.** Define the owner-feedback go/no-go for v1.1 and v1.2 now.
- **L8. "Train here" does nothing during a live workout.** `startSession` returns silently (`session.ts:75-83`). It needs a visible state.
- **L9. Curated rates hidden after 90 days vanish without warning.** Add a reminder task for the owner.

## What the plan gets right
- One open source per region, search on the phone, no API keys, and Google rejected. Google's terms forbid showing Places data on a non-Google map (§14.2).
- A found gym stays separate from a training gym. It never evicts at the 8-gym cap, and no coordinates or visit history are saved.
- No store version bump is safe. Loading and backup both require `version === 1` (`store.ts:28`, `backup.ts:17`). `normalizeUnits` runs on every load (`store.ts:186`) and on restore, so an older APK quietly drops the field.
- The `inferGym` override is a real bug (`Train.tsx:163`, `:253-256`), and a test that fails before the fix and passes after is right.
- Adding the `PANEL_IDS` entry does not touch the Worker; only `palace.test.ts` reads it.
- Lazy chunk, no new theme tokens, the list as an equal path, serial cards, the Play release first and location deferred.

## Verdict
The core idea is sound. The plan as written is not ready to approve. Its hosting rests on an R2 setup this owner cannot run at $0: there is no Cloudflare domain, a card goes on file, overage is uncapped and the URL will be public. Its map ships links and source credits that LR-23 forbids unless the owner rules otherwise. And six cards plus a large map library deliver a v1 that Google Maps beats on every question a lifter in Manila or Sydney actually asks. Rework it before approval:
- GF-0 gets explicit rulings on the domain and spending, on attribution, and on every new dependency.
- Add the zero-cost "open in maps" v0 as the baseline GF-1 must beat.
- Bundle or host the catalogue without R2.
- Design for ID churn, out-of-memory crashes and the Android 8–11 precise-location trap.
- Drop the service-worker change.
- Add AUD-4 as a prerequisite.

The data model and linking design are sound and can stay as they are.