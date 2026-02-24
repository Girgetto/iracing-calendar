"use client";

import { useState, useMemo } from "react";
import type { Series } from "@/lib/types";
import { getUnownedTrackFrequency } from "@/lib/preferences";

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

  const trackFrequency = useMemo(
    () => getUnownedTrackFrequency(allSeries, ownedTracks),
    [allSeries, ownedTracks]
  );

  const filtered = useMemo(
    () =>
      trackFrequency.filter((t) =>
        t.track.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [trackFrequency, searchQuery]
  );

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
              Tracks you don&apos;t own, sorted by how often they appear this season
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900 transition-colors duration-300"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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

        {/* Summary */}
        {filtered.length > 0 && (
          <div className="px-6 py-2 text-xs text-gray-500 light-theme:text-gray-600 border-b border-white/5 light-theme:border-gray-100 transition-colors duration-300">
            {filtered.length} unowned track{filtered.length !== 1 ? "s" : ""} found
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 light-theme:text-gray-600 py-12 transition-colors duration-300">
              {ownedTracks.length === 0
                ? "Set your owned tracks in My Content to see recommendations"
                : "No unowned tracks found"}
            </p>
          ) : (
            filtered.map((item) => {
              const isExpanded = expandedTrack === item.track;
              const barWidth = Math.round((item.count / topCount) * 100);

              return (
                <div
                  key={item.track}
                  className="rounded-lg border border-white/5 light-theme:border-gray-200 bg-gray-950/50 light-theme:bg-gray-50 overflow-hidden transition-colors duration-300"
                >
                  <button
                    onClick={() =>
                      setExpandedTrack(isExpanded ? null : item.track)
                    }
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-950 light-theme:hover:bg-gray-100 transition-colors duration-300"
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
                          className="h-full rounded-full bg-amber-400/70 light-theme:bg-amber-500 transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>

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
