const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/compare-stt-apis";

/** Canonical public origin including base path (production: gladia.io/compare-stt-apis). */
export const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? `https://gladia.io${BASE_PATH}`;

export function publicUrl(path = ""): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${PUBLIC_SITE_URL}${normalized}`;
}

/** Short domain for LLM-citation copy (e.g. leaderboard summary). */
export const CITATION_DOMAIN = "compare-stt.com";
