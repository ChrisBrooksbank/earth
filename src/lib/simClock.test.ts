import { describe, expect, it } from 'vitest';
import {
  J2000_MS,
  SIDEREAL_DAY_S,
  advanceSimClock,
  earthRotationAngle,
  formatRate,
  moonPhase,
  secondsSinceJ2000,
  simClock,
} from './simClock';

describe('secondsSinceJ2000', () => {
  it('is zero at the epoch and counts real seconds', () => {
    expect(secondsSinceJ2000(J2000_MS)).toBe(0);
    expect(secondsSinceJ2000(J2000_MS + 90_000)).toBe(90);
  });
});

describe('earthRotationAngle', () => {
  it('completes one turn per sidereal day', () => {
    const start = earthRotationAngle(J2000_MS);
    const later = earthRotationAngle(J2000_MS + SIDEREAL_DAY_S * 1000);
    expect(later).toBeCloseTo(start, 6);
    expect(earthRotationAngle(J2000_MS + SIDEREAL_DAY_S * 250)).toBeCloseTo(Math.PI / 2, 6);
  });

  it('stays within [0, 2π) before the epoch', () => {
    const angle = earthRotationAngle(J2000_MS - 12_345_678);
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThan(2 * Math.PI);
  });
});

describe('moonPhase', () => {
  it('matches known new and full Moons', () => {
    // New Moon: 2024-01-11 11:57 UTC; full Moon: 2024-01-25 17:54 UTC
    const newMoon = moonPhase(Date.UTC(2024, 0, 11, 11, 57));
    expect(Math.min(newMoon, 1 - newMoon)).toBeLessThan(0.03);
    expect(moonPhase(Date.UTC(2024, 0, 25, 17, 54))).toBeCloseTo(0.5, 1);
  });
});

describe('advanceSimClock', () => {
  it('scales real time by the multiplier', () => {
    const before = simClock.ms;
    advanceSimClock(0.5, 3600);
    expect(simClock.ms - before).toBe(1_800_000);
  });
});

describe('formatRate', () => {
  it('describes rates in natural units', () => {
    expect(formatRate(1)).toBe('Real time');
    expect(formatRate(30)).toBe('30 s/s');
    expect(formatRate(60)).toBe('1 min/s');
    expect(formatRate(3600)).toBe('1 hr/s');
    expect(formatRate(86400 * 2.5)).toBe('2.5 days/s');
    expect(formatRate(365.25 * 86400)).toBe('1 yr/s');
  });
});
