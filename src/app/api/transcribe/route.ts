import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { transcribeForProvider } from "@/lib/transcribe";
import { signMatchToken, hashMatchToken } from "@/lib/match-token";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 120;

const MAX_SESSION_VOTES = parseInt(process.env.MAX_SESSION_VOTES || "5", 10);
const RATE_LIMIT_TRANSCRIBE = 10; // per IP per window
const RATE_LIMIT_WINDOW_MS = 60_000;

interface ProviderRecord {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
}

async function pickMatchup(providers: ProviderRecord[]) {
  const pairs: [ProviderRecord, ProviderRecord][] = [];
  for (let i = 0; i < providers.length; i++) {
    for (let j = i + 1; j < providers.length; j++) {
      pairs.push([providers[i], providers[j]]);
    }
  }

  const pairCounts = await prisma.vote.groupBy({
    by: ["providerAId", "providerBId"],
    _count: true,
  });

  const countMap = new Map<string, number>();
  for (const row of pairCounts) {
    const key = [row.providerAId, row.providerBId].sort().join(":");
    countMap.set(key, (countMap.get(key) || 0) + row._count);
  }

  const minCount = Math.min(
    ...pairs.map((p) => countMap.get([p[0].id, p[1].id].sort().join(":")) || 0)
  );

  const leastPlayed = pairs.filter(
    (p) => (countMap.get([p[0].id, p[1].id].sort().join(":")) || 0) === minCount
  );

  const chosen = leastPlayed[Math.floor(Math.random() * leastPlayed.length)];
  const swap = Math.random() < 0.5;

  return {
    providerA: swap ? chosen[1] : chosen[0],
    providerB: swap ? chosen[0] : chosen[1],
  };
}

export async function POST(request: Request) {
  let blobUrl: string | undefined;

  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed, retryAfterMs } = checkRateLimit(
      `transcribe:${ip}`,
      RATE_LIMIT_TRANSCRIBE,
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
    const { sessionId, blobUrl: url, mimeType: clientMimeType } = body as {
      sessionId?: string;
      blobUrl?: string;
      mimeType?: string;
    };

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    if (!url) {
      return NextResponse.json({ error: "blobUrl is required" }, { status: 400 });
    }

    blobUrl = url;

    let session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      session = await prisma.session.create({ data: { id: sessionId } });
    }

    const sessionVoteCount = await prisma.vote.count({
      where: { sessionId },
    });
    if (sessionVoteCount >= MAX_SESSION_VOTES) {
      return NextResponse.json(
        {
          error: `Session vote limit reached (${MAX_SESSION_VOTES}). Please start a new session.`,
        },
        { status: 429 }
      );
    }

    const providers = await prisma.provider.findMany();
    if (providers.length < 2) {
      return NextResponse.json({ error: "Not enough providers" }, { status: 500 });
    }

    const { providerA, providerB } = await pickMatchup(providers);

    const audioRes = await fetch(blobUrl, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });
    if (!audioRes.ok) {
      return NextResponse.json({ error: "Failed to fetch audio from blob" }, { status: 500 });
    }

    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    const mimeType = clientMimeType || audioRes.headers.get("content-type") || "audio/webm";

    const [resultA, resultB] = await Promise.all([
      transcribeForProvider(providerA.slug, audioBuffer, mimeType),
      transcribeForProvider(providerB.slug, audioBuffer, mimeType),
    ]);

    const matchToken = signMatchToken(sessionId, providerA.id, providerB.id);

    await prisma.matchToken.create({
      data: {
        tokenHash: hashMatchToken(matchToken),
        sessionId,
        providerAId: providerA.id,
        providerBId: providerB.id,
      },
    });

    return NextResponse.json({
      matchToken,
      transcriptA: resultA.transcript,
      transcriptB: resultB.transcript,
      wordsA: resultA.words || [],
      wordsB: resultB.words || [],
      errorA: resultA.error || null,
      errorB: resultB.error || null,
    });
  } catch (error) {
    console.error("Transcribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    if (blobUrl) {
      del(blobUrl).catch((err) => console.error("Blob cleanup failed:", err));
    }
  }
}
