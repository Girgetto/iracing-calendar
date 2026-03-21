import "server-only";
import fs from "fs";
import path from "path";
import type { SeasonData, Series, SeasonSummary, SeasonsManifest } from "./types";
import { getSeasonData, getCategoriesFromSeries } from "./data";

const seasonCache = new Map<string, SeasonData>();

export function getAvailableSeasons(): SeasonSummary[] {
  const manifestPath = path.join(process.cwd(), "data", "seasons", "index.json");
  if (!fs.existsSync(manifestPath)) {
    // Fallback: only the current season is available
    const current = getSeasonData();
    return [{
      id: `${current.metadata.seasonYear}-s${current.metadata.seasonNumber}`,
      label: current.metadata.season,
      year: current.metadata.seasonYear,
      number: current.metadata.seasonNumber,
      current: true,
    }];
  }
  const manifest: SeasonsManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  return manifest.seasons;
}

export function getSeasonDataById(seasonId: string): SeasonData | null {
  if (seasonCache.has(seasonId)) return seasonCache.get(seasonId)!;

  // Check if this is the current season — use the already-imported JSON
  const current = getSeasonData();
  const currentId = `${current.metadata.seasonYear}-s${current.metadata.seasonNumber}`;
  if (seasonId === currentId) return current;

  // Load from the seasons archive
  const seasonPath = path.join(process.cwd(), "data", "seasons", `${seasonId}.json`);
  if (!fs.existsSync(seasonPath)) return null;

  const data: SeasonData = JSON.parse(fs.readFileSync(seasonPath, "utf-8"));
  if (!data.metadata || !Array.isArray(data.series)) return null;

  seasonCache.set(seasonId, data);
  return data;
}

export function getAllSeriesForSeason(seasonId: string): Series[] {
  const data = getSeasonDataById(seasonId);
  return data ? data.series : [];
}

export function getSeriesByIdForSeason(id: string, seasonId: string): Series | undefined {
  return getAllSeriesForSeason(seasonId).find((s) => s.id === id);
}

export function getCategoriesForSeason(seasonId: string): string[] {
  return getCategoriesFromSeries(getAllSeriesForSeason(seasonId));
}
