/**
 * In-memory sliding-window rate limiter.
 *
 * Not shared across serverless instances — this is a defense-in-depth layer
 * on top of the DB-backed single-use token and session cap checks.
 */

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

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
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
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }

  win.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}
