"use client";

import { useState, useMemo } from "react";
import type { ViewMode } from "@/lib/types";
import { getAllSeries, getSeasonData, getCategories, filterSeries } from "@/lib/data";
import { getCategoryTextColor } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import SeriesList from "@/components/SeriesList";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      <Header metadata={seasonData.metadata} />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Season Banner */}
          <div className="mb-8">
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
          <SeriesList series={filteredSeries} viewMode={viewMode} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
