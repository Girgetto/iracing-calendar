import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSeasonData } from "@/lib/data";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://iracing-calendar.girgetto.it";

export const metadata: Metadata = {
  title: "How to Use iRacing Calendar",
  description:
    "Learn how to use iRacing Calendar to browse season schedules, filter series by category and license class, set your owned tracks and cars, and plan your iRacing season.",
  keywords: [
    "how to use iRacing Calendar",
    "iRacing season planner guide",
    "iRacing schedule filter",
    "iRacing track planner tutorial",
    "iRacing series filter",
    "iRacing license class filter",
    "iRacing owned tracks",
    "iRacing favorites",
    "sim racing calendar guide",
  ],
  alternates: { canonical: `${siteUrl}/how-to-use` },
  robots: { index: true, follow: true },
  openGraph: {
    type: "article",
    url: `${siteUrl}/how-to-use`,
    title: "How to Use iRacing Calendar — Step-by-Step Guide",
    description:
      "Learn how to browse iRacing series, filter by category and license, mark your owned content, and plan your perfect season with iRacing Calendar.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "iRacing Calendar — How to Use Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Use iRacing Calendar — Step-by-Step Guide",
    description:
      "Learn how to browse iRacing series, filter by category and license, and plan your season.",
    images: ["/og-image.png"],
    creator: "@Girgetto",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Use iRacing Calendar",
  description:
    "A step-by-step guide to browsing, filtering, and planning your iRacing season with iRacing Calendar.",
  url: `${siteUrl}/how-to-use`,
  step: [
    {
      "@type": "HowToStep",
      name: "Browse all series",
      text: "Open the homepage to see the full list of iRacing series for the current season, including their category, license class, and current week.",
    },
    {
      "@type": "HowToStep",
      name: "Filter by category",
      text: "Use the category buttons (Oval, Sports Car, Formula Car, Dirt Oval, Dirt Road) to narrow down the series list to the racing discipline you prefer.",
    },
    {
      "@type": "HowToStep",
      name: "Filter by license class",
      text: "Select a license class (Rookie, D, C, B, A) to display only series matching your current iRacing license level.",
    },
    {
      "@type": "HowToStep",
      name: "Search for a series, car, or track",
      text: "Type in the search bar to instantly filter series by name, car model, region, or track name.",
    },
    {
      "@type": "HowToStep",
      name: "Set your owned content",
      text: "Click 'My Content' to select the cars and tracks you own. The calendar will then show eligibility percentages and highlight raceable series.",
    },
    {
      "@type": "HowToStep",
      name: "View a full series schedule",
      text: "Click on any series card to open the detailed week-by-week schedule, including track names, dates, and current week indicator.",
    },
    {
      "@type": "HowToStep",
      name: "Mark favourite series",
      text: "Click the heart icon on any series card to save it as a favourite for quick access.",
    },
  ],
};

export default function HowToUsePage() {
  const seasonData = getSeasonData();

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 light-theme:bg-white text-white light-theme:text-gray-900 transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header metadata={seasonData.metadata} />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Page heading */}
          <h1 className="text-3xl font-bold mb-2 text-white light-theme:text-gray-900">
            How to Use iRacing Calendar
          </h1>
          <p className="text-sm text-gray-400 light-theme:text-gray-600 mb-10 leading-relaxed">
            iRacing Calendar is a free tool that helps you browse and plan the
            current iRacing season. Here is everything you need to know to get
            the most out of it.
          </p>

          <div className="space-y-10 text-sm text-gray-300 light-theme:text-gray-700 leading-relaxed">

            {/* Step 1 */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-lg font-semibold text-white light-theme:text-gray-900">
                  Browse all series
                </h2>
              </div>
              <p>
                The homepage lists every iRacing series active in the current
                season. Each card shows the series name, racing category, license
                class requirement, and the track scheduled for the current week.
                Scroll through the list to get a full overview of what is
                available.
              </p>
            </section>

            {/* Step 2 */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-lg font-semibold text-white light-theme:text-gray-900">
                  Filter by category
                </h2>
              </div>
              <p>
                Use the category filter buttons at the top of the page to focus
                on your preferred discipline:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>
                  <span className="font-medium text-blue-400 light-theme:text-blue-600">
                    Oval
                  </span>{" "}
                  — traditional oval and superspeedway racing
                </li>
                <li>
                  <span className="font-medium text-emerald-400 light-theme:text-emerald-600">
                    Sports Car
                  </span>{" "}
                  — GT, prototype, and endurance road racing
                </li>
                <li>
                  <span className="font-medium text-purple-400 light-theme:text-purple-600">
                    Formula Car
                  </span>{" "}
                  — open-wheel single-seater series
                </li>
                <li>
                  <span className="font-medium text-amber-400 light-theme:text-amber-600">
                    Dirt Oval
                  </span>{" "}
                  — dirt track sprint and modified racing
                </li>
                <li>
                  <span className="font-medium text-orange-400 light-theme:text-orange-600">
                    Dirt Road
                  </span>{" "}
                  — off-road and rallycross disciplines
                </li>
              </ul>
            </section>

            {/* Step 3 */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h2 className="text-lg font-semibold text-white light-theme:text-gray-900">
                  Filter by license class
                </h2>
              </div>
              <p>
                Each iRacing series requires a minimum safety-rating license
                class. Use the license filter to show only the series you are
                eligible for:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>
                  <span className="font-medium" style={{ color: "#E8391A" }}>
                    Rookie
                  </span>{" "}
                  — entry-level series, no prior iRacing license needed
                </li>
                <li>
                  <span className="font-medium" style={{ color: "#F8821A" }}>
                    D
                  </span>{" "}
                  — beginner-intermediate series
                </li>
                <li>
                  <span className="font-medium" style={{ color: "#FFC800" }}>
                    C
                  </span>{" "}
                  — intermediate series
                </li>
                <li>
                  <span className="font-medium" style={{ color: "#39B549" }}>
                    B
                  </span>{" "}
                  — advanced series
                </li>
                <li>
                  <span className="font-medium" style={{ color: "#0092D0" }}>
                    A
                  </span>{" "}
                  — top-tier competitive series
                </li>
              </ul>
            </section>

            {/* Step 4 */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <h2 className="text-lg font-semibold text-white light-theme:text-gray-900">
                  Search for a series, car, or track
                </h2>
              </div>
              <p>
                Type any keyword into the search bar to instantly filter the list.
                The search works across series names, car models, regions, and
                track names — so you can find exactly what you are looking for in
                seconds.
              </p>
            </section>

            {/* Step 5 */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  5
                </span>
                <h2 className="text-lg font-semibold text-white light-theme:text-gray-900">
                  Set your owned content
                </h2>
              </div>
              <p>
                Click the{" "}
                <span className="font-medium text-white light-theme:text-gray-900">
                  My Content
                </span>{" "}
                button to open a panel where you can select the cars and tracks
                you own. Once saved, the calendar will:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>
                  Display an eligibility percentage for each series, showing how
                  many weeks you can race without buying additional content
                </li>
                <li>
                  Enable the{" "}
                  <span className="font-medium text-white light-theme:text-gray-900">
                    Can Race Only
                  </span>{" "}
                  toggle to filter out series where you do not own the required
                  content
                </li>
                <li>
                  Highlight individual weeks in the series detail view where your
                  content is or is not eligible
                </li>
              </ul>
              <p className="mt-2">
                Your selections are saved locally in your browser and are never
                sent to any server.
              </p>
            </section>

            {/* Step 6 */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  6
                </span>
                <h2 className="text-lg font-semibold text-white light-theme:text-gray-900">
                  View a full series schedule
                </h2>
              </div>
              <p>
                Click on any series card to open its dedicated page. There you
                will find the complete week-by-week schedule for the entire
                season, including:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Track name and configuration for each week</li>
                <li>Start and end dates of each race week</li>
                <li>A visual progress bar showing the season timeline</li>
                <li>
                  A highlighted indicator for the current active week, so you
                  always know what is racing right now
                </li>
                <li>
                  Track eligibility indicators if you have set your owned content
                </li>
              </ul>
            </section>

            {/* Step 7 */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  7
                </span>
                <h2 className="text-lg font-semibold text-white light-theme:text-gray-900">
                  Mark favourite series
                </h2>
              </div>
              <p>
                Click the heart icon on any series card to add it to your
                favourites. Favourited series are saved in your browser so they
                persist between visits. Use this to keep track of the series you
                race most often.
              </p>
            </section>

            {/* Step 8 */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  8
                </span>
                <h2 className="text-lg font-semibold text-white light-theme:text-gray-900">
                  Switch between grid and list view
                </h2>
              </div>
              <p>
                Use the view toggle in the top-right area of the series list to
                switch between a grid layout (cards) and a compact list layout.
                The list view is handy when you want to scan many series quickly,
                while the grid view gives you more detail at a glance.
              </p>
            </section>

            {/* Step 9 */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  9
                </span>
                <h2 className="text-lg font-semibold text-white light-theme:text-gray-900">
                  Toggle dark and light theme
                </h2>
              </div>
              <p>
                Click the sun or moon icon in the top navigation bar to switch
                between dark and light mode. Your preference is saved in your
                browser and applied automatically on your next visit.
              </p>
            </section>

            {/* Tip box */}
            <section className="rounded-lg border border-red-500/30 bg-red-500/5 px-5 py-4">
              <h2 className="text-base font-semibold text-white light-theme:text-gray-900 mb-2">
                Quick tips
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Combine category and license filters for a highly targeted view
                </li>
                <li>
                  All filters and search work together at the same time
                </li>
                <li>
                  Season data is sourced from the official iRacing season PDF and
                  updated each new season
                </li>
                <li>
                  The site works fully offline once loaded — no account or login
                  required
                </li>
              </ul>
            </section>

            {/* Feedback */}
            <section>
              <h2 className="text-lg font-semibold text-white light-theme:text-gray-900 mb-3">
                Have a question or suggestion?
              </h2>
              <p>
                iRacing Calendar is open source. If you find a bug or have an
                idea for a new feature, open an issue on{" "}
                <a
                  href="https://github.com/Girgetto/iracing-calendar/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:text-red-400 transition-colors duration-200 underline underline-offset-2"
                >
                  GitHub
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
