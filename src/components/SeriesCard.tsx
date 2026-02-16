"use client";

import Link from "next/link";
import { useState } from "react";
import type { Series, ViewMode } from "@/lib/types";
import type { UserPreferences } from "@/lib/preferences";
import { getCurrentWeek, getCategoryColor } from "@/lib/utils";
import { getSeriesAvailability, isFavoriteSeries, toggleFavoriteSeries, ownsSeriesCar, ownsTrack } from "@/lib/preferences";

interface SeriesCardProps {
  series: Series;
  viewMode: ViewMode;
  preferences: UserPreferences;
  onPreferencesChange?: (prefs: UserPreferences) => void;
}

export default function SeriesCard({ series, viewMode, preferences, onPreferencesChange }: SeriesCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const isFavorited = isFavoriteSeries(series.id, preferences);
  const currentWeek = getCurrentWeek(series.schedule);
  const totalWeeks = series.schedule.length;
  const availability = getSeriesAvailability(series, preferences);
  const hasPreferences = preferences.ownedCars.length > 0 || preferences.ownedTracks.length > 0;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = toggleFavoriteSeries(series.id, preferences);
    onPreferencesChange?.(updated);
  };

  if (viewMode === "list") {
    return (
      <Link
        href={`/series/${series.id}`}
        className="group flex items-center gap-4 rounded-lg border border-white/5 light-theme:border-gray-200 bg-gray-900/30 light-theme:bg-gray-50 p-4 transition-all duration-300 hover:bg-gray-900/60 light-theme:hover:bg-gray-100 hover:border-white/10 light-theme:hover:border-gray-300"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-white light-theme:text-gray-900 truncate group-hover:text-red-400 light-theme:group-hover:text-red-600 transition-colors duration-300">
              {series.name}
            </h3>
            <span
              className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${getCategoryColor(
                series.category
              )}`}
            >
              {series.category}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 light-theme:text-gray-600 transition-colors duration-300">
            {series.car && <span>{series.car}</span>}
            {series.car && <span className="text-gray-700 light-theme:text-gray-400">|</span>}
            <span>
              {currentWeek
                ? `Week ${currentWeek} — ${series.schedule[currentWeek - 1]?.track}`
                : `${totalWeeks} weeks`}
            </span>
          </div>
        </div>

        {/* Week progress dots */}
        <div className="hidden sm:flex items-center gap-0.5 shrink-0">
          {series.schedule.map((week) => {
            const isCurrent = week.week === currentWeek;
            const endDate = new Date(week.endDate);
            endDate.setDate(endDate.getDate() + 1);
            const isPast = endDate <= new Date();
            return (
              <div
                key={week.week}
                className={`h-2 w-2 rounded-full transition-colors ${
                  isCurrent
                    ? "bg-red-500 ring-2 ring-red-500/30"
                    : isPast
                    ? "bg-white/20"
                    : "bg-white/8"
                }`}
              />
            );
          })}
        </div>

        <svg
          className="h-4 w-4 text-gray-600 light-theme:text-gray-400 group-hover:text-gray-400 light-theme:group-hover:text-gray-600 transition-colors duration-300 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    );
  }

  return (
    <Link
      href={`/series/${series.id}`}
      className={`group flex flex-col rounded-xl border p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 light-theme:hover:shadow-gray-300/50 ${
        hasPreferences && availability.hasRequiredCar && availability.percentage === 100
          ? "border-emerald-500/30 light-theme:border-emerald-400 bg-emerald-500/5 light-theme:bg-emerald-50 hover:bg-emerald-500/10 light-theme:hover:bg-emerald-100 hover:border-emerald-500/40 light-theme:hover:border-emerald-500 ring-1 ring-emerald-500/20 light-theme:ring-emerald-400"
          : hasPreferences && availability.hasRequiredCar && availability.percentage >= 50
          ? "border-emerald-500/15 light-theme:border-emerald-300 bg-gray-900/30 light-theme:bg-gray-50 hover:bg-gray-900/60 light-theme:hover:bg-gray-100 hover:border-emerald-500/25 light-theme:hover:border-emerald-400"
          : "border-white/5 light-theme:border-gray-200 bg-gray-900/30 light-theme:bg-gray-50 hover:bg-gray-900/60 light-theme:hover:bg-gray-100 hover:border-white/10 light-theme:hover:border-gray-300"
      }`}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-2 mb-3"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${getCategoryColor(
              series.category
            )}`}
          >
            {series.category}
          </span>
          {hasPreferences && availability.hasRequiredCar && availability.percentage === 100 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/30">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {currentWeek && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400 border border-red-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              Week {currentWeek}
            </span>
          )}
          <button
            onClick={handleToggleFavorite}
            className={`p-1.5 rounded-lg transition-all duration-300 shrink-0 ${
              isFavorited
                ? "bg-red-500/20 light-theme:bg-red-100 text-red-400 light-theme:text-red-600 border border-red-500/30 light-theme:border-red-300"
                : "bg-gray-950/40 light-theme:bg-gray-100 text-gray-600 light-theme:text-gray-500 border border-white/5 light-theme:border-gray-300 hover:text-gray-400 light-theme:hover:text-gray-700 hover:bg-gray-900/50 light-theme:hover:bg-gray-200"
            }`}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <svg
              className="h-4 w-4"
              fill={isFavorited ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Name */}
      <h3 className="text-base font-semibold text-white light-theme:text-gray-900 mb-1 group-hover:text-red-400 light-theme:group-hover:text-red-600 transition-colors duration-300 leading-tight">
        {series.name}
      </h3>

      {/* Car & Region */}
      <div className="flex items-center gap-2 text-xs text-gray-500 light-theme:text-gray-600 mb-3 transition-colors duration-300">
        {series.car && <span>{series.car}</span>}
        {series.car && series.region && <span className="text-gray-700 light-theme:text-gray-400">·</span>}
        {series.region && <span>{series.region}</span>}
      </div>

      {/* Current Track */}
      {currentWeek && series.schedule[currentWeek - 1] && (
        <p className="text-xs text-gray-400 light-theme:text-gray-600 mb-4 line-clamp-1 transition-colors duration-300">
          {series.schedule[currentWeek - 1].track}
        </p>
      )}

      {/* Week progress */}
      <div className="mt-auto pt-4 border-t border-white/5 light-theme:border-gray-200 transition-colors duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-500 light-theme:text-gray-600 uppercase tracking-wider transition-colors duration-300">
            Season Progress
          </span>
          <span className="text-[10px] text-gray-500 light-theme:text-gray-600 transition-colors duration-300">
            {totalWeeks} weeks
          </span>
        </div>
        <div className="flex gap-1">
          {series.schedule.map((week) => {
            const isCurrent = week.week === currentWeek;
            const endDate = new Date(week.endDate);
            endDate.setDate(endDate.getDate() + 1);
            const isPast = endDate <= new Date();
            const hasRequiredCar = ownsSeriesCar(series, preferences.ownedCars);
            const hasRequiredTrack = ownsTrack(week.track, preferences.ownedTracks);
            const isEligible = hasRequiredCar && hasRequiredTrack && hasPreferences;

            return (
              <div
                key={week.week}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  isCurrent
                    ? "bg-red-500"
                    : isPast
                    ? "bg-white/20"
                    : isEligible
                    ? "bg-emerald-500/80"
                    : "bg-white/5"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Availability Indicator */}
      {hasPreferences && (
        <div className="mt-3 pt-3 border-t border-white/5 light-theme:border-gray-200 transition-colors duration-300">
          {!availability.hasRequiredCar ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-500/80">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Car required</span>
            </div>
          ) : availability.percentage === 100 ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>All tracks owned ({availability.availableWeeks}/{totalWeeks} weeks)</span>
            </div>
          ) : availability.percentage > 0 ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 light-theme:text-gray-600 transition-colors duration-300">
                  Eligible for {availability.availableWeeks} of {totalWeeks} weeks
                </span>
                <span className="text-emerald-400 light-theme:text-emerald-600 font-medium transition-colors duration-300">
                  {Math.round(availability.percentage)}%
                </span>
              </div>
              <p className="text-[11px] text-gray-600 light-theme:text-gray-500 transition-colors duration-300">
                Missing tracks for {totalWeeks - availability.availableWeeks} weeks
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 light-theme:text-gray-500 transition-colors duration-300">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span>No owned tracks</span>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
