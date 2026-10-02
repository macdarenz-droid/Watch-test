export const meta = {
  name: 'marc-rating',
  description: 'Inventory M/ARC features and build quality from code, and research competing gym apps, for an honest rating',
  phases: [{ title: 'Research', detail: 'app inventory and competitor research in parallel' }],
}

// App rating (10-01): two read-only researchers in parallel, one reads the code on main, one reads the market. No args.
// Its two returns were saved as docs/research/app-rating/rate-0.md and rate-1.md; the rating itself is in that folder's README.

phase('Research')
const [inventory, competitors] = await parallel([
  () => agent(`You work in macdarenz-droid/M-arc, checked out at /home/user/M-arc (run git fetch first; use origin/main). Read only: never edit, commit, push or comment. Cite file paths for every claim; mark anything you could not confirm as "not verified".
TASK: an honest, factual inventory of the M/ARC gym app AS IT EXISTS ON MAIN TODAY (not plans, not open PRs), plus how it is built.
1. Features users can actually use today, grouped: workout logging (modes: weights, assisted, bodyweight, holds, carries, conditioning), plans/splits, progression and targets, recovery/readiness model, body map, history/stats/charts, the AI coach "Escobar" (what it can do, its tools, safety features such as the crisis pre-screen, quotas, privacy controls), How-to sheets (how many exercises have them today), the exercise library size, watch/heart-rate and Health Connect support, themes, units, backup/restore, offline support, onboarding, notifications/reminders, accessibility. For each: is it on main and wired into the UI? Grep for callers before calling something live.
2. What is NOT there that most gym apps have (e.g. social feed, cloud sync/accounts, iOS app, web app, exercise videos, wearables beyond the current ones, nutrition, templates marketplace).
3. How it is built: stack (framework, Capacitor/Android, storage, the Cloudflare Worker), test counts (count test files and roughly tests), CI gates (.github/workflows), the screenshot/visual gate, release/signing setup, code size (lines of src), dependencies count, known open issues (read docs/supervisor/HANDOVER.md on origin/main section 8 for the open lanes, and the two audit docs: origin/claude/codex-audit-2026-10-01:codex-audit.md summary section and origin/claude/improvement-audit-2026-10-01:improvement-audit.md summary section).
4. Release status: is it on Google Play yet? (read docs/RELEASE-READINESS.md, docs/PLAY-SUBMISSION.md).
Return dense markdown, at most ~1500 words.`, { label: 'app-inventory', phase: 'Research' }),

  () => agent(`Research, with web search and primary sources (official sites, app store listings, recent reviews dated 2025-2026), the leading gym/strength training apps that compete with a free Android gym app that has: workout logging, automatic progression targets, a muscle recovery/readiness model, a body map, an AI coach chat, illustrated how-to sheets, heart-rate watch support and Health Connect. Read only; do not touch any repository.
Cover at least: Hevy, Strong, Fitbod, JEFIT, Alpha Progression, Boostcamp, Gymshark Training, and any 2025-2026 AI-coach entrant that matters (for example Future, or AI features added by the big apps). For each: platforms, price (free tier limits and paid price, in USD, and PHP/AUD if listed), core features, AI features, recovery or readiness features, exercise library size and media type (video, animation, illustration), wearables, social features, ratings and download counts on Google Play if visible, and what users complain about most (from recent reviews). Note market size signals for the Philippines and Australia if available.
Then say: what the table-stakes features are in 2026, which features actually drive users to choose or pay, and where the gaps are that a small solo-built app could own.
Cite a URL for each fact; mark anything unverified. Return dense markdown with one comparison table, at most ~1800 words.`, { label: 'competitors', phase: 'Research' }),
])
return { inventory, competitors }
