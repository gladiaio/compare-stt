import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { transcribeForProvider } from "@/lib/transcribe";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const audioFile = formData.get("audio") as File | null;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    if (!audioFile) {
      return NextResponse.json({ error: "audio file is required" }, { status: 400 });
    }

    let session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      session = await prisma.session.create({ data: { id: sessionId } });
    }

    const providers = await prisma.provider.findMany();
    if (providers.length < 2) {
      return NextResponse.json({ error: "Not enough providers" }, { status: 500 });
    }

    const idxA = Math.floor(Math.random() * providers.length);
    let idxB = Math.floor(Math.random() * (providers.length - 1));
    if (idxB >= idxA) idxB++;
    const providerA = providers[idxA];
    const providerB = providers[idxB];

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const mimeType = audioFile.type || "audio/webm";

    const [resultA, resultB] = await Promise.all([
      transcribeForProvider(providerA.slug, audioBuffer, mimeType),
      transcribeForProvider(providerB.slug, audioBuffer, mimeType),
    ]);

    return NextResponse.json({
      providerA: {
        id: providerA.id,
        slug: providerA.slug,
        name: providerA.name,
        logoUrl: providerA.logoUrl,
      },
      providerB: {
        id: providerB.id,
        slug: providerB.slug,
        name: providerB.name,
        logoUrl: providerB.logoUrl,
      },
      transcriptA: resultA.transcript,
      transcriptB: resultB.transcript,
      errorA: resultA.error || null,
      errorB: resultB.error || null,
    });
  } catch (error) {
    console.error("Transcribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
