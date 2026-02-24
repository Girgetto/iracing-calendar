"use client";

import { useState, useMemo, useEffect } from "react";
import type { ViewMode, LicenseClass } from "@/lib/types";
import { getAllSeries, getSeasonData, getCategories, filterSeries } from "@/lib/data";
import { getCategoryTextColor, getCurrentWeek } from "@/lib/utils";
import {
  loadPreferences,
  savePreferences,
  getUniqueCars,
  getUniqueTracks,
  getSeriesAvailability,
  ensureFreeContent,
  isFavoriteSeries,
  ownsSeriesCar,
  ownsTrack,
  type UserPreferences,
} from "@/lib/preferences";
import { ALL_IRACING_CARS, ALL_IRACING_TRACKS } from "@/lib/freeContent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import SeriesList from "@/components/SeriesList";
import PreferencesModal from "@/components/PreferencesModal";
import TrackRecommendationsModal from "@/components/TrackRecommendationsModal";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeLicense, setActiveLicense] = useState<LicenseClass>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [preferences, setPreferences] = useState<UserPreferences>({
    ownedCars: [],
    ownedTracks: [],
    favoriteSeries: [],
  });
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isTrackRecommendationsOpen, setIsTrackRecommendationsOpen] = useState(false);
  const [canRaceOnly, setCanRaceOnly] = useState(false);

  const seasonData = getSeasonData();
  const allSeries = getAllSeries();
  const globalCurrentWeek = allSeries.length > 0 ? getCurrentWeek(allSeries[0].schedule) : null;

  const availableCars = useMemo(() => {
    const seasonCars = getUniqueCars(allSeries);
    const merged = Array.from(new Set([...ALL_IRACING_CARS, ...seasonCars]));
    return merged.sort((a, b) => a.localeCompare(b));
  }, [allSeries]);

  const availableTracks = useMemo(() => {
    const seasonTracks = getUniqueTracks(allSeries);
    const merged = Array.from(new Set([...ALL_IRACING_TRACKS, ...seasonTracks]));
    return merged.sort((a, b) => a.localeCompare(b));
  }, [allSeries]);

  // Load preferences on mount and ensure included content is pre-selected
  useEffect(() => {
    const loaded = loadPreferences();
    const withFreeContent = ensureFreeContent(
      loaded.ownedCars,
      loaded.ownedTracks,
      availableCars,
      availableTracks,
      loaded.favoriteSeries
    );
    setPreferences(withFreeContent);
  }, [availableCars, availableTracks]);

  const filteredSeries = useMemo(
    () => filterSeries(allSeries, activeCategory, searchQuery, activeLicense),
    [allSeries, activeCategory, searchQuery, activeLicense]
  );

  // Sort series by favorites first, then by availability
  const sortedSeries = useMemo(() => {
    const hasPreferences = preferences.ownedCars.length > 0 || preferences.ownedTracks.length > 0;

    const now = new Date();
    const seriesPool = canRaceOnly && hasPreferences
      ? filteredSeries.filter((s) => {
          if (!s.car || s.car === "See race week for cars in use that week.") return false;
          if (!ownsSeriesCar(s, preferences.ownedCars)) return false;
          const currentWeek = s.schedule.find((week) => {
            const start = new Date(week.startDate);
            const end = new Date(week.endDate);
            end.setDate(end.getDate() + 1);
            return now >= start && now < end;
          });
          if (currentWeek) {
            return ownsTrack(currentWeek.track, preferences.ownedTracks);
          }
          return s.schedule.some(
            (week) =>
              new Date(week.startDate) > now &&
              ownsTrack(week.track, preferences.ownedTracks)
          );
        })
      : filteredSeries;

    return [...seriesPool].sort((a, b) => {
      const aIsFavorite = isFavoriteSeries(a.id, preferences);
      const bIsFavorite = isFavoriteSeries(b.id, preferences);

      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;

      if (!hasPreferences) return 0;

      const availA = getSeriesAvailability(a, preferences);
      const availB = getSeriesAvailability(b, preferences);

      if (!availA.hasRequiredCar && availB.hasRequiredCar) return 1;
      if (availA.hasRequiredCar && !availB.hasRequiredCar) return -1;

      return availB.percentage - availA.percentage;
    });
  }, [filteredSeries, preferences, canRaceOnly]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allSeries.length };
    for (const s of allSeries) {
      counts[s.category] = (counts[s.category] || 0) + 1;
    }
    return counts;
  }, [allSeries]);

  const categories = getCategories().filter((c) => c !== "All");

  const handleSavePreferences = (prefs: UserPreferences) => {
    savePreferences(prefs);
    setPreferences(prefs);
  };

  const handlePreferencesChange = (prefs: UserPreferences) => {
    savePreferences(prefs);
    setPreferences(prefs);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "iRacing Calendar",
    description:
      "Open-source iRacing season calendar and scheduler. Browse all series, filter by category, and check which tracks you own to plan your season.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://iracing-calendar.girgetto.it",
    applicationCategory: "SportsApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Girgetto",
      url: "https://github.com/Girgetto",
    },
    codeRepository: "https://github.com/Girgetto/iracing-calendar",
    keywords:
      "iRacing, iRacing calendar, iRacing schedule, iRacing season, sim racing, iRacing scheduler",
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 light-theme:bg-white text-white light-theme:text-gray-900 transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header metadata={seasonData.metadata} currentWeek={globalCurrentWeek} />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Season Banner */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white light-theme:text-gray-900 transition-colors duration-300">
                    {seasonData.metadata.season}
                  </h1>
                  {globalCurrentWeek && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 light-theme:bg-red-100 px-3 py-1 text-xs font-medium text-red-400 light-theme:text-red-700 border border-red-500/30 light-theme:border-red-300 self-center transition-colors duration-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 light-theme:bg-red-600 animate-pulse" />
                      Week {globalCurrentWeek}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 light-theme:text-gray-600 transition-colors duration-300">
                  Browse {allSeries.length} series across{" "}
                  {categories.map((cat, i) => (
                    <span key={cat}>
                      <span className={getCategoryTextColor(cat)}>
                        {categoryCounts[cat] || 0} {cat}
                      </span>
                      {i < categories.length - 2 && ", "}
                      {i === categories.length - 2 && ", and "}
                    </span>
                  ))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTrackRecommendationsOpen(true)}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 light-theme:bg-gray-100 light-theme:hover:bg-gray-200 border border-white/10 light-theme:border-gray-300 rounded-lg text-sm text-slate-300 hover:text-white light-theme:text-gray-700 light-theme:hover:text-gray-900 transition-colors duration-300"
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Track Tips
                </button>
                <button
                  onClick={() => setIsPreferencesOpen(true)}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 light-theme:bg-gray-100 light-theme:hover:bg-gray-200 border border-white/10 light-theme:border-gray-300 rounded-lg text-sm text-slate-300 hover:text-white light-theme:text-gray-700 light-theme:hover:text-gray-900 transition-colors duration-300"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  My Content
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="mb-6">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              activeLicense={activeLicense}
              onLicenseChange={setActiveLicense}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              resultCount={sortedSeries.length}
              canRaceOnly={canRaceOnly}
              onCanRaceOnlyChange={setCanRaceOnly}
              hasPreferences={preferences.ownedCars.length > 0 || preferences.ownedTracks.length > 0}
            />
          </div>

          {/* Series Grid/List */}
          <SeriesList series={sortedSeries} viewMode={viewMode} preferences={preferences} onPreferencesChange={handlePreferencesChange} />
        </div>
      </main>

      <Footer />

      {/* Track Recommendations Modal */}
      <TrackRecommendationsModal
        isOpen={isTrackRecommendationsOpen}
        onClose={() => setIsTrackRecommendationsOpen(false)}
        allSeries={allSeries}
        ownedTracks={preferences.ownedTracks}
      />

      {/* Preferences Modal */}
      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        preferences={preferences}
        onSave={handleSavePreferences}
        availableCars={availableCars}
        availableTracks={availableTracks}
      />
    </div>
  );
}
