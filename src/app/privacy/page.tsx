import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSeasonData } from "@/lib/data";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://iracing-calendar.girgetto.it";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for iRacing Calendar. This site does not collect or store personal data.",
  alternates: { canonical: `${siteUrl}/privacy` },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const seasonData = getSeasonData();

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 light-theme:bg-white text-white light-theme:text-gray-900 transition-colors duration-300">
      <Header metadata={seasonData.metadata} />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold mb-2 text-white light-theme:text-gray-900">
            Privacy Policy
          </h1>
          <p className="text-xs text-gray-500 light-theme:text-gray-500 mb-10">
            Last updated: February 2026
          </p>

          <div className="space-y-8 text-sm text-gray-300 light-theme:text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-white light-theme:text-gray-900 mb-3">
                Overview
              </h2>
              <p>
                iRacing Calendar is a free, open-source tool for browsing the
                iRacing season schedule. This site does not collect, process, or
                store any personal data. No user accounts, no sign-up, no
                tracking.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white light-theme:text-gray-900 mb-3">
                Data we do not collect
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>No personal information (name, email, IP address)</li>
                <li>No analytics or tracking cookies</li>
                <li>No advertising or third-party tracking scripts</li>
                <li>No user accounts or authentication</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white light-theme:text-gray-900 mb-3">
                Local storage
              </h2>
              <p>
                Your preferences (owned cars and tracks, favourite series, theme
                choice) are saved exclusively in your browser&apos;s local
                storage. This data never leaves your device and is not
                accessible to us or any third party.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white light-theme:text-gray-900 mb-3">
                Hosting & server logs
              </h2>
              <p>
                This site is hosted on third-party infrastructure. Like most web
                servers, the hosting provider may automatically record standard
                access log data (such as IP addresses and requested URLs) for
                security and operational purposes. We do not have control over
                or access to these logs. Please refer to your hosting
                provider&apos;s privacy policy for details.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white light-theme:text-gray-900 mb-3">
                External links
              </h2>
              <p>
                This site links to GitHub and to the official iRacing website.
                These third-party sites have their own privacy policies and data
                practices, which we do not control.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white light-theme:text-gray-900 mb-3">
                Data sourcing
              </h2>
              <p>
                Season schedule data is sourced from the official iRacing season
                PDF. No user-submitted data is stored or used.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white light-theme:text-gray-900 mb-3">
                Open source
              </h2>
              <p>
                This project is fully open source. You can review the complete
                source code on{" "}
                <a
                  href="https://github.com/Girgetto/iracing-calendar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:text-red-400 transition-colors duration-200 underline underline-offset-2"
                >
                  GitHub
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white light-theme:text-gray-900 mb-3">
                Contact
              </h2>
              <p>
                If you have any questions about this policy, please open an
                issue on the{" "}
                <a
                  href="https://github.com/Girgetto/iracing-calendar/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:text-red-400 transition-colors duration-200 underline underline-offset-2"
                >
                  GitHub repository
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
