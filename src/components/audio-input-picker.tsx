"use client";

import { useState, useRef, useLayoutEffect, useCallback, type ReactNode } from "react";
import { AudioRecorder } from "@/components/audio-recorder";
import { AudioUploader } from "@/components/audio-uploader";

type HoveredOption = "record" | "upload" | null;

interface HintContent {
  title: string;
  description: string;
}

interface AudioInputPickerProps {
  onAudioSubmit: (blob: Blob) => void;
  disabled?: boolean;
}

const EASE = "cubic-bezier(0.33, 0, 0.2, 1)";
const MOTION_MS = 800;
const HOVER_NUDGE = 8;

export function AudioInputPicker({ onAudioSubmit, disabled }: AudioInputPickerProps) {
  const [hovered, setHovered] = useState<HoveredOption>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCentered, setIsCentered] = useState(false);
  const [isUploadActive, setIsUploadActive] = useState(false);
  const [centerOffset, setCenterOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const recordRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (hovered === "record" || isRecording || isCentered) return;

    const updateOffset = () => {
      if (!containerRef.current || !recordRef.current) return;
      const container = containerRef.current.getBoundingClientRect();
      const record = recordRef.current.getBoundingClientRect();
      const containerCenter = container.left + container.width / 2;
      const recordCenter = record.left + record.width / 2;
      setCenterOffset(containerCenter - recordCenter);
    };

    updateOffset();
    window.addEventListener("resize", updateOffset);
    return () => window.removeEventListener("resize", updateOffset);
  }, [hovered, isRecording, isCentered]);

  const handleRecordingIntent = useCallback((active: boolean) => {
    setIsCentered(active);
  }, []);

  const handleRecordingChange = useCallback((active: boolean) => {
    setIsRecording(active);
    if (!active) setIsCentered(false);
  }, []);

  const recordTranslate = isCentered
    ? centerOffset
    : hovered === "record"
      ? HOVER_NUDGE
      : 0;

  const sessionActive = isCentered || isRecording;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center gap-10 overflow-visible px-16"
    >
      <div
        ref={recordRef}
        className="relative z-10 will-change-[transform,opacity,filter]"
        style={{
          transform: `translateX(${recordTranslate}px)`,
          filter: !sessionActive && (hovered === "upload" || isUploadActive) ? "blur(4px)" : "none",
          opacity: !sessionActive && (hovered === "upload" || isUploadActive) ? 0.35 : 1,
          transition: `transform ${MOTION_MS}ms ${EASE}, opacity ${MOTION_MS}ms ${EASE}, filter ${MOTION_MS}ms ${EASE}`,
        }}
      >
        <InputOption
          label="Record"
          hint={{
            title: "Microphone",
            description: "Record up to 2 minutes of audio",
          }}
          side="left"
          isHovered={!sessionActive && hovered === "record"}
          isDimmed={!sessionActive && (hovered === "upload" || isUploadActive)}
          hideLabel={sessionActive}
          onHover={() => !sessionActive && !isUploadActive && setHovered("record")}
          onLeave={() => !sessionActive && setHovered(null)}
        >
          <AudioRecorder
            compact
            disabled={disabled}
            onRecordingComplete={onAudioSubmit}
            onRecordingIntent={handleRecordingIntent}
            onRecordingChange={handleRecordingChange}
          />
        </InputOption>
      </div>

      <div
        aria-hidden={sessionActive}
        className="will-change-[transform,opacity,filter]"
        style={{
          transform: !sessionActive && hovered === "upload" ? "translateX(-8px)" : "translateX(0)",
          filter: !sessionActive && hovered === "record" ? "blur(4px)" : "none",
          opacity: sessionActive ? 0 : hovered === "record" ? 0.35 : 1,
          visibility: sessionActive ? "hidden" : "visible",
          pointerEvents: sessionActive ? "none" : "auto",
          transition: `transform ${MOTION_MS}ms ${EASE}, opacity ${MOTION_MS}ms ${EASE}, filter ${MOTION_MS}ms ${EASE}`,
        }}
      >
        <InputOption
          label="Upload"
          hint={{
            title: "Audio file",
            description: "Drop or browse mp3, wav, m4a…",
          }}
          side="right"
          isHovered={!isUploadActive && hovered === "upload"}
          isDimmed={hovered === "record"}
          onHover={() => !sessionActive && !isUploadActive && setHovered("upload")}
          onLeave={() => !isUploadActive && setHovered(null)}
        >
          <AudioUploader
            compact
            disabled={disabled || sessionActive}
            onFileSelected={onAudioSubmit}
            onUploadIntent={setIsUploadActive}
          />
        </InputOption>
      </div>
    </div>
  );
}

