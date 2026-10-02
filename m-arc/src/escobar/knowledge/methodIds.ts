/** Topics `explain_method` can explain (§16.2): how the app computes each number it shows. */
export type MethodId =
  | 'recovery' | 'readiness' | 'progression' | 'volume_bands' | 'deload_trigger' | 'e1rm' | 'plateau'
  | 'effort_calibration' | 'warmup' | 'hr_rest' | 'hr_zones' | 'energy' | 'fidelity' | 'records' | 'balance' | 'weekly_review';

export const METHOD_IDS: MethodId[] = [
  'recovery', 'readiness', 'progression', 'volume_bands', 'deload_trigger', 'e1rm', 'plateau',
  'effort_calibration', 'warmup', 'hr_rest', 'hr_zones', 'energy', 'fidelity', 'records', 'balance', 'weekly_review',
];
