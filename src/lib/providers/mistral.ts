import { Mistral } from "@mistralai/mistralai";
import type { TranscribeResult } from "../transcribe";

export async function transcribeWithMistral(
  audio: Buffer,
  _mimeType: string
): Promise<TranscribeResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY not set");

  const start = Date.now();

  const client = new Mistral({ apiKey });

  const blob = new Blob([new Uint8Array(audio)], { type: "audio/wav" });
  const file = new File([blob], "audio.wav", { type: "audio/wav" });

  const response = await client.audio.transcriptions.complete({
    model: "voxtral-mini-latest",
    file,
  });

  const durationMs = Date.now() - start;

  return {
    transcript: response.text ?? "",
    durationMs,
  };
}
