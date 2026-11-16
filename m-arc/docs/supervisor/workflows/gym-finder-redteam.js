export const meta = {
  name: 'gym-finder-redteam',
  description: 'Red-team the supervisor draft plan for adding Gym Finder to M/ARC',
  phases: [{ title: 'Red team', detail: 'one adversarial reviewer attacks the draft plan' }],
}

// Gym Finder red team (10-01): one adversarial agent attacks the supervisor's draft plan. No args. Its return is docs/research/gym-finder/gf-redteam.md.
// The owner PARKED Gym Finder at 07:30: do not rerun without his approval.
phase('Red team')
const SP = 'origin/main:docs/research/gym-finder'
const r = await agent(`You are the RED TEAM for a plan. Your only job is to break it before anything is built. Read only: never edit, commit, push or comment anywhere.
Read each file below with "git show <ref>:<path>" after git fetch. The draft plan: ${SP}/gf-draft-plan.md. Background reports: ${SP}/gf-0.md (the proposal's analysis), ${SP}/gf-1.md (how it fits the codebase), ${SP}/gf-2.md (external constraints research). The repo is checked out at /home/user/M-arc (run git fetch; origin/main is current; the proposal is on origin/claude/gym-finder-handoff-2026-10-01 under docs/gym-finder/). Read AGENTS.md for the owner rules (LR-23 no contacts/links/sources in app UI unless Google Play requires; no new saved or sent user data without the owner's yes; no paid services without the owner's yes; UI copy rule; never loosen tests; file ownership).
Attack the plan on every axis and verify against the code and primary sources where you can:
1. Breakage: what existing behaviour, data, test or gate could this break? Check the exact files the plan touches (router.ts, App.tsx, Train.tsx gym sheet and inferGym, units.ts, models.ts, escobarState.ts normalizeUnits, backup.ts, store.ts, brief.ts, palace registry, sw.js and scripts/sw-version.mjs, patch_manifest.py). Is "no store version bump" really safe? Does the service-worker precache exclusion actually work with how sw-version.mjs builds its list? Does a geo: intent work from the Capacitor WebView without a plugin (check how the app opens external things today, if at all)?
2. Rule violations: does anything still break LR-23, the copy rule, saved/sent-data rules, dependency rules, or Play policy (for example, does fetching tiles or a country file count as sending location; attribution text as "sources")?
3. Licences and terms: Overture Places licence mix (CDLA vs ODbL parts, Meta/Microsoft sources), Protomaps/OSM tile data obligations, OpenFreeMap terms, R2 public bucket costs and abuse (hot-linking), MapLibre licence.
4. Feasibility and hidden cost: MapLibre in an Android WebView on low-end phones (WebGL support, memory), PMTiles extract sizes for PH+AU, building the catalogue (Overture data is GeoParquet; tooling such as DuckDB in CI), keeping hours data honest, the data freshness and closure problem, owner maintenance time for curated rates.
5. Product: is v1 useful enough without phone, website, prices or near-me? What would a real lifter in Manila or Sydney expect, and where does Google Maps already beat it?
6. Sequencing and process: card order, collisions with the open lanes, the flag approach, gate stubbing, review load, and anything missing (accessibility, i18n of addresses, time zones for hours, offline states, error states, analytics none).
Return: a ranked list of findings (Blocker / High / Medium / Low), each with the evidence (file:line or URL) and a concrete fix to the plan; then a short list of what the plan gets right; then your one-paragraph verdict. Dense markdown, at most ~1600 words.`, { label: 'red-team', phase: 'Red team' })
return r
