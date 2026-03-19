import type { Metadata } from "next";
import Link from "next/link";
import { Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Compare STT | Blind Speech-to-Text Comparison",
  description:
    "Compare speech-to-text providers in blind tests. Record or upload audio, vote for the best transcription, and see how providers stack up on the leaderboard.",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistMono.variable} antialiased`}>
        <Navbar />
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
