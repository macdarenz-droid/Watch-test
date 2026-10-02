// The close-up kinds the zoom host can open (HT-6; plan 2.4 "Zooms", 2.5). One line per kind: `hand` (HT-6),
// `posture` (HT-7 adds its line). Each loader fetches a generated chunk on first open only (HT6-A7); generated/**
// is reached only through import() (D-HT1 A4).
// The API below is fixed once posted as "ZOOM HOST READY" on PR #112; later cards only call it or add their line.

import { postureZoom } from '../sections/Posture';   // HT-7

export type ZoomKind = 'hand' | 'posture';

/** A close-up as golden B's page holds it: the whole `<div class="zx" …>` panel, inserted as is. */
export interface ZoomChunk {
  readonly panel: string;
}
export type ZoomLoader = (chromeId: string, key: string) => Promise<ZoomChunk>;

/** The per-exercise hand chunks, one lazy import each (Vite splits every file into its own `hand-<id>-*.js`, with
 *  the exercise's close-up CSS, css/zoom-<id>.css, which a posture chunk imports too). */
const HAND_CHUNKS = import.meta.glob<ZoomChunk>('../../../howto/generated/hand-*.ts');
const handChunk = (chromeId: string) => {
  const load = HAND_CHUNKS[`../../../howto/generated/hand-${chromeId}.ts`];
  if (!load) return Promise.reject(new Error(`no hand close-up for ${chromeId}`));
  return load();
};

export const ZOOM_KINDS: Partial<Record<ZoomKind, ZoomLoader>> = {
  hand: chromeId => handChunk(chromeId),
  posture: (chromeId, key) => postureZoom(chromeId, key),   // HT-7
};

/** Whether a kind has a loader (a chip shows only for a registered kind, HT6-A3). */
export const hasZoomKind = (kind: string): kind is ZoomKind => Object.prototype.hasOwnProperty.call(ZOOM_KINDS, kind) && !!ZOOM_KINDS[kind as ZoomKind];
