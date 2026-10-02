// HT-4 (HT4-A2): the authored How-to content model. Source: GRIP-AND-FEEL-ARCHITECTURE.md section 4 (the `HowTo`
// interface there is named `HowToContent` here per the build plan, module layout 2.3) plus every field the vendored
// golden-B `exercises/*.howto.mjs` files use. There is no `plate` field: plate identity is golden data in
// `tools/plates/plates.json`, and the plate spec itself is `BuiltPlate`/`PlateFigure` in `types.ts`.
//
// Fields the architecture doc does not literally spell out, but that real (non-mockup) golden-B content needs, are
// added here and noted below (card risk_and_recovery: "add it to the types ... never drop a mockup field"):
//   - `PointRef` uses the plate engine's own convention ({ at, pose?, off? } or { along, t, off? }), SPEC.md 3 /
//     dumbbell_lateral_raise.howto.mjs's own note, not GA's literal `{ landmark, pose?, dx?, dy? }` spelling.
//   - `ThumbMode` gains `'loose'` (machine_chest_press.howto.mjs: a thumb resting beside the handle, not round it).
//   - `HandlingSpec.cue` (the workout hint line; HOWTO_HINTS is generated from it, module layout 2.2).
//   - `HandlingMistake`, `Risk`, `HowToContent.mistakes/risks/riskFlags/redFlag` (plan 2.4 items 4 and 7; the shared
//     red-flag blocks live in the vendored `howto/shared.mjs`, one per joint, keyed by `riskFlags`).
//   - `HowToContent.chips` (chip row order) and `copy.cueLine` (both present in some but not all golden-B files).
//   - The mockup-only ZoomSpec/HandPose extras golden-B uses for its own static layout (`chipCaption`, `panelHeight`,
//     `notes`, `cameraLabel`, `callout`/`callouts`, `feelPrompt`, `insetRight`/`insetWrong`, `rollDeg`, `crop.pose`)
//     are kept as optional fields rather than dropped, per the same risk_and_recovery note.
//   - HT-5 (HT5-A1, generation over the other 7 approved exercises): `ZoomSpec.callouts.{right,wrong}.anchor?:
//     PointRef` and `.prefer?: 'left' | 'right'`, used by dumbbell_lateral_raise, hanging_leg_raise, lat_pulldown,
//     pull_up and seated_cable_row alongside (never instead of) `guide`; machine_chest_press and barbell_back_squat
//     use `guide` only. `HandPose.handle.strut?: readonly [number, number]` (leg_press, seated_cable_row).
//     `HandFault.fingerBase?: boolean` (pull_up). `HandlingSpec.alternatives?: readonly string[]` (hanging_leg_raise,
//     grip-free options, text only). `HowToContent.copy.gripLine?: string` (barbell_back_squat, leg_press) and
//     `research.related?: readonly string[]` (hanging_leg_raise). Recorded in docs/COACHING-DECISIONS.md (HT-5).
import type { MuscleId } from '../data/muscles';

/** exercises.json id. Broader than types.ts's `LibId` (the 8 golden exercises): content spans all 153. */
export type ContentLibId = `lib_${string}`;

export type EvidenceTag = 'DATA' | 'MECH' | 'CONSENSUS' | 'WEAK';
export type SourceId = string;

/** Attached to every rule. Never shown in user copy; research data only, never shown (LR-23). */
export interface Claim {
  readonly tags: readonly EvidenceTag[];
  readonly sources: readonly SourceId[];
  readonly note?: string;
}

export interface Source {
  readonly id: SourceId;
  readonly cite: string;
  readonly url: string;
  readonly kind: 'peer-reviewed' | 'guideline' | 'coach' | 'manufacturer' | 'secondary';
  /** What the verifier actually read. */
  readonly access: 'full' | 'abstract' | 'summary' | 'unreachable';
  /** ISO date of the last check, or null when not yet filled in by the verifier. */
  readonly checked: string | null;
}

/** A part id in bodyMuscles.ts (FRONT_PARTS/BACK_PARTS), e.g. 'hand-left', 'knee-right', 'nape'. */
export type BodyPartId = string;

/**
 * A point on the plate. The plate engine's own convention (SPEC.md 3): an anchor (`at`) optionally offset in the
 * plate's px units, or two anchors interpolated (`along`, `t`). `pose` picks which drawn pose the anchor resolves
 * against.
 */
export type PointRef =
  | { readonly at: string; readonly pose?: 'start' | 'end' | 'mistake'; readonly off?: readonly [number, number] }
  | { readonly along: readonly [string, string]; readonly t: number; readonly pose?: 'start' | 'end' | 'mistake'; readonly off?: readonly [number, number] };

