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

// In iRacing, reaching 4.0 SR is the promotion threshold for the next class.
// So "Class D 4.0" means the pilot needs D with 4.0 SR (about to be C), making the
// effective series class one level higher. e.g. "Class D 4.0" → Class C, "Class B 4.0" → Class A.
const CLASS_PROMOTION: Record<string, LicenseClass> = {
  Rookie: "D",
  D: "C",
  C: "B",
  B: "A",
  A: "A",
};

export function getLicenseClassFromRange(licenseRange: string): LicenseClass | null {
  const match = licenseRange.match(/^(Rookie|Class\s+([A-Z]))\s+([\d.]+)/);
  if (!match) return null;
  const classLetter = match[2] ?? "Rookie"; // "D", "C", "B", "A", or undefined for Rookie
  const sr = parseFloat(match[3]);
  const rawClass = match[2] ? (match[2] as LicenseClass) : ("Rookie" as LicenseClass);
  // If SR is at the 4.0 promotion threshold, the effective class is one level up
  if (sr >= 4.0) return CLASS_PROMOTION[classLetter ?? "Rookie"] ?? rawClass;
  return rawClass;
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
