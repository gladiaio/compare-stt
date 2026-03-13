import { BatchClient } from "@speechmatics/batch-client";
import type { TranscribeResult } from "../transcribe";

export async function transcribeWithSpeechmatics(
  audio: Buffer,
  mimeType: string
): Promise<TranscribeResult> {
  const apiKey = process.env.SPEECHMATICS_API_KEY;
  if (!apiKey) throw new Error("SPEECHMATICS_API_KEY not set");

  const start = Date.now();

  const client = new BatchClient({ apiKey, appId: "stt-arena" });

  const ext = mimeType.includes("wav") ? "audio.wav"
    : mimeType.includes("mp3") || mimeType.includes("mpeg") ? "audio.mp3"
    : mimeType.includes("mp4") || mimeType.includes("m4a") ? "audio.m4a"
    : "audio.webm";

  const blob = new Blob([new Uint8Array(audio)], { type: mimeType });
  const file = new File([blob], ext, { type: mimeType });

  const response = await client.transcribe(
    file,
    {
      transcription_config: {
        language: "auto",
        operating_point: "enhanced",
      },
    },
    "json-v2"
  );

  let transcript = "";
  if (typeof response === "string") {
    transcript = response;
  } else if (response.results) {
    transcript = response.results
      .map((r: { alternatives?: { content: string }[] }) =>
        r.alternatives?.[0]?.content ?? ""
      )
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const durationMs = Date.now() - start;

  return { transcript, durationMs };
}
