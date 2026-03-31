import { flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";

export const showLeaderboard = flag({
  key: "show-leaderboard",
  adapter: vercelAdapter(),
  description: "Reveal leaderboard rankings instead of showing blurred teaser",
});

export const leaderboardGamification = flag({
  key: "leaderboard-gamification",
  adapter: vercelAdapter(),
  description:
    "Require users to complete 3 Arena comparisons before accessing the leaderboard",
});
