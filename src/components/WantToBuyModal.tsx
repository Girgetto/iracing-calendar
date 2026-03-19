"use client";

import { useState, useEffect } from "react";
import type { UserPreferences } from "@/lib/preferences";
import { isFreeCar, isFreeTrack } from "@/lib/freeContent";

interface WantToBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (prefs: UserPreferences) => void;
  availableCars: string[];
  availableTracks: string[];
}

export default function WantToBuyModal({
  isOpen,
  onClose,
  preferences,
  onSave,
  availableCars,
  availableTracks,
}: WantToBuyModalProps) {
  const [activeTab, setActiveTab] = useState<"cars" | "tracks">("cars");
  const [searchQuery, setSearchQuery] = useState("");
  const [wantToBuyCars, setWantToBuyCars] = useState<string[]>(preferences.wantToBuyCars);
  const [wantToBuyTracks, setWantToBuyTracks] = useState<string[]>(preferences.wantToBuyTracks);
  const [localOwnedTracks, setLocalOwnedTracks] = useState<string[]>(preferences.ownedTracks);

  useEffect(() => {
    setWantToBuyCars(preferences.wantToBuyCars);
    setWantToBuyTracks(preferences.wantToBuyTracks);
    setLocalOwnedTracks(preferences.ownedTracks);
  }, [preferences]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ ...preferences, wantToBuyCars, wantToBuyTracks, ownedTracks: localOwnedTracks });
    onClose();
  };

  const handleReset = () => {
    setWantToBuyCars([]);
    setWantToBuyTracks([]);
  };

  // Helper function to extract base track name (everything before last " - ")
  const getBaseTrackName = (track: string): string => {
    const lastDashIndex = track.lastIndexOf(" - ");
    return lastDashIndex > 0 ? track.substring(0, lastDashIndex) : track;
  };

  // Group tracks by their base name
  const groupTracksByBase = (tracks: string[]): Map<string, string[]> => {
    const grouped = new Map<string, string[]>();

    tracks.forEach((track) => {
      const baseName = getBaseTrackName(track);
      if (!grouped.has(baseName)) {
        grouped.set(baseName, []);
      }
      grouped.get(baseName)!.push(track);
    });

    const baseNames = Array.from(grouped.keys());
    for (const baseName of baseNames) {
      if (!grouped.has(baseName)) continue;
      for (const potentialParent of baseNames) {
        if (
          potentialParent !== baseName &&
          grouped.has(potentialParent) &&
          baseName.startsWith(potentialParent + " - ")
        ) {
          const subVariants = grouped.get(baseName)!;
          const parentVariants = grouped.get(potentialParent)!;
          grouped.set(potentialParent, [...parentVariants, ...subVariants]);
          grouped.delete(baseName);
          break;
        }
      }
    }

    return grouped;
  };

  const areAllVariantsInList = (variants: string[], list: string[]): boolean => {
    return variants.every((variant) => list.includes(variant));
  };

  const toggleCar = (car: string) => {
    // Cannot want to buy what you already own or what is free
    if (isFreeCar(car) || preferences.ownedCars.includes(car)) return;

    setWantToBuyCars((prev) =>
      prev.includes(car) ? prev.filter((c) => c !== car) : [...prev, car]
    );
  };

  const toggleTrack = (baseTrackOrVariant: string) => {
    const variants = groupTracksByBase(availableTracks).get(baseTrackOrVariant) || [baseTrackOrVariant];

    // Cannot want to buy free tracks
    const hasAnyFreeVariant = variants.some((v) => isFreeTrack(v));
    if (hasAnyFreeVariant) return;

    // Cannot want to buy tracks already owned
    const allOwned = areAllVariantsInList(variants, localOwnedTracks);
    if (allOwned) return;

    const allWanted = areAllVariantsInList(
      variants.filter((v) => !localOwnedTracks.includes(v)),
      wantToBuyTracks
    );

    setWantToBuyTracks((prev) => {
      if (allWanted) {
        return prev.filter((t) => !variants.includes(t));
      } else {
        const newTracks = [...prev];
        variants.forEach((variant) => {
          if (!newTracks.includes(variant) && !localOwnedTracks.includes(variant)) {
            newTracks.push(variant);
          }
        });
        return newTracks;
      }
    });
  };

  const markTrackAsOwned = (baseTrack: string) => {
    const variants = groupedTracks.get(baseTrack) || [baseTrack];
    setLocalOwnedTracks((prev) => {
      const newOwned = [...prev];
      variants.forEach((v) => {
        if (!newOwned.includes(v)) newOwned.push(v);
      });
      return newOwned;
    });
    setWantToBuyTracks((prev) => prev.filter((t) => !variants.includes(t)));
  };

  const filteredCars = availableCars.filter((car) =>
    car.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTracks = availableTracks.filter((track) =>
    !isFreeTrack(track) && track.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTracks = groupTracksByBase(filteredTracks);
  const baseTrackNames = Array.from(groupedTracks.keys()).sort();

  const currentList = activeTab === "cars" ? filteredCars : baseTrackNames;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 light-theme:bg-black/30 backdrop-blur-sm">
      <div className="bg-slate-800 light-theme:bg-white rounded-lg border border-white/10 light-theme:border-gray-300 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 light-theme:border-gray-200 transition-colors duration-300">
          <div>
            <h2 className="text-xl font-bold text-white light-theme:text-gray-900 transition-colors duration-300">Want to Buy</h2>
            <p className="text-sm text-slate-400 light-theme:text-gray-600 mt-1 transition-colors duration-300">
              Select the cars and tracks you want to buy to track your wishlist
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900 transition-colors duration-300"
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
                ? "text-white light-theme:text-gray-900 border-b-2 border-amber-500 light-theme:border-amber-600"
                : "text-slate-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900"
            }`}
          >
            Cars ({wantToBuyCars.length})
          </button>
          <button
            onClick={() => setActiveTab("tracks")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors duration-300 ${
              activeTab === "tracks"
                ? "text-white light-theme:text-gray-900 border-b-2 border-amber-500 light-theme:border-amber-600"
                : "text-slate-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900"
            }`}
          >
            Tracks ({wantToBuyTracks.length})
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10 light-theme:border-gray-200 transition-colors duration-300">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-slate-900 light-theme:bg-gray-50 border border-white/10 light-theme:border-gray-300 rounded-lg text-white light-theme:text-gray-900 placeholder-slate-500 light-theme:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors duration-300"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {currentList.length === 0 ? (
              <p className="text-center text-slate-500 light-theme:text-gray-600 py-8 transition-colors duration-300">No items found</p>
            ) : (
              currentList.map((item) => {
                let isWanted: boolean;
                let isOwned: boolean;
                let isFree: boolean;
                let displayName: string = item;
                let variantCount: number | null = null;

                if (activeTab === "cars") {
                  isWanted = wantToBuyCars.includes(item);
                  isOwned = preferences.ownedCars.includes(item);
                  isFree = isFreeCar(item);
                } else {
                  const variants = groupedTracks.get(item) || [item];
                  variantCount = variants.length;
                  displayName = item;
                  isFree = variants.some((v) => isFreeTrack(v));
                  isOwned = variants.every((v) => localOwnedTracks.includes(v));
                  const unownedVariants = variants.filter((v) => !localOwnedTracks.includes(v));
                  isWanted = unownedVariants.length > 0 && unownedVariants.every((v) => wantToBuyTracks.includes(v));
                }

                const isDisabled = isFree || isOwned;

                return (
                  <div
                    key={item}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors duration-300 ${
                      isFree
                        ? "bg-emerald-500/10 light-theme:bg-emerald-50 border border-emerald-500/30 light-theme:border-emerald-300 text-white light-theme:text-gray-900 opacity-90"
                        : isOwned
                        ? "bg-slate-900/30 light-theme:bg-gray-100 border border-white/5 light-theme:border-gray-200 text-slate-500 light-theme:text-gray-400"
                        : isWanted
                        ? "bg-amber-500/10 light-theme:bg-amber-50 border border-amber-500/30 light-theme:border-amber-300 text-white light-theme:text-gray-900 cursor-pointer"
                        : "bg-slate-900/50 light-theme:bg-gray-50 border border-white/5 light-theme:border-gray-200 text-slate-300 light-theme:text-gray-700 hover:bg-slate-900 light-theme:hover:bg-gray-100 hover:border-white/10 light-theme:hover:border-gray-300 cursor-pointer"
                    }`}
                    onClick={() => !isDisabled && (activeTab === "cars" ? toggleCar(item) : toggleTrack(item))}
                  >
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors duration-300 ${
                        isFree
                          ? "bg-emerald-500 border-emerald-500 light-theme:bg-emerald-600 light-theme:border-emerald-600"
                          : isOwned
                          ? "bg-slate-600 border-slate-600 light-theme:bg-gray-400 light-theme:border-gray-400"
                          : isWanted
                          ? "bg-amber-500 border-amber-500 light-theme:bg-amber-600 light-theme:border-amber-600"
                          : "border-slate-600 light-theme:border-gray-400"
                      }`}
                    >
                      {(isWanted || isFree || isOwned) && (
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
                    <span className="flex-1 text-sm">
                      {displayName}
                      {variantCount !== null && variantCount > 1 && (
                        <span className="text-xs text-slate-400 light-theme:text-gray-500 ml-1">
                          ({variantCount} variants)
                        </span>
                      )}
                    </span>
                    {isFree && (
                      <span className="text-[10px] text-emerald-400 light-theme:text-emerald-700 font-medium px-2 py-0.5 bg-emerald-500/20 light-theme:bg-emerald-100 rounded-full transition-colors duration-300">
                        INCLUDED
                      </span>
                    )}
                    {!isFree && isOwned && (
                      <span className="text-[10px] text-slate-400 light-theme:text-gray-500 font-medium px-2 py-0.5 bg-slate-700/50 light-theme:bg-gray-200 rounded-full transition-colors duration-300">
                        OWNED
                      </span>
                    )}
                    {!isFree && !isOwned && isWanted && activeTab === "tracks" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markTrackAsOwned(item); }}
                        title="Move to My Content"
                        className="text-[10px] text-emerald-400 light-theme:text-emerald-700 font-medium px-2 py-0.5 bg-emerald-500/20 light-theme:bg-emerald-100 hover:bg-emerald-500/40 light-theme:hover:bg-emerald-200 rounded-full transition-colors duration-300 shrink-0"
                      >
                        I bought it
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-white/10 light-theme:border-gray-200 transition-colors duration-300">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-slate-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900 transition-colors duration-300"
          >
            Clear All
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900 transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 light-theme:bg-amber-600 light-theme:hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors duration-300"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
