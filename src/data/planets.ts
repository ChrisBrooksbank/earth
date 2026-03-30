export interface PlanetData {
  name: string;
  /** Real equatorial radius in km */
  radiusKm: number;
  /** Texture path relative to /public */
  texture: string;
  /** Axial tilt in radians */
  axialTilt: number;
  /** Sidereal rotation speed in rad/s (negative = retrograde) */
  rotationSpeed: number;
  /** Semi-major axis in AU */
  semiMajorAxisAU: number;
  /** Orbital color used for orbit line */
  orbitColor: string;
  /** Whether this body has rings */
  hasRings?: boolean;
  /** Parent body name (for moons) */
  parent?: string;
}

const DEG = Math.PI / 180;

/** Real sidereal rotation period → rad/s helper */
function rotRate(hours: number, retrograde = false): number {
  const sign = retrograde ? -1 : 1;
  return (sign * (2 * Math.PI)) / (hours * 3600);
}

export const PLANETS: PlanetData[] = [
  {
    name: 'Mercury',
    radiusKm: 2439.7,
    texture: '/textures/mercury_color.jpg',
    axialTilt: 0.034 * DEG,
    rotationSpeed: rotRate(1407.6),
    semiMajorAxisAU: 0.387,
    orbitColor: '#b5b5b5',
  },
  {
    name: 'Venus',
    radiusKm: 6051.8,
    texture: '/textures/venus_color.jpg',
    axialTilt: 177.4 * DEG,
    rotationSpeed: rotRate(5832.5, true),
    semiMajorAxisAU: 0.723,
    orbitColor: '#e8cda0',
  },
  {
    name: 'Earth',
    radiusKm: 6371.0,
    texture: '/textures/earth_day.jpg',
    axialTilt: 23.44 * DEG,
    rotationSpeed: rotRate(23.9345),
    semiMajorAxisAU: 1.0,
    orbitColor: '#4fa3e0',
  },
  {
    name: 'Moon',
    radiusKm: 1737.4,
    texture: '/textures/moon_color.jpg',
    axialTilt: 6.68 * DEG,
    rotationSpeed: rotRate(655.7),
    semiMajorAxisAU: 1.0,
    orbitColor: '#aaaaaa',
    parent: 'Earth',
  },
  {
    name: 'Mars',
    radiusKm: 3389.5,
    texture: '/textures/mars_color.jpg',
    axialTilt: 25.19 * DEG,
    rotationSpeed: rotRate(24.6229),
    semiMajorAxisAU: 1.524,
    orbitColor: '#c1440e',
  },
  {
    name: 'Jupiter',
    radiusKm: 69911.0,
    texture: '/textures/jupiter_color.jpg',
    axialTilt: 3.13 * DEG,
    rotationSpeed: rotRate(9.9258),
    semiMajorAxisAU: 5.203,
    orbitColor: '#c88b3a',
  },
  {
    name: 'Saturn',
    radiusKm: 58232.0,
    texture: '/textures/saturn_color.jpg',
    axialTilt: 26.73 * DEG,
    rotationSpeed: rotRate(10.656),
    semiMajorAxisAU: 9.537,
    orbitColor: '#e4d191',
    hasRings: true,
  },
  {
    name: 'Uranus',
    radiusKm: 25362.0,
    texture: '/textures/uranus_color.jpg',
    axialTilt: 97.77 * DEG,
    rotationSpeed: rotRate(17.24, true),
    semiMajorAxisAU: 19.191,
    orbitColor: '#7de8e8',
  },
  {
    name: 'Neptune',
    radiusKm: 24622.0,
    texture: '/textures/neptune_color.jpg',
    axialTilt: 28.32 * DEG,
    rotationSpeed: rotRate(16.11),
    semiMajorAxisAU: 30.069,
    orbitColor: '#4b70dd',
  },
  {
    name: 'Pluto',
    radiusKm: 1188.3,
    texture: '/textures/pluto_color.jpg',
    axialTilt: 122.53 * DEG,
    rotationSpeed: rotRate(153.3, true),
    semiMajorAxisAU: 39.482,
    orbitColor: '#c4b49e',
  },
];

export const EARTH_RADIUS_KM = 6371.0;
