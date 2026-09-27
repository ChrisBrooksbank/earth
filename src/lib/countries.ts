/**
 * Country data helpers shared by the globe (hover lookup) and the search bar.
 * Data: Natural Earth admin-0 countries (src/data/countries.json).
 */
import countriesData from '../data/countries.json';

type PolygonRings = number[][][];
type MultiPolygonRings = number[][][][];

type GeoJsonGeometry =
  | { type: 'Polygon'; coordinates: PolygonRings }
  | { type: 'MultiPolygon'; coordinates: MultiPolygonRings };

type GeoJsonFeature = {
  type: 'Feature';
  geometry: GeoJsonGeometry;
  properties: Record<string, unknown>;
};

/** Even-odd ray-casting test in lon/lat space. */
function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const pi = ring[i] as [number, number];
    const pj = ring[j] as [number, number];
    const xi = pi[0],
      yi = pi[1];
    const xj = pj[0],
      yj = pj[1];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function isValidLonLat(point: number[] | undefined): point is [number, number] {
  return (
    Array.isArray(point) &&
    point.length >= 2 &&
    Number.isFinite(point[0]) &&
    Number.isFinite(point[1])
  );
}

/** Name of the country containing the given point, or null over ocean. */
export function findCountry(lon: number, lat: number): string | null {
  for (const feature of countryFeatures) {
    const name = feature.properties.NAME as string;
    const { geometry } = feature;
    if (geometry.type === 'Polygon') {
      const outer = geometry.coordinates[0];
      const holes = geometry.coordinates.slice(1);
      if (outer && pointInRing(lon, lat, outer) && !holes.some(h => pointInRing(lon, lat, h))) {
        return name;
      }
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        const outer = polygon[0];
        const holes = polygon.slice(1);
        if (outer && pointInRing(lon, lat, outer) && !holes.some(h => pointInRing(lon, lat, h))) {
          return name;
        }
      }
    }
  }
  return null;
}

export const countryFeatures = (countriesData as { features: GeoJsonFeature[] }).features;

const COUNTRY_NAMES: string[] = countryFeatures
  .map(f => f.properties.NAME as string)
  .filter(Boolean)
  .sort();

/**
 * Country names matching a search query, best matches first: exact match,
 * then names starting with the query, then names containing it.
 */
export function searchCountryNames(query: string, limit = 8): string[] {
  const lower = query.trim().toLowerCase();
  if (!lower) return [];
  const rank = (name: string) => {
    const n = name.toLowerCase();
    if (n === lower) return 0;
    if (n.startsWith(lower)) return 1;
    return 2;
  };
  return COUNTRY_NAMES.filter(n => n.toLowerCase().includes(lower))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, limit);
}

/** Closest camera distance (Earth radii from centre) when flying to a country. */
const ZOOM_DISTANCE = 1.35;

interface RingCentroid {
  area: number;
  lon: number;
  lat: number;
  angularRadius: number;
}

function normalizeLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function angularDistanceDeg(lonA: number, latA: number, lonB: number, latB: number): number {
  const toRad = Math.PI / 180;
  const aLat = latA * toRad;
  const bLat = latB * toRad;
  const deltaLon = (lonB - lonA) * toRad;
  const cosDistance =
    Math.sin(aLat) * Math.sin(bLat) + Math.cos(aLat) * Math.cos(bLat) * Math.cos(deltaLon);
  return Math.acos(Math.max(-1, Math.min(1, cosDistance))) / toRad;
}

function unwrapRing(ring: number[][]): [number, number][] {
  const points: [number, number][] = [];
  let previousLon: number | null = null;
  let offset = 0;

  for (const point of ring) {
    const rawLon = point[0];
    const rawLat = point[1];
    if (
      typeof rawLon !== 'number' ||
      typeof rawLat !== 'number' ||
      !Number.isFinite(rawLon) ||
      !Number.isFinite(rawLat)
    ) {
      continue;
    }

    let lon = rawLon + offset;
    if (previousLon !== null) {
      while (lon - previousLon > 180) {
        offset -= 360;
        lon -= 360;
      }
      while (lon - previousLon < -180) {
        offset += 360;
        lon += 360;
      }
    }

    points.push([lon, rawLat]);
    previousLon = lon;
  }

  return points;
}

function computeRingCentroid(ring: number[][]): RingCentroid | null {
  const points = unwrapRing(ring);
  if (points.length < 3) return null;

  let twiceArea = 0;
  let lonSum = 0;
  let latSum = 0;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [lonA, latA] = points[j]!;
    const [lonB, latB] = points[i]!;
    const cross = lonA * latB - lonB * latA;
    twiceArea += cross;
    lonSum += (lonA + lonB) * cross;
    latSum += (latA + latB) * cross;
  }

  if (Math.abs(twiceArea) < 1e-9) return null;

  const lon = normalizeLon(lonSum / (3 * twiceArea));
  const lat = latSum / (3 * twiceArea);
  const angularRadius = points.reduce(
    (maxRadius, point) =>
      Math.max(maxRadius, angularDistanceDeg(lon, lat, normalizeLon(point[0]), point[1])),
    0
  );

  return {
    area: twiceArea / 2,
    lon,
    lat,
    angularRadius,
  };
}

export function computeSearchTarget(
  name: string
): { lon: number; lat: number; zoomDistance: number } | null {
  const feature = countryFeatures.find(f => (f.properties.NAME as string) === name);
  if (!feature) return null;

  const rings =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates[0]]
      : feature.geometry.coordinates.map(polygon => polygon[0]);

  let bestCentroid: RingCentroid | null = null;

  for (const ring of rings) {
    if (!ring) continue;
    const centroid = computeRingCentroid(ring);
    if (centroid && (!bestCentroid || Math.abs(centroid.area) > Math.abs(bestCentroid.area))) {
      bestCentroid = centroid;
    }
  }

  if (!bestCentroid) return null;

  return {
    lon: bestCentroid.lon,
    lat: bestCentroid.lat,
    zoomDistance: Math.min(
      3.1,
      Math.max(ZOOM_DISTANCE, ZOOM_DISTANCE + bestCentroid.angularRadius / 60)
    ),
  };
}
