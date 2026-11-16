# M/ARC Privacy Policy

Effective date: 2026-09-30. Last updated: 2026-10-01.

M/ARC is made by Marc Darenz. Contact: macdarenz@gmail.com. This policy is published at https://macdarenz-droid.github.io/M-arc/privacy/.

M/ARC is a workout tracker. It has no accounts, no ads and no analytics. Your data stays on your phone unless you turn on one of the two optional features below: the online coach and error reports. Both are off until you turn them on.

Escobar, the online coach, may become a paid feature in the future. If that happens, this policy will be updated with the payment details before it launches; nothing about payment exists in the app today.

## On-device data
- Your workouts, sets, weights, reps, splits, schedule, exercise notes, and profile (name, age, sex, height, body weight, training start).
- Weigh-ins, body measurements, soreness check-ins and readiness.
- Health Connect data, if you allow it: steps, sleep, heart rate, resting heart rate and active calories. The app only reads these; it never writes to Health Connect.
- Live heart rate from a Bluetooth watch or chest strap, if you connect one. Android asks for Bluetooth access for this (and, on Android 11 and older, location access, which Android requires to scan for Bluetooth devices; the app does not use your location).
- Coach conversations, coach memory and any photos you send the coach.
- Reminders are local notifications set on the phone. Backups are files you export and choose where to save.

This data sits in the app's private storage on your phone. The web version keeps it in your browser's storage for the site, and is served by Netlify, a web host, which sees your IP address when the page loads.

**Android backup.** If backup is turned on in your phone's settings, Android's Auto Backup can copy this app's data (including workouts, health history and coach conversations) to a private, hidden folder in your Google account, about once a day while the phone is idle and on Wi-Fi, or copy it to a new phone when you transfer your data to it. On Android 9 and newer it is encrypted with your screen lock. Google runs this backup; you can turn it off in your phone's settings (usually Settings > System > Backup).

## Online coach
When you turn on "Online coach" and send a message, the app sends to the coach server:
- your message and the conversation so far, and any photo you attach (shrunk to at most 900 pixels);
- a short summary built on the phone: date and time, the screen you are on, today's plan (including the names of workouts already done today, a workout in progress and the day of a lighter week), muscle recovery, this week's training, the titles of the top coach notes, your goal, age, sex, training experience, planned days, gym equipment, your gym's name and the weight units you use, coach memory notes, which sharing switches are on, the coach's mode and tone, suggestions the coach made that are waiting and what you decided about them, safety flags the phone picks up from your message (a mention of pain, a medical issue, disordered eating or a crisis), a readiness score with its advice, and a flag telling the coach you may be a minor when the age you entered is 18 or under. Your name is not sent;
- workout history the coach asks for, such as past sessions, exercise notes and progress;
- a random device id (not linked to your name or account), the app version, your unit (kg or lb) and coach tone.

Your health data (heart rate, sleep, steps, calories) and body data (weight, body fat, measurements) are sent only if you turn on "Share health data" or "Share body data". Both are off by default. Turning one off also stops that data from being sent again from the coach's earlier lookups; words already written in the conversation, yours or the coach's, are still sent as part of the conversation so far. **One exception:** the readiness score and muscle recovery in the summary are worked out on the phone and can be based partly on your sleep and resting heart rate from Health Connect. They are sent whenever the coach is on, even with "Share health data" off; the numbers behind them are not.

While the app is open, it may also check whether the coach server is reachable. That check sends no data, but the server sees your IP address.

**Recipients:**
- **Cloudflare** runs the coach server (a Cloudflare Worker run by Marc Darenz). It passes your request on and keeps no conversation, except a reply you report (see Reply reports). To limit use, it counts requests per device id and per IP address for the day; these counters are deleted after 3 days. Its logs record technical details such as the model, token counts, timing, data-centre location and error codes, not your messages.
- **Anthropic** (the maker of the Claude AI) receives the request from the Worker, in the United States, and writes the coach's answer. The request comes from the server, not your phone, so Anthropic does not see your IP address. Anthropic may keep parts of a request in a short-lived cache (up to one hour) so follow-up messages are faster. Under its policy for API customers, Anthropic deletes API requests and answers within 30 days, keeps them longer only if needed to enforce its usage policy or the law, and does not use them to train its models by default. See https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data and https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training.
- **A server you choose.** If you set your own coach server in Settings (Escobar, Server), coach requests go to that server instead, under its operator's terms. Error reports and reply reports always go to the built-in Cloudflare server.

## Error reports
The app asks you once, after your first logged workout, and there is a switch in Settings: "Send anonymous error reports". Nothing is sent while it is off, and switching it off deletes reports still waiting on the phone.

When it is on and something breaks, the app sends a report to the same Cloudflare server. A report holds only these 13 items: a random install id (made on the phone, not linked to your name or account), the time, app version, platform (Android or web), Android version and device model (neither is collected yet), the screen name, the kind of error, the error name, the error message, the places in the app's own code where it failed, an error fingerprint, and how many times it happened.

The message is cleaned before it leaves the phone and again on the server: every digit becomes "#", anything in quotes is removed, and it is cut to 300 characters. Code locations are kept only for the app's own files, at most 15. Workouts, health or watch data, body data, coach conversations, memory and settings are never in a report.

The server stores reports in Cloudflare's database for 90 days, then deletes them. To stop abuse it allows 30 requests an hour per install id and per IP address; your IP address is never stored, only a one-way hash of it, deleted within a day. A request can hold at most 20 reports and 8 KB.

## Reply reports
A report on a coach reply holds three items: the reply text as shown (answer, preamble notes, chart captions, proposed change titles, earlier drafts and suggested follow-up questions; at most 4,000 characters), the reason (Offensive, Harmful or Wrong), and the app version. No device id, install id, name or account. A reply can repeat things about you, such as your split names or numbers; those are then part of the report.

Reports always go to the built-in Cloudflare server, even with your own coach server set. Kept 90 days after the first report of that reply, then deleted; a repeat report for the same reply and reason keeps one row and a count. Never sent to Anthropic, sold or used for ads. Limit: 10 reports an hour per IP address; the IP address is never stored, only a one-way hash of it, deleted within a day.

## Data protection
Everything the app sends goes over an encrypted connection (HTTPS). Health data is never sold, never used for ads, and never given to anyone except, when you share it, to answer your own coach request. The app has no ads or tracking.

## Data deletion
"Reset workout data" in Settings (Your data), then "Reset everything", erases all your data and history on this phone, including coach conversations and photos, and gives you a new install id. Display settings for this device (theme, motion, keep screen on, share-card style) stay. One exception: if the app ever set aside saved data it could not read, that copy stays until you delete it in Settings under "Unreadable data kept aside" ("Hold to delete"). Uninstalling the app also removes it. Error reports on the server are not linked to your name and are deleted after 90 days. Reply reports are not linked to you and are deleted 90 days after the first report. To ask about them, email macdarenz@gmail.com.

## Children
M/ARC is intended for adults (18+). It is not meant for children, and its coach gives strength-training advice and reads heart-rate health data that is not suitable for a minor to act on unsupervised. The app does not check age; if you enter an age of 18 or under, the coach is told so and stays conservative.

## Changes
If this policy changes, the new version will be posted here with a new date.

2026-10-01: added "Reply reports".

## Applicable law
M/ARC is available in all countries, and especially in the Philippines and Australia, where the developer is based. For users in Australia, this policy is written to meet the Australian Privacy Act 1988 (Cth). For users in the Philippines, it is written to meet the Data Privacy Act of 2012 (Republic Act No. 10173).
