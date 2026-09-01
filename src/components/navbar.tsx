"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import { DEFAULT_BASE_PATH } from "@/lib/base-path-fetch";

type NavItem = {
  key: string;
  href: string;
  label: string;
  active: boolean;
  disabled?: boolean;
  tooltip?: string;
  /** When set, render a plain <a> so basePath is not re-prefixed (no trailing slash). */
  absolute?: boolean;
};

export function Navbar({ showLeaderboard = false }: { showLeaderboard?: boolean }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  function setItemRef(key: string) {
    return (el: HTMLElement | null) => {
      if (el) itemRefs.current.set(key, el);
      else itemRefs.current.delete(key);
    };
  }

  // Link href="/" + basePath becomes "/compare-stt-apis/" (trailing slash).
  // That path is not rewritten to this app on www.gladia.io — use the
  // bare basePath without a trailing slash for Compare.
  const compareHref = process.env.NEXT_PUBLIC_BASE_PATH || DEFAULT_BASE_PATH;

  const items: NavItem[] = [
    {
      key: "compare",
      href: compareHref,
      label: "Compare",
      active: pathname === "/",
      // Absolute site path — skip next/link basePath prefixing.
      absolute: true,
    },
    showLeaderboard
      ? {
          key: "leaderboard",
          href: "/leaderboard",
          label: "Leaderboard",
          active: pathname === "/leaderboard",
        }
      : {
          key: "leaderboard",
          href: "",
          label: "Leaderboard",
          active: false,
          disabled: true,
          tooltip: "Available once we have enough results",
        },
    {
      key: "methodology",
      href: "/methodology",
      label: "Methodology",
      active: pathname === "/methodology",
    },
    { key: "about", href: "/about", label: "About", active: pathname === "/about" },
  ];

  const activeKey =
    pathname === "/"
      ? "compare"
      : pathname === "/leaderboard" && showLeaderboard
        ? "leaderboard"
        : pathname === "/methodology"
          ? "methodology"
          : pathname === "/about"
            ? "about"
            : null;

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    function syncIndicator() {
      const indicator = indicatorRef.current;
      if (!indicator) return;

      if (!activeKey) {
        indicator.style.opacity = "0";
        return;
      }

      const el = itemRefs.current.get(activeKey);
      if (!el) return;

      const navEl = navRef.current;
      if (!navEl) return;

      const navRect = navEl.getBoundingClientRect();
      const itemRect = el.getBoundingClientRect();

      indicator.style.left = `${itemRect.left - navRect.left}px`;
      indicator.style.top = `${itemRect.top - navRect.top}px`;
      indicator.style.width = `${itemRect.width}px`;
      indicator.style.height = `${itemRect.height}px`;
      indicator.style.opacity = "1";
    }

    syncIndicator();

    const observer = new ResizeObserver(syncIndicator);
    observer.observe(nav);
    itemRefs.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [activeKey, pathname, showLeaderboard, items.length]);

  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;

    const frame = requestAnimationFrame(() => {
      indicator.style.transition =
        "left 160ms ease, top 160ms ease, width 160ms ease, height 160ms ease, opacity 160ms ease";
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <header className="fixed top-4 left-1/2 z-50 -translate-x-1/2">
      <nav
        ref={navRef}
        className="relative flex items-center gap-1 rounded-[var(--radius-lg)] border px-4 py-2"
        style={{
          background: "var(--color-bg-glass)",
          borderColor: "var(--color-border-transparent)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <span
          ref={indicatorRef}
          aria-hidden
          className="pointer-events-none absolute rounded-[var(--radius-full)]"
          style={{
            opacity: 0,
            background: "var(--color-bg-glass-light)",
          }}
        />

        {items.map((item) =>
          item.disabled ? (
            <DisabledNavLink
              key={item.key}
              ref={setItemRef(item.key)}
              tooltip={item.tooltip!}
            >
              {item.label}
            </DisabledNavLink>
          ) : (
            <NavLink
              key={item.key}
              ref={setItemRef(item.key)}
              href={item.href}
              active={item.active}
              absolute={item.absolute}
            >
              {item.label}
            </NavLink>
          ),
        )}
      </nav>
    </header>
  );
}

const DisabledNavLink = forwardRef<
  HTMLSpanElement,
  { tooltip: string; children: React.ReactNode }
>(function DisabledNavLink({ tooltip, children }, ref) {
  return (
    <span
      ref={ref}
      title={tooltip}
      className="relative z-10 cursor-not-allowed rounded-[var(--radius-full)] px-4 py-2 text-sm opacity-40"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {children}
    </span>
  );
});

const NavLink = forwardRef<
  HTMLAnchorElement,
  { href: string; active: boolean; absolute?: boolean; children: React.ReactNode }
>(function NavLink({ href, active, absolute, children }, ref) {
  const className =
    "relative z-10 rounded-[var(--radius-full)] px-4 py-2 text-sm transition-colors duration-160";
  const style = {
    color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
  };

  // Plain <a> avoids next/link turning "/" into "/compare-stt-apis/".
  if (absolute) {
    return (
      <a ref={ref} href={href} className={className} style={style}>
        {children}
      </a>
    );
  }

  return (
    <Link ref={ref} href={href} className={className} style={style}>
      {children}
    </Link>
  );
});
