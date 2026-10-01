/**
 * Security checks for /api/transcribe blob handling.
 * Guards against credential leak via client blobUrl and unsafe del().
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

const routeSrc = readFileSync(
  join(process.cwd(), "src/app/api/transcribe/route.ts"),
  "utf8"
);
const uploadSrc = readFileSync(
  join(process.cwd(), "src/app/api/upload/route.ts"),
  "utf8"
);

console.log("\nBlob security tests\n" + "=".repeat(60));

test("does not fetch client blobUrl with BLOB_READ_WRITE_TOKEN", () => {
  const leak =
    /fetch\(\s*blobUrl[\s\S]{0,200}Authorization:\s*`Bearer \$\{process\.env\.BLOB_READ_WRITE_TOKEN\}`/;
  assert.equal(
    leak.test(routeSrc),
    false,
    "route still sends BLOB_READ_WRITE_TOKEN to client-supplied blobUrl"
  );
});

test("validates blobUrl before fetching audio", () => {
  assert.match(
    routeSrc,
    /parseArenaBlobUrl|isAllowedBlobUrl|assertSafeBlobUrl/,
    "route never validates the client-supplied blobUrl"
  );
});

test("only deletes blobs under arena/", () => {
  // del(blobUrl) with an unchecked client URL can target any object in the store
  assert.match(
    routeSrc,
    /del\([^)]*pathname|del\([^)]*arena/,
    "route still calls del() on the unchecked client blobUrl"
  );
});

test("upload token generation rejects non-arena pathnames", () => {
  assert.match(
    uploadSrc,
    /pathname\.startsWith\(\s*["']arena\//,
    "upload route does not constrain client upload pathnames to arena/"
  );
});

console.log("=".repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
