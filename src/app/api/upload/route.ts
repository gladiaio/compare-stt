import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateArenaUpload } from "@/lib/arena-blob";

const RATE_LIMIT_UPLOAD = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request): Promise<NextResponse> {
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = await checkRateLimit(
    `upload:${ip}`,
    RATE_LIMIT_UPLOAD,
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

  try {
    const body = (await request.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        validateArenaUpload(pathname, clientPayload);
        return {
          allowedContentTypes: [
            "audio/webm",
            "audio/wav",
            "audio/wave",
            "audio/x-wav",
            "audio/mpeg",
            "audio/mp3",
            "audio/mp4",
            "audio/m4a",
            "audio/x-m4a",
            "audio/aac",
            "audio/ogg",
            "audio/flac",
            "audio/x-flac",
            "audio/opus",
            "audio/wma",
            "audio/aiff",
            "audio/x-aiff",
            "audio/caf",
            "audio/x-caf",
            "video/mp4",
            "video/webm",
            "video/ogg",
            "application/octet-stream",
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 50 * 1024 * 1024,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
