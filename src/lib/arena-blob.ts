/**
 * Helpers for safely handling client-supplied Vercel Blob URLs.
 * Only arena/ uploads in this project's private store are accepted.
 */

const ARENA_PREFIX = "arena/";

export class InvalidArenaBlobUrlError extends Error {
  constructor(message = "Invalid blob URL") {
    super(message);
    this.name = "InvalidArenaBlobUrlError";
  }
}

/** Extract the store id from a Vercel Blob read-write token (`vercel_blob_rw_<storeId>_…`). */
export function getBlobStoreId(
  token: string | undefined = process.env.BLOB_READ_WRITE_TOKEN
): string {
  if (!token) {
    throw new InvalidArenaBlobUrlError("BLOB_READ_WRITE_TOKEN is not set");
  }
  const storeId = token.split("_")[3];
  if (!storeId) {
    throw new InvalidArenaBlobUrlError("Invalid BLOB_READ_WRITE_TOKEN");
  }
  return storeId;
}

export interface ParsedArenaBlobUrl {
  /** Path inside the blob store, e.g. `arena/session.webm-abc123`. */
  pathname: string;
  /** Canonical https URL for this store + pathname (no query/hash). */
  url: string;
}

/**
 * Parse and validate a client-supplied blob URL.
 * Rejects anything that is not this store's private arena/ object.
 */
export function parseArenaBlobUrl(
  rawUrl: string,
  options?: { storeId?: string; token?: string }
): ParsedArenaBlobUrl {
  const storeId = options?.storeId ?? getBlobStoreId(options?.token);

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new InvalidArenaBlobUrlError("Invalid blob URL");
  }

  if (parsed.protocol !== "https:") {
    throw new InvalidArenaBlobUrlError("Blob URL must use https");
  }
  if (parsed.username || parsed.password) {
    throw new InvalidArenaBlobUrlError("Blob URL must not include credentials");
  }

  const expectedHost = `${storeId}.private.blob.vercel-storage.com`;
  if (parsed.hostname !== expectedHost) {
    throw new InvalidArenaBlobUrlError("Blob URL host is not this store");
  }

  // Strip leading slash; reject empty / traversal / absolute tricks
  const pathname = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (!pathname.startsWith(ARENA_PREFIX)) {
    throw new InvalidArenaBlobUrlError("Blob pathname must be under arena/");
  }
  if (
    pathname.includes("..") ||
    pathname.includes("//") ||
    pathname.includes("\\") ||
    pathname.includes("%2e") ||
    pathname.includes("%2E")
  ) {
    throw new InvalidArenaBlobUrlError("Blob pathname is unsafe");
  }

  return {
    pathname,
    url: `https://${expectedHost}/${pathname}`,
  };
}
