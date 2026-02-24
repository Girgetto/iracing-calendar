"use client";

import { useEffect } from "react";
import type { CalendarSession } from "@/lib/calendarStorage";
import { utcTimeToLocal } from "@/lib/calendarUtils";
import { getLicenseBadgeColor, getCategoryDotColor } from "@/lib/utils";

interface SessionDetailPanelProps {
  isOpen: boolean;
  session: CalendarSession | null;
  showLocalTime: boolean;
  referenceDate: Date | null;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export default function SessionDetailPanel({
  isOpen,
  session,
  showLocalTime,
  referenceDate,
  onRemove,
  onClose,
}: SessionDetailPanelProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!isOpen || !session || !referenceDate) {
    return null;
  }

  const displayTime =
    showLocalTime
      ? utcTimeToLocal(session.startTimeUTC, referenceDate)
      : session.startTimeUTC;

  const DAY_NAMES = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const dayLabel = DAY_NAMES[session.dayOfWeek] ?? "";

  const handleRemove = () => {
    onRemove(session.id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-slate-900 light-theme:bg-white border-l border-white/10 light-theme:border-gray-200 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-4 border-b border-white/10 light-theme:border-gray-200"
          style={{ borderLeftWidth: 4, borderLeftColor: session.color }}
        >
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-white light-theme:text-gray-900 truncate">
              {session.seriesName}
            </h2>
            <p className="text-xs text-slate-400 light-theme:text-gray-500 mt-0.5">
              {dayLabel} · iRacing Week {session.weekNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white light-theme:hover:text-gray-900 hover:bg-white/10 light-theme:hover:bg-gray-100 transition-colors shrink-0"
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
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Category & License row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${getCategoryDotColor(session.category)}`}
              />
              <span className="text-xs text-slate-400 light-theme:text-gray-600">
                {session.category}
              </span>
            </div>
            {session.licenseClass && (
              <span
                className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${getLicenseBadgeColor(session.licenseClass)}`}
              >
                Class {session.licenseClass}
              </span>
            )}
          </div>

          {/* Details list */}
          <div className="space-y-3">
            {/* Track */}
            <div className="flex items-start gap-2.5">
              <svg
                className="h-4 w-4 text-slate-500 shrink-0 mt-0.5"
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
              <div>
                <p className="text-[10px] text-slate-500 light-theme:text-gray-400 uppercase tracking-wide">
                  Track
                </p>
                <p className="text-sm text-white light-theme:text-gray-900">
                  {session.trackName}
                </p>
              </div>
            </div>

            {/* Car */}
            {session.carNames && (
              <div className="flex items-start gap-2.5">
                <svg
                  className="h-4 w-4 text-slate-500 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                <div>
                  <p className="text-[10px] text-slate-500 light-theme:text-gray-400 uppercase tracking-wide">
                    Car
                  </p>
                  <p className="text-sm text-white light-theme:text-gray-900">
                    {session.carNames}
                  </p>
                </div>
              </div>
            )}

            {/* Time & Duration */}
            <div className="flex items-start gap-2.5">
              <svg
                className="h-4 w-4 text-slate-500 shrink-0 mt-0.5"
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
              <div>
                <p className="text-[10px] text-slate-500 light-theme:text-gray-400 uppercase tracking-wide">
                  Start time
                </p>
                <p className="text-sm text-white light-theme:text-gray-900">
                  {displayTime}{" "}
                  <span className="text-xs text-slate-400">
                    {showLocalTime ? "(local)" : "UTC"}
                  </span>
                </p>
                {showLocalTime && (
                  <p className="text-xs text-slate-500">
                    {session.startTimeUTC} UTC
                  </p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-2.5">
              <svg
                className="h-4 w-4 text-slate-500 shrink-0 mt-0.5"
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
              <div>
                <p className="text-[10px] text-slate-500 light-theme:text-gray-400 uppercase tracking-wide">
                  Duration
                </p>
                <p className="text-sm text-white light-theme:text-gray-900">
                  {session.durationMinutes} min
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 light-theme:border-gray-200">
          <button
            onClick={handleRemove}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-2 text-sm font-medium transition-colors"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Remove from calendar
          </button>
        </div>
      </div>
    </>
  );
}
