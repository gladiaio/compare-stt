import type { Metadata } from "next";
import { leaderboardGamification } from "@/flags";
import { LeaderboardClient } from "./leaderboard-client";
import { LeaderboardDatasetSchema } from "@/components/seo/leaderboard-dataset-schema";
import { LeaderboardStaticTable } from "@/components/seo/leaderboard-static-table";
import { getLeaderboardArticles } from "@/lib/leaderboard-articles";
import { getLeaderboardData } from "@/lib/leaderboard-data";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Community-driven ELO rankings of speech-to-text providers from blind side-by-side comparisons.",
  alternates: {
    canonical: publicUrl("/leaderboard"),
  },
  openGraph: {
    title: "STT Leaderboard | Compare STT",
    description:
      "Community-driven ELO rankings of speech-to-text providers from blind side-by-side comparisons.",
    url: publicUrl("/leaderboard"),
  },
};

export default async function LeaderboardPage() {
  const [data, gamificationEnabled, articles] = await Promise.all([
    getLeaderboardData(),
    leaderboardGamification(),
    getLeaderboardArticles(),
  ]);

  return (
    <>
      <LeaderboardDatasetSchema data={data} />
      <LeaderboardClient
        gamificationEnabled={Boolean(gamificationEnabled)}
        articles={articles}
      />
      <div className="mx-auto max-w-4xl px-6 pb-12">
        {/* Crawler-friendly snapshot: always in HTML source, hidden from sighted users */}
        <LeaderboardStaticTable data={data} visuallyHidden />
      </div>
    </>
  );
}
