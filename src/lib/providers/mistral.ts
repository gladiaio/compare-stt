import { Mistral } from "@mistralai/mistralai";
import type { TranscribeResult, WordTimestamp } from "../transcribe";

interface MistralSegment {
  text: string;
  start: number;
  end: number;
}

function fileNameForMime(mimeType: string): string {
  if (mimeType.includes("wav")) return "audio.wav";
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) return "audio.mp3";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "audio.m4a";
  return "audio.webm";
}

export async function transcribeWithMistral(
  audio: Buffer,
  mimeType: string
): Promise<TranscribeResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY not set");

  const start = Date.now();

  const client = new Mistral({ apiKey });

  const response = await client.audio.transcriptions.complete({
    model: "voxtral-mini-latest",
    file: {
      fileName: fileNameForMime(mimeType),
      content: new Uint8Array(audio),
    },
    timestampGranularities: ["word"],
  });

  const durationMs = Date.now() - start;

  const words: WordTimestamp[] = [];
  const segments = (response as unknown as { segments?: MistralSegment[] }).segments;
  if (segments) {
    for (const seg of segments) {
      words.push({ word: seg.text.trim(), start: seg.start, end: seg.end });
    }
  }

  return {
    transcript: response.text ?? "",
    words,
    durationMs,
  };
}
