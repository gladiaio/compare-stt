import type { Metadata } from "next";
import { ArenaPage } from "@/components/arena-page";
import { AboutFaq } from "@/components/seo/about-faq";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title:
    "Compare Gladia, Deepgram, AssemblyAI, ElevenLabs, Speechmatics, Mistral — Blind STT Test",
  description:
    "Blind comparison of speech-to-text APIs: Gladia, Deepgram, AssemblyAI, ElevenLabs, Speechmatics, Mistral. Upload audio, vote, and see the live ELO leaderboard.",
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
        <AboutFaq />
      </div>
    </>
  );
}
