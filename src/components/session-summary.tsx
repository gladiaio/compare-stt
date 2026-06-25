"use client";

import Link from "next/link";
import { useEffect } from "react";

interface SessionStats {
  totalVotes: number;
  providerWins: Record<string, { name: string; wins: number; appearances: number }>;
}

interface SessionSummaryProps {
  stats: SessionStats;
  onClose: () => void;
}

export function SessionSummary({ stats, onClose }: SessionSummaryProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const providers = Object.entries(stats.providerWins)
    .sort(([, a], [, b]) => b.wins - a.wins);

  const maxAppearances = Math.max(
    ...providers.map(([, p]) => p.appearances),
    1
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-[var(--radius-xl)] border p-8 animate-slide-up"
        style={{
          background: "var(--color-bg-tertiary)",
          borderColor: "var(--color-border-primary)",
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="type-section-title text-2xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            Session Summary
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-160"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div
          className="mb-6 rounded-[var(--radius-md)] p-4"
          style={{ background: "var(--color-bg-secondary)" }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.16em]" style={{ color: "var(--color-text-brand)" }}>
            Total comparisons
          </p>
          <p className="type-metric mt-1 text-3xl tabular-nums" style={{ color: "var(--color-text-primary)" }}>
            {stats.totalVotes}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <p
            className="font-mono text-xs uppercase tracking-[0.16em]"
            style={{ color: "var(--color-text-brand)" }}
          >
            Your votes by provider
          </p>

          {providers.map(([id, data], index) => (
            <div key={id} className="flex flex-col gap-1" style={{ animationDelay: `${index * 60}ms` }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--color-text-primary)" }}>{data.name}</span>
                <span className="font-mono tabular-nums" style={{ color: "var(--color-text-secondary)" }}>
                  {data.wins}W / {data.appearances}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--color-bg-elevated)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(data.appearances / maxAppearances) * 100}%`,
                    background: `linear-gradient(90deg, var(--color-accent-purple), var(--color-accent-purple-subtle))`,
                    opacity: data.wins > 0 ? 1 : 0.3,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/leaderboard"
          className="mt-6 flex w-full items-center justify-center rounded-[var(--radius-full)] border py-3 text-sm font-medium transition-all duration-160 hover:opacity-90"
          style={{
            borderColor: "var(--color-border-primary)",
            color: "var(--color-text-primary)",
          }}
        >
          View the leaderboard
        </Link>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-[var(--radius-full)] py-3 text-sm font-medium transition-all duration-160 hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "var(--color-bg-inverse)",
            color: "var(--color-text-inverse)",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
