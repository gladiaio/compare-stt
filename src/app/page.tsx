"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { AudioRecorder } from "@/components/audio-recorder";
import { AudioUploader } from "@/components/audio-uploader";
import { AudioPlayer } from "@/components/audio-player";
import { TranscriptCard, TranscriptCardSkeleton } from "@/components/transcript-card";
import type { WordTimestamp } from "@/components/transcript-card";
import { VoteButtons } from "@/components/vote-buttons";
import { SessionSummary } from "@/components/session-summary";
import { computeWordDiff } from "@/lib/diff";
import { upload } from "@vercel/blob/client";

type Phase = "input" | "transcribing" | "compare" | "voting" | "reveal";

interface ProviderReveal {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  color?: string;
}

interface TranscriptionResult {
  matchToken: string;
  transcriptA: string;
  transcriptB: string;
  wordsA?: WordTimestamp[];
  wordsB?: WordTimestamp[];
  errorA?: string | null;
  errorB?: string | null;
}

interface RevealData {
  providerA: ProviderReveal;
  providerB: ProviderReveal;
  winnerId: string | null;
}

interface SessionStats {
  totalVotes: number;
  providerWins: Record<string, { name: string; wins: number; appearances: number }>;
}

export default function ArenaPage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [phase, setPhase] = useState<Phase>("input");
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [reveal, setReveal] = useState<RevealData | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioTime, setAudioTime] = useState(0);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("compare-stt-session") : null;
    if (stored) {
      setSessionId(stored);
    } else {
      const id = crypto.randomUUID();
      setSessionId(id);
      if (typeof window !== "undefined") localStorage.setItem("compare-stt-session", id);
    }
  }, []);

  const audioUrlRef = useRef<string | null>(null);

  const handleAudioSubmit = useCallback(
    async (blob: Blob) => {
      setPhase("transcribing");
      setResult(null);
      setReveal(null);
      setAudioTime(0);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);

      try {
        const localUrl = URL.createObjectURL(blob);
        audioUrlRef.current = localUrl;
        setAudioUrl(localUrl);

        const ext = blob.type.includes("webm") ? "webm"
          : blob.type.includes("mp4") ? "mp4"
          : blob.type.includes("wav") ? "wav"
          : blob.type.includes("mpeg") || blob.type.includes("mp3") ? "mp3"
          : blob.type.includes("ogg") ? "ogg"
          : blob.type.includes("flac") ? "flac"
          : "audio";

        const { url: blobUrl } = await upload(`arena/${sessionId}.${ext}`, blob, {
          access: "private",
          handleUploadUrl: "/api/upload",
        });

        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            blobUrl,
            mimeType: blob.type || "audio/webm",
          }),
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

      setPhase("voting");
      setVoteCount((c) => c + 1);

      try {
        const res = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchToken: result.matchToken,
            choice,
          }),
        });

        if (!res.ok) throw new Error("Vote failed");

        const data: RevealData = await res.json();
        setReveal(data);
        setPhase("reveal");
      } catch (err) {
        console.error("Vote failed:", err);
        setPhase("compare");
      }
    },
    [result]
  );

  const handlePlayAgain = useCallback(() => {
    setPhase("input");
    setResult(null);
    setReveal(null);
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    setAudioUrl(null);
    setAudioTime(0);
  }, []);

  useEffect(() => {
    const reset = () => handlePlayAgain();
    window.addEventListener("arena:reset", reset);
    return () => window.removeEventListener("arena:reset", reset);
  }, [handlePlayAgain]);

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
    localStorage.setItem("compare-stt-session", id);
    setVoteCount(0);
    setPhase("input");
    setResult(null);
    setReveal(null);
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    setAudioUrl(null);
    setAudioTime(0);
  }, []);

  const diff = result && !result.errorA && !result.errorB
    ? computeWordDiff(result.transcriptA, result.transcriptB)
    : null;

  const transcriptsIdentical = result && !result.errorA && !result.errorB
    && result.transcriptA === result.transcriptB;

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
              Blind STT Comparison
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
              <span style={{ color: "var(--color-accent-purple)" }}>
                is the <RotatingWord />
              </span>
            </h1>
            <p
              className="max-w-md text-base"
              style={{
                color: "var(--color-text-secondary)",
                lineHeight: 1.5,
              }}
            >
              Record your voice or upload an audio file. We&apos;ll transcribe it with
              two providers. You pick the winner.
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
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: "var(--color-accent-purple)", borderTopColor: "transparent" }}
              />
              <p
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Transcribing…
              </p>
            </div>
            <WaitingMessage active={phase === "transcribing"} />
          </div>
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            <TranscriptCardSkeleton label="Model A" />
            <TranscriptCardSkeleton label="Model B" />
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            *&thinsp;Built for exploration, not a substitute for proper evaluation.
            For proper evaluation, refer to the{" "}
            <a
              href="https://github.com/gladiaio/normalization/tree/main?tab=readme-ov-file#quick-start"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              benchmark methodology
            </a>
            .
          </p>
        </div>
      )}

      {/* Compare & Vote */}
      {(phase === "compare" || phase === "voting") && result && (
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
              words={result.wordsA}
              currentTime={audioTime}
              diffSegments={diff?.segmentsA}
              diffWordIndices={diff?.diffIndicesA}
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
              words={result.wordsB}
              currentTime={audioTime}
              diffSegments={diff?.segmentsB}
              diffWordIndices={diff?.diffIndicesB}
              error={result.errorB}
              revealed={false}
            />
          </div>

          <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            *&thinsp;Built for exploration, not a substitute for proper evaluation.
            For proper evaluation, refer to the{" "}
            <a
              href="https://github.com/gladiaio/normalization/tree/main?tab=readme-ov-file#quick-start"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              benchmark methodology
            </a>
            .
          </p>

          {audioUrl && (
            <div className="w-full max-w-lg">
              <AudioPlayer src={audioUrl} onTimeUpdate={setAudioTime} />
            </div>
          )}

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
              disabled={phase === "voting"}
              transcriptA={result.transcriptA}
              transcriptB={result.transcriptB}
              disableA={!!result.errorA}
              disableB={!!result.errorB}
            />
          )}
        </div>
      )}

      {/* Reveal */}
      {phase === "reveal" && result && reveal && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 w-full animate-fade-in">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {reveal.winnerId === null ? "It's a tie!" : "And the winner is..."}
            </h2>
          </div>

          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            <TranscriptCard
              label="Model A"
              transcript={result.transcriptA}
              error={result.errorA}
              providerName={reveal.providerA.name}
              providerLogo={reveal.providerA.logoUrl}
              providerColor={reveal.providerA.color}
              revealed={true}
              isWinner={reveal.winnerId === reveal.providerA.id}
            />
            <TranscriptCard
              label="Model B"
              transcript={result.transcriptB}
              error={result.errorB}
              providerName={reveal.providerB.name}
              providerLogo={reveal.providerB.logoUrl}
              providerColor={reveal.providerB.color}
              revealed={true}
              isWinner={reveal.winnerId === reveal.providerB.id}
            />
          </div>

          <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            *&thinsp;Built for exploration, not a substitute for proper evaluation.
            For proper evaluation, refer to the{" "}
            <a
              href="https://github.com/gladiaio/normalization/tree/main?tab=readme-ov-file#quick-start"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              benchmark methodology
            </a>
            .
          </p>

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

const WAITING_MESSAGES = [
  "The models are warming up their vocal cords... 🎤",
  "Teaching AI to listen is harder than it sounds... 👂",
  "Somewhere, a GPU is working very hard for you 🔥",
  "Fun fact: humans mishear ~1 word in 4. Let's see if AI does better 🤔",
  "Decoding audio waves into squiggly letters... ✨",
  "The bits are being crunched. Aggressively. 💪",
  "Almost there... probably... maybe... 🤞",
  "If this were the 90s, you'd be waiting way longer ☎️",
  "Plot twist: the audio was silence all along 🤫",
  "Patience is a virtue. Also a requirement here. 🧘",
];

function WaitingMessage({ active }: { active: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shuffled = useMemo(
    () => [...WAITING_MESSAGES].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active]
  );

  useEffect(() => {
    if (!active) {
      setMessageIndex(0);
      setVisible(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % shuffled.length);
        setVisible(true);
      }, 300);
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, shuffled]);

  return (
    <p
      className="text-center text-sm transition-all duration-300"
      style={{
        color: "var(--color-text-secondary)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
      }}
    >
      {shuffled[messageIndex]}
    </p>
  );
}

const ROTATING_WORDS = [
  { text: "best?", emoji: "🏆" },
  { text: "worst?", emoji: "💀" },
  { text: "fastest?", emoji: "⚡" },
  { text: "funniest?", emoji: "😂" },
  { text: "weirdest?", emoji: "🤯" },
];

function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"visible" | "out" | "swap">("visible");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cycle = () => {
      setPhase("out");
      timeoutRef.current = setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        setPhase("swap");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setPhase("visible"));
        });
      }, 250);
    };

    const interval = setInterval(cycle, 2200);
    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const isHidden = phase === "out" || phase === "swap";

  return (
    <span
      className="inline-block transition-all duration-250 ease-in-out"
      style={{
        transform: isHidden ? "translateY(40%)" : "translateY(0)",
        opacity: isHidden ? 0 : 1,
      }}
    >
      {ROTATING_WORDS[index].text}{" "}
      <span className="inline-block" role="img" aria-hidden="true">
        {ROTATING_WORDS[index].emoji}
      </span>
    </span>
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
