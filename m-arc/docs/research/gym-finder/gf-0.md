## 1. What the feature is

Gym Finder is a new screen, opened from the Escobar tab. It shows a map in M/arc's theme with gym pins and a matching list. Tapping a gym opens a details sheet with branch, address, hours, phone, day-pass and monthly rates, and photos. From there the user can save the gym, link it to one of their training gyms, and start a workout there. Later stages add optional "At [gym]?" arrival reminders and Escobar session preparation (RESEARCH.md:5, :25-35, :176-182).

Capabilities it proposes (FEATURES-AND-LOGIC.md:7-20 unless noted):
- **Escobar entry:** a composer chip "Find a gym" and a "Gym Finder" row. The five main tabs stay as they are (:9; source.html:35-36).
- **Map:** pan and zoom, bounded area search, a "Search this area" button instead of searching on every map move, attribution, and loading and error states (:10, :41).
- **Pins:** clustering or a capped result count when zoomed out, with an equivalent list (:11; RESEARCH.md:35).
- **Search:** by town, address, gym name or area. A manual-area path works when location is denied (:12).
- **Details:** each field has its own source, freshness and "unknown" state. Hours are shown in branch-local time, including overnight and holiday hours. Unknown hours never mean closed (:13, :43).
- **Rates:** taken from official websites and social accounts, with conditions, validity dates, conflicts and refresh states. A missing price never becomes zero (:14, :43).
- **Photos** from the provider, credited, with a fallback when there is none (:15).
- **Save/link:** a found gym takes no slot until the user links it. At the 8-gym cap the app never evicts a gym (:16, :47; models.ts:62).
- **Train here:** goes through the existing workout setup. If a workout is already running, a gym change is an explicit choice (:17, :49).
- **Call / Directions / Website:** handed to other apps on tap (:18; RESEARCH.md:30).
- **Arrival reminders:** states go `disabled → nearby → plausible → prompted → confirmed/dismissed/expired`, with a 5-minute dwell to test (:55-61). The notification is "At [gym]?" with "Start workout" and "Not now" (RESEARCH.md:113). Limits: one prompt per day, quiet hours, per-gym opt-out (:117).
- **Escobar:** recommends a gym from the user's budget, goal and schedule, and prepares a session using that gym's equipment (:51; RESEARCH.md:133-142).
- **Later:** an "unlisted gym" path, gym-owner rate submissions, user corrections and community reports (RESEARCH.md:35, :77; DATA-SOURCES.md:67).

## 2. Data

| Item | Proposed source / recipient | Cite |
|---|---|---|
| Map | First candidate is Google Maps. The prototype uses OSM geometry from one Overpass query. The public OSM tile server is ruled out for production. | RESEARCH.md:83, :91; MAP-SOURCE.md:5-13 |
| Place listings, hours, phone | Google Places (Nearby Search returns at most 20 results), with Foursquare as the alternative | RESEARCH.md:41-46, :91 |
| Rates | A server-side pipeline: find the branch's official domains and social accounts → fetch pages, PDFs and posts → extract text or OCR → validate → human review → shared cache for each branch | DATA-SOURCES.md:19-34; RESEARCH.md:59-79 |
| Photos | Google Place Photos. Photo names expire and may not be cached. Website and social images are linked, not mirrored. | RESEARCH.md:55 |
| Equipment | The user's own gym profile only | DATA-SOURCES.md:13 |

- **Stored on the phone (proposed):**
  - a place ID linked to an internal gym ID
  - reminder on/off settings and geofence registrations
  - short-lived visit-event evidence
  - bookmarked gyms ("saved" set, source.html:218)
  - a generation marker for reset and restore
  - No continuous route history (RESEARCH.md:156-160).
  - Google's terms allow keeping place IDs indefinitely and caching coordinates for up to 30 days (RESEARCH.md:85).
- **Sent off the phone:**
  - search centre, typed area and viewport go to the map/places provider (RESEARCH.md:158)
  - branch lookups go to a new backend rate service (DATA-SOURCES.md:51-61)
  - a gym name or an inferred visit going to Escobar is named as a separate sharing decision (RESEARCH.md:140)
  - Workout history must not go to pricing sources (DATA-SOURCES.md:71).
