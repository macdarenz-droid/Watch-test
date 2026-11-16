/**
 * I7: the pure release physics for the Escobar sheet's drag — pulled out of EscobarSheet.tsx so
 * it can be unit tested without a DOM. `offset` is the drag distance in px from "full" (0 = full,
 * H_full = closed); `v` is the release velocity in px/ms, positive = downward.
 */
import { FLING_PX_PER_MS } from '@/ui/gesture';

/** Half detent's height as a fraction of the viewport, mirroring `.esc-half .esc-panel`. */
export const HALF_FRAC = 0.62;
/** Full detent's height as a fraction of the viewport, mirroring `.esc-full .esc-panel`. */
export const FULL_FRAC = 0.94;
/** Closing on a plain (non-fling) release needs this much past half's own offset. */
export const CLOSE_MARGIN_FRAC = 0.25;
/** How far ahead (ms) the release velocity projects, to pick the nearest resting detent. */
export const PROJECT_MS = 200;

export type Detent = 'full' | 'half' | 'closed';

export interface DetentTarget { name: Detent; pos: number }

/**
 * Snaps a release to the nearest of full (0), half (H_full − H_half) or closed (H_full), by
 * projecting the velocity PROJECT_MS ahead. "closed" only actually commits when the release is
 * a fling (v >= FLING_PX_PER_MS) or has already passed a quarter of half's own height beyond
 * half's offset — otherwise it falls back to half, so a single long drag from full can't close
 * the sheet by distance alone.
 */
export function resolveEscobarRelease(offset: number, v: number, vh: number): DetentTarget {
  const hFull = FULL_FRAC * vh;
  const hHalf = HALF_FRAC * vh;
  const half = hFull - hHalf;
  const projected = offset + v * PROJECT_MS;
  const candidates: DetentTarget[] = [{ name: 'full', pos: 0 }, { name: 'half', pos: half }, { name: 'closed', pos: hFull }];
  let nearest = candidates[0]!;
  for (const c of candidates) if (Math.abs(projected - c.pos) < Math.abs(projected - nearest.pos)) nearest = c;
  if (nearest.name === 'closed' && !(v >= FLING_PX_PER_MS || offset >= half + CLOSE_MARGIN_FRAC * hHalf)) return candidates[1]!;
  return nearest;
}
