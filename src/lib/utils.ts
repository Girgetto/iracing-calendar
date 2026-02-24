import type { WeekSchedule, LicenseClass } from "./types";

// iRacing license hierarchy: higher number = higher license level
export const LICENSE_LEVELS: Record<string, number> = {
  Rookie: 1,
  D: 2,
  C: 3,
  B: 4,
  A: 5,
};

const LICENSE_BADGE_COLORS: Record<string, string> = {
  Rookie: "bg-red-500/15 text-red-400 border-red-500/30 light-theme:bg-red-50 light-theme:text-red-700 light-theme:border-red-300",
  D: "bg-orange-500/15 text-orange-400 border-orange-500/30 light-theme:bg-orange-50 light-theme:text-orange-700 light-theme:border-orange-300",
  C: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30 light-theme:bg-yellow-50 light-theme:text-yellow-700 light-theme:border-yellow-300",
  B: "bg-green-500/15 text-green-400 border-green-500/30 light-theme:bg-green-50 light-theme:text-green-700 light-theme:border-green-300",
  A: "bg-sky-500/15 text-sky-400 border-sky-500/30 light-theme:bg-sky-50 light-theme:text-sky-700 light-theme:border-sky-300",
};

export function getLicenseBadgeColor(licenseClass: LicenseClass | string): string {
  return LICENSE_BADGE_COLORS[licenseClass] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30";
}

export function getCurrentWeek(schedule: WeekSchedule[]): number | null {
  const now = new Date();
  for (const week of schedule) {
    const start = new Date(week.startDate);
    const end = new Date(week.endDate);
    if (now >= start && now <= end) {
      return week.week;
    }
  }
  return null;
}

export function getWeekStatus(
  week: WeekSchedule
): "past" | "current" | "upcoming" {
  const now = new Date();
  const start = new Date(week.startDate);
  const end = new Date(week.endDate);
  // Add one day to end date so the entire end day is considered "current"
  end.setDate(end.getDate() + 1);

  if (now >= end) return "past";
  if (now >= start) return "current";
  return "upcoming";
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const CATEGORY_COLORS: Record<string, { badge: string; dot: string }> = {
  Oval: {
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
  },
  "Sports Car": {
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  "Formula Car": {
    badge: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    dot: "bg-purple-400",
  },
  "Dirt Oval": {
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dot: "bg-amber-400",
  },
  "Dirt Road": {
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
  },
  Unranked: {
    badge: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    dot: "bg-gray-400",
  },
};

const DEFAULT_COLOR = {
  badge: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  dot: "bg-gray-400",
};

export function getCategoryColor(category: string): string {
  return (CATEGORY_COLORS[category] || DEFAULT_COLOR).badge;
}

export function getCategoryDotColor(category: string): string {
  return (CATEGORY_COLORS[category] || DEFAULT_COLOR).dot;
}

export function getCategoryTextColor(category: string): string {
  switch (category) {
    case "Oval":
      return "text-blue-400";
    case "Sports Car":
      return "text-emerald-400";
    case "Formula Car":
      return "text-purple-400";
    case "Dirt Oval":
      return "text-amber-400";
    case "Dirt Road":
      return "text-orange-400";
    case "Unranked":
      return "text-gray-400";
    default:
      return "text-gray-400";
  }
}
