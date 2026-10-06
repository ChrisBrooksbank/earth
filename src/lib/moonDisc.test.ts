import { describe, expect, it } from 'vitest';
import { moonLitPath } from './moonDisc';

/** Parse "M x y A rx ry 0 0 sweep x y A rx ry 0 0 sweep x y Z" into its arcs. */
function arcs(path: string) {
  const nums = path.match(/-?\d+(\.\d+)?(e-?\d+)?/g)!.map(Number);
  return {
    limb: { sweep: nums[6] },
    terminator: { rx: nums[9], sweep: nums[13] },
  };
}

describe('moonLitPath', () => {
  it('has no lit area at new Moon (terminator matches the limb)', () => {
    const { limb, terminator } = arcs(moonLitPath(0, 10));
    expect(terminator.rx).toBeCloseTo(10);
    // Both arcs trace the same right-hand semicircle, enclosing nothing
    expect(limb.sweep).toBe(1);
    expect(terminator.sweep).toBe(0);
  });

  it('lights exactly the right half at first quarter', () => {
    expect(arcs(moonLitPath(0.25, 10)).terminator.rx).toBeCloseTo(0);
    expect(arcs(moonLitPath(0.25, 10)).limb.sweep).toBe(1);
  });

  it('lights the whole disc at full Moon', () => {
    const { limb, terminator } = arcs(moonLitPath(0.5, 10));
    expect(terminator.rx).toBeCloseTo(10);
    // Right-hand limb down, then back up around the left-hand side
    expect(limb.sweep).toBe(1);
    expect(terminator.sweep).toBe(1);
  });

  it('lights the left half at last quarter', () => {
    const { limb, terminator } = arcs(moonLitPath(0.75, 10));
    expect(terminator.rx).toBeCloseTo(0);
    expect(limb.sweep).toBe(0);
  });

  it('bulges the terminator toward the lit limb for a crescent', () => {
    // Waxing crescent: lit on the right, terminator curves through the right too
    expect(arcs(moonLitPath(0.1, 10)).terminator.sweep).toBe(0);
    // Waxing gibbous: terminator curves through the dark (left) side
    expect(arcs(moonLitPath(0.4, 10)).terminator.sweep).toBe(1);
  });
});
