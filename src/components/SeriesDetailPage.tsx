"use client";

import { useState, useEffect } from "react";
import type { Series } from "@/lib/types";
import { loadPreferences, type UserPreferences } from "@/lib/preferences";
import SeriesDetail from "./SeriesDetail";

interface SeriesDetailPageProps {
  series: Series;
}

export default function SeriesDetailPage({ series }: SeriesDetailPageProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    ownedCars: [],
    ownedTracks: [],
  });

  useEffect(() => {
    setPreferences(loadPreferences());
  }, []);

  return <SeriesDetail series={series} preferences={preferences} />;
}
