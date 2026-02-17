"use client";

import type { Series, WeekSchedule } from "./types";
import { getFreeCarsFromList, getFreeTracksFromList } from "./freeContent";

export interface UserPreferences {
  ownedCars: string[];
  ownedTracks: string[];
  favoriteSeries: string[];
}

const STORAGE_KEY = "iracing-calendar-preferences";

/**
 * Load preferences from localStorage and ensure included content is pre-selected.
 * Content included with membership is always pre-selected and cannot be removed.
 */
export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return { ownedCars: [], ownedTracks: [], favoriteSeries: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const prefs = JSON.parse(stored);
      // Ensure favoriteSeries exists for backwards compatibility
      return {
        ownedCars: prefs.ownedCars || [],
        ownedTracks: prefs.ownedTracks || [],
        favoriteSeries: prefs.favoriteSeries || [],
      };
    }
  } catch (e) {
    console.error("Failed to load preferences:", e);
  }

  return { ownedCars: [], ownedTracks: [], favoriteSeries: [] };
}

/**
 * Ensure content included with membership is pre-selected in the given lists.
 * This should be called when displaying preferences to the user.
 */
export function ensureFreeContent(
  ownedCars: string[],
  ownedTracks: string[],
  availableCars: string[],
  availableTracks: string[],
  favoriteSeries?: string[]
): UserPreferences {
  const freeCars = getFreeCarsFromList(availableCars);
  const freeTracks = getFreeTracksFromList(availableTracks);

  return {
    ownedCars: Array.from(new Set([...ownedCars, ...freeCars])),
    ownedTracks: Array.from(new Set([...ownedTracks, ...freeTracks])),
    favoriteSeries: favoriteSeries || [],
  };
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error("Failed to save preferences:", e);
  }
}

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

/**
 * Check if the user owns the car required for a series.
 * Returns true if:
 * - Series has no car requirement
 * - Series car is "See race week..." (variable cars)
 * - User owns at least one of the cars listed
 */
export function ownsSeriesCar(
  series: Series,
  ownedCars: string[]
): boolean {
  if (!series.car || series.car === "See race week for cars in use that week.") {
    return true; // No specific car requirement or variable
  }

  // Check if user owns any of the cars (for multi-car series)
  const seriesCars = series.car.split(",").map((c) => c.trim());
  return seriesCars.some((car) => ownedCars.includes(car));
}

/**
 * Check if the user owns a specific track.
 */
export function ownsTrack(track: string, ownedTracks: string[]): boolean {
  return ownedTracks.includes(track);
}

/**
 * Calculate how many weeks of a series the user can join.
 * Returns an object with counts and percentages.
 */
export function getSeriesAvailability(
  series: Series,
  preferences: UserPreferences
): {
  totalWeeks: number;
  availableWeeks: number;
  percentage: number;
  hasRequiredCar: boolean;
} {
  const hasRequiredCar = ownsSeriesCar(series, preferences.ownedCars);
  const totalWeeks = series.schedule.length;

  if (!hasRequiredCar) {
    return { totalWeeks, availableWeeks: 0, percentage: 0, hasRequiredCar: false };
  }

  const availableWeeks = series.schedule.filter((week) =>
    ownsTrack(week.track, preferences.ownedTracks)
  ).length;

  const percentage = totalWeeks > 0 ? (availableWeeks / totalWeeks) * 100 : 0;

  return { totalWeeks, availableWeeks, percentage, hasRequiredCar: true };
}

/**
 * Check if a week is joinable by the user.
 */
export function isWeekJoinable(
  week: WeekSchedule,
  series: Series,
  preferences: UserPreferences
): boolean {
  const hasRequiredCar = ownsSeriesCar(series, preferences.ownedCars);
  const hasRequiredTrack = ownsTrack(week.track, preferences.ownedTracks);
  return hasRequiredCar && hasRequiredTrack;
}

/**
 * Check if a series is favorited.
 */
export function isFavoriteSeries(
  seriesId: string,
  preferences: UserPreferences
): boolean {
  return preferences.favoriteSeries.includes(seriesId);
}

/**
 * Toggle favorite status for a series.
 */
export function toggleFavoriteSeries(
  seriesId: string,
  preferences: UserPreferences
): UserPreferences {
  const isFavorited = preferences.favoriteSeries.includes(seriesId);
  return {
    ...preferences,
    favoriteSeries: isFavorited
      ? preferences.favoriteSeries.filter((id) => id !== seriesId)
      : [...preferences.favoriteSeries, seriesId],
  };
}
