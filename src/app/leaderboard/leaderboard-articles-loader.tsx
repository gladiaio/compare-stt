import { getLeaderboardArticles } from "@/lib/leaderboard-articles";
import { LeaderboardArticlesSection } from "@/components/leaderboard-articles-section";

export async function LeaderboardArticlesLoader() {
  const articles = await getLeaderboardArticles();
  return <LeaderboardArticlesSection articles={articles} />;
}
