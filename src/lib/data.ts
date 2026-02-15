import type { SeasonData, Series } from "./types";
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

export function filterSeries(
  series: Series[],
  category: string,
  searchQuery: string
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
    return matchesCategory && matchesSearch;
  });
}
