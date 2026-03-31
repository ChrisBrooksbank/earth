/** Major countries with pre-computed centroids for globe labels.
 *  tier 1 = always visible when labels shown, tier 2 = only when zoomed in */
export interface MajorCountry {
  name: string;
  lon: number;
  lat: number;
  tier: 1 | 2;
}

export const MAJOR_COUNTRIES: MajorCountry[] = [
  // Tier 1 — large/prominent countries, visible at medium zoom
  { name: 'Russia', lon: 97, lat: 62, tier: 1 },
  { name: 'Canada', lon: -106, lat: 56, tier: 1 },
  { name: 'United States of America', lon: -98, lat: 39, tier: 1 },
  { name: 'China', lon: 104, lat: 35, tier: 1 },
  { name: 'Brazil', lon: -53, lat: -10, tier: 1 },
  { name: 'Australia', lon: 134, lat: -25, tier: 1 },
  { name: 'India', lon: 79, lat: 22, tier: 1 },
  { name: 'Argentina', lon: -64, lat: -34, tier: 1 },
  { name: 'Kazakhstan', lon: 67, lat: 48, tier: 1 },
  { name: 'Algeria', lon: 3, lat: 28, tier: 1 },
  { name: 'Dem. Rep. Congo', lon: 24, lat: -3, tier: 1 },
  { name: 'Saudi Arabia', lon: 45, lat: 24, tier: 1 },
  { name: 'Mexico', lon: -102, lat: 24, tier: 1 },
  { name: 'Indonesia', lon: 118, lat: -2, tier: 1 },
  { name: 'Sudan', lon: 30, lat: 15, tier: 1 },
  { name: 'Libya', lon: 18, lat: 27, tier: 1 },
  { name: 'Iran', lon: 53, lat: 33, tier: 1 },
  { name: 'Mongolia', lon: 104, lat: 47, tier: 1 },
  { name: 'Peru', lon: -76, lat: -10, tier: 1 },
  { name: 'Egypt', lon: 30, lat: 27, tier: 1 },

  // Tier 2 — smaller/less prominent, visible only when zoomed in close
  { name: 'South Africa', lon: 25, lat: -29, tier: 2 },
  { name: 'Colombia', lon: -73, lat: 4, tier: 2 },
  { name: 'Ethiopia', lon: 39, lat: 9, tier: 2 },
  { name: 'Nigeria', lon: 8, lat: 10, tier: 2 },
  { name: 'Tanzania', lon: 35, lat: -6, tier: 2 },
  { name: 'Turkey', lon: 35, lat: 39, tier: 2 },
  { name: 'France', lon: 2, lat: 47, tier: 2 },
  { name: 'Spain', lon: -4, lat: 40, tier: 2 },
  { name: 'Germany', lon: 10, lat: 51, tier: 2 },
  { name: 'Japan', lon: 138, lat: 36, tier: 2 },
  { name: 'United Kingdom', lon: -2, lat: 54, tier: 2 },
  { name: 'Italy', lon: 12, lat: 43, tier: 2 },
  { name: 'Poland', lon: 20, lat: 52, tier: 2 },
  { name: 'Ukraine', lon: 32, lat: 49, tier: 2 },
  { name: 'Sweden', lon: 16, lat: 62, tier: 2 },
  { name: 'Norway', lon: 9, lat: 62, tier: 2 },
  { name: 'Finland', lon: 26, lat: 64, tier: 2 },
  { name: 'Pakistan', lon: 69, lat: 30, tier: 2 },
  { name: 'Afghanistan', lon: 66, lat: 34, tier: 2 },
  { name: 'Thailand', lon: 101, lat: 15, tier: 2 },
  { name: 'Myanmar', lon: 96, lat: 20, tier: 2 },
  { name: 'Vietnam', lon: 106, lat: 16, tier: 2 },
  { name: 'Philippines', lon: 122, lat: 12, tier: 2 },
  { name: 'New Zealand', lon: 172, lat: -42, tier: 2 },
  { name: 'Chile', lon: -71, lat: -35, tier: 2 },
  { name: 'Venezuela', lon: -66, lat: 7, tier: 2 },
  { name: 'Bolivia', lon: -65, lat: -17, tier: 2 },
  { name: 'Kenya', lon: 38, lat: 0, tier: 2 },
  { name: 'Angola', lon: 18, lat: -12, tier: 2 },
  { name: 'Mozambique', lon: 35, lat: -18, tier: 2 },
  { name: 'Madagascar', lon: 47, lat: -19, tier: 2 },
  { name: 'Iraq', lon: 44, lat: 33, tier: 2 },
  { name: 'Morocco', lon: -6, lat: 32, tier: 2 },
  { name: 'Greenland', lon: -42, lat: 72, tier: 2 },
];
