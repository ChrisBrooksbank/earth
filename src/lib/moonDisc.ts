/** Drawing a Moon phase icon. */

/**
 * SVG path for the lit part of a Moon disc of radius `r` centred at (`r`, `r`),
 * as seen from the northern hemisphere: the lit limb is a semicircle and the
 * terminator is a half-ellipse whose width follows cos(phase angle).
 */
export function moonLitPath(phase: number, r: number): string {
  const angle = phase * 2 * Math.PI;
  const waxing = phase <= 0.5;
  const terminatorRx = Math.abs(Math.cos(angle)) * r;
  // Crescents bulge toward the lit limb, gibbous phases toward the dark side
  const crescent = Math.cos(angle) > 0;
  const limbSweep = waxing ? 1 : 0;
  const terminatorSweep = waxing === crescent ? 0 : 1;
  const top = `${r} 0`;
  const bottom = `${r} ${2 * r}`;
  return (
    `M ${top} A ${r} ${r} 0 0 ${limbSweep} ${bottom} ` +
    `A ${terminatorRx} ${r} 0 0 ${terminatorSweep} ${top} Z`
  );
}
