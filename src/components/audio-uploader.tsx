"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GlassIconButton } from "@/components/glass-icon-button";

const MAX_DURATION_SECONDS = 120;

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read audio file"));
    };
    audio.src = url;
  });
}

interface AudioUploaderProps {
  onFileSelected: (blob: Blob) => void;
  disabled?: boolean;
  compact?: boolean;
  onUploadIntent?: (active: boolean) => void;
}

export function AudioUploader({ onFileSelected, disabled, compact = false, onUploadIntent }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEngaged, setIsEngaged] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const pickerPendingRef = useRef(false);

  const disengage = useCallback(() => {
    pickerPendingRef.current = false;
    setIsEngaged(false);
    onUploadIntent?.(false);
  }, [onUploadIntent]);

  useEffect(() => {
    const handleWindowFocus = () => {
      if (!pickerPendingRef.current) return;
      window.setTimeout(() => {
        pickerPendingRef.current = false;
        if (!inputRef.current?.files?.length && !validating) {
          disengage();
        }
      }, 100);
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, [disengage, validating]);

  const isActive = isEngaged || isDragging || validating;

  const validateAndSubmit = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(null);

      const ACCEPTED_TYPES = [
        "audio/",
        "video/mp4",
        "video/webm",
        "video/ogg",
      ];
      const ACCEPTED_EXTENSIONS = /\.(mp3|wav|m4a|aac|ogg|oga|opus|flac|wma|webm|mp4|caf|aiff|aif)$/i;

      const typeOk = ACCEPTED_TYPES.some((t) => file.type.startsWith(t)) || file.type === "";
      const extOk = ACCEPTED_EXTENSIONS.test(file.name);

      if (!typeOk && !extOk) {
        setError("Unsupported file format. Try mp3, wav, m4a, aac, mp4, ogg, flac, webm...");
        disengage();
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError("File is too large. Maximum size is 50MB.");
        disengage();
        return;
      }

      setValidating(true);
      setIsEngaged(true);
      onUploadIntent?.(true);
      try {
        const duration = await getAudioDuration(file);
        if (duration > MAX_DURATION_SECONDS) {
          const mins = Math.floor(duration / 60);
          const secs = Math.round(duration % 60);
          setError(
            `Audio is too long (${mins}:${secs.toString().padStart(2, "0")}). Maximum duration is 2 minutes.`
          );
          setValidating(false);
          disengage();
          return;
        }
      } catch {
        setError("Could not read audio duration. Please try another file.");
        setValidating(false);
        disengage();
        return;
      }
      setValidating(false);

      setFileName(file.name);
      onFileSelected(file);
    },
    [onFileSelected, disengage, onUploadIntent]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
      setIsEngaged(true);
      onUploadIntent?.(true);
    }
  }, [onUploadIntent]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
      if (!validating && !pickerPendingRef.current) {
        disengage();
      }
    }
  }, [disengage, validating]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSubmit(file);
    },
    [validateAndSubmit]
  );

  const handleClick = useCallback(() => {
    if (disabled || validating) return;
    pickerPendingRef.current = true;
    setIsEngaged(true);
    onUploadIntent?.(true);
    inputRef.current?.click();
  }, [disabled, validating, onUploadIntent]);

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept="audio/*,video/mp4,video/webm,video/ogg,.aac,.mp4,.m4a,.ogg,.flac,.opus,.wma,.caf,.aiff"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) validateAndSubmit(file);
      }}
    />
  );

  if (compact) {
    return (
      <div className="flex flex-col items-center">
        <GlassIconButton
          compact
          flat
          noHoverScale
          active={isActive}
          pulse={validating}
          disabled={disabled || validating}
          ariaLabel={validating ? "Checking audio file" : "Upload audio file"}
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadIcon active={isActive} />
        </GlassIconButton>
        {hiddenInput}
        {error && (
          <p className="mt-2 max-w-48 text-center text-xs" style={{ color: "var(--color-text-error)" }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md overflow-visible px-2 py-3">
      <div className="relative overflow-visible">
        {isDragging && (
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 rounded-[calc(var(--radius-xl)+16px)] transition-all duration-200"
            style={{
              background:
                "radial-gradient(ellipse at center, var(--card-glow-burst) 0%, var(--card-glow-burst-secondary) 35%, transparent 70%)",
              filter: "blur(24px)",
              opacity: 0.9,
            }}
          />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-[calc(var(--radius-xl)+8px)] transition-all duration-300"
          style={{
            background: isDragging
              ? "radial-gradient(ellipse at center, var(--card-glow-active) 0%, var(--card-glow-active-secondary) 45%, transparent 75%)"
              : "radial-gradient(ellipse at center, var(--card-glow) 0%, var(--card-glow-secondary) 50%, transparent 75%)",
            filter: "blur(14px)",
            opacity: isDragging ? 1 : 0.7,
          }}
        />
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className="relative isolate flex cursor-pointer flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-dashed p-8 transition-all duration-160"
          style={{
            borderColor: isDragging
              ? "rgba(148, 122, 252, 0.45)"
              : "rgba(255, 255, 255, 0.1)",
            background: isDragging ? "var(--liquid-glass-bg-active)" : "var(--liquid-glass-bg)",
            backdropFilter: "blur(8px) saturate(180%)",
            WebkitBackdropFilter: "blur(8px) saturate(180%)",
            boxShadow: isDragging ? "var(--liquid-glass-shadow-active)" : "var(--liquid-glass-shadow)",
            opacity: disabled || validating ? 0.4 : 1,
            pointerEvents: disabled || validating ? "none" : "auto",
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--radius-xl)]"
            style={{ background: "var(--liquid-glass-highlight)" }}
          />
          <UploadIcon active={isDragging} />
          <div className="relative z-10 text-center">
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {validating ? "Checking audio…" : fileName || "Drop an audio file here"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs" style={{ color: "var(--color-text-error)" }}>
          {error}
        </p>
      )}

      {hiddenInput}
    </div>
  );
}

function UploadIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--color-accent-purple)" : "#FFF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-colors duration-160"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
