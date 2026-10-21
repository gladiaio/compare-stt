import Link from "next/link";
import type { LeaderboardData } from "@/lib/leaderboard-data";

type Variant = "default" | "hidden" | "hero";

export function LeaderboardStaticTable({
  data,
  variant = "default",
}: {
  data: LeaderboardData;
  /** "hidden" keeps the table crawlable but invisible; "hero" is the compact home card. */
  variant?: Variant;
}) {
  if (!data.isSignificant) return null;

  const sorted = data.leaderboard;
  const isHero = variant === "hero";
  const cell = isHero ? "py-1" : "py-2";
  const ciCell = isHero ? "hidden sm:table-cell" : "";

  return (
    <section
      aria-label={isHero ? undefined : "Speech-to-text leaderboard rankings"}
      aria-labelledby={isHero ? "hero-leaderboard-heading" : undefined}
      className={
        variant === "hidden"
          ? "sr-only"
          : isHero
            ? "w-full max-w-xl rounded-[var(--radius-xl)] border px-5 pt-3 pb-2.5 text-left"
            : "mt-10"
      }
      style={
        isHero
          ? {
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border-tertiary)",
            }
          : undefined
      }
    >
      {isHero && (
        <h2
          id="hero-leaderboard-heading"
          className="mb-2 font-mono text-xs uppercase tracking-[0.16em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Live speech-to-text API leaderboard
        </h2>
      )}
      <table
        id="leaderboard"
        className={`w-full border-collapse ${isHero ? "text-xs md:text-sm" : "text-sm"}`}
      >
        <caption
          className={isHero ? "sr-only" : "mb-3 text-left text-base font-medium"}
          style={{ color: "var(--color-text-primary)" }}
        >
          Speech-to-text leaderboard: ELO rankings from blind community comparisons
        </caption>
        <thead>
          <tr
            className="border-b text-left font-mono text-[10px] uppercase tracking-[0.16em] md:text-xs"
            style={{ borderColor: "var(--color-border-primary)", color: "var(--color-text-tertiary)" }}
          >
            <th scope="col" className="pb-2 pr-4">
              Rank
            </th>
            <th scope="col" className="pb-2 pr-4">
              Provider
            </th>
            <th scope="col" className="pb-2 pr-4 text-right">
              ELO score
            </th>
            <th scope="col" className={`pb-2 pr-4 text-right ${isHero ? "pr-0 sm:pr-4" : ""}`}>
              Votes
            </th>
            <th scope="col" className={`pb-2 text-right ${ciCell}`}>
              95% CI
            </th>
          </tr>
        </thead>
        <tbody style={{ color: "var(--color-text-secondary)" }}>
          {sorted.map((entry, index) => (
            <tr
              key={entry.id}
              className={isHero && index === sorted.length - 1 ? "" : "border-b"}
              style={{ borderColor: "var(--color-border-tertiary)" }}
            >
              <td className={`${cell} pr-4 font-mono tabular-nums`}>{index + 1}</td>
              <td className={`${cell} pr-4`}>
                {entry.name}
                {entry.model ? ` (${entry.model})` : ""}
              </td>
              <td className={`${cell} pr-4 text-right font-mono tabular-nums`}>{entry.rating}</td>
              <td
                className={`${cell} pr-4 text-right font-mono tabular-nums ${isHero ? "pr-0 sm:pr-4" : ""}`}
              >
                {entry.totalMatches.toLocaleString("en-US")}
              </td>
              <td className={`${cell} text-right font-mono tabular-nums ${ciCell}`}>
                {entry.confidenceInterval}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.totalVotes > 0 && (
        <p className="mt-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          Based on {data.totalVotes.toLocaleString("en-US")} blind comparison
          {data.totalVotes !== 1 ? "s" : ""}. Last updated {data.lastUpdated}.
          {isHero && (
            <>
              {" "}
              See the{" "}
              <Link
                href="/leaderboard"
                className="underline"
                style={{ color: "var(--color-text-brand)" }}
              >
                full leaderboard
              </Link>
              .
            </>
          )}
        </p>
      )}
    </section>
  );
}
