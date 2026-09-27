import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { J2000_MS } from './simClock';
import {
  applyEarthOrientation,
  earthDayViewPosition,
  earthQuaternionSunFromMinusX,
  earthRotationAngle,
  OBLIQUITY,
  subsolarPoint,
  sunDirection,
} from './earthOrientation';
import { lonLatToXYZ } from './geo-utils';

const DEG = 180 / Math.PI;

function angleDiffDeg(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

describe('earthRotationAngle', () => {
  it('matches the IAU value at J2000', () => {
    expect(earthRotationAngle(J2000_MS) * DEG).toBeCloseTo(280.46, 2);
  });

  it('completes one turn per sidereal day', () => {
    const siderealDayMs = 86_164_090.5;
    const start = earthRotationAngle(J2000_MS + 5e9);
    expect(earthRotationAngle(J2000_MS + 5e9 + siderealDayMs)).toBeCloseTo(start, 4);
  });

  it('stays within [0, 2π)', () => {
    for (const ms of [J2000_MS - 1e12, J2000_MS + 123_456_789, Date.UTC(2050, 0, 1)]) {
      const angle = earthRotationAngle(ms);
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(2 * Math.PI);
    }
  });
});

describe('sunDirection', () => {
  it('is a unit vector in the ecliptic plane', () => {
    const dir = sunDirection(Date.UTC(2025, 4, 1));
    expect(dir.length()).toBeCloseTo(1, 10);
    expect(Math.abs(dir.y)).toBeLessThan(1e-4);
  });
});

describe('subsolarPoint', () => {
  it.each([
    ['March equinox 2024', Date.UTC(2024, 2, 20, 3, 6), 0],
    ['June solstice 2024', Date.UTC(2024, 5, 20, 20, 51), 23.44],
    ['September equinox 2024', Date.UTC(2024, 8, 22, 12, 44), 0],
    ['December solstice 2024', Date.UTC(2024, 11, 21, 9, 20), -23.44],
  ])('has the right latitude at the %s', (_label, ms, lat) => {
    expect(Math.abs(subsolarPoint(ms).lat - lat)).toBeLessThan(0.3);
  });

  it.each([
    // At 12:00 UTC the Sun is overhead at -15° × (equation of time in hours)
    ['2024-03-20 (EoT −7.5 min)', Date.UTC(2024, 2, 20, 12), 1.9],
    ['2024-11-03 (EoT +16.4 min)', Date.UTC(2024, 10, 3, 12), -4.1],
    ['2024-02-11 (EoT −14.2 min)', Date.UTC(2024, 1, 11, 12), 3.55],
  ])('has the right longitude at noon UTC on %s', (_label, ms, lon) => {
    expect(angleDiffDeg(subsolarPoint(ms).lon, lon)).toBeLessThan(1);
  });

  it('moves west by 15° per hour', () => {
    const noon = subsolarPoint(Date.UTC(2025, 6, 1, 12)).lon;
    const onePm = subsolarPoint(Date.UTC(2025, 6, 1, 13)).lon;
    expect(angleDiffDeg(noon - 15, onePm)).toBeLessThan(0.1);
  });
});

describe('applyEarthOrientation', () => {
  it('tilts the North Pole by the obliquity from ecliptic north', () => {
    const earth = new THREE.Object3D();
    applyEarthOrientation(earth, Date.UTC(2025, 0, 1));
    const pole = new THREE.Vector3(0, 1, 0).applyEuler(earth.rotation);
    expect(Math.acos(pole.y)).toBeCloseTo(OBLIQUITY, 10);
  });

  it('turns the subsolar point toward the Sun', () => {
    const ms = Date.UTC(2025, 3, 15, 7, 30);
    const earth = new THREE.Object3D();
    applyEarthOrientation(earth, ms);
    const { lon, lat } = subsolarPoint(ms);
    const surface = new THREE.Vector3(...lonLatToXYZ(lon, lat, 1)).applyEuler(earth.rotation);
    expect(surface.dot(sunDirection(ms))).toBeCloseTo(1, 8);
  });
});

describe('earthQuaternionSunFromMinusX', () => {
  it('points the subsolar point toward -x', () => {
    const ms = Date.UTC(2025, 7, 9, 18, 45);
    const q = earthQuaternionSunFromMinusX(ms);
    const { lon, lat } = subsolarPoint(ms);
    const surface = new THREE.Vector3(...lonLatToXYZ(lon, lat, 1)).applyQuaternion(q);
    expect(surface.x).toBeCloseTo(-1, 8);
  });

  it('leans the North Pole toward the Sun in June and away in December', () => {
    const pole = (ms: number) =>
      new THREE.Vector3(0, 1, 0).applyQuaternion(earthQuaternionSunFromMinusX(ms));
    expect(pole(Date.UTC(2025, 5, 21)).x).toBeLessThan(-0.39); // toward the Sun (-x)
    expect(pole(Date.UTC(2025, 11, 21)).x).toBeGreaterThan(0.39);
  });
});

describe('earthDayViewPosition', () => {
  it('views the lit hemisphere from the requested distance', () => {
    const ms = Date.UTC(2025, 2, 1);
    const pos = new THREE.Vector3(...earthDayViewPosition(2.8, ms));
    expect(pos.length()).toBeCloseTo(2.8, 10);
    expect(pos.clone().normalize().dot(sunDirection(ms))).toBeGreaterThan(0.6);
  });
});
