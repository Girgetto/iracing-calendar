"use client";

import Link from "next/link";
import type { Series, ViewMode } from "@/lib/types";
import { getCurrentWeek, getCategoryColor } from "@/lib/utils";

interface SeriesCardProps {
  series: Series;
  viewMode: ViewMode;
}

export default function SeriesCard({ series, viewMode }: SeriesCardProps) {
  const currentWeek = getCurrentWeek(series.schedule);
  const totalWeeks = series.schedule.length;

  if (viewMode === "list") {
    return (
      <Link
        href={`/series/${series.id}`}
        className="group flex items-center gap-4 rounded-lg border border-white/5 bg-gray-900/30 p-4 transition-all hover:bg-gray-900/60 hover:border-white/10"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-white truncate group-hover:text-red-400 transition-colors">
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
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {series.car && <span>{series.car}</span>}
            {series.car && <span className="text-gray-700">|</span>}
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
            const isPast = new Date(week.endDate) < new Date();
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
          className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0"
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
      className="group flex flex-col rounded-xl border border-white/5 bg-gray-900/30 p-5 transition-all hover:bg-gray-900/60 hover:border-white/10 hover:shadow-lg hover:shadow-black/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${getCategoryColor(
            series.category
          )}`}
        >
          {series.category}
        </span>
        {currentWeek && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400 border border-red-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            Week {currentWeek}
          </span>
        )}
      </div>

      {/* Name */}
      <h3 className="text-base font-semibold text-white mb-1 group-hover:text-red-400 transition-colors leading-tight">
        {series.name}
      </h3>

      {/* Car & Region */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        {series.car && <span>{series.car}</span>}
        {series.car && series.region && <span className="text-gray-700">·</span>}
        {series.region && <span>{series.region}</span>}
      </div>

      {/* Current Track */}
      {currentWeek && series.schedule[currentWeek - 1] && (
        <p className="text-xs text-gray-400 mb-4 line-clamp-1">
          {series.schedule[currentWeek - 1].track}
        </p>
      )}

      {/* Week progress */}
      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            Season Progress
          </span>
          <span className="text-[10px] text-gray-500">
            {totalWeeks} weeks
          </span>
        </div>
        <div className="flex gap-1">
          {series.schedule.map((week) => {
            const isCurrent = week.week === currentWeek;
            const isPast = new Date(week.endDate) < new Date();
            return (
              <div
                key={week.week}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  isCurrent
                    ? "bg-red-500"
                    : isPast
                    ? "bg-white/20"
                    : "bg-white/5"
                }`}
              />
            );
          })}
        </div>
      </div>
    </Link>
  );
}
