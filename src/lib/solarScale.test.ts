import { beforeEach, describe, expect, it } from 'vitest';
import {
  blendedDistance,
  blendedRadius,
  chase,
  currentBodyRadius,
  KM_PER_AU,
  lineupSlot,
  logMix,
  moonDistance,
  museumDistance,
  scaleState,
  stepScaleState,
  sunRadius,
  TRUE_UNITS_PER_AU,
} from './solarScale';
import { PLANETS } from '../data/planets';

describe('logMix', () => {
  it('hits both ends and blends geometrically', () => {
    expect(logMix(1, 100, 0)).toBeCloseTo(1);
    expect(logMix(1, 100, 1)).toBeCloseTo(100);
    expect(logMix(1, 100, 0.5)).toBeCloseTo(10);
  });

  it('falls back to a linear blend when a value is zero', () => {
    expect(logMix(0, 10, 0.5)).toBeCloseTo(5);
  });
});

describe('blended distance and radius', () => {
  it('matches the museum layout at t=0 and true scale at t=1', () => {
    expect(blendedDistance(1, 0)).toBeCloseTo(museumDistance(1));
    expect(blendedDistance(1, 1)).toBeCloseTo(TRUE_UNITS_PER_AU);
    expect(blendedDistance(0, 0.5)).toBe(0);
  });

  it('draws the true Sun about 109 times wider than Earth', () => {
    const earth = blendedRadius(6371, 1);
    expect(sunRadius(1) / earth).toBeCloseTo(109.1, 0);
  });

  it('draws 1 AU as about 23,500 Earth radii at true scale', () => {
    const earth = blendedRadius(6371, 1);
    expect(TRUE_UNITS_PER_AU / earth).toBeCloseTo(KM_PER_AU / 6371, 0);
  });

  it('keeps the Sun larger than Jupiter in the museum layout', () => {
    expect(sunRadius(0)).toBeGreaterThan(blendedRadius(69911, 0));
  });
});

describe('moonDistance', () => {
  it('puts the Moon about 60 Earth radii away at true scale', () => {
    const au = 384_400 / KM_PER_AU;
    const earth = blendedRadius(6371, 1);
    expect(moonDistance(au, au, 1) / earth).toBeCloseTo(60.3, 0);
  });

  it('keeps the orbit slightly elliptical in the museum layout', () => {
    expect(moonDistance(0.0027, 0.00257, 0)).toBeGreaterThan(moonDistance(0.0025, 0.00257, 0));
  });
});

describe('size lineup', () => {
  it('has every body at its true size relative to Earth', () => {
    expect(lineupSlot('Earth')!.radius).toBeCloseTo(1);
    expect(lineupSlot('Jupiter')!.radius).toBeCloseTo(69911 / 6371, 5);
  });

  it('lays bodies out left to right without overlapping', () => {
    for (let i = 1; i < PLANETS.length; i++) {
      const prev = lineupSlot(PLANETS[i - 1]!.name)!;
      const slot = lineupSlot(PLANETS[i]!.name)!;
      expect(slot.x - slot.extent).toBeGreaterThan(prev.x + prev.extent);
    }
  });

  it('is centred on the origin', () => {
    const first = lineupSlot(PLANETS[0]!.name)!;
    const last = lineupSlot(PLANETS[PLANETS.length - 1]!.name)!;
    expect(first.x - first.extent).toBeCloseTo(-(last.x + last.extent));
  });
});

describe('scale state', () => {
  beforeEach(() => {
    scaleState.t = 0;
    scaleState.lineup = 0;
  });

  it('chases its target and settles exactly on it', () => {
    let v = 0;
    for (let i = 0; i < 600; i++) v = chase(v, 1, 1 / 60, 2);
    expect(v).toBe(1);
  });

  it('moves toward true scale and the lineup over time', () => {
    stepScaleState(0.5, 1, true);
    expect(scaleState.t).toBeGreaterThan(0);
    expect(scaleState.lineup).toBeGreaterThan(0);
  });

  it('reports a body radius that follows the blend', () => {
    const museum = currentBodyRadius('Jupiter')!;
    scaleState.t = 1;
    expect(currentBodyRadius('Jupiter')!).toBeLessThan(museum / 5);
    expect(currentBodyRadius('Nowhere')).toBeNull();
  });
});
