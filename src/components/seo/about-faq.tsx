"use client";

import Link from "next/link";
import { useState } from "react";
import { CollapsibleText } from "@/components/collapsible-text";

const FAQ_ITEMS = [
  {
    question: "Which STT API is most accurate?",
    answer:
      "On Compare STT, accuracy is measured through blind community votes, not a single lab benchmark. Rankings change as users compare transcriptions side by side. Check the live leaderboard for current ELO scores across Gladia, ElevenLabs, Deepgram, AssemblyAI, Speechmatics, and Mistral.",
  },
  {
    question: "How does Compare STT work?",
    answer:
      "You upload or record audio. Two speech-to-text providers transcribe it anonymously. You read both transcripts and vote for the more accurate one. Votes feed an ELO ranking system that updates the public leaderboard.",
  },
  {
    question: "What is ELO scoring?",
    answer:
      "ELO is a pairwise rating system originally used in chess. Each blind vote shifts provider ratings up or down based on expected vs. actual outcomes. Providers that consistently win comparisons climb the leaderboard.",
  },
  {
    question: "How many speech-to-text providers are compared?",
    answer:
      "Six providers are in the arena: Gladia (Solaria), ElevenLabs (Scribe v2), Deepgram (Nova 3), AssemblyAI (Universal-3 Pro), Speechmatics (Enhanced), and Mistral (Voxtral Mini).",
  },
  {
    question: "Is the comparison blind?",
    answer:
      "Yes. Provider names and logos are hidden until after you vote. You only see two anonymous transcripts labeled Model A and Model B, which reduces brand bias in accuracy judgments.",
  },
  {
    question: "How often is the leaderboard updated?",
    answer:
      "Rankings update continuously as new votes are submitted. ELO scores are recomputed from the full vote history, so every comparison can shift provider standings.",
  },
  {
    question: "Who sponsors Compare STT?",
    answer:
      "Compare STT is sponsored by Gladia, a speech-to-text API company. The benchmark is open source and community-driven; see the methodology page for full transparency on scoring and provider settings.",
  },
] as const;

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
              <p>{item.answer}</p>
            </CollapsibleText>
          );
        })}
      </div>

      <p className="mt-6 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
        See the{" "}
        <Link href="/leaderboard" className="underline hover:no-underline" style={{ color: "var(--color-text-brand)" }}>
          live leaderboard
        </Link>{" "}
        or read the full{" "}
        <Link href="/methodology" className="underline hover:no-underline" style={{ color: "var(--color-text-brand)" }}>
          methodology
        </Link>
        .
      </p>
    </section>
  );
}
