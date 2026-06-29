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

export function verifyMatchToken(token: string): MatchTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 5) return null;

  const [sessionId, providerAId, providerBId, issuedAtStr, signature] = parts;
  const payload = `${sessionId}.${providerAId}.${providerBId}.${issuedAtStr}`;
  const expected = crypto
    .createHmac("sha256", getSigningKey())
    .update(payload)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const issuedAt = parseInt(issuedAtStr, 10);
  if (isNaN(issuedAt)) return null;

  return { sessionId, providerAId, providerBId, issuedAt };
}

export function hashMatchToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
