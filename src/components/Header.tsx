"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SeasonMetadata } from "@/lib/types";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  metadata: SeasonMetadata;
  currentWeek?: number | null;
}

export default function Header({ metadata, currentWeek }: HeaderProps) {
  const pathname = usePathname();
  const isCalendar = pathname === "/calendar";

  return (
    <header className="border-b border-white/10 light-theme:border-gray-200 bg-slate-900/80 light-theme:bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 font-bold text-white text-sm transition-transform group-hover:scale-105">
              iR
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white light-theme:text-gray-900 leading-tight transition-colors duration-300">
                iRacing Calendar
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 light-theme:text-gray-600 leading-tight transition-colors duration-300">
                  {metadata.season}
                </span>
                {currentWeek && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 light-theme:bg-red-100 px-1.5 py-0.5 text-[9px] font-medium text-red-400 light-theme:text-red-700 border border-red-500/30 light-theme:border-red-300 transition-colors duration-300">
                    <span className="h-1 w-1 rounded-full bg-red-400 light-theme:bg-red-600 animate-pulse" />
                    W{currentWeek}
                  </span>
                )}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* My Calendar nav link */}
            <Link
              href="/calendar"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
                isCalendar
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-slate-800/60 hover:bg-slate-700 light-theme:bg-gray-100 light-theme:hover:bg-gray-200 border border-white/10 light-theme:border-gray-300 text-slate-300 hover:text-white light-theme:text-gray-700 light-theme:hover:text-gray-900"
              }`}
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden sm:inline">My Calendar</span>
            </Link>

            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400 light-theme:text-gray-600 transition-colors duration-300">
              <span>{metadata.weeks} weeks</span>
              <span className="text-slate-600 light-theme:text-gray-400">|</span>
              <span>
                Updated {new Date(metadata.lastUpdated).toLocaleDateString()}
              </span>
            </div>
            <a
              href="https://github.com/Girgetto/iracing-calendar"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 light-theme:text-gray-600 hover:text-white light-theme:hover:text-gray-900 transition-colors duration-200"
            >
              <svg
                height="16"
                width="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span>GitHub</span>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
