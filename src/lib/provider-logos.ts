import { readFile } from "node:fs/promises";
import path from "node:path";

/** Logo paths stored on providers, e.g. "/providers/gladia.svg". */
const LOGO_PATH = /^\/providers\/[a-z0-9-]+\.svg$/;

const cache = new Map<string, Promise<string | null>>();

/**
 * Reads a provider logo from public/ so it can be inlined into server-rendered
 * SVG. Returns null for unexpected paths or missing files. Results are cached
 * for the lifetime of the server instance.
 *
 * Vercel only ships public/ files to functions that trace them, see
 * outputFileTracingIncludes in next.config.ts.
 */
export function readProviderLogo(logoUrl: string): Promise<string | null> {
  if (!LOGO_PATH.test(logoUrl)) return Promise.resolve(null);

  let pending = cache.get(logoUrl);
  if (!pending) {
    pending = readFile(path.join(process.cwd(), "public", logoUrl), "utf8").catch(() => null);
    cache.set(logoUrl, pending);
  }
  return pending;
}
