import type { PlanDraft } from '@/brain/plan';
import type { Session } from '@/core/models';
import { session, sets } from '../helpers';

const x = (exerciseId: string, n: number) => ({ exerciseId, sets: n });

export const PUSH = { ref: 'push', name: 'Push', exercises: [x('lib_barbell_bench_press', 4), x('lib_incline_dumbbell_press', 3), x('lib_pec_fly', 2), x('lib_dumbbell_shoulder_press', 3), x('lib_dumbbell_lateral_raise', 4), x('lib_triceps_pushdown', 3)] };
export const PULL = { ref: 'pull', name: 'Pull', exercises: [x('lib_lat_pulldown', 4), x('lib_seated_cable_row', 4), x('lib_one_arm_dumbbell_row', 2), x('lib_face_pull', 3), x('lib_dumbbell_biceps_curl', 3)] };
export const LEGS = { ref: 'legs', name: 'Legs', exercises: [x('lib_barbell_back_squat', 4), x('lib_romanian_deadlift', 3), x('lib_leg_press', 3), x('lib_seated_leg_curl', 2), x('lib_standing_calf_raise', 4), x('lib_hip_thrust', 2)] };

export const PPL6: PlanDraft = { splits: [PUSH, PULL, LEGS], schedule: { sun: null, mon: 'push', tue: 'pull', wed: 'legs', thu: 'push', fri: 'pull', sat: 'legs' } };

export const FULL2: PlanDraft = {
  splits: [{ ref: 'full', name: 'Full body', exercises: [x('lib_barbell_back_squat', 2), x('lib_barbell_bench_press', 2), x('lib_lat_pulldown', 2)] }],
  schedule: { sun: null, mon: 'full', tue: null, wed: null, thu: 'full', fri: null, sat: null },
};

export const LEGS_BACK_TO_BACK: PlanDraft = { splits: [PUSH, PULL, LEGS], schedule: { sun: null, mon: 'legs', tue: 'legs', wed: null, thu: 'push', fri: 'pull', sat: null } };

/** An advanced lifter: every muscle's level lands in the top band. */
export function advancedHistory(): Session[] {
  const out: Session[] = [];
  const ids = [...PUSH.exercises, ...PULL.exercises, ...LEGS.exercises].map(e => e.exerciseId);
  for (let i = 0; i < 90; i++) {
    const d = new Date(Date.UTC(2025, 0, 1 + i * 3)).toISOString().slice(0, 10);
    out.push(session(d, ids.map(id => ({ id, sets: sets(50, 10, 'ideal', 3) }))));
  }
  return out;
}
