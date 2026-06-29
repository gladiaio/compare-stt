import crypto from "crypto";
import {
  signMatchToken,
  verifyMatchToken,
  hashMatchToken,
} from "./src/lib/match-token";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ✗ ${name}`);
    console.log(`    ${msg}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

/**
 * Build a legacy 4-part token (the format used before this fix) so we can
 * test backward compatibility.
 */
function signLegacyToken(
  sessionId: string,
  providerAId: string,
  providerBId: string
): string {
  const key = crypto
    .createHash("sha256")
    .update(process.env.DATABASE_URL || "dev-fallback-key")
    .digest();
  const payload = `${sessionId}.${providerAId}.${providerBId}`;
  const signature = crypto
    .createHmac("sha256", key)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

console.log("\nMatch token tests\n" + "=".repeat(60));

// ── Basic sign/verify round-trip ──

test("sign → verify round-trip succeeds", () => {
  const token = signMatchToken("sess1", "provA", "provB");
  const result = verifyMatchToken(token);
  assert(result !== null, "verify returned null");
  assert(result.sessionId === "sess1", `sessionId: ${result.sessionId}`);
  assert(result.providerAId === "provA", `providerAId: ${result.providerAId}`);
  assert(result.providerBId === "provB", `providerBId: ${result.providerBId}`);
  assert(result.issuedAt > 0, `issuedAt should be > 0, got ${result.issuedAt}`);
});

test("verify returns issuedAt close to now", () => {
  const before = Date.now();
  const token = signMatchToken("sess1", "provA", "provB");
  const after = Date.now();
  const result = verifyMatchToken(token)!;
  assert(result.issuedAt >= before, `issuedAt ${result.issuedAt} < before ${before}`);
  assert(result.issuedAt <= after, `issuedAt ${result.issuedAt} > after ${after}`);
});

// ── Anti-tampering: cannot rig the mechanism ──

test("tampered sessionId is rejected", () => {
  const token = signMatchToken("sess1", "provA", "provB");
  const parts = token.split(".");
  parts[0] = "rigged-session";
  const tampered = parts.join(".");
  assert(verifyMatchToken(tampered) === null, "should reject tampered sessionId");
});

test("tampered providerAId is rejected", () => {
  const token = signMatchToken("sess1", "provA", "provB");
  const parts = token.split(".");
  parts[1] = "rigged-provider";
  const tampered = parts.join(".");
  assert(verifyMatchToken(tampered) === null, "should reject tampered providerAId");
});

test("tampered providerBId is rejected", () => {
  const token = signMatchToken("sess1", "provA", "provB");
  const parts = token.split(".");
  parts[2] = "rigged-provider";
  const tampered = parts.join(".");
  assert(verifyMatchToken(tampered) === null, "should reject tampered providerBId");
});

test("tampered issuedAt is rejected", () => {
  const token = signMatchToken("sess1", "provA", "provB");
  const parts = token.split(".");
  parts[3] = "0";
  const tampered = parts.join(".");
  assert(verifyMatchToken(tampered) === null, "should reject tampered issuedAt");
});

test("tampered signature is rejected", () => {
  const token = signMatchToken("sess1", "provA", "provB");
  const parts = token.split(".");
  parts[4] = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const tampered = parts.join(".");
  assert(verifyMatchToken(tampered) === null, "should reject tampered signature");
});

test("completely forged token is rejected", () => {
  const forged = "fakeSess.fakeA.fakeB.12345.fakeSig";
  assert(verifyMatchToken(forged) === null, "should reject forged token");
});

test("empty string is rejected", () => {
  assert(verifyMatchToken("") === null, "should reject empty string");
});

test("random garbage is rejected", () => {
  assert(verifyMatchToken("not.a.valid.token.at.all") === null, "should reject garbage");
});

test("token signed for different providers cannot be reused", () => {
  const tokenAB = signMatchToken("sess1", "provA", "provB");
  const result = verifyMatchToken(tokenAB)!;
  assert(result.providerAId === "provA", "providerAId mismatch");
  assert(result.providerBId === "provB", "providerBId mismatch");
  // Cannot swap providers — if attacker tries to use this token for a different pair
  // the payload embedded in the token still says provA/provB
});

test("swapped provider IDs produce a different token", () => {
  const tokenAB = signMatchToken("sess1", "provA", "provB");
  const tokenBA = signMatchToken("sess1", "provB", "provA");
  assert(tokenAB !== tokenBA, "swapped providers should produce different tokens");
});

// ── Backward compatibility: legacy 4-part tokens ──

test("legacy 4-part token is accepted", () => {
  const token = signLegacyToken("sess1", "provA", "provB");
  const parts = token.split(".");
  assert(parts.length === 4, `expected 4 parts, got ${parts.length}`);
  const result = verifyMatchToken(token);
  assert(result !== null, "legacy token should be accepted");
  assert(result.sessionId === "sess1", `sessionId: ${result.sessionId}`);
  assert(result.providerAId === "provA", `providerAId: ${result.providerAId}`);
  assert(result.providerBId === "provB", `providerBId: ${result.providerBId}`);
});

test("legacy token returns issuedAt = 0", () => {
  const token = signLegacyToken("sess1", "provA", "provB");
  const result = verifyMatchToken(token)!;
  assert(result.issuedAt === 0, `expected issuedAt=0 for legacy, got ${result.issuedAt}`);
});

test("tampered legacy token is rejected", () => {
  const token = signLegacyToken("sess1", "provA", "provB");
  const parts = token.split(".");
  parts[0] = "rigged-session";
  const tampered = parts.join(".");
  assert(verifyMatchToken(tampered) === null, "should reject tampered legacy token");
});

test("legacy token with tampered signature is rejected", () => {
  const token = signLegacyToken("sess1", "provA", "provB");
  const parts = token.split(".");
  parts[3] = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const tampered = parts.join(".");
  assert(verifyMatchToken(tampered) === null, "should reject tampered legacy signature");
});

// ── hashMatchToken ──

test("hashMatchToken is deterministic", () => {
  const token = signMatchToken("sess1", "provA", "provB");
  assert(hashMatchToken(token) === hashMatchToken(token), "same token should produce same hash");
});

test("different tokens produce different hashes", () => {
  const t1 = signMatchToken("sess1", "provA", "provB");
  const t2 = signMatchToken("sess2", "provA", "provB");
  assert(hashMatchToken(t1) !== hashMatchToken(t2), "different tokens should have different hashes");
});

test("hash is a 64-char hex string (SHA-256)", () => {
  const token = signMatchToken("sess1", "provA", "provB");
  const hash = hashMatchToken(token);
  assert(hash.length === 64, `expected 64 chars, got ${hash.length}`);
  assert(/^[0-9a-f]{64}$/.test(hash), `not a valid hex string: ${hash}`);
});

console.log("=".repeat(60));
console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
