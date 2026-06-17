import type { LeaderboardData } from "@/lib/leaderboard-data";
import { buildLeaderboardSummary } from "@/lib/leaderboard-summary";

export function LeaderboardSummary({
  data,
  className = "",
}: {
  data: LeaderboardData;
  className?: string;
}) {
  const summary = buildLeaderboardSummary(data);

  return (
    <p
      className={`text-base leading-relaxed ${className}`}
      style={{ color: "var(--color-text-secondary)" }}
      data-citation="leaderboard-summary"
    >
      {summary}
    </p>
  );
}
