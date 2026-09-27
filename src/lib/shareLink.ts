/**
 * Shareable links: encode the current view, body, moment and pin in the URL,
 * e.g. ?view=body&body=Mars&t=2026-09-28T12:00:00.000Z or
 * ?view=earth&pin=48.857,2.352&t=...
 */
import { PLANETS } from '../data/planets';

export type ShareView = 'earth' | 'solar' | 'ems' | 'body';

export interface ShareState {
  view: ShareView;
  /** Body name when view is 'body' */
  body?: string;
  /** Simulated time in ms */
  ms?: number;
  pin?: { lat: number; lon: number };
}

const VIEWS: ShareView[] = ['earth', 'solar', 'ems', 'body'];
const BODY_NAMES = new Set(PLANETS.map(p => p.name));

export function buildShareUrl(state: ShareState, base: string): string {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set('view', state.view);
  if (state.view === 'body' && state.body) url.searchParams.set('body', state.body);
  if (state.ms !== undefined) url.searchParams.set('t', new Date(state.ms).toISOString());
  if (state.pin) {
    url.searchParams.set('pin', `${state.pin.lat.toFixed(3)},${state.pin.lon.toFixed(3)}`);
  }
  return url.toString();
}

/** Parse share parameters, ignoring anything malformed. Returns null if no view is given. */
export function parseShareParams(search: string): ShareState | null {
  const params = new URLSearchParams(search);
  const view = params.get('view') as ShareView | null;
  if (!view || !VIEWS.includes(view)) return null;

  const state: ShareState = { view };

  const body = params.get('body');
  if (view === 'body') {
    if (!body || !BODY_NAMES.has(body)) return { view: 'solar' };
    // Earth has its own detailed view
    if (body === 'Earth') state.view = 'earth';
    else state.body = body;
  }

  const t = params.get('t');
  if (t) {
    const ms = Date.parse(t);
    if (Number.isFinite(ms)) state.ms = ms;
  }

  const pin = params.get('pin')?.split(',').map(Number);
  if (
    pin?.length === 2 &&
    pin.every(Number.isFinite) &&
    Math.abs(pin[0]!) <= 90 &&
    Math.abs(pin[1]!) <= 180
  ) {
    state.pin = { lat: pin[0]!, lon: pin[1]! };
  }

  return state;
}