- **Refresh:** driven by expiry, age, demand and source changes, within budgets. A failed fetch never moves the "last successful check" date forward. No "live prices" claim (DATA-SOURCES.md:63-65).
- **Costs:**
  - Google list prices: Nearby Pro $32 per 1,000 calls (5,000 free), Details Enterprise $20 per 1,000 (1,000 free), Photos $7 per 1,000, Dynamic Maps $7 per 1,000. A sample month comes to **$303** (RESEARCH.md:166-168).
  - **The rate pipeline has no cost estimate at all** (crawling, OCR or AI extraction, backend storage, human review).

## 3. Permissions and native work

- **Foreground location for browsing:** works without background access. Approximate-only and denied must still be usable (RESEARCH.md:146, :190).
- **Background location for reminders:** needs Play's core-functionality review, a prominent disclosure and a declaration. The research itself says convenience alone may not be approved (RESEARCH.md:146).
- **Notifications:** Android 13+ runtime permission (RESEARCH.md:148). POST_NOTIFICATIONS already exists (patch_manifest.py:23).
- **Native geofencing:** Android recommends a 100-150 m radius and events can arrive minutes late (RESEARCH.md:99). Needs reboot re-registration, stale-tap checks, and duplicate and generation handling (FEATURES-AND-LOGIC.md:59; RESEARCH.md:115, :160). Neither a PWA nor Capacitor's standard Geolocation plugin can do this in the background (RESEARCH.md:150).
- **Today on main:**
  - ACCESS_FINE_LOCATION is capped at SDK 30, for Bluetooth only (native/patch_manifest.py:45).
  - The privacy policy says "the app does not use your location" (docs/PRIVACY-POLICY.md:15).
  - No geolocation, maps or d3 package is installed (package.json dependencies).
  - The notification tap bridge passes only the notification type (RESEARCH.md:18).

## 4. Prototype vs description

**Built in the prototype** (source.html:192-275):
- a fixed SVG map drawn with d3 from embedded OSM data, with no pan or zoom (:232-250, fitExtent at :239)
- 3 fixture gyms (:215-217)
- pin and list selection, a text filter over the fixtures (:259), and a bookmarks filter
- compact and expanded sheet, and a theme switcher using the real catalogue snapshot, with a contrast-safe button fill (`textSafeFill`)
- the Escobar entry screen
- "Train here", Directions, Call and Rate sources open explanation dialogs only (:262-265)
- the reminder toggle is an in-memory flag with a toast "No location access" (:266)

**Described only:**
- live provider data and real search
- the rate pipeline and backend
- photos
- linking to the 8 personal gyms
- real Train here, Call and Directions
- geolocation and geofencing
- Escobar logic
- persistence

`persist` writes to `window.openai.setWidgetState`, and `Tweak` is a hook from the preview host. These are ChatGPT widget-runtime APIs, not M/arc (:198, :224, :227). d3 and lucide come from a CDN (:189). Status text such as "Open · Until 10 pm" and "Checked 1 Oct" is hard-coded (:24, :229).

## 5. Weaknesses

**Conflicts with owner rules**
- **LR-23 (no contacts, links or sources in the UI; COACHING-DECISIONS.md:1168-1171):** the proposal is built around exactly these:
  - a "Rates/Sources" button and dialog (source.html:21, :24, :262)
  - a "Gym website · Checked 1 Oct" line (:24)
  - a phone number plus a Call button (:25)
  - a Website action (RESEARCH.md:30)
  - "show the rate… source link" (RESEARCH.md:66; DATA-SOURCES.md:28)
  - "cites business facts" (QA.md:23)

  Map attribution (source.html:17) is required by the ODbL or Google licence, not by Google Play. It falls outside LR-23's only exception, so it needs an explicit owner ruling.
- **UI copy rule (AGENTS.md:14 on main):**
  - "Ask before starting a workout" (source.html:26)
  - "Nearby gyms, rates and your next session" (:36)
  - toast "Save a gym to see it here" (:258)
  - heading "What to do next" (:34) is a "What…" heading, which the rule bans
- **New saved and sent data, no owner yes recorded:**
  - place links, bookmarks, reminder settings, geofences and the rate cache
  - location and viewport going to Google, and lookups going to a new backend
  - Today's Gym has only `id, name, defaultUnit, createdAt` (models.ts:51).
  - The privacy policy and the Play Data safety form both change.
- **Paid services, no owner yes:** a Google Maps billing account, plus an unpriced backend with crawling and OCR. The docs admit nothing is approved (RESEARCH.md:162; DATA-SOURCES.md:73).
- **Supervisor-owned files:** patch_manifest.py and package.json would change for location permissions, a maps SDK and a geolocation dependency.

