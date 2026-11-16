import { signal } from '@preact/signals';

/** `id` is new for every toast, so the same message shown twice restarts its timer (QA-R2c-3). */
export interface ToastState { id: number; message: string; action?: string; onAction?: () => void }
export const toast = signal<ToastState | null>(null);
let nextId = 1;
export function showToast(message: string, action?: string, onAction?: () => void): void {
  toast.value = { id: nextId++, message, action, onAction };
}
