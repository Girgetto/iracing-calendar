/**
 * sync-season-pdf.js
 *
 * Credential-free season sync.
 *
 * iRacing publishes the current season's official schedule PDF at a stable,
 * public, unauthenticated URL:
 *
 *   https://members-assets.iracing.com/public/schedulepdf/SeasonSchedule.pdf
 *
 * The filename carries no season in it, so the same URL rolls over on its own
 * when a new season starts. That makes the PDF route fully automatable — no
 * OAuth client, no API credentials, nothing to wait on iRacing for.
 *
 * This script downloads that PDF, runs the existing extract-season-data.js
 * over it, sanity-checks the result, and updates data/iracing-season-data.json
 * only when the content actually changed.
 *
 * Because PDF layout parsing is more brittle than a JSON API, the guards below
 * are deliberately strict: a layout change should fail loudly rather than
 * quietly commit a half-parsed calendar.
 *
 * Usage:
 *   node sync-season-pdf.js               # fetch, validate, write if changed
 *   node sync-season-pdf.js --dry-run     # fetch and report, never write
 *   node sync-season-pdf.js --pdf <path>  # use a local PDF instead of fetching
 *   node sync-season-pdf.js --output <p>  # write somewhere else
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const SCHEDULE_PDF_URL =
  "https://members-assets.iracing.com/public/schedulepdf/SeasonSchedule.pdf";

const DOWNLOAD_TIMEOUT_MS = 60_000;

/** A truncated download or a login/error page instead of a PDF. */
const MIN_PDF_BYTES = 100_000;

/**
 * Guards against a partial parse. The real seasons run ~140-150 series; a
 * layout change that breaks the row parser typically yields far fewer.
 */
const MIN_SERIES = 100;
const MIN_SERIES_RATIO_VS_EXISTING = 0.6;

// --- CLI -----------------------------------------------------------------

const args = process.argv.slice(2);
let dryRun = false;
let localPdf = null;
let outputPath = path.join(__dirname, "data", "iracing-season-data.json");

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--dry-run" || arg === "-n") dryRun = true;
  else if (arg === "--pdf") localPdf = args[++i];
  else if (arg === "--output" || arg === "-o") outputPath = args[++i];
  else if (arg === "--help" || arg === "-h") {
    console.log(`
Usage: node sync-season-pdf.js [options]

Downloads the official iRacing season schedule PDF from its public URL and
updates data/iracing-season-data.json only when the content changes.

Options:
  --dry-run, -n       Report what would change without writing
  --pdf <path>        Use a local PDF instead of downloading
  --output, -o <path> Output JSON file (default: ./data/iracing-season-data.json)
  --help, -h          Show this help

Source: ${SCHEDULE_PDF_URL}
`);
    process.exit(0);
  }
}

// --- Steps ---------------------------------------------------------------

async function downloadPdf(destination) {
  console.log(`Downloading ${SCHEDULE_PDF_URL}`);

  const res = await fetch(SCHEDULE_PDF_URL, {
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    headers: { "User-Agent": "iracing-calendar-season-sync" },
  });

  if (!res.ok) {
    throw new Error(
      `Download failed: HTTP ${res.status} ${res.statusText}. ` +
        "iRacing may have moved the public schedule PDF."
    );
  }

  const bytes = Buffer.from(await res.arrayBuffer());

  if (bytes.length < MIN_PDF_BYTES) {
    throw new Error(
      `Downloaded only ${bytes.length} bytes — too small to be the schedule ` +
        "PDF (truncated download, or an error page was served)."
    );
  }
  if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new Error("Downloaded file is not a PDF (missing %PDF- header).");
  }

  fs.writeFileSync(destination, bytes);
  const lastModified = res.headers.get("last-modified");
  console.log(
    `   ${(bytes.length / 1024).toFixed(1)} KB` +
      (lastModified ? ` (last modified ${lastModified})` : "")
  );
  return destination;
}

/** Run the existing extractor, which owns all PDF parsing. */
function extract(pdfPath, jsonPath) {
  console.log("Extracting schedule...");
  execFileSync(
    process.execPath,
    [path.join(__dirname, "extract-season-data.js"), pdfPath, "--output", jsonPath],
    { stdio: ["ignore", "ignore", "inherit"] }
  );
  return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
}

/** Ordinal for comparing seasons, e.g. 2026 Season 3 -> 20263. */
function seasonRank(metadata) {
  return metadata.seasonYear * 10 + metadata.seasonNumber;
}

/**
 * Share of parsed series that are "13th Week" entries.
 *
 * Between seasons iRacing keeps serving the same public URL but swaps the
 * contents for the 13th Week (off-season) schedule: it still carries the
 * OUTGOING season's name, lists a fraction of the series, and contains none of
 * the next season's races. A full season schedule has no 13th Week series at
 * all, so the share is a clean separator.
 */
function thirteenthWeekShare(series) {
  if (series.length === 0) return 0;
  const count = series.filter((s) => /13th\s+week/i.test(s.name)).length;
  return count / series.length;
}

