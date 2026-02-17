import type { SeasonData, Series, LicenseClass } from "./types";
import { LICENSE_LEVELS } from "./utils";
import seasonDataJson from "../../data/iracing-season-data.json";

let cachedData: SeasonData | null = null;

export function getSeasonData(): SeasonData {
  if (cachedData) return cachedData;

  const data = seasonDataJson as SeasonData;

  if (!data.metadata || !Array.isArray(data.series)) {
    throw new Error("Invalid season data structure");
  }

  cachedData = data;
  return data;
}

export function getAllSeries(): Series[] {
  return getSeasonData().series;
}

export function getSeriesById(id: string): Series | undefined {
  return getAllSeries().find((s) => s.id === id);
}

export function getCategories(): string[] {
  const cats = new Set(getAllSeries().map((s) => s.category));
  return ["All", ...Array.from(cats).sort()];
}

export function getLicenseClassFromRange(licenseRange: string): LicenseClass | null {
  if (licenseRange.startsWith("Rookie")) return "Rookie";
  if (licenseRange.startsWith("Class D")) return "D";
  if (licenseRange.startsWith("Class C")) return "C";
  if (licenseRange.startsWith("Class B")) return "B";
  if (licenseRange.startsWith("Class A")) return "A";
  return null;
}

export function filterSeries(
  series: Series[],
  category: string,
  searchQuery: string,
  licenseClass: LicenseClass = "All"
): Series[] {
  return series.filter((s) => {
    const matchesCategory = category === "All" || s.category === category;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(q) ||
      (s.car && s.car.toLowerCase().includes(q)) ||
      (s.region && s.region.toLowerCase().includes(q)) ||
      s.schedule.some((w) => w.track.toLowerCase().includes(q));
    const matchesLicense = (() => {
      if (licenseClass === "All") return true;
      if (!s.licenseRange) return false;
      const minClass = getLicenseClassFromRange(s.licenseRange);
      if (!minClass) return false;
      // Show series where the series minimum license <= the selected license level
      // e.g. a "C"-licensed pilot (level 3) can join Rookie (1), D (2), C (3) series
      return (LICENSE_LEVELS[minClass] ?? 0) <= (LICENSE_LEVELS[licenseClass] ?? 0);
    })();
    return matchesCategory && matchesSearch && matchesLicense;
  });
}
