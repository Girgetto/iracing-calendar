"use client";

import type { ViewMode, LicenseClass } from "@/lib/types";
import { getCategories } from "@/lib/data";
import { getCategoryDotColor } from "@/lib/utils";

const LICENSE_CLASSES: { label: string; value: LicenseClass; color: string }[] = [
  { label: "All", value: "All", color: "" },
  { label: "Rookie", value: "Rookie", color: "bg-[#E8391A]" },
  { label: "D", value: "D", color: "bg-[#F8821A]" },
  { label: "C", value: "C", color: "bg-[#FFC800]" },
  { label: "B", value: "B", color: "bg-[#39B549]" },
  { label: "A", value: "A", color: "bg-[#0092D0]" },
];

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  activeLicense: LicenseClass;
  onLicenseChange: (license: LicenseClass) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  resultCount: number;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  activeLicense,
  onLicenseChange,
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
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 light-theme:text-gray-600 transition-colors duration-300"
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
            className="w-full rounded-lg border border-white/10 light-theme:border-gray-300 bg-gray-900/50 light-theme:bg-white py-2.5 pl-10 pr-4 text-sm text-white light-theme:text-gray-900 placeholder-gray-500 light-theme:placeholder-gray-400 outline-none transition-colors duration-300 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 light-theme:text-gray-600 light-theme:hover:text-gray-800 transition-colors duration-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex rounded-lg border border-white/10 light-theme:border-gray-300 overflow-hidden shrink-0">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`px-3 py-2.5 text-sm transition-colors duration-300 ${
              viewMode === "grid"
                ? "bg-white/10 light-theme:bg-gray-200 text-white light-theme:text-gray-900"
                : "text-gray-500 hover:text-gray-300 light-theme:text-gray-600 light-theme:hover:text-gray-900"
            }`}
            aria-label="Grid view"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`px-3 py-2.5 text-sm transition-colors duration-300 ${
              viewMode === "list"
                ? "bg-white/10 light-theme:bg-gray-200 text-white light-theme:text-gray-900"
                : "text-gray-500 hover:text-gray-300 light-theme:text-gray-600 light-theme:hover:text-gray-900"
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
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-white/15 light-theme:bg-gray-200 text-white light-theme:text-gray-900 ring-1 ring-white/20 light-theme:ring-gray-300"
                  : "text-gray-400 light-theme:text-gray-600 hover:text-gray-200 light-theme:hover:text-gray-900 hover:bg-white/5 light-theme:hover:bg-gray-100"
              }`}
            >
              {cat !== "All" && (
                <span className={`h-2 w-2 rounded-full ${getCategoryDotColor(cat)}`} />
              )}
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 light-theme:text-gray-600 transition-colors duration-300 hidden sm:inline">
          {resultCount} series
        </span>
      </div>

      {/* License Class Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 light-theme:text-gray-600 shrink-0">License:</span>
        {LICENSE_CLASSES.map(({ label, value, color }) => (
          <button
            key={value}
            onClick={() => onLicenseChange(value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
              activeLicense === value
                ? "bg-white/15 light-theme:bg-gray-200 text-white light-theme:text-gray-900 ring-1 ring-white/20 light-theme:ring-gray-300"
                : "text-gray-400 light-theme:text-gray-600 hover:text-gray-200 light-theme:hover:text-gray-900 hover:bg-white/5 light-theme:hover:bg-gray-100"
            }`}
          >
            {value !== "All" && <span className={`h-2 w-2 rounded-full ${color}`} />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
