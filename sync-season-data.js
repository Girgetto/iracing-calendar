#!/usr/bin/env node

/**
 * sync-season-data.js
 * -------------------
 * Fetches the current iRacing season schedule from the official iRacing
 * Data API (the source of truth) and updates data/iracing-season-data.json
 * to match the same shape produced by extract-season-data.js.
 *
 * Source of truth:
 *   - Token:    POST https://oauth.iracing.com/oauth2/token  (OAuth2)
 *   - Seasons:  GET  https://members-ng.iracing.com/data/series/seasons?include_series=true
 *   - Car class names: GET https://members-ng.iracing.com/data/carclass/get
 *
 * iRacing's /data endpoints respond with a short-lived signed S3 "link"; the
 * actual payload must be fetched from that URL (no auth header on the S3 GET).
 *
 * Authentication uses the OAuth2 "password_limited" grant. iRacing retired the
 * legacy email/password endpoint (members-ng.iracing.com/auth) with the 2026
 * Season 1 release (2025-12-09); it now returns HTTP 405. OAuth2 requires a
 * registered client (client_id + client_secret) issued via
 * https://oauth.iracing.com/accountmanagement.
 *
 * Neither secret is sent in clear text — each is masked as
 * base64(sha256(secret + normalized_id)) where normalized_id = id.trim().toLowerCase():
 *   - client_secret is masked with the client_id
 *   - password is masked with the email (username)
 *
 * Environment variables:
 *   IRACING_CLIENT_ID      OAuth client id (required for live fetch)
 *   IRACING_CLIENT_SECRET  OAuth client secret (required for live fetch)
 *   IRACING_EMAIL          iRacing account email (required for live fetch)
 *   IRACING_PASSWORD       iRacing account password (required for live fetch)
 *   IRACING_SCOPE          OAuth scope (optional, default "iracing.auth")
 *
 * Usage:
 *   node sync-season-data.js                 # fetch live, write if changed
 *   node sync-season-data.js --dry-run       # fetch live, report diff, no write
 *   node sync-season-data.js --from-json f   # transform a saved API response (testing)
 *   node sync-season-data.js --output path   # custom output file
 *
 * Exit codes:
 *   0  success, file already up to date (no change written)
 *   0  success, file updated  (also prints "::changed::" marker for CI)
 *   1  error
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// --- CLI parsing ---------------------------------------------------------
const args = process.argv.slice(2);
let outputPath = path.join(__dirname, "data", "iracing-season-data.json");
let dryRun = false;
let fromJson = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--output" || args[i] === "-o") {
    outputPath = args[++i];
  } else if (args[i] === "--dry-run") {
    dryRun = true;
  } else if (args[i] === "--from-json") {
    fromJson = args[++i];
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(`
Usage: node sync-season-data.js [options]

Fetches the current iRacing season schedule from the official iRacing Data API
and updates data/iracing-season-data.json only when the content changes.

Options:
  --output, -o <path>   Output JSON file (default: ./data/iracing-season-data.json)
  --dry-run             Fetch and compare, but do not write the file
  --from-json <path>    Transform a saved series/seasons API response instead of
                        fetching live (useful for testing without credentials)
  --help, -h            Show this help

Environment (required for live fetch):
  IRACING_CLIENT_ID, IRACING_CLIENT_SECRET   OAuth2 client credentials
  IRACING_EMAIL, IRACING_PASSWORD            iRacing account login
  IRACING_SCOPE                              OAuth scope (default: iracing.auth)
`);
    process.exit(0);
  }
}

const API_BASE = "https://members-ng.iracing.com";
const OAUTH_TOKEN_URL = "https://oauth.iracing.com/oauth2/token";

// --- iRacing Data API client --------------------------------------------

/**
 * Mask a secret exactly as the iRacing OAuth service expects:
 * base64( sha256( secret + id.trim().toLowerCase() ) ).
 *   - password:      secret = password,      id = email (username)
 *   - client_secret: secret = client_secret, id = client_id
 */
function maskSecret(secret, id) {
  const hash = crypto
    .createHash("sha256")
    .update(secret + id.trim().toLowerCase())
    .digest();
  return hash.toString("base64");
}

