export const meta = {
  name: 'pilot-a-calibrated-critic',
  description: 'Blind, calibrated visual critic for library pilot A (plan 3.4): prepare a shuffled plate set with 2 hidden approved plates and 2 planted defects, run a fresh Opus critic, check calibration, rerun if invalid',
  phases: [
    { title: 'Prepare', detail: 'render pilot A, hidden approved plates and two planted defects into a blind set' },
    { title: 'Critic', detail: 'fresh Opus critic scores every plate R1-R10' },
  ],
}

const SCR = args.scratch
const PREP_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    problem: { type: 'string' },
    workdir: { type: 'string' },
    branchHead: { type: 'string' },
    platesPageSha: { type: 'string' },
    referenceIds: { type: 'array', items: { type: 'string' } },
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          id: { type: 'string' },
          kind: { type: 'string', enum: ['pilot', 'approved', 'plant'] },
          tier: { type: 'string' },
          plantItem: { type: 'string' },
          plantDescription: { type: 'string' },
        },
        required: ['label', 'id', 'kind', 'tier'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['ok', 'workdir', 'candidates'],
}

const CRITIC_SCHEMA = {
  type: 'object',
  properties: {
    plates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          scores: {
            type: 'object',
            properties: {
              R1: { type: 'integer' }, R2: { type: 'integer' }, R3: { type: 'integer' }, R4: { type: 'integer' },
              R5: { type: 'integer' }, R6: { type: 'integer' }, R7: { type: 'integer' },
              R8: { type: ['integer', 'null'] }, R9: { type: ['integer', 'null'] }, R10: { type: ['integer', 'null'] },
            },
            required: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'],
          },
          findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item: { type: 'string' },
                problem: { type: 'string' },
                where: { type: 'string' },
                fix: { type: 'string' },
              },
              required: ['item', 'problem', 'fix'],
            },
          },
        },
        required: ['label', 'scores', 'findings'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['plates'],
}

phase('Prepare')
const prep = await agent(`You prepare the input set for a BLIND, CALIBRATED visual critic of the M/ARC library How-to pilot A plates (plan section 3.4). Work only in the scratch directory ${SCR}/critic-a (create it). Never commit, push or edit any tracked file in any branch. Planted copies are never committed.

Repo: /home/user/M-arc (GitHub macdarenz-droid/M-arc; run git fetch origin). Read only what you need:
- Plan: docs/howto/library/LIBRARY-HOWTO-ARCHITECTURE.md on origin/claude/howto-options, section "3.4 Visual critic" (git show origin/claude/howto-options:<path>).
- Pilot A: branch origin/claude/lib-8-pilot-a (head c6e5b667bc66dcecfbfa5afac3412e7a5ad8c71c expected; record the real head). Tooling: tools/plates/library/pilot-a/build.mjs (builds the sheet, the plates page and 390 px @2x shots <id>-{dark,paper,mistake-dark}.png), tools/plates/library/report.mjs (<spec> --shots <dir>), specs in tools/plates/library/specs/, verified cards in tools/plates/library/pilot-a/cards/<id>.json, plates.json (the pilot list). The pilot sheet has 18 plates (the rear-delt fly is held off the sheet); use exactly the plates on the sheet.
- The 8 approved golden-A plates (the owner-approved reference) are built by the same engine; find their specs and how to render them at the same 390 px @2x in the same three states (look at how the golden-A page / build-page.mjs and report.mjs load them).

Steps:
1. git worktree prune; git worktree add ${SCR}/critic-a/wt origin/claude/lib-8-pilot-a; in it run npm ci (needed for the build). Run node tools/plates/library/pilot-a/build.mjs and record the plates page sha256 (expected 895e92fa3c002a7ea899a7f89dc60b7427de00004d8fd05d46e3eb6aa882923b; report any difference, do not fix it). Chromium is at /opt/pw-browsers (MARC_CHROMIUM=/opt/pw-browsers/chromium if a script needs it).
2. Hidden approved plates: pick 2 of the 8 approved plates that resemble pilot plates (on 09-30 the calibration used lat_pulldown and seated_cable_row; you may reuse them). Render each in the same three states, same size, same file naming as the pilot shots.
3. Reference set: the remaining 6 approved plates, rendered the same way, into ${SCR}/critic-a/reference/<id>-{dark,paper,mistake-dark}.png. The 2 hidden plates must NOT appear in the reference set.
4. Planted defects: make 2 temporary copies (in ${SCR}/critic-a/plants/, never in the worktree's tracked files; if a spec must sit in the tree to render, copy it under a new untracked name and delete it after) of two DIFFERENT pilot plates, each with ONE defect that automation cannot catch and a careful designer would: e.g. a callout leader that ends on the wrong joint or body part (R4), or a Mistake drawn on the wrong leg/arm or a Mistake that shows a different fault than its label (R5), or a hand visibly not on the handle (R3). Keep the engine report ok. Render them like the others. Record which rubric item each plant targets.
5. Assemble the blind set: ${SCR}/critic-a/set/P01 .. P22 (18 pilot + 2 hidden approved + 2 plants; the plants are EXTRA copies, so the two pilot originals of the planted plates also stay in the set). Shuffle the order so position reveals nothing (e.g. sort by sha256 of id+"m-arc-pilot-a"). Each P## folder holds: dark.png, paper.png, mistake-dark.png, and facts.json = the plate-relevant facts from that exercise's verified research card (its plate section: checkpoints, mistake, tells, tempo, the facts a drawing must match, and its safety tier). For the hidden approved plates use their verified cards in docs/research/howto/cards/ on origin/claude/libht-research (or golden-B content) in the same shape. facts.json must not reveal approved / planted / pilot status, file paths, or spec names that differ from the plate's exercise name. No other file in set/.
6. Also write ${SCR}/critic-a/set/README.md: one line per P## with only the exercise name and tier, and what each image is.
7. Do NOT write the answer key (which P## is approved or planted) to any file. Return it only in your structured output.

Return: ok (false with problem if anything blocks), workdir (${SCR}/critic-a), branchHead, platesPageSha, referenceIds, candidates (label, id, kind pilot|approved|plant, tier, and for plants plantItem + plantDescription), notes (anything the supervisor must know: missing states, render differences, size).`, { label: 'prepare blind set', phase: 'Prepare', schema: PREP_SCHEMA })

