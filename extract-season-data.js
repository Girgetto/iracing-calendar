#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

// --- CLI Argument Parsing ---
const args = process.argv.slice(2);
let pdfPath = null;
let outputPath = path.join(__dirname, "data", "iracing-season-data.json");

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--output" || args[i] === "-o") {
    outputPath = args[++i];
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(`
Usage: node extract-season-data.js <pdf-file> [options]

Arguments:
  <pdf-file>              Path to the iRacing season PDF file

Options:
  --output, -o <path>     Output JSON file path (default: ./data/iracing-season-data.json)
  --help, -h              Show this help message

Examples:
  node extract-season-data.js season.pdf
  node extract-season-data.js season.pdf --output data/season.json
`);
    process.exit(0);
  } else if (!pdfPath) {
    pdfPath = args[i];
  }
}

if (!pdfPath) {
  console.error("Error: Please provide a PDF file path.");
  console.error("Usage: node extract-season-data.js <pdf-file>");
  process.exit(1);
}

// --- Utility Functions ---

function generateId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanDots(str) {
  return str.replace(/[\s.]*(?:\.\s*){3,}[\s\d.]*$/, "").trim();
}

function isTocLine(line) {
  if (/(?:\.\s+){3,}\d*\s*$/.test(line)) return true;
  if (/\.{3,}\s*\d*\s*$/.test(line)) return true;
  return false;
}

/**
 * Map PDF category names to display names.
 */
function mapCategory(raw) {
  const map = {
    OVAL: "Oval",
    "SPORTS CAR": "Sports Car",
    "FORMULA CAR": "Formula Car",
    "DIRT OVAL": "Dirt Oval",
    "DIRT ROAD": "Dirt Road",
    UNRANKED: "Unranked",
  };
  return map[raw.toUpperCase()] || raw;
}

/**
 * Extract category from a section header line.
 * Matches: "R Class Series (OVAL)", "D Class Series (SPORTS CAR)", etc.
 * Also matches standalone category lines like "OVAL", "SPORTS CAR", etc.
 */
function extractCategoryFromLine(line) {
  // Check for Class Series header: "X Class Series (CATEGORY)"
  const classMatch = line.match(
    /\(\s*(OVAL|SPORTS\s+CAR|FORMULA\s+CAR|DIRT\s+OVAL|DIRT\s+ROAD|UNRANKED)\s*\)/i
  );
  if (classMatch) return mapCategory(classMatch[1].trim());

  // Check for standalone category line: "OVAL", "SPORTS CAR", etc.
  const standalone = line.trim().toUpperCase();
  if (
    [
      "OVAL",
      "SPORTS CAR",
      "FORMULA CAR",
      "DIRT OVAL",
      "DIRT ROAD",
      "UNRANKED",
    ].includes(standalone)
  ) {
    return mapCategory(standalone);
  }

  return null;
}

function parseSeasonFromHeader(line) {
  // Match "YYYY Season N" or just "YYYY Season" (some series omit the number)
  const m = line.match(/(\d{4})\s+Season\s*(\d+)?/i);
  if (m) return { seasonYear: parseInt(m[1]), seasonNumber: m[2] ? parseInt(m[2]) : 1 };
  return null;
}

/**
 * Check if a line is a Class Series section header (reliable boundary marker).
 * Only matches "X Class Series (CATEGORY)" pattern, NOT standalone words like "Oval".
 */
function isClassSeriesHeader(line) {
  return /Class\s+Series\s+\(/i.test(line);
}

/**
 * Pre-process raw PDF text:
 * 1. Remove page separator blocks (page number + "-- N of M --")
 * 2. Remove standalone page numbers
 */
function preprocessText(text) {
  let lines = text.split("\n");
  const cleaned = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip page separator pattern: "-- N of M --"
    if (/^--\s*\d+\s+of\s+\d+\s*--$/.test(line.trim())) {
      continue;
    }

    // Skip standalone page numbers (just digits on a line)
    if (/^\s*\d{1,3}\s*$/.test(line) && line.trim().length <= 3) {
      continue;
    }

    cleaned.push(line);
  }

  return cleaned
    .map((l) => l.trimEnd())
    .filter((l, i, arr) => {
      // Remove consecutive blank lines (keep max 1)
      if (l.trim() === "" && i > 0 && arr[i - 1].trim() === "") return false;
      return true;
    });
}