class IRacingClient {
  constructor({ clientId, clientSecret, email, password, scope }) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.email = email;
    this.password = password;
    this.scope = scope || "iracing.auth";
    this.accessToken = null;
  }

  /**
   * Obtain an access token via the OAuth2 "password_limited" grant.
   */
  async login() {
    const body = new URLSearchParams({
      grant_type: "password_limited",
      client_id: this.clientId,
      client_secret: maskSecret(this.clientSecret, this.clientId),
      username: this.email,
      password: maskSecret(this.password, this.email),
      scope: this.scope,
    });

    const res = await fetch(OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (res.status === 429) {
      throw new Error("Rate limited by iRacing OAuth (HTTP 429). Try again later.");
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      const detail =
        data.error_description || data.error || `${res.status} ${res.statusText}`;
      throw new Error(`OAuth token request failed: ${detail}`);
    }
    this.accessToken = data.access_token;
  }

  /**
   * GET a /data endpoint and follow the signed S3 "link" to the real payload.
   */
  async getData(endpoint, params = {}) {
    const url = new URL(`${API_BASE}${endpoint}`);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (res.status === 401) {
      throw new Error(`Unauthorized fetching ${endpoint} (token expired or invalid).`);
    }
    if (!res.ok) {
      throw new Error(`Fetch ${endpoint} failed: HTTP ${res.status} ${res.statusText}`);
    }

    const payload = await res.json();
    // Most endpoints return { link: "<signed S3 url>" }; some return data inline.
    if (payload && payload.link) {
      const s3 = await fetch(payload.link); // pre-signed: no auth header
      if (!s3.ok) {
        throw new Error(`Fetch S3 link for ${endpoint} failed: HTTP ${s3.status}`);
      }
      return s3.json();
    }
    return payload;
  }
}

// --- Mapping helpers (shared semantics with extract-season-data.js) ------

function generateId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const LICENSE_ORDER = ["Rookie", "D", "C", "B", "A", "Pro", "Pro/WC"];

// Map an iRacing license group_name (e.g. "Class D", "Rookie", "Pro/WC") to short key.
const LICENSE_LABEL_MAP = {
  rookie: "Rookie",
  "class d": "D",
  "class c": "C",
  "class b": "B",
  "class a": "A",
  "pro/wc": "Pro/WC",
  "pro / wc": "Pro/WC",
  pro: "Pro",
};

function licenseKeyFromGroupName(groupName) {
  if (!groupName) return null;
  return LICENSE_LABEL_MAP[groupName.trim().toLowerCase()] || null;
}

// iRacing schedule category strings -> display names used in the JSON.
const CATEGORY_MAP = {
  oval: "Oval",
  road: "Sports Car", // legacy "road" — newer data splits sports/formula
  sports_car: "Sports Car",
  formula_car: "Formula Car",
  dirt_oval: "Dirt Oval",
  dirt_road: "Dirt Road",
};

function mapCategory(raw) {
  if (!raw) return "Uncategorized";
  return CATEGORY_MAP[String(raw).trim().toLowerCase()] || raw;
}

// Region phrases that may appear in a series name.
const REGION_RE =
  /\s+-\s+(Europe|North America|South America|Americas|America|Asia Pacific|Asia|Oceania|Australia|Africa|International|Australian Servers)\s*$/i;

function extractRegion(name) {
  const m = name.match(REGION_RE);
  return m ? m[1] : null;
}

function trackDisplayName(track) {
  if (!track) return "Unknown Track";
  const name = (track.track_name || "").trim();
  const config = (track.config_name || "").trim();
  if (config && config.toLowerCase() !== "n/a") {
    return `${name} - ${config}`;
  }
  return name || "Unknown Track";
}

/**
 * Build a human-readable conditions string from a schedule weather object,
 * mirroring the style produced by the PDF extractor where possible.
 */
function buildConditions(weather) {
  if (!weather) return null;
  const parts = [];

  const tempF = weather.temp_value;
  const tempUnits = weather.temp_units; // 0 = F, 1 = C
  if (typeof tempF === "number") {
    if (tempUnits === 1) {
      const c = tempF;
      const f = Math.round((c * 9) / 5 + 32);
      parts.push(`${f}°F/${c}°C`);
    } else {
      const f = tempF;
      const c = Math.round(((f - 32) * 5) / 9);
      parts.push(`${f}°F/${c}°C`);
    }
  }

  if (typeof weather.precip_option !== "undefined") {
    const chance =
      typeof weather.precip_chance === "number" ? `${weather.precip_chance}%` : null;
    if (weather.precip_option === 0 || weather.precip_option === false) {
      parts.push("Rain chance None");
    } else if (chance) {
      parts.push(`Rain chance ${chance}`);
    } else {
      parts.push("Rain chance Possible");
    }
  }

  return parts.length ? parts.join(", ") : null;
}

