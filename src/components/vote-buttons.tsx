"use client";

interface VoteButtonsProps {
  onVote: (choice: "a" | "tie" | "b") => void;
  disabled?: boolean;
  disableA?: boolean;
  disableB?: boolean;
  transcriptA?: string;
  transcriptB?: string;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w]/g, "");
}

export function VoteButtons({ onVote, disabled, disableA, disableB, transcriptA, transcriptB }: VoteButtonsProps) {
  const bothValid = !disableA && !disableB;
  const identical =
    bothValid &&
    transcriptA != null &&
    transcriptB != null &&
    normalize(transcriptA) === normalize(transcriptB);

  if (identical) {
    return (
      <div className="flex w-full flex-col items-center gap-4 animate-slide-up">
        <button
          onClick={() => onVote("tie")}
          disabled={disabled}
          className="flex items-center gap-2 rounded-[var(--radius-full)] border px-8 py-4 text-base font-semibold transition-all duration-160 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--color-bg-brand)",
            color: "white",
            borderColor: "var(--color-accent-purple)",
          }}
        >
          <EqualsIcon /> It&apos;s a tie
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onVote("a")}
            disabled={disabled || disableA}
            className="text-xs font-medium transition-colors duration-160 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            A is better
          </button>
          <span className="text-xs" style={{ color: "var(--color-border-primary)" }}>|</span>
          <button
            onClick={() => onVote("b")}
            disabled={disabled || disableB}
            className="text-xs font-medium transition-colors duration-160 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            B is better
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-3 animate-slide-up">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onVote("a")}
          disabled={disabled || disableA}
          className="flex items-center gap-2 rounded-[var(--radius-full)] border px-6 py-3 text-sm font-medium transition-all duration-160 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--color-bg-inverse)",
            color: "var(--color-text-inverse)",
            borderColor: "transparent",
          }}
        >
          <ArrowLeftIcon /> A is better
        </button>

        <button
          onClick={() => onVote("b")}
          disabled={disabled || disableB}
          className="flex items-center gap-2 rounded-[var(--radius-full)] border px-6 py-3 text-sm font-medium transition-all duration-160 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--color-bg-inverse)",
            color: "var(--color-text-inverse)",
            borderColor: "transparent",
          }}
        >
          B is better <ArrowRightIcon />
        </button>
      </div>

      <button
        onClick={() => onVote("tie")}
        disabled={disabled || !bothValid}
        className="flex items-center gap-2 rounded-[var(--radius-full)] border px-6 py-3 text-sm font-medium transition-all duration-160 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "var(--color-bg-tertiary)",
          color: "var(--color-text-secondary)",
          borderColor: "var(--color-border-secondary)",
        }}
      >
        <EqualsIcon /> It&apos;s a tie
      </button>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function EqualsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="9" x2="19" y2="9" />
      <line x1="5" y1="15" x2="19" y2="15" />
    </svg>
  );
}
