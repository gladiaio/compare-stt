/**
 * One-off audit + purge of the Compare STT Blob store.
 *
 *   npx tsx scripts/blob-audit.ts             # list only: objects that should not be here
 *   npx tsx scripts/blob-audit.ts --delete    # then deletes them
 *
 * Anything older than an in-flight upload (15 min) should already be gone.
 * Objects outside the arena upload pattern are flagged with "!".
 *
 * Reads BLOB_READ_WRITE_TOKEN from .env.local / .env (use the prod token).
 */
import { config } from "dotenv";
import { del, list, type ListBlobResultBlob } from "@vercel/blob";

config({ path: [".env.local", ".env"] });

/** Pathname written by /api/upload: arena/<sessionId>-<random suffix>.<ext> */
const ARENA_PATHNAME =
	/^arena\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.-][A-Za-z0-9._-]+$/i;
const MAX_AGE_MS = 15 * 60_000;
const BATCH_SIZE = 1000;

const args = new Set(process.argv.slice(2));

async function listAll(): Promise<ListBlobResultBlob[]> {
	const blobs: ListBlobResultBlob[] = [];
	let cursor: string | undefined;
	do {
		const page = await list({ cursor, limit: BATCH_SIZE });
		blobs.push(...page.blobs);
		cursor = page.hasMore ? page.cursor : undefined;
	} while (cursor);
	return blobs;
}

function summarize(label: string, blobs: ListBlobResultBlob[]) {
	const bytes = blobs.reduce((sum, b) => sum + b.size, 0);
	const dates = blobs
		.map((b) => b.uploadedAt.getTime())
		.sort((a, b) => a - b);
	const range = dates.length
		? `${new Date(dates[0]).toISOString()} → ${new Date(dates[dates.length - 1]).toISOString()}`
		: "-";
	console.log(
		`${label.padEnd(28)} ${String(blobs.length).padStart(5)} objects  ${(bytes / 1e6).toFixed(1).padStart(8)} MB  ${range}`,
	);
}

async function main() {
	const blobs = await listAll();
	const cutoff = Date.now() - MAX_AGE_MS;
	const stale = blobs
		.filter((b) => b.uploadedAt.getTime() < cutoff)
		.sort((x, y) => +x.uploadedAt - +y.uploadedAt);
	const unexpected = stale.filter((b) => !ARENA_PATHNAME.test(b.pathname));

	console.log(`Audit at ${new Date().toISOString()}\n`);
	summarize("Total", blobs);
	summarize("Should not be here", stale);
	summarize("  of which unexpected path", unexpected);
	summarize(
		"In-flight (< 15 min)",
		blobs.filter((b) => b.uploadedAt.getTime() >= cutoff),
	);

	if (stale.length) console.log();
	for (const b of stale) {
		const flag = ARENA_PATHNAME.test(b.pathname) ? " " : "!";
		console.log(
			`${flag} ${b.uploadedAt.toISOString()}  ${String(b.size).padStart(10)}  ${b.pathname}`,
		);
	}

	if (!args.has("--delete")) return;
	const pathnames = stale.map((b) => b.pathname);
	for (let i = 0; i < pathnames.length; i += BATCH_SIZE) {
		await del(pathnames.slice(i, i + BATCH_SIZE));
	}
	console.log(
		`\nDeleted ${pathnames.length} objects (kept ${blobs.length - pathnames.length} in-flight).`,
	);
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
