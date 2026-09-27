import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { simClock } from '../lib/simClock';
import { parseShareParams } from '../lib/shareLink';
import { findCountry } from '../lib/countries';
import { flyToLonLat } from '../lib/flyTo';
import { earthDayViewPosition } from '../lib/earthOrientation';
import {
  EARTH_MOON_SUN_VIEW,
  EARTH_VIEW_DISTANCE,
  SOLAR_SYSTEM_OVERVIEW,
} from './CameraController';

/** Distance to view a pinned place from when opening a shared link. */
const PIN_VIEW_DISTANCE = 1.8;

/** Applies a shared link's view, time and pin once on startup. Renders nothing. */
export default function UrlState() {
  useEffect(() => {
    const shared = parseShareParams(window.location.search);
    if (!shared) return;
    const store = useAppStore.getState();

    if (shared.ms !== undefined) {
      simClock.ms = shared.ms;
      store.setIsPaused(true);
    }

    switch (shared.view) {
      case 'earth':
        store.enterPlanetView('Earth');
        if (shared.pin) {
          store.setPin(shared.pin);
          store.setSelectedCountry(findCountry(shared.pin.lon, shared.pin.lat));
          flyToLonLat(shared.pin.lon, shared.pin.lat, PIN_VIEW_DISTANCE);
        } else {
          store.setFlyTarget({
            position: earthDayViewPosition(EARTH_VIEW_DISTANCE),
            lookAt: [0, 0, 0],
          });
        }
        break;
      case 'ems':
        store.enterEarthMoonSunView();
        store.setFlyTarget(EARTH_MOON_SUN_VIEW);
        break;
      case 'solar':
      case 'body':
        store.exitToSolarSystem();
        store.setFlyTarget(SOLAR_SYSTEM_OVERVIEW);
        // SolarSystem flies on to the body once its position is known
        if (shared.body) store.setPendingFlyToBody(shared.body);
        break;
    }
  }, []);

  return null;
}