/**
 * Derive a race-frequency description from a schedule's race_time_descriptors.
 */
function buildRaceFrequency(descriptors) {
  if (!Array.isArray(descriptors) || descriptors.length === 0) return null;
  const d = descriptors[0];
  if (d.repeating && typeof d.repeat_minutes === "number") {
    const mins = d.repeat_minutes;
    if (mins % 60 === 0) {
      const hrs = mins / 60;
      return `Races every ${hrs} hour${hrs > 1 ? "s" : ""}`;
    }
    return `Races every ${mins} minutes`;
  }
  if (Array.isArray(d.session_times) && d.session_times.length) {
    return `${d.session_times.length} timeslots per day`;
  }
  return null;
}

// --- Transform API response -> internal schema ---------------------------

/**
 * @param {Array} seasons   The series/seasons API array (active seasons).
 * @param {Map}   carClassNames  car_class_id -> display name
 */
function transformSeasons(seasons, carClassNames) {
  const series = [];

  for (const season of seasons) {
    // Only include currently-active seasons.
    if (season.active === false) continue;

    const schedules = Array.isArray(season.schedules) ? season.schedules : [];
    if (schedules.length === 0) continue;

    const rawName = (
      season.season_name ||
      season.series_name ||
      `Series ${season.series_id}`
    ).trim();
    // Strip a trailing "- YYYY Season N" if present in the name.
    const name = rawName.replace(/\s*-?\s*\d{4}\s+Season\s+\d+\s*$/i, "").trim();

    const region = extractRegion(name);

    // Category from the first schedule entry's track category.
    const firstCat =
      schedules[0].category ||
      (schedules[0].track && schedules[0].track.category) ||
      season.category;
    const category = mapCategory(firstCat);

    // License range from allowed_licenses (group_name is authoritative).
    let minLicense = null;
    let maxLicense = null;
    let licenses;
    let licenseRange = null;
    const allowed = Array.isArray(season.allowed_licenses)
      ? season.allowed_licenses
      : [];
    if (allowed.length) {
      const keys = allowed
        .map((l) => licenseKeyFromGroupName(l.group_name))
        .filter(Boolean)
        .map((k) => LICENSE_ORDER.indexOf(k))
        .filter((idx) => idx !== -1)
        .sort((a, b) => a - b);
      if (keys.length) {
        minLicense = LICENSE_ORDER[keys[0]];
        maxLicense = LICENSE_ORDER[keys[keys.length - 1]];
        licenses = LICENSE_ORDER.slice(keys[0], keys[keys.length - 1] + 1);
        licenseRange = `${minLicense} --> ${maxLicense}`;
      }
    }

    // Car / car class names.
    let car = null;
    const carClassIds = Array.isArray(season.car_class_ids)
      ? season.car_class_ids
      : [];
    const carNames = carClassIds
      .map((id) => carClassNames.get(id))
      .filter(Boolean);
    if (carNames.length) car = carNames.join(", ");

    const raceFrequency = buildRaceFrequency(
      schedules[0].race_time_descriptors
    );

    const drops = typeof season.drops === "number" ? season.drops : null;

    // Build week schedule.
    const schedule = schedules
      .slice()
      .sort((a, b) => (a.race_week_num || 0) - (b.race_week_num || 0))
      .map((s) => {
        const track = trackDisplayName(s.track);
        const startDate = new Date(`${s.start_date}T00:00:00Z`);
        const endDate = new Date(startDate.getTime() + 6 * 86400000);
        const conditions = buildConditions(s.weather);
        const durationLaps =
          typeof s.race_lap_limit === "number" && s.race_lap_limit > 0
            ? s.race_lap_limit
            : null;
        const durationMins =
          typeof s.race_time_limit === "number" && s.race_time_limit > 0
            ? s.race_time_limit
            : null;

        return {
          week: (s.race_week_num || 0) + 1,
          track,
          trackId: generateId(track),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          ...(conditions && { conditions }),
          ...(durationMins != null && { durationMins }),
          ...(durationLaps != null && { durationLaps }),
        };
      });

    series.push({
      id: generateId(name),
      name,
      category,
      ...(region && { region }),
      ...(car && { car }),
      ...(licenseRange && { licenseRange }),
      ...(minLicense && { minLicense, maxLicense, licenses }),
      ...(raceFrequency && { raceFrequency }),
      ...(drops != null && { drops }),
      schedule,
    });
  }

  // Deterministic ordering so the JSON diff is stable across runs.
  series.sort((a, b) => a.id.localeCompare(b.id));

  // Season metadata: derive from the first season's year/quarter.
  const sample = seasons.find((s) => typeof s.season_year === "number") || {};
  const seasonYear = sample.season_year || new Date().getFullYear();
  const seasonNumber = sample.season_quarter || 1;
  const weeks = series.length
    ? Math.max(...series.map((s) => s.schedule.length))
    : 0;

  return {
    metadata: {
      season: `${seasonYear} Season ${seasonNumber}`,
      seasonNumber,
      seasonYear,
      lastUpdated: new Date().toISOString(),
      weeks,
    },
    series,
  };
}

