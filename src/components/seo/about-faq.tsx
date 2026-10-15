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
    question: "Which STT API is most accurate?",
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
    question: "How many speech-to-text providers are compared?",
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
        Frequently asked questions
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