export type HandArchetypeId =
  | 'push' | 'palm-flat' | 'pull' | 'hang' | 'hold' | 'curl' | 'on-body' | 'balance' | 'implement' | 'none';
/** HandlingSpec's own archetype excludes 'none' so `archetype === 'none'` narrows HandlingSpec | NoHandling cleanly. */
export type HandledArchetypeId = Exclude<HandArchetypeId, 'none'>;
export type Orientation = 'pronated' | 'neutral' | 'supinated' | 'mixed';
export type HandleProfile =
  | 'bar-28' | 'bar-32' | 'machine-grip' | 'ez-bend' | 'rope' | 'd-handle' | 'v-handle'
  | 'dumbbell' | 'kettlebell' | 'ball' | 'pad-handle' | 'floor'
  | 'press-horizontal' | 'press-vertical';
/** 'loose': a thumb resting beside the handle, not round it (golden-B addition; the hand renderer already has it). */
export type ThumbMode = 'wrapped' | 'wrapped-light' | 'beside' | 'over' | 'hook' | 'cupped' | 'spread' | 'loose';
export type HandContact = 'heel' | 'mid-palm' | 'finger-base' | 'fingertips' | 'palm-flat' | 'cupped';
export type HandView = 'radial' | 'dorsal' | 'end-on';

/** What the hand renderer draws (architecture 5.1). Angles in degrees. */
export interface HandPose {
  readonly view: HandView;
  readonly forearm: number;
  readonly wrist: { readonly ext: number; readonly dev: number };
  readonly contactAt: number;
  readonly fingers: { readonly curl: number; readonly open?: number };
  readonly thumb: ThumbMode;
  readonly squeeze?: 'light' | 'firm' | 'max';
  readonly handle: { readonly profile: HandleProfile; readonly axis: 'across' | 'along'; readonly diameterMm?: number; readonly strut?: readonly [number, number] };
  readonly load: { readonly kind: 'push' | 'pull' | 'gravity' | 'on-body'; readonly dir?: readonly [number, number] };
  /** 'end-on' view only: how far the little-finger end sits above the thumb end (+ = little finger higher). */
  readonly rollDeg?: number;
}

export type HandMarker = 'lever-arc' | 'slip-arrow' | 'skin-ridge' | 'tendon' | 'load-through-wrist';

export interface HandFault {
  readonly key: string;
  readonly label: string;
  readonly pose: Partial<HandPose>;
  readonly markers: readonly HandMarker[];
  /** Mockup (pull_up): draw the finger-base line at the same spot in both halves (hand.mjs). */
  readonly fingerBase?: boolean;
  readonly alt: string;
}

export interface HandArchetype {
  readonly id: HandArchetypeId;
  readonly name: string;
  readonly pose: HandPose;
  readonly wrist:
    | { readonly ext: readonly [number, number]; readonly dev: readonly [number, number]; readonly claim: Claim }
    | { readonly exempt: string; readonly claim: Claim };
  readonly faultMargin: number;
  readonly maxLeverMm?: number;
  readonly minWrongLeverMm?: number;
  readonly contactAt?: { readonly rightMax: number; readonly wrongMin: number };
  readonly thumb: { readonly default: ThumbMode; readonly allowed: readonly ThumbMode[]; readonly requiredWhen?: 'overBody' | 'always'; readonly claim: Claim };
  readonly faults: readonly HandFault[];
  readonly copy: { readonly grip: string; readonly cue: string };
  readonly redFlags: boolean;
}

/** One shared copy block, from `tools/plates/layers/howto/shared.mjs`. One per joint (wrist/shoulder/knee/elbow). */
export interface RedFlagBlock {
  readonly name: string;
  readonly now: string;
  readonly doctor: string;
  readonly claim: Claim;
}
export type RiskJoint = 'wrist' | 'shoulder' | 'knee' | 'elbow';

/** Per exercise. */
export interface HandlingSpec {
  readonly archetype: HandledArchetypeId;
  readonly orientation?: Orientation;
  readonly handle?: HandleProfile;
  readonly loadAxis?: 'along-forearm' | 'across';
  readonly handleChoice?: { readonly sore: string; readonly claim: Claim };
  readonly overBody?: boolean;
  readonly width?: { readonly text: string; readonly claim: Claim };
  readonly thumb: { readonly mode: ThumbMode; readonly options?: ReadonlyArray<{ readonly mode: ThumbMode; readonly when: string }>; readonly claim: Claim };
  readonly contact: HandContact;
  readonly wrist:
    | { readonly ext: readonly [number, number]; readonly dev?: readonly [number, number]; readonly limitText: string; readonly claim: Claim }
    | { readonly exempt: string; readonly claim: Claim };
  readonly pose?: Partial<HandPose>;
  readonly faults: ReadonlyArray<string | HandFault>;
  /** Grip-free alternatives (card `grip.type`), text only until each has its own zoom (hanging_leg_raise). */
  readonly alternatives?: readonly string[];
  readonly gripLine: string;
  /** The workout hint line outside the sheet; HT-5 generates HOWTO_HINTS from this. */
  readonly cue: string;
}
export interface NoHandling {
  readonly archetype: 'none';
  readonly why?: string;
}

