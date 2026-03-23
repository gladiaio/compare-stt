import { AssemblyAI } from "assemblyai";
import type { TranscribeResult, WordTimestamp } from "../transcribe";

export async function transcribeWithAssemblyAI(
  audio: Buffer,
  _mimeType: string
): Promise<TranscribeResult> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) throw new Error("ASSEMBLYAI_API_KEY not set");

  const start = Date.now();

  const client = new AssemblyAI({ apiKey });

  const uploadUrl = await client.files.upload(audio);

  const transcript = await client.transcripts.transcribe({
    audio: uploadUrl,
    speech_models: ["universal-3-pro"] as never,
    language_detection: true,
  });

  if (transcript.status === "error") {
    throw new Error(`AssemblyAI error: ${transcript.error}`);
  }

  const words: WordTimestamp[] = (transcript.words || []).map((w) => ({
    word: w.text,
    start: w.start / 1000,
    end: w.end / 1000,
  }));

  const durationMs = Date.now() - start;

  return {
    transcript: transcript.text ?? "",
    words,
    durationMs,
  };
}
