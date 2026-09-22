# Architecture

M/ARC is a Preact + TypeScript app built with Vite into `www/`, which Capacitor wraps for Android and the service worker serves as a PWA. The code is split into layers that only depend downward, and into vertical slices that own one screen each.

```
src/
  data/      static facts: exercises.json, muscles, goals, templates, coachCues.json, sparks
  core/      models, dates, units, exercise lookup, store (persistence), legacy migration
  brain/     pure functions: exposure, recovery, history, prs, trend, progression, balance,
             effort, weekly, bodyfat, coach/rules (rules as data), coach/cues
  theme/     five themes as one token contract + the engine that applies them
  ui/        stylesheet, primitives (Card, Button, Sheet, Toggle ...), icons, MuscleMap
  svg/       generated body parts for the muscle map (from body-muscles)
  native/    Capacitor bridges with web fallbacks: haptics, notifications, share, health
  app/       shell, bottom nav router, shared selectors, toast
  slices/    today, workout (splits, live session), history (+stats), body, coach, settings
tests/       vitest, pure logic only
```

Rules of thumb:

- `brain/` never imports from `ui/`, `slices/` or `native/`. Every function takes plain data and returns plain data, so it is testable and reusable by any screen.
- Screens read from `core/store` signals and change state only through `update()`.
- Copy shown to the user is plain words. No "backend", "authority", "semantic" or version numbers in the UI.

## State

One object, one key (`marc.state.v1`), saved 250 ms after a change and flushed when the app is hidden. The previous save is kept under a backup key. Shape lives in `core/models.ts`:

- `splits[]`: templates with exercises, set counts, a colour and up to two focus muscles.
- `schedule`: weekday → split id or null.
- `sessions[]`: finished workouts. Each exercise has an id (library `lib_*` or `custom_*`) and its sets `{kg, reps, effort, durationSec, distanceM}`.
- `active`: the live session, so it survives an app restart.
- `customExercises[]`, `preferences`, `profile`, `body[]` (body-fat readings), `health`.

`core/migrate.ts` converts the old `dailyTrackerPremium` root once, read-only. Per-exercise completed records are preferred, whole-session snapshots fill the gaps, timed sessions supply durations, and custom splits, day names, schedule, goal, units and reminder settings carry over.

## How the coach thinks

Everything below is in `src/brain/`, each file a few screens long.

**Muscle exposure** (`exposure.ts`). A set counts toward a muscle by role: main muscle 1.0, helping muscle 0.55, stabiliser 0.25, scaled by effort (easy 0.9, ideal 1.0, max 1.1). Weekly "effective sets" use 1.0 for main and 0.5 for helping muscles. Levels are a cumulative score.

**Recovery** (`recovery.ts`). Window = 24 h after all-easy work, 48 h after ideal, 72 h after all-max, from the most recent day the muscle was worked. If the user's own history shows short-rest sessions performed clearly worse (needs 5 samples in each group), the window widens by up to 1.4×. It never shrinks.

**Records** (`prs.ts`). The first session is a baseline. Records are heavier load, a better one-rep estimate (sets of 10 or fewer, +1 %), more reps at a load, most reps (bodyweight), longest hold, furthest carry. Volume is never a record.

**Next session** (`progression.ts`), in order: no history → start light by equipment; more than 28 days away → repeat last load; effort missing on most recent sets → keep load and rate; two sessions under the range at max effort → one step down (1 / 2 / 2.5 kg by load band); top of the range twice without max effort (or once when everything felt easy) → one step up, capped at 10 %; top of the range once → confirm; otherwise add a rep.

**Trend and plateau** (`trend.ts`): recency-weighted regression, needs 4 points; plateau needs 7 of the last 8 sessions.

**Balance** (`balance.ts`): push vs pull and upper vs lower over three weeks, with gates (12 sets total, two active weeks, ratio ≥ 2 persisting two weeks). A chosen focus muscle softens the warning.

**Coach rules** (`coach/rules.ts`) are a list of objects. Each looks at the same context and returns insights with `title`, `noticed`, `means`, `action` and a priority. Recovery outranks a plateau on a lift that targets the recovering muscle. To add a rule, append one object. To change the words, edit strings.

**Cues** (`coach/cues.ts`): 422 short tips matched by exercise, movement, muscle or equipment, rotated deterministically.

## Themes

`theme/themes.ts` defines one token contract (background, three surfaces, three borders, three text levels, accent, semantic colours, shadow, muscle-map body/line, radii, font) and five themes:

| id | name | after |
|---|---|---|
| `silent-black` | Silent Black (default) | Linear, Vercel |
| `paper` | Paper | Notion |
| `ember` | Ember | Raycast |
| `emerald` | Emerald | Supabase |
| `midnight` | Midnight | Stripe |

The engine writes the tokens as CSS custom properties per `[data-theme]`, sets `<html data-theme>`, updates `<meta name="theme-color">` and persists the choice under `marc.theme`. The first paint uses the saved theme from an inline script in `index.html`, so there is no flash. To add a theme, add one entry; the test suite checks the contract is complete.

## Muscle map

`svg/bodyMuscles.ts` holds the 89 body parts of the low-poly figure from the `body-muscles` package (Apache 2.0, see `THIRD_PARTY_NOTICES.md`). It is generated by `scripts/extract-body-muscles.mjs`, which also maps each part id onto one of the 24 muscle keys (for example `chest-lower-*` → `chest`, `gluteus-medius-*` → `abductors`); head, hands, knees, feet and spine stay plain body. `ui/MuscleMap.tsx` fills each part with a `color-mix()` of theme tokens: recovery uses negative → warning → positive, emphasis uses accent strength, roles use accent tiers. Switching the theme re-colours the map with no extra code. Brachialis and rotator cuff have no part of their own and light a neighbour only when that neighbour is idle.

## Native

`native/notifications.ts` schedules a rest-complete alert (exact, allow-while-idle) and training-day reminders for the next eight weeks from the schedule. The user's reminder preference is stored in state; Android's scheduling health is reported separately and re-checked on every `pageshow`. Haptics use the Capacitor plugin with a `navigator.vibrate` fallback. Export writes to the app cache and opens the Android share sheet, or downloads on the web.

## Adding things

- **Exercise**: append to `data/exercises.json` (id, name, equipment, primary/secondary/stabilizers muscle ids, aliases, pattern). Duration and conditioning exercises are listed in `core/exercises.ts`.
- **Coach rule**: add an object to `RULES` in `brain/coach/rules.ts` and a test.
- **Screen**: add a folder under `slices/`, a tab in `app/router.ts` and a case in `app/App.tsx`.
