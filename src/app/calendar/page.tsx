"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllSeries, getSeasonData } from "@/lib/data";
import { getCurrentWeek } from "@/lib/utils";
import { loadPreferences, type UserPreferences } from "@/lib/preferences";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WeeklyCalendar from "@/components/calendar/WeeklyCalendar";

export default function CalendarPage() {
  const seasonData = getSeasonData();
  const allSeries = getAllSeries();
  const currentWeek =
    allSeries.length > 0 ? getCurrentWeek(allSeries[0].schedule) : null;

  const [preferences, setPreferences] = useState<UserPreferences>({
    ownedCars: [],
    ownedTracks: [],
    favoriteSeries: [],
  });

  // Load preferences to get favorite series
  useEffect(() => {
    const prefs = loadPreferences();
    setPreferences(prefs);
  }, []);

  const favoriteSeries = useMemo(
    () => preferences.favoriteSeries,
    [preferences]
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 light-theme:bg-white text-white light-theme:text-gray-900 transition-colors duration-300">
      <Header metadata={seasonData.metadata} currentWeek={currentWeek} />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {/* Page header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white light-theme:text-gray-900">
                My Calendar
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 light-theme:bg-red-100 px-2.5 py-1 text-xs font-medium text-red-400 light-theme:text-red-700 border border-red-500/30 light-theme:border-red-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 light-theme:bg-red-600 animate-pulse" />
                Beta
              </span>
            </div>
            <p className="text-sm text-gray-400 light-theme:text-gray-600">
              Plan your race week — click any time slot to see which series are
              racing and add them to your calendar.
            </p>
          </div>

          <WeeklyCalendar
            allSeries={allSeries}
            favoriteSeries={favoriteSeries}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
