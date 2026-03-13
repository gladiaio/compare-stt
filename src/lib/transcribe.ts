import * as Sentry from "@sentry/nextjs";
import { transcribeWithGladia } from "./providers/gladia";
import { transcribeWithDeepgram } from "./providers/deepgram";
import { transcribeWithAssemblyAI } from "./providers/assemblyai";
import { transcribeWithElevenLabs } from "./providers/elevenlabs";
import { transcribeWithSpeechmatics } from "./providers/speechmatics";

export interface TranscribeResult {
  transcript: string;
  durationMs: number;
  error?: string;
}

export type TranscribeFn = (audio: Buffer, mimeType: string) => Promise<TranscribeResult>;

const PROVIDER_MAP: Record<string, TranscribeFn | undefined> = {
  gladia: transcribeWithGladia,
  deepgram: transcribeWithDeepgram,
  assemblyai: transcribeWithAssemblyAI,
  elevenlabs: transcribeWithElevenLabs,
  speechmatics: transcribeWithSpeechmatics,
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
    const originalMessage = err instanceof Error ? err.message : String(err);
    const message = `[${providerSlug}] ${originalMessage}`;
    console.error(message, err);

    const wrappedError = new Error(message);
    wrappedError.stack = err instanceof Error ? err.stack : undefined;
    Sentry.captureException(wrappedError, {
      tags: { provider: providerSlug },
      level: "error",
      fingerprint: [providerSlug, originalMessage],
      extra: { mimeType },
    });

    return { transcript: "", durationMs: 0, error: message };
  }
}
