import { HALLEY } from '../data/comet';
import { getBodyInfo } from '../data/bodyInfo';
import { earthDayViewPosition } from '../lib/earthOrientation';
import { nextEclipse } from '../lib/eclipse';
import { formatLightTime } from '../lib/lightTime';
import { heliocentricAU } from '../lib/bodyPositions';
import { simClock } from '../lib/simClock';
import { useAppStore } from '../store/appStore';
import {
  EARTH_MOON_SUN_REAL_VIEW,
  EARTH_MOON_SUN_VIEW,
  EARTH_VIEW_DISTANCE,
  solarSystemOverview,
} from './CameraController';

/** One stop on the guided tour. `enter` sets up the scene; the caption is shown meanwhile. */
export interface TourStep {
  title: string;
  /** Caption text, evaluated when the step starts so it can describe the live scene */
  text: () => string;
  seconds: number;
  /** Slowly circle the subject while the step plays */
  orbit: boolean;
  enter: () => void;
}

const HOUR = 3600;
const DAY = 86400;
const DAY_MS = DAY * 1000;

const store = () => useAppStore.getState();

function setSpeed(multiplier: number) {
  const s = store();
  s.setTimeMultiplier(multiplier);
  s.setTimeDirection(1);
  s.setIsPaused(false);
}

function showEarth(distance: number) {
  const s = store();
  s.setEmsRealScale(false);
  s.enterPlanetView('Earth');
  s.setFlyTarget({ position: earthDayViewPosition(distance), lookAt: [0, 0, 0] });
}

function showMoonView(real: boolean) {
  const s = store();
  s.enterEarthMoonSunView();
  s.setEmsRealScale(real);
  s.setFlyTarget(real ? EARTH_MOON_SUN_REAL_VIEW : EARTH_MOON_SUN_VIEW);
}

/** Show the solar system in a layout, flying out to a view of it. */
function showSolar(
  layout: 'museum' | 'true' | 'lineup',
  cameraView?: ReturnType<typeof solarSystemOverview>
) {
  const s = store();
  if (layout === 'lineup') s.setLineup(true);
  else s.setScaleTarget(layout === 'true' ? 1 : 0);
  s.setLightPulse(null);
  s.exitToSolarSystem();
  s.setFlyTarget(cameraView ?? solarSystemOverview(layout));
}

function flyToBody(name: string) {
  const s = store();
  s.setLineup(false);
  s.exitToSolarSystem();
  s.setPendingFlyToBody(name);
}

function sendLightTo(name: string) {
  const position = heliocentricAU(name);
  if (!position) return;
  const distanceAU = Math.hypot(...position);
  store().setLightPulse({
    startMs: simClock.ms,
    direction: [position[0] / distanceAU, position[1] / distanceAU, position[2] / distanceAU],
    distanceAU,
    targetName: name,
  });
}

function planetStep(name: string, speed: number, seconds = 9): TourStep {
  const facts = getBodyInfo(name)?.funFacts ?? [];
  return {
    title: name,
    text: () => facts.slice(0, 2).join('. ') + '.',
    seconds,
    orbit: true,
    enter: () => {
      flyToBody(name);
      setSpeed(speed);
    },
  };
}

/** Where the tour views the inner solar system once it is drawn to true scale. */
const TRUE_SCALE_CLOSE_VIEW = {
  position: [0, 650, 1500] as [number, number, number],
  lookAt: [0, 0, 0] as [number, number, number],
};

/** Halley's perihelion is in 2061; start a little before it so the tail visibly grows. */
const HALLEY_APPROACH_MS = Date.UTC(2061, 4, 25, 0, 0, 0);

