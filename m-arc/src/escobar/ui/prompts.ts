/**
 * Screen-aware prompts (§4.1, §4.2, §7.4): the dock's line, the starter chips and the
 * context reference the dock attaches, all chosen from the brain's current state.
 */
import type { AppState } from '@/core/models';
import { findExercise } from '@/core/exercises';
import { muscleLabel, type MuscleId } from '@/data/muscles';
import type { ReadinessResult } from '@/brain/readiness';
import type { Focus } from '../palace/focus';
import type { ContextRef } from '../types';

/**
 * ES-17: a request for a new or changed programme. Word-bounded so "Bulgarian split squat" and
 * "morning routine" do not switch the conversation into plan mode for good.
 */
export const PLAN_REQUEST = /\b(new|make|build|write|create|design|plan|change|redo)\b[^.?!]{0,40}\b(programme|program|routine|split)\b(?!\s*squat)|\b\d[- ]day (split|program|programme|routine)\b|\b\d (days?|times) a week\b/i;
export const isPlanRequest = (text: string): boolean => PLAN_REQUEST.test(text);

function lastLift(s: AppState): { id: string; name: string } | null {
  for (const sess of [...s.sessions].reverse()) for (const e of sess.exercises) {
    const ex = findExercise(e.exerciseId, s.customExercises);
    if (ex && e.sets.some(x => (x.kg ?? 0) > 0)) return { id: ex.id, name: ex.name };
  }
  return null;
}

export function starterChips(s: AppState, r: ReadinessResult | null): string[] {
  const lift = lastLift(s);
  const out = [
    r?.band === 'amber' || r?.band === 'red' ? `Why is my readiness ${r.band}?` : 'How ready am I today?',
    s.sessions.length ? 'What should I lift today?' : 'Build me a 4-day programme',
    lift ? `Show my ${lift.name.toLowerCase()} trend` : 'How do I log my first workout?',
    s.sessions.length ? 'Build me a 4-day programme' : 'What should I lift today?',
    'How is recovery calculated?',
    'Take me to my records',
  ];
  return [...new Set(out)].slice(0, 6);
}

export function dockPromptFor(focus: Focus | null, s: AppState, r: ReadinessResult | null): string {
  const id = focus?.id ?? '';
  const d = focus?.details ?? {};
  if (id === 'history.exercise-stats' && typeof d.exerciseId === 'string') {
    const ex = findExercise(d.exerciseId, s.customExercises);
    if (ex) return `How is my ${ex.name.toLowerCase()} going?`;
  }
  if (id === 'history.session') return 'What stood out in this session?';
  if (id.startsWith('history')) return 'How did my week go?';
  if (id === 'body.muscle' && typeof d.muscle === 'string') return `Is my ${muscleLabel(d.muscle as MuscleId).toLowerCase()} recovered?`;
  if (id.startsWith('body')) return 'Which muscles are ready to train?';
  if (id.startsWith('coach')) return 'What should I focus on this week?';
  if (id.startsWith('train')) return 'What should I lift today?';
  if (r && r.band !== 'green') return `Why is my readiness ${r.band}?`;
  return 'Ask about today’s readiness';
}

export function contextRefFor(focus: Focus | null, s: AppState): ContextRef | null {
  const id = focus?.id ?? '';
  const d = focus?.details ?? {};
  if (id === 'history.exercise-stats' && typeof d.exerciseId === 'string') {
    const ex = findExercise(d.exerciseId, s.customExercises);
    return ex ? { kind: 'exercise', id: ex.id, label: `${ex.name} trend` } : null;
  }
  if (id === 'history.session' && typeof d.sessionId === 'string') {
    const sess = s.sessions.find(x => x.id === d.sessionId);
    return sess ? { kind: 'session', id: sess.id, label: `Session ${sess.day}` } : null;
  }
  if (id === 'body.muscle' && typeof d.muscle === 'string') return { kind: 'muscle', id: d.muscle, label: muscleLabel(d.muscle as MuscleId) };
  if (id.startsWith('today')) return { kind: 'readiness', id: 'today', label: 'Today’s readiness' };
  return null;
}
