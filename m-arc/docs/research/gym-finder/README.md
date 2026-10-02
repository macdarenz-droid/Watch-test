# Gym Finder research

**Status: PARKED by the owner, 2026-10-01 07:30 UTC.** His words:

> "When u finished all the task, just park the gym finder without my approval. We need to do brain storm in that topic and talk. Keep it parked for now."

**Nothing starts without his approval.** No card, no builder, no research, no merge. The next step is a brainstorm with him. Wait for him to start it. The parked item stays outside the finish line (the how-to lane plus the first-audit fixes).

## What it is

A proposed feature: a map and list of gyms with hours and rates, saving a gym, linking it to a training gym, "Train here", help from Escobar, and arrival reminders. Another session posted the proposal as **PR #158** (draft, docs only, branch `claude/gym-finder-handoff-2026-10-01`, opened 2026-10-01 01:58 UTC; its files are under `docs/gym-finder/` on that branch). Leave that PR open and unmerged.

The supervisor ran an in-chat Workflow on 2026-10-01 (about 03:40 to 03:56 UTC) to judge it: three research agents in parallel, then a red team that attacked the supervisor's draft plan. Everything below was checked against `main` at `f1e514a`. Line references inside the files (for example `RESEARCH.md:41-46`, `DATA-SOURCES.md:17`, `source.html`) point at the PR #158 files, not at files on `main`. The scripts are `docs/supervisor/workflows/gym-finder-review.js` and `gym-finder-redteam.js`.

## Files

Read in this order.

| File | What it is |
|---|---|
| `gym-finder-review.html` | The page the owner read first. Review of the proposal: what to keep, change and drop, blocking problems, costs, better ideas, the supervisor's advice and the owner's seven decisions. Open it in a browser. |
| `gym-finder-architecture.html` | The second page the owner read. The staged build plan GYM-0 to GYM-6 (cheapest first, each stage merges alone), ground rules, saved data, files touched, bug guards, risks. Open it in a browser. |
| `gf-0.md` | Agent 1 output: what the proposal is, its data sources, permissions and native work, prototype versus description, weaknesses, five ideas worth keeping. |
| `gf-1.md` | Agent 2 output: how it fits `main` (integration points, the existing gym model, saved-data impact, collisions with open PRs, bundle size, test and gate patterns, ranked risks). |
| `gf-2.md` | Agent 3 output: external constraints with cited sources (Google Places terms and cost, map hosting, rate sourcing, Google Play and Android rules, Philippine and Australian privacy law, what other apps do). |
| `gf-draft-plan.md` | The supervisor's first draft plan (cards GF-0 to GF-7). It was red-teamed and then replaced by the stages in the architecture page. Kept for the reasoning. |
| `gf-redteam.md` | The red team's findings on that draft: two blockers (the R2 hosting plan is not $0 and cannot ship as written; map credits break rule LR-23), then high, medium and low items and a verdict. |

## Outcome so far

- The supervisor's advice to the owner: keep the thinking, cut the scope. Launch on Google Play first. Then a "Find in Maps" button (about half a day), then "Train here" with the gym's equipment set up. Benchmark open gym data (Overture, OpenStreetMap) before any list or map. Build the list and map only if the benchmark and real users show it beats Google Maps.
- Not recommended: scraping prices, reading Facebook or Instagram (Meta forbids it), background location and arrival geofences (high Play rejection risk), paid Google Places (about $1,060 a month at 10,000 users, and its terms forbid showing it on a non-Google map).
- The owner's seven decisions are listed at the end of `gym-finder-review.html`: timing, LR-23 for the finder, one new saved field, map hosting, new libraries, launch areas, prices.
- Prerequisites named in the plan: the finish line, the gym findings ENG-01, UI-R06, IMP-E04 and IMP-N01 from the improvement audit (#149), AUD-4 (restore rules), and, advised, the Play launch.

## Rules that apply if the owner starts it

- Saved-data changes need his approval first (`AGENTS.md`, file ownership). GYM-4 adds one optional field on the gym record.
- LR-23: no phone numbers, links or sources in the app UI unless Google Play requires them. The finder needs his ruling.
- New dependencies (a map library) need the supervisor's OK. Anything under `escobar-worker/**` is a separate PR that only the owner merges. The stages are designed to avoid both.
- Curated prices would cost the owner time every month. They are his decision, listed under "Prices" in the review page.
