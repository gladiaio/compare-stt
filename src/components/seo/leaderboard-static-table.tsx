import type { LeaderboardData } from "@/lib/leaderboard-data";

export function LeaderboardStaticTable({
  data,
  visuallyHidden = false,
}: {
  data: LeaderboardData;
  visuallyHidden?: boolean;
}) {
  const sorted = [...data.leaderboard].sort((a, b) => b.rating - a.rating);

  return (
    <section
      aria-label="Speech-to-text leaderboard rankings"
      className={visuallyHidden ? "sr-only" : "mt-10"}
    >
      <table id="leaderboard" className="w-full border-collapse text-sm">
        <caption className="mb-3 text-left text-base font-medium" style={{ color: "var(--color-text-primary)" }}>
          Speech-to-text leaderboard — ELO rankings from blind community comparisons
        </caption>
        <thead>
          <tr
            className="border-b text-left font-mono text-xs uppercase tracking-[0.16em]"
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
            <th scope="col" className="pb-2 pr-4 text-right">
              Votes
            </th>
            <th scope="col" className="pb-2 text-right">
              95% CI
            </th>
          </tr>
        </thead>
        <tbody style={{ color: "var(--color-text-secondary)" }}>
          {sorted.map((entry, index) => (
            <tr
              key={entry.id}
              className="border-b"
              style={{ borderColor: "var(--color-border-tertiary)" }}
            >
              <td className="py-2 pr-4 font-mono tabular-nums">{index + 1}</td>
              <td className="py-2 pr-4">
                {entry.name}
                {entry.model ? ` (${entry.model})` : ""}
              </td>
              <td className="py-2 pr-4 text-right font-mono tabular-nums">{entry.rating}</td>
              <td className="py-2 pr-4 text-right font-mono tabular-nums">
                {entry.totalMatches.toLocaleString("en-US")}
              </td>
              <td className="py-2 text-right font-mono tabular-nums">{entry.confidenceInterval}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.totalVotes > 0 && (
        <p className="mt-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          Based on {data.totalVotes.toLocaleString("en-US")} blind comparison
          {data.totalVotes !== 1 ? "s" : ""}. Last updated {data.lastUpdated}.
        </p>
      )}
    </section>
  );
}
