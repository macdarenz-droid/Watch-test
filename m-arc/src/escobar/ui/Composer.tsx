/**
 * The composer (§4.2): an autosizing textarea (2000 characters, 1–5 lines), photo attach,
 * send / stop, and the pending "About: …" context chip.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { useTypewriter } from './typewriter';
import { IconCamera, IconSend, IconStop, IconX } from '@/ui/icons';
import { pickAndCompressPhoto } from '@/native/photo';
import { showToast } from '@/app/toast';
import { putImage, imageData } from '../images';
import type { ContextRef, ImageBlockRef } from '../types';

export const MAX_CHARS = 2000;
/** D3 / ES-13: two photos per message (3 × 1.2 MB would pass the Worker's 3 MB body limit). */
const MAX_PHOTOS = 2;

export function Composer({ busy, draft, contextRef, disabled, placeholder, notice, suggestions, onSend, onStop, onClearRef, onFocus, autoFocus }: {
  busy: boolean;
  draft?: string;
  contextRef?: ContextRef | null;
  disabled?: boolean;
  placeholder?: string;
  notice?: string;
  /** Typed into the empty bar one after another. */
  suggestions?: string[];
  onSend: (text: string, images: ImageBlockRef[]) => void;
  onStop?: () => void;
  onClearRef?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState(draft ?? '');
  const [images, setImages] = useState<ImageBlockRef[]>([]);
  const hint = useTypewriter(suggestions ?? [], placeholder ?? 'Ask Escobar…', !text && !busy && !disabled);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (draft != null) setText(draft); }, [draft]);
  useEffect(() => {
    const t = ref.current;
    if (!t) return;
    t.style.height = 'auto';
    const line = parseFloat(getComputedStyle(t).lineHeight) || 21;
    t.style.height = `${Math.min(t.scrollHeight, line * 5 + 16)}px`;
  }, [text]);
  useEffect(() => { if (autoFocus && !disabled) ref.current?.focus({ preventScroll: true }); }, [autoFocus, disabled]);

  const canSend = !busy && !disabled && (text.trim().length > 0 || images.length > 0);
  const submit = () => {
    if (!canSend) return;
    onSend(text.trim(), images);
    setText('');
    setImages([]);
  };
  const attach = async () => {
    let p: Awaited<ReturnType<typeof pickAndCompressPhoto>>;
    try { p = await pickAndCompressPhoto(); } catch { showToast("Couldn't read that photo"); return; }
    if (!p) return;
    const id = `img_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    putImage(id, p);
    const ref0: ImageBlockRef = { type: 'image_ref', id, mediaType: p.mediaType };
    setImages(xs => [...xs, ref0].slice(-MAX_PHOTOS));
  };

  return (
    <div class="esc-composer">
      {notice && <div class="esc-notice small" role="status">{notice}</div>}
      {(contextRef || images.length > 0) && (
        <div class="esc-pending">
          {contextRef && <span class="chip chip-accent">About: {contextRef.label}{onClearRef && <button type="button" class="esc-chip-x" aria-label="Remove context" onClick={onClearRef}><IconX size={16} /></button>}</span>}
          {images.map(i => { const d = imageData(i.id); return <span key={i.id} class="esc-thumb">{d && <img src={`data:${d.mediaType};base64,${d.data}`} alt="Photo to send" />}<button type="button" class="esc-chip-x" aria-label="Remove photo" onClick={() => setImages(xs => xs.filter(x => x.id !== i.id))}><IconX size={16} /></button></span>; })}
        </div>
      )}
      <div class="esc-input-row">
        <button type="button" class="btn btn-quiet btn-icon" aria-label="Attach a photo" disabled={busy || disabled || images.length >= MAX_PHOTOS} onClick={() => void attach()}><IconCamera /></button>
        <textarea
          ref={ref}
          class="esc-textarea"
          rows={1}
          maxLength={MAX_CHARS}
          value={text}
          disabled={disabled}
          placeholder={hint}
          aria-label="Message Escobar"
          onInput={e => setText((e.currentTarget as HTMLTextAreaElement).value)}
          onFocus={onFocus}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } }}
        />
        {busy
          ? <button type="button" class="btn btn-icon esc-send" aria-label="Stop" onClick={onStop}><IconStop /></button>
          : <button type="button" class="btn btn-primary btn-icon esc-send" aria-label="Send" disabled={!canSend} onClick={submit}><IconSend /></button>}
      </div>
      {text.length > MAX_CHARS - 200 && <div class="hint" style={{ textAlign: 'right' }}>{text.length}/{MAX_CHARS}</div>}
    </div>
  );
}
