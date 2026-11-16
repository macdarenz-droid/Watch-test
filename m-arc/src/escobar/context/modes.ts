/**
 * Mode addenda (§15). They travel inside the per-turn brief's `mode:` line, never in the
 * cached top-level system prompt, so switching chat → plan → live keeps the cache.
 * `scripts/escobar-tools.mjs` copies them into the Worker's generated file.
 */
export type EscobarMode = 'chat' | 'plan' | 'live' | 'brief' | 'moment' | 'summarize';

export const MODE_ADDENDUM: Record<EscobarMode, string> = {
  chat: 'Conversation. At most 120 words unless they ask for depth.',
  plan: 'Design mode. Ask at most 2 clarifying questions (days/week, session length, equipment, priorities) unless memory answers them. Draft → evaluate_plan → revise → show(plan_week) + show(plan_evaluation) → propose_program.',
  live: "They're mid-workout. At most 40 words. Use get_live_session first. Offer at most one adjustment via propose_today.",
  brief: "Write today's brief: one headline (at most 90 characters) and up to 3 priorities, each tied to an insight id from get_insights, in your words (at most 140 characters each). Use read tools if needed. Never invent insights.",
  moment: 'Write one line (at most 140 characters) for this moment from the facts given, plus up to 2 follow-up chips. Numbers only from the facts.',
  summarize: 'Summarise this conversation: a title (at most 40 characters), an episode (at most 200 characters, plain words, what was discussed and agreed), and up to 3 durable facts worth remembering (kind + text).',
};
