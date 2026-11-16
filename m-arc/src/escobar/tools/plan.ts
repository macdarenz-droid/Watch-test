/** The evaluate_plan adapter (§5): validates a draft's shape, then the brain grades it. */
import { evaluatePlan, type PlanEvaluation } from '@/brain/plan';
import { planDraftArg } from './actions';
import type { ToolCtx } from './context';

export function evaluatePlanTool(input: { draft?: unknown }, ctx: ToolCtx): PlanEvaluation {
  const s = ctx.state;
  return evaluatePlan(planDraftArg(input.draft, ctx), { goal: s.goal, custom: s.customExercises, sessions: s.sessions, today: ctx.today, trainingSince: s.profile.trainingSince });
}
