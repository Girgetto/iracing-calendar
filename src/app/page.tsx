import { Suspense } from "react";
import { getAllSeries, getSeasonData, getCategories } from "@/lib/data";
import HomePageContent from "@/components/HomePageContent";

export default function HomePage() {
  const seasonData = getSeasonData();
  const allSeries = getAllSeries();
  const categories = getCategories();

  return (
    <Suspense>
      <HomePageContent
        seasonData={seasonData}
        allSeries={allSeries}
        categories={categories}
      />
    </Suspense>
  );
}
