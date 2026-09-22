import { signal } from '@preact/signals';

export interface ToastState { message: string; action?: string; onAction?: () => void }
export const toast = signal<ToastState | null>(null);
export function showToast(message: string, action?: string, onAction?: () => void): void {
  toast.value = { message, action, onAction };
}
