import { describe, expect, it } from 'vitest';
import { localSolarTime, solarNoon, sunTimes } from './solar';
import { subsolarPoint } from './earthOrientation';

const MINUTE = 60_000;

function expectNear(actualMs: number, expectedIso: string, toleranceMin = 4) {
  expect(Math.abs(actualMs - Date.parse(expectedIso)) / MINUTE).toBeLessThan(toleranceMin);
}

describe('subsolarPoint', () => {
  it('agrees with an independent source (wheretheiss.at)', () => {
    const { lon, lat } = subsolarPoint(Date.parse('2026-09-27T22:17:09Z'));
    expect(lat).toBeCloseTo(-1.914, 0);
    expect(Math.abs(lon - -156.581)).toBeLessThan(0.5);
  });
});

describe('localSolarTime', () => {
  it('is noon where the Sun is overhead and midnight opposite', () => {
    const ms = Date.parse('2025-05-05T08:00:00Z');
    const { lon } = subsolarPoint(ms);
    expect(localSolarTime(lon, ms)).toBeCloseTo(12, 6);
    expect(localSolarTime(lon + 180, ms)).toBeCloseTo(0, 6);
    expect(localSolarTime(lon + 90, ms)).toBeCloseTo(18, 6);
  });
});

describe('sunTimes', () => {
  it('matches published times for London at the June solstice', () => {
    const times = sunTimes(-0.1276, 51.5072, Date.parse('2024-06-21T12:00:00Z'));
    expect(times.kind).toBe('normal');
    if (times.kind !== 'normal') return;
    expectNear(times.sunrise, '2024-06-21T03:43:00Z');
    expectNear(times.noon, '2024-06-21T12:02:00Z');
    expectNear(times.sunset, '2024-06-21T20:21:00Z');
  });

  it('matches published times for Sydney in midwinter', () => {
    const times = sunTimes(151.2093, -33.8688, Date.parse('2024-06-21T02:00:00Z'));
    if (times.kind !== 'normal') throw new Error('expected a normal day');
    expectNear(times.sunrise, '2024-06-20T20:59:00Z');
    expectNear(times.sunset, '2024-06-21T06:53:00Z');
  });

  it('gives about 12 h 7 min of daylight on the equator at the equinox', () => {
    // Refraction and the Sun's disc add ~7 minutes to the geometric 12 hours
    const times = sunTimes(-78.4678, 0, Date.parse('2024-03-20T17:00:00Z'));
    if (times.kind !== 'normal') throw new Error('expected a normal day');
    const dayMinutes = (times.sunset - times.sunrise) / MINUTE;
    expect(dayMinutes).toBeGreaterThan(12 * 60 + 5);
    expect(dayMinutes).toBeLessThan(12 * 60 + 9);
    // Solar noon: 12:00 UTC + 78.47°/15 h − equation of time (−7.5 min) ≈ 17:21
    expectNear(times.noon, '2024-03-20T17:21:00Z', 2);
  });

  it('reports the midnight sun and polar night', () => {
    expect(sunTimes(18.96, 69.65, Date.parse('2024-06-21T12:00:00Z')).kind).toBe('polarDay');
    expect(sunTimes(18.96, 69.65, Date.parse('2024-12-21T12:00:00Z')).kind).toBe('polarNight');
  });

  it('picks the solar noon nearest to the given time', () => {
    const ms = Date.parse('2024-01-10T23:00:00Z');
    const noon = solarNoon(0, ms);
    expect(Math.abs(noon - ms)).toBeLessThanOrEqual(12 * 60 * MINUTE);
  });
});
