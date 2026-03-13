"use client";

import Image from "next/image";
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
          <Image src="/logo.svg" alt="" width={22} height={22} />
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

