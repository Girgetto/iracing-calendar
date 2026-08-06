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

## Keeping the calendar up to date (automatic)

`data/iracing-season-data.json` is refreshed automatically from the **official
iRacing season schedule PDF**, which iRacing publishes at a stable, public,
unauthenticated URL:

```
https://members-assets.iracing.com/public/schedulepdf/SeasonSchedule.pdf
```

The filename contains no season, so the same URL always serves the current one
— the calendar **rolls over on its own when a new season starts**. No iRacing
credentials are involved.

```bash
# Download, parse, validate, and update the data file if anything changed
npm run sync-pdf

# See what would change without writing
npm run sync-pdf -- --dry-run

# Parse a PDF you already have
npm run sync-pdf -- --pdf path/to/SeasonSchedule.pdf
```

`.github/workflows/update-season-data.yml` runs this daily and commits the data
file when it changes.

Because PDF parsing is more brittle than a JSON API, `sync-season-pdf.js`
refuses to write when the result looks wrong — too few series, series with no
schedule, unparseable dates, a sudden collapse in series count, or a season
that moves backwards. **A layout change fails the workflow loudly instead of
committing a broken calendar.**

## Syncing from the official iRacing Data API (currently unavailable)

The canonical source of truth for series and schedules is the official
[iRacing Data API](https://members-ng.iracing.com). `sync-season-data.js` can
pull the current season directly from it instead of parsing a PDF by hand.

> **Heads up — OAuth required.** iRacing **retired legacy username/password
> authentication** with the 2026 Season 1 release (2025-12-09); the old
> `members-ng.iracing.com/auth` endpoint now returns HTTP 405. API access now
> requires an **OAuth2 client** (`client_id` + `client_secret`) registered at
> [oauth.iracing.com/accountmanagement](https://oauth.iracing.com/accountmanagement).
> iRacing has **temporarily paused issuing new client IDs** while they review
> third-party usage. **This path is therefore dormant** — the project syncs from
> the [public schedule PDF](#keeping-the-calendar-up-to-date-automatic) instead,
> which needs no credentials. `sync-season-data.js` is kept ready for the day
> registration reopens.

```bash
# Fetch the current season and update data/iracing-season-data.json if changed
IRACING_CLIENT_ID=... IRACING_CLIENT_SECRET=... \
IRACING_EMAIL=you@example.com IRACING_PASSWORD=secret \
  npm run sync-data

# Just check whether anything changed (no write)
npm run sync-data -- --dry-run

# Transform a previously-saved API response (no credentials needed — handy for testing)
npm run sync-data -- --from-json path/to/series-seasons.json
```

How it works:

- Authenticates via the OAuth2 `password_limited` grant against
  `POST https://oauth.iracing.com/oauth2/token`. Secrets are never sent in
  clear text — each is masked as `base64(sha256(secret + id))` (the
  `client_secret` with the `client_id`, the password with the email).
- Calls `GET /data/series/seasons?include_series=true` (and `/data/carclass/get`
  for car names) with the resulting `Bearer` token, following the signed S3
  `link` each endpoint returns.
- Transforms the response into the same JSON shape produced by the PDF
  extractor and writes the file **only when the content actually changes**.

### Activating it once OAuth reopens

`.github/workflows/update-season-data.yml` no longer uses this path — it syncs
from the public PDF instead. To switch back once you have a client, set these
repository secrets (Settings → Secrets and variables → Actions) and point the
workflow's sync step at `sync-season-data.js`:

| Secret | Description |
|--------|-------------|
| `IRACING_CLIENT_ID` | OAuth client id |
| `IRACING_CLIENT_SECRET` | OAuth client secret |
| `IRACING_EMAIL` | iRacing account email |
| `IRACING_PASSWORD` | iRacing account password |

### Watching for OAuth registration to reopen

Because iRacing announces the reopening only on their forums and in release
notes, `.github/workflows/watch-iracing-oauth.yml` polls the two doc pages that
carry the pause notice every Monday and **opens an issue when the notice
disappears**. Run it by hand any time:

```bash
npm run check-oauth
```

Exit codes: `0` still paused, `3` notice gone (may be open), `1` indeterminate
(page moved or unreachable). The check is text-based, so confirm on
[oauth.iracing.com/accountmanagement](https://oauth.iracing.com/accountmanagement)
before acting — iRacing may simply have reworded the page.

## Updating from a PDF by hand

Normally you don't need this — `npm run sync-pdf` fetches the current PDF for
you. Use this only to parse a PDF the public URL doesn't serve (an older
season, or a copy from the forums):

1. Run the extraction script: `npm run extract-data -- path/to/season.pdf`
2. Review the generated `data/iracing-season-data.json`
3. Rebuild or restart the dev server

Note this writes the data file directly, with none of the validation guards
`sync-season-pdf.js` applies.

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
| `npm run sync-data` | Sync data from the official iRacing Data API |

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
