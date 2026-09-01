import assert from "node:assert/strict";
import { normalizeBasePathFetchUrl } from "./src/lib/base-path-fetch";

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

const base = "/compare-stt-apis";
const origin = "https://www.gladia.io";

test("strips trailing slash from bare basePath", () => {
  assert.equal(normalizeBasePathFetchUrl(`${base}/`, base, origin), base);
});

test("strips trailing slash before RSC query", () => {
  assert.equal(
    normalizeBasePathFetchUrl(`${base}/?_rsc=abc`, base, origin),
    `${base}?_rsc=abc`,
  );
});

test("leaves no-slash basePath alone", () => {
  assert.equal(normalizeBasePathFetchUrl(base, base, origin), base);
});

test("leaves nested paths alone", () => {
  assert.equal(
    normalizeBasePathFetchUrl(`${base}/leaderboard`, base, origin),
    `${base}/leaderboard`,
  );
});

test("leaves nested trailing slash alone (not the index)", () => {
  assert.equal(
    normalizeBasePathFetchUrl(`${base}/leaderboard/`, base, origin),
    `${base}/leaderboard/`,
  );
});

test("normalizes absolute index URL with RSC query", () => {
  assert.equal(
    normalizeBasePathFetchUrl(`${origin}${base}/?_rsc=xyz`, base, origin),
    `${base}?_rsc=xyz`,
  );
});

test("ignores other origins", () => {
  const other = `https://example.com${base}/?_rsc=1`;
  assert.equal(normalizeBasePathFetchUrl(other, base, origin), other);
});

console.log("=".repeat(60));
console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
