# Gym Finder: supervisor draft plan (to be red-teamed)

## Product scope v1 ("Find → Link → Train")
- New panel 'gym-finder' (router.ts PanelId + App.tsx Panels case, lazy chunk src/slices/gymfinder/lazy.tsx like howto/lazy.tsx). Five tabs unchanged.
- Entry points: Train "Where are you training?" sheet gets a "Find a gym" button; Settings › Gyms row; Escobar palace registry entry so the coach can open it. Escobar's existing propose_gym tool is reused; no new Worker tool in v1.
- List view first (equal path, offline fallback), then a map view. Search by gym name/area typed by the user, on the device.
- Gym details: name, chain, address, opening hours only if the source has them (unknown ≠ closed), "Directions" hands off to the phone's maps app via a geo: intent with coordinates. No phone number, website, social or source link in the UI (keeps LR-23 as is; owner may widen it later).
- Link: "Use as my gym" links a found gym to an existing training gym or creates one within the 8-gym cap (never evicts). "Train here" = setActiveGym + existing startSession path; never changes a live workout's gym.
- Out of v1: automated rate scraping, social sourcing, background geofence reminders, Google Places, gym-owner submissions.

## Data
- Catalogue: static country files (PH, AU) built monthly by an offline script tools/gymfinder/build-catalogue.mjs from ONE open source per region (Overture Places first choice; OSM fallback if we accept ODbL share-alike for the gym list). Compact JSON {schema, builtAt, license/attribution, gyms:[{id, name, chain?, lat, lon, address?, hours?}]} gzipped.
- Hosting: Cloudflare R2 public bucket (same Cloudflare account as the Worker; free tier). The app downloads a country file only when the user opens Gym Finder and picks/has a country; cached in IndexedDB with ETag; works offline after first download.
- Search, distance sort and filtering happen on the phone. No location or query leaves the phone in v1 (only the country file request: IP + which file).
- Map: MapLibre GL JS (new dependency, lazy chunk ~275 KB gz) with vector tiles from a self-hosted Protomaps PMTiles extract (PH + AU) on R2; OpenFreeMap as a fallback only with owner approval (it would see viewports). Style built at runtime from the 5 theme tokens (no new ThemeTokens fields), attribution shown as the licence requires.
- Service worker: the map chunk and the catalogue are excluded from install precache (sw-version.mjs), fetched on first use.
- Rates (v1.1, optional): owner-curated JSON for top chains in launch cities: plan, amount, currency, period, conditions, "checked on" date; hidden automatically after 90 days stale. No source links shown.

## Saved data (owner approval needed)
- One optional field on Gym: place?: { provider: 'overture'|'osm'; id: string; label?: string }. normalizeUnits validates and keeps it; no store version bump (version stays 1); backup round trip keeps it; restore follows AUD-4's restoredState; reset wipes it. The place is never sent in the coach brief (brief.ts sends the gym name only; the user can rename).
- Nothing else saved: no coordinates, no visit history, no search history.

## Location (v1.2, optional)
- "Near me" with approximate (coarse) foreground location, processed on the phone only. Needs ACCESS_COARSE_LOCATION in native/patch_manifest.py (supervisor file; check the PL-16 maxSdk cap loop does not cap it), permission flow with a decline path, privacy policy + Play Data safety update. Without permission the typed search still works.

## Fixes it depends on
- Train.tsx gym inference (module-level gymInferred; inferGym on first mount) can override a gym the user just chose in the finder: add an explicit-choice flag; test fails before, passes after.
- Improvement-audit gym findings ENG-01, UI-R06, IMP-E04, IMP-N01 (#149) merge first.

## Cards (one lane, serial where files overlap; all start after the owner's finish line and #149's gym findings)
- GF-0 Owner decisions: LR-23 scope for the listing card; Gym.place saved field; MapLibre dependency; R2 hosting; launch countries; rates curated or none.
- GF-1 Coverage benchmark (research only): Overture vs OSM vs a manually verified gym list in Makati, Cebu City, Sydney, Parramatta; PMTiles extract size for PH+AU at z0-15. Go/no-go for open data.
- GF-2 Catalogue builder + R2 upload workflow (tools/gymfinder/**, a new .github workflow added by the supervisor; R2 token is an owner secret).
- GF-3 Panel skeleton: route, lazy chunk, list + search on a fixture catalogue, Escobar palace entry, entry buttons, feature flag (hidden until GF-5 passes). Unit tests (search, stale-request race), gate block GF-3 (5 themes, 320/360/390 px, contrast, 44 px targets, no horizontal scroll), network stubbed.
- GF-4 Map view: MapLibre lazy chunk, themed style from tokens, attribution, "Search this area", list/map toggle, budget entry for the new chunk, gate block with a local PMTiles fixture.
- GF-5 Link and Train here: Gym.place field + normalizeUnits + backup/restore tests, 8-cap UX, explicit-choice fix for inferGym, Directions geo: intent. Flag on.
- GF-6 (optional) Near me: coarse location, permission, policy and Data safety, device checks.
- GF-7 (optional) Curated rates.

## Isolation rules
- All feature code in src/slices/gymfinder/** and tools/gymfinder/**; shared files touched only at named lines (router.ts, App.tsx, Train.tsx gym sheet + inferGym flag, Gyms.tsx row, palace registry, models.ts/escobarState.ts for Gym.place, sw-version.mjs, patch_manifest.py in GF-6). New gate blocks add-only. No edits to other tasks' blocks. Behind a flag until GF-5.
- Each card merges to main through the normal builder → reviewer → CI gate; no long-lived integration branch.

## Cost
- v1 running cost $0/month (open data, R2 free tier, no API keys). Google Places path ~$40/mo at 1k MAU, ~$1,060 at 10k, ~$10,780 at 100k (rejected for v1).

## Sequencing advice
finish line (HT M1 + 32 audit) → improvement audit (#149, includes the 4 gym findings) → library How-to → Play release → Gym Finder v1. Reason: a location permission and new data flows complicate the first Play review; launch with fewer permissions.
