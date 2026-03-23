import { BatchClient } from "@speechmatics/batch-client";
import type { TranscribeResult, WordTimestamp } from "../transcribe";

interface SmResult {
  type?: string;
  start_time?: number;
  end_time?: number;
  alternatives?: { content: string }[];
}

export async function transcribeWithSpeechmatics(
  audio: Buffer,
  mimeType: string
): Promise<TranscribeResult> {
  const apiKey = process.env.SPEECHMATICS_API_KEY;
  if (!apiKey) throw new Error("SPEECHMATICS_API_KEY not set");

  const start = Date.now();

  const client = new BatchClient({ apiKey, appId: "compare-stt" });

  const ext = mimeType.includes("wav") ? "audio.wav"
    : mimeType.includes("mp3") || mimeType.includes("mpeg") ? "audio.mp3"
    : mimeType.includes("mp4") || mimeType.includes("m4a") ? "audio.m4a"
    : mimeType.includes("ogg") ? "audio.ogg"
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
  const words: WordTimestamp[] = [];

  if (typeof response === "string") {
    transcript = response;
  } else if (response.results) {
    const results = response.results as SmResult[];

    const parts: string[] = [];
    for (const r of results) {
      const content = r.alternatives?.[0]?.content ?? "";
      if (!content) continue;
      if (r.type === "punctuation" || parts.length === 0) {
        parts.push(content);
      } else {
        parts.push(" " + content);
      }
    }
    transcript = parts.join("").trim();

    for (const r of results) {
      if (r.type === "word" && r.start_time != null && r.end_time != null) {
        words.push({
          word: r.alternatives?.[0]?.content ?? "",
          start: r.start_time,
          end: r.end_time,
        });
      }
    }
  }

  const durationMs = Date.now() - start;

  return { transcript, words, durationMs };
}