export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Earth',
    text: () =>
      'This is Earth right now. Time is running three hours per second, so day and night sweep across the planet. Drag, scroll or click anything to take control.',
    seconds: 12,
    orbit: true,
    enter: () => {
      // Each lap of the tour starts from the present moment
      simClock.ms = Date.now();
      showEarth(EARTH_VIEW_DISTANCE + 0.2);
      setSpeed(3 * HOUR);
    },
  },
  {
    title: 'The lights of night',
    text: () =>
      'Where the Sun has set, cities glow. Click the globe any time to pin a place and see when the Sun rises and sets there.',
    seconds: 9,
    orbit: true,
    enter: () => {
      showEarth(1.9);
      setSpeed(2 * HOUR);
    },
  },
  {
    title: 'Why the Moon has phases',
    text: () =>
      'The Moon is always half lit. What changes is how much of that lit half faces us as it circles Earth every 29.5 days, here one month in about 20 seconds.',
    seconds: 15,
    orbit: true,
    enter: () => {
      showMoonView(false);
      setSpeed(1.5 * DAY);
    },
  },
  {
    title: 'The Moon is far away',
    text: () =>
      "The same view at true scale. The Moon is 60 Earth-radii away and Earth's shadow is a thin needle, so the Moon usually slips above or below it.",
    seconds: 12,
    orbit: true,
    enter: () => {
      showMoonView(true);
      setSpeed(DAY);
    },
  },
  {
    title: 'A lunar eclipse',
    text: () => 'When a full Moon does cross the shadow, it dims and turns red.',
    seconds: 15,
    orbit: false,
    enter: () => {
      // Start four hours before the next lunar eclipse and watch the Moon cross the shadow
      const eclipse = nextEclipse(simClock.ms + DAY_MS, 'lunar');
      simClock.ms = eclipse.ms - 5 * HOUR * 1000;
      showMoonView(true);
      setSpeed(HOUR / 2);
    },
  },
  {
    title: 'The Solar System',
    text: () =>
      'Eight planets on their real orbits, one year of Earth passing every ten seconds. Sizes and distances are squeezed so everything fits: a museum model.',
    seconds: 14,
    orbit: true,
    enter: () => {
      simClock.ms = Date.now();
      showSolar('museum');
      setSpeed(36 * DAY);
    },
  },
  planetStep('Venus', 6 * HOUR),
  planetStep('Mars', 3 * HOUR),
  planetStep('Jupiter', 2 * HOUR, 10),
  planetStep('Saturn', 2 * HOUR, 10),
  planetStep('Uranus', 2 * HOUR),
  {
    title: "Halley's Comet",
    text: () =>
      "Every 75 years Halley's Comet swings in from beyond Neptune. Its tail grows as the Sun heats it and always points away from the Sun, here the 2061 visit.",
    seconds: 13,
    orbit: true,
    enter: () => {
      simClock.ms = HALLEY_APPROACH_MS;
      flyToBody(HALLEY.name);
      setSpeed(2 * DAY);
    },
  },
  {
    title: 'Now, true scale',
    text: () =>
      `Same Solar System, drawn without squeezing. The Sun is 109 Earths wide, yet the planets are dots, each glowing so you can still find it. Earth's orbit alone is 600 units across.`,
    seconds: 12,
    orbit: true,
    enter: () => {
      simClock.ms = Date.now();
      showSolar('true', TRUE_SCALE_CLOSE_VIEW);
      setSpeed(DAY);
    },
  },
  {
    title: 'Racing the light',
    text: () => {
      const au = Math.hypot(...(heliocentricAU('Earth') ?? [1, 0, 0]));
      return `A pulse of sunlight, travelling at its true speed, takes ${formatLightTime(au)} to reach Earth. Everything here is running one minute per second.`;
    },
    seconds: 12,
    orbit: false,
    enter: () => {
      setSpeed(60);
      sendLightTo('Earth');
    },
  },
  {
    title: 'To Neptune',
    text: () => {
      const au = Math.hypot(...(heliocentricAU('Neptune') ?? [30, 0, 0]));
      return `Out at Neptune the same light takes ${formatLightTime(au)}. This is the real emptiness of space.`;
    },
    seconds: 13,
    orbit: false,
    enter: () => {
      showSolar('true');
      setSpeed(1500);
      sendLightTo('Neptune');
    },
  },
  {
    title: 'Planets, side by side',
    text: () =>
      "The planets at true relative size, though not true distance. More than 1,300 Earths would fit inside Jupiter. The Sun, 109 Earths across, won't fit on this screen.",
    seconds: 12,
    orbit: false,
    enter: () => {
      showSolar('lineup');
      setSpeed(2 * HOUR);
    },
  },
  {
    title: 'Your turn',
    text: () =>
      'Pick any planet from the list, change the speed, scale the Solar System, or press Earth to dive back in. The tour restarts if you walk away.',
    seconds: 9,
    orbit: true,
    enter: () => {
      showSolar('museum');
      setSpeed(DAY);
    },
  },
];
