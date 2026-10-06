/**
 * Route three.js console output, dropping one warning we can't act on:
 * React Three Fiber (up to at least 9.8) still creates a THREE.Clock, which
 * three r183 deprecated. Everything else passes through unchanged.
 */
import { setConsoleFunction } from 'three';

// three prefixes its own messages, so this arrives as "THREE.THREE.Clock: …"
const IGNORED = ['THREE.Clock: This module has been deprecated'];

type Level = 'log' | 'warn' | 'error';

export function shouldForward(message: unknown): boolean {
  return !(typeof message === 'string' && IGNORED.some(text => message.includes(text)));
}

setConsoleFunction((level: Level, message: unknown, ...params: unknown[]) => {
  // This is the console sink for three.js, so writing to it is the point
  // eslint-disable-next-line no-console
  if (shouldForward(message)) console[level](message, ...params);
});
