"use client";

import Image from "next/image";
import { useState, useEffect, useLayoutEffect, useRef } from "react";

interface LeaderboardEntry {
  id: string;
  name: string;
  logoUrl: string;
  model: string;
  rating: number;
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
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function LeaderboardTable({
  entries,
  totalVotes,
  isSignificant,
}: LeaderboardTableProps) {
  const shouldShuffle = !isSignificant && entries.length > 0 && totalVotes > 0;

  const [shuffledIds, setShuffledIds] = useState<string[]>(() =>
    entries.map((e) => e.id)
  );
  const [rowHeight, setRowHeight] = useState(0);
  const [animateTransitions, setAnimateTransitions] = useState(false);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  // Reset shuffle state when entries change (React "adjust state during render" pattern)
  const [prevEntries, setPrevEntries] = useState(entries);
  if (entries !== prevEntries) {
    setPrevEntries(entries);
    setShuffledIds(entries.map((e) => e.id));
    setAnimateTransitions(false);
  }

  // Measure row height before paint to avoid a flash of unsorted rows
  useLayoutEffect(() => {
    if (!shouldShuffle || !tbodyRef.current) return;
    const firstRow = tbodyRef.current.querySelector("tr");
    if (firstRow) {
      setRowHeight(firstRow.getBoundingClientRect().height);
    }
  }, [shouldShuffle, entries]);

  // Enable transitions shortly after mount so the initial positioning is instant
  useEffect(() => {
    if (!shouldShuffle) return;
    const timer = setTimeout(() => setAnimateTransitions(true), 50);
    return () => clearTimeout(timer);
  }, [shouldShuffle]);

  // Reshuffle every 2.5 seconds
  useEffect(() => {
    if (!shouldShuffle) return;
    const interval = setInterval(() => {
      setShuffledIds((prev) => shuffleArray(prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [shouldShuffle]);

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

  // Stable DOM order when shuffling so transforms can animate row positions
  const displayEntries = shouldShuffle
    ? [...entries].sort((a, b) => a.id.localeCompare(b.id))
    : entries;

  const getRowTransform = (entryId: string, domIndex: number): string | undefined => {
    if (!shouldShuffle || rowHeight === 0) return undefined;
    const visualIndex = shuffledIds.indexOf(entryId);
    if (visualIndex === -1) return undefined;
    const offset = (visualIndex - domIndex) * rowHeight;
    return `translateY(${offset}px)`;
  };

  // In border-separate mode, borders must live on cells (not rows)
  const cellBorder = shouldShuffle
    ? { borderBottom: "1px solid var(--color-border-tertiary)" }
    : undefined;
  const headerCellBorder = shouldShuffle
    ? { borderBottom: "1px solid var(--color-border-primary)" }
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="w-full overflow-x-auto">
        <table
          className="w-full"
          style={
            shouldShuffle
              ? { borderCollapse: "separate", borderSpacing: 0 }
              : undefined
          }
        >
          <thead>
            <tr
              className={`${shouldShuffle ? "" : "border-b "}text-left text-xs font-mono uppercase tracking-[0.16em]`}
              style={{
                ...(shouldShuffle
                  ? {}
                  : { borderColor: "var(--color-border-primary)" }),
                color: "var(--color-text-tertiary)",
              }}
            >
              <th className="pb-3 pr-4" style={headerCellBorder}>Provider</th>
              <th className="pb-3 pr-4 text-right" style={headerCellBorder}>ELO</th>
              <th className="hidden pb-3 pr-4 text-right sm:table-cell" style={headerCellBorder}>Win Rate</th>
              <th className="hidden pb-3 pr-4 text-right md:table-cell" style={headerCellBorder}>W</th>
              <th className="hidden pb-3 pr-4 text-right md:table-cell" style={headerCellBorder}>L</th>
              <th className="hidden pb-3 pr-4 text-right md:table-cell" style={headerCellBorder}>T</th>
              <th className="pb-3 text-right" style={headerCellBorder}>Matches</th>
            </tr>
          </thead>
          <tbody ref={tbodyRef}>
            {displayEntries.map((entry, index) => (
              <tr
                key={entry.id}
                className={shouldShuffle ? "" : "border-b transition-colors duration-160"}
                style={
                  shouldShuffle
                    ? {
                        transform: getRowTransform(entry.id, index),
                        transition: animateTransitions
                          ? "transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)"
                          : "none",
                        position: "relative" as const,
                        willChange: "transform",
                      }
                    : {
                        borderColor: "var(--color-border-tertiary)",
                        animationDelay: `${index * 60}ms`,
                      }
                }
              >
                <td className="py-4 pr-4" style={cellBorder}>
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
                <td className="py-4 pr-4 text-right" style={cellBorder}>
                  <BlurredValue isBlurred={!isSignificant}>
                    <span
                      className="font-mono text-sm font-semibold tabular-nums"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {entry.rating}
                    </span>
                  </BlurredValue>
                </td>
                <td className="hidden py-4 pr-4 text-right sm:table-cell" style={cellBorder}>
                  <BlurredValue isBlurred={!isSignificant}>
                    <span
                      className="font-mono text-sm tabular-nums"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {(entry.winRate * 100).toFixed(1)}%
                    </span>
                  </BlurredValue>
                </td>
                <td className="hidden py-4 pr-4 text-right md:table-cell" style={cellBorder}>
                  <BlurredValue isBlurred={!isSignificant}>
                    <span className="font-mono text-sm tabular-nums" style={{ color: "var(--color-accent-green)" }}>
                      {entry.wins}
                    </span>
                  </BlurredValue>
                </td>
                <td className="hidden py-4 pr-4 text-right md:table-cell" style={cellBorder}>
                  <BlurredValue isBlurred={!isSignificant}>
                    <span className="font-mono text-sm tabular-nums" style={{ color: "var(--color-text-error)" }}>
                      {entry.losses}
                    </span>
                  </BlurredValue>
                </td>
                <td className="hidden py-4 pr-4 text-right md:table-cell" style={cellBorder}>
                  <BlurredValue isBlurred={!isSignificant}>
                    <span className="font-mono text-sm tabular-nums" style={{ color: "var(--color-text-tertiary)" }}>
                      {entry.ties}
                    </span>
                  </BlurredValue>
                </td>
                <td className="py-4 text-right" style={cellBorder}>
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

