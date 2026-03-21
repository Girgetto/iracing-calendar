import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { getSeasonData } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iracing-calendar.girgetto.it";
const seasonData = getSeasonData();
const { season, seasonYear, seasonNumber } = seasonData.metadata;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `iRacing ${season} Calendar — Series Schedule, Sessions & Track Planner`,
    template: "%s — iRacing Calendar",
  },
  description:
    `Browse the full iRacing ${season} schedule with ${seasonData.series.length}+ series across Oval, Road, Dirt & Formula categories. View week-by-week sessions, tracks, race times, and plan your season. Free and open-source.`,
  icons: {
    icon: "/favicon.png",
  },
  keywords: [
    "iRacing",
    "iRacing calendar",
    "iRacing schedule",
    "iRacing season",
    "iRacing session times",
    "iRacing race schedule",
    `iRacing ${seasonYear}`,
    `iRacing ${season}`,
    `iRacing season ${seasonNumber} ${seasonYear}`,
    "iRacing series schedule",
    "iRacing weekly schedule",
    "iRacing track rotation",
    "iRacing scheduler",
    "iRacing series",
    "iRacing tracks",
    "sim racing calendar",
    "sim racing schedule",
    "iRacing season planner",
    "iRacing track planner",
    "iRacing road racing schedule",
    "iRacing oval schedule",
    "iRacing dirt schedule",
    "iRacing formula schedule",
    "iRacing race frequency",
    "iRacing license class",
  ],
  authors: [{ name: "Girgetto", url: "https://github.com/Girgetto" }],
  creator: "Girgetto",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "iRacing Calendar",
    title: `iRacing ${season} Calendar — Series Schedule & Track Planner`,
    description:
      `Browse the full iRacing ${season} schedule. ${seasonData.series.length}+ series, week-by-week track rotations, session times, and more.`,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `iRacing ${season} Calendar — Series Schedule & Track Planner`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `iRacing ${season} Calendar — Schedule & Track Planner`,
    description:
      `Browse the full iRacing ${season} schedule. ${seasonData.series.length}+ series with week-by-week sessions and tracks.`,
    images: ["/og-image.png"],
    creator: "@Girgetto",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "iRacing Calendar",
  description:
    `Open-source iRacing ${season} calendar and scheduler. Browse all series, filter by category, view session schedules, and check which tracks you own to plan your season.`,
  url: siteUrl,
  applicationCategory: "SportsApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: "Girgetto", url: "https://github.com/Girgetto" },
  codeRepository: "https://github.com/Girgetto/iracing-calendar",
  keywords:
    `iRacing, iRacing calendar, iRacing schedule, iRacing ${season}, iRacing session times, sim racing, iRacing scheduler, iRacing series schedule`,
};

/** Escape `<` so `</script>` can never break out of the JSON-LD block. */
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs before hydration to avoid flash of wrong theme — no inline script needed */}
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <script
          type="application/ld+json"
          // safeJsonLd escapes `<` → `\u003c` so </script> can never break out
          dangerouslySetInnerHTML={{ __html: safeJsonLd(siteJsonLd) }}
        />
      </head>
      <body className="antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-red-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
