import type { Metadata } from "next";
import Link from "next/link";
import { ArenaPage } from "@/components/arena-page";
import { AboutFaq } from "@/components/seo/about-faq";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title:
    "Which STT API Is Most Accurate? Blind Test",
  description:
    "Compare 6 speech-to-text APIs in blind head-to-head tests. Upload audio, vote on anonymous transcriptions, and see live ELO rankings from community comparisons.",
  alternates: {
    canonical: publicUrl("/"),
  },
  openGraph: {
    url: publicUrl("/"),
  },
};

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
      "Blind head-to-head STT comparisons",
      "Live audio recording and file upload",
      "Community ELO leaderboard",
      "Six commercial STT providers",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <WebApplicationSchema />
      <ArenaPage />
      <div className="mx-auto max-w-2xl px-6 pb-16">
        <section
          className="border-t pt-10 pb-4"
          style={{ borderColor: "var(--color-border-tertiary)" }}
        >
          <h2
            className="type-section-title mb-4 text-xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            About Compare STT
          </h2>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Compare STT is a free, open benchmarking tool that evaluates
            speech-to-text APIs through blind, side-by-side comparisons. Six
            providers are tested: Gladia (Solaria-3), ElevenLabs (Scribe v2),
            Deepgram (Nova 3), AssemblyAI (Universal-3 Pro), Speechmatics
            (Enhanced), and Mistral (Voxtral Mini). Rankings are powered by an{" "}
            <Link
              href="/methodology"
              className="underline"
              style={{ color: "var(--color-text-brand)" }}
            >
              ELO rating system
            </Link>{" "}
            and updated with every vote. See current standings on the{" "}
            <Link
              href="/leaderboard"
              className="underline"
              style={{ color: "var(--color-text-brand)" }}
            >
              live leaderboard
            </Link>
            . Sponsored by{" "}
            <a
              href="https://www.gladia.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "var(--color-text-brand)" }}
            >
              Gladia
            </a>
            .
          </p>
        </section>
        <AboutFaq />
      </div>
    </>
  );
}
