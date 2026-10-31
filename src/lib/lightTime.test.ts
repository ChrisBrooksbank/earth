import { describe, expect, it } from 'vitest';
import { formatLightTime } from './lightTime';

describe('formatLightTime', () => {
  it('formats the familiar Sun to Earth time', () => {
    expect(formatLightTime(1)).toBe('8 min 19 s');
  });

  it('uses seconds for short distances and hours for long ones', () => {
    expect(formatLightTime(0.00257)).toBe('1 s');
    expect(formatLightTime(30.07)).toBe('4 h 10 min');
  });

  it('drops a zero seconds part', () => {
    expect(formatLightTime(60 / 499.004784)).toBe('1 min');
  });
});
