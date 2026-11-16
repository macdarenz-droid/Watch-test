/** F12: a card's SVG drawn onto a canvas and encoded as PNG, with a one-card cache (QA4-12). */

/** Draws an SVG card onto a canvas at export size and encodes it as PNG. */
export async function svgToPng(svg: string, w: number, h: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not encode the card'))), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Remembers the PNG of the card on screen. The sheet warms it as soon as a card settles, so a tap on
 * Share goes straight to the Web Share API while the tap still counts as a user gesture (browsers
 * refuse `navigator.share` once a slow render has used it up). A failed render is not kept.
 */
export function pngCache(render: (svg: string, w: number, h: number) => Promise<Blob> = svgToPng) {
  let last: { svg: string; png: Promise<Blob> } | null = null;
  return {
    get(svg: string, w: number, h: number): Promise<Blob> {
      if (last?.svg !== svg) {
        const png = render(svg, w, h);
        const entry = { svg, png };
        last = entry;
        png.catch(() => { if (last === entry) last = null; });
      }
      return last!.png;
    },
  };
}
