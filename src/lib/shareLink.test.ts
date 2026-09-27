import { describe, expect, it } from 'vitest';
import { buildShareUrl, parseShareParams } from './shareLink';

const BASE = 'https://example.com/app/?old=1#frag';

describe('share links', () => {
  it('round-trips a body view at a moment in time', () => {
    const ms = Date.UTC(2026, 8, 28, 12, 30);
    const url = buildShareUrl({ view: 'body', body: 'Mars', ms }, BASE);
    expect(url).toContain('/app/?view=body&body=Mars&t=');
    expect(url).not.toContain('old=1');
    expect(parseShareParams(new URL(url).search)).toEqual({ view: 'body', body: 'Mars', ms });
  });

  it('round-trips an Earth pin', () => {
    const url = buildShareUrl({ view: 'earth', pin: { lat: 48.8566, lon: 2.3522 } }, BASE);
    expect(parseShareParams(new URL(url).search)).toEqual({
      view: 'earth',
      pin: { lat: 48.857, lon: 2.352 },
    });
  });

  it('returns null without a view', () => {
    expect(parseShareParams('')).toBeNull();
    expect(parseShareParams('?e2e=1')).toBeNull();
    expect(parseShareParams('?view=nonsense')).toBeNull();
  });

  it('falls back to the overview for unknown bodies and maps Earth to its globe', () => {
    expect(parseShareParams('?view=body&body=Vulcan')).toEqual({ view: 'solar' });
    expect(parseShareParams('?view=body&body=Earth')).toEqual({ view: 'earth' });
  });

  it('ignores malformed times and pins', () => {
    expect(parseShareParams('?view=earth&t=yesterday&pin=95,10')).toEqual({ view: 'earth' });
    expect(parseShareParams('?view=earth&pin=abc')).toEqual({ view: 'earth' });
  });
});
