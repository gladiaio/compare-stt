import type { Metadata } from "next";
import Link from "next/link";
import { Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Navbar } from "@/components/navbar";
import { showLeaderboard } from "@/flags";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://comparestt.com"),
  title: "Compare STT | Blind Speech-to-Text Comparison",
  description:
    "Compare speech-to-text providers in blind tests. Record or upload audio, vote for the best transcription, and see how providers stack up on the leaderboard.",
  icons: { icon: `${process.env.NEXT_PUBLIC_ORIGIN || ""}/logo.svg` },
  openGraph: {
    title: "Compare STT | Blind Speech-to-Text Comparison",
    description:
      "Compare speech-to-text providers in blind tests. Record or upload audio, vote for the best transcription, and see how providers stack up on the leaderboard.",
    url: "https://comparestt.com",
    siteName: "Compare STT",
    images: [
      {
        url: "https://cdn.prod.website-files.com/6458f30fed157c01444bd0b2/69c24023b37f422c8e4c22d4_068ec19e06baf93c62157a2baef8d940_Gladia_Website_Thumbnail_Compare-STT-providers.png",
        width: 1200,
        height: 630,
        alt: "Compare STT — Blind Speech-to-Text Comparison",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare STT | Blind Speech-to-Text Comparison",
    description:
      "Compare speech-to-text providers in blind tests. Record or upload audio, vote for the best transcription, and see how providers stack up on the leaderboard.",
    images: [
      "https://cdn.prod.website-files.com/6458f30fed157c01444bd0b2/69c24023b37f422c8e4c22d4_068ec19e06baf93c62157a2baef8d940_Gladia_Website_Thumbnail_Compare-STT-providers.png",
    ],
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
      <body className={`${geistMono.variable} antialiased`}>
        <Navbar showLeaderboard={leaderboardEnabled} />
        <main className="pt-[88px] pb-16">{children}</main>
        <footer className="border-t py-6 text-center text-xs" style={{ borderColor: "var(--color-border-tertiary)", color: "var(--color-text-tertiary)" }}>
          <Link href={`${process.env.NEXT_PUBLIC_ORIGIN || ""}/terms`} className="transition-colors duration-160 hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
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
