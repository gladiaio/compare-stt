import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology | Compare STT",
  description:
    "Full transparency on how Compare STT works: matchmaking, scoring, provider integration, and anti-gaming measures.",
};

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="rounded px-1.5 py-0.5 font-mono text-[0.85em]"
      style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-primary)" }}
    >
      {children}
    </code>
  );
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div
      className="overflow-x-auto rounded-[var(--radius-lg)] border"
      style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border-primary)" }}
    >
      {title && (
        <div
          className="border-b px-4 py-2 font-mono text-xs"
          style={{ borderColor: "var(--color-border-primary)", color: "var(--color-text-tertiary)" }}
        >
          {title}
        </div>
      )}
      <pre className="overflow-x-auto px-4 py-3 font-mono text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        {children}
      </pre>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <span
        className="mb-4 block font-mono text-xs uppercase tracking-[0.16em]"
        style={{ color: "var(--color-text-brand)" }}
      >
        Transparency
      </span>

      <h1
        className="mb-6 text-3xl font-semibold tracking-tight md:text-4xl"
        style={{ color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}
      >
        Methodology
      </h1>

      <div
        className="flex flex-col gap-6 text-base leading-relaxed"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <p>
          Everything below describes exactly how Compare STT works under the
          hood. The full source code is{" "}
          <a
            href="https://github.com/gladiaio/compare-stt"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--color-text-brand)" }}
          >
            open on GitHub
          </a>
          &mdash;nothing is hidden.
        </p>

        {/* ── 1. Providers ── */}
        <h2
          className="mt-6 text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          1. Providers
        </h2>

        <p>
          Each provider is called through its official SDK or REST API, with no
          preprocessing, normalization, or prompt engineering applied to the
          audio. Every provider receives the exact same audio buffer and MIME
          type.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-left font-mono text-xs uppercase tracking-[0.16em]"
                style={{ borderColor: "var(--color-border-primary)", color: "var(--color-text-tertiary)" }}
              >
                <th className="pb-2 pr-4">Provider</th>
                <th className="pb-2 pr-4">Model</th>
                <th className="pb-2">Settings</th>
              </tr>
            </thead>
            <tbody style={{ color: "var(--color-text-secondary)" }}>
              {[
                ["Gladia", "Solaria", "Default, language detection on, code-switching off"],
                ["Deepgram", "Nova 3", "Smart format, detect language"],
                ["AssemblyAI", "Universal-3 Pro", "Language detection"],
                ["ElevenLabs", "Scribe v2", "Default"],
                ["Speechmatics", "Enhanced", "Language: auto, enhanced operating point"],
                ["Mistral", "Voxtral Mini", "Word-level timestamps"],
              ].map(([name, model, settings]) => (
                <tr
                  key={name}
                  className="border-b"
                  style={{ borderColor: "var(--color-border-tertiary)" }}
                >
                  <td className="py-2 pr-4 font-medium" style={{ color: "var(--color-text-primary)" }}>{name}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{model}</td>
                  <td className="py-2 text-xs">{settings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Both providers run in parallel (<Code>Promise.all</Code>) so neither
          has a latency advantage that could influence the user&apos;s
          perception. Transient errors (network, 429, 5xx) are retried up to 2
          times with exponential backoff.
        </p>

        <CodeBlock title="src/lib/transcribe.ts — provider dispatch (simplified)">
{`const [resultA, resultB] = await Promise.all([
  transcribeForProvider(providerA.slug, audioBuffer, mimeType),
  transcribeForProvider(providerB.slug, audioBuffer, mimeType),
]);`}
        </CodeBlock>

        {/* ── 2. Matchmaking ── */}
        <h2
          className="mt-6 text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          2. Matchmaking
        </h2>

        <p>
          Provider pairs are not selected uniformly at random. Instead, the
          system uses a <strong>least-played pair</strong> strategy to ensure
          balanced coverage across all possible matchups:
        </p>

        <ol
          className="flex flex-col gap-3 pl-5"
          style={{ listStyleType: "decimal" }}
        >
          <li>
            Enumerate all possible unordered pairs of providers (with 6
            providers, that&apos;s 15 pairs).
          </li>
          <li>
            Count how many votes each pair has received so far (grouping by
            sorted provider IDs so A-vs-B and B-vs-A are the same pair).
          </li>
          <li>
            Find the minimum count across all pairs.
          </li>
          <li>
            Pick randomly among pairs that have this minimum count.
          </li>
          <li>
            Randomly swap which provider appears as &ldquo;Model A&rdquo; vs
            &ldquo;Model B&rdquo; (50/50 coin flip).
          </li>
        </ol>

        <p>
          This means every pair gets roughly the same number of comparisons over
          time, preventing popular pairs from dominating the dataset.
        </p>

        <CodeBlock title="src/app/api/transcribe/route.ts — matchmaking (simplified)">
{`// Count votes per unordered pair
const pairCounts = await prisma.vote.groupBy({
  by: ["providerAId", "providerBId"],
  _count: true,
});

// Aggregate into unordered pair counts
for (const row of pairCounts) {
  const key = [row.providerAId, row.providerBId].sort().join(":");
  countMap.set(key, (countMap.get(key) || 0) + row._count);
}

// Pick among least-played pairs
const minCount = Math.min(
  ...pairs.map(p => countMap.get(pairKey(p)) || 0)
);
const leastPlayed = pairs.filter(
  p => (countMap.get(pairKey(p)) || 0) === minCount
);
const chosen = leastPlayed[Math.floor(Math.random() * leastPlayed.length)];

// Random A/B assignment
const swap = Math.random() < 0.5;`}
        </CodeBlock>

        {/* ── 3. Blind voting ── */}
        <h2
          className="mt-6 text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          3. Blind voting
        </h2>

        <p>
          The user sees &ldquo;Model A&rdquo; and &ldquo;Model B&rdquo; with no
          indication of which provider produced which transcription. Provider
          identities are only revealed <em>after</em> the vote is submitted.
        </p>

        <p>
          To prevent tampering, the match assignment (session ID + provider A ID
          + provider B ID) is signed with an HMAC-SHA256 token before being sent
          to the client. When the vote comes back, the server verifies this
          token. This prevents a client from forging or replaying votes for
          arbitrary provider pairs.
        </p>

        <CodeBlock title="src/lib/match-token.ts — anti-tamper token">
{`// Sign: server → client (embedded in transcribe response)
const payload = \`\${sessionId}.\${providerAId}.\${providerBId}\`;
const signature = crypto
  .createHmac("sha256", signingKey)
  .update(payload)
  .digest("base64url");
return \`\${payload}.\${signature}\`;

// Verify: client → server (submitted with vote)
// Recompute HMAC and compare — reject if mismatch`}
        </CodeBlock>

        <p>
          Each vote records exactly three things: which two providers were
          compared and who won (or <Code>null</Code> for a tie). No audio, no
          transcriptions, no user identifiers are stored.
        </p>

        {/* ── 4. ELO rating ── */}
        <h2
          className="mt-6 text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          4. ELO rating system
        </h2>

        <p>
          Rankings use the{" "}
          <a
            href="https://en.wikipedia.org/wiki/Elo_rating_system"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--color-text-brand)" }}
          >
            ELO rating system
          </a>
          , the same approach used to rank chess players. The implementation:
        </p>

        <ul className="flex flex-col gap-2 pl-5" style={{ listStyleType: "disc" }}>
          <li>
            <strong>Starting rating:</strong> 1500 for every provider.
          </li>
          <li>
            <strong>K-factor:</strong> 32 (standard for systems with moderate
            churn).
          </li>
          <li>
            <strong>Expected score:</strong>{" "}
            <Code>E(A) = 1 / (1 + 10^((R_B - R_A) / 400))</Code>
          </li>
          <li>
            <strong>Win:</strong> winner scores 1, loser scores 0.
          </li>
          <li>
            <strong>Tie:</strong> both providers score 0.5.
          </li>
          <li>
            <strong>Update:</strong>{" "}
            <Code>R&apos; = R + K × (actual - expected)</Code>
          </li>
        </ul>

        <p>
          Ratings are computed from a single chronological pass over all votes.
          The leaderboard displays exact ELO scores, sorted by descending
          rating.
        </p>

        <CodeBlock title="src/lib/elo.ts — rating computation (simplified)">
{`const K = 32;
const INITIAL_RATING = 1500;

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

for (const vote of votes) {
  const expectedA = expectedScore(a.rating, b.rating);
  const expectedB = expectedScore(b.rating, a.rating);

  // Win → 1/0, Tie → 0.5/0.5
  a.rating += K * (scoreA - expectedA);
  b.rating += K * (scoreB - expectedB);
}`}
        </CodeBlock>

        {/* ── 5. Leaderboard ── */}
        <h2
          className="mt-6 text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          5. Leaderboard visibility
        </h2>

        <p>
          Rankings are blurred until the results reach statistical significance.
          While blurred, provider order is randomized to prevent premature
          conclusions from insufficient data.
        </p>

        <p>
          Once revealed, providers are sorted by exact ELO rating (descending).
        </p>

        {/* ── 6. Anti-gaming ── */}
        <h2
          className="mt-6 text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          6. Anti-gaming measures
        </h2>

        <ul className="flex flex-col gap-2 pl-5" style={{ listStyleType: "disc" }}>
          <li>
            <strong>Blind comparison:</strong> provider identities are hidden
            during voting, so preference bias is eliminated.
          </li>
          <li>
            <strong>Random A/B assignment:</strong> which provider appears as
            &ldquo;A&rdquo; or &ldquo;B&rdquo; is a coin flip, preventing
            position bias.
          </li>
          <li>
            <strong>HMAC-signed match tokens:</strong> votes are
            cryptographically tied to the match they were issued for, preventing
            forged or replayed votes.
          </li>
          <li>
            <strong>Balanced matchmaking:</strong> least-played pair selection
            ensures no provider pair is over- or under-represented.
          </li>
          <li>
            <strong>No stored audio:</strong> audio is deleted from temporary
            storage immediately after transcription completes, regardless of
            outcome.
          </li>
          <li>
            <strong>Open source:</strong> the entire codebase is public, so
            anyone can audit the implementation.
          </li>
        </ul>

        {/* ── 7. Limitations ── */}
        <h2
          className="mt-6 text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          7. Known limitations
        </h2>

        <ul className="flex flex-col gap-2 pl-5" style={{ listStyleType: "disc" }}>
          <li>
            <strong>User-submitted audio only:</strong> the dataset is not
            controlled. Audio quality, language, accent, and content vary by
            user. This is intentional (real-world diversity) but means results
            may not match performance on specific benchmarks.
          </li>
          <li>
            <strong>Subjective judging:</strong> users decide what
            &ldquo;better&rdquo; means. Some may prioritize accuracy, others
            formatting or punctuation. ELO reflects aggregate human preference,
            not a single objective metric.
          </li>
          <li>
            <strong>No normalization:</strong> transcriptions are compared as
            returned by each provider, including differences in casing,
            punctuation, and formatting. This matches real-world usage but means
            a provider with better formatting may score higher even with
            identical word accuracy.
          </li>
          <li>
            <strong>Sample size:</strong> with a small number of votes,
            rankings can be volatile. The leaderboard is hidden until the
            minimum vote threshold is reached for this reason.
          </li>
        </ul>

        {/* ── 8. Data ── */}
        <h2
          className="mt-6 text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          8. Data storage
        </h2>

        <p>
          The database stores exactly three things per vote:
        </p>

        <CodeBlock title="prisma/schema.prisma — Vote model">
{`model Vote {
  id          String   @id
  sessionId   String   // anonymous session identifier
  providerAId String   // first provider in the matchup
  providerBId String   // second provider in the matchup
  winnerId    String?  // winner ID, or null for ties
  createdAt   DateTime // when the vote was cast
}`}
        </CodeBlock>

        <p>
          No audio recordings, no transcriptions, no IP addresses, no user
          accounts. The session ID is a random UUID generated client-side with
          no link to any user identity.
        </p>

        {/* ── 9. Sponsorship ── */}
        <h2
          className="mt-6 text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          9. Sponsorship &amp; API costs
        </h2>

        <p>
          None of the providers listed above have offered free API keys or
          credits for this project. All API calls are paid for by{" "}
          <a
            href="https://gladia.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--color-text-brand)" }}
          >
            Gladia
          </a>
          , which sponsors the full cost of running every transcription across
          every provider. We thank them for making this independent comparison
          possible.
        </p>

        <div
          className="mt-4 rounded-[var(--radius-xl)] border p-6"
          style={{
            background: "var(--color-bg-tertiary)",
            borderColor: "var(--color-border-primary)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            Questions about the methodology?{" "}
            <a
              href="https://github.com/gladiaio/compare-stt/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "var(--color-text-brand)" }}
            >
              Open an issue on GitHub
            </a>{" "}
            or{" "}
            <a
              href="mailto:privacy@gladia.io"
              className="underline"
              style={{ color: "var(--color-text-brand)" }}
            >
              email us
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
