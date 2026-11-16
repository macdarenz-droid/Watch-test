/**
 * Optional starter splits. Names and set counts only. Loads are never
 * pre-filled: the coach suggests a starting weight from the equipment.
 */
export type SplitTemplateKey = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_a' | 'full_b';

export interface SplitTemplate {
  key: SplitTemplateKey;
  name: string;
  color: string;
  exercises: Array<{ exerciseId: string; sets: number }>;
}

export const SPLIT_TEMPLATES: SplitTemplate[] = [
  {
    key: 'push', name: 'Push', color: '#4d9dff',
    exercises: [
      { exerciseId: 'lib_machine_chest_press', sets: 3 },
      { exerciseId: 'lib_incline_dumbbell_press', sets: 3 },
      { exerciseId: 'lib_dumbbell_shoulder_press', sets: 3 },
      { exerciseId: 'lib_dumbbell_lateral_raise', sets: 3 },
      { exerciseId: 'lib_cable_fly', sets: 3 },
      { exerciseId: 'lib_triceps_pushdown', sets: 3 },
      { exerciseId: 'lib_dumbbell_overhead_triceps_extension', sets: 3 },
    ],
  },
  {
    key: 'pull', name: 'Pull', color: '#7fc44b',
    exercises: [
      { exerciseId: 'lib_lat_pulldown', sets: 3 },
      { exerciseId: 'lib_seated_cable_row', sets: 3 },
      { exerciseId: 'lib_chest_supported_row', sets: 3 },
      { exerciseId: 'lib_face_pull', sets: 3 },
      { exerciseId: 'lib_dumbbell_shrug', sets: 3 },
      { exerciseId: 'lib_dumbbell_biceps_curl', sets: 3 },
      { exerciseId: 'lib_hammer_curl', sets: 3 },
    ],
  },
  {
    key: 'legs', name: 'Legs', color: '#ffc845',
    exercises: [
      { exerciseId: 'lib_leg_press', sets: 3 },
      { exerciseId: 'lib_romanian_deadlift', sets: 3 },
      { exerciseId: 'lib_leg_extension', sets: 3 },
      { exerciseId: 'lib_seated_leg_curl', sets: 3 },
      { exerciseId: 'lib_standing_calf_raise', sets: 3 },
    ],
  },
  {
    key: 'upper', name: 'Upper', color: '#a061ff',
    exercises: [
      { exerciseId: 'lib_barbell_bench_press', sets: 3 },
      { exerciseId: 'lib_lat_pulldown', sets: 3 },
      { exerciseId: 'lib_barbell_overhead_press', sets: 3 },
      { exerciseId: 'lib_seated_cable_row', sets: 3 },
      { exerciseId: 'lib_dumbbell_lateral_raise', sets: 3 },
      { exerciseId: 'lib_dumbbell_biceps_curl', sets: 3 },
      { exerciseId: 'lib_triceps_pushdown', sets: 3 },
    ],
  },
  {
    key: 'lower', name: 'Lower', color: '#ff7a59',
    exercises: [
      { exerciseId: 'lib_barbell_back_squat', sets: 3 },
      { exerciseId: 'lib_romanian_deadlift', sets: 3 },
      { exerciseId: 'lib_leg_press', sets: 3 },
      { exerciseId: 'lib_leg_extension', sets: 3 },
      { exerciseId: 'lib_seated_leg_curl', sets: 3 },
      { exerciseId: 'lib_standing_calf_raise', sets: 3 },
    ],
  },
  {
    key: 'full_a', name: 'Full body A', color: '#2fd4c0',
    exercises: [
      { exerciseId: 'lib_barbell_back_squat', sets: 3 },
      { exerciseId: 'lib_barbell_bench_press', sets: 3 },
      { exerciseId: 'lib_barbell_row', sets: 3 },
      { exerciseId: 'lib_dumbbell_lateral_raise', sets: 3 },
      { exerciseId: 'lib_triceps_pushdown', sets: 3 },
    ],
  },
  {
    key: 'full_b', name: 'Full body B', color: '#f25fa0',
    exercises: [
      { exerciseId: 'lib_conventional_deadlift', sets: 3 },
      { exerciseId: 'lib_barbell_overhead_press', sets: 3 },
      { exerciseId: 'lib_lat_pulldown', sets: 3 },
      { exerciseId: 'lib_seated_leg_curl', sets: 3 },
      { exerciseId: 'lib_dumbbell_biceps_curl', sets: 3 },
    ],
  },
];
