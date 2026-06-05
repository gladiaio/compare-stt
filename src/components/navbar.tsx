"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || "";

export function Navbar({ showLeaderboard = false }: { showLeaderboard?: boolean }) {
  const pathname = usePathname();

  return (
    <header className="fixed top-4 left-1/2 z-50 -translate-x-1/2">
      <nav
        className="flex items-center gap-1 rounded-[var(--radius-lg)] border px-4 py-2"
        style={{
          background: "var(--color-bg-glass)",
          borderColor: "var(--color-border-transparent)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <Link
          href={`${ORIGIN}/`}
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("arena:reset"));
            }
          }}
          className="mr-4 flex items-center gap-2 px-2 font-medium text-white"
        >
          <Image src={`${ORIGIN}/logo.svg`} alt="" width={22} height={22} />
          <span className="text-base font-semibold tracking-tight">
            Compare STT
          </span>
        </Link>

        <NavLink href={`${ORIGIN}/`} active={pathname === "/"}>
          Compare
        </NavLink>
        {showLeaderboard ? (
          <NavLink href={`${ORIGIN}/leaderboard`} active={pathname === "/leaderboard"}>
            Leaderboard
          </NavLink>
        ) : (
          <DisabledNavLink tooltip="Available once we have enough results">
            Leaderboard
          </DisabledNavLink>
        )}
        <NavLink href={`${ORIGIN}/methodology`} active={pathname === "/methodology"}>
          Methodology
        </NavLink>
        <NavLink href={`${ORIGIN}/about`} active={pathname === "/about"}>
          About
        </NavLink>
      </nav>
    </header>
  );
}

function DisabledNavLink({
  tooltip,
  children,
}: {
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={tooltip}
      className="cursor-not-allowed rounded-[var(--radius-full)] px-4 py-2 text-sm opacity-40"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {children}
    </span>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-[var(--radius-full)] px-4 py-2 text-sm transition-all duration-160"
      style={{
        color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
        background: active ? "var(--color-bg-glass-light)" : "transparent",
      }}
    >
      {children}
    </Link>
  );
}

