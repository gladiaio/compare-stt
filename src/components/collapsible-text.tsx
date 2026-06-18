"use client";

import { useId, type ReactNode } from "react";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 transition-transform duration-200"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

type CollapsibleTextProps = {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function CollapsibleText({
  title,
  open,
  onOpenChange,
  children,
}: CollapsibleTextProps) {
  const panelId = useId();

  return (
    <div
      className="border-b"
      style={{ borderColor: "var(--color-border-transparent-subtle)" }}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
      >
        <span
          className="text-base font-medium"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </span>
        <span style={{ color: "var(--color-text-tertiary)" }}>
          <ChevronIcon open={open} />
        </span>
      </button>
      {open && (
        <div id={panelId} className="pb-4">
          <div
            className="text-sm leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
