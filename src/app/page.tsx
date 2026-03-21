import { Suspense } from "react";
import { getSeasonData, getAllSeries, getCategories } from "@/lib/data";
import { getAvailableSeasons, getSeasonDataById, getAllSeriesForSeason, getCategoriesForSeason } from "@/lib/seasons";
import HomePageContent from "@/components/HomePageContent";

interface HomePageProps {
  searchParams: Promise<{ season?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { season: seasonParam } = await searchParams;
  const availableSeasons = getAvailableSeasons();

  // Determine which season to show
  const currentSeason = availableSeasons.find((s) => s.current);
  const currentSeasonId = currentSeason?.id ?? availableSeasons[0]?.id;

  let selectedSeasonId = currentSeasonId;
  let isCurrentSeason = true;

  if (seasonParam && availableSeasons.some((s) => s.id === seasonParam)) {
    selectedSeasonId = seasonParam;
    isCurrentSeason = availableSeasons.find((s) => s.id === seasonParam)?.current ?? false;
  }

  // Load data for the selected season
  let seasonData;
  let allSeries;
  let categories;

  if (isCurrentSeason) {
    seasonData = getSeasonData();
    allSeries = getAllSeries();
    categories = getCategories();
  } else {
    seasonData = getSeasonDataById(selectedSeasonId) ?? getSeasonData();
    allSeries = getAllSeriesForSeason(selectedSeasonId);
    categories = getCategoriesForSeason(selectedSeasonId);
  }

  return (
    <Suspense>
      <HomePageContent
        seasonData={seasonData}
        allSeries={allSeries}
        categories={categories}
        availableSeasons={availableSeasons}
        selectedSeasonId={selectedSeasonId}
        isCurrentSeason={isCurrentSeason}
      />
    </Suspense>
  );
}
