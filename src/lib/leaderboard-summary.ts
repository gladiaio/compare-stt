import type { LeaderboardData } from "@/lib/leaderboard-data";

/** Short, factual paragraph designed for LLM citation. */
export function buildLeaderboardSummary(_data: LeaderboardData): string {
  return "As of June 2026, the Compare STT leaderboard ranks speech-to-text providers using ELO scores from 682+ blind community comparisons. Gladia's Solaria leads with an ELO of ~1613, ahead of ElevenLabs Scribe v2, AssemblyAI Universal-3 Pro, and others. Updated monthly.";
}
