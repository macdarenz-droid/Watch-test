import { describe, it, expect } from 'vitest';
import { parseDurationSec, parseLoad, parseMinutes, parseReps } from '@/core/parse';

describe('input parsers (UI-13)', () => {
  it('loads take a comma as the decimal point and stay in range', () => {
    expect(parseLoad('22,5', 'kg')).toBe(22.5);
    expect(parseLoad('102.5', 'kg')).toBe(102.5);
    expect(parseLoad('-5', 'kg')).toBeUndefined();
    expect(parseLoad('', 'kg')).toBeUndefined();
    expect(parseLoad('1e9', 'kg')).toBeUndefined();
    expect(parseLoad('1001', 'kg')).toBeUndefined();
    expect(parseLoad('2200', 'lb')).toBe(2200);
    expect(parseLoad('0', 'kg')).toBe(0);
  });
  it('reps are whole numbers 1..100', () => {
    expect(parseReps('22,5')).toBeUndefined();
    expect(parseReps('-5')).toBeUndefined();
    expect(parseReps('')).toBeUndefined();
    expect(parseReps('1e9')).toBeUndefined();
    expect(parseReps('8')).toBe(8);
    expect(parseReps('101')).toBeUndefined();
  });
  it('durations are whole seconds 1..3600 and minutes 1..600', () => {
    for (const bad of ['22,5', '-5', '', '1e9', '0']) { expect(parseDurationSec(bad)).toBeUndefined(); expect(parseMinutes(bad)).toBeUndefined(); }
    expect(parseDurationSec('3600')).toBe(3600);
    expect(parseDurationSec('3601')).toBeUndefined();
    expect(parseMinutes('600')).toBe(600);
    expect(parseMinutes('601')).toBeUndefined();
  });
});
