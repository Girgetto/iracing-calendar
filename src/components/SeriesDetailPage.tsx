"use client";

import { useState, useEffect, useMemo } from "react";
import type { Series } from "@/lib/types";
import {
  loadPreferences,
  ensureFreeContent,
  getUniqueCars,
  getUniqueTracks,
  type UserPreferences,
} from "@/lib/preferences";
import { getAllSeries } from "@/lib/data";
import SeriesDetail from "./SeriesDetail";

interface SeriesDetailPageProps {
  series: Series;
}

export default function SeriesDetailPage({ series }: SeriesDetailPageProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    ownedCars: [],
    ownedTracks: [],
    favoriteSeries: [],
  });

  const allSeries = getAllSeries();
  const availableCars = useMemo(() => getUniqueCars(allSeries), [allSeries]);
  const availableTracks = useMemo(() => getUniqueTracks(allSeries), [allSeries]);

  useEffect(() => {
    const loaded = loadPreferences();
    const withFreeContent = ensureFreeContent(
      loaded.ownedCars,
      loaded.ownedTracks,
      availableCars,
      availableTracks,
      loaded.favoriteSeries
    );
    setPreferences(withFreeContent);
  }, [availableCars, availableTracks]);

  return <SeriesDetail series={series} preferences={preferences} />;
}
