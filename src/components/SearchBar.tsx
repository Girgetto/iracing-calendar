"use client";

import type { ViewMode } from "@/lib/types";
import { getCategories } from "@/lib/data";
import { getCategoryDotColor } from "@/lib/utils";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  resultCount: number;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  viewMode,
  onViewModeChange,
  resultCount,
}: SearchBarProps) {
  const categories = getCategories();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search series or tracks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-gray-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex rounded-lg border border-white/10 overflow-hidden shrink-0">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`px-3 py-2.5 text-sm transition-colors ${
              viewMode === "grid"
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
            aria-label="Grid view"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`px-3 py-2.5 text-sm transition-colors ${
              viewMode === "list"
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
            aria-label="List view"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                activeCategory === cat
                  ? "bg-white/15 text-white ring-1 ring-white/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              {cat !== "All" && (
                <span className={`h-2 w-2 rounded-full ${getCategoryDotColor(cat)}`} />
              )}
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 hidden sm:inline">
          {resultCount} series
        </span>
      </div>
    </div>
  );
}
