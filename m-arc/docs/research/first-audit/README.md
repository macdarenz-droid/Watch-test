# First audit triage

**Status: done.** All 32 findings are fixed by cards that merged, except DEV-01, which the owner closed by decision (Windows is not a supported dev platform). Live state is in `docs/supervisor/HANDOVER.md`, section 8.

## What it is

The Codex audit of M/ARC (PR #144, branch `claude/codex-audit-2026-10-01`, file `codex-audit.md` on that branch, not on `main`) has 4 P1 and 28 P2 findings. `triage144.md` is the supervisor's triage of the 28 P2s at commit `cd3c921`, posted on 2026-10-01 at 00:03 UTC as a comment on PR #144. That comment is the only other copy; it was not on `main` before this file. The 4 P1s (SEC-01, SEC-03, SCI-01, SCI-02) were skipped there because AUD-1 to AUD-3 already covered them.

| File | What it is |
|---|---|
| `triage144.md` | For each P2: verdict (CONFIRMED by a repro or by reading the cited lines on `main`), impact in one line, priority, whether it needs an owner decision, and the card. Then the cards AUD-4 to AUD-12 with `write_scope`, acceptance tests and collisions. Then merge order and the owner decisions with no card (SCI-10, SCI-11, OBS-KNOW, OBS-ENDPOINT, DEV-01, UI-09 reorder controls). |

Method: the supervisor checked every finding against code. Repros ran as a scratch test file that was not committed (SCI-03, SCI-04, SCI-06, SCI-07, DATA-01). The rest were confirmed by reading the cited lines.

## Outcome

| Card | Findings | PR | Merged in |
|---|---|---|---|
| AUD-1 | SCI-01, SCI-02 | #146 | train 2 (`b795f16`) |
| AUD-2 | SEC-03 | #147 | train 1 (`29ab29a`) |
| AUD-3 | SEC-01 (Worker) | #145 | `7477b5d` (Worker deploy ok; `/health` ok; `/reports {}` returned 400) |
| AUD-4 | DATA-01, DATA-02, OBS-ENDPOINT, OBS-PHOTOS, OBS-LB | #154 | train 2 |
| AUD-5 | REL-01, UI-10 | #148 | train 1 |
| AUD-6 | SCI-03, SCI-06, UI-07 | #153 | train 1 |
| AUD-7 | SCI-07, NAT-01, NAT-02, NAT-03 | #151 | train 1 |
| AUD-8 | SCI-04, SCI-05, SCI-08, UI-12 | #155 | train 1 |
| AUD-9 | SCI-09, OBS-EFFORTLABEL, OBS-THRESH, OBS-DRIFT, OBS-WEIGHT | #150 | train 1 |
| AUD-10 | UI-01, UI-03, UI-05, UI-06, UI-09 (Train, reorder) | #157 | train 3 (`170b828`) |
| AUD-11 | UI-02, UI-04, UI-11, OBS-TONNE | #159 | train 4 (`6a3b6b0`) |
| AUD-12 | UI-08, UI-09 (rest) | #156 | train 4 |
| AUD-20 | SCI-10, SCI-11, OBS-KNOW | #162 | train 5 (`958a3de`) |

Merge trains: 1 `29ab29a`, 2 `b795f16`, 3 `170b828`, 4 `6a3b6b0`, 5 `958a3de`. Each card's rulings are in `docs/COACHING-DECISIONS.md`.

## Related, still parked

The improvement audit (PR #149; its triage proposed AUD-13 to AUD-19) is separate. The owner parked it on 2026-10-01 at 01:15 UTC: "Park this audit improvement for now. Lets finish all the how to do first. And all the first audit fixes." At 01:30 UTC: "Remind me when we finished all of the how to. And all first audit 32 items. Then after that we proceed." The reminder is due when the how-to lane (HT-3c to HT-10, up to milestone M1) and all 32 first-audit items have merged. Feature proposals from that audit stay owner decisions. Gym Finder is a separate parked item: `docs/research/gym-finder/README.md`.
