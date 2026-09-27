import { describe, expect, it } from 'vitest';
import { multiplierToSlider, sliderToMultiplier } from './timeSlider';

describe('time slider mapping', () => {
  it('spans real time to about a year per second', () => {
    expect(sliderToMultiplier(0)).toBe(1);
    const max = sliderToMultiplier(100);
    expect(max).toBeGreaterThan(3e7);
    expect(max).toBeLessThan(3.3e7);
  });

  it('increases monotonically', () => {
    let previous = 0;
    for (let v = 0; v <= 100; v++) {
      const m = sliderToMultiplier(v);
      expect(m).toBeGreaterThanOrEqual(previous);
      previous = m;
    }
  });

  it('rounds to two significant figures without float noise', () => {
    for (let v = 0; v <= 100; v++) {
      const m = sliderToMultiplier(v);
      const digits = String(m)
        .replace(/^0\.0*|\./g, '')
        .replace(/0+$/, '');
      expect(digits.length, `${m}`).toBeLessThanOrEqual(2);
    }
  });

  it('round-trips a multiplier back to roughly the same slider position', () => {
    for (const v of [0, 10, 47, 80, 100]) {
      expect(multiplierToSlider(sliderToMultiplier(v))).toBeCloseTo(v, -0.5);
    }
  });

  it('places the default of one hour per second mid-way', () => {
    const position = multiplierToSlider(3600);
    expect(position).toBeGreaterThan(40);
    expect(position).toBeLessThan(55);
  });
});
