/**
 * One photo from the camera or gallery, downscaled and compressed on the
 * device before it ever leaves it — the proxy only ever sees a small JPEG,
 * never the original. Plain web APIs throughout: they behave the same in
 * the Capacitor WebView and in a browser, so no extra native plugin or
 * permission is needed to declare.
 */
import { pickFileRaw } from './filePicker';

const MAX_DIMENSION = 900;
const QUALITY_STEPS = [0.72, 0.55, 0.4];
/** Base64 chars; comfortably under the proxy's per-request cap even before overhead. */
const TARGET_CHARS = 700_000;

export interface CapturedPhoto { mediaType: 'image/jpeg'; data: string }

const pickFile = (): Promise<File | null> => pickFileRaw('image/*');

async function toCanvas(file: File, maxDimension: number): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

function canvasToBase64(canvas: HTMLCanvasElement, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error('Could not encode the photo')); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.onerror = () => reject(reader.error ?? new Error('Could not read the photo'));
      reader.readAsDataURL(blob);
    }, 'image/jpeg', quality);
  });
}

/**
 * Opens the camera/gallery picker, downscales to at most 900px on the long
 * side and re-encodes as JPEG, stepping quality down until it is
 * comfortably small. Returns null when the person cancels rather than
 * throwing, since cancelling is not an error. Share cards (F12) ask for a
 * larger photo, since it fills a 1080×1920 image and never leaves the phone.
 */
export async function pickAndCompressPhoto(opts: { maxDimension?: number; targetChars?: number } = {}): Promise<CapturedPhoto | null> {
  const file = await pickFile();
  if (!file) return null;
  const canvas = await toCanvas(file, opts.maxDimension ?? MAX_DIMENSION);
  const target = opts.targetChars ?? TARGET_CHARS;
  let data = '';
  for (const quality of QUALITY_STEPS) {
    data = await canvasToBase64(canvas, quality);
    if (data.length <= target) break;
  }
  return { mediaType: 'image/jpeg', data };
}
