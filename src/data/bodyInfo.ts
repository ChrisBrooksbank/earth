export interface BodyInfo {
  name: string;
  /** Mass formatted for display */
  mass: string;
  /** Orbital period in Earth days */
  orbitalPeriodDays: number;
  /** Fun facts */
  funFacts: string[];
}

const BODY_INFO: BodyInfo[] = [
  {
    name: 'Mercury',
    mass: '3.285 × 10²³ kg',
    orbitalPeriodDays: 87.97,
    funFacts: [
      'Smallest planet in the solar system',
      'Surface temperatures swing from −180 °C to 430 °C',
      'Has no atmosphere to retain heat',
    ],
  },
  {
    name: 'Venus',
    mass: '4.867 × 10²⁴ kg',
    orbitalPeriodDays: 224.7,
    funFacts: [
      'Hottest planet at ~465 °C surface temperature',
      'Rotates backwards compared to most planets',
      'A day on Venus is longer than its year',
    ],
  },
  {
    name: 'Earth',
    mass: '5.972 × 10²⁴ kg',
    orbitalPeriodDays: 365.25,
    funFacts: [
      'Only known planet to harbour life',
      'About 71% of the surface is covered by water',
      'Has a large moon stabilizing its axial tilt',
    ],
  },
  {
    name: 'Moon',
    mass: '7.342 × 10²² kg',
    orbitalPeriodDays: 27.32,
    funFacts: [
      'Tidally locked — the same face always faces Earth',
      'Largest moon relative to its parent planet in the solar system',
      'Responsible for ocean tides on Earth',
    ],
  },
  {
    name: 'Mars',
    mass: '6.390 × 10²³ kg',
    orbitalPeriodDays: 686.97,
    funFacts: [
      'Home to Olympus Mons, the tallest volcano in the solar system',
      'Has two tiny moons: Phobos and Deimos',
      'A Martian day (sol) is 24 h 37 min',
    ],
  },
  {
    name: 'Jupiter',
    mass: '1.898 × 10²⁷ kg',
    orbitalPeriodDays: 4332.59,
    funFacts: [
      'Largest planet — more than twice the mass of all other planets combined',
      'The Great Red Spot is a storm older than 350 years',
      'Has at least 95 known moons',
    ],
  },
  {
    name: 'Saturn',
    mass: '5.683 × 10²⁶ kg',
    orbitalPeriodDays: 10759.22,
    funFacts: [
      'Its rings are made mostly of ice and rock',
      'Less dense than water — it would float in a large enough ocean',
      'Has 146 confirmed moons including Titan with a thick atmosphere',
    ],
  },
  {
    name: 'Uranus',
    mass: '8.681 × 10²⁵ kg',
    orbitalPeriodDays: 30688.5,
    funFacts: [
      'Rotates on its side with a 98° axial tilt',
      'Has faint rings discovered in 1977',
      'Its moons are named after Shakespeare characters',
    ],
  },
  {
    name: 'Neptune',
    mass: '1.024 × 10²⁶ kg',
    orbitalPeriodDays: 60182.0,
    funFacts: [
      'Strongest winds in the solar system — up to 2100 km/h',
      "Its moon Triton orbits in the opposite direction to Neptune's rotation",
      'Takes 165 Earth years to complete one orbit',
    ],
  },
  {
    name: 'Pluto',
    mass: '1.303 × 10²² kg',
    orbitalPeriodDays: 90560.0,
    funFacts: [
      'Reclassified as a dwarf planet in 2006',
      'Its largest moon Charon is half its diameter',
      'Has a heart-shaped nitrogen ice plain called Tombaugh Regio',
    ],
  },
];

const BODY_INFO_MAP = new Map<string, BodyInfo>(BODY_INFO.map(b => [b.name, b]));

export function getBodyInfo(name: string): BodyInfo | undefined {
  return BODY_INFO_MAP.get(name);
}
