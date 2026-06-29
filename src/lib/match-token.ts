import crypto from "crypto";

const getSigningKey = (() => {
  let key: Buffer | null = null;
  return () => {
    if (!key) {
      key = crypto
        .createHash("sha256")
        .update(process.env.DATABASE_URL || "dev-fallback-key")
        .digest();
    }
    return key;
  };
})();

export function signMatchToken(
  sessionId: string,
  providerAId: string,
  providerBId: string
): string {
  const issuedAt = Date.now();
  const payload = `${sessionId}.${providerAId}.${providerBId}.${issuedAt}`;
  const signature = crypto
    .createHmac("sha256", getSigningKey())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export interface MatchTokenPayload {
  sessionId: string;
  providerAId: string;
  providerBId: string;
  issuedAt: number;
}

/**
 * Accepts both the new 5-part format (with issuedAt) and the legacy 4-part
 * format (without issuedAt) so that in-flight sessions aren't broken across
 * a deploy boundary. Legacy tokens get issuedAt = 0 so the minimum-delay
 * check is skipped for them.
 */
export function verifyMatchToken(token: string): MatchTokenPayload | null {
  const parts = token.split(".");

  if (parts.length === 5) {
    const [sessionId, providerAId, providerBId, issuedAtStr, signature] = parts;
    const payload = `${sessionId}.${providerAId}.${providerBId}.${issuedAtStr}`;
    const expected = crypto
      .createHmac("sha256", getSigningKey())
      .update(payload)
      .digest("base64url");

    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return null;
    }

    const issuedAt = parseInt(issuedAtStr, 10);
    if (isNaN(issuedAt)) return null;

    return { sessionId, providerAId, providerBId, issuedAt };
  }

  if (parts.length === 4) {
    const [sessionId, providerAId, providerBId, signature] = parts;
    const payload = `${sessionId}.${providerAId}.${providerBId}`;
    const expected = crypto
      .createHmac("sha256", getSigningKey())
      .update(payload)
      .digest("base64url");

    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return null;
    }

    return { sessionId, providerAId, providerBId, issuedAt: 0 };
  }

  return null;
}

export function hashMatchToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
