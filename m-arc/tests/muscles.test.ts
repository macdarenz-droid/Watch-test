import { describe, it, expect } from 'vitest';
import { MUSCLES, classifyMuscleText } from '@/data/muscles';

describe('classifyMuscleText (ST-12)', () => {
  it('every label round-trips', () => {
    for (const m of MUSCLES) expect(classifyMuscleText(m.label)).toBe(m.id);
  });
  it('specific words beat generic ones', () => {
    expect(classifyMuscleText('lower back')).toBe('lower_back');
    expect(classifyMuscleText('rear shoulder')).toBe('rear_delts');
    expect(classifyMuscleText('front shoulder')).toBe('front_delts');
    expect(classifyMuscleText('serratus anterior')).toBe('core');
    expect(classifyMuscleText('brachioradialis')).toBe('forearms');
    expect(classifyMuscleText('upper back')).toBe('mid_back');
  });
});
