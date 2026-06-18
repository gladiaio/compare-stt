import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { Navbar } from "@/components/navbar";
import { showLeaderboard } from "@/flags";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://comparestt.com"),
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
    url: "https://comparestt.com",
    siteName: "Compare STT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Compare Gladia, Deepgram, AssemblyAI, ElevenLabs, Speechmatics, Mistral — Blind STT Test",
    description:
      "Blind comparison of speech-to-text APIs: Gladia, Deepgram, AssemblyAI, ElevenLabs, Speechmatics, Mistral. Upload audio, vote, and see the live ELO leaderboard.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const leaderboardEnabled = Boolean(await showLeaderboard());

  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <Navbar showLeaderboard={leaderboardEnabled} />
        <main className="pt-[88px] pb-16">{children}</main>
        <footer className="border-t py-6 text-center text-xs" style={{ borderColor: "var(--color-border-tertiary)", color: "var(--color-text-tertiary)" }}>
          <Link href="/terms" className="transition-colors duration-160 hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
            Terms &amp; Privacy
          </Link>
          <span className="mx-2">·</span>
          Sponsored by{" "}
          <a href="https://gladia.io" target="_blank" rel="noopener noreferrer" className="transition-colors duration-160 hover:underline" style={{ color: "var(--color-text-brand)" }}>
            Gladia
          </a>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