/**
 * Treat the download as the off-season schedule rather than a season.
 *
 * Deliberately well below the ~0.68 share the real 13th Week PDF produces, and
 * far above the 0 a full season produces, so neither case is a near miss.
 */
const THIRTEENTH_WEEK_SHARE_THRESHOLD = 0.25;

/**
 * Refuse to publish a result that looks like a broken parse or a regression.
 * @param {object} data     Freshly parsed season data.
 * @param {object|null} existing  Currently committed data, if any.
 */
function validate(data, existing) {
  const problems = [];
  const { metadata, series } = data;

  if (!metadata || !Array.isArray(series)) {
    throw new Error("Parsed output is missing metadata or series.");
  }

  if (!/^\d{4} Season [1-4]$/.test(metadata.season || "")) {
    problems.push(`metadata.season looks wrong: ${JSON.stringify(metadata.season)}`);
  }
  if (!(metadata.weeks > 0)) {
    problems.push(`metadata.weeks is ${metadata.weeks}`);
  }
  if (series.length < MIN_SERIES) {
    problems.push(`only ${series.length} series parsed (expected >= ${MIN_SERIES})`);
  }

  const emptySchedules = series.filter((s) => !s.schedule || s.schedule.length === 0);
  if (emptySchedules.length > 0) {
    problems.push(
      `${emptySchedules.length} series have no schedule weeks ` +
        `(e.g. ${emptySchedules[0].name})`
    );
  }

  const badDates = series.flatMap((s) =>
    (s.schedule || []).filter(
      (w) => Number.isNaN(Date.parse(w.startDate)) || Number.isNaN(Date.parse(w.endDate))
    )
  );
  if (badDates.length > 0) {
    problems.push(`${badDates.length} schedule weeks have unparseable dates`);
  }

  if (existing) {
    const floor = Math.floor(existing.series.length * MIN_SERIES_RATIO_VS_EXISTING);
    if (series.length < floor) {
      problems.push(
        `series count dropped from ${existing.series.length} to ${series.length} ` +
          "— suspicious, refusing to overwrite"
      );
    }
    if (seasonRank(metadata) < seasonRank(existing.metadata)) {
      problems.push(
        `season went backwards: ${existing.metadata.season} -> ${metadata.season}`
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(
      "Validation failed — not writing:\n  - " + problems.join("\n  - ")
    );
  }
}

/** Stable stringify ignoring metadata.lastUpdated, which always changes. */
function comparable(data) {
  const clone = JSON.parse(JSON.stringify(data));
  if (clone.metadata) delete clone.metadata.lastUpdated;
  return JSON.stringify(clone);
}

function readExisting(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
}

// --- Main ----------------------------------------------------------------

async function main() {
  console.log("=== iRacing Season Data Sync (public PDF) ===\n");

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "iracing-sync-"));
  const pdfPath = localPdf || path.join(workDir, "SeasonSchedule.pdf");
  const scratchJson = path.join(workDir, "parsed.json");

  try {
    if (localPdf) {
      console.log(`Using local PDF: ${localPdf}`);
    } else {
      await downloadPdf(pdfPath);
    }

    const data = extract(pdfPath, scratchJson);
    const resolvedOutput = path.resolve(outputPath);
    const existing = readExisting(resolvedOutput);

    // Check this BEFORE validate(): the off-season schedule trips the same
    // "too few series" guards a broken parse does, and the two must not be
    // reported the same way. Between seasons there is simply nothing new to
    // publish, so keep the committed calendar and exit cleanly.
    const offSeasonShare = thirteenthWeekShare(data.series);
    if (offSeasonShare >= THIRTEENTH_WEEK_SHARE_THRESHOLD) {
      console.log(
        `\nPublished PDF is the 13th Week (off-season) schedule for ` +
          `${data.metadata.season} — ${Math.round(offSeasonShare * 100)}% of ` +
          `its ${data.series.length} series are 13th Week entries.`
      );
      console.log(
        "Keeping the committed calendar until iRacing publishes the next " +
          "full season."
      );
      return;
    }

    validate(data, existing);
    console.log(
      `\nParsed ${data.series.length} series (${data.metadata.season}).`
    );

    if (existing && comparable(existing) === comparable(data)) {
      console.log("\nNo changes — data is already up to date.");
      return;
    }

    if (existing && existing.metadata.season !== data.metadata.season) {
      console.log(
        `\nNew season detected: ${existing.metadata.season} -> ${data.metadata.season}`
      );
    }

    if (dryRun) {
      console.log("\nChanges detected (dry-run: not writing).");
      console.log("::changed::");
      return;
    }

    fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
    const json = JSON.stringify(data, null, 2) + "\n";
    fs.writeFileSync(resolvedOutput, json, "utf-8");
    console.log(`\nUpdated ${resolvedOutput}`);
    console.log(`   ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB`);
    console.log("::changed::");
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});
