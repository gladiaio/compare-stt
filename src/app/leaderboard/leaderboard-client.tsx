"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { AudioRecorder } from "@/components/audio-recorder";
import { AudioUploader } from "@/components/audio-uploader";
import { getUploadCount, REQUIRED_UPLOADS } from "@/lib/upload-count";
import { setPendingAudio } from "@/lib/pending-audio";

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

export function LeaderboardClient({
  gamificationEnabled,
}: {
  gamificationEnabled: boolean;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isSignificant, setIsSignificant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadCount, setUploadCount] = useState(0);

  useEffect(() => {
    setUploadCount(getUploadCount());
  }, []);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        setEntries(data.leaderboard);
        setTotalVotes(data.totalVotes);
        setIsSignificant(data.isSignificant);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const gateBlocked = gamificationEnabled && uploadCount < REQUIRED_UPLOADS;

  const handleAudioFromGate = (blob: Blob) => {
    setPendingAudio(blob);
    router.push("/");
  };

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
        <div className="relative">
          {gateBlocked && (
            <LeaderboardGate
              uploadCount={uploadCount}
              onAudioSubmit={handleAudioFromGate}
            />
          )}

          {!gateBlocked && !isSignificant && <UnlockedButHiddenTeaser />}

          <div
            style={
              gateBlocked
                ? {
                    filter: "blur(8px) saturate(0.3)",
                    opacity: 0.4,
                    pointerEvents: "none",
                    userSelect: "none",
                  }
                : undefined
            }
            aria-hidden={gateBlocked}
          >
            <LeaderboardTable
              entries={entries}
              totalVotes={totalVotes}
              isSignificant={isSignificant}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LeaderboardGate({
  uploadCount,
  onAudioSubmit,
}: {
  uploadCount: number;
  onAudioSubmit: (blob: Blob) => void;
}) {
  const remaining = REQUIRED_UPLOADS - uploadCount;

  return (
    <div className="relative z-10 mb-8 flex flex-col items-center gap-8 rounded-[var(--radius-xl)] border p-8 md:p-12"
      style={{
        background: "var(--color-bg-primary)",
        borderColor: "var(--color-border-brand)",
      }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--color-bg-brand)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2
          className="text-xl font-semibold tracking-tight md:text-2xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          Unlock the Leaderboard
        </h2>
        <p
          className="max-w-md text-sm"
          style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}
        >
          To see the rankings, participate in the Arena first!
          Compare transcriptions and help the community decide which STT provider is best.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {Array.from({ length: REQUIRED_UPLOADS }).map((_, i) => (
          <div
            key={i}
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
            style={
              i < uploadCount
                ? {
                    background: "var(--color-accent-purple)",
                    color: "#fff",
                  }
                : {
                    background: "var(--color-bg-tertiary)",
                    color: "var(--color-text-tertiary)",
                    border: "1px solid var(--color-border-primary)",
                  }
            }
          >
            {i < uploadCount ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
        ))}
        <span
          className="ml-2 text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {remaining} more comparison{remaining !== 1 ? "s" : ""} to go
        </span>
      </div>

      <div className="flex w-full flex-col items-center gap-5">
        <AudioRecorder onRecordingComplete={onAudioSubmit} />

        <div className="flex items-center gap-4">
          <div className="h-px w-12" style={{ background: "var(--color-border-primary)" }} />
          <span className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
            or
          </span>
          <div className="h-px w-12" style={{ background: "var(--color-border-primary)" }} />
        </div>

        <AudioUploader onFileSelected={onAudioSubmit} />
      </div>
    </div>
  );
}

function UnlockedButHiddenTeaser() {
  return (
    <div
      className="mb-6 flex items-start gap-3 rounded-[var(--radius-md)] border p-4"
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
          Thanks for playing! Rankings are almost ready.
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          We&apos;re still collecting votes to make the rankings statistically meaningful.
          Check back in a few days — the leaderboard will be revealed soon!
        </p>
      </div>
    </div>
  );
}
