"use client";

export interface CalendarSession {
  id: string; // uuid
  seriesId: string;
  seriesSlug: string;
  seriesName: string;
  trackName: string;
  carNames: string;
  licenseClass: string;
  category: string;
  weekNumber: number; // iRacing week number
  dayOfWeek: number; // 0=Mon … 6=Sun
  startTimeUTC: string; // "HH:MM"
  durationMinutes: number;
  color: string; // hex
}

const STORAGE_KEY = "iracing_my_calendar";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadCalendarSessions(): CalendarSession[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as CalendarSession[];
  } catch {
    // ignore parse errors
  }
  return [];
}

export function saveCalendarSessions(sessions: CalendarSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // ignore storage errors
  }
}

export function addCalendarSession(
  sessions: CalendarSession[],
  data: Omit<CalendarSession, "id">
): CalendarSession[] {
  const newSession: CalendarSession = { id: generateId(), ...data };
  const updated = [...sessions, newSession];
  saveCalendarSessions(updated);
  return updated;
}

export function removeCalendarSession(
  sessions: CalendarSession[],
  id: string
): CalendarSession[] {
  const updated = sessions.filter((s) => s.id !== id);
  saveCalendarSessions(updated);
  return updated;
}

/**
 * Check if a saved session overlaps with any existing sessions on the same day.
 * Two sessions overlap if their time ranges intersect.
 */
export function findOverlappingSessions(
  sessions: CalendarSession[],
  candidate: Omit<CalendarSession, "id">
): CalendarSession[] {
  const [cH, cM] = candidate.startTimeUTC.split(":").map(Number);
  const cStart = cH * 60 + cM;
  const cEnd = cStart + candidate.durationMinutes;

  return sessions.filter((s) => {
    if (s.weekNumber !== candidate.weekNumber) return false;
    if (s.dayOfWeek !== candidate.dayOfWeek) return false;

    const [sH, sM] = s.startTimeUTC.split(":").map(Number);
    const sStart = sH * 60 + sM;
    const sEnd = sStart + s.durationMinutes;

    return cStart < sEnd && cEnd > sStart;
  });
}
