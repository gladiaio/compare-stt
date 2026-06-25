import { ImageResponse } from "next/og";
import { PROVIDERS } from "@/lib/providers";

export const alt = "Compare STT — Live Speech-to-Text Leaderboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const manrope = fetch(
  new URL("https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FO_F.ttf", import.meta.url),
).then((res) => res.arrayBuffer());

const ROWS = [
  { name: "Gladia", model: "Solaria", rating: 1542, winRate: "58.2%", matches: 847 },
  { name: "Deepgram", model: "Nova 3", rating: 1528, winRate: "55.1%", matches: 831 },
  { name: "AssemblyAI", model: "Universal-3 Pro", rating: 1515, winRate: "52.4%", matches: 819 },
  { name: "ElevenLabs", model: "Scribe v2", rating: 1498, winRate: "48.9%", matches: 806 },
  { name: "Speechmatics", model: "Enhanced", rating: 1487, winRate: "46.3%", matches: 792 },
  { name: "Mistral", model: "Voxtral Mini", rating: 1471, winRate: "43.7%", matches: 778 },
];

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0b",
          padding: "48px 56px",
          fontFamily: "Manrope, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#947AFC",
            }}
          />
          <span style={{ color: "#947AFC", fontSize: 14, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            Community Rankings
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginBottom: 32 }}>
          <span style={{ color: "#ffffff", fontSize: 44, fontWeight: 400, letterSpacing: "-3.2px" }}>
            STT Leaderboard
          </span>
          <span style={{ color: "#a1a1aa", fontSize: 18, marginTop: 8 }}>
            Blind ELO rankings from {PROVIDERS.length} speech-to-text providers
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: "1px solid #27272a",
            borderRadius: 12,
            overflow: "hidden",
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "14px 24px",
              borderBottom: "1px solid #27272a",
              background: "#141416",
              color: "#71717a",
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ flex: 2 }}>Provider</span>
            <span style={{ width: 80, textAlign: "right" }}>ELO</span>
            <span style={{ width: 100, textAlign: "right" }}>Win Rate</span>
            <span style={{ width: 90, textAlign: "right" }}>Matches</span>
          </div>

          {ROWS.map((row, index) => (
            <div
              key={row.name}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px 24px",
                borderBottom: index < ROWS.length - 1 ? "1px solid #1f1f23" : "none",
                background: index === 0 ? "#141416" : "#0a0a0b",
              }}
            >
              <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#52525b", fontSize: 14, width: 20 }}>{index + 1}</span>
                <span style={{ color: "#ffffff", fontSize: 18, fontWeight: 600 }}>{row.name}</span>
                <span
                  style={{
                    color: "#71717a",
                    fontSize: 12,
                    background: "#1c1c1f",
                    padding: "4px 8px",
                    borderRadius: 4,
                  }}
                >
                  {row.model}
                </span>
              </div>
              <span style={{ width: 80, textAlign: "right", color: "#ffffff", fontSize: 18, fontWeight: 600 }}>
                {row.rating}
              </span>
              <span style={{ width: 100, textAlign: "right", color: "#a1a1aa", fontSize: 16 }}>
                {row.winRate}
              </span>
              <span style={{ width: 90, textAlign: "right", color: "#a1a1aa", fontSize: 16 }}>
                {row.matches}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
          <span style={{ color: "#71717a", fontSize: 16 }}>comparestt.com</span>
          <span style={{ color: "#947AFC", fontSize: 16 }}>Upload audio · Vote blind · See rankings</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Manrope",
          data: await manrope,
          weight: 400,
          style: "normal",
        },
        {
          name: "Manrope",
          data: await manrope,
          weight: 600,
          style: "normal",
        },
      ],
    },
  );
}
