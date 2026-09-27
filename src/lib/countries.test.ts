import { describe, expect, it } from 'vitest';
import { computeSearchTarget, findCountry } from './countries';

describe('findCountry', () => {
  it.each([
    [2.35, 48.85, 'France'], // Paris
    [-98, 38.5, 'United States of America'], // Kansas
    [139.69, 35.69, 'Japan'], // Tokyo
    [-70.65, -33.45, 'Chile'], // Santiago
    [37.62, 55.75, 'Russia'], // Moscow
    [0, -85, 'Antarctica'],
  ])('finds the country at lon %s, lat %s', (lon, lat, name) => {
    expect(findCountry(lon, lat)).toBe(name);
  });

  it('returns null over the ocean', () => {
    expect(findCountry(-30, 30)).toBeNull(); // mid-Atlantic
    expect(findCountry(-150, 0)).toBeNull(); // mid-Pacific
  });

  it('finds enclaves rather than the country surrounding them', () => {
    expect(findCountry(28.23, -29.6)).toBe('Lesotho'); // Maseru area, inside South Africa
    expect(findCountry(12.45, 43.94)).toBe('San Marino'); // inside Italy
    expect(findCountry(12.4, 43.8)).toBe('Italy');
  });

  it('handles countries spanning the antimeridian', () => {
    expect(findCountry(177, 67)).toBe('Russia'); // Chukotka, east of 180°
    expect(findCountry(-175, 66.5)).toBe('Russia'); // Chukotka, west of 180°
    expect(findCountry(178.0, -17.8)).toBe('Fiji'); // Viti Levu
    expect(findCountry(-179.9, -16.85)).toBe('Fiji'); // Taveuni, west of 180°
  });
});

describe('computeSearchTarget', () => {
  it('returns null for unknown countries', () => {
    expect(computeSearchTarget('Atlantis')).toBeNull();
  });

  it.each([
    // Largest polygon wins: mainland France (not French Guiana), the lower 48 (not Alaska)
    ['France', 2.5, 46.5, 3],
    ['United States of America', -99, 39, 4],
    ['Japan', 138, 36.5, 4],
    ['Chile', -71, -36, 6],
  ])('centres %s near lon %s, lat %s', (name, lon, lat, tolerance) => {
    const target = computeSearchTarget(name)!;
    expect(Math.abs(target.lon - lon)).toBeLessThan(tolerance);
    expect(Math.abs(target.lat - lat)).toBeLessThan(tolerance);
  });

  it('centres Russia correctly despite it crossing the antimeridian', () => {
    const target = computeSearchTarget('Russia')!;
    expect(target.lon).toBeGreaterThan(60);
    expect(target.lon).toBeLessThan(120);
    expect(target.lat).toBeGreaterThan(55);
    expect(target.lat).toBeLessThan(70);
  });

  it('keeps longitudes normalised to [-180, 180]', () => {
    const fiji = computeSearchTarget('Fiji')!;
    expect(fiji.lon).toBeGreaterThanOrEqual(-180);
    expect(fiji.lon).toBeLessThanOrEqual(180);
  });

  it('zooms out further for larger countries, within limits', () => {
    const small = computeSearchTarget('Vatican')!.zoomDistance;
    const large = computeSearchTarget('Russia')!.zoomDistance;
    expect(small).toBeCloseTo(1.35, 2);
    expect(large).toBeGreaterThan(small);
    expect(large).toBeLessThanOrEqual(3.1);
  });
});
