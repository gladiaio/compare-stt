/** Shared rate limiter tests: fake DB, no real Postgres or Sentry. */
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

const sentryErrors: unknown[] = [];
mockModule("@sentry/nextjs", { captureException: (err: unknown) => { sentryErrors.push(err); } });
mockModule("./src/lib/db", { prisma: {} });

const { checkRateLimit } =
  require("./src/lib/rate-limit") as typeof import("./src/lib/rate-limit");

/** In-memory stand-in for the `rate_limits` upsert. */
function fakeDb() {
  const rows = new Map<string, { windowStart: number; count: number }>();
  return {
    $queryRaw: async (_q: TemplateStringsArray, key: string, windowStart: Date) => {
      const row = rows.get(key);
      const count = row && row.windowStart === windowStart.getTime() ? row.count + 1 : 1;
      rows.set(key, { windowStart: windowStart.getTime(), count });
      return [{ count }];
    },
    $executeRaw: async () => 0,
  };
}

const WINDOW = 60_000;
const T0 = 1_800_000_000_000; // aligned to a minute boundary
const noCleanup = () => 1;

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${(e as Error).message}`);
    failed++;
  }
}

async function main() {
  console.log("\nRate limit tests\n" + "=".repeat(60));

  await test("blocks past the limit until the next window", async () => {
    const db = fakeDb();
    const check = (now: number) => checkRateLimit("k", 2, WINDOW, { db, now, random: noCleanup });
    assert.equal((await check(T0)).allowed, true);
    assert.equal((await check(T0 + 1)).allowed, true);
    assert.deepEqual(await check(T0 + 20_000), { allowed: false, retryAfterMs: 40_000 });
    assert.deepEqual(await check(T0 + WINDOW - 10), { allowed: false, retryAfterMs: 1000 });
    assert.equal((await check(T0 + WINDOW)).allowed, true);
  });

  await test("falls back to the in-memory limiter and reports when the DB fails", async () => {
    const db = {
      $queryRaw: async () => { throw new Error("db down"); },
      $executeRaw: async () => 0,
    };
    const key = `fallback:${Math.random()}`;
    assert.equal((await checkRateLimit(key, 1, WINDOW, { db })).allowed, true);
    assert.equal((await checkRateLimit(key, 1, WINDOW, { db })).allowed, false);
    assert.equal(sentryErrors.length, 2);
  });

  console.log("=".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

main();