**Contradictions**
- **Map vs provider:** the owner-reviewed look is a custom OSM/d3 map. But Google Places results must be shown on a Google map (RESEARCH.md:85; DATA-SOURCES.md:17). So the design as shown cannot be built on the recommended provider. It would need Google Maps with a per-theme style. That restyle is not specified, and THEME-INTEGRATION.md:50 says no production map style was validated.
- **"Save" means two things:** a link to a training gym (FEATURES-AND-LOGIC.md:16), and also a separate bookmark list with a filter (source.html:9, :218, :257). The second is another new kind of saved data.
- **Social sourcing:** "unauthorized automated collection violates [Meta's] terms", yet "this does not remove social sourcing from the product scope" (RESEARCH.md:75). No legal access route is identified.
- **Fixture data:** fictional names (Forma, District Barbell, Northline) sit on the real OSM coordinates of Fitness First, Gold's Gym and Anytime Fitness (source.html:215-217 vs MAP-SOURCE.md:23-25). This breaks MAP-SOURCE.md:27, "keep illustrative details visibly separate".

**Unverified or missing**
- **No coverage benchmark, no provider test, no Play eligibility check** (RESEARCH.md:93, :225). The rate pipeline's accuracy and coverage are unknown.
- **Human review step has no owner:** "review ambiguity/conflicts" and "review uncertain posters" (DATA-SOURCES.md:27; RESEARCH.md:71). It is an ongoing operations cost for a solo owner.
- **No Google Play services:** Google Maps SDK and Android GeofencingClient need them. Devices without them are only a test row (RESEARCH.md:152). The owner's ecosystem includes a Huawei watch (AGENTS.md ownership table). Whether the owner's phone has Google Play services: not verified.
- **Old snapshots:** research was done on `d5ebc771`, theme on `dbd33b92`, base `3d3e4e11`. Main is now `f1e514a5`. It depends on audit fixes ENG-01, UI-R06, IMP-E04 and IMP-N01 (RESEARCH.md:129); their status: not verified.
- **Unnamed hook:** Escobar's existing `propose_gym` tool (src/escobar/tools/actions.ts:360) is the natural integration point, but the Gym Finder docs never name it.
- **Unsafe rendering pattern:** the prototype builds UI with `innerHTML` string assembly (source.html:223, :231, :250). The docs acknowledge this must not be reused (FEATURES-AND-LOGIC.md:35).
- **PR #158 state:** not verified (`gh` returned nothing).

**Scope creep and build risk**
- The plan is several projects at once:
  - a maps SDK
  - a places backend
  - a web, social and OCR price-extraction service with review
  - native geofencing
  - Escobar integration
  - gym-owner submissions
- The spec runs to 14 acceptance rows (QA.md:11-26) and about 30 QA scenarios (RESEARCH.md:188-219). The rate pipeline alone carries the highest legal, cost and accuracy risk.
- The background-location reminder has the highest Play-rejection risk and the lowest value per unit of effort.
- The docs repeat each other heavily (RESEARCH, FEATURES and DATA-SOURCES restate the same rules).

## 6. Five strongest ideas to keep

1. **Keep "found gym" separate from "training gym".** A found gym takes no slot until the user explicitly links it. No silent eviction at the 8-gym cap, no ID reuse, and old sets are never relabelled to another gym (FEATURES-AND-LOGIC.md:39, :47; RESEARCH.md:125-127).
2. **Browsing never changes training.** Map taps, arrivals and reminder taps never create sets or sessions. "Train here" goes through the existing setup and respects a running session (FEATURES-AND-LOGIC.md:49; RESEARCH.md:113).
3. **Honest unknowns for business data.** Unknown hours are not "closed". A missing price is not free. A first-month deal is not the monthly price. "Last attempted" and "last successful" checks are separate dates (FEATURES-AND-LOGIC.md:43; DATA-SOURCES.md:47, :65).
4. **Cost and race controls:** a "Search this area" button instead of searching on every move, cancelling outdated requests by version ID, Places field masks, details fetched only on demand, and a spending cut-off on the server (FEATURES-AND-LOGIC.md:41; RESEARCH.md:170-172).
5. **Theme-token map plus a list as an equal path.** Separate geographic tokens so map colours don't collide with the muscle-map tokens. The camera stays put when the theme changes. The contrast fix for Paper's buttons goes into the shared button token. A full list view and screen-reader labels mean the map is never the only way to choose a gym (THEME-INTEGRATION.md:24-32, :48; RESEARCH.md:35).