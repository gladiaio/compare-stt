import type { Metadata } from "next";
import Link from "next/link";
import { ArenaPage } from "@/components/arena-page";
import { AboutFaq } from "@/components/seo/about-faq";
import { LeaderboardStaticTable } from "@/components/seo/leaderboard-static-table";
import { getLeaderboardData, type LeaderboardData } from "@/lib/leaderboard-data";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  alternates: {
    canonical: publicUrl("/"),
  },
};

const LINK_CLASS = "underline";
const LINK_STYLE = { color: "var(--color-text-brand)" } as const;

function WebApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Compare STT",
    url: publicUrl("/"),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description:
      "Free, open benchmarking tool for blind speech-to-text API comparisons. Upload audio, vote on transcriptions, and explore community ELO rankings.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Blind head-to-head speech-to-text API comparisons",
      "Live audio recording and file upload",
      "Community ELO leaderboard",
      "Six commercial speech-to-text API providers",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

async function loadLeaderboard(): Promise<LeaderboardData | null> {
  try {
    return await getLeaderboardData();
  } catch (error) {
    console.error("[home] failed to load leaderboard", error);
    return null;
  }
}

function MethodologySection() {
  return (
    <section
      className="border-t pt-10 pb-4"
      style={{ borderColor: "var(--color-border-tertiary)" }}
      aria-labelledby="home-methodology-heading"
    >
      <h2
        id="home-methodology-heading"
        className="type-section-title mb-4 text-xl"
        style={{ color: "var(--color-text-primary)" }}
      >
        How the speech-to-text API comparison works
      </h2>
      <div
        className="flex flex-col gap-4 text-base leading-relaxed"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <p>
          Compare STT is a blind, head-to-head test of six commercial
          speech-to-text APIs: Gladia (Solaria-3), ElevenLabs (Scribe v2),
          Deepgram (Nova 3), AssemblyAI (Universal-3 Pro), Speechmatics
          (Enhanced) and Mistral (Voxtral Mini).
        </p>
        <p>
          You record or upload up to two minutes of audio. Two providers
          transcribe the same audio file in parallel, each through its official
          SDK or REST API, with no preprocessing, normalization or prompt
          engineering. You see the results as Model A and Model B and vote for
          the more accurate transcript, or call a tie. Provider names are
          revealed only after you vote.
        </p>
        <p>
          Pairs are not picked purely at random. The system chooses among the
          least-played of the 15 possible provider pairs, so every matchup
          builds up a similar number of comparisons over time. A coin flip
          decides which provider appears as Model A.
        </p>
        <p>
          Votes feed an ELO rating, the pairwise system used to rank chess
          players. Every provider starts at 1,500, the K-factor is 32, and
          ratings are recomputed in one chronological pass over every vote. The
          leaderboard shows each provider&apos;s ELO score, vote count and 95%
          confidence interval. Rankings stay blurred until the results reach
          statistical significance.
        </p>
        <p>
          Each vote stores only the two providers compared and the winner.
          Audio is deleted as soon as transcription finishes, and no
          transcripts or user accounts are kept. Single-use signed match
          tokens, a per-session vote cap, a minimum delay before voting and
          rate limits protect the results from automated voting.
        </p>
        <p>
          The test has known limits. The audio is submitted by users, so the
          dataset is not controlled, and each voter decides what
          &quot;better&quot; means. ELO reflects aggregate human preference on
          real-world audio, not word error rate on a fixed dataset. For word
          error rate results on public datasets, see Gladia&apos;s{" "}
          <a
            href="https://www.gladia.io/competitors/benchmarks"
            className={LINK_CLASS}
            style={LINK_STYLE}
          >
            speech-to-text benchmarks
          </a>
          .
        </p>
        <p>
          Gladia sponsors the project and pays for every API call. No provider
          supplied free credits, and the{" "}
          <a
            href="https://github.com/gladiaio/compare-stt"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
            style={LINK_STYLE}
          >
            full source code
          </a>{" "}
          is public on GitHub, so anyone can audit how votes are counted.
        </p>
        <p>
          <Link href="/methodology" className={LINK_CLASS} style={LINK_STYLE}>
            Read the full methodology
          </Link>
        </p>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const leaderboard = await loadLeaderboard();

  return (
    <>
      <WebApplicationSchema />
      <ArenaPage compactHero={Boolean(leaderboard?.isSignificant)} />
      <div className="mx-auto max-w-2xl px-6 pb-16">
        {leaderboard && (
          <LeaderboardStaticTable data={leaderboard} variant="section" />
        )}
        <MethodologySection />
        <AboutFaq />
      </div>
    </>
  );
}
