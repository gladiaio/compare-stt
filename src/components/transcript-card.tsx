"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { DiffSegment } from "@/lib/diff";

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface TranscriptCardProps {
  label: string;
  transcript: string;
  words?: WordTimestamp[];
  currentTime?: number;
  diffSegments?: DiffSegment[];
  error?: string | null;
  providerName?: string;
  providerLogo?: string;
  providerColor?: string;
  revealed: boolean;
  isWinner?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function TranscriptCard({
  label,
  transcript,
  words,
  currentTime,
  diffSegments,
  error,
  providerName,
  providerLogo,
  providerColor,
  revealed,
  isWinner,
  selected,
  onClick,
}: TranscriptCardProps) {
  const [hovered, setHovered] = useState(false);

  const hasError = !!error;

  const borderColor = hasError
    ? "var(--color-text-error)"
    : selected
    ? "var(--color-accent-purple)"
    : isWinner
    ? "var(--color-accent-green)"
    : "var(--color-border-primary)";

  const boxShadow = hasError
    ? "0 0 24px rgba(239, 68, 68, 0.1)"
    : isWinner
    ? "0 0 24px rgba(74, 222, 128, 0.15)"
    : selected
    ? "0 0 24px rgba(148, 122, 252, 0.15)"
    : "none";

  const hasWordSync = words && words.length > 0 && currentTime != null;

  const diffWordIndices = useMemo(() => {
    if (!diffSegments) return null;
    const indices = new Set<number>();
    let wordIdx = 0;
    for (const seg of diffSegments) {
      const segWords = seg.text.split(/\s+/).filter(Boolean);
      for (let i = 0; i < segWords.length; i++) {
        if (seg.type === "diff") indices.add(wordIdx);
        wordIdx++;
      }
    }
    return indices;
  }, [diffSegments]);

  if (hasError) {
    return (
      <div
        className="relative flex w-full flex-col rounded-[var(--radius-xl)] border p-6"
        style={{
          background: "var(--color-bg-tertiary)",
          borderColor,
          boxShadow,
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span
            className="font-mono text-xs uppercase tracking-[0.16em]"
            style={{ color: "var(--color-text-brand)" }}
          >
            {label}
          </span>
          {providerName && providerLogo && (
            <div className="relative h-4 w-20">
              <Image
                src={providerLogo}
                alt={providerName}
                fill
                className="object-contain object-right"
              />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "rgba(239, 68, 68, 0.1)" }}
          >
            <ErrorIcon />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-error)" }}>
            Transcription failed
          </p>
          <p
            className="max-w-xs text-center text-xs leading-relaxed"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (revealed && providerLogo) {
    return (
      <div
        className="relative flex w-full flex-col rounded-[var(--radius-xl)] border transition-all duration-300 overflow-hidden"
        style={{
          background: "var(--color-bg-tertiary)",
          borderColor,
          boxShadow,
          minHeight: "220px",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="absolute inset-0 p-6 select-none transition-opacity duration-300"
          aria-hidden="true"
          style={{
            opacity: hovered ? 0 : 0.07,
            filter: "blur(4px)",
            WebkitFilter: "blur(4px)",
            maskImage: "linear-gradient(to bottom, black 40%, transparent 90%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 90%)",
          }}
        >
          <div className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
            {transcript}
          </div>
        </div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 transition-opacity duration-300"
          style={{ opacity: hovered ? 0 : 1 }}
        >
          <span
            className="font-mono text-xs uppercase tracking-[0.16em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {label}
          </span>

          <div className="relative h-10 w-44">
            <Image
              src={providerLogo}
              alt={providerName || ""}
              fill
              className="object-contain"
            />
          </div>

          {isWinner && (
            <span
              className="flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1 text-xs font-medium animate-fade-in"
              style={{
                background: "rgba(74, 222, 128, 0.15)",
                color: "var(--color-accent-green)",
              }}
            >
              <TrophyIcon /> Winner
            </span>
          )}
        </div>

        <div
          className="absolute inset-0 flex flex-col p-6 transition-opacity duration-300 overflow-y-auto"
          style={{
            opacity: hovered ? 1 : 0,
            background: "var(--color-bg-tertiary)",
            pointerEvents: hovered ? "auto" : "none",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className="font-mono text-xs uppercase tracking-[0.16em]"
              style={{ color: "var(--color-text-brand)" }}
            >
              {label}
            </span>
            <div className="relative h-4 w-20">
              <Image
                src={providerLogo}
                alt={providerName || ""}
                fill
                className="object-contain object-right"
              />
            </div>
          </div>
          <div
            className="flex-1 text-sm leading-relaxed"
            style={{ color: "var(--color-text-primary)" }}
          >
            {hasWordSync ? (
              <SyncedWords words={words} currentTime={currentTime} diffIndices={diffWordIndices} />
            ) : (
              transcript
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="relative flex w-full flex-col rounded-[var(--radius-xl)] border p-6 transition-all duration-160"
      style={{
        background: "var(--color-bg-tertiary)",
        borderColor,
        boxShadow,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className="font-mono text-xs uppercase tracking-[0.16em]"
          style={{ color: "var(--color-text-brand)" }}
        >
          {label}
        </span>

        {revealed && providerName && !providerLogo && (
          <div
            className="flex items-center gap-2 rounded-[var(--radius-full)] border px-3 py-1 animate-fade-in"
            style={{
              borderColor: providerColor || "var(--color-border-primary)",
              background: "var(--color-bg-elevated)",
            }}
          >
            <span className="text-xs font-medium" style={{ color: providerColor }}>
              {providerName}
            </span>
          </div>
        )}

        {revealed && isWinner && (
          <span
            className="ml-2 flex items-center gap-1 rounded-[var(--radius-full)] px-2 py-0.5 text-xs font-medium animate-fade-in"
            style={{
              background: "rgba(74, 222, 128, 0.15)",
              color: "var(--color-accent-green)",
            }}
          >
            <TrophyIcon /> Winner
          </span>
        )}
      </div>

      <div
        className="flex-1 text-base leading-relaxed"
        style={{ color: "var(--color-text-primary)" }}
      >
        {hasWordSync ? (
          <SyncedWords words={words} currentTime={currentTime} diffIndices={diffWordIndices} />
        ) : diffSegments ? (
          <HighlightedText segments={diffSegments} />
        ) : (
          transcript
        )}
      </div>
    </div>
  );
}

function SyncedWords({
  words,
  currentTime,
  diffIndices,
}: {
  words: WordTimestamp[];
  currentTime: number;
  diffIndices?: Set<number> | null;
}) {
  const isPlaying = currentTime > 0;

  const activeIndex = useMemo(() => {
    if (!isPlaying) return -1;
    for (let i = words.length - 1; i >= 0; i--) {
      if (currentTime >= words[i].start) return i;
    }
    return -1;
  }, [words, currentTime, isPlaying]);

  return (
    <>
      {words.map((w, i) => {
        const isActive = isPlaying && i === activeIndex;
        const isPast = isPlaying && i < activeIndex;
        const isFuture = isPlaying && !isActive && !isPast;
        const isDiff = diffIndices?.has(i) ?? false;
        return (
          <span
            key={i}
            className="transition-colors duration-100 rounded-sm"
            style={{
              color: isActive
                ? "var(--color-accent-purple)"
                : isFuture
                ? "var(--color-text-tertiary)"
                : "var(--color-text-primary)",
              fontWeight: isActive ? 600 : 400,
              background: isDiff ? "rgba(148, 122, 252, 0.2)" : undefined,
              padding: isDiff ? "0 2px" : undefined,
            }}
          >
            {w.word}{" "}
          </span>
        );
      })}
    </>
  );
}

export function TranscriptCardSkeleton({ label }: { label: string }) {
  return (
    <div
      className="flex w-full flex-col rounded-[var(--radius-xl)] border p-6"
      style={{
        background: "var(--color-bg-tertiary)",
        borderColor: "var(--color-border-primary)",
      }}
    >
      <span
        className="mb-4 font-mono text-xs uppercase tracking-[0.16em]"
        style={{ color: "var(--color-text-brand)" }}
      >
        {label}
      </span>
      <div className="flex flex-col gap-3">
        <div className="h-4 w-full rounded-[var(--radius-sm)] animate-skeleton" style={{ background: "var(--color-bg-elevated)" }} />
        <div className="h-4 w-5/6 rounded-[var(--radius-sm)] animate-skeleton" style={{ background: "var(--color-bg-elevated)", animationDelay: "0.2s" }} />
        <div className="h-4 w-4/6 rounded-[var(--radius-sm)] animate-skeleton" style={{ background: "var(--color-bg-elevated)", animationDelay: "0.4s" }} />
        <div className="h-4 w-3/4 rounded-[var(--radius-sm)] animate-skeleton" style={{ background: "var(--color-bg-elevated)", animationDelay: "0.6s" }} />
      </div>
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function HighlightedText({ segments }: { segments: DiffSegment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === "diff" ? (
          <mark
            key={i}
            className="rounded-sm px-0.5"
            style={{
              background: "rgba(148, 122, 252, 0.2)",
              color: "var(--color-text-primary)",
            }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

function ErrorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
