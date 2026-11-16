/**
 * The 24-muscle vocabulary shared by the exercise library, the recovery
 * model, the coach and the muscle map. Keys never change; labels are the
 * plain words shown to the user.
 */
export type MuscleId =
  | 'chest' | 'upper_chest' | 'front_delts' | 'side_delts' | 'rear_delts' | 'rotator_cuff'
  | 'biceps' | 'triceps' | 'brachialis' | 'forearms'
  | 'lats' | 'mid_back' | 'upper_traps' | 'lower_back'
  | 'abs' | 'obliques' | 'core' | 'hip_flexors'
  | 'quads' | 'hamstrings' | 'glutes' | 'adductors' | 'abductors' | 'calves';

/** Coarse groups used for balance checks and the map legend. */
export type MuscleGroup = 'chest' | 'shoulders' | 'arms' | 'back' | 'core' | 'legs';
/** Push / pull / lower buckets used by the training-balance rule. */
export type BalanceBucket = 'push' | 'pull' | 'lower' | 'neutral';

export interface Muscle {
  id: MuscleId;
  label: string;
  group: MuscleGroup;
  bucket: BalanceBucket;
  /** Which side of the body map draws it. */
  view: 'front' | 'back';
}

export const MUSCLES: Muscle[] = [
  { id: 'chest', label: 'Chest', group: 'chest', bucket: 'push', view: 'front' },
  { id: 'upper_chest', label: 'Upper chest', group: 'chest', bucket: 'push', view: 'front' },
  { id: 'front_delts', label: 'Front shoulders', group: 'shoulders', bucket: 'push', view: 'front' },
  { id: 'side_delts', label: 'Side shoulders', group: 'shoulders', bucket: 'push', view: 'front' },
  { id: 'rear_delts', label: 'Rear shoulders', group: 'shoulders', bucket: 'pull', view: 'back' },
  { id: 'rotator_cuff', label: 'Rotator cuff', group: 'shoulders', bucket: 'neutral', view: 'back' },
  { id: 'biceps', label: 'Biceps', group: 'arms', bucket: 'pull', view: 'front' },
  { id: 'triceps', label: 'Triceps', group: 'arms', bucket: 'push', view: 'back' },
  { id: 'brachialis', label: 'Brachialis', group: 'arms', bucket: 'pull', view: 'front' },
  { id: 'forearms', label: 'Forearms', group: 'arms', bucket: 'pull', view: 'front' },
  { id: 'lats', label: 'Lats', group: 'back', bucket: 'pull', view: 'back' },
  { id: 'mid_back', label: 'Mid back', group: 'back', bucket: 'pull', view: 'back' },
  { id: 'upper_traps', label: 'Upper traps', group: 'back', bucket: 'pull', view: 'back' },
  { id: 'lower_back', label: 'Lower back', group: 'back', bucket: 'neutral', view: 'back' },
  { id: 'abs', label: 'Abs', group: 'core', bucket: 'neutral', view: 'front' },
  { id: 'obliques', label: 'Obliques', group: 'core', bucket: 'neutral', view: 'front' },
  { id: 'core', label: 'Deep core', group: 'core', bucket: 'neutral', view: 'front' },
  { id: 'hip_flexors', label: 'Hip flexors', group: 'core', bucket: 'neutral', view: 'front' },
  { id: 'quads', label: 'Quads', group: 'legs', bucket: 'lower', view: 'front' },
  { id: 'hamstrings', label: 'Hamstrings', group: 'legs', bucket: 'lower', view: 'back' },
  { id: 'glutes', label: 'Glutes', group: 'legs', bucket: 'lower', view: 'back' },
  { id: 'adductors', label: 'Inner thighs', group: 'legs', bucket: 'lower', view: 'front' },
  { id: 'abductors', label: 'Outer hips', group: 'legs', bucket: 'lower', view: 'front' },
  { id: 'calves', label: 'Calves', group: 'legs', bucket: 'lower', view: 'back' },
];

export const MUSCLE_BY_ID: Record<MuscleId, Muscle> = Object.fromEntries(
  MUSCLES.map(m => [m.id, m]),
) as Record<MuscleId, Muscle>;

export const MUSCLE_IDS = MUSCLES.map(m => m.id);

export function isMuscleId(value: unknown): value is MuscleId {
  return typeof value === 'string' && value in MUSCLE_BY_ID;
}

export function muscleLabel(id: string): string {
  return isMuscleId(id) ? MUSCLE_BY_ID[id].label : id.replace(/_/g, ' ');
}

/** Free-text muscle labels (from custom exercises or old data) to a key. */
export function classifyMuscleText(raw: string): MuscleId | null {
  const q = raw.toLowerCase();
  const rules: Array<[RegExp, MuscleId]> = [
    [/upper chest|incline/, 'upper_chest'],
    [/chest|pec/, 'chest'],
    [/rear delt|posterior delt/, 'rear_delts'],
    [/front delt|anterior delt/, 'front_delts'],
    [/side delt|lateral delt|shoulder/, 'side_delts'],
    [/rotator/, 'rotator_cuff'],
    [/tricep/, 'triceps'],
    [/brachialis/, 'brachialis'],
    [/bicep/, 'biceps'],
    [/forearm|grip|wrist/, 'forearms'],
    [/\blat\b|lats|latissimus/, 'lats'],
    [/mid back|rhomboid|upper back|\bback\b/, 'mid_back'],
    [/trap/, 'upper_traps'],
    [/lower back|erector|spinal/, 'lower_back'],
    [/oblique/, 'obliques'],
    [/abs|abdominal/, 'abs'],
    [/core/, 'core'],
    [/hip flexor/, 'hip_flexors'],
    [/quad/, 'quads'],
    [/hamstring/, 'hamstrings'],
    [/glute/, 'glutes'],
    [/adductor|inner thigh/, 'adductors'],
    [/abductor|outer hip/, 'abductors'],
    [/calf|calves/, 'calves'],
  ];
  for (const [rx, id] of rules) if (rx.test(q)) return id;
  return null;
}
