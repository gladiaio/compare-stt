import { getLeaderboardData } from "@/lib/leaderboard-data";
import { renderLeaderboardSvg, renderLeaderboardUnavailableSvg } from "@/lib/leaderboard-svg";
import { readProviderLogo } from "@/lib/provider-logos";

export const dynamic = "force-dynamic";

/**
 * Live leaderboard as an SVG image, embedded in the GitHub README.
 *
 * GitHub serves README images through its camo proxy, which honours
 * Cache-Control, so a short shared cache keeps the image fresh without
 * recomputing ratings on every view.
 */
const CACHE_OK = "public, max-age=600, s-maxage=600, stale-while-revalidate=3600";
const CACHE_ERROR = "public, max-age=60, s-maxage=60";

function svgResponse(body: string, cacheControl: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": cacheControl,
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET() {
  try {
    const data = await getLeaderboardData();

    // Before significance the data layer shuffles rows on every call; sort by
    // name so the image stays stable while rankings are hidden.
    const entries = data.isSignificant
      ? data.leaderboard
      : [...data.leaderboard].sort((a, b) => a.name.localeCompare(b.name));

    const logos: Record<string, string> = {};
    await Promise.all(
      entries.map(async (e) => {
        const markup = await readProviderLogo(e.logoUrl);
        if (markup) logos[e.slug] = markup;
      }),
    );

    const svg = renderLeaderboardSvg({
      entries,
      totalVotes: data.totalVotes,
      isSignificant: data.isSignificant,
      lastUpdated: data.lastUpdated,
      logos,
      highlightSlug: "gladia",
    });

    return svgResponse(svg, CACHE_OK);
  } catch (error) {
    console.error("Leaderboard SVG error:", error);
    // 200 with a fallback card: GitHub would otherwise show a broken image.
    return svgResponse(renderLeaderboardUnavailableSvg(), CACHE_ERROR);
  }
}
