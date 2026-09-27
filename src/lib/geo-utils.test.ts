import { describe, expect, it } from 'vitest';
import { lonLatToXYZ, xyzToLonLat } from './geo-utils';

function expectVec(actual: [number, number, number], expected: [number, number, number]) {
  actual.forEach((v, idx) => expect(v).toBeCloseTo(expected[idx]!, 10));
}

describe('lonLatToXYZ', () => {
  it('maps reference points to the axes used by the Earth texture', () => {
    expectVec(lonLatToXYZ(0, 90, 1), [0, 1, 0]); // North Pole is up
    expectVec(lonLatToXYZ(0, -90, 1), [0, -1, 0]);
    expectVec(lonLatToXYZ(0, 0, 1), [1, 0, 0]); // Greenwich / equator
    expectVec(lonLatToXYZ(90, 0, 1), [0, 0, -1]);
    expectVec(lonLatToXYZ(-90, 0, 1), [0, 0, 1]);
    expectVec(lonLatToXYZ(180, 0, 1), [-1, 0, 0]);
  });

  it('scales by radius', () => {
    const [x, y, z] = lonLatToXYZ(37, -12, 2.5);
    expect(Math.hypot(x, y, z)).toBeCloseTo(2.5, 10);
  });

  it('returns the origin for non-finite input', () => {
    expect(lonLatToXYZ(Number.NaN, 0, 1)).toEqual([0, 0, 0]);
    expect(lonLatToXYZ(0, Infinity, 1)).toEqual([0, 0, 0]);
  });
});

describe('xyzToLonLat', () => {
  it.each([
    [0, 0],
    [2.35, 48.85], // Paris
    [139.69, 35.69], // Tokyo
    [-74.0, 40.71], // New York
    [151.21, -33.87], // Sydney
    [-179.5, 10],
    [179.5, -10],
  ])('round-trips lon %s, lat %s', (lon, lat) => {
    const [x, y, z] = lonLatToXYZ(lon, lat, 1.3);
    const [lon2, lat2] = xyzToLonLat(x, y, z);
    expect(lat2).toBeCloseTo(lat, 8);
    expect(lon2).toBeCloseTo(lon, 8);
  });

  it('returns longitudes within [-180, 180]', () => {
    for (let lon = -180; lon <= 180; lon += 15) {
      const [out] = xyzToLonLat(...lonLatToXYZ(lon, 5, 1));
      expect(out).toBeGreaterThanOrEqual(-180);
      expect(out).toBeLessThanOrEqual(180);
    }
  });
});
