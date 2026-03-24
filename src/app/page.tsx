import { Suspense } from "react";
import { getAllSeries, getSeasonData, getCategories } from "@/lib/data";
import HomePageContent from "@/components/HomePageContent";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iracing-calendar.girgetto.it";

/** Escape `<` so `</script>` can never break out of the JSON-LD block. */
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function HomePage() {
  const seasonData = getSeasonData();
  const allSeries = getAllSeries();
  const categories = getCategories();

  const { season } = seasonData.metadata;

  // ItemList structured data so search engines index all series
  const seriesListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `iRacing ${season} Series`,
    description: `All ${allSeries.length} iRacing series for ${season} with full schedules and session information.`,
    numberOfItems: allSeries.length,
    itemListElement: allSeries.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      url: `${siteUrl}/series/${s.id}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(seriesListJsonLd) }}
      />
      <Suspense>
        <HomePageContent
          seasonData={seasonData}
          allSeries={allSeries}
          categories={categories}
        />
      </Suspense>
    </>
  );
}
