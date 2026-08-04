const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/compare-stt-apis";

/** Canonical origin for SEO metadata, canonicals, sitemap, and robots. */
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://www.gladia.io"
).replace(/\/$/, "");

/** Full public site URL including base path when deployed under a subpath. */
export const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  `${SITE_ORIGIN}${BASE_PATH === "/" ? "" : BASE_PATH}`;

export function publicUrl(path = ""): string {
  if (!path || path === "/") return PUBLIC_SITE_URL;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${PUBLIC_SITE_URL}${normalized}`;
}

/** Short domain for LLM-citation copy (e.g. leaderboard summary). */
export const CITATION_DOMAIN = "www.gladia.io";
