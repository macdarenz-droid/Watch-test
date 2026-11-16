# marc-coach: Escobar v2 Worker

A stateless, single-step relay between the M/ARC app and the Claude API (spec: `docs/ESCOBAR-ARCHITECTURE.md` §12). The app runs every tool locally; each `POST /v2/turn` is one streamed model step. The Worker owns the policy prompt, the tool definitions, model and effort, quotas and the API key.

## Deploy

It deploys under the existing Worker name `marc-coach`, so the stored `ANTHROPIC_API_KEY` secret and bindings carry over:

```sh
cd escobar-worker
npm ci
npx wrangler deploy
```

CI deploys on pushes to `main` that touch this folder, or on demand ("Deploy Escobar Worker"), with the pinned wrangler from `package.json`. It fails unless `/health` shows `quotas: true`.

The app treats Escobar as online only when `GET /health` answers `protocol: 2`.

## Routes

- `GET /health` → `{ok, protocol: 2, model, models, modes, quotas, relay, key, ignoredModels}` (`quotas` is true when `QUOTA_DO` or `QUOTA` is bound; `relay` when `UPSTREAM` is bound; `ignoredModels` names the modes whose `MODEL_<MODE>` is not a model the Worker can drive)
- `POST /v2/turn` (header `x-escobar-device: dev_<24 hex>`) → `text/event-stream` of `data: {t: …}` events: `start`, `text`, `thinking`, `tool`, `tool_input`, `final`, `refusal`, `error`; `: ping` every 10 s. Validation, quota and rate failures are plain 400/429 JSON before the stream.

## Configure (wrangler.toml `[vars]`)

- `MODEL` (default `claude-opus-5`), `MODEL_CHAT|PLAN|LIVE|BRIEF|MOMENT|SUMMARIZE` (one of `MODE_MODELS` in `src/anthropic.ts`, else ignored), `EFFORT_CHAT|PLAN|LIVE|BRIEF|MOMENT|SUMMARIZE`
- `MAX_TURNS_PER_DEVICE` 80, `MAX_STEPS_PER_DEVICE` 400, `MAX_OUTPUT_PER_DEVICE` 400000, `MAX_TURNS_PER_IP` 300, `MAX_STEPS_TOTAL` 20000, `MAX_OUTPUT_TOTAL` 3000000
- `ALLOWED_ORIGINS` for the PWA; the Android app is always allowed
- `RATE` rate-limit binding: 30 steps a minute per device; `RATE_IP`: 60 requests a minute per client IP

Quotas live in the `QUOTA_DO` Durable Object (`src/quotaDO.ts`, one SQLite-backed instance per UTC day), which counts every model step exactly. If Durable Objects are unavailable on the account, bind the `QUOTA` KV namespace instead (`npx wrangler kv namespace create QUOTA`, then paste its id): those counters are soft and written once per user turn.

The Anthropic call runs in the `UPSTREAM` Durable Object (`src/upstreamRelay.ts`), pinned to eastern North America with `locationHint: 'enam'`, so it always leaves from the US. Anthropic refuses some locations, and Cloudflare serves each network from its nearest location (a Philippine ISP was routed to Hong Kong). A 403 reaches the app as `upstream_region`; a 401 stays `upstream_auth`; both carry the API's text as `detail`.

A step cut short before the API reports its usage (a hang-up, a timeout, a mid-stream error) is charged for the time it ran at `CUT_SHORT_TOKENS_PER_SEC` (200 output tokens a second, up to the step's `max_tokens`), or its streamed characters / 3 if more, because its thinking is billed but never streamed.

Every step logs one JSON line (`requestId, colo, mode, model, stop_reason, in, out, cacheRead, cacheWrite, steps, ms`), with no device id and no content; read it with `npx wrangler tail`.

## Tools

`src/tools.generated.json` is generated from the app (`src/escobar/tools/schema.ts`, `src/escobar/context/modes.ts`): run `npm run escobar:tools` at the repo root after changing a tool, then redeploy. A test in the app fails when they drift.

## Test

`npm run check` (typecheck + vitest against a scripted SDK stream; no network).