interface InputOptionProps {
  label: string;
  hint: HintContent;
  side: "left" | "right";
  isHovered: boolean;
  isDimmed: boolean;
  hideLabel?: boolean;
  onHover: () => void;
  onLeave: () => void;
  children: ReactNode;
}

function InputOption({
  label,
  hint,
  side,
  isHovered,
  isDimmed,
  hideLabel = false,
  onHover,
  onLeave,
  children,
}: InputOptionProps) {
  return (
    <div
      className="flex flex-col items-center gap-2"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="relative flex flex-col items-center">
        <HintBubble hint={hint} side={side} visible={isHovered} />
        <div
          className="transition-all ease-[cubic-bezier(0.33,0,0.2,1)]"
          style={{
            filter: isDimmed ? "blur(4px)" : "none",
            opacity: isDimmed ? 0.35 : 1,
            transitionDuration: `${MOTION_MS}ms`,
          }}
        >
          {children}
        </div>
      </div>
      <span
        className="text-sm font-medium transition-opacity ease-[cubic-bezier(0.33,0,0.2,1)]"
        style={{
          color: "var(--color-text-primary)",
          opacity: hideLabel ? 0 : isDimmed ? 0.4 : 1,
          transitionDuration: `${MOTION_MS}ms`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function HintBubble({
  hint,
  side,
  visible,
}: {
  hint: HintContent;
  side: "left" | "right";
  visible: boolean;
}) {
  const slideOffset = side === "left" ? 8 : -8;
  const bubbleBg = "rgba(17, 17, 19, 0.94)";
  const bubbleBorder = "rgba(148, 122, 252, 0.2)";

  return (
    <div
      role="tooltip"
      aria-hidden={!visible}
      className="pointer-events-none absolute top-14 z-30 w-max max-w-[240px]"
      style={{
        [side === "left" ? "right" : "left"]: "100%",
        [side === "left" ? "marginRight" : "marginLeft"]: "20px",
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(-50%) translateX(0) scale(1)"
          : `translateY(-50%) translateX(${slideOffset}px) scale(0.96)`,
        transition: `opacity 280ms ${EASE}, transform 320ms ${EASE}`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-[var(--radius-md)] transition-opacity duration-200"
        style={{
          background: "radial-gradient(ellipse at center, rgba(148, 122, 252, 0.28) 0%, transparent 72%)",
          filter: "blur(16px)",
          opacity: visible ? 1 : 0,
          transform: "scale(1.15)",
        }}
      />

      <div
        className="relative overflow-hidden rounded-[var(--radius-md)] border px-4 py-3"
        style={{
          background: bubbleBg,
          backdropFilter: "blur(16px) saturate(140%)",
          WebkitBackdropFilter: "blur(16px) saturate(140%)",
          borderColor: bubbleBorder,
          boxShadow:
            "inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 10px 36px -10px rgba(0, 0, 0, 0.7), 0 0 24px -8px rgba(148, 122, 252, 0.15)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--liquid-glass-highlight)" }}
        />
        <div className="relative z-10 flex flex-col gap-0.5">
          <span
            className="text-[13px] font-medium leading-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            {hint.title}
          </span>
          <span
            className="text-xs leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {hint.description}
          </span>
        </div>
      </div>
    </div>
  );
}
