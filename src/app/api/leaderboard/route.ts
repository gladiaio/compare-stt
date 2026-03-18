import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeEloRatings } from "@/lib/elo";
import { getProviderBySlug } from "@/lib/providers";
import { showLeaderboard, leaderboardEloRange } from "@/flags";

const ELO_BUCKET_SIZE = 50;
const GLADIA_SLUG = "gladia";

function getEloBucket(rating: number): number {
  return Math.floor(rating / ELO_BUCKET_SIZE) * ELO_BUCKET_SIZE;
}

function getEloRangeLabel(rating: number): string {
  const min = getEloBucket(rating);
  return `${min}–${min + ELO_BUCKET_SIZE}`;
}

export async function GET() {
  try {
    const providers = await prisma.provider.findMany();
    const votes = await prisma.vote.findMany({
      select: {
        providerAId: true,
        providerBId: true,
        winnerId: true,
      },
    });

    const providerIds = providers.map((p) => p.id);
    const ratings = computeEloRatings(providerIds, votes);

    const MIN_VOTES_FOR_SIGNIFICANCE = 100;
    const [revealResults, useEloRange] = await Promise.all([
      showLeaderboard(),
      leaderboardEloRange(),
    ]);

    const leaderboard = providers
      .map((p) => {
        const r = ratings.get(p.id)!;
        const def = getProviderBySlug(p.slug);
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          logoUrl: p.logoUrl,
          model: def?.model ?? "",
          rating: r.rating,
          eloRange: getEloRangeLabel(r.rating),
          wins: r.wins,
          losses: r.losses,
          ties: r.ties,
          totalMatches: r.totalMatches,
          winRate: r.winRate,
        };
      })
      .sort((a, b) => {
        if (useEloRange) {
          const bucketA = getEloBucket(a.rating);
          const bucketB = getEloBucket(b.rating);
          if (bucketA !== bucketB) return bucketB - bucketA;
          if (a.slug === GLADIA_SLUG) return -1;
          if (b.slug === GLADIA_SLUG) return 1;
          return a.name.localeCompare(b.name);
        }
        return b.rating - a.rating;
      })
      .map(({ slug: _slug, ...rest }) => rest);

    return NextResponse.json({
      leaderboard,
      totalVotes: votes.length,
      isSignificant: revealResults || votes.length >= MIN_VOTES_FOR_SIGNIFICANCE,
      useEloRange,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
