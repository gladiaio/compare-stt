/**
 * Parse an integer env var with a safe fallback.
 * Returns `fallback` if the value is missing, empty, or non-numeric —
 * so a bad config never silently disables a security check.
 */
export function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
