import { prisma } from "@/lib/db";
import { computeEloRatings } from "@/lib/elo";
import { computeConfidenceInterval } from "@/lib/elo-confidence";
import { getProviderBySlug } from "@/lib/providers";
import { showLeaderboard } from "@/flags";

export interface LeaderboardEntry {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  model: string;
  rating: number;
  wins: number;
  losses: number;
  ties: number;
  totalMatches: number;
  winRate: number;
  confidenceInterval: string;
}

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  totalVotes: number;
  isSignificant: boolean;
  lastUpdated: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function getLeaderboardData(): Promise<LeaderboardData> {
  const providers = await prisma.provider.findMany();
  const votes = await prisma.vote.findMany({
    select: {
      providerAId: true,
      providerBId: true,
      winnerId: true,
      createdAt: true,
    },
  });

  const providerIds = providers.map((p) => p.id);
  const ratings = computeEloRatings(providerIds, votes);
  const isSignificant = Boolean(await showLeaderboard());

  const entries: LeaderboardEntry[] = providers.map((p) => {
    const r = ratings.get(p.id)!;
    const def = getProviderBySlug(p.slug);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      logoUrl: p.logoUrl,
      model: def?.model ?? "",
      rating: Math.round(r.rating),
      wins: r.wins,
      losses: r.losses,
      ties: r.ties,
      totalMatches: r.totalMatches,
      winRate: r.winRate,
      confidenceInterval: computeConfidenceInterval(r.totalMatches),
    };
  });

  const sorted = isSignificant
    ? entries.sort((a, b) => b.rating - a.rating)
    : shuffleArray(entries);

  const lastVote = votes.reduce<Date | null>((latest, vote) => {
    if (!latest || vote.createdAt > latest) return vote.createdAt;
    return latest;
  }, null);

  return {
    leaderboard: sorted,
    totalVotes: votes.length,
    isSignificant,
    lastUpdated: (lastVote ?? new Date()).toISOString().slice(0, 10),
  };
}
