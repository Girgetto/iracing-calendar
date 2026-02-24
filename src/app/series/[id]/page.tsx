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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const series = getSeriesById(id);
  const seasonData = getSeasonData();

  if (!series) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 light-theme:bg-white text-white light-theme:text-gray-900 transition-colors duration-300">
      <Header metadata={seasonData.metadata} />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          <SeriesDetailPage series={series} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
