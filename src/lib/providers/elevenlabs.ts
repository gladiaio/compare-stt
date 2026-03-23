import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { TranscribeResult, WordTimestamp } from "../transcribe";

interface ElevenLabsWord {
  text: string;
  start: number;
  end: number;
  type: string;
}

export async function transcribeWithElevenLabs(
  audio: Buffer,
  mimeType: string
): Promise<TranscribeResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");

  const start = Date.now();

  const client = new ElevenLabsClient({ apiKey });

  const ext = mimeType.includes("wav") ? "audio.wav"
    : mimeType.includes("mp3") || mimeType.includes("mpeg") ? "audio.mp3"
    : mimeType.includes("mp4") || mimeType.includes("m4a") ? "audio.m4a"
    : mimeType.includes("ogg") ? "audio.ogg"
    : "audio.webm";

  const blob = new Blob([new Uint8Array(audio)], { type: mimeType });
  const file = new File([blob], ext, { type: mimeType });

  const response = await client.speechToText.convert({
    file,
    modelId: "scribe_v2",
    timestampsGranularity: "word",
  });

  const durationMs = Date.now() - start;
  const body = response as unknown as { text?: string; words?: ElevenLabsWord[] };

  const words: WordTimestamp[] = (body.words || [])
    .filter((w) => w.type === "word")
    .map((w) => ({
      word: w.text,
      start: w.start,
      end: w.end,
    }));

  return {
    transcript: body.text ?? "",
    words,
    durationMs,
  };
}
