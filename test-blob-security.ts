/** Route-level regressions: no real database, Blob store or provider calls. */
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

const SESSION = "12345678-1234-4123-8123-123456789abc";
const OTHER = "12345678-1234-4123-8123-123456789abd";
const pathname = `arena/${SESSION}-xyz789.webm`;
const blobUrl = `https://store123abc.private.blob.vercel-storage.com/${pathname}`;
const calls = { db: 0, get: [] as string[], del: [] as string[], providers: 0, tokens: 0 };
let blobMissing = false;

const db = <T>(value: T) => async () => { calls.db++; return value; };
mockModule("./src/lib/db", { prisma: {
  session: { findUnique: db({ id: SESSION }), create: db({ id: SESSION }) },
  vote: { count: db(0), groupBy: db([]) },
  provider: { findMany: db([
    { id: "a", slug: "a", name: "A", logoUrl: "" },
    { id: "b", slug: "b", name: "B", logoUrl: "" },
  ]) },
  matchToken: { create: db({}) },
} });
mockModule("@vercel/blob", {
  get: async (path: string) => {
    calls.get.push(path);
    return blobMissing ? null : {
      stream: new Blob([new Uint8Array([1, 2, 3])]).stream(),
      blob: { contentType: "audio/webm" },
    };
  },
  del: async (path: string) => { calls.del.push(path); },
});
mockModule("./src/lib/transcribe", {
  transcribeForProvider: async () => { calls.providers++; return { transcript: "test audio", words: [] }; },
});
mockModule("./src/lib/match-token", { signMatchToken: () => "signed", hashMatchToken: () => "hashed" });
mockModule("./src/lib/rate-limit", {
  checkRateLimit: async () => ({ allowed: true, retryAfterMs: 0 }),
  getClientIp: () => "127.0.0.1",
});
mockModule("@vercel/blob/client", {
  handleUpload: async ({ body, onBeforeGenerateToken }: {
    body: { payload: { pathname: string; clientPayload: string | null } };
    onBeforeGenerateToken: (pathname: string, payload: string | null) => Promise<unknown>;
  }) => {
    await onBeforeGenerateToken(body.payload.pathname, body.payload.clientPayload);
    calls.tokens++;
    return { type: "blob.generate-client-token", clientToken: "mock-token" };
  },
});
process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_store123abc_fake";
// The original bug: the token was sent along with a fetch of the client URL
globalThis.fetch = async () => { throw new Error("Unexpected manual fetch"); };

const request = (body: unknown) => new Request("http://localhost/api/test", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

async function main() {
  const { POST: transcribe } = require("./src/app/api/transcribe/route");
  const { POST: upload } = require("./src/app/api/upload/route");

  for (const body of [
    { sessionId: SESSION, blobUrl: "https://evil.example/arena/audio.webm" },
    { sessionId: SESSION, blobUrl: blobUrl.replace(SESSION, OTHER) },
    { sessionId: "invalid", blobUrl },
  ]) {
    const before = structuredClone(calls);
    assert.equal((await transcribe(request(body))).status, 400);
    assert.deepEqual(calls, before, "invalid transcription touched a dependency");
  }

  const ok = await transcribe(request({ sessionId: SESSION, blobUrl }));
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).transcriptA, "test audio");
  assert.deepEqual(calls.get, [pathname]);
  assert.deepEqual(calls.del, [pathname]);
  assert.equal(calls.providers, 2);

  blobMissing = true;
  assert.equal((await transcribe(request({ sessionId: SESSION, blobUrl }))).status, 404);
  assert.deepEqual(calls.del, [pathname, pathname], "missing blob is still cleaned up");

  const uploadToken = (pathname: string, clientPayload: string | null) =>
    upload(request({ type: "blob.generate-client-token", payload: { pathname, clientPayload } }));
  assert.equal((await uploadToken("secrets/test.webm", JSON.stringify({ sessionId: SESSION }))).status, 400);
  assert.equal((await uploadToken(`arena/${SESSION}.webm`, JSON.stringify({ sessionId: OTHER }))).status, 400);
  assert.equal(calls.tokens, 0);
  assert.equal((await uploadToken(`arena/${SESSION}.webm`, JSON.stringify({ sessionId: SESSION }))).status, 200);
  assert.equal(calls.tokens, 1);

  console.log("Blob route security tests: passed");
}
main().catch((err) => { console.error(err); process.exitCode = 1; });
