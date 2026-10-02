# Architecture

M/ARC is a Preact + TypeScript app (signals for state) built by Vite into `www/`. Capacitor wraps `www/` for Android and a service worker serves it as a PWA. The optional online coach, Escobar, talks to a Cloudflare Worker in `escobar-worker/`, which calls the Claude API. The code is split into layers that only depend downward, and into vertical slices that each own a screen.

```
src/
  data/      static facts: exercises.json (153), muscles, goals, recovery and deload constants, coachCues.json, sparks
  core/      models, dates, clock, units, exercise lookup, body-fat formula, store (persistence + repair), heartStore,
             legacy migration, sessionLogging, rescue file, version
  brain/     pure functions: exposure, recovery, readiness, history, e1rm, effortBias, prs, trend,
             progression, deload, balance, volume, weekly, plan, heart, energy, fidelity, units,
             coach/ (rules as data, pre/live/post-session notes, weekly review, cues)
  theme/     five themes on one token contract, and the engine that applies them (and the Android bar style)
  ui/        stylesheet, primitives (Card, Button, Sheet, Toggle, WeightInput …), sheet stack, icons, MuscleMap, PulseLine
  svg/       the logo and the body parts for the muscle map
  assets/    images bundled by Vite (the Escobar mark)
  native/    Capacitor bridges with web fallbacks: Health Connect, watch (BLE), notifications, haptics,
             share and file picker, photo, Android back button
  app/       shell, router (tabs + panels), selectors, toast, error boundary
  slices/    today, workout (live session, heart capture), history, body, coach, profile, settings, share (F12 share cards)
  escobar/   the online coach, loaded lazily: loop, transport, store, verify, apply, tools/, context/,
             knowledge/, palace/ (in-app navigation), ui/
escobar-worker/   Cloudflare Worker: validation, quotas (Durable Object), US-pinned upstream relay, SSE relay
native/           Java for Android (Health Connect, watch service and plugin, rationale activity),
                  patch_manifest.py and the adaptive icon layers under native/res/
scripts/          build helpers: sw-version, prepare-android.sh, render-logo, escobar-tools, screenshot-gate
tests/            vitest (node), including tests/escobar/ and machine-scaled timing budgets in tests/perf/
```

Rules of thumb:

- `brain/` never imports from `ui/`, `slices/`, `native/` or `escobar/`. Every function takes plain data and returns plain data.
- Screens read `core/store` signals and change state only through `update()`.
- The main bundle never imports `escobar/session`: Escobar loads on first use. The same goes for pinned cards on Today.
- Copy is plain words. No "backend", "authority" or version numbers in the UI, apart from the version line in Settings (owner, 2026-10-01, DOC-5).
- Copy is clear and direct, written for a capable adult. It never labels itself as simplified or talks down: no "In plain words", "simply put", "in short", "don't worry", no "(this just means ...)" asides, no over-explaining of everyday things. Headings name the content ("Summary", "Full policy"). Headings (owner, 2026-10-01) are short labels of one to three words, a noun phrase: never a sentence, a "What ..."/"How ..." question, a qualifier such as "off by default" or ", and where", or a leading "The", "This" or "About"; the text under a heading explains it.
- UI copy never talks down to users or states the obvious, and the app explains nothing unless Google Play requires it or the owner explicitly asked for it (owner, 2026-10-01, D-COPY1-1); no "Not medical advice" on a gym app (AGENTS.md, UI copy rule). Labels that name a control or show data are not explaining and stay. The lines Play requires are listed in `docs/PLAY-SUBMISSION.md` ("In-app text Play requires"); they stay and must be true. `tests/copy-1.test.ts` pins every line COPY-1 removed.

## State and side stores

`marc.state.v1` holds one `AppState` object, saved 250 ms after a change and flushed when the app is hidden. Its keys (`core/models.ts`):

