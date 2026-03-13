"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
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
          href="/"
          className="mr-4 flex items-center gap-2 px-2 font-medium text-white"
        >
          <MicIcon />
          <span className="text-base font-semibold tracking-tight">
            STT Arena
          </span>
        </Link>

        <NavLink href="/" active={pathname === "/"}>
          Arena
        </NavLink>
        <NavLink href="/leaderboard" active={pathname === "/leaderboard"}>
          Leaderboard
        </NavLink>
      </nav>
    </header>
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

function MicIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-accent-purple)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
