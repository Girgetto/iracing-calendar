"use client";

import type { Series, ViewMode } from "@/lib/types";
import type { UserPreferences } from "@/lib/preferences";
import SeriesCard from "./SeriesCard";

interface SeriesListProps {
  series: Series[];
  viewMode: ViewMode;
  preferences: UserPreferences;
  onPreferencesChange?: (prefs: UserPreferences) => void;
}

export default function SeriesList({ series, viewMode, preferences, onPreferencesChange }: SeriesListProps) {
  if (series.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg
          className="h-12 w-12 text-slate-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p className="text-sm text-slate-400 mb-1">No series found</p>
        <p className="text-xs text-slate-600">
          Try adjusting your search or filter
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {series.map((s) => (
          <SeriesCard key={s.id} series={s} viewMode="list" preferences={preferences} onPreferencesChange={onPreferencesChange} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {series.map((s) => (
        <SeriesCard key={s.id} series={s} viewMode="grid" preferences={preferences} onPreferencesChange={onPreferencesChange} />
      ))}
    </div>
  );
}
