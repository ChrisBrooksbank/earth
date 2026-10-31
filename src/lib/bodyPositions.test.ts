import { describe, expect, it } from 'vitest';
import { heliocentricAU, sunDistanceAU } from './bodyPositions';

const ms = (iso: string) => Date.parse(iso);

describe('body positions', () => {
  it('puts Earth about 1 AU from the Sun', () => {
    expect(sunDistanceAU('Earth', ms('2026-06-01T00:00:00Z'))).toBeCloseTo(1, 1);
  });

  it('adds the Moon on top of Earth', () => {
    const t = ms('2026-06-01T00:00:00Z');
    const earth = heliocentricAU('Earth', t)!;
    const moon = heliocentricAU('Moon', t)!;
    expect(Math.hypot(moon[0] - earth[0], moon[1] - earth[1], moon[2] - earth[2])).toBeLessThan(
      0.003
    );
  });

  it("puts Halley's Comet near aphelion (about 35 AU) at the end of 2023", () => {
    expect(sunDistanceAU('Halley', ms('2023-12-09T00:00:00Z'))).toBeGreaterThan(34);
    expect(sunDistanceAU('Halley', ms('2023-12-09T00:00:00Z'))).toBeLessThan(36);
  });

  it("puts Halley's Comet inside Venus's orbit at its 1986 perihelion", () => {
    expect(sunDistanceAU('Halley', ms('1986-02-09T12:00:00Z'))).toBeLessThan(0.65);
  });

  it('returns null for unknown bodies', () => {
    expect(heliocentricAU('Vulcan')).toBeNull();
  });
});
