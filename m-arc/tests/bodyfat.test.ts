import { describe, it, expect } from 'vitest';
import { navyBodyFat } from '@/core/bodyfat';

describe('navyBodyFat (BR-01)', () => {
  it('uses the metric constants on centimetres', () => {
    expect(Math.abs(navyBodyFat({ sex: 'male', heightCm: 180, neckCm: 38, waistCm: 85 })! - 16.1)).toBeLessThanOrEqual(0.2);
    expect(Math.abs(navyBodyFat({ sex: 'female', heightCm: 165, neckCm: 33, waistCm: 75, hipCm: 100 })! - 29.4)).toBeLessThanOrEqual(0.2);
  });
  it('a woman without a hip measurement gets no estimate', () => {
    expect(navyBodyFat({ sex: 'female', heightCm: 165, neckCm: 33, waistCm: 75 })).toBeNull();
  });
});
