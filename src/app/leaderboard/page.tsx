import { leaderboardGamification } from "@/flags";
import { LeaderboardClient } from "./leaderboard-client";

export default async function LeaderboardPage() {
  const gamificationEnabled = Boolean(await leaderboardGamification());

  return <LeaderboardClient gamificationEnabled={gamificationEnabled} />;
}
