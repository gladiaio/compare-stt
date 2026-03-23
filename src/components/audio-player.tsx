"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface AudioPlayerProps {
  src: string;
  onTimeUpdate?: (currentTime: number) => void;
}

export function AudioPlayer({ src, onTimeUpdate }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const rafRef = useRef<number | null>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const startTicking = useCallback(() => {
    const loop = () => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;
      const t = audio.currentTime;
      setCurrentTime(t);
      onTimeUpdateRef.current?.(t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setPlaying(true);
      startTicking();
    } else {
      audio.pause();
      setPlaying(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, [startTicking]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = ratio * duration;
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    },
    [duration, onTimeUpdate]
  );

  const fmt = (s: number) => {
    if (!Number.isFinite(s)) return "-:--";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="flex w-full items-center gap-3 rounded-[var(--radius-lg)] border px-4 py-3"
      style={{
        background: "var(--color-bg-tertiary)",
        borderColor: "var(--color-border-primary)",
      }}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          if (!audio) return;
          if (Number.isFinite(audio.duration)) {
            setDuration(audio.duration);
          } else {
            audio.currentTime = 1e101;
          }
        }}
        onDurationChange={() => {
          const audio = audioRef.current;
          if (!audio || !Number.isFinite(audio.duration)) return;
          setDuration(audio.duration);
          if (audio.currentTime > audio.duration) {
            audio.currentTime = 0;
          }
        }}
        onEnded={() => {
          setPlaying(false);
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
        }}
      />

      <button
        onClick={togglePlay}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-100 hover:scale-110 active:scale-95"
        style={{ background: "var(--color-accent-purple)" }}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>

      <div
        className="relative h-1.5 flex-1 cursor-pointer rounded-full"
        style={{ background: "var(--color-bg-elevated)" }}
        onClick={handleSeek}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-75"
          style={{
            width: `${progress}%`,
            background: "var(--color-accent-purple)",
          }}
        />
      </div>

      <span
        className="flex-shrink-0 font-mono text-xs tabular-nums"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {fmt(currentTime)} / {fmt(duration)}
      </span>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
