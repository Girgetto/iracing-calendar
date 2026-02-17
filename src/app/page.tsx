"use client";

import { useState, useMemo, useEffect } from "react";
import type { ViewMode } from "@/lib/types";
import { getAllSeries, getSeasonData, getCategories, filterSeries } from "@/lib/data";
import { getCategoryTextColor } from "@/lib/utils";
import {
  loadPreferences,
  savePreferences,
  getUniqueCars,
  getUniqueTracks,
  getSeriesAvailability,
  ensureFreeContent,
  isFavoriteSeries,
  type UserPreferences,
} from "@/lib/preferences";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import SeriesList from "@/components/SeriesList";
import PreferencesModal from "@/components/PreferencesModal";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [preferences, setPreferences] = useState<UserPreferences>({
    ownedCars: [],
    ownedTracks: [],
    favoriteSeries: [],
  });
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const seasonData = getSeasonData();
  const allSeries = getAllSeries();

  const availableCars = useMemo(() => getUniqueCars(allSeries), [allSeries]);
  const availableTracks = useMemo(() => getUniqueTracks(allSeries), [allSeries]);

  // Load preferences on mount and ensure free content is included
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
    () => filterSeries(allSeries, activeCategory, searchQuery),
    [allSeries, activeCategory, searchQuery]
  );

  // Sort series by favorites first, then by availability
  const sortedSeries = useMemo(() => {
    const hasPreferences = preferences.ownedCars.length > 0 || preferences.ownedTracks.length > 0;

    return [...filteredSeries].sort((a, b) => {
      // Favorites always come first
      const aIsFavorite = isFavoriteSeries(a.id, preferences);
      const bIsFavorite = isFavoriteSeries(b.id, preferences);

      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;

      // Then sort by availability (only if user has preferences)
      if (!hasPreferences) {
        return 0;
      }

      const availA = getSeriesAvailability(a, preferences);
      const availB = getSeriesAvailability(b, preferences);

      // Series without required car go to bottom
      if (!availA.hasRequiredCar && availB.hasRequiredCar) return 1;
      if (availA.hasRequiredCar && !availB.hasRequiredCar) return -1;

      // Sort by percentage (highest first)
      return availB.percentage - availA.percentage;
    });
  }, [filteredSeries, preferences]);

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
    <div className="flex min-h-screen flex-col bg-gray-950 light-theme:bg-white text-white light-theme:text-gray-900 transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header metadata={seasonData.metadata} />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Season Banner */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white light-theme:text-gray-900 mb-2 transition-colors duration-300">
                  {seasonData.metadata.season}
                </h1>
                <p className="text-sm text-gray-400 light-theme:text-gray-600 transition-colors duration-300">
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
              <button
                onClick={() => setIsPreferencesOpen(true)}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 light-theme:bg-gray-100 light-theme:hover:bg-gray-200 border border-white/10 light-theme:border-gray-300 rounded-lg text-sm text-gray-300 hover:text-white light-theme:text-gray-700 light-theme:hover:text-gray-900 transition-colors duration-300"
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

          {/* Search & Filters */}
          <div className="mb-6">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              resultCount={sortedSeries.length}
            />
          </div>

          {/* Series Grid/List */}
          <SeriesList series={sortedSeries} viewMode={viewMode} preferences={preferences} onPreferencesChange={handlePreferencesChange} />
        </div>
      </main>

      <Footer />

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
