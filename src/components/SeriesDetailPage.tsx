"use client";

import { useState, useEffect } from "react";
import type { Series } from "@/lib/types";
import {
  loadPreferences,
  ensureFreeContent,
  type UserPreferences,
} from "@/lib/preferences";
import SeriesDetail from "./SeriesDetail";

interface SeriesDetailPageProps {
  series: Series;
  // Only the derived car/track name lists, never the full season data: this
  // component is the client boundary for 148 prerendered pages, so anything
  // passed here is serialized into every one of them.
  availableCars: string[];
  availableTracks: string[];
}

export default function SeriesDetailPage({
  series,
  availableCars,
  availableTracks,
}: SeriesDetailPageProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    ownedCars: [],
    ownedTracks: [],
    favoriteSeries: [],
    wantToBuyCars: [],
    wantToBuyTracks: [],
  });

  useEffect(() => {
    const loaded = loadPreferences();
    const withFreeContent = ensureFreeContent(
      loaded.ownedCars,
      loaded.ownedTracks,
      availableCars,
      availableTracks,
      loaded.favoriteSeries,
      loaded.wantToBuyCars,
      loaded.wantToBuyTracks
    );
    setPreferences(withFreeContent);
  }, [availableCars, availableTracks]);

  return <SeriesDetail series={series} preferences={preferences} />;
}
