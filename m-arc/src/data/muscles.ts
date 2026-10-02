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
  /** Recovery-model prior: relative time-to-recover vs quads (1.0). Small; calibration does the rest. */
  recoveryFactor: number;
  /** GU-7a-3: short gym name used in the form guide (spec 2.10), e.g. "Front delts". */
  common: string;
  /** GU-7a-3: the anatomical name (spec 2.10). */
  anatomical: string;
  /** GU-7a-3: one plain line on what the muscle does, used when an exercise has no written line. */
  action: string;
}

export const MUSCLES: Muscle[] = [
  { id: 'chest', label: 'Chest', group: 'chest', bucket: 'push', view: 'front', recoveryFactor: 1.1,
    common: 'Chest', anatomical: 'pectoralis major',
    action: 'Pushes the arms forward and across the body.' },
  { id: 'upper_chest', label: 'Upper chest', group: 'chest', bucket: 'push', view: 'front', recoveryFactor: 1.1,
    common: 'Upper chest', anatomical: 'clavicular pectoralis major',
    action: 'Pushes the arms forward and up, as in an incline press.' },
  { id: 'front_delts', label: 'Front shoulders', group: 'shoulders', bucket: 'push', view: 'front', recoveryFactor: 1.0,
    common: 'Front delts', anatomical: 'anterior deltoid',
    action: 'Lifts the upper arms forward and up.' },
  { id: 'side_delts', label: 'Side shoulders', group: 'shoulders', bucket: 'push', view: 'front', recoveryFactor: 1.0,
    common: 'Side delts', anatomical: 'lateral deltoid',
    action: 'Lifts the arms out to the sides.' },
  { id: 'rear_delts', label: 'Rear shoulders', group: 'shoulders', bucket: 'pull', view: 'back', recoveryFactor: 1.0,
    common: 'Rear delts', anatomical: 'posterior deltoid',
    action: 'Pulls the upper arms back and out.' },
  { id: 'rotator_cuff', label: 'Rotator cuff', group: 'shoulders', bucket: 'neutral', view: 'back', recoveryFactor: 1.0,
    common: 'Rotator cuff', anatomical: 'supraspinatus, infraspinatus, teres minor and subscapularis',
    action: 'Holds the shoulder joint steady and turns the arm in and out.' },
  { id: 'biceps', label: 'Biceps', group: 'arms', bucket: 'pull', view: 'front', recoveryFactor: 1.1,
    common: 'Biceps', anatomical: 'biceps brachii',
    action: 'Bends the elbows and turns the palms up.' },
  { id: 'triceps', label: 'Triceps', group: 'arms', bucket: 'push', view: 'back', recoveryFactor: 1.1,
    common: 'Triceps', anatomical: 'triceps brachii',
    action: 'Straightens the elbows.' },
  { id: 'brachialis', label: 'Brachialis', group: 'arms', bucket: 'pull', view: 'front', recoveryFactor: 1.1,
    common: 'Brachialis', anatomical: 'brachialis',
    action: 'Bends the elbows in any grip.' },
  { id: 'forearms', label: 'Forearms', group: 'arms', bucket: 'pull', view: 'front', recoveryFactor: 0.8,
    common: 'Forearms', anatomical: 'forearm flexors and extensors',
    action: 'Grips the weight and keeps the wrists steady.' },
  { id: 'lats', label: 'Lats', group: 'back', bucket: 'pull', view: 'back', recoveryFactor: 1.1,
    common: 'Lats', anatomical: 'latissimus dorsi',
    action: 'Pulls the upper arms down and back toward the body.' },
  { id: 'mid_back', label: 'Mid back', group: 'back', bucket: 'pull', view: 'back', recoveryFactor: 1.0,
    common: 'Mid back', anatomical: 'rhomboids and middle trapezius',
    action: 'Squeezes the shoulder blades together.' },
  { id: 'upper_traps', label: 'Upper traps', group: 'back', bucket: 'pull', view: 'back', recoveryFactor: 1.0,
    common: 'Upper traps', anatomical: 'upper trapezius',
    action: 'Lifts and steadies the shoulder blades.' },
  { id: 'lower_back', label: 'Lower back', group: 'back', bucket: 'neutral', view: 'back', recoveryFactor: 1.1,
    common: 'Lower back', anatomical: 'erector spinae',
    action: 'Keeps the spine straight and lifts the torso upright.' },
  { id: 'abs', label: 'Abs', group: 'core', bucket: 'neutral', view: 'front', recoveryFactor: 0.8,
    common: 'Abs', anatomical: 'rectus abdominis',
    action: 'Curls the ribs toward the hips and braces the trunk.' },
  { id: 'obliques', label: 'Obliques', group: 'core', bucket: 'neutral', view: 'front', recoveryFactor: 0.8,
    common: 'Obliques', anatomical: 'external and internal obliques',
    action: 'Twists and bends the trunk to the side.' },
  { id: 'core', label: 'Deep core', group: 'core', bucket: 'neutral', view: 'front', recoveryFactor: 0.8,
    common: 'Core', anatomical: 'transversus abdominis',
    action: 'Tightens the waist like a belt to keep the trunk stiff.' },
  { id: 'hip_flexors', label: 'Hip flexors', group: 'core', bucket: 'neutral', view: 'front', recoveryFactor: 0.8,
    common: 'Hip flexors', anatomical: 'iliopsoas',
    action: 'Lifts the knees toward the chest.' },
  { id: 'quads', label: 'Quads', group: 'legs', bucket: 'lower', view: 'front', recoveryFactor: 1.0,
    common: 'Quads', anatomical: 'quadriceps femoris',
    action: 'Straightens the knees.' },
  { id: 'hamstrings', label: 'Hamstrings', group: 'legs', bucket: 'lower', view: 'back', recoveryFactor: 1.2,
    common: 'Hamstrings', anatomical: 'biceps femoris, semitendinosus and semimembranosus',
    action: 'Bends the knees and pulls the hips back straight.' },
  { id: 'glutes', label: 'Glutes', group: 'legs', bucket: 'lower', view: 'back', recoveryFactor: 1.0,
    common: 'Glutes', anatomical: 'gluteus maximus',
    action: 'Drives the hips forward to stand tall.' },
  { id: 'adductors', label: 'Inner thighs', group: 'legs', bucket: 'lower', view: 'front', recoveryFactor: 1.2,
    common: 'Adductors', anatomical: 'hip adductors',
    action: 'Pulls the legs in toward each other.' },
  { id: 'abductors', label: 'Outer hips', group: 'legs', bucket: 'lower', view: 'back', recoveryFactor: 1.0,
    common: 'Abductors', anatomical: 'gluteus medius and minimus',
    action: 'Moves the legs out to the sides and keeps the hips level.' },
  { id: 'calves', label: 'Calves', group: 'legs', bucket: 'lower', view: 'back', recoveryFactor: 0.8,
    common: 'Calves', anatomical: 'gastrocnemius and soleus',
    action: 'Pushes up onto the toes.' },
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
  const q = raw.toLowerCase().trim();
  // ST-12: an exact label ("Mid back", "Rear delts") wins before any pattern.
  const exact = MUSCLES.find(m => m.label.toLowerCase() === q || m.id === q.replace(/\s+/g, '_'));
  if (exact) return exact.id;
  const rules: Array<[RegExp, MuscleId]> = [
    [/upper chest|incline/, 'upper_chest'],
    [/chest|pec/, 'chest'],
    [/serratus/, 'core'],
    [/rear delt|posterior delt|rear shoulder/, 'rear_delts'],
    [/front delt|anterior delt|front shoulder/, 'front_delts'],
    [/side delt|lateral delt|shoulder/, 'side_delts'],
    [/rotator/, 'rotator_cuff'],
    [/tricep/, 'triceps'],
    [/brachialis/, 'brachialis'],
    [/bicep/, 'biceps'],
    [/forearm|grip|wrist|brachioradialis/, 'forearms'],
    [/\blat\b|lats|latissimus/, 'lats'],
    // Lower back before mid back, or "lower back" would match the generic \bback\b.
    [/lower back|erector|spinal/, 'lower_back'],
    [/mid back|rhomboid|upper back|\bback\b/, 'mid_back'],
    [/trap/, 'upper_traps'],
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
