/**
 * Unit tests for arena blob URL validation.
 */
import assert from "node:assert/strict";
import {
  InvalidArenaBlobUrlError,
  getBlobStoreId,
  parseArenaBlobUrl,
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
const GOOD_PATH = "arena/session-1.webm-xyz789";
const GOOD_URL = `https://${STORE_ID}.private.blob.vercel-storage.com/${GOOD_PATH}`;

console.log("\nArena blob URL tests\n" + "=".repeat(60));

test("getBlobStoreId reads store id from token", () => {
  assert.equal(getBlobStoreId(TOKEN), STORE_ID);
});

test("getBlobStoreId rejects missing token", () => {
  assert.throws(() => getBlobStoreId(undefined), InvalidArenaBlobUrlError);
});

test("accepts this store's private arena URL", () => {
  const parsed = parseArenaBlobUrl(GOOD_URL, { storeId: STORE_ID });
  assert.equal(parsed.pathname, GOOD_PATH);
  assert.equal(parsed.url, GOOD_URL);
});

test("rejects attacker-controlled host", () => {
  assert.throws(
    () =>
      parseArenaBlobUrl("https://evil.example/steal", { storeId: STORE_ID }),
    InvalidArenaBlobUrlError
  );
});

test("rejects other Vercel blob stores", () => {
  assert.throws(
    () =>
      parseArenaBlobUrl(
        `https://otherstore.private.blob.vercel-storage.com/${GOOD_PATH}`,
        { storeId: STORE_ID }
      ),
    InvalidArenaBlobUrlError
  );
});

test("rejects public blob host for this store", () => {
  assert.throws(
    () =>
      parseArenaBlobUrl(
        `https://${STORE_ID}.public.blob.vercel-storage.com/${GOOD_PATH}`,
        { storeId: STORE_ID }
      ),
    InvalidArenaBlobUrlError
  );
});

test("rejects pathnames outside arena/", () => {
  assert.throws(
    () =>
      parseArenaBlobUrl(
        `https://${STORE_ID}.private.blob.vercel-storage.com/secrets/key.txt`,
        { storeId: STORE_ID }
      ),
    InvalidArenaBlobUrlError
  );
});

test("rejects path traversal under arena/", () => {
  assert.throws(
    () =>
      parseArenaBlobUrl(
        `https://${STORE_ID}.private.blob.vercel-storage.com/arena/../secrets`,
        { storeId: STORE_ID }
      ),
    InvalidArenaBlobUrlError
  );
});

test("rejects http and credentialed URLs", () => {
  assert.throws(
    () =>
      parseArenaBlobUrl(
        `http://${STORE_ID}.private.blob.vercel-storage.com/${GOOD_PATH}`,
        { storeId: STORE_ID }
      ),
    InvalidArenaBlobUrlError
  );
  assert.throws(
    () =>
      parseArenaBlobUrl(
        `https://user:pass@${STORE_ID}.private.blob.vercel-storage.com/${GOOD_PATH}`,
        { storeId: STORE_ID }
      ),
    InvalidArenaBlobUrlError
  );
});

console.log("=".repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
