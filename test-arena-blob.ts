/**
 * Unit tests for arena blob URL validation.
 */
import assert from "node:assert/strict";
import {
  InvalidArenaBlobUrlError,
  getBlobStoreId,
  parseArenaBlobUrl,
  validateArenaUpload,
} from "./src/lib/arena-blob";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${(e as Error).message}`);
    failed++;
  }
}

const STORE_ID = "store123abc";
const TOKEN = `vercel_blob_rw_${STORE_ID}_secrettoken`;
const SESSION = "12345678-1234-4123-8123-123456789abc";
const OTHER = "12345678-1234-4123-8123-123456789abd";
const GOOD_PATH = `arena/${SESSION}.webm-xyz789`;
const GOOD_URL = `https://${STORE_ID}.private.blob.vercel-storage.com/${GOOD_PATH}`;

console.log("\nArena blob URL tests\n" + "=".repeat(60));

test("getBlobStoreId reads store id from token", () => {
  assert.equal(getBlobStoreId(TOKEN), STORE_ID);
});

test("getBlobStoreId treats a missing or malformed token as a server error", () => {
  for (const token of [undefined, "vercel_blob_rw"]) {
    assert.throws(() => getBlobStoreId(token), (e: unknown) =>
      e instanceof Error && !(e instanceof InvalidArenaBlobUrlError));
  }
});

test("accepts this store's private arena URL", () => {
  const parsed = parseArenaBlobUrl(GOOD_URL, SESSION, { storeId: STORE_ID });
  assert.equal(parsed.pathname, GOOD_PATH);
  assert.equal(parsed.url, GOOD_URL);
});

test("rejects attacker-controlled host", () => {
  assert.throws(
    () =>
      parseArenaBlobUrl("https://evil.example/steal", SESSION, { storeId: STORE_ID }),
    InvalidArenaBlobUrlError
  );
});

test("rejects other Vercel blob stores", () => {
  assert.throws(
    () =>
      parseArenaBlobUrl(
        `https://otherstore.private.blob.vercel-storage.com/${GOOD_PATH}`,
        SESSION, { storeId: STORE_ID }
      ),
    InvalidArenaBlobUrlError
  );
});

test("rejects public blob host for this store", () => {
  assert.throws(
    () =>
      parseArenaBlobUrl(
        `https://${STORE_ID}.public.blob.vercel-storage.com/${GOOD_PATH}`,
        SESSION, { storeId: STORE_ID }
      ),
    InvalidArenaBlobUrlError
  );
});

test("rejects pathnames outside arena/", () => {
  assert.throws(
    () =>
      parseArenaBlobUrl(
        `https://${STORE_ID}.private.blob.vercel-storage.com/secrets/key.txt`,
        SESSION, { storeId: STORE_ID }
      ),
    InvalidArenaBlobUrlError
  );
});

test("rejects path traversal under arena/", () => {
  assert.throws(
    () =>
      parseArenaBlobUrl(
        `https://${STORE_ID}.private.blob.vercel-storage.com/arena/../secrets`,
        SESSION, { storeId: STORE_ID }
      ),
    InvalidArenaBlobUrlError
  );
});

test("rejects http and credentialed URLs", () => {
  assert.throws(
    () =>
      parseArenaBlobUrl(
        `http://${STORE_ID}.private.blob.vercel-storage.com/${GOOD_PATH}`,
        SESSION, { storeId: STORE_ID }
      ),
    InvalidArenaBlobUrlError
  );
  assert.throws(
    () =>
      parseArenaBlobUrl(
        `https://user:pass@${STORE_ID}.private.blob.vercel-storage.com/${GOOD_PATH}`,
        SESSION, { storeId: STORE_ID }
      ),
    InvalidArenaBlobUrlError
  );
});

test("accepts Vercel suffix before the extension", () => {
  const pathname = `arena/${SESSION}-xyz789.webm`;
  assert.equal(parseArenaBlobUrl(`https://${STORE_ID}.private.blob.vercel-storage.com/${pathname}`, SESSION, { storeId: STORE_ID }).pathname, pathname);
});

test("rejects another session and invalid session IDs", () => {
  for (const id of [OTHER, "", "session-1", SESSION.toUpperCase(), null, 123, {}]) {
    assert.throws(() => parseArenaBlobUrl(GOOD_URL, id, { storeId: STORE_ID }), InvalidArenaBlobUrlError);
  }
});

test("rejects unsafe paths and malformed encoding", () => {
  for (const path of [
    `arena/${SESSION}extra.webm`, `arena/${SESSION}/audio.webm`,
    `arena/${SESSION}.`, `arena/${SESSION}.a..webm`,
    `arena/${SESSION}.%ZZ`, `arena/${SESSION}.%2fsecret`,
    `arena/${SESSION}.%5csecret`, `arena/${SESSION}.%252e%252e`,
    `arena/${SESSION}.%00webm`, `arena/${SESSION}.%3fwebm`,
    `/arena/${SESSION}.webm`, `arena/${SESSION}.%23webm`,
    `arena/extra/../${SESSION}.webm`, `arena/extra/%2e%2e/${SESSION}.webm`,
  ]) {
    assert.throws(() => parseArenaBlobUrl(`https://${STORE_ID}.private.blob.vercel-storage.com/${path}`, SESSION, { storeId: STORE_ID }), InvalidArenaBlobUrlError, path);
  }
});

test("rejects non-string blob URLs", () => {
  for (const value of [123, {}, [], null]) {
    assert.throws(() => parseArenaBlobUrl(value, SESSION, { storeId: STORE_ID }), InvalidArenaBlobUrlError);
  }
});

test("accepts all supported upload extensions", () => {
  for (const ext of ["webm", "mp4", "wav", "mp3", "ogg", "flac", "audio"]) {
    validateArenaUpload(`arena/${SESSION}.${ext}`, JSON.stringify({ sessionId: SESSION }));
  }
});

test("rejects missing, malformed or mismatched upload payloads", () => {
  for (const payload of [null, "", "{", "null", "123", "{}", JSON.stringify({ sessionId: OTHER }), JSON.stringify({ sessionId: [] })]) {
    assert.throws(() => validateArenaUpload(`arena/${SESSION}.webm`, payload), InvalidArenaBlobUrlError);
  }
  for (const path of [`secrets/${SESSION}.webm`, `arena/${SESSION}.exe`, `arena/${SESSION}.webm/extra`, `arena/${SESSION}-suffix.webm`]) {
    assert.throws(() => validateArenaUpload(path, JSON.stringify({ sessionId: SESSION })), InvalidArenaBlobUrlError);
  }
});

console.log("=".repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
