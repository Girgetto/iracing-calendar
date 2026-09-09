// Pure derivations over the season data. Kept out of preferences.ts (which is
// "use client") so server components can call them too — that's what lets the
// series pages send the small car/track lists to the client instead of the
// whole 1 MB dataset.

export function getUniqueCars(series: Array<{ car?: string }>): string[] {
  const cars = new Set<string>();
  for (const s of series) {
    if (s.car && s.car !== "See race week for cars in use that week.") {
      // Split multi-car entries by comma
      s.car.split(",").forEach((car) => {
        const trimmed = car.trim();
        if (trimmed) cars.add(trimmed);
      });
    }
  }
  return Array.from(cars).sort();
}

export function getUniqueTracks(
  series: Array<{ schedule: Array<{ track: string }> }>
): string[] {
  const tracks = new Set<string>();
  for (const s of series) {
    s.schedule.forEach((w) => {
      if (w.track) tracks.add(w.track);
    });
  }
  return Array.from(tracks).sort();
}

