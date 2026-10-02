/**
 * Helpers for safely handling client-supplied Vercel Blob URLs.
 * Only arena/ uploads in this project's private store are accepted.
 */

import { isArenaSessionId } from "./arena-session";

const UPLOAD_EXTENSIONS = new Set([
  "webm", "mp4", "wav", "mp3", "ogg", "flac", "audio",
]);

export class InvalidArenaBlobUrlError extends Error {
  constructor(message = "Invalid blob URL") {
    super(message);
    this.name = "InvalidArenaBlobUrlError";
  }
}

export function assertArenaSessionId(value: unknown): asserts value is string {
  if (!isArenaSessionId(value)) {
    throw new InvalidArenaBlobUrlError("sessionId must be a canonical UUID v4");
  }
}

/** Validate the unsuffixed pathname before issuing a client upload token. */
export function validateArenaUpload(pathname: string, clientPayload: string | null): void {
  let payload: unknown;
  try {
    payload = JSON.parse(clientPayload ?? "");
  } catch {
    throw new InvalidArenaBlobUrlError("Upload clientPayload must contain sessionId");
  }
  const sessionId = payload && typeof payload === "object" && "sessionId" in payload
    ? payload.sessionId : undefined;
  assertArenaSessionId(sessionId);
  const prefix = `arena/${sessionId}.`;
  if (typeof pathname !== "string" || !pathname.startsWith(prefix) ||
      !UPLOAD_EXTENSIONS.has(pathname.slice(prefix.length))) {
    throw new InvalidArenaBlobUrlError("Upload pathname must match sessionId and an allowed extension");
  }
}

/**
 * Extract the store id from a Vercel Blob read-write token (`vercel_blob_rw_<storeId>_…`).
 * Throws a plain Error: a missing or malformed token is a server misconfiguration, not a bad request.
 */
export function getBlobStoreId(
  token: string | undefined = process.env.BLOB_READ_WRITE_TOKEN
): string {
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }
  const storeId = token.split("_")[3];
  if (!storeId) {
    throw new Error("Invalid BLOB_READ_WRITE_TOKEN");
  }
  return storeId;
}

export interface ParsedArenaBlobUrl {
  /** Path inside the blob store, e.g. `arena/<sessionId>-abc123.webm`. */
  pathname: string;
  /** Canonical https URL for this store + pathname (no query/hash). */
  url: string;
}

/**
 * Parse and validate a client-supplied blob URL.
 * Rejects anything that is not this store's private object for this session.
 * Matching a client-supplied session ID does not authenticate its owner.
 */
export function parseArenaBlobUrl(
  rawUrl: unknown,
  sessionId: unknown,
  options?: { storeId?: string; token?: string }
): ParsedArenaBlobUrl {
  assertArenaSessionId(sessionId);
  if (typeof rawUrl !== "string" || !rawUrl) {
    throw new InvalidArenaBlobUrlError("blobUrl must be a non-empty string");
  }
  // URL parsing normalizes dot segments, so reject traversal before parsing.
  if (/(?:^|\/)(?:\.|%2e){1,2}(?:\/|[?#]|$)/i.test(rawUrl)) {
    throw new InvalidArenaBlobUrlError("Blob pathname is unsafe");
  }
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
  let pathname: string;
  try {
    pathname = decodeURIComponent(parsed.pathname.slice(1));
  } catch {
    throw new InvalidArenaBlobUrlError("Blob pathname has invalid encoding");
  }
  const prefix = `arena/${sessionId}`;
  const remainder = pathname.slice(prefix.length);
  if (!pathname.startsWith(prefix) || !/^[.-][A-Za-z0-9][A-Za-z0-9._-]*$/.test(remainder)) {
    throw new InvalidArenaBlobUrlError("Blob pathname must match sessionId");
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