/**
 * Parse a multi-line week block into a structured object.
 *
 * A week block looks like:
 *   Week 1 (2025-12-16) Charlotte Motor Speedway - Oval
 *   (2025-12-20 12:40 1x) 66°F/19°C, Rain chance None, Rolling
 *   start, Cautions disabled, Qual scrutiny
 *   - Permissive.
 *   15 laps
 *
 * Or with track name wrapping:
 *   Week 8 (2026-02-03) Misano World Circuit Marco Simoncelli - Grand
 *   Prix
 *   (2026-04-01 12:00 1x)
 *   70°F/21°C, Rain chance None, ...
 *   15 mins
 */
function parseWeekBlock(blockLines) {
  if (blockLines.length === 0) return null;

  // First line: Week N (YYYY-MM-DD) Track Name Start
  const firstLine = blockLines[0].trim();
  const weekMatch = firstLine.match(
    /^Week\s+(\d+)\s+\((\d{4}-\d{2}-\d{2})\)\s*(.*)$/i
  );
  if (!weekMatch) return null;

  const weekNum = parseInt(weekMatch[1]);
  const weekStartDate = weekMatch[2];
  let trackParts = [weekMatch[3].trim()];

  let lineIdx = 1;

  // Collect track name continuation lines (lines before the (date time) pattern)
  while (lineIdx < blockLines.length) {
    const line = blockLines[lineIdx].trim();
    // If this line starts with "(YYYY-MM-DD" it's the race datetime
    if (/^\(\d{4}-\d{2}-\d{2}/.test(line)) break;
    // If this line contains the race datetime pattern embedded
    if (/\(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}\s+\d+x\)/.test(line)) break;
    // This is continuation of track name
    trackParts.push(line);
    lineIdx++;
  }

  const track = trackParts.join(" ").trim();

  // Now parse race datetime and conditions
  let raceDateTime = null;
  let conditionParts = [];

  while (lineIdx < blockLines.length) {
    const line = blockLines[lineIdx].trim();

    // Try to extract race datetime: (YYYY-MM-DD HH:MM Nx)
    const raceDtMatch = line.match(
      /\((\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s+(\d+x)\)\s*(.*)/
    );
    if (raceDtMatch) {
      raceDateTime = `${raceDtMatch[1]}T${raceDtMatch[2]}:00Z`;
      if (raceDtMatch[4].trim()) {
        conditionParts.push(raceDtMatch[4].trim());
      }
      lineIdx++;
      break;
    }

    // Check if line is just "(date time)" without text after
    const raceDtOnlyMatch = line.match(
      /^\((\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s+(\d+x)\)\s*$/
    );
    if (raceDtOnlyMatch) {
      raceDateTime = `${raceDtOnlyMatch[1]}T${raceDtOnlyMatch[2]}:00Z`;
      lineIdx++;
      break;
    }

    lineIdx++;
  }

  // Remaining lines are conditions + duration
  while (lineIdx < blockLines.length) {
    conditionParts.push(blockLines[lineIdx].trim());
    lineIdx++;
  }

  // Join all condition text
  let conditionText = conditionParts.join(" ").trim();

  // Extract duration from the end: "NN laps" or "NN mins" or "NN min"
  let durationMins = null;
  let durationLaps = null;

  // Check for duration at end of conditions
  const durationMatch = conditionText.match(
    /\.?\s*(\d+)\s+(laps?|mins?)\s*$/i
  );
  if (durationMatch) {
    const val = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    if (unit.startsWith("lap")) {
      durationLaps = val;
    } else {
      durationMins = val;
    }
    // Remove duration from conditions
    conditionText = conditionText
      .slice(0, conditionText.lastIndexOf(durationMatch[0]))
      .trim();
    // Clean trailing period or comma
    conditionText = conditionText.replace(/[.,]\s*$/, "").trim();
  }

  // Clean up conditions: normalize whitespace
  conditionText = conditionText.replace(/\s+/g, " ").trim();

  // Compute dates
  const startDate = new Date(weekStartDate + "T00:00:00Z");
  const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);

  return {
    week: weekNum,
    track: track || "Unknown Track",
    trackId: generateId(track || "unknown"),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    ...(raceDateTime && { raceDateTime }),
    ...(conditionText && { conditions: conditionText }),
    ...(durationMins != null && { durationMins }),
    ...(durationLaps != null && { durationLaps }),
  };
}

/**
 * Extract all series from pre-processed PDF lines.
 */
function extractSeries(lines) {
  const series = [];
  let currentCategory = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Skip TOC lines (dot leaders)
    if (isTocLine(line)) {
      i++;
      continue;
    }

    // Check for category header
    const category = extractCategoryFromLine(line);
    if (category) {
      currentCategory = category;
      i++;
      continue;
    }

    // Detect series title: must contain "YYYY Season N" and NOT be a TOC line
    const seasonInfo = parseSeasonFromHeader(line);
    if (!seasonInfo) {
      i++;
      continue;
    }

    // This is a series title
    const rawName = cleanDots(line);
    const nameWithoutSeason = rawName
      .replace(/\s*-?\s*\d{4}\s+Season\s+\d+\s*$/i, "")
      .trim();

    // Extract region (e.g., "- Europe", "- America", "- Asia Pacific")
    let region = null;
    const regionMatch = nameWithoutSeason.match(
      /\s+-\s+(Europe|North America|South America|America|Americas|Asia Pacific|Asia|Oceania|Australia|Africa|International|Australian Servers)\s*$/i
    );
    if (regionMatch) {
      region = regionMatch[1];
    }

    i++;

    // --- Parse metadata lines in sequential order ---
    let car = null;
    let licenseRange = null;
    let raceFrequency = null;
    let drops = null;
    let penaltyInfo = null;

    // 2. Car (next line — short text, no special markers)
    // Car names can span multiple lines (comma-continued)
    if (
      i < lines.length &&
      lines[i].trim() &&
      !parseSeasonFromHeader(lines[i]) &&
      !/^Week\s+\d+/i.test(lines[i]) &&
      !extractCategoryFromLine(lines[i].trim())
    ) {
      const carLine = lines[i].trim();
      if (
        !isTocLine(carLine) &&
        !/-->/i.test(carLine) &&
        !/->/.test(carLine) &&
        !/\u2192/.test(carLine) &&
        !/^Races?\s+every/i.test(carLine) &&
        !/^Race every/i.test(carLine) &&
        !/^\d+\s+Timeslots/i.test(carLine) &&
        !/Min entries/i.test(carLine) &&
        !/Penalty/i.test(carLine) &&
        !/No incident/i.test(carLine)
      ) {
        let carParts = [carLine];
        i++;
        // Collect continuation lines (lines ending with comma suggest more car names)
        while (
          i < lines.length &&
          carParts[carParts.length - 1].endsWith(",") &&
          lines[i].trim() &&
          !parseSeasonFromHeader(lines[i]) &&
          !/^Week\s+\d+/i.test(lines[i]) &&
          !/-->/i.test(lines[i]) &&
          !/->/.test(lines[i]) &&
          !/^Races?\s+every/i.test(lines[i].trim()) &&
          !/^\d+\s+Timeslots/i.test(lines[i].trim()) &&
          !/Min entries/i.test(lines[i])
        ) {
          carParts.push(lines[i].trim());
          i++;
        }
        car = cleanDots(carParts.join(" "));
      }
    }

    // 3. License range: contains "-->"
    if (
      i < lines.length &&
      lines[i].trim() &&
      !parseSeasonFromHeader(lines[i]) &&
      !/^Week\s+\d+/i.test(lines[i])
    ) {
      const rangeLine = lines[i].trim();
      if (/-->/.test(rangeLine) || /\u2192/.test(rangeLine) || /->/.test(rangeLine)) {
        licenseRange = cleanDots(rangeLine);
        i++;
      }
    }

    // 4. Frequency: "Races every...", "Races N past every...", "Race every...", "N Timeslots Per Week"
    if (
      i < lines.length &&
      lines[i].trim() &&
      !parseSeasonFromHeader(lines[i]) &&
      !/^Week\s+\d+/i.test(lines[i])
    ) {
      const freqLine = lines[i].trim();
      if (
        /^Races?\s/i.test(freqLine) ||
        /^Race every/i.test(freqLine) ||
        /Timeslots?\s+Per\s+Week/i.test(freqLine)
      ) {
        raceFrequency = cleanDots(freqLine);
        i++;
      }
    }

    // 5. Min entries / splits / drops
    if (
      i < lines.length &&
      lines[i].trim() &&
      !parseSeasonFromHeader(lines[i]) &&
      !/^Week\s+\d+/i.test(lines[i])
    ) {
      const entriesLine = lines[i].trim();
      if (/Min entries/i.test(entriesLine) || /Drops:/i.test(entriesLine)) {
        const dropsMatch = entriesLine.match(/Drops:\s*(\d+)/i);
        if (dropsMatch) drops = parseInt(dropsMatch[1]);
        i++;
      }
    }

    // 6. Penalty / DQ / incident info
    if (
      i < lines.length &&
      lines[i].trim() &&
      !parseSeasonFromHeader(lines[i]) &&
      !/^Week\s+\d+/i.test(lines[i])
    ) {
      const penaltyLine = lines[i].trim();
      if (
        /Penalty/i.test(penaltyLine) ||
        /DQ/i.test(penaltyLine) ||
        /incident/i.test(penaltyLine) ||
        /No incident/i.test(penaltyLine)
      ) {
        penaltyInfo = cleanDots(penaltyLine);
        i++;
      }
    }

    // Skip any remaining non-week lines before weeks start
    while (
      i < lines.length &&
      lines[i].trim() &&
      !parseSeasonFromHeader(lines[i]) &&
      !/^Week\s+\d+/i.test(lines[i]) &&
      !isClassSeriesHeader(lines[i]) &&
      !isTocLine(lines[i])
    ) {
      i++;
    }

    // 7. Parse week blocks (multi-line)
    const schedule = [];
    let currentWeekLines = [];

    while (i < lines.length) {
      const wLine = lines[i].trim();

      // Stop conditions: hit next series, class series header, or TOC
      if (!wLine) {
        i++;
        continue;
      }
      if (
        parseSeasonFromHeader(wLine) &&
        !isTocLine(wLine) &&
        !/^Week\s+\d+/i.test(wLine)
      ) {
        break;
      }
      // Use strict isClassSeriesHeader check here, NOT extractCategoryFromLine,
      // because standalone words like "Oval" can appear as wrapped track names
      if (isClassSeriesHeader(wLine) && !isTocLine(wLine)) {
        break;
      }
      if (isTocLine(wLine)) {
        break;
      }

      // Check if this is the start of a new week
      if (/^Week\s+\d+\s+\(/i.test(wLine)) {
        // Flush previous week block
        if (currentWeekLines.length > 0) {
          const week = parseWeekBlock(currentWeekLines);
          if (week) schedule.push(week);
        }
        currentWeekLines = [wLine];
        i++;
        continue;
      }

      // Continuation of current week block
      if (currentWeekLines.length > 0) {
        currentWeekLines.push(wLine);
        i++;
        continue;
      }

      // Not in a week block yet and not a week start — skip
      i++;
    }

    // Flush last week block
    if (currentWeekLines.length > 0) {
      const week = parseWeekBlock(currentWeekLines);
      if (week) schedule.push(week);
    }

    if (schedule.length === 0) continue;

    series.push({
      id: generateId(nameWithoutSeason),
      name: nameWithoutSeason,
      category: currentCategory || "Uncategorized",
      ...(region && { region }),
      ...(car && { car }),
      ...(licenseRange && { licenseRange }),
      ...(raceFrequency && { raceFrequency }),
      ...(drops != null && { drops }),
      schedule,
    });
  }

  return series;
}

// --- Main ---
async function extractSeasonData(filePath) {
  console.log("=== iRacing Season Data Extractor ===\n");

  const resolvedPath = path.resolve(filePath);
  console.log(`Input PDF: ${resolvedPath}`);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const stat = fs.statSync(resolvedPath);
  console.log(`   File size: ${(stat.size / 1024).toFixed(1)} KB`);

  console.log("\nParsing PDF...");
  const dataBuffer = fs.readFileSync(resolvedPath);
  const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });

  const info = await parser.getInfo();
  const textResult = await parser.getText();
  const pdfText = textResult.text;

  console.log(`   Pages: ${info.numPages}`);
  console.log(`   Text length: ${pdfText.length} characters`);

  // Write raw text for debugging
  const debugPath = resolvedPath.replace(/\.pdf$/i, ".debug.txt");
  fs.writeFileSync(debugPath, pdfText, "utf-8");
  console.log(`   Debug text saved to: ${debugPath}`);

  // Pre-process text: remove page separators and clean up
  const cleanedLines = preprocessText(pdfText);
  console.log(`   Cleaned lines: ${cleanedLines.length}`);

  // Detect season
  const seasonMatch = pdfText.match(/(\d{4})\s+Season\s+(\d+)/i);
  const seasonYear = seasonMatch
    ? parseInt(seasonMatch[1])
    : new Date().getFullYear();
  const seasonNumber = seasonMatch ? parseInt(seasonMatch[2]) : 1;
  console.log(`\nDetected season: ${seasonYear} Season ${seasonNumber}`);

  // Extract series
  console.log("\nExtracting series...");
  const series = extractSeries(cleanedLines);

  console.log(`   Found ${series.length} series`);
  for (const s of series) {
    const regionTag = s.region ? ` [${s.region}]` : "";
    const carTag = s.car ? ` (${s.car})` : "";
    console.log(
      `   - ${s.name}${regionTag}${carTag} [${s.category}]: ${s.schedule.length} weeks`
    );
  }

  // Build output
  const output = {
    metadata: {
      season: `${seasonYear} Season ${seasonNumber}`,
      seasonNumber,
      seasonYear,
      lastUpdated: new Date().toISOString(),
      weeks:
        series.length > 0
          ? Math.max(...series.map((s) => s.schedule.length))
          : 0,
    },
    series,
  };

  // Validate
  console.log("\nValidating...");
  let totalWeeks = 0;
  for (const s of output.series) {
    if (!s.id || !s.name || !s.category || !Array.isArray(s.schedule)) {
      throw new Error(`Invalid series: ${s.name || "unknown"}`);
    }
    for (const w of s.schedule) {
      if (!w.week || !w.track || !w.startDate) {
        throw new Error(`Invalid week in ${s.name}: week ${w.week}`);
      }
    }
    totalWeeks += s.schedule.length;
  }
  console.log("   Valid.");

  // Ensure output directory exists
  const resolvedOutput = path.resolve(outputPath);
  const outputDir = path.dirname(resolvedOutput);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Backup existing file
  if (fs.existsSync(resolvedOutput)) {
    const backupPath = resolvedOutput.replace(
      ".json",
      `.backup-${Date.now()}.json`
    );
    fs.copyFileSync(resolvedOutput, backupPath);
    console.log(`\nBacked up to: ${path.basename(backupPath)}`);
  }

  // Write
  const jsonString = JSON.stringify(output, null, 2);
  fs.writeFileSync(resolvedOutput, jsonString, "utf-8");
  console.log(`\nOutput written to: ${resolvedOutput}`);
  console.log(
    `   JSON size: ${(Buffer.byteLength(jsonString) / 1024).toFixed(1)} KB`
  );
  console.log(`   Series: ${output.series.length}`);
  console.log(`   Total weeks: ${totalWeeks}`);

  parser.destroy();
  return output;
}

extractSeasonData(pdfPath).catch((err) => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});
