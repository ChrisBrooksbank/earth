/**
 * Place search across countries and major cities, plus country details.
 * Cities: Natural Earth 50m populated places, stored as
 * [name, country, lon, lat, population] sorted by population.
 */
import citiesData from '../data/cities.json';
import countryInfoData from '../data/countryInfo.json';
import { countryNames } from './countries';

type CityRow = [string, string, number, number, number];

export type PlaceResult =
  | { kind: 'country'; name: string }
  | { kind: 'city'; name: string; country: string; lon: number; lat: number };

interface CountryInfo {
  formal?: string;
  continent?: string;
  subregion?: string;
  population?: number;
  populationYear?: number;
  capital?: string;
  iso2?: string;
}

const cities = citiesData as CityRow[];
const countryInfo = countryInfoData as Record<string, CountryInfo>;

/** 0 = exact match, 1 = starts with the query, 2 = contains it, -1 = no match. */
function matchRank(name: string, lower: string): number {
  const n = name.toLowerCase();
  if (n === lower) return 0;
  if (n.startsWith(lower)) return 1;
  return n.includes(lower) ? 2 : -1;
}

/**
 * Countries and cities matching a query. Better matches come first; at equal
 * match quality countries precede cities, and larger cities precede smaller.
 */
export function searchPlaces(query: string, limit = 8): PlaceResult[] {
  const lower = query.trim().toLowerCase();
  if (!lower) return [];

  const ranked: { rank: number; order: number; place: PlaceResult }[] = [];
  countryNames.forEach((name, i) => {
    const rank = matchRank(name, lower);
    if (rank >= 0) ranked.push({ rank, order: i, place: { kind: 'country', name } });
  });
  cities.forEach(([name, country, lon, lat], i) => {
    const rank = matchRank(name, lower);
    if (rank >= 0) {
      ranked.push({
        rank,
        order: countryNames.length + i,
        place: { kind: 'city', name, country, lon, lat },
      });
    }
  });

  return ranked
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .slice(0, limit)
    .map(r => r.place);
}

/** Details for a country by its dataset name, if known. */
export function getCountryInfo(name: string): CountryInfo | undefined {
  return countryInfo[name];
}

/** Flag emoji for a two-letter ISO country code (e.g. "FR" → 🇫🇷). */
export function flagEmoji(iso2: string): string {
  if (!/^[A-Za-z]{2}$/.test(iso2)) return '';
  return String.fromCodePoint(...[...iso2.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}
