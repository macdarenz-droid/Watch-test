---
paths:
  - "escobar-worker/**"
  - "src/core/models.ts"
  - "src/core/store.ts"
  - "src/core/migrate.ts"
  - ".github/**"
  - "scripts/prepare-android.sh"
  - "native/patch_manifest.py"
---

# Owner-gated and supervisor-owned files

You are touching a file that someone other than a builder decides on. The full rules are in AGENTS.md ("Only the owner", "Never" and the file ownership table).

- `escobar-worker/**`: merging it into `main` deploys the live Worker. It goes in its own PR, which only the owner merges. No agent merges it or deploys the Worker.
- `src/core/models.ts`, `src/core/store.ts`, `src/core/migrate.ts`: the saved data shape. A new kind of stored or sent user data needs the owner's approval before it is built. If your card does not cite that approval, stop and tell the supervisor.
- `.github/**`, `scripts/prepare-android.sh`, `native/patch_manifest.py`: owned by the supervisor. Only add checks. Never touch the signing steps, `EXPECTED_SHA256` or keystore handling, and keep every other agent's CI lines when you merge. If the Agent guard fails, read `docs/AGENT-RULES.md`.
