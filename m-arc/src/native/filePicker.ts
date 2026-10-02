/**
 * One file chooser for backups and photos (R7.2). Resolves `null` on cancel (UI-29): some
 * browsers fire "change" with no file, others "cancel", and the promise must settle either way.
 */
export function pickFileRaw(accept: string): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    // No "capture" attribute: it forces the camera with no way out to the gallery or Files.
    input.style.display = 'none';
    let settled = false;
    const done = (file: File | null) => { if (settled) return; settled = true; resolve(file); input.remove(); };
    input.addEventListener('change', () => done(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => done(null), { once: true });
    document.body.appendChild(input);
    input.click();
  });
}
