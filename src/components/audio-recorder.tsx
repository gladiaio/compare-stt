"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const MAX_DURATION = 120;

const PREFERRED_MIMES = [
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/webm;codecs=opus",
  "audio/webm",
];

function pickRecordingMime(): string {
  for (const mime of PREFERRED_MIMES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onRecordingComplete, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(new Array(32).fill(0));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    analyserRef.current = null;
    audioCtxRef.current = null;
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = pickRecordingMime();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onRecordingComplete(blob);
        cleanup();
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= MAX_DURATION - 1) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);

      const updateLevels = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const normalized = Array.from(data).map((v) => v / 255);
        setLevels(normalized);
        animFrameRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();
    } catch {
      console.error("Microphone access denied");
    }
  }, [onRecordingComplete, cleanup]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const glowActive = isPressed || isRecording;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative overflow-visible p-10">
        <div className="relative h-20 w-20">
          {glowActive && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full transition-all duration-200"
              style={{
                background:
                  "radial-gradient(circle, var(--card-glow-burst) 0%, var(--card-glow-burst-secondary) 30%, transparent 68%)",
                filter: "blur(22px)",
                transform: "scale(2.6)",
                opacity: isRecording ? 1 : 0.75,
              }}
            />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full transition-all duration-300"
            style={{
              background: glowActive
                ? "radial-gradient(circle, var(--card-glow-active) 0%, var(--card-glow-active-secondary) 40%, transparent 72%)"
                : "radial-gradient(circle, var(--card-glow) 0%, var(--card-glow-secondary) 45%, transparent 70%)",
              filter: "blur(12px)",
              opacity: glowActive ? 1 : 0.85,
              transform: `scale(${glowActive ? (isRecording ? 1.4 : 1.2) : 1})`,
            }}
          />
          {isRecording && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full animate-pulse-ring"
              style={{ background: "rgba(148, 122, 252, 0.28)" }}
            />
          )}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            onPointerDown={() => !disabled && setIsPressed(true)}
            onPointerUp={() => setIsPressed(false)}
            onPointerLeave={() => setIsPressed(false)}
            onPointerCancel={() => setIsPressed(false)}
            disabled={disabled}
            className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-transparent transition-all duration-160 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: glowActive ? "var(--liquid-glass-bg-active)" : "var(--liquid-glass-bg)",
              backdropFilter: "blur(8px) saturate(180%)",
              WebkitBackdropFilter: "blur(8px) saturate(180%)",
              boxShadow: glowActive ? "var(--liquid-glass-shadow-active)" : "var(--liquid-glass-shadow)",
            }}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: "var(--liquid-glass-highlight)" }}
          />
          <span className="relative z-10">
            {isRecording ? <StopIcon /> : <MicLargeIcon />}
          </span>
        </button>
        </div>
      </div>

      {isRecording && (
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="flex h-12 items-end gap-[2px]">
            {levels.slice(0, 24).map((level, i) => (
              <div
                key={i}
                className="w-1 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(4, level * 48)}px`,
                  background: "var(--color-accent-purple)",
                  opacity: 0.4 + level * 0.6,
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ background: "var(--color-accent-purple)" }}
            />
            <span
              className="font-mono text-sm tabular-nums"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {formatTime(elapsed)} / {formatTime(MAX_DURATION)}
            </span>
          </div>
        </div>
      )}

      {!isRecording && (
        <p
          className="text-sm"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Click to record (max 2 min)
        </p>
      )}
    </div>
  );
}

function MicLargeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFF">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
