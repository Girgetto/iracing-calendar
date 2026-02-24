"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { Series } from "@/lib/types";
import type { CalendarSession } from "@/lib/calendarStorage";
import type { SlotSeriesResult } from "@/lib/calendarUtils";
import {
  getWeekDates,
  getSeriesForSlot,
  formatUTCTime,
  getLocalTimezoneLabel,
  utcTimeToLocal,
  getIRacingWeekForDate,
} from "@/lib/calendarUtils";
import {
  loadCalendarSessions,
  addCalendarSession,
  removeCalendarSession,
  findOverlappingSessions,
} from "@/lib/calendarStorage";
import SessionCard from "./SessionCard";
import AddSessionPanel from "./AddSessionPanel";
import SessionDetailPanel from "./SessionDetailPanel";

const HOUR_PX = 60; // pixels per hour row
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23
const DAY_NAMES_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface WeeklyCalendarProps {
  allSeries: Series[];
  favoriteSeries: string[]; // series IDs
}

export default function WeeklyCalendar({
  allSeries,
  favoriteSeries,
}: WeeklyCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const now = new Date();
    // Start from Monday of the current week (UTC)
    const utcDay = now.getUTCDay();
    const daysFromMon = utcDay === 0 ? 6 : utcDay - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - daysFromMon);
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
  });

  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [nowUTC, setNowUTC] = useState<Date>(new Date());
  const [showLocalTime, setShowLocalTime] = useState(false);
  const [mobileDay, setMobileDay] = useState<number>(() => {
    // Default to today's day of week (Mon=0)
    const utcDay = new Date().getUTCDay();
    return utcDay === 0 ? 6 : utcDay - 1;
  });

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelDate, setPanelDate] = useState<Date | null>(null);
  const [panelHour, setPanelHour] = useState<number | null>(null);
  const [panelDayOfWeek, setPanelDayOfWeek] = useState<number | null>(null);
  const [panelSlotSeries, setPanelSlotSeries] = useState<SlotSeriesResult[]>([]);
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);

  // Session detail panel state
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [detailSession, setDetailSession] = useState<CalendarSession | null>(null);
  const [detailReferenceDate, setDetailReferenceDate] = useState<Date | null>(null);

  // Scroll ref to auto-scroll to current hour on mount
  const bodyRef = useRef<HTMLDivElement>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    setSessions(loadCalendarSessions());
  }, []);

  // Live UTC clock
  useEffect(() => {
    const tick = () => setNowUTC(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  // Scroll so that the current hour is near the top (visible) on mount
  useEffect(() => {
    if (!bodyRef.current) return;
    const currentHour = nowUTC.getUTCHours();
    const scrollTarget = Math.max(0, (currentHour - 2) * HOUR_PX);
    bodyRef.current.scrollTop = scrollTarget;
  }, []); // only on mount

  // Derived: 7 dates for current week
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const localTzLabel = useMemo(() => getLocalTimezoneLabel(), []);

  // Check if the displayed week contains today (UTC)
  const todayUTC = useMemo(() => {
    const d = new Date(nowUTC);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }, [nowUTC]);

  // iRacing week label for the displayed period
  const iracingWeekLabels = useMemo(() => {
    return weekDates.map((d) => getIRacingWeekForDate(d, allSeries));
  }, [weekDates, allSeries]);

  // Human-readable week range label (e.g. "Feb 17 – Feb 23, 2026")
  const weekRangeLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
    const startStr = start.toLocaleDateString("en-US", opts);
    const endStr = end.toLocaleDateString("en-US", {
      ...opts,
      year: "numeric",
    });
    return `${startStr} – ${endStr}`;
  }, [weekDates]);

  const navigateWeek = (dir: -1 | 1) => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setUTCDate(d.getUTCDate() + dir * 7);
      return d;
    });
  };

  const handleSlotClick = useCallback(
    (dayIndex: number, hour: number) => {
      const calDate = weekDates[dayIndex];
      const slotSeries = getSeriesForSlot(allSeries, calDate, hour);
      setPanelDate(calDate);
      setPanelHour(hour);
      setPanelDayOfWeek(dayIndex);
      setPanelSlotSeries(slotSeries);
      setPanelOpen(true);
      setOverlapWarning(null);
    },
    [weekDates, allSeries]
  );

  const handleAddSession = useCallback(
    (data: Omit<CalendarSession, "id">) => {
      // Check for overlaps
      const overlaps = findOverlappingSessions(sessions, data);
      if (overlaps.length > 0) {
        setOverlapWarning(
          `Warning: this overlaps with "${overlaps[0].seriesName}". Session added anyway.`
        );
      } else {
        setOverlapWarning(null);
      }

      const updated = addCalendarSession(sessions, data);
      setSessions(updated);
    },
    [sessions]
  );

  const handleRemoveSession = useCallback(
    (id: string) => {
      const updated = removeCalendarSession(sessions, id);
      setSessions(updated);
    },
    [sessions]
  );

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setOverlapWarning(null);
  }, []);

  const handleCardClick = useCallback(
    (session: CalendarSession, dayIndex: number) => {
      setDetailSession(session);
      setDetailReferenceDate(weekDates[dayIndex]);
      setDetailPanelOpen(true);
    },
    [weekDates]
  );

  const closeDetailPanel = useCallback(() => {
    setDetailPanelOpen(false);
    setDetailSession(null);
  }, []);

  // Get sessions for a specific day column
  const getSessionsForDay = useCallback(
    (dayIndex: number): CalendarSession[] => {
      const calDate = weekDates[dayIndex];
      const iracingWeek = getIRacingWeekForDate(calDate, allSeries);
      if (iracingWeek === null) return [];
      return sessions.filter(
        (s) => s.weekNumber === iracingWeek && s.dayOfWeek === dayIndex
      );
    },
    [sessions, weekDates, allSeries]
  );

  // Compute session top and height in pixels
  const sessionGeometry = (s: CalendarSession) => {
    const [h, m] = s.startTimeUTC.split(":").map(Number);
    const topPx = h * HOUR_PX + (m / 60) * HOUR_PX;
    const heightPx = (s.durationMinutes / 60) * HOUR_PX;
    return { topPx, heightPx };
  };

  // Current UTC hour highlight
  const currentHourUTC = nowUTC.getUTCHours();
  const currentMinuteUTC = nowUTC.getUTCMinutes();
  const nowLinePx = currentHourUTC * HOUR_PX + (currentMinuteUTC / 60) * HOUR_PX;

  const isToday = (dayIndex: number): boolean => {
    const d = weekDates[dayIndex];
    return d.getUTCFullYear() === todayUTC.getUTCFullYear() &&
      d.getUTCMonth() === todayUTC.getUTCMonth() &&
      d.getUTCDate() === todayUTC.getUTCDate();
  };

  const formatDayHeader = (dayIndex: number): { short: string; date: string } => {
    const d = weekDates[dayIndex];
    const dateStr = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    return { short: DAY_NAMES_SHORT[dayIndex], date: dateStr };
  };

  const formatHourLabel = (hour: number): string => {
    if (showLocalTime) {
      // Convert "HH:00" UTC to local time display
      return utcTimeToLocal(
        `${String(hour).padStart(2, "0")}:00`,
        weekDates[0]
      );
    }
    return `${String(hour).padStart(2, "0")}:00`;
  };

  // -------- Render --------

  const renderDayColumn = (dayIndex: number, isVisible: boolean) => {
    const daySessions = getSessionsForDay(dayIndex);
    const today = isToday(dayIndex);
    const calDate = weekDates[dayIndex];

    return (
      <div
        key={dayIndex}
        className={`relative border-l border-white/5 light-theme:border-gray-200 flex-1 min-w-0 ${
          !isVisible ? "hidden sm:block" : ""
        }`}
        style={{ height: 24 * HOUR_PX }}
      >
        {/* "Now" line for today */}
        {today && (
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: nowLinePx }}
          >
            <div className="relative">
              <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500" />
              <div className="h-0.5 bg-red-500 opacity-80" />
            </div>
          </div>
        )}

        {/* Hour cells (clickable) */}
        {HOURS.map((hour) => {
          const isCurrentHour = today && hour === currentHourUTC;
          return (
            <div
              key={hour}
              onClick={() => handleSlotClick(dayIndex, hour)}
              className={`absolute w-full border-b border-white/5 light-theme:border-gray-100 cursor-pointer transition-colors duration-100 ${
                isCurrentHour
                  ? "border-l-2 border-l-red-500 bg-red-500/5"
                  : "hover:bg-white/[0.03] light-theme:hover:bg-gray-50"
              }`}
              style={{
                top: hour * HOUR_PX,
                height: HOUR_PX,
              }}
              title={`${String(hour).padStart(2, "0")}:00 UTC — click to add session`}
            />
          );
        })}

        {/* Session cards */}
        {daySessions.map((session) => {
          const { topPx, heightPx } = sessionGeometry(session);
          return (
            <SessionCard
              key={session.id}
              session={session}
              topPx={topPx}
              heightPx={heightPx}
              showLocalTime={showLocalTime}
              referenceDate={calDate}
              isFavorited={favoriteSeries.includes(session.seriesId)}
              onRemove={handleRemoveSession}
              onClick={(s) => handleCardClick(s, dayIndex)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* === Toolbar === */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 light-theme:bg-gray-100 light-theme:hover:bg-gray-200 border border-white/10 light-theme:border-gray-300 text-sm text-slate-300 hover:text-white light-theme:text-gray-700 light-theme:hover:text-gray-900 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Prev week</span>
          </button>

          <div className="text-center">
            <p className="text-sm font-medium text-white light-theme:text-gray-900">
              {weekRangeLabel}
            </p>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              {/* Show unique iRacing week numbers for this calendar week */}
              {[...new Set(iracingWeekLabels.filter(Boolean))].map((wn) => (
                <span
                  key={wn}
                  className="text-xs text-slate-400 light-theme:text-gray-500"
                >
                  iRacing Week {wn}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigateWeek(1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 light-theme:bg-gray-100 light-theme:hover:bg-gray-200 border border-white/10 light-theme:border-gray-300 text-sm text-slate-300 hover:text-white light-theme:text-gray-700 light-theme:hover:text-gray-900 transition-colors"
          >
            <span className="hidden sm:inline">Next week</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* UTC Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 light-theme:bg-gray-100 border border-white/10 light-theme:border-gray-200 text-sm">
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono text-xs text-white light-theme:text-gray-900">
              {formatUTCTime(nowUTC)} UTC
            </span>
          </div>

          {/* Local time toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showLocalTime}
                onChange={(e) => setShowLocalTime(e.target.checked)}
              />
              <div className="w-8 h-4 bg-slate-600 light-theme:bg-gray-300 peer-checked:bg-red-600 rounded-full transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-xs text-slate-400 light-theme:text-gray-600 whitespace-nowrap">
              {showLocalTime ? localTzLabel : "UTC"}
            </span>
          </label>
        </div>
      </div>

      {/* Overlap warning */}
      {overlapWarning && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
          <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{overlapWarning}</span>
          <button
            onClick={() => setOverlapWarning(null)}
            className="ml-auto shrink-0 text-amber-400 hover:text-amber-300"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Mobile day navigator */}
      <div className="flex sm:hidden items-center justify-between gap-2">
        <button
          onClick={() => setMobileDay((d) => Math.max(0, d - 1))}
          disabled={mobileDay === 0}
          className="p-1.5 rounded-lg border border-white/10 light-theme:border-gray-200 text-slate-400 disabled:opacity-30 hover:text-white hover:bg-white/5 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-white light-theme:text-gray-900">
            {DAY_NAMES_LONG[mobileDay]}
          </p>
          <p className="text-xs text-slate-400 light-theme:text-gray-500">
            {weekDates[mobileDay].toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
          </p>
        </div>
        <button
          onClick={() => setMobileDay((d) => Math.min(6, d + 1))}
          disabled={mobileDay === 6}
          className="p-1.5 rounded-lg border border-white/10 light-theme:border-gray-200 text-slate-400 disabled:opacity-30 hover:text-white hover:bg-white/5 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* === Calendar grid === */}
      <div className="rounded-xl border border-white/10 light-theme:border-gray-200 overflow-hidden bg-slate-900/40 light-theme:bg-white">
        {/* Sticky day-header row */}
        <div className="sticky top-0 z-30 flex border-b border-white/10 light-theme:border-gray-200 bg-slate-900/95 light-theme:bg-white/95 backdrop-blur-sm">
          {/* Time column spacer */}
          <div className="w-12 shrink-0 border-r border-white/5 light-theme:border-gray-200" />

          {/* Day headers */}
          {DAY_NAMES_SHORT.map((name, idx) => {
            const { date } = formatDayHeader(idx);
            const today = isToday(idx);
            return (
              <div
                key={idx}
                className={`flex-1 min-w-0 flex flex-col items-center justify-center py-2 text-center ${
                  idx > 0 ? "border-l border-white/5 light-theme:border-gray-200" : ""
                } ${
                  // On mobile, only show selected day
                  idx !== mobileDay ? "hidden sm:flex" : "flex"
                }`}
              >
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    today
                      ? "text-red-400"
                      : "text-slate-400 light-theme:text-gray-500"
                  }`}
                >
                  {name}
                </span>
                <span
                  className={`text-xs mt-0.5 ${
                    today
                      ? "font-bold text-white light-theme:text-gray-900"
                      : "text-slate-500 light-theme:text-gray-400"
                  }`}
                >
                  {date}
                </span>
              </div>
            );
          })}
        </div>

        {/* Scrollable body */}
        <div
          ref={bodyRef}
          className="overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 260px)", minHeight: "400px" }}
        >
          <div className="flex">
            {/* Time labels column */}
            <div
              className="w-12 shrink-0 border-r border-white/5 light-theme:border-gray-200 relative"
              style={{ height: 24 * HOUR_PX }}
            >
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-0 pr-1.5 flex items-start justify-end"
                  style={{ top: hour * HOUR_PX, height: HOUR_PX }}
                >
                  <span className="text-[9px] text-slate-600 light-theme:text-gray-400 font-mono leading-none mt-1">
                    {formatHourLabel(hour)}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="flex flex-1 min-w-0">
              {DAY_NAMES_SHORT.map((_, dayIndex) => {
                const isVisibleOnMobile = dayIndex === mobileDay;
                return renderDayColumn(dayIndex, isVisibleOnMobile);
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-slate-400 light-theme:text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          Current time
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded" style={{ backgroundColor: "#2563eb" }} />
          Oval
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded" style={{ backgroundColor: "#059669" }} />
          Sports Car
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded" style={{ backgroundColor: "#dc2626" }} />
          Formula Car
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded" style={{ backgroundColor: "#d97706" }} />
          Dirt Oval
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded" style={{ backgroundColor: "#92400e" }} />
          Dirt Road
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded" style={{ backgroundColor: "#4b5563" }} />
          Unranked
        </span>
      </div>

      {/* Add Session Panel */}
      <AddSessionPanel
        isOpen={panelOpen}
        calendarDate={panelDate}
        hour={panelHour}
        dayOfWeek={panelDayOfWeek}
        slotSeries={panelSlotSeries}
        showLocalTime={showLocalTime}
        existingSessions={sessions}
        onAdd={handleAddSession}
        onClose={closePanel}
      />

      {/* Session Detail Panel */}
      <SessionDetailPanel
        isOpen={detailPanelOpen}
        session={detailSession}
        showLocalTime={showLocalTime}
        referenceDate={detailReferenceDate}
        onRemove={handleRemoveSession}
        onClose={closeDetailPanel}
      />
    </div>
  );
}
