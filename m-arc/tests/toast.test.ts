import { describe, it, expect } from 'vitest';
import { showToast, toast } from '@/app/toast';

describe('toasts (QA-R2c-3)', () => {
  it('the same message twice is a new toast, so its timer restarts', () => {
    showToast('Session deleted', 'Undo');
    const a = toast.value!;
    showToast('Session deleted', 'Undo');
    const b = toast.value!;
    expect(b.id).not.toBe(a.id);
  });
});