export type ContactArchetypeId =
  | 'seat-back' | 'bench-lying' | 'foot-platform' | 'standing-feet'
  | 'pivot-pad' | 'brace-pad' | 'floor-body' | 'hang-support';

export type SetupStepKind = 'get-in' | 'adjust' | 'load' | 'position' | 'grip' | 'brace' | 'safety' | 'finish' | 'get-out';

export interface SetupStep {
  readonly text: string;
  readonly kind: SetupStepKind;
  readonly zoom?: string;
  readonly claim: Claim;
}

export interface PostureCheckpoint {
  readonly key: string;
  readonly label: string;
  readonly detail: string;
  readonly anchor: PointRef;
  readonly zoom?: string;
  readonly claim: Claim;
}

export interface FeelMuscle {
  readonly muscleId: MuscleId;
  readonly plain: string;
}

export interface FeelRow {
  readonly key: string;
  readonly where: string;
  readonly at: { readonly muscles?: readonly MuscleId[]; readonly parts?: readonly BodyPartId[] };
  readonly means: string;
  readonly fix: string;
  readonly zoom?: string;
  /** true = the shared wrist RED_FLAG; a joint name = that shared joint block. */
  readonly redFlag?: boolean | RiskJoint;
  readonly claim: Claim;
}

export interface FeelSpec {
  readonly primary: readonly FeelMuscle[];
  readonly secondary: readonly FeelMuscle[];
  readonly watch: readonly FeelMuscle[];
  readonly side?: 'one';
  readonly feelLine: string;
  readonly rows: readonly FeelRow[];
  readonly libraryDiff?: { readonly add?: readonly MuscleId[]; readonly drop?: readonly MuscleId[]; readonly why: string };
  readonly claim: Claim;
}

/** A drawing guide overlay on a zoom crop (SPEC.md 4, mistake.guides): a dashed line, level mark or arrow. Its exact
 *  geometry is a build-time rendering detail of the golden-B engine; content authors only ever copy one from an
 *  existing zoom. */
export interface Guide {
  readonly kind: 'level' | 'drop' | 'spine' | 'arrow';
  readonly [key: string]: unknown;
}

/** A pose delta applied only for one zoom crop (architecture 5.2: "a zoom-own pose override"). Free-form beyond
 *  `HandPose`'s own fields, since a posture-zoom override may touch plate-pose fields (e.g. `abd`, `hideInside`)
 *  that HandPose does not have. */
export type PoseOverride = Partial<HandPose> & { readonly [key: string]: unknown };

