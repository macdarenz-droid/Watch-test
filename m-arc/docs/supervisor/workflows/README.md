# In-chat Workflows

An in-chat Workflow is a script run by the supervisor's session with the Workflow tool. The script starts many agents, in parallel where that helps, and returns one result to the supervisor.

## What they are for here

**Hard judgement only.** Research, rating, analysis of a proposal, a root-cause hunt: places where independent views plus a judge beat one view. Examples so far: the app rating (`docs/research/app-rating/`), the Gym Finder review (`docs/research/gym-finder/`), the HT-7 root cause (below).

**Never builds.** Code is built by one builder session per card on a `claude/*` branch, reviewed by a fresh reviewer (see `docs/supervisor/HANDOVER.md` and `.claude/skills/builder/SKILL.md`). A Workflow does not commit, push or comment on a PR. Early in this project a few Workflows did build code; do not copy that.

**Models and cost.** Agents inherit the session model. Use a Workflow only when the question is hard enough to be worth several agents (`AGENTS.md`: never add agents that duplicate each other). Do the small things yourself.

## Shapes that worked

- **Lenses and a judge** (HT-7 root cause): four agents each read the evidence through one lens and return ranked hypotheses; one judge verifies the strongest claims against the code and returns a ranked list, an experiment plan and fixes.
- **Parallel readers, then a red team** (Gym Finder): three agents answer three questions about the same proposal (what it is, how it fits the code, what outside rules apply). A fourth attacks the supervisor's plan.
- **Two parallel researchers** (app rating): one reads the code, one reads the market.

Each agent prompt names the repo, says "read only", and asks for file paths for every claim and "not verified" for anything unchecked.

## How to run one

1. Read the script and its `args` file. Update `args` (for HT-7: the current PR head and the newest evidence).
2. Call the Workflow tool with `script` set to the file's text (or `scriptPath` set to the file) and `args` set to the JSON object. Pass `args` as a real JSON object, not as a string.
3. The result gives a run id and a transcript folder. `journal.jsonl` in that folder holds each agent's return value; read it if a result looks empty. The supervisor saved the Gym Finder and rating results from there.
4. To continue after a pause or a script edit, relaunch with `scriptPath` and `resumeFromRunId`. The unchanged start of the script is served from cache.
5. Save the outcome in the repo: a research folder for a research result, or an addendum to the card or ruling for a decision. Do not leave it in chat only.

Scripts cannot use `Date.now()`, `Math.random()` or a bare `new Date()`. Pass any time in through `args`.

## Scripts in this folder

| File | What it does | State |
|---|---|---|
| `ht7-label-variance-rootcause.js` | HT-7 (#119): the "Bony bump" SVG label in the posture close-up sometimes lays out 25.2705 wide instead of 25.3114, which fails the L3 pixel check against golden B (881 px). Four lenses (SVG text scaling, font cache, app environment, measurement harness) then a judge. Must keep L3 at 0 px, change no golden or plate, loosen no check. | Done 09:2x UTC: `ht7-label-variance-rootcause.result.md` (judge synthesis + raw lens hypotheses). Outcome: D-HT7-L3-text-7, -8 (withdrawn), -9 (HANDOVER 4.3). |
| `ht7-label-variance-rootcause.args.json` | Its input: the HT-7 head `75fd1a2` and the builder's measured evidence (rates, failed fixes a to i, per-frame trace, font facts, environment). | Rerun with a newer head if HT-7 moves. |
| `marc-rating.js` | App rating: two read-only researchers in parallel (the code on main, the market). No args. Output: `docs/research/app-rating/`. | Done 10-01. |
| `gym-finder-review.js` | Gym Finder (#158): three read-only agents in parallel (proposal, codebase fit, external constraints). No args. Output: `docs/research/gym-finder/gf-0.md` to `gf-2.md`. | Done 10-01. Gym Finder is **parked**: no rerun without the owner's approval. |
| `gym-finder-redteam.js` | Gym Finder: one red-team agent attacks the draft plan. It reads its inputs from `origin/main:docs/research/gym-finder/`. Output: `docs/research/gym-finder/gf-redteam.md`. | Same as above. |
| `pilot-a-critic.js` | Library pilot A (#109), plan 3.4: one Opus agent builds a blind set in the scratchpad (18 pilot plates, 2 hidden approved plates, 2 planted defects, shuffled, facts per plate, the answer key only in its output), then a fresh Opus critic scores R1-R10; plain code checks the calibration (hidden approved plates all at 4 or more, both plants scored below 4 on their item) and reruns a fresh critic up to 3 times. Args: `{"scratch": "<scratchpad dir>"}`. For another batch, change the branch, head, plate count and expected plates page sha in the prepare prompt. | Started 10-02 08:00 (`wf_1d2fcf84-613`) on `c6e5b66`. Result goes on #109. |

### HT-7 result

Done. Top cause (≈0.75): in Chromium 141 an SVG text's font size includes outer CSS transforms, so the zoom's mid-animation scale can bake into the label's font (frame-10 sample reproduces 25.2705 exactly). E1 then showed a per-tab font state that no app lever heals. D-HT7-L3-text-8 ("local 141 only") was withdrawn when CI's Chrome 153 showed it too; D-HT7-L3-text-9 runs E6/E4 and fix candidates F1/F2. Full text: `ht7-label-variance-rootcause.result.md`.

## Other scripts from this session

Many other Workflows ran in the first supervisor session (for example the How-to plans and plate critics, the architecture review ARCH-1, the library How-to architecture, the Escobar report plan). Their scripts live only in the session's folder on the current account and are lost on an account switch; they are not kept here. Their results are in the research folders, the cards and `docs/COACHING-DECISIONS.md`. To redo one, rebuild it from the shape above and the matching research README.
