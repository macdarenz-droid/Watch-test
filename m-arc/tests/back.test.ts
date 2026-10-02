import { describe, it, expect, beforeEach } from 'vitest';
import { handleBack } from '@/native/back';
import { escobarUi, registerEscobarClose, unregisterEscobarClose } from '@/escobar/state';
import { openPanel, showPanel, tab } from '@/app/router';
import { registerSheet, sheetStack, unregisterSheet } from '@/ui/sheetStack';

describe('Android back order (R5.3)', () => {
  beforeEach(() => { sheetStack.value = []; openPanel.value = null; tab.value = 'today'; escobarUi.value = { ...escobarUi.value, open: false }; unregisterEscobarClose(); });

  it('Escobar, then the top sheet, then the panel, then Today, then minimise', () => {
    const closed: string[] = [];
    tab.value = 'history';
    showPanel('settings');
    registerSheet('a', () => { closed.push('a'); unregisterSheet('a'); });
    registerSheet('b', () => { closed.push('b'); unregisterSheet('b'); });
    escobarUi.value = { ...escobarUi.value, open: true };

    expect(handleBack()).toBe('escobar');
    expect(escobarUi.value.open).toBe(false);
    expect(handleBack()).toBe('sheet');
    expect(handleBack()).toBe('sheet');
    expect(closed).toEqual(['b', 'a']);
    expect(handleBack()).toBe('panel');
    expect(openPanel.value).toBeNull();
    expect(handleBack()).toBe('today');
    expect(tab.value).toBe('today');
    expect(handleBack()).toBe('minimize');
  });

  // QA11-8: "Back closes the coach with the same animated exit as the X button" was only ever
  // claimed in a comment. handleBack() must call the registered close (the sheet's animated
  // exit), not just the instant-close fallback that runs when nothing is mounted.
  it('closes Escobar through its registered animated exit, not the fallback', () => {
    const spy: string[] = [];
    registerEscobarClose(() => spy.push('closed'));
    escobarUi.value = { ...escobarUi.value, open: true };

    expect(handleBack()).toBe('escobar');
    expect(spy).toEqual(['closed']);
    // The registered close owns clearing `open`; the fallback (which handleBack must not have
    // taken) is the only path that sets it directly, so it's still true here.
    expect(escobarUi.value.open).toBe(true);

    unregisterEscobarClose();
  });
});