// --- Change detection ----------------------------------------------------

/** Stable stringify ignoring metadata.lastUpdated (which always changes). */
function comparable(data) {
  const clone = JSON.parse(JSON.stringify(data));
  if (clone.metadata) delete clone.metadata.lastUpdated;
  return JSON.stringify(clone);
}

// --- Main ----------------------------------------------------------------

async function fetchSeasonData() {
  let seasons;
  const carClassNames = new Map();

  if (fromJson) {
    console.log(`Loading saved API response: ${fromJson}`);
    const raw = JSON.parse(fs.readFileSync(fromJson, "utf-8"));
    // Accept either the raw array or a { seasons: [...] } wrapper.
    seasons = Array.isArray(raw) ? raw : raw.seasons || raw.series_seasons || [];
  } else {
    const clientId = process.env.IRACING_CLIENT_ID;
    const clientSecret = process.env.IRACING_CLIENT_SECRET;
    const email = process.env.IRACING_EMAIL;
    const password = process.env.IRACING_PASSWORD;
    const scope = process.env.IRACING_SCOPE;
    if (!clientId || !clientSecret || !email || !password) {
      throw new Error(
        "IRACING_CLIENT_ID, IRACING_CLIENT_SECRET, IRACING_EMAIL and " +
          "IRACING_PASSWORD must be set for live fetch (or pass --from-json <file>)."
      );
    }

    const client = new IRacingClient({
      clientId,
      clientSecret,
      email,
      password,
      scope,
    });
    console.log("Authenticating with iRacing (OAuth2)...");
    await client.login();
    console.log("   Logged in.");

    console.log("Fetching car classes...");
    const carClasses = await client.getData("/data/carclass/get");
    for (const cc of Array.isArray(carClasses) ? carClasses : []) {
      const label = cc.name || cc.short_name;
      if (cc.car_class_id != null && label) {
        carClassNames.set(cc.car_class_id, label);
      }
    }
    console.log(`   ${carClassNames.size} car classes.`);

    console.log("Fetching current season schedules...");
    const resp = await client.getData("/data/series/seasons", {
      include_series: true,
    });
    seasons = Array.isArray(resp) ? resp : resp.seasons || [];
  }

  console.log(`   ${seasons.length} seasons returned.`);
  return transformSeasons(seasons, carClassNames);
}

async function main() {
  console.log("=== iRacing Season Data Sync ===\n");

  const data = await fetchSeasonData();

  // Validate.
  let totalWeeks = 0;
  for (const s of data.series) {
    if (!s.id || !s.name || !s.category || !Array.isArray(s.schedule)) {
      throw new Error(`Invalid series: ${s.name || "unknown"}`);
    }
    totalWeeks += s.schedule.length;
  }
  console.log(
    `\nParsed ${data.series.length} series, ${totalWeeks} total weeks ` +
      `(${data.metadata.season}).`
  );

  if (data.series.length === 0) {
    throw new Error("No series parsed — refusing to overwrite existing data.");
  }

  const resolvedOutput = path.resolve(outputPath);
  let existing = null;
  if (fs.existsSync(resolvedOutput)) {
    try {
      existing = JSON.parse(fs.readFileSync(resolvedOutput, "utf-8"));
    } catch {
      existing = null;
    }
  }

  const changed = !existing || comparable(existing) !== comparable(data);

  if (!changed) {
    console.log("\nNo changes — data is already up to date.");
    return;
  }

  if (dryRun) {
    console.log("\nChanges detected (dry-run: not writing).");
    console.log("::changed::");
    return;
  }

  const outputDir = path.dirname(resolvedOutput);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const jsonString = JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync(resolvedOutput, jsonString, "utf-8");
  console.log(`\nUpdated ${resolvedOutput}`);
  console.log(`   ${(Buffer.byteLength(jsonString) / 1024).toFixed(1)} KB`);
  console.log("::changed::");
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});
