"use client";

import { useEffect, useState } from "react";
import { LeaderboardTable } from "@/components/leaderboard-table";

interface LeaderboardEntry {
  id: string;
  name: string;
  logoUrl: string;
  model: string;
  rating: number;
  eloRange: string;
  wins: number;
  losses: number;
  ties: number;
  totalMatches: number;
  winRate: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isSignificant, setIsSignificant] = useState(false);
  const [useEloRange, setUseEloRange] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        setEntries(data.leaderboard);
        setTotalVotes(data.totalVotes);
        setIsSignificant(data.isSignificant);
        setUseEloRange(data.useEloRange);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-10 flex flex-col gap-4">
        <span
          className="font-mono text-xs uppercase tracking-[0.16em]"
          style={{ color: "var(--color-text-brand)" }}
        >
          Community Rankings
        </span>
        <h1
          className="text-3xl font-semibold tracking-tight md:text-4xl"
          style={{ color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}
        >
          Leaderboard
        </h1>
        <p className="text-base" style={{ color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          Rankings based on ELO scores from blind comparisons by the community.
          {totalVotes > 0 && (
            <span className="ml-1 font-mono tabular-nums" style={{ color: "var(--color-text-tertiary)" }}>
              ({totalVotes} total vote{totalVotes !== 1 ? "s" : ""})
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 w-full rounded-[var(--radius-md)] animate-skeleton"
              style={{ background: "var(--color-bg-tertiary)", animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      ) : (
        <LeaderboardTable
          entries={entries}
          totalVotes={totalVotes}
          isSignificant={isSignificant}
          useEloRange={useEloRange}
        />
      )}
    </div>
  );
}
