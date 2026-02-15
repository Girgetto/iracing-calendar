# iRacing Season Calendar

A Next.js web application for browsing iRacing season schedules. Includes a PDF extraction script to generate structured data from official iRacing season PDFs.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the calendar.

## Extracting Data from a Season PDF

Use the extraction script to convert an iRacing season PDF into the JSON data file:

```bash
# Basic usage
node extract-season-data.js path/to/iracing-season.pdf

# Custom output path
node extract-season-data.js path/to/iracing-season.pdf --output data/custom-output.json
```

The script parses the PDF, extracts series and track data, and writes `iracing-season-data.json` to the project root. The app reads this file at build time.

## Updating for a New Season

1. Download the new season PDF from iRacing
2. Run the extraction script: `npm run extract-data -- path/to/new-season.pdf`
3. Review the generated `iracing-season-data.json`
4. Rebuild or restart the dev server

## Project Structure

```
iracing-calendar/
├── extract-season-data.js      # PDF parsing script
├── iracing-season-data.json    # Generated season data (committed)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Series list (home page)
│   │   ├── not-found.tsx       # 404 page
│   │   ├── globals.css         # Global styles
│   │   └── series/
│   │       └── [id]/
│   │           └── page.tsx    # Series detail page
│   ├── components/
│   │   ├── Header.tsx          # Navigation header
│   │   ├── Footer.tsx          # Page footer
│   │   ├── SearchBar.tsx       # Search input + category filters + view toggle
│   │   ├── SeriesCard.tsx      # Individual series card (grid & list)
│   │   ├── SeriesList.tsx      # Series grid/list container
│   │   └── SeriesDetail.tsx    # Full schedule view for a series
│   └── lib/
│       ├── types.ts            # TypeScript type definitions
│       ├── data.ts             # Data loading and filtering
│       └── utils.ts            # Date formatting, week status, colors
├── package.json
├── next.config.ts
├── tsconfig.json
└── tailwind.config.ts (if present)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run extract-data -- <pdf>` | Extract data from a season PDF |

## Dependencies

- **Next.js** — React framework with App Router
- **Tailwind CSS** — Utility-first CSS
- **pdf-parse** — PDF text extraction for the data script
- **TypeScript** — Type safety

## Features

- Series list with grid and list view modes
- Category filtering (Road / Oval / Dirt)
- Search across series names and tracks
- Detailed week-by-week schedule per series
- Current week indicator with visual timeline
- Past/current/upcoming week status
- Responsive design for mobile and desktop
- Static generation for fast loading