if (!prep || !prep.ok) {
  return { stage: 'prepare', prep }
}

const labels = prep.candidates.map(c => c.label).sort()
const criticPrompt = (n) => `You are a fresh, independent visual critic (run ${n}) for M/ARC's exercise How-to plates: technical drawings of a lifter doing an exercise, shown in a phone app at 390 px wide (the images are 780 px wide, 2x). The owner approved a reference set of plates; new plates must reach the same bar. Judge each candidate plate on its own merits against that bar. Look at every image yourself with the Read tool.

Inputs (read only these paths; do not look anywhere else on disk):
- Reference (owner-approved plates, the quality bar and house style): ${prep.workdir}/reference/*.png (states: dark = Silent Black theme, paper = Paper theme, mistake-dark = the Mistake view in Silent Black).
- Candidates: ${prep.workdir}/set/P01 .. ${prep.workdir}/set/${labels[labels.length - 1]}, each with dark.png, paper.png, mistake-dark.png and facts.json (the verified research facts the drawing must match, and its safety tier). ${prep.workdir}/set/README.md lists them. Candidates: ${labels.join(', ')}.

Rubric, score 1-5 per item for every candidate (5 = as good as the approved reference; 4 = acceptable, at the approved bar; 3 or less = a real problem a careful designer or coach would fix):
- R1 pose truth (joint angles and body position match the facts and real technique);
- R2 equipment realism and scale;
- R3 contact plausibility (hands, feet, back actually on the handle, bar, bench, floor);
- R4 label placement "as a designer would": each callout leader ends on the body part or equipment its label names;
- R5 the Mistake reads in 2 seconds (the fault shown is the labelled fault, clearly visible);
- R6 the Trace (motion path) means something;
- R7 consistent with the reference (line weight, density, framing, same equipment drawn the same way);
- R8 close-ups (Right and Wrong not swapped, thumb and handle placement): null if the plate has no close-up;
- R9 feel regions match the card: null if no feel region is shown;
- R10 tier A only: the "right" pose never shows an unsafe setup (safeties or J-hooks where the facts require them, bar path clear of the neck): null for other tiers.

House conventions of the approved plates that are NOT defects: Mistake labels without leaders; loose leader ends that stop on an outline; angle labels that repeat a checkpoint; ghost (dashed) poses that overlap the body. R4 counts only where a leader or arc clearly sits on a different body part than its label names. Missing tempo seconds where the facts give none is not a defect.

For every item scored 3 or less, give a finding: the item, the problem, where (pixel coordinates in the 780-px-wide image and which image), and a concrete fix. Be exact and honest; do not invent problems to look strict, and do not pass a real problem to look kind.

Return every candidate in ${labels.join(', ')} with scores and findings.`

phase('Critic')
const runs = []
let final = null
for (let n = 1; n <= 3 && !final; n++) {
  const res = await agent(criticPrompt(n), { label: `critic run ${n}`, phase: 'Critic', schema: CRITIC_SCHEMA })
  if (!res) { runs.push({ n, valid: false, reasons: ['critic returned nothing'] }); continue }
  const byLabel = Object.fromEntries(res.plates.map(p => [p.label, p]))
  const reasons = []
  for (const c of prep.candidates) {
    const p = byLabel[c.label]
    if (!p) { reasons.push(`${c.label} missing`); continue }
    const sc = Object.entries(p.scores).filter(([k, v]) => v !== null && v !== undefined)
    if (c.kind === 'approved') {
      const low = sc.filter(([k, v]) => v < 4)
      if (low.length) reasons.push(`hidden approved ${c.id} (${c.label}) scored below 4: ${low.map(([k, v]) => k + '=' + v).join(', ')}`)
    }
    if (c.kind === 'plant') {
      const target = c.plantItem && p.scores[c.plantItem]
      const caught = (typeof target === 'number' && target < 4)
      if (!caught) reasons.push(`plant ${c.id} (${c.label}, ${c.plantItem}: ${c.plantDescription}) not caught (score ${target})`)
    }
  }
  const valid = reasons.length === 0
  runs.push({ n, valid, reasons })
  log(`critic run ${n}: ${valid ? 'VALID' : 'discarded: ' + reasons.join('; ')}`)
  if (valid) final = res
}

const key = Object.fromEntries(prep.candidates.map(c => [c.label, c]))
const mapped = final ? final.plates.map(p => ({ ...p, id: key[p.label] && key[p.label].id, kind: key[p.label] && key[p.label].kind })) : null
return { prep: { branchHead: prep.branchHead, platesPageSha: prep.platesPageSha, referenceIds: prep.referenceIds, notes: prep.notes, candidates: prep.candidates }, runs, final: mapped, criticNotes: final && final.notes }
