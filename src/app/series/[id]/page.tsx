import { notFound } from "next/navigation";
import { getSeriesById, getAllSeries, getSeasonData } from "@/lib/data";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SeriesDetail from "@/components/SeriesDetail";

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
  return {
    title: `${series.name} — iRacing Calendar`,
    description: `${series.schedule.length}-week schedule for ${series.name} (${series.category})`,
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
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      <Header metadata={seasonData.metadata} />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          <SeriesDetail series={series} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
