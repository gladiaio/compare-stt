/**
 * Deletion of visitor audio from the Blob store.
 * A delete failure must never be swallowed: unreported, it becomes retained audio.
 */

import * as Sentry from "@sentry/nextjs";
import { del } from "@vercel/blob";

const DELETE_ATTEMPTS = 3;
const RETRY_DELAY_MS = 250;

/**
 * Delete blobs by pathname, retrying transient failures.
 * Never throws: returns false and reports to Sentry once all attempts fail.
 */
export async function deleteBlobs(
  pathnames: string | string[],
  options?: { retryDelayMs?: number }
): Promise<boolean> {
  const retryDelayMs = options?.retryDelayMs ?? RETRY_DELAY_MS;
  for (let attempt = 1; ; attempt++) {
    try {
      await del(pathnames);
      return true;
    } catch (err) {
      if (attempt >= DELETE_ATTEMPTS) {
        console.error("Blob cleanup failed:", err);
        Sentry.captureException(err, {
          tags: { component: "blob-cleanup" },
          extra: { pathnames },
        });
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
    }
  }
}
