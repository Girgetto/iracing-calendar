import type { Series } from "./types";

export interface RaceScheduleInfo {
  intervalMinutes: number;
  offsets: number[]; // minutes past midnight for first race of each "offset group"
}

export const DEFAULT_SCHEDULE: RaceScheduleInfo = {
  intervalMinutes: 120,
  offsets: [0],
};

/**
 * Parse raceFrequency strings like:
 *   "Races every 30 minutes at :15 and :45"
 *   "Races hourly at :45 past"
 *   "Races every 2 hours on the hour"
 *   "Races every odd 2 hours on the hour"
 */
export function parseRaceFrequency(
  freq: string | undefined
): RaceScheduleInfo {
  if (!freq) return DEFAULT_SCHEDULE;

  // Strip everything after "|" (e.g. qualifying info)
  const raw = freq.split("|")[0].toLowerCase().trim();

  // Special cases that cannot be meaningfully parsed as regular intervals
  if (
    /timeslots?\s*per\s*week/.test(raw) ||
    /friday|saturday|sunday|monday|tuesday|wednesday|thursday at/.test(raw)
  ) {
    return DEFAULT_SCHEDULE;
  }

  // --- Determine interval ---
  let intervalMinutes = 60;

  if (/every\s*30|thirty\s*min/.test(raw)) {
    intervalMinutes = 30;
  } else if (/every\s*2\s*hour|2\s*hours/.test(raw)) {
    intervalMinutes = 120;
  }
  // "hourly", "every hour" → keep 60

  // --- Extract offsets ---
  const offsets: number[] = [];

  // Pattern: ":XX" (explicit minute marker)
  for (const m of raw.matchAll(/:(\d+)/g)) {
    const val = parseInt(m[1], 10);
    if (val >= 0 && val < 60 && !offsets.includes(val)) offsets.push(val);
  }

  // Pattern: "15 past", "45 past" (number before "past")
  for (const m of raw.matchAll(/(\d+)\s*past/g)) {
    const val = parseInt(m[1], 10);
    if (val >= 0 && val < 60 && !offsets.includes(val)) offsets.push(val);
  }

  // Named offsets
  if (
    /on the hour|top of the hour|at the top|hourly on the 00/.test(raw) &&
    !offsets.includes(0)
  ) {
    offsets.push(0);
  }
  if (/half past/.test(raw) && !offsets.includes(30)) {
    offsets.push(30);
  }

  // Handle "odd hours" for 2-hour series (e.g. 01:00, 03:00, ...)
  if (/odd/.test(raw) && intervalMinutes === 120) {
    return { intervalMinutes: 120, offsets: [60] };
  }

  if (offsets.length === 0) {
    // Derive defaults from interval
    if (intervalMinutes === 30) return { intervalMinutes: 30, offsets: [0, 30] };
    return { intervalMinutes, offsets: [0] };
  }

  return {
    intervalMinutes,
    offsets: [...new Set(offsets)].sort((a, b) => a - b),
  };
}

/**
 * Given a schedule info, return all race start times in a day as "HH:MM" strings (UTC).
 */
export function getSessionTimesForDay(schedInfo: RaceScheduleInfo): string[] {
  const { intervalMinutes, offsets } = schedInfo;
  const times = new Set<string>();

  for (const offset of offsets) {
    let current = offset;
    while (current < 24 * 60) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      times.add(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      current += intervalMinutes;
    }
  }

  return [...times].sort();
}

/**
 * Returns the 7 dates of the Monday–Sunday week containing `date` (in UTC).
 */
export function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const utcDay = d.getUTCDay(); // 0=Sun, 1=Mon, …
  const daysFromMonday = utcDay === 0 ? 6 : utcDay - 1;
  d.setUTCDate(d.getUTCDate() - daysFromMonday);
  d.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setUTCDate(d.getUTCDate() + i);
    return day;
  });
}

/**
 * Find the iRacing week number that contains a given date.
 * Uses the first series' schedule as a reference calendar.
 */
export function getIRacingWeekForDate(
  date: Date,
  allSeries: Series[]
): number | null {
  if (!allSeries.length) return null;
  const refSchedule = allSeries[0].schedule;
  for (const week of refSchedule) {
    const start = new Date(week.startDate);
    const end = new Date(week.endDate);
    end.setUTCDate(end.getUTCDate() + 1); // make endDate inclusive
    if (date >= start && date < end) return week.week;
  }
  return null;
}

export interface SlotSeriesResult {
  series: Series;
  sessionTime: string; // "HH:MM" UTC
  durationMinutes: number;
  trackName: string;
  schedInfo: RaceScheduleInfo;
  iracingWeekNumber: number;
}

/**
 * Return all series that have a race session starting during `hour` UTC on `calendarDate`.
 */
export function getSeriesForSlot(
  allSeries: Series[],
  calendarDate: Date,
  hour: number // 0-23 UTC
): SlotSeriesResult[] {
  const weekNumber = getIRacingWeekForDate(calendarDate, allSeries);
  if (weekNumber === null) return [];

  const results: SlotSeriesResult[] = [];

  for (const series of allSeries) {
    const weekData = series.schedule.find((w) => w.week === weekNumber);
    if (!weekData) continue;

    const schedInfo = parseRaceFrequency(series.raceFrequency);
    const allTimes = getSessionTimesForDay(schedInfo);

    // Filter to times that start in this hour slot
    const slotTimes = allTimes.filter((t) => {
      const [h] = t.split(":").map(Number);
      return h === hour;
    });

    if (slotTimes.length === 0) continue;

    const durationMinutes = weekData.durationMins ?? 45;

    for (const sessionTime of slotTimes) {
      results.push({
        series,
        sessionTime,
        durationMinutes,
        trackName: weekData.track,
        schedInfo,
        iracingWeekNumber: weekNumber,
      });
    }
  }

  // Sort by session time then series name
  return results.sort((a, b) => {
    if (a.sessionTime !== b.sessionTime)
      return a.sessionTime.localeCompare(b.sessionTime);
    return a.series.name.localeCompare(b.series.name);
  });
}

/** Hex colors for session cards, keyed by series category */
export const CATEGORY_CARD_COLORS: Record<string, string> = {
  Oval: "#2563eb",
  "Sports Car": "#059669",
  "Formula Car": "#dc2626",
  "Dirt Oval": "#d97706",
  "Dirt Road": "#92400e",
  Unranked: "#4b5563",
};

export function getCategoryCardColor(category: string): string {
  return CATEGORY_CARD_COLORS[category] ?? "#4b5563";
}

/**
 * Format a Date as "HH:MM" in UTC.
 */
export function formatUTCTime(date: Date): string {
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes()
  ).padStart(2, "0")}`;
}

/**
 * Convert an "HH:MM" UTC time string to local timezone display string.
 * Uses native Intl API.
 */
export function utcTimeToLocal(utcTime: string, referenceDate: Date): string {
  const [h, m] = utcTime.split(":").map(Number);
  const d = new Date(referenceDate);
  d.setUTCHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Get the UTC offset string for the user's timezone (e.g. "UTC+2", "UTC-5").
 */
export function getLocalTimezoneLabel(): string {
  const offsetMinutes = new Date().getTimezoneOffset(); // negative = ahead of UTC
  const absMin = Math.abs(offsetMinutes);
  const h = Math.floor(absMin / 60);
  const m = absMin % 60;
  const sign = offsetMinutes <= 0 ? "+" : "-";
  if (m === 0) return `UTC${sign}${h}`;
  return `UTC${sign}${h}:${String(m).padStart(2, "0")}`;
}