`version`, `createdAt`, `profile`, `goal`, `splits`, `schedule`, `sessions`, `active` (the live session, so it survives a restart), `customExercises`, `preferences`, `body`, `health`, `healthDays`, `weightLog`, `profileHistory`, `onboarding`, `checkIns`, `recoveryModel`, `freshMarks`, `weeklyReviewDismissedWeek`, `deload`, `insightFeedback`, `legacyImportedAt`, `escobar` (settings, memory, pins, today's plan change), `units` (gyms and equipment profiles), `daysOff`, `exerciseNotes`, `lastBackupAt`.

Other storage:

| Key | What |
|---|---|
| `marc.state.v1.backup` | The previous good save, refreshed on the first save of each local day (`marc.state.v1.backupDay`). |
| `marc.state.v1.corrupt`, `marc.state.v1.backup.corrupt` | A saved state the app could not read, kept aside for the rescue file. |
| `marc.heart.v1` | Heart-rate series per session (`core/heartStore.ts`). |
| `marc.escobar.v1` | Escobar conversations (`escobar/store.ts`), trimmed to size, never the active one. |
| IndexedDB `marc-escobar-img` | Photos sent to Escobar; never in localStorage. |
| `marc.theme`, `marc.health.asked`, `marc.dev` | Theme, the last Health Connect permission prompt, the developer flag. |

Loading goes through `repairState()`: bad list items are dropped, ids filled in, missing fields defaulted, old values healed (for example active calories stored in small calories). A state that cannot be parsed is quarantined, not overwritten. `core/migrate.ts` converts the old `dailyTrackerPremium` root once, read-only.

## How the coach thinks

All in `src/brain/`.

**Sets.** `hasEntry` (reps, time or distance) decides what is kept. `isWorkingSet` (filled in and not a warm-up) decides what counts for exposure, volume, recovery, e1RM, records and progression. A set taken to failure counts as max effort. Drop sets count for volume but never for records.

**Exposure** (`exposure.ts`). A set counts toward a muscle by role (main, helper, stabiliser) and effort. Weekly effective sets count 1 for the main muscle and ½ for a helper; each muscle's band depends on its training level.

**Recovery** (`recovery.ts`, constants in `data/recovery.ts`). An impulse-response model. Every working set leaves an impulse sized by role, effort, reps, load against recent top load, exercise damage and novelty. Impulses decay fast then slow (a fast share and a slow share with an 18 h base time constant), stack over the last 7 days, and are compared with the muscle's own typical session dose. 90 % is ready for hard work, 97 % is full. A whole-body factor from sleep, resting heart rate and training load slows every muscle slightly. After each session the model calibrates a per-muscle time-constant scale from how the next session went (`recoveryModel`), rebuilt from history when sessions are edited.

**Readiness** (`readiness.ts`). A 0–100 score from the check-in, sleep, recovery of today's muscles, resting heart rate, HRV and recent load, re-weighted when inputs are missing. Green from 67, red at 33 or below; calibrating under 14 days of data.

**Strength estimate** (`e1rm.ts`). Epley with the effort label as reps in reserve (easy 3, ideal 2, max 0), for sets of 10 reps or fewer. `effortBias.ts` notices when your ratings run optimistic and says so in a tip; it does not change the estimate.

**Records** (`prs.ts`). The first session is a baseline. Records: heavier load, a strength estimate more than 2.5 % above the previous best, more reps at a load, most reps (bodyweight), longest hold, furthest carry. Loads are shown in the unit they were typed in.

**Next session** (`progression.ts`). Inputs: history, goal rep ranges, today's readiness, the exercise's recovery, an active lighter week, the gym's equipment, and any load change Escobar applied for today. In order: nothing logged → start light; more than 28 days away → repeat the last load; effort missing → repeat and rate; two sessions under the range at max effort → one step down; top of the range twice without max effort → one step up (at most 10 %); top of the range once → confirm; otherwise add a rep. Amber readiness or a primary muscle under 60 % recovered holds the load. Loads snap to what the equipment can make.

**Lighter week** (`deload.ts`). Offered when two main lifts stall, effort drifts harder on two lifts while volume climbs, a muscle runs over its band two weeks in a row while a lift stalls, or readiness was red on 3 of the last 5 days.

**Coach notes** (`coach/`). Rules are data: each looks at the same context and returns notes with `title`, `noticed`, `means`, `action` and a priority. Pre-session, live (autoregulation after the first set) and post-session notes, a weekly review, and 400+ cues matched by exercise, pattern, muscle or equipment.

**Days off.** A scheduled day taken off counts as unscheduled for the streak, adherence and this week's target, and gets no reminder.

## Escobar

`escobar/` runs a tool loop against the Worker. The app sends a brief (what changed since the last turn), the conversation and a tool manifest. The model answers with text and tool calls; tools run on the phone (`tools/read.ts`, `show.ts`, `calc.ts`) against local data, and only their results go back. Every number in an answer is checked against the facts the tools returned (`verify.ts`); unsupported numbers are repaired once, then marked. Changes are proposals (`tools/actions.ts`) that you apply with a tap and can undo for 8 seconds (`apply.ts`). Health and body data leave the phone only with their sharing switch on, and are redacted from replayed history once a switch is turned off.

`escobar-worker/` validates each request, counts quotas in a Durable Object (per device, per IP, global), and relays the model stream as server-sent events. Every Claude API call leaves from an `UpstreamRelay` Durable Object pinned to the eastern US, so users whose nearest Cloudflare location the API refuses can still use Escobar.

## Platform

- **Android** (`native/`): Health Connect reads today's steps and active calories as aggregates, and sleep and heart rate over 48 h, on a callback executor. Background syncs never show a permission dialog. The watch service keeps a BLE heart-rate connection in a foreground service. `@capacitor/app` handles the back button: Escobar, then the top sheet, then the panel, then Today, then the app goes to the background.
- **PWA** (`public/sw.js`): navigations are network-first with the cached index as the fallback. Other files are cache-first. Every built file, lazy chunks included, is installed with the app. Old chunks carry over to a new version, so an open tab keeps working after an update.
- **Themes** (`theme/`): one token contract, five themes (Silent Black default, Paper, Ember, Emerald, Midnight). The first paint uses the saved theme's colours from `index.html`; the Android status and navigation bars follow the theme.

## Builds

See the README. `scripts/prepare-android.sh` generates the Android project for both workflows. `docs/AGENT-RULES.md` lists the rules the agent guard enforces.

## Adding things

- **Exercise**: append to `data/exercises.json` (id, name, equipment, muscles, aliases, pattern). Duration and conditioning ids are listed in `core/exercises.ts`.
- **Coach rule**: add an object to `RULES` in `brain/coach/rules.ts`, and a test.
- **Escobar tool**: add it to `escobar/tools/schema.ts` and its handler. Then run `npm run escobar:tools` so the Worker's copy matches; a test checks they are in sync.
- **Screen**: a folder under `slices/`, a tab or panel in `app/router.ts`, and a case in `app/App.tsx`.
- **Theme**: one entry in `theme/themes.ts`, plus its first-paint colours in `index.html`. The tests check both.
