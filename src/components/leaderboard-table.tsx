"use client";

import Image from "next/image";

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

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  totalVotes: number;
  isSignificant: boolean;
  useEloRange: boolean;
}

export function LeaderboardTable({
  entries,
  totalVotes,
  isSignificant,
  useEloRange,
}: LeaderboardTableProps) {
  if (totalVotes === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 animate-fade-in">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "var(--color-bg-tertiary)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-base font-medium" style={{ color: "var(--color-text-primary)" }}>
            No votes yet
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            Head to the Arena and start comparing transcriptions to populate the leaderboard.
          </p>
        </div>
      </div>
    );
  }

  const displayEntries = entries;

  return (
    <div className="flex flex-col gap-6">
      {!isSignificant && <EarlyStageDisclaimer totalVotes={totalVotes} />}

      <div className="w-full overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className="border-b text-left text-xs font-mono uppercase tracking-[0.16em]"
              style={{
                borderColor: "var(--color-border-primary)",
                color: "var(--color-text-tertiary)",
              }}
            >
              <th className="pb-3 pr-4">Provider</th>
              <th className="pb-3 pr-4 text-right">{useEloRange ? "ELO Range" : "ELO"}</th>
              <th className="hidden pb-3 pr-4 text-right sm:table-cell">Win Rate</th>
              <th className="hidden pb-3 pr-4 text-right md:table-cell">W</th>
              <th className="hidden pb-3 pr-4 text-right md:table-cell">L</th>
              <th className="hidden pb-3 pr-4 text-right md:table-cell">T</th>
              <th className="pb-3 text-right">Matches</th>
            </tr>
          </thead>
          <tbody>
            {displayEntries.map((entry, index) => (
              <tr
                key={entry.id}
                className="border-b transition-colors duration-160"
                style={{
                  borderColor: "var(--color-border-tertiary)",
                  animationDelay: `${index * 60}ms`,
                }}
              >
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-6 w-32 shrink-0">
                      <Image
                        src={entry.logoUrl}
                        alt={entry.name}
                        fill
                        className="object-contain object-left"
                      />
                    </div>
                    {entry.model && (
                      <span
                        className="whitespace-nowrap rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-mono"
                        style={{
                          background: "var(--color-bg-elevated)",
                          color: "var(--color-text-tertiary)",
                        }}
                      >
                        {entry.model}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 pr-4 text-right">
                  <BlurredValue isBlurred={!isSignificant}>
                    <span
                      className="font-mono text-sm font-semibold tabular-nums"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {useEloRange ? entry.eloRange : entry.rating}
                    </span>
                  </BlurredValue>
                </td>
                <td className="hidden py-4 pr-4 text-right sm:table-cell">
                  <BlurredValue isBlurred={!isSignificant}>
                    <span
                      className="font-mono text-sm tabular-nums"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {(entry.winRate * 100).toFixed(1)}%
                    </span>
                  </BlurredValue>
                </td>
                <td className="hidden py-4 pr-4 text-right md:table-cell">
                  <BlurredValue isBlurred={!isSignificant}>
                    <span className="font-mono text-sm tabular-nums" style={{ color: "var(--color-accent-green)" }}>
                      {entry.wins}
                    </span>
                  </BlurredValue>
                </td>
                <td className="hidden py-4 pr-4 text-right md:table-cell">
                  <BlurredValue isBlurred={!isSignificant}>
                    <span className="font-mono text-sm tabular-nums" style={{ color: "var(--color-text-error)" }}>
                      {entry.losses}
                    </span>
                  </BlurredValue>
                </td>
                <td className="hidden py-4 pr-4 text-right md:table-cell">
                  <BlurredValue isBlurred={!isSignificant}>
                    <span className="font-mono text-sm tabular-nums" style={{ color: "var(--color-text-tertiary)" }}>
                      {entry.ties}
                    </span>
                  </BlurredValue>
                </td>
                <td className="py-4 text-right">
                  <BlurredValue isBlurred={!isSignificant}>
                    <span
                      className="font-mono text-sm tabular-nums"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {entry.totalMatches}
                    </span>
                  </BlurredValue>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BlurredValue({
  isBlurred,
  children,
}: {
  isBlurred: boolean;
  children: React.ReactNode;
}) {
  if (!isBlurred) return <>{children}</>;
  return (
    <span
      className="select-none"
      style={{ filter: "blur(8px)", WebkitFilter: "blur(8px)" }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function EarlyStageDisclaimer({ totalVotes }: { totalVotes: number }) {
  return (
    <div
      className="flex items-start gap-3 rounded-[var(--radius-md)] border p-4"
      style={{
        background: "var(--color-bg-tertiary)",
        borderColor: "var(--color-border-brand)",
      }}
    >
      <div className="mt-0.5 shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          Not enough data yet
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          Rankings are hidden until enough votes are collected for statistically significant
          results. Currently: {totalVotes} vote{totalVotes !== 1 ? "s" : ""}. Keep
          comparing in the Arena to help reach that threshold!
        </p>
      </div>
    </div>
  );
}
