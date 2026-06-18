"use client";

import type { CSSProperties, ReactNode } from "react";
import { HeroBadge, type HeroBadgeVariant } from "@/components/hero-badge";

interface BadgeInstance {
  variant: HeroBadgeVariant;
  label: string;
  size: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  rotate: number;
  zIndex: number;
  enterDelay: number;
  floatDelay: number;
  floatDuration: number;
  floatX: number;
  floatY: number;
}

/** Placements : 4 coins inclinés, éclatés autour du hero */
const BADGE_INSTANCES: BadgeInstance[] = [
  {
    variant: "laurel",
    label: "Laurel badge",
    size: 92,
    top: "-14%",
    left: "-16%",
    rotate: -14,
    zIndex: 1,
    enterDelay: 0.08,
    floatDelay: 0,
    floatDuration: 5.5,
    floatX: 4,
    floatY: -14,
  },
  {
    variant: "trophy",
    label: "Trophy badge",
    size: 84,
    top: "-10%",
    right: "-18%",
    rotate: 11,
    zIndex: 1,
    enterDelay: 0.2,
    floatDelay: 0.8,
    floatDuration: 6.2,
    floatX: -5,
    floatY: -12,
  },
  {
    variant: "medal",
    label: "Medal badge",
    size: 80,
    bottom: "-6%",
    left: "-14%",
    rotate: 13,
    zIndex: 1,
    enterDelay: 0.32,
    floatDelay: 1.2,
    floatDuration: 5.8,
    floatX: 3,
    floatY: -10,
  },
  {
    variant: "laurel",
    label: "Laurel badge",
    size: 76,
    bottom: "-12%",
    right: "-16%",
    rotate: -10,
    zIndex: 1,
    enterDelay: 0.44,
    floatDelay: 1.6,
    floatDuration: 6.5,
    floatX: -4,
    floatY: -13,
  },
];

interface HeroFloatingBadgesProps {
  children: ReactNode;
}

export function HeroFloatingBadges({ children }: HeroFloatingBadgesProps) {
  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-visible px-2 py-6 md:min-h-[380px] md:py-12">
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden
      >
        {BADGE_INSTANCES.map((badge, index) => (
          <PlacedBadge key={`${badge.variant}-${index}`} badge={badge} />
        ))}
      </div>

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}

function PlacedBadge({ badge }: { badge: BadgeInstance }) {
  const floatStart = badge.enterDelay + 1.35 + badge.floatDelay;

  const style = {
    top: badge.top,
    left: badge.left,
    right: badge.right,
    bottom: badge.bottom,
    zIndex: badge.zIndex,
    "--badge-float-start": `${floatStart}s`,
    "--badge-float-duration": `${badge.floatDuration}s`,
    "--badge-float-x": `${badge.floatX}px`,
    "--badge-float-y": `${badge.floatY}px`,
  } as CSSProperties;

  return (
    <div className="hero-badge-placed absolute" style={style}>
      <div className="origin-center" style={{ rotate: `${badge.rotate}deg` }}>
        <div
          className="hero-badge-enter"
          style={{ "--badge-enter-delay": `${badge.enterDelay}s` } as CSSProperties}
        >
          <div className="hero-badge-float">
            <HeroBadge variant={badge.variant} size={badge.size} label={badge.label} />
          </div>
        </div>
      </div>
    </div>
  );
}
