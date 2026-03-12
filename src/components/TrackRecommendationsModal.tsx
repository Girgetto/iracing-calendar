"use client";

import { useState, useMemo } from "react";
import type { Series } from "@/lib/types";
import { getAllTrackFrequency } from "@/lib/preferences";

interface TrackRecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allSeries: Series[];
  ownedTracks: string[];
}

export default function TrackRecommendationsModal({
  isOpen,
  onClose,
  allSeries,
  ownedTracks,
}: TrackRecommendationsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [showOwned, setShowOwned] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set());
  const [showSeriesFilter, setShowSeriesFilter] = useState(false);

  const allTrackFrequency = useMemo(
    () => getAllTrackFrequency(allSeries, ownedTracks),
    [allSeries, ownedTracks]
  );

  // All unique series names across all tracks
  const allSeriesNames = useMemo(() => {
    const names = new Set<string>();
    allTrackFrequency.forEach((t) => t.series.forEach((s) => names.add(s.name)));
    return Array.from(names).sort();
  }, [allTrackFrequency]);

  // Filter tracks by selected series (if any), recalculating counts
  const filteredBySeries = useMemo(() => {
    if (selectedSeries.size === 0) return allTrackFrequency;
    return allTrackFrequency
      .map((item) => {
        const matchingSeries = item.series.filter((s) => selectedSeries.has(s.name));
        if (matchingSeries.length === 0) return null;
        const count = matchingSeries.reduce((sum, s) => sum + s.weeks.length, 0);
        return { ...item, series: matchingSeries, count };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.count - a.count);
  }, [allTrackFrequency, selectedSeries]);

  const trackFrequency = useMemo(
    () => showOwned ? filteredBySeries : filteredBySeries.filter((t) => !t.owned),
    [filteredBySeries, showOwned]
  );

  const filtered = useMemo(
    () =>
      trackFrequency.filter((t) =>
        t.track.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [trackFrequency, searchQuery]
  );

  const toggleSeries = (name: string) => {
    setSelectedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const clearSeriesFilter = () => setSelectedSeries(new Set());

  if (!isOpen) return null;

  const topCount = filtered[0]?.count ?? 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 light-theme:bg-black/30 backdrop-blur-sm">
      <div className="bg-gray-900 light-theme:bg-white rounded-lg border border-white/10 light-theme:border-gray-300 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 light-theme:border-gray-200 transition-colors duration-300">
          <div>
            <h2 className="text-xl font-bold text-white light-theme:text-gray-900 transition-colors duration-300">
              Track Recommendations
            </h2>
            <p className="text-sm text-gray-400 light-theme:text-gray-600 mt-1 transition-colors duration-300">
              {showOwned
                ? "All tracks, sorted by how often they appear this season"
                : "Tracks you don\u2019t own, sorted by how often they appear this season"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOwned((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 ${
                showOwned
                  ? "bg-green-500/20 border-green-500/40 text-green-400 light-theme:bg-green-100 light-theme:border-green-400 light-theme:text-green-700"
                  : "bg-white/5 border-white/10 text-gray-400 light-theme:bg-gray-100 light-theme:border-gray-300 light-theme:text-gray-600 hover:bg-white/10 light-theme:hover:bg-gray-200"
              }`}
              title={showOwned ? "Hide owned tracks" : "Show owned tracks"}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Owned
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900 transition-colors duration-300"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10 light-theme:border-gray-200 transition-colors duration-300">
          <input
            type="text"
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-950 light-theme:bg-gray-50 border border-white/10 light-theme:border-gray-300 rounded-lg text-white light-theme:text-gray-900 placeholder-gray-500 light-theme:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors duration-300"
          />
        </div>

        {/* Series Filter */}
        <div className="border-b border-white/10 light-theme:border-gray-200 transition-colors duration-300">
          <button
            onClick={() => setShowSeriesFilter((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900 hover:bg-white/5 light-theme:hover:bg-gray-50 transition-colors duration-200"
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filter by series
              {selectedSeries.size > 0 && (
                <span className="bg-red-500/20 border border-red-500/40 text-red-400 light-theme:bg-red-100 light-theme:border-red-400 light-theme:text-red-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {selectedSeries.size}
                </span>
              )}
            </span>
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${showSeriesFilter ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showSeriesFilter && (
            <div className="px-4 pb-3">
              {selectedSeries.size > 0 && (
                <div className="flex justify-end mb-2">
                  <button
                    onClick={clearSeriesFilter}
                    className="text-xs text-gray-500 light-theme:text-gray-500 hover:text-white light-theme:hover:text-gray-900 transition-colors duration-200"
                  >
                    Clear all
                  </button>
                </div>
              )}
              <div className="max-h-40 overflow-y-auto flex flex-wrap gap-1.5">
                {allSeriesNames.map((name) => {
                  const active = selectedSeries.has(name);
                  return (
                    <button
                      key={name}
                      onClick={() => toggleSeries(name)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors duration-200 ${
                        active
                          ? "bg-red-500/20 border-red-500/40 text-red-400 light-theme:bg-red-100 light-theme:border-red-400 light-theme:text-red-700"
                          : "bg-white/5 border-white/10 text-gray-400 light-theme:bg-gray-100 light-theme:border-gray-300 light-theme:text-gray-600 hover:bg-white/10 light-theme:hover:bg-gray-200"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {filtered.length > 0 && (
          <div className="px-6 py-2 text-xs text-gray-500 light-theme:text-gray-600 border-b border-white/5 light-theme:border-gray-100 transition-colors duration-300">
            {filtered.length} {showOwned ? "" : "unowned "}track{filtered.length !== 1 ? "s" : ""} found
            {selectedSeries.size > 0 && (
              <span className="ml-1">
                across {selectedSeries.size} selected series
              </span>
            )}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 light-theme:text-gray-600 py-12 transition-colors duration-300">
              {ownedTracks.length === 0
                ? "Set your owned tracks in My Content to see recommendations"
                : selectedSeries.size > 0
                ? "No tracks found for the selected series"
                : "No tracks found"}
            </p>
          ) : (
            filtered.map((item) => {
              const isExpanded = expandedTrack === item.track;
              const barWidth = Math.round((item.count / topCount) * 100);

              return (
                <div
                  key={item.track}
                  className={`rounded-lg border overflow-hidden transition-colors duration-300 ${
                    item.owned
                      ? "border-green-500/20 light-theme:border-green-300 bg-green-950/20 light-theme:bg-green-50"
                      : "border-white/5 light-theme:border-gray-200 bg-gray-950/50 light-theme:bg-gray-50"
                  }`}
                >
                  <button
                    onClick={() =>
                      setExpandedTrack(isExpanded ? null : item.track)
                    }
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors duration-300 ${
                      item.owned
                        ? "hover:bg-green-950/30 light-theme:hover:bg-green-100"
                        : "hover:bg-gray-950 light-theme:hover:bg-gray-100"
                    }`}
                  >
                    {/* Rank badge */}
                    <span className="shrink-0 text-xs font-bold text-amber-400 light-theme:text-amber-600 w-6 text-center transition-colors duration-300">
                      {item.count}x
                    </span>

                    {/* Track name + bar */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white light-theme:text-gray-900 block truncate transition-colors duration-300">
                        {item.track}
                      </span>
                      <div className="mt-1.5 h-1 rounded-full bg-white/5 light-theme:bg-gray-200 overflow-hidden transition-colors duration-300">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.owned
                              ? "bg-green-400/70 light-theme:bg-green-500"
                              : "bg-amber-400/70 light-theme:bg-amber-500"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* Owned badge */}
                    {item.owned && (
                      <span className="shrink-0 text-xs font-medium text-green-400 light-theme:text-green-700 bg-green-500/10 light-theme:bg-green-100 px-1.5 py-0.5 rounded transition-colors duration-300">
                        owned
                      </span>
                    )}

                    {/* Session count */}
                    <span className="shrink-0 text-xs text-gray-500 light-theme:text-gray-500 transition-colors duration-300">
                      {item.series.length} series
                    </span>

                    {/* Chevron */}
                    <svg
                      className={`shrink-0 h-4 w-4 text-gray-500 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded: series breakdown */}
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t border-white/5 light-theme:border-gray-200 space-y-1.5 transition-colors duration-300">
                      {item.series.map((s) => (
                        <div
                          key={s.name}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-gray-400 light-theme:text-gray-600 truncate flex-1 transition-colors duration-300">
                            {s.name}
                          </span>
                          <span className="shrink-0 ml-4 text-gray-500 light-theme:text-gray-500 transition-colors duration-300">
                            Week{s.weeks.length !== 1 ? "s" : ""}{" "}
                            {s.weeks.sort((a, b) => a - b).join(", ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 light-theme:border-gray-200 text-center transition-colors duration-300">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm text-gray-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900 transition-colors duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
