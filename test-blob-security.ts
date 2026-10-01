/** Route-level regressions: no real database, Blob store or provider calls. */
import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const restorers: (() => void)[] = [];
function mockModule(id: string, exports: unknown) {
  const resolved = require.resolve(id);
  const original = require.cache[resolved];
  const replacement = new Module(resolved);
  replacement.exports = exports;
  replacement.loaded = true;
  require.cache[resolved] = replacement;
  restorers.push(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
}

const SESSION = "12345678-1234-4123-8123-123456789abc";
const OTHER = "12345678-1234-4123-8123-123456789abd";
const pathname = `arena/${SESSION}-xyz789.webm`;
const host = "store123abc.private.blob.vercel-storage.com";
const calls = { db: 0, get: [] as string[], del: [] as string[], providers: 0, tokens: 0 };
let blobMissing = false;
let databaseFailure = false;
function db<T>(value: T) {
  return async () => {
    calls.db++;
    if (databaseFailure) throw new Error("simulated database failure");
    return value;
  };
}
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
  get: async (path: string, options: unknown) => {
    calls.get.push(path);
    assert.equal(path, pathname);
    assert.deepEqual(options, { access: "private" });
    return blobMissing ? null : {
      stream: new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1, 2, 3])); controller.close(); } }),
      blob: { contentType: "audio/webm" },
    };
  },
  del: async (path: string) => { calls.del.push(path); },
});
mockModule("./src/lib/transcribe", {
  transcribeForProvider: async (_slug: string, audio: Buffer, mime: string) => {
    calls.providers++;
    assert.deepEqual([...audio], [1, 2, 3]);
    assert.equal(mime, "audio/webm");
    return { transcript: "test audio", words: [] };
  },
});
mockModule("./src/lib/match-token", { signMatchToken: () => "signed", hashMatchToken: () => "hashed" });
mockModule("./src/lib/rate-limit", { checkRateLimit: () => ({ allowed: true, retryAfterMs: 0 }) });
mockModule("@vercel/blob/client", {
  handleUpload: async ({ body, onBeforeGenerateToken }: {
    body: { payload: { pathname: string; clientPayload: string | null } };
    onBeforeGenerateToken: (pathname: string, payload: string | null) => Promise<unknown>;
  }) => {
    const options = await onBeforeGenerateToken(body.payload.pathname, body.payload.clientPayload);
    const settings = options as { addRandomSuffix: boolean; maximumSizeInBytes: number; allowedContentTypes: string[] };
    assert.equal(settings.addRandomSuffix, true);
    assert.equal(settings.maximumSizeInBytes, 50 * 1024 * 1024);
    assert.ok(settings.allowedContentTypes.includes("audio/webm"));
    assert.ok(settings.allowedContentTypes.includes("audio/mpeg"));
    calls.tokens++;
    return { type: "blob.generate-client-token", clientToken: "mock-token" };
  },
});
const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
const originalFetch = globalThis.fetch;
process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_store123abc_fake";
globalThis.fetch = async () => { throw new Error("Unexpected manual fetch"); };

function request(body: unknown) {
  return new Request("http://localhost/api/test", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}
async function main() {
  const { POST: transcribe } = require("./src/app/api/transcribe/route");
  const { POST: upload } = require("./src/app/api/upload/route");
  let passed = 0;
  for (const body of [
    { sessionId: SESSION, blobUrl: `https://${host}/arena/${OTHER}.webm` },
    { sessionId: "invalid", blobUrl: `https://${host}/${pathname}` },
    { sessionId: SESSION, blobUrl: "https://evil.example/arena/audio.webm" },
    { sessionId: SESSION, blobUrl: `https://${host}/arena/${SESSION}.%ZZ` },
    { sessionId: SESSION, blobUrl: `https://${host}/arena/${SESSION}/audio.webm` },
    { sessionId: SESSION, blobUrl: 123 },
  ]) {
    const before = structuredClone(calls);
    const response = await transcribe(request(body));
    assert.equal(response.status, 400);
    assert.deepEqual(calls, before, "Invalid transcription touched a dependency");
    passed++;
  }
  for (const payload of [
    { pathname: `arena/${SESSION}.webm`, clientPayload: null },
    { pathname: `arena/${SESSION}.webm`, clientPayload: "{" },
    { pathname: `arena/${SESSION}.webm`, clientPayload: JSON.stringify({ sessionId: OTHER }) },
    { pathname: "secrets/test.webm", clientPayload: JSON.stringify({ sessionId: SESSION }) },
    { pathname: `arena/${SESSION}.exe`, clientPayload: JSON.stringify({ sessionId: SESSION }) },
  ]) {
    const response = await upload(request({ type: "blob.generate-client-token", payload }));
    assert.equal(response.status, 400);
    assert.equal(calls.tokens, 0);
    passed++;
  }
  const malformed = await upload(new Request("http://localhost/api/upload", { method: "POST", body: "{" }));
  assert.equal(malformed.status, 400);
  passed++;
  const validUpload = await upload(request({ type: "blob.generate-client-token", payload: {
    pathname: `arena/${SESSION}.webm`, clientPayload: JSON.stringify({ sessionId: SESSION }),
  } }));
  assert.equal(validUpload.status, 200);
  assert.equal(calls.tokens, 1);
  passed++;
  const response = await transcribe(request({ sessionId: SESSION, blobUrl: `https://${host}/${pathname}` }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).transcriptA, "test audio");
  assert.deepEqual(calls.get, [pathname]);
  assert.deepEqual(calls.del, [pathname]);
  assert.equal(calls.providers, 2);
  passed++;
  blobMissing = true;
  assert.equal((await transcribe(request({ sessionId: SESSION, blobUrl: `https://${host}/${pathname}` }))).status, 500);
  assert.deepEqual(calls.del, [pathname, pathname]);
  assert.equal(calls.providers, 2);
  passed++;
  databaseFailure = true;
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.equal((await transcribe(request({ sessionId: SESSION, blobUrl: `https://${host}/${pathname}` }))).status, 500);
  } finally { console.error = originalError; }
  assert.deepEqual(calls.del, [pathname, pathname, pathname]);
  assert.deepEqual(calls.get, [pathname, pathname]);
  passed++;
  console.log(`Blob route security tests: ${passed} passed`);
}
main().catch((err) => { console.error(err); process.exitCode = 1; }).finally(() => {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
  else process.env.BLOB_READ_WRITE_TOKEN = originalToken;
  restorers.reverse().forEach((restore) => restore());
});
