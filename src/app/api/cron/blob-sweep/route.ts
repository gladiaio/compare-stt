import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { deleteBlobs } from "@/lib/blob-cleanup";

export const maxDuration = 60;

/** Older than any in-flight upload + transcribe (maxDuration 120s). */
const MAX_AGE_MS = 15 * 60_000;
const BATCH_SIZE = 1000;

/**
 * Vercel Cron: delete visitor audio that the transcribe cleanup missed
 * (abandoned uploads, failed deletes). Vercel Blob has no per-object TTL.
 * The store only holds visitor uploads, so the whole store is swept.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = Date.now() - MAX_AGE_MS;
  const stale: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: BATCH_SIZE });
    for (const blob of page.blobs) {
      if (blob.uploadedAt.getTime() < cutoff) stale.push(blob.pathname);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  let deleted = 0;
  for (let i = 0; i < stale.length; i += BATCH_SIZE) {
    const batch = stale.slice(i, i + BATCH_SIZE);
    if (await deleteBlobs(batch)) deleted += batch.length;
  }

  const failed = stale.length - deleted;
  return NextResponse.json({ deleted, failed }, { status: failed ? 500 : 200 });
}
