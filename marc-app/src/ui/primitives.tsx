import { useEffect, useId, useRef } from 'preact/hooks';
import type { ComponentChildren, JSX } from 'preact';
import { IconX } from './icons';

type Div = JSX.HTMLAttributes<HTMLDivElement>;

export function Card({ children, class: cls = '', className = '', ...rest }: { children?: ComponentChildren } & Div) {
  return <div class={`card ${cls} ${className}`} {...rest}>{children}</div>;
}

export function Button({ children, variant = 'default', size, block, class: cls = '', ...rest }: {
  children?: ComponentChildren; variant?: 'default' | 'primary' | 'solid' | 'quiet' | 'danger'; size?: 'sm'; block?: boolean;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" class={`btn ${variant !== 'default' ? `btn-${variant}` : ''} ${size ? `btn-${size}` : ''} ${block ? 'btn-block' : ''} ${cls}`} {...rest}>{children}</button>;
}

export function Chip({ children, tone, pressed, onClick, class: cls = '' }: { children?: ComponentChildren; tone?: 'accent' | 'positive' | 'warning' | 'negative' | 'info'; pressed?: boolean; onClick?: () => void; class?: string }) {
  const classes = `chip ${tone ? `chip-${tone}` : ''} ${onClick ? 'chip-btn' : ''} ${cls}`;
  return onClick
    ? <button type="button" class={classes} aria-pressed={pressed} onClick={onClick}>{children}</button>
    : <span class={classes}>{children}</span>;
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void }) {
  return <div class="seg" role="tablist">{options.map(o => <button type="button" role="tab" key={o.value} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>)}</div>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} class="toggle" onClick={() => onChange(!checked)} />;
}

export function Stat({ value, label, tone }: { value: ComponentChildren; label: string; tone?: 'positive' | 'warning' | 'negative' }) {
  return <div class="stat"><b class={`num ${tone ? `${tone}-text` : ''}`}>{value}</b><span>{label}</span></div>;
}

export function Row({ children, trailing, onClick, class: cls = '' }: { children?: ComponentChildren; trailing?: ComponentChildren; onClick?: () => void; class?: string }) {
  return <div class={`list-row ${onClick ? 'pressable' : ''} ${cls}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}><div class="grow">{children}</div>{trailing}</div>;
}

export function Bar({ pct, color }: { pct: number; color?: string }) {
  return <div class="bar"><i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} /></div>;
}

export function Ring({ pct, size = 120, children }: { pct: number; size?: number; children?: ComponentChildren }) {
  return <div class="ring" style={{ '--p': Math.max(0, Math.min(100, pct)), width: size, height: size }}><div>{children}</div></div>;
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children?: ComponentChildren }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; if (d.open) d.close(); };
  }, []);
  return (
    <dialog ref={ref} class="sheet" aria-labelledby={id} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div class="sheet-panel">
        <div class="sheet-grab" />
        <div class="sheet-head"><h2 id={id}>{title}</h2><button type="button" class="btn btn-quiet btn-icon" aria-label="Close" onClick={onClose}><IconX /></button></div>
        {children}
      </div>
    </dialog>
  );
}

export function Toast({ message, action, onAction, onDismiss }: { message: string; action?: string; onAction?: () => void; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, action ? 5000 : 3000); return () => clearTimeout(t); }, [onDismiss, action]);
  return <div class="toast" role="status"><span>{message}</span>{action && <button type="button" onClick={() => { onAction?.(); onDismiss(); }}>{action}</button>}</div>;
}

export function Empty({ icon, title, children, action }: { icon?: ComponentChildren; title: string; children?: ComponentChildren; action?: ComponentChildren }) {
  return <div class="empty">{icon}<h3>{title}</h3>{children && <p class="small">{children}</p>}{action}</div>;
}

export function Section({ title, aside, children }: { title: string; aside?: ComponentChildren; children?: ComponentChildren }) {
  return <section class="section"><div class="section-title"><h2>{title}</h2>{aside}</div>{children}</section>;
}

export function Field({ label, children, hint }: { label: string; children?: ComponentChildren; hint?: string }) {
  return <label class="stack-sm"><span class="small muted">{label}</span>{children}{hint && <span class="hint">{hint}</span>}</label>;
}
