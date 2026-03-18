import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iracing-calendar.girgetto.it";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "iRacing Calendar — Season Schedule & Track Planner",
    template: "%s — iRacing Calendar",
  },
  description:
    "Open-source iRacing season calendar and scheduler. Browse all series, filter by category, and check which tracks you own to plan your season. Add your content to see how many tracks are eligible in one season tournament.",
  icons: {
    icon: "/favicon.png",
  },
  keywords: [
    "iRacing",
    "iRacing calendar",
    "iRacing schedule",
    "iRacing season",
    "iRacing scheduler",
    "iRacing series",
    "iRacing tracks",
    "sim racing calendar",
    "sim racing schedule",
    "iRacing 2025",
    "iRacing season planner",
    "iRacing track planner",
    "open source iRacing",
    "iRacing road racing",
    "iRacing oval",
    "iRacing dirt",
    "iRacing formula",
  ],
  authors: [{ name: "Girgetto", url: "https://github.com/Girgetto" }],
  creator: "Girgetto",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "iRacing Calendar",
    title: "iRacing Calendar — Season Schedule & Track Planner",
    description:
      "Open-source iRacing season calendar and scheduler. Browse all series, filter by category, and check which tracks you own to plan your season.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "iRacing Calendar — Season Schedule & Track Planner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "iRacing Calendar — Season Schedule & Track Planner",
    description:
      "Open-source iRacing season calendar and scheduler. Browse all series and plan your season.",
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
    "Open-source iRacing season calendar and scheduler. Browse all series, filter by category, and check which tracks you own to plan your season.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://iracing-calendar.girgetto.it",
  applicationCategory: "SportsApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: "Girgetto", url: "https://github.com/Girgetto" },
  codeRepository: "https://github.com/Girgetto/iracing-calendar",
  keywords:
    "iRacing, iRacing calendar, iRacing schedule, iRacing season, sim racing, iRacing scheduler",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
