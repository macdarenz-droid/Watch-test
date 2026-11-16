# Anonymous error reports (owner item 7.5)

The owner approved this on 2026-09-26. Build it after checklist item 7 is merged and before items 8 and 9, so the full QA and the 50-user simulation cover it too.

## What it does
When something breaks, the app sends a small report to the owner's own Cloudflare Worker. Normal use sends nothing.

**Triggers (errors only):**
- ErrorBoundary crashes;
- `window.onerror` and `unhandledrejection`;
- store save failures (such as quota exceeded);
- migration or load failures on boot, and the rescue path;
- backup export or import failures;
- Escobar transport errors (never message content).

**Offline:** reports wait in a small local queue (at most 20, oldest dropped first) and are sent when the phone is back online. The same error signature within a day is sent once, with a count.

## Report contents (allowlist; nothing else)
- The error name, and the message after cleaning: digits are replaced with `#`, quoted strings with `"…"`, and it's cut to 300 characters.
- Stack frames from the app bundle only: file, line and column, at most 15 frames.
- App version (`__APP_VERSION__`), platform (android/web), Android version and device model.
- The route or screen name (a palace/route id; no ids or details).
- A timestamp (UTC).
- A random anonymous install id: generated locally, not tied to any account or data, and reset by "delete everything".

## Never sent
Workouts, sets, weights, reps, notes, exercise or split names, body weight, health or watch data, coach conversations, memory items, and settings values. The cleaning code has unit tests that seed personal strings and numbers and assert none of them appear in the report.

## Consent
- A Settings switch: "Send anonymous error reports". It is **off until the user says yes**, and the user is asked once, after the first successful workout or after the update.
- No report is sent while it is off. Reports already queued are cleared when it is switched off.

## Server (escobar-worker/)
- `POST /errors`:
  - validates the shape against the allowlist and rejects unknown fields;
  - applies the allowlist again to the values: re-cleans the message (a quote runs to the last quote of its kind, an unclosed quote removes the rest, curly quotes count), keeps only app-bundle files in frames (`/assets/<Name>-<hash>.js` and `/sw.js`), and replaces an unexpected route, error name or version with a neutral value;
  - limits body size to 8 KB (8192 bytes; the app packs batches to at most this), a batch to 20 reports, and a report's count to 100,000 (the app caps a folded count there);
  - limits requests to 30 per hour per install id and per IP. The IP is never stored: its counter uses a keyed hash that is deleted after the hour.
- Stores reports in Cloudflare D1 (database `marc-errors`, binding `ERRORS_DB`) and deletes them after 90 days (a daily cron).
- A daily summary for the owner: new error signatures, counts, and affected installs, at `GET /errors/summary` with the owner's token (`ERRORS_SUMMARY_TOKEN` secret).
- The Cloudflare free tier covers it.
- **The owner deploys the Worker.** Agents never deploy it.

## Owner to-do
1. Deploy the Worker update when it is ready.
2. Add one line to the privacy policy: "The app can send anonymous crash and error reports if you allow it. They contain no workout, health or personal data."

## Content reports (ESC-REPORT, 2026-09-30)
Google Play asks that people can report offensive AI output from inside the app. Every finished coach reply has a Report button.

- **What is sent:** exactly `{v: 1, reason, text, app}`, after the person taps Report and picks a reason. The tap is the consent; the error-report switch does not apply.
  - `reason` is `offensive`, `harmful` or `wrong`.
  - `text` is the reply as shown: the answer, preamble lines, chart captions, proposal titles, revised drafts and the suggestion chips, without citation markers or `[fN]` fact tags (BUG-31). Control characters (except tab and newline) are removed, and it is cut to 4,000 UTF-16 units.
  - `app` is the app version.
  - No install id, device id, conversation id or other header is sent.
- **Where it goes:** always the built-in server, `POST https://marc-coach.mmarcdarenz.workers.dev/reports`, even when a custom coach server is set.
- **Results the person sees:** "Reported. Thank you." (204), "Too many reports from this network. Try again in an hour." (429), or "Couldn’t send. Check your connection and try again." (anything else, offline, or no answer in 15 seconds). Picking a reason again retries. There is no queue.
- **In the app:** Report, then the label "Reason" with Offensive, Harmful, Wrong and Cancel. No explaining line (owner copy rule, 2026-10-01; Play's prominent-disclosure rule is for collection a person would not expect, a report the person starts is expected, and the privacy policy covers it).
- **Nothing is saved on the phone.** "Reported" is kept in memory and resets when the app restarts; the server de-duplicates.
- **Limits:** a 24 KB body cap, 10 reports an hour per network, then 200 an hour in total.
- **Retention:** the D1 table `content_reports` in `marc-errors`. The same text and reason become one row with a count. Rows are deleted 90 days after the first report.
- **Reports are unverified text.** Anyone can send one, so read them as hints.

### Reading reports (owner, on a phone)
1. In Chrome, open **https://dash.cloudflare.com/?to=/:account/workers/d1**. Sign in if asked.
2. Tap **marc-errors**, then **Console**.
3. Paste one of the two queries below and tap **Execute**.

**Latest 20 reported replies** (the most recently first-reported come first):
```sql
SELECT id, datetime(stored_at / 1000, 'unixepoch') AS first_reported_utc, reason, n AS times, app, text FROM content_reports ORDER BY stored_at DESC, id DESC LIMIT 20;
```

**Reports in the last 7 days, by reason:**
```sql
SELECT reason, COUNT(*) AS replies, SUM(n) AS reports FROM content_reports WHERE stored_at >= (CAST(strftime('%s', 'now') AS INTEGER) - 7 * 86400) * 1000 GROUP BY reason ORDER BY reports DESC;
```

- "no such table: content_reports" means no report has arrived since the deploy and the nightly clean-up (03:17 UTC) has not run yet.
- An empty result means there are no reports.
