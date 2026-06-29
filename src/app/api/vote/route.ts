import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyMatchToken, hashMatchToken } from "@/lib/match-token";
import { getProviderBySlug } from "@/lib/providers";
import { checkRateLimit } from "@/lib/rate-limit";
import { intEnv } from "@/lib/env";

const MIN_VOTE_DELAY_MS = intEnv("MIN_VOTE_DELAY_MS", 3_000);
const MAX_SESSION_VOTES = intEnv("MAX_SESSION_VOTES", 20);
const RATE_LIMIT_VOTE = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed, retryAfterMs } = checkRateLimit(
      `vote:${ip}`,
      RATE_LIMIT_VOTE,
      RATE_LIMIT_WINDOW_MS
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }

    const body = await request.json();
    const { matchToken, choice } = body;

    if (!matchToken || !choice) {
      return NextResponse.json(
        { error: "matchToken and choice are required" },
        { status: 400 }
      );
    }

    if (!["a", "b", "tie"].includes(choice)) {
      return NextResponse.json(
        { error: "choice must be 'a', 'b', or 'tie'" },
        { status: 400 }
      );
    }

    const match = verifyMatchToken(matchToken);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid or tampered match token" },
        { status: 403 }
      );
    }

    const { sessionId, providerAId, providerBId, issuedAt } = match;

    // issuedAt === 0 means a legacy 4-part token issued before this deploy;
    // skip the minimum-delay check for those.
    if (issuedAt > 0) {
      const elapsed = Date.now() - issuedAt;
      if (elapsed < MIN_VOTE_DELAY_MS) {
        return NextResponse.json(
          { error: "Vote submitted too quickly. Please take time to review both transcriptions." },
          { status: 429 }
        );
      }
    }

    const tokenHash = hashMatchToken(matchToken);
    const winnerId =
      choice === "a" ? providerAId :
      choice === "b" ? providerBId :
      null;

    // Use an interactive transaction for atomicity: the token claim
    // (updateMany where consumedAt IS NULL) and vote creation happen
    // in a single serializable step. This prevents both token replay
    // and session-cap races from concurrent requests.
    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.matchToken.updateMany({
        where: { tokenHash, consumedAt: null },
        data: { consumedAt: new Date() },
      });

      // Legacy tokens (pre-deploy) won't be in the table at all.
      // If the token exists but was already consumed, reject.
      if (claimed.count === 0) {
        const exists = await tx.matchToken.findUnique({ where: { tokenHash } });
        if (exists) {
          return { error: "This match token has already been used to vote.", status: 409 } as const;
        }
        // Not in the table → legacy token; proceed with just the session cap.
      }

      const sessionVoteCount = await tx.vote.count({ where: { sessionId } });
      if (sessionVoteCount >= MAX_SESSION_VOTES) {
        return {
          error: `Session vote limit reached (${MAX_SESSION_VOTES}). Please start a new session to continue voting.`,
          status: 429,
        } as const;
      }

      let session = await tx.session.findUnique({ where: { id: sessionId } });
      if (!session) {
        session = await tx.session.create({ data: { id: sessionId } });
      }

      await tx.vote.create({
        data: { sessionId, providerAId, providerBId, winnerId },
      });

      return { error: null } as const;
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const [providerA, providerB] = await Promise.all([
      prisma.provider.findUnique({ where: { id: providerAId } }),
      prisma.provider.findUnique({ where: { id: providerBId } }),
    ]);

    if (!providerA || !providerB) {
      return NextResponse.json({ error: "Provider not found" }, { status: 500 });
    }

    const defA = getProviderBySlug(providerA.slug);
    const defB = getProviderBySlug(providerB.slug);

    return NextResponse.json({
      providerA: {
        id: providerA.id,
        slug: providerA.slug,
        name: providerA.name,
        logoUrl: providerA.logoUrl,
        color: defA?.color,
      },
      providerB: {
        id: providerB.id,
        slug: providerB.slug,
        name: providerB.name,
        logoUrl: providerB.logoUrl,
        color: defB?.color,
      },
      winnerId,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
