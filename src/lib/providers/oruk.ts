import type { TranscribeResult } from "../transcribe";

const DEFAULT_ORUK_BASE_URL = "https://speech-api.oruk.ai/v1";
const ORUK_MODEL = "oruk-fourier-2b";

interface OrukTranscriptionResponse {
  text?: string;
}

function fileNameForMime(mimeType: string): string {
  if (mimeType.includes("wav")) return "audio.wav";
  if (mimeType.includes("flac")) return "audio.flac";
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) return "audio.mp3";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "audio.m4a";
  if (mimeType.includes("ogg")) return "audio.ogg";
  return "audio.webm";
}

export async function transcribeWithOruk(
  audio: Buffer,
  mimeType: string
): Promise<TranscribeResult> {
  const apiKey = process.env.ORUK_API_KEY;
  if (!apiKey) throw new Error("ORUK_API_KEY not set");

  const baseUrl = (process.env.ORUK_API_BASE_URL || DEFAULT_ORUK_BASE_URL).replace(/\/+$/, "");
  const start = Date.now();

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audio)], {
    type: mimeType || "audio/webm",
  });
  formData.append("file", blob, fileNameForMime(mimeType));
  formData.append("model", ORUK_MODEL);
  formData.append("language", "en");
  formData.append("response_format", "json");

  const response = await fetch(`${baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    body: formData,
  });

  if (!response.ok) {
    const bodyText = (await response.text()).trim().slice(0, 300);
    throw new Error(`Oruk HTTP ${response.status}: ${bodyText || response.statusText}`);
  }

  const data = (await response.json()) as OrukTranscriptionResponse;
  const durationMs = Date.now() - start;

  return {
    transcript: (data.text ?? "").trim(),
    words: [],
    durationMs,
  };
}
