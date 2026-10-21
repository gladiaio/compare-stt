"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CollapsibleText } from "@/components/collapsible-text";

const LINK_CLASS = "underline";
const LINK_STYLE = { color: "var(--color-text-brand)" } as const;

interface FaqItem {
  question: string;
  /** Plain text for JSON-LD schema. */
  answer: string;
  /** Rich JSX for the visible accordion panel. */
  content: ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Which speech-to-text API is the most accurate?",
    answer:
      "On Compare STT, accuracy is measured through blind community votes, not a single lab benchmark. Rankings change as users compare transcriptions side by side. Check the live leaderboard for current ELO scores across Gladia, ElevenLabs, Deepgram, AssemblyAI, Speechmatics, and Mistral.",
    content: (
      <p>
        On Compare STT, accuracy is measured through blind community votes, not
        a single lab benchmark. Rankings change as users compare transcriptions
        side by side. Check the{" "}
        <Link href="/leaderboard" className={LINK_CLASS} style={LINK_STYLE}>
          live leaderboard
        </Link>{" "}
        for current ELO scores across Gladia, ElevenLabs, Deepgram, AssemblyAI,
        Speechmatics, and Mistral.
      </p>
    ),
  },
  {
    question: "How does Compare STT work?",
    answer:
      "You upload or record audio. Two speech-to-text providers transcribe it anonymously. You read both transcripts and vote for the more accurate one. Votes feed an ELO ranking system that updates the public leaderboard.",
    content: (
      <p>
        You upload or record audio. Two speech-to-text providers transcribe it
        anonymously and you vote for the more accurate one. Votes feed an{" "}
        <Link href="/methodology" className={LINK_CLASS} style={LINK_STYLE}>
          ELO ranking system
        </Link>{" "}
        that updates the public{" "}
        <Link href="/leaderboard" className={LINK_CLASS} style={LINK_STYLE}>
          leaderboard
        </Link>
        .
      </p>
    ),
  },
  {
    question: "What is ELO scoring?",
    answer:
      "ELO is a pairwise rating system originally used in chess. Each blind vote shifts provider ratings up or down based on expected vs. actual outcomes. Providers that consistently win comparisons climb the leaderboard.",
    content: (
      <p>
        ELO is a pairwise rating system originally used in chess. Each blind
        vote shifts provider ratings up or down based on expected vs. actual
        outcomes. See the full{" "}
        <Link href="/methodology" className={LINK_CLASS} style={LINK_STYLE}>
          methodology
        </Link>{" "}
        and current standings on the{" "}
        <Link href="/leaderboard" className={LINK_CLASS} style={LINK_STYLE}>
          leaderboard
        </Link>
        .
      </p>
    ),
  },
  {
    question: "Which speech-to-text APIs does Compare STT compare?",
    answer:
      "Six providers are in the arena: Gladia (Solaria-3), ElevenLabs (Scribe v2), Deepgram (Nova 3), AssemblyAI (Universal-3 Pro), Speechmatics (Enhanced), and Mistral (Voxtral Mini).",
    content: (
      <p>
        Six providers are in the arena: Gladia (Solaria-3), ElevenLabs (Scribe
        v2), Deepgram (Nova 3), AssemblyAI (Universal-3 Pro), Speechmatics
        (Enhanced), and Mistral (Voxtral Mini). Read about each provider&apos;s
        setup in the{" "}
        <Link href="/methodology" className={LINK_CLASS} style={LINK_STYLE}>
          methodology
        </Link>
        .
      </p>
    ),
  },
  {
    question: "How do I compare speech-to-text APIs?",
    answer:
      "Test each API on audio that matches your real use case: the same languages, accents, audio quality and length you will run in production. Compare word error rate on a labelled sample, then latency, language coverage, features such as diarization, and price per hour. Compare STT adds a fast first pass. Upload or record up to two minutes of your own audio, get two anonymous transcripts from different providers, and vote for the better one before the names are revealed.",
    content: (
      <>
        <p>
          Test each API on audio that matches your real use case: the same
          languages, accents, audio quality and length you will run in
          production. Compare word error rate on a labelled sample, then
          latency, language coverage, features such as diarization, and price
          per hour.
        </p>
        <p className="mt-3">
          Compare STT adds a fast first pass. Upload or record up to two
          minutes of your own audio, get two anonymous transcripts from
          different providers, and vote for the better one before the names
          are revealed.
        </p>
      </>
    ),
  },
  {
    question:
      "What is the difference between an ELO ranking and word error rate?",
    answer:
      "Word error rate counts the share of words a model gets wrong against a human reference transcript on a fixed dataset. An ELO ranking comes from pairwise human votes: each time one transcript is preferred over another, the winning provider gains rating points and the loser drops. Compare STT uses ELO, so its leaderboard reflects which transcripts people prefer on real-world audio, including punctuation and formatting. For word error rate on public datasets, see Gladia's speech-to-text benchmarks.",
    content: (
      <>
        <p>
          Word error rate counts the share of words a model gets wrong against
          a human reference transcript on a fixed dataset. An ELO ranking comes
          from pairwise human votes: each time one transcript is preferred over
          another, the winning provider gains rating points and the loser
          drops.
        </p>
        <p className="mt-3">
          Compare STT uses ELO, so its{" "}
          <Link href="/leaderboard" className={LINK_CLASS} style={LINK_STYLE}>
            leaderboard
          </Link>{" "}
          reflects which transcripts people prefer on real-world audio,
          including punctuation and formatting. For word error rate on public
          datasets, see Gladia&apos;s{" "}
          <a
            href="https://www.gladia.io/competitors/benchmarks"
            className={LINK_CLASS}
            style={LINK_STYLE}
          >
            speech-to-text benchmarks
          </a>
          .
        </p>
      </>
    ),
  },
  {
    question: "Is the comparison fair if Gladia sponsors it?",
    answer:
      "A sponsored test is only as credible as its method. The checks that matter are whether voting is blind, whether every provider gets the same audio, and whether the code is public. On Compare STT, provider names stay hidden until after the vote, every provider receives the same audio file through its official API with no preprocessing, and pairs are balanced so no matchup is over-represented. Gladia pays for every API call, no provider supplied free credits, and the full source code is on GitHub for anyone to audit.",
    content: (
      <>
        <p>
          A sponsored test is only as credible as its method. The checks that
          matter are whether voting is blind, whether every provider gets the
          same audio, and whether the code is public.
        </p>
        <p className="mt-3">
          On Compare STT, provider names stay hidden until after the vote,
          every provider receives the same audio file through its official API
          with no preprocessing, and pairs are balanced so no matchup is
          over-represented. Gladia pays for every API call, no provider
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
          is on GitHub for anyone to audit.
        </p>
      </>
    ),
  },
  {
    question: "Is the comparison blind?",
    answer:
      "Yes. Provider names and logos are hidden until after you vote. You only see two anonymous transcripts labeled Model A and Model B, which reduces brand bias in accuracy judgments.",
    content: (
      <p>
        Yes. Provider names and logos are hidden until after you vote. You only
        see two anonymous transcripts labeled Model A and Model B, reducing
        brand bias. Learn more in the{" "}
        <Link href="/methodology" className={LINK_CLASS} style={LINK_STYLE}>
          methodology
        </Link>{" "}
        or read{" "}
        <Link href="/about" className={LINK_CLASS} style={LINK_STYLE}>
          about the project
        </Link>
        .
      </p>
    ),
  },
  {
    question: "How often is the leaderboard updated?",
    answer:
      "Rankings update continuously as new votes are submitted. ELO scores are recomputed from the full vote history, so every comparison can shift provider standings.",
    content: (
      <p>
        Rankings update continuously as new votes are submitted. ELO scores are
        recomputed from the full vote history, so every comparison can shift
        provider standings. See the{" "}
        <Link href="/leaderboard" className={LINK_CLASS} style={LINK_STYLE}>
          live leaderboard
        </Link>{" "}
        for current results.
      </p>
    ),
  },
  {
    question: "Who sponsors Compare STT?",
    answer:
      "Compare STT is sponsored by Gladia, a speech-to-text API company. The benchmark is open source and community-driven; see the methodology page for full transparency on scoring and provider settings.",
    content: (
      <p>
        Compare STT is sponsored by{" "}
        <a
          href="https://www.gladia.io"
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
          style={LINK_STYLE}
        >
          Gladia
        </a>
        , a speech-to-text API company. The benchmark is open source and
        community-driven; see the{" "}
        <Link href="/methodology" className={LINK_CLASS} style={LINK_STYLE}>
          methodology
        </Link>{" "}
        for full transparency on scoring and provider settings.
      </p>
    ),
  },
];

export function AboutFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section
      className="border-t pt-10"
      style={{ borderColor: "var(--color-border-tertiary)" }}
      aria-labelledby="about-faq-heading"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <h2
        id="about-faq-heading"
        className="mb-6 type-section-title text-xl"
        style={{ color: "var(--color-text-primary)" }}
      >
        Speech-to-text API comparison FAQs
      </h2>

      <div>
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <CollapsibleText
              key={item.question}
              title={item.question}
              open={isOpen}
              onOpenChange={(open) => setOpenIndex(open ? index : null)}
            >
              {item.content}
            </CollapsibleText>
          );
        })}
      </div>

      <p className="mt-6 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
        See the{" "}
        <Link href="/leaderboard" className="link-text">
          live leaderboard
        </Link>{" "}
        or read the full{" "}
        <Link href="/methodology" className="link-text">
          methodology
        </Link>
        .
      </p>
    </section>
  );
}
