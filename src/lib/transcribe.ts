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

const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 1000;

const EXPECTED_ERROR_PATTERNS = [
  /invalid audio/i,
  /no speech found/i,
  /could not identify any language/i,
  /not currently supported by/i,
  /language_detection cannot be performed/i,
  /no spoken audio/i,
  /Job rejected/i,
];

function isExpectedProviderError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return EXPECTED_ERROR_PATTERNS.some((p) => p.test(message));
}

function isTransientError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  if (/\b(ECONNRESET|ETIMEDOUT|ENOTFOUND|EPIPE|EAI_AGAIN|socket hang up|network)/i.test(message)) {
    return true;
  }
  const statusMatch = message.match(/\bStatus\s+(\d{3})\b/i) ?? message.match(/\bHTTP\s+(\d{3})\b/i);
  if (statusMatch) {
    const code = parseInt(statusMatch[1], 10);
    return code === 429 || (code >= 500 && code <= 599);
  }
  const obj = err as Record<string, unknown> | null;
  if (obj && typeof obj === "object") {
    const status = (obj.statusCode ?? obj.status) as number | undefined;
    if (typeof status === "number" && (status === 429 || (status >= 500 && status <= 599))) {
      return true;
    }
  }
  return false;
}

export async function transcribeForProvider(
  providerSlug: string,
  audio: Buffer,
  mimeType: string
): Promise<TranscribeResult> {
  const fn = PROVIDER_MAP[providerSlug];

  if (!fn) {
    return { transcript: "", durationMs: 0, error: `No implementation for provider "${providerSlug}"` };
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn(audio, mimeType);
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES && isTransientError(err)) {
        const backoff = INITIAL_BACKOFF_MS * 2 ** attempt;
        console.warn(`[${providerSlug}] transient error (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${backoff}ms`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      break;
    }
  }

  const message = extractErrorMessage(lastErr);

  if (isExpectedProviderError(lastErr)) {
    console.warn(`[${providerSlug}] expected provider error:`, message);
  } else {
    console.error(`[${providerSlug}] transcription failed:`, lastErr);

    const sentryError = new Error(`[${providerSlug}] ${message}`);
    sentryError.stack = lastErr instanceof Error ? lastErr.stack : undefined;
    Sentry.captureException(sentryError, {
      tags: { provider: providerSlug },
      level: "error",
      fingerprint: [providerSlug, message],
      extra: { mimeType },
    });
  }

  return { transcript: "", durationMs: 0, error: sanitizeError(message, providerSlug) };
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
