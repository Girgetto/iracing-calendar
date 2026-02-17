import { MetadataRoute } from "next";
import { getAllSeries } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iracing-calendar.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const series = getAllSeries();

  const seriesPages: MetadataRoute.Sitemap = series.map((s) => ({
    url: `${siteUrl}/series/${s.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...seriesPages,
  ];
}
