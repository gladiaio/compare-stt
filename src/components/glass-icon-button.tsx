"use client";

import { useState, type DragEventHandler, type ReactNode } from "react";

interface GlassIconButtonProps {
  children: ReactNode;
  active?: boolean;
  accent?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  compact?: boolean;
  pulse?: boolean;
  noHoverScale?: boolean;
  onPressStart?: () => void;
  onPressCancel?: () => void;
  onClick?: () => void;
  onDragEnter?: DragEventHandler;
  onDragOver?: DragEventHandler;
  onDragLeave?: DragEventHandler;
  onDrop?: DragEventHandler;
}

export function GlassIconButton({
  children,
  active = false,
  accent = false,
  disabled = false,
  ariaLabel,
  compact = false,
  pulse = false,
  noHoverScale = false,
  onPressStart,
  onPressCancel,
  onClick,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: GlassIconButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const glowActive = active || isPressed;
  const showAccentGlow = accent || glowActive;

  const buttonBackground = accent
    ? glowActive
      ? "var(--liquid-glass-bg-active)"
      : "linear-gradient(180deg, rgba(148, 122, 252, 0.32) 0%, rgba(148, 122, 252, 0.12) 55%, rgba(148, 122, 252, 0.2) 100%)"
    : glowActive
      ? "var(--liquid-glass-bg-active)"
      : "var(--liquid-glass-bg)";

  const buttonShadow = accent
    ? glowActive
      ? "var(--liquid-glass-shadow-active)"
      : "inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 0 0 1px rgba(148, 122, 252, 0.28), inset 0 -1px 0 rgba(0, 0, 0, 0.22), 0 0 28px -8px rgba(148, 122, 252, 0.45), 0 8px 24px -12px rgba(0, 0, 0, 0.45)"
    : glowActive
      ? "var(--liquid-glass-shadow-active)"
      : "var(--liquid-glass-shadow)";

  const showNudge = accent && !glowActive && !disabled && !pulse;

  return (
    <div
      className={`relative overflow-visible ${compact ? "p-4" : "p-10"}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={`relative h-20 w-20 ${showNudge ? "animate-record-nudge" : ""}`}>
        {glowActive && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full transition-all duration-500"
            style={{
              background:
                "radial-gradient(circle, var(--card-glow-burst) 0%, var(--card-glow-burst-secondary) 30%, transparent 68%)",
              filter: "blur(22px)",
              transform: "scale(2.6)",
              opacity: active ? 1 : 0.75,
            }}
          />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full transition-all duration-500"
          style={{
            background: showAccentGlow
              ? "radial-gradient(circle, var(--card-glow-active) 0%, var(--card-glow-active-secondary) 40%, transparent 72%)"
              : "radial-gradient(circle, var(--card-glow) 0%, var(--card-glow-secondary) 45%, transparent 70%)",
            filter: "blur(12px)",
            opacity: showAccentGlow ? 1 : accent ? 0.7 : 0.85,
            transform: `scale(${showAccentGlow ? (active ? 1.4 : 1.2) : accent ? 1.08 : 1})`,
          }}
        />
        {pulse && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full animate-pulse-ring"
            style={{ background: "rgba(148, 122, 252, 0.28)" }}
          />
        )}
        <button
          type="button"
          onClick={onClick}
          onPointerDown={() => {
            if (disabled) return;
            setIsPressed(true);
            onPressStart?.();
          }}
          onPointerUp={() => {
            setIsPressed(false);
          }}
          onPointerLeave={() => {
            setIsPressed(false);
            onPressCancel?.();
          }}
          onPointerCancel={() => {
            setIsPressed(false);
            onPressCancel?.();
          }}
          disabled={disabled}
          className={`relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-transparent transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${noHoverScale ? "active:scale-95" : "hover:scale-105 active:scale-95"}`}
          style={{
            background: buttonBackground,
            backdropFilter: "blur(8px) saturate(180%)",
            WebkitBackdropFilter: "blur(8px) saturate(180%)",
            boxShadow: buttonShadow,
          }}
          aria-label={ariaLabel}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: "var(--liquid-glass-highlight)" }}
          />
          <span className="relative z-10">{children}</span>
        </button>
      </div>
    </div>
  );
}
