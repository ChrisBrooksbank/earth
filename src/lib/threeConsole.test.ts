import { describe, expect, it } from 'vitest';
import { shouldForward } from './threeConsole';

describe('shouldForward', () => {
  it("drops R3F's THREE.Clock deprecation", () => {
    expect(
      shouldForward(
        'THREE.THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.'
      )
    ).toBe(false);
  });

  it('keeps every other three.js message', () => {
    expect(shouldForward('THREE.WebGLRenderer: Context Lost.')).toBe(true);
    expect(shouldForward(new Error('boom'))).toBe(true);
  });
});
