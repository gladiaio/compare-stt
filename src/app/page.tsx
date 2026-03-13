"use client";

import { useState, useCallback, useEffect } from "react";
import { AudioRecorder } from "@/components/audio-recorder";
import { AudioUploader } from "@/components/audio-uploader";
import { TranscriptCard, TranscriptCardSkeleton } from "@/components/transcript-card";
import { VoteButtons } from "@/components/vote-buttons";
import { SessionSummary } from "@/components/session-summary";
import { PROVIDERS } from "@/lib/providers";
import { computeWordDiff } from "@/lib/diff";

type Phase = "input" | "transcribing" | "compare" | "reveal";

interface ProviderResult {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
}

interface TranscriptionResult {
  providerA: ProviderResult;
  providerB: ProviderResult;
  transcriptA: string;
  transcriptB: string;
  errorA?: string | null;
  errorB?: string | null;
}

interface SessionStats {
  totalVotes: number;
  providerWins: Record<string, { name: string; wins: number; appearances: number }>;
}

export default function ArenaPage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [phase, setPhase] = useState<Phase>("input");
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("asr-arena-session") : null;
    if (stored) {
      setSessionId(stored);
    } else {
      const id = crypto.randomUUID();
      setSessionId(id);
      if (typeof window !== "undefined") localStorage.setItem("asr-arena-session", id);
    }
  }, []);

  const handleAudioSubmit = useCallback(
    async (blob: Blob) => {
      setPhase("transcribing");
      setResult(null);

      try {
        const formData = new FormData();
        formData.append("audio", blob);
        formData.append("sessionId", sessionId);

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Transcription failed");

        const data: TranscriptionResult = await res.json();
        setResult(data);
        setPhase("compare");
      } catch (err) {
        console.error(err);
        setPhase("input");
      }
    },
    [sessionId]
  );

  const handleVote = useCallback(
    async (choice: "a" | "tie" | "b") => {
      if (!result) return;

      let selectedWinnerId: string | null = null;
      if (choice === "a") selectedWinnerId = result.providerA.id;
      else if (choice === "b") selectedWinnerId = result.providerB.id;

      setWinnerId(selectedWinnerId);
      setPhase("reveal");
      setVoteCount((c) => c + 1);

      try {
        await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            providerAId: result.providerA.id,
            providerBId: result.providerB.id,
            winnerId: selectedWinnerId,
          }),
        });
      } catch (err) {
        console.error("Vote failed:", err);
      }
    },
    [result, sessionId]
  );

  const handlePlayAgain = useCallback(() => {
    setPhase("input");
    setResult(null);
    setWinnerId(null);
  }, []);

  const handleEndSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/session/${sessionId}/stats`);
      const stats: SessionStats = await res.json();
      setSessionStats(stats);
      setShowSummary(true);
    } catch (err) {
      console.error(err);
    }
  }, [sessionId]);

  const handleCloseSummary = useCallback(() => {
    setShowSummary(false);
    const id = crypto.randomUUID();
    setSessionId(id);
    localStorage.setItem("asr-arena-session", id);
    setVoteCount(0);
    setPhase("input");
    setResult(null);
    setWinnerId(null);
  }, []);

  const providerADef = result ? PROVIDERS.find((p) => p.slug === result.providerA.slug) : null;
  const providerBDef = result ? PROVIDERS.find((p) => p.slug === result.providerB.slug) : null;

  const diff = result && !result.errorA && !result.errorB
    ? computeWordDiff(result.transcriptA, result.transcriptB)
    : null;

  const transcriptsIdentical = result && !result.errorA && !result.errorB
    && result.transcriptA.toLowerCase().replace(/[^\w]/g, "") === result.transcriptB.toLowerCase().replace(/[^\w]/g, "");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl flex-col items-center px-6 py-12">
      {/* Hero */}
      {phase === "input" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-10 animate-fade-in">
          <div className="flex flex-col items-center gap-4 text-center">
            <span
              className="font-mono text-xs uppercase tracking-[0.16em]"
              style={{ color: "var(--color-text-brand)" }}
            >
              Blind ASR Comparison
            </span>
            <h1
              className="text-4xl font-semibold tracking-tight md:text-5xl"
              style={{
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Which transcription
              <br />
              <span style={{ color: "var(--color-accent-purple)" }}>is best?</span>{" "}
              You decide.
            </h1>
            <p
              className="max-w-md text-base"
              style={{
                color: "var(--color-text-secondary)",
                lineHeight: 1.5,
              }}
            >
              Record your voice or upload an audio file. We&apos;ll transcribe it with
              two providers, and you pick the winner.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <AudioRecorder onRecordingComplete={handleAudioSubmit} />

            <div className="flex items-center gap-4">
              <div className="h-px w-16" style={{ background: "var(--color-border-primary)" }} />
              <span className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
                or
              </span>
              <div className="h-px w-16" style={{ background: "var(--color-border-primary)" }} />
            </div>

            <AudioUploader onFileSelected={handleAudioSubmit} />
          </div>

          {voteCount > 0 && (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              {voteCount} comparison{voteCount > 1 ? "s" : ""} this session
            </p>
          )}
        </div>
      )}

      {/* Transcribing */}
      {phase === "transcribing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 w-full animate-fade-in">
          <div className="flex flex-col items-center gap-2">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: "var(--color-accent-purple)", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Transcribing with two providers...
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            <TranscriptCardSkeleton label="Model A" />
            <TranscriptCardSkeleton label="Model B" />
          </div>
        </div>
      )}

      {/* Compare & Vote */}
      {phase === "compare" && result && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 w-full animate-fade-in">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Compare the transcriptions
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Read both carefully, then vote for the more accurate one.
            </p>
          </div>

          <div className="relative grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            <TranscriptCard
              label="Model A"
              transcript={result.transcriptA}
              diffSegments={diff?.segmentsA}
              error={result.errorA}
              revealed={false}
            />

            {transcriptsIdentical && (
              <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:flex">
                <span
                  className="flex items-center gap-1.5 rounded-[var(--radius-full)] border px-3 py-1.5 text-xs font-medium shadow-lg"
                  style={{
                    background: "var(--color-bg-elevated)",
                    borderColor: "var(--color-accent-purple)",
                    color: "var(--color-accent-purple)",
                  }}
                >
                  <EqualsIcon size={12} /> identical
                </span>
              </div>
            )}

            <TranscriptCard
              label="Model B"
              transcript={result.transcriptB}
              diffSegments={diff?.segmentsB}
              error={result.errorB}
              revealed={false}
            />
          </div>

          {result.errorA && result.errorB ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm" style={{ color: "var(--color-text-error)" }}>
                Both providers failed. Please try again.
              </p>
              <button
                onClick={handlePlayAgain}
                className="flex items-center gap-2 rounded-[var(--radius-full)] border px-8 py-4 text-base font-semibold transition-all duration-160 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "var(--color-bg-inverse)",
                  color: "var(--color-text-inverse)",
                  borderColor: "transparent",
                }}
              >
                <RefreshIcon /> Try again
              </button>
            </div>
          ) : (
            <VoteButtons
              onVote={handleVote}
              transcriptA={result.transcriptA}
              transcriptB={result.transcriptB}
              disableA={!!result.errorA}
              disableB={!!result.errorB}
            />
          )}
        </div>
      )}

      {/* Reveal */}
      {phase === "reveal" && result && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 w-full animate-fade-in">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {winnerId === null ? "It's a tie!" : "And the winner is..."}
            </h2>
          </div>

          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            <TranscriptCard
              label="Model A"
              transcript={result.transcriptA}
              error={result.errorA}
              providerName={result.providerA.name}
              providerLogo={result.providerA.logoUrl}
              providerColor={providerADef?.color}
              revealed={true}
              isWinner={winnerId === result.providerA.id}
            />
            <TranscriptCard
              label="Model B"
              transcript={result.transcriptB}
              error={result.errorB}
              providerName={result.providerB.name}
              providerLogo={result.providerB.logoUrl}
              providerColor={providerBDef?.color}
              revealed={true}
              isWinner={winnerId === result.providerB.id}
            />
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handlePlayAgain}
              className="flex items-center gap-2 rounded-[var(--radius-full)] border px-8 py-4 text-base font-semibold transition-all duration-160 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "var(--color-bg-inverse)",
                color: "var(--color-text-inverse)",
                borderColor: "transparent",
              }}
            >
              <RefreshIcon /> Play again
            </button>
            <button
              onClick={handleEndSession}
              className="text-sm font-medium transition-colors duration-160 hover:underline"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              End session ({voteCount})
            </button>
          </div>
        </div>
      )}

      {/* Session Summary Modal */}
      {showSummary && sessionStats && (
        <SessionSummary stats={sessionStats} onClose={handleCloseSummary} />
      )}
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function EqualsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="9" x2="19" y2="9" />
      <line x1="5" y1="15" x2="19" y2="15" />
    </svg>
  );
}
