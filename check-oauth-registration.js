/**
 * check-oauth-registration.js
 *
 * Watches iRacing's OAuth documentation for the moment client-ID registration
 * reopens.
 *
 * Background: iRacing retired legacy username/password auth with the 2026
 * Season 1 release, so sync-season-data.js needs an OAuth client. iRacing has
 * "paused the creation of OAuth client IDs while we evaluate existing 3rd party
 * usage" — with no ETA and no waitlist. Until that notice disappears the sync
 * cannot run, and data/iracing-season-data.json goes stale.
 *
 * This script polls the two pages that carry the notice and reports whether it
 * is still there, so CI can raise a flag the week it lifts instead of us
 * checking by hand.
 *
 * Exit codes:
 *   0  notice still present — still paused, nothing to do
 *   3  notice gone from at least one page — registration may be OPEN
 *   1  could not determine (network error, page moved) — needs a human
 *
 * Usage:
 *   node check-oauth-registration.js
 *   node check-oauth-registration.js --json
 */

const SOURCES = [
  {
    name: "OAuth book — Client Registration",
    url: "https://oauth.iracing.com/oauth2/book/client_registration.html",
    // Sanity anchor: text that should be on the page whether or not it is
    // paused. If this is missing the page moved and we must not guess.
    anchor: /client\s*registration/i,
  },
  {
    name: "Support — OAuth Client Credentials",
    url: "https://support.iracing.com/support/solutions/articles/31000177790-oauth-client-credentials",
    anchor: /oauth/i,
  },
];

/** The notice iRacing posts while registration is closed. */
const PAUSED_NOTICE = /paused\s+the\s+creation\s+of\s+oauth\s+client\s+ids/i;

const REQUEST_TIMEOUT_MS = 20_000;

const asJson = process.argv.includes("--json");

/** Strip tags and collapse whitespace so the regexes see plain prose. */
function toText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ");
}

async function checkSource({ name, url, anchor }) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "User-Agent": "iracing-calendar-oauth-watcher" },
  });

  if (!res.ok) {
    return { name, url, status: "unknown", detail: `HTTP ${res.status}` };
  }

  const text = toText(await res.text());

  if (!anchor.test(text)) {
    return {
      name,
      url,
      status: "unknown",
      detail: "page no longer looks like the expected doc (moved or rewritten)",
    };
  }

  return PAUSED_NOTICE.test(text)
    ? { name, url, status: "paused", detail: "pause notice still present" }
    : { name, url, status: "open", detail: "pause notice is GONE" };
}

async function main() {
  const results = [];
  for (const source of SOURCES) {
    try {
      results.push(await checkSource(source));
    } catch (err) {
      results.push({
        name: source.name,
        url: source.url,
        status: "unknown",
        detail: err.message,
      });
    }
  }

  const anyOpen = results.some((r) => r.status === "open");
  const anyPaused = results.some((r) => r.status === "paused");

  // "open" only counts when at least one page loaded cleanly and lost the
  // notice. If nothing loaded at all we report unknown rather than crying wolf.
  const verdict = anyOpen ? "open" : anyPaused ? "paused" : "unknown";

  if (asJson) {
    console.log(JSON.stringify({ verdict, results }, null, 2));
  } else {
    for (const r of results) {
      console.log(`[${r.status.toUpperCase()}] ${r.name}\n    ${r.detail}\n    ${r.url}`);
    }
    console.log(`\nVerdict: ${verdict}`);
    if (verdict === "open") {
      console.log(
        "\niRacing OAuth client registration may have REOPENED.\n" +
          "Register a client at https://oauth.iracing.com/accountmanagement,\n" +
          "then set IRACING_CLIENT_ID / IRACING_CLIENT_SECRET repository secrets\n" +
          "to activate the weekly season-data sync."
      );
    }
  }

  process.exit(verdict === "open" ? 3 : verdict === "paused" ? 0 : 1);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
