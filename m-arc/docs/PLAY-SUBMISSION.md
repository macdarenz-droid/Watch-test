# Play Console submission drafts (DOC-2)

Draft answers for the Play Console forms, traced to code. The owner enters these into the
actual console UI; this file is the reference, not a substitute for reading the current
questionnaire (Google can add or reword questions). Where the code can't answer a question,
this says "unknown" rather than guessing.

Source of truth for the plain-language claims: `docs/PRIVACY-POLICY.md`. Every claim below
also gives its own file:line.

**Privacy policy URL (Play Console, App content > Privacy policy):**
https://macdarenz-droid.github.io/M-arc/privacy/ . That page is the M/ARC website's /privacy/ page, rendered from
`docs/PRIVACY-POLICY.md` at every site build (DOC-3, the `website/` folder on `claude/app-website-design-671lk8`,
deployed by hand with `.github/workflows/website.yml`). There is no second copy of the policy anywhere.

## Store listing: required lines (LR-23, 2026-09-30)

Google Play's health policy (https://support.google.com/googleplay/android-developer/answer/16679511) requires this line **in the store description**. It never goes in the app:

> M/ARC is not a medical device and does not diagnose, treat, cure, or prevent any medical condition.

The same policy then says: "Apps must also remind users to consult a healthcare professional for medical advice, diagnosis, or treatment." It names no place for this reminder, while every other placement in that section names the app description. So the reminder goes **in the store description**, right after the line above:

> For medical advice, diagnosis or treatment, consult a healthcare professional.

Play does not require it inside the app (COPY-1 research, read 2026-09-30, D-COPY1-3). The only "within the app" wording is a best practice ("should … may include") in https://support.google.com/googleplay/android-developer/answer/13996367, for apps that claim to help diagnose or manage a health condition; M/ARC makes no such claim. No Google page asks for a "not medical advice" line. The in-app Settings line from card PLAY-1 is removed (owner, 2026-10-01; COPY-1, D-COPY1-medical). PLAY-1's gate block probe for it is retired; the COPY-1 gate block checks the inverse.

Risk: a Play reviewer could read the reminder as expected in the app. The coach's safety cards (`src/escobar/ui/Escalation.tsx`, owner decision LR-23) stay in the app; the How-to safety line ("General guidance, not medical advice. …", owner-approved) is not rendered in the app yet.

The developer contact email goes in the Play Console's contact field, not in the app (owner decision LR-23: no contacts in the app UI).

## In-app text Play requires (COPY-1 research, 2026-09-30)

Owner rule (D-COPY1-1): the app explains nothing unless Google Play requires it or the owner asked for it. These are the lines Play requires in the app; they stay, and they must be true:

