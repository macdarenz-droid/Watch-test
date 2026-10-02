// How-to plate types (HT-1). Every string below is an exact slice of the approved gallery
// (tests/howto/golden/technical-plates.html); the app inserts it as is and never re-serializes it.
import type {
  ContactArchetypeId, HandlingSpec, HandlingMistake, HowToContent, NoHandling, PostureCheckpoint, RedFlagBlock,
  Risk, RiskJoint, SetupStep, SourceId, ZoomSpec,
} from './content-types';

/** The "Look closer" chip row needs each zoom's descriptor in S0, before any lazy crop/hand chunk loads (HT-6 on
 *  PR #116; supervisor ruling, same PR): the rendered crop/hand strings stay HT-7's/HT-6's own lazy files. */
export type ZoomDescriptor = Pick<ZoomSpec, 'key' | 'chip' | 'chipCaption' | 'heading' | 'kind' | 'feelRow'>;

/** The 8 library exercises with an approved Technical Plate (golden A, bc0f378). */
export type LibId =
  | 'lib_dumbbell_lateral_raise'
  | 'lib_barbell_back_squat'
  | 'lib_pull_up'
  | 'lib_hanging_leg_raise'
  | 'lib_lat_pulldown'
  | 'lib_seated_cable_row'
  | 'lib_leg_press'
  | 'lib_machine_chest_press';

/** One callout or tell: its key and the cue text shown in the cue line (decoded, not HTML). */
export interface PlateCue {
  readonly key: string;
  readonly cue: string;
}

/** One drawn state of a plate: the SVG, its tagged callout overlay, and the callout that starts selected. */
export interface PlateFigure {
  /** The `<svg>` element; for the normal figure, with the hidden `data-guide` paths spliced in. */
  readonly svg: string;
  /** The callout buttons, tagged with id, data-key, data-cue and aria-pressed as in the gallery. */
  readonly overlay: string;
  readonly firstKey: string;
  readonly cues: readonly PlateCue[];
}

/** Everything the plate block of one exercise needs, from plate top to tempo bottom. */
export interface BuiltPlate {
  readonly view: 'front' | 'side';
  readonly normal: PlateFigure;
  readonly mistake: PlateFigure;
  /** The `<div class="tells" hidden>…</div>` block. */
  readonly tells: string;
  /** The `<div class="tempo" role="img" …>…</div>` strip. */
  readonly tempo: string;
  /** The normal figcaption text (decoded). */
  readonly alt: string;
  /** The mistake figcaption text (decoded). */
  readonly mistakeAlt: string;
}

/** The fragments hashed per exercise in GOLDEN.json (sha256 hex of the exact UTF-8 string). */
export type GoldenFragment =
  | 'normalSvg'
  | 'normalOverlay'
  | 'mistakeSvg'
  | 'mistakeOverlay'
  | 'tells'
  | 'tempo'
  | 'cues'
  | 'alt'
  | 'mistakeAlt';

interface GoldenEntryBase {
  /** Commit on claude/howto-options that holds the approved sources. */
  readonly ref: string;
  readonly approvedBy: 'owner';
  /** YYYY-MM-DD. */
  readonly date: string;
  readonly why: string;
  /** Index in GOLDEN.json `entries` of the entry this one replaces, or null for a first approval. */
  readonly supersedes: number | null;
  /** Decision id (COACHING-DECISIONS.md); required when `supersedes` is set. */
  readonly decision?: string;
  /** sha256 hex of JSON.stringify(entries before this one): the hash chain. */
  readonly prev: string;
}

/** The whole gallery page. */
export interface GoldenPageEntry extends GoldenEntryBase {
  readonly kind: 'page';
  readonly pageSha256: string;
  readonly bytes: number;
}

/** One exercise's approved plate. */
export interface GoldenPlateEntry extends GoldenEntryBase {
  readonly kind: 'plate';
  readonly id: LibId;
  /** The id without `lib_`, `_` as `-` (the chunk slug). */
  readonly slug: string;
  /** The spec the gallery built it from: 'ref-src' or 'exercises/<file>.mjs'. */
  readonly src: string;
  /** The id prefix inside its SVG (e.g. `lr` for `lr-n-…`). */
  readonly prefix: string;
  /** The id used by its gallery chrome (e.g. `lateral-raise` for `card-lateral-raise`). */
  readonly chromeId: string;
  readonly fragments: Readonly<Record<GoldenFragment, string>>;
}

export type GoldenEntry = GoldenPageEntry | GoldenPlateEntry;

export interface GoldenFile {
  readonly schema: 1;
  readonly entries: readonly GoldenEntry[];
}

/**
 * One generated How-to module (HT-2): `src/howto/generated/ht-<slug>.ts` default-exports this, ending in
 * `satisfies BuiltHowTo`, so tsc checks the generator's output. The layer fields stay `never` (absent) until the
 * card that builds each layer defines its type (critic fix 6). HT-5 (content.mjs, sequential writer after
 * plates.mjs) is the card that builds handling/contacts/setup/posture/mistakes/risks/sources/copy, so those
 * fields are broadened here to `HowToContent`'s real shapes; `zooms` and `feel` stay `never` for HT-7/HT-8.
 */
export interface BuiltHowTo {
  readonly schema: 1;
  readonly id: LibId;
  readonly name: string;
  readonly hashes: {
    /** The file's own inputsSha256, equal to its GENERATED header. */
    readonly inputsSha256: string;
    /** sha256 of JSON.stringify(the latest GOLDEN.json plate entry it was generated from). */
    readonly golden: string;
  };
  readonly plate: BuiltPlate;
  readonly zooms?: readonly ZoomDescriptor[];
  readonly feel?: never;
  readonly rev?: number;
  readonly extends?: LibId;
  readonly handling?: HandlingSpec | NoHandling;
  readonly contacts?: readonly ContactArchetypeId[];
  readonly setup?: readonly SetupStep[];
  readonly posture?: readonly PostureCheckpoint[];
  readonly chips?: readonly string[];
  readonly copy?: HowToContent['copy'];
  readonly mistakes?: readonly HandlingMistake[];
  readonly risks?: readonly Risk[];
  readonly riskFlags?: readonly RiskJoint[];
  readonly redFlag?: RedFlagBlock;
  readonly sources?: readonly SourceId[];
  readonly research?: HowToContent['research'];
}
