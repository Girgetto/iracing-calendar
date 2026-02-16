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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 light-theme:bg-black/30 backdrop-blur-sm">
      <div className="bg-gray-900 light-theme:bg-white rounded-lg border border-white/10 light-theme:border-gray-300 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 light-theme:border-gray-200 transition-colors duration-300">
          <div>
            <h2 className="text-xl font-bold text-white light-theme:text-gray-900 transition-colors duration-300">Content Ownership</h2>
            <p className="text-sm text-gray-400 light-theme:text-gray-600 mt-1 transition-colors duration-300">
              Select the cars and tracks you own to highlight available series
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900 transition-colors duration-300"
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
        <div className="flex border-b border-white/10 light-theme:border-gray-200 transition-colors duration-300">
          <button
            onClick={() => setActiveTab("cars")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors duration-300 ${
              activeTab === "cars"
                ? "text-white light-theme:text-gray-900 border-b-2 border-red-500 light-theme:border-red-600"
                : "text-gray-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900"
            }`}
          >
            Cars ({ownedCars.length}/{availableCars.length})
          </button>
          <button
            onClick={() => setActiveTab("tracks")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors duration-300 ${
              activeTab === "tracks"
                ? "text-white light-theme:text-gray-900 border-b-2 border-red-500 light-theme:border-red-600"
                : "text-gray-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900"
            }`}
          >
            Tracks ({ownedTracks.length}/{availableTracks.length})
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10 light-theme:border-gray-200 transition-colors duration-300">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-950 light-theme:bg-gray-50 border border-white/10 light-theme:border-gray-300 rounded-lg text-white light-theme:text-gray-900 placeholder-gray-500 light-theme:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors duration-300"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {currentList.length === 0 ? (
              <p className="text-center text-gray-500 light-theme:text-gray-600 py-8 transition-colors duration-300">No items found</p>
            ) : (
              currentList.map((item) => {
                const isOwned = currentOwned.includes(item);
                const isFree = activeTab === "cars" ? isFreeCar(item) : isFreeTrack(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItem(item)}
                    disabled={isFree}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors duration-300 ${
                      isFree
                        ? "bg-emerald-500/10 light-theme:bg-emerald-50 border border-emerald-500/30 light-theme:border-emerald-300 text-white light-theme:text-gray-900 cursor-not-allowed opacity-90"
                        : isOwned
                        ? "bg-red-500/10 light-theme:bg-red-50 border border-red-500/30 light-theme:border-red-300 text-white light-theme:text-gray-900"
                        : "bg-gray-950/50 light-theme:bg-gray-50 border border-white/5 light-theme:border-gray-200 text-gray-300 light-theme:text-gray-700 hover:bg-gray-950 light-theme:hover:bg-gray-100 hover:border-white/10 light-theme:hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors duration-300 ${
                        isFree
                          ? "bg-emerald-500 border-emerald-500 light-theme:bg-emerald-600 light-theme:border-emerald-600"
                          : isOwned
                          ? "bg-red-500 border-red-500 light-theme:bg-red-600 light-theme:border-red-600"
                          : "border-gray-600 light-theme:border-gray-400"
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
                      <span className="text-[10px] text-emerald-400 light-theme:text-emerald-700 font-medium px-2 py-0.5 bg-emerald-500/20 light-theme:bg-emerald-100 rounded-full transition-colors duration-300">
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
        <div className="flex items-center justify-between gap-3 p-6 border-t border-white/10 light-theme:border-gray-200 transition-colors duration-300">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900 transition-colors duration-300"
          >
            Clear All
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900 transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 light-theme:bg-red-600 light-theme:hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-300"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
