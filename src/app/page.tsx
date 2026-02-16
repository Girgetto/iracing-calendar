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
  });
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    setPreferences(loadPreferences());
  }, []);

  const seasonData = getSeasonData();
  const allSeries = getAllSeries();

  const filteredSeries = useMemo(
    () => filterSeries(allSeries, activeCategory, searchQuery),
    [allSeries, activeCategory, searchQuery]
  );

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allSeries.length };
    for (const s of allSeries) {
      counts[s.category] = (counts[s.category] || 0) + 1;
    }
    return counts;
  }, [allSeries]);

  const categories = getCategories().filter((c) => c !== "All");

  const availableCars = useMemo(() => getUniqueCars(allSeries), [allSeries]);
  const availableTracks = useMemo(() => getUniqueTracks(allSeries), [allSeries]);

  const handleSavePreferences = (prefs: UserPreferences) => {
    savePreferences(prefs);
    setPreferences(prefs);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      <Header metadata={seasonData.metadata} />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Season Banner */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {seasonData.metadata.season}
                </h1>
                <p className="text-sm text-gray-400">
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
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
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
              resultCount={filteredSeries.length}
            />
          </div>

          {/* Series Grid/List */}
          <SeriesList series={filteredSeries} viewMode={viewMode} preferences={preferences} />
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
