"use client";

import Link from "next/link";
import type { Series } from "@/lib/types";
import type { UserPreferences } from "@/lib/preferences";
import {
  getCurrentWeek,
  getWeekStatus,
  formatDateShort,
  getCategoryColor,
} from "@/lib/utils";
import { isWeekJoinable, getSeriesAvailability } from "@/lib/preferences";

interface SeriesDetailProps {
  series: Series;
  preferences: UserPreferences;
}

export default function SeriesDetail({ series, preferences }: SeriesDetailProps) {
  const currentWeek = getCurrentWeek(series.schedule);
  const availability = getSeriesAvailability(series, preferences);
  const hasPreferences = preferences.ownedCars.length > 0 || preferences.ownedTracks.length > 0;

  return (
    <div>
      {/* Back + Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900 transition-colors duration-300 mb-4"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to all series
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white light-theme:text-gray-900 transition-colors duration-300">
            {series.name}
          </h1>
          <span
            className={`inline-flex items-center self-start rounded-full border px-3 py-1 text-xs font-medium ${getCategoryColor(
              series.category
            )}`}
          >
            {series.category}
          </span>
        </div>

        {/* Series Info */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-gray-400 light-theme:text-gray-600 transition-colors duration-300">
          <div>
            <span className="text-white light-theme:text-gray-900 font-medium transition-colors duration-300">{series.schedule.length}</span>{" "}
            weeks
          </div>
          {currentWeek && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>
                Week <span className="text-white light-theme:text-gray-900 font-medium transition-colors duration-300">{currentWeek}</span>{" "}
                active
              </span>
            </div>
          )}
          {series.car && (
            <div>
              Car: <span className="text-white light-theme:text-gray-900 font-medium transition-colors duration-300">{series.car}</span>
            </div>
          )}
          {series.drops && (
            <div>
              Drops: <span className="text-white light-theme:text-gray-900 font-medium transition-colors duration-300">{series.drops}</span>
            </div>
          )}
        </div>

        {/* Extra metadata */}
        {(series.licenseRange || series.raceFrequency) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500 light-theme:text-gray-600 transition-colors duration-300">
            {series.licenseRange && <span>{series.licenseRange}</span>}
            {series.raceFrequency && <span>{series.raceFrequency}</span>}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="mb-8">
        <h2 className="text-xs font-medium uppercase tracking-wider text-gray-500 light-theme:text-gray-600 mb-4 transition-colors duration-300">
          Season Timeline
        </h2>
        <div className="flex gap-1">
          {series.schedule.map((week) => {
            const status = getWeekStatus(week);
            return (
              <div
                key={week.week}
                className={`h-2 flex-1 rounded-full ${
                  status === "current"
                    ? "bg-red-500"
                    : status === "past"
                    ? "bg-white/20 light-theme:bg-blue-400"
                    : "bg-white/5 light-theme:bg-gray-300"
                }`}
                title={`Week ${week.week}: ${week.track}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-gray-600 light-theme:text-gray-500 transition-colors duration-300">
          <span>Week 1</span>
          <span>Week {series.schedule.length}</span>
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-gray-500 light-theme:text-gray-600 mb-4 transition-colors duration-300">
          Full Schedule
        </h2>

        {series.schedule.map((week) => {
          const status = getWeekStatus(week);
          const isCurrent = status === "current";
          const isPast = status === "past";
          const joinable = hasPreferences ? isWeekJoinable(week, series, preferences) : null;

          return (
            <div
              key={week.week}
              className={`rounded-lg border p-4 transition-all duration-300 ${
                isCurrent
                  ? "border-red-500/30 light-theme:border-red-300 bg-red-500/5 light-theme:bg-red-50 ring-1 ring-red-500/20 light-theme:ring-red-300"
                  : isPast
                  ? "border-white/5 light-theme:border-blue-200 bg-gray-900/20 light-theme:bg-blue-50 opacity-60 light-theme:opacity-80"
                  : joinable === true
                  ? "border-emerald-500/20 light-theme:border-emerald-300 bg-emerald-500/5 light-theme:bg-emerald-50"
                  : joinable === false
                  ? "border-white/5 light-theme:border-gray-200 bg-gray-900/30 light-theme:bg-gray-100 opacity-50"
                  : "border-white/5 light-theme:border-gray-200 bg-gray-900/30 light-theme:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Week Number */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors duration-300 ${
                    isCurrent
                      ? "bg-red-500 light-theme:bg-red-600 text-white"
                      : isPast
                      ? "bg-white/5 light-theme:bg-gray-200 text-gray-500 light-theme:text-gray-600"
                      : "bg-white/5 light-theme:bg-gray-200 text-gray-300 light-theme:text-gray-700"
                  }`}
                >
                  {week.week}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate transition-colors duration-300 ${
                      isCurrent ? "text-white light-theme:text-gray-900" : isPast ? "text-gray-500 light-theme:text-gray-600" : "text-gray-200 light-theme:text-gray-800"
                    }`}
                  >
                    {week.track}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-500 light-theme:text-gray-600 transition-colors duration-300">
                      {formatDateShort(week.startDate)} — {formatDateShort(week.endDate)}
                    </span>
                    {(week.durationMins || week.durationLaps) && (
                      <span className="text-xs text-gray-600 light-theme:text-gray-500 transition-colors duration-300">
                        {week.durationMins
                          ? `${week.durationMins} min`
                          : `${week.durationLaps} laps`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 light-theme:bg-red-100 px-2.5 py-1 text-[10px] font-medium text-red-400 light-theme:text-red-700 border border-red-500/30 light-theme:border-red-300 transition-colors duration-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 light-theme:bg-red-600 animate-pulse transition-colors duration-300" />
                      LIVE
                    </span>
                  )}
                  {isPast && (
                    <span className="inline-flex text-[10px] text-gray-600 light-theme:text-gray-500 transition-colors duration-300">
                      Completed
                    </span>
                  )}
                  {!isPast && joinable === true && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 light-theme:bg-emerald-100 px-2.5 py-1 text-[10px] font-medium text-emerald-400 light-theme:text-emerald-700 border border-emerald-500/30 light-theme:border-emerald-300 transition-colors duration-300">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Joinable
                    </span>
                  )}
                  {!isCurrent && !isPast && joinable === false && (
                    <span className="inline-flex text-[10px] text-gray-600 light-theme:text-gray-500 transition-colors duration-300">
                      Track required
                    </span>
                  )}
                </div>
              </div>

              {/* Conditions */}
              {week.conditions && (
                <p className="text-[11px] text-gray-600 light-theme:text-gray-500 mt-2 ml-14 transition-colors duration-300">
                  {week.conditions}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
