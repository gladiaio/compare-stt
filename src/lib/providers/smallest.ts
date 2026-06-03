import type { TranscribeResult, WordTimestamp } from "../transcribe";

const SMALLEST_BASE = "https://api.smallest.ai/waves/v1/stt";

interface SmallestWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

interface SmallestResponse {
  status: string;
  transcription?: string;
  words?: SmallestWord[];
}

export async function transcribeWithSmallest(
  audio: Buffer,
  _mimeType: string
): Promise<TranscribeResult> {
  const apiKey = process.env.SMALLEST_API_KEY;
  if (!apiKey) throw new Error("SMALLEST_API_KEY not set");

  const start = Date.now();

  const url = new URL(SMALLEST_BASE);
  url.searchParams.set("model", "pulse");
  url.searchParams.set("word_timestamps", "true");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/octet-stream",
    },
    body: audio,
  });

  if (!response.ok) {
    throw new Error(`Smallest AI request failed: ${response.status} ${await response.text()}`);
  }

  const data: SmallestResponse = await response.json();

  const words: WordTimestamp[] = (data.words || []).map((w) => ({
    word: w.word,
    start: w.start,
    end: w.end,
  }));

  const durationMs = Date.now() - start;

  return {
    transcript: data.transcription ?? "",
    words,
    durationMs,
  };
}
