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
      className="input-option flex flex-col items-center gap-2"
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
        className="rounded-[var(--radius-md)] border px-4 py-3"
        style={{
          background: "var(--color-bg-elevated)",
          borderColor: "var(--color-border-primary)",
        }}
      >
        <div className="flex flex-col gap-0.5">
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
