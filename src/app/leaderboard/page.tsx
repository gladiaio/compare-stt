import type { Metadata } from "next";
import { Suspense } from "react";
import { leaderboardGamification } from "@/flags";
import { LeaderboardClient } from "./leaderboard-client";
import { LeaderboardArticlesLoader } from "./leaderboard-articles-loader";
import { LeaderboardDatasetSchema } from "@/components/seo/leaderboard-dataset-schema";
import { LeaderboardStaticTable } from "@/components/seo/leaderboard-static-table";
import { getLeaderboardData } from "@/lib/leaderboard-data";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Live ELO rankings of 6 speech-to-text providers from blind community comparisons. See how Gladia, Deepgram, AssemblyAI, and others perform on real audio.",
  alternates: {
    canonical: publicUrl("/leaderboard"),
  },
  openGraph: {
    title: "STT Leaderboard | Compare STT",
    description:
      "Live ELO rankings of 6 speech-to-text providers from blind community comparisons. See how Gladia, Deepgram, AssemblyAI, and others perform on real audio.",
    url: publicUrl("/leaderboard"),
  },
};

export default async function LeaderboardPage() {
  const [data, gamificationEnabled] = await Promise.all([
    getLeaderboardData(),
    leaderboardGamification(),
  ]);

  return (
    <>
      <LeaderboardDatasetSchema data={data} />
      <LeaderboardClient
        gamificationEnabled={Boolean(gamificationEnabled)}
      />
      <div className="mx-auto max-w-4xl px-6">
        <Suspense>
          <LeaderboardArticlesLoader />
        </Suspense>
      </div>
      <div className="mx-auto max-w-4xl px-6 pb-12">
        {/* Crawler-friendly snapshot: always in HTML source, hidden from sighted users */}
        <LeaderboardStaticTable data={data} variant="hidden" />
      </div>
    </>
  );
}
