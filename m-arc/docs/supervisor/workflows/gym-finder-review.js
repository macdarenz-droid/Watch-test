export const meta = {
  name: 'gym-finder-review',
  description: 'Analyse the Gym Finder proposal (#158), map it onto the M/ARC codebase, research constraints, then red-team the integration plan',
  phases: [
    { title: 'Understand', detail: 'proposal, codebase fit, external constraints (parallel)' },
    { title: 'Red team', detail: 'adversarial review of the supervisor draft plan' },
  ],
}

// Gym Finder review (10-01): three read-only agents in parallel on PR #158 (proposal, codebase fit, external constraints). No args.
// Its returns were saved as docs/research/gym-finder/gf-0.md, gf-1.md and gf-2.md. The owner PARKED Gym Finder at 07:30: do not rerun without his approval.

const COMMON = `You work in macdarenz-droid/M-arc (repo checked out at /home/user/M-arc; run git fetch first). Read only. Never edit, commit, push, comment on GitHub or start sessions. The Gym Finder proposal is on branch claude/gym-finder-handoff-2026-10-01 (PR #158, files docs/gym-finder/** plus docs/research/user-adaptation-research.md and docs/research/escobar-evolution-research.md); read files with "git show origin/claude/gym-finder-handoff-2026-10-01:<path>". Main is origin/main. Be precise: cite file:line or URL for every claim; say "not verified" when you could not check something. Return dense markdown, no preamble, at most ~1800 words.`

phase('Understand')
const [proposal, codebase, external] = await parallel([
  () => agent(`${COMMON}
TASK: understand the Gym Finder proposal fully and critically.
Read README.md, FEATURES-AND-LOGIC.md, DATA-SOURCES.md, RESEARCH.md, QA.md, THEME-INTEGRATION.md, TASK.md, prototype/MAP-SOURCE.md, and skim prototype/source.html (the logic, not the CSS). Skim the two docs/research files only for parts that touch Gym Finder.
Return:
1. What the feature is, in plain words, and every user-facing capability it proposes (map, pins, sheets, search, rates, reminders/geofence, Escobar entry, workout/gym linking, calls/directions, etc.).
2. Data: every data source and provider proposed (map tiles, places, rates, social/website sourcing), what is stored on the phone, what is sent off the phone and to whom, refresh cadence, costs named.
3. Permissions and native work proposed (location foreground/background, notifications, geofencing).
4. What the prototype actually implements vs what is only described.
5. Weaknesses: unverified claims, missing pieces, contradictions, scope creep, things that would be hard or risky to build, and anything that conflicts with the owner rules in AGENTS.md (LR-23: no contacts, links or sources in the app UI unless Google Play requires them; no new kinds of saved or sent user data without the owner's yes; no paid services without the owner's yes; the UI copy rule: no explaining text, headings are 1-3 word labels).
6. The 5 strongest ideas in it worth keeping.`, { label: 'proposal', phase: 'Understand' }),

  () => agent(`${COMMON}
TASK: map how a Gym Finder feature would fit the CURRENT app on origin/main without breaking it.
Read AGENTS.md (file ownership, owner-only items), src/app/App.tsx and src/main.tsx (routing, tabs, lazy loading), src/core/models.ts, src/core/store.ts and src/core/migrate.ts (saved-data shape, versioning, migrations, backup/restore in src/slices/settings/backup.ts), the existing gym concept (grep -rn "gym" src --include=*.ts --include=*.tsx -il; especially Settings/Gyms.tsx, equipment profiles, units per gym, how the active gym is chosen in Train), the theme engine (src/ui/styles.css tokens, how themes are defined, how many), src/escobar (how coach tools are declared, e.g. get_overview, and what data is sent to the Worker), escobar-worker/ (routes, how keys and quotas work, deploy rule), native/ and scripts/prepare-android.sh + native/patch_manifest.py (how Android permissions and Capacitor plugins are added; which permissions exist today), package.json dependencies (is any map library present?), the CI gates (.github/workflows, scripts/screenshot-gate.mjs structure: add-only blocks per task, budgets in tests/howto/budgets.json), the CSP or network rules in index.html/capacitor config, docs/PRIVACY-POLICY.md and docs/PLAY-SUBMISSION.md (Data safety answers that a location feature would change).
Return:
1. The integration points a Gym Finder would need, each with exact files and what changes there (additive vs modifying).
2. The existing "gym" model: what it stores today, and how a found gym could link to it without a breaking schema change.
3. Saved-data impact: which new fields/collections, and the migration and backup/restore implications.
4. Network/CSP, native permission, Worker and dependency impact, with the owner-approval items each one triggers per AGENTS.md.
5. Collision map against the open PRs and lanes (list open PRs with "gh"-free means: use git branch -r and the PR titles in git log, or read docs/supervisor/HANDOVER.md on origin/main section 8). Which files are hot right now.
6. Bundle-size and performance constraints (lazy chunks, budgets) a map library would hit.
7. Test and gate patterns a new feature must follow here (unit tests, gate blocks, theme checks in 5 themes, tz tests).`, { label: 'codebase-fit', phase: 'Understand' }),

  () => agent(`${COMMON}
TASK: research the external constraints for a gym finder inside a free Android fitness app (Capacitor WebView app, users mainly in the Philippines and Australia, published on Google Play, solo developer, very low budget). Use web search and fetch primary sources (official docs and policies). Cover:
1. Places data: Google Places API (New) pricing tiers and free usage in 2026, its terms on caching/storing place data (what may be stored and for how long, place_id rules, attribution), and alternatives: OpenStreetMap/Overpass (usage policy, ODbL obligations if we store or show data), Foursquare Places, Mapbox, HERE. For each: cost at roughly 1k, 10k and 100k monthly active users, data quality for gyms in PH and AU (say if unverified), and whether a key must be hidden behind a server.
2. Map display: tile providers' usage policies (OSM's tile usage policy forbids heavy app use; alternatives such as MapLibre with a paid or free tile host, Protomaps PMTiles), offline options, and the cost.
3. Gym prices/rates: is automated collection from gym websites or Facebook/Instagram pages allowed (Meta's terms on automated data collection, robots.txt, PH and AU law at a high level)? What legitimate options exist (gym-submitted data, user-submitted with moderation, manual curation, partner API)?
4. Google Play policy for location: foreground vs background location, the prominent disclosure and permission declaration form for background location, geofencing requirements, and the Data safety form changes. Android 13/14 notification and location-permission rules.
5. Privacy law basics for location data in PH (Data Privacy Act 2012) and AU (Privacy Act 1988, APPs): is precise location sensitive, what consent and disclosure are needed.
6. What successful apps do (e.g. ClassPass, Hevy, Strava, gym chains' own apps): which gym-finder features users actually use; anything showing that rate comparison or arrival reminders matter.
Give a clear recommendation per area with the cheapest compliant option, and list the owner-approval items (paid service, new sent data, new saved data).`, { label: 'external-constraints', phase: 'Understand' }),
])

return { proposal, codebase, external }
