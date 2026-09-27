/** Mapping between the 0–100 speed slider and the simulation time multiplier. */

// Slider uses log scale: 0–100 maps to 10^0–10^7.5 simulated seconds per second
// (real time up to about one year per second)
const MAX_LOG_RATE = 7.5;

export function sliderToMultiplier(value: number): number {
  const raw = Math.pow(10, (value / 100) * MAX_LOG_RATE);
  // Round to two significant figures so the label reads cleanly
  return Math.max(1, Number(raw.toPrecision(2)));
}

export function multiplierToSlider(multiplier: number): number {
  return (Math.log10(multiplier) / MAX_LOG_RATE) * 100;
}
