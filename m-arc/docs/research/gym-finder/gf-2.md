**External constraints research: Gym Finder (PR #158), checked 2026-10-01**

## Headline findings
- **Google Places can't share a map with OSM.** Service Terms §14.2 says: "Customer must not use Google Maps Content from the Places API in conjunction with a non-Google map" (https://cloud.google.com/maps-platform/terms/maps-service-terms). If we use Google data, we must use a Google map. The proposal leaves this open (DATA-SOURCES.md:17).
- **Google caching is very limited.** Only `place_id` may be kept indefinitely (https://developers.google.com/maps/documentation/places/web-service/policies; Service Terms §3). Latitude and longitude may be kept for 30 days (§14.3). Nothing else may be kept, so the proposal's shared server cache (DATA-SOURCES.md:32) can't hold hours, phone or name from Google.
- **Automated collection of Facebook and Instagram rates is forbidden without Meta's written permission.** This blocks the social-post part of the rate pipeline (DATA-SOURCES.md:21-36, RESEARCH.md:75).
- **Background arrival reminders are a high Play-rejection risk.** Play lists "convenience" as a *minimal* benefit (https://support.google.com/googleplay/android-developer/answer/9799150).
- **A free, keyless option exists.** Open POI data (Overture, FSQ OS, OSM) served as static country files, plus MapLibre and OpenFreeMap, costs $0 at every scale and needs no API key.

## 1. Places data

Cost model (my assumption, an upper bound): every monthly active user (MAU) runs 2 area searches and opens 3 gym cards per month. Prices in USD per 1,000 calls.

| Provider | Price basis | 1k MAU | 10k MAU | 100k MAU | Key hidden behind a server? |
|---|---|---|---|---|---|
| **Google Places (New)**: Nearby Search Pro for the markers; Place Details Enterprise for hours, phone and website (field tiers: https://developers.google.com/maps/documentation/places/web-service/data-fields) | Nearby Pro: 5,000 free, then $32, then $25.60 above 100k. Details Enterprise: 1,000 free, then $20, then $16 (https://developers.google.com/maps/billing-and-pricing/pricing) | **~$40/mo** | **~$1,060/mo** | **~$10,780/mo** | Yes. Google's own guidance says to use a proxy for web-service calls from mobile (https://developers.google.com/maps/api-security-best-practices). The Maps SDK key can stay in the app if restricted to the package. |
| **Foursquare Places API** | Pro: 0–500 calls free, then $15, then $12. Premium (hours, website, phone, photos, rating): $18.75 from the first call, then $15 (https://foursquare.com/pricing/) | ~$79 | ~$855 | ~$7,570 | Yes (any bearer key in an APK can be extracted) |
| **Mapbox Search Box** | 50,000 requests free, then $1 (https://www.mapbox.com/pricing) | $0 | ~$0 | ~$150–450 (depends on whether card lookups are billed as requests; not verified) | Not verified. Storage rights also not verified. |
| **HERE Discover/Browse** | 5,000 free, then $2.75 (search snippet dated April 2026; the primary page failed with a TLS error and a 503, so **not verified**) | ~$0 | ~$41 (searches only) | ~$536 or more | Not verified |
| **Static open data**: Overture Places (CDLA-Permissive-2.0, sources include Meta, Microsoft, FSQ and AllThePlaces; https://docs.overturemaps.org/attribution/), FSQ OS Places (Apache 2.0) and OSM extracts | Monthly releases. Files hosted on Cloudflare R2, whose free tier is 10 GB-month storage, 10M reads/month and free egress (https://developers.cloudflare.com/r2/pricing/) | $0 | $0 | $0 | No key at all |

**Coverage for gyms in PH and AU:**
- OSM `leisure=fitness_centre` counts, measured by one Overpass count query at 2026-10-01T03:35:43Z: **PH 781, AU 2,683**. The real number of gyms in each country is not verified, but PH looks thin.
- FSQ OS has `tel`, `website`, `facebook_id`, `instagram`, `date_refreshed` and `date_closed`, but **no opening hours** (https://docs.foursquare.com/data-products/docs/places-os-data-schema).
- Overture has websites, socials, phones, brand and confidence, but no hours listed (https://docs.overturemaps.org/guides/places/).
- Gym coverage for Google, FSQ, Overture, Mapbox and HERE in PH and AU: **not verified**. No benchmark has been run.

**OSM rules:**
- The public Overpass server is not usable for an app. Its policy: for regular use, "less than 100 queries … less 10 MB … per day", and "Commercial use should use self-hosted or paid Overpass servers" (https://wiki.openstreetmap.org/wiki/Overpass_API).
- Nominatim (OSM place search) allows 1 request per second at most, bans autocomplete, and counts all users of an app together (https://operations.osmfoundation.org/policies/nominatim/).
- ODbL licence: "If you alter or build upon our data, you may distribute the result only under the same license" (https://www.openstreetmap.org/copyright).
- Merging and de-duplicating OSM gyms with another gym list is **not** a "Collective Database", so share-alike would apply to the merged list. A separate rates table of our own, linked to OSM IDs, can stay ours (https://osmfoundation.org/wiki/Licence/Community_Guidelines/Collective_Database_Guideline_Guideline).

**Recommendation:**
- Use a static gym catalogue: one country file each for PH and AU, built monthly from **one** POI source per region so licences don't mix.
- Overture is the first choice, because it includes the chain store-locator data from AllThePlaces. OSM-only is the fallback if we accept publishing the gym list under ODbL.
- Search on the device. Add Google only if a coverage benchmark shows the open data fails. That would be a paid service with server-side keys, a Google map, and no reuse of cached content.

## 2. Map display
- **OSM standard tiles:** normal interactive use is allowed, but there is "no SLA or guarantee", access may be blocked "without notice", and "Offline use is not permitted on tile.openstreetmap.org". Apps must send their own User-Agent and must be able to switch the tile URL without an app update (https://operations.osmfoundation.org/policies/tiles/). Not a sound base for a Play app.
- **OpenFreeMap:** free, no request limits, no key, commercial use allowed, no SLA. Attribution line: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" (https://openfreemap.org/).
- **Protomaps PMTiles (self-hosted):**
  - The planet file is about 120 GB for zoom 0–15. `pmtiles extract --bbox/--region --maxzoom` cuts out a region (https://docs.protomaps.com/basemaps/downloads, https://docs.protomaps.com/pmtiles/cli).
  - Host it on R2: within the free tier only if the PH+AU extract is under 10 GB (extract size not verified).
  - Offline maps are possible with self-hosted vector tiles (OSM tile policy, §8 note).
- **MapTiler free plan:** no commercial use, 5k sessions, and service pauses when over the limit. Cheapest paid plan (Flex) is $30/month (https://www.maptiler.com/cloud/pricing/).
- **Mapbox:** mobile SDK free up to 25k MAU, GL JS free up to 50k map loads, vector tiles free up to 200k requests (pricing page above).
- **Google map:** the native Maps SDK is free with unlimited use (pricing page). The Capacitor plugin draws the native map *behind* the WebView, so the whole DOM must be transparent (https://ionic.io/blog/all-the-layers-of-capacitor-google-maps). That is a regression risk for the app's themed UI. It also needs Google Play services: risk on Huawei phones without Google services, not verified for our users. The JS map (Dynamic Maps) is free for 10k loads, then $7 per 1,000.
- **Recommendation:**
  - Use MapLibre GL JS with OpenFreeMap, with the style URL set remotely so it can be switched without an update.
  - Keep a Protomaps PH/AU extract on R2 as the fallback and offline path. Cost $0.
  - Load MapLibre lazily: a local copy measures about 1.06 MB minified (version not checked). Adding it is a new dependency, which needs supervisor approval.

## 3. Gym rates
- **Meta:**
  - Facebook Terms §3.2(3): "You may not access or collect data from our Products using automated means (without our prior permission)" (https://www.facebook.com/legal/terms).
  - Automated Data Collection Terms: "express written permission" is required, and scrapers must "comply with Meta's robots.txt" (https://www.facebook.com/apps/site_scraping_tos_terms.php).
  - Instagram Terms text could not be read: **not verified**.
- **Gym websites:**
  - robots.txt rules "are not a form of access authorization" (RFC 9309, line 100). They are an opt-out signal; each site's terms also apply.
  - PH: RA 10175 §4(a)(1) makes access "without right" a crime, where "without right" means "without or in excess of authority" (https://lawphil.net/statutes/repacts/ra2012/ra_10175_2012.html). Public pages that need no login are probably low risk, but this is not verified by a lawyer.
  - AU: the computer-crime and consumer-law angles were not fetched (**not verified**). A stale price shown as current could be a misleading-price problem.
  - The 2023 joint statement on data scraping by the OAIC and 11 other regulators covers personal information; the PH privacy regulator did not sign it (https://www.oaic.gov.au/newsroom/global-expectations-of-social-media-platforms-and-other-sites-to-safeguard-against-unlawful-data-scraping).
- **Legitimate options, cheapest first:**
  1. The owner curates rates by hand for the top chains from their public pricing pages, each with a "checked on" date.
  2. User-submitted rates ("seen on [date]"), shown only after 2 matching reports or moderation.
  3. Gym-submitted rates through a claim form, verified by an email from the gym's domain or a phone call.
  4. Partner API: none found for PH or AU (not verified).
- **Recommendation:** drop automated crawling and OCR from v1. Ship option 1, then option 2. Always show the date of the last check.

## 4. Google Play and Android
- **Foreground location:**
  - Approximate location (`ACCESS_COARSE_LOCATION`, about 3 km²) is enough for "gyms near me", and the app must work if the user grants only approximate location (https://developer.android.com/develop/sensors-and-location/location/permissions).
  - Today precise location is capped at SDK 30, only for Bluetooth (`native/patch_manifest.py:45`, a supervisor-owned file). The change must not break `native/watch/WatchBridgePlugin.java:39`.
- **Geofencing (arrival reminders):**
  - Needs precise location **and** `ACCESS_BACKGROUND_LOCATION`.
  - Limits: 100 geofences per app, a minimum radius of 100–150 m, alerts delayed about 2–6 minutes, and re-registration after every reboot (https://developer.android.com/develop/sensors-and-location/location/geofencing).
  - A foreground service of type location would also need `FOREGROUND_SERVICE_LOCATION` and a Play Console declaration (https://developer.android.com/about/versions/14/changes/fgs-types-required). My reading is that Play-services geofencing doesn't need such a service (not verified).
- **Play background-location policy (9799150):**
  - Allowed only for a "significant benefit … relevant to the core functionality".
  - "Minimal user benefits may include … convenience."
  - Requires the Permissions Declaration Form plus a video of 30 seconds or less.
  - The in-app disclosure must name "location" and use words like "even when the app is closed or not in use".
  - Disclosure rules (https://support.google.com/googleplay/android-developer/answer/11150561): shown in the app right before the permission request, with a way to decline, readable at a 13-year-old's reading level.
- **Notifications:** Android 13+ needs the runtime notification permission (https://developer.android.com/develop/ui/views/notifications/notification-permission).
- **Data safety form (https://support.google.com/googleplay/android-developer/answer/10787469):**
  - Data "only processed locally … does **not** need to be disclosed".
  - Location sent off the device but used only in memory, like the weather-lookup example, counts as "ephemeral": it is entered in the form but not shown on the store listing.
- **Recommendation:**
  - v1 uses approximate, foreground-only location, processed on the device.
  - No geofencing. Use reminders at the user's planned workout time instead, plus an "At [gym]?" check when the app is opened.
  - The privacy policy currently mentions location only for Bluetooth (`docs/PRIVACY-POLICY.md:15`), so it must be updated.

## 5. Privacy law
- **PH (Data Privacy Act 2012):**
  - "Personal information" (§3(g)) covers location. The "sensitive personal information" list (§3(l)) does not include location but does include **health** (https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html).
  - So linking gym visits to workout history raises the stakes.
  - Secondary source: the privacy regulator has said implied consent is invalid (https://digitalpolicyalert.org/event/22441-adopted-npc-advisory-opinion-no-2017-63-on-personal-and-sensitive-information). Not checked against the primary text.
- **AU (Privacy Act 1988):**
  - Phone location is personal information, but location is not "sensitive information" (https://www.oaic.gov.au/privacy/your-privacy-rights/your-personal-information/what-is-personal-information).
  - Businesses with turnover of $3M or less are exempt *unless* they are a health service provider (https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business).
  - Whether a fitness app counts as a health service: **not verified**. Act as if covered: a privacy policy (APP 1), notice at collection (APP 5), and security (APP 11).
- **Cheapest compliant design:** location never leaves the phone. Then nothing new is collected in either country.

## 6. What successful apps do
- **ClassPass** operates in Manila as a booking marketplace with prices supplied by partners, i.e. gym-submitted data (https://classpass.com/partners/lists/manila-fun-and-exciting/).
- **PureGym**'s app focuses on the member's own gym, with a live "how busy" tracker (https://www.puregym.com/help-centre/inside-our-gyms-1149046b/our-facilities-3b4d2233/how-do-i-check-how-busy-my-gym-is-4d35f439).
- **AU price interest is real:** Canstar Blue's survey of 1,300+ gym-goers puts the average at $77/month (https://www.canstarblue.com.au/health-beauty/average-gym-cost/). This is editorial, not a live per-gym comparison.
- **Reminders:** the Milkman/Duckworth 24 Hour Fitness megastudy (61k members, 53 interventions) found that a planned workout plus a text **30 minutes before the planned time** plus tiny rewards gave +9% visits, and a bonus for returning after a miss gave +27% (https://penntoday.upenn.edu/news/wharton-study-best-ways-boost-workout-habits).
- **Arrival reminders:** no primary evidence found that they improve retention. My inference: they help logging a workout, not showing up.
- **Hevy and Strava gym features:** not verified.

## Supervisor advice
The proposal's two most expensive parts, automated rate sourcing from websites and social posts and background arrival detection, are also the riskiest and have the weakest evidence. Ship v1 as:
- a static Overture or OSM catalogue on MapLibre with OpenFreeMap;
- approximate foreground location, processed on the phone;
- Directions, Call and Website buttons;
- "Save gym" and "Train here" linked to the existing gym records;
- curated rates with dates.

Running cost about $0, no keys, no new data sent. Run a coverage benchmark first (Makati, Cebu City, Sydney and Parramatta: open data against a manually checked gym list). Add Google only if that benchmark shows the open data fails.

## Owner-approval items
1. **Paid service:** Google Places, Foursquare, HERE or Mapbox if the benchmark fails (about $1k/month at 10k MAU for Google).
2. **Sent data:** location or search area sent to any provider or server (none in the recommended design).
3. **Saved data:**
   - links between saved gyms and catalogue IDs (`src/core/models.ts`);
   - user-submitted rates and their moderation records;
   - gym claim records.
4. **New dependency:** MapLibre GL JS in `package.json`, which needs the supervisor's OK.
5. **Shared files:** the location permission change in `native/patch_manifest.py`, and the privacy policy and Data safety form updates.
6. **Background location:** declaration form and video, if arrival reminders are ever revived.