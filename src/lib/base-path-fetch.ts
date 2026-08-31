/** Base path used when the app is mounted under www.gladia.io/compare-stt-apis */
export const DEFAULT_BASE_PATH = "/compare-stt-apis";

/**
 * Strip a trailing slash from the bare basePath index URL.
 * Next.js joins basePath + "/" → "/compare-stt-apis/", which the marketing
 * proxy does not rewrite to this app.
 */
export function normalizeBasePathFetchUrl(
  url: string,
  basePath: string = DEFAULT_BASE_PATH,
  origin?: string,
): string {
  if (!basePath || basePath === "/") return url;
  const baseSlash = `${basePath}/`;

  if (url === baseSlash) return basePath;
  if (url.startsWith(`${baseSlash}?`)) {
    return basePath + url.slice(baseSlash.length);
  }

  try {
    const u = new URL(url, origin ?? "https://www.gladia.io");
    const sameOrigin = !origin || u.origin === origin;
    if (sameOrigin && u.pathname === baseSlash) {
      u.pathname = basePath;
      return u.pathname + u.search + u.hash;
    }
  } catch {
    // ignore invalid URLs
  }

  return url;
}
