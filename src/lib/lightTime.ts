/** Seconds for light to travel 1 AU. */
export const AU_LIGHT_SECONDS = 499.004784;

/** Light travel time for a distance in AU, e.g. "8 min 20 s" or "4 h 10 min". */
export function formatLightTime(au: number): string {
  const total = Math.round(au * AU_LIGHT_SECONDS);
  if (total < 60) return `${total} s`;
  if (total < 3600) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return s === 0 ? `${m} min` : `${m} min ${s} s`;
  }
  const h = Math.floor(total / 3600);
  const m = Math.round((total % 3600) / 60);
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
