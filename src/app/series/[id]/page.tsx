import { notFound } from "next/navigation";
import { getSeriesById, getAllSeries, getSeasonData } from "@/lib/data";
import { getAvailableSeasons, getSeasonDataById, getAllSeriesForSeason, getSeriesByIdForSeason } from "@/lib/seasons";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SeriesDetailPage from "@/components/SeriesDetailPage";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iracing-calendar.girgetto.it";

export function generateStaticParams() {
  return getAllSeries().map((series) => ({
    id: series.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const series = getSeriesById(id);
  if (!series) return { title: "Series Not Found" };

  const title = `${series.name} Schedule`;
  const description = `${series.schedule.length}-week iRacing schedule for ${series.name} (${series.category}). See all tracks, dates, and check which ones you own.`;
  const url = `${siteUrl}/series/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${series.name} — iRacing Calendar`,
      description,
      siteName: "iRacing Calendar",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${series.name} — iRacing Season Schedule`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${series.name} — iRacing Calendar`,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function SeriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { id } = await params;
  const { season: seasonParam } = await searchParams;

  // Determine which season to load
  const availableSeasons = getAvailableSeasons();
  const currentSeason = availableSeasons.find((s) => s.current);
  const currentSeasonId = currentSeason?.id ?? availableSeasons[0]?.id;

  let selectedSeasonId = currentSeasonId;
  let isCurrentSeason = true;

  if (seasonParam && availableSeasons.some((s) => s.id === seasonParam)) {
    selectedSeasonId = seasonParam;
    isCurrentSeason = availableSeasons.find((s) => s.id === seasonParam)?.current ?? false;
  }

  let seasonData;
  let series;
  let allSeries;

  if (isCurrentSeason) {
    seasonData = getSeasonData();
    series = getSeriesById(id);
    allSeries = getAllSeries();
  } else {
    seasonData = getSeasonDataById(selectedSeasonId) ?? getSeasonData();
    series = getSeriesByIdForSeason(id, selectedSeasonId);
    allSeries = getAllSeriesForSeason(selectedSeasonId);
  }

  if (!series) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 light-theme:bg-white text-white light-theme:text-gray-900 transition-colors duration-300">
      <Header metadata={seasonData.metadata} seasonId={isCurrentSeason ? undefined : selectedSeasonId} />

      <main id="main-content" className="flex-1 scroll-mt-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          {!isCurrentSeason && (
            <div className="mb-4 rounded-lg bg-amber-500/10 light-theme:bg-amber-50 border border-amber-500/30 light-theme:border-amber-300 px-4 py-3 flex items-center gap-2 text-sm text-amber-400 light-theme:text-amber-700 transition-colors duration-300">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              You are viewing a past season.
            </div>
          )}
          <SeriesDetailPage series={series} allSeries={allSeries} seasonId={isCurrentSeason ? undefined : selectedSeasonId} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
