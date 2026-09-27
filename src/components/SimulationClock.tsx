import { useFrame } from '@react-three/fiber';
import { advanceSimClock } from '../lib/simClock';
import { useAppStore } from '../store/appStore';

/** Runs before any scene update that reads the clock (Earth spin uses -1). */
const CLOCK_PRIORITY = -2;

/** Advances the shared simulation clock once per frame. */
export default function SimulationClock() {
  // Negative priorities run before default subscribers without taking over rendering
  useFrame((_state, delta) => {
    const { timeMultiplier, isPaused } = useAppStore.getState();
    if (!isPaused) advanceSimClock(delta, timeMultiplier);
  }, CLOCK_PRIORITY);
  return null;
}
