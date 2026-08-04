import type { Metadata } from "next";
import Link from "next/link";
import { Geist_Mono, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Navbar } from "@/components/navbar";
import {
  GladiaAnalytics,
  GladiaAnalyticsNoscript,
} from "@/components/tracking/gladia-analytics";
import { PageViewTracker } from "@/components/tracking/page-view-tracker";
import { showLeaderboard } from "@/flags";
import { PUBLIC_SITE_URL, SITE_ORIGIN } from "@/lib/site";
import "./globals.css";

const OG_IMAGE =
  "https://cdn.prod.website-files.com/6458f30fed157c01444bd0b2/69c24023b37f422c8e4c22d4_068ec19e06baf93c62157a2baef8d940_Gladia_Website_Thumbnail_Compare-STT-providers.png";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default:
      "Compare Gladia, Deepgram, AssemblyAI, ElevenLabs, Speechmatics, Mistral — Blind STT Test | Compare STT",
    template: "%s | Compare STT",
  },
  description:
    "Blind comparison of speech-to-text APIs: Gladia, Deepgram, AssemblyAI, ElevenLabs, Speechmatics, Mistral. Upload audio, vote, and see the live ELO leaderboard.",
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logo.svg` },
  openGraph: {
    title:
      "Compare Gladia, Deepgram, AssemblyAI, ElevenLabs, Speechmatics, Mistral — Blind STT Test",
    description:
      "Blind comparison of speech-to-text APIs: Gladia, Deepgram, AssemblyAI, ElevenLabs, Speechmatics, Mistral. Upload audio, vote, and see the live ELO leaderboard.",
    url: PUBLIC_SITE_URL,
    siteName: "Compare STT",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Compare STT — Blind Speech-to-Text Comparison",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Compare Gladia, Deepgram, AssemblyAI, ElevenLabs, Speechmatics, Mistral — Blind STT Test",
    description:
      "Blind comparison of speech-to-text APIs: Gladia, Deepgram, AssemblyAI, ElevenLabs, Speechmatics, Mistral. Upload audio, vote, and see the live ELO leaderboard.",
    images: [OG_IMAGE],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const leaderboardEnabled = Boolean(await showLeaderboard());

  return (
    <html lang="en" className={`dark ${manrope.variable} ${geistMono.variable}`}>
      <body className={`${manrope.className} antialiased`}>
        <GladiaAnalyticsNoscript />
        <GladiaAnalytics />
        <PageViewTracker />
        <Navbar showLeaderboard={leaderboardEnabled} />
        <main className="pt-[88px] pb-16">{children}</main>
        <footer className="border-t py-6 text-center text-xs" style={{ borderColor: "var(--color-border-tertiary)", color: "var(--color-text-tertiary)" }}>
          <Link href="/terms" className="transition-colors duration-160 hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
            Terms &amp; Privacy
          </Link>
          <span className="mx-2">·</span>
          Sponsored by{" "}
          <a href="https://www.gladia.io" target="_blank" rel="noopener noreferrer" className="transition-colors duration-160 hover:underline" style={{ color: "var(--color-text-brand)" }}>
            Gladia
          </a>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
