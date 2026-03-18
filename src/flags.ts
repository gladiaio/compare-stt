import { flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";

export const showLeaderboard = flag({
  key: "show-leaderboard",
  adapter: vercelAdapter(),
  description: "Reveal leaderboard rankings instead of showing blurred teaser",
});

export const leaderboardEloRange = flag({
  key: "leaderboard-elo-range",
  adapter: vercelAdapter(),
  description: "Show ELO range buckets instead of exact ELO values",
});
