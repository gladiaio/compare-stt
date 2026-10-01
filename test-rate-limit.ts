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

const { checkRateLimit, getClientIp } =
  require("./src/lib/rate-limit") as typeof import("./src/lib/rate-limit");

/** In-memory stand-in for the `rate_limits` upsert and cleanup queries. */
function fakeDb() {
  const rows = new Map<string, { windowStart: number; count: number }>();
  const deletes: Date[] = [];
  return {
    rows,
    deletes,
    $queryRaw: async (_q: TemplateStringsArray, key: string, windowStart: Date) => {
      const row = rows.get(key);
      const count = row && row.windowStart === windowStart.getTime() ? row.count + 1 : 1;
      rows.set(key, { windowStart: windowStart.getTime(), count });
      return [{ count }];
    },
    $executeRaw: async (_q: TemplateStringsArray, cutoff: Date) => {
      deletes.push(cutoff);
      return 0;
    },
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

  await test("allows up to max requests in a window, then blocks", async () => {
    const db = fakeDb();
    for (let i = 0; i < 3; i++) {
      const r = await checkRateLimit("k", 3, WINDOW, { db, now: T0 + i, random: noCleanup });
      assert.deepEqual(r, { allowed: true, retryAfterMs: 0 });
    }
    const blocked = await checkRateLimit("k", 3, WINDOW, { db, now: T0 + 20_000, random: noCleanup });
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.retryAfterMs, 40_000);
  });

  await test("retryAfterMs is at least one second", async () => {
    const db = fakeDb();
    await checkRateLimit("k", 1, WINDOW, { db, now: T0, random: noCleanup });
    const blocked = await checkRateLimit("k", 1, WINDOW, { db, now: T0 + WINDOW - 10, random: noCleanup });
    assert.deepEqual(blocked, { allowed: false, retryAfterMs: 1000 });
  });

  await test("a new window resets the count", async () => {
    const db = fakeDb();
    await checkRateLimit("k", 1, WINDOW, { db, now: T0, random: noCleanup });
    assert.equal((await checkRateLimit("k", 1, WINDOW, { db, now: T0 + 1, random: noCleanup })).allowed, false);
    assert.equal((await checkRateLimit("k", 1, WINDOW, { db, now: T0 + WINDOW, random: noCleanup })).allowed, true);
    assert.equal(db.rows.get("k")?.count, 1);
  });

  await test("keys are counted independently", async () => {
    const db = fakeDb();
    await checkRateLimit("vote:1.1.1.1", 1, WINDOW, { db, now: T0, random: noCleanup });
    assert.equal((await checkRateLimit("vote:2.2.2.2", 1, WINDOW, { db, now: T0, random: noCleanup })).allowed, true);
  });

  await test("occasionally deletes rows older than a day", async () => {
    const db = fakeDb();
    await checkRateLimit("k", 5, WINDOW, { db, now: T0, random: () => 0 });
    assert.deepEqual(db.deletes, [new Date(T0 - 24 * 60 * 60 * 1000)]);
    await checkRateLimit("k", 5, WINDOW, { db, now: T0, random: noCleanup });
    assert.equal(db.deletes.length, 1);
  });

  await test("falls back to the in-memory limiter and reports when the DB fails", async () => {
    const before = sentryErrors.length;
    const db = {
      $queryRaw: async () => { throw new Error("db down"); },
      $executeRaw: async () => 0,
    };
    const key = `fallback:${Math.random()}`;
    assert.equal((await checkRateLimit(key, 1, WINDOW, { db })).allowed, true);
    const blocked = await checkRateLimit(key, 1, WINDOW, { db });
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterMs >= 1000);
    assert.equal(sentryErrors.length, before + 2);
  });

  await test("getClientIp prefers x-forwarded-for, then x-real-ip", () => {
    const req = (headers: Record<string, string>) => new Request("http://localhost", { headers });
    assert.equal(getClientIp(req({ "x-forwarded-for": " 1.2.3.4 , 10.0.0.1", "x-real-ip": "5.6.7.8" })), "1.2.3.4");
    assert.equal(getClientIp(req({ "x-real-ip": "5.6.7.8" })), "5.6.7.8");
    assert.equal(getClientIp(req({})), "unknown");
  });

  console.log("=".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

main();
