"use client";

import { useState, useEffect } from "react";
import type { UserPreferences } from "@/lib/preferences";
import { ensureFreeContent } from "@/lib/preferences";
import { isFreeCar, isFreeTrack } from "@/lib/freeContent";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (prefs: UserPreferences) => void;
  availableCars: string[];
  availableTracks: string[];
}

export default function PreferencesModal({
  isOpen,
  onClose,
  preferences,
  onSave,
  availableCars,
  availableTracks,
}: PreferencesModalProps) {
  const [activeTab, setActiveTab] = useState<"cars" | "tracks">("cars");
  const [searchQuery, setSearchQuery] = useState("");
  const [ownedCars, setOwnedCars] = useState<string[]>(preferences.ownedCars);
  const [ownedTracks, setOwnedTracks] = useState<string[]>(
    preferences.ownedTracks
  );

  useEffect(() => {
    // Ensure free content is always included when preferences are updated
    const withFreeContent = ensureFreeContent(
      preferences.ownedCars,
      preferences.ownedTracks,
      availableCars,
      availableTracks
    );
    setOwnedCars(withFreeContent.ownedCars);
    setOwnedTracks(withFreeContent.ownedTracks);
  }, [preferences, availableCars, availableTracks]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ ownedCars, ownedTracks, favoriteSeries: preferences.favoriteSeries });
    onClose();
  };

  const handleReset = () => {
    setOwnedCars([]);
    setOwnedTracks([]);
  };

  const toggleCar = (car: string) => {
    // Prevent unchecking free content
    if (isFreeCar(car)) return;

    setOwnedCars((prev) =>
      prev.includes(car) ? prev.filter((c) => c !== car) : [...prev, car]
    );
  };

  const toggleTrack = (track: string) => {
    // Prevent unchecking free content
    if (isFreeTrack(track)) return;

    setOwnedTracks((prev) =>
      prev.includes(track) ? prev.filter((t) => t !== track) : [...prev, track]
    );
  };

  const filteredCars = availableCars.filter((car) =>
    car.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTracks = availableTracks.filter((track) =>
    track.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentList = activeTab === "cars" ? filteredCars : filteredTracks;
  const currentOwned = activeTab === "cars" ? ownedCars : ownedTracks;
  const toggleItem = activeTab === "cars" ? toggleCar : toggleTrack;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg border border-white/10 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Content Ownership</h2>
            <p className="text-sm text-gray-400 mt-1">
              Select the cars and tracks you own to highlight available series
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("cars")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "cars"
                ? "text-white border-b-2 border-red-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Cars ({ownedCars.length}/{availableCars.length})
          </button>
          <button
            onClick={() => setActiveTab("tracks")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "tracks"
                ? "text-white border-b-2 border-red-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Tracks ({ownedTracks.length}/{availableTracks.length})
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-950 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {currentList.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No items found</p>
            ) : (
              currentList.map((item) => {
                const isOwned = currentOwned.includes(item);
                const isFree = activeTab === "cars" ? isFreeCar(item) : isFreeTrack(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItem(item)}
                    disabled={isFree}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${
                      isFree
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-white cursor-not-allowed opacity-90"
                        : isOwned
                        ? "bg-red-500/10 border border-red-500/30 text-white"
                        : "bg-gray-950/50 border border-white/5 text-gray-300 hover:bg-gray-950 hover:border-white/10"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        isFree
                          ? "bg-emerald-500 border-emerald-500"
                          : isOwned
                          ? "bg-red-500 border-red-500"
                          : "border-gray-600"
                      }`}
                    >
                      {(isOwned || isFree) && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="flex-1 text-sm">{item}</span>
                    {isFree && (
                      <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 bg-emerald-500/20 rounded-full">
                        FREE
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-white/10">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear All
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
