import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyMatchToken, hashMatchToken } from "@/lib/match-token";
import { getProviderBySlug } from "@/lib/providers";
import { checkRateLimit } from "@/lib/rate-limit";

const MIN_VOTE_DELAY_MS = parseInt(process.env.MIN_VOTE_DELAY_MS || "15000", 10);
const MAX_SESSION_VOTES = parseInt(process.env.MAX_SESSION_VOTES || "5", 10);
const RATE_LIMIT_VOTE = 10; // per IP per window
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

    const elapsed = Date.now() - issuedAt;
    if (elapsed < MIN_VOTE_DELAY_MS) {
      return NextResponse.json(
        { error: "Vote submitted too quickly. Please take time to review both transcriptions." },
        { status: 429 }
      );
    }

    const tokenHash = hashMatchToken(matchToken);
    const storedToken = await prisma.matchToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      return NextResponse.json(
        { error: "Unknown match token. Please transcribe before voting." },
        { status: 403 }
      );
    }

    if (storedToken.consumedAt) {
      return NextResponse.json(
        { error: "This match token has already been used to vote." },
        { status: 409 }
      );
    }

    const sessionVoteCount = await prisma.vote.count({
      where: { sessionId },
    });
    if (sessionVoteCount >= MAX_SESSION_VOTES) {
      return NextResponse.json(
        {
          error: `Session vote limit reached (${MAX_SESSION_VOTES}). Please start a new session to continue voting.`,
        },
        { status: 429 }
      );
    }

    const winnerId =
      choice === "a" ? providerAId :
      choice === "b" ? providerBId :
      null;

    let session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      session = await prisma.session.create({ data: { id: sessionId } });
    }

    await prisma.$transaction([
      prisma.matchToken.update({
        where: { tokenHash },
        data: { consumedAt: new Date() },
      }),
      prisma.vote.create({
        data: {
          sessionId,
          providerAId,
          providerBId,
          winnerId,
        },
      }),
    ]);

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
