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
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-4"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
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
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-gray-400">
          <div>
            <span className="text-white font-medium">{series.schedule.length}</span>{" "}
            weeks
          </div>
          {currentWeek && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>
                Week <span className="text-white font-medium">{currentWeek}</span>{" "}
                active
              </span>
            </div>
          )}
          {series.car && (
            <div>
              Car: <span className="text-white font-medium">{series.car}</span>
            </div>
          )}
          {series.drops && (
            <div>
              Drops: <span className="text-white font-medium">{series.drops}</span>
            </div>
          )}
        </div>

        {/* Extra metadata */}
        {(series.licenseRange || series.raceFrequency) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-400">
            {series.licenseRange && <span>{series.licenseRange}</span>}
            {series.raceFrequency && <span>{series.raceFrequency}</span>}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="mb-8">
        <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">
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
                    ? "bg-white/20"
                    : "bg-white/5"
                }`}
                title={`Week ${week.week}: ${week.track}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-gray-500">
          <span>Week 1</span>
          <span>Week {series.schedule.length}</span>
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">
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
              className={`rounded-lg border p-4 transition-all ${
                isCurrent
                  ? "border-red-500/30 bg-red-500/5 ring-1 ring-red-500/20"
                  : isPast
                  ? "border-white/5 bg-gray-900/20 opacity-60"
                  : joinable === true
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : joinable === false
                  ? "border-white/5 bg-gray-900/30 opacity-50"
                  : "border-white/5 bg-gray-900/30"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Week Number */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    isCurrent
                      ? "bg-red-500 text-white"
                      : isPast
                      ? "bg-white/5 text-gray-500"
                      : "bg-white/5 text-gray-300"
                  }`}
                >
                  {week.week}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      isCurrent ? "text-white" : isPast ? "text-gray-500" : "text-gray-200"
                    }`}
                  >
                    {week.track}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {formatDateShort(week.startDate)} — {formatDateShort(week.endDate)}
                    </span>
                    {(week.durationMins || week.durationLaps) && (
                      <span className="text-xs text-gray-500">
                        {week.durationMins
                          ? `${week.durationMins} min`
                          : `${week.durationLaps} laps`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                {isCurrent && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-medium text-red-400 border border-red-500/30 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                    LIVE
                  </span>
                )}
                {isPast && (
                  <span className="hidden sm:inline-flex text-[10px] text-gray-500 shrink-0">
                    Completed
                  </span>
                )}
                {!isCurrent && !isPast && joinable === true && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-medium text-emerald-400 border border-emerald-500/30 shrink-0">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Joinable
                  </span>
                )}
                {!isCurrent && !isPast && joinable === false && (
                  <span className="hidden sm:inline-flex text-[10px] text-gray-500 shrink-0">
                    Track required
                  </span>
                )}
              </div>

              {/* Conditions */}
              {week.conditions && (
                <p className="text-[11px] text-gray-500 mt-2 ml-14">
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
