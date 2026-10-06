/** Blob retention regressions: no real Blob store or Sentry calls. */
import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";

const require = createRequire(import.meta.url);
function mockModule(id: string, exports: unknown) {
  const resolved = require.resolve(id);
  const replacement = new Module(resolved);
  replacement.exports = exports;
  replacement.loaded = true;
  require.cache[resolved] = replacement;
}

let delFailures = 0;
const deleted: (string | string[])[] = [];
const reported: unknown[] = [];
const now = Date.now();
const stored = [
  { pathname: "arena/old.webm", uploadedAt: new Date(now - 60 * 60_000) },
  { pathname: "legacy/old.wav", uploadedAt: new Date(now - 24 * 60 * 60_000) },
  { pathname: "arena/in-flight.webm", uploadedAt: new Date(now - 60_000) },
];

mockModule("@vercel/blob", {
  list: async ({ cursor }: { cursor?: string }) => cursor
    ? { blobs: stored.slice(2), hasMore: false }
    : { blobs: stored.slice(0, 2), hasMore: true, cursor: "page-2" },
  del: async (pathnames: string | string[]) => {
    if (delFailures > 0) {
      delFailures--;
      throw new Error("blob store unavailable");
    }
    deleted.push(pathnames);
  },
});
mockModule("@sentry/nextjs", { captureException: (err: unknown) => { reported.push(err); } });
const logError = console.error;
console.error = () => {};

async function main() {
  const { deleteBlobs } = require("./src/lib/blob-cleanup");

  delFailures = 2;
  assert.equal(await deleteBlobs("arena/a.webm", { retryDelayMs: 0 }), true);
  assert.deepEqual(deleted, ["arena/a.webm"], "transient failures are retried");
  assert.equal(reported.length, 0);

  delFailures = 3;
  assert.equal(await deleteBlobs("arena/b.webm", { retryDelayMs: 0 }), false);
  assert.equal(reported.length, 1, "a failed delete is reported, not swallowed");

  const { GET: sweep } = require("./src/app/api/cron/blob-sweep/route");
  const cron = (auth?: string) => sweep(new Request("http://localhost/api/cron/blob-sweep", {
    headers: auth ? { Authorization: auth } : {},
  }));
  assert.equal((await cron()).status, 401, "sweep fails closed without CRON_SECRET");
  process.env.CRON_SECRET = "cron-secret";
  assert.equal((await cron("Bearer wrong")).status, 401);

  deleted.length = 0;
  const res = await cron("Bearer cron-secret");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { deleted: 2, failed: 0 });
  assert.deepEqual(deleted, [["arena/old.webm", "legacy/old.wav"]], "only stale blobs are swept");

  console.log("Blob cleanup tests: passed");
}
main().catch((err) => { logError(err); process.exitCode = 1; });
