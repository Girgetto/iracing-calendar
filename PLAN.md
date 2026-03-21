# Plan: Past Seasons Feature

## Problem
Currently the app only displays one season at a time (`data/iracing-season-data.json`). Users want to browse schedules from older/past seasons.

## Current Architecture
- **Data**: Single JSON file at `data/iracing-season-data.json` (currently "2026 Season 2")
- **Data layer** (`src/lib/data.ts`): Loads that single JSON, caches it, exposes `getSeasonData()`, `getAllSeries()`, etc.
- **Extraction**: `extract-season-data.js` parses a PDF and writes to `data/iracing-season-data.json`
- **UI**: `HomePageContent` receives season data as props, displays season name in banner and header
- **Routing**: No concept of season switching; home page (`/`) always shows the current season

## Proposed Solution

### 1. Multi-season data storage
**File**: `data/` directory
- Rename convention: `data/seasons/<year>-s<number>.json` (e.g., `data/seasons/2026-s2.json`, `data/seasons/2025-s4.json`)
- Keep `data/iracing-season-data.json` as the **current/latest** season (backward compatible)
- Add a manifest file `data/seasons/index.json` listing all available seasons with metadata:
  ```json
  {
    "seasons": [
      { "id": "2026-s2", "label": "2026 Season 2", "year": 2026, "number": 2, "current": true },
      { "id": "2025-s4", "label": "2025 Season 4", "year": 2025, "number": 4, "current": false }
    ]
  }
  ```

### 2. Update extract script
**File**: `extract-season-data.js`
- After extracting, also save a copy to `data/seasons/<year>-s<number>.json`
- Update `data/seasons/index.json` manifest automatically
- Add `--archive` flag to import a past season PDF without overwriting the current season data

### 3. Data layer changes
**File**: `src/lib/data.ts`
- Add `getAvailableSeasons()` — reads the manifest and returns the list of seasons
- Add `getSeasonDataById(seasonId: string)` — loads a specific season's JSON
- Keep existing `getSeasonData()` working (loads current season, backward compatible)

### 4. URL-based season selection
**File**: `src/app/page.tsx`
- Accept an optional `?season=2025-s4` query parameter
- Pass the selected season's data to `HomePageContent`
- Default to the current/latest season when no parameter is provided

### 5. Season Selector UI component
**New file**: `src/components/SeasonSelector.tsx`
- Dropdown/select component showing all available seasons
- Current season gets a "Current" badge
- Past seasons show as selectable options, sorted newest-first
- Changing selection updates the `?season=` URL param
- Visually indicate when viewing a past season (e.g., a banner: "You are viewing a past season")

### 6. Integrate Season Selector into the page
**Files**: `src/components/HomePageContent.tsx`, `src/components/Header.tsx`
- Add the `SeasonSelector` to the season banner area in `HomePageContent`
- When viewing a past season, hide the "live" week indicator (no current week for past seasons)
- Update the header to reflect the selected season's metadata

### 7. Update series detail page
**File**: `src/app/series/[id]/page.tsx`
- Accept `?season=` query param to load the correct season's series data
- Pass season context through so links back to the home page preserve the season selection

### 8. Types update
**File**: `src/lib/types.ts`
- Add `SeasonSummary` type for the manifest entries:
  ```ts
  export interface SeasonSummary {
    id: string;
    label: string;
    year: number;
    number: number;
    current: boolean;
  }
  ```

## Implementation Order
1. Types update (`types.ts`)
2. Create `data/seasons/` directory structure and manifest
3. Update `extract-season-data.js` to support archiving
4. Data layer changes (`data.ts`)
5. Season Selector component (`SeasonSelector.tsx`)
6. Integrate into `HomePageContent` and `Header`
7. Update `page.tsx` (home) to handle `?season=` param
8. Update `series/[id]/page.tsx` for season context

## Out of Scope (Future Enhancements)
- Season comparison (diff two seasons side by side)
- Automatic archiving via CI/CD when a new season starts
- Per-series history across seasons
