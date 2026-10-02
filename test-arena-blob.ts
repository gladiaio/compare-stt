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
const HOST = `${STORE_ID}.private.blob.vercel-storage.com`;
const SESSION = "12345678-1234-4123-8123-123456789abc";
const OTHER = "12345678-1234-4123-8123-123456789abd";
const PATH = `arena/${SESSION}-xyz789.webm`;
const parse = (url: unknown, session: unknown = SESSION) =>
  parseArenaBlobUrl(url, session, { storeId: STORE_ID });
const payload = JSON.stringify({ sessionId: SESSION });

console.log("\nArena blob URL tests\n" + "=".repeat(60));

test("getBlobStoreId reads the store id and treats a bad token as a server error", () => {
  assert.equal(getBlobStoreId(`vercel_blob_rw_${STORE_ID}_secret`), STORE_ID);
  for (const token of [undefined, "vercel_blob_rw"]) {
    assert.throws(() => getBlobStoreId(token), (e: unknown) =>
      e instanceof Error && !(e instanceof InvalidArenaBlobUrlError));
  }
});

test("accepts this store's private arena URL for the session", () => {
  assert.deepEqual(parse(`https://${HOST}/${PATH}`), { pathname: PATH, url: `https://${HOST}/${PATH}` });
});

test("accepts the upload URL when the token's store id is mixed-case", () => {
  const url = `https://pg1rfmz0vh0n4t7j.private.blob.vercel-storage.com/${PATH}`;
  assert.equal(parseArenaBlobUrl(url, SESSION, { storeId: "PG1rFmz0Vh0n4t7J" }).pathname, PATH);
});

test("rejects foreign hosts, schemes, credentials and non-strings", () => {
  for (const url of [
    "https://evil.example/steal",
    `https://otherstore.private.blob.vercel-storage.com/${PATH}`,
    `https://${STORE_ID}.public.blob.vercel-storage.com/${PATH}`,
    `http://${HOST}/${PATH}`,
    `https://user:pass@${HOST}/${PATH}`,
    123, null,
  ]) {
    assert.throws(() => parse(url), InvalidArenaBlobUrlError, String(url));
  }
});

test("rejects other sessions and non-UUID session ids", () => {
  for (const id of [OTHER, "session-1", SESSION.toUpperCase(), null]) {
    assert.throws(() => parse(`https://${HOST}/${PATH}`, id), InvalidArenaBlobUrlError);
  }
});

test("rejects paths outside arena/<session>, traversal and bad encoding", () => {
  for (const path of [
    "secrets/key.txt", `arena/${SESSION}extra.webm`, `arena/${SESSION}/audio.webm`,
    `arena/${SESSION}.a..webm`, `arena/extra/../${SESSION}.webm`, `arena/extra/%2e%2e/${SESSION}.webm`,
    `arena/${SESSION}.%ZZ`, `arena/${SESSION}.%2fsecret`, `arena/${SESSION}.%5csecret`,
  ]) {
    assert.throws(() => parse(`https://${HOST}/${path}`), InvalidArenaBlobUrlError, path);
  }
});

test("validateArenaUpload accepts only arena/<session>.<allowed ext> with a matching payload", () => {
  validateArenaUpload(`arena/${SESSION}.webm`, payload);
  for (const bad of [null, "{", "{}", JSON.stringify({ sessionId: OTHER })]) {
    assert.throws(() => validateArenaUpload(`arena/${SESSION}.webm`, bad), InvalidArenaBlobUrlError);
  }
  for (const path of [`secrets/${SESSION}.webm`, `arena/${SESSION}.exe`, `arena/${SESSION}-suffix.webm`]) {
    assert.throws(() => validateArenaUpload(path, payload), InvalidArenaBlobUrlError, path);
  }
});

console.log("=".repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
