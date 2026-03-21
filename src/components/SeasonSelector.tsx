"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { SeasonSummary } from "@/lib/types";

interface SeasonSelectorProps {
  seasons: SeasonSummary[];
  currentSeasonId: string;
}

export default function SeasonSelector({ seasons, currentSeasonId }: SeasonSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (seasons.length <= 1) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const seasonId = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    // Find if this is the current season
    const selected = seasons.find((s) => s.id === seasonId);
    if (selected?.current) {
      params.delete("season");
    } else {
      params.set("season", seasonId);
    }

    // Clear filters that may not apply to the other season
    params.delete("q");
    params.delete("cat");
    params.delete("lic");
    params.delete("canRace");

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  return (
    <select
      value={currentSeasonId}
      onChange={handleChange}
      aria-label="Select season"
      className="rounded-lg bg-slate-800 hover:bg-slate-700 light-theme:bg-gray-100 light-theme:hover:bg-gray-200 border border-white/10 light-theme:border-gray-300 px-3 py-2 text-sm text-slate-300 light-theme:text-gray-700 transition-colors duration-300 cursor-pointer"
    >
      {seasons.map((season) => (
        <option key={season.id} value={season.id}>
          {season.label}{season.current ? " (Current)" : ""}
        </option>
      ))}
    </select>
  );
}
