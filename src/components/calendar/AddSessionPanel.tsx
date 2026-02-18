"use client";

import { useEffect } from "react";
import type { SlotSeriesResult } from "@/lib/calendarUtils";
import { utcTimeToLocal, getCategoryCardColor } from "@/lib/calendarUtils";
import { getLicenseBadgeColor } from "@/lib/utils";
import type { CalendarSession } from "@/lib/calendarStorage";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface AddSessionPanelProps {
  isOpen: boolean;
  calendarDate: Date | null; // the specific day clicked
  hour: number | null; // 0-23 UTC
  dayOfWeek: number | null; // 0=Mon … 6=Sun
  slotSeries: SlotSeriesResult[];
  showLocalTime: boolean;
  existingSessions: CalendarSession[];
  onAdd: (data: Omit<CalendarSession, "id">) => void;
  onClose: () => void;
}

export default function AddSessionPanel({
  isOpen,
  calendarDate,
  hour,
  dayOfWeek,
  slotSeries,
  showLocalTime,
  existingSessions,
  onAdd,
  onClose,
}: AddSessionPanelProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!isOpen || calendarDate === null || hour === null || dayOfWeek === null) {
    return null;
  }

  const hourLabel = `${String(hour).padStart(2, "0")}:00`;
  const dayLabel = DAY_NAMES[dayOfWeek];
  const dateLabel = calendarDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const isAlreadyAdded = (result: SlotSeriesResult) =>
    existingSessions.some(
      (s) =>
        s.seriesId === result.series.id &&
        s.weekNumber === result.iracingWeekNumber &&
        s.dayOfWeek === dayOfWeek &&
        s.startTimeUTC === result.sessionTime
    );

  const handleAdd = (result: SlotSeriesResult) => {
    const color = getCategoryCardColor(result.series.category);
    const licenseClass =
      result.series.licenseRange?.match(
        /Rookie|Class\s+([A-Z])/
      )?.[1] ?? result.series.licenseRange ?? "";

    const data: Omit<CalendarSession, "id"> = {
      seriesId: result.series.id,
      seriesSlug: result.series.id,
      seriesName: result.series.name,
      trackName: result.trackName,
      carNames: result.series.car ?? "",
      licenseClass,
      category: result.series.category,
      weekNumber: result.iracingWeekNumber,
      dayOfWeek: dayOfWeek!,
      startTimeUTC: result.sessionTime,
      durationMinutes: result.durationMinutes,
      color,
    };

    onAdd(data);
  };

  const getDisplayTime = (utcTime: string) =>
    showLocalTime && calendarDate
      ? utcTimeToLocal(utcTime, calendarDate)
      : utcTime;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-gray-950 light-theme:bg-white border-l border-white/10 light-theme:border-gray-200 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 light-theme:border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-white light-theme:text-gray-900">
              Add a Session
            </h2>
            <p className="text-xs text-gray-400 light-theme:text-gray-500 mt-0.5">
              {dateLabel} · {hourLabel} UTC
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-white light-theme:hover:text-gray-900 hover:bg-white/10 light-theme:hover:bg-gray-100 transition-colors"
            aria-label="Close panel"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {slotSeries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <div className="text-3xl mb-2">🏁</div>
              <p className="text-sm text-gray-400 light-theme:text-gray-500">
                No series have a race session starting in this hour slot.
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {slotSeries.map((result, idx) => {
                const added = isAlreadyAdded(result);
                const color = getCategoryCardColor(result.series.category);
                return (
                  <li key={`${result.series.id}-${result.sessionTime}-${idx}`}>
                    <button
                      onClick={() => !added && handleAdd(result)}
                      disabled={added}
                      className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                        added
                          ? "opacity-50 cursor-not-allowed border-white/5 light-theme:border-gray-100 bg-white/5 light-theme:bg-gray-50"
                          : "border-white/10 light-theme:border-gray-200 bg-gray-900/60 light-theme:bg-gray-50 hover:bg-gray-800 light-theme:hover:bg-gray-100 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {/* Category color dot */}
                        <div
                          className="mt-0.5 h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-white light-theme:text-gray-900 truncate">
                              {result.series.name}
                            </span>
                            {added && (
                              <span className="text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded px-1 py-0.5">
                                ADDED
                              </span>
                            )}
                          </div>

                          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                            {/* License badge */}
                            {result.series.licenseRange && (
                              <span
                                className={`inline-flex items-center rounded border px-1 py-0.5 text-[9px] font-semibold ${getLicenseBadgeColor(
                                  result.series.licenseRange
                                    .match(/Rookie|Class\s+([A-Z])/)?.[1] ??
                                    ""
                                )}`}
                              >
                                {result.series.licenseRange.match(
                                  /Rookie|Class\s+([A-Z])/
                                )?.[0] ?? ""}
                              </span>
                            )}
                            {/* Category */}
                            <span className="text-[10px] text-gray-400 light-theme:text-gray-500">
                              {result.series.category}
                            </span>
                          </div>

                          <div className="mt-1 space-y-0.5">
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 light-theme:text-gray-500">
                              <svg
                                className="h-2.5 w-2.5 shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="truncate">{result.trackName}</span>
                            </div>

                            {result.series.car && (
                              <div className="flex items-center gap-1 text-[10px] text-gray-400 light-theme:text-gray-500">
                                <svg
                                  className="h-2.5 w-2.5 shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                                <span className="truncate">{result.series.car}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1 text-[10px] font-medium text-gray-300 light-theme:text-gray-700">
                              <svg
                                className="h-2.5 w-2.5 shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>
                                {getDisplayTime(result.sessionTime)} ·{" "}
                                {result.durationMinutes} min
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 light-theme:border-gray-200">
          <p className="text-[10px] text-gray-500 light-theme:text-gray-400">
            Only series with a race starting in this time slot are shown.
          </p>
        </div>
      </div>
    </>
  );
}
