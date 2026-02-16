"use client";

import Link from "next/link";
import type { SeasonMetadata } from "@/lib/types";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  metadata: SeasonMetadata;
}

export default function Header({ metadata }: HeaderProps) {
  return (
    <header className="border-b border-white/10 light-theme:border-gray-200 bg-gray-950/80 light-theme:bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
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
              <span className="text-xs text-gray-400 light-theme:text-gray-600 leading-tight transition-colors duration-300">
                {metadata.season}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-xs text-gray-400 light-theme:text-gray-600 transition-colors duration-300">
              <span className="hidden sm:inline">
                {metadata.weeks} weeks
              </span>
              <span className="hidden sm:inline text-gray-600 light-theme:text-gray-400">|</span>
              <span className="hidden sm:inline">
                Updated {new Date(metadata.lastUpdated).toLocaleDateString()}
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
