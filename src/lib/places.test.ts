import { describe, expect, it } from 'vitest';
import { flagEmoji, getCountryInfo, searchPlaces } from './places';

describe('searchPlaces', () => {
  it('finds cities with their coordinates', () => {
    const [first] = searchPlaces('paris');
    expect(first).toMatchObject({ kind: 'city', name: 'Paris', country: 'France' });
    if (first?.kind !== 'city') return;
    expect(first.lon).toBeCloseTo(2.35, 0);
    expect(first.lat).toBeCloseTo(48.87, 0);
  });

  it('prefers countries over cities with an equally good match', () => {
    expect(searchPlaces('mexico')[0]).toEqual({ kind: 'country', name: 'Mexico' });
    expect(searchPlaces('mexico').some(p => p.kind === 'city' && p.name === 'Mexico City')).toBe(
      true
    );
  });

  it('ranks exact matches first, then prefixes, then substrings', () => {
    const names = searchPlaces('guinea').map(p => p.name);
    expect(names[0]).toBe('Guinea');
    expect(names.indexOf('Guinea-Bissau')).toBeLessThan(names.indexOf('Eq. Guinea'));
  });

  it('lists larger cities first', () => {
    const cities = searchPlaces('san', 20).filter(p => p.kind === 'city');
    expect(cities.length).toBeGreaterThan(2);
    expect(cities[0]?.name).toMatch(/^San/);
  });

  it('returns nothing for blank queries', () => {
    expect(searchPlaces('  ')).toEqual([]);
  });
});

describe('getCountryInfo', () => {
  it('has capitals, regions and populations', () => {
    expect(getCountryInfo('France')).toMatchObject({
      capital: 'Paris',
      continent: 'Europe',
      iso2: 'FR',
    });
    expect(getCountryInfo('Japan')?.population).toBeGreaterThan(100_000_000);
  });

  it('returns undefined for unknown names', () => {
    expect(getCountryInfo('Atlantis')).toBeUndefined();
  });
});

describe('flagEmoji', () => {
  it('builds regional-indicator flags', () => {
    expect(flagEmoji('FR')).toBe('🇫🇷');
    expect(flagEmoji('jp')).toBe('🇯🇵');
  });

  it('ignores invalid codes', () => {
    expect(flagEmoji('-99')).toBe('');
  });
});
