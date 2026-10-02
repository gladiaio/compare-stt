/**
 * Rate limiting shared across serverless instances via Postgres.
 *
 * Fixed-window counters, one row per key in `rate_limits`. This is a
 * defense-in-depth layer on top of the DB-backed single-use token and
 * session cap checks, so it fails open: if the database is unreachable it
 * falls back to a per-instance in-memory limiter and reports to Sentry.
 */

import * as Sentry from "@sentry/nextjs";
import { prisma } from "./db";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

/** Minimal slice of the Prisma client used here, so tests can inject a fake. */
export interface RateLimitDb {
  $queryRaw(query: TemplateStringsArray, ...values: unknown[]): PromiseLike<unknown>;
  $executeRaw(query: TemplateStringsArray, ...values: unknown[]): PromiseLike<number>;
}

const MIN_RETRY_AFTER_MS = 1000;
const STALE_ROW_MS = 24 * 60 * 60 * 1000;
const CLEANUP_PROBABILITY = 0.01;

/** Client IP as set by Vercel (which overwrites x-forwarded-for). */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  options?: { db?: RateLimitDb; now?: number; random?: () => number }
): Promise<RateLimitResult> {
  const db = options?.db ?? prisma;
  const now = options?.now ?? Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);

  try {
    const rows = (await db.$queryRaw`
      INSERT INTO "rate_limits" ("key", "window_start", "count")
      VALUES (${key}, ${windowStart}, 1)
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "rate_limits"."window_start" = EXCLUDED."window_start"
          THEN "rate_limits"."count" + 1
          ELSE 1
        END,
        "window_start" = EXCLUDED."window_start"
      RETURNING "count"`) as { count: number }[];

    if ((options?.random ?? Math.random)() < CLEANUP_PROBABILITY) {
      const cutoff = new Date(now - STALE_ROW_MS);
      Promise.resolve(
        db.$executeRaw`DELETE FROM "rate_limits" WHERE "window_start" < ${cutoff}`
      ).catch((err) => console.error("Rate limit cleanup failed:", err));
    }

    const count = Number(rows[0]?.count);
    if (!Number.isFinite(count)) {
      throw new Error("Rate limit upsert returned no count");
    }
    if (count > maxRequests) {
      const retryAfterMs = windowStart.getTime() + windowMs - now;
      return { allowed: false, retryAfterMs: Math.max(retryAfterMs, MIN_RETRY_AFTER_MS) };
    }
    return { allowed: true, retryAfterMs: 0 };
  } catch (err) {
    Sentry.captureException(err, { tags: { component: "rate-limit" } });
    return checkMemoryRateLimit(key, maxRequests, windowMs);
  }
}

// --- Per-instance fallback (in-memory sliding window) ---

interface SlidingWindow {
  timestamps: number[];
}

const windows = new Map<string, SlidingWindow>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function maybeCleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, win] of windows) {
    win.timestamps = win.timestamps.filter((t) => t > cutoff);
    if (win.timestamps.length === 0) windows.delete(key);
  }
}

/** Not shared across serverless instances; used only when the database is unavailable. */
export function checkMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  maybeCleanup(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;

  let win = windows.get(key);
  if (!win) {
    win = { timestamps: [] };
    windows.set(key, win);
  }

  win.timestamps = win.timestamps.filter((t) => t > cutoff);

  if (win.timestamps.length >= maxRequests) {
    const oldestInWindow = win.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, MIN_RETRY_AFTER_MS) };
  }

  win.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}
