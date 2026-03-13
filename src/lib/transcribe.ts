import * as Sentry from "@sentry/nextjs";
import { transcribeWithGladia } from "./providers/gladia";
import { transcribeWithDeepgram } from "./providers/deepgram";
import { transcribeWithAssemblyAI } from "./providers/assemblyai";
import { transcribeWithElevenLabs } from "./providers/elevenlabs";
import { transcribeWithSpeechmatics } from "./providers/speechmatics";
import { transcribeWithMistral } from "./providers/mistral";

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface TranscribeResult {
  transcript: string;
  durationMs: number;
  words?: WordTimestamp[];
  error?: string;
}

export type TranscribeFn = (audio: Buffer, mimeType: string) => Promise<TranscribeResult>;

const PROVIDER_MAP: Record<string, TranscribeFn | undefined> = {
  gladia: transcribeWithGladia,
  deepgram: transcribeWithDeepgram,
  assemblyai: transcribeWithAssemblyAI,
  elevenlabs: transcribeWithElevenLabs,
  speechmatics: transcribeWithSpeechmatics,
  mistral: transcribeWithMistral,
};

export async function transcribeForProvider(
  providerSlug: string,
  audio: Buffer,
  mimeType: string
): Promise<TranscribeResult> {
  const fn = PROVIDER_MAP[providerSlug];

  if (!fn) {
    return { transcript: "", durationMs: 0, error: `No implementation for provider "${providerSlug}"` };
  }

  try {
    return await fn(audio, mimeType);
  } catch (err) {
    const message = extractErrorMessage(err);
    console.error(`[${providerSlug}] transcription failed:`, err);

    const sentryError = new Error(`[${providerSlug}] ${message}`);
    sentryError.stack = err instanceof Error ? err.stack : undefined;
    Sentry.captureException(sentryError, {
      tags: { provider: providerSlug },
      level: "error",
      fingerprint: [providerSlug, message],
      extra: { mimeType },
    });

    return { transcript: "", durationMs: 0, error: sanitizeError(message, providerSlug) };
  }
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.detail === "string") return obj.detail;
    if (obj.detail && typeof obj.detail === "object") {
      const detail = obj.detail as Record<string, unknown>;
      if (typeof detail.message === "string") return detail.message;
    }
    if (typeof obj.status === "number" && typeof obj.statusText === "string") {
      return `HTTP ${obj.status}: ${obj.statusText}`;
    }
    try {
      const json = JSON.stringify(err);
      if (json.length <= 200) return json;
      return json.slice(0, 200) + "…";
    } catch {
      /* circular reference */
    }
  }
  return "Unknown error";
}

function sanitizeError(message: string, slug: string): string {
  let cleaned = message;

  const providerNames: Record<string, string> = {
    gladia: "Gladia",
    deepgram: "Deepgram",
    assemblyai: "AssemblyAI",
    elevenlabs: "ElevenLabs",
    speechmatics: "Speechmatics",
    mistral: "Mistral",
  };

  const name = providerNames[slug] || slug;
  const envVar = `${slug.toUpperCase()}_API_KEY`;

  if (cleaned.includes("not set") || cleaned.includes("not configured")) {
    return "Provider API key is not configured";
  }

  cleaned = cleaned
    .replace(new RegExp(`\\[${slug}\\]\\s*`, "gi"), "")
    .replace(new RegExp(`${name}\\s*(error|upload|transcribe|transcription|poll)\\s*(failed)?:?\\s*`, "gi"), "")
    .replace(new RegExp(envVar, "g"), "API_KEY")
    .replace(new RegExp(name, "gi"), "Provider")
    .trim();

  return cleaned || "Transcription failed";
}
