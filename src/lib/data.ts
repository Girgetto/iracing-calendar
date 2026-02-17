import type { SeasonData, Series, LicenseClass } from "./types";
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
    const matchesLicense =
      licenseClass === "All" ||
      (s.licenseRange != null && getLicenseClassFromRange(s.licenseRange) === licenseClass);
    return matchesCategory && matchesSearch && matchesLicense;
  });
}
