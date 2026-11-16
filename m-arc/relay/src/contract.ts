// The project contract: rules every agent reads, and the three root files that keep a project organised.
export const CONTRACT = 'CONTRACT.md'
export const STATE = 'PROJECT_STATE.md'
export const LOG = 'LOG.md'
export const PLAYBOOK = 'PLAYBOOK.md'
/** Root files listed first, in this order. */
export const PINNED = [CONTRACT, STATE, LOG, PLAYBOOK]
/** Workspace-wide, owner-only documents: one copy in every project, edited once. */
export const SHARED_DOCS = [CONTRACT, PLAYBOOK]

/** The first published contract; kept so an unedited copy can be upgraded in place. */
export const CONTRACT_V1 = `# Contract

Every agent (Claude, GPT, Codex, …) and the owner follow these rules in this project. Read them before you act. Only the owner edits this file: propose changes in a message.

## 1. How we work
- **Low token use is the priority.** Read only what the task needs, write short, don't repeat context. Spend more only when a task is complex and truly needs it.
- **Plain words.** When you explain or summarise for the owner, use plain, simple words.
- **Short progress updates.** During a task, post what changed, in plain words, only when it matters.
- **Decide, don't ask.** When something needs a decision, research first, pick the best logical option, apply it, and note why in LOG.md. Ask the owner only for input or an action no AI agent can do (a payment, a login, a secret, a check on a real device).
- **No guessing, even on simple tasks.** Check the code, docs or data first. If you cannot verify something, say so.
- **Review before moving on.** After each task, look at what was built: the feature, its logic, how it works. If it meets the goal, go to the next task; if not, fix or improve it first.
- **Precision at every layer:** code, tests, tasks, messages.
- **Prevent, don't apologise.** Anything that could have been caught earlier (by reading, testing or reviewing) must be caught before it ships. No after-the-fact "I should have…".
- **Quality.** Bugs are unavoidable. While building, check each change with focused tests and the review above. Full regression and full QA run once, on the finished build, not on every early patch.
- **Risk management.** Name risks and their mitigations when designing, while building, and after release.

## 2. One file per topic, kept current
- Before you create a file, look for one on the same topic (search, read the folder). If it exists, update it; don't start a new one.
- No version copies. Names like \`plan-v2\`, \`plan final\`, \`plan copy\`, \`patch-1.2\` or a date in the name are refused when the topic's file already exists. Extend the existing file instead.
- A new file is welcome when it covers something no file covers yet. Name it for its topic: \`UPPER_SNAKE.md\` for living documents, \`kebab-case.md\` for notes.
- Agents delete nothing. If a file is obsolete, say so in LOG.md; the owner removes it.

## 3. The three root files
- \`CONTRACT.md\`: these rules (owner only).
- \`PROJECT_STATE.md\`: the one current picture (phase, done, next, open questions). Replace outdated lines and keep it short. History does not go here.
- \`LOG.md\`: the history. After every change or finished step, add one line at the bottom (append_file):
  \`- 2026-09-24 14:05 UTC · GPT · docs/PROJECT_STATE.md · what changed and why\`
  Never rewrite or remove past lines.

## 4. Where things go
- \`agents/<you>/\`: your own working thread and notes.
- \`agents/handoffs/\`: handoffs between agents.
- \`docs/\`: design and decisions, one file per subject with sections inside (one \`DECISIONS.md\`, not a file per decision).
- \`tasks/\`, \`releases/\`: one checklist each, kept current.
If this project's folders differ, keep the same idea: one place per kind of thing.

## 5. Messages
- Post in the folder the work belongs to. One message per result, not per thought.
- First line: the outcome. Refer to files by path; don't paste whole files.
- Handoffs: Goal · Done · Decisions · Files to read · Acceptance criteria · Out of scope.
- @mention someone only when you need them to act.

## 6. Safety
- Never post secrets, keys or link URLs.
- Read a file fully before you replace it. Keep what others wrote unless it is wrong, and log why you changed it.
`

/** The current default: v1 plus the playbook and the Dashboard tracker. */
export const DEFAULT_CONTRACT = CONTRACT_V1
  .replace(
    "- \`LOG.md\`: the history.",
    "- \`PLAYBOOK.md\`: how the supervisor runs delivery (owner only). Supervisors follow it; everyone reads only the section they need.\n- \`LOG.md\`: the history.",
  )
  .replace('## 3. The three root files', '## 3. The root files')
  .replace(
    "- \`tasks/\`, \`releases/\`: one checklist each, kept current.",
    "- **Dashboard tracker**: every task, patch, bug, feature and release is one item, kept current with update_item (not in files). Blocked needs a reason and what unblocks it; done means integrated and accepted, with evidence.\n- **Dashboard progress**: architecture components and the release stage, kept current with update_progress (supervisors).",
  )

export const defaultState = (project: string) => `# ${project}: project state

The one current picture of this project. Replace outdated lines; history goes in LOG.md.

## Now
- Phase:
- Working on:

## Done
-

## Next
-

## Open questions
-
`

export const defaultLog = (when: string) => `# Log

One line per change, newest at the bottom. Never rewrite past lines.
Format: \`- YYYY-MM-DD HH:MM UTC · who · path · what changed and why\`

- ${when} · Relay · CONTRACT.md, PROJECT_STATE.md, LOG.md · project files created
`

/**
 * What a file name is about, without version noise: "plan-v2.md", "Plan (copy).md", "plan final.md" and
 * "plan 2026-09-24.md" all give the key of "plan.md"; "patch-1.md" and "patch-1.2.md" share one too.
 */
export function topicKey(name: string): string {
  const n = name.toLowerCase()
  const dot = n.lastIndexOf('.')
  const [stem, ext] = dot > 0 ? [n.slice(0, dot), n.slice(dot)] : [n, '']
  const core = stem
    .replace(/_/g, ' ')
    .replace(/\(\s*\d+\s*\)/g, ' ')
    .replace(/\b\d{4}[-. ]?\d{2}[-. ]?\d{2}\b/g, ' ')
    .replace(/\b(v|ver|version|rev|revision|patch|draft|update)[\s.-]*\d+(?:[.-]\d+)*\b/g, ' ')
    .replace(/\b(final|new|newer|updated|latest|copy|fixed|revised|edited|old|backup|bak|tmp|temp|wip)\b/g, ' ')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[\s.-]+/g, ' ')
    .trim()
  return `${core}|${ext}`
}