- A privacy policy link in the app: Settings → Your data → "Privacy policy" (https://support.google.com/googleplay/android-developer/answer/16679511, https://support.google.com/googleplay/android-developer/answer/9888076).
- The Health Connect rationale screen with the same privacy policy (`native/PermissionsRationaleActivity.java`; https://developer.android.com/health-and-fitness/guides/health-connect/develop/get-started).
- A prominent disclosure and an affirmative consent before the coach sends data: Escobar's first-enable Explainer and its two sharing switches, off by default (`src/escobar/ui/EscobarSheet.tsx`; answer/9888076, answer/12579724).
- A disclosure for the Bluetooth and location permissions the watch uses: the Watch sheet's line "Watch readings stay on this phone. Session heart rate goes to Escobar only if Share health data is on." (answer/13996367).
- A way to report offensive AI replies without leaving the app (below).

**Developer name (owner step, DOC-5):** in Play Console, open Developer account > About you, set "Developer name" to exactly "Marc Darenz" and save, so the listing names the same developer as the policy ("M/ARC is made by Marc Darenz."). Google reviews the change before it shows on Play. On the same page, check that the developer email shown on Play is the policy's contact address, and keep each app's support email the same. Play does not require the full legal name in the policy: the policy must name either the developer shown on the listing or the app, and it names the app (https://support.google.com/googleplay/android-developer/answer/10144311). For a personal account, Play still shows the legal name from the Google Payments profile, the country and the developer email next to the app, whatever the policy says, and the full address too if the app is ever monetised (https://support.google.com/googleplay/android-developer/answer/13628312). The Developer profile page in Play Console shows exactly what is public.

**AI-generated content:** Play requires an in-app way to report or flag offensive AI replies (https://support.google.com/googleplay/android-developer/answer/13985936). Card ESC-REPORT adds a Report button under every finished coach reply; picking a reason sends the reply text, the reason and the app version to the built-in Cloudflare server, which keeps it 90 days, then deletes it. Release to Play only after ESC-REPORT-W is live (POST /reports {} answers 400) and ESC-REPORT has merged.

## Data safety form

**Does your app collect or share any of the required user data types?** Yes.

| Data type | Collected? | Shared off-device? | Where | Encrypted in transit? | Ephemeral? | Required or optional? | Purpose |
|---|---|---|---|---|---|---|---|
| Health and fitness (heart rate, resting heart rate, sleep, steps, active calories) | Yes, via Android Health Connect, read-only | Only if the user turns on "Share health data" (off by default) | To the coach Worker, then Anthropic, only while Escobar is on and answering | Yes, HTTPS (Cloudflare Workers serve HTTPS only) | No | Optional | App functionality (the AI coach) |
| Health and fitness (readiness score, muscle recovery) | Computed on-device from the above | Sent whenever Escobar is on, even with "Share health data" off (the score, not the underlying numbers) | Same as above | Yes | No | Optional | App functionality |
| Fitness (workouts, sets, weights, reps, splits, schedule) | Yes, on-device | Only the specific workout history Escobar's tools ask for, while Escobar is on | Same as above | Yes | No | Optional | App functionality |
| Personal info (age, sex, height, weight, training experience, goal) | Yes, on-device | Sent in the coach's per-turn summary whenever Escobar is on; weight only if "Share body data" is also on | Same as above | Yes | No | Optional | App functionality |
| Photos | Yes, if the user attaches one to a coach message | Sent once, with that message, while Escobar is on | Same as above | Yes | No | Optional | App functionality |
| Messages (Other in-app messages) | Yes: coach conversation text, and a coach reply the user reports | Coach text: sent whenever Escobar is on. A reported reply: only when the user taps Report and picks a reason | Coach Worker (conversation passed on to Anthropic; a reported reply is stored in Cloudflare D1 for 90 days and never sent to Anthropic) | Yes | No | Optional | App functionality; Fraud prevention, security, and compliance |
| App activity (Other actions) | The reason picked when reporting a reply (Offensive, Harmful or Wrong) | Only when the user taps Report and picks a reason | Coach Worker, stored in Cloudflare D1 for 90 days | Yes | No | Optional | App functionality; Fraud prevention, security, and compliance |
| Device or other IDs | A random per-device id, not linked to identity | Sent with every coach request | Coach Worker | Yes | No | Optional | App functionality, abuse prevention (daily quota) |
| Diagnostics (crash logs) | Only if the user turns on "Send anonymous error reports" (off by default) | Yes, when on | Same Cloudflare Worker, different endpoint | Yes | No | Optional | Analytics (crash/error fixing) |

**Play Console answers for reply reports:** for Messages → Other in-app messages and for App activity → Other actions, each gets these answers:
- Collected: Yes.
- Shared: No (Cloudflare processes it for the developer as a service provider).
- Processed ephemerally: No.
- Required or optional: Optional.
- Purposes: App functionality, and Fraud prevention, security, and compliance.

Code references:
- On-device data model: `src/core/models.ts` (workouts, profile, `DailyHealth`).
- Health Connect is read-only, native plugin: `src/native/health.ts:1-4`, `native/HealthConnectNativePlugin.java:51-55,82-86`.
- Sharing toggles (off by default): `src/escobar/ui/SettingsSection.tsx:39-40`, `src/escobar/ui/EscobarSheet.tsx:81-82`.
- Toggle enforcement (a tool call is refused while its toggle is off): `src/escobar/tools/executor.ts:86-87`.
- Readiness/recovery sent regardless of the health toggle: `src/escobar/context/brief.ts:79-94` (per D-DOC1, `docs/COACHING-DECISIONS.md:742`), `src/escobar/tools/read.ts:173,322` (unshared data never leaves the phone for insights).
- Coach request transport: `src/escobar/transport.ts`, `src/escobar/session.ts`.
- Anthropic upstream (server-side only, never sees the phone's IP): `escobar-worker/src/anthropic.ts`.
- Random device id, not account-linked: `src/escobar/state.ts` (device id), `escobar-worker/src/quotaDO.ts` (per-device/per-IP counters, deleted after 3 days).
- Error reports: allowlist and cleaning `src/errors/scrub.ts:1-9`, random install id `src/errors/installId.ts:16-25`, send path `src/errors/sender.ts:44-60`, server-side storage/retention `escobar-worker/src/errorsStore.ts` (90-day purge, `escobar-worker/wrangler.toml` daily cron), consent switch default off — see `docs/ERROR-REPORTS.md:30-31`.
- Encryption in transit: Cloudflare Workers only serve HTTPS; there is no HTTP fallback configured anywhere in `escobar-worker/wrangler.toml` or `escobar-worker/src/handler.ts`.
- Reply reports: `src/escobar/report.ts` (ESC-REPORT), server-side storage and 90-day purge `escobar-worker/src/errorsStore.ts` `content_reports` (ESC-REPORT-W).

**Is all of the collected data encrypted in transit?** Yes — every request goes over HTTPS
(Cloudflare Workers don't serve plain HTTP).

**Do you provide a way for users to request that their data be deleted?** Yes, in-app:
"Reset workout data" → "Reset everything" (`src/slices/settings/Settings.tsx:69,239`) erases
on-device data and issues a new install id (`src/errors/installId.ts:26-27`, reset call site in
`src/core/store.ts:354-357`). There is no account, so there's nothing server-side tied to a
person to delete on request; error reports are already anonymous and self-delete after 90 days.
Reply reports are not linked to a person and are deleted 90 days after the first report.
Contact for questions: macdarenz@gmail.com.

**Is data collection required or optional?** All network sharing (Escobar, error reports, reply reports) is optional: Escobar and error reports are off by default, and a reply report is sent only when the user taps Report and picks a reason.

**Does your app comply with the Health Connect permissions declaration / Google's Health apps
policy?** See the section below.

## Health apps declaration (Health Connect)

Permissions declared in `native/patch_manifest.py:25-30`:
- `android.permission.health.READ_STEPS`
- `android.permission.health.READ_SLEEP`
- `android.permission.health.READ_HEART_RATE`
- `android.permission.health.READ_ACTIVE_CALORIES_BURNED`
- `android.permission.health.READ_RESTING_HEART_RATE`

All five are **read-only**; the app never writes to Health Connect (`docs/PRIVACY-POLICY.md`
"On-device data"). Purpose for each, as actually used in the app:
- **Steps, sleep, active calories, resting heart rate:** feed the on-device readiness score and
  recovery model shown on the Today/Coach screens, and, if the user shares health data, inform
  the AI coach's advice (`src/escobar/context/brief.ts:79-94`).
- **Heart rate:** live/session heart rate for the workout finish-card summary (zones, average,
  max) and the same readiness/coach uses above.

The app also requests Bluetooth permissions to read live heart rate from a paired watch or chest
strap (`native/patch_manifest.py:40-46`); on Android 11 and older this requires location
permission for BLE scanning only — the app does not read or use device location
(`docs/PRIVACY-POLICY.md` "On-device data").

## Content rating questionnaire

- Violence: none.
- Sexual content: none.
- Profanity: none scripted by the app; user-entered free text (coach messages, exercise notes)
  is never shown to other users — unknown whether Google's questionnaire treats private,
  non-shared user text as "user-generated content" for rating purposes; answer conservatively as
  no shared/public user-generated content, since nothing the user types is visible to anyone but
  themselves and, if Escobar is on, the AI coach.
- Controlled substances, gambling, user interaction with other users: none — there is no
  multiplayer, chat-with-other-users, or social feature anywhere in the app.
- Shares personal or health info with third parties: yes, only if the user opts in to Escobar
  (see the data safety form above) — relevant to the questionnaire's data-collection branch.
- Expected rating: Everyone / PEGI 3 equivalent, subject to the target-audience answer below.

## Target audience and content

**Target age group:** 18+ only (`docs/PRIVACY-POLICY.md` "Children";
D-DOC2 in `docs/COACHING-DECISIONS.md`). Do not select an audience that includes children in the
Play Console's target audience section, and do not complete the "Ads" section as child-directed.

## Ads

**Does your app contain ads?** No. No ad SDK or ad dependency exists in `package.json`
(`dependencies`/`devDependencies`), and no ad-serving code exists in `src/`.
