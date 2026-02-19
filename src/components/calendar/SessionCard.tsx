"use client";

import type { CalendarSession } from "@/lib/calendarStorage";
import { utcTimeToLocal } from "@/lib/calendarUtils";

interface SessionCardProps {
  session: CalendarSession;
  topPx: number;
  heightPx: number;
  showLocalTime: boolean;
  referenceDate: Date;
  isFavorited: boolean;
  onRemove: (id: string) => void;
}

const HOUR_PX = 60;
const MIN_VISIBLE_HEIGHT = 20;

export default function SessionCard({
  session,
  topPx,
  heightPx,
  showLocalTime,
  referenceDate,
  isFavorited,
  onRemove,
}: SessionCardProps) {
  const displayTime = showLocalTime
    ? utcTimeToLocal(session.startTimeUTC, referenceDate)
    : session.startTimeUTC;

  const isShort = heightPx < HOUR_PX * 0.6; // less than 36px — very compact

  return (
    <div
      className="absolute left-0.5 right-0.5 rounded overflow-hidden select-none group z-10"
      style={{
        top: topPx,
        height: Math.max(heightPx, MIN_VISIBLE_HEIGHT),
        backgroundColor: session.color,
        opacity: 0.92,
      }}
      title={`${session.seriesName} — ${session.trackName} — ${displayTime} (${session.durationMinutes}min)`}
    >
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(session.id);
        }}
        className="absolute top-0.5 right-0.5 z-20 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
        aria-label="Remove session"
      >
        <svg
          className="h-2.5 w-2.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="h-full px-1.5 py-0.5 flex flex-col justify-start overflow-hidden">
        <div className="flex items-start gap-1 min-w-0">
          {isFavorited && (
            <svg
              className="h-2.5 w-2.5 shrink-0 mt-0.5 text-yellow-300 fill-yellow-300"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
          <span className="text-white font-semibold leading-tight text-[10px] truncate">
            {isShort ? displayTime : session.seriesName}
          </span>
        </div>

        {!isShort && (
          <>
            <span className="text-white/80 text-[9px] leading-tight truncate">
              {session.trackName}
            </span>
            <span className="text-white/70 text-[9px] leading-tight">
              {displayTime} · {session.durationMinutes}min
            </span>
          </>
        )}
      </div>
    </div>
  );
}
