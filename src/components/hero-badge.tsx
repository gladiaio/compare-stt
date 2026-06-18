import type { CSSProperties } from "react";
import { LaurelIcon, MedalIcon, TrophyIcon } from "@/components/hero-badge-icons";

export type HeroBadgeVariant = "medal" | "trophy" | "laurel";

const FIGMA_CORNER_RATIO = 36.632 / 208.901;
const FIGMA_ICON_RATIO = 102.241 / 208.901;

const VARIANT_STYLES: Record<
  HeroBadgeVariant,
  {
    gradient: string;
    tint: string;
    glow: string;
    glowSecondary: string;
    glowOuter: string;
    iconScale: number;
  }
> = {
  medal: {
    gradient:
      "linear-gradient(153.98deg, rgba(255, 215, 90, 0.78) 6%, rgba(255, 190, 50, 0.28) 42%, rgba(0, 0, 0, 0) 82%)",
    tint: "rgba(255, 200, 60, 0.18)",
    glow: "rgba(255, 215, 90, 0.32)",
    glowSecondary: "rgba(255, 170, 40, 0.12)",
    glowOuter: "rgba(255, 200, 60, 0.2)",
    iconScale: 1,
  },
  trophy: {
    gradient:
      "linear-gradient(153.98deg, rgba(255, 60, 150, 0.72) 6%, rgba(255, 95, 176, 0.28) 42%, rgba(0, 0, 0, 0) 82%)",
    tint: "rgba(255, 55, 140, 0.18)",
    glow: "rgba(255, 70, 160, 0.28)",
    glowSecondary: "rgba(255, 95, 176, 0.1)",
    glowOuter: "rgba(255, 70, 150, 0.16)",
    iconScale: 1,
  },
  laurel: {
    gradient:
      "linear-gradient(153.98deg, rgba(56, 210, 255, 0.78) 6%, rgba(0, 140, 255, 0.28) 42%, rgba(0, 0, 0, 0) 82%)",
    tint: "rgba(0, 140, 255, 0.18)",
    glow: "rgba(56, 210, 255, 0.34)",
    glowSecondary: "rgba(100, 200, 255, 0.12)",
    glowOuter: "rgba(0, 140, 255, 0.2)",
    iconScale: 1.12,
  },
};

const ICONS = {
  medal: MedalIcon,
  trophy: TrophyIcon,
  laurel: LaurelIcon,
} as const;

interface HeroBadgeProps {
  variant: HeroBadgeVariant;
  size: number;
  label: string;
}

export function HeroBadge({ variant, size, label }: HeroBadgeProps) {
  const styles = VARIANT_STYLES[variant];
  const Icon = ICONS[variant];
  const radius = size * FIGMA_CORNER_RATIO;
  const iconSize = size * FIGMA_ICON_RATIO * styles.iconScale;

  const panelStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
  };

  return (
    <div className="relative" style={panelStyle} role="img" aria-label={label}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: radius,
          background: `radial-gradient(circle at 24% 18%, ${styles.glow} 0%, ${styles.glowSecondary} 40%, transparent 68%)`,
          filter: "blur(12px)",
          transform: "scale(1.35)",
          opacity: 0.72,
        }}
      />

      <div
        className="absolute inset-0 overflow-hidden backdrop-blur-md"
        style={{
          ...panelStyle,
          background: `linear-gradient(180deg, ${styles.tint} 0%, rgba(12, 12, 12, 0.35) 100%)`,
          boxShadow: `
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            inset 0 0 0 1px rgba(255, 255, 255, 0.06),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2),
            0 0 28px -10px ${styles.glowOuter},
            0 8px 28px -10px rgba(0, 0, 0, 0.5)
          `,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: styles.gradient }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--liquid-glass-highlight)" }}
        />

        <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
          <Icon className="shrink-0" style={{ width: iconSize, height: iconSize }} />
        </div>
      </div>
    </div>
  );
}
