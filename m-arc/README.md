# M/ARC

Local-first workout, recovery and coaching tracker. It ships as an Android APK (Capacitor) and as a PWA. Everything you log stays on the device. The one exception is Escobar, the optional online coach: when you use it, it sends the numbers it needs through the project's Cloudflare Worker to the Claude API, and only with the sharing switches you turned on.

- **Today**: what is scheduled (or take the day off), streak, readiness, recovery at a glance, the top coach note, pinned Escobar cards.
- **Train**: splits and a live session with targets per set, effort rating, warm-ups, drop and to-failure sets, notes, rest by timer or heart rate, a watch over Bluetooth, and live record badges.
- **Body**: a muscle map with recovery, this-week and level views, and a body-fat estimate.
- **Escobar**: the online coach (answers are checked against your own numbers, and every change it proposes needs your tap). Offline, it points to where things are in the app.
- **History**: calendar, session log with edit, weekly volume, exercise trends and records.
- **Settings**: five themes, gyms and units, rest, reminders, Health Connect, watch, backup and restore, CSV export.

Data from the previous single-file app (localStorage key `dailyTrackerPremium`) is imported once on first launch and never modified.

## Run

Node 22.

```sh
npm ci
npm run dev          # Vite dev server
npm run check        # typecheck + unit tests + timing budgets + production build into www/
npm run test:tz      # the unit tests in two more time zones
npm run gate         # Playwright visual and behaviour gate over www/ (needs a build)
cd escobar-worker && npm ci && npm run check   # the Worker's typecheck and tests
```

The version lives in `package.json` only; the build injects it as `__APP_VERSION__`.

## Builds and deploys

- **M/ARC gate** (`build-apk.yml`) runs on every push to every branch: Worker checks, typecheck, tests (three time zones), build, the visual gate (twice, the second time in Pacific/Auckland), then a debug APK signed with the permanent key.
- **Release** (`release-apk.yml`) runs on demand. It needs a green gate on the commit (or runs the gate itself). Version name `<package.json version>.<run>`, version code `major × 1,000,000 + run`, signed with the same permanent key.
- **Deploy Escobar Worker** (`deploy-worker.yml`) runs on pushes to `main` that touch `escobar-worker/`, and on demand. It fails unless the Worker's `/health` reports its key, quotas and US relay.
- **Agent guard** runs on every push and enforces `docs/AGENT-RULES.md`.

Every APK is signed with one permanent key (SHA-256 `05:66:9A:…:F1:F5`), kept in repository secrets. Never commit key material: the repository is public.

## Layout

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the code layers, the state and side stores, how the coach and Escobar work, and how to add things.

`relay/` is Relay, a separate shared workspace where you and your agents (Claude, GPT, Codex…) work on projects through one link. See [relay/README.md](relay/README.md).

The previous single-file app is kept under `legacy/v36/` for reference only. It is not built or shipped.
