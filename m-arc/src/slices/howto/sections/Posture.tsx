// The posture close-ups (HT-7; plan 2.4 "Zooms", GA 2.2-2.3 S3): golden B's right-next-to-wrong crops, opened by the
// posture chips through the zoom host (registry.ts `posture`). Golden B prints no posture section of its own, so this
// section renders nothing: it only keeps golden B's one dot pattern (`#zdots`, the crops' background) in the document
// while a How-to sheet is mounted. The pattern is mounted once per document, never per sheet, so a closing sheet and
// the next one never hold the same id (HT7-A2).
import { useEffect } from 'preact/hooks';
import type { ZoomChunk } from '../zoom/registry';
import type { SectionProps } from './index';
import '../css/posture.css';

interface PostureModule { readonly panels: Readonly<Record<string, string>>; readonly zdots: string }
/** The per-exercise posture chunks, keyed by chrome id like the hand chunks, one lazy import each (Vite splits every
 *  file into its own `posture-<chromeId>-*.js`, with the exercise's close-up CSS, css/zoom-<chromeId>.css, which its
 *  hand chunk imports too). */
const CHUNKS = import.meta.glob<PostureModule>('../../../howto/generated/posture-*.ts');

let holders = 0, zdots: string | null = null, node: HTMLElement | null = null;
const mount = () => {
  if (node || !holders || zdots === null) return;
  // golden B keeps the pattern inside the themed page (`.zdot` is scoped under `.ht`); the wrapper takes no space
  node = document.createElement('div');
  node.className = 'ht';
  node.setAttribute('data-ht-zdots', '');
  node.setAttribute('aria-hidden', 'true');
  node.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  // our own generated golden-B string (src/howto/generated, hash-locked), never user input
  node.innerHTML = zdots;
  document.body.appendChild(node);
};
/** Holds the dot pattern while a sheet is mounted; returns the release. */
export function holdZdots(): () => void {
  holders++;
  mount();
  let done = false;
  return () => {
    if (done) return;
    done = true;
    if (--holders === 0 && node) { node.remove(); node = null; }
  };
}

/** The registry's `posture` loader: the close-up `key` of `chromeId`, loaded with its chunk on the first open. */
export async function postureZoom(chromeId: string, key: string): Promise<ZoomChunk> {
  const load = CHUNKS[`../../../howto/generated/posture-${chromeId}.ts`];
  if (!load) throw new Error(`posture: no close-ups for ${chromeId}`);
  const m = await load();
  const panel = m.panels[key];
  if (panel === undefined) throw new Error(`posture: no ${key} close-up for ${chromeId}`);
  zdots = m.zdots;
  mount();
  return { panel };
}

/** The registry entry (sections/index.ts, `posture`). */
export function PostureSection(_: SectionProps) {
  useEffect(() => holdZdots(), []);
  return null;
}
