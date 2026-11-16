/**
 * Optional starter splits. Names and set counts only. Loads are never
 * pre-filled: the coach suggests a starting weight from the equipment.
 */
export interface SplitTemplate {
  key: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_a' | 'full_b';
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
];
