import { notFound } from "next/navigation";
import { getSeriesById, getAllSeries, getSeasonData } from "@/lib/data";
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

  const seasonData = getSeasonData();
  const { season } = seasonData.metadata;
  const trackList = series.schedule.map((w) => w.track);
  const uniqueTracks = [...new Set(trackList)];
  const trackSnippet = uniqueTracks.slice(0, 5).join(", ");
  const carInfo = series.car ? ` using ${series.car}` : "";
  const licenseInfo = series.licenseRange ? ` (${series.licenseRange})` : "";

  const title = `${series.name} — ${season} Schedule & Sessions`;
  const description = `Full ${series.schedule.length}-week ${season} schedule for ${series.name} (${series.category})${carInfo}${licenseInfo}. Tracks include ${trackSnippet}${uniqueTracks.length > 5 ? ` and ${uniqueTracks.length - 5} more` : ""}. View session times, dates, and plan your races.`;
  const url = `${siteUrl}/series/${id}`;

  return {
    title,
    description,
    keywords: [
      series.name,
      `${series.name} schedule`,
      `${series.name} iRacing`,
      `iRacing ${series.category}`,
      `iRacing ${season}`,
      series.car,
      "iRacing session times",
      "iRacing race schedule",
      "iRacing track rotation",
    ].filter(Boolean),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${series.name} — ${season} Schedule — iRacing Calendar`,
      description,
      siteName: "iRacing Calendar",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${series.name} — iRacing ${season} Schedule`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${series.name} — ${season} Schedule — iRacing Calendar`,
      description,
      images: ["/og-image.png"],
    },
  };
}

/** Escape `<` so `</script>` can never break out of the JSON-LD block. */
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const series = getSeriesById(id);
  const seasonData = getSeasonData();
  const allSeries = getAllSeries();

  if (!series) {
    notFound();
  }

  const { season, seasonYear } = seasonData.metadata;

  // Structured data: SportsEvent series with full schedule
  const seriesJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${series.name} — iRacing ${season}`,
    description: `${series.schedule.length}-week iRacing ${series.category} series${series.car ? ` featuring ${series.car}` : ""}. Full season schedule with tracks, session times, and race details.`,
    url: `${siteUrl}/series/${id}`,
    sport: "Sim Racing",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: "https://www.iracing.com",
    },
    organizer: {
      "@type": "Organization",
      name: "iRacing",
      url: "https://www.iracing.com",
    },
    startDate: series.schedule[0]?.startDate,
    endDate: series.schedule[series.schedule.length - 1]?.endDate,
    subEvent: series.schedule.map((week) => ({
      "@type": "SportsEvent",
      name: `Week ${week.week}: ${week.track}`,
      startDate: week.startDate,
      endDate: week.endDate,
      location: {
        "@type": "Place",
        name: week.track,
      },
      ...(week.durationMins
        ? { duration: `PT${week.durationMins}M` }
        : {}),
      ...(week.conditions
        ? { description: week.conditions }
        : {}),
    })),
  };

  // BreadcrumbList for navigation in search results
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "iRacing Calendar",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: series.category,
        item: `${siteUrl}/?cat=${encodeURIComponent(series.category)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: series.name,
        item: `${siteUrl}/series/${id}`,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 light-theme:bg-white text-white light-theme:text-gray-900 transition-colors duration-300">
      <Header metadata={seasonData.metadata} />

      <main id="main-content" className="flex-1 scroll-mt-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(seriesJsonLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
          />
          <SeriesDetailPage series={series} allSeries={allSeries} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
