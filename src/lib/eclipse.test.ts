import { describe, expect, it } from 'vitest';
import { nextEclipse, sunNodeOffsetDeg } from './eclipse';

const ms = (iso: string) => Date.parse(iso);
const DAY = 86_400_000;

describe('sunNodeOffsetDeg', () => {
  it('is near zero during the April 2024 eclipse season', () => {
    expect(Math.abs(sunNodeOffsetDeg(ms('2024-04-08T18:00:00Z')))).toBeLessThan(5);
  });

  it('is large when the Sun is far from the nodes', () => {
    expect(Math.abs(sunNodeOffsetDeg(ms('2024-07-08T00:00:00Z')))).toBeGreaterThan(60);
  });

  it('stays within -90 and 90', () => {
    for (let d = 0; d < 400; d += 7) {
      const v = sunNodeOffsetDeg(ms('2025-01-01T00:00:00Z') + d * DAY);
      expect(v).toBeGreaterThanOrEqual(-90);
      expect(v).toBeLessThan(90);
    }
  });
});

describe('nextEclipse', () => {
  it('finds the solar eclipse of 8 April 2024', () => {
    const e = nextEclipse(ms('2024-04-01T00:00:00Z'));
    expect(e.kind).toBe('solar');
    expect(Math.abs(e.ms - ms('2024-04-08T18:00:00Z')) / DAY).toBeLessThan(2);
  });

  it('finds the lunar eclipse of 18 September 2024', () => {
    const e = nextEclipse(ms('2024-04-09T00:00:00Z'));
    expect(e.kind).toBe('lunar');
    expect(Math.abs(e.ms - ms('2024-09-18T02:00:00Z')) / DAY).toBeLessThan(2);
  });

  it('finds eclipses roughly twice a year, never every month', () => {
    let t = ms('2025-01-01T00:00:00Z');
    const gaps: number[] = [];
    for (let i = 0; i < 8; i++) {
      const e = nextEclipse(t);
      gaps.push((e.ms - t) / DAY);
      t = e.ms + DAY;
    }
    expect(Math.max(...gaps)).toBeLessThan(200);
    expect(gaps.filter(g => g > 20).length).toBeGreaterThan(3);
  });
});

describe('nextEclipse by kind', () => {
  it('can be limited to lunar eclipses', () => {
    const e = nextEclipse(ms('2024-04-01T00:00:00Z'), 'lunar');
    expect(e.kind).toBe('lunar');
    expect(Math.abs(e.ms - ms('2024-09-18T02:00:00Z')) / DAY).toBeLessThan(2);
  });
});
