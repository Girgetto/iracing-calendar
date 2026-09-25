import { ImageResponse } from "next/og";
import { getSeasonData } from "@/lib/data";

// Rendered once at build time; season data changes only on redeploy.
export const dynamic = "force-static";

export function GET() {
  const { metadata, series } = getSeasonData();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 88,
              height: 88,
              borderRadius: 18,
              background: "#dc2626",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            iR
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>iRacing Calendar</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
            {`${metadata.season} Schedule`}
          </div>
          <div style={{ fontSize: 34, color: "#94a3b8" }}>
            {`${series.length}+ series · week-by-week tracks · session times`}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 28,
            color: "#94a3b8",
          }}
        >
          <div style={{ display: "flex" }}>iracing-calendar.girgetto.it</div>
          <div style={{ display: "flex" }}>by Girgetto · open source</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
