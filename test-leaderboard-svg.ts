import { readFileSync } from "node:fs";
import { escapeXml, inlineLogo, renderLeaderboardSvg, renderLeaderboardUnavailableSvg } from "./src/lib/leaderboard-svg";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ✗ ${name}`);
    console.log(`    ${msg}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

const entries = [
  { name: "ElevenLabs", slug: "elevenlabs", model: "Scribe v2", rating: 1573.4, winRate: 0.4956 },
  { name: "Gladia", slug: "gladia", model: "Solaria-3", rating: 1555, winRate: 0.4985 },
  { name: "Deepgram", slug: "deepgram", model: "Nova 3", rating: 1378, winRate: 0.2258 },
];

const base = { entries, totalVotes: 1026, isSignificant: true, lastUpdated: "2026-11-10", highlightSlug: "gladia" };

console.log("\nLeaderboard SVG tests\n" + "=".repeat(60));

test("renders a standalone SVG document", () => {
  const svg = renderLeaderboardSvg(base);
  assert(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'), "missing root svg");
  assert(svg.trimEnd().endsWith("</svg>"), "missing closing tag");
  assert(!/href=|<image|<script|@import|url\(http/i.test(svg), "must not reference external resources");
});

test("shows rounded ELO, win rate and vote count", () => {
  const svg = renderLeaderboardSvg(base);
  assert(svg.includes(">1573<"), "ELO should be rounded");
  assert(svg.includes(">49.6%<"), "win rate should have one decimal");
  assert(svg.includes("1,026 community votes"), "vote count should be grouped");
  assert(svg.includes("updated 2026-11-10"), "missing last updated date");
});

test("keeps the given order for ranks", () => {
  const svg = renderLeaderboardSvg(base);
  assert(svg.indexOf("Scribe v2") < svg.indexOf("Solaria-3"), "rank 1 should come first");
  assert(svg.indexOf("Solaria-3") < svg.indexOf("Nova 3"), "rank 2 should come before rank 3");
});

test("highlights the Gladia row in purple", () => {
  const svg = renderLeaderboardSvg(base);
  assert(svg.includes('rx="8" fill="rgba(148,122,252,0.08)"'), "missing highlight background");
  assert(/fill="#947AFC"[^>]*>1555</.test(svg), "Gladia ELO should use the accent color");
  assert(!/fill="#947AFC"[^>]*>1573</.test(svg), "other rows must not use the accent color");
});

test("hides ratings until results are significant", () => {
  const svg = renderLeaderboardSvg({ ...base, isSignificant: false });
  assert(!svg.includes(">1573<") && !svg.includes(">49.6%<"), "ratings must be hidden");
  assert(svg.includes("rankings unlock once results are significant"), "missing unlock note");
  assert(svg.includes("collecting votes"), "accessible title should say votes are being collected");
});

test("escapes provider text", () => {
  const svg = renderLeaderboardSvg({ ...base, entries: [{ ...entries[0], model: "<b>&\"x\"" }] });
  assert(svg.includes("&lt;b&gt;&amp;&quot;x&quot;"), "model must be escaped");
  assert(!svg.includes("<b>"), "raw markup must not leak");
  assert(escapeXml("a'b") === "a&apos;b", "apostrophes must be escaped");
});

test("falls back to the provider name without a logo", () => {
  const svg = renderLeaderboardSvg(base);
  assert(svg.includes(">ElevenLabs<"), "name should be rendered as text");
});

test("inlines logos and namespaces their classes", () => {
  const raw = readFileSync("public/providers/speechmatics.svg", "utf8");
  const logo = inlineLogo(raw, "speechmatics", 10, 20);
  assert(logo !== null, "logo should be parsed");
  assert(logo!.includes('viewBox="0 0 461.58 49.66"'), "viewBox should be kept");
  assert(logo!.includes('class="speechmatics-cls-1"'), "class should be namespaced");
  assert(logo!.includes(".speechmatics-cls-1"), "stylesheet selector should be namespaced");
  assert(!logo!.includes("<?xml") && !logo!.includes('id="'), "declaration and ids must be dropped");
});

test("derives a viewBox from width and height", () => {
  const logo = inlineLogo('<svg width="10" height="5"><path d="M0 0"/></svg>', "x", 0, 0);
  assert(logo !== null && logo.includes('viewBox="0 0 10 5"'), "viewBox should come from size");
});

test("rejects markup that is not an SVG", () => {
  assert(inlineLogo("<div></div>", "x", 0, 0) === null, "non-svg should be rejected");
});

test("renders every bundled provider logo", () => {
  for (const slug of ["assemblyai", "deepgram", "elevenlabs", "gladia", "mistral", "speechmatics"]) {
    const raw = readFileSync(`public/providers/${slug}.svg`, "utf8");
    assert(inlineLogo(raw, slug, 0, 0) !== null, `${slug} logo could not be inlined`);
  }
});

test("renders an unavailable card", () => {
  const svg = renderLeaderboardUnavailableSvg();
  assert(svg.includes("temporarily unavailable"), "missing fallback copy");
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
