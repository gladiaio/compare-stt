"use client";

import { useState, type DragEventHandler, type ReactNode } from "react";

interface GlassIconButtonProps {
  children: ReactNode;
  active?: boolean;
  accent?: boolean;
  disabled?: boolean;
  ariaLabel: string;
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

  const buttonBackground = accent
    ? glowActive
      ? "var(--color-bg-brand)"
      : "var(--color-bg-elevated)"
    : glowActive
      ? "var(--color-bg-elevated)"
      : "var(--color-bg-tertiary)";

  const buttonShadow = accent && glowActive
    ? "inset 0 0 0 1px rgba(255, 255, 255, 0.12)"
    : accent
      ? "inset 0 0 0 1px rgba(148, 122, 252, 0.35)"
      : glowActive
        ? "inset 0 0 0 1px var(--color-border-secondary)"
        : "inset 0 0 0 1px var(--color-border-primary)";

  const showNudge = accent && !glowActive && !disabled && !pulse;

  return (
    <div
      className="relative overflow-visible p-4"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={`relative h-20 w-20 ${showNudge ? "animate-record-nudge" : ""}`}>
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
          data-active={active || undefined}
          className={`relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-transparent transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${accent ? "glass-icon-btn-flat-accent" : ""} ${noHoverScale ? "active:scale-95" : "hover:scale-105 active:scale-95"}`}
          style={{
            background: buttonBackground,
            boxShadow: buttonShadow,
          }}
          aria-label={ariaLabel}
        >
          <span className="relative z-10">{children}</span>
        </button>
      </div>
    </div>
  );
}
