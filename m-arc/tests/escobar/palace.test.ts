import { describe, it, expect } from 'vitest';
import { PALACE, PALACE_BY_ID, findInApp } from '@/escobar/palace/registry';
import { PANEL_IDS, TABS, openPanel, settingsOpen, profileOpen, go, tab } from '@/app/router';
import { METHOD_IDS } from '@/escobar/knowledge/methodIds';
import { pushFocus, currentFocus } from '@/escobar/palace/focus';

describe('palace registry integrity', () => {
  it('has about 70 entries', () => {
    expect(PALACE.length).toBeGreaterThanOrEqual(65);
  });
  it('ids are unique', () => {
    expect(new Set(PALACE.map(p => p.id)).size).toBe(PALACE.length);
  });
  it('every entry has a title, where, what and keywords', () => {
    for (const p of PALACE) {
      expect(p.title.length, p.id).toBeGreaterThan(0);
      expect(p.where.length, p.id).toBeGreaterThan(0);
      expect(p.what.length, p.id).toBeGreaterThan(0);
      expect(p.keywords.length, p.id).toBeGreaterThan(0);
      expect(p.keywords.every(k => k.trim().length > 0), p.id).toBe(true);
    }
  });
  it('targets point at real tabs and panels', () => {
    const tabs = new Set(TABS.map(t => t.id));
    for (const p of PALACE) {
      expect(tabs.has(p.target.tab), p.id).toBe(true);
      if (p.target.panel) expect(PANEL_IDS.includes(p.target.panel), p.id).toBe(true);
    }
  });
  it('methods are known method ids', () => {
    for (const p of PALACE) for (const m of p.methods ?? []) expect(METHOD_IDS).toContain(m);
  });
  it('every method id is referenced by at least one entry', () => {
    const used = new Set(PALACE.flatMap(p => p.methods ?? []));
    expect(METHOD_IDS.filter(m => !used.has(m))).toEqual([]);
  });
  it('covers the key actions from §7.1', () => {
    for (const id of ['train.start', 'train.log-past', 'panel.checkin', 'train.substitute', 'train.warmup', 'settings.data', 'panel.watch', 'settings.reminders', 'settings.theme', 'panel.goal', 'panel.schedule', 'settings.gyms', 'train.gym-chip']) expect(PALACE_BY_ID[id], id).toBeTruthy();
  });
});

describe('find_in_app ranking', () => {
  const top = (q: string) => findInApp(q)[0]?.id;
  it.each([
    ["where's my recovery", ['body.recovering', 'today.recovery', 'body.map']],
    ['how do I export a backup', ['settings.data']],
    ['change my goal', ['panel.goal', 'coach.goal']],
    ['move leg day to friday', ['panel.schedule', 'coach.schedule']],
    ['connect my watch', ['panel.watch']],
    ['my personal records', ['history.records']],
    ['swap an exercise', ['train.substitute']],
    ['dumbbells are in pounds', ['train.unit-pill', 'settings.gyms', 'train.gym-chip']],
    ['bench press trend', ['history.exercise-stats']],
    ['turn off the quote', ['settings.spark', 'today.spark']],
  ])('%s', (q, expected) => {
    expect(expected).toContain(top(q));
  });
  it('returns at most 5 and nothing for empty or nonsense queries', () => {
    expect(findInApp('sets').length).toBeLessThanOrEqual(5);
    expect(findInApp('')).toEqual([]);
    // ES-31: keywords match whole words only ('ai' is not in 'maintenance', 'rest' not in 'restorer').
    expect(findInApp('maintenance restorer')).toEqual([]);
    expect(findInApp('zzqx')).toEqual([]);
  });
});

describe('openPanel and aliases', () => {
  it('settingsOpen/profileOpen read and write openPanel', () => {
    settingsOpen.value = true;
    expect(openPanel.value).toEqual({ id: 'settings' });
    expect(settingsOpen.value).toBe(true);
    profileOpen.value = true;
    expect(settingsOpen.value).toBe(false);
    settingsOpen.value = false; // not the open one: no change
    expect(profileOpen.value).toBe(true);
    profileOpen.value = false;
    expect(openPanel.value).toBeNull();
  });
  it('switching tabs closes a panel', () => {
    tab.value = 'today';
    openPanel.value = { id: 'muscle', params: { muscle: 'quads' } };
    go('body');
    expect(openPanel.value).toBeNull();
  });
});

describe('focus', () => {
  it('is the top of the stack', () => {
    const popA = pushFocus({ id: 'body.map' });
    const popB = pushFocus({ id: 'body.muscle', details: { muscle: 'quads' } });
    expect(currentFocus.value).toEqual({ id: 'body.muscle', details: { muscle: 'quads' } });
    popB();
    expect(currentFocus.value?.id).toBe('body.map');
    popA();
    expect(currentFocus.value).toBeNull();
  });
});
