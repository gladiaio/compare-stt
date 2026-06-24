"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface LeaderEntry {
  name: string;
  logoUrl: string;
  model: string;
  rating: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderEntry[];
  totalVotes: number;
  isSignificant: boolean;
}

export function LeaderboardNewsBubble() {
  const [leader, setLeader] = useState<LeaderEntry | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLeader() {
      try {
        const res = await fetch(`${BASE_PATH}/api/leaderboard`);
        if (!res.ok) return;

        const data: LeaderboardResponse = await res.json();
        if (cancelled || !data.isSignificant || data.totalVotes === 0) return;

        const top = data.leaderboard[0];
        if (top) setLeader(top);
      } catch {
        // Non-blocking — bubble simply stays hidden
      }
    }

    loadLeader();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!leader) return null;

  return (
    <Link
      href="/leaderboard"
      className="group inline-flex max-w-md items-center gap-3 rounded-[var(--radius-full)] border px-4 py-2 transition-all duration-160 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "var(--color-bg-tertiary)",
        borderColor: "var(--color-border-secondary)",
      }}
    >
      <div className="relative h-6 w-24 shrink-0 translate-y-0.5 md:h-7 md:w-28">
        <Image
          src={`${BASE_PATH}${leader.logoUrl}`}
          alt={leader.name}
          fill
          className="object-contain object-left"
        />
      </div>

      <p className="text-left text-sm leading-snug" style={{ color: "var(--color-text-secondary)" }}>
        #1 right now
        <span
          className="ml-1 inline-block transition-transform duration-160 group-hover:translate-x-0.5"
        >
          →
        </span>
      </p>
    </Link>
  );
}
