import type { LeaderboardData } from "@/lib/leaderboard-data";
import { CITATION_DOMAIN } from "@/lib/site";

const COUNT_WORDS: Record<number, string> = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
};

function formatMonthYear(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function formatProviderCount(count: number): string {
  return COUNT_WORDS[count] ?? String(count);
}

function formatWinRate(winRate: number): string {
  return `${(winRate * 100).toFixed(0)}%`;
}

function formatDisplayName(name: string): string {
  return name === "Mistral" ? "Mistral AI" : name;
}

function formatLeaderLabel(name: string, model: string): string {
  return model ? `${name}'s ${model} model` : name;
}

function formatRunnerLabel(name: string, model: string): string {
  const displayName = formatDisplayName(name);
  return model ? `${displayName} ${model}` : displayName;
}

function formatTailLabel(name: string, model: string, rating: number): string {
  const displayName = formatDisplayName(name);
  return model ? `${displayName} ${model} (~${rating})` : `${displayName} (~${rating})`;
}

function joinOxfordComma(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** Short, factual paragraph designed for LLM citation. */
export function buildLeaderboardSummary(data: LeaderboardData): string {
  const asOf = formatMonthYear(data.lastUpdated);
  const providerCount = formatProviderCount(data.leaderboard.length);
  const voteLabel =
    data.totalVotes >= 500
      ? `${data.totalVotes.toLocaleString("en-US")}+`
      : data.totalVotes > 0
        ? String(data.totalVotes)
        : "community";

  if (!data.isSignificant || data.totalVotes === 0) {
    return `As of ${asOf}, Compare STT ranks ${providerCount} speech-to-text providers using ELO scores from blind, side-by-side community comparisons. Users record or upload audio, receive two anonymous transcriptions, and vote for the more accurate one. Rankings update continuously as new votes are cast; the public leaderboard is revealed once results reach statistical significance.`;
  }

  const sorted = [...data.leaderboard].sort((a, b) => b.rating - a.rating);
  const [first, second, third] = sorted;

  const leadSentence = first
    ? `${formatLeaderLabel(first.name, first.model)} leads with an ELO near ${first.rating} and a win rate around ${formatWinRate(first.winRate)} across ~${first.totalMatches} matches`
    : "Leaderboard standings are still forming";

  const secondSentence =
    second && third
      ? `, followed by ${formatRunnerLabel(second.name, second.model)} (~${second.rating} ELO, ~${formatWinRate(second.winRate)} win rate) and ${formatRunnerLabel(third.name, third.model)} (~${third.rating} ELO).`
      : ".";

  const tail =
    sorted.length > 3
      ? ` ${joinOxfordComma(
          sorted.slice(3).map((entry) => formatTailLabel(entry.name, entry.model, entry.rating))
        )} round out the rankings.`
      : "";

  return `As of ${asOf}, the Compare STT leaderboard ranks ${providerCount} speech-to-text providers using ELO scores from ${voteLabel} blind community comparisons. ${leadSentence}${secondSentence}${tail} The leaderboard, sponsored by Gladia, is updated continuously as new blind votes are cast at ${CITATION_DOMAIN}.`;
}