export interface ZoomSpec {
  readonly key: string;
  readonly chip: string;
  /** Mockup: the chip's own 1-3 word caption under it (machine_chest_press). */
  readonly chipCaption?: string;
  readonly heading: string;
  readonly kind: 'hand' | 'posture';
  /** Mockup (hanging_leg_raise, pull_up "shoulders" zooms): a posture crop drawn from a different camera view than
   *  the plate's own (e.g. the engine's front-view outline, used for a "seen from behind" shot a side crop cannot
   *  show). Whenever set, `camLabel` must say so (C16) - the view differs from what a reader would otherwise assume. */
  readonly view?: 'front' | 'back';
  /** The camera label for a `view` override (see above). Distinct from `hand.cameraLabel`, which labels the hand
   *  close-up's own camera, not a posture crop's. */
  readonly camLabel?: string;
  readonly hand?: {
    readonly right?: Partial<HandPose>;
    readonly wrong: ReadonlyArray<string | HandFault>;
    readonly camera: 'side' | 'above' | 'below' | 'front';
    /** Engine gap: hand.mjs only ever prints "above"/"side" itself; a render script supplies the full label. */
    readonly cameraLabel?: string;
    /** Mockup: the panel height in px for the two-up hand layout. */
    readonly panelHeight?: number;
    /** Mockup: a one-line note shown under both hand panels (e.g. the vertical-handle alternative). */
    readonly note?: string;
    /** Mockup: the 1-3 word notes over each half. */
    readonly notes?: { readonly right: string; readonly wrong: string };
    readonly inset?: {
      readonly label: string;
      readonly pose: Partial<HandPose>;
      readonly camera: 'side' | 'above' | 'below' | 'front';
      readonly cameraLabel?: string;
      readonly right?: { readonly rollDeg: number; readonly note: string };
      readonly wrong?: { readonly rollDeg: number; readonly note: string };
    };
    readonly thumbPage?: readonly ThumbMode[];
  };
  readonly crop?: {
    readonly center: PointRef;
    /** Mockup: a second center for the wrong crop, when right and wrong are not the same landmark. */
    readonly centerWrong?: PointRef;
    readonly sizePx: number;
    /** Mockup (flagged in machine_chest_press.howto.mjs): the posture crops are cut from a still pose of the
     *  plate spec, not the normal/end pose directly. */
    readonly pose?: PoseOverride;
  };
  readonly right?: 'start' | 'end' | PoseOverride | { readonly still: string };
  readonly wrong?: 'mistake' | PoseOverride | { readonly still: string; readonly over?: 'start' | 'end' } | { readonly abd: number; readonly hideInside?: readonly string[] };
  readonly guides?: readonly Guide[];
  /** Mockup: one callout per crop, singular spelling used by some golden-B files. */
  readonly callout?: { readonly right: { readonly text: string; readonly anchor: PointRef }; readonly wrong: { readonly text: string; readonly anchor: PointRef } };
  /** Mockup: one callout per crop, plural spelling used by other golden-B files (the mark it names, via `guide`). */
  readonly callouts?: {
    readonly right: { readonly text: string; readonly guide?: string; readonly anchor?: PointRef; readonly prefer?: 'left' | 'right' };
    readonly wrong: { readonly text: string; readonly guide?: string; readonly anchor?: PointRef; readonly prefer?: 'left' | 'right' };
  };
  readonly caption: { readonly right: string; readonly wrong: string };
  readonly alt: { readonly right: string; readonly wrong: string; readonly insetRight?: string; readonly insetWrong?: string };
  readonly feelRow?: string;
  /** Mockup: the link line above the "Show me" (2.7 S3 wireframe), e.g. "Forearms doing the work? This is usually why." */
  readonly feelPrompt?: string;
}

/** From the verified card's handlingMistakes (plan 2.4 item 4). */
export interface HandlingMistake {
  readonly key: string;
  readonly title: string;
  readonly zoom?: string;
  readonly claim: Claim;
  readonly fix: string;
}

/** From the verified card's risk notes (plan 2.4 item 7). */
export interface Risk {
  readonly key: string;
  readonly text: string;
  readonly claim: Claim;
}

/**
 * The authored How-to content for one exercise (GA section 4's `HowTo`, renamed; build plan 2.3). Generated by HT-5
 * from the vendored golden-B `*.howto.mjs` files; nobody types the content twice. Has no `plate` field.
 */
export interface HowToContent {
  readonly schema: 1;
  readonly id: ContentLibId;
  readonly rev: number;
  readonly extends?: ContentLibId;
  readonly handling: HandlingSpec | NoHandling;
  readonly contacts: readonly ContactArchetypeId[];
  readonly setup: readonly SetupStep[];
  readonly posture: readonly PostureCheckpoint[];
  readonly feel: FeelSpec;
  readonly zooms: readonly ZoomSpec[];
  /** Chip row order (the zooms, then "Where to feel it" last); present on some golden-B files, derivable from `zooms` on the rest. */
  readonly chips?: readonly string[];
  /** `gripLine` here mirrors `handling.gripLine` on some golden-B files (barbell_back_squat, leg_press): the grip
   *  section repeats it under `copy` for the sheet's own "Grip" line since `handling` is optional-shaped. */
  readonly copy: { readonly setupLine: string; readonly mistakeLine: string; readonly cueLine?: string; readonly gripLine?: string };
  readonly mistakes: readonly HandlingMistake[];
  readonly risks: readonly Risk[];
  /** Which shared joint red-flag blocks this sheet shows, cross-checked against `feel.rows[].redFlag`/`mistakes`/`risks`. */
  readonly riskFlags: readonly RiskJoint[];
  /** The shared wrist RED_FLAG block (architecture 4.2), re-exported by every exercise file. */
  readonly redFlag: RedFlagBlock;
  readonly sources: readonly SourceId[];
  /** `related`: further research paths a reviewer should also read (hanging_leg_raise cites GENERAL.md and pull_up's card). */
  readonly research: { readonly card: string; readonly rev: number; readonly related?: readonly string[] };
}
